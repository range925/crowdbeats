/**
 * Crowdbeats V2 — Phase 19: Analytics & Business Intelligence Contracts
 *
 * Defines the schemas, metric definitions, sampling models, aggregation types,
 * freshness classifications, privacy controls, and query requests for platform BI.
 */

// ─── Metric Freshness & Sampling ──────────────────────────────────────────────

export type MetricFreshness = 'REAL_TIME' | 'DELAYED' | 'ESTIMATED';

export interface MetricSamplingMetadata {
  readonly isSampled: boolean;
  readonly sampleRate?: number; // e.g. 0.1 for 10% sample, 1.0 for census
  readonly confidenceLevel?: number; // e.g. 0.95 for 95% confidence
  readonly marginOfErrorPct?: number; // e.g. 2.5 for ±2.5%
  readonly sampleSize?: number;
  readonly totalPopulationEstimate?: number;
}

export interface LabeledMetric<T> {
  readonly value: T;
  readonly freshness: MetricFreshness;
  readonly calculatedAt: string; // ISO 8601 timestamp
  readonly delaySeconds?: number; // Latency if DELAYED
  readonly sampling?: MetricSamplingMetadata; // Metadata if ESTIMATED / SAMPLED
  readonly notes?: string;
}

// ─── 1. User Growth Analytics ─────────────────────────────────────────────────

export interface UserPersonaBreakdown {
  readonly fans: number;
  readonly soloArtists: number;
  readonly bandMembers: number;
  readonly venueManagers: number;
  readonly sponsorReps: number;
}

export interface UserGrowthReport {
  readonly totalRegisteredUsers: LabeledMetric<number>;
  readonly newUsersLast24h: LabeledMetric<number>;
  readonly newUsersLast7d: LabeledMetric<number>;
  readonly newUsersLast30d: LabeledMetric<number>;
  readonly personaBreakdown: LabeledMetric<UserPersonaBreakdown>;
  readonly dailyActiveUsersEstimate: LabeledMetric<number>;
  readonly monthlyActiveUsersEstimate: LabeledMetric<number>;
  readonly weekOverWeekGrowthRatePct: LabeledMetric<number>;
}

// ─── 2. Creator Activation & Retention ────────────────────────────────────────

export interface CreatorActivationReport {
  readonly totalRegisteredCreators: LabeledMetric<number>;
  readonly activatedCreatorsCount: LabeledMetric<number>; // Onboarded + payouts configured + at least 1 tip or session
  readonly activationRatePct: LabeledMetric<number>; // (activated / registered) * 100
  readonly averageTimeToFirstTipHours: LabeledMetric<number>;
  readonly activePerformers30d: LabeledMetric<number>; // Held session or received tip in last 30d
  readonly creatorRetentionRate90dPct: LabeledMetric<number>;
}

// ─── 3. Live Performances Analytics ───────────────────────────────────────────

export interface LivePerformanceReport {
  readonly totalStageSessionsCount: LabeledMetric<number>;
  readonly activeLiveSessionsCount: LabeledMetric<number>;
  readonly totalStageHours: LabeledMetric<number>;
  readonly averageSessionDurationMinutes: LabeledMetric<number>;
  readonly averageAudienceReachPerSession: LabeledMetric<number>;
  readonly liveTippingConversionRatePct: LabeledMetric<number>; // % of checked-in fans who tipped
}

// ─── 4. Tipping Conversion & Supporter Retention ──────────────────────────────

export interface SupporterFrequencyTier {
  readonly tierName: string; // '1 Tip', '2-4 Tips', '5-9 Tips', '10+ Tips (Superfan)'
  readonly minTips: number;
  readonly maxTips: number;
  readonly supporterCount: number;
  readonly volumeCents: number;
  readonly percentage: number;
}

export interface TippingConversionReport {
  readonly totalTipsCount: LabeledMetric<number>;
  readonly grossTippingVolumeCents: LabeledMetric<number>;
  readonly averageTipAmountCents: LabeledMetric<number>;
  readonly uniqueTippingFansCount: LabeledMetric<number>;
  readonly fanPayerConversionRatePct: LabeledMetric<number>; // (unique tippers / total fans) * 100
  readonly repeatSupportersCount: LabeledMetric<number>; // >= 2 tips
  readonly repeatSupporterRatePct: LabeledMetric<number>; // (repeat / unique tippers) * 100
  readonly supporterTiers: LabeledMetric<readonly SupporterFrequencyTier[]>;
}

