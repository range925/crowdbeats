/**
 * Crowdbeats V2 — API Response Envelope and Error Taxonomy (Phase 3)
 *
 * All callable functions and server responses use this typed envelope.
 * Clients must always check `ok` before accessing `data`.
 *
 * Design invariants:
 * - `correlationId` is always present — never omitted — for log tracing
 * - `error.code` is always a member of the ErrorCode taxonomy (no free-text codes)
 * - `error.message` is safe for client display (no stack traces, no PII)
 * - `error.details` is optional structured data for the client (e.g. field validation errors)
 * - No sensitive data (Stripe keys, emails, tokens) ever appears in an error envelope
 */

// ─── Correlation ID ───────────────────────────────────────────────────────────

export type CorrelationId = string;

/** Generate a correlation ID for a server-side request. */
export function generateCorrelationId(prefix = 'cb'): CorrelationId {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Error Taxonomy ───────────────────────────────────────────────────────────

/**
 * Platform error codes. Exhaustive — new codes require explicit addition here.
 * Clients switch on these codes for i18n and UX decisions.
 */
export const ErrorCode = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // ── Validation ────────────────────────────────────────────────────────────
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_MONEY_AMOUNT: 'INVALID_MONEY_AMOUNT',
  INVALID_SPLIT_CONFIG: 'INVALID_SPLIT_CONFIG',
  BELOW_MINIMUM_TIP: 'BELOW_MINIMUM_TIP',
  ABOVE_MAXIMUM_TIP: 'ABOVE_MAXIMUM_TIP',

  // ── Resource ──────────────────────────────────────────────────────────────
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // ── Idempotency ───────────────────────────────────────────────────────────
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',

  // ── Payment ───────────────────────────────────────────────────────────────
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  PAYMENT_REQUIRES_ACTION: 'PAYMENT_REQUIRES_ACTION',
  STRIPE_ERROR: 'STRIPE_ERROR',
  REFUND_WINDOW_EXPIRED: 'REFUND_WINDOW_EXPIRED',
  PAYOUT_BELOW_MINIMUM: 'PAYOUT_BELOW_MINIMUM',
  BANK_ACCOUNT_NOT_LINKED: 'BANK_ACCOUNT_NOT_LINKED',

  // ── Session / Stage ───────────────────────────────────────────────────────
  SESSION_NOT_ACTIVE: 'SESSION_NOT_ACTIVE',
  SESSION_ALREADY_ENDED: 'SESSION_ALREADY_ENDED',
  QR_TOKEN_EXPIRED: 'QR_TOKEN_EXPIRED',
  QR_TOKEN_INVALID: 'QR_TOKEN_INVALID',
  QR_TOKEN_ALREADY_USED: 'QR_TOKEN_ALREADY_USED',

  // ── Membership ────────────────────────────────────────────────────────────
  NOT_A_MEMBER: 'NOT_A_MEMBER',
  ALREADY_A_MEMBER: 'ALREADY_A_MEMBER',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  RATE_LIMITED: 'RATE_LIMITED',

  // ── Moderation ────────────────────────────────────────────────────────────
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  CONTENT_REMOVED: 'CONTENT_REMOVED',

  // ── Internal ──────────────────────────────────────────────────────────────
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNIMPLEMENTED: 'UNIMPLEMENTED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Error Object ─────────────────────────────────────────────────────────────

export interface ApiError {
  readonly code: ErrorCode;
  /** Human-readable message. Safe for client display. No PII, no stack traces. */
  readonly message: string;
  /** Optional structured details (e.g., field validation errors). */
  readonly details?: Record<string, unknown>;
}

// ─── Response Envelope ────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
  readonly correlationId: CorrelationId;
  /** Optional pagination cursor for list responses. */
  readonly nextCursor?: string;
}

export interface ApiFailure {
  readonly ok: false;
  readonly error: ApiError;
  readonly correlationId: CorrelationId;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// ─── Factory Helpers ──────────────────────────────────────────────────────────

export function apiSuccess<T>(
  data: T,
  correlationId: CorrelationId,
  nextCursor?: string,
): ApiSuccess<T> {
  return { ok: true, data, correlationId, ...(nextCursor ? { nextCursor } : {}) };
}

export function apiFailure(
  code: ErrorCode,
  message: string,
  correlationId: CorrelationId,
  details?: Record<string, unknown>,
): ApiFailure {
  return { ok: false, error: { code, message, ...(details ? { details } : {}) }, correlationId };
}

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function isApiSuccess<T>(r: ApiResponse<T>): r is ApiSuccess<T> {
  return r.ok === true;
}

export function isApiFailure<T>(r: ApiResponse<T>): r is ApiFailure {
  return r.ok === false;
}

// ─── Void Success ─────────────────────────────────────────────────────────────

/** Convenience type for operations that return no data on success. */
export type VoidResponse = ApiResponse<null>;

export function voidSuccess(correlationId: CorrelationId): ApiSuccess<null> {
  return apiSuccess(null, correlationId);
}
