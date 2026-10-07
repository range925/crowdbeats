# Crowdbeats V2 - Clean-Room Google Antigravity Master Plan and Prompt Pack

**Prepared for:** David Naufahu, Crowdbeats LLC  
**Build type:** Completely new cross-platform product  
**Primary mobile:** Flutter for iOS and Android  
**Web:** Next.js, React, and TypeScript  
**Backend:** Brand-new Firebase environment  
**Payments:** Stripe and Stripe Connect  
**Execution:** One Antigravity phase at a time  
**Reference date:** August 25, 2026

---

## 1. The Decision

Crowdbeats V2 should be created as a clean-room rebuild in a completely new local folder, a new Git repository, and a new Firebase environment. The previous Crowdbeats repositories and Firebase projects are historical references only.

The recommended structure is one coordinated Antigravity workspace containing three separately deployable applications:

| Surface | Technology | Primary users | Purpose |
|---|---|---|---|
| Native mobile app | Flutter and Dart | Fans, Solo Musicians, Band Members/Owners | Fast, thumb-friendly, on-the-go discovery, tipping, live-session, campaign, and roster workflows |
| Responsive web platform | Next.js App Router, React, TypeScript | Solo Musicians, Bands, Sponsors, Venues, Platform Staff; limited Fan account support | Full creator, organization, finance, analytics, administration, and settings workflows |
| Trusted backend | Firebase Auth, Firestore, Functions Gen 2, Storage, FCM, App Check | All clients | One identity system, one operational data model, server-authoritative business logic, security, notifications, and Stripe integration |

Do not create one unrelated Antigravity project for mobile and another unrelated project for web. That would increase schema drift, duplicate authentication logic, split security rules, and make financial logic harder to control. Use one new monorepo and separate application folders so Flutter, Next.js, and Functions share architecture and release gates without sharing incompatible source code.

Use separate Firebase projects for environments:

- `crowdbeats-v2-dev` - first cloud environment; local emulators remain the default during development.
- `crowdbeats-v2-staging` - created only when the platform is ready for integration testing.
- `crowdbeats-v2-prod` - created/configured only after staging is approved.

The exact Firebase project IDs must be checked for availability. Antigravity must never guess that these example IDs are available, and it must never select an existing Crowdbeats project as a substitute.

---

## 2. Clean-Room Boundary

### 2.1 What Antigravity may use

Antigravity may extract and rewrite:

- product goals;
- user personas;
- workflows;
- screen inventories;
- business rules;
- security requirements;
- testing expectations;
- accessibility requirements;
- brand direction;
- Google Stitch references and approved visual assets;
- Firebase, Stripe, and deployment requirements.

### 2.2 What Antigravity must not use

Antigravity must not copy, import, move, merge, vendor, refactor, or depend on:

- any code from a previous Crowdbeats repository;
- any former `apps/mobile_flutter`, `apps/admin_web`, `apps/functions`, `packages/shared`, `mobile_flutter`, `public`, or preview-harness directory;
- any former lockfile, package manifest, Firebase configuration, rules file, index file, environment file, generated file, CI workflow, test fixture, or build artifact;
- any old Firebase project, Firestore data, Storage object, Auth user, API key, OAuth client, service account, Cloud Function, Hosting target, App Check configuration, extension, Secret Manager value, or Stripe webhook destination;
- former `.firebaserc`, `firebase.json`, `GoogleService-Info.plist`, `google-services.json`, signing files, certificates, or application identifiers;
- former screenshots as a source of security, data, or payment architecture.

No old code is to be “cleaned up” or “migrated.” V2 receives newly authored files only.

### 2.3 Contamination audit

Before and after every implementation phase, Antigravity must verify:

- the workspace path is the new V2 folder;
- the Git remote is the new V2 repository;
- no Git submodule or local file dependency points to a former repository;
- no package uses `file:`, path, or workspace references outside the new repository;
- no Firebase alias/project ID is inherited;
- no former Android package name or Apple bundle ID is inherited accidentally;
- no secrets or credential files are committed;
- no copied source file contains an old repository path or legacy application name;
- generated configuration was created for V2 and not copied from V1.

Create `docs/clean-room/CLEAN_ROOM_PROVENANCE_LOG.md`. Every phase must record new files created, generators used, reference requirements used, and the result of the contamination scan.

---

## 3. How the Uploaded References Were Resolved

The source materials are useful, but they describe different moments in the former project. For V2 they are requirements evidence, not existing-code truth.

| Reference | What V2 keeps | What V2 rejects or revalidates |
|---|---|---|
| `Crowdbeats V2.pdf` | Clean-room rebuild; Flutter mobile; Next.js web; new Firebase; one UID; multi-persona model; Stripe; phased build; Uber/Lyft-inspired simplicity | Any assumption that example project IDs or versions already exist |
| `CROWDBEATS_GOOGLE_ANTIGRAVITY_PROMPT_PACK.md` | Phase-by-phase execution, reports, traceability, safety stops, persona-specific scope | Instructions to inspect, reuse, harden, or modify the existing repository |
| `FLUTTER_REMOVAL_IMPACT_AUDIT.md` | Warning that one unified web client can reduce duplication | Its recommendation to remove Flutter; it applies to the former repository and conflicts with the current explicit request for a true iOS/Android app |
| `CROWDBEATS_SKILL_REQUIREMENTS(2).md` | Firebase, Flutter, web, accessibility, security, performance, test, and data-loss-prevention capability categories | Old version numbers, old file counts, and claims that features already exist |
| `CROWDBEATS_ARCHITECTURE_VALIDATION(2).md` | Architectural invariants: one identity, default deny, server-authoritative finance, granular RBAC, audited privileged actions | All claims about old paths, old test results, existing files, implemented functions, and protected legacy files |
| `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP(2).md` | Role surfaces, workflow coverage, dependency ordering, test expectations | Old route/file paths, unsupported named-personality AI writing features, automatic production deployment, and the assumption that the prior role lists were internally consistent |

### Canonical conflict decisions

