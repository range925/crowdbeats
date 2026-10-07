# Clean-Room Architecture Contract
**Document:** docs/clean-room/CLEAN_ROOM_ARCHITECTURE_CONTRACT.md
**Phase:** 0 — Read-Only Clean-Room Contract
**Date:** 2026-08-25
**Status:** ACTIVE — Binding for all subsequent phases until superseded by David's explicit revision

---

## 1. Purpose

This contract establishes the irrevocable clean-room boundary for Crowdbeats V2.
Every Antigravity agent, subagent, and tool call operating on this workspace must
comply with all clauses below. Any instruction that conflicts with this contract must
be held pending David's explicit resolution.

---

## 2. Identity of This Workspace

| Property | Value |
|---|---|
| Workspace path | `C:\Users\Knauf\Documents\GitHub\crowdbeats-v2` |
| Git status at Phase 0 | No repository (fatal: not a git repository) |
| Predecessor repositories | None present in this folder |
| Contamination status at Phase 0 | CLEAN |
| Firebase project bound | NONE |
| Stripe mode | NONE |

---

## 3. What This Is

Crowdbeats V2 is a **completely new** cross-platform music technology platform:

- **Native mobile:** Flutter for iOS and Android only
- **Responsive web:** Next.js App Router with React and strict TypeScript
- **Trusted backend:** Firebase Authentication, Cloud Firestore, Cloud Functions Gen 2,
  Cloud Storage, FCM, App Check
- **Payments:** Stripe and Stripe Connect
- **Repository structure:** One new monorepo with separately deployable applications

This is not a migration, refactor, cleanup, continuation, fork, merge, or restoration of
any former Crowdbeats project.

---

## 4. Absolute Prohibitions (All Phases)

No agent, subagent, script, or tool may, under any circumstance, without David's
explicit written approval in the same conversation:

### 4.1 Code and Configuration
- Copy, import, vendor, reference, or depend on any file from a former Crowdbeats repository
- Copy any lockfile, package manifest, Firebase configuration, rules file, environment file,
  CI workflow, test fixture, or build artifact from a former project
- Use `file:` path or workspace reference pointing outside this new repository
- Activate the Prisma schema or any PostgreSQL/relational runtime

### 4.2 Identity and Credentials
- Reuse any former Firebase project ID, project number, Auth tenant, Hosting target,
  database name, or App Check configuration
- Reuse any former Android application ID or Apple bundle ID
- Commit or log any secret key, service account JSON, webhook secret, signing certificate,
  APNs key, or full PAN/CVC
- Place Stripe secret keys (`sk_...`, `whsec_...`) anywhere other than Google Secret Manager

### 4.3 Cloud and Deployments
- Create, modify, or delete any Firebase or GCP resource without showing the proposed
  project ID and receiving David's approval in the same phase
- Use any Firebase project whose ID, number, or alias matches a former Crowdbeats project
- Deploy to production — ever — without a separate explicit production authorization
- Enable Stripe live mode before the production authorization phase

### 4.4 Data
- Copy production data into development, CI, or emulator fixtures
- Store real user data, real card data, or real PII in emulator fixtures
- Log raw card numbers, Stripe secret keys, service account credentials, or
  unnecessary personally identifiable information

### 4.5 Architecture
- Add a Sponsor or Enterprise Admin Flutter application without a written ADR and
  David's approval
- Build Crowdbeats Cash functionality without an approved ADR and legal/payment
  architecture decision (OD-11)
- Implement camera performer recognition or BLE beacon dependencies without a
  completed privacy/consent/App Store/operational review (OD-12)
- Implement living-person style imitation ("Steve Jobs / Simon Sinek generator" or
  equivalent personality AI) — EXCLUDED permanently
- Use binary floating-point for any money value
- Allow client applications to write ledger, balance, payout, refund, escrow, or
  reserve state
- Replace server-side authorization with UI hiding

---

## 5. What Is Permitted

Antigravity may use the reference documents to extract:

- Product goals, user personas, workflows, and screen inventories
- Business rules and security requirements
- Testing expectations and accessibility requirements
- Brand direction (colors, motion guidelines, typography intent)
- Google Stitch references and approved visual assets
- Firebase, Stripe, and deployment requirements
- Architecture invariants for use as requirements (not as proof of existing code)

---

## 6. Contamination Audit Requirements

Before and after every implementation phase, the phase report must verify:

