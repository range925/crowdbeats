# 00 — V2 Target Architecture
**Phase:** 0 — Read-Only Clean-Room Contract
**Date:** 2026-08-25
**Status:** DRAFT — No code exists; this is a requirements-derived architecture proposal

---

## 1. Architecture Statement

Crowdbeats V2 is a clean-room, server-authoritative, multi-persona music technology platform
delivered as one coordinated monorepo containing three separately deployable applications
and shared specification packages.

All former Crowdbeats repositories, Firebase projects, and cloud resources are historical
references only. V2 receives newly authored files exclusively.

---

## 2. Monorepo Structure (Proposed)

```
crowdbeats-v2/
  apps/
    mobile/                   # Flutter iOS and Android (Dart)
    web/                      # Next.js App Router (React, TypeScript)
    functions/                # Firebase Cloud Functions Gen 2 (Node.js 20, TypeScript)
  packages/
    contracts/                # Platform-neutral JSON Schema / OpenAPI / event contracts
    design-tokens/            # Canonical token source and generators (Flutter + web)
    web-sdk/                  # Generated/typed TypeScript client helpers
    config/                   # Shared lint, format, TypeScript, and test configuration
  firebase/
    firestore.rules           # Default-deny security rules
    firestore.indexes.json    # Composite index definitions
    storage.rules             # File security rules
    emulator-data/            # Fictitious deterministic fixtures only
  docs/
    architecture/
    clean-room/
    product/
    design/
    security/
    data/
    payments/
    testing/
    antigravity/
    decisions/
  scripts/
  .github/workflows/
  firebase.json               # New V2 configuration only
  .firebaserc.example         # Safe example; actual .firebaserc is gitignored
  README.md
```

**Flutter placement rationale:** Flutter is NOT placed inside the JavaScript npm workspace.
JavaScript workspaces cover apps/web, apps/functions, and TypeScript packages.
Root orchestration scripts call Flutter commands explicitly.

---

## 3. Technology Decisions

| Layer | Technology | Version Strategy | Notes |
|---|---|---|---|
| Native mobile | Flutter | Latest stable at Phase 1 | iOS and Android only in V2 |
| Mobile state management | Riverpod (recommended — OD-02) | Latest stable | Candidate; David confirms |
| Responsive web | Next.js App Router | Latest stable LTS at Phase 1 | React, strict TypeScript |
| Backend functions | Firebase Cloud Functions Gen 2 | Node.js 20 runtime | TypeScript, ESM |
| Database | Cloud Firestore | Managed; native mode | Single source of truth |
| Authentication | Firebase Authentication | Latest SDK | Email/password, Google, Apple |
| File storage | Cloud Storage for Firebase | Managed | 5 MB default limit; MIME validation |
| Push messaging | Firebase Cloud Messaging (FCM) | Latest SDK | Topic + device-token routing |
| App integrity | Firebase App Check | Latest SDK | Play Integrity / DeviceCheck / reCAPTCHA |
| Payments | Stripe API | Latest stable at Phase 1 | Server-side only for secrets |
| Connect payouts | Stripe Connect Express | Matching Stripe SDK | Creator and band payouts |
| Contracts | Platform-neutral JSON Schema / OpenAPI | — | Generated Dart + TypeScript models |
| Design tokens | Custom token source | — | Generates Flutter theme + web CSS/JS |
| TypeScript schemas | Zod (recommended) | Latest stable | Runtime validation in Functions/web |
| Secret storage | Google Cloud Secret Manager | — | Stripe keys, webhook secrets, HMAC keys |
| CI/CD | GitHub Actions | — | Secret scanning, lint, type-check, test, build |

Version numbers are NOT locked in this document. Phase 1 records exact chosen versions
in `docs/architecture/01_TOOLCHAIN_VERSION_LOCK.md` after verifying official manifests.

---

## 4. Identity and Authorization Model

### 4.1 Human Identity
- One Firebase Auth UID per human; permanent across all platforms and personas
- `/users/{uid}` is the canonical identity document
- Persona contexts (Fan, Artist, Band, Sponsor, Venue, Staff) are memberships/profiles
  linked to the UID — not separate accounts

### 4.2 Authorization Layers
```
Layer 1: Firebase App Check (device/app attestation)
Layer 2: Firebase Authentication (UID verification)
Layer 3: Firestore Security Rules (path/field-level access control)
Layer 4: Cloud Functions (server-side role/membership/state validation)
Layer 5: Next.js middleware + server actions (web-tier authorization)
```

