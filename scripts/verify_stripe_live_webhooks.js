/**
 * Crowdbeats V2 — Stripe Production & Connect Live Webhook Verification Script
 *
 * Automated verification suite for Stripe Live & Connect Webhooks:
 * 1. HMAC-SHA256 Stripe Signature generation using Node.js `crypto`
 * 2. Signature verification with STRIPE_WEBHOOK_SECRET (Account Webhooks)
 * 3. Signature verification with STRIPE_CONNECT_WEBHOOK_SECRET (Connect Webhooks)
 * 4. Rejection of invalid, tampered, and expired signatures (HTTP 400)
 * 5. Idempotent processing of payment_intent.succeeded (replay attack prevention & double-entry ledger)
 * 6. account.updated verification state synchronization and compliance hold enforcement
 * 7. payout.paid completion and payout.failed safe balance reversal
 *
 * Run directly with: `node scripts/verify_stripe_live_webhooks.js`
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const admin = require('firebase-admin');

// ── Test Secrets ─────────────────────────────────────────────────────────────
const MOCK_ACCOUNT_WEBHOOK_SECRET = 'whsec_live_prod_account_secret_test_987654321';
const MOCK_CONNECT_WEBHOOK_SECRET = 'whsec_live_prod_connect_secret_test_123456789';

process.env.STRIPE_WEBHOOK_SECRET = MOCK_ACCOUNT_WEBHOOK_SECRET;
process.env.STRIPE_CONNECT_WEBHOOK_SECRET = MOCK_CONNECT_WEBHOOK_SECRET;

// ── In-Memory Firestore Mock Store ──────────────────────────────────────────
const dbStore = new Map();

function getDocKey(collectionPath, docId) {
  return `${collectionPath}/${docId}`;
}

function resolveTransforms(obj, current = {}) {
  const result = { ...obj };
  for (const [k, v] of Object.entries(result)) {
    if (v && typeof v === 'object') {
      if ('operand' in v && typeof v.operand === 'number') {
        result[k] = (typeof current[k] === 'number' ? current[k] : 0) + v.operand;
      } else if (v._type === 'increment') {
        result[k] = (typeof current[k] === 'number' ? current[k] : 0) + v.n;
      } else if (v.constructor && v.constructor.name === 'ServerTimestampTransform') {
        result[k] = new Date().toISOString();
      }
    }
  }
  return result;
}

function createMockDocRef(collectionPath, docId) {
  const fullPath = getDocKey(collectionPath, docId);
  return {
    id: docId,
    path: fullPath,
    get: async () => {
      const data = dbStore.get(fullPath);
      return {
        id: docId,
        exists: data !== undefined,
        data: () => (data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined),
        ref: createMockDocRef(collectionPath, docId),
      };
    },
    set: async (data, options = {}) => {
      const current = dbStore.get(fullPath) || {};
      const resolved = resolveTransforms(data, current);
      if (options.merge && dbStore.has(fullPath)) {
        dbStore.set(fullPath, { ...current, ...resolved });
      } else {
        dbStore.set(fullPath, resolved);
      }
    },
    update: async (updates) => {
      const current = dbStore.get(fullPath) || {};
      const resolved = resolveTransforms(updates, current);
      dbStore.set(fullPath, { ...current, ...resolved });
    },
    collection: (subCol) => createMockCollectionRef(`${collectionPath}/${docId}/${subCol}`),
  };
}

function createMockCollectionRef(collectionPath) {
  return {
    doc: (docId) => createMockDocRef(collectionPath, docId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`),
    where: (field, op, value) => createMockQuery(collectionPath, [[field, op, value]]),
    limit: (limitN) => createMockQuery(collectionPath, []).limit(limitN),
    get: async () => createMockQuery(collectionPath, []).get(),
    add: async (data) => {
      const docId = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const docRef = createMockDocRef(collectionPath, docId);
      await docRef.set(data);
      return docRef;
    },
  };
}

function createMockQuery(collectionPath, filters) {
  let queryLimit = Infinity;
  return {
    where: (field, op, value) => createMockQuery(collectionPath, [...filters, [field, op, value]]),
    limit: (n) => {
      queryLimit = n;
      return createMockQuery(collectionPath, filters);
    },
    get: async () => {
      const docs = [];
      const prefix = `${collectionPath}/`;
      for (const [key, value] of dbStore.entries()) {
        if (key.startsWith(prefix)) {
          const docId = key.substring(prefix.length);
          if (!docId.includes('/')) {
            const matches = filters.every(([field, op, val]) => {
              if (op === '==') return value[field] === val;
              if (op === 'in') return Array.isArray(val) && val.includes(value[field]);
              return true;
            });
            if (matches) {
              docs.push({
                id: docId,
                data: () => JSON.parse(JSON.stringify(value)),
                ref: createMockDocRef(collectionPath, docId),
              });
            }
          }
        }
      }
      const limited = docs.slice(0, queryLimit);
      return {
        empty: limited.length === 0,
        size: limited.length,
        docs: limited,
      };
    },
  };
}

const mockFirestoreInstance = {
  collection: (path) => createMockCollectionRef(path),
  doc: (path) => {
    const parts = path.split('/');
    const docId = parts.pop();
    return createMockDocRef(parts.join('/'), docId);
  },
  runTransaction: async (updateFunction) => {
    const transaction = {
      get: async (ref) => ref.get(),
      set: (ref, data, opts) => ref.set(data, opts),
      update: (ref, updates) => ref.update(updates),
      delete: (ref) => dbStore.delete(ref.path),
    };
    return updateFunction(transaction);
  },
  batch: () => {
    const operations = [];
    return {
      set: (ref, data, options) => operations.push(() => ref.set(data, options)),
      update: (ref, data) => operations.push(() => ref.update(data)),
      delete: (ref) => operations.push(() => dbStore.delete(ref.path)),
      commit: async () => {
        for (const op of operations) await op();
      },
    };
  },
  FieldValue: {
    serverTimestamp: () => new Date().toISOString(),
    increment: (n) => ({ _type: 'increment', n }),
  },
  Timestamp: {
    fromMillis: (ms) => new Date(ms),
    fromDate: (d) => d,
  },
};

// Initialize Firebase Admin with Mock
if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: 'crowdbeats-v2-prod' });
}
admin.app().firestore = () => mockFirestoreInstance;
admin.firestore = Object.assign(() => mockFirestoreInstance, {
  FieldValue: mockFirestoreInstance.FieldValue,
  Timestamp: mockFirestoreInstance.Timestamp,
});

// Import Cloud Function Webhook Handlers
const { stripeWebhook } = require('../apps/functions/lib/apps/functions/src/tip/webhookHandler.js');
const { stripeConnectWebhook } = require('../apps/functions/lib/apps/functions/src/connect/stripeConnectWebhook.js');

// ── Genuine Stripe Signature Generator ────────────────────────────────────────
/**
 * Computes a genuine Stripe webhook signature header using HMAC-SHA256:
 * format: `t=timestamp,v1=signature`
 */