1. **Flutter remains.** Flutter is the new native mobile client. Next.js is not a replacement for the native application.
2. **One new monorepo.** Mobile, web, backend, shared specifications, tests, and documentation live in one new repository but remain separately deployable.
3. **No former repository has authority over V2.** The user's current request and this clean-room contract take precedence.
4. **Enterprise roles require a new decision record.** The sources say 16 roles, while one list contains 15 and omits `EXECUTIVE`. V2 begins with a role proposal and does not hard-code claims until David approves the canonical list.
5. **Sponsor roles require a new decision record.** `SPONSOR_REP`/`SPONSOR_ADMIN` conflict with `BRAND_ADMIN`, `CAMPAIGN_MANAGER`, `LEGAL_COUNSEL`, and `FINANCE_OFFICER`. Antigravity must propose an organization-role model and wait for approval.
6. **Accessibility floor is WCAG 2.2 AA.** Higher contrast for dark venue/live modes is a design goal, not a reason to make unsupported AAA claims.
7. **No imitation of living people.** The former “Steve Jobs / Simon Sinek generator” requirement is excluded. Writing assistance may offer neutral controls such as clarity, confidence, warmth, concision, and audience.
8. **Crowdbeats Cash is deferred.** A stored-value wallet introduces legal, accounting, refund, custody, and regulatory questions. Keep it behind an approved architecture/legal decision; do not build it as an ordinary balance field.
9. **QR and verified proximity come first.** Camera-based performer recognition and BLE beacon features are later capability tracks after privacy, consent, accuracy, abuse, App Store, and operational reviews.
10. **Staging may be automated after approval; production never is.** Production deployment requires a separate, explicit instruction from David.

---

## 4. Crowdbeats V2 Product Principle

The product is not an Uber or Lyft clone. It should borrow their interaction discipline:

- one obvious primary action per screen;
- minimal choices at decision time;
- short, reversible onboarding;
- saved preferences that remove repetition;
- progressive disclosure for advanced tools;
- large touch targets and bottom sheets on mobile;
- clear status, price, recipient, and confirmation before payment;
- immediate feedback after an action;
- understandable recovery when permissions, network, or payments fail.

Crowdbeats must retain an original music-first identity. Do not copy Uber/Lyft trademarks, logos, exact layouts, illustrations, icons, copy, trade dress, animation, or proprietary assets.

### Premium visual direction

- Primary pink: `#FF97BA`
- Supporting violet: `#8B5CF6`
- Obsidian: `#131315`
- Neutral surfaces with generous whitespace in light mode
- Deep, high-contrast stage surfaces in dark/live mode
- Warm human photography and music-specific iconography
- Restrained gradients; no visual noise behind essential actions
- Rounded surfaces used consistently, not on every container
- Motion should communicate state and respect reduced-motion preferences
- Design tokens must be semantic and themeable; raw colors must not be scattered through components

### Mobile navigation

| Persona | Default bottom navigation | Primary action |
|---|---|---|
| Fan | Home, Nearby, Tip, Activity, Profile | Identify performer and tip |
| Solo Musician | Home, Live, Campaigns, Fans, Profile | Check In / Go Live |
| Band | Home, Live, Campaigns, Members, Profile | Manage or join live session |

Sponsor, Venue, and Enterprise Admin are web-first. A small native approval/alert companion may be evaluated later through an architecture decision; it is not part of the initial V2 build.

---

## 5. V2 Technical Architecture

### 5.1 Proposed new repository

Create a new folder such as:

```text
C:\Users\Knauf\Documents\GitHub\crowdbeats-v2
```

Suggested layout:

```text
crowdbeats-v2/
  apps/
    mobile/                   # new Flutter application only
    web/                      # new Next.js application only
    functions/                # new Firebase Functions Gen 2 application only
  packages/
    contracts/                # platform-neutral JSON Schema/OpenAPI/event contracts
    design-tokens/            # canonical token source and generators
    web-sdk/                  # generated/typed TypeScript client helpers
    config/                   # lint, format, TypeScript, and test configuration
  firebase/
    firestore.rules
    firestore.indexes.json
    storage.rules
    emulator-data/            # fictitious deterministic data only
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
  firebase.json
  .firebaserc.example
  README.md
```

Do not place Flutter in a JavaScript package-manager workspace if doing so provides no concrete benefit. The root orchestration may call Flutter commands explicitly while JavaScript workspaces cover `apps/web`, `apps/functions`, and TypeScript packages.

### 5.2 Source-of-truth boundaries

| Concern | Canonical source | Consumers |
|---|---|---|
| Human identity | Firebase Authentication UID plus `/users/{uid}` | Mobile, web, Functions |
| Persona/profile state | Firestore membership/profile documents | Mobile, web, Functions |
| Authorization | Server-owned role/permission definitions and verified memberships | Functions, web server, Rules; clients display only |
| API contracts | Platform-neutral schema/OpenAPI/event specifications | Generated/tested TypeScript and Dart models |
| Money and ledger | Functions and append-only server-authored ledger | Read-only views in mobile/web |
| Design tokens | `packages/design-tokens` source | Generated Flutter theme and web CSS/TypeScript tokens |
| Product/design decisions | Approved ADRs and Google Stitch mapping | All applications |

Do not make TypeScript/Zod the only domain source and then manually reinterpret it in Dart. Use platform-neutral contracts with generation or automated parity tests.

### 5.3 Identity model

- One human equals one Firebase Auth UID.
- A user may have Fan, Artist, Band, Sponsor, Venue, or approved Staff contexts.
- Organizations and bands are resources with membership records, not shared logins.
- Switching persona changes authorized context; it does not create a second account.
- Firebase custom claims stay small and are used for coarse, infrequently changing staff access only.
- Frequently changing organization permissions are resolved server-side from membership records.
- Claims and membership checks are never replaced by hidden buttons.

### 5.4 Backend boundary

Client applications may directly read/write only low-risk data explicitly allowed by security rules. Privileged state transitions use callable/HTTP Functions or protected web-server routes that revalidate identity, App Check where applicable, permission, resource membership, input schema, idempotency, and current state.

Server-only operations include:

- staff role/claim assignment;
- verification approval;
- campaign publication/approval where moderation is required;
- stage QR token generation/verification secrets;
- PaymentIntent and SetupIntent creation;
- Stripe Connect onboarding links;
- ledger entries and balances;
- refunds, disputes, reserves, payouts, transfers, and split execution;
- sponsorship escrow/match-pool accounting;
- immutable audit logs;
- account suspension/session revocation;
- privacy export/deletion orchestration.

### 5.5 Financial invariants

- Store money as integer minor units and an ISO currency code.
- Never use binary floating point for money.
- Every authoritative financial event has an idempotency key.
- Stripe webhook signatures are verified using the official server SDK.
- Event IDs are deduplicated; out-of-order events are tolerated through state reconciliation.
- Ledger transactions are append-only and balanced: total debits equal total credits.
- Clients cannot write ledger, balance, payout, refund, escrow, or reserve state.
- A band split version must total exactly 100% using an exact representation approved by the contract.
- Odd-cent allocation follows a deterministic documented policy; do not silently award every remainder to the owner.
- Saved payment UI displays safe metadata only, such as brand, last four, and expiration. It never stores or displays the full PAN or CVC.
- Stripe and platform transaction states must be modeled separately and reconciled.

### 5.6 Firebase isolation checklist

The V2 Firebase bootstrap phase must:

1. Record the exact Google Cloud/Firebase account and new project ID before any command.
2. Refuse any project whose ID, number, alias, Auth tenant, Hosting target, or database matches a former project.
3. Use Firebase Emulator Suite as the default local target.
4. Generate new Android/iOS/web app registrations.
5. Define new Android application ID and Apple bundle ID only after David approves them.
6. Generate new OAuth clients, SHA fingerprints, APNs configuration, App Check registrations, and authorized domains.
7. Create new Firestore database, Storage bucket, Functions region decision, rules, indexes, budgets, alerts, IAM, logs, and retention settings.
8. Configure Stripe test-mode endpoints for V2 only.
9. Store secrets in Secret Manager; never in chat, source code, `.env` committed files, or client configuration.
10. Produce `docs/architecture/FIREBASE_V2_BOOTSTRAP_RECORD.md` without printing secret values.

---

## 6. Functional Scope

### 6.1 Shared authentication and onboarding

- Splash and app initialization
- Welcome and value statement
- Email/password signup and login
- Google Sign-In
- Sign in with Apple where required/supported
- Email verification
- Password reset and account recovery
- Provider cancellation/retry
- Safe error messages resistant to account enumeration
- Persona selection and persona switching
- Progressive profile completion
- Notification, camera, and location education before OS prompts
- Terms/privacy acknowledgement with versioned consent records
- Suspended/disabled/deleted account handling
- Device/session management and security settings

### 6.2 Fan native app

Fan path: **identify -> amount -> confirm**.

- Home with nearby/live context and one primary next action
- Nearby map/list with permission-aware fallback
- QR scan, nearby selection, and search
- Verified artist/stage identity before payment
- Preset/custom tip amount
- Saved/default Stripe-tokenized payment method
- Apple Pay/Google Pay where supported
- Clear recipient, amount, fees if applicable, and final consent
- Success, receipt, status, failure, cancellation, retry, and duplicate-tap safety
- Activity and monthly support summary
- Following, notifications, loyalty/VIP only after rules are documented
- Campaign discovery and contribution
- Profile, payment methods, privacy, security, export, and deletion
- Deep links/universal links for performer, stage, tip, and campaign

The three-tap metric begins after the performer is already known and a valid default payment method exists. Safety confirmation must not be removed to achieve the metric.

### 6.3 Solo Musician

Native mobile:

- creator home and payout/KYC status;
- Check In / Go Live;
- venue/stage selection and verification;
- rotating server-signed QR with expiry and anti-replay behavior;
- live tip stream and supporter count;
- session duration, end session, and earnings summary;
- mobile campaign overview/update;
- fan/patron summary;
- EPK/profile preview;
- notifications and urgent payout/account status.

Web Creator Studio:

- dashboard;
- artist profile and EPK;
- live performances, calendar, setlists, and stage tools;
- campaign wizard: type, story, goal/rewards, details, media, review, launch;
- post-launch workspace: overview, contributions, updates, messages, fans, payouts, analytics, marketing, rewards, and settings;
- tips, fans CRM, messages, media, sponsorships, payout history, analytics, security, privacy, and team/delegated access if approved;
- Stripe Connect Express onboarding and status using server-created links.

### 6.4 Bands

Native mobile:

- band home, active session, collective summary, and alerts;
- live-stage view;
- campaign tracker;
- member roster, invitations, and role visibility;
- band EPK/profile and member credits;
- governance entry points with step-up authentication for high-risk actions.

Web Band Studio:

- dashboard;
- band profile/EPK;
- members, invitations, roles, removal, and ownership lifecycle;
- performances, campaigns, fans, messages, media, marketing, analytics, sponsors, documents, settings;
- revenue, treasury views, payouts, and versioned split configuration;
- isolated ownership transfer and danger zone.

There is no shared band login. Members use their own UID and membership.

### 6.5 Sponsors

Web-first B2B platform:

- dashboard with clearly defined spend, reach, deliverables, and ROI metrics;
- talent discovery and comparison;
- sponsorships, applications, shortlist, messages, and opportunities/RFPs;
- contracts/documents, payments, invoices, receipts, and milestone status;
- organization profile, team seats, invitations, roles, security, and settings;
- match-pool proposal, funding, eligibility, pause/end, drawdown, and reconciliation after financial/legal approval;
- deliverable proof submission/review and milestone release;
- organization-isolated analytics and reports.

### 6.6 Venues

Web-first platform:

- venue profile;
- stages and verification configuration;
- events and performances;
- artist relationships;
- live sessions and operational status;
- staff memberships and permissions;
- analytics and settings.

BLE beacons and fine-grained geofences begin as an ADR/prototype, not as an unreviewed production dependency.

### 6.7 Enterprise Admin and CRM

Desktop-first web control plane, grouped rather than crowded onto one dashboard:

