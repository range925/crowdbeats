/**
 * Crowdbeats V2 — Social Safety, Block & Restriction Callables
 *
 * Implements hard bidirectional block boundaries, quiet zero-awareness restrictions,
 * atomic follow revocation cascades, and conversation locking.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import type {
  BlockEntityRequest,
  BlockEntityResponse,
  UnblockEntityRequest,
  UnblockEntityResponse,
  RestrictEntityRequest,
  RestrictEntityResponse,
  UnrestrictEntityRequest,
  UnrestrictEntityResponse,
  ListBlockedEntitiesResponse,
  ListRestrictedEntitiesResponse,
  SocialEntityType,
} from '@crowdbeats/contracts';
import {
  db,
  verifySocialOperator,
  getDeterministicConversationId,
  fetchProfileSummary,
} from './helpers.js';

function getEntityDocRef(entityId: string, entityType: SocialEntityType): admin.firestore.DocumentReference {
  switch (entityType) {
    case 'band':
      return db().collection('bands').doc(entityId);
    case 'artist':
      return db().collection('artistProfiles').doc(entityId);
    case 'fan':
    default:
      return db().collection('users').doc(entityId);
  }
}

/**
 * blockEntity — Enforces hard bidirectional block boundary with atomic follow edge cleanup.
 */
export const blockEntity = onCall<BlockEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<BlockEntityResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { targetId, targetType, actingAsBandId, actingAsArtistId, reason } = request.data ?? {};

    if (!targetId || typeof targetId !== 'string' || !targetType) {
      throw new HttpsError('invalid-argument', 'targetId and targetType are required.');
    }

    const callerEntity = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      true, // requireAdmin
      actingAsArtistId,
    );
    const blockerId = callerEntity.entityId;
    const blockerType = callerEntity.entityType;

    if (blockerId === targetId || uid === targetId) {
      throw new HttpsError('invalid-argument', 'You cannot block yourself.');
    }

    const blockId = `${blockerId}_${targetId}`;
    const blockRef = db().collection('socialBlocks').doc(blockId);

    // Support both primary entity ID and UID aliases
    const blockerIds = [blockerId];
    if (blockerId !== uid) blockerIds.push(uid);

    await db().runTransaction(async (transaction) => {
      // 1. Write block record
      transaction.set(blockRef, {
        blockId,
        blockerId,
        blockerType,
        blockedId: targetId,
        blockedType: targetType,
        operatorUid: uid,
        reason: reason || 'USER_BLOCKED',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Cascade cleanup follow edges across aliases
      for (const bId of blockerIds) {
        const followForwardRef = db().collection('follows').doc(`${bId}_${targetId}`);
        const forwardSnap = await transaction.get(followForwardRef);
        if (forwardSnap.exists) {
          transaction.delete(followForwardRef);
          const blockerRef = getEntityDocRef(bId, blockerType);
          const targetRef = getEntityDocRef(targetId, targetType);
          transaction.update(blockerRef, { followingCount: admin.firestore.FieldValue.increment(-1) });
          transaction.update(targetRef, { followerCount: admin.firestore.FieldValue.increment(-1) });
        }

        const followBackwardRef = db().collection('follows').doc(`${targetId}_${bId}`);
        const backwardSnap = await transaction.get(followBackwardRef);
        if (backwardSnap.exists) {
          transaction.delete(followBackwardRef);
          const blockerRef = getEntityDocRef(bId, blockerType);
          const targetRef = getEntityDocRef(targetId, targetType);
          transaction.update(targetRef, { followingCount: admin.firestore.FieldValue.increment(-1) });
          transaction.update(blockerRef, { followerCount: admin.firestore.FieldValue.increment(-1) });
        }

        // 3. Lock existing conversations
        const convId = getDeterministicConversationId(bId, targetId);
        const convRef = db().collection('conversations').doc(convId);
        const convSnap = await transaction.get(convRef);
        if (convSnap.exists) {
          transaction.update(convRef, {
            status: 'blocked',
            blockedBy: blockerId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    });

    return { ok: true, isBlocked: true };
  },
);

/**
 * unblockEntity — Lifts block boundary. Invariant: follows are NEVER automatically restored.
 */
export const unblockEntity = onCall<UnblockEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<UnblockEntityResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { targetId, actingAsBandId, actingAsArtistId } = request.data ?? {};

    if (!targetId || typeof targetId !== 'string') {
      throw new HttpsError('invalid-argument', 'targetId is required.');
    }

    const callerEntity = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      true,
      actingAsArtistId,
    );
    const blockerId = callerEntity.entityId;

    const blockerIds = [blockerId];
    if (blockerId !== uid) blockerIds.push(uid);

    await db().runTransaction(async (transaction) => {
      for (const bId of blockerIds) {
        const blockRef = db().collection('socialBlocks').doc(`${bId}_${targetId}`);
        const blockSnap = await transaction.get(blockRef);
        if (blockSnap.exists) {
          transaction.delete(blockRef);
        }

        const convId = getDeterministicConversationId(bId, targetId);
        const convRef = db().collection('conversations').doc(convId);
        const convSnap = await transaction.get(convRef);
        if (convSnap.exists && (convSnap.data()?.blockedBy === bId || convSnap.data()?.blockedBy === uid)) {
          transaction.update(convRef, {
            status: 'accepted',
            blockedBy: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    });

    return { ok: true, isBlocked: false };
  },
);

/**
 * restrictEntity — Applies quiet restriction boundary (zero awareness, stealth routing).
 */
export const restrictEntity = onCall<RestrictEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<RestrictEntityResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { targetId, targetType, actingAsBandId, actingAsArtistId } = request.data ?? {};

    if (!targetId || typeof targetId !== 'string' || !targetType) {
      throw new HttpsError('invalid-argument', 'targetId and targetType are required.');
    }

    const callerEntity = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      true,
      actingAsArtistId,
    );
    const restricterId = callerEntity.entityId;
    const restricterType = callerEntity.entityType;

    if (restricterId === targetId || uid === targetId) {
      throw new HttpsError('invalid-argument', 'You cannot restrict yourself.');
    }

    const restrictionId = `${restricterId}_${targetId}`;
    const restrictRef = db().collection('socialRestrictions').doc(restrictionId);

    await restrictRef.set({
      restrictionId,
      restricterId,
      restricterType,
      restrictedId: targetId,
      restrictedType: targetType,
      operatorUid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true, isRestricted: true };
  },
);

/**
 * unrestrictEntity — Removes quiet restriction boundary.
 */
export const unrestrictEntity = onCall<UnrestrictEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<UnrestrictEntityResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { targetId, actingAsBandId, actingAsArtistId } = request.data ?? {};

    if (!targetId || typeof targetId !== 'string') {
      throw new HttpsError('invalid-argument', 'targetId is required.');
    }

    const callerEntity = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      true,
      actingAsArtistId,
    );
    const restricterId = callerEntity.entityId;

    const blockerIds = [restricterId];
    if (restricterId !== uid) blockerIds.push(uid);

    for (const rId of blockerIds) {
      const restrictionId = `${rId}_${targetId}`;
      await db().collection('socialRestrictions').doc(restrictionId).delete();
    }

    return { ok: true, isRestricted: false };
  },
);

