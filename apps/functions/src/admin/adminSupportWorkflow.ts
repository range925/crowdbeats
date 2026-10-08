import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const updateSupportTicket = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (!['SUPER_ADMIN', 'CUSTOMER_SUPPORT', 'TRUST_SAFETY', 'ARTIST_RELATIONS'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Caller does not have required staff role.');
    }

    const { ticketId, status, assignedTo, resolutionNotes } = request.data || {};

    if (!ticketId || typeof ticketId !== 'string') {
      throw new HttpsError('invalid-argument', 'Ticket ID is required.');
    }

    if (status && !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      throw new HttpsError('invalid-argument', 'Invalid status.');
    }

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const ticketRef = db.doc(`supportRequests/${ticketId}`);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      throw new HttpsError('not-found', 'Ticket not found.');
    }

    const updates: Record<string, any> = { updatedAt: now };
    const fieldDiff: string[] = [];

    if (status) {
      updates.status = status;
      fieldDiff.push('status');
    }
    if (assignedTo !== undefined) {
      updates.assignedTo = assignedTo;
      fieldDiff.push('assignedTo');
    }
    if (resolutionNotes !== undefined) {
      updates.resolutionNotes = resolutionNotes;
      fieldDiff.push('resolutionNotes');
    }

    const batch = db.batch();
    batch.update(ticketRef, updates);

    const auditRef = db.collection('auditEvents').doc();
    batch.set(auditRef, {
      eventId: auditRef.id,
      actorUid: uid,
      actorEmail: token.email || '',
      actorRole: callerRole,
      targetUid: ticketId,
      targetType: 'supportTicket',
      action: 'ADMIN_UPDATE_SUPPORT_TICKET',
      fieldDiff,
      reason: 'Support ticket update',
      timestamp: now,
      requestId: `tupd_${ticketId}_${Date.now()}`
    });

    await batch.commit();

    return { success: true, message: 'Ticket updated successfully.' };
  }
);

export const addSupportTicketNote = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (!['SUPER_ADMIN', 'CUSTOMER_SUPPORT', 'TRUST_SAFETY', 'ARTIST_RELATIONS'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Caller does not have required staff role.');
    }

    const { ticketId, note } = request.data || {};

    if (!ticketId || typeof ticketId !== 'string') {
      throw new HttpsError('invalid-argument', 'Ticket ID is required.');
    }
    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Note is required.');
    }

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const ticketRef = db.doc(`supportRequests/${ticketId}`);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      throw new HttpsError('not-found', 'Ticket not found.');
    }

    const batch = db.batch();

    batch.update(ticketRef, {
      notes: admin.firestore.FieldValue.arrayUnion({
        authorUid: uid,
        timestamp: Date.now(),
        note: note.trim()
      }),
      updatedAt: now
    });

    const auditRef = db.collection('auditEvents').doc();
    batch.set(auditRef, {
      eventId: auditRef.id,
      actorUid: uid,
      actorEmail: token.email || '',
      actorRole: callerRole,
      targetUid: ticketId,
      targetType: 'supportTicket',
      action: 'ADMIN_ADD_SUPPORT_TICKET_NOTE',
      fieldDiff: ['notes'],
      reason: 'Added internal note to ticket',
      timestamp: now,
      requestId: `tnot_${ticketId}_${Date.now()}`
    });

    await batch.commit();

    return { success: true, message: 'Note added successfully.' };
  }
);
