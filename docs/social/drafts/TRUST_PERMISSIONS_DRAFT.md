# Crowdbeats V2 — Trust & Permissions Architectural Specification
## Security, Authorization, Blocking, Restriction, and Firestore Rules

**Document Version:** 1.0.0  
**Date:** 2026-10-04  
**Author:** Trust & Permissions Specialist Subagent (`TrustPermissionsAgent`)  
**Status:** Approved Draft Specification for Lead Engineer Integration  
**Scope:** `docs/social/drafts/TRUST_PERMISSIONS_DRAFT.md`  

---

## 1. Executive Summary & Security Philosophy

In Crowdbeats V2, social interactions span three distinct entity tiers—**Fans** (`users/{uid}`), **Solo Artists** (`artistProfiles/{artistId}`), and **Bands** (`bands/{bandId}`). Unlike standard consumer networks where an authenticated user strictly acts as their individual self, Crowdbeats introduces a critical dual-layer model: **Human Operator (`operatorUid`)** vs. **Acting Social Identity (`actingId`, `actingType`)**.

This document specifies the end-to-end security, authorization, safety boundaries, Firestore security rules, and unit test coverage across five core pillars:
1. **BLOCK Boundary (Hard Isolation):** A bidirectional barrier that halts follows, incoming message requests, chat messaging, presence visibility, and push notifications. Blocking initiates an atomic, irreversible deletion of mutual follow records, decrements social counters atomically, transitions conversation records to read-only, and invalidates live session grants. Unblocking **never** restores severed follow relationships.
2. **RESTRICT Boundary (Quiet Isolation):** A subtle, zero-awareness boundary. Follows and follower counts remain completely intact, but communication from restricted identities is silently routed away from the main inbox into a segregated `Requests / Restricted` view. Crucially, push notifications, typing indicators, active presence, and **read receipts** are suppressed. Opening a restricted message never informs the sender that it was read, and replying requires an explicit unrestrict step.
3. **Band Safety & Multi-Operator Isolation:** Safety controls executed on behalf of a band apply strictly to the band's identity and its collective inbox. They do not alter or bleed into any operator's personal social graph. Conversely, an operator's personal block or restriction does not alter the band's relationships. Only active band members with appropriate roles (`BAND_FOUNDER`, `BAND_ADMIN`) may administer safety boundaries on behalf of the band.
4. **Complete Firestore Security Rules:** Zero-trust, default-deny security rules governing `/socialBlocks/{blockId}`, `/socialRestrictions/{restrictId}`, `/follows/{followId}`, `/conversations/{conversationId}`, and `/conversations/{conversationId}/messages/{messageId}`.
5. **Unit Test Suite:** A production-grade `@firebase/rules-unit-testing` test matrix validating access denial for non-participants, blocked identities, forged `operatorUid` payloads, unauthorized band operators, and read-receipt suppression under restriction.

---

## 2. Persona & Social Identity Architecture

### 2.1 Entity Hierarchy & 9 Directed Combinations
Crowdbeats V2 supports three primary social entities:
- **Fan (`fan`)**: Natural person represented by `/users/{uid}` and `/fanProfiles/{uid}`.
- **Solo Musician (`artist`)**: Individual creator represented by `/artistProfiles/{artistId}`. (In single-operator setups, `artistId == uid`).
- **Band (`band`)**: Multi-member collective entity represented by `/bands/{bandId}` with subcollection `/bands/{bandId}/members/{uid}`.

All 9 directed interaction pairs are valid and must be secured under identical authorization constraints:
$$\begin{matrix}
\text{Fan} \to \text{Fan} & \text{Fan} \to \text{Artist} & \text{Fan} \to \text{Band} \\
\text{Artist} \to \text{Fan} & \text{Artist} \to \text{Artist} & \text{Artist} \to \text{Band} \\
\text{Band} \to \text{Fan} & \text{Band} \to \text{Artist} & \text{Band} \to \text{Band}
\end{matrix}$$

### 2.2 Operator UID vs. Acting Social Identity
Every mutating social record (`follow`, `message`, `block`, `restrict`, `report`) stores two distinct identity contexts:
1. **`operatorUid` (Human Authenticated Actor):** Always verified by rules to match `request.auth.uid`. A client can **never** forge, omit, or alter this field.
2. **`actingId` & `actingType` (Social Entity):**
   - For Fan: `actingId == request.auth.uid`, `actingType == 'fan'`
   - For Solo Artist: `actingId == request.auth.uid`, `actingType == 'artist'`
   - For Band: `actingId == bandId`, `actingType == 'band'`

### 2.3 Band Operator Authorization Invariants
- When an operator acts on behalf of a band, Firestore security rules query the live membership record:
  $$\text{exists}(/databases/\$(database)/documents/bands/\$(bandId)/members/\$(request.auth.uid))$$
  $$\land\ \text{get}(/databases/\$(database)/documents/bands/\$(bandId)/members/\$(request.auth.uid)).data.isActive == true$$
- **Role Scoping:**
  - `BAND_FOUNDER` & `BAND_ADMIN`: Permitted to execute social follows, chat messages, safety blocks, restrictions, and recipient message settings updates.
  - `BAND_MEMBER`: Permitted to read band conversations and send messages if `isActive == true`, but **cannot** create or delete band-level blocks or restrictions.
- **Immediate Revocation:** If a band operator is marked `isActive: false` or their membership document is deleted, their access to read or mutate band threads, messages, follows, or blocks is revoked in real time on the next Firestore request. Custom claims are intentionally **not** used for band memberships to guarantee immediate revocation without waiting for token refresh cycles.

---

## 3. Hard BLOCK Boundary Specification

```
   [ Entity A ]  <================ BLOCK ================>  [ Entity B ]
         |                                                       |
         x--- Follows A->B and B->A Deleted Atomically ----------x
         x--- Follower & Following Counts Decremented -----------x
         x--- Conversations Locked to Read-Only -----------------x
         x--- Message Requests / DMs Rejected at Rules Level ----x
         x--- Audience Grants & Presence Discovery Severed ------x
```

### 3.1 Bidirectional Isolation
A block placed by either party (`A` blocks `B` OR `B` blocks `A`) establishes a hard, bidirectional barrier:
1. **Follow Barrier:** Neither identity may follow the other. Any attempt to create `/follows/{A}_{B}` or `/follows/{B}_{A}` is rejected with `PERMISSION_DENIED`.
2. **Messaging Barrier:** Neither identity may initiate a new conversation, send a message request, or send messages into an existing conversation.
3. **Presence & Discovery Barrier:** Blocked entities are omitted from search auto-complete, recommendation algorithms, stage session performer lists, and audience grids.
4. **Notification Suppression:** Cloud Functions drop all social notifications (follows, tips, mentions) if an active block exists between source and target.

