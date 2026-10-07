/**
 * Crowdbeats V2 — recordConsent Cloud Function (Phase 4)
 *
 * Callable: recordConsent
 * Records user affirmative consent to versioned compliance policies.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { recordUserConsent } from './consentService.js';
import {
  PLATFORM_POLICIES_REGISTRY,
  type ComplianceConsentRecord,
  type RecordConsentRequest,
} from '@crowdbeats/contracts';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const recordConsent = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ComplianceConsentRecord> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as RecordConsentRequest;

    const policyType = data?.policyType;
    const version = data?.version;

    if (!policyType || !PLATFORM_POLICIES_REGISTRY[policyType]) {
      throw new HttpsError('invalid-argument', `Invalid policyType: ${policyType}`);
    }
    if (typeof version !== 'string' || version.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Policy version is required.');
    }

    try {
      return await recordUserConsent(_db(), {
        uid,
        request: data,
        ipAddress: request.rawRequest?.ip,
      });
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to record consent.');
    }
  },
);
