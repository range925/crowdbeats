import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockUpdate = jest.fn().mockResolvedValue({} as never);
const mockSet = jest.fn().mockResolvedValue({} as never);
const mockGet = jest.fn();
const mockCommit = jest.fn().mockResolvedValue({} as never);

const mockBatch = jest.fn(() => ({
  update: mockUpdate,
  set: mockSet,
  commit: mockCommit,
}));

const mockDoc = jest.fn(() => ({
  get: mockGet,
  update: mockUpdate,
  set: mockSet,
}));

const mockCollection = jest.fn(() => ({
  doc: jest.fn(() => ({
    id: 'mock_doc_id',
    get: mockGet,
    set: mockSet,
  })),
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: ['[DEFAULT]'],
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      doc: mockDoc,
      batch: mockBatch,
    }),
    {
      FieldValue: {
        serverTimestamp: () => 'SERVER_TIMESTAMP',
        arrayUnion: (...args: any[]) => ({ _type: 'arrayUnion', elements: args }),
      },
    }
  ),
}));

import { adminUpdateUserProfile } from '../adminUpdateUserProfile';
import { updateSupportTicket, addSupportTicketNote } from '../adminSupportWorkflow';

describe('Admin Profile & Support Workflow Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('adminUpdateUserProfile', () => {
    it('rejects unauthenticated requests', async () => {
      await expect(
        (adminUpdateUserProfile as any).run({
          auth: null,
          data: { targetUid: 'u1', updates: { displayName: 'New Name' }, reason: 'Correction' },
        })
      ).rejects.toThrow('User must be authenticated.');
    });

    it('rejects non-staff roles', async () => {
      await expect(
        (adminUpdateUserProfile as any).run({
          auth: { uid: 'fan1', token: { platformRole: 'FAN' } },
          data: { targetUid: 'u1', updates: { displayName: 'New Name' }, reason: 'Correction' },
        })
      ).rejects.toThrow('Caller does not have required staff role.');
    });

    it('rejects unauthorized fields like platformRole or isAdmin', async () => {
      await expect(
        (adminUpdateUserProfile as any).run({
          auth: { uid: 'staff1', token: { platformRole: 'CUSTOMER_SUPPORT' } },
          data: {
            targetUid: 'u1',
            updates: { platformRole: 'SUPER_ADMIN' },
            reason: 'Elevation attempt',
          },
        })
      ).rejects.toThrow('Updates contain unauthorized fields.');
    });

    it('rejects update without justification reason', async () => {
      await expect(
        (adminUpdateUserProfile as any).run({
          auth: { uid: 'staff1', token: { platformRole: 'CUSTOMER_SUPPORT' } },
          data: {
            targetUid: 'u1',
            updates: { displayName: 'Legit Name' },
            reason: '   ',
          },
        })
      ).rejects.toThrow('Reason for update is required.');
    });

    it('successfully updates user profile and writes audit record', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ displayName: 'Old Name' }),
      } as never); // userSnap
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ stageName: 'Old Stage' }),
      } as never); // artistSnap

      const result = await (adminUpdateUserProfile as any).run({
        auth: { uid: 'staff1', token: { platformRole: 'CUSTOMER_SUPPORT', email: 'support@crowdbeats.com' } },
        data: {
          targetUid: 'u1',
          updates: { displayName: 'Updated Name', bio: 'Verified artist' },
          reason: 'Correcting spelling per ticket #123',
        },
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'ADMIN_UPDATE_USER_PROFILE',
          actorUid: 'staff1',
          targetUid: 'u1',
          reason: 'Correcting spelling per ticket #123',
        })
      );
      expect(mockCommit).toHaveBeenCalled();
    });
  });

  describe('adminSupportWorkflow', () => {
    it('updateSupportTicket updates status and logs audit event', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ status: 'open' }),
      } as never);

      const result = await (updateSupportTicket as any).run({
        auth: { uid: 'staff1', token: { platformRole: 'CUSTOMER_SUPPORT', email: 'support@crowdbeats.com' } },
        data: {
          ticketId: 't1',
          status: 'resolved',
          resolutionNotes: 'Refund issued and user notified',
        },
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'ADMIN_UPDATE_SUPPORT_TICKET',
          targetUid: 't1',
        })
      );
    });

    it('addSupportTicketNote appends note and logs audit event', async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ status: 'open' }),
      } as never);

      const result = await (addSupportTicketNote as any).run({
        auth: { uid: 'staff1', token: { platformRole: 'CUSTOMER_SUPPORT', email: 'support@crowdbeats.com' } },
        data: {
          ticketId: 't1',
          note: 'Customer contacted via email for additional information.',
        },
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'ADMIN_ADD_SUPPORT_TICKET_NOTE',
          targetUid: 't1',
        })
      );
    });
  });
});