/**
 * listBlockedEntities — Lists entities blocked by the caller or active band.
 */
export const listBlockedEntities = onCall<{ actingAsBandId?: string }>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ListBlockedEntitiesResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { actingAsBandId } = request.data ?? {};

    const callerEntity = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : 'fan',
      actingAsBandId,
      true,
    );

    const snapshot = await db()
      .collection('socialBlocks')
      .where('blockerId', '==', callerEntity.entityId)
      .orderBy('createdAt', 'desc')
      .get();

    const items = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        return fetchProfileSummary(data.blockedId, data.blockedType, callerEntity.entityId);
      }),
    );

    return { items };
  },
);

/**
 * listRestrictedEntities — Lists entities restricted by the caller or active band.
 */
export const listRestrictedEntities = onCall<{ actingAsBandId?: string }>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ListRestrictedEntitiesResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { actingAsBandId } = request.data ?? {};

    const callerEntity = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : 'fan',
      actingAsBandId,
      true,
    );

    const snapshot = await db()
      .collection('socialRestrictions')
      .where('restricterId', '==', callerEntity.entityId)
      .orderBy('createdAt', 'desc')
      .get();

    const items = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        return fetchProfileSummary(data.restrictedId, data.restrictedType, callerEntity.entityId);
      }),
    );

    return { items };
  },
);
