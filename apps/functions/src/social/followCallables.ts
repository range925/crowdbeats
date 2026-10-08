/**
 * Crowdbeats V2 — Social Relationship & Follow Callables
 *
 * Implements universal directed follow relationships across all 9 persona pairs
 * (Fan, Solo Musician, Band), atomic counter updates, follower removal, and pagination.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import type {
  FollowEntityRequest,
  FollowEntityResponse,
  UnfollowEntityRequest,
  UnfollowEntityResponse,
  RemoveFollowerRequest,
  RemoveFollowerResponse,
  GetRelationshipStateRequest,
  ListFollowersRequest,
  ListFollowersResponse,
  ListFollowingRequest,
  ListFollowingResponse,
  SocialEntityType,
} from '@crowdbeats/contracts';
import {
  db,
  verifySocialOperator,
  checkBidirectionalBlock,
  fetchProfileSummary,
  getRelationshipStateBetween,
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
 * followEntity — Creates a directed follow edge between any two supported social entities.
 */
export const followEntity = onCall<FollowEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<FollowEntityResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { targetId, targetType, actingAsBandId } = request.data ?? {};

    if (!targetId || typeof targetId !== 'string' || !targetType) {
      throw new HttpsError('invalid-argument', 'targetId and targetType are required.');
    }

    // 1. Verify acting source entity
    const sourceContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : 'fan',
      actingAsBandId,
    );
    const sourceId = sourceContext.entityId;
    const sourceType = sourceContext.entityType;

    // 2. Prevent self-following
    if (sourceId === targetId) {
      throw new HttpsError('invalid-argument', 'You cannot follow yourself.');
    }

    // 3. Bidirectional block check
    const blockCheck = await checkBidirectionalBlock(sourceId, targetId);
    if (blockCheck.isBlocked) {
      throw new HttpsError('permission-denied', 'Cannot follow this entity due to safety or block settings.');
    }

    // 4. Verify target exists
    const targetRef = getEntityDocRef(targetId, targetType);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
      throw new HttpsError('not-found', `Target entity not found: ${targetId}`);
    }

    const followId = `${sourceId}_${targetId}`;
    const followRef = db().collection('follows').doc(followId);

    // 5. Atomic transaction
    await db().runTransaction(async (transaction) => {
      const followSnap = await transaction.get(followRef);
      if (followSnap.exists) {
        return; // Idempotent: already following
      }

      const sourceRef = getEntityDocRef(sourceId, sourceType);

      transaction.set(followRef, {
        followId,
        sourceId,
        sourceType,
        targetId,
        targetType,
        operatorUid: uid,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // Backwards compatibility legacy fields
        ...(sourceType === 'fan' ? { fanUid: sourceId } : {}),
        ...(targetType === 'artist' ? { artistId: targetId } : {}),
      });

      transaction.update(targetRef, {
        followerCount: admin.firestore.FieldValue.increment(1),
      });

      transaction.update(sourceRef, {
        followingCount: admin.firestore.FieldValue.increment(1),
      });
    });

    const relationshipState = await getRelationshipStateBetween(sourceId, targetId);
    return { ok: true, relationshipState };
  },
);

/**
 * unfollowEntity — Removes an outgoing follow edge and decrements counters atomically.
 */
