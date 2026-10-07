# Crowdbeats V2 — Changelog & Handoff Guide

**Release / Audit Branch:** `audit/multi-agent-quality-2026-10`  
**Date:** 2026-10-04  
**Author:** Antigravity Lead Agent  
**Baseline Git Commit:** `56b7b89` (carried over all ~250 pre-existing uncommitted user changes intact)

---

## 1. Summary of Changes Implemented & Verified

### Security & Firestore Rules Hardening (Batch B1: SEC-01 & SEC-04 / P0)
- **`firebase/firestore.rules`:**
  - **`match /users/{userId}`:** Disallowed direct client document creation (`allow create: if false;`), ensuring only the server-side `onCreateUser` auth trigger can initialize user records. Added optimistic concurrency enforcement on update (`v == resource.data.v + 1`).
  - **`match /artistProfiles/{artistId}`:** Added a strict create-time field exclusion list forbidding clients from providing `availableBalanceCents`, `totalTipsReceivedCents`, `totalPaidOutCents`, `tipCount`, `stripeAccountId`, `stripeConnectAccountId`, `bankLinked`, `verifiedAt`, `chargesEnabled`, `isSuspended`, `suspendedAt`, `complianceHold`, `payoutHoldReason`, `monetizationStatus`, `isDemonetized`, or `stripeChargesEnabled`. Expanded `immutableOnUpdate` to prevent post-creation modifications to moderation, hold, or balance fields.
  - **`match /bands/{bandId}`:** Added create exclusions and an exhaustive `immutableOnUpdate` guard on financial and moderation attributes (`totalTipsReceivedCents`, `availableBalanceCents`, `isSuspended`, `complianceHold`, `monetizationStatus`).
  - **`match /venueProfiles/{venueId}` & `/sponsorOrgs/{orgId}`:** Added create exclusions and `immutableOnUpdate` protection for `bankLinked`, `verifiedAt`, `isVerified`, and `totalEscrowDepositedCents`.
- **`firebase/tests/package.json`:**
  - Added `--runInBand` flag to `npm test` script to eliminate Firestore emulator race conditions caused by concurrent Jest worker processes wiping shared emulator database state.
- **`firebase/tests/firestore.test.ts`:**
  - Updated legacy direct client create test on `/reports` to assert failure (`assertFails`), correctly reflecting the production architecture requirement that abuse reports must be submitted via the `submitReport` Cloud Function.
- **Verification:** Ran full Firestore Emulator suite with `--runInBand`: **2 test suites passed, 83/83 tests passed (100%)**.

### Authentication & Bootstrap Governance Fix (Batch B8: ADM-01 / P0)
- **`apps/functions/src/admin/bootstrapSuperAdmin.ts`:**
  - Added strict check requiring `process.env.BOOTSTRAP_SECRET_KEY` to be defined and non-empty on the server, throwing `failed-precondition` if missing.
  - Required exact equality between `secretKey` and `envSecret`, eliminating the vulnerability where an unconfigured secret or empty database query permitted unauthenticated self-elevation to `SUPER_ADMIN`.
- **Verification:** `npm run type-check` in `apps/functions` exited with code 0.

### Staff Refund Execution & Balance Deductions (Batch B2: ADM-03 / P0)
- **`apps/functions/src/admin/approveStaffRefund.ts`:**
  - Connected `stripe.createRefund()` with deterministic idempotency key `staff_refund_${tipId}`.
  - Added atomic deduction of `netAmountCents` from `artistProfiles/{recipientId}.availableBalanceCents`.
  - Added reverse ledger write (`REVERSAL_DEBIT` / `STAFF_REFUND_APPROVED`) and audit logging (`REFUND_APPROVED`).
- **Verification:** `npm run type-check` in `apps/functions` exited with code 0; `enterpriseGovernance.test.ts` (11/11 PASS).

### Fan Tip Refund Creator Balance Deduction (Batch B3: PAY-02 / P0)
- **`apps/functions/src/tip/requestRefund.ts`:**
  - Added atomic decrement of `artistProfiles/{recipientId}.availableBalanceCents` upon refund confirmation, closing the double-spend vulnerability where musicians could withdraw tips already refunded to fans.
  - Recorded `stripeRefundId` and immutable reverse ledger entries.
- **Verification:** `apps/functions/src/tip/__tests__/requestRefund.test.ts` (10/10 PASS).

### Connect Payout Idempotency & Post-Transfer Isolation (Batch B4: CRE-04 / P1)
- **`apps/functions/src/payout/requestPayout.ts` & `apps/functions/src/lib/stripe.ts`:**
  - Passed deterministic `idempotencyKey: payout_${payoutId}` to `stripe.createTransfer()`.
  - Decoupled Stripe transfer failure handling from Firestore document update handling: if `stripe.createTransfer()` succeeds but updating the payout document encounters a network glitch, creator balance is **never** mistakenly refunded back into their wallet.
- **Verification:** Created dedicated test suite `apps/functions/src/payout/__tests__/requestPayout.test.ts` (7/7 PASS).

### Guest Tip Continuation Across Auth (Batch B5: FAN-04 / P1)
- **`apps/web/app/auth/page.tsx`:** Preserved `returnUrl`, `return`, `from`, `action`, `tipCents`, and artist context across login/register tab switches and authenticated redirects.
- **`apps/web/app/artist/[slug]/ArtistProfileClientView.tsx` & `BandProfileClientView.tsx`:** Added automatic resumption hook: when an authenticated user returns with a pending tip intent or URL params, the view auto-navigates directly to `/fan/tip` with target artist and amount intact.
- **`apps/mobile/lib/main.dart`:** Added `from` query param parsing in GoRouter to redirect authenticated users back to their origin screen.
- **`apps/mobile/lib/ui/fan/tip/tip_auth_gate_modal.dart`:** Embedded `returnUrl` into navigation path upon tapping "Sign In to Complete Tip".
- **`apps/mobile/lib/ui/fan/public_profile_screen.dart`:** Auto-presents `TipConfirmationSheet` when returning authenticated with pending tip state.
- **Verification:** Web test suite (330/330 PASS), mobile test suite (301/301 PASS).

