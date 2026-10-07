# CROWDBEATS V2 — STRIPE CONTENT PLATFORM CURRENT STATE AUDIT

**Document Type:** Compliance & Architecture Audit (Phase 0)  
**Target Environment:** Crowdbeats V2 Cross-Platform Application  
**Classification Date:** 2026-08-27  
**Scope:** Stripe Connect, Content Moderation, Platform Policies, Security Rules, Firebase Architecture, and Auditability  

---

## Executive Summary

Crowdbeats V2 is undergoing technical readiness preparation to satisfy Stripe's Content Platform due diligence and compliance requirements. This read-only audit inspects the entire codebase (Flutter mobile client, Next.js web application, Cloud Functions Gen 2 backend, shared packages, and Firebase security rules) to establish a factual, verified baseline.

No functionality is assumed to exist merely because documentation references it. Every item below has been audited directly against the source code and classified into one of five statuses:
- **`IMPLEMENTED`**: Fully functional code and tests exist.
- **`PARTIALLY IMPLEMENTED`**: Functional foundations exist but key compliance or integration elements are missing.
- **`MISSING`**: No implementation currently exists in the codebase.
- **`INSECURE`**: Implementation exists but presents security vulnerabilities or missing server validations.
- **`NOT VERIFIED`**: Implementation cannot be verified without active cloud environment credentials.

---

## Requirement Classification & Audit Matrix