### 4.3 Staff Authorization
- Firebase custom claims carry coarse staff access flags only
  (e.g., `isPlatformAdmin: true`, `staffRole`)
- Fine-grained permissions are validated server-side from membership records
- SUPER_ADMIN step-up authentication required for claim assignment
- No custom claim assignment is available to non-staff users

### 4.4 Client Authorization
- Client applications may read only data explicitly permitted by security rules
- Client applications may NEVER write to: ledger, balances, payouts, refunds, escrow,
  reserves, audit logs, staff claims, verification status, or suspension flags
- UI hiding is presentation only; authorization is always server-enforced

---

## 5. Data Architecture

### 5.1 Firestore Model Principles
- Default-deny rules; every allowed path has a documented rationale
- All money stored as integer minor units (e.g., `amountCents: 1000` = $10.00 USD) with
  ISO currency code (`currency: "USD"`)
- No binary floating-point arithmetic for any financial calculation
- Append-only collections: `auditLogs`, `paymentLedger` (server-authored only)
- Soft-delete / archive pattern before any destructive operation

### 5.2 Proposed Collection Groups (subject to Phase 3 canonical data dictionary)
| Collection | Purpose | Client Write? |
|---|---|---|
| /users/{uid} | Canonical human identity | Limited own-record fields only |
| /profiles/{uid} | Fan/creator preference profile | Own record only |
| /artistProfiles/{artistId} | Solo musician public profile and EPK | Server-controlled fields locked |
| /bands/{bandId} | Band organization | Server-controlled governance fields locked |
| /bandMemberships/{id} | Band membership records | BAND_OWNER only, via Function |
| /splitConfigurations/{id} | Versioned band split matrix | Function-only writes |
| /stageSessions/{id} | Live gig session state | Server-created and closed |
| /tips/{tipId} | Individual tip transactions | Read-only for fan; server-authored |
| /paymentLedger/{id} | Double-entry ledger | SERVER-ONLY — no client writes ever |
| /campaigns/{id} | Crowdfunding campaigns | Creator writes draft fields; server controls publication |
| /sponsorProfiles/{id} | Sponsor organization | Admin fields server-controlled |
| /sponsorshipDeals/{id} | Sponsorship agreements | Contract fields server-controlled |
| /matchPools/{id} | Live tip match pool state | SERVER-ONLY accounting |
| /auditLogs/{id} | Immutable audit trail | SERVER-ONLY — append-only |
| /idempotencyRecords/{id} | At-most-once event processing | SERVER-ONLY |
| /platformSettings/{id} | Global toggles | SUPER_ADMIN only via Function |

### 5.3 Contract Parity (TypeScript and Dart)
- Platform-neutral contracts defined in `packages/contracts/` (JSON Schema / OpenAPI)
- TypeScript models generated or validated in `packages/web-sdk/` and `apps/functions/`
- Dart models generated or tested for parity in `apps/mobile/`
- Parity tests run in CI to prevent schema drift between platforms

---

## 6. Financial Architecture

### 6.1 Invariants (binding — see Clean-Room Contract §8)
- Integer minor units with ISO currency code at all layers
- No floating-point money arithmetic
- Idempotency key on every authoritative financial event
- Append-only balanced double-entry ledger (total debits = total credits)
- Client applications cannot write financial state

### 6.2 Stripe Integration
- PaymentIntents for fan tips (server-created)
- SetupIntents for saved tokenized payment methods (Stripe-hosted flow only)
- Stripe Connect Express for creator and band payout accounts
- Multi-party split transfers (server-calculated, integer arithmetic)
- Webhook signature verification using official Stripe server SDK
- Webhook event-ID deduplication store
- All Stripe secrets in Google Cloud Secret Manager

### 6.3 Band Split Policy
- Must total exactly 100% (exact arithmetic, not floating-point)
- Odd-cent allocation policy: NEEDS DAVID DECISION (OD-09)
- Split configuration versioned; earning-time version preserved for history
- Server validates before any ledger posting

---

## 7. Security Architecture

### 7.1 Firestore and Storage
- Default-deny; no wildcard read/write rules in production
- Rules test coverage: 100% of collection paths, allowed and denied cases
- Storage: MIME-type validation, 5 MB size limit, owner isolation

### 7.2 Stage Verification
- Server generates HMAC SHA-256 QR token with stageId + timestamp
- Token expires after 300 seconds
- Server verifies before any check-in is recorded
- Anti-replay: token timestamps are validated against current time server-side

