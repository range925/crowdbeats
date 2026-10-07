# Crowdbeats V2 — Cross-Role Journey Verification & Test Results

**Evaluation Date:** 2026-10-04  
**Evaluator:** Antigravity Lead Agent  
**Environment:** Local test environment (Node 20, Java 21, Flutter 3.47.1, Firebase Emulators for Firestore/Auth/Storage, Stripe live-key safety locks active)  
**Evidence Standard:** Every step explicitly distinguishes `automated-test`, `code-inspection`, `browser-interaction`, `device-test`, `simulation`, or `blocked`.

---

## Journey A: Guest to Fan Tip

| Hop / Step | Expected Behavior | Platform | Verification Method | Status | Evidence / Notes |
|---|---|---|---|---|---|
| **A.1 Discovery** | Discover a checked-in performer via Home or Nearby map/list without authentication | Mobile & Web | `automated-test` | **PASS** | `discovery_test.dart` passes. `discoveryPhase8.test.tsx` passes. |
| **A.2 Profile Access** | Open performer profile or scan rotating QR code | Mobile & Web | `automated-test` | **PASS** | `trustedCheckInAndSession.test.ts` (QR token TTL 300s verified). |
| **A.3 Tip Initiation** | Tap Tip amount button ($5, $10, $25, custom) | Mobile & Web | `code-inspection` | **PASS** | Amount selection sheet renders with presets and integer cent validation. |
| **A.4 Sign-In Gate** | Intercept unauthenticated guest with auth sheet/modal | Mobile & Web | `automated-test` | **PASS (Fixed)**| Modal displays correctly; `FAN-04` preserves target artist slug, ID, and tip amount across auth redirect. |
| **A.5 Resume Action** | Return to same performer and intended tip amount post-auth | Mobile & Web | `automated-test` | **PASS (Fixed)**| Web `/auth` redirects to `returnUrl`; `ArtistProfileClientView` & mobile `PublicProfileScreen` auto-open tip sheet with selected amount. |
| **A.6 Review & Fee Quote** | Display net tip amount, 6% platform fee, and payment method | Mobile & Web | `code-inspection` | **PARTIAL** | `createTipIntent` returns integer breakdown; UI fee disclosure does not dynamically reflect platform fee engine rules (`ADM-04`). |
| **A.7 Stripe Payment** | Process PaymentIntent in Stripe test mode | Mobile & Web | `simulation` | **BLOCKED** | Live Stripe key present in `.env` without test key. Live charge prohibited by safety rule. Logic verified via mocked tests. |
| **A.8 Authoritative State** | Update tip status only upon webhook event | Backend | `automated-test` | **PASS (Fixed)**| `webhookHandler.ts` updated with `PROCESSING -> COMPLETED` lifecycle (`PAY-01`) and out-of-order state guard (`PAY-06`). Verified in `webhookHandler.test.ts`. |
| **A.9 Duplicate Defense** | Refresh or back navigation does not duplicate charges | Mobile & Web | `code-inspection` | **PASS** | `idempotencyKey` enforced in `createTipIntent.ts:137`. Duplicate request returns existing PaymentIntent. |

---

## Journey B: Musician to Payout

| Hop / Step | Expected Behavior | Platform | Verification Method | Status | Evidence / Notes |
|---|---|---|---|---|---|
| **B.1 Registration** | Register as Solo Musician or Band | Mobile & Web | `automated-test` | **PASS** | `onboarding.test.ts` passes. Creates `users/{uid}` with `personaType: 'artist'`. |
| **B.2 Connect Onboard** | Generate Stripe Connect link and resume onboarding | Web primary | `automated-test` | **PASS** | `createConnectLink` callable returns valid Express onboarding URL; status tracked in `connect.test.ts`. |
| **B.3 Capabilities** | Reflect pending vs restricted charges/payouts | Mobile & Web | `code-inspection` | **PASS** | `eligibilityService.ts` gates tipping on `stripeChargesEnabled`. (Rules hardened in B1 to block client self-enabling). |
| **B.4 Check-In / Live** | Performer checks in to stage; appears in discovery | Mobile & Web | `automated-test` | **PASS** | `checkInCallables.test.ts` passes; stage session created with verified location coordinates. |
| **B.5 Receive Tip** | Receive test tip and update pending/available earnings | Mobile & Web | `automated-test` | **PASS** | `webhookHandler.test.ts` verifies `availableBalanceCents` increment on `artistProfiles`. |
| **B.6 Payout Request** | Request Connect payout for available balance (>= $10) | Web & Mobile | `automated-test` | **PASS (Fixed)**| `requestPayout.ts` passes deterministic `idempotencyKey` (`CRE-04`), isolates transfer failures from doc updates, and deducts creator balance on refund (`PAY-02`). Verified in `requestPayout.test.ts` (7/7 PASS). |
| **B.7 Settlement State** | Reflect pending / paid / failed payout states | Web & Mobile | `code-inspection` | **PASS** | Payout status transitions tracked in Firestore `/payouts/{id}`. |

