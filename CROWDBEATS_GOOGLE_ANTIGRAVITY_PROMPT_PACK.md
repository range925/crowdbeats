# Crowdbeats — Google Antigravity Cross-Platform Implementation Prompt Pack

**Prepared for:** David Naufahu, Crowdbeats LLC  
**Purpose:** Make Google Antigravity use every supplied architecture, roadmap, and skill document while safely building the Crowdbeats Flutter mobile app, responsive Next.js web workspaces, Firebase backend, Stripe payment system, and role-based administration platform.  
**Execution model:** Paste one prompt at a time. Do not paste the entire pack as one instruction.

---

## How to Use This Pack

1. Open the existing Crowdbeats repository in Google Antigravity.
2. Make sure these four documents are attached or present in the repository. Antigravity must locate files by canonical title even if an uploaded copy has a suffix such as `(2)`:
   - `CROWDBEATS_SKILL_REQUIREMENTS.md`
   - `CROWDBEATS_AAS_SKILL_SELECTION.md`
   - `CROWDBEATS_ARCHITECTURE_VALIDATION.md`
   - `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md`
3. Also attach all Crowdbeats UI references, screenshots, PDFs, Google Stitch exports, brand assets, and flow diagrams you want implemented.
4. Paste **Prompt 0** first. Do not allow implementation until it returns the required audit files.
5. Review each Antigravity report. Then paste the next prompt.
6. Use local Firebase Emulators and Stripe test mode until the final production-readiness phase. Never paste secret keys into Antigravity chat or commit them to Git.

## Canonical Product-Surface Decision

| Persona | Flutter iOS/Android | Responsive Next.js web |
|---|---|---|
| Fan | Primary experience: discover, scan/check in, tip, activity, profile | Supporting account/VIP/payment/receipt dashboard |
| Solo Musician | Live-performance companion and creator essentials | Full creator studio and campaign operations |
| Band Member/Owner | Live-performance companion, roster alerts, collective activity | Full band governance, splits, campaigns, documents, analytics |
| Sponsor | No full Flutter app in the current approved architecture | Primary B2B sponsor portal; must remain usable on phone browsers |
| Platform Admin/Staff | No general-purpose Flutter admin app in the current approved architecture | Primary desktop-first enterprise CRM/control plane; responsive emergency views only |

Do not silently add a Sponsor or Admin Flutter application. That is a material scope and security change requiring a written architecture decision and David's approval.

## Authority Order Antigravity Must Follow

When sources conflict, use this order:

1. Actual repository state and passing tests.
2. Protected architecture files, if present:
   - `docs/CROWDBEATS_CORE_ARCHITECTURE_INVARIANTS.md`
   - `docs/IDENTITY_PROFILE_MEMBERSHIP_MODEL.md`
   - `docs/STRIPE_SECURITY_MODEL.md`
   - protected core portions of `packages/shared/src/models/domain_schemas.ts`
   - `packages/shared/src/models/rbac_constants.ts`
3. `CROWDBEATS_ARCHITECTURE_VALIDATION.md`.
4. `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md`.
5. `CROWDBEATS_SKILL_REQUIREMENTS.md`.
6. `CROWDBEATS_AAS_SKILL_SELECTION.md`.
7. UI references, screenshots, PDFs, and Stitch exports for visual intent, never for security or data architecture.

An older report is evidence, not proof of the current codebase. Antigravity must verify every “implemented,” “passing,” line-count, version, route-count, role-count, permission-count, and test-count claim directly.

---

# Prompt 0 — Mandatory Input Ingestion and Evidence Audit

