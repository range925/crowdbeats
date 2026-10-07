/**
 * Crowdbeats V2 — Stripe Daily Fee Schedule & Net Tip Calculation Contracts
 *
 * Invariants:
 * - Crowdbeats Platform Fee: 6.00% (600 bps)
 * - Stripe Processing Fee: Updated daily (Standard: 2.9% + 30¢)
 * - Net Musician Payout: grossAmountCents - (platformFeeCents + stripeProcessingFeeCents)
 * - Multi-member Band splits are computed strictly on net proceeds pool.
 */

export interface StripeDailyFeeSchedule {
  readonly effectiveDate: string; // ISO date 'YYYY-MM-DD'
  readonly percentageRate: number; // e.g. 0.029 (2.9%)
  readonly percentageBps: number; // e.g. 290
  readonly fixedFeeCents: number; // e.g. 30 (30¢)
  readonly currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  readonly lastSyncedAt: string;
  readonly isLiveSynced: boolean;
}

export interface TipFeeBreakdown {
  readonly grossAmountCents: number;
  readonly platformFeeBps: number; // 600 (6%)
  readonly platformFeePercent: number; // 6.0
  readonly platformFeeCents: number; // floor(gross * 0.06)
  readonly stripeFeePercent: number; // e.g. 2.9
  readonly stripeFixedFeeCents: number; // e.g. 30
  readonly stripeProcessingFeeCents: number; // round(gross * rate) + fixed
  readonly totalDeductionsCents: number; // platformFeeCents + stripeProcessingFeeCents
  readonly netProceedsCents: number; // gross - totalDeductions
  readonly effectiveDate: string;
  readonly currency: string;
}

export const DEFAULT_DAILY_STRIPE_FEE_SCHEDULE: StripeDailyFeeSchedule = {
  effectiveDate: '2026-09-19',
  percentageRate: 0.029,
  percentageBps: 290,
  fixedFeeCents: 30,
  currency: 'USD',
  lastSyncedAt: '2026-09-19T00:00:00Z',
  isLiveSynced: true,
};

export function calculateDailyTipFeeBreakdown(
  grossAmountCents: number,
  schedule: StripeDailyFeeSchedule = DEFAULT_DAILY_STRIPE_FEE_SCHEDULE,
  currency = 'USD'
): TipFeeBreakdown {
  const platformFeeCents = Math.floor((grossAmountCents * 600) / 10000);
  const stripeProcessingFeeCents = Math.round(grossAmountCents * schedule.percentageRate) + schedule.fixedFeeCents;
  const totalDeductionsCents = platformFeeCents + stripeProcessingFeeCents;
  const netProceedsCents = Math.max(0, grossAmountCents - totalDeductionsCents);

  return {
    grossAmountCents,
    platformFeeBps: 600,
    platformFeePercent: 6.0,
    platformFeeCents,
    stripeFeePercent: Number((schedule.percentageRate * 100).toFixed(2)),
    stripeFixedFeeCents: schedule.fixedFeeCents,
    stripeProcessingFeeCents,
    totalDeductionsCents,
    netProceedsCents,
    effectiveDate: schedule.effectiveDate,
    currency,
  };
}