### Webhook Idempotency Lifecycle & State Machine Transitions (Batch B6: PAY-01 & PAY-06 / P1 & P2)
- **`apps/functions/src/tip/webhookHandler.ts`:**
  - Implemented explicit `PROCESSING -> COMPLETED / ERROR` lifecycle for deduplication records in `/webhookEvents/{eventId}`.
  - Allowed retries for failed/transient errors while deduplicating completed events.
  - Returned HTTP 500 on transient handler exceptions so Stripe automatically retries.
  - In `_handlePaymentFailed`, added guard checking current tip status before writing `failed`: ignores out-of-order failure events if tip has already reached `succeeded` or `refunded`.
- **`apps/functions/src/tip/__tests__/webhookHandler.test.ts`:**
  - Added unit test asserting completed events are skipped without reprocessing.
  - Added unit test asserting late `payment_intent.payment_failed` events do not overwrite `succeeded` tips.
- **Verification:** `webhookHandler.test.ts` (8/8 PASS).

### Enterprise Admin Layout Token Claim Verification (Batch B7: ADM-02 / P1)
- **`apps/web/app/(admin)/layout.tsx`:**
  - Replaced insecure client inspection of plaintext `__cb_session` cookie with cryptographic verification of Firebase Auth custom claims via `currentUser.getIdTokenResult()`.
  - Checks `tokenResult.claims.platformRole` against `VALID_STAFF_ROLES`.
  - Retained secondary fallback for headless/e2e test runners.
- **Verification:** Web typecheck PASS, `apps/web` Jest suite (330/330 PASS).

### Abuse Protection & Rate Limiting Hardening (Batch B9: PAY-03 / P2)
- **`apps/functions/src/lib/rateLimiter.ts`:**
  - Added `failClosed?: boolean` property to `CheckRateLimitOptions`.
  - Configured production runtime to fail closed (`allowed: false`) when Firestore operations fail or encounter contention, while maintaining fail-open resilience in emulator and Jest testing environments.
- **Verification:** `securityAndAbuseProtection.test.ts`: **13/13 tests passed (100%)**.

### Mobile Navigation Resilience Fix (Batch B10: UX-01 / P1)
- **`apps/mobile/lib/main.dart`:**
  - Refactored `_buildRouter` into a persistent Riverpod `routerProvider`.
  - Replaced `final router = _buildRouter(ref)` inside `CrowdbeatsV2App.build()` with `final router = ref.watch(routerProvider)`.
  - Prevents `GoRouter` from being re-instantiated and resetting to `/fan` or `/preview` whenever the user toggles notification, privacy, or theme settings.
- **Verification:** `flutter test test/widget_test.dart --no-pub`: **All tests passed (100%)**.

---

## 2. Configuration & Environment Requirements

1. **Bootstrap Secret Configuration:**
   - In Google Cloud Secret Manager (or Firebase Functions environment configuration for production), set `BOOTSTRAP_SECRET_KEY` to a cryptographically secure 32+ character random string before calling `bootstrapSuperAdmin`.
2. **Stripe Test Mode Keys:**
   - For local and staging end-to-end payment verification, configure `STRIPE_SECRET_KEY=sk_test_...` and `STRIPE_WEBHOOK_SECRET=whsec_...` in `apps/functions/.env.local`. **NEVER** use `sk_live_...` in non-production environments.
3. **Rate Limiting Salt:**
   - Define `RATE_LIMIT_SALT` in Secret Manager to ensure zero-PII HMAC hashes are non-invertible across environments.

---

## 3. Rollback Instructions

If any regression occurs in any batch:
```bash
# To revert rules changes:
git checkout 56b7b89 -- firebase/firestore.rules firebase/tests/firestore.test.ts firebase/tests/package.json

# To revert functions changes:
git checkout 56b7b89 -- apps/functions/src/admin/ apps/functions/src/tip/ apps/functions/src/payout/ apps/functions/src/lib/

# To revert web changes:
git checkout 56b7b89 -- apps/web/app/auth/page.tsx apps/web/app/(admin)/layout.tsx apps/web/app/artist/ apps/web/app/band/

# To revert mobile changes:
git checkout 56b7b89 -- apps/mobile/lib/main.dart apps/mobile/lib/ui/fan/
```

---

## 4. Prioritized Remaining Work (Next Waves Backlog)

### Wave 4: UI Polish & Mobile Theme Token Migration
1. **Mobile Light Theme Token Alignment (UX-02 / P2):**
   - Replace hard-coded `#FFFFFF` and dark hex colors across mobile widgets with semantic theme tokens (`Theme.of(context).colorScheme.onSurface`) to restore accessible contrast in Light mode.
2. **Web Dynamic Performer Routing in Static Export (FAN-03 / P1):**
   - Provide client-side slug resolution in `apps/web/app/artist/[slug]/page.tsx` for production Firebase Hosting.
3. **Stripe SDK API Version Consolidation (CRE-07 / P2):**
   - Consolidate Stripe client versioning across all callables through `apps/functions/src/lib/stripe.ts`.
4. **Platform Fee Engine Integration (ADM-04 / P2):**
   - Integrate `evaluatePlatformFeeQuote()` into `createTipIntent` for dynamic admin fee overrides.
