/**
 * Crowdbeats V2 — Solo Musician Creator CRM Callables (Phase 11)
 *
 * Exposes HTTPS Gen 2 callables for:
 * - getCreatorSupportersCallable
 * - getCreatorTipAnalyticsCallable
 * - getCreatorSupporterDetailsCallable
 * - sendCreatorThankYouNoteCallable
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  getCreatorSupporters,
  getCreatorTipAnalytics,
  getCreatorSupporterDetails,
  sendCreatorThankYouNote,
  CallerContext,
} from './creatorCrmService.js';

function getCaller(request: any): CallerContext {
  const auth = request.auth;
  return {
    uid: auth?.uid,
    email: auth?.token?.email,
    role: auth?.token?.platformRole || auth?.token?.role,
  };
}

export const getCreatorSupportersCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return getCreatorSupporters(db, request.data || {}, caller);
  }
);

export const getCreatorTipAnalyticsCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return getCreatorTipAnalytics(db, request.data || {}, caller);
  }
);

export const getCreatorSupporterDetailsCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return getCreatorSupporterDetails(db, request.data || {}, caller);
  }
);

export const sendCreatorThankYouNoteCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return sendCreatorThankYouNote(db, request.data || {}, caller);
  }
);