- Command Center and real-time monitor
- CRM for people and organizations
- Artists and Bands operations
- Campaign review and milestone operations
- Live stage/session operations
- Finance: transactions, ledger inspector, payouts, refunds, disputes, reserves, reconciliation
- Sponsorships
- Venues and Events
- Community, reports, and moderation
- Trust & Safety and fraud investigations
- Support inbox, tickets, and SLA
- Marketing, announcements, and approved messaging
- Content and Media
- Analytics and reporting
- Platform health, errors, webhooks, integrations, feature flags, and jobs
- Administration: staff, roles, permissions, settings, audit, and policy views

High-risk actions require server authorization, step-up authentication, typed confirmation, audit events, and maker/checker approval where policy requires it.

---

## 7. Design and Google Stitch Workflow

Google Stitch is the approved visual reference, but implementation begins only after a mapping pass.

1. Inventory every Stitch project, screen, export, screenshot, and state.
2. Assign each reference a persona, route, viewport, mode, state, and phase.
3. Mark conflicts, duplicates, missing states, and inaccessible patterns.
4. Extract semantic design tokens instead of copying arbitrary values screen by screen.
5. Create mobile and web component inventories.
6. Implement a small design-system gallery in both Flutter and Next.js.
7. Compare rendered results at approved viewports.
8. Obtain approval before scaling the components across product routes.

Every significant screen requires:

- loading;
- empty;
- partial/stale data;
- offline where relevant;
- permission denied;
- validation error;
- server error;
- success;
- disabled/read-only where relevant;
- light/dark mode if supported;
- keyboard, screen reader, text scaling, focus, and reduced motion verification.

---

## 8. Phase Plan

| Phase | Outcome | Hard stop |
|---|---|---|
| 0 | Clean workspace, reference coverage, architecture decisions, no app code | David approves architecture and unresolved role/app-ID decisions |
| 1 | New repository and toolchain skeleton | Clean-room and local test gates pass |
| 2 | New Firebase dev bootstrap and Emulator Suite | Exact new target verified; no former cloud target |
| 3 | Contracts, identity, memberships, RBAC, default-deny rules | Allowed/denied tests pass |
| 4 | Design tokens, Stitch mapping, shared components | Visual and accessibility approval |
| 5 | Authentication, onboarding, persona switching | Auth and negative authorization E2E pass |
| 6 | Fan mobile vertical slice and limited Fan web account | 3-tap test and payment safety pass |
| 7 | Solo Musician mobile and Creator Studio | Live-session, QR, campaign, Connect tests pass |
| 8 | Band mobile and Band Studio | Governance and split invariants pass |
| 9 | Sponsor and Venue web | Tenant isolation and finance tests pass |
| 10 | Enterprise Admin/CRM | All approved staff role boundaries pass |
| 11 | Cross-persona integration, notifications, observability | Contract, event, retry, redaction tests pass |
| 12 | Security, privacy, accessibility, performance, full QA | No critical blockers |
| 13 | Staging release | Explicit staging approval |
| 14 | Production readiness/deployment | Separate explicit production approval |

---

## 9. Instructions Before Using the Prompts

1. Create/open an empty `crowdbeats-v2` folder in Google Antigravity. Do not open the old Crowdbeats folder.
2. Attach the six reference files to Antigravity as read-only requirements references.
3. Attach or link approved Google Stitch screens and Crowdbeats brand assets.
4. Paste **Prompt 0** only.
5. Review its decision report before pasting **Prompt 1**.
6. Paste one prompt at a time. Never paste the entire pack as a single build command.
7. Keep Firebase Emulators and Stripe test mode as the default until the relevant release prompt.
8. Never paste secrets, service-account JSON, certificates, signing keys, full card data, or production exports into Antigravity.

---

# 10. Antigravity Prompt Pack

## Prompt 0 - Reference Ingestion and Clean-Room Architecture Contract

```text
CROWDBEATS V2 - PHASE 0 - READ-ONLY CLEAN-ROOM CONTRACT

You are in a new, empty Crowdbeats V2 workspace. This is not a migration, cleanup, refactor, continuation, fork, or restoration of any former Crowdbeats project.

Do not create application code, install dependencies, initialize Git/Firebase, deploy, delete, copy, or modify cloud resources during this phase.

Read completely:
- Crowdbeats V2.pdf
- CROWDBEATS_GOOGLE_ANTIGRAVITY_PROMPT_PACK.md
- FLUTTER_REMOVAL_IMPACT_AUDIT.md
- CROWDBEATS_SKILL_REQUIREMENTS(2).md
- CROWDBEATS_ARCHITECTURE_VALIDATION(2).md
- CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP(2).md

Treat them as product and architecture references only. Statements about old paths, old code, old test results, old versions, and implemented features are not V2 facts.

Current authority order:
1. David's current instruction for a completely new V2 platform.
2. This clean-room phase prompt.
3. Crowdbeats V2.pdf for current product direction.
4. The uploaded Markdown files for requirements evidence.
5. Google Stitch and approved visual references for visual intent only.

Mandatory decisions:
- Flutter is the new native iOS/Android client.
- Next.js is the new responsive web client.
- Firebase is a completely new backend/environment.
- Use one new monorepo with separately deployable mobile, web, and Functions applications.
- Never copy/import/reference files or credentials from the former projects.
- One human has one Firebase UID and may hold multiple personas/memberships.
- Finance, staff authorization, privileged transitions, and audit logging are server-authoritative.
- Do not imitate Uber/Lyft branding or proprietary UI; use their simplicity only as UX inspiration.

Inspect the installed Antigravity/AAS skill catalog. Select only skills needed for this phase. Read each selected skill before acting. Do not install or load unrelated skills. Record exact skill names, why each applies, and any conflict between a skill and this prompt. This prompt wins over generic skill defaults.

Create documentation only:
1. docs/antigravity/00_REFERENCE_COVERAGE_MATRIX.md
2. docs/clean-room/CLEAN_ROOM_ARCHITECTURE_CONTRACT.md
3. docs/decisions/00_CONFLICT_RESOLUTION_LOG.md
4. docs/product/00_PERSONA_SURFACE_SCOPE.md
5. docs/architecture/00_V2_TARGET_ARCHITECTURE.md
6. docs/antigravity/00_SKILL_EXECUTION_PLAN.md
7. docs/antigravity/00_OPEN_DECISIONS.md

The coverage matrix must prove each reference was fully read and map requirements to personas, platforms, phases, conflicts, and decisions.

The open-decision report must include, at minimum:
- final V2 repository name;
- Android application ID;
- Apple bundle ID;
- public web/app domains;
- Firebase/GCP account owner;
- Firebase region/data-location choice;
- enterprise role list including whether EXECUTIVE is included;
- sponsor organization role list;
- platform fee/refund/payout policies;
- Crowdbeats Cash defer/approve decision;
- camera recognition and BLE/geofence deferral;
- age eligibility, geographic launch area, and legal-policy ownership.

Do not invent answers. Recommend defaults, identify consequences, and mark each item APPROVED, RECOMMENDED, or NEEDS DAVID DECISION.

End with: outcome, references read, skills used, files created, unresolved decisions, contamination status, Git status if Git exists, and confirmation that no app code, dependency, old file, Firebase resource, Stripe resource, or deployment was changed.

STOP. Wait for David's approval.
```

