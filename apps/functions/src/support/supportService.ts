/**
 * Crowdbeats V2 — Support & Case Management Core Service (Phase 9)
 *
 * Implements server-authoritative logic for:
 * - Ticket creation (authenticated users & unauthenticated guests with priority & SLA calculation)
 * - Ticket assignment & reassignment (staff only, with history & audit trail)
 * - Resolution tracking (staff only, mandatory resolution notes & notification dispatch)
 * - Reopen workflows (ticket owner or staff, validation against open tickets & notification)
 * - Customer messages vs private internal staff notes (strict privacy boundary)
 * - History lifecycle audit logging & CRM event synchronization
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
  SupportMessage,
  SupportInternalNote,
  SupportTicketHistoryEntry,
  CreateSupportTicketRequest,
  CreateSupportTicketResponse,
  AssignSupportTicketRequest,
  AssignSupportTicketResponse,
  ResolveSupportTicketRequest,
  ResolveSupportTicketResponse,
  ReopenSupportTicketRequest,
  ReopenSupportTicketResponse,
  AddSupportTicketMessageRequest,
  AddSupportTicketMessageResponse,
  AddSupportInternalNoteRequest,
  AddSupportInternalNoteResponse,
  GetSupportTicketDetailsRequest,
  GetSupportTicketDetailsResponse,
} from '@crowdbeats/contracts';
import { dispatchServerNotification } from '../notifications/dispatchNotification.js';

export const SUPPORT_STAFF_ROLES = [
  'SUPER_ADMIN',
  'CUSTOMER_SUPPORT',
  'TRUST_SAFETY',
  'ARTIST_RELATIONS',
  'FINANCE_ADMIN',
  'COMPLIANCE_OFFICER',
  'EXECUTIVE',
  'DEVELOPER',
] as const;

export interface CallerContext {
  uid?: string;
  email?: string;
  role?: string;
}

export function isStaffRole(role?: string): boolean {
  if (!role) return false;
  return (SUPPORT_STAFF_ROLES as readonly string[]).includes(role);
}

/**
 * Calculates SLA due timestamp based on ticket priority.
 * - urgent: 2 hours (120 mins)
 * - high: 8 hours (480 mins)
 * - normal: 24 hours (1440 mins)
 * - low: 48 hours (2880 mins)
 */
export function calculateSlaDueAt(priority: SupportTicketPriority, fromDate = new Date()): Date {
  const due = new Date(fromDate);
  switch (priority) {
    case 'urgent':
      due.setHours(due.getHours() + 2);
      break;
    case 'high':
      due.setHours(due.getHours() + 8);
      break;
    case 'low':
      due.setHours(due.getHours() + 48);
      break;
    case 'normal':
    default:
      due.setHours(due.getHours() + 24);
      break;
  }
  return due;
}

/**
 * Generates human-readable sequential-like ticket number: TICK-YYYYMMDD-XXXX
 */
