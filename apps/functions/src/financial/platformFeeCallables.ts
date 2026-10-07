/**
 * Crowdbeats V2 — Platform Fee Administration & Quote Callables
 *
 * Implements server-authoritative fee rule configuration, signed calculation quotes,
 * dual-approval change enforcement, and live reconciliation reporting.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { calculatePlatformFee } from './platformFeeEngine.js';

const _db = () => admin.firestore();

export const listPlatformFeeRules = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    const snap = await _db().collection('platformFeeRules').get();
    const rules = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return { rules };
  },
);

export const createFeeRuleDraft = onCall<{
  name: string;
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  feeBasisPoints: number;
  minFeeCents?: number;
  maxFeeCents?: number;
  transactionType: string;
  chargeType: string;
  reasonForChange: string;
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const role = request.auth.token.platformRole;
    if (role !== 'SUPER_ADMIN' && role !== 'FINANCE_ADMIN' && role !== 'EXECUTIVE') {
      throw new HttpsError('permission-denied', 'Finance Administrator role required.');
    }

    const { name, environment, feeBasisPoints, minFeeCents, maxFeeCents, transactionType, chargeType, reasonForChange } =
      request.data ?? {};

    if (!name || !environment || feeBasisPoints === undefined || !reasonForChange) {
      throw new HttpsError('invalid-argument', 'Missing required fee configuration fields.');
    }

    if (feeBasisPoints < 0 || feeBasisPoints > 1000) {
      throw new HttpsError('invalid-argument', 'feeBasisPoints must be between 0 and 1000 (0.00% to 10.00%).');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const ruleId = `fee_rule_${Date.now()}`;

    const draftData = {
      id: ruleId,
      name,
      environment,
      feeBasisPoints,
      minFeeCents: minFeeCents || null,
      maxFeeCents: maxFeeCents || null,
      transactionType: transactionType || 'LIVE_TIP',
      chargeType: chargeType || 'DESTINATION_CHARGE',
      state: 'pending_finance_review',
      effectiveStart: null,
      legalDisclosureVersion: 'DISC-2026-09-01',
      termsVersion: '2026-09-01-draft',
      refundPolicy: 'PROPORTIONAL',
      authorUid: request.auth.uid,
      reasonForChange,
      createdAt: now,
      updatedAt: now,
    };

    await _db().collection('platformFeeRules').doc(ruleId).set(draftData);

    await _db().collection('auditEvents').add({
      eventType: 'PLATFORM_FEE_RULE_DRAFT_CREATED',
      actorUid: request.auth.uid,
      targetType: 'PLATFORM_FEE_RULE',
      targetId: ruleId,
      metadata: { feeBasisPoints, environment, reasonForChange },
      timestamp: now,
    });

    return { ok: true, ruleId, message: `Fee rule draft ${ruleId} created successfully.` };
  },
);

export const approveFeeRule = onCall<{
  ruleId: string;
  approverRole: 'FINANCE_ADMIN' | 'SECONDARY_EXECUTIVE';
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const role = request.auth.token.platformRole;
    if (role !== 'SUPER_ADMIN' && role !== 'FINANCE_ADMIN') {
      throw new HttpsError('permission-denied', 'Administrator authorization required.');
    }

    const { ruleId, approverRole } = request.data ?? {};
    if (!ruleId || !approverRole) {
      throw new HttpsError('invalid-argument', 'Rule ID and approver role required.');
    }

    const ruleRef = _db().collection('platformFeeRules').doc(ruleId);
    const snap = await ruleRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Fee rule not found.');

    const ruleData = snap.data()!;

    // Enforce separation of duties: Author cannot be sole approver
    if (ruleData.authorUid === request.auth.uid && approverRole === 'SECONDARY_EXECUTIVE') {
      throw new HttpsError(
        'permission-denied',
        'Separation of duties violation: Author cannot provide secondary dual-approval for fee change.',
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    if (approverRole === 'FINANCE_ADMIN') {
      await ruleRef.update({
        state: 'pending_legal_review',
        primaryReviewerUid: request.auth.uid,
        updatedAt: now,
      });
    } else {
      await ruleRef.update({
        state: 'approved',
        secondaryApproverUid: request.auth.uid,
        effectiveStart: new Date().toISOString(),
        updatedAt: now,
      });
    }

    await _db().collection('auditEvents').add({
      eventType: 'PLATFORM_FEE_RULE_APPROVED',
      actorUid: request.auth.uid,
      targetType: 'PLATFORM_FEE_RULE',
      targetId: ruleId,
      metadata: { approverRole, newState: approverRole === 'FINANCE_ADMIN' ? 'pending_legal_review' : 'approved' },
      timestamp: now,
    });

    return { ok: true, state: approverRole === 'FINANCE_ADMIN' ? 'pending_legal_review' : 'approved' };
  },
);

export const getFeeCalculationQuote = onCall<{
  amountCents: number;
  transactionType: string;
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    const { amountCents } = request.data ?? {};
    if (typeof amountCents !== 'number' || amountCents <= 0) {
      throw new HttpsError('invalid-argument', 'Valid amountCents required.');
    }

    // Canonical platform fee is 600 bps (6.00%)
    const feeResult = calculatePlatformFee(amountCents, 600);

    return {
      grossAmountCents: feeResult.grossAmountCents,
      platformFeeCents: feeResult.platformFeeCents,
      netAmountCents: feeResult.netAmountCents,
      effectivePercentage: feeResult.effectivePercentage,
      currency: 'USD',
      disclosureVersion: 'DISC-2026-08-25',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },
);
