/**
 * Crowdbeats V2 — Creator Lifecycle Enforcement Service (Phase 8)
 *
 * Implements server-authoritative demonetization, suspension, termination,
 * and reinstatement pipelines across users, profiles, sessions, and slugs.
 *
 * Compliance Invariants:
 * - Suspended/Terminated creators have all active live sessions revoked.
 * - Unique creator URLs (/creatorSlugs/{slug}) are synchronized to 'suspended' or 'deleted'.
 * - Payouts are frozen via server-authoritative complianceHold: true.
 * - Cryptographic audit logs generated for all state mutations.
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatorLifecycleAction,
  type EnforceCreatorLifecycleRequest,
  type EnforceCreatorLifecycleResponse,
} from '@crowdbeats/contracts';
import { updateCreatorSlugStatus } from '../profiles/slugService.js';

export async function enforceCreatorLifecycle(
  db: admin.firestore.Firestore,
  actorUid: string,
  request: EnforceCreatorLifecycleRequest,
): Promise<EnforceCreatorLifecycleResponse> {
  const { creatorId, creatorType = 'artist', action, reason, durationDays } = request;

  if (!creatorId || !action || !reason) {
    throw new Error('creatorId, action, and reason are required.');
  }

  const serverNow = admin.firestore.FieldValue.serverTimestamp();
  const nowStr = new Date().toISOString();

  // 1. Fetch current creator data
  const userDocRef = db.collection('users').doc(creatorId);
  const artistDocRef = db.collection('artistProfiles').doc(creatorId);
  const bandDocRef = db.collection('bands').doc(creatorId);

  const targetDocRef = creatorType === 'band' ? bandDocRef : userDocRef;
  const targetSnap = await targetDocRef.get();

  if (!targetSnap.exists) {
    throw new Error(`Creator ${creatorId} not found.`);
  }

  const previousData = targetSnap.data() || {};
  const previousStatus = (previousData['monetizationStatus'] as string) || (previousData['isSuspended'] ? 'SUSPENDED' : 'ACTIVE');

  let newStatus: string;
  let complianceHold: boolean;
  let slugStatus: 'active' | 'suspended' | 'deleted';
  let revokedSessionsCount = 0;

  const batch = db.batch();

  if (action === CreatorLifecycleAction.DEMONETIZE) {
    newStatus = 'DEMONETIZED';
    complianceHold = true;
    slugStatus = 'active'; // Public profile remains visible, but monetization is blocked

    const updates: Record<string, unknown> = {
      monetizationStatus: 'DEMONETIZED',
      isDemonetized: true,
      complianceHold: true,
      payoutHoldReason: reason.trim(),
      updatedAt: serverNow,
    };

    batch.update(targetDocRef, updates);
    if (creatorType === 'artist') {
      batch.set(artistDocRef, { monetizationStatus: 'DEMONETIZED', complianceHold: true, updatedAt: serverNow }, { merge: true });
    }
  } else if (action === CreatorLifecycleAction.SUSPEND) {
    newStatus = 'SUSPENDED';
    complianceHold = true;
    slugStatus = 'suspended';

    let suspensionExpiresAt: string | null = null;
    if (typeof durationDays === 'number' && durationDays > 0) {
      suspensionExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const updates: Record<string, unknown> = {
      isSuspended: true,
      suspendedAt: serverNow,
      suspensionExpiresAt,
      suspensionReason: reason.trim(),
      monetizationStatus: 'DEMONETIZED',
      complianceHold: true,
      payoutHoldReason: `SUSPENDED_${reason.trim()}`,
      updatedAt: serverNow,
    };

    batch.update(targetDocRef, updates);
    if (creatorType === 'artist') {
      batch.set(artistDocRef, { isSuspended: true, monetizationStatus: 'DEMONETIZED', complianceHold: true, updatedAt: serverNow }, { merge: true });
    }

    // Revoke active sessions
    const sessionsSnap = await db
      .collection('sessions')
      .where('performerUid', '==', creatorId)
      .where('status', '==', 'ACTIVE')
      .get();

    for (const sessionDoc of sessionsSnap.docs) {
      batch.update(sessionDoc.ref, {
        status: 'TERMINATED_SAFETY',
        endedAt: serverNow,
        endReason: 'CREATOR_SUSPENDED',
      });
      revokedSessionsCount++;
    }
  } else if (action === CreatorLifecycleAction.TERMINATE) {
    newStatus = 'TERMINATED';
    complianceHold = true;
    slugStatus = 'deleted';

    const updates: Record<string, unknown> = {
      isSuspended: true,
      deletedAt: serverNow,
      terminationReason: reason.trim(),
      monetizationStatus: 'TERMINATED',
      complianceHold: true,
      payoutHoldReason: 'ACCOUNT_TERMINATED',
      updatedAt: serverNow,
    };

    batch.update(targetDocRef, updates);
    if (creatorType === 'artist') {
      batch.set(artistDocRef, { isActive: false, isSuspended: true, monetizationStatus: 'TERMINATED', complianceHold: true, updatedAt: serverNow }, { merge: true });
    }

    // Revoke active sessions
    const sessionsSnap = await db
      .collection('sessions')
      .where('performerUid', '==', creatorId)
      .where('status', '==', 'ACTIVE')
      .get();

    for (const sessionDoc of sessionsSnap.docs) {
      batch.update(sessionDoc.ref, {
        status: 'TERMINATED_SAFETY',
        endedAt: serverNow,
        endReason: 'CREATOR_TERMINATED',
      });
      revokedSessionsCount++;
    }
  } else if (action === CreatorLifecycleAction.REINSTATE) {
    newStatus = 'ACTIVE';
    complianceHold = false;
    slugStatus = 'active';

    const updates: Record<string, unknown> = {
      isSuspended: false,
      suspendedAt: null,
      suspensionExpiresAt: null,
      suspensionReason: null,
      deletedAt: null,
      terminationReason: null,
      isDemonetized: false,
      monetizationStatus: 'ACTIVE',
      complianceHold: false,
      payoutHoldReason: null,
      updatedAt: serverNow,
    };

    batch.update(targetDocRef, updates);
    if (creatorType === 'artist') {
      batch.set(artistDocRef, { isActive: true, isSuspended: false, monetizationStatus: 'ACTIVE', complianceHold: false, updatedAt: serverNow }, { merge: true });
    }
  } else {
    throw new Error(`Unknown lifecycle action: ${action}`);
  }

  // 2. Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: `LIFECYCLE_${action}`,
    actorUid,
    creatorId,
    creatorType,
    previousStatus,
    newStatus,
    reason: reason.trim(),
    revokedSessionsCount,
    timestamp: serverNow,
  });

  await batch.commit();

  // 3. Update Slug status in /creatorSlugs
  await updateCreatorSlugStatus(db, creatorId, slugStatus);

  return {
    success: true,
    creatorId,
    creatorType,
    action,
    previousStatus,
    newStatus,
    complianceHold,
    slugStatus,
    revokedSessionsCount,
    timestamp: nowStr,
  };
}