## Prompt 1 - New Repository and Toolchain Skeleton

```text
CROWDBEATS V2 - PHASE 1 - NEW REPOSITORY SKELETON

Continue only after David approves Phase 0 decisions. Re-read all Phase 0 outputs and the six source references relevant to this phase.

This workspace must be empty/new. Before creating anything, record:
- absolute workspace path;
- Git status/remotes if present;
- absence of files copied from former Crowdbeats repositories;
- selected installed skills and their instructions.

Create a new monorepo with:
- apps/mobile: a newly generated Flutter application for iOS and Android only;
- apps/web: a newly generated Next.js App Router application using React and strict TypeScript;
- apps/functions: newly generated TypeScript Firebase Functions Gen 2 source;
- packages/contracts;
- packages/design-tokens;
- packages/web-sdk;
- packages/config;
- firebase, docs, scripts, and .github/workflows directories.

Choose currently supported stable tool versions based on official manifests/tooling available in the environment. Record exact versions and compatibility evidence in docs/architecture/01_TOOLCHAIN_VERSION_LOCK.md. Do not copy version numbers from the legacy reports without verifying them.

Create root orchestration that handles JavaScript workspaces and explicit Flutter commands without treating Dart as a JavaScript package.

Create:
- README with local prerequisites and safe commands;
- formatting/lint/static-analysis baselines;
- minimal test runners;
- environment variable examples with names only and no values;
- secret scanning and dependency review baseline;
- CODEOWNERS/architecture protection proposal;
- a local-only CI skeleton that does not deploy.

Do not connect Firebase, create features, or add mock production logic. Use only generated starter content, then replace generic sample screens with a neutral Crowdbeats V2 bootstrap placeholder.

Run format, static analysis, unit starter tests, and builds for each new application. Classify every check PASS, FAIL, BLOCKED, or NOT IMPLEMENTED.

Create docs/antigravity/01_REPOSITORY_BOOTSTRAP_REPORT.md and update docs/clean-room/CLEAN_ROOM_PROVENANCE_LOG.md.

STOP. Do not proceed to Firebase.
```

## Prompt 2 - Brand-New Firebase Development Environment

```text
CROWDBEATS V2 - PHASE 2 - NEW FIREBASE DEV BOOTSTRAP

Continue only after Phase 1 is approved. This phase may create/configure a new development Firebase project only after showing the exact proposed project/account/region and receiving David's explicit approval inside this phase. It never authorizes staging or production.

Before any Firebase command:
- show authenticated Firebase/Google account without exposing tokens;
- list project IDs safely;
- prove the selected target is new and not any former Crowdbeats project;
- show proposed project display name, project ID, billing implications, region/data location, and resources;
- inspect accidental-data-loss-prevention and Firebase skills and follow them;
- do not use --force, aliases that could hide the target, or inherited .firebaserc files.

After explicit approval, initialize V2 configuration from scratch:
- Auth provider plan;
- Firestore and indexes;
- Storage;
- Functions Gen 2;
- Hosting/App Hosting decision for Next.js based on current official support;
- Emulator Suite;
- App Check plan for iOS, Android, and web;
- FCM;
- Analytics/Performance/Crash reporting plan;
- budgets, alerts, IAM, logging, retention, backup/restore, and Secret Manager plan.

Register new mobile/web application records only with approved application IDs. Do not commit google-services.json, GoogleService-Info.plist, service accounts, APNs keys, Android signing keys, or secrets unless the approved repository policy explicitly permits a safe public client config; default to ignoring downloaded platform files until policy is documented.

Do not enable Stripe live mode. Do not create production data. Emulator fixtures must be deterministic and fictitious.

Create:
- docs/architecture/02_FIREBASE_V2_BOOTSTRAP_RECORD.md
- docs/security/02_CLOUD_BOUNDARY_AND_IAM_PLAN.md
- docs/testing/02_EMULATOR_WORKFLOW.md
- docs/antigravity/02_FIREBASE_BOOTSTRAP_REPORT.md

Record exact target identifiers, commands, results, changed resources, rollback/cleanup procedure, and cost-sensitive services without printing secrets.

STOP.
```

## Prompt 3 - Contracts, Data Model, Identity, Memberships, RBAC, and Rules

