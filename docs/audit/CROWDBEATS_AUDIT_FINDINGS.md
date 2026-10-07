# Crowdbeats V2 — Comprehensive Audit Findings & Defect Register

**Audit Date:** 2026-10-04  
**Evaluator:** Antigravity Lead Agent (incorporating specialist auditor findings & lead verification)  
**Branch:** `audit/multi-agent-quality-2026-10`  
**Repository State:** Clean-room rebuild with ~250 pre-existing working tree files preserved.

---

## 1. Executive Summary & Defect Severity Matrix

| Priority | Definition | Total Found | Fixed In This Audit | Open / Remaining |
|---|---|:---:|:---:|:---:|
| **P0** | Unauthorized access, financial integrity failures, exposed secrets, data loss | 4 | 4 | 0 |
| **P1** | Blocked core user journeys, incorrect transaction states, broken role boundaries | 6 | 3 | 3 |
| **P2** | Confusing transitions, inconsistent behavior, accessibility, recovery problems | 8 | 2 | 6 |
| **P3** | Visual polish, terminology alignment, non-essential refinements | 3 | 0 | 3 |
| **TOTAL** | | **21** | **9** | **12** |

---

## 2. P0: Critical Vulnerabilities & Financial Integrity

### SEC-01: Client Direct Fabrication of `availableBalanceCents` & Status via Firestore Create Rule
- **Severity:** P0
- **Status:** **FIXED** (Verified via Firestore Emulator inband suite)
- **Affected Files:** `firebase/firestore.rules` (lines 229–250)
- **Root Cause:** The `allow create` rule for `artistProfiles/{artistId}` validated only that the caller's UID matched `artistId` or `ownerUid`, without restricting initial document fields. A signed-in user could send `availableBalanceCents: 5000000` ($50,000) directly via the client SDK on creation.
- **Downstream Effect:** Once the user completed standard Stripe Connect KYC, calling `requestPayout` would read `availableBalanceCents` from the profile and transfer actual platform treasury funds to the attacker's connected bank account.
- **Fix Applied:** Hardened `artistProfiles` create rule with a strict exclusion list forbidding initial client specification of: `availableBalanceCents`, `totalTipsReceivedCents`, `totalPaidOutCents`, `tipCount`, `stripeAccountId`, `stripeConnectAccountId`, `bankLinked`, `verifiedAt`, `chargesEnabled`, `isSuspended`, `suspendedAt`, `complianceHold`, `payoutHoldReason`, `monetizationStatus`, `isDemonetized`, and `stripeChargesEnabled`. Also hardened `immutableOnUpdate` to prevent post-creation modifications.

### ADM-01: Unconditional Self-Elevation to `SUPER_ADMIN` in `bootstrapSuperAdmin`
- **Severity:** P0
- **Status:** **FIXED** (Verified via code inspection & `npm run functions:typecheck`)
- **Affected Files:** `apps/functions/src/admin/bootstrapSuperAdmin.ts` (lines 27–42)
- **Root Cause:** The function read `process.env.BOOTSTRAP_SECRET_KEY`. When the secret was unconfigured (as was the case in the default environment), the secret comparison block was skipped entirely. Furthermore, if no `users` document had `platformRole == 'SUPER_ADMIN'`, the function granted the role regardless of the secret provided.
- **Downstream Effect:** Any authenticated caller could invoke `bootstrapSuperAdmin({})` and receive root `SUPER_ADMIN` custom claims and Firestore document rights, completely bypassing role-based access control.
- **Fix Applied:** Enforced mandatory server-side configuration of `BOOTSTRAP_SECRET_KEY` (fail-closed with `failed-precondition` if missing) and mandatory equality between `secretKey` and `envSecret` (throwing `permission-denied` on mismatch).

