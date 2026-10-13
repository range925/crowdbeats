/**
 * Crowdbeats V2 — Phase 13 Sponsor Relationship Management Test Suite
 *
 * Verifies:
 * 1. Shortlist: add, get, remove, authorization check
 * 2. Opportunities: create by sponsor admin, public listing
 * 3. Applications: submission by artist / band admin, validation
 * 4. Application Review: state transitions and private reviewer notes isolation
 * 5. Dual-Signed Contract State Machine: proposed -> negotiating -> active
 * 6. Escrow Allocation Invariant & Dual-Ledger recording
 * 7. Deliverable Milestones: proof submission, approval, completion
 * 8. Private Data Isolation between competing sponsors and unprivileged users
 */

import { SponsorCrmService } from '../sponsor/sponsorCrmService';

// Mock in-memory firestore
class MockFirestore {
  public collections: Map<string, Map<string, any>> = new Map();

  collection(path: string): any {
    return new MockCollectionReference(path, this.collections, this);
  }

  doc(path: string): any {
    const parts = path.split('/');
    const collPath = parts.slice(0, -1).join('/');
    const docId = parts[parts.length - 1];
    return this.collection(collPath).doc(docId);
  }

  batch(): any {
    const ops: Array<() => void> = [];
    return {
      set: (ref: any, data: any) => ops.push(() => ref.set(data)),
      update: (ref: any, data: any) => ops.push(() => ref.update(data)),
      delete: (ref: any) => ops.push(() => ref.delete()),
      commit: async () => {
        for (const op of ops) op();
      },
    };
  }

  async runTransaction(updateFunction: (tx: any) => Promise<any>): Promise<any> {
    const tx = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any) => ref.set(data),
      update: (ref: any, data: any) => ref.update(data),
      delete: (ref: any) => ref.delete(),
    };
    return updateFunction(tx);
  }
}

class MockCollectionReference {
  constructor(
    public path: string,
    public collections: Map<string, Map<string, any>>,
    public root: MockFirestore
  ) {}

  private getStore(): Map<string, any> {
    if (!this.collections.has(this.path)) {
      this.collections.set(this.path, new Map());
    }
    return this.collections.get(this.path)!;
  }

  doc(id?: string): any {
    const docId = id || `mock_doc_${Math.random().toString(36).substring(2, 9)}`;
    return new MockDocReference(`${this.path}/${docId}`, docId, this.getStore(), this.root);
  }

  where(field: string, op: string, value: any): any {
    return new MockQuery(this.path, this.getStore(), [{ field, op, value }], this.root);
  }

  limit(n: number): any {
    return new MockQuery(this.path, this.getStore(), [], this.root).limit(n);
  }

  orderBy(field: string, dir?: string): any {
    return new MockQuery(this.path, this.getStore(), [], this.root).orderBy(field, dir);
  }

  async get(): Promise<any> {
    const store = this.getStore();
    const docs = Array.from(store.entries()).map(([id, data]) => ({
      id,
      exists: true,
      data: () => data,
    }));
    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
    };
  }
}

class MockQuery {
  constructor(
    public path: string,
    public store: Map<string, any>,
    public filters: Array<{ field: string; op: string; value: any }>,
    public root: MockFirestore
  ) {}

  where(field: string, op: string, value: any): any {
    return new MockQuery(this.path, this.store, [...this.filters, { field, op, value }], this.root);
  }

  limit(_n: number): any {
    return this;
  }

  orderBy(_field: string, _dir?: string): any {
    return this;
  }

  async get(): Promise<any> {
    let entries = Array.from(this.store.entries());
    for (const filter of this.filters) {
      entries = entries.filter(([, data]) => {
        if (filter.op === '==') return data[filter.field] === filter.value;
        return true;
      });
    }
    const docs = entries.map(([id, data]) => ({
      id,
      exists: true,
      data: () => data,
    }));
    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
    };
  }
}