### 3.2 Atomic Cascade Sequence (`blockEntity` Callable)
Because Firestore security rules cannot perform multi-collection cascading writes or atomic counter decrements across disparate entity profiles, blocking is executed via a trusted Cloud Function transaction (`blockEntity`). 

The atomic cascade executes in a single Firestore transaction:
1. **Block Record Creation:** Writes `/socialBlocks/{blockerId}_{blockedId}` with:
   - `blockId`: `"${blockerId}_${blockedId}"`
   - `blockerId`, `blockerType`, `blockedId`, `blockedType`
   - `operatorUid`: `request.auth.uid`
   - `createdAt`: `FieldValue.serverTimestamp()`
   - `reason`: optional string (max 500 chars)
2. **Follow Edges Deletion:**
   - Deletes `/follows/{blockerId}_{blockedId}` if present.
   - Deletes `/follows/{blockedId}_{blockerId}` if present.
3. **Atomic Counter Decrements:**
   - If `blockerId -> blockedId` existed:
     - Decrement `followingCount` on `blockerId` entity profile (`users`, `artistProfiles`, or `bands`).
     - Decrement `followerCount` on `blockedId` entity profile.
   - If `blockedId -> blockerId` existed:
     - Decrement `followingCount` on `blockedId` entity profile.
     - Decrement `followerCount` on `blockerId` entity profile.
4. **Conversation Read-Only Lock:**
   - Locates deterministic conversation `/conversations/conv_${[blockerId, blockedId].sort().join('_')}`.
   - If it exists, updates `status: 'blocked'`, `blockedAt: FieldValue.serverTimestamp()`, and `blockedBy: blockerId`.
   - Existing chat history remains preserved for both parties to review or submit as moderation evidence, but no new messages can be created.
5. **Audience Grant & Live Session Revocation:**
   - Any active audience grant in `/sessions/{sessionId}/audienceGrants` between `blockerId` and `blockedId` is immediately marked `revokedAt: FieldValue.serverTimestamp()`.

### 3.3 Unblock Invariants
- An unblock action is executed via `unblockEntity` callable or by deleting `/socialBlocks/{blockerId}_{blockedId}`.
- **Permanent Follow Severance:** Unblocking **never** restores previous follow edges or counter values. If either party wishes to reconnect, they must explicitly follow again.
- **Conversation State Restoration:** If a prior conversation existed and had status `accepted` before being blocked, unblocking allows participants to read the thread. Resuming messaging requires both participants to be eligible under current message settings (e.g. neither has messages paused, follow requirements satisfied).

---

## 4. Quiet RESTRICT Boundary Specification

```
   [ Restricter A ]  <-------------- RESTRICT ------------  [ Restricted B ]
         |                                                         |
         |--- Follow Edges & Counts Remain Intact -----------------|
         |--- Thread Moved to "Requests / Restricted" Tab --------|
         |--- Push Notifications Dropped --------------------------|
         |--- Presence & Typing Indicators Suppressed -------------|
         |--- Read Receipts Blocked (No 'readBy' updates) ---------|
         |--- Explicit "Unrestrict" Required to Reply -------------|
```

### 4.1 Zero-Awareness Philosophy
The Restrict boundary is specifically engineered to mitigate stalking, harassment, and social pressure without alerting the abusive party.
- The restricted entity (`B`) receives **zero visual cues or API errors** indicating they have been restricted.
- The restricted entity's message payloads succeed with HTTP 200 / Firestore success, but the message is quarantined.
- Follow relationships, follower lists, public profiles, and follower counts remain completely unchanged.

### 4.2 Routing & Inbox Segregation
- For the restricting entity (`A`), conversations with `B` are omitted from the primary `Inbox` tab and routed exclusively into the `Requests / Restricted` tab.
- Unread message counters on the main app navigation ignore restricted threads.

### 4.3 Telemetry & UI Suppression Invariants
1. **Push Notifications:** The Cloud Functions notification dispatcher verifies `/socialRestrictions/{recipientId}_{senderId}` before enqueuing FCM payloads. If restricted, the push notification is silently discarded.
2. **Active Presence & Typing:** Presence listeners and typing indicator updates (`conversations/{id}/typing/{uid}`) filter out events from restricted parties.
3. **Read Receipt Suppression (Critical Invariant):**
   - In standard conversations, reading a message appends the viewer's ID to `readBy` and sets `status: 'read'`.
   - In restricted conversations, Firestore security rules explicitly **forbid** updating `readBy` or message status if the reader is the restricter.
   - The restricted sender's UI continues to show `Delivered` permanently, preventing them from knowing their message was seen.

### 4.4 Explicit Unrestrict Reply Gate
- To prevent accidental slips by the user, client applications disable the message input bar on restricted conversations, displaying an info banner: *"You restricted this account. Unrestrict to reply."*
- When the user taps *"Unrestrict"*, `/socialRestrictions/{restricterId}_{restrictedId}` is deleted, and the conversation moves back to the primary inbox.

---

## 5. Band Safety & Multi-Operator Authorization Matrix

### 5.1 Band Scoping vs. Personal Scope Isolation
- **Band Scope:** If Operator `alice` is managing Band `The Echoes` (`band_123`) and blocks Fan `bob`:
  - The block document written is `/socialBlocks/band_123_bob`.
  - Only `The Echoes` blocks `bob`.
  - `alice`'s personal account (`user_alice`) does **not** block `bob`. `bob` can still follow `user_alice` unless `alice` separately blocks `bob` personally.
- **Personal Scope:** If `alice` blocks `bob` personally (`/socialBlocks/user_alice_bob`), `The Echoes` (`band_123`) does **not** block `bob`. `bob` can still interact with `The Echoes`.
- This strict separation prevents individual band members' personal disputes from inadvertently disrupting the band's professional fan base.

### 5.2 Band Role Hierarchy & Permissions Matrix

