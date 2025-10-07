'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiCall } from '@/lib/api';
import { Modal } from './Modal';

interface VideoItem {
  id: string;
  status: string;
  created_at: number;
  prompt?: string;
  model?: string;
}

export function LibraryPanel() {
  const { showLibrary, setShowLibrary, apiKey } = useAppStore();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    if (showLibrary && apiKey) {
      loadVideos();
    }
  }, [showLibrary, apiKey]);

  const loadVideos = async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/api/videos/list', { method: 'GET' }, apiKey);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load videos');
      }

      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  const getVideoUrl = (videoId: string) => {
    return `/api/videos/download/${videoId}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
      case 'queued':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Modal
      isOpen={showLibrary}
      onClose={() => setShowLibrary(false)}
      title="Video Library"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadVideos}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-medium">No videos yet</p>
            <p className="text-sm mt-2">Videos you generate will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
            {videos.map((video) => (
              <div
                key={video.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                          video.status
                        )}`}
                      >
                        {video.status}
                      </span>
                      {video.model && (
                        <span className="text-xs text-gray-500">{video.model}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(video.created_at)}
                    </p>
                  </div>
                </div>

                {video.prompt && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {video.prompt}
                  </p>
                )}

                {video.status === 'completed' && (
                  <div className="flex gap-2">
                    <a
                      href={getVideoUrl(video.id)}
                      download
                      className="flex-1 px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVideo(video);
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {selectedVideo && selectedVideo.status === 'completed' && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedVideo(null)}
          title={`Video: ${selectedVideo.id}`}
        >
          <div className="space-y-4">
            {selectedVideo.prompt && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Prompt</h3>
                <p className="text-sm text-gray-600">{selectedVideo.prompt}</p>
              </div>
            )}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                controls
                className="w-full h-full"
                src={getVideoUrl(selectedVideo.id)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex gap-2">
              <a
                href={getVideoUrl(selectedVideo.id)}
                download
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-center"
              >
                Download
              </a>
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