class MockDocReference {
  constructor(
    public fullPath: string,
    public id: string,
    public store: Map<string, any>,
    public root: MockFirestore
  ) {}

  collection(subPath: string): MockCollectionReference {
    return new MockCollectionReference(`${this.fullPath}/${subPath}`, this.root.collections, this.root);
  }

  async get(): Promise<any> {
    const data = this.store.get(this.id);
    return {
      id: this.id,
      exists: Boolean(data),
      data: () => data,
    };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    if (options?.merge && this.store.has(this.id)) {
      this.store.set(this.id, { ...this.store.get(this.id), ...data });
    } else {
      this.store.set(this.id, { ...data });
    }
  }

  async update(data: any): Promise<void> {
    if (!this.store.has(this.id)) {
      throw new Error(`Doc not found: ${this.id}`);
    }
    this.store.set(this.id, { ...this.store.get(this.id), ...data });
  }

  async delete(): Promise<void> {
    this.store.delete(this.id);
  }
}

describe('Phase 13: Sponsor Relationship Management Service Suite', () => {
  let mockDb: MockFirestore;
  let service: SponsorCrmService;

  const SPONSOR_ORG_ID = 'org_redbull';
  const SPONSOR_ADMIN_UID = 'uid_sponsor_admin';
  const SPONSOR_REP_UID = 'uid_sponsor_rep';
  const ARTIST_UID = 'uid_artist_solo';
  const BAND_ID = 'band_neon_pulse';
  const BAND_FOUNDER_UID = 'uid_band_founder';
  const BAND_MEMBER_UID = 'uid_band_member';
  const OUTSIDER_UID = 'uid_outsider';

  beforeEach(() => {
    mockDb = new MockFirestore();
    service = new SponsorCrmService(mockDb as any);

    // Seed Sponsor Org
    mockDb.collection('sponsorOrgs').doc(SPONSOR_ORG_ID).set({
      orgId: SPONSOR_ORG_ID,
      name: 'Red Bull Music & Culture',
      isActive: true,
      availableEscrowCents: 500000, // $5,000.00 available
      escrowCommittedCents: 0,
      totalEscrowDepositedCents: 500000,
    });

    // Seed Sponsor Members
    mockDb.collection('sponsorOrgs').doc(SPONSOR_ORG_ID).collection('members').doc(SPONSOR_ADMIN_UID).set({
      uid: SPONSOR_ADMIN_UID,
      role: 'SPONSOR_ADMIN',
      isActive: true,
    });
    mockDb.collection('sponsorOrgs').doc(SPONSOR_ORG_ID).collection('members').doc(SPONSOR_REP_UID).set({
      uid: SPONSOR_REP_UID,
      role: 'SPONSOR_REP',
      isActive: true,
    });

    // Seed Band & Band Members
    mockDb.collection('bands').doc(BAND_ID).set({
      id: BAND_ID,
      name: 'Neon Pulse',
      status: 'ACTIVE',
    });
    mockDb.collection('bands').doc(BAND_ID).collection('members').doc(BAND_FOUNDER_UID).set({
      userId: BAND_FOUNDER_UID,
      role: 'BAND_FOUNDER',
      status: 'ACTIVE',
    });
    mockDb.collection('bands').doc(BAND_ID).collection('members').doc(BAND_MEMBER_UID).set({
      userId: BAND_MEMBER_UID,
      role: 'BAND_MEMBER',
      status: 'ACTIVE',
    });

    // Seed Users
    mockDb.collection('users').doc(ARTIST_UID).set({
      displayName: 'Elena Cruz',
      email: 'elena@example.com',
    });
  });

  // ── 1. Shortlist Tests ───────────────────────────────────────────────────
  describe('Shortlist Operations', () => {
    it('allows active sponsor member to add performer to shortlist', async () => {
      const item = await service.addToShortlist(SPONSOR_ORG_ID, SPONSOR_REP_UID, {
        recipientId: ARTIST_UID,
        recipientType: 'artist',
        recipientName: 'Elena Cruz',
        genre: 'Acoustic / Folk',
        city: 'Austin, TX',
        followerCohort: '10k - 25k',
        engagementRating: 'Top 2%',
        avgGigTipCents: 62000,
        notes: 'Great match for Austin SXSW stage',
      });

      expect(item.recipientId).toBe(ARTIST_UID);
      expect(item.addedAt).toBeDefined();

      const list = await service.getShortlist(SPONSOR_ORG_ID, SPONSOR_ADMIN_UID);
      expect(list.length).toBe(1);
      expect(list[0].recipientName).toBe('Elena Cruz');
    });

    it('denies outsider from adding to sponsor shortlist', async () => {
      await expect(
        service.addToShortlist(SPONSOR_ORG_ID, OUTSIDER_UID, {
          recipientId: ARTIST_UID,
          recipientType: 'artist',
          recipientName: 'Elena Cruz',
        })
      ).rejects.toThrow('You are not an authorized member of this Sponsor Organization.');
    });

    it('allows sponsor member to remove performer from shortlist', async () => {
      await service.addToShortlist(SPONSOR_ORG_ID, SPONSOR_REP_UID, {
        recipientId: BAND_ID,
        recipientType: 'band',
        recipientName: 'Neon Pulse',
      });

      const removed = await service.removeFromShortlist(SPONSOR_ORG_ID, SPONSOR_ADMIN_UID, BAND_ID);
      expect(removed).toBe(BAND_ID);

      const list = await service.getShortlist(SPONSOR_ORG_ID, SPONSOR_ADMIN_UID);
      expect(list.length).toBe(0);
    });
  });

  // ── 2. Opportunity Tests ──────────────────────────────────────────────────
  describe('Opportunities Operations', () => {
    it('allows SPONSOR_ADMIN to create sponsorship opportunity', async () => {
      const opp = await service.createOpportunity(SPONSOR_ORG_ID, SPONSOR_ADMIN_UID, {
        title: 'Summer Stage Acoustic Showcase',
        description: 'Gear support and tip match for touring solo acts.',
        budgetPerPerformerCents: 150000, // $1,500.00
        totalBudgetCents: 600000,
        targetGenre: 'Acoustic / Indie',
        targetType: 'artist',
        durationDays: 45,
      });

      expect(opp.opportunityId).toBeDefined();
      expect(opp.status).toBe('open');
      expect(opp.sponsorName).toBe('Red Bull Music & Culture');

      const allOpps = await service.getOpportunities();
      expect(allOpps.length).toBe(1);
      expect(allOpps[0].title).toBe('Summer Stage Acoustic Showcase');
    });

    it('denies SPONSOR_REP or outsider from creating opportunity', async () => {
      await expect(
        service.createOpportunity(SPONSOR_ORG_ID, SPONSOR_REP_UID, {
          title: 'Unauthorized Opportunity',
          description: 'Test',
          budgetPerPerformerCents: 50000,
          totalBudgetCents: 100000,
        })
      ).rejects.toThrow('Only active Sponsor Admins can create new sponsorship opportunities.');
    });
  });

  // ── 3. Application Submission & Review ───────────────────────────────────
  describe('Application Workflow & Private Notes Isolation', () => {
    it('allows artist to submit application and enforces minimum $10.00', async () => {
      await expect(
        service.submitApplication(ARTIST_UID, {
          orgId: SPONSOR_ORG_ID,
          applicantId: ARTIST_UID,
          applicantType: 'artist',
          applicantName: 'Elena Cruz',
          pitch: 'I am touring Texas and would love brand gear.',
          requestedAmountCents: 500, // under 1000 cents
        })
      ).rejects.toThrow('Minimum requested sponsorship amount is $10.00');

      const app = await service.submitApplication(ARTIST_UID, {
        orgId: SPONSOR_ORG_ID,
        applicantId: ARTIST_UID,
        applicantType: 'artist',
        applicantName: 'Elena Cruz',
        pitch: 'I am touring Texas and would love brand gear.',
        requestedAmountCents: 200000, // $2,000.00
        mediaLinks: ['https://spotify.com/artist/elena'],
      });

      expect(app.applicationId).toBeDefined();
      expect(app.status).toBe('submitted');
      expect(app.sponsorName).toBe('Red Bull Music & Culture');
    });

    it('allows band founder to submit application on behalf of band', async () => {
      const app = await service.submitApplication(BAND_FOUNDER_UID, {
        orgId: SPONSOR_ORG_ID,
        applicantId: BAND_ID,
        applicantType: 'band',
        applicantName: 'Neon Pulse',
        pitch: 'Synthpop headliners for national tour.',
        requestedAmountCents: 350000,
      });

      expect(app.applicationId).toBeDefined();
      expect(app.applicantId).toBe(BAND_ID);
    });

    it('denies unprivileged band member from submitting on behalf of band', async () => {
      await expect(
        service.submitApplication(BAND_MEMBER_UID, {
          orgId: SPONSOR_ORG_ID,
          applicantId: BAND_ID,
          applicantType: 'band',
          applicantName: 'Neon Pulse',
          pitch: 'Attempt by regular member',
          requestedAmountCents: 100000,
        })
      ).rejects.toThrow('You are not authorized to submit applications for this artist or band.');
    });

    it('isolates private reviewer notes from applicant queries', async () => {
      const app = await service.submitApplication(ARTIST_UID, {
        orgId: SPONSOR_ORG_ID,
        applicantId: ARTIST_UID,
        applicantType: 'artist',
        applicantName: 'Elena Cruz',
        pitch: 'Pitch',
        requestedAmountCents: 150000,
      });

      // Sponsor reviews and adds private notes
      const reviewRes = await service.reviewApplication(SPONSOR_ADMIN_UID, {
        applicationId: app.applicationId,
        action: 'ACCEPT',
        reviewerNotes: 'CONFIDENTIAL: strong streaming numbers, approve full budget',
        proposalTitle: 'Austin Tour Endorsement',
        valueAmountCents: 150000,
      });

      expect(reviewRes.status).toBe('accepted');
      expect(reviewRes.sponsorshipId).toBeDefined();

      // Sponsor views applications -> sees reviewerNotes
      const sponsorApps = await service.getApplications(SPONSOR_REP_UID, { orgId: SPONSOR_ORG_ID });
      expect(sponsorApps[0].reviewerNotes).toContain('CONFIDENTIAL');

      // Creator views their applications -> reviewerNotes is MASKED
      const creatorApps = await service.getApplications(ARTIST_UID, { applicantId: ARTIST_UID });
      expect(creatorApps[0].reviewerNotes).toBeUndefined();
    });
  });

  // ── 4. Sponsorship Contract State Machine & Dual-Signature ───────────────
  describe('Contract State Machine & Escrow Allocation Invariant', () => {
    it('creates deal in proposed status and transitions through dual-signatures to active', async () => {
      // 1. Propose Deal
      const deal = await service.proposeDeal(SPONSOR_ADMIN_UID, {
        orgId: SPONSOR_ORG_ID,
        recipientId: ARTIST_UID,
        recipientType: 'artist',
        recipientName: 'Elena Cruz',
        title: 'Headline Tour Sponsorship',
        valueAmountCents: 200000, // $2,000.00
      });

      expect(deal.status).toBe('proposed');
      expect(deal.valueAmountCents).toBe(200000);
      expect(deal.escrowAllocatedCents).toBe(0);

      // 2. Sponsor signs first
      const sponsorSign = await service.signContract(SPONSOR_ADMIN_UID, {
        sponsorshipId: deal.sponsorshipId,
        signatureFullName: 'Marcus Vance',
        agreeToTerms: true,
      });

      expect(sponsorSign.status).toBe('negotiating');
      expect(sponsorSign.signedByOrgAt).toBeDefined();
      expect(sponsorSign.signedByArtistAt).toBeUndefined();

      // 3. Artist signs second -> transitions to active and allocates escrow
      const artistSign = await service.signContract(ARTIST_UID, {
        sponsorshipId: deal.sponsorshipId,
        signatureFullName: 'Elena Cruz',
        agreeToTerms: true,
      });

      expect(artistSign.status).toBe('active');
      expect(artistSign.signedByArtistAt).toBeDefined();
      expect(artistSign.escrowAllocatedCents).toBe(200000);

      // Verify org available escrow was drawn down
      const orgDoc = await mockDb.collection('sponsorOrgs').doc(SPONSOR_ORG_ID).get();
      const orgData = orgDoc.data();
      expect(orgData.availableEscrowCents).toBe(300000); // 500,000 - 200,000
      expect(orgData.escrowCommittedCents).toBe(200000);
    });

    it('enforces escrow invariant: fails contract activation if sponsor has insufficient funds', async () => {
      // Create deal exceeding available escrow ($5,000 available vs $10,000 requested)
      const bigDeal = await service.proposeDeal(SPONSOR_ADMIN_UID, {
        orgId: SPONSOR_ORG_ID,
        recipientId: ARTIST_UID,
        recipientType: 'artist',
        title: 'Mega Festival Partnership',
        valueAmountCents: 1000000, // $10,000.00
      });

      await service.signContract(SPONSOR_ADMIN_UID, {
        sponsorshipId: bigDeal.sponsorshipId,
        signatureFullName: 'Marcus Vance',
        agreeToTerms: true,
      });

      // Artist signs, but activation fails due to insufficient escrow
      await expect(
        service.signContract(ARTIST_UID, {
          sponsorshipId: bigDeal.sponsorshipId,
          signatureFullName: 'Elena Cruz',
          agreeToTerms: true,
        })
      ).rejects.toThrow('Sponsor has insufficient available escrow balance ($5000.00). Required: $10000.00.');
    });

    it('denies unauthorized outsider from signing contract', async () => {
      const deal = await service.proposeDeal(SPONSOR_ADMIN_UID, {
        orgId: SPONSOR_ORG_ID,
        recipientId: ARTIST_UID,
        recipientType: 'artist',
        title: 'Deal',
        valueAmountCents: 150000,
      });

      await expect(
        service.signContract(OUTSIDER_UID, {
          sponsorshipId: deal.sponsorshipId,
          signatureFullName: 'Imposter',
          agreeToTerms: true,
        })
      ).rejects.toThrow('You are not an authorized party to this sponsorship agreement.');
    });
  });

  // ── 5. Deliverable Tracking & Deal Completion ─────────────────────────────
  describe('Deliverable Milestones Workflow', () => {
    it('manages deliverable lifecycle: proof submission, approval, and auto-completion', async () => {
      // Set up active deal
      const deal = await service.proposeDeal(SPONSOR_ADMIN_UID, {
        orgId: SPONSOR_ORG_ID,
        recipientId: ARTIST_UID,
        recipientType: 'artist',
        title: 'Acoustic Promo',
        valueAmountCents: 100000,
        deliverables: [
          {
            deliverableId: 'd_shoutout',
            title: 'Live Stage Shoutout',
            type: 'STAGE_SHOUTOUT',
          },
        ],
      });

      await service.signContract(SPONSOR_ADMIN_UID, {
        sponsorshipId: deal.sponsorshipId,
        signatureFullName: 'Marcus Vance',
        agreeToTerms: true,
      });
      await service.signContract(ARTIST_UID, {
        sponsorshipId: deal.sponsorshipId,
        signatureFullName: 'Elena Cruz',
        agreeToTerms: true,
      });

      // 1. Artist submits proof
      const submitRes = await service.updateDeliverable(ARTIST_UID, {
        sponsorshipId: deal.sponsorshipId,
        deliverableId: 'd_shoutout',
        action: 'SUBMIT_PROOF',
        proofUrl: 'https://youtube.com/watch?v=concert_clip',
        notes: 'Delivered at minute 24:10 on stage.',
      });

      expect(submitRes.deliverable.status).toBe('submitted');
      expect(submitRes.dealStatus).toBe('active');

      // 2. Sponsor approves -> deal automatically completes
      const approveRes = await service.updateDeliverable(SPONSOR_REP_UID, {
        sponsorshipId: deal.sponsorshipId,
        deliverableId: 'd_shoutout',
        action: 'APPROVE',
        notes: 'Audio verified and crowd engagement high.',
      });

      expect(approveRes.deliverable.status).toBe('approved');
      expect(approveRes.dealStatus).toBe('completed');
    });

    it('denies sponsor from submitting proof and denies creator from approving proof', async () => {
      const deal = await service.proposeDeal(SPONSOR_ADMIN_UID, {
        orgId: SPONSOR_ORG_ID,
        recipientId: ARTIST_UID,
        recipientType: 'artist',
        title: 'Acoustic Promo',
        valueAmountCents: 50000,
        deliverables: [{ deliverableId: 'd_test', title: 'Test', type: 'CUSTOM' }],
      });

      await service.signContract(SPONSOR_ADMIN_UID, { sponsorshipId: deal.sponsorshipId, signatureFullName: 'Marcus Vance', agreeToTerms: true });
      await service.signContract(ARTIST_UID, { sponsorshipId: deal.sponsorshipId, signatureFullName: 'Elena Cruz', agreeToTerms: true });

      // Sponsor tries to submit proof
      await expect(
        service.updateDeliverable(SPONSOR_REP_UID, {
          sponsorshipId: deal.sponsorshipId,
          deliverableId: 'd_test',
          action: 'SUBMIT_PROOF',
        })
      ).rejects.toThrow('Only the performing artist or band can submit deliverable proofs.');

      // Artist tries to approve proof
      await expect(
        service.updateDeliverable(ARTIST_UID, {
          sponsorshipId: deal.sponsorshipId,
          deliverableId: 'd_test',
          action: 'APPROVE',
        })
      ).rejects.toThrow('Only authorized sponsor representatives can approve deliverables.');
    });
  });

  // ── 6. Private Data Isolation & Band Permissions ─────────────────────────
  describe('Private Data Isolation & Band Views', () => {
    it('allows verified band members to view band deals and isolates other sponsors', async () => {
      const bandDeal = await service.proposeDeal(SPONSOR_ADMIN_UID, {
        orgId: SPONSOR_ORG_ID,
        recipientId: BAND_ID,
        recipientType: 'band',
        title: 'Band Headline Deal',
        valueAmountCents: 300000,
      });

      // Regular band member can view deal details
      const memberView = await service.getDealDetails(BAND_MEMBER_UID, bandDeal.sponsorshipId);
      expect(memberView.title).toBe('Band Headline Deal');

      // Unrelated user cannot view deal details
      await expect(
        service.getDealDetails(OUTSIDER_UID, bandDeal.sponsorshipId)
      ).rejects.toThrow('You do not have permission to view this sponsorship agreement.');

      // Another sponsor org member cannot view
      mockDb.collection('sponsorOrgs').doc('org_competitor').set({ isActive: true });
      mockDb.collection('sponsorOrgs').doc('org_competitor').collection('members').doc('uid_rival').set({ isActive: true });

      await expect(
        service.getDealDetails('uid_rival', bandDeal.sponsorshipId)
      ).rejects.toThrow('You do not have permission to view this sponsorship agreement.');
    });
  });
});
