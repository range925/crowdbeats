/**
 * Crowdbeats V2 — Repeat Offender & Disciplinary Strike Service (Phase 7)
 *
 * Implements deterministic strike calculations, automated monetization holds,
 * account suspensions, and zero-tolerance instant terminations.
 *
 * Compliance Invariants:
 * - Strike 1: Warning + content removal.
 * - Strike 2: 14-day monetization restriction + payout hold.
 * - Strike 3: 30-day suspension + monetization paused.
 * - Strike 4: Permanent platform termination + Stripe payout disconnection.
 * - Zero-tolerance (CSAM/Terrorism/Fraud) bypasses strikes to instant termination.
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import {
  StrikeTier,
  StrikeStatus,
  ModerationRiskCategory,
  type StrikeRecord,
  type RepeatOffenderEvaluation,
  type IssueStrikeRequest,
  type ResolveStrikeRequest,
} from '@crowdbeats/contracts';

const STRIKE_EXPIRATION_DAYS = 365; // 12-month rolling window

/**
 * Evaluates active strikes and current restriction level for a user.
 */
export async function evaluateRepeatOffenderStatus(
  db: admin.firestore.Firestore,
  targetUid: string,
): Promise<RepeatOffenderEvaluation> {
  const now = new Date();
  const strikesSnap = await db
    .collection('strikes')
    .where('targetUid', '==', targetUid)
    .where('status', '==', StrikeStatus.ACTIVE)
    .get();

  const activeStrikes: StrikeRecord[] = [];

  for (const doc of strikesSnap.docs) {
    const strike = doc.data() as StrikeRecord;
    const expiresAtDate = new Date(strike.expiresAt);
    if (expiresAtDate > now) {
      activeStrikes.push(strike);
    }
  }

  // Sort by issuedAt ascending
  activeStrikes.sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

  const activeStrikeCount = activeStrikes.length;
  let currentTier: StrikeTier | null = null;
  let isDemonetized = false;
  let isSuspended = false;
  let isTerminated = false;

  const hasZeroTolerance = activeStrikes.some((s) => s.tier === StrikeTier.ZERO_TOLERANCE_BAN);

  if (hasZeroTolerance || activeStrikeCount >= 4) {
    currentTier = hasZeroTolerance ? StrikeTier.ZERO_TOLERANCE_BAN : StrikeTier.STRIKE_4_TERMINATION;
    isDemonetized = true;
    isSuspended = true;
    isTerminated = true;
  } else if (activeStrikeCount === 3) {
    currentTier = StrikeTier.STRIKE_3_SUSPENSION;
    isDemonetized = true;
    isSuspended = true;
  } else if (activeStrikeCount === 2) {
    currentTier = StrikeTier.STRIKE_2_RESTRICTION;
    isDemonetized = true;
  } else if (activeStrikeCount === 1) {
    currentTier = StrikeTier.STRIKE_1_WARNING;
  }

  const canMonetize = !isDemonetized && !isSuspended && !isTerminated;

  return {
    targetUid,
    activeStrikeCount,
    strikes: activeStrikes,
    currentTier,
    isDemonetized,
    isSuspended,
    isTerminated,
    canMonetize,
    evaluatedAt: now.toISOString(),
  };
}

/**
 * Issues a disciplinary strike to a user with automatic state mutation.
 */