---

## Journey C: Band Collaboration

| Hop / Step | Expected Behavior | Platform | Verification Method | Status | Evidence / Notes |
|---|---|---|---|---|---|
| **C.1 Invitation** | Band founder invites new member via email | Web & Mobile | `automated-test` | **PASS** | `band.test.ts` verifies invitation generation and storage in subcollection. |
| **C.2 Acceptance** | Invitee accepts; assigned band role | Web & Mobile | `automated-test` | **PASS** | `respondToBandInvitation` updates member status and grants band context permissions. |
| **C.3 Revenue Splits** | Validate split configuration totals exactly 10,000 bps | Backend | `automated-test` | **PASS** | `setBandSplitConfig` validates sum = 10,000. `firestore.rules` blocks direct client writes to `/splitConfig`. |
| **C.4 Payout Visibility** | Band members view individual payout ledgers | Web & Mobile | `code-inspection` | **PASS** | Members read individual allocated splits; founder manages treasury. |
| **C.5 Member Removal** | Member leaves or is removed; access revoked immediately | Web & Mobile | `automated-test` | **PASS** | `removeBandMember` callable revokes membership; historical tip records remain intact in ledger. |
| **C.6 Cross-Band Isolation**| Member of Band A cannot access Band B's private treasury | Backend | `automated-test` | **PASS** | `firestore.test.ts` cross-band isolation tests pass (83/83 inband). |

---

## Journey D: Campaigns & Sponsorship

| Hop / Step | Expected Behavior | Platform | Verification Method | Status | Evidence / Notes |
|---|---|---|---|---|---|
| **D.1 Campaign Draft** | Musician drafts crowdfunding campaign with reward tiers | Web primary | `automated-test` | **PASS** | `campaign.test.ts` passes. |
| **D.2 Campaign Publish**| Creator publishes campaign; generates Stripe Product | Web primary | `code-inspection` | **PARTIAL** | API version discrepancy between `publishCampaign.ts` (`2025-06-30.basil`) and `stripe.ts` (`2026-07-29.dahlia`). |
| **D.3 Sponsor Org** | Sponsor rep registers organization and invites staff | Web primary | `automated-test` | **PASS** | `sponsor.test.ts` passes. `firestore.rules` hardened to prevent client setting `isVerified`. |
| **D.4 Escrow & Matching**| Sponsor deposits escrow and launches match pool | Web primary | `automated-test` | **PASS** | `createMatchPool.ts` validates `matchRatioBps` and deposit constraints. |
| **D.5 Talent Shortlist**| Sponsor compares up to 4 creators and messages talent | Web primary | `code-inspection` | **PARTIAL** | Discovery page displays sample data; full Firestore talent search partially connected. |

---

## Journey E: Settings & Account Lifecycle

