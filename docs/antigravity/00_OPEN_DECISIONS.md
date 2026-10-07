# 00 — Open Decisions
**Phase:** 0 — Read-Only Clean-Room Contract
**Date:** 2026-08-25
**Status:** ALL ITEMS REQUIRE DAVID'S DECISION before the blocking phase begins

---

## Purpose

This document lists every unresolved decision that Antigravity cannot make unilaterally.
Each item includes:
- **Status:** NEEDS DAVID DECISION / RECOMMENDED (Antigravity recommends a default) / APPROVED (if David confirms during Phase 0 review)
- **Blocking Phase:** the earliest phase that cannot proceed without this answer
- **Consequence of delaying:** what cannot be built or configured
- **Antigravity recommendation:** a default with rationale and tradeoffs

No answer is invented. Each recommendation is labeled explicitly as a recommendation,
not a fact.

---

## OD-01: Final V2 Repository Name

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 1 (repository initialization)

**Question:** What is the official Git repository name for Crowdbeats V2?

**Antigravity Recommendation:** `crowdbeats-v2`
- Consistent with the local folder name already in use
  (`C:\Users\Knauf\Documents\GitHub\crowdbeats-v2`)
- Clearly distinguishes from any former `crowdbeats` or `crowdbeats-app` repository
- Lower-kebab-case matches GitHub conventions

**Consequences if delayed:** Phase 1 cannot initialize the Git repository or configure
CODEOWNERS, branch protection, or CI.

**Options:**
(a) `crowdbeats-v2` (recommended)
(b) `crowdbeats` (if former repository is archived/deleted first)
(c) Another name (David specifies)

---

## OD-02: Flutter State Management Library

**Status:** RECOMMENDED — Riverpod; David may confirm or override
**Blocking Phase:** Phase 1 (Flutter project creation)

**Question:** Which Flutter state management library should be used?

**Antigravity Recommendation:** Riverpod (latest stable)
- Used in the former Flutter codebase (Riverpod 2.5)
- Strong compile-time safety, testability, and Dart 3.x compatibility
- Actively maintained; large community

**Alternatives:**
(a) Riverpod (recommended)
(b) Bloc/Cubit — more explicit event/state model; larger boilerplate
(c) Provider — simpler but older; less composable than Riverpod
(d) MobX — reactive; less common in Firebase-first Flutter apps

**Consequences if overridden:** Phase 1 Flutter project architecture changes; affects
provider patterns in all subsequent phases.

---

## OD-03: Android Application ID

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 2 (Firebase Android app registration and google-services.json)

**Question:** What is the Android application ID (package name) for Crowdbeats V2?

**Format:** Reverse-domain, e.g., `com.crowdbeats.app` or `com.crowdbeats.v2`

**Antigravity Recommendation:** `com.crowdbeats.app`
- Clean, professional, future-proof
- Does not include "v2" which would show to end users in the Play Store URL

**Consequences:**
- Must match the Firebase Android app registration
- Must match the `applicationId` in `apps/mobile/android/app/build.gradle`
- Cannot be changed after Play Store submission without creating a new app listing
- SHA-1/SHA-256 fingerprints tied to this ID must be registered with Firebase

---

## OD-04: Apple Bundle ID

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 2 (Firebase iOS app registration and GoogleService-Info.plist)

**Question:** What is the Apple bundle identifier for Crowdbeats V2?

**Format:** Reverse-domain, e.g., `com.crowdbeats.app`

**Antigravity Recommendation:** `com.crowdbeats.app` (matching Android for consistency)

**Consequences:**
- Must be registered in Apple Developer Program before Firebase iOS app can be created
- Linked to Team ID and Provisioning Profiles
- Sign in with Apple configuration requires this ID in the Apple Developer console
- APNs (push notifications) certificate is tied to this bundle ID
- Cannot be changed after App Store submission without creating a new app listing

---

## OD-05: Firebase Project IDs for All Environments

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 2 (Firebase project creation)

**Question:** What are the Firebase project IDs for development, staging, and production?