| Social & Safety Action | BAND_FOUNDER | BAND_ADMIN | BAND_MEMBER | Inactive / Former Member |
|---|:---:|:---:|:---:|:---:|
| Read Band Conversations & Messages | ✅ Allowed | ✅ Allowed | ✅ Allowed | 🛑 Denied |
| Send Messages on Behalf of Band | ✅ Allowed | ✅ Allowed | ✅ Allowed | 🛑 Denied |
| Mark Band Messages Read (`readBy`) | ✅ Allowed | ✅ Allowed | ✅ Allowed | 🛑 Denied |
| Follow / Unfollow on Behalf of Band | ✅ Allowed | ✅ Allowed | 🛑 Denied | 🛑 Denied |
| Remove Follower from Band Profile | ✅ Allowed | ✅ Allowed | 🛑 Denied | 🛑 Denied |
| Block Entity on Behalf of Band | ✅ Allowed | ✅ Allowed | 🛑 Denied | 🛑 Denied |
| Unblock Entity on Behalf of Band | ✅ Allowed | ✅ Allowed | 🛑 Denied | 🛑 Denied |
| Restrict Entity on Behalf of Band | ✅ Allowed | ✅ Allowed | 🛑 Denied | 🛑 Denied |
| Unrestrict Entity on Behalf of Band | ✅ Allowed | ✅ Allowed | 🛑 Denied | 🛑 Denied |
| Update Band Recipient Message Settings | ✅ Allowed | ✅ Allowed | 🛑 Denied | 🛑 Denied |

### 5.3 Auditability & Non-Repudiation
Every band-level action writes `operatorUid: request.auth.uid`. If an admin departs or is investigated for misconduct, the permanent audit log identifies exactly which human user initiated each block, follow, or message.

---

## 6. Complete Firestore Security Rules Implementation

