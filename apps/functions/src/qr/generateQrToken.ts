/**
 * Crowdbeats V2 — generateQrToken (Phase 7)
 *
 * Callable: generateQrToken
 *
 * Generates a server-signed, 90-second HMAC token for performer QR display.
 * Writes a single-use `qrTokens/{tokenId}` sentinel doc — the Fan-side
 * `verifyQrToken` callable marks it used on first scan (anti-replay).
 *
 * Auth: performer roles only (artist, band_member)
 * Returns: { tokenId, sessionId, expiresAtMs, sig }
 *
 * Refresh: client calls again 20 seconds before expiry; the old token doc
 * remains valid until its own expiresAtMs passes (no early invalidation
 * needed — the 90-second window + single-use guard is sufficient).
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

const TOKEN_TTL_MS = 90_000; // 90 seconds
const ALLOWED_TYPES = new Set(['artist', 'band_member']);

function _db() {
  return admin.firestore();
}

function _hmacKey(): string {
  const key = process.env['HMAC_KEY'];
  if (!key) {
    // Dev/emulator fallback — never used in production
    return 'dev-hmac-key-not-for-production-use';
  }
  return key;
}

function _sign(payload: string): string {
  return crypto.createHmac('sha256', _hmacKey()).update(payload).digest('hex');
}

export const generateQrToken = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const sessionId = data['sessionId'] as string | undefined;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    // ── Verify session belongs to this performer and is live ─────────────────
    const sessionSnap = await _db().collection('sessions').doc(sessionId).get();
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const session = sessionSnap.data()!;
    if (session['performerId'] !== uid) {
      throw new HttpsError('permission-denied', 'Session belongs to a different performer.');
    }
    if (session['status'] !== 'live') {
      throw new HttpsError('failed-precondition', 'Session is not live.');
    }

    // ── Check performer type ──────────────────────────────────────────────────
    const performerType = session['performerType'] as string | undefined;
    if (!performerType || !ALLOWED_TYPES.has(performerType)) {
      throw new HttpsError('permission-denied', 'Only artists and band members can generate QR tokens.');
    }

    // ── Generate token ────────────────────────────────────────────────────────
    const tokenId = uuidv4();
    const expiresAtMs = Date.now() + TOKEN_TTL_MS;

    // Payload signed: tokenId + sessionId + expiresAtMs
    const payload = `${tokenId}.${sessionId}.${expiresAtMs}`;
    const sig = _sign(payload);

    // ── Write single-use sentinel to Firestore ────────────────────────────────
    await _db()
      .collection('qrTokens')
      .doc(tokenId)
      .set({
        tokenId,
        sessionId,
        performerId: uid,
        expiresAtMs,
        sig,
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { tokenId, sessionId, expiresAtMs, sig };
  },
);
