'use client';

import React, { useState } from 'react';

interface MobilePhotoSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectLibrary: () => void;
}

export function MobilePhotoSourceModal({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectLibrary,
}: MobilePhotoSourceModalProps) {
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-source-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#12141C',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderBottom: 'none',
          boxShadow: '0 -12px 36px rgba(0, 0, 0, 0.8)',
          padding: '24px 20px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Pull handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            margin: '0 auto 8px',
          }}
        />

        <h3 id="photo-source-title" style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px', textAlign: 'center' }}>
          Select Profile Photo
        </h3>
        <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', margin: '0 0 12px', textAlign: 'center' }}>
          Capture a new headshot or choose from your device photo library
        </p>

        {/* Source Action Buttons */}
        <button
          type="button"
          onClick={() => {
            onSelectCamera();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 20px',
            borderRadius: 14,
            border: 'none',
            backgroundColor: 'var(--cb-purple-main, #7C3AED)',
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 52,
            boxShadow: '0 4px 16px -2px rgba(124, 58, 237, 0.45)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Take a Photo with Camera
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectLibrary();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 20px',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 52,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Choose from Photo Library
        </button>

        {/* Permission Help Link */}
        <button
          type="button"
          onClick={() => setShowPermissionGuide(!showPermissionGuide)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--cb-text-muted, #64748B)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 0',
            textAlign: 'center',
          }}
        >
          {showPermissionGuide ? 'Hide Camera Guide' : 'Having camera permission issues?'}
        </button>

        {/* Step-by-step Permission Guide for iOS & Android */}
        {showPermissionGuide && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 12,
              color: 'var(--cb-text-secondary, #94A3B8)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
              How to enable camera access:
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>iOS (iPhone/iPad):</strong> Settings → Safari (or Chrome) → Camera → select <em>Allow</em>.
            </div>
            <div>
              <strong>Android:</strong> Settings → Apps → Chrome (or Browser) → Permissions → Camera → select <em>Allow only while using the app</em>.
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 4,
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--cb-text-muted, #64748B)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
