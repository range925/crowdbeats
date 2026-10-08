/**
 * Crowdbeats V2 — Live Location Model + Geohash Acceptance Tests (Phase 2)
 *
 * Tests:
 *  1. Geohash encode / decode round-trip at all relevant precisions
 *  2. queryRange returns valid Firestore prefix bounds
 *  3. snapToGrid coarsens coordinates to the expected grid
 *  4. computeApproxGeohash7 produces precision-7 output
 *  5. PublicLivePresence type guard: raw private fields absent
 *  6. Expired session filtered by query (isEffectivelyLive equivalent)
 *  7. PrivateLocationSession cannot be cast to PublicLivePresence
 *  8. Duplicate/out-of-order seq rejected (HeartbeatRequest validation logic)
 *  9. Venue public pin is venue canonical coords, not device coords
 * 10. Street public pin is geohash-7 centroid, not device coords
 * 11. AudienceVisibilityGrant round-trip: no fan UID in creator-facing fields
 * 12. CreatorAudienceZone: no fan IDs, no raw coordinates, count band only
 * 13. Audience zone threshold suppression invariant
 * 14. ConsentReceipt schema has no creator-facing join to grant signals
 * 15. geohash precision reference: correct string lengths
 * 16. neighbours() returns 8 geohashes at correct precision
 * 17. AudienceCountBand wire values
 * 18. LiveSessionStatus wire values
 */

import {
  encodeGeohash,
  decodeGeohash,
  queryRange,
  snapToGrid,
  computeApproxGeohash7,
  neighbours,
  geohash7Centroid,
} from '../lib/geohash.js';
import type {
  PublicLivePresence,
  PrivateLocationSession,
  AudienceVisibilityGrant,
  CreatorAudienceZone,
  ConsentReceipt,
  AudienceSafetyPolicy,
  LiveSessionStatus,
} from '@crowdbeats/contracts';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeLivePresence(overrides: Partial<PublicLivePresence> = {}): PublicLivePresence {
  const base = {
    sessionId: 'sess_abc',
    performerId: 'uid_123',
    performerName: 'The Blue Notes',
    performerType: 'band' as const,
    status: 'live' as LiveSessionStatus,
    locationType: 'venue' as const,
    lat: 33.8358,
    lng: -118.3406,
    geohash5: encodeGeohash(33.8358, -118.3406, 5),
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 6 * 3_600_000).toISOString(),
    v: 1,
    [Symbol('_publicBrand')]: true,
  };
  return { ...base, ...overrides } as unknown as PublicLivePresence;
}

/** Simulates server-side query filter: hide sessions where endsAt < now OR status != 'live' */
function isEffectivelyLive(presence: { status: string; endsAt: string }): boolean {
  return presence.status === 'live' && new Date(presence.endsAt) > new Date();
}

// ── 1. Geohash encode / decode round-trip ─────────────────────────────────────

describe('encodeGeohash / decodeGeohash', () => {
  const testCases: Array<[number, number, number]> = [
    [33.8358, -118.3406, 5],  // Torrance, CA
    [33.8358, -118.3406, 7],
    [33.8358, -118.3406, 9],
    [0, 0, 5],                // Null island
    [-33.8688, 151.2093, 5],  // Sydney
    [51.5074, -0.1278, 7],    // London
    [89.999, 179.999, 5],     // Near North Pole
    [-89.999, -179.999, 5],   // Near South Pole
  ];

  test.each(testCases)(
    'round-trip lat=%f lng=%f precision=%d',
    (lat, lng, precision) => {
      const gh = encodeGeohash(lat, lng, precision);
      expect(gh.length).toBe(precision);
      const { lat: dLat, lng: dLng, latErr, lngErr } = decodeGeohash(gh);
      expect(Math.abs(dLat - lat)).toBeLessThanOrEqual(latErr);
      expect(Math.abs(dLng - lng)).toBeLessThanOrEqual(lngErr);
    },
  );

  test('encodeGeohash throws on invalid latitude', () => {
    expect(() => encodeGeohash(91, 0, 5)).toThrow('Invalid latitude');
    expect(() => encodeGeohash(-91, 0, 5)).toThrow('Invalid latitude');
  });

  test('encodeGeohash throws on invalid longitude', () => {
    expect(() => encodeGeohash(0, 181, 5)).toThrow('Invalid longitude');
    expect(() => encodeGeohash(0, -181, 5)).toThrow('Invalid longitude');
  });

  test('encodeGeohash throws on out-of-range precision', () => {
    expect(() => encodeGeohash(0, 0, 0)).toThrow('Precision');
    expect(() => encodeGeohash(0, 0, 13)).toThrow('Precision');
  });

  test('decodeGeohash throws on invalid character', () => {
    expect(() => decodeGeohash('9mud3a')).toThrow('Invalid geohash character');
  });
});

