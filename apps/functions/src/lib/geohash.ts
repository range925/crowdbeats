/**
 * Crowdbeats V2 — Pure Geohash Implementation (Phase 2)
 *
 * Zero-dependency geohash encode/decode + Firestore query range generation.
 *
 * Design notes:
 *  - Base-32 alphabet: 0-9 b-z (excluding a, i, l, o) — standard Geohash spec.
 *  - encode(lat, lng, precision) returns a geohash string of length `precision`.
 *  - decode(geohash) returns the cell centroid {lat, lng} and cell error {latErr, lngErr}.
 *  - queryRange(geohash) returns [rangeMin, rangeMax] for Firestore prefix queries.
 *  - snapToGrid(lat, lng, cellMeters) snaps coordinates to a coarse grid.
 *  - geohash7Centroid(geohash7) derives a {lat, lng} centroid from a geohash-7 cell.
 *
 * False-positive filtering note (required after Firestore geohash range queries):
 *  Geohash cells are rectangles. A bounding-box prefix-range query will return
 *  documents in neighbouring cells that overlap the query rectangle's corners.
 *  Callers MUST apply a Haversine distance filter after fetching to discard
 *  false positives before serving results to clients.
 *
 * Precision reference:
 *  Precision 5 → ~4.9 km × 4.9 km (~24 km²)   — zone aggregation
 *  Precision 7 → ~153 m × 153 m (~23,000 m²)   — individual approximate pin
 *  Precision 9 → ~4.8 m × 4.8 m (~23 m²)       — internal proximity check
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encodes latitude/longitude to a geohash string of the given precision.
 * Throws on invalid coordinates or out-of-range precision (1–12).
 */
export function encodeGeohash(lat: number, lng: number, precision: number): string {
  if (lat < -90 || lat > 90) throw new Error(`Invalid latitude: ${lat}`);
  if (lng < -180 || lng > 180) throw new Error(`Invalid longitude: ${lng}`);
  if (precision < 1 || precision > 12) throw new Error(`Precision must be 1–12, got ${precision}`);

  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { idx = idx * 2 + 1; lngMin = mid; }
      else             { idx = idx * 2;     lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { idx = idx * 2 + 1; latMin = mid; }
      else            { idx = idx * 2;     latMax = mid; }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      idx = 0;
      bit = 0;
    }
  }
  return geohash;
}

/**
 * Decodes a geohash string to its cell centroid and error bounds.
 * Returns { lat, lng, latErr, lngErr } where ±latErr/lngErr is the cell radius.
 */
export function decodeGeohash(geohash: string): {
  lat: number; lng: number; latErr: number; lngErr: number;
} {
  if (!geohash) throw new Error('Geohash must be a non-empty string');

  let evenBit = true;
  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  for (const char of geohash) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) throw new Error(`Invalid geohash character: '${char}'`);

    for (let bits = 4; bits >= 0; bits--) {
      const bitN = (idx >> bits) & 1;
      if (evenBit) {
        const mid = (lngMin + lngMax) / 2;
        if (bitN === 1) lngMin = mid; else lngMax = mid;
      } else {
        const mid = (latMin + latMax) / 2;
        if (bitN === 1) latMin = mid; else latMax = mid;
      }
      evenBit = !evenBit;
    }
  }

  const lat = (latMin + latMax) / 2;
  const lng = (lngMin + lngMax) / 2;
  const latErr = (latMax - latMin) / 2;
  const lngErr = (lngMax - lngMin) / 2;
  return { lat, lng, latErr, lngErr };
}

/**
 * Returns [rangeMin, rangeMax] for a Firestore prefix-range query covering
 * the geohash cell and its 8 neighbours.
 *
 * Usage:
 *   const [min, max] = queryRange(geohash5);
 *   db.collection('sessions')
 *     .where('geohash5', '>=', min)
 *     .where('geohash5', '<', max)
 *     // THEN apply Haversine false-positive filter in trusted code
 *
 * NOTE: This returns the range for the prefix only (not neighbour cells).
 * For neighbour-aware queries, use neighbourRanges().
 */
export function queryRange(geohash: string): [string, string] {
  // Increment last character to get the exclusive upper bound
  const last = geohash[geohash.length - 1];
  const idx = BASE32.indexOf(last);
  if (idx === BASE32.length - 1) {
    // Overflow — the entire remaining prefix range is captured by the prefix itself
    return [geohash, geohash + '\uffff'];
  }
  const upper = geohash.slice(0, -1) + BASE32[idx + 1];
  return [geohash, upper];
}

/**
 * Returns the 8 neighbour geohashes at the same precision as the input.
 * Used to build a complete set of cells covering a radius query area.
 */
export function neighbours(geohash: string): string[] {
  const { lat, lng } = decodeGeohash(geohash);
  const p = geohash.length;
  const { latErr, lngErr } = decodeGeohash(geohash);
  const latStep = latErr * 2;
  const lngStep = lngErr * 2;

  const offsets: [number, number][] = [
    [-latStep, -lngStep], [-latStep, 0], [-latStep, lngStep],
    [0, -lngStep],                       [0, lngStep],
    [latStep, -lngStep],  [latStep, 0],  [latStep, lngStep],
  ];

  return offsets.map(([dLat, dLng]) => {
    const nLat = Math.max(-90, Math.min(90, lat + dLat));
    const nLng = ((lng + dLng + 180) % 360) - 180; // handle antimeridian
    return encodeGeohash(nLat, nLng, p);
  });
}

/**
 * Snaps lat/lng to the centroid of a coarse grid cell.
 * Used for individual audience grant coarsening (~100 m grid by default).
 *
 * @param cellMeters - grid cell size in meters (default 100)
 */
export function snapToGrid(lat: number, lng: number, cellMeters = 100): { lat: number; lng: number } {
  // ~111,320 m per degree latitude (equatorial approximation — good enough for snapping)
  const latDeg = cellMeters / 111_320;
  const lngDeg = cellMeters / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.0001));
  return {
    lat: Math.round(lat / latDeg) * latDeg,
    lng: Math.round(lng / lngDeg) * lngDeg,
  };
}

/**
 * Derives a WGS84 centroid from a geohash-7 cell.
 * Used by getCreatorCrowdRadar to return approx coordinates without raw GPS.
 */
export function geohash7Centroid(geohash7: string): { lat: number; lng: number } {
  if (geohash7.length !== 7) throw new Error(`Expected precision-7 geohash, got length ${geohash7.length}`);
  const { lat, lng } = decodeGeohash(geohash7);
  return { lat, lng };
}

/**
 * Computes the geohash for a snapped individual grant location.
 * Applies snapToGrid then encodes at precision 7.
 */
export function computeApproxGeohash7(lat: number, lng: number, snapMeters = 100): string {
  const { lat: sLat, lng: sLng } = snapToGrid(lat, lng, snapMeters);
  return encodeGeohash(sLat, sLng, 7);
}
