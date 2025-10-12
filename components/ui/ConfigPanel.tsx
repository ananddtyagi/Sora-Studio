'use client';

import { useAppStore } from '@/store/useAppStore';
import React, { useEffect } from 'react';

export const ConfigPanel: React.FC = () => {
  const { videoConfig, setVideoConfig, selectedModel, remixReference, clearRemixReference } = useAppStore();

  const allSizeOptions = [
    { value: '1280x720', label: '1280x720 (HD Landscape)', models: ['sora-2', 'sora-2-pro'] },
    { value: '720x1280', label: '720x1280 (HD Portrait)', models: ['sora-2', 'sora-2-pro'] },
    { value: '1792x1024', label: '1792x1024 (Wide Landscape)', models: ['sora-2-pro'] },
    { value: '1024x1792', label: '1024x1792 (Tall Portrait)', models: ['sora-2-pro'] },
  ];

  // Filter size options based on selected model
  const sizeOptions = allSizeOptions.filter(option => option.models.includes(selectedModel));

  // Auto-adjust size if current size is not valid for selected model
  useEffect(() => {
    const isCurrentSizeValid = sizeOptions.some(option => option.value === videoConfig.size);
    if (!isCurrentSizeValid) {
      setVideoConfig({ size: '1280x720' }); // Default to 1280x720 if invalid
    }
  }, [selectedModel, videoConfig.size, sizeOptions, setVideoConfig]);

  const durationOptions = [
    { value: '4', label: '4 seconds' },
    { value: '8', label: '8 seconds' },
    { value: '12', label: '12 seconds' }
  ];

  return (
    <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure the parameters for video generation
          </p>
          <div className="bg-gray-50 px-3 py-2 rounded-lg">
            <p className="text-xs text-gray-600">
              Current Model: <span className="font-semibold text-teal-600">{selectedModel === 'sora-2' ? 'Sora 2 Base' : 'Sora 2 Pro'}</span>
            </p>
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-3">
          {remixReference && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-3 flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-purple-700">Remixing:</p>
                <p className="text-xs text-gray-700 truncate">{remixReference.title}</p>
                <button
                  onClick={clearRemixReference}
                  className="mt-2 text-xs text-purple-600 hover:text-purple-800"
                >
                  Clear remix reference
                </button>
              </div>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution
          </label>
          <select
            value={videoConfig.size}
            onChange={(e) => setVideoConfig({ size: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
          >
            {sizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {selectedModel === 'sora-2' ? (
              <>Base model supports HD resolutions. Switch to Pro for wider formats.</>
            ) : (
              <>Pro model supports all resolution options</>
            )}
          </p>
        </div>

        {/* Duration Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <select
            value={videoConfig.seconds}
            onChange={(e) => setVideoConfig({ seconds: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select video length in seconds
          </p>
        </div>

        {/* Info Section */}
        <div className="border-t pt-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-teal-900 mb-1">Configuration Tips</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Higher resolutions take longer to generate</li>
                  <li>• Longer durations may cost more credits</li>
                  <li>• Portrait sizes are ideal for social media</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