```text
CROWDBEATS V2 - PHASE 3 - TRUST FOUNDATION

Implement no persona dashboards yet.

Read all approved decisions, current source, and relevant Firebase/security/contract/Flutter/web skills.

Design first, then implement:
- one Firebase Auth UID per human;
- user, persona profile, band, sponsor organization, venue, and staff membership models;
- role -> permission -> resource -> action authorization;
- platform-neutral schemas and API/event contracts with generated or parity-tested Dart and TypeScript models;
- typed success/error envelope with correlation ID and safe error taxonomy;
- default-deny Firestore and Storage rules;
- server-authored immutable audit event contract;
- idempotency record contract;
- privacy classification, ownership, retention, indexing, and deletion behavior per collection;
- version fields and concurrency strategy for high-risk resources.

Propose the canonical collection model before implementation. Cover users, profiles/personas, artists, bands/memberships, sponsors/memberships, venues/memberships, campaigns/rewards/contributions, stages/sessions/tips, payment mappings/transactions/ledger/payouts, sponsorships/match pools, messages/notifications, reports/moderation/fraud, audit, settings, consents, and idempotency.

Do not add a client-writable balance. Do not store raw card data. Do not place rapidly changing permissions in oversized custom claims. Do not use a single admin boolean as complete authorization.

Create allowed and denied Emulator tests for every collection path and sensitive field. Test cross-user, cross-band, cross-sponsor, cross-venue, and staff privilege-escalation attempts.

Create:
- docs/data/03_CANONICAL_DATA_DICTIONARY.md
- docs/architecture/03_IDENTITY_PROFILE_MEMBERSHIP_MODEL.md
- docs/security/03_RBAC_PERMISSION_MATRIX.md
- docs/security/03_FIRESTORE_STORAGE_RULES_MODEL.md
- docs/architecture/03_API_EVENT_CONTRACTS.md
- docs/antigravity/03_TRUST_FOUNDATION_REPORT.md

STOP after all trust-foundation gates are classified.
```

## Prompt 4 - Design System and Google Stitch Mapping

```text
CROWDBEATS V2 - PHASE 4 - DESIGN FOUNDATION

Read every supplied Google Stitch link/export, screenshot, flow, logo, and brand asset. Inventory them before implementation. Visual references cannot override security, consent, accessibility, or platform conventions.

Create a premium original Crowdbeats system inspired by the clarity and effortlessness of Uber/Lyft, without copying their trade dress, component shapes, icons, language, or screen composition.

Create semantic tokens for color, typography, spacing, grid, radius, elevation, focus, motion, breakpoint, touch size, data visualization, and live-stage modes. Start from #FF97BA, #8B5CF6, and #131315, then validate accessible combinations.

Implement a small component gallery in Flutter and Next.js. Include buttons, inputs, cards, navigation, bottom sheet/drawer/modal, toast/banner, avatar, status, skeleton, empty/error state, table primitives, confirmation, amount selector, and accessible charts where needed.

Requirements:
- WCAG 2.2 AA release floor;
- 48x48 dp native touch targets and at least 44x44 CSS px web controls;
- text scaling and reflow;
- keyboard and screen-reader semantics;
- visible focus;
- reduced motion;
- no color-only status;
- no glass/blur effect that harms contrast or performance;
- no hard-coded raw brand colors in product components;
- responsive web at phone, tablet, laptop, and large desktop widths.

Create:
- docs/design/04_STITCH_ASSET_COVERAGE_MATRIX.md
- docs/design/04_DESIGN_TOKENS.md
- docs/design/04_COMPONENT_INVENTORY.md
- docs/design/04_RESPONSIVE_AND_ACCESSIBILITY_STANDARD.md
- docs/antigravity/04_DESIGN_FOUNDATION_REPORT.md

Capture verified renders for approved viewports. Do not build persona features yet. STOP for visual approval.
```

## Prompt 5 - Authentication, Onboarding, and Persona Switching

```text
CROWDBEATS V2 - PHASE 5 - AUTHENTICATION AND ONBOARDING

Implement shared auth/onboarding across Flutter and Next.js using the approved identity and design foundations.

Cover:
- splash/bootstrap and auth-state resolution;
- email/password registration and login;
- Google Sign-In;
- Sign in with Apple where applicable;
- email verification;
- password reset/recovery;
- OAuth cancellation/retry;
- account-linking collision recovery;
- enumeration-resistant errors;
- versioned consent;
- persona creation/selection/switching;
- progressive Fan, Artist, Band, Sponsor, and Venue onboarding appropriate to each surface;
- permission education before camera/location/notification OS prompts;
- suspended, disabled, deleted, offline, expired-session, and revoked-session states;
- secure device/session and account-deletion entry points.

Staff onboarding and staff claims are server-only administrative operations; there is no public “choose Admin” option.

Add route guards and server authorization. Test UI hiding and direct URL/callable/data access independently. Use only Emulator users.

Create docs/antigravity/05_AUTH_ONBOARDING_REPORT.md with route/flow coverage, tests, accessibility, provider configuration blockers, and contamination status.

STOP.
```

## Prompt 6 - Fan Vertical Slice

```text
CROWDBEATS V2 - PHASE 6 - FAN NATIVE EXPERIENCE

Build the Fan native mobile experience as the first complete end-to-end vertical slice. Build only a limited responsive Fan web account area for receipts, payment-method launch points, followed artists, privacy, security, and account settings.

Native tabs: Home, Nearby, Tip, Activity, Profile.

Implement the primary path:
known/scanned verified performer -> amount -> confirmation -> Stripe test payment -> verified webhook -> balanced ledger -> receipt -> creator activity update.

When a default tokenized payment method exists, the path from known performer to confirmed tip must require no more than three intentional taps while retaining final consent.

Include QR, nearby list/map fallback, search, permission education/denial recovery, payment cancellation, duplicate tap prevention, idempotent retry, offline/reconnect, saved payment metadata, campaign discovery/contribution, following, notifications, receipt status, privacy export, and account deletion entry.

Use SetupIntents/PaymentSheet or the officially supported Stripe mobile flow; never build card inputs that cause the app to handle raw PAN/CVC. All ledger/loyalty/refund state is server-authored.

Crowdbeats Cash remains unimplemented unless an approved ADR and legal/payment architecture explicitly authorizes it.

Test widget, integration, Rules, Functions, Stripe webhook, duplicate/out-of-order event, accessibility, text scaling, deep link, and real-device permission behavior where available.

Create docs/antigravity/06_FAN_VERTICAL_SLICE_REPORT.md. STOP.
```

## Prompt 7 - Solo Musician Mobile and Creator Studio