### 7.3 Secrets
- No secret appears in client code, Firestore, logs, or Git
- Stripe secret keys and webhook secrets: Google Cloud Secret Manager
- HMAC signing secret for QR tokens: Google Cloud Secret Manager
- Emulator fixtures use fictitious deterministic data

### 7.4 Logging and Privacy
- Structured logs with correlation IDs
- No raw card data, no full PAN, no Stripe secret keys in logs
- Privacy-preserving aggregates for analytics
- PII redaction before log export

---

## 8. Platform Surfaces

### 8.1 Flutter Native App (apps/mobile)
- iOS and Android only (no web target for the Flutter app in V2)
- Minimum platform targets: to be determined in Phase 1 based on Firebase SDK compatibility
- Fan, Solo Musician, and Band Member/Owner personas
- Bottom-tab navigation per persona (see Persona Surface Scope document)
- Native hardware: camera (QR), geolocation (nearby), notifications (FCM)
- Camera recognition and BLE: deferred (OD-12)

### 8.2 Next.js Web App (apps/web)
- Next.js App Router with React and strict TypeScript
- Server Components, Server Actions, Edge/Node middleware
- Hosting: Firebase App Hosting (Next.js SSR support) — to be confirmed in Phase 2
- All personas including Sponsor, Venue, Enterprise Admin
- Responsive: phone browser, tablet, laptop, large desktop
- Fan web is limited (account dashboard only); full creator and admin workspaces on web

### 8.3 Firebase Functions (apps/functions)
- Cloud Functions Gen 2, Node.js 20, TypeScript
- HTTPS callable functions with Firebase Auth + App Check middleware
- HTTP webhook receiver for Stripe
- Eventarc triggers and scheduled background jobs (ledger reconciliation, fraud cleanup)
- No business logic in client applications for privileged operations

---

## 9. Design System

### 9.1 Brand Colors
- Primary pink: #FF97BA
- Supporting violet: #8B5CF6
- Obsidian: #131315
- Light neutral surfaces with generous whitespace
- Deep high-contrast surfaces in dark/live/stage mode

### 9.2 Token Architecture
- All tokens defined in `packages/design-tokens/`
- Semantic tokens: color (surface, on-surface, primary, error, warning, success),
  typography, spacing, radius, elevation, focus, motion, breakpoint, touch size,
  live-stage mode overrides
- Generated outputs: Flutter ThemeData, web CSS custom properties, TypeScript constants
- No raw hex colors in product components; semantic token references only

### 9.3 Accessibility Standard
- WCAG 2.2 AA release floor (resolved from C-04)
- 48x48 dp minimum touch targets on Flutter
- 44x44 px minimum interactive targets on web
- Keyboard navigation and visible focus on web
- Semantic labels and Semantics widgets on Flutter
- Reduced-motion support on both platforms
- No color-only status indicators
- Text scaling and reflow support

---

## 10. Testing Architecture

### 10.1 Test Tiers
| Tier | Tool | Scope |
|---|---|---|
| Dart unit tests | dart test | Dart models, calculators, validators |
| Flutter widget tests | flutter test | UI component rendering and interaction |
| TypeScript unit tests | Jest/Vitest | Zod schemas, domain math, split calculators |
| Firestore rules tests | Firebase Emulator + jest-environment-node | Every collection path, allowed and denied |
| Storage rules tests | Firebase Emulator | MIME, size, owner isolation |
| Functions integration tests | Firebase Emulator | Stripe callables, auth callables, webhooks |
| Next.js component tests | Jest/Vitest + Testing Library | UI components, Server Actions |
| E2E multi-persona | Playwright or Detox | Cross-persona flows, Stripe test mode |

### 10.2 Emulator Policy
- Firebase Emulator Suite is the default local target for all backend tests
- No test connects to production Firebase
- No test uses real card data or real Stripe live mode
- Fixtures are fictitious, deterministic, and owned by V2

---

## 11. Deployment and Environment Strategy

| Environment | Firebase Project | Purpose | Authorization Required |
|---|---|---|---|
| Local | Emulator Suite | All development and CI testing | None (default target) |
| Dev | crowdbeats-v2-dev (or approved ID — OD-05) | First cloud environment; integration | Phase 2 approval |
| Staging | crowdbeats-v2-staging (or approved ID) | Pre-production integration | Phase 13 explicit approval |
| Production | crowdbeats-v2-prod (or approved ID) | Live platform | Phase 14 separate explicit authorization |

Production deployment is never automated. It requires a separate explicit instruction
from David in the active conversation at the time of the Phase 14 prompt.

---
*Phase 0 documentation only. No application code, Firebase resource, Stripe resource,
or deployment was created or modified.*