**Note:** Antigravity MUST verify these IDs are available and are not any former Crowdbeats
project before any Firebase CLI command.

**Antigravity Recommendation:**
- Dev: `crowdbeats-v2-dev`
- Staging: `crowdbeats-v2-staging`
- Prod: `crowdbeats-v2-prod`

**Alternatives:**
- `cb-v2-dev`, `cb-v2-staging`, `cb-v2-prod` (shorter)
- Custom IDs David specifies

**Consequences:**
- Firebase project IDs are globally unique and cannot be changed after creation
- The project ID appears in Hosting URLs (e.g., crowdbeats-v2-dev.web.app)
- IDs must be checked for availability before Phase 2 begins
- Wrong IDs chosen = cannot rename = new project required

---

## OD-06: Public Web and App Domains

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 2 (Firebase Hosting / App Hosting domain configuration)

**Question:** What are the custom domains for the web platform?

**Common patterns:**
- Production web: `app.crowdbeats.com` or `www.crowdbeats.com`
- Staging web: `staging.crowdbeats.com` or `crowdbeats-v2-staging.web.app`
- Dev: Firebase default (crowdbeats-v2-dev.web.app) or custom subdomain

**Consequences:**
- Domain must be owned and DNS-configurable by David
- OAuth redirect URIs (Google Sign-In, Apple Sign-In) must include approved domains
- Sign in with Apple requires domain verification in Apple Developer console
- Deep link / universal link domains must match registered app domains

---

## OD-07: Enterprise Role Canonical List — Is EXECUTIVE Included?

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 3 (RBAC schema) and Phase 10 (Enterprise Admin build)

**Question:** Is EXECUTIVE included in the V2 enterprise role list? Is the canonical
count 15 or 16 roles?

**Evidence:**
- SKILL_REQUIREMENTS (REF-04, §3.2): Lists 16 roles including EXECUTIVE with
  "Read-only executive analytics, GMV, take-rate revenue, compliance export downloads"
- MASTER_ROADMAP (REF-06, §6.5): Lists only 15 roles, omitting EXECUTIVE

**Antigravity Recommendation:** Include EXECUTIVE (16 roles)
- The omission from one list appears to be an authoring error
- EXECUTIVE has a clear, non-overlapping read-only scope distinct from DATA_ANALYST
  (EXECUTIVE = revenue/compliance/GMV; DATA_ANALYST = behavioral cohorts and custom queries)
- Including EXECUTIVE aligns with realistic SaaS organizational design

**If EXECUTIVE is excluded:** Confirm whether its read-only analytics scope is absorbed
into DATA_ANALYST or FINANCE_ANALYST, and document the decision.

**Consequence of delay:** Phase 3 must use placeholder RBAC schema; Phase 10 Enterprise
Admin cannot be built with finalized role boundaries.

---

## OD-08: Sponsor Organization Role Model

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 3 (RBAC schema) and Phase 9 (Sponsor web build)

**Question:** Which sponsor organization role model should V2 use?

**Option A — 2-Role Model (SPONSOR_REP / SPONSOR_ADMIN):**
| Role | Scope |
|---|---|
| SPONSOR_REP | View analytics, discover talent, shortlist, message artists |
| SPONSOR_ADMIN | Full treasury, contract signing, team seat management, escrow |

Pros: Simple, consistent with SKILL_REQUIREMENTS document
Cons: Less granular; SPONSOR_ADMIN has broad access

**Option B — 4-Role Model (BRAND_ADMIN / CAMPAIGN_MANAGER / LEGAL_COUNSEL / FINANCE_OFFICER):**
| Role | Scope |
|---|---|
| BRAND_ADMIN | Full authority including treasury and team management |
| CAMPAIGN_MANAGER | Talent discovery, shortlist, proof approvals, campaign management |
| LEGAL_COUNSEL | Contract review and digital signature authorization only |
| FINANCE_OFFICER | Invoice downloads, escrow deposits, payment management |

Pros: More granular separation of duties; better for larger sponsor organizations
Cons: More complex permission matrix; higher development cost; more test cases

