/**
 * Crowdbeats V2 — QR Token Contract (Phase 3)
 *
 * Collection path: /qrTokens/{tokenId}
 *
 * INVARIANTS:
 * - Tokens are SERVER-ISSUED ONLY via a Cloud Function callable
 * - HMAC SHA-256 signature computed server-side using Secret Manager key
 * - TTL is 300 seconds (QR_TOKEN_TTL_SECONDS)
 * - Tokens are single-use; usedAt is set atomically on redemption
 * - No client may create, update, or delete a qrToken document
 */

import type { IsoTimestamp, EpochMs } from '../common/timestamp';
import { QR_TOKEN_TTL_SECONDS } from '../common/timestamp';

export { QR_TOKEN_TTL_SECONDS };

// ─── QR Token Record ──────────────────────────────────────────────────────────

export interface QRToken {
  readonly tokenId: string;
  readonly sessionId: string;
  readonly stageId: string;
  readonly venueId: string;
  /** HMAC SHA-256 hex digest of `${sessionId}:${tokenId}:${expiresAtMs}`. SERVER_ONLY. */
  readonly hmacSignature: string; // SERVER_ONLY
  readonly issuedAt: IsoTimestamp;
  readonly expiresAtMs: EpochMs;
  /** Set atomically on first redemption. SERVER_ONLY. */
  readonly usedAt?: IsoTimestamp;
  readonly usedByUid?: string;
}

// ─── QR Token Payload (encoded in QR code) ───────────────────────────────────

/**
 * This is what is encoded in the QR code image.
 * Clients decode it and pass to the verifyQrToken Cloud Function.
 */
export interface QRTokenPayload {
  readonly tokenId: string;
  readonly sessionId: string;
  readonly expiresAtMs: EpochMs;
  readonly sig: string; // First 16 chars of HMAC (full sig verified server-side)
}

// ─── Verify Request / Response ────────────────────────────────────────────────

export interface VerifyQRTokenRequest {
  readonly payload: QRTokenPayload;
  readonly idempotencyKey: string;
}

export interface QRCheckInResult {
  readonly sessionId: string;
  readonly performerName: string;
  readonly venueName: string;
  readonly checkedInAt: IsoTimestamp;
}
