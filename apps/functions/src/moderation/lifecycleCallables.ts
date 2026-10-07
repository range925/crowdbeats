/**
 * Crowdbeats V2 — Creator Lifecycle Callables (Phase 8)
 *
 * Callable: enforceCreatorLifecycleAction
 * Guarded by staff roles: SUPER_ADMIN or TRUST_SAFETY.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { enforceCreatorLifecycle } from './lifecycleService.js';
import type {
  EnforceCreatorLifecycleRequest,
  EnforceCreatorLifecycleResponse,
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

export const enforceCreatorLifecycleAction = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<EnforceCreatorLifecycleResponse> => {
    _assertStaffRole(request.auth);

    const data = request.data as EnforceCreatorLifecycleRequest;
    if (!data?.creatorId || !data?.action || !data?.reason) {
      throw new HttpsError('invalid-argument', 'creatorId, action, and reason are required.');
    }

    try {
      return await enforceCreatorLifecycle(_db(), request.auth!.uid, data);
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to enforce creator lifecycle action.');
    }
  },
);
