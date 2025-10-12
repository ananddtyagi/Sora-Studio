import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiCall } from './api';
import { cropImageFromCenter } from './imageCrop';

export function useVideoGeneration() {
  const {
    apiKey,
    chatMessages,
    selectedModel,
    baseImage,
    videoConfig,
    updateVideoGeneration,
    resetVideoGeneration,
    saveVideo,
    addChatMessage,
    saveCurrentConversation,
    remixReference,
  } = useAppStore();

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

    // Generate a short title for the video using GPT-5
    let videoTitle = 'Untitled Video';
    try {
      const titleResponse = await apiCall(
        '/api/videos/title',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: prompts }),
        },
        apiKey
      );

      const titleData = await titleResponse.json();

      if (titleResponse.ok && titleData.title) {
        videoTitle = titleData.title;
      } else {
        const fallbackTokens = prompts.trim().split(/\s+/).slice(0, 6).join(' ');
        videoTitle = fallbackTokens || 'Untitled Video';
      }
    } catch (error) {
      console.warn('Failed to generate video title, using fallback.', error);
      const fallbackTokens = prompts.trim().split(/\s+/).slice(0, 6).join(' ');
      videoTitle = fallbackTokens || 'Untitled Video';
    }

    try {
      resetVideoGeneration();
      updateVideoGeneration({ status: 'queued', progress: 0 });

      // Add info message to indicate video generation has started
      addChatMessage({
        role: 'info',
        content: remixReference
          ? `Remixing "${remixReference.title}" into "${videoTitle}".`
          : `Creating "${videoTitle}".`,
        metadata: {
          type: 'generation',
          status: 'started',
          title: videoTitle,
          isRemix: Boolean(remixReference),
        },
      });

      // Crop base image if provided
      let croppedImageBase64: string | null = null;
      if (!remixReference && baseImage?.previewUrl) {
        try {
          croppedImageBase64 = await cropImageFromCenter(baseImage.previewUrl);
        } catch (error) {
          console.error('Failed to crop image:', error);
          alert('Failed to crop base image. Continuing without it.');
        }
      }

      // Create or remix video
      const requestBody: Record<string, any> = {
        prompt: prompts,
        model: selectedModel,
        size: videoConfig.size,
        seconds: videoConfig.seconds,
      };

      if (!remixReference) {
        requestBody.inputImageBase64 = croppedImageBase64;
      }

      const endpoint = remixReference
        ? `/api/videos/remix/${remixReference.videoId}`
        : '/api/videos/create';

      const createResponse = await apiCall(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
        apiKey
      );

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error || 'Failed to create video');
      }

      const videoId = createData.id;
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

          updateVideoGeneration({
            status: statusData.status,
            progress: statusData.progress,
          });

          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            // Video is ready, user can download it
            updateVideoGeneration({
              videoUrl: `/api/videos/download/${videoId}`,
            });
            // Add info message to chat first
            addChatMessage({
              role: 'info',
              content: remixReference
                ? `Remix "${videoTitle}" ready. Generated at ${new Date().toLocaleString()}.`
                : `Video "${videoTitle}" ready. Generated at ${new Date().toLocaleString()}.`,
              videoId: videoId,
              metadata: {
                type: 'generation',
                status: 'completed',
                title: videoTitle,
                isRemix: Boolean(remixReference),
              },
            });
            // Save conversation with the info message to ensure we have a conversationId
            saveCurrentConversation();
            // Save video to history (will be linked to current conversation)
            saveVideo(videoId, prompts, videoTitle, remixReference?.videoId || null);
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
  }, [
    apiKey,
    chatMessages,
    selectedModel,
    baseImage,
    videoConfig,
    updateVideoGeneration,
    resetVideoGeneration,
    saveVideo,
    addChatMessage,
    saveCurrentConversation,
    remixReference,
  ]);

  return { generateVideo };
}