export function generateTicketNumber(): string {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TICK-${yyyymmdd}-${rand}`;
}

// ─── 1. CREATE SUPPORT TICKET ────────────────────────────────────────────────

export async function createSupportTicket(
  db: admin.firestore.Firestore,
  request: CreateSupportTicketRequest,
  caller?: CallerContext
): Promise<CreateSupportTicketResponse> {
  const subject = request.subject?.trim();
  const message = request.message?.trim();

  if (!subject || subject.length < 3) {
    throw new HttpsError('invalid-argument', 'Subject is required (minimum 3 characters).');
  }
  if (!message || message.length < 5) {
    throw new HttpsError('invalid-argument', 'Message is required (minimum 5 characters).');
  }

  const category: SupportTicketCategory = request.category || 'general';
  let priority: SupportTicketPriority = request.priority || 'normal';

  // Automatically escalate priority if urgent topics detected
  const lowerSubj = subject.toLowerCase();
  const lowerMsg = message.toLowerCase();
  if (
    category === 'billing' ||
    category === 'safety' ||
    lowerSubj.includes('urgent') ||
    lowerSubj.includes('fraud') ||
    lowerSubj.includes('dispute') ||
    lowerMsg.includes('unauthorized charge')
  ) {
    if (priority !== 'urgent') {
      priority = 'high';
    }
  }

  const ticketRef = db.collection('supportRequests').doc();
  const ticketId = ticketRef.id;
  const ticketNumber = generateTicketNumber();
  const now = new Date();
  const nowIso = now.toISOString();
  const slaDueAt = calculateSlaDueAt(priority, now);

  const userId = caller?.uid || null;
  const userEmail = caller?.email || request.email?.trim() || null;
  const userName = request.name?.trim() || null;

  const ticketDoc: Record<string, any> = {
    ticketId,
    ticketNumber,
    subject,
    description: message,
    category,
    priority,
    status: 'open',
    userId,
    userEmail,
    userName,
    userPersona: caller?.role || 'GUEST',
    assignedTo: null,
    assignedStaffName: null,
    assignedStaffEmail: null,
    assignedAt: null,
    resolvedAt: null,
    resolvedBy: null,
    resolutionNotes: null,
    reopenedAt: null,
    reopenedBy: null,
    reopenReason: null,
    slaDueAt: slaDueAt.toISOString(),
    messageCount: 1,
    noteCount: 0,
    relatedSessionId: request.relatedSessionId || null,
    relatedTipId: request.relatedTipId || null,
    relatedCampaignId: request.relatedCampaignId || null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const batch = db.batch();

  // 1. Create main ticket document
  batch.set(ticketRef, ticketDoc);

  // 2. Initial customer message in subcollection
  const msgRef = ticketRef.collection('messages').doc();
  const initialMessage: SupportMessage = {
    id: msgRef.id,
    ticketId,
    senderUid: caller?.uid || 'guest_submitter',
    senderName: userName || caller?.email || 'Customer',
    senderEmail: userEmail || undefined,
    senderRole: caller?.role || 'GUEST',
    isStaff: false,
    message,
    createdAt: nowIso,
  };
  batch.set(msgRef, initialMessage);

  // 3. Initial lifecycle history event
  const historyRef = ticketRef.collection('history').doc();
  const initialHistory: SupportTicketHistoryEntry = {
    id: historyRef.id,
    ticketId,
    action: 'CREATED',
    actorUid: caller?.uid || 'guest_submitter',
    actorEmail: userEmail || undefined,
    actorRole: caller?.role || 'GUEST',
    toStatus: 'open',
    details: { subject, category, priority, ticketNumber },
    timestamp: nowIso,
  };
  batch.set(historyRef, initialHistory);

  // 4. CRM Event dual-write
  const crmEventRef = db.collection('crmEvents').doc();
  batch.set(crmEventRef, {
    eventId: crmEventRef.id,
    eventType: 'SUPPORT_TICKET_CREATED',
    source: 'support_desk',
    targetId: ticketId,
    targetType: 'support_ticket',
    actorUid: caller?.uid || 'guest_submitter',
    actorEmail: userEmail || undefined,
    actorRole: caller?.role || 'GUEST',
    timestamp: nowIso,
    payload: {
      ticketNumber,
      category,
      priority,
      subject,
      userId,
      userEmail,
    },
  });

  await batch.commit();

  // 5. Notify customer if authenticated
  if (userId) {
    try {
      await dispatchServerNotification({
        recipientUid: userId,
        type: 'support_ticket_created',
        title: `Support Ticket Received: ${ticketNumber}`,
        body: `We have received your inquiry: "${subject}". Our support crew will review it shortly.`,
        data: { ticketId, ticketNumber },
        clickAction: `/account/support?ticketId=${ticketId}`,
      });
    } catch {
      // Non-blocking notification dispatch
    }
  }

  return {
    ok: true,
    ticketId,
    ticketNumber,
    status: 'open',
    priority,
    message: `Support ticket ${ticketNumber} created successfully.`,
  };
}

// ─── 2. ASSIGN SUPPORT TICKET ────────────────────────────────────────────────

export async function assignSupportTicket(
  db: admin.firestore.Firestore,
  request: AssignSupportTicketRequest,
  caller: CallerContext
): Promise<AssignSupportTicketResponse> {
  if (!isStaffRole(caller.role)) {
    throw new HttpsError('permission-denied', 'Caller does not have required support staff role.');
  }

  const { ticketId, assignedStaffUid, assignedStaffName, assignedStaffEmail, note } = request;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid ticket ID is required.');
  }
  if (!assignedStaffUid || typeof assignedStaffUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Assigned staff UID is required.');
  }

  const ticketRef = db.doc(`supportRequests/${ticketId}`);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new HttpsError('not-found', `Support ticket ${ticketId} not found.`);
  }

  const currentData = ticketSnap.data() || {};
  const prevAssignedTo = currentData.assignedTo || null;
  const now = new Date();
  const nowIso = now.toISOString();

  // If status was 'open', transitioning assignment marks it 'in_progress'
  const newStatus: SupportTicketStatus =
    currentData.status === 'open' ? 'in_progress' : currentData.status || 'in_progress';

  const batch = db.batch();

  batch.update(ticketRef, {
    assignedTo: assignedStaffUid,
    assignedStaffName: assignedStaffName || null,
    assignedStaffEmail: assignedStaffEmail || null,
    assignedAt: nowIso,
    status: newStatus,
    updatedAt: nowIso,
  });

  // History entry
  const historyRef = ticketRef.collection('history').doc();
  batch.set(historyRef, {
    id: historyRef.id,
    ticketId,
    action: 'ASSIGNED',
    actorUid: caller.uid || 'system',
    actorEmail: caller.email,
    actorRole: caller.role,
    fromStatus: currentData.status,
    toStatus: newStatus,
    details: {
      fromAssignedTo: prevAssignedTo,
      toAssignedTo: assignedStaffUid,
      assignedStaffName,
      assignedStaffEmail,
      note: note || undefined,
    },
    timestamp: nowIso,
  });

  // If operational note supplied during assignment, record as private staff note
  if (note && note.trim().length > 0) {
    const noteRef = ticketRef.collection('internalNotes').doc();
    batch.set(noteRef, {
      id: noteRef.id,
      ticketId,
      authorUid: caller.uid || 'system',
      authorName: caller.email || 'Staff Agent',
      authorEmail: caller.email,
      authorRole: caller.role || 'CUSTOMER_SUPPORT',
      note: `[ASSIGNMENT NOTE] ${note.trim()}`,
      createdAt: nowIso,
    });
  }

  // Audit event
  const auditRef = db.collection('auditEvents').doc();
  batch.set(auditRef, {
    eventId: auditRef.id,
    actorUid: caller.uid || 'unknown',
    actorEmail: caller.email || '',
    actorRole: caller.role || 'STAFF',
    targetUid: ticketId,
    targetType: 'supportTicket',
    action: 'ADMIN_ASSIGN_SUPPORT_TICKET',
    fieldDiff: ['assignedTo', 'assignedAt', 'status'],
    reason: `Ticket assigned to ${assignedStaffUid}`,
    timestamp: nowIso,
  });

  await batch.commit();

  // Notify assigned staff
  try {
    await dispatchServerNotification({
      recipientUid: assignedStaffUid,
      type: 'support_ticket_assigned',
      title: `Assigned Ticket: ${currentData.ticketNumber || ticketId}`,
      body: `You have been assigned ticket "${currentData.subject || 'Inquiry'}"`,
      data: { ticketId },
      clickAction: `/admin/support?ticketId=${ticketId}`,
    });
  } catch {
    // Non-blocking notification
  }

  return {
    ok: true,
    ticketId,
    assignedTo: assignedStaffUid,
    status: newStatus,
    message: `Ticket successfully assigned to ${assignedStaffName || assignedStaffUid}.`,
  };
}

// ─── 3. RESOLVE SUPPORT TICKET ───────────────────────────────────────────────

export async function resolveSupportTicket(
  db: admin.firestore.Firestore,
  request: ResolveSupportTicketRequest,
  caller: CallerContext
): Promise<ResolveSupportTicketResponse> {
  if (!isStaffRole(caller.role)) {
    throw new HttpsError('permission-denied', 'Caller does not have required support staff role.');
  }

  const { ticketId, resolutionNotes } = request;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid ticket ID is required.');
  }
  if (!resolutionNotes || typeof resolutionNotes !== 'string' || resolutionNotes.trim().length < 5) {
    throw new HttpsError(
      'invalid-argument',
      'Detailed resolution notes are mandatory before resolving a ticket (minimum 5 characters).'
    );
  }

  const ticketRef = db.doc(`supportRequests/${ticketId}`);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new HttpsError('not-found', `Support ticket ${ticketId} not found.`);
  }

  const currentData = ticketSnap.data() || {};
  const prevStatus = currentData.status || 'open';
  const now = new Date();
  const nowIso = now.toISOString();

  const batch = db.batch();

  batch.update(ticketRef, {
    status: 'resolved',
    resolvedAt: nowIso,
    resolvedBy: caller.uid || 'staff',
    resolutionNotes: resolutionNotes.trim(),
    updatedAt: nowIso,
  });

  // History entry
  const historyRef = ticketRef.collection('history').doc();
  batch.set(historyRef, {
    id: historyRef.id,
    ticketId,
    action: 'RESOLVED',
    actorUid: caller.uid || 'system',
    actorEmail: caller.email,
    actorRole: caller.role,
    fromStatus: prevStatus,
    toStatus: 'resolved',
    details: {
      resolutionNotes: resolutionNotes.trim(),
      resolvedBy: caller.uid,
    },
    timestamp: nowIso,
  });

  // Dual-write CRM Event
  const crmEventRef = db.collection('crmEvents').doc();
  batch.set(crmEventRef, {
    eventId: crmEventRef.id,
    eventType: 'SUPPORT_TICKET_RESOLVED',
    source: 'support_desk',
    targetId: ticketId,
    targetType: 'support_ticket',
    actorUid: caller.uid || 'system',
    actorEmail: caller.email,
    actorRole: caller.role,
    timestamp: nowIso,
    payload: {
      ticketNumber: currentData.ticketNumber,
      userId: currentData.userId,
      resolutionNotes: resolutionNotes.trim(),
    },
  });

  // Audit event
  const auditRef = db.collection('auditEvents').doc();
  batch.set(auditRef, {
    eventId: auditRef.id,
    actorUid: caller.uid || 'unknown',
    actorEmail: caller.email || '',
    actorRole: caller.role || 'STAFF',
    targetUid: ticketId,
    targetType: 'supportTicket',
    action: 'ADMIN_RESOLVE_SUPPORT_TICKET',
    fieldDiff: ['status', 'resolvedAt', 'resolvedBy', 'resolutionNotes'],
    reason: resolutionNotes.trim(),
    timestamp: nowIso,
  });

  await batch.commit();

  // Notify customer of resolution
  if (currentData.userId) {
    try {
      await dispatchServerNotification({
        recipientUid: currentData.userId,
        type: 'support_ticket_resolved',
        title: `Ticket Resolved: ${currentData.ticketNumber || ticketId}`,
        body: `Your support request "${currentData.subject || 'Inquiry'}" has been marked as resolved.`,
        data: { ticketId },
        clickAction: `/account/support?ticketId=${ticketId}`,
      });
    } catch {
      // Non-blocking notification
    }
  }

  return {
    ok: true,
    ticketId,
    status: 'resolved',
    resolvedAt: nowIso,
    message: `Ticket ${currentData.ticketNumber || ticketId} has been successfully resolved.`,
  };
}

// ─── 4. REOPEN SUPPORT TICKET ────────────────────────────────────────────────

export async function reopenSupportTicket(
  db: admin.firestore.Firestore,
  request: ReopenSupportTicketRequest,
  caller: CallerContext
): Promise<ReopenSupportTicketResponse> {
  const { ticketId, reason } = request;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid ticket ID is required.');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw new HttpsError('invalid-argument', 'Reason for reopening is mandatory (minimum 5 characters).');
  }

  const ticketRef = db.doc(`supportRequests/${ticketId}`);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new HttpsError('not-found', `Support ticket ${ticketId} not found.`);
  }

  const currentData = ticketSnap.data() || {};
  const isOwner = caller.uid && currentData.userId === caller.uid;
  const isStaff = isStaffRole(caller.role);

  if (!isOwner && !isStaff) {
    throw new HttpsError('permission-denied', 'Only the ticket owner or support staff can reopen this ticket.');
  }

  const currentStatus = currentData.status || 'open';
  if (currentStatus !== 'resolved' && currentStatus !== 'closed') {
    throw new HttpsError(
      'failed-precondition',
      `Cannot reopen ticket: status is currently "${currentStatus}" (ticket is already open).`
    );
  }

  const newStatus: SupportTicketStatus = currentData.assignedTo ? 'in_progress' : 'open';
  const now = new Date();
  const nowIso = now.toISOString();

  const batch = db.batch();

  batch.update(ticketRef, {
    status: newStatus,
    reopenedAt: nowIso,
    reopenedBy: caller.uid || 'customer',
    reopenReason: reason.trim(),
    updatedAt: nowIso,
  });

  // History entry
  const historyRef = ticketRef.collection('history').doc();
  batch.set(historyRef, {
    id: historyRef.id,
    ticketId,
    action: 'REOPENED',
    actorUid: caller.uid || 'system',
    actorEmail: caller.email,
    actorRole: caller.role || (isOwner ? 'CUSTOMER' : 'STAFF'),
    fromStatus: currentStatus,
    toStatus: newStatus,
    details: {
      reason: reason.trim(),
      reopenedBy: caller.uid,
    },
    timestamp: nowIso,
  });

  // Dual-write CRM Event
  const crmEventRef = db.collection('crmEvents').doc();
  batch.set(crmEventRef, {
    eventId: crmEventRef.id,
    eventType: 'SUPPORT_TICKET_REOPENED',
    source: 'support_desk',
    targetId: ticketId,
    targetType: 'support_ticket',
    actorUid: caller.uid || 'system',
    actorEmail: caller.email,
    actorRole: caller.role || (isOwner ? 'CUSTOMER' : 'STAFF'),
    timestamp: nowIso,
    payload: {
      ticketNumber: currentData.ticketNumber,
      userId: currentData.userId,
      reason: reason.trim(),
    },
  });

  // Audit event
  const auditRef = db.collection('auditEvents').doc();
  batch.set(auditRef, {
    eventId: auditRef.id,
    actorUid: caller.uid || 'unknown',
    actorEmail: caller.email || '',
    actorRole: caller.role || (isOwner ? 'CUSTOMER' : 'STAFF'),
    targetUid: ticketId,
    targetType: 'supportTicket',
    action: 'REOPEN_SUPPORT_TICKET',
    fieldDiff: ['status', 'reopenedAt', 'reopenedBy', 'reopenReason'],
    reason: reason.trim(),
    timestamp: nowIso,
  });

  await batch.commit();

  // If customer reopened and ticket has an assigned staff agent, notify them
  if (isOwner && currentData.assignedTo) {
    try {
      await dispatchServerNotification({
        recipientUid: currentData.assignedTo,
        type: 'support_ticket_reopened',
        title: `Ticket Reopened: ${currentData.ticketNumber || ticketId}`,
        body: `Customer has reopened ticket: "${reason.trim()}"`,
        data: { ticketId },
        clickAction: `/admin/support?ticketId=${ticketId}`,
      });
    } catch {
      // Non-blocking notification
    }
  }

  return {
    ok: true,
    ticketId,
    status: newStatus,
    reopenedAt: nowIso,
    message: `Ticket ${currentData.ticketNumber || ticketId} has been successfully reopened.`,
  };
}

// ─── 5. ADD CUSTOMER-FACING MESSAGE ──────────────────────────────────────────

export async function addSupportTicketMessage(
  db: admin.firestore.Firestore,
  request: AddSupportTicketMessageRequest,
  caller: CallerContext
): Promise<AddSupportTicketMessageResponse> {
  const { ticketId, message } = request;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid ticket ID is required.');
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Message content is required.');
  }

  const ticketRef = db.doc(`supportRequests/${ticketId}`);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new HttpsError('not-found', `Support ticket ${ticketId} not found.`);
  }

  const currentData = ticketSnap.data() || {};
  const isOwner = caller.uid && currentData.userId === caller.uid;
  const isStaff = isStaffRole(caller.role);

  if (!isOwner && !isStaff) {
    throw new HttpsError('permission-denied', 'Only the ticket owner or authorized staff can post to this thread.');
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // If ticket is resolved/closed and customer messages, reopen or flag
  let statusUpdate: SupportTicketStatus | undefined;
  if (isOwner && (currentData.status === 'resolved' || currentData.status === 'closed')) {
    statusUpdate = currentData.assignedTo ? 'in_progress' : 'open';
  } else if (!isStaff && currentData.status === 'waiting_on_customer') {
    statusUpdate = 'in_progress';
  }

  const batch = db.batch();

  // Create message document in subcollection
  const msgRef = ticketRef.collection('messages').doc();
  const messageData: SupportMessage = {
    id: msgRef.id,
    ticketId,
    senderUid: caller.uid || 'guest',
    senderName: caller.email || (isStaff ? 'Support Specialist' : 'Customer'),
    senderEmail: caller.email,
    senderRole: caller.role || (isStaff ? 'STAFF' : 'CUSTOMER'),
    isStaff,
    message: message.trim(),
    createdAt: nowIso,
  };
  batch.set(msgRef, messageData);

  // Update ticket document metadata
  const ticketUpdates: Record<string, any> = {
    updatedAt: nowIso,
    messageCount: admin.firestore.FieldValue.increment(1),
  };
  if (statusUpdate) {
    ticketUpdates.status = statusUpdate;
  }
  batch.update(ticketRef, ticketUpdates);

  // History entry
  const historyRef = ticketRef.collection('history').doc();
  batch.set(historyRef, {
    id: historyRef.id,
    ticketId,
    action: 'MESSAGE_SENT',
    actorUid: caller.uid || 'system',
    actorEmail: caller.email,
    actorRole: caller.role || (isStaff ? 'STAFF' : 'CUSTOMER'),
    details: {
      messageId: msgRef.id,
      isStaff,
      length: message.trim().length,
    },
    timestamp: nowIso,
  });

  await batch.commit();

  // Dispatch notification to recipient
  if (isStaff && currentData.userId) {
    // Staff replied -> notify customer
    try {
      await dispatchServerNotification({
        recipientUid: currentData.userId,
        type: 'support_message_received',
        title: `New Reply on Ticket ${currentData.ticketNumber || ticketId}`,
        body: message.trim().slice(0, 120),
        data: { ticketId },
        clickAction: `/account/support?ticketId=${ticketId}`,
      });
    } catch {
      // Non-blocking notification
    }
  } else if (!isStaff && currentData.assignedTo) {
    // Customer replied -> notify assigned staff agent
    try {
      await dispatchServerNotification({
        recipientUid: currentData.assignedTo,
        type: 'customer_message_received',
        title: `Customer Reply: ${currentData.ticketNumber || ticketId}`,
        body: message.trim().slice(0, 120),
        data: { ticketId },
        clickAction: `/admin/support?ticketId=${ticketId}`,
      });
    } catch {
      // Non-blocking notification
    }
  }

  return {
    ok: true,
    messageId: msgRef.id,
    ticketId,
    status: statusUpdate || currentData.status || 'open',
  };
}

// ─── 6. ADD PRIVATE INTERNAL STAFF NOTE ──────────────────────────────────────

export async function addSupportInternalNote(
  db: admin.firestore.Firestore,
  request: AddSupportInternalNoteRequest,
  caller: CallerContext
): Promise<AddSupportInternalNoteResponse> {
  // STRICT PRIVACY BOUNDARY: Only staff roles can add internal notes
  if (!isStaffRole(caller.role)) {
    throw new HttpsError('permission-denied', 'Caller does not have required support staff role.');
  }

  const { ticketId, note } = request;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid ticket ID is required.');
  }
  if (!note || typeof note !== 'string' || note.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Note content is required.');
  }

  const ticketRef = db.doc(`supportRequests/${ticketId}`);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new HttpsError('not-found', `Support ticket ${ticketId} not found.`);
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const batch = db.batch();

  // Create internal note document in subcollection
  const noteRef = ticketRef.collection('internalNotes').doc();
  const noteData: SupportInternalNote = {
    id: noteRef.id,
    ticketId,
    authorUid: caller.uid || 'staff',
    authorName: caller.email || 'Staff Agent',
    authorEmail: caller.email,
    authorRole: caller.role || 'CUSTOMER_SUPPORT',
    note: note.trim(),
    createdAt: nowIso,
  };
  batch.set(noteRef, noteData);

  // Update ticket document metadata & append to legacy notes array for backward compatibility
  batch.update(ticketRef, {
    updatedAt: nowIso,
    noteCount: admin.firestore.FieldValue.increment(1),
    notes: admin.firestore.FieldValue.arrayUnion({
      authorUid: caller.uid || 'staff',
      timestamp: Date.now(),
      note: `[INTERNAL NOTE] ${note.trim()}`,
    }),
  });

  // History entry
  const historyRef = ticketRef.collection('history').doc();
  batch.set(historyRef, {
    id: historyRef.id,
    ticketId,
    action: 'INTERNAL_NOTE_ADDED',
    actorUid: caller.uid || 'system',
    actorEmail: caller.email,
    actorRole: caller.role,
    details: {
      noteId: noteRef.id,
    },
    timestamp: nowIso,
  });

  // Audit event
  const auditRef = db.collection('auditEvents').doc();
  batch.set(auditRef, {
    eventId: auditRef.id,
    actorUid: caller.uid || 'unknown',
    actorEmail: caller.email || '',
    actorRole: caller.role || 'STAFF',
    targetUid: ticketId,
    targetType: 'supportTicket',
    action: 'ADMIN_ADD_SUPPORT_TICKET_NOTE',
    fieldDiff: ['internalNotes'],
    reason: 'Added internal staff note',
    timestamp: nowIso,
  });

  await batch.commit();

  return {
    ok: true,
    noteId: noteRef.id,
    ticketId,
  };
}

// ─── 7. GET SUPPORT TICKET DETAILS ───────────────────────────────────────────

export async function getSupportTicketDetails(
  db: admin.firestore.Firestore,
  request: GetSupportTicketDetailsRequest,
  caller: CallerContext
): Promise<GetSupportTicketDetailsResponse> {
  const { ticketId } = request;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid ticket ID is required.');
  }

  const ticketRef = db.doc(`supportRequests/${ticketId}`);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new HttpsError('not-found', `Support ticket ${ticketId} not found.`);
  }

  const data = ticketSnap.data() || {};
  const isOwner = caller.uid && data.userId === caller.uid;
  const isStaff = isStaffRole(caller.role);

  // Access control: only owner or staff can view
  if (!isOwner && !isStaff) {
    throw new HttpsError('permission-denied', 'You do not have permission to view this ticket.');
  }

  // 1. Fetch messages
  const messagesSnap = await ticketRef.collection('messages').orderBy('createdAt', 'asc').get();
  const messages: SupportMessage[] = messagesSnap.docs.map((d) => ({
    id: d.id,
    ticketId,
    ...d.data(),
  })) as SupportMessage[];

  // 2. Fetch history
  const historySnap = await ticketRef.collection('history').orderBy('timestamp', 'asc').get();
  let history: SupportTicketHistoryEntry[] = historySnap.docs.map((d) => ({
    id: d.id,
    ticketId,
    ...d.data(),
  })) as SupportTicketHistoryEntry[];

  // If customer, filter out internal notes from history entries
  if (!isStaff) {
    history = history.filter((h) => h.action !== 'INTERNAL_NOTE_ADDED');
  }

  // 3. STRICT PRIVACY BOUNDARY: Fetch internal notes ONLY if staff
  let internalNotes: SupportInternalNote[] | undefined;
  if (isStaff) {
    const notesSnap = await ticketRef.collection('internalNotes').orderBy('createdAt', 'asc').get();
    internalNotes = notesSnap.docs.map((d) => ({
      id: d.id,
      ticketId,
      ...d.data(),
    })) as SupportInternalNote[];
  }

  const ticket: SupportTicket = {
    id: ticketId,
    ticketId,
    ticketNumber: data.ticketNumber || `TICK-${ticketId.slice(0, 8)}`,
    userId: data.userId || null,
    userEmail: data.userEmail || undefined,
    userName: data.userName || undefined,
    userPersona: data.userPersona || undefined,
    subject: data.subject || 'Support Ticket',
    description: data.description || '',
    category: data.category || 'general',
    priority: data.priority || 'normal',
    status: data.status || 'open',
    assignedTo: data.assignedTo || null,
    assignedStaffName: data.assignedStaffName || null,
    assignedStaffEmail: data.assignedStaffEmail || null,
    assignedAt: data.assignedAt || null,
    resolvedAt: data.resolvedAt || null,
    resolvedBy: data.resolvedBy || null,
    resolutionNotes: data.resolutionNotes || null,
    reopenedAt: data.reopenedAt || null,
    reopenedBy: data.reopenedBy || null,
    reopenReason: data.reopenReason || null,
    slaDueAt: data.slaDueAt || undefined,
    messageCount: data.messageCount || messages.length,
    noteCount: isStaff ? (internalNotes?.length || 0) : 0,
    relatedSessionId: data.relatedSessionId || null,
    relatedTipId: data.relatedTipId || null,
    relatedCampaignId: data.relatedCampaignId || null,
    tags: data.tags || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };

  return {
    ok: true,
    ticket,
    messages,
    internalNotes, // undefined for customers
    history,
  };
}
