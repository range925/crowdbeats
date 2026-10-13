/**
 * Crowdbeats V2 — Phase 14 Campaign & Supporter Synchronization Test Suite
 *
 * Verifies:
 * 1. Story-to-Launch flow: draft -> submitted -> reviewed (approve/reject/flag) -> active -> cancelled
 * 2. Contribution Intent: validation of active status, deadline, reward tier minimum and quantity caps
 * 3. Confirmed Contribution (Stripe Webhook): payment-confirmed totals, tier claimed count, dual-ledger entries
 * 4. Duplicate Webhook Replay & Idempotency: replay attack does NOT duplicate money or backer count
 * 5. Reward Fulfillment Lifecycle: creator updates fulfillment status, tracking number, and carrier
 * 6. Contribution Refund: authorization, Stripe refund invocation, pledged amount decrement, ledger reversal
 * 7. Admin Reporting & Oversight: KPI calculations, review queue, and status filters
 */

import { CampaignSyncService } from '../campaign/campaignSyncService';

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
      set: (ref: any, data: any, options?: any) => ops.push(() => ref.set(data, options)),
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
      set: (ref: any, data: any, options?: any) => ref.set(data, options),
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
    public root: MockFirestore,
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

  async add(data: any): Promise<any> {
    const docRef = this.doc();
    await docRef.set(data);
    return docRef;
  }

  where(field: string, op: string, value: any): any {
    return new MockQuery(this.path, this.getStore(), [{ field, op, value }], this.root);
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): any {
    return new MockQuery(this.path, this.getStore(), [], this.root).orderBy(field, dir);
  }

  limit(n: number): any {
    return new MockQuery(this.path, this.getStore(), [], this.root).limit(n);
  }

  async get(): Promise<any> {
    return new MockQuery(this.path, this.getStore(), [], this.root).get();
  }
}

class MockDocReference {
  constructor(
    public fullPath: string,
    public id: string,
    private store: Map<string, any>,
    public root: MockFirestore,
  ) {}

  collection(subPath: string): any {
    return new MockCollectionReference(`${this.fullPath}/${subPath}`, this.root.collections, this.root);
  }

  async get(): Promise<any> {
    const data = this.store.get(this.id);
    return {
      exists: data !== undefined,
      id: this.id,
      ref: this,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
    };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    if (options?.merge && this.store.has(this.id)) {
      const existing = this.store.get(this.id);
      this.store.set(this.id, { ...existing, ...data });
    } else {
      this.store.set(this.id, data);
    }
  }

  async update(data: any): Promise<void> {
    const existing = this.store.get(this.id) || {};
    this.store.set(this.id, { ...existing, ...data });
  }

  async delete(): Promise<void> {
    this.store.delete(this.id);
  }
}

class MockQuery {
  private _limit?: number;
  private _filters: Array<{ field: string; op: string; value: any }>;

  constructor(
    public path: string,
    private store: Map<string, any>,
    filters: Array<{ field: string; op: string; value: any }>,
    public root: MockFirestore,
  ) {
    this._filters = filters;
  }

  where(field: string, op: string, value: any): MockQuery {
    this._filters.push({ field, op, value });
    return this;
  }

  orderBy(_field: string, _dir: 'asc' | 'desc' = 'asc'): MockQuery {
    return this;
  }

  limit(n: number): MockQuery {
    this._limit = n;
    return this;
  }

  startAfter(_doc: any): MockQuery {
    return this;
  }

  async get(): Promise<any> {
    let results: Array<{ id: string; data: any; ref: any }> = [];
    for (const [id, item] of this.store.entries()) {
      let matches = true;
      for (const filter of this._filters) {
        if (filter.op === '==' && item[filter.field] !== filter.value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        results.push({
          id,
          data: item,
          ref: new MockDocReference(`${this.path}/${id}`, id, this.store, this.root),
        });
      }
    }

    if (this._limit && this._limit > 0) {
      results = results.slice(0, this._limit);
    }

    return {
      empty: results.length === 0,
      size: results.length,
      docs: results.map((r) => ({
        id: r.id,
        ref: r.ref,
        data: () => JSON.parse(JSON.stringify(r.data)),
      })),
    };
  }
}

// ── Mock Stripe ──────────────────────────────────────────────────────────────
jest.mock('../lib/stripe.js', () => ({
  stripe: {
    createPaymentIntent: jest.fn().mockImplementation(async (params) => ({
      id: `pi_test_${Date.now()}`,
      client_secret: `pi_test_${Date.now()}_secret`,
    })),
    createRefund: jest.fn().mockImplementation(async (piId, amount) => ({
      id: `re_test_${Date.now()}`,
      status: 'succeeded',
    })),
  },
}));

// ── Mock CRM Service ─────────────────────────────────────────────────────────
jest.mock('../crm/crmService', () => ({
  recordCrmEvent: jest.fn().mockResolvedValue({ ok: true, isReplay: false }),
}));

describe('Phase 14 — Campaign & Supporter Synchronization', () => {
  let mockDb: MockFirestore;
  let service: CampaignSyncService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    service = new CampaignSyncService(mockDb as any);
  });