1. Workspace path is confirmed as the V2 folder
2. Git remote is the new V2 repository (or no remote exists yet in Phase 0/1)
3. No Git submodule or local file dependency points to a former repository
4. No package uses `file:` or path references outside the new repository
5. No Firebase alias/project ID is inherited
6. No former Android package name or Apple bundle ID is inherited
7. No secrets or credential files are committed
8. No copied source file contains an old repository path or legacy application name
9. Generated configuration was created for V2 and not copied from V1
10. Emulator fixture data is fictitious and deterministic

This record must be appended to `docs/clean-room/CLEAN_ROOM_PROVENANCE_LOG.md`
(to be created in Phase 1).

---

## 7. Authority Hierarchy

When sources conflict, resolve in this order (highest wins):

1. **David's current explicit instruction** in the active conversation
2. **This contract** (CLEAN_ROOM_ARCHITECTURE_CONTRACT.md)
3. **CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md**
4. **Crowdbeats V2.pdf** (if/when provided)
5. **The other reference markdown files** (SKILL_REQUIREMENTS, ARCHITECTURE_VALIDATION,
   ROADMAP, PROMPT_PACK) — as requirements evidence only, not as V2 facts
6. **Google Stitch and approved visual assets** — for visual intent only, not for
   security, data architecture, or authorization

The former repository state, former test results, former file counts, former version
numbers, and former "implemented" claims have NO authority over V2.

---

## 8. Non-Negotiable Architecture Invariants for V2

The following invariants are binding from Phase 0 onward and may not be relaxed without
a formal ADR and David's approval:

1. **One Firebase Auth UID per human.** One person = one account across all platforms.
2. **Persona switching uses memberships, not duplicate accounts.**
3. **No client writes ledger, balance, payout, refund, escrow, reserve, or audit records.**
4. **All money is stored as integer minor units (amountCents) with an ISO currency code.**
5. **No binary floating-point arithmetic is used for money at any layer.**
6. **Every authoritative financial event has an idempotency key.**
7. **Stripe webhook signatures are verified using the official server SDK.**
8. **Event IDs are deduplicated; out-of-order events are tolerated via reconciliation.**
9. **Ledger transactions are append-only and balanced: total debits equal total credits.**
10. **Staff role/claim assignment is server-only; requires SUPER_ADMIN step-up auth.**
11. **Firestore and Storage are default-deny; least-privilege rules with App Check.**
12. **UI hiding is never a substitute for server-side authorization.**
13. **Audit trails are append-only and server-authored.**
14. **QR check-in tokens expire after 300 seconds and are verified server-side.**
15. **Production data is never copied into development, CI, or emulator fixtures.**
16. **Production deployment requires a separate, explicit authorization phase.**
17. **Protected architecture files are not modified without formal review and David's approval.**
18. **No raw PAN, CVC, Stripe secret key, or webhook secret appears in client code, Firestore,
     logs, or Git.**
19. **Band split configurations must total exactly 100% using exact arithmetic.**
20. **Odd-cent allocation follows an approved deterministic policy documented before implementation.**

---

## 9. Open Decisions That Must Be Resolved Before Implementation

The following items cannot be defaulted by Antigravity alone. They are formally logged in
`docs/antigravity/00_OPEN_DECISIONS.md` and require David's decision before the relevant
phase begins:

| OD ID | Item | Blocking Phase |
|---|---|---|
| OD-01 | Final V2 repository name | Phase 1 |
| OD-02 | Flutter state management library (Riverpod recommended) | Phase 1 |
| OD-03 | Android application ID | Phase 2 |
| OD-04 | Apple bundle ID | Phase 2 |
| OD-05 | Firebase project IDs for dev/staging/prod | Phase 2 |
| OD-06 | Public web/app domains | Phase 2 |
| OD-07 | Enterprise role canonical list (EXECUTIVE inclusion) | Phase 3/10 |
| OD-08 | Sponsor organization role model | Phase 3/9 |
| OD-09 | Odd-cent remainder distribution policy | Phase 3/8 |
| OD-10 | Platform fee, refund window, and payout policy | Phase 3 |
| OD-11 | Crowdbeats Cash approve/defer decision | Phase 6 |
| OD-12 | Camera recognition and BLE/geofence approval timeline | Phase 7+ |
| OD-13 | Crowdbeats V2.pdf: confirm identical to markdown or upload | Phase 0 |
| OD-14 | Firebase/GCP account owner and billing account | Phase 2 |

---

## 10. Signatures

This contract is established by Antigravity on behalf of David Naufahu, Crowdbeats LLC,
on the date above. It becomes binding upon David's Phase 0 approval and remains in force
for all subsequent phases unless David explicitly revises specific clauses.

---
*Phase 0 documentation only. No application code, Firebase resource, Stripe resource,
or deployment was created or modified.*
