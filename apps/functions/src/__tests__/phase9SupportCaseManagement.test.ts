import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createSupportTicket,
  assignSupportTicket,
  resolveSupportTicket,
  reopenSupportTicket,
  addSupportTicketMessage,
  addSupportInternalNote,
  getSupportTicketDetails,
  calculateSlaDueAt,
  generateTicketNumber,
} from '../support/supportService';

describe('Phase 9: Support & Case Management Service', () => {
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
      set: jest.fn(async (data: any) => {
        mockStore[path] = { ...data };
      }),
      update: jest.fn(async (data: any) => {
        mockStore[path] = { ...(mockStore[path] || {}), ...data };
      }),
      collection: (subName: string) => createCollectionRef(`${path}/${subName}`),
    });

    const createCollectionRef = (colPath: string) => {
      let currentQueryFilter: { field?: string; op?: string; value?: any } = {};
      let currentOrder: { field?: string; dir?: string } = {};

      return {
        id: colPath.split('/').pop()!,
        doc: (id?: string) => {
          const docId = id || `mock_id_${Math.random().toString(36).slice(2, 9)}`;
          return createDocRef(`${colPath}/${docId}`);
        },
        where: (field: string, op: string, value: any) => {
          currentQueryFilter = { field, op, value };
          return {
            orderBy: (ordField: string, dir: string) => {
              currentOrder = { field: ordField, dir };
              return { get: executeQuery };
            },
            get: executeQuery,
          };
        },
        orderBy: (ordField: string, dir = 'asc') => {
          currentOrder = { field: ordField, dir };
          return { get: executeQuery };
        },
        get: executeQuery,
      };

      async function executeQuery() {
        const prefix = `${colPath}/`;
        const docs = Object.keys(mockStore)
          .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
          .map((k) => ({
            id: k.split('/').pop()!,
            data: () => mockStore[k],
          }))
          .filter((d) => {
            if (!currentQueryFilter.field) return true;
            const docVal = d.data()[currentQueryFilter.field!];
            if (currentQueryFilter.op === '==') return docVal === currentQueryFilter.value;
            if (currentQueryFilter.op === 'in') {
              return Array.isArray(currentQueryFilter.value) && currentQueryFilter.value.includes(docVal);
            }
            return true;
          });

        if (currentOrder.field) {
          docs.sort((a, b) => {
            const vA = a.data()[currentOrder.field!] || '';
            const vB = b.data()[currentOrder.field!] || '';
            return currentOrder.dir === 'desc'
              ? String(vB).localeCompare(String(vA))
              : String(vA).localeCompare(String(vB));
          });
        }

        return {
          empty: docs.length === 0,
          size: docs.length,
          docs,
        };
      }
    };

    mockDb = {
      collection: (name: string) => createCollectionRef(name),
      doc: (path: string) => createDocRef(path),
      batch: () => {
        const operations: Array<() => Promise<void>> = [];
        return {
          set: (ref: any, data: any) => {
            operations.push(async () => {
              await ref.set(data);
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

  describe('SLA and Ticket Number Utilities', () => {
    it('generates a valid ticket number with format TICK-YYYYMMDD-XXXX', () => {
      const ticketNum = generateTicketNumber();
      expect(ticketNum).toMatch(/^TICK-\d{8}-\d{4}$/);
    });

    it('calculates accurate SLA due timestamps for each priority level', () => {
      const base = new Date('2026-10-13T12:00:00.000Z');

      const urgentSla = calculateSlaDueAt('urgent', base);
      expect(urgentSla.getTime() - base.getTime()).toBe(2 * 60 * 60 * 1000); // 2 hours

      const highSla = calculateSlaDueAt('high', base);
      expect(highSla.getTime() - base.getTime()).toBe(8 * 60 * 60 * 1000); // 8 hours

      const normalSla = calculateSlaDueAt('normal', base);
      expect(normalSla.getTime() - base.getTime()).toBe(24 * 60 * 60 * 1000); // 24 hours

      const lowSla = calculateSlaDueAt('low', base);
      expect(lowSla.getTime() - base.getTime()).toBe(48 * 60 * 60 * 1000); // 48 hours
    });
  });

  describe('createSupportTicket', () => {
    it('rejects short or empty subject and message', async () => {
      await expect(
        createSupportTicket(mockDb, { subject: 'hi', message: 'valid long message here' })
      ).rejects.toThrow('Subject is required');

      await expect(
        createSupportTicket(mockDb, { subject: 'Valid subject', message: 'no' })
      ).rejects.toThrow('Message is required');
    });

    it('creates ticket, initial message, history event, and crmEvent for authenticated fan', async () => {
      const caller = { uid: 'fan_123', email: 'fan@example.com', role: 'FAN' };
      const res = await createSupportTicket(
        mockDb,
        {
          subject: 'Question about upcoming show live stream',
          message: 'How do I access the stage radar when arriving at the venue?',
          category: 'general',
          priority: 'normal',
        },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.status).toBe('open');
      expect(res.ticketNumber).toMatch(/^TICK-/);

      const ticketPath = `supportRequests/${res.ticketId}`;
      const ticket = mockStore[ticketPath];
      expect(ticket).toBeDefined();
      expect(ticket.userId).toBe('fan_123');
      expect(ticket.status).toBe('open');
      expect(ticket.priority).toBe('normal');

      // Verify subcollections: initial message and history
      const messageKeys = Object.keys(mockStore).filter((k) => k.startsWith(`${ticketPath}/messages/`));
      expect(messageKeys.length).toBe(1);
      expect(mockStore[messageKeys[0]].message).toContain('How do I access the stage radar');

      const historyKeys = Object.keys(mockStore).filter((k) => k.startsWith(`${ticketPath}/history/`));
      expect(historyKeys.length).toBe(1);
      expect(mockStore[historyKeys[0]].action).toBe('CREATED');

      // Verify CRM Event was written
      const crmKeys = Object.keys(mockStore).filter((k) => k.startsWith('crmEvents/'));
      expect(crmKeys.length).toBe(1);
      expect(mockStore[crmKeys[0]].eventType).toBe('SUPPORT_TICKET_CREATED');
      expect(mockStore[crmKeys[0]].targetId).toBe(res.ticketId);
    });

    it('automatically escalates priority to high if billing or dispute keywords present', async () => {
      const caller = { uid: 'user_456', email: 'user@example.com', role: 'FAN' };
      const res = await createSupportTicket(
        mockDb,
        {
          subject: 'Urgent: Unauthorized charge on card statement',
          message: 'I see a duplicate tip on my account that I did not authorize.',
          category: 'billing',
        },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.priority).toBe('high');

      const ticket = mockStore[`supportRequests/${res.ticketId}`];
      expect(ticket.priority).toBe('high');
    });
  });

  describe('assignSupportTicket', () => {
    let ticketId: string;

    beforeEach(async () => {
      const res = await createSupportTicket(mockDb, {
        subject: 'Need help with band payouts',
        message: 'Where do I enter our Stripe Connected account bank details?',
        category: 'payout',
      });
      ticketId = res.ticketId;
    });

    it('rejects non-staff callers with permission-denied', async () => {
      const nonStaff = { uid: 'fan_1', role: 'FAN' };
      await expect(
        assignSupportTicket(mockDb, { ticketId, assignedStaffUid: 'staff_1' }, nonStaff)
      ).rejects.toThrow('Caller does not have required support staff role.');
    });

    it('successfully assigns ticket, transitions status to in_progress, and logs audit and history', async () => {
      const staffCaller = { uid: 'admin_1', email: 'lead@crowdbeats.com', role: 'SUPER_ADMIN' };
      const res = await assignSupportTicket(
        mockDb,
        {
          ticketId,
          assignedStaffUid: 'agent_42',
          assignedStaffName: 'Agent Sarah',
          assignedStaffEmail: 'sarah@crowdbeats.com',
          note: 'Taking this over for specialized Stripe review',
        },
        staffCaller
      );

      expect(res.ok).toBe(true);
      expect(res.assignedTo).toBe('agent_42');
      expect(res.status).toBe('in_progress');

      const ticket = mockStore[`supportRequests/${ticketId}`];
      expect(ticket.assignedTo).toBe('agent_42');
      expect(ticket.assignedStaffName).toBe('Agent Sarah');
      expect(ticket.status).toBe('in_progress');

      // History should record ASSIGNED
      const historyKeys = Object.keys(mockStore).filter((k) => k.startsWith(`supportRequests/${ticketId}/history/`));
      const assignEvent = historyKeys.map((k) => mockStore[k]).find((h) => h.action === 'ASSIGNED');
      expect(assignEvent).toBeDefined();
      expect(assignEvent.details.toAssignedTo).toBe('agent_42');

      // Note should be recorded as internal note
      const internalKeys = Object.keys(mockStore).filter((k) =>
        k.startsWith(`supportRequests/${ticketId}/internalNotes/`)
      );
      expect(internalKeys.length).toBe(1);
      expect(mockStore[internalKeys[0]].note).toContain('Taking this over');

      // Audit event
      const auditKeys = Object.keys(mockStore).filter((k) => k.startsWith('auditEvents/'));
      expect(auditKeys.length).toBe(1);
      expect(mockStore[auditKeys[0]].action).toBe('ADMIN_ASSIGN_SUPPORT_TICKET');
    });

    it('rejects assignment for non-existent ticket', async () => {
      const staffCaller = { uid: 'staff_1', role: 'CUSTOMER_SUPPORT' };
      await expect(
        assignSupportTicket(mockDb, { ticketId: 'missing_ticket_id', assignedStaffUid: 'staff_2' }, staffCaller)
      ).rejects.toThrow('not found');
    });
  });

  describe('resolveSupportTicket', () => {
    let ticketId: string;

    beforeEach(async () => {
      const res = await createSupportTicket(
        mockDb,
        {
          subject: 'Account login assistance',
          message: 'I cannot reset my password.',
        },
        { uid: 'fan_99', email: 'fan99@example.com', role: 'FAN' }
      );
      ticketId = res.ticketId;
    });

    it('rejects resolution without detailed resolution notes', async () => {
      const staff = { uid: 'staff_1', role: 'CUSTOMER_SUPPORT' };
      await expect(
        resolveSupportTicket(mockDb, { ticketId, resolutionNotes: 'ok' }, staff)
      ).rejects.toThrow('Detailed resolution notes are mandatory');
    });

    it('rejects resolution attempts by regular users', async () => {
      const user = { uid: 'fan_99', role: 'FAN' };
      await expect(
        resolveSupportTicket(
          mockDb,
          { ticketId, resolutionNotes: 'User tried to resolve themselves' },
          user
        )
      ).rejects.toThrow('Caller does not have required support staff role.');
    });

    it('successfully resolves ticket, sets resolved metadata, logs crmEvent and auditEvent', async () => {
      const staff = { uid: 'staff_1', email: 'support@crowdbeats.com', role: 'CUSTOMER_SUPPORT' };
      const res = await resolveSupportTicket(
        mockDb,
        {
          ticketId,
          resolutionNotes: 'Password reset link sent to customer verified email and confirmed active.',
        },
        staff
      );

      expect(res.ok).toBe(true);
      expect(res.status).toBe('resolved');

      const ticket = mockStore[`supportRequests/${ticketId}`];
      expect(ticket.status).toBe('resolved');
      expect(ticket.resolvedBy).toBe('staff_1');
      expect(ticket.resolutionNotes).toContain('Password reset link sent');

      // CRM event logged
      const crmEvents = Object.keys(mockStore)
        .filter((k) => k.startsWith('crmEvents/'))
        .map((k) => mockStore[k]);
      expect(crmEvents.some((e) => e.eventType === 'SUPPORT_TICKET_RESOLVED')).toBe(true);

      // Audit event logged
      const auditEvents = Object.keys(mockStore)
        .filter((k) => k.startsWith('auditEvents/'))
        .map((k) => mockStore[k]);
      expect(auditEvents.some((e) => e.action === 'ADMIN_RESOLVE_SUPPORT_TICKET')).toBe(true);
    });
  });

  describe('reopenSupportTicket', () => {
    let ticketId: string;

    beforeEach(async () => {
      const res = await createSupportTicket(
        mockDb,
        {
          subject: 'Stripe onboarding stalled',
          message: 'My ID upload failed.',
        },
        { uid: 'artist_1', email: 'artist1@example.com', role: 'SOLO_MUSICIAN' }
      );
      ticketId = res.ticketId;
      // Mark as resolved first
      await resolveSupportTicket(
        mockDb,
        { ticketId, resolutionNotes: 'Provided instruction for document re-upload' },
        { uid: 'staff_1', role: 'CUSTOMER_SUPPORT' }
      );
    });

    it('rejects reopen if ticket is already open or in_progress', async () => {
      // Reopen once
      await reopenSupportTicket(
        mockDb,
        { ticketId, reason: 'Still unable to upload passport photo' },
        { uid: 'artist_1', role: 'SOLO_MUSICIAN' }
      );

      // Try reopening again while already open
      await expect(
        reopenSupportTicket(
          mockDb,
          { ticketId, reason: 'Duplicate reopen attempt' },
          { uid: 'artist_1', role: 'SOLO_MUSICIAN' }
        )
      ).rejects.toThrow('ticket is already open');
    });

    it('rejects unauthorized third party user from reopening someone elses ticket', async () => {
      const randomUser = { uid: 'random_user', role: 'FAN' };
      await expect(
        reopenSupportTicket(
          mockDb,
          { ticketId, reason: 'Trying to tamper with foreign ticket' },
          randomUser
        )
      ).rejects.toThrow('Only the ticket owner or support staff can reopen');
    });

    it('allows ticket owner to reopen, transitions status and writes audit and crmEvent', async () => {
      const owner = { uid: 'artist_1', email: 'artist1@example.com', role: 'SOLO_MUSICIAN' };
      const res = await reopenSupportTicket(
        mockDb,
        { ticketId, reason: 'Error code 400 persists on the verification page.' },
        owner
      );

      expect(res.ok).toBe(true);
      expect(res.status).toBe('open');

      const ticket = mockStore[`supportRequests/${ticketId}`];
      expect(ticket.status).toBe('open');
      expect(ticket.reopenedBy).toBe('artist_1');
      expect(ticket.reopenReason).toContain('Error code 400 persists');

      // CRM event logged
      const crmEvents = Object.keys(mockStore)
        .filter((k) => k.startsWith('crmEvents/'))
        .map((k) => mockStore[k]);
      expect(crmEvents.some((e) => e.eventType === 'SUPPORT_TICKET_REOPENED')).toBe(true);
    });
  });

  describe('Customer Messages vs Internal Staff Notes (Strict Privacy Boundary)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const res = await createSupportTicket(
        mockDb,
        {
          subject: 'Payment Dispute Inquiry',
          message: 'I have a question about my transaction receipt.',
        },
        { uid: 'customer_1', email: 'customer1@example.com', role: 'FAN' }
      );
      ticketId = res.ticketId;
    });

    it('allows customer and staff to add public conversation messages', async () => {
      // Staff response
      const staffReply = await addSupportTicketMessage(
        mockDb,
        { ticketId, message: 'We are reviewing the Stripe transaction receipt with our billing team.' },
        { uid: 'staff_1', email: 'support@crowdbeats.com', role: 'CUSTOMER_SUPPORT' }
      );
      expect(staffReply.ok).toBe(true);

      // Customer reply
      const customerReply = await addSupportTicketMessage(
        mockDb,
        { ticketId, message: 'Thank you, here is the reference code: TX_9921.' },
        { uid: 'customer_1', email: 'customer1@example.com', role: 'FAN' }
      );
      expect(customerReply.ok).toBe(true);

      const msgKeys = Object.keys(mockStore).filter((k) => k.startsWith(`supportRequests/${ticketId}/messages/`));
      expect(msgKeys.length).toBe(3); // Initial message + 2 replies
    });

    it('strictly forbids customers and non-staff from adding internal notes', async () => {
      await expect(
        addSupportInternalNote(
          mockDb,
          { ticketId, note: 'Attempting to inject internal note' },
          { uid: 'customer_1', role: 'FAN' }
        )
      ).rejects.toThrow('Caller does not have required support staff role.');
    });

    it('allows staff to add private internal notes', async () => {
      const res = await addSupportInternalNote(
        mockDb,
        { ticketId, note: 'Cardholder appears in chargeback risk watchlist. Verify billing address.' },
        { uid: 'staff_1', email: 'support@crowdbeats.com', role: 'CUSTOMER_SUPPORT' }
      );

      expect(res.ok).toBe(true);

      const noteKeys = Object.keys(mockStore).filter((k) =>
        k.startsWith(`supportRequests/${ticketId}/internalNotes/`)
      );
      expect(noteKeys.length).toBe(1);
      expect(mockStore[noteKeys[0]].note).toContain('chargeback risk watchlist');
    });

    it('enforces privacy boundary in getSupportTicketDetails: customer never receives internal notes', async () => {
      // Add staff internal note
      await addSupportInternalNote(
        mockDb,
        { ticketId, note: 'CONFIDENTIAL: Suspected fraudulent cardholder activity.' },
        { uid: 'staff_1', email: 'support@crowdbeats.com', role: 'CUSTOMER_SUPPORT' }
      );

      // 1. Customer queries ticket details
      const customerDetails = await getSupportTicketDetails(
        mockDb,
        { ticketId },
        { uid: 'customer_1', email: 'customer1@example.com', role: 'FAN' }
      );

      expect(customerDetails.ok).toBe(true);
      expect(customerDetails.ticket.id).toBe(ticketId);
      expect(customerDetails.internalNotes).toBeUndefined(); // PRIVACY: Never exposed to customer
      expect(customerDetails.history.some((h) => h.action === 'INTERNAL_NOTE_ADDED')).toBe(false);

      // 2. Staff queries ticket details
      const staffDetails = await getSupportTicketDetails(
        mockDb,
        { ticketId },
        { uid: 'staff_1', email: 'support@crowdbeats.com', role: 'CUSTOMER_SUPPORT' }
      );

      expect(staffDetails.ok).toBe(true);
      expect(staffDetails.internalNotes).toBeDefined();
      expect(staffDetails.internalNotes?.length).toBe(1);
      expect(staffDetails.internalNotes?.[0].note).toContain('CONFIDENTIAL');
    });

    it('rejects foreign user from viewing ticket details', async () => {
      await expect(
        getSupportTicketDetails(
          mockDb,
          { ticketId },
          { uid: 'foreign_hacker', role: 'FAN' }
        )
      ).rejects.toThrow('You do not have permission to view this ticket.');
    });
  });
});
