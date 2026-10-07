/**
 * Crowdbeats V2 — Input Sanitization & Anti-XSS Utilities (CS7.2)
 *
 * Strips executable scripts, HTML tags, dangerous URL schemes, and escapes
 * user-supplied inputs such as bios, names, and handles to prevent Stored XSS.
 */

const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data):/i;
const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

/**
 * Strips HTML tags and script elements from user-supplied strings.
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(SCRIPT_TAG_REGEX, '')
    .replace(HTML_TAG_REGEX, '')
    .replace(/\0/g, '') // remove null bytes
    .trim();
}

/**
 * Escapes HTML entities to render user strings safely in HTML contexts.
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes user profile bio, stage name, or handle text.
 * Strips tags, prevents javascript: links, and limits max length.
 */
export function sanitizeUserBio(bio: string, maxLength = 1000): string {
  if (!bio || typeof bio !== 'string') return '';
  const stripped = stripHtml(bio);
  return stripped.slice(0, maxLength);
}

/**
 * Validates whether an external link URL scheme is safe (http / https only).
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
