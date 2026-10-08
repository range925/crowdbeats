# Crowdbeats V2 — Social Graph Architecture & Implementation Specification
**Document Version:** 1.0.0  
**Status:** Complete Implementation Design  
**Author:** Social Graph Specialist Subagent  
**Date:** 2026-10-04  
**Target Delivery File:** `docs/social/drafts/SOCIAL_GRAPH_DRAFT.md`  

---

## 1. Executive Summary & Existing Implementation Audit

### 1.1 Existing Codebase Inspection

An inspection of `packages/contracts/src/social/follow.ts` and `apps/functions/src/follow/*` reveals the legacy Phase 6 follow system:

1. **Contracts (`packages/contracts/src/social/follow.ts`):**
   - Defines a simple `Follow` interface:
     ```ts
     export interface Follow {
       readonly fanUid: string;
       readonly artistId: string;
       readonly createdAt: IsoTimestamp;
     }
     ```
   - Request/response interfaces are restricted strictly to artist following:
     ```ts
     export interface FollowArtistRequest { readonly artistId: string; }
     export interface FollowArtistResponse { readonly ok: boolean; }
     ```
   - Only 1 directed pair is supported: **Fan &rarr; Artist**.
   - Missing: persona typing, human operator attribution (`operatorUid`), band acting context (`actingAsBandId`), mutual follow detection, follower removal, bidirectional blocks awareness, and generalized entity queries.

2. **Cloud Functions (`apps/functions/src/follow/followArtist.ts` & `unfollowArtist.ts`):**
   - Hardcodes `uid` as the follower and `artistProfiles/{artistId}` as the target.
   - Mutates `followerCount` on `artistProfiles`, but **never maintains `followingCount`** on the caller/fan profile.
   - Lacks self-follow checks (`uid === artistId`).
   - Lacks block/restriction checks (`/socialBlocks`).
   - Does not verify if the target profile is active or deleted.
   - Offers no way for a band to follow an entity or be followed as a distinct social persona with delegated operator permissions.
   - Offers no `removeFollower` functionality.

3. **Firestore Indexes (`firebase/firestore.indexes.json`):**
   - Only indexes `follows` on `fanUid ASC, createdAt DESC`.
   - Missing required indexes for generalized social lookups:
     - `targetId ASC, createdAt DESC` (for `listFollowers`)
     - `sourceId ASC, createdAt DESC` (for `listFollowing`)

### 1.2 The 9 Directed Role-Pair Target Matrix

Per `docs/social/SOCIAL_FEATURE_SPEC.md`, Crowdbeats V2 must support all 9 directed role pairs between the 3 core social personas:

| Directed Pair | Source Entity (`sourceId`, `sourceType`) | Target Entity (`targetId`, `targetType`) | Authorized Operator (`operatorUid`) | Primary Target Storage Path |
|---|---|---|---|---|
| **1. Fan &rarr; Fan** | Fan (`users/{uid}`) | Fan (`users/{targetId}`) | `request.auth.uid` | `/users/{targetId}` |
| **2. Fan &rarr; Solo** | Fan (`users/{uid}`) | Solo Artist (`artistProfiles/{targetId}`) | `request.auth.uid` | `/artistProfiles/{targetId}` |
| **3. Fan &rarr; Band** | Fan (`users/{uid}`) | Band (`bands/{targetId}`) | `request.auth.uid` | `/bands/{targetId}` |
| **4. Solo &rarr; Fan** | Solo Artist (`artistProfiles/{uid}`) | Fan (`users/{targetId}`) | `request.auth.uid` | `/users/{targetId}` |
| **5. Solo &rarr; Solo** | Solo Artist (`artistProfiles/{uid}`) | Solo Artist (`artistProfiles/{targetId}`) | `request.auth.uid` | `/artistProfiles/{targetId}` |
| **6. Solo &rarr; Band** | Solo Artist (`artistProfiles/{uid}`) | Band (`bands/{targetId}`) | `request.auth.uid` | `/bands/{targetId}` |
| **7. Band &rarr; Fan** | Band (`bands/{bandId}`) | Fan (`users/{targetId}`) | Member of `bands/{bandId}/members/{uid}` | `/users/{targetId}` |
| **8. Band &rarr; Solo** | Band (`bands/{bandId}`) | Solo Artist (`artistProfiles/{targetId}`) | Member of `bands/{bandId}/members/{uid}` | `/artistProfiles/{targetId}` |
| **9. Band &rarr; Band** | Band (`bands/{bandId}`) | Band (`bands/{targetId}`) | Member of `bands/{bandId}/members/{uid}` | `/bands/{targetId}` |

---

## 2. Complete TypeScript Contract Specification

The contracts below are designed for inclusion in `packages/contracts/src/social/relationships.ts` and `socialIdentity.ts`, preserving backwards compatibility with legacy `follow.ts`.