**Antigravity Recommendation:** Option A for V2 launch, with a documented extension path to
Option B. Reason: V2 is a new product; start simple and add roles as real sponsor
organizations onboard and express specific needs.

---

## OD-09: Odd-Cent Remainder Distribution Policy for Band Splits

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 3 (split contract) and Phase 8 (Band build)

**Question:** When a band tip or payout cannot be divided evenly into integer cents among all
members, how is the remainder allocated?

**Options:**
(a) Remainder to Band Owner (simplest; documented in one V1 test)
(b) Remainder to member with largest split percentage (proportional)
(c) Largest Remainder Method — remainder to member whose truncated share lost the most
    (most mathematically equitable)
(d) Round-robin among members by index, tracked over time (fairest long-term; most complex)

**Antigravity Recommendation:** Option (c) — Largest Remainder Method
- Most equitable over time without requiring persistent state
- Transparent and auditable
- Used in political apportionment; well-understood algorithm

**Consequence of delay:** The split calculation function cannot be implemented until a
policy is documented and approved. Band test `testIntegerRemainderDistribution` cannot
be written.

---

## OD-10: Platform Fee, Refund Window, and Payout Policy

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 3 (financial contract) and Phase 6 (Fan tip flow)

**Questions:**
1. What percentage (or fixed amount) does Crowdbeats retain as a platform fee on each tip?
2. What is the fan refund window? (24 hours is referenced in architecture docs for
   "accidental tip refund"; is this the official policy?)
3. What is the creator payout cadence? (daily, weekly, on-demand?)
4. Are there minimum payout thresholds?
5. Are there dispute reserve policies beyond the automatic 100% hold on chargebacks?

**Antigravity Recommendations:**
- Platform fee: Recommend a specific fee rate after David confirms the business model
  (cannot recommend a number without knowing the business context)
- Refund window: 24 hours for accidental tips is reasonable and referenced in docs
- Payout cadence: On-demand with a minimum threshold (e.g., $10) is creator-friendly;
  weekly minimum hold reduces Stripe transfer costs
- Dispute reserve: 100% automatic hold on chargeback notification aligns with documentation

**Consequence of delay:** The PaymentIntent creation function, ledger schema, and fan tip
UI cannot include the correct fee display, refund policy disclosure, or payout timeline.

---

## OD-11: Crowdbeats Cash — Approve or Defer Decision

**Status:** NEEDS DAVID DECISION — recommend DEFER
**Blocking Phase:** Relevant to Phase 6 (Fan profile); architecture decision required before any build

**Question:** Should Crowdbeats Cash (stored-value wallet) be built in V2?

**Background:** The V2 Master Plan explicitly defers this feature:
"A stored-value wallet introduces legal, accounting, refund, custody, and regulatory questions.
Keep it behind an approved architecture/legal decision."

**Antigravity Recommendation:** DEFER until the following are resolved:
1. Legal review: stored-value wallet classification in all target launch states/countries
2. Money transmission licensing assessment (MTL requirements vary by US state and country)
3. Custodial liability and consumer protection compliance
4. Accounting/tax treatment of unredeemed balances
5. Refund/expiry policy for stored value
6. Stripe Treasury or alternative infrastructure evaluation

**Consequence of approving prematurely:** Risk of operating as an unlicensed money
transmitter; significant legal and compliance exposure.

---

## OD-12: Camera Performer Recognition and BLE/Geofence Deferral

**Status:** NEEDS DAVID DECISION — recommend DEFER
**Blocking Phase:** Not blocking V2 Phases 1–12; requires ADR before Phase 13+

**Question:** When should camera-based performer recognition and BLE beacon geofencing
be added to the V2 roadmap?

**Issues to resolve before building:**
- Camera recognition: ML model accuracy, false-positive liability, performer consent,
  App Store privacy nutrition labels, CCPA/GDPR biometric data considerations
- BLE beacons: Hardware procurement, beacon management operations, battery maintenance,
  signal interference in live venue environments, fallback behavior when beacon is absent
- Both: permissions education, denial-recovery UX, on-device vs. cloud processing decision

