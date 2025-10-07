'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { apiKey } = useAppStore();
  const isAssistant = message.role === 'assistant';
  const isInfo = message.role === 'info';

  const handleDownload = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/download/${videoId}`, {
        headers: { 'x-api-key': apiKey || '' }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${videoId}.mp4`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download video');
    }
  };

  // Render info messages (video generation notifications)
  if (isInfo) {
    const isCompleted = !!message.videoId;
    const title = isCompleted ? 'Video Generated' : 'Generating Video';
    const iconColor = isCompleted ? 'text-teal-600' : 'text-blue-600';
    const bgColor = isCompleted ? 'bg-teal-100' : 'bg-blue-100';

    return (
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg shadow-sm">
          <div className={`flex-shrink-0 w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-600">{message.content}</p>
          </div>
          {message.videoId && (
            <button
              onClick={() => handleDownload(message.videoId!)}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isAssistant
            ? 'bg-gray-100 text-gray-800'
            : 'bg-teal-600 text-white'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};
