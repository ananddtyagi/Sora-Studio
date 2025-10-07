'use client';

import { useAppStore } from '@/store/useAppStore';
import { useEffect, useState } from 'react';

interface OpenAIVideo {
  id: string;
  object: string;
  created_at: number;
  status: string;
  model?: string;
  prompt?: string;
  error?: string;
}

export function VideoHistoryPanel() {
  const { showVideoHistory, setShowVideoHistory, apiKey, savedVideos, loadConversation, referenceVideoForRemix } = useAppStore();
  const [videos, setVideos] = useState<OpenAIVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showVideoHistory && apiKey) {
      fetchVideos();
    }
  }, [showVideoHistory, apiKey]);

  const fetchVideos = async () => {
    if (!apiKey) {
      setError('No API key found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/videos/list', {
        headers: { 'x-api-key': apiKey }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    // Download or view video
    fetch(`/api/videos/download/${videoId}`, {
      headers: { 'x-api-key': apiKey || '' }
    })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${videoId}.mp4`;
        a.click();
      })
      .catch(err => console.error('Failed to download video:', err));
  };

  const getSavedVideo = (videoId: string) => savedVideos.find(v => v.videoId === videoId);

  const handleLoadChat = (videoId: string) => {
    const savedVideo = getSavedVideo(videoId);
    if (savedVideo?.conversationId) {
      loadConversation(savedVideo.conversationId);
      setShowVideoHistory(false);
    }
  };

  // Helper to get conversationId for a video
  const getConversationId = (videoId: string) => {
    return getSavedVideo(videoId)?.conversationId;
  };

  const handleReference = (video: OpenAIVideo) => {
    const savedVideo = getSavedVideo(video.id);
    const title = savedVideo?.title || video.prompt || `Video ${video.id}`;
    referenceVideoForRemix(video.id, title);
    setShowVideoHistory(false);
  };

  if (!showVideoHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={() => setShowVideoHistory(false)}
      />

      {/* Panel */}
      <div className="relative bg-white shadow-xl h-full w-full max-w-md overflow-y-auto animate-slide-in-left"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Video History</h2>
            <button
              onClick={() => setShowVideoHistory(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Video List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-center">Loading videos...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-500">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-center font-medium">{error}</p>
                <button
                  onClick={fetchVideos}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-center font-medium">No videos yet</p>
                <p className="text-sm text-center mt-1">Create your first video to see it here</p>
              </div>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id}
                  className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                        {getSavedVideo(video.id)?.title || video.prompt || `Video ${video.id}`}
                      </p>
                      {(() => {
                        const remixedFromId = getSavedVideo(video.id)?.remixedFromVideoId;
                        const remixedFromTitle = remixedFromId
                          ? getSavedVideo(remixedFromId)?.title || `Video ${remixedFromId}`
                          : null;
                        return remixedFromTitle ? (
                          <p className="text-xs text-purple-600 mb-1">Remix of {remixedFromTitle}</p>
                        ) : null;
                      })()}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${video.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : video.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {video.status}
                        </span>
                        {video.model && (
                          <span className={`text-xs px-2 py-0.5 rounded ${video.model.includes('pro')
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-teal-100 text-teal-700'
                            }`}>
                            {video.model.includes('pro') ? 'Sora 2 Pro' : 'Sora 2'}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(video.created_at * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      {video.status === 'failed' && video.error && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                          {video.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                      {video.status === 'completed' && (
                        <div className="mt-3 flex gap-2">
                          {getConversationId(video.id) && (
                            <button
                              onClick={() => handleLoadChat(video.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Chat
                            </button>
                          )}
                          <button
                            onClick={() => handleReference(video)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Reference
                          </button>
                          <button
                            onClick={() => handleVideoClick(video.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                          >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