| # | Architecture & Compliance Domain | Status | Relevant Files | Primary Function / Component | Collection / Schema | Test Coverage |
|---|---|---|---|---|---|---|
| 1 | **Mobile Application Framework** | `IMPLEMENTED` | `apps/mobile/pubspec.yaml`, `apps/mobile/lib/main.dart` | Flutter 3.x, Riverpod, GoRouter, flutter_stripe | Client runtime | `apps/mobile/test/` |
| 2 | **Web Application Framework** | `IMPLEMENTED` | `apps/web/package.json`, `apps/web/app/layout.tsx` | Next.js 16 (App Router), React 19, @stripe/stripe-js | Client runtime | `apps/web/__tests__/unit/routeGuard.test.ts` |
| 3 | **Admin Web Application** | `PARTIALLY IMPLEMENTED` | `apps/web/app/(admin)/admin/` | Trust & Safety, Moderation, Admin UI stubs | Presentation stubs | None (UI stubs only) |
| 4 | **Shared Packages** | `IMPLEMENTED` | `packages/contracts`, `packages/design-tokens`, `packages/config`, `packages/web-sdk` | `@crowdbeats/contracts` TypeScript schemas | N/A | `npm run contracts:typecheck` |
| 5 | **Firebase Configuration** | `IMPLEMENTED` | `firebase.json`, `.firebaserc`, `apps/web/lib/firebase/config.ts` | Emulator suite (auth, firestore, functions, storage, hosting) | Project config | Verified via emulator runner |
| 6 | **Firebase Authentication & Claims** | `IMPLEMENTED` | `apps/functions/src/auth/onCreateUser.ts`, `onCompleteOnboarding.ts` | User provisioning, custom claims (`platformRole`, `personaType`) | `/users/{uid}` | `apps/functions/src/auth/__tests__/onCompleteOnboarding.test.ts` |
| 7 | **Firestore Collections & Security Rules** | `PARTIALLY IMPLEMENTED` | `firebase/firestore.rules`, `firestore.indexes.json` | 744 lines of default-deny rules, RBAC helpers, optimistic locking | 18 core collections | `firebase/tests/firestore.test.ts` |
| 8 | **Firebase Storage & Asset Isolation** | `IMPLEMENTED` | `firebase/storage.rules`, `apps/functions/src/storage/getSignedUploadUrl.ts` | Isolated paths per user/band, size limits, mime checks, signed URLs | Storage buckets | Storage rules + callable test |
| 9 | **Cloud Functions Backend** | `IMPLEMENTED` | `apps/functions/src/index.ts`, `apps/functions/package.json` | Firebase Functions Gen 2 (Node.js 20, us-central1) | Backend runtime | 13+ Jest test suites |
| 10 | **App Check Protections** | `INSECURE` | `apps/functions/src/index.ts`, `apps/functions/src/tip/createTipIntent.ts` | `enforceAppCheck: false` explicitly configured across all callables | Global config | None |
| 11 | **Stripe Integration Adapter** | `IMPLEMENTED` | `apps/functions/src/lib/stripe.ts` | `StripeAdapter` with dual live SDK and mock mode | Stripe API | Mock test suites in functions |
| 12 | **Stripe Connect Onboarding** | `PARTIALLY IMPLEMENTED` | `apps/functions/src/connect/createConnectLink.ts`, `getConnectStatus.ts` | Connect Express account creation & account link generation | `/users/{uid}.stripeConnectAccountId` | `apps/functions/src/connect/__tests__/connect.test.ts` |
| 13 | **Stripe Webhook Processing** | `PARTIALLY IMPLEMENTED` | `apps/functions/src/tip/webhookHandler.ts` | `stripeWebhook` HTTP function verifying `stripe-signature` | `/tips`, `/paymentLedger` | `apps/functions/src/tip/__tests__/webhookHandler.test.ts` |
| 14 | **Creator Profiles (Artist / Band)** | `PARTIALLY IMPLEMENTED` | `packages/contracts/src/profiles/artist.ts`, `band.ts` | Artist and Band profiles, membership, split config | `/artistProfiles`, `/bands` | `apps/functions/src/band/__tests__/bandGovernance.test.ts` |
| 15 | **Unique Creator URLs & Slugs** | `MISSING` | `packages/contracts/src/profiles/`, `apps/web/app/` | Canonical URL formatting (`https://crowdbeats.ai/artist/{slug}`) | Missing `creatorSlug` index | None |
| 16 | **Creator Monetization Eligibility** | `MISSING` / `INSECURE` | `apps/functions/src/tip/createTipIntent.ts` | `assertCreatorMayMonetize()` server check is absent; payments proceed without eligibility validation | `/users`, `/artistProfiles` | None |
| 17 | **Terms of Service** | `MISSING` | `legal/` directory (empty) | Legal policy document | Missing `legal/TERMS_OF_SERVICE.md` | None |
| 18 | **Privacy Policy** | `MISSING` | `legal/` directory (empty) | Legal policy document (privacy export callable exists) | Missing `legal/PRIVACY_POLICY.md` | None |
| 19 | **Acceptable Use Policy** | `MISSING` | `legal/` directory (empty) | Prohibited content definitions (adult, hate, IP violation) | Missing `legal/ACCEPTABLE_USE_POLICY.md` | None |
| 20 | **Creator Monetization Policy** | `MISSING` | `legal/` directory (empty) | Creator rules and payout terms | Missing `legal/CREATOR_MONETIZATION_POLICY.md` | None |
| 21 | **Policy Acceptance Tracking** | `PARTIALLY IMPLEMENTED` | `apps/mobile/lib/ui/onboarding/consent_screen.dart` | Generic consent recorded during onboarding; lacks versioned re-acceptance | `/users/{uid}/consents` | `firebase/tests/firestore.test.ts` |
| 22 | **Automated Content Safety Pipeline** | `MISSING` | `apps/functions/src/` | Extensible `ModerationProvider`, `ModerationResult`, `ModerationDecision` | Missing `contentSafety` pipeline | None |
| 23 | **Human Moderation Queue & Controls** | `PARTIALLY IMPLEMENTED` | `apps/functions/src/admin/suspendAccount.ts`, `reinstateAccount.ts` | Account suspension callable; lacks comprehensive queue UI and granular actions | `/reports`, `/moderationActions` | `apps/functions/src/admin/__tests__/enterpriseGovernance.test.ts` |
| 24 | **In-App User Reporting** | `PARTIALLY IMPLEMENTED` | `packages/contracts/src/moderation/report.ts`, `firebase/firestore.rules` | `Report` contract and Firestore security rules exist; client report triggers missing | `/reports/{reportId}` | Rules test coverage only |
| 25 | **External Copyright / IP Complaints** | `MISSING` | `legal/`, `apps/web/app/` | Public form for rights holders without accounts (`/legal/copyright-report`) | Missing `/rightsHolderReports` | None |
| 26 | **Repeat Offender Enforcement** | `MISSING` | `apps/functions/src/admin/` | Multi-tier violation strike system (`LEVEL_0_CLEAR` through `LEVEL_4_TERMINATED`) | Missing strike counters | None |
| 27 | **Demonetization Engine** | `MISSING` | `apps/functions/src/` | Independent demonetization decoupled from visibility; payment blocker | Missing `monetizationStatus` | None |
| 28 | **Compliance Payout Holds** | `PARTIALLY IMPLEMENTED` | `apps/functions/src/payout/requestPayout.ts` | Payout callable exists; lacks hold reasons (`REVIEW`, `RISK`, `DISPUTE`, `POLICY`, `LEGAL`, `STRIPE_RESTRICTION`) | `/payouts` | `apps/functions/src/connect/__tests__/connect.test.ts` |
| 29 | **Fan Payment Safety & Idempotency** | `IMPLEMENTED` | `apps/functions/src/tip/createTipIntent.ts` | Server-authoritative tip intents, integer minor units, idempotency key store | `/idempotencyKeys`, `/tips` | `apps/functions/src/tip/__tests__/createTipIntent.test.ts` |
| 30 | **Stripe Webhook Security & Event Log** | `PARTIALLY IMPLEMENTED` | `apps/functions/src/tip/webhookHandler.ts` | Signature verification; lacks full Connect event matrix and `stripeWebhookEvents` collection | Missing `/stripeWebhookEvents` | `apps/functions/src/tip/__tests__/webhookHandler.test.ts` |
| 31 | **Admin Role-Based Access Control (RBAC)**| `IMPLEMENTED` | `packages/contracts/src/identity/roles.ts`, `apps/functions/src/admin/` | Custom claims, step-up confirmation phrases, granular staff roles | `/staffRecords/{uid}` | `apps/functions/src/admin/__tests__/enterpriseGovernance.test.ts` |
| 32 | **Immutable Application Audit Trail** | `IMPLEMENTED` | `packages/contracts/src/audit/audit.ts`, `firebase/firestore.rules` | Server-only, append-only `/auditEvents` with actor, action, target, metadata | `/auditEvents/{eventId}` | `firebase/tests/firestore.test.ts` |
| 33 | **Moderation Appeals Flow** | `MISSING` | `packages/contracts/src/moderation/`, `apps/functions/src/` | Creator appeal submission and moderator review mechanism | Missing `/moderationAppeals` | None |
| 34 | **Data Minimization & Privacy Protection** | `IMPLEMENTED` | `packages/contracts/src/profiles/`, `firebase/firestore.rules` | No raw PAN/CVV stored; PII isolation in Firestore rules; GDPR data export callable | `/privacyExportRequests` | Firestore rules test suite |