```text
You are working inside the existing Crowdbeats repository. Do not write application code, delete files, install skills, deploy services, or change configuration during this prompt.

Your first job is to prove that every uploaded reference has been considered.

Locate and read completely, not just by filename or summary:
1. CROWDBEATS_SKILL_REQUIREMENTS.md
2. CROWDBEATS_AAS_SKILL_SELECTION.md
3. CROWDBEATS_ARCHITECTURE_VALIDATION.md
4. CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md

The uploaded copies may contain suffixes such as “(2)”. Resolve them by document title and content. Then inventory every other supplied Crowdbeats asset available in this project: PDFs, Markdown files, screenshots, images, Google Stitch exports/links, flow diagrams, brand assets, and existing design specifications.

Inspect the actual repository read-only. Verify:
- workspace/package structure;
- Git branch, status, and recent history;
- apps/mobile_flutter, apps/admin_web, apps/functions, and packages/shared;
- any root mobile_flutter duplicate;
- firebase.json, .firebaserc, firestore.rules, storage.rules, indexes, emulator configuration;
- Flutter/Dart, Next.js/React/TypeScript, Node, Firebase, and Stripe SDK versions from manifests/lockfiles;
- route inventory for every persona;
- Firestore collection paths and security-rule coverage;
- Cloud Functions inventory;
- RBAC roles and permissions from source;
- test suites, CI workflows, and whether they actually run;
- preview harnesses, legacy files, scratch utilities, and Prisma artifacts;
- presence of secrets by safe pattern scanning only; never print secret values.

Explicitly reconcile these known documentation inconsistencies:
- The AAS document says “24 required skills” but its numbered list contains 31.
- The documents refer to 16 enterprise roles, but one roadmap list omits EXECUTIVE and contains only 15 named roles.
- Some documents describe apps/admin_web as both an admin app and the shared web portal for Fan, Creator, Band, and Sponsor routes.
- Architecture reports may describe files that no longer exist or may recommend deleting a root Flutter folder without proving it is unused.
- The documents sometimes state WCAG AA and elsewhere demand AAA text contrast; use AA as the release floor and record AAA as an aspirational venue-mode target where feasible.

Create only these documentation outputs:
1. docs/antigravity/00_INPUT_COVERAGE_MATRIX.md
2. docs/antigravity/00_REPOSITORY_TRUTH_AUDIT.md
3. docs/antigravity/00_CONFLICT_AND_DECISION_LOG.md
4. docs/antigravity/00_UI_ASSET_MANIFEST.md

The input coverage matrix must have one row per uploaded/reference file with: resolved path or source, fully read yes/no, key requirements extracted, affected roles, affected platforms, conflicts, and implementation phase.

The repository audit must label every statement VERIFIED, PARTIAL, MISSING, STALE, or UNVERIFIED and cite exact repository paths. Do not claim tests pass unless you ran them successfully in the current checkout and record the exact command and result.

The conflict log must propose a canonical decision for each conflict but must not alter protected architecture. Stop and ask David for a decision only when the authority order cannot resolve it.

End with:
- concise current-state summary;
- blockers;
- exact proposed implementation sequence;
- list of files created;
- confirmation that no application code, configuration, cloud resource, or production data was changed.

STOP after producing the audit. Wait for approval before implementation.
```

---

# Prompt 1 — Architecture Lock, Scope Matrix, and Safe Work Plan

```text
Read all four original Crowdbeats source documents again and read every file created by Prompt 0. Continue only if 00_INPUT_COVERAGE_MATRIX.md confirms that all four required documents were fully read.

Do not implement product features yet.

Create the canonical implementation contract for the current repository:
- Flutter iOS/Android in apps/mobile_flutter for Fan, Solo Musician, and Band Member/Owner experiences.
- Responsive Next.js App Router web application in apps/admin_web for Fan supporting dashboard, Solo Creator Studio, Band Governance, Sponsor Portal, and Enterprise Admin/CRM.
- Firebase Authentication, Cloud Firestore as the operational source of truth, Cloud Storage, Cloud Functions Gen 2, App Check, FCM, and Firebase Emulators.
- packages/shared as the TypeScript source of truth for domain contracts, permissions, API response envelopes, and web tokens, while Flutter receives generated or explicitly mirrored Dart contracts with parity tests.
- Stripe PaymentIntents/SetupIntents and Stripe Connect Express, with all privileged operations server-authoritative.

Preserve these non-negotiable invariants:
1. One Firebase Auth UID per human across all personas and platforms.
2. Persona switching uses memberships/profiles, not duplicate accounts.
3. No client writes balances, ledger entries, payout distributions, staff claims, escrow releases, or audit records.
4. All money uses integer minor units such as amountCents; never floating-point money.
5. Every financial event is idempotent and creates a balanced double-entry ledger transaction.
6. Raw PAN, expiration, CVC, Stripe secret keys, webhook secrets, and service-account credentials are never stored in Firestore, logs, client code, or Git.
7. Firestore and Storage remain default-deny, with least-privilege rules and App Check.
8. Admin authorization is validated server-side using signed claims and granular permissions; hiding UI is not authorization.
9. Audit trails are append-only and server-authored.
10. Rotating stage QR/check-in tokens are server-verified and expire after 300 seconds unless the protected architecture specifies otherwise.
11. Production data is never copied into development or CI.
12. No production deployment occurs without an explicit, separate approval.
13. Protected architecture files are not modified without formal review and David's approval.

Create:
- docs/antigravity/01_CANONICAL_PLATFORM_SCOPE.md
- docs/antigravity/01_ROLE_SURFACE_ROUTE_MATRIX.md
- docs/antigravity/01_DATA_FUNCTION_PERMISSION_TRACEABILITY.md
- docs/antigravity/01_SAFE_IMPLEMENTATION_PLAN.md

The role/surface matrix must cover FAN, SOLO_MUSICIAN, BAND_OWNER, BAND_MANAGER, BAND_MEMBER, FINANCE_ROLE, CAMPAIGN_ROLE, MEDIA_ROLE, SPONSOR_REP/SPONSOR_ADMIN or the repository's canonical sponsor roles, and every enterprise staff role actually defined in source. Resolve the EXECUTIVE discrepancy without inventing or deleting a role.

For each route or screen, identify: platform, persona, purpose, required data, callable functions, permission, UI reference source, test type, and implementation status.

Do not delete the root mobile_flutter folder or any legacy/preview asset. If cleanup is warranted, provide Git-history and reference evidence and stage a reversible cleanup proposal for separate approval.

End with a phase-by-phase plan using small reviewable commits, the tests required at each gate, and all unresolved decisions. STOP and wait for approval.
```

