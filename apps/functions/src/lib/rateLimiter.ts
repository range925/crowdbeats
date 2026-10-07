/**
 * Crowdbeats V2 — Zero-PII Rate Limiter (Phase 7)
 *
 * Requirements:
 * - Rate limits by user, profile, session, and device/app attestation token hash.
 * - ZERO raw IP address or raw location storage anywhere in database or logs.
 * - Deterministic, irreversible hashing of identifiers and buckets.
 * - Sliding/bucketed rate limiting with atomic Firestore increment.
 */

import * as crypto from 'crypto';
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestoreDb } from '../session/sessionHelpers.js';
import { RedactedLogger } from './logger.js';

const logger = new RedactedLogger('RateLimiter');
const RATE_LIMIT_SALT = process.env.RATE_LIMIT_SALT || 'crowdbeats_ratelimit_salt_2026_phase7';

export type RateLimitAction =
  | 'check_in_start'
  | 'check_in_sample'
  | 'live_stationary_start'
  | 'live_mobile_start'
  | 'session_lease_renew'
  | 'mobile_location_sample'
  | 'audience_opt_in'
  | 'audience_grant'
  | 'audience_revoke'
  | 'audience_radar_read'
  | 'admin_force_end'
  | 'session_reconcile'
  | 'session_health_read'
  | 'camera_nearby_query';

export interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
}

export const DEFAULT_RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  check_in_start: { maxAttempts: 5, windowSeconds: 600 }, // 5 per 10m
  check_in_sample: { maxAttempts: 10, windowSeconds: 300 }, // 10 per 5m
  live_stationary_start: { maxAttempts: 3, windowSeconds: 600 }, // 3 per 10m
  live_mobile_start: { maxAttempts: 3, windowSeconds: 600 }, // 3 per 10m
  session_lease_renew: { maxAttempts: 30, windowSeconds: 300 }, // 30 per 5m (cadence limit)
  mobile_location_sample: { maxAttempts: 60, windowSeconds: 300 }, // 60 per 5m (cadence limit)
  audience_opt_in: { maxAttempts: 10, windowSeconds: 300 }, // 10 per 5m
  audience_grant: { maxAttempts: 10, windowSeconds: 300 }, // 10 per 5m
  audience_revoke: { maxAttempts: 10, windowSeconds: 300 }, // 10 per 5m
  audience_radar_read: { maxAttempts: 12, windowSeconds: 60 }, // 12 per 1m (5s cadence limit)
  admin_force_end: { maxAttempts: 10, windowSeconds: 300 }, // 10 per 5m
  session_reconcile: { maxAttempts: 15, windowSeconds: 60 }, // 15 per 1m
  session_health_read: { maxAttempts: 30, windowSeconds: 60 }, // 30 per 1m
  camera_nearby_query: { maxAttempts: 20, windowSeconds: 60 }, // 20 per 1m (throttled client)
};

/**
 * Computes a zero-PII HMAC hash for a rate limit bucket.
 * Guaranteed to contain ZERO raw IP, location, or unhashed identifiers.
 */
export function computeRateLimitKey(
  identifier: string,
  action: RateLimitAction,
  windowBucket: number,
  salt = RATE_LIMIT_SALT,
): string {
  return crypto
    .createHmac('sha256', salt)
    .update(`${action}:${identifier}:${windowBucket}`)
    .digest('hex')
    .slice(0, 32);
}

export interface CheckRateLimitOptions {
  identifier: string;
  action: RateLimitAction;
  maxAttempts?: number;
  windowSeconds?: number;
  customSalt?: string;
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  maxAttempts: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Checks and increments the rate limit for a given action and identifier.
 * Stored in `/rateLimits/{keyHash}` with zero raw PII.
 */
export async function checkRateLimit(options: CheckRateLimitOptions): Promise<RateLimitResult> {
  const config = DEFAULT_RATE_LIMITS[options.action] || { maxAttempts: 10, windowSeconds: 60 };
  const maxAttempts = options.maxAttempts ?? config.maxAttempts;
  const windowSeconds = options.windowSeconds ?? config.windowSeconds;
  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(nowMs / windowMs);

  const keyHash = computeRateLimitKey(options.identifier, options.action, bucket, options.customSalt);
  const resetAt = new Date((bucket + 1) * windowMs);

  try {
    const db = getFirestoreDb();
    const docRef = db.collection('rateLimits').doc(keyHash);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      let currentCount = 0;

      if (snap.exists) {
        currentCount = (snap.data()?.['count'] as number) || 0;
      }

      if (currentCount >= maxAttempts) {
        return {
          allowed: false,
          count: currentCount + 1,
          maxAttempts,
          remaining: 0,
          resetAt,
        };
      }

      const nextCount = currentCount + 1;
      tx.set(
        docRef,
        {
          keyHash,
          action: options.action,
          count: nextCount,
          expiresAt: resetAt.toISOString(),
          updatedAt: new Date(nowMs).toISOString(),
        },
        { merge: true },
      );

      return {
        allowed: true,
        count: nextCount,
        maxAttempts,
        remaining: maxAttempts - nextCount,
        resetAt,
      };
    });

    return result;
  } catch (error) {
    const shouldFailClosed = options.failClosed ?? (process.env.FUNCTIONS_EMULATOR !== 'true' && !process.env.JEST_WORKER_ID);
    if (shouldFailClosed) {
      logger.error('Rate limit evaluation failed in production environment; failing closed for safety', {
        action: options.action,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        allowed: false,
        count: maxAttempts,
        maxAttempts,
        remaining: 0,
        resetAt,
      };
    }
    // If Firestore fails or running in offline unit test mock without rateLimits collection
    logger.warn('Rate limit evaluation encountered error; failing open for resilience in test mock', {
      action: options.action,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      allowed: true,
      count: 1,
      maxAttempts,
      remaining: maxAttempts - 1,
      resetAt,
    };
  }
}

/**
 * Enforces a rate limit, throwing an HttpsError('resource-exhausted') if exceeded.
 */
export async function enforceRateLimit(options: CheckRateLimitOptions): Promise<void> {
  const result = await checkRateLimit(options);
  if (!result.allowed) {
    logger.warn(`Rate limit exceeded for action: ${options.action}`, {
      action: options.action,
      resetAt: result.resetAt.toISOString(),
    });
    throw new HttpsError(
      'resource-exhausted',
      `Rate limit exceeded for ${options.action}. Try again after ${result.resetAt.toISOString()}.`,
    );
  }
}
