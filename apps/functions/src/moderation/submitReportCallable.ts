/**
 * Crowdbeats V2 — submitReport Cloud Function (Phase 6)
 *
 * Callable: submitReport
 * Public & authenticated intake endpoint for user-generated abuse reports.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import crypto from 'crypto';
import { ingestAbuseReport } from './reportService.js';
import type { SubmitReportRequest, SubmitReportResponse } from '@crowdbeats/contracts';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const submitReport = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<SubmitReportResponse> => {
    const data = request.data as SubmitReportRequest;

    if (!data?.targetType || !data?.targetId || !data?.violationCategory || !data?.description) {
      throw new HttpsError('invalid-argument', 'targetType, targetId, violationCategory, and description are required.');
    }

    const rawIp = request.rawRequest?.ip || '0.0.0.0';
    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex');
    const userAgent = request.rawRequest?.headers['user-agent'] as string | undefined;

    try {
      return await ingestAbuseReport(_db(), {
        request: data,
        callerUid: request.auth?.uid,
        ipHash,
        userAgent,
      });
    } catch (err: any) {
      throw new HttpsError('internal', err?.message || 'Failed to submit abuse report.');
    }
  },
);