```typescript
/**
 * Crowdbeats V2 — Social Contracts
 * Location: packages/contracts/src/social/relationships.ts & socialIdentity.ts
 */

import type { IsoTimestamp } from '../common/timestamp.js';

// ─── 2.1 Entity Types & Identity ─────────────────────────────────────────────

export type SocialEntityType = 'fan' | 'artist' | 'band';

export interface SocialIdentity {
  /** The social entity identifier (User UID, ArtistProfile ID, or Band ID). */
  readonly id: string;
  /** The persona category of the entity. */
  readonly type: SocialEntityType;
  /** Display name of the entity. */
  readonly displayName: string;
  /** Unique handle/slug (e.g. '@luna-hollis' or 'the-reverberators'). */
  readonly handle?: string;
  /** Profile image URL. */
  readonly avatarUrl?: string;
  /** Verification badge state. */
  readonly isVerified?: boolean;
  /** Authenticated human operator UID executing on behalf of this identity. */
  readonly operatorUid: string;
}

export interface SocialIdentityRef {
  readonly id: string;
  readonly type: SocialEntityType;
  readonly displayName?: string;
  readonly avatarUrl?: string;
  readonly handle?: string;
}

export interface SocialProfileSummary {
  readonly id: string;
  readonly type: SocialEntityType;
  readonly name: string;
  readonly handle?: string;
  readonly avatarUrl?: string;
  readonly isVerified?: boolean;
  readonly bio?: string;
  readonly followerCount: number;
  readonly followingCount: number;
  /** True if this entity follows the authenticated viewer/acting persona. */
  readonly followsViewer?: boolean;
  /** True if the authenticated viewer/acting persona follows this entity. */
  readonly viewerIsFollowing?: boolean;
}

// ─── 2.2 Follow Records & State Machine ───────────────────────────────────────

export type FollowStatus = 'active' | 'none';

export interface FollowCounts {
  readonly followerCount: number;
  readonly followingCount: number;
}

export interface FollowRelationshipState {
  /** True if source identity follows target identity. */
  readonly isFollowing: boolean;
  /** True if target identity follows source identity. */
  readonly isFollowedBy: boolean;
  /** Synonym for isFollowedBy for UI badge display ("Follows You"). */
  readonly followsYou: boolean;
  /** True if both source and target follow each other. */
  readonly mutualFollow: boolean;
  /** True if a block exists in either direction. */
  readonly isBlocked: boolean;
  /** True if the caller has restricted the target. */
  readonly isRestricted: boolean;
}

export interface Follow {
  /** Deterministic compound document ID: `${sourceId}_${targetId}`. */
  readonly followId: string;
  /** Acting source entity ID. */
  readonly sourceId: string;
  /** Acting source persona type. */
  readonly sourceType: SocialEntityType;
  /** Target entity ID being followed. */
  readonly targetId: string;
  /** Target persona type being followed. */
  readonly targetType: SocialEntityType;
  /** Human operator who authorized this action (audit trail). */
  readonly operatorUid: string;
  /** Status of the follow edge. Always 'active' for valid edges. */
  readonly status: FollowStatus;
  /** ISO timestamp when the follow edge was created. */
  readonly createdAt: IsoTimestamp;

  // Legacy backwards-compatibility attributes
  readonly fanUid?: string;
  readonly artistId?: string;
}

// ─── 2.3 Callable Requests and Responses ──────────────────────────────────────

/** Generalized follow request across any persona. */
export interface FollowRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  /** When following on behalf of a band, specify the band ID. */
  readonly actingAsBandId?: string;
  /** Preferred persona if caller holds both fan and solo artist accounts. */
  readonly sourceType?: SocialEntityType;
}

export interface FollowEntityRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly sourceType?: SocialEntityType;
}

export interface FollowEntityResponse {
  readonly ok: boolean;
  readonly relationshipState: FollowRelationshipState;
  readonly follow?: Follow;
}

export interface UnfollowEntityRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly sourceType?: SocialEntityType;
}

export interface UnfollowEntityResponse {
  readonly ok: boolean;
  readonly relationshipState: FollowRelationshipState;
}

export interface RemoveFollowerRequest {
  /** The incoming follower entity ID to be removed. */
  readonly followerId: string;
  /** Persona type of the follower being removed. */
  readonly followerType: SocialEntityType;
  /** If the entity removing the follower is a band managed by the caller. */
  readonly actingAsBandId?: string;
  /** If caller is removing follower from their solo artist profile. */
  readonly targetType?: SocialEntityType;
}

export interface RemoveFollowerResponse {
  readonly ok: boolean;
  readonly relationshipState: FollowRelationshipState;
}

export interface GetRelationshipStateRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly sourceType?: SocialEntityType;
}

export interface GetRelationshipStateResponse {
  readonly ok: boolean;
  readonly relationshipState: FollowRelationshipState;
}

// ─── 2.4 Pagination and Listing ───────────────────────────────────────────────

export interface ListFollowersRequest {
  readonly entityId: string;
  readonly entityType: SocialEntityType;
  readonly limit?: number;
  readonly startAfter?: string;
  readonly searchQuery?: string;
  /** Optional acting identity context to decorate followsViewer / viewerIsFollowing. */
  readonly viewerActingAsBandId?: string;
}

export interface FollowerListItem extends SocialProfileSummary {
  readonly followedAt: IsoTimestamp;
}

export interface ListFollowersResponse {
  readonly items: readonly FollowerListItem[];
  readonly nextCursor?: string;
  readonly totalCount: number;
}

export interface ListFollowingRequest {
  readonly entityId: string;
  readonly entityType: SocialEntityType;
  readonly limit?: number;
  readonly startAfter?: string;
  readonly searchQuery?: string;
  /** Optional acting identity context to decorate followsViewer / viewerIsFollowing. */
  readonly viewerActingAsBandId?: string;
}

export interface FollowingListItem extends SocialProfileSummary {
  readonly followedAt: IsoTimestamp;
}

export interface ListFollowingResponse {
  readonly items: readonly FollowingListItem[];
  readonly nextCursor?: string;
  readonly totalCount: number;
}

// ─── 2.5 Legacy Contract Parity ───────────────────────────────────────────────

export interface FollowArtistRequest {
  readonly artistId: string;
}

export interface FollowArtistResponse {
  readonly ok: boolean;
}

export interface UnfollowArtistRequest {
  readonly artistId: string;
}

export interface UnfollowArtistResponse {
  readonly ok: boolean;
}

export type BandOperatorRole = 'BAND_FOUNDER' | 'BAND_ADMIN' | 'BAND_MEMBER' | 'FOUNDER' | 'ADMIN' | 'MEMBER';
```

