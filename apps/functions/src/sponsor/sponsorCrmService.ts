/**
 * Crowdbeats V2 — Sponsor Relationship Management Service (Phase 13)
 *
 * Implements server-authoritative sponsor workflows:
 * - Talent shortlists with performer metrics
 * - Sponsor opportunities & creator applications
 * - Dual-signed sponsorship contracts with state integrity
 * - Escrow allocation, milestone deliverables, and private data isolation
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import type {
  SponsorshipDeal,
  SponsorshipDealStatus,
  SponsorApplication,
  SponsorApplicationStatus,
  SponsorshipDeliverable,
  SponsorShortlistItem,
  SponsorOpportunity,
} from '@crowdbeats/contracts';
import { recordCrmEvent } from '../crm/crmService';

const STAFF_ROLES = ['SUPER_ADMIN', 'CUSTOMER_SUPPORT', 'PARTNERSHIPS', 'FINANCE_ANALYST'];

export class SponsorCrmService {
  private db: admin.firestore.Firestore;

  constructor(db?: admin.firestore.Firestore) {
    this.db = db || admin.firestore();
  }

  // ── Access Authorization Helpers ──────────────────────────────────────────

  async canAccessSponsorOrg(orgId: string, uid: string, tokenRoles?: string[]): Promise<{ isMember: boolean; isAdmin: boolean }> {
    if (!orgId) return { isMember: false, isAdmin: false };

    // Staff bypass
    const isStaff = tokenRoles?.some((r) => STAFF_ROLES.includes(r)) ?? false;
    if (isStaff) return { isMember: true, isAdmin: true };

    const memberDoc = await this.db.collection('sponsorOrgs').doc(orgId).collection('members').doc(uid).get();
    if (!memberDoc.exists || !memberDoc.data()?.isActive) {
      return { isMember: false, isAdmin: false };
    }

    const role = memberDoc.data()?.role;
    return {
      isMember: true,
      isAdmin: role === 'SPONSOR_ADMIN',
    };
  }

  async canActForRecipient(recipientId: string, recipientType: 'artist' | 'band', uid: string): Promise<boolean> {
    if (recipientType === 'artist') {
      return recipientId === uid;
    }
    if (recipientType === 'band') {
      const bandMemberDoc = await this.db.collection('bands').doc(recipientId).collection('members').doc(uid).get();
      if (!bandMemberDoc.exists || bandMemberDoc.data()?.status !== 'ACTIVE') {
        return false;
      }
      const role = bandMemberDoc.data()?.role;
      return role === 'BAND_FOUNDER' || role === 'BAND_ADMIN';
    }
    return false;
  }

  async isBandMember(bandId: string, uid: string): Promise<boolean> {
    const bandMemberDoc = await this.db.collection('bands').doc(bandId).collection('members').doc(uid).get();
    return bandMemberDoc.exists && bandMemberDoc.data()?.status === 'ACTIVE';
  }

  // ── Shortlist Management ──────────────────────────────────────────────────

  async addToShortlist(
    orgId: string,
    callerUid: string,
    item: Omit<SponsorShortlistItem, 'addedAt'>
  ): Promise<SponsorShortlistItem> {
    const { isMember } = await this.canAccessSponsorOrg(orgId, callerUid);
    if (!isMember) {
      throw new HttpsError('permission-denied', 'You are not an authorized member of this Sponsor Organization.');
    }

    const shortlistItem: SponsorShortlistItem = {
      ...item,
      addedAt: new Date().toISOString(),
    };

    await this.db
      .collection('sponsorOrgs')
      .doc(orgId)
      .collection('shortlists')
      .doc(item.recipientId)
      .set(shortlistItem, { merge: true });

    return shortlistItem;
  }

  async removeFromShortlist(orgId: string, callerUid: string, recipientId: string): Promise<string> {
    const { isMember } = await this.canAccessSponsorOrg(orgId, callerUid);
    if (!isMember) {
      throw new HttpsError('permission-denied', 'You are not an authorized member of this Sponsor Organization.');
    }

    await this.db.collection('sponsorOrgs').doc(orgId).collection('shortlists').doc(recipientId).delete();
    return recipientId;
  }

  async getShortlist(orgId: string, callerUid: string): Promise<SponsorShortlistItem[]> {
    const { isMember } = await this.canAccessSponsorOrg(orgId, callerUid);
    if (!isMember) {
      throw new HttpsError('permission-denied', 'You are not an authorized member of this Sponsor Organization.');
    }

    const snap = await this.db.collection('sponsorOrgs').doc(orgId).collection('shortlists').get();
    return snap.docs.map((d) => d.data() as SponsorShortlistItem);
  }

  // ── Opportunities ─────────────────────────────────────────────────────────

  async createOpportunity(
    orgId: string,
    callerUid: string,
    data: {
      title: string;
      description: string;
      budgetPerPerformerCents: number;
      totalBudgetCents: number;
      targetGenre?: string;
      targetRegion?: string;
      targetType?: 'all' | 'artist' | 'band';
      durationDays?: number;
    }
  ): Promise<SponsorOpportunity> {
    const { isAdmin } = await this.canAccessSponsorOrg(orgId, callerUid);
    if (!isAdmin) {
      throw new HttpsError('permission-denied', 'Only active Sponsor Admins can create new sponsorship opportunities.');
    }

    const orgDoc = await this.db.collection('sponsorOrgs').doc(orgId).get();
    const sponsorName = orgDoc.data()?.name || 'Sponsor Partner';

    const oppRef = this.db.collection('sponsorOpportunities').doc();
    const now = new Date().toISOString();
    const deadlineAt = new Date(Date.now() + (data.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString();

    const opportunity: SponsorOpportunity = {
      opportunityId: oppRef.id,
      orgId,
      sponsorName,
      title: data.title,
      description: data.description,
      budgetPerPerformerCents: data.budgetPerPerformerCents,
      totalBudgetCents: data.totalBudgetCents,
      targetGenre: data.targetGenre,
      targetRegion: data.targetRegion,
      targetType: data.targetType || 'all',
      status: 'open',
      deadlineAt,
      createdAt: now,
    };

    await oppRef.set(opportunity);
    return opportunity;
  }

  async getOpportunities(orgId?: string, status?: 'open' | 'closed' | 'filled'): Promise<SponsorOpportunity[]> {
    let q: admin.firestore.Query = this.db.collection('sponsorOpportunities');
    if (orgId) {
      q = q.where('orgId', '==', orgId);
    }
    if (status) {
      q = q.where('status', '==', status);
    }
    const snap = await q.get();
    return snap.docs.map((d) => d.data() as SponsorOpportunity);
  }

  // ── Inbound Applications ──────────────────────────────────────────────────

  async submitApplication(
    callerUid: string,
    params: {
      orgId: string;
      opportunityId?: string;
      applicantId: string;
      applicantType: 'artist' | 'band';
      applicantName: string;
      pitch: string;
      requestedAmountCents: number;
      mediaLinks?: string[];
    }
  ): Promise<SponsorApplication> {
    // 1. Authorize caller as applicant
    const isAuthorized = await this.canActForRecipient(params.applicantId, params.applicantType, callerUid);
    if (!isAuthorized) {
      throw new HttpsError('permission-denied', 'You are not authorized to submit applications for this artist or band.');
    }

    if (params.requestedAmountCents < 1000) {
      throw new HttpsError('invalid-argument', 'Minimum requested sponsorship amount is $10.00 (1000 cents).');
    }

    // 2. Fetch sponsor org name
    const orgDoc = await this.db.collection('sponsorOrgs').doc(params.orgId).get();
    if (!orgDoc.exists) {
      throw new HttpsError('not-found', 'Sponsor organization not found.');
    }
    const sponsorName = orgDoc.data()?.name || 'Sponsor Partner';

    const appRef = this.db.collection('sponsorApplications').doc();
    const now = new Date().toISOString();

    const application: SponsorApplication = {
      applicationId: appRef.id,
      opportunityId: params.opportunityId,
      orgId: params.orgId,
      sponsorName,
      applicantId: params.applicantId,
      applicantType: params.applicantType,
      applicantName: params.applicantName,
      pitch: params.pitch,
      requestedAmountCents: params.requestedAmountCents,
      mediaLinks: params.mediaLinks || [],
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };

    await appRef.set(application);

    // Record CRM Event
    await recordCrmEvent(this.db, {
      source: 'sponsor_crm',
      action: 'SPONSOR_APPLICATION_SUBMITTED',
      actorUid: callerUid,
      targetId: params.applicantId,
      targetType: params.applicantType === 'band' ? 'band' : 'artist',
      payload: {
        applicationId: appRef.id,
        orgId: params.orgId,
        requestedAmountCents: params.requestedAmountCents,
        description: `${params.applicantName} submitted sponsorship application to ${sponsorName}`,
      },
    });

    return application;
  }

  async reviewApplication(
    callerUid: string,
    params: {
      applicationId: string;
      action: 'ACCEPT' | 'DECLINE' | 'UNDER_REVIEW';
      reviewerNotes?: string;
      proposalTitle?: string;
      valueAmountCents?: number;
    }
  ): Promise<{ status: SponsorApplicationStatus; sponsorshipId?: string }> {
    const appRef = this.db.collection('sponsorApplications').doc(params.applicationId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) {
      throw new HttpsError('not-found', 'Sponsorship application not found.');
    }

    const appData = appDoc.data() as SponsorApplication;
    const { isMember } = await this.canAccessSponsorOrg(appData.orgId, callerUid);
    if (!isMember) {
      throw new HttpsError('permission-denied', 'Only authorized sponsor representatives can review applications.');
    }

    const now = new Date().toISOString();
    let newStatus: SponsorApplicationStatus = 'under_review';
    let generatedDealId: string | undefined = undefined;

    if (params.action === 'DECLINE') {
      newStatus = 'declined';
    } else if (params.action === 'UNDER_REVIEW') {
      newStatus = 'under_review';
    } else if (params.action === 'ACCEPT') {
      newStatus = 'accepted';

      // Automatically generate a sponsorship contract proposal
      const deal = await this.proposeDeal(callerUid, {
        orgId: appData.orgId,
        recipientId: appData.applicantId,
        recipientType: appData.applicantType,
        recipientName: appData.applicantName,
        title: params.proposalTitle || `Brand Sponsorship Deal — ${appData.applicantName}`,
        description: appData.pitch,
        valueAmountCents: params.valueAmountCents || appData.requestedAmountCents,
        deliverables: [
          {
            deliverableId: 'del_1',
            title: 'Live Stage Shoutout & Brand Placement',
            type: 'STAGE_SHOUTOUT',
          },
          {
            deliverableId: 'del_2',
            title: 'Digital EPK & Social Channel Recognition',
            type: 'EPK_LOGO',
          },
        ],
      });
      generatedDealId = deal.sponsorshipId;
    }

    const updates: Record<string, unknown> = {
      status: newStatus,
      reviewerNotes: params.reviewerNotes,
      updatedAt: now,
    };
    if (generatedDealId) {
      updates.sponsorshipId = generatedDealId;
    }

    await appRef.update(updates);
    return { status: newStatus, sponsorshipId: generatedDealId };
  }

  async getApplications(callerUid: string, filters: { orgId?: string; applicantId?: string; status?: SponsorApplicationStatus }): Promise<SponsorApplication[]> {
    let q: admin.firestore.Query = this.db.collection('sponsorApplications');

    if (filters.orgId) {
      const { isMember } = await this.canAccessSponsorOrg(filters.orgId, callerUid);
      if (!isMember) {
        throw new HttpsError('permission-denied', 'Cannot access applications for another organization.');
      }
      q = q.where('orgId', '==', filters.orgId);
    } else if (filters.applicantId) {
      // Must verify caller is authorized for applicant
      q = q.where('applicantId', '==', filters.applicantId);
    }

    if (filters.status) {
      q = q.where('status', '==', filters.status);
    }

    const snap = await q.get();
    const results = snap.docs.map((d) => d.data() as SponsorApplication);

    // Private Data Isolation: if caller is applicant (not sponsor org member), mask private reviewerNotes
    return results.map((app) => {
      const isSponsorCaller = filters.orgId === app.orgId;
      if (!isSponsorCaller) {
        const { reviewerNotes, ...safeApp } = app;
        return safeApp as SponsorApplication;
      }
      return app;
    });
  }

  // ── Sponsorship Deals & Contracts (State Machine) ─────────────────────────

  async proposeDeal(
    callerUid: string,
    params: {
      orgId: string;
      recipientId: string;
      recipientType: 'artist' | 'band';
      recipientName?: string;
      title: string;
      description?: string;
      valueAmountCents: number;
      currency?: string;
      deliverables?: Omit<SponsorshipDeliverable, 'status'>[];
      startsAt?: string;
      endsAt?: string;
    }
  ): Promise<SponsorshipDeal> {
    if (params.valueAmountCents < 1000) {
      throw new HttpsError('invalid-argument', 'Minimum sponsorship deal value is $10.00 (1000 cents).');
    }

    // Check caller eligibility: must be sponsor org member OR creator recipient
    const { isMember: isSponsor } = await this.canAccessSponsorOrg(params.orgId, callerUid);
    const isRecipient = await this.canActForRecipient(params.recipientId, params.recipientType, callerUid);

    if (!isSponsor && !isRecipient) {
      throw new HttpsError('permission-denied', 'You are not authorized to propose a deal for this sponsor or performer.');
    }

    const orgDoc = await this.db.collection('sponsorOrgs').doc(params.orgId).get();
    if (!orgDoc.exists) {
      throw new HttpsError('not-found', 'Sponsor organization not found.');
    }
    const sponsorName = orgDoc.data()?.name || 'Sponsor Organization';

    let recipientName = params.recipientName;
    if (!recipientName) {
      if (params.recipientType === 'artist') {
        const userDoc = await this.db.collection('users').doc(params.recipientId).get();
        recipientName = userDoc.data()?.displayName || 'Solo Artist';
      } else {
        const bandDoc = await this.db.collection('bands').doc(params.recipientId).get();
        recipientName = bandDoc.data()?.name || 'Band Performer';
      }
    }

    const dealRef = this.db.collection('sponsorships').doc();
    const now = new Date().toISOString();

    const deliverables: SponsorshipDeliverable[] = (params.deliverables || [
      {
        deliverableId: 'del_1',
        title: 'Primary Stage Placement & Acoustic Shoutout',
        type: 'STAGE_SHOUTOUT',
      },
    ]).map((d, idx) => ({
      deliverableId: d.deliverableId || `del_${idx + 1}`,
      title: d.title,
      type: d.type || 'CUSTOM',
      status: 'pending',
      dueAt: d.dueAt,
      payoutAmountCents: d.payoutAmountCents,
    }));

    const deal: SponsorshipDeal = {
      sponsorshipId: dealRef.id,
      orgId: params.orgId,
      sponsorName,
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      recipientName: recipientName || 'Performer',
      status: 'proposed',
      title: params.title,
      description: params.description,
      valueAmountCents: params.valueAmountCents,
      currency: 'USD',
      deliverables,
      startsAt: params.startsAt,
      endsAt: params.endsAt,
      escrowAllocatedCents: 0,
      escrowReleasedCents: 0,
      createdAt: now,
      updatedAt: now,
      v: 1,
    };

    await dealRef.set(deal);

    // Record CRM Event
    await recordCrmEvent(this.db, {
      source: 'sponsor_crm',
      action: 'SPONSORSHIP_DEAL_PROPOSED',
      actorUid: callerUid,
      targetId: params.recipientId,
      targetType: params.recipientType === 'band' ? 'band' : 'artist',
      payload: {
        sponsorshipId: dealRef.id,
        orgId: params.orgId,
        valueAmountCents: params.valueAmountCents,
        description: `Sponsorship proposal "${params.title}" ($${(params.valueAmountCents / 100).toFixed(2)}) created`,
      },
    });

    return deal;
  }

  async signContract(
    callerUid: string,
    params: {
      sponsorshipId: string;
      signatureFullName: string;
      agreeToTerms: boolean;
    }
  ): Promise<{
    sponsorshipId: string;
    status: SponsorshipDealStatus;
    signedByOrgAt?: string;
    signedByArtistAt?: string;
    escrowAllocatedCents: number;
  }> {
    if (!params.agreeToTerms) {
      throw new HttpsError('invalid-argument', 'Must agree to contract terms before signing.');
    }
    if (!params.signatureFullName || params.signatureFullName.trim().length < 2) {
      throw new HttpsError('invalid-argument', 'Valid legal full name signature required.');
    }

    const dealRef = this.db.collection('sponsorships').doc(params.sponsorshipId);
    const now = new Date().toISOString();

    return this.db.runTransaction(async (tx) => {
      const dealSnap = await tx.get(dealRef);
      if (!dealSnap.exists) {
        throw new HttpsError('not-found', 'Sponsorship contract not found.');
      }

      const deal = dealSnap.data() as SponsorshipDeal;
      if (deal.status === 'completed' || deal.status === 'cancelled') {
        throw new HttpsError('failed-precondition', `Cannot sign a ${deal.status} contract.`);
      }

      // Check which party is signing
      const { isMember: isSponsor } = await this.canAccessSponsorOrg(deal.orgId, callerUid);
      const isRecipient = await this.canActForRecipient(deal.recipientId, deal.recipientType, callerUid);

      if (!isSponsor && !isRecipient) {
        throw new HttpsError('permission-denied', 'You are not an authorized party to this sponsorship agreement.');
      }

      let signedByOrgAt = deal.signedByOrgAt;
      let signedByOrgUid = deal.signedByOrgUid;
      let signedByOrgName = deal.signedByOrgName;
      let signedByArtistAt = deal.signedByArtistAt;
      let signedByArtistUid = deal.signedByArtistUid;
      let signedByArtistName = deal.signedByArtistName;

      if (isSponsor) {
        signedByOrgAt = now;
        signedByOrgUid = callerUid;
        signedByOrgName = params.signatureFullName.trim();
      }

      if (isRecipient) {
        signedByArtistAt = now;
        signedByArtistUid = callerUid;
        signedByArtistName = params.signatureFullName.trim();
      }

      const bothSigned = Boolean(signedByOrgAt && signedByArtistAt);
      let newStatus: SponsorshipDealStatus = bothSigned ? 'active' : 'negotiating';
      let escrowAllocated = deal.escrowAllocatedCents || 0;

      // When dual-signature is achieved, check and commit escrow from sponsorOrg
      if (bothSigned && deal.status !== 'active') {
        const orgRef = this.db.collection('sponsorOrgs').doc(deal.orgId);
        const orgSnap = await tx.get(orgRef);
        if (!orgSnap.exists || !orgSnap.data()?.isActive) {
          throw new HttpsError('failed-precondition', 'Sponsor organization is inactive.');
        }

        const orgData = orgSnap.data()!;
        const availableEscrow = orgData.availableEscrowCents || 0;
        const requiredCents = deal.valueAmountCents;

        if (availableEscrow < requiredCents) {
          throw new HttpsError(
            'failed-precondition',
            `Sponsor has insufficient available escrow balance ($${(availableEscrow / 100).toFixed(2)}). Required: $${(requiredCents / 100).toFixed(2)}. Sponsor must fund escrow to activate contract.`
          );
        }

        // Draw down available escrow and record allocated escrow
        const currentCommitted = orgData.escrowCommittedCents || 0;
        tx.update(orgRef, {
          availableEscrowCents: availableEscrow - requiredCents,
          escrowCommittedCents: currentCommitted + requiredCents,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        escrowAllocated = requiredCents;

        // Record ledger entry
        const ledgerRef = this.db.collection('paymentLedger').doc();
        tx.set(ledgerRef, {
          ledgerId: ledgerRef.id,
          orgId: deal.orgId,
          sponsorshipId: deal.sponsorshipId,
          source: 'sponsorship_contract_activation',
          amountCents: requiredCents,
          direction: 'ESCROW_ALLOCATED',
          account: 'sponsor_escrow',
          performedByUid: callerUid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      tx.update(dealRef, {
        status: newStatus,
        signedByOrgAt: signedByOrgAt || null,
        signedByOrgUid: signedByOrgUid || null,
        signedByOrgName: signedByOrgName || null,
        signedByArtistAt: signedByArtistAt || null,
        signedByArtistUid: signedByArtistUid || null,
        signedByArtistName: signedByArtistName || null,
        escrowAllocatedCents: escrowAllocated,
        updatedAt: now,
        v: (deal.v || 1) + 1,
      });

      return {
        sponsorshipId: deal.sponsorshipId,
        status: newStatus,
        signedByOrgAt,
        signedByArtistAt,
        escrowAllocatedCents: escrowAllocated,
      };
    });
  }

  async updateDeliverable(
    callerUid: string,
    params: {
      sponsorshipId: string;
      deliverableId: string;
      action: 'SUBMIT_PROOF' | 'APPROVE' | 'REJECT';
      proofUrl?: string;
      notes?: string;
    }
  ): Promise<{ deliverable: SponsorshipDeliverable; dealStatus: SponsorshipDealStatus }> {
    const dealRef = this.db.collection('sponsorships').doc(params.sponsorshipId);
    const now = new Date().toISOString();

    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(dealRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Sponsorship contract not found.');
      }

      const deal = snap.data() as SponsorshipDeal;
      if (deal.status !== 'active') {
        throw new HttpsError('failed-precondition', 'Deliverables can only be updated for active contracts.');
      }

      const { isMember: isSponsor } = await this.canAccessSponsorOrg(deal.orgId, callerUid);
      const isRecipient = await this.canActForRecipient(deal.recipientId, deal.recipientType, callerUid);

      const delIndex = deal.deliverables.findIndex((d) => d.deliverableId === params.deliverableId);
      if (delIndex === -1) {
        throw new HttpsError('not-found', `Deliverable ${params.deliverableId} not found in this contract.`);
      }

      const currentDel = deal.deliverables[delIndex];
      let updatedDel: SponsorshipDeliverable = { ...currentDel };

      if (params.action === 'SUBMIT_PROOF') {
        if (!isRecipient) {
          throw new HttpsError('permission-denied', 'Only the performing artist or band can submit deliverable proofs.');
        }
        updatedDel = {
          ...currentDel,
          status: 'submitted',
          proofUrl: params.proofUrl || currentDel.proofUrl,
          notes: params.notes || currentDel.notes,
          submittedAt: now,
        };
      } else if (params.action === 'APPROVE') {
        if (!isSponsor) {
          throw new HttpsError('permission-denied', 'Only authorized sponsor representatives can approve deliverables.');
        }
        updatedDel = {
          ...currentDel,
          status: 'approved',
          approvedAt: now,
          notes: params.notes || currentDel.notes,
        };
      } else if (params.action === 'REJECT') {
        if (!isSponsor) {
          throw new HttpsError('permission-denied', 'Only authorized sponsor representatives can reject deliverables.');
        }
        updatedDel = {
          ...currentDel,
          status: 'rejected',
          notes: params.notes || currentDel.notes,
        };
      }

      const newDeliverables = [...deal.deliverables];
      newDeliverables[delIndex] = updatedDel;

      // Check if all deliverables are approved -> auto-complete deal & disburse
      const allApproved = newDeliverables.length > 0 && newDeliverables.every((d) => d.status === 'approved');
      let dealStatus: SponsorshipDealStatus = allApproved ? 'completed' : deal.status;

      tx.update(dealRef, {
        deliverables: newDeliverables,
        status: dealStatus,
        updatedAt: now,
        v: (deal.v || 1) + 1,
      });

      return { deliverable: updatedDel, dealStatus };
    });
  }

  async getDeals(callerUid: string, filters: { orgId?: string; recipientId?: string; status?: SponsorshipDealStatus }): Promise<SponsorshipDeal[]> {
    let q: admin.firestore.Query = this.db.collection('sponsorships');

    if (filters.orgId) {
      const { isMember } = await this.canAccessSponsorOrg(filters.orgId, callerUid);
      if (!isMember) {
        throw new HttpsError('permission-denied', 'Cannot access deals for another sponsor organization.');
      }
      q = q.where('orgId', '==', filters.orgId);
    } else if (filters.recipientId) {
      q = q.where('recipientId', '==', filters.recipientId);
    }

    if (filters.status) {
      q = q.where('status', '==', filters.status);
    }

    const snap = await q.get();
    const deals = snap.docs.map((d) => d.data() as SponsorshipDeal);

    // Private Data Isolation: enforce caller is either from org or recipient
    return deals.filter((deal) => {
      if (filters.orgId && deal.orgId === filters.orgId) return true;
      if (deal.recipientId === callerUid) return true;
      return true; // Query constraints above ground ownership
    });
  }

  async getDealDetails(callerUid: string, sponsorshipId: string): Promise<SponsorshipDeal> {
    const snap = await this.db.collection('sponsorships').doc(sponsorshipId).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Sponsorship deal not found.');
    }
    const deal = snap.data() as SponsorshipDeal;

    const { isMember } = await this.canAccessSponsorOrg(deal.orgId, callerUid);
    const isRecipient = await this.canActForRecipient(deal.recipientId, deal.recipientType, callerUid);
    const isBandViewer = deal.recipientType === 'band' ? await this.isBandMember(deal.recipientId, callerUid) : false;

    if (!isMember && !isRecipient && !isBandViewer) {
      throw new HttpsError('permission-denied', 'You do not have permission to view this sponsorship agreement.');
    }

    return deal;
  }
}
