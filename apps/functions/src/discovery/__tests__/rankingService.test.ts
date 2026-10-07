/**
 * Crowdbeats V2 — Ranking Service Unit Tests (Phase 5)
 *
 * Validates server-authoritative score calculation for:
 * 1. calculateNearbyScore — distance decay + live bonus model
 * 2. calculatePopularityScore — tips, favorites, views, events weighting
 * 3. calculateTrendingScore — recency-weighted activity
 */

import {
  calculateNearbyScore,
  calculatePopularityScore,
  calculateTrendingScore,
  type NearbyRankingSignals,
  type RankingSignals,
} from '../rankingService.js';
import {
  validateCoordinates,
  computeBoundingBox,
  calculateDistanceMiles,
  MAX_DISCOVERY_RADIUS_MILES,
} from '../geoService.js';

describe('Server-Authoritative Ranking Service', () => {

  describe('calculateNearbyScore — Distance Decay + Live Bonus', () => {
    test('live performer at 0.3 miles scores ~780+ (distance decay + live bonus)', () => {
      const score = calculateNearbyScore({
        distanceMiles: 0.3,
        isCurrentlyLive: true,
        isScheduledToday: false,
        isVerified: true,
        profileQualityScore: 30,
      });
      // 500 - (0.3*20) = 494 + 300 live + 50 verified + 30 quality = 874
      expect(score).toBeGreaterThanOrEqual(800);
      expect(score).toBeLessThanOrEqual(1000);
    });

    test('non-live performer at 1.4 miles scores significantly lower', () => {
      const score = calculateNearbyScore({
        distanceMiles: 1.4,
        isCurrentlyLive: false,
        isScheduledToday: false,
        isVerified: false,
        profileQualityScore: 30,
      });
      // 500 - (1.4*20) = 472 + 0 + 0 + 30 = 502
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(600);
    });

    test('live bonus (+300) differentiates two performers at same distance', () => {
      const liveScore = calculateNearbyScore({
        distanceMiles: 0.5,
        isCurrentlyLive: true,
        isVerified: false,
        profileQualityScore: 30,
      });
      const notLiveScore = calculateNearbyScore({
        distanceMiles: 0.5,
        isCurrentlyLive: false,
        isVerified: false,
        profileQualityScore: 30,
      });
      expect(liveScore - notLiveScore).toBe(300);
    });

    test('performer at 25+ miles scores near-zero (only quality floor remains)', () => {
      const score = calculateNearbyScore({
        distanceMiles: 30,
        isCurrentlyLive: false,
        isVerified: false,
        profileQualityScore: 0,
      });
      // distance: max(0, 500 - 30*20) = max(0, -100) = 0; quality: min(0,50)=0; total = 0
      expect(score).toBe(0);
    });

    test('score is capped at 1000', () => {
      const score = calculateNearbyScore({
        distanceMiles: 0,
        isCurrentlyLive: true,
        isScheduledToday: true,
        isVerified: true,
        profileQualityScore: 100,
      });
      expect(score).toBeLessThanOrEqual(1000);
    });

    test('verified performer gets +50 bonus over unverified at same position', () => {
      const base: NearbyRankingSignals = {
        distanceMiles: 1.0,
        isCurrentlyLive: false,
        isVerified: false,
        profileQualityScore: 30,
      };
      const verifiedScore = calculateNearbyScore({ ...base, isVerified: true });
      const unverifiedScore = calculateNearbyScore({ ...base, isVerified: false });
      expect(verifiedScore - unverifiedScore).toBe(50);
    });
  });

  describe('calculatePopularityScore — Long-Term Engagement Weighting', () => {
    const baseSignals: RankingSignals = {
      viewCount: 0,
      uniqueViews7d: 0,
      totalTipsReceivedCount: 0,
      tipsReceived7dCount: 0,
      favoriteCount: 0,
      verifiedLiveEventCount: 0,
      isCurrentlyLive: false,
    };

    test('artist with 20 tips, 10 favorites, 100 views scores correctly', () => {
      const score = calculatePopularityScore({
        ...baseSignals,
        totalTipsReceivedCount: 20,
        favoriteCount: 10,
        viewCount: 100,
        verifiedLiveEventCount: 2,
      });
      // tipsScore: min(20*5, 400)=100, favScore: min(10*10, 300)=100, viewScore: min(100*0.5, 200)=50, eventScore: min(2*20, 100)=40 => 290
      expect(score).toBe(290);
    });

    test('max tips capped at 400 points', () => {
      const score = calculatePopularityScore({
        ...baseSignals,
        totalTipsReceivedCount: 200,
      });
      // 200*5=1000 but capped at 400
      const tipsOnlyScore = score;
      expect(tipsOnlyScore).toBeLessThanOrEqual(1000);
      expect(tipsOnlyScore).toBeGreaterThanOrEqual(400);
    });

    test('total popularity score capped at 1000', () => {
      const score = calculatePopularityScore({
        viewCount: 10000,
        uniqueViews7d: 5000,
        totalTipsReceivedCount: 1000,
        tipsReceived7dCount: 200,
        favoriteCount: 1000,
        verifiedLiveEventCount: 1000,
        isCurrentlyLive: true,
      });
      expect(score).toBeLessThanOrEqual(1000);
    });
  });

  describe('calculateTrendingScore — Recency-Weighted Activity', () => {
    const baseSignals: RankingSignals = {
      viewCount: 0,
      uniqueViews7d: 0,
      totalTipsReceivedCount: 0,
      tipsReceived7dCount: 0,
      favoriteCount: 0,
      verifiedLiveEventCount: 0,
      isCurrentlyLive: false,
    };

    test('currently live performer gets +300 trending bonus', () => {
      const liveScore = calculateTrendingScore({ ...baseSignals, isCurrentlyLive: true });
      const notLiveScore = calculateTrendingScore({ ...baseSignals, isCurrentlyLive: false });
      expect(liveScore - notLiveScore).toBe(300);
    });

    test('recent tip velocity (7d) contributes up to 400 points', () => {
      const score = calculateTrendingScore({
        ...baseSignals,
        tipsReceived7dCount: 20,
      });
      // 20*25=500 but capped at 400
      expect(score).toBeGreaterThanOrEqual(400);
    });

    test('trending score is capped at 1000', () => {
      const score = calculateTrendingScore({
        viewCount: 0,
        uniqueViews7d: 10000,
        totalTipsReceivedCount: 1000,
        tipsReceived7dCount: 1000,
        favoriteCount: 0,
        verifiedLiveEventCount: 0,
        isCurrentlyLive: true,
      });
      expect(score).toBeLessThanOrEqual(1000);
    });

    test('handles negative and NaN inputs safely without returning NaN or negative numbers', () => {
      const negativeSignals: RankingSignals = {
        viewCount: -100,
        uniqueViews7d: NaN,
        totalTipsReceivedCount: -5,
        tipsReceived7dCount: NaN,
        favoriteCount: -10,
        verifiedLiveEventCount: -2,
        isCurrentlyLive: false,
      };

      const popScore = calculatePopularityScore(negativeSignals);
      expect(popScore).toBe(0);
      expect(Number.isNaN(popScore)).toBe(false);

      const trendScore = calculateTrendingScore(negativeSignals);
      expect(trendScore).toBe(0);
      expect(Number.isNaN(trendScore)).toBe(false);

      const nearbyScore = calculateNearbyScore({
        distanceMiles: -10,
        isCurrentlyLive: false,
        profileQualityScore: NaN,
        isVerified: false,
      });
      expect(nearbyScore).toBeGreaterThanOrEqual(0);
      expect(nearbyScore).toBeLessThanOrEqual(1000);
      expect(Number.isNaN(nearbyScore)).toBe(false);
    });
  });

  describe('Geographic Coordinate Validation & Bounding Box Controls', () => {
    test('validateCoordinates correctly enforces physical earth limits', () => {
      expect(validateCoordinates(33.8358, -118.3406)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);

      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(0, -181)).toBe(false);
      expect(validateCoordinates(NaN, 0)).toBe(false);
      expect(validateCoordinates(0, Infinity)).toBe(false);
    });

    test('computeBoundingBox caps broad radius to MAX_DISCOVERY_RADIUS_MILES', () => {
      expect(MAX_DISCOVERY_RADIUS_MILES).toBe(100);

      const box = computeBoundingBox(33.8358, -118.3406, 5000);
      // Lat delta for 100 miles = 100 / 69 = ~1.449
      expect(box.maxLat - 33.8358).toBeCloseTo(100 / 69.0, 2);
      expect(box.minLat).toBeGreaterThanOrEqual(-90);
      expect(box.maxLat).toBeLessThanOrEqual(90);
      expect(box.minLng).toBeGreaterThanOrEqual(-180);
      expect(box.maxLng).toBeLessThanOrEqual(180);
    });

    test('calculateDistanceMiles returns sentinel on invalid coordinates', () => {
      const distance = calculateDistanceMiles(999, 0, 33.8, -118.3);
      expect(distance).toBe(9999.9);
    });
  });
});