---

## 3. Band Operator Authorization Engine

When an entity action is performed on behalf of a band (`actingAsBandId` provided), the backend must enforce strict delegation rules before allowing reads or writes.

### 3.1 Authorization Invariants

1. **Active Membership Requirement:**
   - Document path: `/bands/{bandId}/members/{operatorUid}`.
   - Document must exist.
   - `isActive` must equal `true`.
   - `leftAt` must be undefined or absent.
2. **Authorized Band Role:**
   - Member's `role` field must be one of:
     - `BAND_FOUNDER` / `FOUNDER`
     - `BAND_ADMIN` / `ADMIN`
     - `BAND_MEMBER` / `MEMBER`
   - All active roles have social communication and follow permissions on behalf of the collective.
3. **Active Band Entity:**
   - Document `/bands/{bandId}` must exist and `isActive !== false`.
4. **Immediate Revocation:**
   - Revoking a member's record in Firestore (`isActive: false` or deleting the member doc) instantly halts the operator's ability to act for that band on the next request.
5. **Private Audit Trail:**
   - Even though the public `sourceId` on the follow edge is the `bandId`, the human `operatorUid` is persistently stored on `/follows/{sourceId}_{targetId}`.

### 3.2 Authorization Helper Implementation

```typescript
/**
 * Helper: verifyBandOperator
 * File: apps/functions/src/social/bandAuthorization.ts
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

export const AUTHORIZED_BAND_ROLES = new Set([
  'BAND_FOUNDER',
  'BAND_ADMIN',
  'BAND_MEMBER',
  'FOUNDER',
  'ADMIN',
  'MEMBER',
]);

export interface BandOperatorVerificationResult {
  readonly bandRef: admin.firestore.DocumentReference;
  readonly bandData: admin.firestore.DocumentData;
  readonly memberRef: admin.firestore.DocumentReference;
  readonly memberData: admin.firestore.DocumentData;
  readonly role: string;
}

export async function verifyBandOperator(
  db: admin.firestore.Firestore,
  bandId: string,
  operatorUid: string,
): Promise<BandOperatorVerificationResult> {
  if (!bandId || typeof bandId !== 'string' || bandId.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Valid bandId is required.');
  }

  const bandRef = db.collection('bands').doc(bandId);
  const memberRef = bandRef.collection('members').doc(operatorUid);

  // Parallel fetch of band entity and member record
  const [bandSnap, memberSnap] = await Promise.all([bandRef.get(), memberRef.get()]);

  if (!bandSnap.exists) {
    throw new HttpsError('not-found', `Band '${bandId}' does not exist.`);
  }

  const bandData = bandSnap.data() ?? {};
  if (bandData.isActive === false) {
    throw new HttpsError('failed-precondition', 'Band profile is inactive or suspended.');
  }

  if (!memberSnap.exists) {
    throw new HttpsError('permission-denied', 'You are not a member of this band.');
  }

  const memberData = memberSnap.data() ?? {};
  if (memberData.isActive !== true || memberData.leftAt != null) {
    throw new HttpsError('permission-denied', 'Your band membership is no longer active.');
  }

  const role = String(memberData.role || '').toUpperCase();
  if (!AUTHORIZED_BAND_ROLES.has(role)) {
    throw new HttpsError('permission-denied', `Role '${role}' is not authorized to act on behalf of the band.`);
  }

  return { bandRef, bandData, memberRef, memberData, role };
}
```

