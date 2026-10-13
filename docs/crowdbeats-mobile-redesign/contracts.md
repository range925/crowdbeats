# Crowdbeats Mobile Redesign: Backend & Security Contracts (Phase 1)

**Document Status:** Complete (Phase 1 Discovery)  
**Target:** Flutter Mobile (`apps/mobile`), Cloud Functions Gen 2 (`apps/functions`), Security Rules (`firebase/firestore.rules`)  
**Commit Checkpoint:** `redesign-mobile-cp0` (`d7f10a2`)

---

## 1. Authentication & Session State Contracts

### 1.1 Auth Providers & Session Persistence
* **Supported Providers:**
  - Email/Password (`apps/mobile/lib/firebase/auth_service.dart:67-95`)
  - Google Sign-In (`apps/mobile/lib/firebase/auth_service.dart:103-125`)
  - Apple Sign-In (`apps/mobile/lib/firebase/auth_service.dart:128-152`)
* **Persistence:** Native secure keychain / keystore (Firebase Auth native SDK persistence).
* **Listeners (`apps/mobile/lib/state/auth_state.dart:45-82`):**
  - `FirebaseAuth.instance.authStateChanges()`: updates `AuthState(status: AuthStatus.authenticated / unauthenticated)`.
  - `FirebaseAuth.instance.idTokenChanges()`: triggered when custom claims are refreshed (e.g. after onboarding completion).
  - Periodic Token Probe: `Timer.periodic(const Duration(minutes: 10))` forces ID token refresh to detect revoked sessions or updated claims.

### 1.2 Auth State Machine
```
[Unauthenticated] ---> (signInWithEmail / signInWithGoogle / signInWithApple)
       ^         \
       |          +--> [Loading] ---> [Authenticated]
       |                                     |
       +----------- (signOut) <--------------+
```
* **Status Enum:** `AuthStatus.initial`, `AuthStatus.loading`, `AuthStatus.authenticated`, `AuthStatus.unauthenticated`, `AuthStatus.error`.
* **Current Claims Shape:** Read from `IdTokenResult.claims`:
  ```json
  {
    "personaType": "fan" | "musician" | "artist" | "band" | "sponsor" | "staff",
    "activePersonas": ["fan", "artist", "band"],
    "stripeConnected": true | false,
    "onboardingCompleted": true | false,
    "platformRole": "SUPER_ADMIN" | "CUSTOMER_SUPPORT" | null,
    "roles": ["fan", "artist"]
  }
  ```

### 1.3 Guest Gating, Resume Intent & Return-Path
* **Guest Exploration:** Allowed without authentication on discovery routes:
  - `/` (FanShell: Discover tab)
  - `/nearby`
  - `/artist/:id` (public performer profile)
  - `/band/:slug` (public band profile)
  - `/tip/:performerId` (amount selection)
  - `/qr/scan` (scanner)
* **Gated Actions (Authentication Required):**
  - Final Payment Confirmation (`/tip/confirm`)
  - Following an artist (`followArtist` / `followEntity`)
  - Saving a performer / stage
  - Sending direct messages (`sendMessage`)
  - Accessing Account Hub (`/account`)
  - Accessing Creator Studio (`/creator`, `/band`)
* **Resume Mechanics:**
  - `cbAuthRedirect` (`apps/mobile/lib/main.dart:58-95`): Intercepts unauthenticated navigation to protected routes and appends `?from=<encodedPath>`.
  - `AuthScreen` (`apps/mobile/lib/ui/auth/auth_screen.dart:288-305`): After successful login, redirects to `widget.returnUrl` or query parameter `from`.
  - `PendingTipContext` (`apps/mobile/lib/state/pending_tip_state.dart:20-65`): Captures `performerId`, `performerName`, `amountCents`, `sessionId`, and `returnRoute` before bouncing guest to auth; restored upon return.
