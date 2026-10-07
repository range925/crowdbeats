# 00 — Conflict Resolution Log
**Phase:** 0 — Read-Only Clean-Room Contract
**Date:** 2026-08-25
**Status:** ACTIVE — Binding decisions recorded; open items require David's response

---

## Purpose

This log records every conflict discovered between the reference documents and proposes
a canonical V2 resolution for each. Conflicts are listed with:
- **ADOPTED** — resolution is in force; no David decision required
- **REJECTED** — the conflicting requirement is excluded from V2
- **NEEDS DAVID DECISION** — Antigravity cannot resolve unilaterally; marked with the OD reference

The authority order in the Clean-Room Architecture Contract governs resolution.
This log wins over generic skill defaults.

---

## C-01: Crowdbeats V2.pdf Not Present in Workspace

**Sources in conflict:**
- Phase 0 prompt lists `Crowdbeats V2.pdf` as the #3 authority
- Workspace contains only 6 markdown files; no PDF

**Impact:** Any product direction exclusive to the PDF is unknown.

**Resolution:** NEEDS DAVID DECISION — OD-13

**Recommendation:** David should confirm whether the PDF is:
(a) identical to `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md`;
(b) an addendum with extra screens/flows; or
(c) unavailable (in which case the Master Plan markdown is the complete V2 product authority).

Phase 1 should not begin until David responds on OD-13.

---

## C-02: Flutter Removal vs. Flutter as New Native Client

**Sources in conflict:**
- `FLUTTER_REMOVAL_IMPACT_AUDIT.md` (REF-03): Recommends removing Flutter from the former
  repository and consolidating into a unified Next.js application.
- `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md` (REF-01): Explicitly
  states "Flutter is the new native iOS/Android client" and resolves this conflict: "Its
  recommendation to remove Flutter applies to the former repository and conflicts with the
  current explicit request for a true iOS/Android app."