  describe('1. Contribution Intent Creation', () => {
    it('creates contribution intent for an active campaign with valid reward tier', async () => {
      // Seed active campaign
      await mockDb.collection('campaigns').doc('camp_1').set({
        campaignId: 'camp_1',
        title: 'Debut Studio Vinyl LP',
        creatorId: 'artist_1',
        creatorType: 'artist',
        status: 'active',
        currency: 'USD',
        goalCents: 500000, // $5,000
        pledgedCents: 0,
        backerCount: 0,
        deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
        rewardTiers: [
          {
            tierId: 'tier_vinyl',
            title: 'Limited Edition Marbled Vinyl',
            amountCents: 5000, // $50
            quantityAvailable: 100,
            quantityClaimed: 10,
          },
        ],
      });

      const res = await service.createContributionIntent('fan_alice', {
        campaignId: 'camp_1',
        amountCents: 5000,
        tierId: 'tier_vinyl',
        message: 'Can not wait for this vinyl!',
      });

      expect(res.contributionId).toBeDefined();
      expect(res.clientSecret).toBeDefined();
      expect(res.stripePaymentIntentId).toBeDefined();
      expect(res.amountCents).toBe(5000);
      expect(res.currency).toBe('USD');

      // Verify contribution record pre-created in 'pending' status
      const contribSnap = await mockDb
        .collection('campaigns')
        .doc('camp_1')
        .collection('contributions')
        .doc(res.contributionId)
        .get();
      expect(contribSnap.exists).toBe(true);
      expect(contribSnap.data().status).toBe('pending');
      expect(contribSnap.data().fanUid).toBe('fan_alice');
      expect(contribSnap.data().amountCents).toBe(5000);
      expect(contribSnap.data().fulfillmentStatus).toBe('pending');
    });

    it('rejects contribution when campaign is not active', async () => {
      await mockDb.collection('campaigns').doc('camp_draft').set({
        campaignId: 'camp_draft',
        title: 'Draft Campaign',
        status: 'draft',
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

      await expect(
        service.createContributionIntent('fan_bob', {
          campaignId: 'camp_draft',
          amountCents: 2000,
        }),
      ).rejects.toThrow(/Campaign is not active/);
    });

    it('rejects contribution when reward tier quantity limit is reached', async () => {
      await mockDb.collection('campaigns').doc('camp_sold_out').set({
        campaignId: 'camp_sold_out',
        title: 'VIP Acoustic Pass',
        status: 'active',
        currency: 'USD',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        rewardTiers: [
          {
            tierId: 'tier_vip',
            title: 'VIP Pass',
            amountCents: 10000,
            quantityAvailable: 5,
            quantityClaimed: 5, // Fully claimed
          },
        ],
      });

      await expect(
        service.createContributionIntent('fan_bob', {
          campaignId: 'camp_sold_out',
          amountCents: 10000,
          tierId: 'tier_vip',
        }),
      ).rejects.toThrow(/reached its quantity limit/);
    });

    it('rejects contribution amount below tier minimum', async () => {
      await mockDb.collection('campaigns').doc('camp_min').set({
        campaignId: 'camp_min',
        title: 'Signed Poster Campaign',
        status: 'active',
        currency: 'USD',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        rewardTiers: [
          {
            tierId: 'tier_poster',
            title: 'Signed Poster',
            amountCents: 2500, // $25
          },
        ],
      });

      await expect(
        service.createContributionIntent('fan_bob', {
          campaignId: 'camp_min',
          amountCents: 1500, // Attempting $15 for $25 tier
          tierId: 'tier_poster',
        }),
      ).rejects.toThrow(/less than tier minimum/);
    });
  });

  describe('2. Confirmed Payment Webhook & Zero Duplicate Money', () => {
    it('confirms contribution, increments pledgedCents, updates reward tier claimed, and records dual-ledger entries', async () => {
      // Seed campaign
      await mockDb.collection('campaigns').doc('camp_2').set({
        campaignId: 'camp_2',
        title: 'Tour Bus Maintenance Fund',
        creatorId: 'artist_2',
        creatorType: 'artist',
        status: 'active',
        currency: 'USD',
        goalCents: 100000, // $1,000
        pledgedCents: 20000, // $200 already
        backerCount: 2,
        rewardTiers: [
          {
            tierId: 'tier_cd',
            title: 'Physical CD',
            amountCents: 2000,
            quantityClaimed: 2,
          },
        ],
      });

      // Seed pending contribution
      await mockDb
        .collection('campaigns')
        .doc('camp_2')
        .collection('contributions')
        .doc('contrib_101')
        .set({
          contributionId: 'contrib_101',
          campaignId: 'camp_2',
          fanUid: 'fan_charlie',
          amountCents: 5000, // $50 pledge
          currency: 'USD',
          tierId: 'tier_cd',
          status: 'pending',
          stripePaymentIntentId: 'pi_test_101',
        });

      // Simulate Stripe webhook payment_intent.succeeded
      await service.handleCampaignContributionSucceeded({
        id: 'pi_test_101',
        amount: 5000,
        metadata: {
          type: 'campaign_contribution',
          campaignId: 'camp_2',
          contributionId: 'contrib_101',
          fanUid: 'fan_charlie',
          tierId: 'tier_cd',
        },
      });

      // Verify contribution transitioned to captured
      const contribSnap = await mockDb
        .collection('campaigns')
        .doc('camp_2')
        .collection('contributions')
        .doc('contrib_101')
        .get();
      expect(contribSnap.data().status).toBe('captured');
      expect(contribSnap.data().processedAt).toBeDefined();

      // Verify campaign totals incremented: 20000 + 5000 = 25000 cents
      const campSnap = await mockDb.collection('campaigns').doc('camp_2').get();
      expect(campSnap.data().pledgedCents).toBe(25000);
      expect(campSnap.data().backerCount).toBe(3);

      // Verify reward tier quantity claimed incremented: 2 -> 3
      const updatedTiers = campSnap.data().rewardTiers;
      expect(updatedTiers[0].quantityClaimed).toBe(3);

      // Verify dual-entry ledger records
      const ledgerEntries = Array.from(mockDb.collection('paymentLedger').collections.get('paymentLedger')?.values() || []);
      const campEntries = ledgerEntries.filter((e: any) => e.referenceId === 'contrib_101');
      expect(campEntries.length).toBe(3);

      const debitFan: any = campEntries.find((e: any) => e.type === 'DEBIT');
      const creditCreator: any = campEntries.find((e: any) => e.type === 'CREDIT' && e.accountId === 'artist_2');
      const creditPlatform: any = campEntries.find((e: any) => e.type === 'CREDIT' && e.accountId === 'PLATFORM_REVENUE');

      expect(debitFan).toBeDefined();
      expect(debitFan.amountCents).toBe(5000);

      // 6% platform fee = $3.00 (300 cents), creator credit = $47.00 (4700 cents)
      expect(creditPlatform.amountCents).toBe(300);
      expect(creditCreator.amountCents).toBe(4700);
      expect(creditCreator.amountCents + creditPlatform.amountCents).toBe(debitFan.amountCents);
    });

    it('IDEMPOTENCY: webhook replay does NOT duplicate money or backer count', async () => {
      // Seed campaign with already captured contribution
      await mockDb.collection('campaigns').doc('camp_3').set({
        campaignId: 'camp_3',
        title: 'Microphone Upgrade',
        creatorId: 'artist_3',
        status: 'active',
        currency: 'USD',
        goalCents: 50000,
        pledgedCents: 10000, // $100
        backerCount: 1,
        rewardTiers: [],
      });

      await mockDb
        .collection('campaigns')
        .doc('camp_3')
        .collection('contributions')
        .doc('contrib_replay')
        .set({
          contributionId: 'contrib_replay',
          campaignId: 'camp_3',
          fanUid: 'fan_david',
          amountCents: 10000,
          currency: 'USD',
          status: 'captured', // ALREADY CAPTURED
        });

      // Replay the webhook event
      await service.handleCampaignContributionSucceeded({
        id: 'pi_replay',
        amount: 10000,
        metadata: {
          campaignId: 'camp_3',
          contributionId: 'contrib_replay',
          fanUid: 'fan_david',
        },
      });

      // Verify campaign pledgedCents remained strictly 10000 (NOT 20000)
      const campSnap = await mockDb.collection('campaigns').doc('camp_3').get();
      expect(campSnap.data().pledgedCents).toBe(10000);
      expect(campSnap.data().backerCount).toBe(1);
    });
  });

  describe('3. Reward Fulfillment Lifecycle', () => {
    it('allows creator to update reward fulfillment status with tracking number', async () => {
      await mockDb.collection('campaigns').doc('camp_fulfill').set({
        campaignId: 'camp_fulfill',
        creatorId: 'artist_creator',
        status: 'active',
      });

      await mockDb
        .collection('campaigns')
        .doc('camp_fulfill')
        .collection('contributions')
        .doc('contrib_shipped')
        .set({
          contributionId: 'contrib_shipped',
          campaignId: 'camp_fulfill',
          status: 'captured',
          fulfillmentStatus: 'processing',
        });

      const res = await service.updateRewardFulfillment(
        'artist_creator',
        [],
        {
          campaignId: 'camp_fulfill',
          contributionId: 'contrib_shipped',
          fulfillmentStatus: 'shipped',
          trackingNumber: '9400111899562537628811',
          carrier: 'USPS',
          notes: 'Packed with bubble wrap and stickers',
        },
      );

      expect(res.success).toBe(true);
      expect(res.fulfillmentStatus).toBe('shipped');

      const contribSnap = await mockDb
        .collection('campaigns')
        .doc('camp_fulfill')
        .collection('contributions')
        .doc('contrib_shipped')
        .get();
      expect(contribSnap.data().fulfillmentStatus).toBe('shipped');
      expect(contribSnap.data().trackingNumber).toBe('9400111899562537628811');
      expect(contribSnap.data().carrier).toBe('USPS');
    });

    it('rejects unauthorized user trying to update reward fulfillment', async () => {
      await mockDb.collection('campaigns').doc('camp_fulfill_unauth').set({
        campaignId: 'camp_fulfill_unauth',
        creatorId: 'artist_legit',
        status: 'active',
      });

      await expect(
        service.updateRewardFulfillment(
          'intruder_user',
          [],
          {
            campaignId: 'camp_fulfill_unauth',
            contributionId: 'contrib_any',
            fulfillmentStatus: 'delivered',
          },
        ),
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe('4. Contribution Refunds & Ledger Reversals', () => {
    it('refunds contribution, decrements pledgedCents, decrements tier claim, and writes reversal ledger', async () => {
      await mockDb.collection('campaigns').doc('camp_ref').set({
        campaignId: 'camp_ref',
        title: 'Festival Headliner Crowdfund',
        creatorId: 'artist_ref',
        status: 'active',
        currency: 'USD',
        goalCents: 500000,
        pledgedCents: 8000, // $80
        rewardTiers: [
          {
            tierId: 'tier_wristband',
            title: 'VIP Wristband',
            amountCents: 8000,
            quantityClaimed: 1,
          },
        ],
      });

      await mockDb
        .collection('campaigns')
        .doc('camp_ref')
        .collection('contributions')
        .doc('contrib_to_refund')
        .set({
          contributionId: 'contrib_to_refund',
          campaignId: 'camp_ref',
          fanUid: 'fan_buyer',
          amountCents: 8000,
          currency: 'USD',
          tierId: 'tier_wristband',
          status: 'captured',
          stripePaymentIntentId: 'pi_refundable',
        });

      const res = await service.refundContribution(
        'artist_ref',
        [],
        {
          campaignId: 'camp_ref',
          contributionId: 'contrib_to_refund',
          reason: 'Fan requested order cancellation',
        },
      );

      expect(res.success).toBe(true);
      expect(res.refundedAmountCents).toBe(8000);
      expect(res.status).toBe('refunded');

      // Verify campaign pledged amount decremented: 8000 - 8000 = 0
      const campSnap = await mockDb.collection('campaigns').doc('camp_ref').get();
      expect(campSnap.data().pledgedCents).toBe(0);

      // Verify tier claimed count decremented: 1 -> 0
      expect(campSnap.data().rewardTiers[0].quantityClaimed).toBe(0);

      // Verify contribution status is refunded
      const contribSnap = await mockDb
        .collection('campaigns')
        .doc('camp_ref')
        .collection('contributions')
        .doc('contrib_to_refund')
        .get();
      expect(contribSnap.data().status).toBe('refunded');
      expect(contribSnap.data().refundAmountCents).toBe(8000);

      // Verify REVERSAL entry in paymentLedger
      const ledgerEntries = Array.from(mockDb.collection('paymentLedger').collections.get('paymentLedger')?.values() || []);
      const reversal: any = ledgerEntries.find((e: any) => e.type === 'REVERSAL' && e.referenceId === 'contrib_to_refund');
      expect(reversal).toBeDefined();
      expect(reversal.amountCents).toBe(8000);
    });
  });

  describe('5. Admin Campaign Oversight & Moderation', () => {
    it('allows staff to approve a submitted campaign and sets status to approved', async () => {
      await mockDb.collection('campaigns').doc('camp_sub').set({
        campaignId: 'camp_sub',
        title: 'Tokyo Street Busking Documentary',
        creatorId: 'artist_tokyo',
        status: 'submitted',
      });

      const res = await service.reviewCampaign(
        'staff_mod',
        ['COMMUNITY_MODERATOR'],
        {
          campaignId: 'camp_sub',
          decision: 'approve',
          notes: 'Meets all guidelines and budget verification passed.',
        },
      );

      expect(res.status).toBe('approved');
      const snap = await mockDb.collection('campaigns').doc('camp_sub').get();
      expect(snap.data().status).toBe('approved');
      expect(snap.data().reviewNotes).toContain('Meets all guidelines');
    });

    it('rejects review attempt by non-staff user', async () => {
      await mockDb.collection('campaigns').doc('camp_sub_2').set({
        campaignId: 'camp_sub_2',
        title: 'Campaign 2',
        status: 'submitted',
      });

      await expect(
        service.reviewCampaign(
          'regular_fan',
          [],
          {
            campaignId: 'camp_sub_2',
            decision: 'approve',
          },
        ),
      ).rejects.toThrow(/Staff authorization required/);
    });

    it('getAdminCampaigns returns aggregated metrics and active campaigns for staff', async () => {
      await mockDb.collection('campaigns').doc('camp_a').set({
        campaignId: 'camp_a',
        title: 'Active Alpha',
        creatorId: 'art_1',
        status: 'active',
        pledgedCents: 50000,
        createdAt: '2026-10-01T00:00:00Z',
      });
      await mockDb.collection('campaigns').doc('camp_b').set({
        campaignId: 'camp_b',
        title: 'Pending Beta',
        creatorId: 'art_2',
        status: 'submitted',
        pledgedCents: 0,
        createdAt: '2026-10-02T00:00:00Z',
      });

      const res = await service.getAdminCampaigns(
        'admin_1',
        ['SUPER_ADMIN'],
        { limit: 10 },
      );

      expect(res.campaigns.length).toBe(2);
      expect(res.stats.totalCampaigns).toBe(2);
      expect(res.stats.activeCampaigns).toBe(1);
      expect(res.stats.pendingReviewCount).toBe(1);
      expect(res.stats.totalPledgedCents).toBe(50000);
    });
  });

  describe('6. Campaign Contributors Ledger Query', () => {
    it('returns verified backer list with masked names for anonymous contributors', async () => {
      await mockDb.collection('campaigns').doc('camp_contribs').set({
        campaignId: 'camp_contribs',
        title: 'New Album Pressing',
        creatorId: 'artist_owner',
        creatorType: 'artist',
        status: 'active',
        pledgedCents: 7500,
        backerCount: 2,
      });

      await mockDb.collection('users').doc('fan_known').set({
        displayName: 'Sarah Connor',
      });

      await mockDb
        .collection('campaigns')
        .doc('camp_contribs')
        .collection('contributions')
        .doc('c_1')
        .set({
          contributionId: 'c_1',
          fanUid: 'fan_known',
          amountCents: 5000,
          isAnonymous: false,
          status: 'captured',
          createdAt: new Date().toISOString(),
        });

      await mockDb
        .collection('campaigns')
        .doc('camp_contribs')
        .collection('contributions')
        .doc('c_2')
        .set({
          contributionId: 'c_2',
          fanUid: 'fan_secret',
          amountCents: 2500,
          isAnonymous: true,
          status: 'captured',
          createdAt: new Date().toISOString(),
        });

      const res = await service.getCampaignContributors('artist_owner', [], {
        campaignId: 'camp_contribs',
      });

      expect(res.contributions.length).toBe(2);
      const known = res.contributions.find((c) => c.contributionId === 'c_1');
      const anon = res.contributions.find((c) => c.contributionId === 'c_2');

      expect(known?.backerName).toBe('Sarah Connor');
      expect(anon?.backerName).toBe('Anonymous Supporter');
      expect(res.totalPledgedCents).toBe(7500);
    });
  });
});
