/**
 * Crowdbeats V2 — requestPrivacyExport Cloud Function (Phase 6)
 * Callable: requestPrivacyExport
 * Queues a GDPR/CCPA data export request. Rate-limited to 1 active request per user.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const _db = () => admin.firestore();

export const requestPrivacyExport = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    if (!request.auth.token.email_verified) {
      throw new HttpsError('permission-denied', 'Email verification required to request a data export.');
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email as string;

    const exportRef = _db().collection('privacyExportRequests').doc(uid);
    const existing = await exportRef.get();

    if (existing.exists) {
      const status = existing.data()?.['status'] as string;
      if (status === 'queued' || status === 'processing') {
        throw new HttpsError(
          'already-exists',
          'Export already in progress. You will receive an email when it is ready.',
        );
      }
    }

    await exportRef.set({
      uid,
      status: 'queued',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      email,
      processedAt: null,
      downloadUrl: null,
      errorMessage: null,
    });

    return {
      ok: true,
      message: 'Export queued. You will receive an email within 48 hours.',
    };
  },
);

/**
 * 24 Hours in milliseconds — strictly enforced maximum signed URL validity for GDPR/CCPA exports
 */
export const PRIVACY_EXPORT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Generates an export payload and 24-hour signed download URL expiry for a user (CS5.2)
 */
export async function generatePrivacyExportPayload(
  db: admin.firestore.Firestore,
  uid: string,
): Promise<{ exportData: Record<string, unknown>; expiresAt: Date; maxTtlMs: number }> {
  const userDoc = await db.collection('users').doc(uid).get();
  const fanDoc = await db.collection('fanProfiles').doc(uid).get();
  const tipsSnap = await db.collection('tips').where('fanUid', '==', uid).get();
  const followsSnap = await db.collection('follows').where('fanUid', '==', uid).get();
  const consentsSnap = await db.collection('consent').where('uid', '==', uid).get();

  const exportData = {
    exportedAt: new Date().toISOString(),
    uid,
    user: userDoc.data() || null,
    fanProfile: fanDoc.data() || null,
    tips: tipsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    follows: followsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    consents: consentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    retentionNotice:
      'Financial ledger records and AML records are retained under 7-year statutory retention obligations.',
  };

  const expiresAt = new Date(Date.now() + PRIVACY_EXPORT_TTL_MS);
  return { exportData, expiresAt, maxTtlMs: PRIVACY_EXPORT_TTL_MS };
}

