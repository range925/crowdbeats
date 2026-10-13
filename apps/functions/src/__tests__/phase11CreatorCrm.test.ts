import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getCreatorSupporters,
  getCreatorTipAnalytics,
  getCreatorSupporterDetails,
  sendCreatorThankYouNote,
  canAccessCreatorCrm,
} from '../creator/creatorCrmService';

describe('Phase 11: Solo Musician Creator CRM Service', () => {
  let mockStore: Record<string, any>;
  let mockDb: any;

  beforeEach(() => {
    mockStore = {};

    const createDocRef = (path: string) => ({
      id: path.split('/').pop()!,
      path,
      get: jest.fn(async () => {
        const data = mockStore[path];
        return {
          exists: data !== undefined,
          id: path.split('/').pop()!,
          data: () => data,
        };
      }),
      set: jest.fn(async (data: any, options?: any) => {
        if (options?.merge && mockStore[path]) {
          mockStore[path] = { ...mockStore[path], ...data };
        } else {
          mockStore[path] = { ...data };
        }
      }),
      update: jest.fn(async (data: any) => {
        if (!mockStore[path]) {
          throw new Error(`Doc ${path} does not exist for update`);
        }
        mockStore[path] = { ...mockStore[path], ...data };
      }),
      collection: (subName: string) => createCollectionRef(`${path}/${subName}`),
    });

    const createQuery = (
      colPath: string,
      filters: Array<{ field: string; op: string; value: any }> = [],
      order?: { field: string; dir: string },
      limitCount?: number
    ): any => {
      return {
        where: (field: string, op: string, value: any) => {
          return createQuery(colPath, [...filters, { field, op, value }], order, limitCount);
        },
        orderBy: (field: string, dir: string = 'asc') => {
          return createQuery(colPath, filters, { field, dir }, limitCount);
        },
        limit: (n: number) => {
          return createQuery(colPath, filters, order, n);
        },
        get: async () => {
          const prefix = `${colPath}/`;
          let docs = Object.keys(mockStore)
            .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
            .map((k) => ({
              id: k.split('/').pop()!,
              ref: createDocRef(k),
              data: () => mockStore[k],
            }))
            .filter((d) => {
              const docData = d.data();
              for (const f of filters) {
                const val = docData[f.field];
                if (f.op === '==') {
                  if (val !== f.value) return false;
                } else if (f.op === 'in') {
                  if (!Array.isArray(f.value) || !f.value.includes(val)) return false;
                } else if (f.op === '>=') {
                  if (val === undefined || val < f.value) return false;
                } else if (f.op === '<=') {
                  if (val === undefined || val > f.value) return false;
                }
              }
              return true;
            });

          if (order) {
            docs.sort((a, b) => {
              const vA = a.data()[order.field] || '';
              const vB = b.data()[order.field] || '';
              return order.dir === 'desc'
                ? String(vB).localeCompare(String(vA))
                : String(vA).localeCompare(String(vB));
            });
          }

          if (limitCount !== undefined && limitCount > 0) {
            docs = docs.slice(0, limitCount);
          }

          return {
            empty: docs.length === 0,
            size: docs.length,
            docs,
            forEach: (cb: (doc: any) => void) => docs.forEach(cb),
          };
        },
      };
    };

    const createCollectionRef = (colPath: string) => {
      const query = createQuery(colPath);
      return {
        ...query,
        id: colPath.split('/').pop()!,
        doc: (id?: string) => {
          const docId = id || `mock_id_${Math.random().toString(36).slice(2, 9)}`;
          return createDocRef(`${colPath}/${docId}`);
        },
      };
    };

    mockDb = {
      collection: (name: string) => createCollectionRef(name),
      doc: (path: string) => createDocRef(path),
      batch: () => {
        const operations: Array<() => Promise<void>> = [];
        return {
          set: (ref: any, data: any, options?: any) => {
            operations.push(async () => {
              await ref.set(data, options);
            });
          },
          update: (ref: any, data: any) => {
            operations.push(async () => {
              await ref.update(data);
            });
          },
          commit: async () => {
            for (const op of operations) {
              await op();
            }
          },
        };
      },
    };
  });

  describe('Creator Ownership & Access Control', () => {
    it('permits creator to access their own CRM', () => {
      const caller = { uid: 'musician_leo', role: 'SOLO_MUSICIAN' };
      expect(canAccessCreatorCrm(caller, 'musician_leo')).toBe(true);
    });

    it('permits authorized staff roles (SUPER_ADMIN, CUSTOMER_SUPPORT, ARTIST_RELATIONS)', () => {
      expect(canAccessCreatorCrm({ uid: 'staff_1', role: 'SUPER_ADMIN' }, 'musician_leo')).toBe(true);
      expect(canAccessCreatorCrm({ uid: 'staff_2', role: 'CUSTOMER_SUPPORT' }, 'musician_leo')).toBe(true);
      expect(canAccessCreatorCrm({ uid: 'staff_3', role: 'ARTIST_RELATIONS' }, 'musician_leo')).toBe(true);
    });

    it('denies access to another musician or fan', () => {
      expect(canAccessCreatorCrm({ uid: 'musician_other', role: 'SOLO_MUSICIAN' }, 'musician_leo')).toBe(false);
      expect(canAccessCreatorCrm({ uid: 'fan_1', role: 'FAN' }, 'musician_leo')).toBe(false);
      expect(canAccessCreatorCrm({}, 'musician_leo')).toBe(false);
    });

    it('throws permission-denied when caller attempts to access another creator CRM', async () => {
      const unauthorizedCaller = { uid: 'unauthorized_user', role: 'FAN' };
      await expect(
        getCreatorSupporters(mockDb, { creatorId: 'musician_leo' }, unauthorizedCaller)
      ).rejects.toThrow('Caller is not authorized to access this creator CRM.');
    });
  });

  describe('getCreatorSupporters & Segmentation', () => {
    const creatorId = 'musician_leo';
    const caller = { uid: creatorId, role: 'SOLO_MUSICIAN' };

    beforeEach(() => {
      const now = new Date();
      const recentIso = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
      const olderIso = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(); // 40 days ago

      // Fan 1: Top Supporter ($60 total tips, follower)
      mockStore['users/fan_top'] = {
        displayName: 'Alice TopFan',
        photoUrl: 'https://cdn.example.com/alice.jpg',
      };
      mockStore['follows/fan_top_musician_leo'] = {
        sourceId: 'fan_top',
        targetId: creatorId,
        createdAt: olderIso,
      };
      mockStore['tips/tip_1'] = {
        recipientId: creatorId,
        fanUid: 'fan_top',
        amountCents: 3500,
        status: 'SUCCEEDED',
        createdAt: recentIso,
        sessionId: 'sess_austin_1',
        sessionTitle: 'Austin Live Set',
      };
      mockStore['tips/tip_2'] = {
        recipientId: creatorId,
        fanUid: 'fan_top',
        amountCents: 2500,
        status: 'SUCCEEDED',
        createdAt: olderIso,
        sessionId: 'sess_austin_1',
        sessionTitle: 'Austin Live Set',
      };

      // Fan 2: Repeat Supporter (2 tips, $20 total)
      mockStore['users/fan_repeat'] = {
        displayName: 'Bob Regular',
      };
      mockStore['tips/tip_3'] = {
        recipientId: creatorId,
        fanUid: 'fan_repeat',
        amountCents: 1000,
        status: 'SUCCEEDED',
        createdAt: recentIso,
      };
      mockStore['tips/tip_4'] = {
        recipientId: creatorId,
        fanUid: 'fan_repeat',
        amountCents: 1000,
        status: 'SUCCEEDED',
        createdAt: olderIso,
      };

      // Fan 3: Campaign Backer ($30 contribution, 1 contribution)
      mockStore['users/fan_backer'] = {
        displayName: 'Charlie Backer',
      };
      mockStore['campaigns/camp_1'] = {
        creatorId,
        title: 'New Album Vinyl Pressing',
      };
      mockStore['campaigns/camp_1/contributions/contrib_1'] = {
        fanUid: 'fan_backer',
        amountCents: 3000,
        status: 'captured',
        createdAt: olderIso,
      };

      // Fan 4: Follower Only (0 financial contributions)
      mockStore['users/fan_follower_only'] = {
        displayName: 'Diana Listener',
      };
      mockStore['follows/fan_follower_only_musician_leo'] = {
        sourceId: 'fan_follower_only',
        targetId: creatorId,
        createdAt: recentIso,
      };

      // Fan 5: Anonymous Tipper
      mockStore['users/fan_anon'] = {
        displayName: 'Secret Fan',
        privacyPreferences: {
          anonymousTipping: true,
          allowDirectMessages: false,
        },
      };
      mockStore['tips/tip_5'] = {
        recipientId: creatorId,
        fanUid: 'fan_anon',
        amountCents: 1500,
        status: 'SUCCEEDED',
        isAnonymous: true,
        createdAt: recentIso,
      };
    });

    it('aggregates supporters, computes lifetime value, and classifies segments correctly', async () => {
      const res = await getCreatorSupporters(mockDb, { creatorId }, caller);

      expect(res.ok).toBe(true);
      expect(res.totalCount).toBe(5);

      const alice = res.supporters.find((s) => s.supporterId === 'fan_top')!;
      expect(alice).toBeDefined();
      expect(alice.displayName).toBe('Alice TopFan');
      expect(alice.lifetimeValueCents).toBe(6000); // $60
      expect(alice.tipsCount).toBe(2);
      expect(alice.segment).toBe('TOP_SUPPORTER');
      expect(alice.isFollower).toBe(true);
      expect(alice.allowsDirectMessaging).toBe(true);

      const bob = res.supporters.find((s) => s.supporterId === 'fan_repeat')!;
      expect(bob).toBeDefined();
      expect(bob.lifetimeValueCents).toBe(2000); // $20
      expect(bob.tipsCount).toBe(2);
      expect(bob.segment).toBe('REPEAT_SUPPORTER');

      const charlie = res.supporters.find((s) => s.supporterId === 'fan_backer')!;
      expect(charlie).toBeDefined();
      expect(charlie.campaignsCount).toBe(1);
      expect(charlie.totalCampaignContributionCents).toBe(3000);
      expect(charlie.segment).toBe('CAMPAIGN_BACKER');

      const diana = res.supporters.find((s) => s.supporterId === 'fan_follower_only')!;
      expect(diana).toBeDefined();
      expect(diana.lifetimeValueCents).toBe(0);
      expect(diana.isFollower).toBe(true);
      expect(diana.segment).toBe('FOLLOWER_ONLY');

      // Verify Anonymous Fan masking
      const anon = res.supporters.find((s) => s.supporterId === 'fan_anon')!;
      expect(anon).toBeDefined();
      expect(anon.displayName).toBe('Anonymous Supporter');
      expect(anon.photoUrl).toBeNull();
      expect(anon.isAnonymous).toBe(true);
      expect(anon.allowsDirectMessaging).toBe(false);
    });

    it('calculates accurate tip analytics including top tipping session and repeat supporter rate', async () => {
      const res = await getCreatorTipAnalytics(mockDb, { creatorId }, caller);

      expect(res.ok).toBe(true);
      const a = res.analytics;
      expect(a.totalTipsReceivedCents).toBe(9500); // 3500 + 2500 + 1000 + 1000 + 1500 = $95.00
      expect(a.totalTipsCount).toBe(5);
      expect(a.averageTipCents).toBe(1900); // 9500 / 5 = $19.00
      expect(a.topTippingSession).toBeDefined();
      expect(a.topTippingSession?.sessionId).toBe('sess_austin_1');
      expect(a.topTippingSession?.totalCents).toBe(6000);
      expect(a.topSupportersCount).toBe(1); // Alice
      expect(a.repeatSupportersCount).toBe(2); // Alice & Bob
    });

    it('filters supporters by segmentFilter', async () => {
      const repeatRes = await getCreatorSupporters(mockDb, { creatorId, segmentFilter: 'repeat' }, caller);
      expect(repeatRes.supporters.every((s) => s.segment === 'REPEAT_SUPPORTER' || (s.tipsCount + s.campaignsCount) >= 2)).toBe(true);

      const topRes = await getCreatorSupporters(mockDb, { creatorId, segmentFilter: 'top' }, caller);
      expect(topRes.supporters.length).toBe(1);
      expect(topRes.supporters[0].supporterId).toBe('fan_top');

      const followersRes = await getCreatorSupporters(mockDb, { creatorId, segmentFilter: 'followers' }, caller);
      expect(followersRes.supporters.every((s) => s.isFollower)).toBe(true);

      const campaignRes = await getCreatorSupporters(mockDb, { creatorId, segmentFilter: 'campaign' }, caller);
      expect(campaignRes.supporters.length).toBe(1);
      expect(campaignRes.supporters[0].supporterId).toBe('fan_backer');
    });

    it('filters supporters by searchQuery', async () => {
      const res = await getCreatorSupporters(mockDb, { creatorId, searchQuery: 'Alice' }, caller);
      expect(res.supporters.length).toBe(1);
      expect(res.supporters[0].displayName).toBe('Alice TopFan');
    });
  });

  describe('getCreatorSupporterDetails', () => {
    const creatorId = 'musician_leo';
    const caller = { uid: creatorId, role: 'SOLO_MUSICIAN' };

    it('compiles chronological engagement history and itemized tip breakdown', async () => {
      mockStore['users/fan_detail'] = { displayName: 'David Fan' };
      mockStore['follows/fan_detail_musician_leo'] = {
        sourceId: 'fan_detail',
        targetId: creatorId,
        createdAt: '2026-10-01T12:00:00Z',
      };
      mockStore['tips/tip_d1'] = {
        recipientId: creatorId,
        fanUid: 'fan_detail',
        amountCents: 2000,
        status: 'SUCCEEDED',
        message: 'Great guitar solo!',
        sessionId: 'sess_austin_1',
        createdAt: '2026-10-05T20:00:00Z',
      };

      const res = await getCreatorSupporterDetails(
        mockDb,
        { creatorId, supporterId: 'fan_detail' },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.details.supporter.supporterId).toBe('fan_detail');
      expect(res.details.tipBreakdown.length).toBe(1);
      expect(res.details.tipBreakdown[0].amountCents).toBe(2000);
      expect(res.details.tipBreakdown[0].message).toBe('Great guitar solo!');

      // Check chronological engagement history
      expect(res.details.engagementHistory.length).toBe(2);
      expect(res.details.engagementHistory[0].type).toBe('TIP_RECEIVED');
      expect(res.details.engagementHistory[0].amountCents).toBe(2000);
      expect(res.details.engagementHistory[1].type).toBe('STARTED_FOLLOWING');
    });
  });

  describe('sendCreatorThankYouNote & Consent Protection', () => {
    const creatorId = 'musician_leo';
    const caller = { uid: creatorId, role: 'SOLO_MUSICIAN' };

    it('rejects sending message if supporter has opted out of direct messages', async () => {
      mockStore['users/fan_optout'] = {
        displayName: 'Private Fan',
        privacyPreferences: {
          allowDirectMessages: false,
        },
      };

      await expect(
        sendCreatorThankYouNote(
          mockDb,
          {
            creatorId,
            supporterId: 'fan_optout',
            message: 'Thank you for your tip!',
          },
          caller
        )
      ).rejects.toThrow('Fan privacy settings do not permit direct messages.');
    });

    it('rejects sending message if supporter tipped anonymously', async () => {
      mockStore['users/fan_anon_2'] = {
        displayName: 'Anonymous Tipper',
        privacyPreferences: {
          anonymousTipping: true,
        },
      };

      await expect(
        sendCreatorThankYouNote(
          mockDb,
          {
            creatorId,
            supporterId: 'fan_anon_2',
            message: 'Thank you!',
          },
          caller
        )
      ).rejects.toThrow('Cannot message an anonymous supporter.');
    });

    it('successfully delivers thank you note and creates conversation and CRM event when consent is granted', async () => {
      mockStore['users/fan_open'] = {
        displayName: 'Emma Fan',
        privacyPreferences: {
          allowDirectMessages: true,
        },
      };

      const res = await sendCreatorThankYouNote(
        mockDb,
        {
          creatorId,
          supporterId: 'fan_open',
          message: 'Thank you so much for the generous tip during my Austin set!',
        },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.conversationId).toBeDefined();
      expect(res.messageId).toBeDefined();

      // Check message stored
      const msgPath = `conversations/${res.conversationId}/messages/${res.messageId}`;
      const msg = mockStore[msgPath];
      expect(msg).toBeDefined();
      expect(msg.text).toContain('Austin set');
      expect(msg.senderId).toBe(creatorId);
      expect(msg.recipientId).toBe('fan_open');
      expect(msg.isThankYouNote).toBe(true);

      // Check CRM event
      const crmKeys = Object.keys(mockStore).filter((k) => k.startsWith('crmEvents/'));
      expect(crmKeys.length).toBe(1);
      expect(mockStore[crmKeys[0]].eventType).toBe('CREATOR_MESSAGE_SENT');
      expect(mockStore[crmKeys[0]].targetId).toBe('fan_open');
    });
  });
});
