/**
 * Crowdbeats V2 — Admin Compliance Center Callables
 *
 * Implements server-authoritative compliance tracking, counsel review sign-off,
 * and DSAR (Data Subject Access Request) fulfillment workflows.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const _db = () => admin.firestore();

export const listComplianceObligations = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    const snap = await _db().collection('complianceObligations').orderBy('id').get();
    const obligations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { obligations };
  },
);

export const updateComplianceObligation = onCall<{
  id: string;
  status: string;
  evidenceLocation?: string;
  reviewerNotes?: string;
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const role = request.auth.token.platformRole;
    if (role !== 'COMPLIANCE_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'COMPLIANCE_OFFICER') {
      throw new HttpsError('permission-denied', 'Compliance officer role required.');
    }

    const { id, status, evidenceLocation, reviewerNotes } = request.data ?? {};
    if (!id || !status) {
      throw new HttpsError('invalid-argument', 'Obligation ID and status are required.');
    }

    if (status === 'counsel_reviewed' && role !== 'SUPER_ADMIN' && role !== 'COMPLIANCE_OFFICER') {
      throw new HttpsError('permission-denied', 'Only designated Compliance Officer or Super Admin may mark Counsel Reviewed.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    await _db()
      .collection('complianceObligations')
      .doc(id)
      .set(
        {
          status,
          ...(evidenceLocation ? { evidenceLocation } : {}),
          ...(reviewerNotes ? { reviewerNotes } : {}),
          updatedAt: now,
          updatedBy: request.auth.uid,
          ...(status === 'counsel_reviewed' ? { counselReviewedDate: new Date().toISOString() } : {}),
        },
        { merge: true },
      );

    // Audit record
    await _db().collection('auditEvents').add({
      eventType: 'COMPLIANCE_OBLIGATION_UPDATED',
      actorUid: request.auth.uid,
      targetType: 'COMPLIANCE_OBLIGATION',
      targetId: id,
      metadata: { status, evidenceLocation },
      timestamp: now,
    });

    return { ok: true, message: `Obligation ${id} updated to ${status}.` };
  },
);
