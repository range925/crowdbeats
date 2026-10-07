/**
 * Crowdbeats V2 — Abuse Report Ingestion Service (Phase 6)
 *
 * Implements report ingestion, automated SLA classification, zero-tolerance
 * auto-quarantine, and moderation queue routing.
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import {
  ReportStatus,
  ReportSlaTier,
  ReporterType,
  ModerationRiskCategory,
  ModeratedContentType,
  ModerationState,
  type AbuseReport,
  type SubmitReportRequest,
  type SubmitReportResponse,
} from '@crowdbeats/contracts';

/**
 * Generates human-readable ticket number (e.g. "RPT-20260827-ABCD").
 */
function generateTicketNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = uuidv4().substring(0, 6).toUpperCase();
  return `RPT-${dateStr}-${randomSuffix}`;
}

/**
 * Determines the SLA tier based on the violation category.
 */
export function determineSlaTier(category: ModerationRiskCategory): ReportSlaTier {
  switch (category) {
    case ModerationRiskCategory.CSAM_CSAE:
    case ModerationRiskCategory.VIOLENCE_TERRORISM:
      return ReportSlaTier.CRITICAL_1_HOUR;
    case ModerationRiskCategory.HATE_SPEECH_HARASSMENT:
    case ModerationRiskCategory.NON_CONSENSUAL_SEXUAL:
    case ModerationRiskCategory.FRAUD_SCAM:
      return ReportSlaTier.HIGH_4_HOUR;
    default:
      return ReportSlaTier.STANDARD_24_HOUR;
  }
}

/**
 * Ingests an abuse report into Firestore, creates a moderation queue item,
 * and executes emergency quarantine if critical safety violation.
 */
export async function ingestAbuseReport(
  db: admin.firestore.Firestore,
  params: {
    request: SubmitReportRequest;
    callerUid?: string;
    ipHash?: string;
    userAgent?: string;
  },
): Promise<SubmitReportResponse> {
  const { request, callerUid, ipHash, userAgent } = params;
  const {
    targetType,
    targetId,
    targetUrl,
    reporterType: explicitReporterType,
    reporterEmail,
    reporterName,
    violationCategory,
    description,
    evidenceUrls = [],
  } = request;

  if (!targetType || !targetId) {
    throw new Error('targetType and targetId are required.');
  }
  if (!violationCategory) {
    throw new Error('violationCategory is required.');
  }
  if (!description || description.trim().length === 0) {
    throw new Error('description is required.');
  }

  const reportId = uuidv4();
  const ticketNumber = generateTicketNumber();
  const slaTier = determineSlaTier(violationCategory);
  const now = new Date().toISOString();
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  const reporterType: ReporterType = callerUid
    ? ReporterType.AUTHENTICATED_USER
    : (explicitReporterType || ReporterType.ANONYMOUS_PUBLIC);

  const report: AbuseReport = {
    reportId,
    ticketNumber,
    targetType,
    targetId,
    targetUrl,
    reporterType,
    reporterUid: callerUid,
    reporterEmail,
    reporterName,
    violationCategory,
    description: description.trim(),
    evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls.slice(0, 5) : [],
    status: ReportStatus.RECEIVED,
    slaTier,
    ipHash,
    userAgent,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();

  // 1. Save Report Record
  const reportRef = db.collection('reports').doc(reportId);
  batch.set(reportRef, {
    ...report,
    serverCreatedAt: serverNow,
  });

  // 2. Enqueue into Moderation Queue
  const queueItemId = uuidv4();
  const queueRef = db.collection('moderationQueue').doc(queueItemId);
  batch.set(queueRef, {
    queueItemId,
    contentId: targetId,
    contentType: targetType as unknown as ModeratedContentType,
    authorUid: callerUid || 'anonymous',
    targetCreatorId: targetType === 'CREATOR' ? targetId : undefined,
    state: slaTier === ReportSlaTier.CRITICAL_1_HOUR ? ModerationState.QUARANTINED : ModerationState.FLAGGED,
    riskCategory: violationCategory,
    riskScore: slaTier === ReportSlaTier.CRITICAL_1_HOUR ? 1.0 : (slaTier === ReportSlaTier.HIGH_4_HOUR ? 0.75 : 0.4),
    flaggedReasons: [`REPORT_${violationCategory}`, `SLA_${slaTier}`],
    autoQuarantined: slaTier === ReportSlaTier.CRITICAL_1_HOUR,
    reportTicketNumber: ticketNumber,
    createdAt: now,
    updatedAt: now,
    serverCreatedAt: serverNow,
  });

  // 3. Emergency Auto-Quarantine on Target if Critical SLA
  if (slaTier === ReportSlaTier.CRITICAL_1_HOUR) {
    if (targetType === 'CREATOR') {
      const userRef = db.collection('users').doc(targetId);
      batch.update(userRef, {
        isSuspended: true,
        suspendedAt: serverNow,
        suspensionReason: `EMERGENCY_QUARANTINE_REPORT_${ticketNumber}`,
        updatedAt: serverNow,
      });
    }
  }

  // 4. Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: 'REPORT_SUBMITTED',
    reportId,
    ticketNumber,
    targetType,
    targetId,
    violationCategory,
    slaTier,
    reporterType,
    timestamp: serverNow,
  });

  await batch.commit();

  return {
    reportId,
    ticketNumber,
    status: ReportStatus.RECEIVED,
    slaTier,
    receivedAt: now,
  };
}