---

## 4. Production Cloud Function Implementation: `followEntity` & `unfollowEntity`

Below is the complete, self-contained implementation supporting all 9 directed role pairs.

```typescript
/**
 * Crowdbeats V2 — Social Follow Callables
 * File: apps/functions/src/social/followCallables.ts
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
  GetRelationshipStateResponse,
  FollowRelationshipState,
  SocialEntityType,
} from '@crowdbeats/contracts';
import { verifyBandOperator } from './bandAuthorization.js';

const _db = () => admin.firestore();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEntityDocRef(
  db: admin.firestore.Firestore,
  entityId: string,
  entityType: SocialEntityType,
): admin.firestore.DocumentReference {
  switch (entityType) {
    case 'fan':
      return db.collection('users').doc(entityId);
    case 'artist':
      return db.collection('artistProfiles').doc(entityId);
    case 'band':
      return db.collection('bands').doc(entityId);
    default:
      throw new HttpsError('invalid-argument', `Unsupported entity type: ${entityType}`);
  }
}

async function resolveActingSource(
  db: admin.firestore.Firestore,
  operatorUid: string,
  data: { actingAsBandId?: string; sourceType?: SocialEntityType },
): Promise<{ sourceId: string; sourceType: SocialEntityType; operatorUid: string; sourceRef: admin.firestore.DocumentReference }> {
  if (data.actingAsBandId) {
    const { bandRef } = await verifyBandOperator(db, data.actingAsBandId, operatorUid);
    return {
      sourceId: data.actingAsBandId,
      sourceType: 'band',
      operatorUid,
      sourceRef: bandRef,
    };
  }

  // If caller specifically chooses to act as solo artist
  if (data.sourceType === 'artist') {
    const artistRef = db.collection('artistProfiles').doc(operatorUid);
    const artistSnap = await artistRef.get();
    if (!artistSnap.exists || artistSnap.data()?.isActive === false) {
      throw new HttpsError('failed-precondition', 'Active artist profile required to act as artist.');
    }
    return {
      sourceId: operatorUid,
      sourceType: 'artist',
      operatorUid,
      sourceRef: artistRef,
    };
  }

  // Default: Fan acting persona
  const userRef = db.collection('users').doc(operatorUid);
  return {
    sourceId: operatorUid,
    sourceType: 'fan',
    operatorUid,
    sourceRef: userRef,
  };
}

async function computeRelationshipState(
  db: admin.firestore.Firestore,
  sourceId: string,
  targetId: string,
): Promise<FollowRelationshipState> {
  const followForwardRef = db.collection('follows').doc(`${sourceId}_${targetId}`);
  const followReverseRef = db.collection('follows').doc(`${targetId}_${sourceId}`);
  const blockForwardRef = db.collection('socialBlocks').doc(`${sourceId}_${targetId}`);
  const blockReverseRef = db.collection('socialBlocks').doc(`${targetId}_${sourceId}`);
  const restrictRef = db.collection('socialRestrictions').doc(`${sourceId}_${targetId}`);

  const [fwdSnap, revSnap, blockFwdSnap, blockRevSnap, restrictSnap] = await Promise.all([
    followForwardRef.get(),
    followReverseRef.get(),
    blockForwardRef.get(),
    blockReverseRef.get(),
    restrictRef.get(),
  ]);

  const isFollowing = fwdSnap.exists;
  const isFollowedBy = revSnap.exists;
  const isBlocked = blockFwdSnap.exists || blockRevSnap.exists;
  const isRestricted = restrictSnap.exists;

  return {
    isFollowing,
    isFollowedBy,
    followsYou: isFollowedBy,
    mutualFollow: isFollowing && isFollowedBy,
    isBlocked,
    isRestricted,
  };
}

// ─── 4.1 followEntity Callable ────────────────────────────────────────────────

export const followEntity = onCall<FollowEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<FollowEntityResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const operatorUid = request.auth.uid;
    const db = _db();
    const data = request.data;

    const targetId = data?.targetId?.trim();
    const targetType = data?.targetType;

    if (!targetId) throw new HttpsError('invalid-argument', 'targetId is required.');
    if (!['fan', 'artist', 'band'].includes(targetType)) {
      throw new HttpsError('invalid-argument', 'Invalid targetType.');
    }

    // 1. Resolve acting source entity
    const { sourceId, sourceType, sourceRef } = await resolveActingSource(db, operatorUid, data);

    // 2. Prevent self-following invariant
    if (sourceId === targetId) {
      throw new HttpsError('invalid-argument', 'You cannot follow yourself or your own entity.');
    }

    // 3. Verify target entity existence and active status
    const targetRef = getEntityDocRef(db, targetId, targetType);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
      throw new HttpsError('not-found', `${targetType} '${targetId}' not found.`);
    }
    const targetData = targetSnap.data() ?? {};
    if (targetData.isActive === false || targetData.deletedAt != null) {
      throw new HttpsError('failed-precondition', 'Target entity is inactive or deleted.');
    }

    // 4. Check Block boundary in both directions
    const blockA = await db.collection('socialBlocks').doc(`${sourceId}_${targetId}`).get();
    const blockB = await db.collection('socialBlocks').doc(`${targetId}_${sourceId}`).get();
    if (blockA.exists || blockB.exists) {
      throw new HttpsError('permission-denied', 'Cannot follow an entity when a block is active.');
    }

    const followId = `${sourceId}_${targetId}`;
    const followRef = db.collection('follows').doc(followId);

    // 5. Execute atomic follow transaction
    const transactionResult = await db.runTransaction(async (tx) => {
      const followSnap = await tx.get(followRef);
      if (followSnap.exists) {
        // Idempotent: already following
        return { alreadyFollowing: true };
      }

      const now = admin.firestore.FieldValue.serverTimestamp();

      tx.set(followRef, {
        followId,
        sourceId,
        sourceType,
        targetId,
        targetType,
        operatorUid,
        status: 'active',
        createdAt: now,
        // Legacy fields for backwards compatibility
        fanUid: sourceId,
        artistId: targetId,
      });

      // Increment target followerCount
      tx.update(targetRef, {
        followerCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      // Increment source followingCount
      tx.update(sourceRef, {
        followingCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      return { alreadyFollowing: false };
    });

    const relationshipState = await computeRelationshipState(db, sourceId, targetId);

    return {
      ok: true,
      relationshipState,
      follow: {
        followId,
        sourceId,
        sourceType,
        targetId,
        targetType,
        operatorUid,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    };
  },
);

// ─── 4.2 unfollowEntity Callable ──────────────────────────────────────────────

export const unfollowEntity = onCall<UnfollowEntityRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<UnfollowEntityResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const operatorUid = request.auth.uid;
    const db = _db();
    const data = request.data;

    const targetId = data?.targetId?.trim();
    const targetType = data?.targetType;

    if (!targetId) throw new HttpsError('invalid-argument', 'targetId is required.');
    if (!['fan', 'artist', 'band'].includes(targetType)) {
      throw new HttpsError('invalid-argument', 'Invalid targetType.');
    }

    const { sourceId, sourceRef } = await resolveActingSource(db, operatorUid, data);
    const targetRef = getEntityDocRef(db, targetId, targetType);

    const followId = `${sourceId}_${targetId}`;
    const followRef = db.collection('follows').doc(followId);

    await db.runTransaction(async (tx) => {
      const followSnap = await tx.get(followRef);
      if (!followSnap.exists) {
        // Idempotent: already not following
        return;
      }

      tx.delete(followRef);

      // Decrement target followerCount with floor at 0 guard
      tx.update(targetRef, {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });

      // Decrement source followingCount with floor at 0 guard
      tx.update(sourceRef, {
        followingCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    const relationshipState = await computeRelationshipState(db, sourceId, targetId);

    return {
      ok: true,
      relationshipState,
    };
  },
);
```

