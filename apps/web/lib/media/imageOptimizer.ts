/**
 * Crowdbeats V2 — Professional Image Optimizer & Variant Generator
 *
 * Capabilities:
 * - Automatically strips EXIF metadata & GPS coordinates via HTML5 Canvas rasterization.
 * - Precision cropping, zoom scaling (1x - 3x), and repositioning.
 * - Generates 3 optimized display variants:
 *     - thumbnail: 128x128 px (for navbar, small avatars, lists)
 *     - card:      320x320 px (for profile cards, discover radar, stage cards)
 *     - full:      800x800 px (for full profile hero showcase)
 * - Outputs clean Blobs and Data URLs for immediate preview and network upload.
 */

export interface CropArea {
  x: number;      // Source X on natural image
  y: number;      // Source Y on natural image
  width: number;  // Source Width on natural image
  height: number; // Source Height on natural image
}

export interface ImageVariant {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  format: 'image/webp' | 'image/jpeg';
  sizeBytes: number;
}

export interface GeneratedVariants {
  thumbnail: ImageVariant;
  card: ImageVariant;
  full: ImageVariant;
}

/**
 * Checks if the browser supports canvas.toBlob with image/webp.
 */
function isWebPSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Helper to convert canvas to a Blob and a Data URL.
 */
async function canvasToVariant(
  canvas: HTMLCanvasElement,
  format: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<ImageVariant> {
  const dataUrl = canvas.toDataURL(format, quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob conversion returned null.'));
      },
      format,
      quality
    );
  });

  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    format,
    sizeBytes: blob.size,
  };
}

/**
 * Crops an HTMLImageElement using the provided cropArea, automatically stripping
 * all EXIF metadata, and generates the 3 optimized variants.
 *
 * @param img Loaded HTMLImageElement
 * @param crop Source rectangle on natural image
 */
export async function generateProfileVariants(
  img: HTMLImageElement,
  crop: CropArea
): Promise<GeneratedVariants> {
  const format: 'image/webp' | 'image/jpeg' = isWebPSupported() ? 'image/webp' : 'image/jpeg';

  const TARGET_SIZES = [
    { name: 'full' as const, size: 800, quality: 0.90 },
    { name: 'card' as const, size: 320, quality: 0.88 },
    { name: 'thumbnail' as const, size: 128, quality: 0.85 },
  ];

  const results: Partial<GeneratedVariants> = {};

  for (const target of TARGET_SIZES) {
    const canvas = document.createElement('canvas');
    canvas.width = target.size;
    canvas.height = target.size;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) {
      throw new Error('Failed to acquire 2D canvas context.');
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw source crop rectangle onto destination square
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      target.size,
      target.size
    );

    const variant = await canvasToVariant(canvas, format, target.quality);
    results[target.name] = variant;
  }

  return results as GeneratedVariants;
}

/**
 * Compute the default centered 1:1 crop square on an image.
 */
export function getDefaultCropArea(width: number, height: number): CropArea {
  const minDim = Math.min(width, height);
  const x = Math.floor((width - minDim) / 2);
  const y = Math.floor((height - minDim) / 2);
  return {
    x,
    y,
    width: minDim,
    height: minDim,
  };
}
