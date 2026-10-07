import { calculateDistanceMiles, calculateDistanceKm, computeBoundingBox } from '../geoService';
import { calculatePopularityScore, calculateTrendingScore } from '../rankingService';
import { assertCreatorPubliclyDiscoverable } from '../eligibilityService';

describe('Geographic Discovery Service', () => {
  it('calculates distance accurately between known coordinates', () => {
    // San Diego (32.7157, -117.1611) to Torrance (33.8358, -118.3406) ~ 103 miles
    const distanceMiles = calculateDistanceMiles(32.7157, -117.1611, 33.8358, -118.3406);
    expect(distanceMiles).toBeGreaterThan(95);
    expect(distanceMiles).toBeLessThan(115);

    const distanceKm = calculateDistanceKm(32.7157, -117.1611, 33.8358, -118.3406);
    expect(distanceKm).toBeGreaterThan(150);
    expect(distanceKm).toBeLessThan(180);
  });

  it('computes valid bounding box around center point', () => {
    const box = computeBoundingBox(33.8358, -118.3406, 10);
    expect(box.minLat).toBeLessThan(33.8358);
    expect(box.maxLat).toBeGreaterThan(33.8358);
    expect(box.minLng).toBeLessThan(-118.3406);
    expect(box.maxLng).toBeGreaterThan(-118.3406);
  });
});

describe('Server-Authoritative Ranking Service', () => {
  it('calculates popularity score within bounds without client manipulation', () => {
    const score = calculatePopularityScore({
      viewCount: 200,
      uniqueViews7d: 50,
      totalTipsReceivedCount: 40,
      tipsReceived7dCount: 10,
      favoriteCount: 15,
      verifiedLiveEventCount: 3,
      isCurrentlyLive: false,
    });

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1000);
  });

  it('awards significant bonus to trending score for live performers', () => {
    const offlineScore = calculateTrendingScore({
      viewCount: 100,
      uniqueViews7d: 20,
      totalTipsReceivedCount: 10,
      tipsReceived7dCount: 5,
      favoriteCount: 10,
      verifiedLiveEventCount: 1,
      isCurrentlyLive: false,
    });

    const liveScore = calculateTrendingScore({
      viewCount: 100,
      uniqueViews7d: 20,
      totalTipsReceivedCount: 10,
      tipsReceived7dCount: 5,
      favoriteCount: 10,
      verifiedLiveEventCount: 1,
      isCurrentlyLive: true,
    });

    expect(liveScore - offlineScore).toBe(300);
  });
});

describe('Discovery Eligibility Service', () => {
  it('rejects suspended or invalid creators', async () => {
    const mockDb: any = {
      collection: (col: string) => ({
        doc: (id: string) => ({
          get: async () => {
            if (col === 'users' && id === 'suspended_user') {
              return { exists: true, data: () => ({ isSuspended: true }) };
            }
            if (col === 'users' && id === 'active_user') {
              return { exists: true, data: () => ({ isSuspended: false }) };
            }
            if (col === 'artistProfiles' && id === 'active_user') {
              return { exists: true, data: () => ({ isActive: true, stageName: 'Valid Artist' }) };
            }
            return { exists: false, data: () => null };
          },
        }),
      }),
    };

    const suspendedResult = await assertCreatorPubliclyDiscoverable(mockDb, 'suspended_user');
    expect(suspendedResult.isEligible).toBe(false);
    expect(suspendedResult.reason).toContain('suspended');

    const validResult = await assertCreatorPubliclyDiscoverable(mockDb, 'active_user');
    expect(validResult.isEligible).toBe(true);
  });
});