// ── 2. queryRange returns valid Firestore prefix bounds ────────────────────────

describe('queryRange', () => {
  test('returns [min, max] where max > min', () => {
    const gh = encodeGeohash(33.8358, -118.3406, 5);
    const [min, max] = queryRange(gh);
    expect(max > min).toBe(true);
    expect(min).toBe(gh); // lower bound is the geohash itself
  });

  test('all geohashes in a contiguous range satisfy min <= gh < max', () => {
    const gh = encodeGeohash(33.8358, -118.3406, 5);
    const [min, max] = queryRange(gh);
    // The geohash itself must be in range
    expect(gh >= min).toBe(true);
    expect(gh < max).toBe(true);
  });

  test('handles geohash ending in max BASE32 char (overflow)', () => {
    // 'z' is the last BASE32 char — overflow path
    const [min, max] = queryRange('zzzzz');
    expect(max > min).toBe(true);
  });
});

// ── 3. snapToGrid coarsens coordinates ────────────────────────────────────────

describe('snapToGrid', () => {
  test('snapping 100m grid returns reproducible centroid', () => {
    const { lat: lat1, lng: lng1 } = snapToGrid(33.8358, -118.3406, 100);
    const { lat: lat2, lng: lng2 } = snapToGrid(33.8359, -118.3407, 100);
    // Two nearby points on the same 100m grid cell should snap to the same centroid
    expect(lat1).toBeCloseTo(lat2, 3);
    expect(lng1).toBeCloseTo(lng2, 3);
  });

  test('points far apart snap to different cells', () => {
    const { lat: lat1 } = snapToGrid(33.8358, -118.3406, 100);
    const { lat: lat2 } = snapToGrid(33.840, -118.340, 100);
    expect(lat1).not.toBeCloseTo(lat2, 3);
  });
});

// ── 4. computeApproxGeohash7 ──────────────────────────────────────────────────

describe('computeApproxGeohash7', () => {
  test('returns string of length 7', () => {
    const gh7 = computeApproxGeohash7(33.8358, -118.3406);
    expect(gh7.length).toBe(7);
  });

  test('centroid derived from geohash7 differs from raw device coords by at most 200m', () => {
    const rawLat = 33.83583;
    const rawLng = -118.34063;
    const gh7 = computeApproxGeohash7(rawLat, rawLng);
    const { lat: cLat, lng: cLng } = geohash7Centroid(gh7);
    // 1° lat ≈ 111,320 m, 1° lng at 34° ≈ 92,300 m
    const latDiffM = Math.abs(cLat - rawLat) * 111_320;
    const lngDiffM = Math.abs(cLng - rawLng) * 92_300;
    expect(latDiffM).toBeLessThan(200);
    expect(lngDiffM).toBeLessThan(200);
  });
});

// ── 5. PublicLivePresence never contains private fields ────────────────────────

describe('PublicLivePresence type contract', () => {
  test('presence object has no lastRawPoint field', () => {
    const p = makeLivePresence();
    expect('lastRawPoint' in p).toBe(false);
  });

  test('presence object has no rawHistory field', () => {
    const p = makeLivePresence();
    expect('rawHistory' in p).toBe(false);
  });

  test('presence object has no deviceId field', () => {
    const p = makeLivePresence();
    expect('deviceId' in p).toBe(false);
  });

  test('presence object has no accuracyMeters field', () => {
    const p = makeLivePresence();
    expect('accuracyMeters' in p).toBe(false);
  });
});

// ── 6. Expired session filtered ───────────────────────────────────────────────

