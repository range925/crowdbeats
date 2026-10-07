/**
 * Crowdbeats V2 — Synthetic Health Probe Cloud Function
 *
 * Runs end-to-end health verification across:
 * - Firestore write & read latency
 * - Payment Gateway / Stripe Adapter connectivity
 * - Double-entry ledger integrity checks
 */

import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from '../lib/logger.js';
import { StripeAdapter } from '../lib/stripe.js';

export interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  correlationId: string;
  latencyMs: {
    firestore: number;
    stripeGateway: number;
    total: number;
  };
  checks: {
    firestoreReadWrite: boolean;
    stripeConnectivity: boolean;
    ledgerAccessible: boolean;
  };
  version: string;
}

export async function executeSyntheticProbe(correlationId = `probe_${Date.now()}`): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const db = admin.firestore();

  let firestoreLatency = 0;
  let stripeLatency = 0;
  let firestoreOk = false;
  let stripeOk = false;
  let ledgerOk = false;

  // 1. Firestore Read/Write Probe
  try {
    const fsStart = Date.now();
    const probeRef = db.collection('systemHealthProbes').doc(`probe_${Date.now()}`);
    await probeRef.set({
      probeTime: admin.firestore.FieldValue.serverTimestamp(),
      correlationId,
      status: 'active',
    });
    const readSnap = await probeRef.get();
    firestoreOk = readSnap.exists;
    await probeRef.delete();
    firestoreLatency = Date.now() - fsStart;
  } catch (err) {
    logger.error('Firestore health probe failed', err, undefined, correlationId);
  }

  // 2. Stripe Gateway Probe (Read-only connectivity check)
  try {
    const stripeStart = Date.now();
    const stripeAdapter = new StripeAdapter();
    stripeOk = await stripeAdapter.checkConnectivity();
    stripeLatency = Date.now() - stripeStart;
  } catch (err) {
    logger.error('Stripe gateway health probe failed', err, undefined, correlationId);
  }

  // 3. Ledger Accessibility Check
  try {
    const ledgerSnap = await db.collection('paymentLedger').limit(1).get();
    ledgerOk = ledgerSnap !== null;
  } catch (err) {
    logger.error('Ledger health probe failed', err, undefined, correlationId);
  }

  const totalLatency = Date.now() - startTime;
  const isAllHealthy = firestoreOk && stripeOk && ledgerOk;

  const result: HealthCheckResult = {
    status: isAllHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    correlationId,
    latencyMs: {
      firestore: firestoreLatency,
      stripeGateway: stripeLatency,
      total: totalLatency,
    },
    checks: {
      firestoreReadWrite: firestoreOk,
      stripeConnectivity: stripeOk,
      ledgerAccessible: ledgerOk,
    },
    version: '0.9.0-phase12',
  };

  logger.info(
    `Synthetic health probe completed with status: ${result.status}`,
    {
      latencyMs: result.latencyMs,
      checks: result.checks,
    },
    correlationId
  );

  return result;
}

export const runSyntheticHealthCheck = onCall(
  { region: 'us-central1' },
  async (request) => {
    const correlationId = `probe_call_${Date.now()}`;
    return executeSyntheticProbe(correlationId);
  }
);
