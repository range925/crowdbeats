/**
 * Crowdbeats V2 — checkMonetizationEligibility Cloud Function (Phase 3)
 *
 * Callable: checkMonetizationEligibility
 * Returns the current monetization eligibility and compliance checklist for a creator.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { evaluateCreatorMonetizationEligibility } from './eligibilityService.js';
import type { MonetizationEligibilityResult } from '@crowdbeats/contracts';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const checkMonetizationEligibility = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<MonetizationEligibilityResult> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = (request.data || {}) as Record<string, unknown>;

    const targetCreatorId = (data['creatorId'] as string | undefined) || uid;
    const creatorType = (data['creatorType'] as 'artist' | 'band' | undefined) || 'artist';

    // Users can check their own eligibility; staff can check any creator
    const callerClaims = request.auth.token || {};
    const isStaff = Boolean(callerClaims['platformRole']);

    if (targetCreatorId !== uid && !isStaff) {
      throw new HttpsError('permission-denied', 'You may only check your own monetization status.');
    }

    return await evaluateCreatorMonetizationEligibility(_db(), targetCreatorId, creatorType);
  },
);
