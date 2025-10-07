'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '../ui/Button';

export const VideoPlayer: React.FC = () => {
  const { videoGeneration, apiKey } = useAppStore();

  if (videoGeneration.status === 'idle') {
    return null;
  }

  const handleDownload = async () => {
    if (!videoGeneration.videoUrl || !apiKey) return;

    try {
      const response = await fetch(videoGeneration.videoUrl, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sora-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download video');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Video Generation</h3>
      </div>

      {videoGeneration.status === 'queued' && (
        <div className="text-sm text-gray-600">
          <div className="animate-pulse">Queued...</div>
        </div>
      )}

      {videoGeneration.status === 'in_progress' && (
        <div>
          <div className="text-sm text-gray-600 mb-2">Generating video...</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${videoGeneration.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{videoGeneration.progress}%</div>
        </div>
      )}

      {videoGeneration.status === 'completed' && videoGeneration.videoUrl && (
        <div className="space-y-3">
          <div className="text-sm text-green-600 font-medium">✓ Video ready!</div>
          <Button onClick={handleDownload} className="w-full">
            Download Video
          </Button>
        </div>
      )}

      {videoGeneration.status === 'failed' && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {videoGeneration.error || 'Video generation failed'}
        </div>
      )}
    </div>
  );
};
