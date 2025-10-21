'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ImageUpload } from './ImageUpload';
import { getImageDimensions } from '@/lib/imageCrop';
import { getSizeOptionByValue } from '@/lib/videoOptions';
import { toast } from 'sonner';

export const BaseImagePanel: React.FC = () => {
  const {
    baseImage,
    setBaseImage,
    updateBaseImageCrop,
    chatMessages,
    selectedModel,
    videoConfig,
    setVideoConfig,
    setSelectedModel,
  } = useAppStore();
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Check if a video has been generated in this conversation
  const hasGeneratedVideo = chatMessages.some(msg => msg.role === 'info' && msg.videoId);

  const cropX = baseImage?.cropX ?? 0.5;
  const cropY = baseImage?.cropY ?? 0.5;

  const selectedSizeOption = useMemo(() => getSizeOptionByValue(videoConfig.size), [videoConfig.size]);

  const [targetWidth, targetHeight] = useMemo(() => {
    const [width, height] = videoConfig.size.split('x').map(Number);
    return [width || 1280, height || 720];
  }, [videoConfig.size]);

  useEffect(() => {
    if (baseImage?.previewUrl) {
      getImageDimensions(baseImage.previewUrl)
        .then(setImageDimensions)
        .catch(() => setImageDimensions(null));
    } else {
      setImageDimensions(null);
    }
  }, [baseImage]);

  const handleImageSelected = (
    file: File,
    previewUrl: string,
    selectedResolution: string,
    cropX: number,
    cropY: number
  ) => {
    if (hasGeneratedVideo && baseImage) {
      toast.error('Cannot change base image after generating a video. Please start a new chat to use a different image.');
      return;
    }
    if (videoConfig.size !== selectedResolution) {
      setVideoConfig({ size: selectedResolution });
    }
    setBaseImage({ file, previewUrl, cropX: Number.isFinite(cropX) ? cropX : 0.5, cropY: Number.isFinite(cropY) ? cropY : 0.5 });
  };

  const handleCropChange = (axis: 'x' | 'y', value: number) => {
    if (axis === 'x') {
      updateBaseImageCrop(value, cropY);
    } else {
      updateBaseImageCrop(cropX, value);
    }
  };

  const handleRemoveImage = () => {
    if (hasGeneratedVideo) {
      toast.error('Cannot remove base image after generating a video. Please start a new chat.');
      return;
    }
    setBaseImage(null);
  };

  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-64 bg-white rounded-lg border-2 border-gray-200 shadow-lg p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Base Image</h3>
        <p className="text-xs text-gray-500">
          Will be center-cropped to fit {selectedSizeOption?.label || `${targetWidth}x${targetHeight}`}
        </p>
      </div>

      <div className="space-y-3">
        <ImageUpload
          onImageSelected={handleImageSelected}
          onRemove={baseImage ? handleRemoveImage : undefined}
          previewUrl={baseImage?.previewUrl || null}
          disabled={hasGeneratedVideo && !!baseImage}
          selectedModel={selectedModel}
          currentResolution={videoConfig.size}
          onSelectModel={setSelectedModel}
        />

        {hasGeneratedVideo && baseImage && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            <p className="font-medium">🔒 Image locked</p>
            <p className="mt-1">Start a new chat to change the base image</p>
          </div>
        )}

        {baseImage && imageDimensions && (
          <>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <div className="flex justify-between">
                <span>Original:</span>
                <span className="font-mono">{imageDimensions.width} × {imageDimensions.height}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Target:</span>
                <span className="font-mono">{targetWidth} × {targetHeight}</span>
              </div>
            </div>

            {/* Crop Position Controls */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700">Adjust Crop Position</p>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 flex items-center justify-between">
                  <span>Horizontal</span>
                  <span className="text-gray-400">{Math.round(cropX * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={cropX}
                  onChange={(e) => handleCropChange('x', parseFloat(e.target.value))}
                  disabled={hasGeneratedVideo}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 flex items-center justify-between">
                  <span>Vertical</span>
                  <span className="text-gray-400">{Math.round(cropY * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={cropY}
                  onChange={(e) => handleCropChange('y', parseFloat(e.target.value))}
                  disabled={hasGeneratedVideo}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <p className="text-xs text-gray-500 italic mt-2">
                0% = Left/Top • 50% = Center • 100% = Right/Bottom
              </p>
            </div>
          </>
        )}

        {!baseImage && (
          <div className="text-xs text-gray-400 text-center py-4">
            No base image selected
          </div>
        )}
      </div>
    </div>
  );
};