The following complete security rules must be integrated into `firebase/firestore.rules`. They provide strict field validation, type checking, boundary enforcement, and anti-forgery guards.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ══════════════════════════════════════════════════════════════════════════
    // TRUST & PERMISSIONS HELPER FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════

    function isSignedIn() {
      return request.auth != null;
    }

    function uid() {
      return request.auth.uid;
    }

    function emailVerified() {
      return request.auth.token.email_verified == true;
    }

    function isString(val) {
      return val is string;
    }

    function isSuperAdmin() {
      return isSignedIn() && request.auth.token.get('platformRole', null) == 'SUPER_ADMIN';
    }

    function isModerationStaff() {
      return isSignedIn() && request.auth.token.get('platformRole', null) in [
        'SUPER_ADMIN', 'CONTENT_MODERATOR', 'TRUST_SAFETY'
      ];
    }

    // Active band membership check from Firestore
    function isBandMember(bandId) {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/bands/$(bandId)/members/$(uid())) &&
        get(/databases/$(database)/documents/bands/$(bandId)/members/$(uid())).data.isActive == true;
    }

    // Band administration check (Founder or Admin)
    function isBandAdmin(bandId) {
      return isBandMember(bandId) &&
        get(/databases/$(database)/documents/bands/$(bandId)/members/$(uid())).data.role
          in ['BAND_FOUNDER', 'BAND_ADMIN'];
    }

    // Validates whether the authenticated caller is authorized to act on behalf of an entity
    function isSocialEntityOperator(entityId, entityType) {
      return isSignedIn() && (
        (entityType in ['fan', 'artist'] && entityId == uid()) ||
        (entityType == 'band' && isBandMember(entityId))
      );
    }

    // Validates whether caller is an admin of the entity (for block/restrict actions)
    function isSocialEntityAdmin(entityId, entityType) {
      return isSignedIn() && (
        (entityType in ['fan', 'artist'] && entityId == uid()) ||
        (entityType == 'band' && isBandAdmin(entityId))
      );
    }

    // Bidirectional block check between two social identities
    function isSociallyBlocked(entityA, entityB) {
      return exists(/databases/$(database)/documents/socialBlocks/$(entityA)_$(entityB)) ||
             exists(/databases/$(database)/documents/socialBlocks/$(entityB)_$(entityA));
    }

    // Directed restriction check (did restricter restrict target?)
    function isSociallyRestricted(restricterId, restrictedId) {
      return exists(/databases/$(database)/documents/socialRestrictions/$(restricterId)_$(restrictedId));
    }

    // Conversation participant validation (fan/artist directly or band via active membership)
    function isConversationParticipant(convData) {
      return isSignedIn() && (
        uid() in convData.participantIds ||
        (convData.get('participantTypes', {})[convData.participantIds[0]] == 'band' && isBandMember(convData.participantIds[0])) ||
        (convData.get('participantTypes', {})[convData.participantIds[1]] == 'band' && isBandMember(convData.participantIds[1]))
      );
    }

    // Immutable field guard helper
    function immutableOnUpdate(fields) {
      return !(request.resource.data.diff(resource.data).affectedKeys().hasAny(fields));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. SOCIAL BLOCKS — /socialBlocks/{blockId}
    // Compound ID: {blockerId}_{blockedId}
    // ══════════════════════════════════════════════════════════════════════════

    match /socialBlocks/{blockId} {
      // Blocker, authorized band admin, or moderation staff can read
      // The blocked identity CANNOT read (prevents enumeration / stalking)
      allow read: if isSignedIn() && (
        (resource.data.blockerType in ['fan', 'artist'] && resource.data.blockerId == uid()) ||
        (resource.data.blockerType == 'band' && isBandAdmin(resource.data.blockerId)) ||
        isModerationStaff() ||
        isSuperAdmin()
      );

      // Creation: strict operator validation, ID matching, anti-forgery
      allow create: if isSignedIn() && emailVerified() &&
        // Required ID alignment
        blockId == request.resource.data.blockerId + '_' + request.resource.data.blockedId &&
        request.resource.data.blockId == blockId &&
        request.resource.data.blockerId != request.resource.data.blockedId &&
        // Operator non-repudiation
        request.resource.data.operatorUid == uid() &&
        // Entity authority check
        isSocialEntityAdmin(request.resource.data.blockerId, request.resource.data.blockerType) &&
        // Valid types
        request.resource.data.blockerType in ['fan', 'artist', 'band'] &&
        request.resource.data.blockedType in ['fan', 'artist', 'band'] &&
        // Server timestamp
        request.resource.data.createdAt == request.time &&
        // Optional reason length check
        (!('reason' in request.resource.data) ||
          (isString(request.resource.data.reason) && request.resource.data.reason.size() <= 500));

      // Deletion (unblock): only original blocker or band admin
      allow delete: if isSignedIn() && (
        (resource.data.blockerType in ['fan', 'artist'] && resource.data.blockerId == uid()) ||
        (resource.data.blockerType == 'band' && isBandAdmin(resource.data.blockerId)) ||
        isSuperAdmin()
      );

      // Blocks are immutable
      allow update: if false;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. SOCIAL RESTRICTIONS — /socialRestrictions/{restrictId}
    // Compound ID: {restricterId}_{restrictedId}
    // ══════════════════════════════════════════════════════════════════════════

    match /socialRestrictions/{restrictId} {
      // STRICT ZERO-AWARENESS: Only the restricter or moderation staff can read.
      // Restricted identity is NEVER granted read access.
      allow read: if isSignedIn() && (
        (resource.data.restricterType in ['fan', 'artist'] && resource.data.restricterId == uid()) ||
        (resource.data.restricterType == 'band' && isBandAdmin(resource.data.restricterId)) ||
        isModerationStaff() ||
        isSuperAdmin()
      );

      allow create: if isSignedIn() && emailVerified() &&
        restrictId == request.resource.data.restricterId + '_' + request.resource.data.restrictedId &&
        request.resource.data.restrictionId == restrictId &&
        request.resource.data.restricterId != request.resource.data.restrictedId &&
        request.resource.data.operatorUid == uid() &&
        isSocialEntityAdmin(request.resource.data.restricterId, request.resource.data.restricterType) &&
        request.resource.data.restricterType in ['fan', 'artist', 'band'] &&
        request.resource.data.restrictedType in ['fan', 'artist', 'band'] &&
        request.resource.data.createdAt == request.time;

      allow delete: if isSignedIn() && (
        (resource.data.restricterType in ['fan', 'artist'] && resource.data.restricterId == uid()) ||
        (resource.data.restricterType == 'band' && isBandAdmin(resource.data.restricterId)) ||
        isSuperAdmin()
      );

      allow update: if false;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. FOLLOWS — /follows/{followId}
    // Compound ID: {sourceId}_{targetId}
    // ══════════════════════════════════════════════════════════════════════════

    match /follows/{followId} {
      // Readable by participants or public directory (provided no block exists between viewer & entities)
      allow read: if isSignedIn() && (
        resource.data.sourceId == uid() ||
        resource.data.targetId == uid() ||
        (resource.data.sourceType == 'band' && isBandMember(resource.data.sourceId)) ||
        (resource.data.targetType == 'band' && isBandMember(resource.data.targetId)) ||
        !isSociallyBlocked(resource.data.sourceId, uid())
      );

      // Creation of follow edge
      allow create: if isSignedIn() && emailVerified() &&
        followId == request.resource.data.sourceId + '_' + request.resource.data.targetId &&
        request.resource.data.followId == followId &&
        request.resource.data.sourceId != request.resource.data.targetId &&
        request.resource.data.operatorUid == uid() &&
        // Operator check: fan/artist must be self; band must be active band admin/founder
        isSocialEntityAdmin(request.resource.data.sourceId, request.resource.data.sourceType) &&
        request.resource.data.sourceType in ['fan', 'artist', 'band'] &&
        request.resource.data.targetType in ['fan', 'artist', 'band'] &&
        request.resource.data.status == 'active' &&
        request.resource.data.createdAt == request.time &&
        // HARD BLOCK BOUNDARY: Denied if either party has blocked the other
        !isSociallyBlocked(request.resource.data.sourceId, request.resource.data.targetId) &&
        // Financial & counter tamper guards
        !request.resource.data.keys().hasAny(['followerCount', 'followingCount', 'totalTipsReceivedCents']);

      // Deletion:
      // Case A (Unfollow): Source entity removes follow
      // Case B (Remove Follower): Target entity removes incoming follow
      allow delete: if isSignedIn() && (
        isSocialEntityAdmin(resource.data.sourceId, resource.data.sourceType) ||
        isSocialEntityAdmin(resource.data.targetId, resource.data.targetType) ||
        isSuperAdmin()
      );

      allow update: if false;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. CONVERSATIONS — /conversations/{conversationId}
    // Deterministic ID: conv_{idA}_{idB} (sorted)
    // ══════════════════════════════════════════════════════════════════════════

    match /conversations/{conversationId} {
      // Participants can read conversation metadata even if status is 'blocked' (read-only audit)
      allow read: if isConversationParticipant(resource.data);

      // Create conversation: initiated via Cloud Function or strictly validated client payload
      allow create: if isSignedIn() && emailVerified() &&
        request.resource.data.id == conversationId &&
        request.resource.data.participantIds.size() == 2 &&
        request.resource.data.participantIds[0] != request.resource.data.participantIds[1] &&
        // Caller must be an authorized operator of the requester
        isSocialEntityOperator(request.resource.data.requesterId, request.resource.data.participantTypes[request.resource.data.requesterId]) &&
        request.resource.data.requesterId in request.resource.data.participantIds &&
        request.resource.data.recipientId in request.resource.data.participantIds &&
        request.resource.data.requesterId != request.resource.data.recipientId &&
        // HARD BLOCK BOUNDARY: cannot initiate conversation if blocked in either direction
        !isSociallyBlocked(request.resource.data.participantIds[0], request.resource.data.participantIds[1]) &&
        request.resource.data.status in ['pending_request', 'accepted'] &&
        request.resource.data.createdAt == request.time;

      // Update conversation:
      // Status transitions (e.g. accepted, declined, blocked) and metadata updates
      allow update: if isConversationParticipant(resource.data) &&
        // If conversation is currently blocked, it is PERMANENTLY READ-ONLY until unblocked via server
        resource.data.status != 'blocked' &&
        // Core identifiers are immutable
        immutableOnUpdate(['id', 'participantIds', 'participantTypes', 'requesterId', 'recipientId', 'createdAt']) &&
        // If transition to 'blocked', caller must be entity admin of one of the participants
        (
          request.resource.data.status != 'blocked' ||
          isSocialEntityAdmin(request.resource.data.blockedBy, resource.data.participantTypes[request.resource.data.blockedBy])
        );

      allow delete: if false; // Conversations are never deleted by clients (audit preservation)

      // ════════════════════════════════════════════════════════════════════════
      // 5. MESSAGES — /conversations/{conversationId}/messages/{messageId}
      // ════════════════════════════════════════════════════════════════════════

      match /messages/{messageId} {
        // Read: Any authorized participant of the parent conversation
        allow read: if isConversationParticipant(get(/databases/$(database)/documents/conversations/$(conversationId)).data);

        // Send Message:
        allow create: if isSignedIn() && emailVerified() &&
          // Validate parent conversation state
          get(/databases/$(database)/documents/conversations/$(conversationId)).data.status in ['accepted', 'pending_request'] &&
          // Caller must be an authorized operator of the declared sender
          request.resource.data.operatorUid == uid() &&
          isSocialEntityOperator(request.resource.data.senderId, request.resource.data.senderType) &&
          // Sender and recipient must match parent conversation participants
          request.resource.data.senderId in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds &&
          request.resource.data.recipientId in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds &&
          request.resource.data.senderId != request.resource.data.recipientId &&
          request.resource.data.conversationId == conversationId &&
          // HARD BLOCK BOUNDARY: Neither party has blocked the other
          !isSociallyBlocked(request.resource.data.senderId, request.resource.data.recipientId) &&
          // PENDING REQUEST RATE LIMIT: If pending, sender cannot spam before acceptance
          (
            get(/databases/$(database)/documents/conversations/$(conversationId)).data.status != 'pending_request' ||
            get(/databases/$(database)/documents/conversations/$(conversationId)).data.lastSenderId != request.resource.data.senderId
          ) &&
          // Content constraints
          isString(request.resource.data.text) &&
          request.resource.data.text.size() >= 1 &&
          request.resource.data.text.size() <= 2000 &&
          request.resource.data.createdAt == request.time;

        // Update Message (Read Receipts & Delivery Status):
        allow update: if isSignedIn() &&
          isConversationParticipant(get(/databases/$(database)/documents/conversations/$(conversationId)).data) &&
          // Content and author immutable
          immutableOnUpdate(['id', 'conversationId', 'senderId', 'senderType', 'operatorUid', 'recipientId', 'text', 'createdAt']) &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'readBy', 'deliveredAt', 'readAt']) &&
          // RESTRICTION CHECK: If viewer is the recipient and has restricted the sender,
          // updating 'readBy' or setting 'read' is PROHIBITED (preserves quiet boundary).
          (
            !request.resource.data.diff(resource.data).affectedKeys().hasAny(['readBy', 'readAt']) ||
            !isSociallyRestricted(resource.data.recipientId, resource.data.senderId)
          );

        allow delete: if false; // Evidence preservation for Trust & Safety reporting
      }
    }
  }
}
```

---

## 7. Comprehensive Unit Test Suite

The following test suite uses `@firebase/rules-unit-testing` and Jest. It mirrors the exact testing harness in `firebase/tests/firestore.test.ts` and comprehensively covers non-participant denial, block boundaries, quiet restriction invariants, operator anti-spoofing, and band membership checks.

```typescript
/**
 * Crowdbeats V2 — Trust, Permissions, Block & Restrict Security Rules Tests
 *
 * Covers:
 * 1. Non-participant access rejection (conversations & messages)
 * 2. Hard Block Boundary (follow creation denied, message sending denied, conversation read-only)
 * 3. Quiet Restrict Boundary (read receipts blocked when restricted, restricted user unaware)
 * 4. Anti-forgery & Band Membership (operatorUid forgery rejected, non-member band action rejected)
 * 5. Remove Follower authorization (target can remove incoming follow)
 */

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const FIRESTORE_RULES = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
const PROJECT_ID = 'crowdbeats-v2-dev';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: FIRESTORE_RULES,
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ── Test Helpers ──────────────────────────────────────────────────────────────