export async function issueStrike(
  db: admin.firestore.Firestore,
  issuedByUid: string,
  request: IssueStrikeRequest,
): Promise<StrikeRecord> {
  const { targetUid, reason, violationCategory, evidenceReportId, evidenceUrl, forceZeroTolerance } = request;

  if (!targetUid || !reason || !violationCategory) {
    throw new Error('targetUid, reason, and violationCategory are required.');
  }

  const now = new Date();
  const nowDateStr = now.toISOString();
  const expiresAt = new Date(now.getTime() + STRIKE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  // Evaluate existing active strikes
  const evalBefore = await evaluateRepeatOffenderStatus(db, targetUid);

  const isZeroTolerance = Boolean(
    forceZeroTolerance ||
    violationCategory === ModerationRiskCategory.CSAM_CSAE ||
    violationCategory === ModerationRiskCategory.VIOLENCE_TERRORISM
  );

  let tier: StrikeTier;
  let strikeNumber: number;

  if (isZeroTolerance) {
    tier = StrikeTier.ZERO_TOLERANCE_BAN;
    strikeNumber = 999;
  } else {
    strikeNumber = evalBefore.activeStrikeCount + 1;
    if (strikeNumber === 1) tier = StrikeTier.STRIKE_1_WARNING;
    else if (strikeNumber === 2) tier = StrikeTier.STRIKE_2_RESTRICTION;
    else if (strikeNumber === 3) tier = StrikeTier.STRIKE_3_SUSPENSION;
    else tier = StrikeTier.STRIKE_4_TERMINATION;
  }

  const strikeId = uuidv4();
  const strike: StrikeRecord = {
    strikeId,
    targetUid,
    strikeNumber,
    tier,
    reason: reason.trim(),
    violationCategory,
    evidenceReportId,
    evidenceUrl,
    issuedByUid,
    issuedAt: nowDateStr,
    expiresAt,
    status: StrikeStatus.ACTIVE,
  };

  const batch = db.batch();

  // 1. Save global strike record
  const strikeRef = db.collection('strikes').doc(strikeId);
  batch.set(strikeRef, {
    ...strike,
    serverCreatedAt: serverNow,
  });

  // 2. Save user-subcollection strike record
  const userStrikeRef = db.collection('users').doc(targetUid).collection('strikes').doc(strikeId);
  batch.set(userStrikeRef, {
    ...strike,
    serverCreatedAt: serverNow,
  });

  // 3. Mutate user & creator profile documents based on new tier
  const userRef = db.collection('users').doc(targetUid);
  const artistRef = db.collection('artistProfiles').doc(targetUid);

  const userUpdates: Record<string, unknown> = {
    activeStrikeCount: strikeNumber,
    lastStrikeTier: tier,
    lastStrikeAt: serverNow,
    updatedAt: serverNow,
  };

  const profileUpdates: Record<string, unknown> = {
    updatedAt: serverNow,
  };

  if (tier === StrikeTier.ZERO_TOLERANCE_BAN || tier === StrikeTier.STRIKE_4_TERMINATION) {
    userUpdates['isSuspended'] = true;
    userUpdates['suspendedAt'] = serverNow;
    userUpdates['suspensionReason'] = `REPEAT_OFFENDER_${tier}`;
    userUpdates['monetizationStatus'] = 'TERMINATED';
    userUpdates['complianceHold'] = true;
    userUpdates['payoutHoldReason'] = 'ACCOUNT_TERMINATED';
    userUpdates['deletedAt'] = serverNow;

    profileUpdates['isActive'] = false;
    profileUpdates['isSuspended'] = true;
    profileUpdates['monetizationStatus'] = 'TERMINATED';
    profileUpdates['complianceHold'] = true;
  } else if (tier === StrikeTier.STRIKE_3_SUSPENSION) {
    userUpdates['isSuspended'] = true;
    userUpdates['suspendedAt'] = serverNow;
    userUpdates['suspensionReason'] = 'STRIKE_3_SUSPENSION';
    userUpdates['monetizationStatus'] = 'DEMONETIZED';
    userUpdates['complianceHold'] = true;
    userUpdates['payoutHoldReason'] = 'STRIKE_3_SUSPENSION';

    profileUpdates['isSuspended'] = true;
    profileUpdates['monetizationStatus'] = 'DEMONETIZED';
    profileUpdates['complianceHold'] = true;
  } else if (tier === StrikeTier.STRIKE_2_RESTRICTION) {
    userUpdates['monetizationStatus'] = 'LIMITED';
    userUpdates['complianceHold'] = true;
    userUpdates['payoutHoldReason'] = 'STRIKE_2_RESTRICTION';

    profileUpdates['monetizationStatus'] = 'LIMITED';
    profileUpdates['complianceHold'] = true;
  }

  batch.update(userRef, userUpdates);
  batch.set(artistRef, profileUpdates, { merge: true });

  // 4. Record Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: `STRIKE_ISSUED_${tier}`,
    actorUid: issuedByUid,
    targetUid,
    strikeId,
    tier,
    strikeNumber,
    violationCategory,
    reason,
    timestamp: serverNow,
  });

  await batch.commit();

  return strike;
}

/**
 * Resolves a strike (e.g. reversed on appeal or manually expired).
 */
export async function resolveStrike(
  db: admin.firestore.Firestore,
  resolvedByUid: string,
  request: ResolveStrikeRequest,
): Promise<void> {
  const { strikeId, resolution, notes } = request;

  const strikeRef = db.collection('strikes').doc(strikeId);
  const strikeSnap = await strikeRef.get();

  if (!strikeSnap.exists) {
    throw new Error(`Strike ${strikeId} not found.`);
  }

  const strike = strikeSnap.data() as StrikeRecord;
  const targetUid = strike.targetUid;
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();

  // 1. Update global strike
  batch.update(strikeRef, {
    status: resolution,
    resolvedByUid,
    resolutionNotes: notes || null,
    resolvedAt: new Date().toISOString(),
    serverUpdatedAt: serverNow,
  });

  // 2. Update user-subcollection strike
  const userStrikeRef = db.collection('users').doc(targetUid).collection('strikes').doc(strikeId);
  batch.update(userStrikeRef, {
    status: resolution,
    resolvedByUid,
    resolutionNotes: notes || null,
    resolvedAt: new Date().toISOString(),
    serverUpdatedAt: serverNow,
  });

  // 3. Recalculate status and restore account if appropriate
  const userRef = db.collection('users').doc(targetUid);
  batch.update(userRef, {
    complianceHold: false,
    payoutHoldReason: null,
    isSuspended: false,
    suspendedAt: null,
    monetizationStatus: 'ACTIVE',
    updatedAt: serverNow,
  });

  // 4. Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: `STRIKE_RESOLVED_${resolution}`,
    actorUid: resolvedByUid,
    targetUid,
    strikeId,
    resolution,
    notes: notes || null,
    timestamp: serverNow,
  });

  await batch.commit();
}