### ADM-03: `approveStaffRefund` Bypasses Stripe API (Phantom Refund)
- **Severity:** P0
- **Status:** **FIXED** (Verified via `enterpriseGovernance.test.ts` 11/11 PASS)
- **Affected Files:** `apps/functions/src/admin/approveStaffRefund.ts`, `apps/functions/src/lib/stripe.ts`
- **Root Cause:** When Customer Support or Finance staff approved a refund via `approveStaffRefund`, the function updated Firestore `tips/{tipId}.status = 'refunded'` and wrote reverse ledger entries in `paymentLedger`, but **never invoked `stripe.createRefund()`**.
- **Downstream Effect:** The fan never received their funds back on their card; the creator's ledger balance was decremented; the platform maintained the funds at Stripe while creating an unreconciled ledger disparity.
- **Fix Applied:** Injected `stripe.createRefund(tipData.stripePaymentIntentId, tipData.amountCents, 'staff_refund_' + tipId)`. Recorded `stripeRefundId` on the tip document, reverse debit/credit ledger records, and audit events. Deducted recipient's `availableBalanceCents` atomically.

### PAY-02: Self-Service Refund Leaves Creator Balance Intact (Platform Capital Loss)
- **Severity:** P0
- **Status:** **FIXED** (Verified via `requestRefund.test.ts` 10/10 PASS)
- **Affected Files:** `apps/functions/src/tip/requestRefund.ts`, `apps/functions/src/admin/approveStaffRefund.ts`
- **Root Cause:** When a fan triggered a 24-hour self-service refund via `requestRefund`, the function successfully created a Stripe refund (`stripe.createRefund`), updated tip status, and wrote `paymentLedger` entries, but **never decremented `artistProfiles/{recipientId}.availableBalanceCents`**.
- **Downstream Effect:** A creator could receive a tip and immediately cash out via `requestPayout`. If the fan then exercised their 24-hour refund right, Stripe pulled the funds from platform reserves, leaving the platform with a negative net cash flow.
- **Fix Applied:** Atomically decremented recipient's `availableBalanceCents` by `netAmountCents` in the refund batch in `requestRefund.ts` and in `approveStaffRefund.ts`. Passed `fan_refund_${tipId}` idempotency key to Stripe.

---

## 3. P1: Blocked User Journeys & State Integrity Failures

### UX-01: GoRouter Re-instantiation Kicks Mobile Users to Home on Settings/Theme Toggle
- **Severity:** P1
- **Status:** **FIXED** (Verified via `flutter test test/widget_test.dart`)
- **Affected Files:** `apps/mobile/lib/main.dart` (lines 100, 244)
- **Root Cause:** `_buildRouter(ref)` was called directly inside `CrowdbeatsV2App.build()`. Because `CrowdbeatsV2App` watched `userSettingsProvider`, whenever a user toggled a notification preference, privacy setting, or theme mode, the build method re-executed, instantiated a brand new `GoRouter` instance, and reset navigation to `initialLocation` (`/fan` or `/preview`).
- **Downstream Effect:** Journey E (Settings and Account Lifecycle) was completely unusable on mobile; every setting toggle interrupted the journey and ejected the user back to the home feed.
- **Fix Applied:** Encapsulated `_buildRouter` inside a persistent Riverpod `Provider<GoRouter>` (`routerProvider`), and watched the provider inside `CrowdbeatsV2App.build()`. Router state is now preserved across theme and setting changes.

### FAN-04: Guest Tipping Drops Intended Musician Context Across Sign-In
- **Severity:** P1
- **Status:** **FIXED** (Verified via `apps/web` tests 330/330 PASS, `apps/mobile` tests 301/301 PASS)
- **Affected Files:** `apps/web/app/auth/page.tsx`, `apps/web/app/artist/[slug]/ArtistProfileClientView.tsx`, `apps/web/app/band/[slug]/BandProfileClientView.tsx`, `apps/mobile/lib/main.dart`, `apps/mobile/lib/ui/fan/tip/tip_auth_gate_modal.dart`, `apps/mobile/lib/ui/fan/public_profile_screen.dart`
- **Root Cause:** When an unauthenticated guest clicked "Tip", authentication redirects dropped the query parameters (`returnUrl`, `tipCents`) or redirected to the default fan dashboard, forcing users to search for the performer again.
- **Downstream Effect:** Violated Product Rule 3: "Preserve the intended musician and user action across sign-in, cancellation, and retry."
- **Fix Applied:** Implemented safe `returnUrl` parsing and redirect in web `/auth` (preserving query params across login/register tab switches). Connected `ArtistProfileClientView` and `BandProfileClientView` to resume pending tips automatically to `/fan/tip` with the selected amount upon returning from auth. In mobile, added `from` query parameter redirect in `GoRouter` and connected `PublicProfileScreen` to automatically present `TipConfirmationSheet` when returning authenticated with a pending tip.

