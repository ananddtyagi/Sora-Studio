'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import { getImageDimensions } from '@/lib/imageCrop';
import {
  getSizeOptionByValue,
  getSizeOptionsForModel,
  SoraModel,
  VideoSizeOption,
} from '@/lib/videoOptions';

interface BaseImageResolutionModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  fileName?: string;
  selectedModel: SoraModel;
  currentSize: string;
  onCancel: () => void;
  onConfirm: (selectedSize: string, cropX: number, cropY: number) => void;
  onSelectModel: (model: SoraModel) => void;
  initialCropX?: number;
  initialCropY?: number;
}

const cropShadow = '0 0 0 9999px rgba(15, 23, 42, 0.45)';

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

function formatDimensions(value: string) {
  const [width, height] = value.split('x');
  if (!width || !height) return value;
  return `${width} × ${height}`;
}

export const BaseImageResolutionModal: React.FC<BaseImageResolutionModalProps> = ({
  isOpen,
  imageUrl,
  fileName,
  selectedModel,
  currentSize,
  onCancel,
  onConfirm,
  onSelectModel,
  initialCropX = 0.5,
  initialCropY = 0.5,
}) => {
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [cropOffset, setCropOffset] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
    scaleX: number;
    scaleY: number;
    maxOffsetX: number;
    maxOffsetY: number;
  } | null>(null);

  const sizeOptions = useMemo<VideoSizeOption[]>(
    () => getSizeOptionsForModel(selectedModel),
    [selectedModel]
  );

  useEffect(() => {
    if (!isOpen) {
      setImageDimensions(null);
      setDragState(null);
      return;
    }

    setCropOffset({
      x: Number.isFinite(initialCropX) ? clamp01(initialCropX) : 0.5,
      y: Number.isFinite(initialCropY) ? clamp01(initialCropY) : 0.5,
    });

    if (imageUrl) {
      getImageDimensions(imageUrl)
        .then(setImageDimensions)
        .catch(() => setImageDimensions(null));
    } else {
      setImageDimensions(null);
    }
  }, [imageUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!sizeOptions.length) {
      setSelectedSize('');
      return;
    }

    const isCurrentValid = sizeOptions.some((option) => option.value === currentSize);
    setSelectedSize(isCurrentValid ? currentSize : sizeOptions[0].value);
  }, [currentSize, isOpen, sizeOptions]);

  const cropMetrics = useMemo(() => {
    if (!imageDimensions || !selectedSize) {
      return null;
    }

    const [targetWidth, targetHeight] = selectedSize.split('x').map(Number);
    if (!targetWidth || !targetHeight) {
      return null;
    }

    const targetAspect = targetWidth / targetHeight;
    const imageAspect = imageDimensions.width / imageDimensions.height;

    let cropWidth = imageDimensions.width;
    let cropHeight = imageDimensions.height;

    if (imageAspect > targetAspect) {
      cropWidth = imageDimensions.height * targetAspect;
    } else {
      cropHeight = imageDimensions.width / targetAspect;
    }

    const maxOffsetX = Math.max(imageDimensions.width - cropWidth, 0);
    const maxOffsetY = Math.max(imageDimensions.height - cropHeight, 0);

    const safeOffsetX = maxOffsetX === 0 ? 0.5 : clamp01(cropOffset.x);
    const safeOffsetY = maxOffsetY === 0 ? 0.5 : clamp01(cropOffset.y);

    const sourceX = maxOffsetX * safeOffsetX;
    const sourceY = maxOffsetY * safeOffsetY;

    const widthPercent = (cropWidth / imageDimensions.width) * 100;
    const heightPercent = (cropHeight / imageDimensions.height) * 100;
    const leftPercent = (sourceX / imageDimensions.width) * 100;
    const topPercent = (sourceY / imageDimensions.height) * 100;

    return {
      cropWidth,
      cropHeight,
      maxOffsetX,
      maxOffsetY,
      widthPercent,
      heightPercent,
      leftPercent,
      topPercent,
      offsetX: safeOffsetX,
      offsetY: safeOffsetY,
      targetWidth,
      targetHeight,
    };
  }, [imageDimensions, selectedSize, cropOffset]);

  useEffect(() => {
    if (!isOpen || !cropMetrics) return;

    setCropOffset((prev) => {
      const nextX = cropMetrics.maxOffsetX === 0 ? 0.5 : clamp01(prev.x);
      const nextY = cropMetrics.maxOffsetY === 0 ? 0.5 : clamp01(prev.y);

      if (nextX === prev.x && nextY === prev.y) {
        return prev;
      }

      return { x: nextX, y: nextY };
    });
  }, [cropMetrics?.maxOffsetX, cropMetrics?.maxOffsetY, isOpen]);

  const selectedOption = selectedSize ? getSizeOptionByValue(selectedSize) : undefined;
  const confirmDisabled = !selectedSize || !imageUrl || !cropMetrics;

  const modelTip = selectedModel === 'sora-2'
    ? 'Base model supports HD resolutions. Switch to Pro for wider formats.'
    : 'Pro model supports every resolution option.';

  const overlayStyles = cropMetrics
    ? {
        left: `${cropMetrics.leftPercent}%`,
        top: `${cropMetrics.topPercent}%`,
        width: `${cropMetrics.widthPercent}%`,
        height: `${cropMetrics.heightPercent}%`,
      }
    : null;

  const displayCropX = cropMetrics?.offsetX ?? cropOffset.x;
  const displayCropY = cropMetrics?.offsetY ?? cropOffset.y;
  const positionPercent = {
    x: Math.round(displayCropX * 100),
    y: Math.round(displayCropY * 100),
  };

  const calculateOffsetsFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!cropMetrics || !imageDimensions || !imageRef.current) {
        return null;
      }

      const imgRect = imageRef.current.getBoundingClientRect();
      if (!imgRect.width || !imgRect.height) {
        return null;
      }

      const scaleX = imageDimensions.width / imgRect.width;
      const scaleY = imageDimensions.height / imgRect.height;

      const relativeX = clamp01((clientX - imgRect.left) / imgRect.width);
      const relativeY = clamp01((clientY - imgRect.top) / imgRect.height);

      const imageX = relativeX * imageDimensions.width;
      const imageY = relativeY * imageDimensions.height;

      const halfCropWidth = cropMetrics.cropWidth / 2;
      const halfCropHeight = cropMetrics.cropHeight / 2;

      const minCenterX = halfCropWidth;
      const maxCenterX = imageDimensions.width - halfCropWidth;
      const minCenterY = halfCropHeight;
      const maxCenterY = imageDimensions.height - halfCropHeight;

      const centerX = Math.min(Math.max(imageX, minCenterX), maxCenterX);
      const centerY = Math.min(Math.max(imageY, minCenterY), maxCenterY);

      const sourceX = Math.min(Math.max(centerX - halfCropWidth, 0), cropMetrics.maxOffsetX);
      const sourceY = Math.min(Math.max(centerY - halfCropHeight, 0), cropMetrics.maxOffsetY);

      const offsetX = cropMetrics.maxOffsetX === 0 ? 0.5 : clamp01(sourceX / cropMetrics.maxOffsetX);
      const offsetY = cropMetrics.maxOffsetY === 0 ? 0.5 : clamp01(sourceY / cropMetrics.maxOffsetY);

      return {
        offsetX,
        offsetY,
        scaleX,
        scaleY,
      };
    },
    [cropMetrics, imageDimensions]
  );

  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropMetrics || !imageDimensions || !imageRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const imgRect = imageRef.current.getBoundingClientRect();
    if (!imgRect.width || !imgRect.height) return;

    const scaleX = imageDimensions.width / imgRect.width;
    const scaleY = imageDimensions.height / imgRect.height;

    setDragState({
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: cropMetrics.offsetX,
      initialOffsetY: cropMetrics.offsetY,
      scaleX,
      scaleY,
      maxOffsetX: cropMetrics.maxOffsetX,
      maxOffsetY: cropMetrics.maxOffsetY,
    });

    const target = overlayRef.current || e.currentTarget;
    target.setPointerCapture(e.pointerId);
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;

    const deltaXImage = (e.clientX - dragState.startX) * dragState.scaleX;
    const deltaYImage = (e.clientY - dragState.startY) * dragState.scaleY;

    setCropOffset((prev) => {
      const nextX = dragState.maxOffsetX === 0
        ? 0.5
        : clamp01(dragState.initialOffsetX + deltaXImage / dragState.maxOffsetX);
      const nextY = dragState.maxOffsetY === 0
        ? 0.5
        : clamp01(dragState.initialOffsetY + deltaYImage / dragState.maxOffsetY);

      if (nextX === prev.x && nextY === prev.y) {
        return prev;
      }

      return { x: nextX, y: nextY };
    });
  };

  const stopDragging = useCallback(
    (pointerId?: number) => {
      if (dragState && (pointerId === undefined || dragState.pointerId === pointerId)) {
        if (overlayRef.current) {
          try {
            overlayRef.current.releasePointerCapture(dragState.pointerId);
          } catch (err) {
            // Ignore release errors when pointer capture already ended
          }
        }
        setDragState(null);
      }
    },
    [dragState]
  );

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    stopDragging(e.pointerId);
  };

  const handleOverlayPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    stopDragging(e.pointerId);
  };

  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropMetrics) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Avoid reposition when starting drag on overlay (handled separately)
    if (overlayRef.current && overlayRef.current.contains(e.target as Node)) {
      return;
    }

    const offsets = calculateOffsetsFromPointer(e.clientX, e.clientY);
    if (offsets) {
      setCropOffset({ x: offsets.offsetX, y: offsets.offsetY });
    }
  };

  const handleConfirm = () => {
    if (!selectedSize) return;
    const cropX = clamp01(displayCropX);
    const cropY = clamp01(displayCropY);
    onConfirm(selectedSize, cropX, cropY);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Prepare Base Image"
      contentClassName="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{fileName || 'Selected image'}</span>
              {imageDimensions && (
                <span className="font-mono">
                  {imageDimensions.width} × {imageDimensions.height}
                </span>
              )}
            </div>

            <div
              className="relative h-80 bg-slate-900/5 rounded-lg flex items-center justify-center overflow-hidden"
              onPointerDown={handleContainerPointerDown}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Base image preview"
                    className="max-h-full max-w-full object-contain"
                    ref={imageRef}
                  />

                  {overlayStyles && (
                    <div
                      ref={overlayRef}
                      className="absolute border-2 border-teal-400 rounded-md cursor-move"
                      style={{
                        ...overlayStyles,
                        boxShadow: cropShadow,
                      }}
                      onPointerDown={handleOverlayPointerDown}
                      onPointerMove={handleOverlayPointerMove}
                      onPointerUp={handleOverlayPointerUp}
                      onPointerCancel={handleOverlayPointerCancel}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-white bg-teal-600 rounded-full px-3 py-1 shadow">
                        {formatDimensions(selectedSize)}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-sm">Waiting for preview…</div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Drag the highlighted window to adjust what will be sent to the model for the selected resolution.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Choose output resolution</h4>
              <p className="text-xs text-gray-500 mt-1">{modelTip}</p>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-max">
              <span className="text-xs font-medium text-gray-600 pl-2">Model</span>
              <button
                type="button"
                onClick={() => onSelectModel('sora-2')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedModel === 'sora-2'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Base
              </button>
              <button
                type="button"
                onClick={() => onSelectModel('sora-2-pro')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedModel === 'sora-2-pro'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pro
              </button>
            </div>

            <div className="space-y-2">
              {sizeOptions.map((option) => {
                const isSelected = option.value === selectedSize;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-3 w-3 rounded-full border ${
                          isSelected ? 'border-teal-600 bg-teal-600' : 'border-gray-300'
                        }`}
                      />
                      <div className="text-sm font-medium">{option.label}</div>
                    </div>
                    <input
                      type="radio"
                      name="resolution"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setSelectedSize(option.value)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>

            {selectedOption && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium text-gray-800 mb-1">Crop preview</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Output image</span>
                  <span className="font-mono">{formatDimensions(selectedOption.value)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500">Position</span>
                  <span className="font-mono">{positionPercent.x}% · {positionPercent.y}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
              confirmDisabled
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            Use Image
          </button>
        </div>
      </div>
    </Modal>
  );
};
