/**
 * Crowdbeats V2 — Strike Management Cloud Functions (Phase 7)
 *
 * Callables:
 * - issueCreatorStrike: issues a disciplinary strike (guarded by SUPER_ADMIN or TRUST_SAFETY)
 * - resolveCreatorStrike: resolves or appeals a strike (guarded by SUPER_ADMIN or TRUST_SAFETY)
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { issueStrike, resolveStrike, evaluateRepeatOffenderStatus } from './strikeService.js';
import type {
  IssueStrikeRequest,
  ResolveStrikeRequest,
  StrikeRecord,
  RepeatOffenderEvaluation,
} from '@crowdbeats/contracts';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

function _assertStaffRole(auth: any): void {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const token = auth.token || {};
  const platformRole = token['platformRole'] as string | undefined;
  const isStaff = platformRole === 'SUPER_ADMIN' || platformRole === 'TRUST_SAFETY';

  if (!isStaff) {
    throw new HttpsError('permission-denied', 'Staff moderation role (SUPER_ADMIN or TRUST_SAFETY) required.');
  }
}

export const issueCreatorStrike = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<StrikeRecord> => {
    _assertStaffRole(request.auth);

    const data = request.data as IssueStrikeRequest;
    if (!data?.targetUid || !data?.reason || !data?.violationCategory) {
      throw new HttpsError('invalid-argument', 'targetUid, reason, and violationCategory are required.');
    }

    try {
      return await issueStrike(_db(), request.auth!.uid, data);
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to issue strike.');
    }
  },
);

export const resolveCreatorStrike = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<{ success: boolean }> => {
    _assertStaffRole(request.auth);

    const data = request.data as ResolveStrikeRequest;
    if (!data?.strikeId || !data?.resolution) {
      throw new HttpsError('invalid-argument', 'strikeId and resolution are required.');
    }

    try {
      await resolveStrike(_db(), request.auth!.uid, data);
      return { success: true };
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to resolve strike.');
    }
  },
);

export const getRepeatOffenderStatus = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<RepeatOffenderEvaluation> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const data = (request.data || {}) as Record<string, unknown>;
    const targetUid = (data['targetUid'] as string | undefined) || request.auth.uid;

    const token = request.auth.token || {};
    const platformRole = token['platformRole'] as string | undefined;
    const isStaff = platformRole === 'SUPER_ADMIN' || platformRole === 'TRUST_SAFETY';

    if (targetUid !== request.auth.uid && !isStaff) {
      throw new HttpsError('permission-denied', 'You may only inspect your own disciplinary standing.');
    }

    return await evaluateRepeatOffenderStatus(_db(), targetUid);
  },
);
