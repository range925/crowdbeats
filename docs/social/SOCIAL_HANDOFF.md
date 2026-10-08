# Crowdbeats V2 — Social Relationships & Messaging Handoff Documentation

**Version:** 2.0.0-social  
**Date:** October 4, 2026  
**Branch:** `feat/social-relationships-messaging`  
**Authors:** Crowdbeats Engineering Team

---

## 1. System Overview

The Crowdbeats V2 Social Relationships and Direct Messaging system provides an Instagram-inspired social layer tailored for live music interactions. It connects **Fans**, **Solo Musicians**, and **Bands** across mobile (Flutter) and responsive web (Next.js), featuring:

1. **Independent Follows:** All 9 directed role pairs (Fan $\leftrightarrow$ Solo $\leftrightarrow$ Band) with independent edges, follow-back awareness, and quiet follower removal.
2. **Controlled 1-to-1 Messaging:** Governed by explicit relationship rules (mutual follows, 1-message requests, 7-day decline cooldowns, and unfollow resilience).
3. **Safety & Moderation Boundaries:** Strong bidirectional blocking, quiet restriction with zero read receipt awareness, and reporting with immutable message evidence snapshotting directly to the Admin Support moderation queue.
4. **Multi-Tenant Band Identity:** Explicit separation of human operator auth credentials from acting collective identities (`actingAsBandId`, `actingAsArtistId`).

---

## 2. Architecture & Data Model

### A. Follow Record (`/follows/{followId}`)
- **ID format:** `${followerId}_${targetId}`
- **Fields:**
  - `followerId`: Social entity ID (User UID, Solo Artist ID, or Band ID)
  - `followerType`: `'fan' | 'artist' | 'band'`
  - `targetId`: Target entity ID
  - `targetType`: `'fan' | 'artist' | 'band'`
  - `operatorUid`: Authenticated human UID who initiated the follow
  - `createdAt`: Server timestamp

### B. Conversation Summary (`/conversations/{conversationId}`)
- **ID format:** Deterministic sorted pair `conv_${[idA, idB].sort().join('_')}`
- **Fields:**
  - `id`: Conversation ID
  - `participantIds`: `[string, string]` (lexicographically sorted)
  - `participantTypes`: `{ [entityId]: SocialEntityType }`
  - `status`: `'pending_request' | 'accepted' | 'declined' | 'blocked'`
  - `requesterId`: Entity ID that initiated the conversation
  - `recipientId`: Recipient entity ID
  - `lastMessageText`: Preview snippet (max 200 chars)
  - `lastMessageTimestamp`: ISO timestamp
  - `lastSenderId`: Entity ID of last message sender
  - `lastOperatorUid`: Human operator UID
  - `unreadCounts`: `{ [entityId]: number }`
  - `declineCooldownUntil`: Timestamp (7-day cooldown when declined)
  - `blockedBy`: Entity ID of blocking party (if blocked)
  - `restrictedBy`: Map or list of entity IDs who restricted this thread
  - `createdAt`, `updatedAt`: Server timestamps

### C. Chat Message (`/conversations/{conversationId}/messages/{messageId}`)
- **Fields:**
  - `id`: Message ID (`msg_${uuid}`)
  - `conversationId`: Parent conversation ID
  - `senderId`: Entity ID
  - `senderType`: `'fan' | 'artist' | 'band'`
  - `operatorUid`: Human UID who sent the message
  - `recipientId`: Target entity ID
  - `text`: Message body (max 2,000 characters)
  - `status`: `'sent' | 'delivered' | 'read'`
  - `readBy`: Array of entity IDs who marked this read (restricted users omitted)
  - `createdAt`: Server timestamp

### D. Safety Records
- `/socialBlocks/{blockId}`: `${blockerId}_${targetId}`
- `/socialRestrictions/{restrictId}`: `${restricterId}_${targetId}`
- `/reports/{reportId}`: Incident report with `evidence.messages` snapshot.

---

## 3. Backend Cloud Functions (`apps/functions/src/social/`)

