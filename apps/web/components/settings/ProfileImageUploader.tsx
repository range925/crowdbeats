'use client';

import React from 'react';
import { ProfileImageManager } from '@/components/media/ProfileImageManager';

interface ProfileImageUploaderProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  label?: string;
  shape?: 'circle' | 'rect';
}

/**
 * Backward-compatible ProfileImageUploader adapter delegating to ProfileImageManager.
 */
export function ProfileImageUploader({
  currentUrl,
  onUpload,
  shape = 'circle',
}: ProfileImageUploaderProps) {
  return (
    <ProfileImageManager
      currentPhotoUrl={currentUrl}
      onPhotoUpdated={(newUrl) => {
        if (newUrl) onUpload(newUrl);
      }}
      shape={shape === 'rect' ? 'square' : 'circle'}
      size={shape === 'rect' ? 120 : 88}
    />
  );
}