// ─── 5. Campaigns & Crowdfunding BI ───────────────────────────────────────────

export interface CampaignsReport {
  readonly totalCampaignsCount: LabeledMetric<number>;
  readonly activeCampaignsCount: LabeledMetric<number>;
  readonly fundedCampaignsCount: LabeledMetric<number>;
  readonly totalFundingRaisedCents: LabeledMetric<number>;
  readonly averageFundingProgressPct: LabeledMetric<number>;
  readonly totalBackersCount: LabeledMetric<number>;
  readonly rewardFulfillmentRatePct: LabeledMetric<number>;
}

// ─── 6. Sponsor Activity & Partnerships ───────────────────────────────────────

export interface SponsorActivityReport {
  readonly activeSponsorOrgsCount: LabeledMetric<number>;
  readonly openOpportunitiesCount: LabeledMetric<number>;
  readonly applicationsSubmittedCount: LabeledMetric<number>;
  readonly activeSponsorshipsCount: LabeledMetric<number>;
  readonly totalEscrowDepositedCents: LabeledMetric<number>;
  readonly totalEscrowReleasedCents: LabeledMetric<number>;
  readonly averageSponsorshipValueCents: LabeledMetric<number>;
}

// ─── 7. Platform Revenue & Financial Take Rate ────────────────────────────────

export interface PlatformRevenueReport {
  readonly grossTippingVolumeCents: LabeledMetric<number>;
  readonly grossPlatformFeesCents: LabeledMetric<number>; // 6.00% canonical take rate
  readonly campaignPlatformFeesCents: LabeledMetric<number>;
  readonly sponsorPlatformFeesCents: LabeledMetric<number>;
  readonly totalPlatformRevenueCents: LabeledMetric<number>;
  readonly effectiveTakeRatePct: LabeledMetric<number>; // (total fees / gross) * 100
  readonly refundRatePct: LabeledMetric<number>; // (refunded cents / gross cents) * 100
  readonly disputeRatePct: LabeledMetric<number>; // (disputed cents / gross cents) * 100
  readonly netPlatformRevenueCents: LabeledMetric<number>;
}

// ─── Combined Platform Analytics Rollup ───────────────────────────────────────

export interface PlatformAnalyticsRollup {
  readonly rollupId: string;
  readonly period: '24h' | '7d' | '30d' | '90d' | 'all_time';
  readonly generatedAt: string;
  readonly cacheExpiresAt: string;
  readonly privacyPreserved: boolean; // Confirms k-anonymity (k >= 5) applied
  readonly userGrowth: UserGrowthReport;
  readonly creatorActivation: CreatorActivationReport;
  readonly livePerformances: LivePerformanceReport;
  readonly tippingConversion: TippingConversionReport;
  readonly campaigns: CampaignsReport;
  readonly sponsorActivity: SponsorActivityReport;
  readonly platformRevenue: PlatformRevenueReport;
}

// ─── Request / Response Callables ─────────────────────────────────────────────

export interface GetPlatformAnalyticsRequest {
  readonly period?: '24h' | '7d' | '30d' | '90d' | 'all_time';
  readonly forceRefresh?: boolean; // Only SUPER_ADMIN or EXECUTIVE can bypass cache
}

export interface GetPlatformAnalyticsResponse {
  readonly rollup: PlatformAnalyticsRollup;
  readonly cached: boolean;
  readonly cachedAt: string;
}

export interface GenerateAnalyticsReportRequest {
  readonly reportTitle: string;
  readonly period: '24h' | '7d' | '30d' | '90d' | 'all_time';
  readonly format: 'JSON' | 'CSV';
  readonly includeForecasts?: boolean;
}

export interface AnalyticsReportMetadata {
  readonly reportId: string;
  readonly reportTitle: string;
  readonly format: 'JSON' | 'CSV';
  readonly downloadUrl: string;
  readonly generatedByUid: string;
  readonly generatedAt: string;
  readonly recordCount: number;
}
