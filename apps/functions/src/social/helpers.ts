/**
 * Crowdbeats V2 — Social & Messaging Core Helpers
 *
 * Provides authoritative operator verification, multi-entity resolution,
 * bidirectional block evaluation, and quiet restriction lookups.
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import type {
  SocialEntityType,
  SocialProfileSummary,
  BandOperatorRole,
  FollowRelationshipState,
} from '@crowdbeats/contracts';

export const db = () => admin.firestore();

export interface VerifiedEntityContext {
  readonly entityId: string;
  readonly entityType: SocialEntityType;
  readonly operatorUid: string;
  readonly displayName: string;
  readonly handle?: string;
  readonly avatarUrl?: string;
  readonly isVerified?: boolean;
  readonly memberRole?: BandOperatorRole;
}

/**
 * Validates the authenticated caller's authority to act as an entity.
 * Prevents user impersonation and verifies dynamic band membership.
 */
export async function verifySocialOperator(
  authUid: string,
  targetEntityId?: string,
  targetEntityType?: SocialEntityType,
  actingAsBandId?: string,
  requireAdmin = false,
  actingAsArtistId?: string,
): Promise<VerifiedEntityContext> {
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  // 1. Acting on behalf of a Band
  if (actingAsBandId || targetEntityType === 'band') {
    const bandId = actingAsBandId || targetEntityId;
    if (!bandId || typeof bandId !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid band ID is required.');
    }

    const bandDoc = await db().collection('bands').doc(bandId).get();
    if (!bandDoc.exists) {
      throw new HttpsError('not-found', `Band not found: ${bandId}`);
    }
    const bandData = bandDoc.data() ?? {};

    // Check membership: bands/{bandId}/members/{authUid}
    let isPermitted = false;
    let memberRole: BandOperatorRole = 'MEMBER';

    // Check if user is band owner
    if (bandData.ownerUid === authUid || bandData.founderUid === authUid) {
      isPermitted = true;
      memberRole = 'FOUNDER';
    } else {
      const memberDoc = await db()
        .collection('bands')
        .doc(bandId)
        .collection('members')
        .doc(authUid)
        .get();

      if (memberDoc.exists) {
        const mData = memberDoc.data() ?? {};
        if (mData.isActive !== false) {
          const rawRole = (mData.role as string)?.toUpperCase();
          if (rawRole === 'FOUNDER' || rawRole === 'BAND_FOUNDER') {
            memberRole = 'FOUNDER';
            isPermitted = true;
          } else if (rawRole === 'ADMIN' || rawRole === 'BAND_ADMIN') {
            memberRole = 'ADMIN';
            isPermitted = true;
          } else if (rawRole === 'MEMBER' || rawRole === 'BAND_MEMBER') {
            memberRole = 'MEMBER';
            isPermitted = !requireAdmin; // If admin is required, member is not permitted
          }
        }
      }
    }

    if (!isPermitted) {
      throw new HttpsError(
        'permission-denied',
        requireAdmin
          ? 'Only band founders or administrators can perform this safety action.'
          : 'You are not an active authorized member of this band.',
      );
    }

    return {
      entityId: bandId,
      entityType: 'band',
      operatorUid: authUid,
      displayName: (bandData.name as string) || 'Band',
      handle: (bandData.handle as string) || (bandData.slug as string),
      avatarUrl: (bandData.logoUrl as string) || (bandData.imageUrl as string),
      isVerified: Boolean(bandData.isVerified),
      memberRole,
    };
  }

  // 2. Acting as a Solo Musician / Artist explicitly
  if (actingAsArtistId || targetEntityType === 'artist') {
    const artistId = actingAsArtistId || targetEntityId || authUid;
    const artistDoc = await db().collection('artistProfiles').doc(artistId).get();
    if (!artistDoc.exists) {
      throw new HttpsError('not-found', `Artist profile not found: ${artistId}`);
    }
    const artistData = artistDoc.data() ?? {};

    // Verify ownership: artistProfiles doc id is either authUid, or has userId/ownerUid == authUid
    if (artistId !== authUid && artistData.userId !== authUid && artistData.ownerUid !== authUid) {
      throw new HttpsError('permission-denied', 'You cannot act on behalf of another artist profile.');
    }

    return {
      entityId: artistId,
      entityType: 'artist',
      operatorUid: authUid,
      displayName: (artistData.stageName as string) || (artistData.name as string) || 'Artist',
      handle: (artistData.handle as string) || (artistData.slug as string),
      avatarUrl: (artistData.avatarUrl as string) || (artistData.profileImageUrl as string),
      isVerified: Boolean(artistData.isVerified),
    };
  }

  // 3. Fallback: check if user owns an artist profile
  if (targetEntityType !== 'fan') {
    const ownArtistDoc = await db().collection('artistProfiles').doc(authUid).get();
    if (ownArtistDoc.exists) {
      const artistData = ownArtistDoc.data() ?? {};
      return {
        entityId: authUid,
        entityType: 'artist',
        operatorUid: authUid,
        displayName: (artistData.stageName as string) || (artistData.name as string) || 'Artist',
        handle: (artistData.handle as string) || (artistData.slug as string),
        avatarUrl: (artistData.avatarUrl as string) || (artistData.profileImageUrl as string),
        isVerified: Boolean(artistData.isVerified),
      };
    }
    const byUserSnap = await db().collection('artistProfiles').where('userId', '==', authUid).limit(1).get();
    if (!byUserSnap.empty) {
      const aDoc = byUserSnap.docs[0];
      const aData = aDoc.data() ?? {};
      return {
        entityId: aDoc.id,
        entityType: 'artist',
        operatorUid: authUid,
        displayName: (aData.stageName as string) || (aData.name as string) || 'Artist',
        handle: (aData.handle as string) || (aData.slug as string),
        avatarUrl: (aData.avatarUrl as string) || (aData.profileImageUrl as string),
        isVerified: Boolean(aData.isVerified),
      };
    }
  }

  // 4. Default: Acting as a Fan (User)
  const userDoc = await db().collection('users').doc(authUid).get();
  const userData = userDoc.data() ?? {};

  return {
    entityId: authUid,
    entityType: 'fan',
    operatorUid: authUid,
    displayName: (userData.displayName as string) || 'Fan',
    handle: userData.handle as string,
    avatarUrl: (userData.avatarUrl as string) || (userData.photoURL as string),
    isVerified: Boolean(userData.isVerified),
  };
}

