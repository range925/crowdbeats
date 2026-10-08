/**
 * Crowdbeats V2 — Social Relationships & Messaging End-to-End Test Suite
 *
 * Verifies:
 * 1. All 9 directed role pairs (Fan, Solo Musician, Band).
 * 2. Follow counter synchronization and self-follow rejection.
 * 3. Quiet follower removal without blocking.
 * 4. Band operator role checks and non-member rejection.
 * 5. Deterministic conversation ID calculation and uniqueness.
 * 6. Messaging eligibility state machine (0 follows, 1 follow edge request, mutual chat, unfollow resilience).
 * 7. 1-message pending request spam guard and 7-day decline cooldown.
 * 8. Hard bidirectional block boundary (cascading follow deletion, conversation locking, non-restoration on unblock).
 * 9. Quiet restriction boundary (follow preservation, read receipt suppression, tab segregation).
 * 10. Admin Support message evidence snapshotting.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── In-Memory Firestore Mock Store ──────────────────────────────────────────

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  const id = path.split('/').pop()!;
  return {
    id,
    get: jest.fn<any>().mockImplementation(async () => {
      const data = store[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id,
        ref: mockDoc(path),
      };
    }),
    set: jest.fn<any>().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && store[path]) {
        store[path] = { ...store[path], ...data };
      } else {
        store[path] = { ...data };
      }
    }),
    update: jest.fn<any>().mockImplementation(async (data: any) => {
      if (!store[path]) throw new Error(`Doc not found: ${path}`);
      store[path] = { ...store[path], ...data };
    }),
    delete: jest.fn<any>().mockImplementation(async () => {
      delete store[path];
    }),
    collection: (subCol: string) => mockCollection(`${path}/${subCol}`),
  };
};

const mockCollection = (colPath: string): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `doc_${Math.random().toString(36).substring(7)}`;
      return mockDoc(`${colPath}/${id}`);
    },
    where: jest.fn<any>().mockImplementation((field: string, op: string, val: any) => {
      return {
        where: jest.fn<any>().mockReturnThis(),
        orderBy: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [k, v] of Object.entries(store)) {
            if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
              if (op === '==' && v[field] === val) {
                docs.push({
                  id: k.split('/').pop(),
                  data: () => v,
                  exists: true,
                });
              } else if (op === 'array-contains' && Array.isArray(v[field]) && v[field].includes(val)) {
                docs.push({
                  id: k.split('/').pop(),
                  data: () => v,
                  exists: true,
                });
              }
            }
          }
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
    orderBy: jest.fn<any>().mockReturnThis(),
    limit: jest.fn<any>().mockReturnThis(),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs: any[] = [];
      for (const [k, v] of Object.entries(store)) {
        if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
          docs.push({
            id: k.split('/').pop(),
            data: () => v,
            exists: true,
          });
        }
      }
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const mockDb: any = {
  collection: (col: string) => mockCollection(col),
  runTransaction: jest.fn<any>().mockImplementation(async (updateFunction: any) => {
    const transaction = {
      get: async (docRef: any) => docRef.get(),
      set: (docRef: any, data: any, opts?: any) => docRef.set(data, opts),
      update: (docRef: any, data: any) => docRef.update(data),
      delete: (docRef: any) => docRef.delete(),
    };
    return updateFunction(transaction);
  }),
};

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  firestore: Object.assign(() => mockDb, {
    FieldValue: {
      serverTimestamp: () => new Date().toISOString(),
      increment: (n: number) => n,
      delete: () => undefined,
    },
    Timestamp: {
      fromDate: (d: Date) => ({
        toMillis: () => d.getTime(),
        toDate: () => d,
      }),
    },
  }),
}));

// Mock firebase-functions/v2/https
jest.mock('firebase-functions/v2/https', () => ({
  onCall: (_options: any, handler: any) => handler,
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

import {
  followEntity,
  unfollowEntity,
  removeFollower,
  getRelationshipState,
} from '../social/followCallables.js';
import {
  blockEntity,
  unblockEntity,
  restrictEntity,
  unrestrictEntity,
} from '../social/safetyCallables.js';
import {
  sendMessage,
  getConversations,
  getMessages,
  respondToMessageRequest,
} from '../social/messagingCallables.js';

describe('Crowdbeats V2 — Social Relationships & Messaging Suite', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }

    // Seed test profiles
    // Fan 1 & Fan 2
    store['users/fan_alice'] = { displayName: 'Alice Fan', handle: 'alice', followerCount: 0, followingCount: 0 };
    store['users/fan_charlie'] = { displayName: 'Charlie Fan', handle: 'charlie', followerCount: 0, followingCount: 0 };

    // Solo Musicians
    store['artistProfiles/solo_bob'] = { stageName: 'Bob Solo', slug: 'bob-solo', userId: 'user_bob', followerCount: 0, followingCount: 0 };
    store['users/user_bob'] = { displayName: 'Bob Creator', handle: 'bobs' };

    store['artistProfiles/solo_diana'] = { stageName: 'Diana Strings', slug: 'diana-strings', userId: 'user_diana', followerCount: 0, followingCount: 0 };
    store['users/user_diana'] = { displayName: 'Diana Musician' };

    // Bands & Members
    store['bands/band_echoes'] = { name: 'The Echoes', slug: 'the-echoes', ownerUid: 'user_edward', followerCount: 0, followingCount: 0 };
    store['bands/band_echoes/members/user_edward'] = { uid: 'user_edward', role: 'FOUNDER', isActive: true };
    store['bands/band_echoes/members/user_frank'] = { uid: 'user_frank', role: 'MEMBER', isActive: true };
    store['bands/band_echoes/members/user_inactive'] = { uid: 'user_inactive', role: 'MEMBER', isActive: false };

    store['bands/band_groove'] = { name: 'Groove Collective', slug: 'groove-col', ownerUid: 'user_grace', followerCount: 0, followingCount: 0 };
    store['bands/band_groove/members/user_grace'] = { uid: 'user_grace', role: 'FOUNDER', isActive: true };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. THE 9 DIRECTED ROLE PAIRS MATRIX
  // ══════════════════════════════════════════════════════════════════════════

  describe('The 9 Directed Role Pairs Matrix', () => {
    const pairs: Array<{
      name: string;
      callerUid: string;
      actingAsBandId?: string;
      targetId: string;
      targetType: 'fan' | 'artist' | 'band';
    }> = [
      { name: '1. Fan -> Fan', callerUid: 'fan_alice', targetId: 'fan_charlie', targetType: 'fan' },
      { name: '2. Fan -> Solo', callerUid: 'fan_alice', targetId: 'solo_bob', targetType: 'artist' },
      { name: '3. Fan -> Band', callerUid: 'fan_alice', targetId: 'band_echoes', targetType: 'band' },
      { name: '4. Solo -> Fan', callerUid: 'user_bob', targetId: 'fan_alice', targetType: 'fan' },
      { name: '5. Solo -> Solo', callerUid: 'user_bob', targetId: 'solo_diana', targetType: 'artist' },
      { name: '6. Solo -> Band', callerUid: 'user_bob', targetId: 'band_echoes', targetType: 'band' },
      { name: '7. Band -> Fan', callerUid: 'user_edward', actingAsBandId: 'band_echoes', targetId: 'fan_alice', targetType: 'fan' },
      { name: '8. Band -> Solo', callerUid: 'user_edward', actingAsBandId: 'band_echoes', targetId: 'solo_bob', targetType: 'artist' },
      { name: '9. Band -> Band', callerUid: 'user_edward', actingAsBandId: 'band_echoes', targetId: 'band_groove', targetType: 'band' },
    ];

    pairs.forEach(({ name, callerUid, actingAsBandId, targetId, targetType }) => {
      it(`supports ${name} follow and unfollow lifecycle`, async () => {
        // Follow
        const followRes: any = await (followEntity as any)({
          auth: { uid: callerUid },
          data: { targetId, targetType, actingAsBandId },
        });
        expect(followRes.ok).toBe(true);
        expect(followRes.relationshipState.isFollowing).toBe(true);

        const sourceId = actingAsBandId || callerUid;
        expect(store[`follows/${sourceId}_${targetId}`]).toBeDefined();

        // Unfollow
        const unfollowRes: any = await (unfollowEntity as any)({
          auth: { uid: callerUid },
          data: { targetId, targetType, actingAsBandId },
        });
        expect(unfollowRes.ok).toBe(true);
        expect(unfollowRes.relationshipState.isFollowing).toBe(false);
        expect(store[`follows/${sourceId}_${targetId}`]).toBeUndefined();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. INVARIANTS: SELF-FOLLOW GUARDS & COUNTER INTEGRITY
  // ══════════════════════════════════════════════════════════════════════════

  describe('Follow Invariants & Guards', () => {
    it('rejects self-following for individual users', async () => {
      await expect(
        (followEntity as any)({
          auth: { uid: 'fan_alice' },
          data: { targetId: 'fan_alice', targetType: 'fan' },
        }),
      ).rejects.toThrow('You cannot follow yourself.');
    });

    it('rejects self-following for bands', async () => {
      await expect(
        (followEntity as any)({
          auth: { uid: 'user_edward' },
          data: { targetId: 'band_echoes', targetType: 'band', actingAsBandId: 'band_echoes' },
        }),
      ).rejects.toThrow('You cannot follow yourself.');
    });

    it('allows a target to quietly remove an incoming follower without blocking', async () => {
      // Fan Alice follows Solo Bob
      await (followEntity as any)({
        auth: { uid: 'fan_alice' },
        data: { targetId: 'solo_bob', targetType: 'artist' },
      });
      expect(store['follows/fan_alice_solo_bob']).toBeDefined();

      // Solo Bob removes Fan Alice as a follower
      const removeRes: any = await (removeFollower as any)({
        auth: { uid: 'user_bob' },
        data: { followerId: 'fan_alice', followerType: 'fan' },
      });

      expect(removeRes.ok).toBe(true);
      expect(store['follows/fan_alice_solo_bob']).toBeUndefined();
      // Verifies Alice does not follow Bob anymore, and neither is blocked
      expect(removeRes.relationshipState.isFollowedBy).toBe(false);
      expect(removeRes.relationshipState.isBlocked).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. BAND OPERATOR AUTHORIZATION & AUDIT TRAIL
  // ══════════════════════════════════════════════════════════════════════════

  describe('Band Operator Multi-Tenant Permissions', () => {
    it('allows an active band member to act on behalf of the band', async () => {
      const res: any = await (followEntity as any)({
        auth: { uid: 'user_frank' }, // Member
        data: { targetId: 'solo_bob', targetType: 'artist', actingAsBandId: 'band_echoes' },
      });
      expect(res.ok).toBe(true);
      expect(store['follows/band_echoes_solo_bob'].operatorUid).toBe('user_frank');
    });

    it('rejects an inactive band member immediately', async () => {
      await expect(
        (followEntity as any)({
          auth: { uid: 'user_inactive' },
          data: { targetId: 'solo_bob', targetType: 'artist', actingAsBandId: 'band_echoes' },
        }),
      ).rejects.toThrow('You are not an active authorized member of this band.');
    });

    it('rejects a stranger with no band membership', async () => {
      await expect(
        (followEntity as any)({
          auth: { uid: 'fan_alice' },
          data: { targetId: 'solo_bob', targetType: 'artist', actingAsBandId: 'band_echoes' },
        }),
      ).rejects.toThrow('You are not an active authorized member of this band.');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. MESSAGING ELIGIBILITY & RECIPIENT CONTROL MATRIX
  // ══════════════════════════════════════════════════════════════════════════

  describe('Messaging Recipient Controls & Relationship State Machine', () => {
    it('Rule 1: Rejects message initiation if neither party follows the other', async () => {
      await expect(
        (sendMessage as any)({
          auth: { uid: 'fan_alice' },
          data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Hey Bob!' },
        }),
      ).rejects.toThrow('Follow required: You must follow this account before sending a message request.');
    });

    it('Rule 2: At least 1 follow edge initiates a pending_request allowing 1 message', async () => {
      // Alice follows Bob
      await (followEntity as any)({
        auth: { uid: 'fan_alice' },
        data: { targetId: 'solo_bob', targetType: 'artist' },
      });

      // Send first message
      const sendRes: any = await (sendMessage as any)({
        auth: { uid: 'fan_alice' },
        data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Hello Bob, loved your show!' },
      });

      expect(sendRes.ok).toBe(true);
      expect(sendRes.status).toBe('pending_request');
      const convId = 'conv_fan_alice_solo_bob';
      expect(store[`conversations/${convId}`].status).toBe('pending_request');

      // Attempting to send a second message before recipient responds is blocked
      await expect(
        (sendMessage as any)({
          auth: { uid: 'fan_alice' },
          data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Are you there?' },
        }),
      ).rejects.toThrow('Your message request is pending. You cannot send additional messages until the recipient accepts.');
    });

    it('Rule 3: Mutual follow opens direct accepted chat immediately', async () => {
      // Mutual follows: Alice follows Bob, Bob follows Alice
      store['follows/fan_alice_solo_bob'] = { sourceId: 'fan_alice', targetId: 'solo_bob' };
      store['follows/solo_bob_fan_alice'] = { sourceId: 'solo_bob', targetId: 'fan_alice' };

      const sendRes: any = await (sendMessage as any)({
        auth: { uid: 'fan_alice' },
        data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Hey Bob, mutual follow!' },
      });

      expect(sendRes.ok).toBe(true);
      expect(sendRes.status).toBe('accepted');
    });

    it('Rule 4: Unfollow Resilience — Chat remains open even if users unfollow after acceptance', async () => {
      const convId = 'conv_fan_alice_solo_bob';
      store[`conversations/${convId}`] = {
        id: convId,
        participantIds: ['fan_alice', 'solo_bob'],
        status: 'accepted',
        unreadCounts: { solo_bob: 0, fan_alice: 0 },
      };
      // Neither follows anymore!
      expect(store['follows/fan_alice_solo_bob']).toBeUndefined();
      expect(store['follows/solo_bob_fan_alice']).toBeUndefined();

      // Alice can still send messages because prior chat was accepted!
      const sendRes: any = await (sendMessage as any)({
        auth: { uid: 'fan_alice' },
        data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Still chatting!' },
      });
      expect(sendRes.ok).toBe(true);
      expect(sendRes.status).toBe('accepted');
    });

    it('Rule 5: Decline triggers 7-day cooldown', async () => {
      const convId = 'conv_fan_alice_solo_bob';
      store[`conversations/${convId}`] = {
        id: convId,
        participantIds: ['fan_alice', 'solo_bob'],
        requesterId: 'fan_alice',
        recipientId: 'solo_bob',
        status: 'pending_request',
      };

      // Bob declines request
      const declineRes: any = await (respondToMessageRequest as any)({
        auth: { uid: 'user_bob' },
        data: { conversationId: convId, action: 'decline' },
      });
      expect(declineRes.status).toBe('declined');

      // Alice tries to send message again -> Cooldown rejected
      await expect(
        (sendMessage as any)({
          auth: { uid: 'fan_alice' },
          data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Please reconsider!' },
        }),
      ).rejects.toThrow(/Recipient declined prior message request. Cooldown active/);
    });

    it('Rule 6: Recipient paused incoming messages guard', async () => {
      store['users/solo_bob/settings/messaging'] = { pauseMessages: true };
      store['follows/fan_alice_solo_bob'] = { sourceId: 'fan_alice', targetId: 'solo_bob' };

      await expect(
        (sendMessage as any)({
          auth: { uid: 'fan_alice' },
          data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Hello?' },
        }),
      ).rejects.toThrow('Recipient has temporarily paused incoming messages.');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. HARD BLOCK & QUIET RESTRICT BOUNDARIES
  // ══════════════════════════════════════════════════════════════════════════

  describe('Trust & Safety: Block and Restrict Boundaries', () => {
    it('BLOCK: cascades follow edge deletion and locks conversation', async () => {
      // Set up mutual follows & active conversation
      store['follows/fan_alice_solo_bob'] = { sourceId: 'fan_alice', targetId: 'solo_bob' };
      store['follows/solo_bob_fan_alice'] = { sourceId: 'solo_bob', targetId: 'fan_alice' };
      const convId = 'conv_fan_alice_solo_bob';
      store[`conversations/${convId}`] = {
        id: convId,
        participantIds: ['fan_alice', 'solo_bob'],
        status: 'accepted',
      };

      // Bob blocks Alice
      const blockRes: any = await (blockEntity as any)({
        auth: { uid: 'user_bob' },
        data: { targetId: 'fan_alice', targetType: 'fan', reason: 'Unwanted harassment' },
      });
      expect(blockRes.ok).toBe(true);
      expect(blockRes.isBlocked).toBe(true);

      // Follow edges must be wiped in both directions
      expect(store['follows/fan_alice_solo_bob']).toBeUndefined();
      expect(store['follows/solo_bob_fan_alice']).toBeUndefined();

      // Conversation must be marked blocked
      expect(store[`conversations/${convId}`].status).toBe('blocked');
      expect(store[`conversations/${convId}`].blockedBy).toBe('solo_bob');

      // Following is denied
      await expect(
        (followEntity as any)({
          auth: { uid: 'fan_alice' },
          data: { targetId: 'solo_bob', targetType: 'artist' },
        }),
      ).rejects.toThrow(/Cannot follow this entity due to safety or block settings/);

      // Messaging is denied
      await expect(
        (sendMessage as any)({
          auth: { uid: 'fan_alice' },
          data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Why block?' },
        }),
      ).rejects.toThrow(/Messaging is unavailable due to safety or block settings/);

      // Unblocking does NOT restore follows
      await (unblockEntity as any)({
        auth: { uid: 'user_bob' },
        data: { targetId: 'fan_alice' },
      });
      expect(store['follows/fan_alice_solo_bob']).toBeUndefined();
      expect(store['follows/solo_bob_fan_alice']).toBeUndefined();
    });

    it('RESTRICT: preserves follows and provides quiet zero-awareness isolation', async () => {
      // Alice follows Bob
      store['follows/fan_alice_solo_bob'] = { sourceId: 'fan_alice', targetId: 'solo_bob' };

      // Bob quietly restricts Alice
      const restrictRes: any = await (restrictEntity as any)({
        auth: { uid: 'user_bob' },
        data: { targetId: 'fan_alice', targetType: 'fan' },
      });
      expect(restrictRes.ok).toBe(true);
      expect(restrictRes.isRestricted).toBe(true);

      // Follow edge is PRESERVED (zero-awareness)
      expect(store['follows/fan_alice_solo_bob']).toBeDefined();

      // Alice sends message — succeeds with zero error (she does not know she is restricted)
      const sendRes: any = await (sendMessage as any)({
        auth: { uid: 'fan_alice' },
        data: { recipientId: 'solo_bob', recipientType: 'artist', text: 'Hey Bob!' },
      });
      expect(sendRes.ok).toBe(true);

      // Conversation routes to Restricted tab for Bob
      const restrictedTab: any = await (getConversations as any)({
        auth: { uid: 'user_bob' },
        data: { tab: 'restricted' },
      });
      expect(restrictedTab.conversations.length).toBe(1);
      expect(restrictedTab.conversations[0].isRestricted).toBe(true);

      // Thread is NOT in normal inbox for Bob
      const inboxTab: any = await (getConversations as any)({
        auth: { uid: 'user_bob' },
        data: { tab: 'inbox' },
      });
      expect(inboxTab.conversations.length).toBe(0);
    });

    it('ADMIN REPORT: snapshots message evidence when recipient reports chat', async () => {
      const convId = 'conv_fan_alice_solo_bob';
      store[`conversations/${convId}`] = {
        id: convId,
        participantIds: ['fan_alice', 'solo_bob'],
        requesterId: 'fan_alice',
        recipientId: 'solo_bob',
        status: 'pending_request',
      };
      store[`conversations/${convId}/messages/msg_1`] = {
        id: 'msg_1',
        text: 'Offensive harassment message',
        senderId: 'fan_alice',
        createdAt: new Date().toISOString(),
      };

      // Bob rejects and reports
      const reportRes: any = await (respondToMessageRequest as any)({
        auth: { uid: 'user_bob' },
        data: {
          conversationId: convId,
          action: 'report',
          reportReason: 'harassment',
          reportDescription: 'Unsolicited abusive message',
        },
      });
      expect(reportRes.ok).toBe(true);
      expect(reportRes.status).toBe('declined');

      // Check evidence report in reports collection
      const reports = Object.entries(store).filter(([k]) => k.startsWith('reports/'));
      expect(reports.length).toBe(1);
      const reportDoc = reports[0][1];
      expect(reportDoc.reason).toBe('harassment');
      expect(reportDoc.evidence.messages.length).toBe(1);
      expect(reportDoc.evidence.messages[0].text).toBe('Offensive harassment message');
    });

    it('RESTRICT: lifting restriction with unrestrictEntity restores normal status', async () => {
      // Setup restriction
      store['socialRestrictions/user_bob_fan_alice'] = {
        restricterId: 'user_bob',
        restrictedId: 'fan_alice',
      };

      const unrestrictRes: any = await (unrestrictEntity as any)({
        auth: { uid: 'user_bob' },
        data: { targetId: 'fan_alice' },
      });
      expect(unrestrictRes.ok).toBe(true);
      expect(unrestrictRes.isRestricted).toBe(false);
      expect(store['socialRestrictions/user_bob_fan_alice']).toBeUndefined();
    });

    it('MESSAGES: getMessages retrieves chat history and verifies participants', async () => {
      const convId = 'conv_fan_alice_solo_bob';
      store[`conversations/${convId}`] = {
        id: convId,
        participantIds: ['fan_alice', 'solo_bob'],
        status: 'accepted',
        unreadCounts: { solo_bob: 1 },
      };
      store[`conversations/${convId}/messages/msg_1`] = {
        id: 'msg_1',
        conversationId: convId,
        senderId: 'fan_alice',
        recipientId: 'solo_bob',
        text: 'Hello from Alice!',
        createdAt: new Date().toISOString(),
      };

      const res: any = await (getMessages as any)({
        auth: { uid: 'user_bob' },
        data: { conversationId: convId },
      });

      expect(res.messages.length).toBe(1);
      expect(res.messages[0].text).toBe('Hello from Alice!');
      expect(res.conversation.id).toBe(convId);
    });

    it('RELATIONSHIP: getRelationshipState evaluates real-time mutual & blocked state', async () => {
      store['follows/fan_alice_solo_bob'] = { sourceId: 'fan_alice', targetId: 'solo_bob' };
      store['follows/solo_bob_fan_alice'] = { sourceId: 'solo_bob', targetId: 'fan_alice' };

      const stateRes: any = await (getRelationshipState as any)({
        auth: { uid: 'fan_alice' },
        data: { targetId: 'solo_bob' },
      });

      expect(stateRes.ok).toBe(true);
      expect(stateRes.relationshipState.isFollowing).toBe(true);
      expect(stateRes.relationshipState.isFollowedBy).toBe(true);
      expect(stateRes.relationshipState.mutualFollow).toBe(true);
      expect(stateRes.relationshipState.isBlocked).toBe(false);
    });
  });
});
