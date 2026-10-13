/**
 * Crowdbeats V2 — Disaster Recovery & Reliability Callables (Phase 23)
 *
 * Implements server-authoritative onCall endpoints for:
 * 1. redriveNotificationDlqCallable: re-drives unresolved DLQ notifications
 * 2. replayStripeWebhookCallable: safely re-drives failed/dropped Stripe webhooks
 * 3. runDisasterRecoveryDrillCallable: executes non-destructive automated DR drills
 * 4. getReliabilityHealthSummaryCallable: provides operational DR status overview
 *
 * Role-Based Access Control:
 * - Redrive DLQ: SUPER_ADMIN, DEVELOPER, CUSTOMER_SUPPORT
 * - Replay Webhooks: SUPER_ADMIN, FINANCE_ADMIN, DEVELOPER
 * - Run DR Drills: SUPER_ADMIN, DEVELOPER
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  type RedriveNotificationDlqRequest,
  type RedriveNotificationDlqResponse,
  type ReplayWebhookEventRequest,
  type ReplayWebhookEventResponse,
  type DisasterRecoveryDrillRequest,
  type RunDisasterRecoveryDrillResponse,
} from '@crowdbeats/contracts';
import {
  redriveNotificationDlq,
  replayStripeWebhook,
  executeDisasterRecoveryDrill,
  getReliabilityHealthSummary,
  isAuthorizedDrStaff,
} from './disasterRecoveryService.js';

const _db = () => admin.firestore();

// ─── 1. REDRIVE NOTIFICATION DLQ CALLABLE ───────────────────────────────────

export const redriveNotificationDlqCallable = onCall(
  { region: 'us-central1' },
  async (request): Promise<RedriveNotificationDlqResponse> => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to redrive DLQ.');
    }

    const callerRole = (auth.token?.role as string) || (auth.token?.platformRole as string);
    if (!isAuthorizedDrStaff(callerRole) && callerRole !== 'CUSTOMER_SUPPORT') {
      throw new HttpsError('permission-denied', 'Caller is not authorized to redrive the notification DLQ.');
    }

    const payload = (request.data || {}) as RedriveNotificationDlqRequest;
    return await redriveNotificationDlq(_db(), payload, auth.uid);
  },
);

// ─── 2. REPLAY STRIPE WEBHOOK CALLABLE ──────────────────────────────────────

export const replayStripeWebhookCallable = onCall(
  { region: 'us-central1' },
  async (request): Promise<ReplayWebhookEventResponse> => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to replay webhooks.');
    }

    const callerRole = (auth.token?.role as string) || (auth.token?.platformRole as string);
    if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'FINANCE_ADMIN' && callerRole !== 'DEVELOPER') {
      throw new HttpsError('permission-denied', 'Caller is not authorized to replay Stripe webhooks.');
    }

    const payload = request.data as ReplayWebhookEventRequest;
    if (!payload?.eventId) {
      throw new HttpsError('invalid-argument', 'eventId is required to replay a Stripe webhook.');
    }

    return await replayStripeWebhook(_db(), payload, auth.uid);
  },
);

// ─── 3. RUN DISASTER RECOVERY DRILL CALLABLE ────────────────────────────────

export const runDisasterRecoveryDrillCallable = onCall(
  { region: 'us-central1' },
  async (request): Promise<RunDisasterRecoveryDrillResponse> => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to execute DR drills.');
    }

    const callerRole = (auth.token?.role as string) || (auth.token?.platformRole as string);
    if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'DEVELOPER') {
      throw new HttpsError('permission-denied', 'Caller is not authorized to execute Disaster Recovery drills.');
    }

    const payload = request.data as DisasterRecoveryDrillRequest;
    if (!payload?.drillType) {
      throw new HttpsError('invalid-argument', 'drillType is required to execute a Disaster Recovery drill.');
    }

    const result = await executeDisasterRecoveryDrill(_db(), payload, auth.uid);
    return { ok: true, result };
  },
);

// ─── 4. GET RELIABILITY HEALTH SUMMARY CALLABLE ─────────────────────────────

export const getReliabilityHealthSummaryCallable = onCall(
  { region: 'us-central1' },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const callerRole = (auth.token?.role as string) || (auth.token?.platformRole as string);
    if (!isAuthorizedDrStaff(callerRole)) {
      throw new HttpsError('permission-denied', 'Caller is not authorized to view reliability health.');
    }

    const summary = await getReliabilityHealthSummary(_db());
    return { ok: true, summary };
  },
);