---

# Prompt 2 — Shared Foundation, Authentication, Persona Switching, RBAC, and Design Tokens

```text
Implement only the approved shared foundation from Prompt 1. Read the original four source documents and docs/antigravity/00_* plus 01_* before editing.

Use the repository's existing patterns and versions; do not blindly replace them with versions named in an older report. Reuse existing implementations when verified and improve only proven gaps.

Required outcomes:
- canonical Firebase Auth lifecycle for email/password, Google, and Apple where platform configuration supports them;
- exactly one /users/{uid} identity per human;
- role/profile membership model and secure persona switcher across applicable mobile and web surfaces;
- email verification, password reset, provider cancellation/retry, disabled/suspended account handling, and safe error messages that resist account enumeration;
- server-only staff custom-claim provisioning with Super Admin step-up authentication and immutable audit record;
- a typed ApiResponseEnvelope<T> for Cloud Function responses, without altering protected financial schemas without approval;
- synchronized design tokens for Flutter and web: #ff97ba, #8B5CF6, #131315 plus semantic success/warning/error, typography, spacing, radii, focus, elevation, and motion tokens;
- accessible shared controls with 48x48 dp Flutter targets, 44x44 px web targets, semantic labels, visible focus, keyboard navigation, reduced-motion support, and WCAG 2.1 AA minimum contrast;
- route guards on both server and client, with server authorization controlling access;
- Firebase Emulator fixtures using fictitious users for each role.

Do not place TypeScript/Zod directly into Flutter. Establish a documented contract-parity mechanism using generated JSON Schema/OpenAPI or tested Dart equivalents, whichever best matches the current repository.

Run the relevant shared, auth, rules, Flutter, functions, and web tests only against local emulators/test configuration. Add negative authorization tests, not only happy paths.

Create docs/antigravity/02_FOUNDATION_IMPLEMENTATION_REPORT.md containing requirements traced back to every source document, changed files, tests and exact results, deferred items, and screenshots or routes used for visual verification.

Do not deploy. Do not touch production. Stop after this phase for review.
```

---

# Prompt 3 — Fan Mobile Experience and Supporting Web Dashboard