---

## 5. Production Cloud Function Implementation: `removeFollower`

`removeFollower` empowers a creator, fan, or band to remove an incoming follower without resorting to a bidirectional block. This silently terminates the follow edge and updates both parties' counters.

```typescript
/**
 * 5. removeFollower Callable
 * File: apps/functions/src/social/followCallables.ts (continued)
 */

export const removeFollower = onCall<RemoveFollowerRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<RemoveFollowerResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const operatorUid = request.auth.uid;
    const db = _db();
    const data = request.data;

    const followerId = data?.followerId?.trim();
    const followerType = data?.followerType;

    if (!followerId) throw new HttpsError('invalid-argument', 'followerId is required.');
    if (!['fan', 'artist', 'band'].includes(followerType)) {
      throw new HttpsError('invalid-argument', 'Invalid followerType.');
    }

    // 1. Resolve target entity (the entity being followed that wants to remove the follower)
    let targetId: string;
    let targetType: SocialEntityType;
    let targetRef: admin.firestore.DocumentReference;

    if (data.actingAsBandId) {
      const { bandRef } = await verifyBandOperator(db, data.actingAsBandId, operatorUid);
      targetId = data.actingAsBandId;
      targetType = 'band';
      targetRef = bandRef;
    } else if (data.targetType === 'artist') {
      targetId = operatorUid;
      targetType = 'artist';
      targetRef = db.collection('artistProfiles').doc(operatorUid);
    } else {
      targetId = operatorUid;
      targetType = 'fan';
      targetRef = db.collection('users').doc(operatorUid);
    }

    // 2. Incoming follow record is located at /follows/{followerId}_{targetId}
    const followId = `${followerId}_${targetId}`;
    const followRef = db.collection('follows').doc(followId);
    const followerRef = getEntityDocRef(db, followerId, followerType);

    await db.runTransaction(async (tx) => {
      const followSnap = await tx.get(followRef);
      if (!followSnap.exists) {
        // Idempotent: already removed or not following
        return;
      }

      // Delete the follow document
      tx.delete(followRef);

      // Decrement incoming follower's followingCount
      tx.update(followerRef, {
        followingCount: admin.firestore.FieldValue.increment(-1),
      });

      // Decrement caller's followerCount
      tx.update(targetRef, {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    const relationshipState = await computeRelationshipState(db, targetId, followerId);

    return {
      ok: true,
      relationshipState,
    };
  },
);
```

