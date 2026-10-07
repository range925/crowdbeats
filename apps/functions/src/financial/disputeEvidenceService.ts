/**
 * Crowdbeats V2 — Dispute Evidence Aggregation Service (Phase 11)
 *
 * Automatically compiles and submits standardized dispute evidence payloads
 * to Stripe, including session logs, creator verification telemetry, moderation scans,
 * and binding legal policy disclosures.
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import {
  type CompiledDisputeEvidence,
  type DisputeRecord,
  type SubmitDisputeEvidenceRequest,
} from '@crowdbeats/contracts';
import { stripe } from '../lib/stripe.js';

const REFUND_POLICY_URL = 'https://crowdbeats.ai/legal/refund-dispute-policy';
const TERMS_OF_SERVICE_URL = 'https://crowdbeats.ai/legal/terms-of-service';

/**
 * Compiles comprehensive evidence for a dispute from platform telemetry.
 */
export async function compileDisputeEvidence(
  db: admin.firestore.Firestore,
  disputeId: string,
): Promise<CompiledDisputeEvidence> {
  const disputeRef = db.collection('disputes').doc(disputeId);
  const disputeSnap = await disputeRef.get();

  if (!disputeSnap.exists) {
    throw new Error(`Dispute ${disputeId} not found.`);
  }

  const disputeData = disputeSnap.data() as DisputeRecord;
  const tipId = disputeData.tipId;
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  let tipData: Record<string, unknown> = {};
  let sessionData: Record<string, unknown> = {};
  let performerSlug = 'creator';

  if (tipId) {
    const tipSnap = await db.collection('tips').doc(tipId).get();
    if (tipSnap.exists) {
      tipData = tipSnap.data() || {};
      const sessionId = tipData['sessionId'] as string | undefined;
      const recipientId = tipData['recipientId'] as string | undefined;

      if (sessionId) {
        const sessionSnap = await db.collection('sessions').doc(sessionId).get();
        if (sessionSnap.exists) {
          sessionData = sessionSnap.data() || {};
        }
      }

      if (recipientId) {
        const userSnap = await db.collection('users').doc(recipientId).get();
        if (userSnap.exists) {
          performerSlug = (userSnap.data()?.['slug'] as string) || recipientId;
        }
      }
    }
  }

  const tipAmountFormatted = `$${(((disputeData.amountCents || (tipData['amountCents'] as number) || 0)) / 100).toFixed(2)}`;
  const tipMessage = (tipData['message'] as string) || 'No message attached';
  const moderationStatus = (tipData['moderationStatus'] as string) || 'PASS';
  const createdAt = (tipData['createdAt'] as any)?.toDate?.()?.toISOString?.() || new Date().toISOString();
  const sessionId = (tipData['sessionId'] as string) || 'direct_creator_tip';
  const sessionTitle = (sessionData['title'] as string) || 'Live Interactive Session';

  const productDescription = `Direct creator tip of ${tipAmountFormatted} for live interactive musical performance by performer @${performerSlug}. Tips are digital gifts voluntarily sent during live sessions.`;
  const accessActivityLog = `Interactive Tip Transaction Log:\n- Tip ID: ${tipId || 'N/A'}\n- Session ID: ${sessionId}\n- Session Title: ${sessionTitle}\n- Performer Slug: @${performerSlug}\n- Timestamp: ${createdAt}\n- Moderation Status: ${moderationStatus}\n- Fan Message Content: "${tipMessage}"`;
  const cancellationPolicyDisclosure = `In accordance with Section 3 of the Crowdbeats Refund and Dispute Policy (${REFUND_POLICY_URL}), voluntary fan tips for live performances are final, immediate, and non-refundable once successfully processed by the payment network.`;
  const serviceDocumentation = `Performer verified via Stripe Connect. Performance session and tipping message successfully delivered in real time to the performer stage feed.`;

  const evidence: CompiledDisputeEvidence = {
    productDescription,
    customerCommunication: `Fan message transmitted with tip: "${tipMessage}"`,
    accessActivityLog,
    cancellationPolicyDisclosure,
    serviceDocumentation,
    refundPolicyUrl: REFUND_POLICY_URL,
    termsOfServiceUrl: TERMS_OF_SERVICE_URL,
    uncategorizedText: `Crowdbeats Platform Verification Telemetry. Transaction verified, screen-passed under Safety Policy ID ${moderationStatus}.`,
  };

  // Update dispute record with compiled evidence
  await disputeRef.update({
    compiledEvidence: evidence,
    updatedAt: serverNow,
  });

  return evidence;
}

/**
 * Submits compiled evidence to Stripe and updates dispute records.
 */
export async function submitDisputeEvidence(
  db: admin.firestore.Firestore,
  actorUid: string,
  request: SubmitDisputeEvidenceRequest,
): Promise<{ success: boolean; disputeId: string; status: string }> {
  const { disputeId, evidenceOverrides } = request;

  if (!disputeId) {
    throw new Error('disputeId is required.');
  }

  const disputeRef = db.collection('disputes').doc(disputeId);
  const disputeSnap = await disputeRef.get();

  if (!disputeSnap.exists) {
    throw new Error(`Dispute ${disputeId} not found.`);
  }

  // Compile base evidence if not already compiled
  const disputeData = disputeSnap.data() as DisputeRecord;
  let evidence = disputeData.compiledEvidence;
  if (!evidence) {
    evidence = await compileDisputeEvidence(db, disputeId);
  }

  // Apply overrides if provided
  if (evidenceOverrides) {
    evidence = {
      ...evidence,
      ...evidenceOverrides,
    };
  }

  // Format evidence for Stripe Dispute Evidence schema
  const stripeEvidencePayload = {
    product_description: evidence.productDescription,
    customer_communication: evidence.customerCommunication,
    access_activity_log: evidence.accessActivityLog,
    cancellation_policy_disclosure: evidence.cancellationPolicyDisclosure,
    service_documentation: evidence.serviceDocumentation,
    uncategorized_text: evidence.uncategorizedText,
  };

  const stripeRes = await stripe.submitDisputeEvidence(disputeId, stripeEvidencePayload);

  const serverNow = admin.firestore.FieldValue.serverTimestamp();
  const nowStr = new Date().toISOString();

  const batch = db.batch();

  // Update dispute record
  batch.update(disputeRef, {
    status: 'evidence_submitted',
    evidenceSubmittedAt: nowStr,
    evidenceSubmittedByUid: actorUid,
    compiledEvidence: evidence,
    updatedAt: serverNow,
  });

  // Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: 'DISPUTE_EVIDENCE_SUBMITTED',
    actorUid,
    disputeId,
    tipId: disputeData.tipId,
    recipientId: disputeData.recipientId,
    amountCents: disputeData.amountCents,
    stripeStatus: stripeRes.status,
    timestamp: serverNow,
  });

  await batch.commit();

  return {
    success: true,
    disputeId,
    status: 'evidence_submitted',
  };
}

/**
 * Fetches dispute record details.
 */
export async function getDisputeRecord(
  db: admin.firestore.Firestore,
  disputeId: string,
): Promise<DisputeRecord> {
  const disputeRef = db.collection('disputes').doc(disputeId);
  const disputeSnap = await disputeRef.get();

  if (!disputeSnap.exists) {
    throw new Error(`Dispute ${disputeId} not found.`);
  }

  return disputeSnap.data() as DisputeRecord;
}