* **Sign-Out Cleanup:**
  - `AuthService.signOut()` clears Firebase session.
  - `authStateProvider` updates to `unauthenticated`.
  - **Identified Gap (B-22):** `creatorContextProvider` does NOT reset local state on sign-out and retains hardcoded mock credentials ("Elena Cruz"). Must be reset in Phase 4.

---

## 2. Profile Data & Firestore Access Control

| Collection | Path Pattern | Read Rule | Write Rule | Sensitive / Immutable Fields | Rule Lines |
|---|---|---|---|---|---|
| `users` | `/users/{uid}` | `isOwner(uid) \|\| isUserSupportStaff()` | `isOwner(uid) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['id', 'createdAt'])` | `id`, `createdAt`, `platformRole` (server only) | `firestore.rules:45-56` |
| `fanProfiles` | `/fanProfiles/{uid}` | `true` (public) | `isOwner(uid)` | `userId`, `reputationScore` | `firestore.rules:64-75` |
| `artistProfiles` | `/artistProfiles/{artistId}` | `resource.data.isPublished == true \|\| isOwner(artistId)` | `isOwner(artistId)` (validated schema) | `balanceCents`, `rating`, `totalTipsCount` (server only) | `firestore.rules:80-110` |
| `bands` | `/bands/{bandId}` | `resource.data.isPublished == true \|\| isBandMember(bandId)` | `isBandAdmin(bandId)` | `treasuryBalanceCents`, `splitConfigVersion` | `firestore.rules:120-170` |
| `creatorSlugs` | `/creatorSlugs/{slug}` | `true` (public) | Denied to clients (Cloud Function `resolveCreatorBySlug` only) | Entire document | `firestore.rules:175-185` |
| `liveSessions` | `/liveSessions/{sessionId}` | `true` (public active sessions) | Denied to clients (managed by `startSession` / `endSession`) | Geolocation, timestamps, status | `firestore.rules:240-275` |
| `paymentLedger` | `/paymentLedger/{entry}` | Denied to clients | Server only | Financial records | `firestore.rules:11-12` |
| `payouts` | `/payouts/{payoutId}` | `isOwner(resource.data.creatorId)` | Server only | Amounts, statuses, destination | `firestore.rules:310-335` |

---

## 3. Cloud Functions (Callables) Inventory

