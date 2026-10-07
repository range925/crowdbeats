/**
 * Crowdbeats V2 — Image Validation & Security Service
 *
 * Security Requirements:
 * - Validate BOTH file extension and actual binary MIME type / magic bytes.
 * - Supported formats: PNG, JPG, JPEG.
 * - Reject executable files masquerading as images (PE/MZ, ELF, shell scripts, HTML, SVG scripts).
 * - Enforce maximum upload size: 10 MB.
 * - Validate maximum dimensions (<= 4096 x 4096 px).
 */

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_DIMENSION_PX = 4096;
export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'] as const;
export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg'] as const;

export type AllowedImageExtension = (typeof ALLOWED_EXTENSIONS)[number];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: AllowedMimeType;
  dimensions?: { width: number; height: number };
}

/**
 * Check if the filename has an allowed image extension.
 */
export function validateFileExtension(filename: string): { valid: boolean; extension?: string } {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const valid = ALLOWED_EXTENSIONS.includes(ext as AllowedImageExtension);
  return { valid, extension: ext };
}

/**
 * Inspect raw binary header bytes (Magic Numbers) to detect actual image type.
 *
 * Magic Byte signatures:
 * - PNG:  89 50 4E 47 0D 0A 1A 0A
 * - JPEG: FF D8 FF
 *
 * Dangerous headers rejected:
 * - PE/EXE: 4D 5A (MZ)
 * - ELF:    7F 45 4C 46
 * - Script: 23 21 (#!)
 * - HTML/SVG: 3C 21 or 3C 73 or 3C 68 (<svg, <!D, <html)
 */
export function validateMagicBytes(bytes: Uint8Array): { valid: boolean; detectedMime?: AllowedMimeType; error?: string } {
  if (bytes.length < 4) {
    return { valid: false, error: 'File is too small to be a valid image header.' };
  }

  // Check for dangerous executable signatures
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return { valid: false, error: 'Security violation: Executable PE/MZ binary detected.' };
  }
  if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
    return { valid: false, error: 'Security violation: Linux ELF binary detected.' };
  }
  if (bytes[0] === 0x23 && bytes[1] === 0x21) {
    return { valid: false, error: 'Security violation: Shell script header detected.' };
  }
  // Check for XML / HTML / SVG tags (< followed by ?, !, s, h)
  if (bytes[0] === 0x3c) {
    const second = bytes[1];
    if (second === 0x3f || second === 0x21 || second === 0x73 || second === 0x53 || second === 0x68 || second === 0x48) {
      return { valid: false, error: 'Security violation: Script or SVG markup detected. Only raster PNG and JPEG are permitted.' };
    }
  }

  // Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // Check JPEG / JPG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  return {
    valid: false,
    error: 'Unsupported or corrupted image header. Only genuine PNG and JPEG files are supported.',
  };
}

/**
 * Validate image dimensions by loading into an HTML Image element.
 */
export async function validateImageDimensions(
  fileOrBlob: Blob | File
): Promise<{ valid: boolean; dimensions?: { width: number; height: number }; error?: string }> {
  if (typeof window === 'undefined') {
    return { valid: true }; // Server-side fallback
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (width < 32 || height < 32) {
        resolve({
          valid: false,
          error: `Image dimensions are too small (${width}x${height}px). Minimum is 32x32px.`,
        });
        return;
      }

      if (width > MAX_IMAGE_DIMENSION_PX || height > MAX_IMAGE_DIMENSION_PX) {
        resolve({
          valid: false,
          error: `Image exceeds maximum allowed dimensions (${MAX_IMAGE_DIMENSION_PX}x${MAX_IMAGE_DIMENSION_PX}px). Current: ${width}x${height}px.`,
        });
        return;
      }

      resolve({ valid: true, dimensions: { width, height } });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: 'Failed to decode image data. The file may be corrupted.' });
    };

    img.src = objectUrl;
  });
}

/**
 * Complete security and format validation for a user-selected profile image file.
 */
export async function validateProfileImage(file: File): Promise<ValidationResult> {
  // 1. File size check (max 10 MB)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  // 2. File extension validation
  const extResult = validateFileExtension(file.name);
  if (!extResult.valid) {
    return {
      valid: false,
      error: `Unsupported file extension (${extResult.extension || 'none'}). Please select a PNG or JPG/JPEG image.`,
    };
  }

  // 3. Binary Magic Bytes inspection
  try {
    const headerBuffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);
    const magicResult = validateMagicBytes(bytes);

    if (!magicResult.valid || !magicResult.detectedMime) {
      return { valid: false, error: magicResult.error };
    }

    // 4. Decode and validate dimensions in browser
    const dimensionResult = await validateImageDimensions(file);
    if (!dimensionResult.valid) {
      return { valid: false, error: dimensionResult.error };
    }

    return {
      valid: true,
      mimeType: magicResult.detectedMime,
      dimensions: dimensionResult.dimensions,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || 'Failed to read image file data.',
    };
  }
}
