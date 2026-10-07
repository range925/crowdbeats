# 00 — Reference Coverage Matrix
**Phase:** 0 — Read-Only Clean-Room Contract
**Date:** 2026-08-25
**Status:** COMPLETE — Awaiting David's approval before Phase 1

---

## Purpose

This matrix proves that every reference document available in the V2 workspace was located,
fully read, and mapped to personas, platforms, phases, conflicts, and canonical decisions.
No document may be skipped. No V1 claim is treated as a V2 fact.

---

## Document Resolution

> [!IMPORTANT]
> `Crowdbeats V2.pdf` was **not present** in the workspace.
> `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md` was present and is
> treated as the highest-authority V2 product and architecture reference.
> This discrepancy is logged as conflict C-01.

| Reference File (on disk) | Canonical Title | Fully Read? | Lines / Bytes |
|---|---|---|---|
| `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md` | Crowdbeats V2 Clean-Room Master Plan and Prompt Pack | **YES** | 982 / 52 752 |
| `CROWDBEATS_GOOGLE_ANTIGRAVITY_PROMPT_PACK.md` | Crowdbeats Google Antigravity Cross-Platform Prompt Pack | **YES** | 508 / 33 505 |
| `FLUTTER_REMOVAL_IMPACT_AUDIT.md` | Crowdbeats Flutter Decommissioning and Unified Next.js Audit | **YES** | 99 / 8 859 |
| `CROWDBEATS_SKILL_REQUIREMENTS.md` | Crowdbeats AI Skill Capability Requirements and Architectural Assessment | **YES** | 383 / 23 160 |
| `CROWDBEATS_ARCHITECTURE_VALIDATION.md` | Crowdbeats Architecture Validation and Baseline Integrity Report | **YES** | 232 / 16 823 |
| `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md` | Crowdbeats Master Phased Implementation Roadmap | **YES** | 562 / 28 245 |
| `Crowdbeats V2.pdf` | (PDF — not present in workspace) | **NO — FILE ABSENT** | — |

Total workspace files inspected: 6 markdown + 0 other assets (no PDF, no images, no Stitch exports).

---

## REF-01: V2 Clean-Room Master Plan and Prompt Pack

