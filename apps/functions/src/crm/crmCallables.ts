/**
 * Crowdbeats V2 — CRM Callables (Phase 6)
 *
 * Exposes server-authoritative onCall endpoints for:
 * - getCrmCustomerProfile
 * - recordCrmEvent
 * - getCrmRelationships
 * - getCrmFinancialReferences
 * - addCrmInternalNote
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import type {
  GetCrmCustomerProfileRequest,
  GetCrmCustomerProfileResponse,
  RecordCrmEventRequest,
  RecordCrmEventResponse,
  GetCrmRelationshipsRequest,
  GetCrmRelationshipsResponse,
  GetCrmFinancialReferencesRequest,
  GetCrmFinancialReferencesResponse,
  AddCrmInternalNoteRequest,
  AddCrmInternalNoteResponse,
} from '@crowdbeats/contracts';
import {
  getCrmCustomerProfile,
  recordCrmEvent,
  getCrmRelationships,
  getCrmFinancialReferences,
  addCrmInternalNote,
  isStaffCaller,
} from './crmService';

const db = () => admin.firestore();

/**
 * getCrmCustomerProfileCallable
 * Returns aggregated customer profile. End-users only see their own profile (with internal notes sanitized).
 * Staff roles see full profile including internal notes.
 */
export const getCrmCustomerProfileCallable = onCall<GetCrmCustomerProfileRequest>(
  { region: 'us-central1' },
  async (request): Promise<GetCrmCustomerProfileResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const { targetUid } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'Target UID is required.');
    }

    const caller = {
      uid,
      platformRole: (token.platformRole as string) || null,
      isAdmin: token.admin === true || token.isAdmin === true,
    };

    const profile = await getCrmCustomerProfile(db(), targetUid, caller);
    return {
      ok: true,
      profile,
    };
  }
);

/**
 * recordCrmEventCallable
 * Staff-only or server integration endpoint for recording CRM events with idempotency.
 */
export const recordCrmEventCallable = onCall<RecordCrmEventRequest>(
  { region: 'us-central1' },
  async (request): Promise<RecordCrmEventResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const caller = {
      platformRole: (token.platformRole as string) || null,
      isAdmin: token.admin === true || token.isAdmin === true,
    };

    if (!isStaffCaller(caller)) {
      throw new HttpsError('permission-denied', 'Only authorized staff may record manual CRM events.');
    }

    const { source, action, targetId, targetType, idempotencyKey, payload, retentionDays } =
      request.data || {};

    const result = await recordCrmEvent(db(), {
      source,
      action,
      actorUid: uid,
      actorRole: caller.platformRole || 'staff',
      targetId,
      targetType,
      idempotencyKey,
      payload,
      retentionDays,
    });

    return result;
  }
);

/**
 * getCrmRelationshipsCallable
 * Queries directed relationships (following/followers) with deterministic compound IDs.
 */
export const getCrmRelationshipsCallable = onCall<GetCrmRelationshipsRequest>(
  { region: 'us-central1' },
  async (request): Promise<GetCrmRelationshipsResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid: callerUid, token } = request.auth;
    const { uid, direction, limit } = request.data || {};

    if (!uid || typeof uid !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid uid is required.');
    }

    const caller = {
      platformRole: (token.platformRole as string) || null,
      isAdmin: token.admin === true || token.isAdmin === true,
    };

    // User can query own relationships, or staff can query any user's relationships
    if (callerUid !== uid && !isStaffCaller(caller)) {
      throw new HttpsError('permission-denied', 'Not authorized to view relationships for this user.');
    }

    const result = await getCrmRelationships(db(), uid, { direction, limit });
    return result;
  }
);

/**
 * getCrmFinancialReferencesCallable
 * Queries financial references (tips sent, tips received, payouts) for a user.
 */
export const getCrmFinancialReferencesCallable = onCall<GetCrmFinancialReferencesRequest>(
  { region: 'us-central1' },
  async (request): Promise<GetCrmFinancialReferencesResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid: callerUid, token } = request.auth;
    const { uid, limit } = request.data || {};

    if (!uid || typeof uid !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid uid is required.');
    }

    const caller = {
      platformRole: (token.platformRole as string) || null,
      isAdmin: token.admin === true || token.isAdmin === true,
    };

    // User can query own finances, or staff can query any user's finances
    if (callerUid !== uid && !isStaffCaller(caller)) {
      throw new HttpsError('permission-denied', 'Not authorized to view financial records for this user.');
    }

    const result = await getCrmFinancialReferences(db(), uid, { limit });
    return result;
  }
);

/**
 * addCrmInternalNoteCallable
 * Allows staff to add internal CRM notes to a user record. Audited and recorded as a CRM event.
 */
export const addCrmInternalNoteCallable = onCall<AddCrmInternalNoteRequest>(
  { region: 'us-central1' },
  async (request): Promise<AddCrmInternalNoteResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const caller = {
      uid,
      platformRole: (token.platformRole as string) || null,
      isAdmin: token.admin === true || token.isAdmin === true,
      email: token.email as string | undefined,
    };

    if (!isStaffCaller(caller)) {
      throw new HttpsError('permission-denied', 'Only authorized staff may add internal CRM notes.');
    }

    const { targetUid, note } = request.data || {};
    const result = await addCrmInternalNote(db(), targetUid, note, caller);
    return result;
  }
);
