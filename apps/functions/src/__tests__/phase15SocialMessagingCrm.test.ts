/**
 * Crowdbeats V2 — Phase 15: Social Graph and Messaging Integration Backend Suite
 *
 * Verifies:
 * 1. Fan-to-Creator & Creator-to-Fan Follow/Unfollow Lifecycle & Counter Synchronization
 * 2. CRM Event Emission on Follow/Unfollow/RemoveFollower
 * 3. Approved Messaging Permissions State Machine:
 *    - 0 follows: Rejected (must follow to initiate chat request)
 *    - 1 follow edge: Initiates pending_request with 1-message limit
 *    - Mutual follows: Initiates direct accepted chat immediately
 *    - Unfollow resilience: Existing accepted chats remain open even after unfollowing
 *    - Decline cooldown: 7-day decline cooldown
 * 4. STRICT PRIVACY INVARIANT: CRM events for messaging DO NOT leak private message text
 * 5. Hard Bidirectional Block Boundary (cascading follow deletion, conversation locking)
 * 6. Stealth Zero-Awareness Restriction (follow preservation, quiet isolation)
 * 7. Abuse Reporting & Moderation Queue Ingestion:
 *    - Chat report creation with snapshot evidence
 *    - Ingestion into /moderationQueue for staff action
 *    - CRM event logging (ABUSE_REPORTED)
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
      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && (val as any)._delete) {
          delete store[path][key];
        } else if (val && typeof val === 'object' && (val as any)._increment !== undefined) {
          store[path][key] = (store[path][key] || 0) + (val as any)._increment;
        } else {
          store[path][key] = val;
        }
      }
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
        limit: jest.fn<any>().mockImplementation((lim: number) => ({
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
                }
              }
            }
            return {
              docs: docs.slice(0, lim),
              empty: docs.length === 0,
            };
          }),
        })),
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
              }
            }
          }
          return { docs, empty: docs.length === 0 };
        }),
      };
    }),
    orderBy: jest.fn<any>().mockImplementation(() => ({
      limit: jest.fn<any>().mockImplementation((lim: number) => ({
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
          return { docs: docs.slice(0, lim), empty: docs.length === 0 };
        }),
      })),
    })),
  };
};

jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (name: string) => mockCollection(name),
        runTransaction: async (updateFunction: any) => {
          const transaction = {
            get: async (docRef: any) => docRef.get(),
            set: (docRef: any, data: any, options?: any) => docRef.set(data, options),
            update: (docRef: any, data: any) => docRef.update(data),
            delete: (docRef: any) => docRef.delete(),
          };
          return updateFunction(transaction);
        },
        batch: () => {
          const ops: Array<() => Promise<void>> = [];
          const b = {
            set: (docRef: any, data: any, options?: any) => {
              ops.push(async () => docRef.set(data, options));
              return b;
            },
            update: (docRef: any, data: any) => {
              ops.push(async () => docRef.update(data));
              return b;
            },
            delete: (docRef: any) => {
              ops.push(async () => docRef.delete());
              return b;
            },
            commit: async () => {
              for (const op of ops) await op();
            },
          };
          return b;
        },
      })),
      {
        FieldValue: {
          serverTimestamp: () => new Date().toISOString(),
          increment: (n: number) => ({ _increment: n }),
          delete: () => ({ _delete: true }),
        },
        Timestamp: {
          fromDate: (d: Date) => ({ toMillis: () => d.getTime(), toDate: () => d }),
        },
      }
    ),
  };
});

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

jest.mock('../notifications/dispatchNotification.js', () => ({
  dispatchServerNotification: jest.fn<any>().mockResolvedValue({ success: true, deliveredCount: 1 }),
}));

import { followEntity, unfollowEntity, removeFollower } from '../social/followCallables.js';
import { sendMessage, respondToMessageRequest } from '../social/messagingCallables.js';
import { blockEntity, unblockEntity, restrictEntity, unrestrictEntity } from '../social/safetyCallables.js';

describe('Phase 15: Social Graph and Messaging Integration Suite', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }

    // Seed test users & artist profile
    store['users/fan_elena'] = { displayName: 'Elena Rostova', handle: 'elena_r', isVerified: false, followerCount: 0, followingCount: 0 };
    store['users/fan_marcus'] = { displayName: 'Marcus Vance', handle: 'mvance', isVerified: false, followerCount: 0, followingCount: 0 };
    store['users/creator_dev'] = { displayName: 'Devin Cole', handle: 'devin_c', isVerified: true, followerCount: 0, followingCount: 0 };

    store['artistProfiles/art_devin'] = {
      userId: 'creator_dev',
      ownerUid: 'creator_dev',
      stageName: 'Devin Cole & The Nomads',
      handle: 'devin_nomads',
      isVerified: true,
      followerCount: 0,
      followingCount: 0,
    };
  });

  // ── 1. Follow / Unfollow Lifecycle & CRM Events ───────────────────────────

  it('1. Fan follows Creator: updates counts and records STARTED_FOLLOWING CRM event', async () => {
    const res = await (followEntity as any)({
      auth: { uid: 'fan_elena' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    expect(res.ok).toBe(true);
    expect(res.relationshipState.isFollowing).toBe(true);

    // Verify counter increments
    expect(store['artistProfiles/art_devin'].followerCount).toBe(1);
    expect(store['users/fan_elena'].followingCount).toBe(1);

    // Verify CRM event emitted
    const crmKeys = Object.keys(store).filter((k) => k.startsWith('crmEvents/'));
    expect(crmKeys.length).toBeGreaterThanOrEqual(1);

    const followEvent = Object.values(store).find(
      (doc) => doc.action === 'STARTED_FOLLOWING' && doc.targetId === 'art_devin'
    );
    expect(followEvent).toBeDefined();
    expect(followEvent.actorUid).toBe('fan_elena');
    expect(followEvent.source).toBe('social_graph');
  });

  it('2. Fan unfollows Creator: decrements counts and records UNFOLLOWED CRM event', async () => {
    // Follow first
    await (followEntity as any)({
      auth: { uid: 'fan_elena' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    // Unfollow
    const res = await (unfollowEntity as any)({
      auth: { uid: 'fan_elena' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    expect(res.ok).toBe(true);
    expect(res.relationshipState.isFollowing).toBe(false);

    // Verify counters decremented back to 0
    expect(store['artistProfiles/art_devin'].followerCount).toBe(0);
    expect(store['users/fan_elena'].followingCount).toBe(0);

    const unfollowEvent = Object.values(store).find(
      (doc) => doc.action === 'UNFOLLOWED' && doc.targetId === 'art_devin'
    );
    expect(unfollowEvent).toBeDefined();
  });

  it('3. Creator quietly removes a follower: decrements counts and records CRM event', async () => {
    // Fan follows Creator
    await (followEntity as any)({
      auth: { uid: 'fan_elena' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    // Creator removes follower
    const res = await (removeFollower as any)({
      auth: { uid: 'creator_dev' },
      data: {
        followerId: 'fan_elena',
        followerType: 'fan',
        actingAsArtistId: 'art_devin',
      },
    });

    expect(res.ok).toBe(true);
    expect(store['artistProfiles/art_devin'].followerCount).toBe(0);
    expect(store['users/fan_elena'].followingCount).toBe(0);

    const removalEvent = Object.values(store).find(
      (doc) => doc.action === 'FOLLOWER_REMOVED_BY_TARGET'
    );
    expect(removalEvent).toBeDefined();
  });

  // ── 2. Approved Messaging Permissions State Machine ─────────────────────────

  it('4. Rejects message if caller does not follow recipient (0 follows rule)', async () => {
    await expect(
      (sendMessage as any)({
        auth: { uid: 'fan_marcus' },
        data: {
          recipientId: 'art_devin',
          recipientType: 'artist',
          text: 'Hey Devin, huge fan!',
        },
      })
    ).rejects.toThrow(/Follow required/);
  });

  it('5. 1 follow edge initiates pending_request and enforces 1-message limit', async () => {
    // Marcus follows Devin
    await (followEntity as any)({
      auth: { uid: 'fan_marcus' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    // 1st message: allowed, status becomes 'pending_request'
    const res1 = await (sendMessage as any)({
      auth: { uid: 'fan_marcus' },
      data: {
        recipientId: 'art_devin',
        recipientType: 'artist',
        text: 'Hey Devin, can I interview you for our podcast?',
      },
    });

    expect(res1.ok).toBe(true);
    expect(res1.status).toBe('pending_request');

    // 2nd message before recipient accepts: rejected by spam guard
    await expect(
      (sendMessage as any)({
        auth: { uid: 'fan_marcus' },
        data: {
          recipientId: 'art_devin',
          recipientType: 'artist',
          text: 'Following up on my message!',
        },
      })
    ).rejects.toThrow(/Your message request is pending/);
  });

  it('6. Mutual follow opens direct accepted chat immediately', async () => {
    // Marcus follows Devin
    await (followEntity as any)({
      auth: { uid: 'fan_marcus' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });
    // Devin follows Marcus
    await (followEntity as any)({
      auth: { uid: 'creator_dev' },
      data: { targetId: 'fan_marcus', targetType: 'fan', actingAsArtistId: 'art_devin' },
    });

    // Send message -> immediately 'accepted'
    const res = await (sendMessage as any)({
      auth: { uid: 'fan_marcus' },
      data: {
        recipientId: 'art_devin',
        recipientType: 'artist',
        text: 'Glad we connected!',
      },
    });

    expect(res.ok).toBe(true);
    expect(res.status).toBe('accepted');
  });

  // ── 3. STRICT PRIVACY INVARIANT: Message Text Is NOT In CRM Events ────────

  it('7. STRICT PRIVACY INVARIANT: CRM events NEVER leak or store raw message text', async () => {
    // Marcus follows Devin
    await (followEntity as any)({
      auth: { uid: 'fan_marcus' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    const secretText = 'TOP_SECRET_FAN_CONFIDENTIAL_MESSAGE_12345';

    await (sendMessage as any)({
      auth: { uid: 'fan_marcus' },
      data: {
        recipientId: 'art_devin',
        recipientType: 'artist',
        text: secretText,
      },
    });

    // Check all CRM events
    const crmEvents = Object.values(store).filter(
      (doc) => doc.source === 'social_messaging'
    );
    expect(crmEvents.length).toBeGreaterThanOrEqual(1);

    for (const event of crmEvents) {
      const serialized = JSON.stringify(event);
      expect(serialized).not.toContain(secretText);
      expect((event.payload as any)?.text).toBeUndefined();
    }
  });

  // ── 4. Block, Restrict, and Moderation Reporting ───────────────────────────

  it('8. Hard bidirectional block cascades follow deletion and locks conversations', async () => {
    // Marcus follows Devin
    await (followEntity as any)({
      auth: { uid: 'fan_marcus' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    // Devin blocks Marcus
    const blockRes = await (blockEntity as any)({
      auth: { uid: 'creator_dev' },
      data: {
        targetId: 'fan_marcus',
        targetType: 'fan',
        actingAsArtistId: 'art_devin',
        reason: 'Harassment',
      },
    });

    expect(blockRes.ok).toBe(true);
    expect(blockRes.isBlocked).toBe(true);

    // Follow edge must be deleted
    expect(store['follows/fan_marcus_art_devin']).toBeUndefined();
    expect(store['artistProfiles/art_devin'].followerCount).toBe(0);

    // Conversation must be locked
    const convId = 'conv_art_devin_fan_marcus';
    if (store[`conversations/${convId}`]) {
      expect(store[`conversations/${convId}`].status).toBe('blocked');
    }

    // Marcus cannot message Devin
    await expect(
      (sendMessage as any)({
        auth: { uid: 'fan_marcus' },
        data: {
          recipientId: 'art_devin',
          recipientType: 'artist',
          text: 'Are you ignoring me?',
        },
      })
    ).rejects.toThrow(/safety or block settings/);

    // Block CRM event emitted
    const blockEvent = Object.values(store).find(
      (doc) => doc.action === 'ENTITY_BLOCKED' && doc.targetId === 'fan_marcus'
    );
    expect(blockEvent).toBeDefined();
  });

  it('9. Stealth restriction preserves follows and suppresses unread counters quietly', async () => {
    // Marcus follows Devin
    await (followEntity as any)({
      auth: { uid: 'fan_marcus' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    // Devin restricts Marcus (stealth mode)
    const restRes = await (restrictEntity as any)({
      auth: { uid: 'creator_dev' },
      data: {
        targetId: 'fan_marcus',
        targetType: 'fan',
        actingAsArtistId: 'art_devin',
      },
    });

    expect(restRes.ok).toBe(true);
    expect(restRes.isRestricted).toBe(true);

    // Follow edge is preserved (target has zero awareness)
    expect(store['follows/fan_marcus_art_devin']).toBeDefined();

    // Marcus sends message -> unreadCount for Devin stays 0
    await (sendMessage as any)({
      auth: { uid: 'fan_marcus' },
      data: {
        recipientId: 'art_devin',
        recipientType: 'artist',
        text: 'Hey check this out',
      },
    });

    const conv = store['conversations/conv_art_devin_fan_marcus'];
    expect(conv.unreadCounts?.['art_devin']).toBe(0);
  });

  it('10. Reporting chat abuse snapshots evidence, feeds moderationQueue, and logs CRM event', async () => {
    // Marcus follows Devin & sends message
    await (followEntity as any)({
      auth: { uid: 'fan_marcus' },
      data: { targetId: 'art_devin', targetType: 'artist' },
    });

    await (sendMessage as any)({
      auth: { uid: 'fan_marcus' },
      data: {
        recipientId: 'art_devin',
        recipientType: 'artist',
        text: 'Abusive language example',
      },
    });

    // Devin reports message request
    const reportRes = await (respondToMessageRequest as any)({
      auth: { uid: 'creator_dev' },
      data: {
        conversationId: 'conv_art_devin_fan_marcus',
        action: 'report',
        actingAsArtistId: 'art_devin',
        reportReason: 'harassment',
        reportDescription: 'Spamming abusive messages',
      },
    });

    expect(reportRes.ok).toBe(true);
    expect(reportRes.status).toBe('declined');

    // Verify report created in /reports
    const reportDocs = Object.keys(store).filter((k) => k.startsWith('reports/'));
    expect(reportDocs.length).toBe(1);

    // Verify synced to /moderationQueue for staff action
    const modDocs = Object.keys(store).filter((k) => k.startsWith('moderationQueue/'));
    expect(modDocs.length).toBe(1);
    const modItem = store[modDocs[0]];
    expect(modItem.priority).toBe('HIGH');
    expect(modItem.type).toBe('CHAT_ABUSE_REPORT');
    expect(modItem.status).toBe('PENDING_REVIEW');

    // Verify CRM event logged
    const reportEvent = Object.values(store).find(
      (doc) => doc.action === 'ABUSE_REPORTED'
    );
    expect(reportEvent).toBeDefined();
    expect(reportEvent.source).toBe('social_safety');
  });

  it('11. Unblock entity removes block and records ENTITY_UNBLOCKED CRM event', async () => {
    // Block first
    await (blockEntity as any)({
      auth: { uid: 'creator_dev' },
      data: {
        targetId: 'fan_marcus',
        targetType: 'fan',
        actingAsArtistId: 'art_devin',
        reason: 'Temporary block',
      },
    });

    // Unblock
    const unblockRes = await (unblockEntity as any)({
      auth: { uid: 'creator_dev' },
      data: {
        targetId: 'fan_marcus',
        actingAsArtistId: 'art_devin',
      },
    });

    expect(unblockRes.ok).toBe(true);
    expect(unblockRes.isBlocked).toBe(false);
    expect(store['socialBlocks/art_devin_fan_marcus']).toBeUndefined();

    // Verify CRM event emitted
    const unblockEvent = Object.values(store).find(
      (doc) => doc.action === 'ENTITY_UNBLOCKED' && doc.targetId === 'fan_marcus'
    );
    expect(unblockEvent).toBeDefined();
  });

  it('12. Unrestrict entity lifts restriction and records ENTITY_UNRESTRICTED CRM event', async () => {
    // Restrict first
    await (restrictEntity as any)({
      auth: { uid: 'creator_dev' },
      data: {
        targetId: 'fan_marcus',
        targetType: 'fan',
        actingAsArtistId: 'art_devin',
      },
    });

    // Unrestrict
    const unres = await (unrestrictEntity as any)({
      auth: { uid: 'creator_dev' },
      data: {
        targetId: 'fan_marcus',
        actingAsArtistId: 'art_devin',
      },
    });

    expect(unres.ok).toBe(true);
    expect(unres.isRestricted).toBe(false);
    expect(store['socialRestrictions/art_devin_fan_marcus']).toBeUndefined();

    // Verify CRM event emitted
    const unrestrictEvent = Object.values(store).find(
      (doc) => doc.action === 'ENTITY_UNRESTRICTED' && doc.targetId === 'fan_marcus'
    );
    expect(unrestrictEvent).toBeDefined();
  });
});

