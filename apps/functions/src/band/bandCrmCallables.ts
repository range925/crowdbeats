/**
 * Crowdbeats V2 — Band CRM & Member Management Callables (Phase 12)
 *
 * Exposes Cloud Functions v2 onCall entrypoints for Band Studio CRM:
 * - getBandSupportersCallable
 * - getBandSupporterDetailsCallable
 * - sendBandThankYouNoteCallable
 * - getBandActivityCallable
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type {
  GetBandSupportersRequest,
  GetBandSupportersResponse,
  GetBandSupporterDetailsRequest,
  GetBandSupporterDetailsResponse,
  SendBandThankYouNoteRequest,
  SendBandThankYouNoteResponse,
  GetBandActivityRequest,
  GetBandActivityResponse,
} from '@crowdbeats/contracts';
import {
  getBandSupporters,
  getBandSupporterDetails,
  sendBandThankYouNote,
  getBandActivity,
  CallerContext,
} from './bandCrmService.js';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

function _db(): admin.firestore.Firestore {
  return admin.firestore();
}

function getCaller(request: { auth?: { uid: string; token?: Record<string, unknown> } }): CallerContext {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  return {
    uid: request.auth.uid,
    role: request.auth.token?.['role'] as string | undefined,
    email: request.auth.token?.['email'] as string | undefined,
  };
}

export const getBandSupportersCallable = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GetBandSupportersResponse> => {
    const caller = getCaller(request);
    const data = (request.data || {}) as GetBandSupportersRequest;
    return getBandSupporters(_db(), data, caller);
  }
);

export const getBandSupporterDetailsCallable = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GetBandSupporterDetailsResponse> => {
    const caller = getCaller(request);
    const data = (request.data || {}) as GetBandSupporterDetailsRequest;
    return getBandSupporterDetails(_db(), data, caller);
  }
);

export const sendBandThankYouNoteCallable = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<SendBandThankYouNoteResponse> => {
    const caller = getCaller(request);
    const data = (request.data || {}) as SendBandThankYouNoteRequest;
    return sendBandThankYouNote(_db(), data, caller);
  }
);

export const getBandActivityCallable = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GetBandActivityResponse> => {
    const caller = getCaller(request);
    const data = (request.data || {}) as GetBandActivityRequest;
    return getBandActivity(_db(), data, caller);
  }
);
