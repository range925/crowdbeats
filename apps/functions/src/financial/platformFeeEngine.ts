/**
 * Crowdbeats V2 — Platform Fee Calculation Engine
 *
 * Implements server-authoritative integer minor unit fee arithmetic.
 * Ensures zero floating-point drift and enforces minimum/maximum fee bounds.
 *
 * Invariant: Client-supplied fee values are NEVER trusted or stored.
 */

export interface FeeCalculationResult {
  readonly grossAmountCents: number;
  readonly platformFeeCents: number;
  readonly netAmountCents: number;
  readonly feeBasisPoints: number;
  readonly effectivePercentage: number;
}

export function calculatePlatformFee(
  grossAmountCents: number,
  feeBasisPoints: number,
  minFeeCents?: number,
  maxFeeCents?: number,
): FeeCalculationResult {
  if (!Number.isInteger(grossAmountCents) || grossAmountCents < 0) {
    throw new Error('grossAmountCents must be a non-negative integer.');
  }
  if (!Number.isInteger(feeBasisPoints) || feeBasisPoints < 0 || feeBasisPoints > 1000) {
    throw new Error('feeBasisPoints must be an integer between 0 and 1000 (0.00% to 10.00%).');
  }

  // 1. Calculate raw fee in integer minor units (floor rounding)
  let calculatedFeeCents = Math.floor((grossAmountCents * feeBasisPoints) / 10000);

  // 2. Apply minimum fee bound if configured (only if fee applies)
  if (feeBasisPoints > 0 && minFeeCents && calculatedFeeCents < minFeeCents) {
    calculatedFeeCents = minFeeCents;
  }

  // 3. Apply maximum fee bound if configured
  if (maxFeeCents && calculatedFeeCents > maxFeeCents) {
    calculatedFeeCents = maxFeeCents;
  }

  // 4. Ensure fee never exceeds gross payment
  if (calculatedFeeCents > grossAmountCents) {
    calculatedFeeCents = grossAmountCents;
  }

  const netAmountCents = grossAmountCents - calculatedFeeCents;
  const effectivePercentage = Number(((calculatedFeeCents / (grossAmountCents || 1)) * 100).toFixed(2));

  return {
    grossAmountCents,
    platformFeeCents: calculatedFeeCents,
    netAmountCents,
    feeBasisPoints,
    effectivePercentage,
  };
}