| Callable Name | Functions File | Mobile Invocation File:Line | Auth Req | Inputs Summary | Outputs Summary | Backend Status |
|---|---|---|---|---|---|---|
| `createTipIntent` | `tip/createTipIntent.ts` | `lib/firebase/tip_service.dart:39` | Optional (Guest or Auth) | `performerId, amountCents, currency, idempotencyKey` | `clientSecret, paymentIntentId, netCents` | Active (`index.ts:50`) |
| `verifyQrToken` | `tip/verifyQrToken.ts` | `lib/firebase/tip_service.dart:150` | None | `qrToken, userLocation` | `valid, performerId, sessionId, expiresAt` | Active (`index.ts:53`) |
| `startSession` | `session/startSession.ts` | `lib/data/services/session_service.dart:97, 117` | Auth (`artist`\|`band`) | `creatorId, title, venueId, idempotencyKey, location` | `sessionId, status, startedAt` | Active (`index.ts:75`) |
| `endSession` | `session/endSession.ts` | `lib/data/services/session_service.dart:137` | Auth (session owner) | `sessionId, endReason` | `sessionId, endedAt, totalTips` | Active (`index.ts:76`) |
| `heartbeatSession` | `session/heartbeatSession.ts` | `lib/data/services/session_service.dart:148` | Auth (session owner) | `sessionId, clientTimestamp` | `status, leaseExpiry` | Active (`index.ts:77`) |
| `reconcileSessionState` | `session/reconcileSession.ts` | `lib/data/services/session_reconciliation_service.dart:104` | Auth | `sessionId` | `reconciledState` | Active (`index.ts:110`) |
| `followEntity` | `social/followCallables.ts` | `lib/data/services/social_service.dart:55` | Auth | `targetEntityId, targetEntityType` | `success, relationshipId` | Active (`index.ts:268`) |
| `unfollowEntity` | `social/followCallables.ts` | `lib/data/services/social_service.dart:70` | Auth | `targetEntityId, targetEntityType` | `success` | Active (`index.ts:269`) |
| `removeFollower` | `social/followCallables.ts` | `lib/data/services/social_service.dart:85` | Auth | `followerId` | `success` | Active (`index.ts:270`) |
| `getRelationshipState` | `social/followCallables.ts` | `lib/data/services/social_service.dart:100` | Auth | `targetEntityId` | `isFollowing, isBlocked, isMuted` | Active (`index.ts:271`) |
| `blockEntity` | `social/safetyCallables.ts` | `lib/data/services/social_service.dart:121` | Auth | `targetEntityId` | `success` | Active (`index.ts:278`) |
| `unblockEntity` | `social/safetyCallables.ts` | `lib/data/services/social_service.dart:136` | Auth | `targetEntityId` | `success` | Active (`index.ts:279`) |
| `restrictEntity` | `social/safetyCallables.ts` | `lib/data/services/social_service.dart:151` | Auth | `targetEntityId` | `success` | Active (`index.ts:280`) |
| `unrestrictEntity` | `social/safetyCallables.ts` | `lib/data/services/social_service.dart:166` | Auth | `targetEntityId` | `success` | Active (`index.ts:281`) |
| `submitReport` | `moderation/submitReportCallable.ts` | `lib/data/services/social_service.dart:181` | Auth | `targetEntityId, reason, details` | `reportId, status` | Active (`index.ts:135`) |
| `sendMessage` | `social/messagingCallables.ts` | `lib/data/services/social_service.dart:200` | Auth | `conversationId, recipientId, text` | `messageId, sentAt` | Active (`index.ts:288`) |
| `getConversations` | `social/messagingCallables.ts` | `lib/data/services/social_service.dart:218` | Auth | `cursor, limit` | `conversations: []` | Active (`index.ts:289`) |
| `getMessages` | `social/messagingCallables.ts` | `lib/data/services/social_service.dart:234` | Auth | `conversationId, cursor, limit` | `messages: []` | Active (`index.ts:290`) |
| `respondToMessageRequest` | `social/messagingCallables.ts` | `lib/data/services/social_service.dart:252` | Auth | `conversationId, action ('accept'\|'decline')` | `status` | Active (`index.ts:291`) |
| `updateMessageSettings` | `social/messagingCallables.ts` | `lib/data/services/social_service.dart:269` | Auth | `allowMessagesFrom ('everyone'\|'followers'\|'none')`| `status` | Active (`index.ts:292`) |
| `createBand` | `band/createBand.ts` | `lib/firebase/band_service.dart:19` | Auth (`musician`\|`artist`) | `name, genre, bio` | `bandId, slug` | Active (`index.ts:157`) |
| `inviteBandMember` | `band/inviteBandMember.ts` | `lib/firebase/band_service.dart:39` | Auth (Band Admin) | `bandId, email, role, splitPercent` | `invitationId` | Active (`index.ts:158`) |
| `respondToBandInvitation`| `band/respondToBandInvitation.ts` | `lib/firebase/band_service.dart:58` | Auth | `invitationId, accept: bool` | `success, bandId` | Active (`index.ts:159`) |
| `updateBandMemberRole` | `band/updateBandMemberRole.ts` | `lib/firebase/band_service.dart:77` | Auth (Band Owner) | `bandId, memberUid, newRole` | `success` | Active (`index.ts:160`) |
| `removeBandMember` | `band/removeBandMember.ts` | `lib/firebase/band_service.dart:97` | Auth (Band Owner) | `bandId, memberUid` | `success` | Active (`index.ts:161`) |
| `transferBandOwnership`| `band/transferBandOwnership.ts` | `lib/firebase/band_service.dart:116` | Auth (Band Owner) | `bandId, newOwnerUid` | `success` | Active (`index.ts:162`) |
| `setBandSplitConfig` | `band/setBandSplitConfig.ts` | `lib/firebase/band_service.dart:134` | Auth (Band Admin) | `bandId, splits: []` | `splitConfigVersion` | Active (`index.ts:163`) |
| `getBandTreasury` | `band/getBandTreasury.ts` | `lib/firebase/band_service.dart:149` | Auth (Band Member) | `bandId` | `balanceCents, pendingCents` | Active (`index.ts:164`) |
| `generateQrToken` | `qr/generateQrToken.ts` | `lib/firebase/musician_service.dart:182` | Auth (Performer) | `performerId, sessionId, ttlSeconds` | `qrToken, qrUrl, expiresAt` | Active (`index.ts:124`) |
| `createConnectLink` | `connect/createConnectLink.ts` | `lib/firebase/musician_service.dart:190` | Auth (Performer) | `refreshUrl, returnUrl` | `accountLinkUrl` | Active (`index.ts:128`) |
| `getConnectStatus` | `connect/getConnectStatus.ts` | `lib/firebase/musician_service.dart:196` | Auth (Performer) | none | `chargesEnabled, payoutsEnabled, detailsSubmitted` | Active (`index.ts:129`) |
| `requestPayout` | `payout/requestPayout.ts` | `lib/firebase/musician_service.dart:268` | Auth (Eligible Creator) | `creatorId, creatorType, amountCents, currency, idempotencyKey` | `payoutId, status` | Active (`index.ts:153`) |
| `createSetupIntent` | `payment/setupPaymentMethod.ts` | `lib/firebase/payment_service.dart:64` | Auth | none | `clientSecret` | Active (`index.ts:59`) |
| `listPaymentMethods` | `payment/listPaymentMethods.ts` | `lib/firebase/payment_service.dart:135` | Auth | none | `paymentMethods: []` | Active (`index.ts:60`) |
| `setDefaultPaymentMethod`| `payment/setDefaultPaymentMethod.ts` | `lib/firebase/payment_service.dart:151` | Auth | `paymentMethodId` | `success` | Active (`index.ts:61`) |
| `requestRefund` | `tip/requestRefund.ts` | `lib/firebase/tip_service.dart:102` | Auth | `tipId, reason` | `refundId, status` | Active (`index.ts:52`) |
| `onCompleteOnboarding` | `auth/onCompleteOnboarding.ts` | `lib/ui/onboarding/onboarding_helpers.dart:28` | Auth | `personaType, activePersonas, handle` | `success, claims` | Active (`index.ts:46`) |
| `completeUniversalOnboarding`| `onboarding/onboardingCallables.ts` | `lib/ui/onboarding/universal/universal_onboarding_wizard.dart:121` | Auth | `handle, displayName, bio, personaType` | `success` | Active (`index.ts:247`) |
| `getNearbyLivePerformers` | `session/nearbyPerformerCallables.ts` | `lib/data/services/camera_nearby_service.dart:39` | None | `latitude, longitude, radiusMeters` | `performers: []` | Active (`index.ts:297`) |

