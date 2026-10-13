/**
 * Crowdbeats V2 — Campaign and Supporter Synchronization Service (Phase 14)
 *
 * Implements server-authoritative logic for:
 * - Story-to-Launch lifecycle (draft -> submitted -> review/approve -> active -> completed)
 * - Payment-confirmed contribution processing with Stripe payment intents and webhooks
 * - Reward tier claim and fulfillment tracking
 * - Contribution refunding with ledger reversal and CRM synchronization
 * - Admin campaign oversight and moderation
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '../lib/stripe.js';
import { recordCrmEvent } from '../crm/crmService';
import type {
  CampaignStatus,
  RewardTier,
  RewardFulfillmentStatus,
  CampaignContributionDetail,
  AdminCampaignOverview,
  CreateContributionIntentRequest,
  CreateContributionIntentResponse,
  ReviewCampaignRequest,
  ReviewCampaignResponse,
  UpdateRewardFulfillmentRequest,
  UpdateRewardFulfillmentResponse,
  RefundContributionRequest,
  RefundContributionResponse,
  GetAdminCampaignsRequest,
  GetAdminCampaignsResponse,
  GetCampaignContributorsRequest,
  GetCampaignContributorsResponse,
} from '@crowdbeats/contracts';

const STAFF_ROLES = [
  'SUPER_ADMIN',
  'EXECUTIVE',
  'CUSTOMER_SUPPORT',
  'TRUST_SAFETY',
  'ARTIST_RELATIONS',
  'FINANCE_ANALYST',
  'FINANCE_ADMIN',
  'COMMUNITY_MODERATOR',
] as const;

export class CampaignSyncService {
  private _db?: admin.firestore.Firestore;

  constructor(db?: admin.firestore.Firestore) {
    if (db) this._db = db;
  }

  private get db(): admin.firestore.Firestore {
    if (!this._db) {
      if (admin.apps.length === 0) admin.initializeApp();
      this._db = admin.firestore();
    }
    return this._db;
  }

  // ── Authorization Helpers ──────────────────────────────────────────────────

  private isStaff(tokenRoles?: string[]): boolean {
    if (!tokenRoles || !Array.isArray(tokenRoles)) return false;
    return tokenRoles.some((r) => (STAFF_ROLES as readonly string[]).includes(r));
  }

  private async canManageCampaign(campaign: admin.firestore.DocumentData, uid: string, tokenRoles?: string[]): Promise<boolean> {
    if (this.isStaff(tokenRoles)) return true;
    if (campaign['creatorId'] === uid) return true;
    if (campaign['creatorType'] === 'band') {
      const bandMemberDoc = await this.db
        .collection('bands')
        .doc(campaign['creatorId'])
        .collection('members')
        .doc(uid)
        .get();
      if (bandMemberDoc.exists && bandMemberDoc.data()?.['status'] === 'ACTIVE') {
        const role = bandMemberDoc.data()?.['role'];
        return role === 'BAND_FOUNDER' || role === 'BAND_ADMIN';
      }
    }
    return false;
  }

  private async canReadCampaignContributions(campaign: admin.firestore.DocumentData, uid: string, tokenRoles?: string[]): Promise<boolean> {
    if (this.isStaff(tokenRoles)) return true;
    if (campaign['creatorId'] === uid) return true;
    if (campaign['creatorType'] === 'band') {
      const bandMemberDoc = await this.db
        .collection('bands')
        .doc(campaign['creatorId'])
        .collection('members')
        .doc(uid)
        .get();
      return bandMemberDoc.exists && bandMemberDoc.data()?.['status'] === 'ACTIVE';
    }
    return false;
  }

  // ── 1. Create Contribution Intent ──────────────────────────────────────────

  async createContributionIntent(
    callerUid: string,
    data: CreateContributionIntentRequest,
  ): Promise<CreateContributionIntentResponse> {
    const { campaignId, amountCents, tierId, isAnonymous, message, idempotencyKey } = data;

    if (!campaignId) {
      throw new HttpsError('invalid-argument', 'campaignId is required.');
    }
    if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 100) {
      throw new HttpsError('invalid-argument', 'amountCents must be an integer >= 100 ($1.00 minimum).');
    }

    const campaignRef = this.db.collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Campaign not found.');
    }

    const campaign = snap.data()!;
    if (campaign['status'] !== 'active') {
      throw new HttpsError('failed-precondition', `Campaign is not active (current: ${campaign['status']}).`);
    }

    const deadline = campaign['deadline'] as string | undefined;
    if (deadline && new Date(deadline).getTime() <= Date.now()) {
      throw new HttpsError('failed-precondition', 'Campaign deadline has passed.');
    }

    // Verify Reward Tier if selected
    let selectedTier: RewardTier | undefined;
    if (tierId) {
      const tiers = (campaign['rewardTiers'] || []) as RewardTier[];
      selectedTier = tiers.find((t) => t.tierId === tierId);
      if (!selectedTier) {
        throw new HttpsError('not-found', `Reward tier not found: ${tierId}`);
      }
      if (amountCents < selectedTier.amountCents) {
        throw new HttpsError(
          'invalid-argument',
          `Contribution amount ($${(amountCents / 100).toFixed(2)}) is less than tier minimum ($${(selectedTier.amountCents / 100).toFixed(2)}).`,
        );
      }
      if (
        typeof selectedTier.quantityAvailable === 'number' &&
        (selectedTier.quantityClaimed || 0) >= selectedTier.quantityAvailable
      ) {
        throw new HttpsError('failed-precondition', 'This reward tier has reached its quantity limit.');
      }
    }

    const currency = (campaign['currency'] as string | undefined ?? 'USD').toUpperCase();
    const contributionId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Standard 6% Crowdbeats platform fee configuration
    const platformFeeCents = Math.round(amountCents * 0.06);

    // Call Stripe to create PaymentIntent with campaign contribution metadata
    const pi = await stripe.createPaymentIntent({
      amountCents,
      currency,
      customerId: callerUid,
      metadata: {
        type: 'campaign_contribution',
        campaignId,
        contributionId,
        fanUid: callerUid,
        tierId: tierId || '',
        platformFeeCents: String(platformFeeCents),
      },
    });

    const contribData = {
      contributionId,
      campaignId,
      creatorId: campaign['creatorId'],
      creatorType: campaign['creatorType'] || 'artist',
      fanUid: callerUid,
      amountCents,
      currency,
      tierId: tierId || null,
      rewardTierTitle: selectedTier?.title || null,
      status: 'pending',
      isAnonymous: Boolean(isAnonymous),
      message: message ? String(message).slice(0, 500) : null,
      fulfillmentStatus: tierId ? ('pending' as RewardFulfillmentStatus) : null,
      stripePaymentIntentId: pi.id,
      idempotencyKey: idempotencyKey || uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    // Store in both campaign subcollection and top-level collection for unified access
    const batch = this.db.batch();
    batch.set(campaignRef.collection('contributions').doc(contributionId), contribData);
    batch.set(this.db.collection('contributions').doc(contributionId), contribData);
    await batch.commit();

    return {
      clientSecret: pi.client_secret,
      contributionId,
      stripePaymentIntentId: pi.id,
      amountCents,
      currency,
    };
  }

  // ── 2. Handle Confirmed Payment from Stripe Webhook ────────────────────────

  async handleCampaignContributionSucceeded(pi: Record<string, unknown>): Promise<void> {
    const metadata = (pi['metadata'] || {}) as Record<string, string>;
    const campaignId = metadata['campaignId'];
    const contributionId = metadata['contributionId'];
    const fanUid = metadata['fanUid'];
    const tierId = metadata['tierId'] || null;

    if (!campaignId || !contributionId) {
      console.warn('handleCampaignContributionSucceeded: missing campaignId or contributionId in metadata', pi['id']);
      return;
    }

    const campaignRef = this.db.collection('campaigns').doc(campaignId);
    const contribRef = campaignRef.collection('contributions').doc(contributionId);
    const globalContribRef = this.db.collection('contributions').doc(contributionId);

    let creatorId = '';
    let creatorType: 'artist' | 'band' = 'artist';

    await this.db.runTransaction(async (tx) => {
      const [campaignSnap, contribSnap] = await Promise.all([
        tx.get(campaignRef),
        tx.get(contribRef),
      ]);

      if (!campaignSnap.exists || !contribSnap.exists) {
        throw new Error(`Campaign ${campaignId} or Contribution ${contributionId} not found.`);
      }

      const contribData = contribSnap.data()!;
      // Idempotency: if already captured, no-op (prevents duplicate money)
      if (contribData['status'] === 'captured' || contribData['status'] === 'succeeded') {
        return;
      }

      const campaignData = campaignSnap.data()!;
      const amountCents = contribData['amountCents'] as number;
      const currency = contribData['currency'] || 'USD';
      creatorId = campaignData['creatorId'] as string;
      creatorType = (campaignData['creatorType'] || 'artist') as 'artist' | 'band';
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Check if fan has contributed before to this campaign (for backerCount)
      const priorContribsSnap = await campaignRef
        .collection('contributions')
        .where('fanUid', '==', fanUid)
        .where('status', '==', 'captured')
        .limit(1)
        .get();

      const isFirstContribution = priorContribsSnap.empty;

      const currentPledged = (campaignData['pledgedCents'] || campaignData['raisedAmountCents'] || 0) as number;
      const newPledged = currentPledged + amountCents;
      const goalCents = (campaignData['goalCents'] || campaignData['goalAmountCents'] || 1) as number;
      const isGoalMet = newPledged >= goalCents;

      // Update reward tier claimed count if applicable
      let updatedTiers = campaignData['rewardTiers'] as RewardTier[] | undefined;
      if (tierId && Array.isArray(updatedTiers)) {
        updatedTiers = updatedTiers.map((t) => {
          if (t.tierId === tierId) {
            return {
              ...t,
              quantityClaimed: (t.quantityClaimed || 0) + 1,
            };
          }
          return t;
        });
      }

      // ── Update contribution status ─────────────────────────────────────────
      tx.update(contribRef, {
        status: 'captured',
        processedAt: now,
        updatedAt: now,
      });

      tx.set(
        globalContribRef,
        {
          status: 'captured',
          processedAt: now,
          updatedAt: now,
        },
        { merge: true },
      );

      // ── Update campaign progress ───────────────────────────────────────────
      const campaignUpdates: Record<string, unknown> = {
        pledgedCents: newPledged,
        raisedAmountCents: newPledged,
        backerCount: (campaignData['backerCount'] || 0) + (isFirstContribution ? 1 : 0),
        contributionCount: (campaignData['contributionCount'] || 0) + 1,
        updatedAt: now,
      };

      if (updatedTiers) {
        campaignUpdates['rewardTiers'] = updatedTiers;
      }
      if (isGoalMet) {
        campaignUpdates['isGoalMet'] = true;
      }

      tx.update(campaignRef, campaignUpdates);

      // ── Dual-Entry Ledger (Zero Negative Balance & Reconciliation Invariant)
      const platformFeeCents = Math.round(amountCents * 0.06);
      const creatorCreditCents = amountCents - platformFeeCents;

      // Debit Fan
      const debitRef = this.db.collection('paymentLedger').doc();
      tx.set(debitRef, {
        entryId: debitRef.id,
        type: 'DEBIT',
        accountId: fanUid,
        amountCents,
        currency,
        referenceType: 'CAMPAIGN_CONTRIBUTION',
        referenceId: contributionId,
        campaignId,
        createdAt: now,
      });

      // Credit Creator
      const creditRef = this.db.collection('paymentLedger').doc();
      tx.set(creditRef, {
        entryId: creditRef.id,
        type: 'CREDIT',
        accountId: creatorId,
        amountCents: creatorCreditCents,
        currency,
        referenceType: 'CAMPAIGN_CONTRIBUTION',
        referenceId: contributionId,
        campaignId,
        createdAt: now,
      });

      // Credit Platform Fee
      const feeRef = this.db.collection('paymentLedger').doc();
      tx.set(feeRef, {
        entryId: feeRef.id,
        type: 'CREDIT',
        accountId: 'PLATFORM_REVENUE',
        amountCents: platformFeeCents,
        currency,
        referenceType: 'CAMPAIGN_PLATFORM_FEE',
        referenceId: contributionId,
        campaignId,
        createdAt: now,
      });
    });

    // ── Synchronize CRM Event ────────────────────────────────────────────────
    if (creatorId) {
      try {
        await recordCrmEvent(this.db, {
          source: 'campaign_sync',
          action: 'CAMPAIGN_CONTRIBUTION_CONFIRMED',
          actorUid: fanUid,
          actorRole: 'FAN',
          targetId: creatorId,
          targetType: creatorType,
          payload: {
            campaignId,
            contributionId,
            amountCents: Number(pi['amount'] || 0),
            tierId: tierId || null,
          },
        });
      } catch (e) {
        console.error('Failed to log CAMPAIGN_CONTRIBUTION_CONFIRMED CRM event:', e);
      }
    }
  }

  // ── 3. Handle Payment Failed from Stripe Webhook ───────────────────────────

  async handleCampaignContributionFailed(pi: Record<string, unknown>): Promise<void> {
    const metadata = (pi['metadata'] || {}) as Record<string, string>;
    const campaignId = metadata['campaignId'];
    const contributionId = metadata['contributionId'];

    if (!campaignId || !contributionId) return;

    const contribRef = this.db
      .collection('campaigns')
      .doc(campaignId)
      .collection('contributions')
      .doc(contributionId);

    const now = admin.firestore.FieldValue.serverTimestamp();
    await contribRef.set(
      {
        status: 'failed',
        failedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  // ── 4. Refund Campaign Contribution ────────────────────────────────────────

  async refundContribution(
    callerUid: string,
    tokenRoles: string[],
    data: RefundContributionRequest,
  ): Promise<RefundContributionResponse> {
    const { campaignId, contributionId, reason } = data;

    if (!campaignId || !contributionId) {
      throw new HttpsError('invalid-argument', 'campaignId and contributionId are required.');
    }

    const campaignRef = this.db.collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Campaign not found.');
    }

    const campaign = snap.data()!;
    const hasManageAuth = await this.canManageCampaign(campaign, callerUid, tokenRoles);
    if (!hasManageAuth) {
      throw new HttpsError('permission-denied', 'Unauthorized to refund contributions for this campaign.');
    }

    const contribRef = campaignRef.collection('contributions').doc(contributionId);
    const contribSnap = await contribRef.get();
    if (!contribSnap.exists) {
      throw new HttpsError('not-found', 'Contribution not found.');
    }

    const contribData = contribSnap.data()!;
    if (contribData['status'] === 'refunded') {
      throw new HttpsError('failed-precondition', 'Contribution has already been refunded.');
    }
    if (contribData['status'] !== 'captured' && contribData['status'] !== 'succeeded') {
      throw new HttpsError('failed-precondition', `Cannot refund contribution in status ${contribData['status']}.`);
    }

    const amountCents = contribData['amountCents'] as number;
    const piId = contribData['stripePaymentIntentId'] as string;

    // Issue Stripe refund
    await stripe.createRefund(piId, amountCents);

    const nowIso = new Date().toISOString();
    const serverNow = admin.firestore.FieldValue.serverTimestamp();

    await this.db.runTransaction(async (tx) => {
      const cSnap = await tx.get(campaignRef);
      const cData = cSnap.data()!;
      const currentPledged = (cData['pledgedCents'] || cData['raisedAmountCents'] || 0) as number;
      const newPledged = Math.max(0, currentPledged - amountCents);

      // Decrement tier quantity claimed if applicable
      let updatedTiers = cData['rewardTiers'] as RewardTier[] | undefined;
      const tierId = contribData['tierId'] as string | null;
      if (tierId && Array.isArray(updatedTiers)) {
        updatedTiers = updatedTiers.map((t) => {
          if (t.tierId === tierId) {
            return {
              ...t,
              quantityClaimed: Math.max(0, (t.quantityClaimed || 0) - 1),
            };
          }
          return t;
        });
      }

      // Update contribution
      tx.update(contribRef, {
        status: 'refunded',
        refundAmountCents: amountCents,
        refundReason: reason || null,
        refundedAt: serverNow,
        updatedAt: serverNow,
      });

      tx.set(
        this.db.collection('contributions').doc(contributionId),
        {
          status: 'refunded',
          refundAmountCents: amountCents,
          refundReason: reason || null,
          refundedAt: serverNow,
          updatedAt: serverNow,
        },
        { merge: true },
      );

      // Update campaign
      const cUpdates: Record<string, unknown> = {
        pledgedCents: newPledged,
        raisedAmountCents: newPledged,
        updatedAt: serverNow,
      };
      if (updatedTiers) {
        cUpdates['rewardTiers'] = updatedTiers;
      }
      tx.update(campaignRef, cUpdates);

      // Ledger reversal
      const revRef = this.db.collection('paymentLedger').doc();
      tx.set(revRef, {
        entryId: revRef.id,
        type: 'REVERSAL',
        accountId: contribData['fanUid'],
        amountCents,
        currency: contribData['currency'] || 'USD',
        referenceType: 'CAMPAIGN_REFUND',
        referenceId: contributionId,
        campaignId,
        createdAt: serverNow,
      });
    });

    // Record CRM Event
    try {
      await recordCrmEvent(this.db, {
        source: 'campaign_sync',
        action: 'CAMPAIGN_CONTRIBUTION_REFUNDED',
        actorUid: callerUid,
        actorRole: this.isStaff(tokenRoles) ? 'STAFF' : 'CREATOR',
        targetId: campaign['creatorId'],
        targetType: (campaign['creatorType'] === 'band' ? 'band' : 'artist'),
        payload: {
          campaignId,
          contributionId,
          refundedAmountCents: amountCents,
          reason: reason || null,
        },
      });
    } catch (e) {
      console.error('Failed to log CAMPAIGN_CONTRIBUTION_REFUNDED CRM event:', e);
    }

    return {
      success: true,
      contributionId,
      refundedAmountCents: amountCents,
      status: 'refunded',
      refundedAt: nowIso,
    };
  }

  // ── 5. Review Campaign (Moderation / Admin) ────────────────────────────────

  async reviewCampaign(
    callerUid: string,
    tokenRoles: string[],
    data: ReviewCampaignRequest,
  ): Promise<ReviewCampaignResponse> {
    if (!this.isStaff(tokenRoles)) {
      throw new HttpsError('permission-denied', 'Staff authorization required to review campaigns.');
    }

    const { campaignId, decision, notes, rejectionReason } = data;
    if (!campaignId || !['approve', 'reject', 'flag'].includes(decision)) {
      throw new HttpsError('invalid-argument', 'campaignId and valid decision (approve, reject, flag) are required.');
    }

    const campaignRef = this.db.collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Campaign not found.');
    }

    let nextStatus: CampaignStatus;
    if (decision === 'approve') nextStatus = 'approved';
    else if (decision === 'reject') nextStatus = 'rejected';
    else nextStatus = 'flagged';

    const nowIso = new Date().toISOString();
    const serverNow = admin.firestore.FieldValue.serverTimestamp();

    await campaignRef.update({
      status: nextStatus,
      reviewNotes: notes || null,
      rejectionReason: decision === 'reject' ? (rejectionReason || notes || null) : null,
      reviewedAt: serverNow,
      reviewerUid: callerUid,
      updatedAt: serverNow,
    });

    // Audit log
    await this.db.collection('auditEvents').add({
      type: `campaign_${decision}d`,
      actorUid: callerUid,
      resourceId: campaignId,
      resourceType: 'campaign',
      decision,
      notes: notes || null,
      createdAt: serverNow,
    });

    return {
      campaignId,
      status: nextStatus,
      reviewedAt: nowIso,
    };
  }

  // ── 6. Update Reward Fulfillment ───────────────────────────────────────────

  async updateRewardFulfillment(
    callerUid: string,
    tokenRoles: string[],
    data: UpdateRewardFulfillmentRequest,
  ): Promise<UpdateRewardFulfillmentResponse> {
    const { campaignId, contributionId, fulfillmentStatus, trackingNumber, carrier, notes } = data;

    if (!campaignId || !contributionId || !fulfillmentStatus) {
      throw new HttpsError('invalid-argument', 'campaignId, contributionId, and fulfillmentStatus are required.');
    }

    const campaignRef = this.db.collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Campaign not found.');

    const campaign = snap.data()!;
    const hasManageAuth = await this.canManageCampaign(campaign, callerUid, tokenRoles);
    if (!hasManageAuth) {
      throw new HttpsError('permission-denied', 'Unauthorized to update fulfillment on this campaign.');
    }

    const contribRef = campaignRef.collection('contributions').doc(contributionId);
    const contribSnap = await contribRef.get();
    if (!contribSnap.exists) throw new HttpsError('not-found', 'Contribution not found.');

    const nowIso = new Date().toISOString();
    const serverNow = admin.firestore.FieldValue.serverTimestamp();

    const patch: Record<string, unknown> = {
      fulfillmentStatus,
      trackingNumber: trackingNumber || null,
      carrier: carrier || null,
      fulfillmentNotes: notes || null,
      fulfillmentUpdatedAt: serverNow,
      updatedAt: serverNow,
    };

    const batch = this.db.batch();
    batch.update(contribRef, patch);
    batch.set(this.db.collection('contributions').doc(contributionId), patch, { merge: true });
    await batch.commit();

    return {
      success: true,
      contributionId,
      fulfillmentStatus,
      updatedAt: nowIso,
    };
  }

  // ── 7. Get Admin Campaigns Overview ────────────────────────────────────────

  async getAdminCampaigns(
    callerUid: string,
    tokenRoles: string[],
    data: GetAdminCampaignsRequest,
  ): Promise<GetAdminCampaignsResponse> {
    if (!this.isStaff(tokenRoles)) {
      throw new HttpsError('permission-denied', 'Staff permissions required.');
    }

    const { status, limit = 50, cursor, searchQuery } = data;

    let query: admin.firestore.Query = this.db.collection('campaigns');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc').limit(limit + 1);

    if (cursor) {
      const cursorDoc = await this.db.collection('campaigns').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const hasMore = snap.docs.length > limit;
    const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;
    const nextCursor = hasMore ? docs[docs.length - 1].id : undefined;

    // Aggregate stats across the collection
    const allCampaignsSnap = await this.db.collection('campaigns').get();
    let totalPledgedCents = 0;
    let activeCampaigns = 0;
    let pendingReviewCount = 0;

    for (const d of allCampaignsSnap.docs) {
      const data = d.data();
      totalPledgedCents += (data['pledgedCents'] || data['raisedAmountCents'] || 0) as number;
      if (data['status'] === 'active') activeCampaigns++;
      if (data['status'] === 'submitted') pendingReviewCount++;
    }

    // Hydrate creator profiles
    const creatorIds = Array.from(new Set(docs.map((d) => d.data()['creatorId'] as string)));
    const creatorMap = new Map<string, { name: string; verified: boolean }>();

    for (const cid of creatorIds) {
      const uDoc = await this.db.collection('users').doc(cid).get();
      if (uDoc.exists) {
        const u = uDoc.data()!;
        creatorMap.set(cid, {
          name: u['displayName'] || u['username'] || 'Unknown Creator',
          verified: Boolean(u['isVerified'] || u['verified']),
        });
      } else {
        creatorMap.set(cid, { name: 'Unknown Creator', verified: false });
      }
    }

    const campaigns: AdminCampaignOverview[] = docs.map((d) => {
      const c = d.data();
      const creatorInfo = creatorMap.get(c['creatorId']) || { name: 'Unknown Creator', verified: false };
      const tiers = (c['rewardTiers'] || []) as RewardTier[];

      return {
        campaignId: d.id,
        title: c['title'] || 'Untitled Campaign',
        creatorId: c['creatorId'],
        creatorName: creatorInfo.name,
        creatorType: c['creatorType'] || 'artist',
        creatorVerified: creatorInfo.verified,
        goalCents: c['goalCents'] || c['goalAmountCents'] || 0,
        pledgedCents: c['pledgedCents'] || c['raisedAmountCents'] || 0,
        backerCount: c['backerCount'] || 0,
        status: c['status'] || 'draft',
        submittedAt: c['submittedAt']?.toDate ? c['submittedAt'].toDate().toISOString() : c['submittedAt'],
        createdAt: c['createdAt']?.toDate ? c['createdAt'].toDate().toISOString() : c['createdAt'] || new Date().toISOString(),
        deadline: c['deadline'] || new Date().toISOString(),
        flagsCount: c['flagsCount'] || 0,
        rewardTiersCount: tiers.length,
        fulfillmentSummary: {
          totalClaimed: tiers.reduce((sum, t) => sum + (t.quantityClaimed || 0), 0),
          pendingCount: 0,
          deliveredCount: 0,
        },
      };
    });

    const filtered = searchQuery
      ? campaigns.filter(
          (c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.creatorName.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : campaigns;

    return {
      campaigns: filtered,
      stats: {
        totalCampaigns: allCampaignsSnap.size,
        activeCampaigns,
        totalPledgedCents,
        pendingReviewCount,
      },
      nextCursor,
    };
  }

  // ── 8. Get Campaign Contributors Ledger ───────────────────────────────────

  async getCampaignContributors(
    callerUid: string,
    tokenRoles: string[],
    data: GetCampaignContributorsRequest,
  ): Promise<GetCampaignContributorsResponse> {
    const { campaignId, limit = 50, cursor } = data;

    if (!campaignId) {
      throw new HttpsError('invalid-argument', 'campaignId is required.');
    }

    const campaignRef = this.db.collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Campaign not found.');

    const campaign = snap.data()!;
    const canRead = await this.canReadCampaignContributions(campaign, callerUid, tokenRoles);
    if (!canRead) {
      throw new HttpsError('permission-denied', 'Unauthorized to view contributors for this campaign.');
    }

    let query: admin.firestore.Query = campaignRef
      .collection('contributions')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await campaignRef.collection('contributions').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const contribSnap = await query.get();
    const hasMore = contribSnap.docs.length > limit;
    const docs = hasMore ? contribSnap.docs.slice(0, limit) : contribSnap.docs;
    const nextCursor = hasMore ? docs[docs.length - 1].id : undefined;

    // Hydrate backer names (respecting isAnonymous)
    const fanUids = Array.from(new Set(docs.map((d) => d.data()['fanUid'] as string)));
    const fanMap = new Map<string, { displayName: string; avatarUrl?: string }>();

    for (const fUid of fanUids) {
      const uDoc = await this.db.collection('users').doc(fUid).get();
      if (uDoc.exists) {
        const u = uDoc.data()!;
        fanMap.set(fUid, {
          displayName: u['displayName'] || u['username'] || 'Fan',
          avatarUrl: u['avatarUrl'],
        });
      }
    }

    const contributions: CampaignContributionDetail[] = docs.map((d) => {
      const c = d.data();
      const isAnon = Boolean(c['isAnonymous']);
      const fanInfo = fanMap.get(c['fanUid']);

      return {
        contributionId: d.id,
        campaignId,
        fanUid: c['fanUid'],
        amountCents: c['amountCents'] || 0,
        currency: c['currency'] || 'USD',
        tierId: c['tierId'] || undefined,
        rewardTierTitle: c['rewardTierTitle'] || undefined,
        stripePaymentIntentId: c['stripePaymentIntentId'] || '',
        status: c['status'] || 'pending',
        isAnonymous: isAnon,
        message: c['message'] || undefined,
        fulfillmentStatus: c['fulfillmentStatus'] || undefined,
        trackingNumber: c['trackingNumber'] || undefined,
        carrier: c['carrier'] || undefined,
        notes: c['fulfillmentNotes'] || undefined,
        idempotencyKey: c['idempotencyKey'] || '',
        createdAt: c['createdAt']?.toDate ? c['createdAt'].toDate().toISOString() : c['createdAt'] || new Date().toISOString(),
        processedAt: c['processedAt']?.toDate ? c['processedAt'].toDate().toISOString() : c['processedAt'],
        refundedAt: c['refundedAt']?.toDate ? c['refundedAt'].toDate().toISOString() : c['refundedAt'],
        refundAmountCents: c['refundAmountCents'],
        backerName: isAnon ? 'Anonymous Supporter' : fanInfo?.displayName || 'Supporter',
        backerAvatarUrl: isAnon ? undefined : fanInfo?.avatarUrl,
        campaignTitle: campaign['title'] || 'Campaign',
      };
    });

    return {
      contributions,
      totalPledgedCents: campaign['pledgedCents'] || campaign['raisedAmountCents'] || 0,
      backerCount: campaign['backerCount'] || 0,
      nextCursor,
    };
  }
}

export const campaignSyncService = new CampaignSyncService();