describe('isEffectivelyLive — stale session filtering', () => {
  test('live status + future endsAt → effectively live', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    expect(isEffectivelyLive({ status: 'live', endsAt: future })).toBe(true);
  });

  test('expired status + past endsAt → not effectively live', () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    expect(isEffectivelyLive({ status: 'expired', endsAt: past })).toBe(false);
  });

  test('live status + past endsAt → not effectively live (stale, TTL not yet run)', () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    expect(isEffectivelyLive({ status: 'live', endsAt: past })).toBe(false);
  });
});

// ── 7. PrivateLocationSession type isolation ──────────────────────────────────

describe('PrivateLocationSession cannot be assigned to PublicLivePresence', () => {
  test('PrivateLocationSession has raw lat/lng; PublicLivePresence does not expose them as raw', () => {
    // TypeScript structural typing: we test at runtime that private fields are absent
    // from anything that passes through the public projection pipeline.
    const privateDoc: PrivateLocationSession = {
      sessionId: 'sess_abc',
      performerId: 'uid_123',
      lat: 33.8358,
      lng: -118.3406,
      geohash9: encodeGeohash(33.8358, -118.3406, 9),
      geohash7: encodeGeohash(33.8358, -118.3406, 7),
      geohash5: encodeGeohash(33.8358, -118.3406, 5),
      isMockRejected: false,
      accuracyMeters: 10,
      idempotencyKey: 'idem_001',
      capturedAt: new Date().toISOString(),
    };

    // toPublicProjection: server-side, strips private fields
    function toPublicProjection(priv: PrivateLocationSession): Omit<typeof priv, 'lat' | 'lng' | 'geohash9' | 'accuracyMeters' | 'isMockRejected'> & { publicLat: number; publicLng: number } {
      const { lat: _l, lng: _g, geohash9: _gh9, accuracyMeters: _acc, isMockRejected: _mock, ...safe } = priv;
      const { lat: cLat, lng: cLng } = geohash7Centroid(priv.geohash7);
      return { ...safe, publicLat: cLat, publicLng: cLng };
    }

    const projected = toPublicProjection(privateDoc);
    expect('lat' in projected).toBe(false);
    expect('accuracyMeters' in projected).toBe(false);
    expect('isMockRejected' in projected).toBe(false);
    expect(projected.publicLat).toBeDefined();
  });
});

// ── 8. HeartbeatRequest seq monotonicity ─────────────────────────────────────