---

## 4. Persona & Role Contract Alignment

### 4.1 Identified Inconsistencies Across Codebase
* In mobile `apps/mobile/lib/data/models/roles.dart`: Persona types are `'fan'`, `'artist'`, `'band'`, `'sponsor'`.
* In `apps/functions/src/payout/requestPayout.ts:42`: `ALLOWED_TYPES = ['solo', 'band']`.
* In `apps/functions/src/session/startSession.ts:35`: `allowedTypes = ['artist', 'band']`.
* In mobile `apps/mobile/lib/state/creator_context_state.dart`: Persona types use `'solo'` vs `'band'`.
* In `apps/mobile/lib/main.dart:73-82`: `cbAuthRedirect` checks `personaType == 'staff'` and attempts redirect to non-existent `/staff`.

### 4.2 Canonical Proposed Persona Mapping
| UI Persona Label | Canonical Internal ID | Cloud Functions Value | Firestore Profile Collection | Allowed Studio Routing |
|---|---|---|---|---|
| **Guest** | `guest` | Unauthenticated | None | Restricted to public screens (`/`, `/nearby`, `/artist/:id`, `/band/:slug`, `/qr/scan`, `/tip/:id`) |
| **Fan** | `fan` | `fan` | `/fanProfiles/{uid}` | Cannot access `/creator` or `/band` (Enforced in router) |
| **Solo Musician** | `solo` (aliases: `artist`, `musician`) | `artist` / `solo` | `/artistProfiles/{uid}` | Permitted access to `/creator` studio |
| **Band** | `band` | `band` | `/bands/{bandId}` | Permitted access to `/band` studio & `/creator` (band context) |

