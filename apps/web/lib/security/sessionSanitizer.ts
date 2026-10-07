/**
 * Crowdbeats V2 — Session Sanitizer & Privacy Normalizer
 *
 * Rules:
 * 1. Convert user agents into normal, non-technical human device descriptions.
 * 2. Invariant: Never expose unnecessarily precise location information (no lat/long, no GPS, no street level).
 * 3. Enforce regional city/state/country coarseness.
 */

import type { DeviceType } from '@crowdbeats/contracts';

export interface ParsedDeviceInfo {
  device: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
}

export function parseUserAgent(uaString?: string | null): ParsedDeviceInfo {
  if (!uaString) {
    return {
      device: 'Current Web Browser',
      deviceType: 'desktop',
      browser: 'Web Browser',
      os: 'Operating System',
    };
  }

  const ua = uaString.toLowerCase();

  // 1. Determine OS
  let os = 'Unknown OS';
  if (ua.includes('iphone')) os = 'iOS (iPhone)';
  else if (ua.includes('ipad')) os = 'iPadOS';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('cros')) os = 'ChromeOS';

  // 2. Determine Device Type
  let deviceType: DeviceType = 'desktop';
  if (ua.includes('ipad') || ua.includes('tablet')) {
    deviceType = 'tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    deviceType = 'mobile';
  }

  // 3. Determine Browser
  let browser = 'Web Browser';
  if (ua.includes('crowdbeats')) browser = 'Crowdbeats App';
  else if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome') && !ua.includes('edg/')) browser = 'Google Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Apple Safari';
  else if (ua.includes('firefox')) browser = 'Mozilla Firefox';

  // 4. Determine Human-Friendly Device Label
  let device = 'Desktop Computer';
  if (deviceType === 'tablet') {
    if (os.includes('iPad')) device = 'Apple iPad';
    else device = 'Tablet Device';
  } else if (deviceType === 'mobile') {
    if (os.includes('iOS')) device = 'Apple iPhone';
    else if (os.includes('Android')) device = 'Android Phone';
    else device = 'Mobile Device';
  } else {
    if (os.includes('macOS')) device = 'Mac / MacBook';
    else if (os.includes('Windows')) device = 'Windows PC';
    else device = 'Desktop PC';
  }

  return {
    device,
    deviceType,
    browser,
    os,
  };
}

/**
 * Coarse-grains any location input so users never see intrusive GPS coordinates or street names.
 * Strips coordinates, zip codes, and street patterns.
 */
export function sanitizeApproximateLocation(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') {
    return 'Approximate Region (United States)';
  }

  let cleaned = raw.trim();

  // Strip latitude/longitude pairs like "30.2672, -97.7431" with optional surrounding parentheses
  cleaned = cleaned.replace(/\(?[-+]?\d{1,3}\.\d+,\s*[-+]?\d{1,3}\.\d+\)?/g, '');

  // Strip empty parentheses or brackets
  cleaned = cleaned.replace(/\(\s*\)|\[\s*\]/g, '');

  // Strip postal codes (e.g. 78701, SW1A 1AA)
  cleaned = cleaned.replace(/\b\d{5}(-\d{4})?\b/g, '');

  // Strip street prefixes/suffixes
  cleaned = cleaned.replace(/\b\d+\s+[A-Za-z0-9\s]+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Way|Ter|Terrace|Ct|Court|Pl|Place|Pkwy|Parkway|Loop)\b/gi, '');

  cleaned = cleaned.replace(/^[\s,.-]+|[\s,.-]+$/g, '').trim();

  if (!cleaned || cleaned.length < 3) {
    return 'Approximate Region (United States)';
  }

  return cleaned;
}