### FAN-03: Web Performer Profiles Rely on Mock Slugs in Production Static Export
- **Severity:** P1
- **Status:** **OPEN**
- **Affected Files:** `apps/web/app/artist/[slug]/page.tsx`, `apps/web/app/band/[slug]/page.tsx`, `firebase.json`
- **Root Cause:** The production build executes `next build` without SSR (App Hosting is disabled due to project billing). `generateStaticParams` pre-renders only 4 hard-coded mock artist slugs. Unknown slugs fall back to fabricated mock data (`'The Main Stage'`, `distanceMiles: 0.3`). Furthermore, `firebase.json` lacks rewrites for dynamic paths like `/artist/**`, causing real artist URLs to route to `/index.html`.
- **Downstream Effect:** QR codes scanned by fans in physical venues lead to 404 or index fallbacks unless client-side dynamic resolution via `resolveCreatorBySlug` is implemented.
- **Proposed Fix:** Add Firebase Hosting rewrite `{ "source": "/artist/**", "destination": "/artist/[slug].html" }` or provide a client-side resolver component in `[slug]/page.tsx` that queries Firestore when the slug is not in static params.

### CRE-04: Double Payout Risk on Post-Transfer Firestore Failure
- **Severity:** P1
- **Status:** **FIXED** (Verified via `requestPayout.test.ts` 7/7 PASS, `type-check` PASS)
- **Affected Files:** `apps/functions/src/payout/requestPayout.ts`, `apps/functions/src/lib/stripe.ts`
- **Root Cause:** If `payoutRef.update({ status: 'paid' })` failed after `stripe.createTransfer()` succeeded, the catch block caught the error and **restored the user's available balance** (`availableBalanceCents: increment(amountCents)`). Furthermore, `stripe.createTransfer()` was called without a Stripe `idempotencyKey`.
- **Downstream Effect:** A transient Firestore network error after a successful Stripe transfer resulted in the creator receiving the transfer at Stripe *and* getting their balance restored in Firestore, enabling duplicate withdrawals.
- **Fix Applied:** Passed deterministic `idempotencyKey: payout_${payoutId}` to `stripe.createTransfer()`. Split error handling: balance is only rolled back if `stripe.createTransfer()` throws an error. If the transfer succeeds but the payout document update encounters an error, the balance is NOT refunded to the creator; instead a critical error is logged for audit reconciliation.

### ADM-02: Client-Side Layout Guard Uses Unsigned Plaintext Cookie
- **Severity:** P1
- **Status:** **FIXED** (Verified via `apps/web` typecheck PASS, `apps/web` test suite 330/330 PASS)
- **Affected Files:** `apps/web/app/(admin)/layout.tsx` (lines 12–16, 126–175)
- **Root Cause:** `EnterpriseAdminLayout` inspected `document.cookie` for `__cb_session` and parsed `platformRole`. The cookie was neither cryptographically signed nor `HttpOnly`.
- **Downstream Effect:** Any authenticated user could set `document.cookie = '__cb_session=' + JSON.stringify({ platformRole: 'SUPER_ADMIN' })` in browser DevTools and view the enterprise control plane UI.
- **Fix Applied:** Integrated Firebase Auth `onAuthStateChanged` and `currentUser.getIdTokenResult()` into `EnterpriseAdminLayout`. The layout now cryptographically verifies `tokenResult.claims.platformRole` or `role` against `VALID_STAFF_ROLES` before granting access, while preserving a secondary fallback for headless mock test environments.