| Callable Function | Description | Key Permissions & Invariants |
|-------------------|-------------|------------------------------|
| `followEntity` | Creates directed follow edge | Verifies operator; rejects self-follows; checks bidirectional blocks |
| `unfollowEntity` | Removes outgoing follow edge | Verifies operator; decrements counters atomically |
| `removeFollower` | Removes incoming follower | Allows target to remove follower without blocking or notifying |
| `getRelationshipState` | Real-time relationship evaluation | Returns `isFollowing`, `followsViewer`, `canMessage`, `isBlocked`, `isRestricted` |
| `sendMessage` | Sends 1-to-1 message | Enforces relationship rules (mutual, single request, or resilience); checks cooldowns & blocks |
| `getConversations` | Lists categorized conversations | Supports `inbox`, `requests`, and `restricted` tabs with unread totals |
| `getMessages` | Paginated message history | Verifies participant identity; resets unread count; suppresses read receipt if restricted |
| `respondToMessageRequest` | Accepts, declines, blocks, reports | Enforces 7-day cooldown on decline; snapshots message evidence on report |
| `updateMessageSettings` | Configures message eligibility | Configures `everyone_eligible`, `mutual_only`, or `pauseMessages` |
| `blockEntity` / `unblockEntity` | Strong bidirectional block | Deletes follow edges in both directions; locks conversations to read-only |
| `restrictEntity` / `unrestrictEntity` | Quiet zero-awareness isolation | Preserves follow edges; isolates incoming messages into Restricted tab |

---

## 4. Web Implementation (`apps/web`)

1. **Shared Messaging Dashboard (`components/social/MessagingDashboard.tsx`):**
   - 3-tab layout: **Inbox**, **Requests**, and **Restricted**.
   - Pending message request review bar: Accept, Decline (with 7-day cooldown), Block, and Report with reason selection.
   - Recipient message controls modal (eligibility setting and message pausing).
   - Message composer with character validation and draft thread creation.
2. **Dedicated Pages:**
   - `/fan/messages`: Fan direct messaging portal (supports `?recipientId=...` deeplinks).
   - `/creator/messages`: Creator Studio inbox and requests.
   - `/band/messages`: Band Studio communication portal with `actingAsBandId` support.
3. **Profile Social Actions (`components/social/ProfileSocialHeaderActions.tsx`):**
   - Dynamic Follow / Following / Follow Back button.
   - Subtle "Follows you" badge based on verified server relationship state.
   - Direct "Message" button routing to chat view.
   - Overflow safety menu for Block, Restrict/Unrestrict, and Report.
   - Integrated into both `ArtistProfileClientView.tsx` and `BandProfileClientView.tsx`.
4. **Admin Moderation Queue (`apps/web/app/(admin)/admin/trust-safety/page.tsx`):**
   - Displays all user and message abuse reports.
   - Full inspection modal displaying **immutable chat evidence snapshots** with sender attribution and timestamps.
   - One-click resolution and dismissal workflow.

---

## 5. Mobile Implementation (`apps/mobile`)

1. **Social Service (`lib/data/services/social_service.dart`):**
   - Type-safe Dart client wrapping all Cloud Functions callables with null-safety and Riverpod provider integration.
2. **Mobile Messaging Screen (`lib/ui/fan/social_messaging_screen.dart`):**
   - High-fidelity chat interface with Inbox, Requests, and Restricted tabs.
   - In-app request acceptance, 7-day decline banner, quiet restriction indicator.
   - Message delivery/read status indicator.
   - Full safety modal bottom sheet (Block, Restrict, Report).
3. **Mobile Profile Social Actions (`lib/ui/components/cb_profile_social_actions.dart`):**
   - Follow / Following / Follow Back toggle button with optimistic updates and failure rollback.
   - "Follows you" badge.
   - "Message" button opening `SocialMessagingScreen`.
   - Overflow menu with block confirmation dialog and report intake.
   - Integrated into `public_profile_screen.dart` and home navigation header.

---

## 6. Verification & Automated Testing

- **E2E Suite:** `apps/functions/src/__tests__/socialMessagingE2E.test.ts`
- **Total Tests:** 27 test cases covering all 9 directed role pairs, invariant guards, multi-tenant permissions, recipient control state machine, and safety boundaries.
- **Pass Rate:** **100% (27 / 27 passing)**.
- **Static Verification:** 0 compilation errors across TypeScript and Dart.