```text
CROWDBEATS V2 - PHASE 7 - SOLO MUSICIAN

Build the approved Solo Musician native companion and responsive Creator Studio.

Mobile: Home, Live, Campaigns, Fans, Profile. Make Check In / Go Live the obvious context-aware primary action.

Implement verified stage/session lifecycle, server-signed expiring QR, countdown/refresh, anti-replay, session end/summary, real-time tip stream with listener cleanup, payout/KYC status, mobile campaign overview/update, fan summary, EPK preview, notifications, and failure/offline states.

Web: dashboard, profile/EPK, performances/calendar/setlists, campaigns, contributions, updates, fans, messages, payouts, analytics, marketing, media, rewards, sponsorships, security, privacy, and settings. Implement the campaign creation and post-launch workflows from the approved scope.

Stripe Connect onboarding links and financial transitions are created server-side. Campaign publication, verification, escrow, payout, refund, and moderation states are server-authoritative and audited.

Do not implement living-person style imitation. Any writing helper uses neutral, user-controlled transformations and requires creator review.

Test QR expiry/forgery/replay, listener disposal, campaign validation/draft recovery/unauthorized publish, Connect return/refresh, responsive/accessibility behavior, and full creator E2E in test mode.

Create docs/antigravity/07_SOLO_MUSICIAN_REPORT.md. STOP.
```

## Prompt 8 - Band Mobile and Band Studio

```text
CROWDBEATS V2 - PHASE 8 - BAND

Build the Band native companion and responsive Band Studio. Every member signs in with their own UID; a band is a resource governed through memberships.

Mobile: Home, Live, Campaigns, Members, Profile. Web: dashboard, profile/EPK, performances, campaigns, fans, messages, members/roles, payouts, revenue, analytics, marketing, media, sponsors, documents, security, and settings.

Implement invitations, acceptance/decline/expiry, role changes, removal, versioned split configuration, member acknowledgement if approved, treasury read models, payout status, and isolated ownership transfer.

High-risk governance requires server authorization, step-up authentication, typed confirmation, optimistic-concurrency/version checks, audit logs, and maker/checker approval where policy requires it.

Splits must equal exactly 100% using exact arithmetic. Odd cents follow the approved deterministic remainder policy. Preserve the earning-time split version so later changes do not rewrite history. Handle members without completed Connect onboarding, refunds, disputes, reserves, and removals.

Test cross-band denial, stale versions, below/above 100%, odd cents, invitation replay, member removal, role escalation, ownership cancellation/replay, missing Connect accounts, and end-to-end test payout.

Create docs/antigravity/08_BAND_REPORT.md. STOP.
```

## Prompt 9 - Sponsor and Venue Web Platforms

```text
CROWDBEATS V2 - PHASE 9 - SPONSOR AND VENUE WEB

Build responsive web-first Sponsor and Venue workspaces using approved organization membership and role decisions.

Sponsor: dashboard, discovery/comparison, sponsorships, applications, shortlist, messages, opportunities, contracts/documents, payments/invoices/receipts, analytics/reports, organization, team, security, and settings. Implement match pools and milestone releases only if their finance/legal ADR is approved.

Venue: dashboard, profile, stages, events, performances, artists, live sessions, analytics, staff, security, and settings. Treat BLE beacon and advanced geofence dependencies as separately approved capabilities.

Enforce organization scope on every server query/mutation. Never trust an organization ID supplied by the client without verifying membership. Use privacy-preserving aggregate talent metrics and prevent cross-tenant exposure.

Payments, escrow, match eligibility, drawdown, milestone release, refund, and reconciliation are server-authoritative, idempotent, audited, and ledger-backed. No balance can go below zero.

Test cross-tenant reads/writes, team invitations/roles, export authorization, match-pool exhaustion/duplicates if enabled, deliverable revisions, venue staff boundaries, responsive layouts, keyboard, screen reader, and E2E flows.

Create docs/antigravity/09_SPONSOR_VENUE_REPORT.md. STOP.
```

## Prompt 10 - Enterprise Admin and CRM

```text
CROWDBEATS V2 - PHASE 10 - ENTERPRISE CONTROL PLANE

Build a desktop-first, responsive Enterprise Admin/CRM web application only after David approves the canonical staff roles and permissions.

Group routes around Command Center, CRM, Artists/Bands, Campaigns, Live, Finance, Sponsorships, Venues/Events, Community, Trust/Safety, Support, Marketing, Content, Analytics, Platform, and Administration.

Implement permission-aware dashboards and operational tables/drawers without placing every feature on one page. Every action must be functional or explicitly marked unavailable; do not ship deceptive demo buttons.

Enforce authorization in web server boundaries, Functions, and Rules as applicable. UI hiding is presentation only. Require fresh/step-up authentication, typed confirmation, audit events, and maker/checker policy for high-risk finance, role, suspension, privacy, and governance actions.

Use soft-delete/archive and reversible state transitions by default. No production mutation is authorized.

Test every staff role with allowed and denied routes, components, server actions, callables, and data paths. Test stale claims, revoked sessions, privilege escalation, audit immutability, partial bulk failures, refund/payout review, fraud freeze/reinstate, privacy export/deletion, and accessibility.

Create docs/antigravity/10_ENTERPRISE_REPORT.md with a complete role-permission-route-test matrix. STOP.
```

## Prompt 11 - Cross-Platform Integration, Notifications, and Observability

```text
CROWDBEATS V2 - PHASE 11 - INTEGRATION

Integrate approved persona surfaces without adding unrelated features.

Verify one identity model, one Firestore operational model, one Functions trust boundary, one permission vocabulary, one contract source, and one financial ledger.

Harden Firestore indexes/transactions/concurrency, offline behavior, App Check, FCM token lifecycle/consent/unsubscribe/cleanup, Storage validation and image processing, universal/deep links, Stripe retries/order tolerance/reconciliation, correlation IDs, structured redacted logs, metrics, alerts, crash/performance monitoring, and privacy-preserving analytics.

Never log tokens, raw card data, secrets, full sensitive messages, or unnecessary PII. Define log retention and access.

Run cross-persona E2E for tip, artist receipt, band split, sponsor match if enabled, refund/dispute, admin review, notifications, deep links, duplicate/out-of-order events, unauthorized access, offline/reconnect, and listener cleanup.

Create docs/antigravity/11_INTEGRATION_REPORT.md with requirement-to-code-to-test traceability. STOP.
```

