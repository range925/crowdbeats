'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateProfileVariants, type GeneratedVariants, type CropArea } from '@/lib/media/imageOptimizer';

interface ImageCropModalProps {
  imageFile: File;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (variants: GeneratedVariants) => void;
}

export function ImageCropModal({
  imageFile,
  isOpen,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load image preview URL from file
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Touch and mouse drag handlers for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, Number((prev + delta).toFixed(2)))));
  };

  const handleApply = async () => {
    if (!imgRef.current) return;
    setProcessing(true);

    try {
      const img = imgRef.current;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Crop dimension calculation based on zoom and offset
      const viewSize = 280; // Size of the crop circle aperture
      const scale = (naturalWidth / viewSize) / zoom;

      // Calculate source crop area
      const cropWidth = Math.min(naturalWidth, Math.min(naturalWidth, naturalHeight) / zoom);
      const cropHeight = cropWidth;

      const centerX = naturalWidth / 2 - (offset.x * scale);
      const centerY = naturalHeight / 2 - (offset.y * scale);

      const sourceX = Math.max(0, Math.min(naturalWidth - cropWidth, centerX - cropWidth / 2));
      const sourceY = Math.max(0, Math.min(naturalHeight - cropHeight, centerY - cropHeight / 2));

      const cropArea: CropArea = {
        x: Math.round(sourceX),
        y: Math.round(sourceY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      };

      const variants = await generateProfileVariants(img, cropArea);
      onCropComplete(variants);
      onClose();
    } catch (err) {
      console.error('[ImageCropModal] Failed to generate variants:', err);
      alert('Failed to process cropped image. Please retry.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#12141C',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 id="crop-modal-title" style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            Crop & Position Photo
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cb-text-muted, #64748B)',
              fontSize: 18,
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Viewport Canvas Container */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'relative',
            width: '100%',
            height: 320,
            backgroundColor: '#050507',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {/* Natural Image transformed via zoom and offset */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop target"
            draggable={false}
            style={{
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.08s ease-out',
              pointerEvents: 'none',
              height: 280,
              objectFit: 'contain',
            }}
          />

          {/* Circular Crop Overlay Guide */}
          <div
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 0 0 9999px rgba(5, 5, 7, 0.72)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Controls: Zoom Slider */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cb-text-secondary, #94A3B8)' }}>Zoom</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{Math.round(zoom * 100)}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)' }}>-</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--cb-purple-main, #7C3AED)',
                cursor: 'pointer',
              }}
              aria-label="Adjust zoom"
            />
            <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)' }}>+</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)', textAlign: 'center', marginTop: 8 }}>
            Drag to pan • Pinch or scroll to zoom
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={processing}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: 'var(--cb-purple-main, #7C3AED)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: processing ? 'wait' : 'pointer',
              opacity: processing ? 0.7 : 1,
              minHeight: 44,
              boxShadow: '0 4px 16px -2px rgba(124, 58, 237, 0.45)',
            }}
          >
            {processing ? 'Processing Variants...' : 'Apply Crop & Preview'}
          </button>
        </div>
      </div>
    </div>
  );
}