**Antigravity Recommendation:** DEFER to a post-V2-launch capability track.
- QR code check-in (Phase 7) covers the core use case with simpler implementation
- Camera and BLE require separate operational infrastructure and compliance review
- Launch with QR; evaluate camera/BLE after real venue operational data

---

## OD-13: Crowdbeats V2.pdf — Confirm Identity or Upload

**Status:** NEEDS DAVID DECISION — URGENT (blocks Phase 0 completion)
**Blocking Phase:** Phase 0 completion / Phase 1 start

**Question:** The Phase 0 prompt lists `Crowdbeats V2.pdf` as the #3 authority. This PDF
was not present in the workspace at Phase 0.

**Required from David (choose one):**
(a) Confirm that `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md`
    is identical to the PDF and no additional content is in the PDF
(b) Upload `Crowdbeats V2.pdf` to the workspace for Phase 0 review
(c) Confirm the PDF is unavailable and the markdown is the complete V2 product authority

**Consequence of not responding:** Antigravity cannot guarantee it has read all intended
product direction. Phase 1 should not begin until this is resolved.

---

## OD-14: Firebase/GCP Account Owner and Billing Account

**Status:** NEEDS DAVID DECISION
**Blocking Phase:** Phase 2 (Firebase project creation)

**Question:**
1. Which Google account will own the V2 Firebase project(s)?
2. Is there an existing Google Cloud billing account to link, or must a new one be created?
3. Should Antigravity operate as Owner, Editor, or with a more restricted role?

**Antigravity Recommendations:**
- The billing account should be reviewed before any paid Firebase service is enabled
- Antigravity should operate with the minimum IAM permissions needed for each operation
- David (or Crowdbeats LLC) should be the billing account owner; Antigravity should not
  hold owner-level credentials unless necessary
- Set up budget alerts before enabling any paid tier services

**Consequence of delay:** Phase 2 cannot create the Firebase development project or
register iOS/Android/web app records.

---

## Summary Table

| OD ID | Item | Status | Blocking Phase |
|---|---|---|---|
| OD-01 | Final V2 repository name | NEEDS DAVID DECISION | Phase 1 |
| OD-02 | Flutter state management (Riverpod recommended) | RECOMMENDED | Phase 1 |
| OD-03 | Android application ID | NEEDS DAVID DECISION | Phase 2 |
| OD-04 | Apple bundle ID | NEEDS DAVID DECISION | Phase 2 |
| OD-05 | Firebase project IDs (dev/staging/prod) | NEEDS DAVID DECISION | Phase 2 |
| OD-06 | Public web and app domains | NEEDS DAVID DECISION | Phase 2 |
| OD-07 | Enterprise role list — EXECUTIVE inclusion | NEEDS DAVID DECISION | Phase 3/10 |
| OD-08 | Sponsor organization role model | NEEDS DAVID DECISION | Phase 3/9 |
| OD-09 | Odd-cent remainder distribution policy | NEEDS DAVID DECISION | Phase 3/8 |
| OD-10 | Platform fee, refund window, payout policy | NEEDS DAVID DECISION | Phase 3/6 |
| OD-11 | Crowdbeats Cash approve/defer | RECOMMENDED: DEFER | Phase 6 |
| OD-12 | Camera recognition and BLE/geofence approval timeline | RECOMMENDED: DEFER | Phase 13+ |
| OD-13 | Crowdbeats V2.pdf — confirm or upload | NEEDS DAVID DECISION — URGENT | Phase 0 |
| OD-14 | Firebase/GCP account owner and billing account | NEEDS DAVID DECISION | Phase 2 |

**Critical path:** OD-13 must be resolved before Phase 1 begins.
OD-01 must be resolved at or before Phase 1.
OD-03, OD-04, OD-05, OD-06, OD-14 must be resolved before Phase 2 begins.
OD-07, OD-08, OD-09, OD-10 must be resolved before Phase 3 begins.

---
*Phase 0 documentation only. No application code, Firebase resource, Stripe resource,
or deployment was created or modified.*