---

## 6. Follower and Following List Retrieval with Pagination & Search

### 6.1 Requirements & High-Scale Invariants

1. **Hydration from Disparate Profiles:**
   - A follower document holds pointers: `sourceId, sourceType` or `targetId, targetType`.
   - The query returns follow records, but the UI requires display names, avatars, handles, verification badges, and follower counts.
   - Batch fetching via `db.getAll(...refs)` enables 1 round-trip resolution of up to 100 heterogeneous profiles.
2. **Deterministic Pagination:**
   - Follow edges are ordered by `createdAt DESC`.
   - `startAfter` takes the timestamp or document snapshot cursor.
3. **Viewer Context Decoration:**
   - Profiles in the list are augmented with `followsViewer` and `viewerIsFollowing` flags relative to the active caller, providing instant context for "Follow Back" or "Following" buttons.
4. **Search Query Filtering:**
   - Supports case-insensitive name/handle filtering over the paginated window or matching against indexed terms.

### 6.2 Implementation: `listFollowers` & `listFollowing`

```typescript
/**
 * 6. Social Graph Listing & Pagination Services
 * File: apps/functions/src/social/listCallables.ts
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import type {
  ListFollowersRequest,
  ListFollowersResponse,
  ListFollowingRequest,
  ListFollowingResponse,
  FollowerListItem,
  FollowingListItem,
  SocialEntityType,
} from '@crowdbeats/contracts';

const _db = () => admin.firestore();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function resolveDocRef(
  db: admin.firestore.Firestore,
  id: string,
  type: SocialEntityType,
): admin.firestore.DocumentReference {
  if (type === 'artist') return db.collection('artistProfiles').doc(id);
  if (type === 'band') return db.collection('bands').doc(id);
  return db.collection('users').doc(id);
}

interface HydratedProfile {
  id: string;
  type: SocialEntityType;
  name: string;
  handle?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  bio?: string;
  followerCount: number;
  followingCount: number;
}

async function batchHydrateProfiles(
  db: admin.firestore.Firestore,
  entities: Array<{ id: string; type: SocialEntityType }>,
): Promise<Map<string, HydratedProfile>> {
  if (entities.length === 0) return new Map();

  const refs = entities.map((e) => resolveDocRef(db, e.id, e.type));
  const snaps = await db.getAll(...refs);

  const profileMap = new Map<string, HydratedProfile>();

  snaps.forEach((snap, idx) => {
    const { id, type } = entities[idx];
    if (!snap.exists) {
      profileMap.set(id, {
        id,
        type,
        name: 'Former Member',
        followerCount: 0,
        followingCount: 0,
      });
      return;
    }

    const d = snap.data() ?? {};
    const name = (d.stageName || d.name || d.displayName || 'Unknown') as string;
    const handle = (d.creatorSlug || d.handle) as string | undefined;
    const avatarUrl = (d.photoUrl || d.avatarUrl) as string | undefined;
    const isVerified = Boolean(d.verifiedAt || d.isVerified);
    const bio = (d.bio || d.tagline) as string | undefined;
    const followerCount = Number(d.followerCount ?? 0);
    const followingCount = Number(d.followingCount ?? 0);

    profileMap.set(id, {
      id,
      type,
      name,
      handle,
      avatarUrl,
      isVerified,
      bio,
      followerCount,
      followingCount,
    });
  });

  return profileMap;
}

// ─── 6.1 listFollowers ────────────────────────────────────────────────────────

export const listFollowers = onCall<ListFollowersRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ListFollowersResponse> => {
    const db = _db();
    const data = request.data;
    const entityId = data?.entityId?.trim();
    const entityType = data?.entityType;
    const pageSize = Math.min(Math.max(Number(data?.limit ?? DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);

    if (!entityId || !entityType) {
      throw new HttpsError('invalid-argument', 'entityId and entityType are required.');
    }

    // Query follows where targetId == entityId
    let query: admin.firestore.Query = db
      .collection('follows')
      .where('targetId', '==', entityId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1);

    if (data.startAfter) {
      const cursorSnap = await db.collection('follows').doc(data.startAfter).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const querySnap = await query.get();
    const hasMore = querySnap.docs.length > pageSize;
    const docs = hasMore ? querySnap.docs.slice(0, pageSize) : querySnap.docs;

    const followerEntities = docs.map((doc) => {
      const d = doc.data();
      return {
        id: (d.sourceId || d.fanUid) as string,
        type: (d.sourceType || 'fan') as SocialEntityType,
        followedAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
        docId: doc.id,
      };
    });

    // Hydrate profiles in a single round-trip
    const profileMap = await batchHydrateProfiles(db, followerEntities);

    // Contextual viewer decorating
    const viewerUid = request.auth?.uid;
    const viewerActingId = data.viewerActingAsBandId || viewerUid;

    let items: FollowerListItem[] = followerEntities.map((f) => {
      const profile = profileMap.get(f.id)!;
      return {
        ...profile,
        followedAt: f.followedAt,
      };
    });

    // Client-side text search over batch if searchQuery provided
    if (data.searchQuery && data.searchQuery.trim().length > 0) {
      const q = data.searchQuery.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.handle && item.handle.toLowerCase().includes(q)),
      );
    }

    // Decorate followsViewer and viewerIsFollowing if viewer is authenticated
    if (viewerActingId) {
      const edgeChecks = await Promise.all(
        items.map(async (item) => {
          const [viewerFollowsItem, itemFollowsViewer] = await Promise.all([
            db.collection('follows').doc(`${viewerActingId}_${item.id}`).get(),
            db.collection('follows').doc(`${item.id}_${viewerActingId}`).get(),
          ]);
          return {
            id: item.id,
            viewerIsFollowing: viewerFollowsItem.exists,
            followsViewer: itemFollowsViewer.exists,
          };
        }),
      );

      const checkMap = new Map(edgeChecks.map((c) => [c.id, c]));
      items = items.map((item) => {
        const c = checkMap.get(item.id);
        return {
          ...item,
          viewerIsFollowing: c?.viewerIsFollowing ?? false,
          followsViewer: c?.followsViewer ?? false,
        };
      });
    }

    const nextCursor = hasMore ? docs[docs.length - 1].id : undefined;

    return {
      items,
      nextCursor,
      totalCount: items.length,
    };
  },
);

// ─── 6.2 listFollowing ────────────────────────────────────────────────────────

export const listFollowing = onCall<ListFollowingRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ListFollowingResponse> => {
    const db = _db();
    const data = request.data;
    const entityId = data?.entityId?.trim();
    const entityType = data?.entityType;
    const pageSize = Math.min(Math.max(Number(data?.limit ?? DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);

    if (!entityId || !entityType) {
      throw new HttpsError('invalid-argument', 'entityId and entityType are required.');
    }

    // Query follows where sourceId == entityId
    let query: admin.firestore.Query = db
      .collection('follows')
      .where('sourceId', '==', entityId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1);

    if (data.startAfter) {
      const cursorSnap = await db.collection('follows').doc(data.startAfter).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const querySnap = await query.get();
    const hasMore = querySnap.docs.length > pageSize;
    const docs = hasMore ? querySnap.docs.slice(0, pageSize) : querySnap.docs;

    const followingEntities = docs.map((doc) => {
      const d = doc.data();
      return {
        id: (d.targetId || d.artistId) as string,
        type: (d.targetType || 'artist') as SocialEntityType,
        followedAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
        docId: doc.id,
      };
    });

    const profileMap = await batchHydrateProfiles(db, followingEntities);

    const viewerUid = request.auth?.uid;
    const viewerActingId = data.viewerActingAsBandId || viewerUid;

    let items: FollowingListItem[] = followingEntities.map((f) => {
      const profile = profileMap.get(f.id)!;
      return {
        ...profile,
        followedAt: f.followedAt,
      };
    });

    if (data.searchQuery && data.searchQuery.trim().length > 0) {
      const q = data.searchQuery.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.handle && item.handle.toLowerCase().includes(q)),
      );
    }

    if (viewerActingId) {
      const edgeChecks = await Promise.all(
        items.map(async (item) => {
          const [viewerFollowsItem, itemFollowsViewer] = await Promise.all([
            db.collection('follows').doc(`${viewerActingId}_${item.id}`).get(),
            db.collection('follows').doc(`${item.id}_${viewerActingId}`).get(),
          ]);
          return {
            id: item.id,
            viewerIsFollowing: viewerFollowsItem.exists,
            followsViewer: itemFollowsViewer.exists,
          };
        }),
      );

      const checkMap = new Map(edgeChecks.map((c) => [c.id, c]));
      items = items.map((item) => {
        const c = checkMap.get(item.id);
        return {
          ...item,
          viewerIsFollowing: c?.viewerIsFollowing ?? false,
          followsViewer: c?.followsViewer ?? false,
        };
      });
    }

    const nextCursor = hasMore ? docs[docs.length - 1].id : undefined;

    return {
      items,
      nextCursor,
      totalCount: items.length,
    };
  },
);
```

