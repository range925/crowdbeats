/**
 * Unit tests for uploadProfileImage (Phase 5)
 */

import { inspectImageMagicBytes } from '../uploadProfileImage.js';

describe('Profile Image Content Inspection (Phase 5)', () => {
  it('correctly identifies valid JPEG magic bytes', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    expect(inspectImageMagicBytes(jpegBuffer)).toBe('image/jpeg');
  });

  it('correctly identifies valid PNG magic bytes', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(inspectImageMagicBytes(pngBuffer)).toBe('image/png');
  });

  it('rejects spoofed or malformed files', () => {
    const textBuffer = Buffer.from('<!DOCTYPE html><html><body>malicious payload</body></html>');
    expect(inspectImageMagicBytes(textBuffer)).toBeNull();

    const emptyBuffer = Buffer.alloc(4);
    expect(inspectImageMagicBytes(emptyBuffer)).toBeNull();
  });
});