- Phase 0 prompt (David's current instruction): "Flutter is the new native iOS/Android client."

**Resolution:** ADOPTED — Flutter retained. Flutter Removal Audit is rejected for V2.

**Consequences:**
- V2 monorepo requires Flutter/Dart toolchain in addition to Node/TypeScript
- Flutter skills must be included in the Phase 0 skill plan
- The Next.js web application informs web scope but does not replace the native app
- A Dart contract-parity mechanism (generated Dart from JSON Schema or tested equivalents)
  is required so TypeScript and Dart models stay synchronized without manual duplication

---

## C-03: Phase Count — 7-Phase vs. 10-Prompt vs. 14-Phase Plan

**Sources in conflict:**
- `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md` (REF-06): Defines 7 sequential phases
- `CROWDBEATS_GOOGLE_ANTIGRAVITY_PROMPT_PACK.md` (REF-02): Defines 10 prompts (0–10)
- `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md` (REF-01): Defines
  14 phases (0–14) including a clean Phase 0 architecture gate and separate staging/production
  phases

**Resolution:** ADOPTED — V2 uses the 14-phase plan from REF-01.

**Consequences:**
- Phases 0–2 are infrastructure, clean-room, and Firebase bootstrap gates before any product code
- Phases 13 and 14 are separate staging and production authorization phases
- The 7-phase and 10-prompt plans remain valid for their feature/test inventory content only

---

## C-04: Accessibility Floor — WCAG 2.1 AA vs. WCAG 2.1 AAA vs. WCAG 2.2 AA

**Sources in conflict:**
- `CROWDBEATS_SKILL_REQUIREMENTS.md` (REF-04): "WCAG 2.1 Level AA Compliance"
- `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md` (REF-06, Phase 2 acceptance criteria):
  "WCAG AAA contrast ratio on all text"
- `CROWDBEATS_GOOGLE_ANTIGRAVITY_PROMPT_PACK.md` (REF-02, Prompt 2): "WCAG 2.1 AA minimum
  contrast; record AAA as aspirational venue-mode target where feasible"
- `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md` (REF-01):
  "WCAG 2.2 AA release floor"

**Resolution:** ADOPTED — WCAG 2.2 AA is the V2 release floor.
Higher contrast in live/dark/venue mode is a design aspiration; do not claim AAA
compliance unless independently verified. WCAG 2.2 adds additional mobile and
cognitive accessibility criteria beyond 2.1 AA.

**Consequences:**
- Design tokens and component library must meet WCAG 2.2 AA minimum contrast ratios
- Touch target requirements align with 2.2 (which adds 2.5.8 Minimum Target Size guidance)
- AAA contrast may be achievable in dark/stage mode but is not a release gate

---

## C-05: Enterprise Role List — 15 vs. 16 Roles; EXECUTIVE Omission

**Sources in conflict:**
- `CROWDBEATS_SKILL_REQUIREMENTS.md` (REF-04, §3.2): Lists 16 enterprise roles including
  EXECUTIVE at the top of the table
- `CROWDBEATS_ARCHITECTURE_VALIDATION.md` (REF-05, §2 RBAC table): States
  "16 discrete enterprise roles, 84 granular permissions"
- `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md` (REF-06, §6.5): Lists only 15 roles
  in the permissions section, omitting EXECUTIVE from the named list:
  SUPER_ADMIN, FINANCE_ADMIN, FINANCE_ANALYST, ARTIST_OPS_ADMIN, CAMPAIGN_OPS_ADMIN,
  TRUST_SAFETY_ADMIN, FRAUD_INVESTIGATOR, SUPPORT_MANAGER, SUPPORT_AGENT, MARKETING_ADMIN,
  PARTNERSHIP_ADMIN, COMPLIANCE_ADMIN, DATA_ANALYST, TECH_OPS, AUDITOR

**Discrepancy analysis:**
- EXECUTIVE appears in REF-04 §3.2 with "Read-only executive analytics, GMV, take-rate
  revenue, compliance export downloads"
- EXECUTIVE does NOT appear in the REF-06 §6.5 permissions list (15 items)
- The V2 Master Plan (REF-01) confirms: "V2 begins with a role proposal and does not
  hard-code claims until David approves the canonical list"

**Resolution:** NEEDS DAVID DECISION — OD-07

**Recommendation:** Include EXECUTIVE with read-only analytics access. The omission from
one list appears to be an authoring error. The role has a clear, non-overlapping purpose.
However, V2 must not hard-code the claim list until David explicitly approves all 16 roles.

---

## C-06: Sponsor Organization Roles — SPONSOR_REP/ADMIN vs. BRAND_ADMIN/CAMPAIGN_MANAGER/etc.

**Sources in conflict:**
- `CROWDBEATS_SKILL_REQUIREMENTS.md` (REF-04, §3.1): Lists `SPONSOR_REP` and `SPONSOR_ADMIN`
  as the two sponsor roles
- `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md` (REF-06, §5.5): Lists `BRAND_ADMIN`,
  `CAMPAIGN_MANAGER`, `LEGAL_COUNSEL`, `FINANCE_OFFICER` as the four sponsor team roles
- `CROWDBEATS_GOOGLE_ANTIGRAVITY_PROMPT_PACK.md` (REF-02, Prompt 6): "Resolve sponsor roles
  from the actual RBAC source. Do not introduce BRAND_ADMIN, CAMPAIGN_MANAGER, LEGAL_COUNSEL,
  or FINANCE_OFFICER if they conflict with canonical SPONSOR_REP/SPONSOR_ADMIN roles."

**Resolution:** NEEDS DAVID DECISION — OD-08

**Recommendation A (2-role model):** Keep SPONSOR_REP (view/discovery) and SPONSOR_ADMIN
(treasury, team, contracts). Simpler permission model; less granular.

**Recommendation B (4-role model):** Use BRAND_ADMIN, CAMPAIGN_MANAGER, LEGAL_COUNSEL,
FINANCE_OFFICER. More granular; higher complexity; potential App Store implications if
mobile companion is later added.

**Antigravity cannot resolve this alone.** Until David approves, Phase 3/9 will use
placeholder sponsor membership model with clear TODOs.

---

## C-07: Odd-Cent Remainder Distribution in Band Splits

**Sources in conflict:**
- `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md` (REF-06, Phase 4 test §4.8):
  "testIntegerRemainderDistribution — Allocates odd 1-cent remainder to Band Owner"
- `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md` (REF-01, §5.5):
  "Odd-cent allocation follows a deterministic documented policy; do not silently award
  every remainder to the owner."

**Resolution:** NEEDS DAVID DECISION — OD-09

**Recommendation:** Define and document a deterministic odd-cent allocation policy before
implementing band split functions. Common options:
(a) Remainder to Band Owner (simplest; acknowledged in REF-06 test)
(b) Remainder to member with largest split (proportional fairness)
(c) Remainder to member whose amount truncated most (Largest Remainder Method — most equitable)
(d) Distribute round-robin by member index over time

The V2 Master Plan explicitly prohibits silently defaulting to the owner. A policy document
must be created and approved before Phase 8 implementation.

---

## C-08: AAS Skill Count Inconsistency

**Sources in conflict:**
- `CROWDBEATS_GOOGLE_ANTIGRAVITY_PROMPT_PACK.md` (REF-02, Prompt 0): States
  "The AAS document says 24 required skills but its numbered list contains 31"
- `CROWDBEATS_ARCHITECTURE_VALIDATION.md` (REF-05, §1 diagram): States
  "31 AAS Skills Installed" in the V1 repository

**Resolution:** ADOPTED — V2 uses catalog-driven, phase-appropriate skill selection.

No hard skill count is adopted for V2. Skills are selected per phase based on the
installed Antigravity catalog, the work being performed, and the exclusion list from
REF-04 §15. The Phase 0 skill execution plan documents this selection.

---

## C-09: Living-Person Style Imitation ("Steve Jobs / Simon Sinek Generator")

**Sources in conflict:**
- `CROWDBEATS_MASTER_IMPLEMENTATION_ROADMAP.md` (REF-06, Phase 3 §3.1): References
  `/creator/studio` with "Bio & Visionary Manifesto editor with Steve Jobs / Simon Sinek
  generator" as a named feature
- `CROWDBEATS_V2_CLEAN_ROOM_ANTIGRAVITY_MASTER_PLAN_AND_PROMPT_PACK.md` (REF-01, canonical
  conflict decision #7): "The former 'Steve Jobs / Simon Sinek generator' requirement is
  excluded. Writing assistance may offer neutral controls such as clarity, confidence,
  warmth, concision, and audience."
- Phase 0 prompt: "Do not imitate Uber/Lyft branding or proprietary UI"

**Resolution:** ADOPTED — EXCLUDED permanently from V2.

**Consequences:**
- Creator writing assistance uses only neutral, user-controlled transformations
- Controls: clarity, confidence, warmth, concision, audience — not celebrity personas
- Creator must review all AI-suggested text before publishing
- No named personality, living person, or proprietary creative style may be imitated

---

## Summary Table

| Conflict ID | Title | Resolution | OD Reference |
|---|---|---|---|
| C-01 | Crowdbeats V2.pdf absent | NEEDS DAVID DECISION | OD-13 |
| C-02 | Flutter removal vs. Flutter mandate | ADOPTED: Flutter retained | — |
| C-03 | Phase count inconsistency | ADOPTED: 14-phase V2 plan | — |
| C-04 | Accessibility floor standard | ADOPTED: WCAG 2.2 AA | — |
| C-05 | Enterprise role count / EXECUTIVE | NEEDS DAVID DECISION | OD-07 |
| C-06 | Sponsor organization roles | NEEDS DAVID DECISION | OD-08 |
| C-07 | Odd-cent remainder policy | NEEDS DAVID DECISION | OD-09 |
| C-08 | AAS skill count | ADOPTED: catalog-driven | — |
| C-09 | Living-person AI imitation | ADOPTED: EXCLUDED | — |

---
*Phase 0 documentation only. No application code, Firebase resource, Stripe resource,
or deployment was created or modified.*