/**
 * Checks if a bidirectional block exists between entity A and entity B.
 */
export async function checkBidirectionalBlock(
  entityAId: string,
  entityBId: string,
): Promise<{ isBlocked: boolean; blockedBy?: string }> {
  if (entityAId === entityBId) return { isBlocked: false };

  // 1. Check socialBlocks collection
  const blockAtoBRef = db().collection('socialBlocks').doc(`${entityAId}_${entityBId}`);
  const blockBtoARef = db().collection('socialBlocks').doc(`${entityBId}_${entityAId}`);

  const [snapA, snapB] = await Promise.all([blockAtoBRef.get(), blockBtoARef.get()]);

  if (snapA.exists) {
    return { isBlocked: true, blockedBy: entityAId };
  }
  if (snapB.exists) {
    return { isBlocked: true, blockedBy: entityBId };
  }

  // 2. Check legacy blockedUsers subcollections on users
  const legacyA = await db()
    .collection('users')
    .doc(entityAId)
    .collection('blockedUsers')
    .doc(entityBId)
    .get();

  if (legacyA.exists) {
    return { isBlocked: true, blockedBy: entityAId };
  }

  const legacyB = await db()
    .collection('users')
    .doc(entityBId)
    .collection('blockedUsers')
    .doc(entityAId)
    .get();

  if (legacyB.exists) {
    return { isBlocked: true, blockedBy: entityBId };
  }

  return { isBlocked: false };
}

/**
 * Checks if restricterId has an active restriction on restrictedId.
 */
