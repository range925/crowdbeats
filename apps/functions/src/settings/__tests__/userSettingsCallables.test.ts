import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSet = jest.fn<any>().mockResolvedValue({} as any);
const mockDelete = jest.fn<any>().mockResolvedValue({} as any);

const mockDoc = jest.fn(() => ({
  set: mockSet,
  delete: mockDelete,
  collection: jest.fn(() => ({
    doc: mockDoc,
  })),
}));

const mockCollection = jest.fn((name: string) => ({
  doc: mockDoc,
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: ['[DEFAULT]'],
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      doc: mockDoc,
    }),
    {
      FieldValue: {
        serverTimestamp: () => 'MOCK_TIMESTAMP',
      },
    },
  ),
}));

import {
  updateNotificationPreferences,
  updatePrivacyPreferences,
  blockUser,
  unblockUser,
} from '../userSettingsCallables';

describe('User Settings & Account Protection Callables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateNotificationPreferences', () => {
    it('rejects unauthenticated requests', async () => {
      await expect(
        (updateNotificationPreferences as any).run({
          auth: null,
          data: {},
        }),
      ).rejects.toThrow('Authentication required.');
    });

    it('enforces mandatory transactional alerts even if user attempts to opt out', async () => {
      const res = await (updateNotificationPreferences as any).run({
        auth: { uid: 'user_1' },
        data: {
          marketingEmails: false,
          tipsReceived: false, // Attempt to disable critical financial alerts
          payoutsAndTransfers: false,
        },
      });

      expect(res.ok).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          marketingEmails: false,
          tipsReceived: true, // Overridden to true
          payoutsAndTransfers: true, // Overridden to true
        }),
        { merge: true },
      );
    });
  });

  describe('updatePrivacyPreferences', () => {
    it('updates privacy preferences for authenticated user', async () => {
      const res = await (updatePrivacyPreferences as any).run({
        auth: { uid: 'user_1' },
        data: {
          showPublicTippingActivity: false,
          allowDirectMessages: true,
        },
      });

      expect(res.ok).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          showPublicTippingActivity: false,
          allowDirectMessages: true,
        }),
        { merge: true },
      );
    });
  });

  describe('blockUser & unblockUser', () => {
    it('rejects self-blocking', async () => {
      await expect(
        (blockUser as any).run({
          auth: { uid: 'user_1' },
          data: { targetUid: 'user_1' },
        }),
      ).rejects.toThrow('Invalid target user ID.');
    });

    it('records blocked user in subcollection', async () => {
      const res = await (blockUser as any).run({
        auth: { uid: 'user_1' },
        data: { targetUid: 'bad_actor_99', reason: 'Harassment' },
      });

      expect(res.ok).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          blockedUid: 'bad_actor_99',
          reason: 'Harassment',
        }),
      );
    });

    it('removes blocked user on unblock', async () => {
      const res = await (unblockUser as any).run({
        auth: { uid: 'user_1' },
        data: { targetUid: 'bad_actor_99' },
      });

      expect(res.ok).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