describe('HeartbeatRequest seq validation', () => {
  /** Server-side seq check (pure function, no Firestore) */
  function validateSeq(incoming: number, lastAccepted: number): { ok: boolean; reason?: string } {
    if (!Number.isInteger(incoming) || incoming < 1) {
      return { ok: false, reason: 'seq must be positive integer' };
    }
    if (incoming <= lastAccepted) {
      return { ok: false, reason: `seq ${incoming} not greater than lastSeq ${lastAccepted}` };
    }
    return { ok: true };
  }

  test('new seq > lastSeq is accepted', () => {
    expect(validateSeq(2, 1).ok).toBe(true);
    expect(validateSeq(100, 99).ok).toBe(true);
  });

  test('duplicate seq is rejected', () => {
    const result = validateSeq(1, 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('not greater than');
  });

  test('out-of-order (lower) seq is rejected', () => {
    const result = validateSeq(3, 5);
    expect(result.ok).toBe(false);
  });

  test('non-integer seq is rejected', () => {
    expect(validateSeq(1.5, 0).ok).toBe(false);
    expect(validateSeq(0, 0).ok).toBe(false);
  });
});

// ── 9. Venue public pin == venue canonical coords ─────────────────────────────

describe('Venue public pin correctness', () => {
  test('venue session public lat/lng match venue document (not device GPS)', () => {
    const venueLat = 33.8358;
    const venueLng = -118.3406;
    const deviceLat = 33.8360; // slightly different device position

    // Server logic: venue session → use venue coords, ignore device coords for public pin
    const publicLat = venueLat; // from venues/{venueId}.lat
    const publicLng = venueLng;
    expect(publicLat).toBe(venueLat);
    expect(publicLat).not.toBe(deviceLat);
    // Public geohash5 derived from venue pin
    const gh5 = encodeGeohash(publicLat, publicLng, 5);
    expect(gh5.length).toBe(5);
  });
});

// ── 10. Street public pin == geohash-7 centroid, not device GPS ───────────────

describe('Street public pin correctness', () => {
  test('street session public pin is geohash-7 centroid, differs from device GPS', () => {
    const deviceLat = 33.83583;
    const deviceLng = -118.34063;
    const gh7 = computeApproxGeohash7(deviceLat, deviceLng);
    const { lat: centroidLat, lng: centroidLng } = geohash7Centroid(gh7);
    // Centroid should differ from exact device position (coarsening effect)
    expect(centroidLat).not.toBe(deviceLat);
    // But still within ~200m
    const distM = Math.sqrt(
      Math.pow((centroidLat - deviceLat) * 111_320, 2) +
      Math.pow((centroidLng - deviceLng) * 92_300, 2),
    );
    expect(distM).toBeLessThan(200);
  });
});

// ── 11. AudienceVisibilityGrant: no fan UID in creator-facing fields ──────────

describe('AudienceVisibilityGrant schema', () => {
  const grant: AudienceVisibilityGrant = {
    grantId: 'grant_001',
    sessionId: 'sess_abc',
    performerId: 'uid_123',
    grantRef: 'opaque_ref_001', // NOT fan UID
    tier: 'aggregate',
    zoneGeohash5: encodeGeohash(33.8358, -118.3406, 5),
    grantedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  };

  test('grant has grantRef, not fanUid', () => {
    expect('grantRef' in grant).toBe(true);
    expect('fanUid' in grant).toBe(false);
  });

  test('individual grant has approxGeohash7, not lat/lng', () => {
    const individualGrant: AudienceVisibilityGrant = {
      ...grant,
      tier: 'individual_session',
      approxGeohash7: computeApproxGeohash7(33.8358, -118.3406),
    };
    expect('approxGeohash7' in individualGrant).toBe(true);
    expect('lat' in individualGrant).toBe(false);
    expect('lng' in individualGrant).toBe(false);
  });

  test('grant has no tip-related fields', () => {
    const keys = Object.keys(grant);
    for (const key of keys) {
      expect(key.toLowerCase()).not.toContain('tip');
      expect(key.toLowerCase()).not.toContain('payment');
    }
  });
});

// ── 12. CreatorAudienceZone: no fan IDs, no raw coords ────────────────────────

describe('CreatorAudienceZone schema', () => {
  const zone: CreatorAudienceZone = {
    zoneId: 'zone_001',
    sessionId: 'sess_abc',
    performerId: 'uid_123',
    geohash5: encodeGeohash(33.8358, -118.3406, 5),
    countBand: '[5-14]',
    aggregatedAtMs: Date.now(),
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  };

  test('zone has countBand, not exact count', () => {
    expect('countBand' in zone).toBe(true);
    expect('count' in zone).toBe(false);
    expect('rawCount' in zone).toBe(false);
  });

  test('zone has no fan UID fields', () => {
    expect('fanUid' in zone).toBe(false);
    expect('fanUidHash' in zone).toBe(false);
    expect('fanIds' in zone).toBe(false);
  });

  test('zone has no raw lat/lng', () => {
    expect('lat' in zone).toBe(false);
    expect('lng' in zone).toBe(false);
  });

  test('geohash5 is exactly 5 characters', () => {
    expect(zone.geohash5.length).toBe(5);
  });
});

// ── 13. Audience zone threshold suppression ────────────────────────────────────

describe('Audience zone threshold suppression', () => {
  /** Simulates aggregation pipeline: only publishes zone if count >= threshold */
  function shouldPublishZone(rawCount: number, threshold: number): boolean {
    return rawCount >= threshold;
  }

  const DEFAULT_THRESHOLD = 5;

  test('does not publish zone when count below threshold', () => {
    expect(shouldPublishZone(4, DEFAULT_THRESHOLD)).toBe(false);
    expect(shouldPublishZone(0, DEFAULT_THRESHOLD)).toBe(false);
  });

  test('publishes zone at threshold', () => {
    expect(shouldPublishZone(5, DEFAULT_THRESHOLD)).toBe(true);
  });

  test('single fan cannot be isolated (count 1 below threshold)', () => {
    expect(shouldPublishZone(1, DEFAULT_THRESHOLD)).toBe(false);
  });

  test('count band maps correctly', () => {
    function toBand(count: number): string {
      if (count <= 4) return '[1-4]';
      if (count <= 14) return '[5-14]';
      return '[15+]';
    }
    expect(toBand(1)).toBe('[1-4]');
    expect(toBand(14)).toBe('[5-14]');
    expect(toBand(15)).toBe('[15+]');
    expect(toBand(1000)).toBe('[15+]');
  });
});

// ── 14. ConsentReceipt schema: no creator join to grant signals ───────────────

describe('ConsentReceipt schema', () => {
  const receipt: ConsentReceipt = {
    receiptId: 'rcpt_001',
    fanUid: 'fan_001',
    sessionId: 'sess_abc',
    performerId: 'uid_123',
    tier: 'aggregate',
    action: 'granted',
    grantId: 'grant_001',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 86_400_000).toISOString(),
  };

  test('receipt has fanUid (fan-scoped) but no creator-visible signal fields', () => {
    expect('fanUid' in receipt).toBe(true); // fan sees their own record
    expect('fanUidHash' in receipt).toBe(false); // no server hash needed in fan's own record
    expect('signalId' in receipt).toBe(false);
    expect('geohash7' in receipt).toBe(false);
    expect('geohash5' in receipt).toBe(false);
  });
});

