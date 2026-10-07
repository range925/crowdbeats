/**
 * Crowdbeats V2 — Server-Authoritative Discovery Ranking & Popularity Service
 *
 * Computes deterministic popularity, trending, and nearby scores strictly on the server.
 * Clients have zero direct write authority over any score fields.
 */

export interface RankingSignals {
  readonly viewCount: number;
  readonly uniqueViews7d: number;
  readonly totalTipsReceivedCount: number;
  readonly tipsReceived7dCount: number;
  readonly favoriteCount: number;
  readonly verifiedLiveEventCount: number;
  readonly isCurrentlyLive: boolean;
}

export interface NearbyRankingSignals {
  readonly distanceMiles: number;
  readonly isCurrentlyLive: boolean;
  readonly isScheduledToday?: boolean;
  readonly isVerified: boolean;
  readonly profileQualityScore?: number;
}

function sanitizeSignal(val: number | undefined, fallback = 0): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(0, val);
}

/**
 * Calculates nearby score (0 - 1000) prioritizing physical distance and active live performance.
 * Weighted signals:
 * - Distance decay (500 pts max, decaying by 20 pts/mile)
 * - Currently Live (+300 pts bonus)
 * - Scheduled today (+100 pts bonus)
 * - Verified Creator (+50 pts bonus)
 * - Profile Quality (+50 pts max)
 */
export function calculateNearbyScore(signals: NearbyRankingSignals): number {
  const dist = sanitizeSignal(signals.distanceMiles, 50);
  const distanceScore = Math.max(0, 500 - dist * 20);
  const liveBonus = signals.isCurrentlyLive === true ? 300 : 0;
  const scheduleBonus = signals.isScheduledToday === true ? 100 : 0;
  const verifiedBonus = signals.isVerified === true ? 50 : 0;
  const qualityBonus = Math.min(sanitizeSignal(signals.profileQualityScore, 30), 50);

  const total = distanceScore + liveBonus + scheduleBonus + verifiedBonus + qualityBonus;
  return Math.round(Math.max(0, Math.min(total, 1000)));
}

/**
 * Calculates long-term popularity score (0 - 1000).
 * Weighted signals:
 * - Total Unique Tippers / Engagement Count (40%)
 * - Favorite / Follow Count (30%)
 * - Total Views (20%)
 * - Verified Live Events (10%)
 */
export function calculatePopularityScore(signals: RankingSignals): number {
  const tipsScore = Math.min(sanitizeSignal(signals.totalTipsReceivedCount) * 5, 400);
  const favScore = Math.min(sanitizeSignal(signals.favoriteCount) * 10, 300);
  const viewScore = Math.min(sanitizeSignal(signals.viewCount) * 0.5, 200);
  const eventScore = Math.min(sanitizeSignal(signals.verifiedLiveEventCount) * 20, 100);

  const total = tipsScore + favScore + viewScore + eventScore;
  return Math.round(Math.max(0, Math.min(total, 1000)));
}

/**
 * Calculates short-term trending score (0 - 1000) heavily weighted toward recent activity and live status.
 * Weighted signals:
 * - Currently Live (+300 bonus)
 * - 7-day Tip Velocity (40%)
 * - 7-day Unique Views Velocity (30%)
 */
export function calculateTrendingScore(signals: RankingSignals): number {
  let score = 0;

  if (signals.isCurrentlyLive === true) {
    score += 300;
  }

  const recentTipsScore = Math.min(sanitizeSignal(signals.tipsReceived7dCount) * 25, 400);
  const recentViewsScore = Math.min(sanitizeSignal(signals.uniqueViews7d) * 2, 300);

  score += recentTipsScore + recentViewsScore;
  return Math.round(Math.max(0, Math.min(score, 1000)));
}

