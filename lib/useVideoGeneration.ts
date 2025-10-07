import { useCallback } from 'react';
import { useAppStore, SavedVideo } from '@/store/useAppStore';
import { apiCall } from './api';
import { cropImageFromCenter } from './imageCrop';

export function useVideoGeneration() {
  const { apiKey, chatMessages, selectedModel, baseImage, videoConfig, updateVideoGeneration, resetVideoGeneration, saveVideo, addChatMessage, saveCurrentConversation } = useAppStore();

  const generateVideo = useCallback(async () => {
    if (!apiKey) {
      alert('Please set your OpenAI API key in settings');
      return;
    }

    // Use the chat conversation for the video prompt
    const userMessages = chatMessages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');

    if (!userMessages.trim()) {
      alert('Please describe your video idea in the chat');
      return;
    }

    const prompts = userMessages;

    try {
      resetVideoGeneration();
      updateVideoGeneration({ status: 'queued', progress: 0 });

      // Crop base image if provided
      let croppedImageBase64: string | null = null;
      if (baseImage?.previewUrl) {
        try {
          croppedImageBase64 = await cropImageFromCenter(baseImage.previewUrl);
        } catch (error) {
          console.error('Failed to crop image:', error);
          alert('Failed to crop base image. Continuing without it.');
        }
      }

      // Create video
      const createResponse = await apiCall(
        '/api/videos/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompts,
            inputImageBase64: croppedImageBase64,
            model: selectedModel,
            size: videoConfig.size,
            seconds: videoConfig.seconds,
          }),
        },
        apiKey
      );

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error || 'Failed to create video');
      }

      const videoId = createData.id;
      const initialStatus = (createData.status || 'queued') as SavedVideo['status'];

      // Add info message with the video ID so the chat is linked immediately
      addChatMessage({
        role: 'info',
        content: 'Video generation started',
        videoId,
      });

      // Persist the conversation so the message survives refreshes
      saveCurrentConversation();

      // Persist the video link to this conversation right away
      saveVideo(videoId, prompts, initialStatus);

      updateVideoGeneration({
        id: videoId,
        status: createData.status,
        progress: createData.progress,
      });

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiCall(
            `/api/videos/status/${videoId}`,
            { method: 'GET' },
            apiKey
          );

          const statusData = await statusResponse.json();

          if (!statusResponse.ok) {
            throw new Error(statusData.error || 'Failed to get video status');
          }

          const currentStatus = statusData.status as SavedVideo['status'];
          updateVideoGeneration({
            status: statusData.status,
            progress: statusData.progress,
          });

          // Keep the saved video record in sync with the latest status
          saveVideo(videoId, prompts, currentStatus);

          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            // Video is ready, user can download it
            updateVideoGeneration({
              videoUrl: `/api/videos/download/${videoId}`,
            });
            // Add info message to chat first
            addChatMessage({
              role: 'info',
              content: new Date().toLocaleString(),
              videoId: videoId,
            });
            // Save conversation with the info message to ensure we have a conversationId
            saveCurrentConversation();
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            updateVideoGeneration({
              error: statusData.error || 'Video generation failed',
            });
          }
        } catch (error) {
          clearInterval(pollInterval);
          updateVideoGeneration({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }, 5000); // Poll every 5 seconds

    } catch (error) {
      updateVideoGeneration({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [apiKey, chatMessages, selectedModel, baseImage, videoConfig, updateVideoGeneration, resetVideoGeneration, saveVideo, addChatMessage, saveCurrentConversation]);

  return { generateVideo };
}
