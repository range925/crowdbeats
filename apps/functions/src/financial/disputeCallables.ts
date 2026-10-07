/**
 * Crowdbeats V2 — Dispute Evidence Callables (Phase 11)
 *
 * Callables:
 * - compileEvidenceForDispute: gathers and prepares evidence dictionary
 * - submitEvidenceForDispute: submits compiled evidence to Stripe (guarded by staff)
 * - getDisputeDetails: retrieves dispute records (guarded by staff)
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  compileDisputeEvidence,
  submitDisputeEvidence,
  getDisputeRecord,
} from './disputeEvidenceService.js';
import type {
  CompiledDisputeEvidence,
  DisputeRecord,
  CompileDisputeEvidenceRequest,
  SubmitDisputeEvidenceRequest,
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

export const compileEvidenceForDispute = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<CompiledDisputeEvidence> => {
    _assertStaffRole(request.auth);

    const data = request.data as CompileDisputeEvidenceRequest;
    if (!data?.disputeId) {
      throw new HttpsError('invalid-argument', 'disputeId is required.');
    }

    try {
      return await compileDisputeEvidence(_db(), data.disputeId);
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to compile dispute evidence.');
    }
  },
);

export const submitEvidenceForDispute = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<{ success: boolean; disputeId: string; status: string }> => {
    _assertStaffRole(request.auth);

    const data = request.data as SubmitDisputeEvidenceRequest;
    if (!data?.disputeId) {
      throw new HttpsError('invalid-argument', 'disputeId is required.');
    }

    try {
      return await submitDisputeEvidence(_db(), request.auth!.uid, data);
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to submit dispute evidence.');
    }
  },
);

export const getDisputeDetails = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<DisputeRecord> => {
    _assertStaffRole(request.auth);

    const data = (request.data || {}) as Record<string, unknown>;
    const disputeId = data['disputeId'] as string | undefined;
    if (!disputeId) {
      throw new HttpsError('invalid-argument', 'disputeId is required.');
    }

    try {
      return await getDisputeRecord(_db(), disputeId);
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to retrieve dispute details.');
    }
  },
);