### PAY-01: Premature Webhook Dedup Marker Blocks Retries on Processing Failure
- **Severity:** P1
- **Status:** **FIXED** (Verified via `webhookHandler.test.ts` 8/8 PASS, `functions` typecheck PASS)
- **Affected Files:** `apps/functions/src/tip/webhookHandler.ts` (lines 66–160)
- **Root Cause:** `webhookHandler` wrote the deduplication document to `/webhookEvents/{eventId}` *before* invoking the specific event handler (`_handlePaymentSucceeded`). If the event handler encountered a Firestore transaction timeout, the catch block returned HTTP 200 to Stripe, preventing retries while marking the event as already handled.
- **Downstream Effect:** Stripe did not retry because it received HTTP 200. If the event was later resent manually, the dedup check returned immediately, permanently stranding the creator's balance credit.
- **Fix Applied:** Implemented a full state lifecycle: records are initially stored with `status: 'PROCESSING'`. Upon successful handler completion, the record transitions to `status: 'COMPLETED'`. If a transient exception occurs, the record is flagged with `status: 'ERROR'` and the function returns HTTP 500 so Stripe will retry. Duplicate checks now allow retrying errored events and only deduplicate `COMPLETED` events.

---

## 4. P2: Usability, Consistency & Recovery Deficiencies

### PAY-03: Rate Limiter Fails Open in Production on Firestore Errors
- **Severity:** P2
- **Status:** **FIXED** (Verified via `securityAndAbuseProtection.test.ts`)
- **Affected Files:** `apps/functions/src/lib/rateLimiter.ts` (lines 72, 148–163)
- **Root Cause:** The catch block in `checkRateLimit` returned `allowed: true` on any Firestore error, with a comment stating "failing open for resilience in test mock". In production, contention or outage completely bypassed rate limiting.
- **Fix Applied:** Added `failClosed?: boolean` to `CheckRateLimitOptions`. Set production default to fail closed (`allowed: false`) while keeping fail-open resilience in emulator and Jest test environments.

### UX-02: Broken Light Appearance on Mobile Due to Hard-Coded Dark Hex Colors
- **Severity:** P2
- **Status:** **OPEN**
- **Affected Files:** `apps/mobile/lib/ui/theme/cb_colors.dart`, across 140+ mobile UI widgets
- **Root Cause:** Mobile screens reference static `CbColors.textPrimary` (`#FFFFFF`) or `Colors.white` directly instead of resolving colors dynamically from `Theme.of(context).colorScheme` or `CbThemeExtension`. When the system theme switches to Light mode, the scaffold background turns light grey (`#F9FAFB`) while the text remains pure white, rendering it invisible.
- **Proposed Fix:** Migrate text and card widgets to use `Theme.of(context).colorScheme.onSurface` and theme extension tokens.

### PAY-06: Out-of-Order Webhook Overwrites `succeeded` with `failed`
- **Severity:** P2
- **Status:** **FIXED** (Verified via `webhookHandler.test.ts` 8/8 PASS)
- **Affected Files:** `apps/functions/src/tip/webhookHandler.ts` (lines 360–378)
- **Root Cause:** `_handlePaymentFailed` blindly called `update({ status: 'failed' })` without checking if the tip document was already in `'succeeded'` status.
- **Downstream Effect:** An out-of-order `payment_failed` Stripe webhook arriving after `payment_intent.succeeded` could mark a successfully settled tip as failed.
- **Fix Applied:** Added pre-flight check in `_handlePaymentFailed`: reads the tip document and ignores late failure events if status is already `'succeeded'` or `'refunded'`. Added unit test covering this scenario.

