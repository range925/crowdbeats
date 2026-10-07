import { stripHtml, escapeHtml, sanitizeUserBio, isSafeUrl } from '../../lib/security/sanitize';

describe('Web Input Sanitization & Anti-XSS Utilities', () => {
  describe('stripHtml', () => {
    it('strips basic HTML tags', () => {
      expect(stripHtml('<b>Bold text</b>')).toBe('Bold text');
      expect(stripHtml('<p>Paragraph <span>with span</span></p>')).toBe('Paragraph with span');
    });

    it('strips script tags and their contents', () => {
      expect(stripHtml('Hello <script>alert("xss")</script> World')).toBe('Hello  World');
      expect(stripHtml('<script src="malicious.js"></script>Artist Bio')).toBe('Artist Bio');
    });

    it('removes null bytes', () => {
      expect(stripHtml('clean\0text')).toBe('cleantext');
    });

    it('handles empty or non-string inputs', () => {
      expect(stripHtml('')).toBe('');
      expect(stripHtml(null as any)).toBe('');
      expect(stripHtml(undefined as any)).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('escapes dangerous HTML characters', () => {
      expect(escapeHtml('<script>alert("xss & fun")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss &amp; fun&quot;)&lt;/script&gt;',
      );
      expect(escapeHtml("it's cool")).toBe('it&#039;s cool');
    });
  });

  describe('sanitizeUserBio', () => {
    it('strips HTML tags and limits length', () => {
      const dirtyBio = '<h1>Lead Singer</h1> of the greatest band! <script>stealCookies()</script>';
      const clean = sanitizeUserBio(dirtyBio, 100);
      expect(clean).toBe('Lead Singer of the greatest band!');
      expect(clean).not.toContain('<script>');
    });

    it('truncates excessively long bios to specified maxLength', () => {
      const longText = 'A'.repeat(500);
      expect(sanitizeUserBio(longText, 160).length).toBe(160);
    });
  });

  describe('isSafeUrl', () => {
    it('allows valid http and https URLs', () => {
      expect(isSafeUrl('https://instagram.com/artist')).toBe(true);
      expect(isSafeUrl('http://myspace.com/music')).toBe(true);
    });

    it('rejects dangerous URI schemes (javascript:, data:, vbscript:)', () => {
      expect(isSafeUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('rejects malformed URLs', () => {
      expect(isSafeUrl('not a url')).toBe(false);
      expect(isSafeUrl('')).toBe(false);
    });
  });
});
