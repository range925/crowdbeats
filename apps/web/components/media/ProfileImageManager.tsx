'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { validateProfileImage } from '@/lib/media/imageValidation';
import { uploadProfileAvatarVariants } from '@/lib/firebase/storage';
import { ImageCropModal } from './ImageCropModal';
import { MobilePhotoSourceModal } from './MobilePhotoSourceModal';
import type { GeneratedVariants } from '@/lib/media/imageOptimizer';

interface ProfileImageManagerProps {
  currentPhotoUrl?: string | null;
  onPhotoUpdated?: (newUrl: string | null) => void;
  displayName?: string | null;
  personaType?: string | null;
  shape?: 'circle' | 'square';
  size?: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'CB';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileImageManager({
  currentPhotoUrl,
  onPhotoUpdated,
  displayName,
  personaType,
  shape = 'circle',
  size = 100,
}: ProfileImageManagerProps) {
  const auth = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSourceSheetOpen, setIsSourceSheetOpen] = useState(false);

  // Cached variants for retry
  const [cachedVariants, setCachedVariants] = useState<GeneratedVariants | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentPhotoUrl !== undefined) {
      setPhotoUrl(currentPhotoUrl);
    }
  }, [currentPhotoUrl]);

  // Handle file selected from device
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';
    setErrorMessage(null);
    setLoading(true);

    // Validate extension, magic bytes, dimensions, and size
    const validation = await validateProfileImage(file);
    setLoading(false);

    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    setPendingFile(file);
    setIsCropOpen(true);
  };

  // Upload variants to Firebase Storage + API
  const performUpload = async (variants: GeneratedVariants) => {
    if (!auth.uid) {
      setErrorMessage('User must be signed in to upload an avatar.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setCachedVariants(variants);

    try {
      const uploaded = await uploadProfileAvatarVariants(
        auth.uid,
        variants,
        (pct) => setUploadProgress(pct)
      );

      setPhotoUrl(uploaded.cardUrl);
      onPhotoUpdated?.(uploaded.cardUrl);
      setCachedVariants(null);
    } catch (err: any) {
      console.error('[ProfileImageManager] Upload error:', err);
      setErrorMessage(err?.message || 'Failed to upload image. Your previous avatar was preserved.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Retry upload if previous failed
  const handleRetry = () => {
    if (cachedVariants) {
      performUpload(cachedVariants);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove photo action
  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/user/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removePhoto: true }),
      });

      if (!res.ok) throw new Error('Failed to remove photo.');

      setPhotoUrl(null);
      onPhotoUpdated?.(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(displayName || auth.displayName);
  const isCircle = shape === 'circle';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        capture="user"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Avatar Display Container */}
        <div
          style={{
            position: 'relative',
            width: size,
            height: size,
            borderRadius: isCircle ? '50%' : 16,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            flexShrink: 0,
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.5)',
          }}
        >
          {loading ? (
            /* Skeleton Loading State with Spinner */
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#161822',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--cb-purple-main, #7C3AED)',
                  animation: 'cb-spin 0.8s linear infinite',
                }}
              />
              {uploadProgress > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cb-purple-light, #A855F7)' }}>
                  {uploadProgress}%
                </span>
              )}
            </div>
          ) : photoUrl ? (
            /* Real Avatar Image */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={displayName || 'Profile Avatar'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            /* Fallback Avatar with Initials */
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #7C3AED 0%, #1E1B4B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: Math.round(size * 0.36),
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              {initials}
            </div>
          )}

          {/* Quick Change Badge Button */}
          <button
            type="button"
            onClick={() => setIsSourceSheetOpen(true)}
            aria-label="Change profile photo"
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: 'var(--cb-purple-main, #7C3AED)',
              border: '2px solid #0B0C10',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {/* Action Controls & Guidance */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setIsSourceSheetOpen(true)}
              disabled={loading}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: 44,
                boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.4)',
              }}
            >
              {photoUrl ? 'Replace Photo' : 'Upload Photo'}
            </button>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={loading}
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#EF4444',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minHeight: 44,
                }}
              >
                Remove
              </button>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)', lineHeight: 1.4 }}>
            PNG, JPG, or JPEG up to 10 MB. EXIF metadata is stripped automatically. Generates optimized variants for feed cards and profile pages.
          </div>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {loading && uploadProgress > 0 && (
        <div style={{ marginTop: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Optimizing & Uploading Variants</span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{uploadProgress}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Actionable Error State with Retry Button */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 12, color: '#EF4444', flex: 1, lineHeight: 1.4 }}>
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={handleRetry}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              backgroundColor: '#EF4444',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              minHeight: 36,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Modals */}
      {pendingFile && (
        <ImageCropModal
          imageFile={pendingFile}
          isOpen={isCropOpen}
          onClose={() => {
            setIsCropOpen(false);
            setPendingFile(null);
          }}
          onCropComplete={(variants) => {
            performUpload(variants);
          }}
        />
      )}

      <MobilePhotoSourceModal
        isOpen={isSourceSheetOpen}
        onClose={() => setIsSourceSheetOpen(false)}
        onSelectCamera={() => cameraInputRef.current?.click()}
        onSelectLibrary={() => fileInputRef.current?.click()}
      />
    </div>
  );
}
