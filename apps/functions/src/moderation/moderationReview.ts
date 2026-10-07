/**
 * Crowdbeats V2 — Moderator Review Service & Callable (Phase 5)
 *
 * Provides server-authoritative review actions for Trust & Safety moderators,
 * updating moderation queue items and enforcing content state transitions.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import {
  ModerationState,
  ModerationDecisionAction,
  type ModerationQueueItem,
  type ReviewModerationItemRequest,
} from '@crowdbeats/contracts';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

/**
 * Executes a moderator decision on a queued moderation item.
 */
export async function executeModeratorDecision(
  db: admin.firestore.Firestore,
  moderatorUid: string,
  request: ReviewModerationItemRequest,
): Promise<ModerationQueueItem> {
  const { queueItemId, action, notes } = request;

  const itemRef = db.collection('moderationQueue').doc(queueItemId);
  const itemSnap = await itemRef.get();

  if (!itemSnap.exists) {
    throw new HttpsError('not-found', `Moderation queue item ${queueItemId} not found.`);
  }

  const currentItem = itemSnap.data() as ModerationQueueItem;
  let newState: ModerationState;

  switch (action) {
    case ModerationDecisionAction.APPROVE:
      newState = ModerationState.APPROVED;
      break;
    case ModerationDecisionAction.REJECT:
      newState = ModerationState.REJECTED;
      break;
    case ModerationDecisionAction.QUARANTINE:
      newState = ModerationState.QUARANTINED;
      break;
    case ModerationDecisionAction.ESCALATE:
      newState = ModerationState.ESCALATED;
      break;
    case ModerationDecisionAction.REMOVE:
      newState = ModerationState.REMOVED;
      break;
    default:
      throw new HttpsError('invalid-argument', `Unknown decision action: ${action}`);
  }

  const now = new Date().toISOString();
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  const updatedItem: ModerationQueueItem = {
    ...currentItem,
    state: newState,
    reviewedByUid: moderatorUid,
    reviewNotes: notes || currentItem.reviewNotes,
    updatedAt: now,
    resolvedAt: (newState === ModerationState.APPROVED || newState === ModerationState.REMOVED || newState === ModerationState.REJECTED) ? now : undefined,
  };

  const batch = db.batch();
  batch.update(itemRef, {
    state: newState,
    reviewedByUid: moderatorUid,
    reviewNotes: notes || null,
    updatedAt: now,
    resolvedAt: updatedItem.resolvedAt || null,
    serverUpdatedAt: serverNow,
  });

  // Audit log entry
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: `MODERATION_${action}`,
    actorUid: moderatorUid,
    targetType: 'moderationQueueItem',
    targetId: queueItemId,
    contentId: currentItem.contentId,
    contentType: currentItem.contentType,
    previousState: currentItem.state,
    newState,
    notes: notes || null,
    timestamp: serverNow,
  });

  await batch.commit();
  return updatedItem;
}

export const reviewFlaggedContent = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ModerationQueueItem> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const token = request.auth.token || {};
    const platformRole = token['platformRole'] as string | undefined;
    const isStaff = platformRole === 'SUPER_ADMIN' || platformRole === 'TRUST_SAFETY' || platformRole === 'MODERATOR';

    if (!isStaff) {
      throw new HttpsError('permission-denied', 'Staff moderation role required.');
    }

    const data = request.data as ReviewModerationItemRequest;
    if (!data?.queueItemId || !data?.action) {
      throw new HttpsError('invalid-argument', 'queueItemId and action are required.');
    }

    return await executeModeratorDecision(_db(), request.auth.uid, data);
  },
);