export const unfollowEntity = onCall<UnfollowEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<UnfollowEntityResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { targetId, targetType, actingAsBandId } = request.data ?? {};

    if (!targetId || typeof targetId !== 'string' || !targetType) {
      throw new HttpsError('invalid-argument', 'targetId and targetType are required.');
    }

    const sourceContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : 'fan',
      actingAsBandId,
    );
    const sourceId = sourceContext.entityId;
    const sourceType = sourceContext.entityType;

    const followId = `${sourceId}_${targetId}`;
    const followRef = db().collection('follows').doc(followId);

    await db().runTransaction(async (transaction) => {
      const followSnap = await transaction.get(followRef);
      if (!followSnap.exists) {
        return; // Idempotent: already not following
      }

      const targetRef = getEntityDocRef(targetId, targetType);
      const sourceRef = getEntityDocRef(sourceId, sourceType);

      transaction.delete(followRef);

      transaction.update(targetRef, {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });

      transaction.update(sourceRef, {
        followingCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    const relationshipState = await getRelationshipStateBetween(sourceId, targetId);
    return { ok: true, relationshipState };
  },
);

/**
 * removeFollower — Allows an entity to quietly remove an incoming follower without blocking them.
 */
export const removeFollower = onCall<RemoveFollowerRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<RemoveFollowerResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { followerId, followerType, actingAsBandId, actingAsArtistId } = request.data ?? {};

    if (!followerId || typeof followerId !== 'string' || !followerType) {
      throw new HttpsError('invalid-argument', 'followerId and followerType are required.');
    }

    // Verify operator as the target entity (who is removing the incoming follower)
    const currentEntity = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      true, // requireAdmin if acting as band
      actingAsArtistId,
    );
    let targetId = currentEntity.entityId;
    let targetType = currentEntity.entityType;

    let followId = `${followerId}_${targetId}`;
    let followRef = db().collection('follows').doc(followId);
    let followSnap = await followRef.get();

    // If direct follow not found, check if follower followed caller's artist profile
    if (!followSnap.exists) {
      const artistSnap = await db().collection('artistProfiles').where('userId', '==', uid).limit(1).get();
      if (!artistSnap.empty) {
        const altId = artistSnap.docs[0].id;
        const altRef = db().collection('follows').doc(`${followerId}_${altId}`);
        const altSnap = await altRef.get();
        if (altSnap.exists) {
          targetId = altId;
          targetType = 'artist';
          followId = `${followerId}_${targetId}`;
          followRef = altRef;
          followSnap = altSnap;
        }
      }
    }

    await db().runTransaction(async (transaction) => {
      const snap = await transaction.get(followRef);
      if (!snap.exists) {
        return; // Already removed
      }

      const followerRef = getEntityDocRef(followerId, followerType);
      const targetRef = getEntityDocRef(targetId, targetType);

      transaction.delete(followRef);

      // Decrement target's follower count
      transaction.update(targetRef, {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });

      // Decrement follower's following count
      transaction.update(followerRef, {
        followingCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    const relationshipState = await getRelationshipStateBetween(targetId, followerId);
    return { ok: true, relationshipState };
  },
);

/**
 * getRelationshipState — Returns the real-time follow, block, and restriction states.
 */
export const getRelationshipState = onCall<GetRelationshipStateRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { targetId, actingAsBandId, actingAsArtistId } = request.data ?? {};

    if (!targetId || typeof targetId !== 'string') {
      throw new HttpsError('invalid-argument', 'targetId is required.');
    }

    const sourceContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      false,
      actingAsArtistId,
    );

    const state = await getRelationshipStateBetween(sourceContext.entityId, targetId);
    return { ok: true, relationshipState: state };
  },
);

/**
 * listFollowers — Returns searchable, paginated followers of an entity with contextual badges.
 */
export const listFollowers = onCall<ListFollowersRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ListFollowersResponse> => {
    const viewerUid = request.auth?.uid;
    const { entityId, limit = 20, startAfter, searchQuery } = request.data ?? {};

    if (!entityId || typeof entityId !== 'string') {
      throw new HttpsError('invalid-argument', 'entityId is required.');
    }

    const pageSize = Math.min(Math.max(1, limit), 50);

    let query = db()
      .collection('follows')
      .where('targetId', '==', entityId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1);

    if (startAfter) {
      const cursorSnap = await db().collection('follows').doc(startAfter).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snapshot = await query.get();
    const hasNext = snapshot.docs.length > pageSize;
    const docs = hasNext ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    const items = await Promise.all(
      docs.map(async (docSnap) => {
        const data = docSnap.data();
        const sourceId = (data.sourceId as string) || (data.fanUid as string);
        const sourceType = (data.sourceType as SocialEntityType) || 'fan';
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined;

        const summary = await fetchProfileSummary(sourceId, sourceType, viewerUid);
        return {
          ...summary,
          followedAt: createdAt,
        };
      }),
    );

    // Optional client search filter
    const filteredItems = searchQuery
      ? items.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.handle && item.handle.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      : items;

    const nextCursor = hasNext && docs.length > 0 ? docs[docs.length - 1].id : undefined;

    return {
      items: filteredItems,
      nextCursor,
      totalCount: items.length,
    };
  },
);

/**
 * listFollowing — Returns searchable, paginated list of accounts an entity follows.
 */
export const listFollowing = onCall<ListFollowingRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ListFollowingResponse> => {
    const viewerUid = request.auth?.uid;
    const { entityId, limit = 20, startAfter, searchQuery } = request.data ?? {};

    if (!entityId || typeof entityId !== 'string') {
      throw new HttpsError('invalid-argument', 'entityId is required.');
    }

    const pageSize = Math.min(Math.max(1, limit), 50);

    let query = db()
      .collection('follows')
      .where('sourceId', '==', entityId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1);

    if (startAfter) {
      const cursorSnap = await db().collection('follows').doc(startAfter).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snapshot = await query.get();
    const hasNext = snapshot.docs.length > pageSize;
    const docs = hasNext ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    const items = await Promise.all(
      docs.map(async (docSnap) => {
        const data = docSnap.data();
        const targetId = (data.targetId as string) || (data.artistId as string);
        const targetType = (data.targetType as SocialEntityType) || 'artist';
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined;

        const summary = await fetchProfileSummary(targetId, targetType, viewerUid);
        return {
          ...summary,
          followedAt: createdAt,
        };
      }),
    );

    const filteredItems = searchQuery
      ? items.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.handle && item.handle.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      : items;

    const nextCursor = hasNext && docs.length > 0 ? docs[docs.length - 1].id : undefined;

    return {
      items: filteredItems,
      nextCursor,
      totalCount: items.length,
    };
  },
);
