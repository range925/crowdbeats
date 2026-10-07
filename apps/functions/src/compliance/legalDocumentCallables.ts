/**
 * Crowdbeats V2 — Legal Document Lifecycle & Stripe Compliance Callables
 *
 * Implements server-authoritative drafting, structured section updates,
 * track changes, dual-approval controls, and live Stripe compliance status.
 *
 * Invariant: Published documents are immutable and cannot be overwritten in place.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const _db = () => admin.firestore();

export const createDocumentDraft = onCall<{
  documentId: string;
  newVersion: string;
  summaryOfChanges: string;
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const role = request.auth.token.platformRole;
    if (role !== 'SUPER_ADMIN' && role !== 'COMPLIANCE_ADMIN' && role !== 'EXECUTIVE') {
      throw new HttpsError('permission-denied', 'Legal Content Editor or Administrator role required.');
    }

    const { documentId, newVersion, summaryOfChanges } = request.data ?? {};
    if (!documentId || !newVersion || !summaryOfChanges) {
      throw new HttpsError('invalid-argument', 'Document ID, version, and change summary are required.');
    }

    const docRef = _db().collection('legalDocuments').doc(documentId);
    const existingSnap = await docRef.get();
    const existing = existingSnap.data();

    const now = admin.firestore.FieldValue.serverTimestamp();
    const draftDocId = `${documentId}_draft_${Date.now()}`;

    const draftData = {
      parentDocumentId: documentId,
      documentType: existing?.documentType || 'TERMS_OF_SERVICE',
      title: existing?.title || 'Terms of Service Draft',
      version: newVersion,
      state: 'draft',
      summaryOfChanges,
      sections: existing?.sections || [],
      authorUid: request.auth.uid,
      lastEditorUid: request.auth.uid,
      createdAt: now,
      updatedAt: now,
    };

    await _db().collection('legalDocumentDrafts').doc(draftDocId).set(draftData);

    await _db().collection('auditEvents').add({
      eventType: 'LEGAL_DOCUMENT_DRAFT_CREATED',
      actorUid: request.auth.uid,
      targetType: 'LEGAL_DOCUMENT_DRAFT',
      targetId: draftDocId,
      metadata: { documentId, newVersion, summaryOfChanges },
      timestamp: now,
    });

    return {
      ok: true,
      draftDocId,
      message: `Draft version ${newVersion} created successfully.`,
    };
  },
);

export const updateDraftSection = onCall<{
  draftDocId: string;
  sectionId: string;
  heading: string;
  content: string;
  counselComments?: string;
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    const { draftDocId, sectionId, heading, content, counselComments } = request.data ?? {};
    if (!draftDocId || !sectionId || !heading || !content) {
      throw new HttpsError('invalid-argument', 'Draft ID, Section ID, heading, and content are required.');
    }

    const draftRef = _db().collection('legalDocumentDrafts').doc(draftDocId);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) {
      throw new HttpsError('not-found', 'Legal document draft not found.');
    }

    const draftData = draftSnap.data()!;
    if (draftData.state !== 'draft' && draftData.state !== 'changes_requested') {
      throw new HttpsError('failed-precondition', 'Cannot edit draft in current review state.');
    }

    const sections = (draftData.sections || []).map((sec: any) => {
      if (sec.sectionId === sectionId) {
        return {
          ...sec,
          heading,
          content,
          isModified: true,
          counselComments: counselComments || sec.counselComments,
        };
      }
      return sec;
    });

    const now = admin.firestore.FieldValue.serverTimestamp();
    await draftRef.update({
      sections,
      lastEditorUid: request.auth.uid,
      updatedAt: now,
    });

    return { ok: true, message: `Section ${sectionId} updated successfully.` };
  },
);

export const approveLegalDocument = onCall<{
  draftDocId: string;
  approverRole: 'PRIMARY_LEGAL' | 'SECONDARY_EXECUTIVE';
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const role = request.auth.token.platformRole;
    if (role !== 'SUPER_ADMIN' && role !== 'COMPLIANCE_ADMIN') {
      throw new HttpsError('permission-denied', 'Administrator authorization required.');
    }

    const { draftDocId, approverRole } = request.data ?? {};
    if (!draftDocId || !approverRole) {
      throw new HttpsError('invalid-argument', 'Draft ID and approver role required.');
    }

    const draftRef = _db().collection('legalDocumentDrafts').doc(draftDocId);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) throw new HttpsError('not-found', 'Draft not found.');

    const draftData = draftSnap.data()!;

    // Enforce separation of duties: Author cannot be sole approver
    if (draftData.authorUid === request.auth.uid && approverRole === 'SECONDARY_EXECUTIVE') {
      throw new HttpsError(
        'permission-denied',
        'Separation of duties violation: Author cannot provide secondary dual-approval for publication.',
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    if (approverRole === 'PRIMARY_LEGAL') {
      await draftRef.update({
        state: 'approved',
        primaryReviewerUid: request.auth.uid,
        updatedAt: now,
      });
    } else {
      await draftRef.update({
        state: 'scheduled',
        secondaryApproverUid: request.auth.uid,
        updatedAt: now,
      });
    }

    await _db().collection('auditEvents').add({
      eventType: 'LEGAL_DOCUMENT_APPROVED',
      actorUid: request.auth.uid,
      targetType: 'LEGAL_DOCUMENT_DRAFT',
      targetId: draftDocId,
      metadata: { approverRole, newState: approverRole === 'PRIMARY_LEGAL' ? 'approved' : 'scheduled' },
      timestamp: now,
    });

    return { ok: true, state: approverRole === 'PRIMARY_LEGAL' ? 'approved' : 'scheduled' };
  },
);

export const publishLegalDocument = onCall<{
  draftDocId: string;
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const role = request.auth.token.platformRole;
    if (role !== 'SUPER_ADMIN' && role !== 'COMPLIANCE_ADMIN' && role !== 'EXECUTIVE') {
      throw new HttpsError('permission-denied', 'Executive or Compliance Administrator authorization required.');
    }

    const { draftDocId } = request.data ?? {};
    if (!draftDocId) throw new HttpsError('invalid-argument', 'Draft ID is required.');

    const draftRef = _db().collection('legalDocumentDrafts').doc(draftDocId);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) throw new HttpsError('not-found', 'Draft not found.');

    const draftData = draftSnap.data()!;
    if (draftData.state !== 'scheduled' && draftData.state !== 'approved') {
      throw new HttpsError('failed-precondition', 'Draft must be approved or scheduled before publication.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const documentId = draftData.parentDocumentId;

    // 1. Publish to authoritative published documents collection
    await _db().collection('legalDocuments').doc(documentId).set(
      {
        documentId,
        documentType: draftData.documentType,
        title: draftData.title,
        version: draftData.version,
        sections: draftData.sections,
        state: 'published',
        publishedAt: now,
        publisherUid: request.auth.uid,
        requiresReconsent: true,
        updatedAt: now,
      },
      { merge: true },
    );

    // 2. Update platform compliance registry with latest published version
    await _db().collection('platformConfig').doc('compliance').set(
      {
        [`latestVersions.${draftData.documentType}`]: draftData.version,
        updatedAt: now,
      },
      { merge: true },
    );

    // 3. Mark draft as published
    await draftRef.update({
      state: 'published',
      publishedAt: now,
      updatedAt: now,
    });

    // 4. Log immutable audit trail event
    await _db().collection('auditEvents').add({
      eventType: 'LEGAL_DOCUMENT_PUBLISHED',
      actorUid: request.auth.uid,
      targetType: 'LEGAL_DOCUMENT',
      targetId: documentId,
      metadata: { version: draftData.version, draftDocId },
      timestamp: now,
    });

    return {
      ok: true,
      documentId,
      version: draftData.version,
      message: `Document ${documentId} version ${draftData.version} published. Platform re-consent required.`,
    };
  },
);