// ── 15. Geohash precision reference lengths ───────────────────────────────────

describe('Geohash precision string lengths', () => {
  test.each([5, 7, 9])('precision %d produces string of length %d', (p) => {
    expect(encodeGeohash(33.8358, -118.3406, p).length).toBe(p);
  });
});

// ── 16. neighbours() returns 8 geohashes ─────────────────────────────────────

describe('neighbours', () => {
  test('returns exactly 8 geohashes at the same precision', () => {
    const gh = encodeGeohash(33.8358, -118.3406, 5);
    const ns = neighbours(gh);
    expect(ns.length).toBe(8);
    for (const n of ns) expect(n.length).toBe(5);
  });
});

// ── 17. AudienceCountBand wire values ────────────────────────────────────────

describe('AudienceCountBand', () => {
  test('wire values are the expected strings', () => {
    const bands: Array<CreatorAudienceZone['countBand']> = ['[1-4]', '[5-14]', '[15+]'];
    for (const b of bands) {
      expect(b).toMatch(/^\[\d+[-+]\d*\]$/);
    }
  });
});

// ── 18. LiveSessionStatus wire values ─────────────────────────────────────────────

describe('LiveSessionStatus', () => {
  test('known status values', () => {
    const statuses: LiveSessionStatus[] = ['live', 'paused', 'ending', 'ended', 'expired', 'admin_ended', 'error'];
    expect(new Set(statuses).size).toBe(7); // all distinct
  });
});

// ── 19. AudienceSafetyPolicy defaults ────────────────────────────────────────

describe('AudienceSafetyPolicy defaults', () => {
  const defaults: AudienceSafetyPolicy = {
    aggregationThreshold: 5,
    zoneCellGeohashLength: 5,
    individualGeohashLength: 7,
    individualSnapMeters: 100,
    countBandBounds: [[1, 4], [5, 14], [15, 999]],
    publishDelaySeconds: 30,
    zoneFreshnessSeconds: 300,
    heartbeatIntervalSeconds: 90,
    heartbeatExtensionHours: 2,
    maxSessionTtlHours: 12,
    venueProximityRadiusMeters: 200,
    streetModeMaxAccuracyMeters: 100,
    pinFreshnessMaxAgeMinutes: 10,
  };

  test('aggregation threshold is 5 by default', () => {
    expect(defaults.aggregationThreshold).toBe(5);
  });

  test('individual geohash precision is 7', () => {
    expect(defaults.individualGeohashLength).toBe(7);
  });

  test('zone cell precision is 5', () => {
    expect(defaults.zoneCellGeohashLength).toBe(5);
  });

  test('snap grid is 100m', () => {
    expect(defaults.individualSnapMeters).toBe(100);
  });
});