```text
Implement the Fan experience using the approved foundation. Before editing, read all four original Crowdbeats documents, the Antigravity audit/decision files, and every Fan-related UI asset in 00_UI_ASSET_MANIFEST.md.

Flutter mobile is the primary Fan experience. Build or harden:
- Home: curated pulse feed, Live Now, featured artists, and clear next action;
- Nearby: permission-aware map/list, geolocation privacy, distance-sorted verified live stages, loading/empty/offline/error states;
- Tip: performer confirmation, preset/custom amount, saved/default tokenized payment method, final confirmation, success celebration, receipt, and retry-safe failure handling;
- QR scanner and universal/deep links for performer, tip, and stage check-in;
- Activity: receipts, monthly support summary, refunds/status, loyalty/VIP progress;
- Profile: preferences, privacy/security, payment-method summary showing brand and last four only, Crowdbeats Cash only if legally and technically approved, and account deletion flow;
- camera, geolocation, notifications, and App Check with explicit permission education and denial recovery.

Preserve the Crowdbeats 3-tap goal: from a known performer or scanned stage to confirmed tip in no more than three intentional taps when a valid default payment method exists. Do not reduce confirmation or consent merely to hit the metric.

Build or harden a supporting responsive Fan web dashboard for account, VIP/loyalty, payment-method management through Stripe-hosted/tokenized UI, receipts/activity, followed artists, settings, privacy, and security. Do not duplicate the complete native Nearby/live venue experience unless already approved.

Backend requirements:
- SetupIntent-based saved payment methods;
- PaymentIntent creation and confirmation using integer cents;
- idempotency keys and replay protection;
- webhook signature verification;
- server-authored ledger and loyalty changes;
- no raw card data or client-authored financial state;
- refund/status lifecycle according to the approved policy.

Testing must include widget/component tests, rules tests, functions integration tests, duplicate webhook, duplicate tap, offline/retry, payment cancellation, denied permissions, screen reader/keyboard where applicable, and the end-to-end Fan 3-tap scenario using Stripe test mode and Firebase Emulators.

Create docs/antigravity/03_FAN_IMPLEMENTATION_REPORT.md with source traceability, route/screen coverage, UI asset coverage, exact test results, performance/accessibility findings, and remaining gaps.

Do not deploy. Stop for review.
```

---

# Prompt 4 — Solo Musician Mobile Companion and Full Creator Web Studio

```text
Implement the Solo Musician experience. Re-read all source documents, approved decisions, and every Solo Musician UI asset before editing.

Flutter mobile must support the on-stage and time-sensitive creator workflows:
- creator home with today's tips, active gig, payout/KYC status, and next action;
- start/end verified stage session;
- 300-second rotating QR display with server validation, countdown, expiry, refresh, anti-replay handling, wake-lock guidance, and offline/error states;
- real-time tip stream with listener cleanup and privacy-safe donor display;
- campaign overview and quick update composer;
- fan/patron summary;
- artist profile/EPK preview;
- notification preferences and payout status.

Responsive web must provide the full Creator Studio:
- dashboard;
- profile/EPK studio;
- performances, gig calendar, setlists, and stage/beacon management;
- complete campaign wizard: Music Project, Story, Goal & Rewards, Details, Review, Launch;
- post-launch campaign workspace: Campaign, Donations, Updates, Messages, Fans, Payouts, Analytics, Marketing Tools, Rewards, Settings;
- tips, media, sponsorships, security, and privacy;
- Stripe Connect Express onboarding/status using server-generated account links.

Do not implement named-personality imitation features or copy a living person's voice/style. Any AI writing helper must use neutral controls such as clarity, confidence, warmth, concision, and audience, and must require creator review before publishing.

All creator financial, KYC, escrow, campaign publication, and payout transitions must be server-authoritative, permission-checked, idempotent, and audited. Never expose Stripe account tokens or secrets.

Test stage session expiry, QR replay/forgery, campaign validation, draft recovery, unauthorized publication, Stripe onboarding return/refresh, real-time listener disposal, accessibility, responsive layouts, and creator end-to-end flows against emulators/test mode.

Create docs/antigravity/04_SOLO_MUSICIAN_IMPLEMENTATION_REPORT.md with complete source and UI traceability plus exact test evidence. Do not deploy. Stop for review.
```

---

# Prompt 5 — Band Mobile Companion and Band Web Governance

