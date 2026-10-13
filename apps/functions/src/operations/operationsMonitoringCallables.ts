/**
 * Crowdbeats V2 — Real-Time Operations Monitoring Callables (Phase 10)
 *
 * Exposes HTTPS Gen 2 callables for:
 * - getOperationsMonitoringSnapshotCallable
 * - simulateIncidentAlertCallable
 * - resolveIncidentAlertCallable
 * - acknowledgeIncidentAlertCallable
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  getOperationsMonitoringSnapshot,
  simulateIncidentAlert,
  resolveIncidentAlert,
  acknowledgeIncidentAlert,
  CallerContext,
} from './operationsMonitoringService.js';

function getCaller(request: any): CallerContext {
  const auth = request.auth;
  return {
    uid: auth?.uid,
    email: auth?.token?.email,
    role: auth?.token?.platformRole || auth?.token?.role,
  };
}

export const getOperationsMonitoringSnapshotCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    const snapshot = await getOperationsMonitoringSnapshot(db, caller);
    return { ok: true, snapshot };
  }
);

export const simulateIncidentAlertCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return simulateIncidentAlert(db, request.data || {}, caller);
  }
);

export const resolveIncidentAlertCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return resolveIncidentAlert(db, request.data || {}, caller);
  }
);

export const acknowledgeIncidentAlertCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const caller = getCaller(request);
    const db = admin.firestore();
    return acknowledgeIncidentAlert(db, request.data || {}, caller);
  }
);