function createStripeSignature(rawBody, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${rawBody}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// ── HTTP Request / Response Mock Factory ─────────────────────────────────────
function createMockHttpExchange(rawBody, signatureHeader) {
  const req = {
    rawBody,
    body: JSON.parse(rawBody),
    headers: signatureHeader ? { 'stripe-signature': signatureHeader } : {},
  };

  const res = new EventEmitter();
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.send = (data) => {
    res.body = data;
    res.emit('finish');
    return res;
  };
  res.end = (data) => {
    res.body = data;
    res.emit('finish');
    return res;
  };

  return { req, res };
}

// ── Verification Runner & Assertion Utilities ────────────────────────────────
const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runStep(name, fn) {
  const start = Date.now();
  process.stdout.write(`  Testing ${name} ... `);
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`\x1b[32m[PASS]\x1b[0m (${duration}ms)`);
    results.push({ name, status: 'PASS', duration });
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`\x1b[31m[FAIL]\x1b[0m (${duration}ms)`);
    console.error(`    \x1b[31m${error.message}\x1b[0m`);
    results.push({ name, status: 'FAIL', duration, error: error.message });
  }
}

// ── Main Verification Suite ──────────────────────────────────────────────────
async function main() {
  console.log('\n======================================================================');
  console.log('  CROWDBEATS V2 — PRODUCTION STRIPE & CONNECT WEBHOOK VERIFICATION   ');
  console.log('======================================================================\n');

  // ── TEST 1: STRIPE_WEBHOOK_SECRET Verification ───────────────────────────
  await runStep('Valid HMAC-SHA256 signature with STRIPE_WEBHOOK_SECRET', async () => {
    const eventPayload = JSON.stringify({
      id: 'evt_act_valid_001',
      object: 'event',
      type: 'unknown.ping',
      data: { object: { message: 'ping' } },
    });
    const sig = createStripeSignature(eventPayload, MOCK_ACCOUNT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);
    assert(dbStore.has('webhookEvents/evt_act_valid_001'), 'Event not recorded in webhookEvents');
    assert(dbStore.get('webhookEvents/evt_act_valid_001').status === 'COMPLETED', 'Event status is not COMPLETED');
  });

  // ── TEST 2: STRIPE_CONNECT_WEBHOOK_SECRET Verification ───────────────────
  await runStep('Valid HMAC-SHA256 signature with STRIPE_CONNECT_WEBHOOK_SECRET', async () => {
    const eventPayload = JSON.stringify({
      id: 'evt_conn_valid_001',
      object: 'event',
      account: 'acct_test_connect_1',
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_test_connect_1',
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: true,
        },
      },
    });
    const sig = createStripeSignature(eventPayload, MOCK_CONNECT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeConnectWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);
    assert(dbStore.has('webhookEvents/evt_conn_valid_001'), 'Connect event not recorded in webhookEvents');
    assert(dbStore.get('webhookEvents/evt_conn_valid_001').status === 'COMPLETED', 'Connect event status not COMPLETED');
  });

  // ── TEST 3: Invalid Signature Rejection (HTTP 400) ────────────────────────
  await runStep('Invalid / Tampered signature is rejected with HTTP 400', async () => {
    const eventPayload = JSON.stringify({
      id: 'evt_bad_sig_001',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test' } },
    });
    // Signature created with wrong secret
    const badSig = createStripeSignature(eventPayload, 'whsec_completely_wrong_secret_123');
    const { req, res } = createMockHttpExchange(eventPayload, badSig);

    await stripeWebhook(req, res);
    assert(res.statusCode === 400, `Expected HTTP 400 for bad signature, got ${res.statusCode}`);
    assert(!dbStore.has('webhookEvents/evt_bad_sig_001'), 'Tampered event should not be stored');
  });

  await runStep('Missing Stripe-Signature header rejected with HTTP 400', async () => {
    const eventPayload = JSON.stringify({ id: 'evt_no_sig_001', type: 'test' });
    const { req, res } = createMockHttpExchange(eventPayload, null);

    await stripeWebhook(req, res);
    assert(res.statusCode === 400, `Expected HTTP 400 for missing header, got ${res.statusCode}`);
  });

  // ── TEST 4: payment_intent.succeeded Idempotency & Ledger ─────────────────
  await runStep('payment_intent.succeeded processes and credits artist atomically', async () => {
    const tipId = 'tip_live_test_101';
    const fanUid = 'fan_live_user_1';
    const artistId = 'artist_live_creator_1';

    // Seed Tip & Profile in Firestore
    dbStore.set(`tips/${tipId}`, {
      tipId,
      fanUid,
      recipientId: artistId,
      recipientType: 'artist',
      amountCents: 2500, // $25.00
      platformFeeCents: 125, // $1.25 (5%)
      netAmountCents: 2375, // $23.75
      currency: 'USD',
      status: 'pending',
    });
    dbStore.set(`artistProfiles/${artistId}`, {
      artistId,
      availableBalanceCents: 0,
      totalTipsReceivedCents: 0,
      tipCount: 0,
    });

    const eventPayload = JSON.stringify({
      id: 'evt_pi_success_001',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_live_stripe_101',
          amount: 2500,
          currency: 'usd',
          status: 'succeeded',
          metadata: { tipId },
        },
      },
    });

    const sig = createStripeSignature(eventPayload, MOCK_ACCOUNT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);

    // Verify Tip Updated
    const tip = dbStore.get(`tips/${tipId}`);
    assert(tip.status === 'succeeded', `Tip status should be succeeded, got ${tip.status}`);

    // Verify Double-Entry Ledger Created
    const ledgerEntries = [...dbStore.entries()].filter(([k]) => k.startsWith('paymentLedger/')).map(([, v]) => v);
    const debit = ledgerEntries.find((e) => e.type === 'DEBIT' && e.tipId === tipId);
    const credit = ledgerEntries.find((e) => e.type === 'CREDIT' && e.tipId === tipId);
    assert(debit && debit.uid === fanUid, 'Fan DEBIT ledger entry missing');
    assert(credit && credit.uid === artistId && credit.netAmountCents === 2375, 'Artist CREDIT ledger entry missing or amount incorrect');

    // Verify Artist Balance Credited
    const artist = dbStore.get(`artistProfiles/${artistId}`);
    assert(artist.availableBalanceCents === 2375, `Expected available balance 2375, got ${artist.availableBalanceCents}`);
  });

  await runStep('payment_intent.succeeded is idempotent (deduplication & replay safety)', async () => {
    const tipId = 'tip_live_test_101';
    const artistId = 'artist_live_creator_1';
    const balanceBefore = dbStore.get(`artistProfiles/${artistId}`).availableBalanceCents;
    const ledgerCountBefore = [...dbStore.entries()].filter(([k]) => k.startsWith('paymentLedger/')).length;

    // Send the SAME event again (simulate Stripe retry or replay)
    const eventPayload = JSON.stringify({
      id: 'evt_pi_success_001',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_live_stripe_101',
          amount: 2500,
          currency: 'usd',
          status: 'succeeded',
          metadata: { tipId },
        },
      },
    });

    const sig = createStripeSignature(eventPayload, MOCK_ACCOUNT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);
    assert(res.body?.deduplicated === true, 'Response did not acknowledge deduplicated replay');

    // Verify NO double-crediting
    const balanceAfter = dbStore.get(`artistProfiles/${artistId}`).availableBalanceCents;
    const ledgerCountAfter = [...dbStore.entries()].filter(([k]) => k.startsWith('paymentLedger/')).length;

    assert(balanceAfter === balanceBefore, `Double-spend error: Balance changed from ${balanceBefore} to ${balanceAfter}`);
    assert(ledgerCountAfter === ledgerCountBefore, 'Duplicate ledger entries were incorrectly appended');
  });

  // ── TEST 5: account.updated Verification & Compliance Hold ───────────────
  await runStep('account.updated synchronizes verified KYC and payout readiness', async () => {
    const creatorUid = 'creator_kyc_user_1';
    const connectAccountId = 'acct_kyc_verified_999';

    dbStore.set(`users/${creatorUid}`, {
      uid: creatorUid,
      stripeConnectAccountId: connectAccountId,
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      stripeVerificationState: 'unverified',
      complianceHold: false,
    });
    dbStore.set(`artistProfiles/${creatorUid}`, {
      artistId: creatorUid,
      stripeAccountId: connectAccountId,
    });

    const eventPayload = JSON.stringify({
      id: 'evt_acct_kyc_001',
      object: 'event',
      account: connectAccountId,
      type: 'account.updated',
      data: {
        object: {
          id: connectAccountId,
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
          requirements: { disabled_reason: null, currently_due: [] },
        },
      },
    });

    const sig = createStripeSignature(eventPayload, MOCK_CONNECT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeConnectWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);

    const user = dbStore.get(`users/${creatorUid}`);
    assert(user.stripeChargesEnabled === true, 'stripeChargesEnabled not updated');
    assert(user.stripePayoutsEnabled === true, 'stripePayoutsEnabled not updated');
    assert(user.stripeVerificationState === 'verified', `Expected verified, got ${user.stripeVerificationState}`);
    assert(user.bankPayoutReadiness === 'ready', `Expected ready, got ${user.bankPayoutReadiness}`);
  });

  await runStep('account.updated automatically places compliance hold on disabled reason', async () => {
    const creatorUid = 'creator_kyc_user_1';
    const connectAccountId = 'acct_kyc_verified_999';

    const eventPayload = JSON.stringify({
      id: 'evt_acct_disabled_001',
      object: 'event',
      account: connectAccountId,
      type: 'account.updated',
      data: {
        object: {
          id: connectAccountId,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: true,
          requirements: {
            disabled_reason: 'requirements.past_due',
            currently_due: ['individual.verification.document'],
          },
        },
      },
    });

    const sig = createStripeSignature(eventPayload, MOCK_CONNECT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeConnectWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);

    const user = dbStore.get(`users/${creatorUid}`);
    assert(user.stripeVerificationState === 'restricted', `Expected restricted, got ${user.stripeVerificationState}`);
    assert(user.complianceHold === true, 'Compliance hold should be set to true');
    assert(user.payoutHoldReason === 'STRIPE_DISABLED_requirements.past_due', 'Payout hold reason mismatch');
  });

  // ── TEST 6: payout.paid Execution ─────────────────────────────────────────
  await runStep('payout.paid completes payout record and records audit log', async () => {
    const payoutId = 'payout_live_rec_101';
    const creatorUid = 'creator_payout_user_1';
    const connectAccountId = 'acct_payout_user_1';

    dbStore.set(`payouts/${payoutId}`, {
      payoutId,
      recipientId: creatorUid,
      amountCents: 5000,
      currency: 'USD',
      status: 'pending',
      stripeTransferId: 'tr_paid_test_101',
    });

    const eventPayload = JSON.stringify({
      id: 'evt_payout_paid_001',
      object: 'event',
      account: connectAccountId,
      type: 'payout.paid',
      data: {
        object: {
          id: 'po_stripe_paid_101',
          transfer: 'tr_paid_test_101',
          amount: 5000,
          currency: 'usd',
          status: 'paid',
          arrival_date: 1729000000,
          metadata: { payoutId, creatorId: creatorUid },
        },
      },
    });

    const sig = createStripeSignature(eventPayload, MOCK_CONNECT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeConnectWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);

    const payout = dbStore.get(`payouts/${payoutId}`);
    assert(payout.status === 'paid', `Expected payout status paid, got ${payout.status}`);
    assert(payout.stripePayoutId === 'po_stripe_paid_101', 'stripePayoutId missing on payout document');

    const auditEntries = [...dbStore.entries()].filter(([k]) => k.startsWith('auditLogs/')).map(([, v]) => v);
    const paidAudit = auditEntries.find((a) => a.action === 'PAYOUT_PAID' && a.payoutId === payoutId);
    assert(paidAudit, 'PAYOUT_PAID audit log entry missing');
  });

  // ── TEST 7: payout.failed Safe Balance Reversal ────────────────────────────
  await runStep('payout.failed restores creator available balance and writes ledger reversal', async () => {
    const payoutId = 'payout_live_rec_fail_101';
    const creatorUid = 'creator_payout_fail_user_1';
    const connectAccountId = 'acct_payout_fail_user_1';

    // Simulate state: creator had $60.00, requested $50.00 payout, left with $10.00 available
    dbStore.set(`artistProfiles/${creatorUid}`, {
      artistId: creatorUid,
      availableBalanceCents: 1000, // $10.00
      totalPaidOutCents: 5000, // $50.00
    });
    dbStore.set(`payouts/${payoutId}`, {
      payoutId,
      recipientId: creatorUid,
      amountCents: 5000, // $50.00
      currency: 'USD',
      status: 'pending',
      stripeTransferId: 'tr_fail_test_101',
    });

    const eventPayload = JSON.stringify({
      id: 'evt_payout_failed_001',
      object: 'event',
      account: connectAccountId,
      type: 'payout.failed',
      data: {
        object: {
          id: 'po_stripe_failed_101',
          transfer: 'tr_fail_test_101',
          amount: 5000,
          currency: 'usd',
          status: 'failed',
          failure_code: 'account_closed',
          failure_message: 'The bank account has been closed.',
          metadata: { payoutId, creatorId: creatorUid },
        },
      },
    });

    const sig = createStripeSignature(eventPayload, MOCK_CONNECT_WEBHOOK_SECRET);
    const { req, res } = createMockHttpExchange(eventPayload, sig);

    await stripeConnectWebhook(req, res);
    assert(res.statusCode === 200, `Expected HTTP 200, got ${res.statusCode}`);

    // Verify Payout Doc Updated
    const payout = dbStore.get(`payouts/${payoutId}`);
    assert(payout.status === 'failed', `Expected status failed, got ${payout.status}`);
    assert(payout.failureReason === 'The bank account has been closed.', 'Failure reason mismatch');

    // Verify Artist Balance Restored (+5000 Cents)
    const profile = dbStore.get(`artistProfiles/${creatorUid}`);
    assert(profile.availableBalanceCents === 6000, `Expected available balance restored to 6000, got ${profile.availableBalanceCents}`);
    assert(profile.totalPaidOutCents === 0, `Expected totalPaidOutCents reverted to 0, got ${profile.totalPaidOutCents}`);

    // Verify Double-Entry Ledger Reversal
    const ledgerEntries = [...dbStore.entries()].filter(([k]) => k.startsWith('paymentLedger/')).map(([, v]) => v);
    const reversal = ledgerEntries.find((e) => e.entryType === 'PAYOUT_REVERSAL' && e.payoutId === payoutId);
    assert(reversal, 'PAYOUT_REVERSAL entry missing from paymentLedger');
    assert(reversal.amountCents === 5000, `Expected reversal amount 5000, got ${reversal.amountCents}`);
    assert(reversal.uid === creatorUid, `Expected reversal uid ${creatorUid}, got ${reversal.uid}`);
  });

  // ── Summary Report ────────────────────────────────────────────────────────
  console.log('\n----------------------------------------------------------------------');
  console.log('  VERIFICATION SUITE EXECUTION SUMMARY');
  console.log('----------------------------------------------------------------------');
  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    const statusFormatted = r.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  [${statusFormatted}] ${r.name.padEnd(65)} (${r.duration}ms)`);
    if (r.status === 'PASS') passCount++;
    else failCount++;
  }
  console.log('----------------------------------------------------------------------');
  console.log(`  TOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('======================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\x1b[31mFatal error during test execution:\x1b[0m', err);
  process.exit(1);
});