| Req ID | Requirement | Persona | Platform | Phase | Conflict | Decision |
|---|---|---|---|---|---|---|
| R01-001 | New monorepo with apps/mobile, apps/web, apps/functions, packages/* | All | All | 0/1 | — | Adopted |
| R01-002 | No former code, credentials, or Firebase projects reused | All | All | 0 | — | Clean-room boundary enforced |
| R01-003 | Flutter is the native iOS/Android client (overrides Flutter Removal Audit) | Fan, Musician, Band | iOS/Android | 0 | C-02 | Flutter retained by David's mandate |
| R01-004 | Next.js App Router is the responsive web client | All web personas | Web | 0 | — | Adopted |
| R01-005 | Completely new Firebase environment; no former project reused | All | All | 0/2 | — | Adopted |
| R01-006 | Three Firebase environments: dev, staging, prod; exact IDs TBD | All | All | 2 | — | OD-05 |
| R01-007 | One Firebase Auth UID per human; multi-persona via memberships | All | All | 3 | — | Adopted |
| R01-008 | Finance, staff authorization, privileged transitions, audit are server-authoritative | All | Functions | 3 | — | Adopted |
| R01-009 | Crowdbeats Cash deferred — legal/accounting/regulatory unresolved | Fan | Mobile/Web | Deferred | — | OD-11 |
| R01-010 | Camera recognition and BLE geofence deferred — privacy/App Store review required | Fan, Musician, Venue | iOS/Android | Deferred | — | OD-12 |
| R01-011 | 14-phase V2 plan (0–14) with hard stops | All | All | All | C-03 | V2 plan supersedes old 7-phase and 10-prompt plans |
| R01-012 | Living-person style imitation excluded; neutral writing controls only | Musician | Web | 7 | C-09 | Excluded |
| R01-013 | No Uber/Lyft trademark, trade dress, logos, or exact copy | All | All | All | — | Adopted |
| R01-014 | WCAG 2.2 AA release floor; dark/live mode higher contrast is aspirational | All | All | 4 | C-04 | 2.2 AA floor |
| R01-015 | Enterprise roles: 16 claimed but EXECUTIVE discrepancy | Staff | Web | 3/10 | C-05 | OD-07 |
| R01-016 | Sponsor roles: SPONSOR_REP/ADMIN vs BRAND_ADMIN/CAMPAIGN_MANAGER conflict | Sponsor | Web | 9 | C-06 | OD-08 |
| R01-017 | Odd-cent remainder: deterministic documented policy; not silently to owner | Band | Functions | 8 | C-07 | OD-09 |
| R01-018 | Semantic design tokens only; no raw colors in product components | All | All | 4 | — | Adopted |
| R01-019 | Sponsor/Venue/Enterprise Admin are web-first; native companion is a later ADR | Sponsor, Venue, Staff | Web | 9/10 | — | Adopted |
| R01-020 | Production deployment requires separate explicit instruction; never automated | All | All | 14 | — | Adopted |

---

## REF-02: Google Antigravity Prompt Pack (V1 — used as requirements evidence only)

Authority ruling: V1 instructions to inspect/reuse the existing repository are overridden by the V2
clean-room mandate. Product requirements, invariants, and security rules remain valid evidence.

| Req ID | Requirement | Persona | Platform | Phase | Conflict | Decision |
|---|---|---|---|---|---|---|
| R02-001 | Fan primary: Flutter; Sponsor/Admin: web only, no Flutter without ADR | Fan, Sponsor, Staff | iOS/Android | All | — | Adopted |
| R02-002 | 13 immutable invariants: one UID, no client ledger writes, integer cents | All | All | 3 | — | Adopted |
| R02-003 | 3-tap metric from known performer + valid default PM to confirmed tip | Fan | iOS/Android | 6 | — | Adopted with consent preserved |
| R02-004 | 300s rotating HMAC SHA-256 QR token for stage check-in | Musician | iOS/Android | 7 | — | Adopted |
| R02-005 | App Check: DeviceCheck (iOS), Play Integrity (Android), reCAPTCHA Enterprise (Web) | All | All | 11 | — | Adopted |
| R02-006 | Default-deny Firestore/Storage rules; least-privilege throughout | All | Functions | 3 | — | Adopted |
| R02-007 | Stripe webhook HMAC verification + idempotency + event deduplication | All | Functions | 3/11 | — | Adopted |
| R02-008 | WCAG 2.1 AA mentioned (V1 pack) | All | All | 4 | C-04 | Superseded: V2 uses 2.2 AA floor |
| R02-009 | AAS skill count: document says 24 required but numbered list has 31 | — | — | 0 | C-08 | V2: catalog-driven selection per phase, no hard count |
| R02-010 | EXECUTIVE omitted from one Phase 6 role list but mentioned elsewhere | Staff | Web | 10 | C-05 | OD-07 |

---

## REF-03: Flutter Removal Impact Audit

Authority ruling: Recommendation to remove Flutter is REJECTED for V2 by David's explicit mandate.
Next.js feature inventory informs web scope. No former admin_web code is to be reused.

| Req ID | Requirement | Persona | Platform | Phase | Conflict | Decision |
|---|---|---|---|---|---|---|
| R03-001 | Flutter removal recommended (former repo only) | All | iOS/Android | N/A | C-02 | REJECTED for V2 |
| R03-002 | Next.js fan/musician/band routes deliver rich mobile-responsive layouts | Fan, Musician, Band | Web | 6–8 | — | V2 web scope informed by this inventory |
| R03-003 | Former admin_web mobile-first simulator pattern noted | All | Web | 0 | — | Not reused; new V2 code only |
| R03-004 | Firebase/Functions/Shared packages are non-Flutter and must remain | All | Functions | All | — | V2 equivalents authored from scratch |
| R03-005 | Firebase.json targets noted — not reused | All | Web | 2 | — | New firebase.json for V2 |

---

## REF-04: Skill Requirements Document

| Req ID | Requirement | Persona | Platform | Phase | Conflict | Decision |
|---|---|---|---|---|---|---|
| R04-001 | Flutter + Dart skills required for native mobile | Fan, Musician, Band | iOS/Android | 6–8 | — | Selected — see Skill Plan |
| R04-002 | Firebase ecosystem skills required | All | All | 2–11 | — | Selected — see Skill Plan |
| R04-003 | Modern-web guidance required | All | Web | 4–10 | — | Selected — see Skill Plan |
| R04-004 | A11y skills required | All | All | 4/12 | — | Selected — see Skill Plan |
| R04-005 | Accidental-data-loss-prevention required | All | All | All | — | Selected — see Skill Plan |
| R04-006 | Chrome DevTools skills recommended | All | Web | 12 | — | Selected for QA phases |
| R04-007 | BigQuery/Spark/ML/Airflow/Dataflow excluded explicitly | — | — | All | — | Excluded |
| R04-008 | Python dependency skills excluded | — | — | All | — | Excluded |
| R04-009 | Chrome extensions excluded | — | — | All | — | Excluded |
| R04-010 | 16 enterprise roles, 84 permissions, 23 domain collections (V1 numbers) | Staff | Web | 3/10 | C-05 | V2 establishes new canonical counts after David approves |
| R04-011 | Double-entry ledger: SumDebits = SumCredits, integer cents | All | Functions | 3 | — | Adopted |
| R04-012 | WCAG 2.1 AA minimum (V1 document) | All | All | 4 | C-04 | Superseded: V2 uses 2.2 AA floor |
| R04-013 | 48x48 dp Flutter touch targets; 44x44 px web controls | All | All | 4 | — | Adopted |

---

## REF-05: Architecture Validation Report

Authority ruling: All "MATCH / VERIFIED" claims refer to the former repository only.
For V2 these are requirements evidence, not proof of existing code.

| Req ID | Requirement | Persona | Platform | Phase | Conflict | Decision |
|---|---|---|---|---|---|---|
| R05-001 | Single identity per human enforced in /users/{uid} | All | All | 3 | — | Adopted |
| R05-002 | Default-deny firestore.rules and storage.rules | All | Functions | 3 | — | Adopted |
| R05-003 | Signed JWT custom claims; SUPER_ADMIN step-up for assignment | Staff | Functions | 3/5 | — | Adopted |
| R05-004 | HMAC SHA-256 stage token, 300s TTL | Musician, Fan | Functions | 7 | — | Adopted |
| R05-005 | Stripe secret keys in Secret Manager only | All | Functions | 2/3 | — | Adopted |
| R05-006 | 16 enterprise roles / 84 permissions (V1 claim) | Staff | Web | 10 | C-05 | OD-07 |
| R05-007 | Protected file policy — no modification without approval | All | All | All | — | V2 equivalent protection required in Phase 3 |
| R05-008 | Prisma schema (V1 legacy) — not activated | — | — | 0 | — | V2: no Prisma; Firestore only |
| R05-009 | 31 AAS skills installed (V1 repo claim) | — | — | 0 | C-08 | V2: catalog-driven per phase |
| R05-010 | Riverpod state management for Flutter | All | iOS/Android | 1 | — | Remains strong candidate — OD-02 |

---

## REF-06: Master Implementation Roadmap

Authority ruling: The 7-phase structure is superseded by the V2 14-phase plan.
Feature workflows, Stripe dependencies, and test expectations remain valid evidence.

| Req ID | Requirement | Persona | Platform | Phase | Conflict | Decision |
|---|---|---|---|---|---|---|
| R06-001 | Phase 1 shared contracts, design tokens, auth, RBAC | All | All | 3/4/5 | — | Adopted |
| R06-002 | Fan 3-tap metric from Phase 2 | Fan | iOS/Android | 6 | — | Adopted |
| R06-003 | Solo Musician 300s rotating QR, real-time tip stream | Musician | iOS/Android/Web | 7 | — | Adopted |
| R06-004 | Band 6-way split, 100% server-side validation | Band | iOS/Android/Web | 8 | — | Adopted |
| R06-005 | Sponsor roles: BRAND_ADMIN, CAMPAIGN_MANAGER, LEGAL_COUNSEL, FINANCE_OFFICER | Sponsor | Web | 9 | C-06 | Conflicts with SPONSOR_REP/ADMIN — OD-08 |
| R06-006 | Enterprise Phase 6 lists 15 roles, omits EXECUTIVE; elsewhere 16 claimed | Staff | Web | 10 | C-05 | OD-07 |
| R06-007 | Stripe Connect Express; multi-party split transfers | Musician, Band | Functions | 7/8 | — | Adopted |
| R06-008 | "Steve Jobs / Simon Sinek generator" in creator studio | Musician | Web | 7 | C-09 | EXCLUDED in V2 |
| R06-009 | WCAG AAA as acceptance criterion in Phase 2 | Fan | iOS/Android | 6 | C-04 | V2: 2.2 AA floor; AAA aspirational in live/dark mode |
| R06-010 | Nightly ledger reconciliation cron | All | Functions | 11 | — | Adopted |
| R06-011 | 13 E2E scenarios | All | All | 12 | — | Adopted as baseline |
| R06-012 | Odd-cent remainder to Band Owner (Phase 4 roadmap) | Band | Functions | 8 | C-07 | Default challenged — OD-09 |
| R06-013 | App Check enforcement on all platforms | All | All | 11 | — | Adopted |

---

## Summary

| Metric | Count |
|---|---|
| Documents available | 7 |
| Documents fully read | 6 |
| Documents absent (PDF) | 1 |
| Requirements extracted | 73 |
| Conflicts identified | 9 (C-01 to C-09) |
| Open decisions logged | 14 (OD-01 to OD-14) |
| Requirements adopted | 60 |
| Requirements rejected/excluded | 2 (Flutter removal; personality AI) |
| Requirements deferred | 4 (Cash, BLE, camera AI, odd-cent policy) |

---
*Phase 0 only. No application code, Firebase resource, Stripe resource, or deployment was
created or modified.*