export async function checkRestriction(
  restricterId: string,
  restrictedId: string,
): Promise<boolean> {
  if (restricterId === restrictedId) return false;
  const snap = await db()
    .collection('socialRestrictions')
    .doc(`${restricterId}_${restrictedId}`)
    .get();
  return snap.exists;
}

/**
 * Generates the canonical deterministic conversation ID for any two entities.
 */
export function getDeterministicConversationId(idA: string, idB: string): string {
  const sorted = [idA, idB].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

/**
 * Resolves full profile summary and relationship badges relative to an optional viewer.
 */
export async function fetchProfileSummary(
  entityId: string,
  entityType: SocialEntityType,
  viewerId?: string,
): Promise<SocialProfileSummary> {
  let name = 'User';
  let handle: string | undefined;
  let avatarUrl: string | undefined;
  let isVerified = false;
  let bio: string | undefined;
  let followerCount = 0;
  let followingCount = 0;

  if (entityType === 'band') {
    const bandDoc = await db().collection('bands').doc(entityId).get();
    if (bandDoc.exists) {
      const data = bandDoc.data() ?? {};
      name = (data.name as string) || 'Band';
      handle = (data.handle as string) || (data.slug as string);
      avatarUrl = (data.logoUrl as string) || (data.imageUrl as string);
      isVerified = Boolean(data.isVerified);
      bio = data.bio as string;
      followerCount = Number(data.followerCount || 0);
      followingCount = Number(data.followingCount || 0);
    }
  } else if (entityType === 'artist') {
    const artistDoc = await db().collection('artistProfiles').doc(entityId).get();
    if (artistDoc.exists) {
      const data = artistDoc.data() ?? {};
      name = (data.stageName as string) || (data.name as string) || 'Artist';
      handle = (data.handle as string) || (data.slug as string);
      avatarUrl = (data.avatarUrl as string) || (data.profileImageUrl as string);
      isVerified = Boolean(data.isVerified);
      bio = data.bio as string;
      followerCount = Number(data.followerCount || 0);
      followingCount = Number(data.followingCount || 0);
    }
  } else {
    const userDoc = await db().collection('users').doc(entityId).get();
    if (userDoc.exists) {
      const data = userDoc.data() ?? {};
      name = (data.displayName as string) || 'Fan';
      handle = data.handle as string;
      avatarUrl = (data.avatarUrl as string) || (data.photoURL as string);
      isVerified = Boolean(data.isVerified);
      bio = data.bio as string;
      followerCount = Number(data.followerCount || 0);
      followingCount = Number(data.followingCount || 0);
    }
  }

  let followsViewer = false;
  let viewerIsFollowing = false;

  if (viewerId && viewerId !== entityId) {
    const [viewerFollowsDoc, entityFollowsDoc] = await Promise.all([
      db().collection('follows').doc(`${viewerId}_${entityId}`).get(),
      db().collection('follows').doc(`${entityId}_${viewerId}`).get(),
    ]);
    viewerIsFollowing = viewerFollowsDoc.exists;
    followsViewer = entityFollowsDoc.exists;
  }

  return {
    id: entityId,
    type: entityType,
    name,
    handle,
    avatarUrl,
    isVerified,
    bio,
    followerCount,
    followingCount,
    followsViewer,
    viewerIsFollowing,
  };
}

/**
 * Computes relationship state between source and target.
 */
export async function getRelationshipStateBetween(
  sourceId: string,
  targetId: string,
): Promise<FollowRelationshipState> {
  const [sourceFollowsTarget, targetFollowsSource, blockCheck, isRestricted] = await Promise.all([
    db().collection('follows').doc(`${sourceId}_${targetId}`).get(),
    db().collection('follows').doc(`${targetId}_${sourceId}`).get(),
    checkBidirectionalBlock(sourceId, targetId),
    checkRestriction(sourceId, targetId),
  ]);

  const isFollowing = sourceFollowsTarget.exists;
  const isFollowedBy = targetFollowsSource.exists;

  return {
    isFollowing,
    isFollowedBy,
    followsYou: isFollowedBy,
    mutualFollow: isFollowing && isFollowedBy,
    isBlocked: blockCheck.isBlocked,
    isRestricted,
  };
}
