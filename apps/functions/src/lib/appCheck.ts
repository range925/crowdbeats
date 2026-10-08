/**
 * Crowdbeats V2 — App Check Attestation Guard (Phase 7)
 *
 * Implements observe -> warn -> enforce rollout for:
 * - Play Integrity (Android)
 * - App Attest (iOS)
 * - Web/debug tokens (Web & Dev/Emulator)
 */

import * as crypto from 'crypto';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { RedactedLogger } from './logger.js';

const logger = new RedactedLogger('AppCheckGuard');

export type AppCheckMode = 'observe' | 'warn' | 'enforce';

/**
 * Returns the current App Check enforcement mode.
 * Default is 'observe' to allow smooth rollout across mobile clients.
 */
export function getAppCheckMode(): AppCheckMode {
  const mode = process.env.APP_CHECK_MODE?.toLowerCase();
  if (mode === 'enforce') return 'enforce';
  if (mode === 'warn') return 'warn';
  return 'observe';
}

/**
 * Derives a zero-PII hash from an App Check token / context for rate limiting.
 * Never stores or leaks the raw token.
 */
export function hashAppCheckContext(request: CallableRequest<unknown>): string {
  const appId = request.app?.appId || 'unknown_app';
  const token = request.rawRequest?.headers?.['x-firebase-appcheck'] as string | undefined;
  if (!token) {
    return crypto.createHash('sha256').update(`no_token:${appId}`).digest('hex').slice(0, 16);
  }
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
}

/**
 * Verifies App Check status on a callable request according to the current mode.
 * Throws HttpsError in 'enforce' mode if invalid or absent.
 */
export function verifyAppCheck(
  request: CallableRequest<unknown>,
  actionName = 'callable_invocation',
): { verified: boolean; appId?: string; mode: AppCheckMode } {
  const mode = getAppCheckMode();
  const hasValidAppCheck = request.app != null;

  if (hasValidAppCheck) {
    return {
      verified: true,
      appId: request.app?.appId,
      mode,
    };
  }

  // App Check is missing or failed verification
  if (mode === 'enforce') {
    logger.error(`App Check failed in enforce mode for action: ${actionName}`, undefined, {
      action: actionName,
      mode,
    });
    throw new HttpsError(
      'failed-precondition',
      'App Check attestation verification failed. Untrusted client environment.',
    );
  }

  if (mode === 'warn') {
    logger.warn(`App Check token missing in warn mode for action: ${actionName}`, {
      action: actionName,
      mode,
    });
    return { verified: false, mode };
  }

  // mode === 'observe'
  logger.info(`App Check observation: unverified client invoked ${actionName}`, {
    action: actionName,
    mode,
  });
  return { verified: false, mode };
}
