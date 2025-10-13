'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChatMessage } from './ChatMessage';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { ImageModal } from '../ui/ImageModal';
import { apiCall } from '@/lib/api';
import { getSizeOptionByValue } from '@/lib/videoOptions';

export const ChatPanel: React.FC = () => {
  const {
    apiKey,
    chatMessages,
    addChatMessage,
    setReadyToGenerate,
    saveCurrentConversation,
    baseImage,
    setBaseImage,
    remixReference,
    savedVideos,
    savedConversations,
    videoConfig,
    setVideoConfig,
    selectedModel,
    setSelectedModel,
  } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if a video generation has been started in this conversation
  const hasGeneratedVideo = chatMessages.some(msg => msg.role === 'info');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    addChatMessage({
      role: 'user',
      content: userMessage,
    });

    try {
      // Format messages for API - filter out info messages
      const apiMessages = chatMessages
        .filter(msg => msg.role !== 'info') // Don't send info messages to GPT
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
        .concat({
          role: 'user',
          content: userMessage,
          ...(baseImage && { imageUrl: baseImage.previewUrl }),
        });

      // Build remix context if we're remixing a video
      let remixContext = null;
      if (remixReference) {
        const { videoId, title } = remixReference;

        // Find the saved video to get its conversation ID
        const savedVideo = savedVideos.find(v => v.videoId === videoId);
        let previousChat = null;

        if (savedVideo?.conversationId) {
          // Find the conversation
          const conversation = savedConversations.find(c => c.id === savedVideo.conversationId);
          if (conversation) {
            // Format the previous chat messages (exclude info messages)
            previousChat = conversation.messages
              .filter(msg => msg.role !== 'info')
              .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
              .join('\n');
          }
        }

        remixContext = {
          videoTitle: title,
          previousChat,
        };
      }

      // Call GPT-5 API
      const response = await apiCall(
        '/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, remixContext }),
        },
        apiKey
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      addChatMessage({
        role: 'assistant',
        content: data.message,
      });

      // Check if user is ready to generate
      if (data.readyToGenerate) {
        setReadyToGenerate(true);
      }

      // Auto-save conversation after each message
      setTimeout(() => saveCurrentConversation(), 500);
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure your API key is valid and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelected = (
    file: File,
    previewUrl: string,
    selectedResolution: string,
    cropX: number,
    cropY: number
  ) => {
    if (hasGeneratedVideo && baseImage) {
      alert('Cannot change base image after generating a video. Please start a new chat to use a different image.');
      return;
    }
    if (videoConfig.size !== selectedResolution) {
      setVideoConfig({ size: selectedResolution });
    }
    setBaseImage({
      file,
      previewUrl,
      cropX: Number.isFinite(cropX) ? cropX : 0.5,
      cropY: Number.isFinite(cropY) ? cropY : 0.5,
    });
  };

  const handleRemoveImage = () => {
    if (hasGeneratedVideo) {
      alert('Cannot remove base image after generating a video. Please start a new chat.');
      return;
    }
    setBaseImage(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Base Image Section */}
        {baseImage ? (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowImageModal(true)}
                  className="relative group"
                >
                  <img
                    src={baseImage.previewUrl}
                    alt="Base image"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 group-hover:border-teal-500 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Base Image</p>
                <p className="text-xs text-gray-500">
                  Will be center-cropped to fit {getSizeOptionByValue(videoConfig.size)?.label || videoConfig.size}
                </p>
                {hasGeneratedVideo && (
                  <p className="text-xs text-amber-600 mt-1">🔒 Locked - Start new chat to change</p>
                )}
              </div>
              {!hasGeneratedVideo && (
                <button
                  onClick={handleRemoveImage}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <ImageUpload
              onImageSelected={handleImageSelected}
              previewUrl={null}
              disabled={false}
              selectedModel={selectedModel}
              currentResolution={videoConfig.size}
              onSelectModel={setSelectedModel}
            />
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </Button>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        imageUrl={baseImage?.previewUrl || null}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
};