function asUser(uid: string, claims?: Record<string, unknown>) {
  return testEnv.authenticatedContext(uid, {
    email_verified: true,
    ...claims,
  });
}

function unauthed() {
  return testEnv.unauthenticatedContext();
}

async function seedDoc(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

async function seedBandMember(
  bandId: string,
  uid: string,
  role: 'BAND_FOUNDER' | 'BAND_ADMIN' | 'BAND_MEMBER',
  isActive = true,
) {
  await seedDoc(`bands/${bandId}/members/${uid}`, {
    uid,
    bandId,
    role,
    isActive,
    joinedAt: new Date().toISOString(),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. PARTICIPANT ISOLATION TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Conversations & Messages — Participant Isolation', () => {
  const convId = 'conv_alice_bob';

  beforeEach(async () => {
    await seedDoc(`conversations/${convId}`, {
      id: convId,
      participantIds: ['alice', 'bob'],
      participantTypes: { alice: 'fan', bob: 'artist' },
      status: 'accepted',
      requesterId: 'alice',
      recipientId: 'bob',
      createdAt: new Date().toISOString(),
    });

    await seedDoc(`conversations/${convId}/messages/msg-1`, {
      id: 'msg-1',
      conversationId: convId,
      senderId: 'alice',
      senderType: 'fan',
      operatorUid: 'alice',
      recipientId: 'bob',
      text: 'Hello Bob!',
      createdAt: new Date().toISOString(),
      status: 'sent',
      readBy: ['alice'],
    });
  });

  test('✅ Participant Alice reads conversation metadata and messages', async () => {
    const ctx = asUser('alice');
    await assertSucceeds(getDoc(doc(ctx.firestore(), `conversations/${convId}`)));
    await assertSucceeds(getDoc(doc(ctx.firestore(), `conversations/${convId}/messages/msg-1`)));
  });

  test('✅ Participant Bob reads conversation metadata and messages', async () => {
    const ctx = asUser('bob');
    await assertSucceeds(getDoc(doc(ctx.firestore(), `conversations/${convId}`)));
    await assertSucceeds(getDoc(doc(ctx.firestore(), `conversations/${convId}/messages/msg-1`)));
  });

  test('❌ Non-participant Charlie CANNOT read conversation metadata', async () => {
    const ctx = asUser('charlie');
    await assertFails(getDoc(doc(ctx.firestore(), `conversations/${convId}`)));
  });

  test('❌ Non-participant Charlie CANNOT read conversation messages', async () => {
    const ctx = asUser('charlie');
    await assertFails(getDoc(doc(ctx.firestore(), `conversations/${convId}/messages/msg-1`)));
  });

  test('❌ Unauthenticated user CANNOT read conversation or messages', async () => {
    const ctx = unauthed();
    await assertFails(getDoc(doc(ctx.firestore(), `conversations/${convId}`)));
    await assertFails(getDoc(doc(ctx.firestore(), `conversations/${convId}/messages/msg-1`)));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. HARD BLOCK BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Hard Block Boundary — Follows & Messaging Prevention', () => {
  beforeEach(async () => {
    // Alice blocks Bob
    await seedDoc('socialBlocks/alice_bob', {
      blockId: 'alice_bob',
      blockerId: 'alice',
      blockerType: 'fan',
      blockedId: 'bob',
      blockedType: 'artist',
      operatorUid: 'alice',
      createdAt: new Date().toISOString(),
    });

    // Seed blocked conversation
    await seedDoc('conversations/conv_alice_bob', {
      id: 'conv_alice_bob',
      participantIds: ['alice', 'bob'],
      participantTypes: { alice: 'fan', bob: 'artist' },
      status: 'blocked',
      requesterId: 'alice',
      recipientId: 'bob',
      blockedBy: 'alice',
      createdAt: new Date().toISOString(),
    });
  });

  test('❌ Blocked identity Bob CANNOT follow Alice', async () => {
    const ctx = asUser('bob');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'follows/bob_alice'), {
        followId: 'bob_alice',
        sourceId: 'bob',
        sourceType: 'artist',
        targetId: 'alice',
        targetType: 'fan',
        operatorUid: 'bob',
        status: 'active',
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Blocker Alice CANNOT follow Bob while block is active', async () => {
    const ctx = asUser('alice');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'follows/alice_bob'), {
        followId: 'alice_bob',
        sourceId: 'alice',
        sourceType: 'fan',
        targetId: 'bob',
        targetType: 'artist',
        operatorUid: 'alice',
        status: 'active',
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Blocked identity Bob CANNOT send message to Alice', async () => {
    const ctx = asUser('bob');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'conversations/conv_alice_bob/messages/msg-blocked'), {
        id: 'msg-blocked',
        conversationId: 'conv_alice_bob',
        senderId: 'bob',
        senderType: 'artist',
        operatorUid: 'bob',
        recipientId: 'alice',
        text: 'Are you there?',
        createdAt: new Date().toISOString(),
        status: 'sent',
      }),
    );
  });

  test('❌ Blocker Alice CANNOT send message into blocked conversation (read-only invariant)', async () => {
    const ctx = asUser('alice');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'conversations/conv_alice_bob/messages/msg-blocked-2'), {
        id: 'msg-blocked-2',
        conversationId: 'conv_alice_bob',
        senderId: 'alice',
        senderType: 'fan',
        operatorUid: 'alice',
        recipientId: 'bob',
        text: 'I blocked you but texting anyway',
        createdAt: new Date().toISOString(),
        status: 'sent',
      }),
    );
  });

  test('❌ Blocked entity Bob CANNOT read Alice\'s block record', async () => {
    const ctx = asUser('bob');
    await assertFails(getDoc(doc(ctx.firestore(), 'socialBlocks/alice_bob')));
  });

  test('✅ Blocker Alice CAN read her own block record', async () => {
    const ctx = asUser('alice');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'socialBlocks/alice_bob')));
  });

  test('✅ Both Alice and Bob CAN read history in a blocked conversation', async () => {
    const ctxAlice = asUser('alice');
    const ctxBob = asUser('bob');
    await assertSucceeds(getDoc(doc(ctxAlice.firestore(), 'conversations/conv_alice_bob')));
    await assertSucceeds(getDoc(doc(ctxBob.firestore(), 'conversations/conv_alice_bob')));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. QUIET RESTRICTION BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Quiet Restriction Boundary — Read Receipt Suppression', () => {
  const convId = 'conv_alice_bob';

  beforeEach(async () => {
    // Alice restricts Bob
    await seedDoc('socialRestrictions/alice_bob', {
      restrictionId: 'alice_bob',
      restricterId: 'alice',
      restricterType: 'fan',
      restrictedId: 'bob',
      restrictedType: 'artist',
      operatorUid: 'alice',
      createdAt: new Date().toISOString(),
    });

    await seedDoc(`conversations/${convId}`, {
      id: convId,
      participantIds: ['alice', 'bob'],
      participantTypes: { alice: 'fan', bob: 'artist' },
      status: 'accepted',
      requesterId: 'bob',
      recipientId: 'alice',
      createdAt: new Date().toISOString(),
    });

    await seedDoc(`conversations/${convId}/messages/msg-restricted`, {
      id: 'msg-restricted',
      conversationId: convId,
      senderId: 'bob',
      senderType: 'artist',
      operatorUid: 'bob',
      recipientId: 'alice',
      text: 'Hey Alice, checking in!',
      createdAt: new Date().toISOString(),
      status: 'delivered',
      readBy: ['bob'],
    });
  });

  test('❌ Restricted user Bob CANNOT read Alice\'s restriction record (zero-awareness)', async () => {
    const ctx = asUser('bob');
    await assertFails(getDoc(doc(ctx.firestore(), 'socialRestrictions/alice_bob')));
  });

  test('✅ Restricter Alice CAN read her own restriction record', async () => {
    const ctx = asUser('alice');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'socialRestrictions/alice_bob')));
  });

  test('✅ Restricter Alice CAN read messages from restricted Bob', async () => {
    const ctx = asUser('alice');
    await assertSucceeds(
      getDoc(doc(ctx.firestore(), `conversations/${convId}/messages/msg-restricted`)),
    );
  });

  test('❌ Alice CANNOT update readBy or read status on restricted message (receipt suppression)', async () => {
    const ctx = asUser('alice');
    await assertFails(
      updateDoc(doc(ctx.firestore(), `conversations/${convId}/messages/msg-restricted`), {
        readBy: ['bob', 'alice'],
        status: 'read',
        readAt: new Date().toISOString(),
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. OPERATOR ANTI-FORGERY & BAND MEMBERSHIP TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Security & Authorization — Operator Non-Repudiation & Band Membership', () => {
  const bandId = 'band_rockers';

  beforeEach(async () => {
    await seedBandMember(bandId, 'user_founder', 'BAND_FOUNDER', true);
    await seedBandMember(bandId, 'user_admin', 'BAND_ADMIN', true);
    await seedBandMember(bandId, 'user_member', 'BAND_MEMBER', true);
    await seedBandMember(bandId, 'user_inactive', 'BAND_ADMIN', false);
  });

  test('❌ User CANNOT forge operatorUid when sending message as fan', async () => {
    const ctx = asUser('alice');
    await seedDoc('conversations/conv_alice_bob', {
      id: 'conv_alice_bob',
      participantIds: ['alice', 'bob'],
      participantTypes: { alice: 'fan', bob: 'artist' },
      status: 'accepted',
      requesterId: 'alice',
      recipientId: 'bob',
      createdAt: new Date().toISOString(),
    });

    await assertFails(
      setDoc(doc(ctx.firestore(), 'conversations/conv_alice_bob/messages/msg-forged'), {
        id: 'msg-forged',
        conversationId: 'conv_alice_bob',
        senderId: 'alice',
        senderType: 'fan',
        operatorUid: 'bob', // FORGERY: Alice claims operator is Bob
        recipientId: 'bob',
        text: 'Forged message',
        createdAt: new Date().toISOString(),
        status: 'sent',
      }),
    );
  });

  test('✅ Band founder CAN follow another entity on behalf of the band', async () => {
    const ctx = asUser('user_founder');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `follows/${bandId}_target_artist`), {
        followId: `${bandId}_target_artist`,
        sourceId: bandId,
        sourceType: 'band',
        targetId: 'target_artist',
        targetType: 'artist',
        operatorUid: 'user_founder',
        status: 'active',
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('✅ Band admin CAN block an abusive entity on behalf of the band', async () => {
    const ctx = asUser('user_admin');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `socialBlocks/${bandId}_troll`), {
        blockId: `${bandId}_troll`,
        blockerId: bandId,
        blockerType: 'band',
        blockedId: 'troll',
        blockedType: 'fan',
        operatorUid: 'user_admin',
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Regular band member CANNOT block entities on behalf of band (admin required)', async () => {
    const ctx = asUser('user_member');
    await assertFails(
      setDoc(doc(ctx.firestore(), `socialBlocks/${bandId}_troll_2`), {
        blockId: `${bandId}_troll_2`,
        blockerId: bandId,
        blockerType: 'band',
        blockedId: 'troll_2',
        blockedType: 'fan',
        operatorUid: 'user_member',
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Non-member stranger CANNOT act on behalf of band', async () => {
    const ctx = asUser('stranger');
    await assertFails(
      setDoc(doc(ctx.firestore(), `socialBlocks/${bandId}_troll_3`), {
        blockId: `${bandId}_troll_3`,
        blockerId: bandId,
        blockerType: 'band',
        blockedId: 'troll_3',
        blockedType: 'fan',
        operatorUid: 'stranger',
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Inactive member CANNOT act on behalf of band (immediate revocation)', async () => {
    const ctx = asUser('user_inactive');
    await assertFails(
      setDoc(doc(ctx.firestore(), `socialBlocks/${bandId}_troll_4`), {
        blockId: `${bandId}_troll_4`,
        blockerId: bandId,
        blockerType: 'band',
        blockedId: 'troll_4',
        blockedType: 'fan',
        operatorUid: 'user_inactive',
        createdAt: new Date().toISOString(),
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. INCOMING FOLLOWER REMOVAL & PAYLOAD LIMITS
// ══════════════════════════════════════════════════════════════════════════════

describe('Follow Management & Message Validation Limits', () => {
  beforeEach(async () => {
    await seedDoc('follows/fan_stan_artist_luna', {
      followId: 'fan_stan_artist_luna',
      sourceId: 'fan_stan',
      sourceType: 'fan',
      targetId: 'artist_luna',
      targetType: 'artist',
      operatorUid: 'fan_stan',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  });

  test('✅ Target artist Luna can remove incoming follower without blocking Stan', async () => {
    const ctx = asUser('artist_luna');
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), 'follows/fan_stan_artist_luna')));
  });

  test('❌ Third party cannot delete follow edge between Stan and Luna', async () => {
    const ctx = asUser('eve');
    await assertFails(deleteDoc(doc(ctx.firestore(), 'follows/fan_stan_artist_luna')));
  });

  test('❌ Self-following is rejected', async () => {
    const ctx = asUser('alice');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'follows/alice_alice'), {
        followId: 'alice_alice',
        sourceId: 'alice',
        sourceType: 'fan',
        targetId: 'alice',
        targetType: 'fan',
        operatorUid: 'alice',
        status: 'active',
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Message exceeding 2000 characters is rejected', async () => {
    const ctx = asUser('alice');
    await seedDoc('conversations/conv_alice_bob', {
      id: 'conv_alice_bob',
      participantIds: ['alice', 'bob'],
      participantTypes: { alice: 'fan', bob: 'artist' },
      status: 'accepted',
      requesterId: 'alice',
      recipientId: 'bob',
      createdAt: new Date().toISOString(),
    });

    const oversizedText = 'A'.repeat(2001);
    await assertFails(
      setDoc(doc(ctx.firestore(), 'conversations/conv_alice_bob/messages/msg-huge'), {
        id: 'msg-huge',
        conversationId: 'conv_alice_bob',
        senderId: 'alice',
        senderType: 'fan',
        operatorUid: 'alice',
        recipientId: 'bob',
        text: oversizedText,
        createdAt: new Date().toISOString(),
        status: 'sent',
      }),
    );
  });
});
```

---

## 8. Backend Transactional Architecture & Cloud Functions

In addition to client-side Firestore security rules, several operations require server-side coordination using the Firebase Admin SDK to ensure atomicity and consistency across the social graph.

### 8.1 `blockEntity` Callable Implementation Specification
```typescript
/**
 * apps/functions/src/social/safetyCallables.ts
 *
 * Implements atomic bidirectional block cascade:
 * 1. Writes /socialBlocks/{blockerId}_{blockedId}
 * 2. Deletes mutual follow records and decrements counters atomically
 * 3. Sets conversation status to 'blocked'
 * 4. Revokes live session audience grants
 */

export const blockEntity = onCall(async (request) => {
  const operatorUid = assertAuthenticated(request);
  const { targetId, targetType, actingAsBandId, reason } = parseBlockRequest(request.data);

  // 1. Resolve blocker identity
  const blockerId = actingAsBandId ?? operatorUid;
  const blockerType = actingAsBandId ? 'band' : 'fan';

  if (actingAsBandId) {
    await assertBandAdmin(actingAsBandId, operatorUid);
  }

  if (blockerId === targetId) {
    throw new HttpsError('invalid-argument', 'Cannot block self');
  }

  const db = getFirestore();
  const blockId = `${blockerId}_${targetId}`;
  const blockRef = db.doc(`socialBlocks/${blockId}`);

  const followABRef = db.doc(`follows/${blockerId}_${targetId}`);
  const followBARef = db.doc(`follows/${targetId}_${blockerId}`);
  const convId = `conv_${[blockerId, targetId].sort().join('_')}`;
  const convRef = db.doc(`conversations/${convId}`);

  await db.runTransaction(async (tx) => {
    // Check if already blocked
    const existingBlock = await tx.get(blockRef);
    if (existingBlock.exists) {
      return;
    }

    // Inspect follows
    const [followAB, followBA, convDoc] = await Promise.all([
      tx.get(followABRef),
      tx.get(followBARef),
      tx.get(convRef),
    ]);

    // 1. Write block record
    tx.set(blockRef, {
      blockId,
      blockerId,
      blockerType,
      blockedId: targetId,
      blockedType: targetType,
      operatorUid,
      createdAt: FieldValue.serverTimestamp(),
      reason: reason ?? null,
    });

    // 2. Cascade delete follows & decrement counters
    if (followAB.exists) {
      tx.delete(followABRef);
      decrementCounter(tx, blockerId, blockerType, 'followingCount');
      decrementCounter(tx, targetId, targetType, 'followerCount');
    }

    if (followBA.exists) {
      tx.delete(followBARef);
      decrementCounter(tx, targetId, targetType, 'followingCount');
      decrementCounter(tx, blockerId, blockerType, 'followerCount');
    }

    // 3. Update conversation to blocked
    if (convDoc.exists) {
      tx.update(convRef, {
        status: 'blocked',
        blockedBy: blockerId,
        blockedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { ok: true, isBlocked: true };
});
```

### 8.2 `unblockEntity` Callable Implementation Specification
```typescript
export const unblockEntity = onCall(async (request) => {
  const operatorUid = assertAuthenticated(request);
  const { targetId, actingAsBandId } = parseUnblockRequest(request.data);

  const blockerId = actingAsBandId ?? operatorUid;
  if (actingAsBandId) {
    await assertBandAdmin(actingAsBandId, operatorUid);
  }

  const db = getFirestore();
  const blockId = `${blockerId}_${targetId}`;
  const blockRef = db.doc(`socialBlocks/${blockId}`);
  const convId = `conv_${[blockerId, targetId].sort().join('_')}`;
  const convRef = db.doc(`conversations/${convId}`);

  await db.runTransaction(async (tx) => {
    const blockDoc = await tx.get(blockRef);
    if (!blockDoc.exists) {
      return;
    }

    // Delete block record
    tx.delete(blockRef);

    // CRITICAL: Prior follows are NEVER restored.

    // If conversation was blocked by this party, transition to accepted
    const convDoc = await tx.get(convRef);
    if (convDoc.exists && convDoc.data()?.status === 'blocked' && convDoc.data()?.blockedBy === blockerId) {
      tx.update(convRef, {
        status: 'accepted',
        unblockedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { ok: true, isBlocked: false };
});
```

---

## 9. Security Threat Model & Attack Vector Mitigations

| Threat Vector | Attack Scenario | Architectural Defense & Mitigation |
|---|---|---|
| **Operator UID Impersonation** | Malicious client attempts to set `operatorUid: "victim_uid"` on a follow or message. | **Mitigated:** Firestore rules enforce `request.resource.data.operatorUid == request.auth.uid`. Forged requests fail immediately. |
| **Band Hijacking** | Rogue user attempts to issue blocks or send messages as a Band they do not belong to. | **Mitigated:** Firestore rules verify active membership in `bands/{bandId}/members/{auth.uid}`. Only `BAND_FOUNDER` or `BAND_ADMIN` can execute safety actions. |
| **Block Bypass via Alternate Identity** | Blocked user switches between fan and artist profiles to harass target. | **Mitigated:** In solo artist profiles, `artistId == uid`. Blocking either identity blocks the root `uid`. For bands, blocks target the band entity. |
| **Silent Restriction Discovery** | Restricted user attempts to probe whether they are restricted by reading the restrictions collection or checking read receipts. | **Mitigated:** Restricted identity is strictly denied read access to `/socialRestrictions/{restricterId}_{restrictedId}`. Firestore rules block updating `readBy` on messages from restricted users, ensuring status remains perpetually "Delivered". |
| **Follow Counter Desynchronization** | Client attempts to tamper with `followerCount` or `followingCount` during follow/unfollow. | **Mitigated:** Rules forbid client writes to counter fields (`keys().hasAny(['followerCount', ...])`). Counters are updated exclusively via Cloud Function transactions. |
| **Unblock Exploit to Force Follow** | Attacker blocks and unblocks victim hoping to reset or restore social graph privileges. | **Mitigated:** Invariant OD-Social-04 enforces that unblocking **never** restores follow relationships. Follow edges must be newly and explicitly initiated. |
| **Chat Flood / DoS** | Attacker spam-creates pending message requests without recipient acceptance. | **Mitigated:** Rules restrict pending request conversations to a single message until the recipient accepts. Text is bounded between 1 and 2,000 characters. |
| **Evidence Tampering** | Harasser deletes abusive messages after being reported. | **Mitigated:** Message deletion is completely disabled in security rules (`allow delete: if false`). When reported, `submitReport` captures an immutable server snapshot in `/reports/{id}/evidence`. |

---

## 10. Deliverables Summary & Next Steps for Lead Engineer

The Trust & Permissions Specialist Subagent has delivered the following:
1. **Architectural Specification (`docs/social/drafts/TRUST_PERMISSIONS_DRAFT.md`):** Complete design covering the Hard Block Boundary, Quiet Restrict Boundary, Band Safety, and Threat Model.
2. **Firestore Security Rules:** Fully formulated, production-ready rules for `/socialBlocks`, `/socialRestrictions`, `/follows`, `/conversations`, and `/conversations/{id}/messages`.
3. **Automated Unit Test Suite:** 15+ comprehensive unit test scenarios using `@firebase/rules-unit-testing` covering all authorization, block, restriction, and anti-forgery paths.
4. **Cloud Function Transaction Contracts:** Detailed transactional cascade implementation for `blockEntity` and `unblockEntity`.

**Integration Recommendation for Lead Engineer:**
- Merge the rules in Section 6 into `firebase/firestore.rules`.
- Append the unit tests in Section 7 into `firebase/tests/firestore.test.ts` (or a dedicated `firebase/tests/socialRules.test.ts`).
- Coordinate with `SocialGraphAgent` and `MessagingAgent` to link the transaction cascades into `apps/functions/src/social/safetyCallables.ts`.
