/**
 * Crowdbeats V2 — Universal & Deep Link Routing Contracts (Phase 11)
 *
 * Supported URI Schemes:
 * - Custom Scheme: `crowdbeats://<path>` (Mobile native deep links)
 * - Universal Link: `https://crowdbeats.app/<path>` (iOS Universal Links / Android App Links)
 *
 * Supported Path Patterns:
 * - `/artist/:artistId` -> Solo artist profile / EPK
 * - `/band/:bandId` -> Band profile
 * - `/venue/:venueId` -> Venue profile & stage list
 * - `/stage/:stageId/qr` -> Live stage QR check-in & tip screen
 * - `/campaign/:campaignId` -> Crowdfunding campaign
 * - `/invite/band/:inviteId` -> Band member invitation
 * - `/invite/venue/:inviteId` -> Venue staff invitation
 * - `/invite/sponsor/:inviteId` -> Sponsor team invitation
 */

export interface ParsedDeepLink {
  readonly type:
    | 'tip'
    | 'artist'
    | 'band'
    | 'venue'
    | 'stage_qr'
    | 'campaign'
    | 'invite_band'
    | 'invite_venue'
    | 'invite_sponsor'
    | 'unknown';
  readonly id?: string;
  readonly queryParams?: Record<string, string>;
  readonly rawUri: string;
}

export const UNIVERSAL_LINK_HOST = 'crowdbeats.app';
export const CUSTOM_SCHEME = 'crowdbeats';

/**
 * Builds a universal web link (https://crowdbeats.app/...)
 */
export function buildUniversalLink(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${UNIVERSAL_LINK_HOST}${cleanPath}`;
}

/**
 * Builds a mobile custom scheme deep link (crowdbeats://...)
 */
export function buildCustomSchemeLink(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${CUSTOM_SCHEME}://${cleanPath}`;
}

/**
 * Parses any incoming URI (custom scheme or HTTPS universal link) into typed route targets.
 */
export function parseDeepLink(uri: string): ParsedDeepLink {
  try {
    let clean = uri.trim();
    let pathname = '';
    let queryParams: Record<string, string> = {};

    if (clean.startsWith(`${CUSTOM_SCHEME}://`)) {
      const remainder = clean.replace(`${CUSTOM_SCHEME}://`, '');
      const [path, query] = remainder.split('?');
      pathname = `/${path}`;
      if (query) {
        queryParams = Object.fromEntries(new URLSearchParams(query).entries());
      }
    } else if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const parsedUrl = new URL(clean);
      pathname = parsedUrl.pathname;
      queryParams = Object.fromEntries(parsedUrl.searchParams.entries());
    } else {
      pathname = clean.startsWith('/') ? clean : `/${clean}`;
    }

    const segments = pathname.split('/').filter(Boolean);

    // /tip/:id
    if (segments[0] === 'tip' && segments[1]) {
      return { type: 'tip', id: segments[1], queryParams, rawUri: uri };
    }
    // /artist/:id
    if (segments[0] === 'artist' && segments[1]) {
      return { type: 'artist', id: segments[1], queryParams, rawUri: uri };
    }
    // /band/:id
    if (segments[0] === 'band' && segments[1]) {
      return { type: 'band', id: segments[1], queryParams, rawUri: uri };
    }
    // /venue/:id
    if (segments[0] === 'venue' && segments[1]) {
      return { type: 'venue', id: segments[1], queryParams, rawUri: uri };
    }
    // /stage/:id/qr
    if (segments[0] === 'stage' && segments[1] && segments[2] === 'qr') {
      return { type: 'stage_qr', id: segments[1], queryParams, rawUri: uri };
    }
    // /campaign/:id
    if (segments[0] === 'campaign' && segments[1]) {
      return { type: 'campaign', id: segments[1], queryParams, rawUri: uri };
    }
    // /invite/band/:id
    if (segments[0] === 'invite' && segments[1] === 'band' && segments[2]) {
      return { type: 'invite_band', id: segments[2], queryParams, rawUri: uri };
    }
    // /invite/venue/:id
    if (segments[0] === 'invite' && segments[1] === 'venue' && segments[2]) {
      return { type: 'invite_venue', id: segments[2], queryParams, rawUri: uri };
    }
    // /invite/sponsor/:id
    if (segments[0] === 'invite' && segments[1] === 'sponsor' && segments[2]) {
      return { type: 'invite_sponsor', id: segments[2], queryParams, rawUri: uri };
    }

    return { type: 'unknown', queryParams, rawUri: uri };
  } catch {
    return { type: 'unknown', rawUri: uri };
  }
}
