/**
 * Crowdbeats V2 — Session Helpers & Shared Logic (Phase 6)
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import type { LocationAuditEvent, LocationAuditAction } from '@crowdbeats/contracts';
import { logger } from '../lib/logger.js';

if (admin.apps.length === 0) admin.initializeApp();

export function getFirestoreDb(): admin.firestore.Firestore {
  return admin.firestore();
}

/**
 * Great-circle distance between two WGS84 points in meters.
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Validate that caller is authorized to act on behalf of the given profile.
 * - Solo: caller must be profileId, and not suspended/banned.
 * - Band: caller must be an active member of the band with check-in permissions.
 */
export async function validatePerformerAuthorization(
  db: admin.firestore.Firestore,
  callerUid: string,
  profileId: string,
  role: 'artist' | 'band',
): Promise<{ performerName: string; performerType: 'artist' | 'band' }> {
  if (role === 'artist') {
    if (callerUid !== profileId) {
      throw new HttpsError(
        'permission-denied',
        'You can only start sessions or check-ins for your own artist profile.',
      );
    }
    const userDoc = await db.collection('users').doc(callerUid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found.');
    }
    const ud = userDoc.data()!;
    if (ud['isBanned'] === true || ud['isSuspended'] === true || ud['status'] === 'suspended') {
      throw new HttpsError('permission-denied', 'Account is suspended or banned.');
    }
    const performerName = (ud['displayName'] as string) || 'Artist';
    return { performerName, performerType: 'artist' };
  } else if (role === 'band') {
    const bandDoc = await db.collection('bands').doc(profileId).get();
    if (!bandDoc.exists) {
      throw new HttpsError('not-found', `Band ${profileId} not found.`);
    }
    const bd = bandDoc.data()!;
    if (bd['isActive'] === false) {
      throw new HttpsError('failed-precondition', 'Band profile is inactive.');
    }
    const memberDoc = await db
      .collection('bands')
      .doc(profileId)
      .collection('members')
      .doc(callerUid)
      .get();
    if (!memberDoc.exists) {
      throw new HttpsError('permission-denied', 'You are not a member of this band.');
    }
    const md = memberDoc.data()!;
    if (md['isActive'] === false) {
      throw new HttpsError('permission-denied', 'Your band membership is inactive.');
    }
    const allowedBandRoles = ['BAND_FOUNDER', 'BAND_ADMIN', 'BAND_MEMBER'];
    if (!allowedBandRoles.includes(md['role'])) {
      throw new HttpsError('permission-denied', 'Band role does not permit check-in or live sessions.');
    }
    const performerName = (bd['name'] as string) || 'Band';
    return { performerName, performerType: 'band' };
  } else {
    throw new HttpsError('invalid-argument', `Invalid role: ${role}`);
  }
}

/**
 * Check if caller is platform staff or admin (general support, compliance, moderation, admin).
 */
export async function isStaffOrAdmin(
  db: admin.firestore.Firestore,
  uid: string,
  token?: Record<string, unknown>,
): Promise<boolean> {
  if (token) {
    if (token['admin'] === true || token['isStaff'] === true) return true;
    const role = token['platformRole'] as string | undefined;
    if (role && [
      'SUPER_ADMIN',
      'EXECUTIVE',
      'TRUST_SAFETY',
      'CONTENT_MODERATOR',
      'COMPLIANCE_OFFICER',
      'CUSTOMER_SUPPORT',
      'DEVELOPER',
    ].includes(role)) {
      return true;
    }
  }
  // Fallback: check staffRecords collection
  const staffSnap = await db.collection('staffRecords').doc(uid).get();
  if (staffSnap.exists && staffSnap.data()?.['isActive'] !== false) {
    return true;
  }
  return false;
}

/**
 * Check if caller has elevated permission to force-end a live session.
 * Phase 11 Invariant: Force-end permission is strictly separated from general support access.
 * General CUSTOMER_SUPPORT and CONTENT_MODERATOR cannot force-end sessions.
 * Permitted elevated roles: SUPER_ADMIN, EXECUTIVE, TRUST_SAFETY, DEVELOPER.
 */
export async function canForceEndSession(
  db: admin.firestore.Firestore,
  uid: string,
  token?: Record<string, unknown>,
): Promise<boolean> {
  const ELEVATED_ROLES = ['SUPER_ADMIN', 'EXECUTIVE', 'TRUST_SAFETY', 'DEVELOPER'];
  if (token) {
    if (token['admin'] === true || token['superadmin'] === true) return true;
    const role = token['platformRole'] as string | undefined;
    if (role && ELEVATED_ROLES.includes(role)) {
      return true;
    }
  }
  // Fallback: check staffRecords collection
  const staffSnap = await db.collection('staffRecords').doc(uid).get();
  if (staffSnap.exists && staffSnap.data()?.['isActive'] !== false) {
    const role = (staffSnap.data()?.['role'] || staffSnap.data()?.['platformRole']) as string | undefined;
    if (role && ELEVATED_ROLES.includes(role)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if two users have blocked each other.
 */
export async function areUsersBlocked(
  db: admin.firestore.Firestore,
  uid1: string,
  uid2: string,
): Promise<boolean> {
  if (uid1 === uid2) return false;
  const [b1, b2] = await Promise.all([
    db.collection('users').doc(uid1).collection('blockedUsers').doc(uid2).get(),
    db.collection('users').doc(uid2).collection('blockedUsers').doc(uid1).get(),
  ]);
  return b1.exists || b2.exists;
}

/**
 * Write an immutable LocationAuditEvent record.
 */
export async function writeLocationAuditEvent(fields: {
  performerId: string;
  sessionId?: string;
  action: LocationAuditAction;
  outcome: 'success' | 'rejected' | 'error';
  rejectionReason?: string;
  coarseGeohash5?: string;
  idempotencyKey?: string;
  correlationId: string;
  platform: 'ios' | 'android' | 'web' | 'server';
}): Promise<void> {
  try {
    const eventId = `lae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const event: LocationAuditEvent = {
      eventId,
      sessionId: fields.sessionId,
      performerId: fields.performerId,
      action: fields.action,
      outcome: fields.outcome,
      rejectionReason: fields.rejectionReason,
      coarseGeohash5: fields.coarseGeohash5,
      idempotencyKey: fields.idempotencyKey,
      correlationId: fields.correlationId,
      createdAt: new Date().toISOString(),
      platform: fields.platform,
      v: 1,
    };
    await getFirestoreDb().collection('locationAuditEvents').doc(eventId).set(event);
  } catch (err) {
    logger.warn('[writeLocationAuditEvent] Audit log write failed', {
      correlationId: fields.correlationId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
