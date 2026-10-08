# Crowdbeats V2 — Social Relationship & Messaging Feature Specification

**Document Version:** 1.0.0  
**Date:** 2026-10-04  
**Author:** Lead Engineering Agent  
**Status:** Approved Architecture & Shared Contract  

---

## 1. Persona & Social Identity Model

### 1.1 Social Entities & Directed Combinations
Crowdbeats supports three primary social personas:
1. **Fan (`fan`)**: Authenticated user identity (`users/{uid}`).
2. **Solo Musician (`artist`)**: Creator identity (`artistProfiles/{artistId}`). In single-operator setups, `artistId == uid`.
3. **Band (`band`)**: Shared collective identity (`bands/{bandId}`). Operates as a distinct entity with multiple authorized human operators.

All **9 directed follow relationships** are supported and independent:
- `Fan -> Fan`, `Fan -> Solo`, `Fan -> Band`
- `Solo -> Fan`, `Solo -> Solo`, `Solo -> Band`
- `Band -> Fan`, `Band -> Solo`, `Band -> Band`

### 1.2 Separation of Operator vs. Acting Identity
- **Operator UID (`operatorUid`)**: The real authenticated user (`request.auth.uid`).
- **Acting Social Identity (`actingId`, `actingType`)**:
  - If acting as Fan or Solo Musician: `actingId == operatorUid`.
  - If acting as Band: `actingId == bandId`. The operator must be an active member with role `FOUNDER`, `ADMIN`, or `MEMBER` with communication permissions in `bands/{bandId}/members/{operatorUid}`.
  - The real `operatorUid` is recorded privately on all follow, message, block, restrict, and report records for accountability and audit trails.
  - Band membership revocation immediately revokes the operator's ability to read or write messages/follows on behalf of that band.

---

## 2. Follow Model & Relationship State Machine

### 2.1 Follow Document & Invariants
- **Path:** `/follows/{sourceId}_{targetId}`
- **Compound ID:** `{sourceId}_{targetId}` guarantees uniqueness and O(1) existence checks.
- **Attributes:**
  - `followId`: string (`"${sourceId}_${targetId}"`)
  - `sourceId`: string (acting identity following)
  - `sourceType`: `'fan' | 'artist' | 'band'`
  - `targetId`: string (acting identity being followed)
  - `targetType`: `'fan' | 'artist' | 'band'`
  - `operatorUid`: string (human user executing the action)
  - `createdAt`: Timestamp
  - `status`: `'active'`

### 2.2 Follow Counter Consistency
- `followerCount` on target (`users`, `artistProfiles`, or `bands`) is incremented atomically by Cloud Function or transactional write.
- `followingCount` on source is incremented atomically.
- **Rollback on Error:** UI updates optimistically but reverts on any backend failure.
- **Self-Follow Blocked:** `sourceId == targetId` is rejected at API and rules level.

### 2.3 Follow States & UI Representation
1. **Not Following:** Primary CTA is `"Follow"`.
2. **Following:** Button renders `"Following"`. Tapping opens action sheet with `"Unfollow"` or `"Cancel"`.
3. **Follow Back:** If `follows/{targetId}_{sourceId}` exists but `follows/{sourceId}_{targetId}` does not, button renders `"Follow Back"`.
4. **"Follows You" Badge:** Displayed on profiles and list items when the target follows the current acting viewer.
5. **Remove Follower:** Target can remove incoming follow (`follows/{incomingFollowerId}_{myId}`) without blocking the user. Decrements incoming follower's `followingCount` and target's `followerCount`.

---

## 3. Messaging Rules & State Machine

### 3.1 Conversation Identity & Storage
- **Path:** `/conversations/{conversationId}`
- **Deterministic ID:** `conv_${[idA, idB].sort().join('_')}` prevents duplicate threads.
- **Path for Messages:** `/conversations/{conversationId}/messages/{messageId}`

### 3.2 Default Eligibility Policy Matrix
| Relationship / Prior State | New Message Eligibility | Initial Message State |
|---|---|---|
| **Neither follows, no prior accepted chat** | ❌ No conversation allowed. | Offer "Follow" button. |
| **At least one follow edge exists, no prior chat** | ⚠️ Allowed: 1 text-only message request. | `pending_request` |
| **Both follow each other (Mutual follows)** | ✅ Full normal chat allowed. | `accepted` |
| **Prior conversation accepted (even if unfollowed)** | ✅ Chat remains available. | `accepted` |
| **Either identity blocks the other** | 🛑 Completely blocked both ways. | `blocked` |
| **Recipient restricts sender** | 🤫 Routed to Requests/Restricted tab. | `pending_request` / restricted |
| **Account suspended or deleted** | 🛑 Lifecycle restriction. | Blocked |

