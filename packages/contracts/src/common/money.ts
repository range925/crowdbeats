/**
 * Crowdbeats V2 — Money Contract (Phase 3)
 *
 * INVARIANTS (must be enforced at every layer):
 * - amountCents is always a non-negative integer (no floats, no negative)
 * - currency is always a supported ISO 4217 code
 * - Arithmetic is always done in integer cents to avoid floating-point drift
 * - Human display is computed from cents (amountCents / 100) only at the UI layer
 * - Band splits are in basis points (splitBps): must total exactly 10000
 *
 * Platform fee constants:
 * - PLATFORM_FEE_BPS: 500 = 5.00% — OD-10 default (pending David confirmation before Phase 6)
 * - FAN_REFUND_WINDOW_HOURS: 24 — OD-10 default
 * - PAYOUT_MINIMUM_CENTS: 1000 = $10.00 — OD-10 default
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

export type ISO4217CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export const SUPPORTED_CURRENCIES: readonly ISO4217CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
] as const;

// ─── Money Amount ─────────────────────────────────────────────────────────────

/**
 * Platform-neutral money representation.
 * NEVER use floating-point for money. Always store as integer minor units.
 *
 * Example: $10.50 USD → { amountCents: 1050, currency: 'USD' }
 */
export interface MoneyAmount {
  /** Non-negative integer. $10.00 = 1000. Must be validated before storage. */
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
}

export function validateMoneyAmount(m: MoneyAmount): void {
  if (!Number.isInteger(m.amountCents) || m.amountCents < 0) {
    throw new Error(`Invalid amountCents: ${m.amountCents}. Must be a non-negative integer.`);
  }
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(m.currency)) {
    throw new Error(`Unsupported currency: ${m.currency}`);
  }
}

export function moneyAmount(amountCents: number, currency: ISO4217CurrencyCode): MoneyAmount {
  const m: MoneyAmount = { amountCents, currency };
  validateMoneyAmount(m);
  return m;
}

// ─── Platform Fee Constants ───────────────────────────────────────────────────

/** Platform fee in basis points. 600 = 6.00% standard technology fee. */
export const PLATFORM_FEE_BPS = 600 as const;

/** Mandatory legal disclosure notice displayed before payment authorization. */
export const PLATFORM_FEE_DISCLOSURE_NOTICE =
  'Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional.' as const;

/** Fan refund window in hours. OD-10 default: 24 hours. */
export const FAN_REFUND_WINDOW_HOURS = 24 as const;

/** Minimum payout balance in cents. OD-10 default: $10.00. */
export const PAYOUT_MINIMUM_CENTS = 1000 as const;

// ─── Band Split (Basis Points) ────────────────────────────────────────────────

/**
 * Band member split in basis points.
 * All member splitBps values must sum to exactly SPLIT_TOTAL_BPS (10000).
 * OD-09: Largest Remainder Method for odd-cent distribution.
 */
export interface MemberSplitBps {
  readonly uid: string;
  /** Integer basis points. 5000 = 50.00%. */
  readonly splitBps: number;
}

/** All band splits must sum to exactly this value. */
export const SPLIT_TOTAL_BPS = 10000 as const;

export function validateSplitConfig(members: readonly MemberSplitBps[]): void {
  if (members.length === 0) {
    throw new Error('Band split config must have at least one member.');
  }
  const total = members.reduce((sum, m) => sum + m.splitBps, 0);
  if (total !== SPLIT_TOTAL_BPS) {
    throw new Error(`Split total must be ${SPLIT_TOTAL_BPS} bps. Got ${total}.`);
  }
  for (const m of members) {
    if (!Number.isInteger(m.splitBps) || m.splitBps <= 0) {
      throw new Error(`Invalid splitBps for uid ${m.uid}: ${m.splitBps}`);
    }
  }
}

/**
 * Largest Remainder Method (OD-09) for distributing amountCents across band members.
 * Returns a map of uid → allocated cents. All cents are fully distributed.
 */
export function distributeLargestRemainder(
  amountCents: number,
  members: readonly MemberSplitBps[],
): Record<string, number> {
  validateMoneyAmount({ amountCents, currency: 'USD' }); // currency arbitrary for validation
  validateSplitConfig(members);

  const exactShares = members.map((m) => ({
    uid: m.uid,
    exact: (amountCents * m.splitBps) / SPLIT_TOTAL_BPS,
    floor: Math.floor((amountCents * m.splitBps) / SPLIT_TOTAL_BPS),
    remainder: ((amountCents * m.splitBps) / SPLIT_TOTAL_BPS) % 1,
  }));

  const floorTotal = exactShares.reduce((sum, s) => sum + s.floor, 0);
  const remainderCents = amountCents - floorTotal;

  // Sort by remainder descending, distribute 1 cent each to top remainders
  const sorted = [...exactShares].sort((a, b) => b.remainder - a.remainder);
  const result: Record<string, number> = {};

  for (const s of exactShares) {
    result[s.uid] = s.floor;
  }
  for (let i = 0; i < remainderCents; i++) {
    result[sorted[i]!.uid]! += 1;
  }

  return result;
}

// ─── Fee Calculation ──────────────────────────────────────────────────────────

export interface FeeBreakdown {
  readonly grossAmountCents: number;
  readonly platformFeePercent: number;
  readonly platformFeeBps: number;
  readonly platformFeeCents: number;
  readonly netAmountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly disclosureNotice: string;
}

/**
 * Calculate platform fee breakdown for a gross tip amount.
 * Always floors the fee to integer cents (creator-favorable).
 */
export function calculateFeeBreakdown(
  grossAmountCents: number,
  currency: ISO4217CurrencyCode,
  feeBps: number = PLATFORM_FEE_BPS,
): FeeBreakdown {
  validateMoneyAmount({ amountCents: grossAmountCents, currency });
  const platformFeeCents = Math.floor((grossAmountCents * feeBps) / 10000);
  return {
    grossAmountCents,
    platformFeePercent: Number((feeBps / 100).toFixed(2)),
    platformFeeBps: feeBps,
    platformFeeCents,
    netAmountCents: grossAmountCents - platformFeeCents,
    currency,
    disclosureNotice: PLATFORM_FEE_DISCLOSURE_NOTICE,
  };
}
