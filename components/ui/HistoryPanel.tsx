'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './Button';

export const HistoryPanel: React.FC = () => {
  const {
    showHistory,
    setShowHistory,
    savedConversations,
    savedVideos,
    loadConversation,
    deleteConversation,
    newConversation,
    apiKey,
  } = useAppStore();

  if (!showHistory) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={() => setShowHistory(false)}
      />

      {/* History Panel */}
      <div className="relative bg-white shadow-xl h-full w-full max-w-md overflow-y-auto animate-slide-in-left">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">History</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Conversation Button */}
          <Button
            variant="primary"
            onClick={() => {
              newConversation();
              setShowHistory(false);
            }}
            className="w-full mb-6"
          >
            + New Conversation
          </Button>

          {/* Conversations */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Conversations</h3>
              <div className="space-y-2">
                {savedConversations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No saved conversations</p>
                ) : (
                  savedConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="group p-3 border border-gray-200 rounded-lg hover:border-teal-400 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => loadConversation(conv.id)}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(conv.updatedAt)}
                          </p>
                        </button>
                        <button
                          onClick={() => deleteConversation(conv.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity ml-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Show videos for this conversation */}
                      {savedVideos.filter(v => v.conversationId === conv.id).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600 mb-1">Videos:</p>
                          {savedVideos
                            .filter(v => v.conversationId === conv.id)
                            .map(video => (
                              <div key={video.id} className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span className="truncate flex-1">{video.prompt.substring(0, 30)}...</span>
                                <a
                                  href={`/api/videos/download/${video.videoId}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // Download video
                                    fetch(`/api/videos/download/${video.videoId}`, {
                                      headers: { 'x-api-key': apiKey || '' }
                                    })
                                      .then(r => r.blob())
                                      .then(blob => {
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `video-${video.videoId}.mp4`;
                                        a.click();
                                      });
                                  }}
                                  className="text-teal-600 hover:text-teal-700 ml-2"
                                >
                                  Download
                                </a>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