```text
Implement the Band experience after reading all original documents, approved decisions, and all Band UI references.

Preserve one human UID per member. A band is an organization/profile with memberships; never create a shared band login.

Flutter mobile must support:
- band home with collective revenue summary, active gig, alerts, and member activity;
- shared live-stage view with permission-aware individual take-home estimates;
- campaign tracker;
- roster and invitation status;
- role badges and safe governance entry points;
- band profile/EPK preview and member credits.

Responsive web must support:
- dashboard;
- profile/EPK, performances, campaigns, fans, messages, marketing, media, sponsors, analytics, settings;
- roster invitations/removal and membership lifecycle;
- canonical band roles actually defined in source;
- documents/contracts/tax record vault with strict owner/member access;
- payouts, revenue, treasury, and versioned split configuration;
- ownership transfer through an isolated, high-security governance flow.

Split requirements:
- validate exactly 100% server-side;
- use integer arithmetic and an explicit deterministic remainder policy approved by the architecture; do not assume the owner receives every remainder unless source confirms it;
- require authorization, step-up verification, typed confirmation, versioning, member acknowledgement where required, and audit logs;
- never allow clients to write ledger, treasury, or payout records;
- handle pending invitations, removed members, unverified Stripe accounts, disputes, refunds, and split changes between earning and payout.

Testing must cover all permission boundaries, stale split version conflicts, totals below/above 100%, odd-cent allocation, ownership transfer cancellation/replay, member removal, missing Connect accounts, rules denial, responsive/accessibility behavior, and end-to-end band payout flows in test mode.

Create docs/antigravity/05_BAND_IMPLEMENTATION_REPORT.md with source/UI traceability and exact tests. Do not deploy. Stop for review.
```

---

# Prompt 6 — Sponsor Responsive Web Platform

```text
Implement the Sponsor platform as a secure, responsive, web-first B2B workspace inside the canonical Next.js application. Read every source document, approved decision, and Sponsor UI asset before editing.

Do not create a separate Sponsor Flutter application unless a later architecture decision explicitly approves it. The web portal must work well on phone browsers while prioritizing desktop workflows.

Implement or harden:
- dashboard with spend, active sponsorships, reach, deliverables, and ROI metrics with clear definitions;
- talent discovery using cards/list and accessible comparison for up to four candidates;
- sponsorship deal workspace;
- applications, shortlist, messages, opportunities/RFPs;
- documents and contract status;
- payments, escrow deposits, invoices, and receipts through Stripe-hosted/tokenized flows;
- analytics and saved/exportable reports;
- organization profile, team seats, invitations, permissions, security, and settings;
- match-pool creation, funding, eligibility rules, live drawdown, pause/end controls, and reconciliation;
- deliverable proof submission/review and milestone release.

Resolve sponsor roles from the actual RBAC source. Do not introduce BRAND_ADMIN, CAMPAIGN_MANAGER, LEGAL_COUNSEL, or FINANCE_OFFICER if they conflict with canonical SPONSOR_REP/SPONSOR_ADMIN roles. Record any needed role expansion as an architecture proposal rather than silently editing protected RBAC.

Security and finance:
- organization-scoped tenancy on every query/mutation;
- escrow and match-pool funds cannot fall below zero;
- server-authoritative eligibility, multiplier, ledger, milestone release, and refund logic;
- idempotency, signed webhooks, immutable audit history, and least privilege;
- analytics use privacy-preserving aggregates and never expose another organization's confidential data.

Test cross-tenant denial, invitation/role changes, match-pool exhaustion, duplicate match events, refund/dispute effects, deliverable rejection/revision/approval, export authorization, responsive layouts, keyboard/screen-reader behavior, and end-to-end sponsor flow in test mode.

Create docs/antigravity/06_SPONSOR_IMPLEMENTATION_REPORT.md with traceability and exact test evidence. Do not deploy. Stop for review.
```

---

# Prompt 7 — Enterprise Admin CRM and Operations Control Plane

```text
Implement or harden the Enterprise Admin/Staff control plane as a desktop-first responsive Next.js workspace. Read every original document, all decisions, and all Admin UI assets first.

Do not create a general-purpose Admin Flutter app. Responsive emergency actions on authenticated web are allowed only when they retain the same server-side authorization and step-up controls.

First resolve the canonical enterprise role list from packages/shared/src/models/rbac_constants.ts and protected architecture. The documents claim 16 roles but the roadmap omits EXECUTIVE from one list. Do not invent, rename, merge, or delete roles merely to make the count match.

Cover the existing canonical enterprise modules and routes, including:
- command dashboard and real-time monitor;
- users/people, organizations, artists, bands, venues, and 360-degree dossiers;
- campaigns and milestone review;
- transactions, balanced ledger inspector, payouts, refunds, disputes, reserves, and reconciliation;
- content/media moderation, reports, safety, fraud investigations, and account freezes;
- support inbox/tickets/SLA;
- alerts, engagement, announcements, and approved messaging workflows;
- system health, errors, logs, webhooks, integrations, feature flags, backup/restore policy views;
- audit inspector;
- administrators, roles, permissions matrix, and platform settings.

Authorization rules:
- enforce signed staff claims and granular permissions in middleware, server actions/route handlers, Cloud Functions, and Firestore rules where applicable;
- do not rely on UI hiding;
- step-up authentication and typed confirmation for destructive/high-risk actions;
- immutable audit entry for every privileged mutation;
- separate maker/checker approval for payouts, high-value refunds, role changes, and irreversible governance actions when required by policy;
- soft-delete/archive first; no destructive production operations in this phase.

Each action button must be real or explicitly labeled unavailable; no deceptive demo controls. Provide loading, empty, partial-data, stale-data, permission-denied, success, and failure states. High-density tables need keyboard access, filters, sorting, pagination, export authorization, bulk-action safeguards, sticky context, and confirmation summaries.

Test every enterprise role with allowed and denied route, component, callable, and data-access cases. Test privilege escalation, stale tokens, session revocation, audit immutability, bulk-action partial failures, refund/payout approval, fraud freeze/reinstate, privacy export/deletion orchestration, and responsive/accessibility behavior using fictitious emulator data.

Create docs/antigravity/07_ENTERPRISE_ADMIN_IMPLEMENTATION_REPORT.md with a role-permission-route test matrix and exact evidence. Do not deploy. Stop for review.
```