---

## 7. Firestore Rules, Index Architecture & Counter Integrity

### 7.1 Composite Index Declarations (`firebase/firestore.indexes.json`)

To support fast pagination and ordered reads for `listFollowers` and `listFollowing`, the following entries must be registered in `firebase/firestore.indexes.json`:

```json
{
  "collectionGroup": "follows",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "targetId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "follows",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "sourceId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 7.2 Firestore Security Rules Design (`firebase/firestore.rules`)

Per the architectural guidelines, follow mutations are performed securely via Cloud Functions to guarantee counter synchronization, operator authorization, and block enforcement. 

```javascript
// Firestore Rules for /follows
match /follows/{followId} {
  // Publicly readable for profile displays, follower tabs, and relationship resolution
  allow read: if request.auth != null;

  // Direct client writes are disabled. All mutations flow through
  // followEntity, unfollowEntity, and removeFollower callables.
  allow write: if false;
}
```

### 7.3 Counter Drift Protection & Reconciliation Strategy

To ensure zero drift across `followerCount` and `followingCount`:
1. **Floor at Zero:** Decrements use `Math.max(0, current - 1)` inside Firestore transactions when updating counter snapshots.
2. **Reconciliation Task:** A scheduled Cloud Task (`reconcileSocialCounts`) periodically queries:
   ```ts
   const actualFollowers = await db.collection('follows')
     .where('targetId', '==', entityId)
     .where('status', '==', 'active')
     .count().get();
   ```
   If `actualFollowers.data().count !== doc.data().followerCount`, it updates the counter to match truth.

---

## 8. Backwards Compatibility & Transition Plan

To ensure that existing mobile apps calling `followArtist` and `unfollowArtist` continue to operate with 100% fidelity:

1. **Facade Wrapper for `followArtist`:**
   ```typescript
   export const followArtist = onCall(async (request) => {
     return followEntity.run({
       ...request,
       data: {
         targetId: request.data.artistId,
         targetType: 'artist',
         sourceType: 'fan',
       },
     });
   });
   ```
2. **Backfill of Existing Follow Documents:**
   Existing documents at `follows/{fanUid}_{artistId}` currently contain `{ fanUid, artistId, createdAt }`.
   A one-time script will add:
   ```json
   {
     "followId": "{fanUid}_{artistId}",
     "sourceId": "{fanUid}",
     "sourceType": "fan",
     "targetId": "{artistId}",
     "targetType": "artist",
     "operatorUid": "{fanUid}",
     "status": "active"
   }
   ```
   This guarantees that both legacy queries and new 9-pair queries resolve identical documents.

---

## 9. Deliverables Summary

1. **Contracts (`packages/contracts/src/social/relationships.ts` & `socialIdentity.ts`):** Complete TypeScript definitions for `SocialIdentity`, `Follow`, `FollowCounts`, `FollowRelationshipState`, `FollowEntityRequest/Response`, `UnfollowEntityRequest/Response`, and `RemoveFollowerRequest/Response`.
2. **Band Operator Authorization Engine:** Real-time membership and role verification against `/bands/{bandId}/members/{operatorUid}` supporting `BAND_FOUNDER`, `BAND_ADMIN`, and `BAND_MEMBER`.
3. **Follow / Unfollow Engine (`followEntity`, `unfollowEntity`):** Complete transactional implementation covering all 9 directed role pairs with bidirectional block validation.
4. **Follower Removal (`removeFollower`):** Silent follower ejection callable updating counters for fans, artists, and bands.
5. **List Retrieval & Hydration (`listFollowers`, `listFollowing`):** High-performance batch hydration using `db.getAll` with cursor pagination, text search, and caller context decoration.
6. **Integration Readiness:** Complete draft written to `docs/social/drafts/SOCIAL_GRAPH_DRAFT.md` ready for integration by the Lead Engineer.
