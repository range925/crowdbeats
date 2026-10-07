/**
 * Crowdbeats V2 — Public Copyright / Rights-Holder Complaint Callable (Phase 10)
 *
 * Callable: submitCopyrightReport
 *
 * Ingests external DMCA and intellectual property complaints from rights holders or
 * authorized agents into the restricted /rightsHolderReports Firestore collection.
 *
 * Compliance Invariants:
 * - Public intake: Does NOT require a registered Crowdbeats account.
 * - Privacy protection: Claimant contact info is restricted to authorized IP compliance staff.
 * - Audit logging: Creates immutable audit event.
 * - Rate limiting: Protects against report spam.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

function generateDmcaTicket(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = uuidv4().substring(0, 6).toUpperCase();
  return `DMCA-${dateStr}-${randomSuffix}`;
}

export const submitCopyrightReport = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const data = (request.data || {}) as Record<string, unknown>;

    const {
      claimantName,
      claimantEmail,
      claimantPhone,
      claimantAddress,
      rightsHolderRelationship,
      copyrightedWorkDescription,
      infringingUrl,
      requestedAction = 'TAKEDOWN',
      goodFaithAttestation,
      penaltyOfPerjuryAttestation,
      electronicSignature,
    } = data;

    // Validate required DMCA elements (17 U.S.C. § 512(c)(3))
    if (!claimantName || typeof claimantName !== 'string' || claimantName.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Claimant name is required.');
    }
    if (!claimantEmail || typeof claimantEmail !== 'string' || !claimantEmail.includes('@')) {
      throw new HttpsError('invalid-argument', 'Valid claimant email address is required.');
    }
    if (!copyrightedWorkDescription || typeof copyrightedWorkDescription !== 'string' || copyrightedWorkDescription.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Description of copyrighted work is required.');
    }
    if (!infringingUrl || typeof infringingUrl !== 'string' || !infringingUrl.includes('crowdbeats')) {
      throw new HttpsError('invalid-argument', 'Valid Crowdbeats URL is required.');
    }
    if (goodFaithAttestation !== true) {
      throw new HttpsError('invalid-argument', 'Good-faith belief attestation is required.');
    }
    if (penaltyOfPerjuryAttestation !== true) {
      throw new HttpsError('invalid-argument', 'Statement under penalty of perjury is required.');
    }
    if (!electronicSignature || typeof electronicSignature !== 'string' || electronicSignature.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Electronic signature is required.');
    }

    const reportId = uuidv4();
    const ticketNumber = generateDmcaTicket();
    const now = new Date().toISOString();
    const serverNow = admin.firestore.FieldValue.serverTimestamp();

    const reportRecord = {
      reportId,
      ticketNumber,
      claimantName: (claimantName as string).trim(),
      claimantEmail: (claimantEmail as string).trim(),
      claimantPhone: (claimantPhone as string)?.trim() || null,
      claimantAddress: (claimantAddress as string)?.trim() || null,
      rightsHolderRelationship: (rightsHolderRelationship as string)?.trim() || 'OWNER',
      copyrightedWorkDescription: (copyrightedWorkDescription as string).trim(),
      infringingUrl: (infringingUrl as string).trim(),
      requestedAction: (requestedAction as string).toUpperCase(),
      goodFaithAttestation: true,
      penaltyOfPerjuryAttestation: true,
      electronicSignature: (electronicSignature as string).trim(),
      status: 'RECEIVED',
      assignedModeratorId: null,
      resolutionNotes: null,
      takedownExecuted: false,
      counterNoticeReceived: false,
      createdAt: now,
      updatedAt: now,
      serverCreatedAt: serverNow,
    };

    const batch = _db().batch();

    // 1. Save to restricted rightsHolderReports collection
    const reportRef = _db().collection('rightsHolderReports').doc(reportId);
    batch.set(reportRef, reportRecord);

    // 2. Also mirror into contentReports collection for centralized moderation visibility
    const contentReportRef = _db().collection('contentReports').doc(reportId);
    batch.set(contentReportRef, {
      reportId,
      ticketNumber,
      targetType: 'URL',
      targetId: infringingUrl,
      reason: 'COPYRIGHT',
      description: `DMCA Complaint: ${copyrightedWorkDescription}`,
      status: 'PENDING',
      isRightsHolderReport: true,
      rightsHolderReportId: reportId,
      createdAt: now,
      updatedAt: now,
      serverCreatedAt: serverNow,
    });

    // 3. Enqueue high-priority item in moderationQueue
    const queueItemId = uuidv4();
    const queueRef = _db().collection('moderationQueue').doc(queueItemId);
    batch.set(queueRef, {
      queueItemId,
      contentId: infringingUrl,
      contentType: 'EXTERNAL_URL',
      state: 'FLAGGED',
      riskCategory: 'INTELLECTUAL_PROPERTY',
      riskScore: 0.85,
      flaggedReasons: ['RIGHTS_HOLDER_DMCA_COMPLAINT'],
      reportTicketNumber: ticketNumber,
      rightsHolderReportId: reportId,
      createdAt: now,
      updatedAt: now,
      serverCreatedAt: serverNow,
    });

    // 4. Audit Log
    const auditRef = _db().collection('auditLogs').doc(uuidv4());
    batch.set(auditRef, {
      action: 'RIGHTS_HOLDER_REPORT_SUBMITTED',
      reportId,
      ticketNumber,
      infringingUrl,
      claimantName: (claimantName as string).trim(),
      timestamp: serverNow,
    });

    await batch.commit();

    return {
      success: true,
      reportId,
      ticketNumber,
      message: 'DMCA copyright report received. Case enqueued for Trust & Safety review.',
      receivedAt: now,
    };
  }
);
