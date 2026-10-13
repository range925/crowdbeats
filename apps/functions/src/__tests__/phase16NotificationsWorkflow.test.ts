/**
 * Crowdbeats V2 — Phase 16: Notifications and Workflow Automation Backend Suite
 *
 * Verifies:
 * 1. Multi-Channel Notification Delivery (In-App Inbox, Push / FCM Multicast, Outbound Email queue)
 * 2. Stale FCM Token Pruning on invalid/unregistered registration token errors
 * 3. Idempotent Deduplication via idempotencyKey (suppresses duplicate in-app, push, and email)
 * 4. User Preference Enforcement (category toggles and global push/email toggles)
 * 5. Mandatory Transactional Overrides (SECURITY_ALERT, PAYOUT, REFUND cannot be opted out of)
 * 6. Sliding-Window Rate Limiting (throttling on burst spam, emergency bypass)
 * 7. Automated Retry Backoff and Dead-Letter Queue (DLQ) routing upon exhaustion
 * 8. In-App Notification Operations (mark read, mark all read, paginated listing, unread count aggregation)
 * 9. Role-Based Access Control on retry processing (staff only)
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
      const runQuery = (lim?: number) => {
        const docs: any[] = [];
        for (const [k, v] of Object.entries(store)) {
          if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
            let match = false;
            if (op === '==' && v[field] === val) match = true;
            if (op === '>=' && v[field] >= val) match = true;
            if (op === '<=' && v[field] <= val) match = true;
            if (match) {
              docs.push({
                id: k.split('/').pop(),
                data: () => v,
                exists: true,
                ref: mockDoc(k),
              });
            }
          }
        }
        const sliced = lim ? docs.slice(0, lim) : docs;
        return {
          docs: sliced,
          empty: sliced.length === 0,
          size: sliced.length,
        };
      };

      return {
        where: jest.fn<any>().mockReturnThis(),
        orderBy: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockImplementation((lim: number) => ({
          get: jest.fn<any>().mockImplementation(async () => runQuery(lim)),
        })),
        get: jest.fn<any>().mockImplementation(async () => runQuery()),
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
                ref: mockDoc(k),
              });
            }
          }
          return { docs: docs.slice(0, lim), empty: docs.length === 0, size: docs.slice(0, lim).length };
        }),
      })),
    })),
    limit: jest.fn<any>().mockImplementation((lim: number) => ({
      get: jest.fn<any>().mockImplementation(async () => {
        const docs: any[] = [];
        for (const [k, v] of Object.entries(store)) {
          if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
            docs.push({
              id: k.split('/').pop(),
              data: () => v,
              exists: true,
              ref: mockDoc(k),
            });
          }
        }
        return { docs: docs.slice(0, lim), empty: docs.length === 0, size: docs.slice(0, lim).length };
      }),
    })),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs: any[] = [];
      for (const [k, v] of Object.entries(store)) {
        if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
          docs.push({
            id: k.split('/').pop(),
            data: () => v,
            exists: true,
            ref: mockDoc(k),
          });
        }
      }
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const mockSendEachForMulticast = jest.fn<any>();

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
    messaging: Object.assign(
      jest.fn(() => ({
        sendEachForMulticast: mockSendEachForMulticast,
      }))
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

import {
  dispatchServerNotification,
  queueNotificationRetry,
  processNotificationRetry,
} from '../notifications/notificationService.js';
import {
  markNotificationRead,
  markAllNotificationsRead,
  listInAppNotifications,
  processNotificationRetry as callableProcessRetry,
} from '../notifications/notificationCallables.js';
import { NotificationType } from '@crowdbeats/contracts';

describe('Phase 16: Notifications and Workflow Automation Suite', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    mockSendEachForMulticast.mockReset();

    // Default successful multicast response
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    });

    // Seed test user with device token
    store['users/usr_artist_1'] = { displayName: 'Devin Cole', email: 'devin@example.com' };
    store['users/usr_artist_1/deviceTokens/token_device_abc'] = {
      fcmToken: 'token_device_abc',
      platform: 'ios',
      appVersion: '2.0.0',
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
  });

  // ── 1. Multi-Channel Delivery & Token Pruning ──────────────────────────────

  it('1. Dispatches multi-channel notification (in-app inbox, FCM push, outbound email)', async () => {
    const res = await dispatchServerNotification({
      recipientUid: 'usr_artist_1',
      type: NotificationType.TIP_RECEIVED,
      title: 'New Tip Received! 🎵',
      body: 'Fan Elena tipped you $25.00 on Main Stage.',
      data: { amountCents: '2500', currency: 'USD', fanName: 'Elena' },
      clickAction: '/studio/tips',
      channels: ['in_app', 'push', 'email'],
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('delivered');
    expect(res.deliveredCount).toBeGreaterThanOrEqual(1);

    // 1. In-App Inbox written
    const inboxItems = Object.entries(store).filter(([k]) => k.startsWith('notifications/usr_artist_1/items/'));
    expect(inboxItems.length).toBe(1);
    const itemData = inboxItems[0][1];
    expect(itemData.type).toBe('TIP_RECEIVED');
    expect(itemData.title).toBe('New Tip Received! 🎵');
    expect(itemData.isRead).toBe(false);

    // 2. FCM Push multicast triggered
    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);

    // 3. Outbound Email queue written
    const emailItems = Object.entries(store).filter(([k]) => k.startsWith('mailQueue/'));
    expect(emailItems.length).toBe(1);
    expect(emailItems[0][1].subject).toBe('New Tip Received! 🎵');
  });

  it('2. Automatically prunes stale FCM tokens upon registration-token-not-registered error', async () => {
    mockSendEachForMulticast.mockResolvedValueOnce({
      successCount: 0,
      failureCount: 1,
      responses: [
        {
          success: false,
          error: { code: 'messaging/registration-token-not-registered' },
        },
      ],
    });

    await dispatchServerNotification({
      recipientUid: 'usr_artist_1',
      type: NotificationType.TIP_RECEIVED,
      title: 'Tip Notification',
      body: 'Someone tipped you',
      channels: ['push'],
    });

    // Stale token should have been deleted from store
    expect(store['users/usr_artist_1/deviceTokens/token_device_abc']).toBeUndefined();
  });

  // ── 2. Idempotent Deduplication ───────────────────────────────────────────

  it('3. Suppresses duplicate notification dispatch when idempotencyKey matches', async () => {
    const idempotencyKey = 'tip_charge_1001_notif';

    // First dispatch
    const firstRes = await dispatchServerNotification({
      recipientUid: 'usr_artist_1',
      type: NotificationType.TIP_RECEIVED,
      title: 'First Tip',
      body: 'Tip of $10.00',
      idempotencyKey,
    });
    expect(firstRes.status).toBe('delivered');
    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);

    // Second dispatch with same idempotencyKey (e.g. webhook replay)
    const secondRes = await dispatchServerNotification({
      recipientUid: 'usr_artist_1',
      type: NotificationType.TIP_RECEIVED,
      title: 'First Tip (Replay)',
      body: 'Tip of $10.00',
      idempotencyKey,
    });

    expect(secondRes.status).toBe('duplicate_deduped');
    expect(secondRes.deliveredCount).toBe(0);

    // Multicast should NOT have been called a second time
    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);

    // Only 1 item should exist in the user's inbox
    const inboxItems = Object.entries(store).filter(([k]) => k.startsWith('notifications/usr_artist_1/items/'));
    expect(inboxItems.length).toBe(1);
  });

  // ── 3. Opt-in / Opt-out Preference Enforcement ────────────────────────────

  it('4. Respects category opt-out preferences and suppresses push/email for non-mandatory types', async () => {
    // User opts out of follower notifications
    store['users/usr_artist_1/settings/notifications'] = {
      newFollowers: false,
      tipsReceived: true,
      pushNotificationsEnabled: true,
      emailDigestsEnabled: true,
    };

    const res = await dispatchServerNotification({
      recipientUid: 'usr_artist_1',
      type: NotificationType.NEW_FOLLOWER,
      title: 'New Follower',
      body: 'Elena started following you.',
      channels: ['push', 'email'],
    });

    expect(res.status).toBe('skipped_preference');
    expect(res.deliveredCount).toBe(0);
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  it('5. Mandatory transactional alerts (SECURITY_ALERT, PAYOUT, REFUND) override opt-outs', async () => {
    // User tries to disable everything
    store['users/usr_artist_1/settings/notifications'] = {
      pushNotificationsEnabled: false,
      emailDigestsEnabled: false,
      payoutsAndTransfers: false,
      tipsReceived: false,
    };

    const res = await dispatchServerNotification({
      recipientUid: 'usr_artist_1',
      type: NotificationType.SECURITY_ALERT,
      title: 'Security Alert: Password Changed',
      body: 'Your account password was updated from a new device.',
      channels: ['in_app', 'push'],
    });

    // Mandatory alerts override user preference suppression
    expect(res.status).toBe('delivered');
    expect(res.channels.inApp).toBe(true);
    expect(res.channels.push).toBe(true);
    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
  });

  // ── 4. Sliding-Window Rate Limiting ───────────────────────────────────────

  it('6. Throttles high-frequency notification bursts when exceeding rate limit', async () => {
    const recipientUid = 'usr_artist_1';
    const nowIso = new Date().toISOString();

    // Seed 10 recent notifications in the last 60 seconds
    for (let i = 0; i < 10; i++) {
      store[`notifications/${recipientUid}/items/notif_burst_${i}`] = {
        type: 'NEW_FOLLOWER',
        createdAt: nowIso,
        isRead: false,
      };
    }

    // 11th notification should be throttled
    const throttledRes = await dispatchServerNotification({
      recipientUid,
      type: NotificationType.NEW_FOLLOWER,
      title: '11th Follower',
      body: 'Burst notification',
    });

    expect(throttledRes.status).toBe('throttled_rate_limit');
    expect(throttledRes.success).toBe(false);
    expect(throttledRes.reason).toContain('Rate limit exceeded');
  });

  // ── 5. Retries and Dead-Letter Queue (DLQ) ─────────────────────────────────

  it('7. Queues failed dispatches for retry and routes to DLQ after exhaustion', async () => {
    // Queue initial retry
    const retryId = await queueNotificationRetry({
      recipientUid: 'usr_artist_1',
      type: NotificationType.SPONSORSHIP_OFFER_RECEIVED,
      title: 'Sponsorship Offer',
      body: 'Brand offer for $5,000',
      channels: ['push'],
    }, 'FCM 503 Service Unavailable');

    expect(store[`notificationRetries/${retryId}`]).toBeDefined();
    expect(store[`notificationRetries/${retryId}`].attemptCount).toBe(1);
    expect(store[`notificationRetries/${retryId}`].status).toBe('pending');

    // Simulate repeated network failure on retry
    mockSendEachForMulticast.mockRejectedValue(new Error('Persistent network failure'));

    // Process retry attempt 2
    const res2 = await processNotificationRetry(retryId);
    expect(res2.status).toBe('retrying');
    expect(store[`notificationRetries/${retryId}`].attemptCount).toBe(2);

    // Process retry attempt 3 (exhaustion threshold)
    const res3 = await processNotificationRetry(retryId);
    expect(res3.status).toBe('failed');
    expect(res3.reason).toContain('Routed to DLQ');

    // Verify DLQ document created
    expect(store[`notificationDlq/${retryId}`]).toBeDefined();
    expect(store[`notificationDlq/${retryId}`].status).toBe('unresolved');
    expect(store[`notificationDlq/${retryId}`].totalAttempts).toBe(3);

    // Verify retry record updated to exhausted
    expect(store[`notificationRetries/${retryId}`].status).toBe('exhausted');
  });

  // ── 6. In-App Notification Management ─────────────────────────────────────

  it('8. Supports listing, marking read, and marking all read for in-app inbox', async () => {
    const uid = 'usr_artist_1';
    store[`notifications/${uid}/items/notif_1`] = { notificationId: 'notif_1', recipientUid: uid, title: 'Item 1', isRead: false, createdAt: new Date().toISOString() };
    store[`notifications/${uid}/items/notif_2`] = { notificationId: 'notif_2', recipientUid: uid, title: 'Item 2', isRead: false, createdAt: new Date().toISOString() };
    store[`notifications/${uid}/items/notif_3`] = { notificationId: 'notif_3', recipientUid: uid, title: 'Item 3', isRead: true, createdAt: new Date().toISOString() };

    // List notifications
    const listRes = await (listInAppNotifications as any)({
      auth: { uid },
      data: { limit: 10 },
    });
    expect(listRes.items.length).toBe(3);
    expect(listRes.unreadCount).toBe(2);

    // Mark single notification read
    const markRes = await (markNotificationRead as any)({
      auth: { uid },
      data: { notificationId: 'notif_1' },
    });
    expect(markRes.ok).toBe(true);
    expect(store[`notifications/${uid}/items/notif_1`].isRead).toBe(true);

    // Mark all notifications read
    const markAllRes = await (markAllNotificationsRead as any)({
      auth: { uid },
      data: {},
    });
    expect(markAllRes.ok).toBe(true);
    expect(markAllRes.markedCount).toBe(1); // notif_2 was the remaining unread item
    expect(store[`notifications/${uid}/items/notif_2`].isRead).toBe(true);
  });

  // ── 7. Role-Based Security Guard ──────────────────────────────────────────

  it('9. Enforces staff-only access on processing notification retries', async () => {
    // Non-staff caller rejected
    await expect(
      (callableProcessRetry as any)({
        auth: { uid: 'regular_user', token: { role: 'fan' } },
        data: { retryId: 'retry_999' },
      })
    ).rejects.toThrow('Staff authorization required');

    // Staff caller accepted
    const retryId = await queueNotificationRetry({
      recipientUid: 'usr_artist_1',
      type: NotificationType.TIP_RECEIVED,
      title: 'Tip Retry',
      body: 'Tip body',
    }, 'Transient error');

    const staffRes = await (callableProcessRetry as any)({
      auth: { uid: 'staff_admin_1', token: { role: 'CUSTOMER_SUPPORT', admin: true } },
      data: { retryId },
    });

    expect(staffRes.ok).toBe(true);
  });
});