---

## 5. Financial & Fee Contract Matrix

### 5.1 Authoritative Server Fee Calculation (`apps/functions/src/tip/createTipIntent.ts:74-95`)
* **Gross Tip Amount:** Paid in full by the Fan (e.g., $10.00 = 1000 cents).
* **Platform Fee:** **6% flat** deducted from the gross tip amount ($0.60 = 60 cents).
* **Stripe Processing Fee:** Absorbed by the Platform / accounted for separately; NOT deducted from the creator's gross receipt in the initial calculation.
* **Creator Net Amount:** **94% of Gross Tip** ($9.40 = 940 cents).

### 5.2 Mobile Display vs. Server Reality (P0 Discrepancy B-05)
* **Mobile Tip Confirmation Sheet (`apps/mobile/lib/ui/fan/tip/tip_confirmation_sheet.dart:82-95`):**
  - Displays a hardcoded calculation deducting Stripe fee (2.9% + $0.30) from the creator payout.
  - **Correction Requirement for Phase 5:** Mobile UI must display **server-authoritative numbers** directly returned from `createTipIntent` callable (`platformFeeCents`, `netCreatorCents`, `grossAmountCents`). No client-side fee formula may be rendered.
* **Instant Payout Promise (P0 Discrepancy B-11):**
  - `apps/mobile/lib/ui/creator/finance/creator_payout_request_sheet.dart:94-118` claims "Instant Payout (1% fee)".
  - Server `requestPayout.ts` only supports standard Stripe Connect transfers (typically 2-business-day rolling basis).
  - **Correction Requirement:** UI copy must be corrected to "Standard Payout (2-3 business days)" and eliminate all references to instant transfers.

---

## 6. Security & Rules Compatibility Risks (P0 Blockers)

1. **B-01 (Stripe Webhook Bypass):** `functions/src/lib/stripe.ts:176-178` accepts unverified events if `stripe-signature` starts with `sig_mock`. Must be patched prior to production release.
2. **B-02 (Raw PAN Collection in Plain Form):** `apps/mobile/lib/ui/fan/payment/cb_card_input_sheet.dart` collects raw credit card numbers and CVC in plain `TextFormField` widgets. Must be replaced with Stripe SDK `CardField` or `PaymentSheet`.
3. **B-03 (Client Fake Success on Error):** `apps/mobile/lib/firebase/tip_service.dart:53-92` catches callable exceptions and generates a fake local successful tip document. Must be removed so actual server status dictates the UI.
4. **B-04 (QR HMAC Dev Secret Bypass):** `apps/mobile/lib/firebase/tip_service.dart:150` allows `test_` prefixes to bypass verification.
5. **B-20 (GoRouter Persona Authorization Gap):** `cbAuthRedirect` in `apps/mobile/lib/main.dart:58-95` only validates authentication, not persona permissions. Authenticated Fans can navigate directly to `/creator` and `/band`. A persona-level guard is mandatory.