### 3.3 Message Request Lifecycle & Cooldown
- **Pending Request:** Contains exactly one initial message. Sender cannot send additional messages until recipient acts.
- **Recipient Actions on Request:**
  1. **Accept:** Transitions conversation to `accepted`. Enables two-way chatting.
  2. **Decline:** Sets `status: 'declined'` and records `declineCooldownUntil` = `now + 7 days`. Requester cannot send new requests during cooldown. Mutual following does NOT override cooldown; explicit recipient acceptance or initiation does.
  3. **Block:** Blocks identity in both directions.
  4. **Report:** Submits report to Admin Support.
- **Unfollow During Pending Request:** If all follow edges disappear before a pending request is accepted, the request becomes `unavailable` for acceptance while preserving report access.

### 3.4 Recipient Safety Controls & Settings
- **`messageEligibility`:**
  - `everyone_eligible` (default Crowdbeats policy above)
  - `mutual_only` (requires mutual follows for new requests)
  - `following_or_followers` (requires at least one follow edge)
- **`pauseMessages`:** When true, rejects all new incoming messages and requests with friendly feedback. History remains accessible.

---

## 4. Block, Restrict, and Safety Boundaries

### 4.1 BLOCK (Strong Boundary)
- **Collection:** `/socialBlocks/{blockerId}_{blockedId}`
- **Bidirectional Effect:**
  - Blocks follows, message requests, new messages, presence, and social notifications.
  - Automatically deletes follow records in both directions. Decrements counts atomically.
  - Cancels any pending follow or message requests.
  - Existing conversation becomes read-only for both participants.
  - Social discovery/suggestions filter out blocked identities.
  - Profile view shows neutral unavailable state.
- **Unblock:**
  - Deletes block record.
  - Follow edges are **NOT** restored.
  - Prior accepted conversations resume read-write under current settings.

### 4.2 RESTRICT (Quiet Boundary)
- **Collection:** `/socialRestrictions/{restricterId}_{restrictedId}`
- **Subtle Effect:**
  - Follows remain intact.
  - Conversations move to Requests/Restricted tab for the restricting user.
  - Push notifications, typing indicators, and read receipts are suppressed.
  - Opening restricted messages does NOT produce read receipts.
  - Explicit "Unrestrict" required to reply. Restricted user is never informed of the restriction.

---

## 5. Report to Admin Support

### 5.1 Reporting Flow & Evidence Preservation
- **Intake:** Via Cloud Function `submitReport` or direct authenticated submission.
- **Target Types:** `'user' | 'artist' | 'band' | 'message' | 'conversation'`.
- **Categories:**
  - `harassment_bullying`
  - `spam_scam`
  - `impersonation`
  - `hate_threats`
  - `inappropriate_content`
  - `other`
- **Evidence Access:** When reporting a message or conversation, server verifies caller's participation and securely snapshots the reported messages into `/reports/{reportId}/evidence` to prevent tampering by subsequent edits or deletions.
- **Admin Workflow:** Reports flow into `/moderationQueue`. Admin Support staff can filter, claim, review evidence, add internal notes, and take action (`warn`, `restrict`, `suspend`, `dismiss`).

---

## 6. Firestore Rules & Security Specifications

1. `/follows/{followId}`:
   - Read: Allowed if caller is participant or if viewing public list.
   - Create/Delete: Server callable or validated client write (ensuring caller is source identity or authorized band operator).
2. `/conversations/{conversationId}`:
   - Read: Allowed only if caller is participant (or authorized band operator) AND not blocked.
   - Write: Enforced via Cloud Function or strict rules validating eligibility matrix.
3. `/conversations/{conversationId}/messages/{messageId}`:
   - Read: Allowed only for conversation participants.
   - Create: Strictly validated against conversation status (`accepted` or first `pending_request`), sender identity, and character limits (max 2000 chars).
4. `/socialBlocks/{blockId}` & `/socialRestrictions/{restrictId}`:
   - Read/Write: Strictly owner-only (`blockerId == auth.uid` or authorized band operator).