### PAY-07: `transfer.created` Incorrectly Booked as Platform Fee Revenue
- **Severity:** P2
- **Status:** **OPEN**
- **Affected Files:** `apps/functions/src/tip/webhookHandler.ts` (lines 344–373)
- **Root Cause:** The handler groups `transfer.created` under `_handleApplicationFeeAndTransferEvents`, which adds a `PLATFORM_FEE_CREDIT` ledger entry for `amountCents`.
- **Proposed Fix:** Distinguish transfer events from fee events, booking transfers as `CREATOR_PAYOUT_TRANSFER` debits rather than platform fee credits.

### ADM-04: Hard-Coded 600 BPS Platform Fee Bypasses Platform Fee Engine
- **Severity:** P2
- **Status:** **OPEN**
- **Affected Files:** `apps/functions/src/tip/createTipIntent.ts` (lines 11, 27, 160)
- **Root Cause:** `createTipIntent.ts` hard-codes `const PLATFORM_FEE_BPS = 600;`, ignoring the dynamic fee rules managed by `platformFeeEngine.ts` and `platformFeeCallables.ts`.
- **Proposed Fix:** Integrate `evaluatePlatformFeeQuote()` from `platformFeeEngine.ts` into `createTipIntent`, falling back to 600 bps default if no specific override is active.

### SPN-01: Sponsor Talent Discovery Shows Mock Data in Production
- **Severity:** P2
- **Status:** **OPEN**
- **Affected Files:** `apps/web/app/(sponsor)/sponsor/discovery/page.tsx`
- **Root Cause:** Talent comparison and discovery feed render static mock arrays instead of fetching active verified artists from Firestore.
- **Proposed Fix:** Wire Firestore `artistProfiles` collection query with filter on `isVerified == true` and `monetizationStatus == 'ACTIVE'`.

### CRE-07: Stripe SDK API Version Drift
- **Severity:** P2
- **Status:** **OPEN**
- **Affected Files:** `apps/functions/src/lib/stripe.ts` (`2026-07-29.dahlia`), `apps/functions/src/campaign/publishCampaign.ts` (`2025-06-30.basil`)
- **Root Cause:** Different Cloud Functions instantiate Stripe with different API version strings.
- **Proposed Fix:** Consolidate all Stripe client instances through `apps/functions/src/lib/stripe.ts`.

### VEN-01: Next.js API Route Handlers Return 404/HTML in Static Hosting
- **Severity:** P2
- **Status:** **OPEN**
- **Affected Files:** `apps/web/app/api/**`, `firebase.json`
- **Root Cause:** Next.js route handlers (`/api/user/profile`, `/api/user/settings`, `/api/user/image`) require a Node.js server. The production deployment uses static export to Firebase Hosting.
- **Proposed Fix:** Update web components to call corresponding Firebase Cloud Functions (`userSettingsCallables`, `uploadProfileImage`) directly via Firebase SDK.

---

## 5. P3: Polish & Terminology Inconsistencies

### UX-03: Misleading Tax Deductibility Language on Tip Receipts
- **Severity:** P3
- **Status:** **OPEN**
- **Affected Files:** `apps/web/components/receipts/TipReceiptModal.tsx`
- **Root Cause:** Receipt copy refers to tips as "tax-deductible contribution summaries". Tips to musicians are gifts or taxable income, not 501(c)(3) tax-deductible donations.
- **Proposed Fix:** Update text to: "Direct musician support summary — tips are personal contributions and not tax-deductible."

### UX-04: Terminology Drift Across Surfaces (Tip vs. Support vs. Donation)
- **Severity:** P3
- **Status:** **OPEN**
- **Affected Files:** Various web and mobile UI headers
- **Proposed Fix:** Standardize on "Tip" for live performances and "Back" / "Contribution" for campaigns.

### UX-05: Non-Standard Persona Accent Colors in Band Shell
- **Severity:** P3
- **Status:** **OPEN**
- **Affected Files:** `apps/web/app/(band)/layout.tsx`
- **Proposed Fix:** Align band shell accent tokens with the authoritative Stitch design palette (`.stitch/DESIGN.md`).
