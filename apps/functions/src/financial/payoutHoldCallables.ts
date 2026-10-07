/**
 * Crowdbeats V2 — Payout Hold Callables (Phase 9)
 *
 * Callables:
 * - applyCreatorPayoutHold: places a payout hold (guarded by SUPER_ADMIN or TRUST_SAFETY)
 * - releaseCreatorPayoutHold: releases a payout hold (guarded by SUPER_ADMIN or TRUST_SAFETY)
 * - getCreatorPayoutHoldStatus: checks payout hold status (staff or creator self-inspection)
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { applyPayoutHold, releasePayoutHold, getPayoutHoldStatus } from './payoutHoldService.js';
import type {
  ApplyPayoutHoldRequest,
  ReleasePayoutHoldRequest,
  PayoutHoldRecord,
  PayoutHoldStatusResponse,
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

export const applyCreatorPayoutHold = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<PayoutHoldRecord> => {
    _assertStaffRole(request.auth);

    const data = request.data as ApplyPayoutHoldRequest;
    if (!data?.creatorId || !data?.reasonCode) {
      throw new HttpsError('invalid-argument', 'creatorId and reasonCode are required.');
    }

    try {
      return await applyPayoutHold(_db(), request.auth!.uid, data);
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to apply payout hold.');
    }
  },
);

export const releaseCreatorPayoutHold = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<{ success: boolean; remainingActiveHolds: number }> => {
    _assertStaffRole(request.auth);

    const data = request.data as ReleasePayoutHoldRequest;
    if (!data?.holdId) {
      throw new HttpsError('invalid-argument', 'holdId is required.');
    }

    try {
      return await releasePayoutHold(_db(), request.auth!.uid, data);
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to release payout hold.');
    }
  },
);

export const getCreatorPayoutHoldStatus = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<PayoutHoldStatusResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const data = (request.data || {}) as Record<string, unknown>;
    const creatorId = (data['creatorId'] as string | undefined) || request.auth.uid;

    const token = request.auth.token || {};
    const platformRole = token['platformRole'] as string | undefined;
    const isStaff = platformRole === 'SUPER_ADMIN' || platformRole === 'TRUST_SAFETY';

    if (creatorId !== request.auth.uid && !isStaff) {
      throw new HttpsError('permission-denied', 'You may only inspect your own payout hold status.');
    }

    return await getPayoutHoldStatus(_db(), creatorId);
  },
);