---

## Detailed Findings per Domain

### 1. Mobile & Web Application Frameworks
- **Findings:** Cross-platform architecture is clean-room implemented with Flutter 3.x for native mobile (iOS/Android) and Next.js 16 App Router for web. Shared contracts package (`@crowdbeats/contracts`) ensures end-to-end type parity.
- **Security Assessment:** Well isolated. No client holds Stripe private keys or direct database write access to financial ledgers.

### 2. Stripe Connect & Financial Flow
- **Findings:** Stripe Connect Express onboarding is initiated via `createConnectLink` Cloud Function, and status is retrieved via `getConnectStatus`. Payout requests are processed through `requestPayout`.
- **Identified Gaps:**
  1. `createConnectAccount` does not pass the creator's canonical Crowdbeats profile URL to Stripe's `business_profile.url`.
  2. The webhook handler does not ingest `account.updated`, `capability.updated`, `payout.paid`, or `payout.failed` events.
  3. `requestPayout` relies on an internal `availableBalanceCents` accumulator on `artistProfiles` rather than maintaining strict financial synchrony with Stripe as the sole source of truth.
  4. Missing compliance payout hold state machine (`NONE`, `REVIEW`, `RISK`, `DISPUTE`, `POLICY`, `LEGAL`, `STRIPE_RESTRICTION`).

### 3. Creator Monetization Eligibility & Tipping
- **Findings:** `createTipIntent` correctly validates integer minor units ($1.00 min, $500.00 max), computes a 5% platform fee, creates a Stripe PaymentIntent, and writes double-entry ledger records on webhook confirmation.
- **Critical Security Concerns (Fail-Open Risk):**
  - `createTipIntent` does **not** check if the recipient creator is active, KYC-verified, policy-accepted, or free of moderation/compliance suspensions. Anyone with a valid UID can receive tip intents if they appear in the UI.
- **Required Remediation:** Create centralized server-side validator `assertCreatorMayMonetize()` and invoke it in `createTipIntent`.

### 4. Creator Identity & Canonical URLs
- **Findings:** Performers are identified by their Firebase UID.
- **Identified Gaps:**
  - No slug generation (`creatorSlug`, `bandSlug`) or collision reservation mechanism exists.
  - No canonical URLs (`https://crowdbeats.ai/artist/{slug}` and `https://crowdbeats.ai/band/{slug}`) exist.