## Prompt 12 - Full QA, Security, Privacy, Accessibility, and Performance

```text
CROWDBEATS V2 - PHASE 12 - RELEASE GATES

Do not add features. Audit the entire new V2 platform using installed security, Firebase, Flutter, web, accessibility, performance, testing, and accidental-data-loss-prevention skills.

Run formatting, lint, strict type checking, Flutter analyze/tests/widget/integration/golden tests where stable, Next.js unit/component/E2E/build, Functions unit/integration tests, Firestore/Storage Rules tests, contract parity tests, Stripe webhook/idempotency/ledger/refund/dispute/split tests, dependency review, secret scanning, privacy/log-redaction tests, accessibility, Core Web Vitals, native performance/listener profiling, and approved visual regression.

Use Firebase Emulators, deterministic fictitious fixtures, and Stripe test mode. Never copy production data into CI.

Classify each result PASS, FAIL, BLOCKED, or NOT IMPLEMENTED. Do not call skipped tests passing. Never loosen security to satisfy a test.

Create:
- docs/antigravity/12_PRODUCTION_READINESS_REPORT.md
- docs/antigravity/12_REQUIREMENT_TRACEABILITY_MATRIX.md
- docs/antigravity/12_RELEASE_BLOCKERS.md
- docs/security/12_THREAT_MODEL.md
- docs/security/12_PRIVACY_AND_RETENTION_REVIEW.md

Every requirement and visual asset must be classified. Zero unexplained items are allowed.

Do not deploy. STOP for David's release decision.
```

## Prompt 13 - Staging Release Only

```text
CROWDBEATS V2 - PHASE 13 - STAGING RELEASE ONLY

This prompt authorizes staging only after David explicitly approves staging and there are no unresolved critical blockers. It does not authorize production.

Before mutation, show and verify exact Git branch/commit/status, Firebase account/project ID/number/aliases, Stripe test mode, domains, OAuth redirects, App Check configuration, Secret Manager references, budgets, rollback method, and components to deploy. Prove the target is the new V2 staging project and not development, production, or any former Crowdbeats project.

Deploy only approved components. Record versions, URLs, targets, commands, health checks, smoke tests for every persona, known issues, and rollback instructions. Use fictitious staging users and Stripe test payment methods.

If the target is ambiguous, any critical gate fails, or permissions block the operation, stop without bypassing the control.

Create docs/antigravity/13_STAGING_RELEASE_REPORT.md.

Production remains prohibited. STOP.
```

## Prompt 14 - Production Decision and Deployment

```text
CROWDBEATS V2 - PHASE 14 - PRODUCTION DECISION

Do not execute this prompt unless David explicitly authorizes a production release in the same conversation after reviewing the staging report.

First perform a read-only release review: exact approved commit/tag, clean working tree, production Firebase account/project ID/number, Stripe mode, mobile signing identities, App Store/Play Console application records, domains, OAuth redirects, App Check enforcement, secrets, IAM, budgets/alerts, backups/restore, monitoring, incident response, legal documents, privacy disclosures, data retention, support readiness, rollback plan, and staged rollout strategy.

Show the complete mutation plan and request final confirmation. A generic instruction to “continue” is not sufficient production authorization.

After explicit final confirmation, deploy only the approved targets using least privilege and staged rollout. Record immutable release evidence, health/smoke results, mobile store submission status, web/backend versions, and rollback instructions.

If identity, target, approval, or release health is uncertain, stop.

Create docs/antigravity/14_PRODUCTION_RELEASE_REPORT.md.
```

---

## 11. Required Antigravity Response Format After Every Phase

Antigravity must end every phase with:

1. **Outcome** - what is genuinely complete.
2. **Clean-room status** - proof that no old source/configuration/credentials were reused.
3. **Source coverage** - requirements and visual references used.
4. **Skills used** - exact installed skills read and why.
5. **Changed files** - exact new V2 paths and purpose.
6. **Cloud/data impact** - targets, resources, collections, rules, Functions, claims, Stripe objects, and secrets impact.
7. **Tests** - exact commands and PASS/FAIL/BLOCKED/NOT IMPLEMENTED result.
8. **Visual/accessibility verification** - devices, simulators, viewports, assistive checks, and findings.
9. **Decisions/deferred work** - unresolved items and owner.
10. **Git status** - branch, commit if created, staged, unstaged, and untracked files.
11. **Safety confirmation** - no production data or deployment unless explicitly authorized.
12. **STOP** - wait for David before beginning the next phase.

---

## 12. Definition of Done

A phase is not complete because screens render. It is complete only when:

- requirements are traced to new code and tests;
- security boundaries are enforced with negative tests;
- empty/error/offline/permission states exist;
- accessibility and responsive behavior are verified;
- data and financial invariants hold;
- no old project artifact was reused;
- commands and outcomes are recorded honestly;
- no critical blocker is hidden or deferred without ownership;
- the user has approved continuation.

Crowdbeats V2 is production-ready only after the new native apps, responsive web platform, Firebase trust boundary, Stripe test flows, role permissions, privacy obligations, monitoring, incident response, staging validation, and release gates have all been independently verified.

---

## 13. David's Immediate Next Steps

1. Create an empty Windows folder: `C:\Users\Knauf\Documents\GitHub\crowdbeats-v2`.
2. Open only that folder in Google Antigravity.
3. Confirm the folder is empty and is not nested inside the former `crowdbeats` repository.
4. Attach the six reference files and approved Stitch/brand references.
5. Paste **Prompt 0** from this document.
6. Send Antigravity's seven Phase 0 documents/report back for review before allowing it to create code.

Do not create the Firebase project first. Phase 0 should settle application IDs, ownership, roles, region, and policy questions before any cloud resources are created.
