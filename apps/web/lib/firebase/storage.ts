/**
 * Crowdbeats V2 — Firebase Cloud Storage Client Service
 *
 * Handles:
 * - Singleton Firebase Storage instance with dev emulator routing.
 * - Uploading multi-variant profile avatars with live progress callbacks.
 * - Secure authenticated user paths: /profile-media/{uid}/avatar/
 * - Automatic fallback to /api/user/image if Storage client upload is blocked.
 */

import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';
import { firebaseApp } from './app';
import type { GeneratedVariants } from '../media/imageOptimizer';

let _storage: FirebaseStorage | null = null;
let _emulatorConnected = false;

export function getFirebaseStorage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(firebaseApp);

  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !_emulatorConnected
  ) {
    connectStorageEmulator(_storage, '127.0.0.1', 9199);
    _emulatorConnected = true;
  }

  return _storage;
}

export interface UploadedAvatarVariants {
  thumbnailUrl: string;
  cardUrl: string;
  fullUrl: string;
}

/**
 * Uploads all 3 generated variants to Firebase Storage under the authenticated user's path.
 * Reports continuous aggregate progress (0 - 100%).
 */
export async function uploadProfileAvatarVariants(
  userUid: string,
  variants: GeneratedVariants,
  onProgress?: (progressPercent: number) => void
): Promise<UploadedAvatarVariants> {
  const timestamp = Date.now();
  const sizes = [
    { key: 'thumbnail' as const, fileKey: 'thumb', variant: variants.thumbnail, weight: 0.2 },
    { key: 'card' as const, fileKey: 'card', variant: variants.card, weight: 0.3 },
    { key: 'full' as const, fileKey: 'full', variant: variants.full, weight: 0.5 },
  ];

  try {
    const storage = getFirebaseStorage();
    const urls: Partial<UploadedAvatarVariants> = {};
    const progressMap = { thumbnail: 0, card: 0, full: 0 };

    const updateAggregateProgress = () => {
      const total =
        progressMap.thumbnail * 0.2 +
        progressMap.card * 0.3 +
        progressMap.full * 0.5;
      if (onProgress) {
        onProgress(Math.min(99, Math.round(total)));
      }
    };

    const uploadPromises = sizes.map(async ({ key, fileKey, variant }) => {
      const ext = variant.format === 'image/webp' ? 'webp' : 'jpg';
      const storagePath = `profile-media/${userUid}/avatar/${fileKey}_${timestamp}.${ext}`;
      const storageRef = ref(storage, storagePath);

      const metadata = {
        contentType: variant.format,
        customMetadata: {
          uid: userUid,
          size: key,
          width: variant.width.toString(),
          height: variant.height.toString(),
          uploadedAt: new Date().toISOString(),
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, variant.blob, metadata);

      return new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              progressMap[key] = pct;
              updateAggregateProgress();
            }
          },
          (err) => reject(err),
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (key === 'thumbnail') urls.thumbnailUrl = downloadUrl;
              else if (key === 'card') urls.cardUrl = downloadUrl;
              else if (key === 'full') urls.fullUrl = downloadUrl;
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    });

    await Promise.all(uploadPromises);
    if (onProgress) onProgress(100);

    return urls as UploadedAvatarVariants;
  } catch (storageErr) {
    console.warn('[Storage] Direct Firebase Storage upload failed or bypassed, using API fallback:', storageErr);

    // Fallback: POST to Next.js /api/user/image
    if (onProgress) onProgress(50);
    const response = await fetch('/api/user/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thumbnailDataUrl: variants.thumbnail.dataUrl,
        cardDataUrl: variants.card.dataUrl,
        fullDataUrl: variants.full.dataUrl,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error || 'Failed to upload profile photo. Please retry.');
    }

    const data = await response.json();
    if (onProgress) onProgress(100);

    return {
      thumbnailUrl: data.thumbnailUrl || variants.thumbnail.dataUrl,
      cardUrl: data.cardUrl || variants.card.dataUrl,
      fullUrl: data.fullUrl || variants.full.dataUrl,
    };
  }
}
