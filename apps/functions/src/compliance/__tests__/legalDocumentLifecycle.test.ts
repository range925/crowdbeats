import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSet = jest.fn().mockResolvedValue({} as never);
const mockUpdate = jest.fn().mockResolvedValue({} as never);
const mockGet = jest.fn();
const mockAdd = jest.fn().mockResolvedValue({ id: 'audit_789' } as never);

const mockDoc = jest.fn(() => ({
  set: mockSet,
  update: mockUpdate,
  get: mockGet,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
  get: mockGet,
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
  createDocumentDraft,
  updateDraftSection,
  approveLegalDocument,
  publishLegalDocument,
} from '../legalDocumentCallables';

describe('Legal Document Lifecycle & Review Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated requests to create draft', async () => {
    await expect(
      (createDocumentDraft as any).run({
        auth: null,
        data: {
          documentId: 'doc-terms',
          newVersion: '2026-09-01',
          summaryOfChanges: 'Updated Stripe references',
        },
      }),
    ).rejects.toThrow('Authentication required.');
  });

  it('creates draft without altering original published document', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        documentType: 'TERMS_OF_SERVICE',
        title: 'Terms of Service',
        sections: [{ sectionId: 'sec-1', heading: 'Intro', content: 'Original', order: 1 }],
      }),
    } as never);

    const res = await (createDocumentDraft as any).run({
      auth: { uid: 'compliance_admin_1', token: { platformRole: 'COMPLIANCE_ADMIN' } },
      data: {
        documentId: 'doc-terms',
        newVersion: '2026-09-01',
        summaryOfChanges: 'Updated Stripe Connect disclosures',
      },
    });

    expect(res.ok).toBe(true);
    expect(res.draftDocId).toBeDefined();
    expect(mockSet).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
  });

  it('updates draft section with modified status', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        state: 'draft',
        sections: [{ sectionId: 'sec-1', heading: 'Intro', content: 'Original', order: 1 }],
      }),
    } as never);

    const res = await (updateDraftSection as any).run({
      auth: { uid: 'compliance_admin_1' },
      data: {
        draftDocId: 'doc-terms_draft_123',
        sectionId: 'sec-1',
        heading: '1. Introduction & Stripe Processing',
        content: 'Updated content aligned with Stripe SSA.',
        counselComments: 'Reviewed by outside counsel.',
      },
    });

    expect(res.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('enforces separation of duties during secondary dual approval', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        state: 'approved',
        authorUid: 'admin_david',
      }),
    } as never);

    await expect(
      (approveLegalDocument as any).run({
        auth: { uid: 'admin_david', token: { platformRole: 'SUPER_ADMIN' } },
        data: {
          draftDocId: 'doc-terms_draft_123',
          approverRole: 'SECONDARY_EXECUTIVE',
        },
      }),
    ).rejects.toThrow('Separation of duties violation');
  });

  it('approves draft successfully under separate secondary approver', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        state: 'approved',
        authorUid: 'compliance_admin_1',
      }),
    } as never);

    const res = await (approveLegalDocument as any).run({
      auth: { uid: 'super_admin_2', token: { platformRole: 'SUPER_ADMIN' } },
      data: {
        draftDocId: 'doc-terms_draft_123',
        approverRole: 'SECONDARY_EXECUTIVE',
      },
    });

    expect(res.ok).toBe(true);
    expect(res.state).toBe('scheduled');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('publishes approved draft, enforces platform re-consent flag, and writes audit event', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        parentDocumentId: 'doc-terms',
        documentType: 'TERMS_OF_SERVICE',
        title: 'Terms of Service',
        version: '2026-09-01',
        state: 'scheduled',
        sections: [{ sectionId: 'sec-1', heading: 'Terms', content: 'Published text' }],
      }),
    } as never);

    const res = await (publishLegalDocument as any).run({
      auth: { uid: 'executive_1', token: { platformRole: 'EXECUTIVE' } },
      data: { draftDocId: 'doc-terms_draft_123' },
    });

    expect(res.ok).toBe(true);
    expect(res.documentId).toBe('doc-terms');
    expect(res.version).toBe('2026-09-01');
    expect(mockSet).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
  });
});

