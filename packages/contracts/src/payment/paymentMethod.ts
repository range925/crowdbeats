/**
 * Crowdbeats V2 — Saved Payment Method Contract (Phase 6)
 *
 * Collection path: /paymentMethods/{uid}/savedMethods/{pmId}
 *
 * INVARIANTS:
 * - No raw PAN, CVC, or full card number is stored anywhere
 * - Records are SERVER-AUTHORED ONLY — created by Stripe webhook or callable
 * - id is the Stripe PaymentMethod ID (pm_...)
 * - Clients may read their own saved methods (for display only)
 * - Clients may NOT write, create, or delete these records
 */

// ── Saved Payment Method ──────────────────────────────────────────────────────

export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | 'unknown';

export interface SavedPaymentMethod {
  /** Stripe PaymentMethod ID (pm_...). No PAN stored. */
  readonly id: string;
  readonly brand: CardBrand;
  readonly last4: string;
  readonly expMonth: number;
  readonly expYear: number;
  readonly isDefault: boolean;
  readonly createdAt: string; // ISO timestamp
  readonly updatedAt: string;
}

// ── SetupIntent Response ──────────────────────────────────────────────────────

export interface CreateSetupIntentResponse {
  /** Stripe SetupIntent client_secret for confirming in the app. */
  readonly setupIntentClientSecret: string;
}

// ── PaymentMethod List Response ───────────────────────────────────────────────

export interface ListPaymentMethodsResponse {
  readonly methods: readonly SavedPaymentMethod[];
}