---

# Prompt 8 — Cross-Persona Integration, Firebase, Stripe, Notifications, and Observability

```text
Perform cross-persona integration only after Prompts 2–7 are approved. Read all original documents and implementation reports.

Verify that Fan, Solo Musician, Band, Sponsor, and Enterprise Admin surfaces share one canonical identity system, one operational Firestore model, one server-authoritative Functions layer, and consistent permission vocabulary.

Implement or harden verified gaps in:
- Firebase Auth lifecycle and persona switching;
- Firestore indexes, transactions, concurrency control, and offline-safe client behavior;
- default-deny Firestore/Storage rules with complete allowed-and-denied path tests;
- App Check for Android, iOS, and web with safe local emulator bypass only;
- FCM topic/device-token lifecycle, consent, unsubscribe, invalid-token cleanup, and role-aware notification routing;
- Storage MIME/size/ownership validation and safe thumbnail processing;
- Stripe SetupIntents, PaymentIntents, Connect Express, transfers, invoices/escrow where approved, refunds, disputes, and account.updated handling;
- webhook signature validation, event-id deduplication, idempotency, ordering tolerance, retries, and dead-letter/operational visibility;
- balanced double-entry ledger and nightly reconciliation in test/emulator environments;
- structured logs with correlation IDs, redaction, metrics, alerts, and privacy-preserving analytics taxonomy;
- universal links/deep links and web-to-app handoff.

Do not create a second database, GraphQL layer, PostgreSQL/Prisma runtime, BigQuery pipeline, Python backend, external CRM, blockchain rail, or browser extension. Existing Prisma artifacts may be documented as future/unused but not activated.

Run integration tests for identity/persona switching, Fan-to-artist tip, band split payout, sponsor match, refunds/disputes, admin review, notification delivery contracts, duplicate/out-of-order webhooks, unauthorized access, and listener cleanup. Use only Firebase Emulators, deterministic fictitious fixtures, and Stripe test mode.

Create docs/antigravity/08_CROSS_PLATFORM_INTEGRATION_REPORT.md, including a requirement-to-code-to-test traceability table. Do not deploy. Stop for review.
```

---

# Prompt 9 — Full QA, Security, Accessibility, Performance, and CI Gates

