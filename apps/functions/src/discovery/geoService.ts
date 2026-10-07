/**
 * Crowdbeats V2 — Geographic Discovery & Spatial Utilities
 *
 * Provides pure mathematical distance calculation and geohash range bounds.
 */

const EARTH_RADIUS_MILES = 3958.8;
const EARTH_RADIUS_KM = 6371.0;

/** Maximum discovery radius in miles (caps broad geospatial queries to prevent DoS) */
export const MAX_DISCOVERY_RADIUS_MILES = 100;

/**
 * Validates that latitude and longitude numbers fall within strict physical boundaries.
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Calculates great-circle distance between two coordinates in miles using the Haversine formula.
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (!validateCoordinates(lat1, lon1) || !validateCoordinates(lat2, lon2)) {
    return 9999.9;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  return Math.round(distance * 10) / 10; // 1 decimal place
}

/**
 * Calculates distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (!validateCoordinates(lat1, lon1) || !validateCoordinates(lat2, lon2)) {
    return 9999.9;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Computes bounding box coordinates given a center point and radius in miles.
 * Protected against poles (division by zero) and invalid coordinates.
 */
export function computeBoundingBox(
  lat: number,
  lng: number,
  radiusMiles: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  if (!validateCoordinates(lat, lng)) {
    throw new Error(
      `Invalid coordinates: lat=${lat}, lng=${lng}. Latitude must be [-90, 90], Longitude [-180, 180].`,
    );
  }

  const safeRadius = Math.max(
    0.1,
    Math.min(Number.isNaN(radiusMiles) || !Number.isFinite(radiusMiles) ? 25 : radiusMiles, MAX_DISCOVERY_RADIUS_MILES),
  );

  const latDelta = safeRadius / 69.0;
  // Guard against division by zero at poles
  const cosLat = Math.max(Math.cos(toRadians(lat)), 0.0001);
  const lngDelta = safeRadius / (69.0 * cosLat);

  return {
    minLat: Math.max(-90, lat - latDelta),
    maxLat: Math.min(90, lat + latDelta),
    minLng: Math.max(-180, lng - lngDelta),
    maxLng: Math.min(180, lng + lngDelta),
  };
}