### 5. Content Moderation & Prohibited Content Enforcement
- **Findings:** Account suspension (`suspendAccount`) exists for Trust & Safety staff with step-up confirmation phrases.
- **Identified Gaps:**
  - Automated content safety pipeline (`ModerationProvider`, `ModerationResult`, `ModerationDecision`) is missing.
  - Granular content-level demonetization (decoupling content visibility from monetization) is missing.
  - Repeat offender tracking system (`LEVEL_0_CLEAR` to `LEVEL_4_TERMINATED`) is missing.
  - Public copyright/rights-holder complaint form and queue (`rightsHolderReports`) are missing.
  - Moderation appeals queue (`moderationAppeals`) is missing.

### 6. Legal Policies & Consent Versioning
- **Findings:** Onboarding UI collects initial consent, but legal policy documents are missing.
- **Identified Gaps:**
  - Missing `legal/ACCEPTABLE_USE_POLICY.md`
  - Missing `legal/CREATOR_MONETIZATION_POLICY.md`
  - Missing `legal/CONTENT_MODERATION_POLICY.md`
  - Missing `legal/COPYRIGHT_POLICY.md`
  - Missing `legal/REPEAT_OFFENDER_POLICY.md`
  - Missing versioned policy acceptance storage (`/policyAcceptances/{acceptanceId}`) with forced re-acceptance upon material changes.

### 7. Security Rules & App Check
- **Findings:** Firestore security rules are extensive (744 lines) and strictly enforce default-deny, server-only writes for financial collections (`/paymentLedger`, `/tips`, `/payouts`, `/auditEvents`), and field-level update whitelists with optimistic locking.
- **Identified Gaps:**
  - App Check is disabled (`enforceAppCheck: false`) across callable functions.
  - New compliance collections (`contentReports`, `rightsHolderReports`, `moderationAppeals`, `policyAcceptances`, `stripeWebhookEvents`) require explicit rules.

---

## Architectural Conflict & Safety Check

- **Conflict Check:** No unresolvable architectural conflicts were discovered.
- **Safety Directive:** All compliance enhancements (unique URLs, monetization eligibility assertions, automated moderation pipeline, reporting, policy acceptance, webhook hardening, and audit trails) are **additive** and can be implemented without breaking existing features or deleting working code.

---

## Recommended Execution Roadmap

1. **Phase 1: Stripe Connect Architecture** — Enhance Connect onboarding with canonical URLs, requirement tracking, and webhook synchronization.
2. **Phase 2: Unique Creator URLs** — Implement normalized slugs, collision detection, and canonical profile routing.
3. **Phase 3: Creator Monetization Eligibility** — Implement `assertCreatorMayMonetize()` server enforcement.
4. **Phase 4: Acceptable Use & Platform Policies** — Draft legal markdown policies marked for legal review.
5. **Phase 5: Versioned Policy Acceptance** — Build server-timestamped policy acceptance collection and check.
6. **Phase 6: Content Model & Moderation Metadata** — Add content metadata schema supporting independent demonetization.
7. **Phase 7: Automated Content Safety Pipeline** — Implement modular `ModerationProvider` architecture.
8. **Phase 8: Human Moderation Queue & Admin Actions** — Connect Admin UI to live moderation actions and audit logs.
9. **Phase 9: In-App User Reporting** — Wire client reporting flows with spam abuse protection.
10. **Phase 10: External Copyright / Rights-Holder Complaints** — Build public copyright intake and restricted queue.
11. **Phase 11: Repeat Offender System** — Implement strike counters and automated enforcement escalations.
12. **Phase 12: Independent Demonetization** — Build fail-closed monetization blocking independent of visibility.
13. **Phase 13: Compliance Payout Holds** — Implement payout hold state machine.
14. **Phase 14: Fan Payment Safety Hardening** — Integrate eligibility and compliance assertions into payment creation.
15. **Phase 15: Stripe Webhook Hardening** — Extend webhook handlers for all Connect lifecycle events and log to `stripeWebhookEvents`.
16. **Phase 16: Firebase Security Rules Hardening** — Add comprehensive rules for all compliance collections.
17. **Phase 17–21: Admin Compliance Tools & Privacy Documentation** — Build compliance dashboard and privacy docs.
18. **Phase 22–27: Evidence Mode, Control Matrix, Automated & E2E Tests, and Production Readiness Gate** — Complete verification and final reports.
