/**
 * Crowdbeats V2 — Support & Case Management Cloud Functions Callables (Phase 9)
 *
 * Exposes Gen 2 HTTPS callables for:
 * - createSupportTicketCallable
 * - assignSupportTicketCallable
 * - resolveSupportTicketCallable
 * - reopenSupportTicketCallable
 * - addSupportTicketMessageCallable
 * - addSupportInternalNoteCallable
 * - getSupportTicketDetailsCallable
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  createSupportTicket,
  assignSupportTicket,
  resolveSupportTicket,
  reopenSupportTicket,
  addSupportTicketMessage,
  addSupportInternalNote,
  getSupportTicketDetails,
  CallerContext,
} from './supportService.js';

function getCaller(request: any): CallerContext {
  const auth = request.auth;
  return {
    uid: auth?.uid,
    email: auth?.token?.email,
    role: auth?.token?.platformRole || auth?.token?.role,
  };
}

export const createSupportTicketCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    const caller = getCaller(request);
    const db = admin.firestore();
    return createSupportTicket(db, request.data || {}, caller);
  }
);

export const assignSupportTicketCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return assignSupportTicket(db, request.data || {}, caller);
  }
);

export const resolveSupportTicketCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return resolveSupportTicket(db, request.data || {}, caller);
  }
);

export const reopenSupportTicketCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return reopenSupportTicket(db, request.data || {}, caller);
  }
);

export const addSupportTicketMessageCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return addSupportTicketMessage(db, request.data || {}, caller);
  }
);

export const addSupportInternalNoteCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return addSupportInternalNote(db, request.data || {}, caller);
  }
);

export const getSupportTicketDetailsCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return getSupportTicketDetails(db, request.data || {}, caller);
  }
);