| Hop / Step | Expected Behavior | Platform | Verification Method | Status | Evidence / Notes |
|---|---|---|---|---|---|
| **E.1 Profile Editing** | Edit stage name, bio, and upload profile image | Web & Mobile | `code-inspection` | **PASS** | `uploadProfileImage` validates PNG/JPEG/WEBP formats and 5MB size limit. |
| **E.2 Preference Toggle**| Toggle notifications, theme mode, and privacy controls | Mobile | `automated-test` | **PASS (Fixed)**| Previously reset GoRouter on every toggle (`UX-01`); fixed by lead via `routerProvider`. Verified in `widget_test.dart`. |
| **E.3 Appearance Mode** | Seamless transition between Light, Dark, and System theme | Mobile | `code-inspection` | **PARTIAL** | ThemeMode toggles correctly, but mobile screens hard-code dark hex values (`CbColors.textPrimary`), making light text unreadable. |
| **E.4 Data Export** | Request GDPR/CCPA data export payload | Web & Mobile | `code-inspection` | **PARTIAL** | `requestDataExport.ts` queues export request; automated payload generation worker is not scheduled in functions. |
| **E.5 Account Deletion**| Request account deletion; verify balance clearance | Web & Mobile | `code-inspection` | **PARTIAL** | `requestAccountDeletion.ts` checks founder role; does not check `availableBalanceCents > 0` or pending tips. |

---

## Journey F: Moderation & Financial Corrections

| Hop / Step | Expected Behavior | Platform | Verification Method | Status | Evidence / Notes |
|---|---|---|---|---|---|
| **F.1 Abuse Report** | User reports offensive content or impersonation | Web & Mobile | `automated-test` | **PASS** | `submitReportCallable.ts` creates moderation item; direct client write denied by rules. |
| **F.2 Admin Review** | Trust & Safety staff reviews item in Command Center | Web desktop | `code-inspection` | **PASS** | `/admin/trust-safety` page displays queue; actions invoke `reviewFlaggedContent`. |
| **F.3 Suspension** | Admin suspends malicious creator; revokes monetization | Backend | `automated-test` | **PASS** | `suspendAccount.ts` sets `isSuspended` and `suspendedAt`; `firestore.rules` prevents self-clearing. |
| **F.4 Staff Refund** | Finance staff approves refund for disputed tip | Web desktop | `automated-test` | **PASS (Fixed)**| `approveStaffRefund.ts` invokes `stripe.createRefund` with idempotency, deducts creator balance, and logs audit events (`ADM-03`). |
| **F.5 Reinstatement** | Admin reinstates resolved creator account | Backend | `code-inspection` | **PARTIAL** | `reinstateAccount.ts` clears `isSuspended` on user doc, but leaves `suspendedAt` set, causing `eligibilityService` to continue blocking tipping. |

---

## Journey G: Failure & Recovery Handling

| Failure Condition | Expected System Response | Verification Method | Status | Notes |
|---|---|---|---|---|
| **Payment Decline** | Surface friendly card error; preserve tip sheet for retry | `code-inspection` | **PASS** | Stripe Elements returns error code; sheet remains open. |
| **Canceled Auth** | Cancel sign-in; return gracefully to profile | `code-inspection` | **PASS** | Back button returns to discovery without crashing. |
| **Double Tap** | Idempotency guard prevents duplicate charge | `automated-test` | **PASS** | Client disables submit button; server rejects duplicate idempotencyKey. |
| **Out-of-Order Webhook**| Delayed failure event does not overwrite `succeeded` | `automated-test` | **PASS (Fixed)**| `webhookHandler.ts` guards against out-of-order `payment_failed` events overwriting `succeeded` tips (`PAY-06`). Verified in `webhookHandler.test.ts`. |
| **Network Loss** | Offline banner; retry request when connection restores | `code-inspection` | **PASS** | `useAuth` tracks `isOnline` via window events. |
| **Expired QR Token** | Show "QR Code Expired — Ask Performer to Refresh" | `automated-test` | **PASS** | `verifyQrToken.ts` rejects tokens older than 300 seconds. |
| **Denied Location** | Graceful fallback to postal code / venue search | `automated-test` | **PASS** | `location_provider_test.dart` passes all permission denial flows. |
| **Firestore Outage** | Rate limiter fails closed in production | `automated-test` | **PASS (Fixed)**| `securityAndAbuseProtection.test.ts` passes; lead fixed `rateLimiter.ts` fail-closed logic. |
| **Restricted Payout** | Deny payout if Connect KYC incomplete | `automated-test` | **PASS** | `requestPayout.ts:77` verifies `chargesEnabled && payoutsEnabled`. |
| **Unauthorized Role** | Reject staff role self-grant | `automated-test` | **PASS (Fixed)**| `firestore.test.ts` (83/83 pass); `bootstrapSuperAdmin.ts` hardened against secret bypass. |
