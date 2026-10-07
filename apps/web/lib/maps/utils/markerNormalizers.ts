/**
 * Crowdbeats Map Engine — Marker Normalizers
 *
 * Convert domain objects (LiveCheckin, PublicArtistProfile, etc.)
 * into provider-neutral CrowdbeatsMapMarker types.
 */

import type { LiveCheckin } from '@/lib/firebase/firestore';
import type {
  CrowdbeatsLiveMarker,
  CrowdbeatsUserMarker,
  CrowdbeatsVenueMarker,
} from '../types';

/**
 * Converts a Firestore LiveCheckin document into a CrowdbeatsLiveMarker.
 * Used by the fan nearby map to normalize performer data.
 */
export function liveCheckinToMarker(checkin: LiveCheckin): CrowdbeatsLiveMarker {
  return {
    id: `live_${checkin.uid}`,
    type: 'live',
    position: { lat: checkin.latitude, lng: checkin.longitude },
    label: checkin.performerName,
    performerId: checkin.uid,
    performerType: checkin.type,
    performerName: checkin.performerName,
    photoUrl: checkin.photoUrl,
    venueName: checkin.venueName,
    genres: checkin.genres,
    distanceMiles: checkin.distanceMiles,
    checkedInAt: checkin.checkedInAt,
    data: { uid: checkin.uid },
  };
}

/**
 * Creates a CrowdbeatsUserMarker for the fan's current GPS location.
 */
export function createUserMarker(
  lat: number,
  lng: number,
  accuracyMeters?: number
): CrowdbeatsUserMarker {
  return {
    id: 'user_self',
    type: 'user',
    position: { lat, lng },
    label: 'Your location',
    accuracyMeters,
    zIndex: 999, // Always on top
  };
}

/**
 * Creates a CrowdbeatsVenueMarker from a venue profile or checkin venue fields.
 */
export function createVenueMarker(args: {
  venueId: string;
  venueName: string;
  lat: number;
  lng: number;
  address?: string;
  activeMusiciansCount?: number;
}): CrowdbeatsVenueMarker {
  return {
    id: `venue_${args.venueId}`,
    type: 'venue',
    position: { lat: args.lat, lng: args.lng },
    label: args.venueName,
    venueId: args.venueId,
    venueName: args.venueName,
    address: args.address,
    activeMusiciansCount: args.activeMusiciansCount,
  };
}

/**
 * Normalize raw coordinate values.
 * Returns null if coordinates are out of valid WGS84 range.
 */
export function normalizeCoordinate(
  lat: unknown,
  lng: unknown
): { lat: number; lng: number } | null {
  const la = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const ln = typeof lng === 'number' ? lng : parseFloat(String(lng));
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}