```text
Audit and validate the complete Crowdbeats platform. Do not add unrelated features. Read all four original documents and every Antigravity implementation report.

Run or create the appropriate CI checks against local emulators/test accounts:
- formatting and linting;
- TypeScript strict type-checking;
- Next.js production build and unit/component tests;
- Flutter analyze, Dart tests, widget tests, and golden tests where stable;
- Cloud Functions lint/type-check/unit/integration tests;
- Firestore and Storage rules tests with allowed and denied cases;
- shared contract/schema parity tests;
- Stripe webhook, idempotency, ledger, refund, dispute, and split invariant tests;
- end-to-end multi-persona scenarios;
- dependency vulnerability review and secret scanning;
- accessibility checks: WCAG 2.1 AA, keyboard, focus, screen readers, reduced motion, touch targets;
- performance checks: web Core Web Vitals and mobile frame/listener profiling;
- visual regression for approved UI references and design tokens;
- privacy/log redaction and data retention/deletion tests.

At minimum, validate these journeys:
1. new Fan signup and provider cancellation/retry;
2. Fan discovers/scans a verified live stage and tips with a saved tokenized card;
3. duplicate tap and duplicate/out-of-order Stripe webhook;
4. Solo Musician onboarding, KYC/Connect status, live session, rotating QR, campaign creation;
5. Band invitation, removal, role change, 100% split, odd-cent payout, ownership transfer;
6. Sponsor onboarding, talent shortlist, match-pool funding/drawdown, deliverable approval;
7. Admin moderation, fraud freeze/reinstate, refund, payout hold/release, claims change;
8. report/block, notification opt-out, account privacy export, and deletion/sanitization;
9. cross-tenant and cross-role denial attempts;
10. offline/retry/reconnect and real-time listener cleanup.

Do not report a test as passing if it was skipped, mocked beyond usefulness, or could not start. Classify PASS, FAIL, BLOCKED, or NOT IMPLEMENTED and include the exact command and concise evidence. Never weaken security rules to make tests pass.

Create:
- docs/antigravity/09_PRODUCTION_READINESS_REPORT.md
- docs/antigravity/09_REQUIREMENT_TRACEABILITY_MATRIX.md
- docs/antigravity/09_RELEASE_BLOCKERS.md

The traceability matrix must map every applicable requirement from all four source documents and every inventoried UI asset to implementation paths and test evidence. Zero unclassified requirements are allowed.

Do not deploy. Stop and wait for David's explicit release decision.
```

---

# Prompt 10 — Staging Release Only After Explicit Approval

```text
This prompt authorizes a STAGING release only if David has explicitly approved it and 09_RELEASE_BLOCKERS.md contains no unresolved critical blocker. It does not authorize production deployment.

Before any mutation:
- verify the exact Git branch, commit, clean/expected working tree, and staging Firebase project ID;
- verify that the target is not production;
- show the proposed commands and resources that will change;
- confirm Secret Manager references exist without printing secret values;
- confirm Stripe test mode, staging App Check configuration, restricted API keys, and staging OAuth redirect domains;
- confirm database/rules/index backups or rollback procedures as appropriate;
- rerun required release gates.

Deploy only approved components to the verified staging project. Do not deploy unrelated targets. Record deployment results, URLs, versions, health checks, smoke tests, rollback instructions, and known issues in docs/antigravity/10_STAGING_RELEASE_REPORT.md.

Run staging smoke tests for every persona without using real customer data or live payment methods. If target identity is ambiguous, any critical check fails, or a permission/credential boundary blocks the operation, stop without attempting a workaround.

Production remains prohibited. End with the exact staging status and required next decision.
```

---

## Optional Decision Prompt — Only If You Want Sponsor or Admin Native Mobile Apps

```text
Do not implement code. Prepare an Architecture Decision Record evaluating whether Crowdbeats should expand its Flutter app beyond Fan, Solo Musician, and Band roles to include Sponsor and/or Enterprise Admin roles.

Compare:
- responsive web/PWA only;
- limited native companion for approvals and alerts;
- full native workspace.

Evaluate security exposure, App Store review implications, device-loss risk, step-up authentication, push notifications, operational urgency, feature parity, development/test burden, cost, and maintenance. Recommend the smallest surface that solves real user needs. Map which exact workflows belong or do not belong on mobile.

Create docs/architecture/ADR_SPONSOR_ADMIN_MOBILE_SCOPE.md and stop for David's decision. Do not alter routes, roles, backend, or Flutter code.
```

---

## Required Antigravity Response Format After Every Implementation Prompt

Antigravity should end each phase with:

1. **Outcome:** what is genuinely complete.
2. **Source coverage:** which requirements and UI assets were used.
3. **Changed files:** exact paths and purpose.
4. **Data/security impact:** collections, rules, functions, claims, Stripe, secrets.
5. **Tests:** exact commands and PASS/FAIL/BLOCKED results.
6. **Visual/accessibility verification:** devices/viewports and findings.
7. **Unresolved gaps or decisions.**
8. **Git status:** staged, unstaged, and untracked changes.
9. **Safety confirmation:** no production data, secrets, or deployments unless explicitly authorized.
10. **STOP:** wait for review before the next phase.

## Final Reminder

The uploaded reports are inputs, not permission to overwrite working code. Antigravity must preserve user changes, verify repository reality, use small reversible commits, and never “complete” a phase by replacing functional implementations with mock screens or hard-coded sample data.
