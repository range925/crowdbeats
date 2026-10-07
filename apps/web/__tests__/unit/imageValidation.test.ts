import {
  validateFileExtension,
  validateMagicBytes,
  MAX_IMAGE_SIZE_BYTES,
} from '../../lib/media/imageValidation';

describe('Image Security & Validation Service', () => {
  describe('File Extension Checking', () => {
    it('accepts valid PNG extensions', () => {
      expect(validateFileExtension('avatar.png').valid).toBe(true);
      expect(validateFileExtension('PROFILE.PNG').valid).toBe(true);
    });

    it('accepts valid JPG and JPEG extensions', () => {
      expect(validateFileExtension('photo.jpg').valid).toBe(true);
      expect(validateFileExtension('photo.jpeg').valid).toBe(true);
      expect(validateFileExtension('STAGE_SET.JPEG').valid).toBe(true);
    });

    it('rejects unsupported extensions gracefully', () => {
      expect(validateFileExtension('malicious.exe').valid).toBe(false);
      expect(validateFileExtension('script.sh').valid).toBe(false);
      expect(validateFileExtension('vector.svg').valid).toBe(false);
      expect(validateFileExtension('animation.gif').valid).toBe(false);
      expect(validateFileExtension('document.pdf').valid).toBe(false);
    });
  });

  describe('Binary Magic Bytes Inspection', () => {
    it('identifies genuine PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const res = validateMagicBytes(pngBytes);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/png');
    });

    it('identifies genuine JPEG magic bytes (FF D8 FF)', () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const res = validateMagicBytes(jpegBytes);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/jpeg');
    });

    it('rejects executable PE/MZ header disguised as an image', () => {
      // 4D 5A is MZ header
      const exeDisguised = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const res = validateMagicBytes(exeDisguised);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Executable PE/MZ binary detected');
    });

    it('rejects Linux ELF header disguised as an image', () => {
      // 7F 45 4C 46 is ELF header
      const elfDisguised = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
      const res = validateMagicBytes(elfDisguised);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Linux ELF binary detected');
    });

    it('rejects shell scripts disguised as an image', () => {
      // 23 21 is #!
      const scriptDisguised = new Uint8Array([0x23, 0x21, 0x2f, 0x62, 0x69, 0x6e, 0x2f, 0x73]);
      const res = validateMagicBytes(scriptDisguised);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Shell script header detected');
    });

    it('rejects XML/SVG script markup disguised with png extension', () => {
      // 3C 73 is <s (<svg)
      const svgDisguised = new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0x20, 0x78, 0x6d, 0x6c]);
      const res = validateMagicBytes(svgDisguised);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Script or SVG markup detected');
    });

    it('rejects truncated/corrupt byte sequences', () => {
      const corrupt = new Uint8Array([0x00, 0x01]);
      const res = validateMagicBytes(corrupt);
      expect(res.valid).toBe(false);
    });
  });

  describe('Upload Size Limit Constants', () => {
    it('sets MAX_IMAGE_SIZE_BYTES to exactly 10 MB', () => {
      expect(MAX_IMAGE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    });
  });
});
