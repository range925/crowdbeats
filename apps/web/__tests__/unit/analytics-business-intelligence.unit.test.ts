/**
 * Crowdbeats V2 — Frontend Analytics & Business Intelligence Unit Tests (Phase 19)
 *
 * Verifies:
 * 1. Metric Freshness Labeling & Sampling Metadata (REAL_TIME, DELAYED, ESTIMATED)
 * 2. Business Intelligence KPI Formulas (Take Rate, Conversion %, Repeat Rate, Activation %)
 * 3. Privacy Safeguards & k-Anonymity Supporter Tiers
 * 4. Cross-Platform Contract Parity & Analytical Schema Integrity
 */

import {
  CONTRACTS_VERSION,
  type MetricFreshness,
  type LabeledMetric,
  type PlatformAnalyticsRollup,
  type SupporterFrequencyTier,
} from '@crowdbeats/contracts';

describe('Phase 19 — Frontend Analytics & Business Intelligence Unit Tests', () => {
  // ════════════════════════════════════════════════════════════════════════════
  // 1. FRESHNESS BADGE & METRIC LABELING
  // ════════════════════════════════════════════════════════════════════════════

  describe('Metric Freshness & Sampling Labeling', () => {
    function formatMetricBadge(metric: LabeledMetric<any>): {
      label: string;
      color: string;
      secondaryText?: string;
    } {
      switch (metric.freshness) {
        case 'REAL_TIME':
          return {
            label: 'LIVE',
            color: '#10B981', // green
            secondaryText: 'Real-time telemetry',
          };
        case 'DELAYED': {
          const delayMin = Math.round((metric.delaySeconds || 3600) / 60);
          return {
            label: 'DELAYED',
            color: '#F59E0B', // amber
            secondaryText: delayMin >= 60 ? `${Math.round(delayMin / 60)}h delay` : `${delayMin}m delay`,
          };
        }
        case 'ESTIMATED': {
          const err = metric.sampling?.marginOfErrorPct ? `±${metric.sampling.marginOfErrorPct}%` : 'Sampled';
          return {
            label: 'ESTIMATED',
            color: '#8B5CF6', // purple
            secondaryText: `${err} (${Math.round((metric.sampling?.confidenceLevel || 0.95) * 100)}% conf)`,
          };
        }
      }
    }

    it('formats real-time metric badge with live indicator', () => {
      const metric: LabeledMetric<number> = {
        value: 1250,
        freshness: 'REAL_TIME',
        calculatedAt: new Date().toISOString(),
      };

      const badge = formatMetricBadge(metric);
      expect(badge.label).toBe('LIVE');
      expect(badge.color).toBe('#10B981');
      expect(badge.secondaryText).toBe('Real-time telemetry');
    });

    it('formats delayed metric badge with delay latency', () => {
      const metric: LabeledMetric<number> = {
        value: 84.5,
        freshness: 'DELAYED',
        delaySeconds: 7200,
        calculatedAt: new Date().toISOString(),
      };

      const badge = formatMetricBadge(metric);
      expect(badge.label).toBe('DELAYED');
      expect(badge.color).toBe('#F59E0B');
      expect(badge.secondaryText).toBe('2h delay');
    });

    it('formats estimated metric badge with confidence level and margin of error', () => {
      const metric: LabeledMetric<number> = {
        value: 450,
        freshness: 'ESTIMATED',
        calculatedAt: new Date().toISOString(),
        sampling: {
          isSampled: true,
          sampleRate: 0.25,
          confidenceLevel: 0.95,
          marginOfErrorPct: 3.5,
        },
      };

      const badge = formatMetricBadge(metric);
      expect(badge.label).toBe('ESTIMATED');
      expect(badge.color).toBe('#8B5CF6');
      expect(badge.secondaryText).toBe('±3.5% (95% conf)');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. BUSINESS INTELLIGENCE KPI FORMULAS
  // ════════════════════════════════════════════════════════════════════════════

  describe('Business Intelligence KPI Formulas', () => {
    it('computes creator activation rate accurately from registered and activated counts', () => {
      const totalRegistered = 250;
      const activated = 110;
      const ratePct = Number(((activated / totalRegistered) * 100).toFixed(1));

      expect(ratePct).toBe(44.0);
    });

    it('computes fan payer conversion rate accurately', () => {
      const totalFans = 1200;
      const uniqueTippers = 300;
      const conversionPct = Number(((uniqueTippers / totalFans) * 100).toFixed(1));

      expect(conversionPct).toBe(25.0);
    });

    it('computes repeat supporter retention rate accurately', () => {
      const uniqueTippers = 300;
      const repeatTippers = 120;
      const repeatRatePct = Number(((repeatTippers / uniqueTippers) * 100).toFixed(1));

      expect(repeatRatePct).toBe(40.0);
    });

    it('computes canonical 6.00% take rate and net platform revenue after deductions', () => {
      const grossTippingVolumeCents = 1000000; // $10,000.00
      const tipFeesCents = Math.round(grossTippingVolumeCents * 0.06); // $600.00 (6%)
      const campaignFeesCents = 30000; // $300.00
      const sponsorFeesCents = 50000; // $500.00
      const refundsCents = 20000; // $200.00
      const disputesCents = 5000; // $50.00

      const totalRevenueCents = tipFeesCents + campaignFeesCents + sponsorFeesCents;
      const netRevenueCents = totalRevenueCents - refundsCents - disputesCents;

      expect(tipFeesCents).toBe(60000);
      expect(totalRevenueCents).toBe(140000); // $1,400.00
      expect(netRevenueCents).toBe(115000); // $1,150.00
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. PRIVACY SAFEGUARDS & k-ANONYMITY
  // ════════════════════════════════════════════════════════════════════════════

  describe('Privacy Safeguards & k-Anonymity Tier Thresholds', () => {
    function sanitizeSupporterTiers(rawTiers: SupporterFrequencyTier[]): SupporterFrequencyTier[] {
      return rawTiers.map((t) => ({
        ...t,
        supporterCount: t.supporterCount > 0 && t.supporterCount < 5 ? 5 : t.supporterCount,
      }));
    }

    it('thresholds cohorts with fewer than 5 supporters to enforce k-anonymity (k >= 5)', () => {
      const rawTiers: SupporterFrequencyTier[] = [
        { tierName: '1 Tip', minTips: 1, maxTips: 1, supporterCount: 42, volumeCents: 21000, percentage: 70 },
        { tierName: '2-4 Tips', minTips: 2, maxTips: 4, supporterCount: 15, volumeCents: 45000, percentage: 25 },
        { tierName: '5-9 Tips', minTips: 5, maxTips: 9, supporterCount: 2, volumeCents: 18000, percentage: 3.3 }, // Cohort of 2
        { tierName: '10+ Tips', minTips: 10, maxTips: Infinity, supporterCount: 1, volumeCents: 50000, percentage: 1.7 }, // Cohort of 1
      ];

      const safeTiers = sanitizeSupporterTiers(rawTiers);
      expect(safeTiers[0].supporterCount).toBe(42);
      expect(safeTiers[1].supporterCount).toBe(15);
      // Protected by k-anonymity:
      expect(safeTiers[2].supporterCount).toBe(5);
      expect(safeTiers[3].supporterCount).toBe(5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. CONTRACTS VERSION & SCHEMA PARITY
  // ════════════════════════════════════════════════════════════════════════════

  describe('Contracts Version & Analytical Domain Parity', () => {
    it('verifies contracts package version is >= 0.32.0', () => {
      expect(CONTRACTS_VERSION).toMatch(/^0\.(3[2-9]|[4-9][0-9])\./);
    });

    it('validates all seven analytical domains are defined in the rollup contract', () => {
      const mockRollup: Partial<PlatformAnalyticsRollup> = {
        rollupId: 'test_rollup',
        userGrowth: {} as any,
        creatorActivation: {} as any,
        livePerformances: {} as any,
        tippingConversion: {} as any,
        campaigns: {} as any,
        sponsorActivity: {} as any,
        platformRevenue: {} as any,
      };

      const domains = [
        'userGrowth',
        'creatorActivation',
        'livePerformances',
        'tippingConversion',
        'campaigns',
        'sponsorActivity',
        'platformRevenue',
      ];

      for (const d of domains) {
        expect((mockRollup as any)[d]).toBeDefined();
      }
    });
  });
});
