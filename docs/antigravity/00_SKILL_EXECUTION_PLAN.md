# 00 — Skill Execution Plan
**Phase:** 0 — Read-Only Clean-Room Contract
**Date:** 2026-08-25
**Status:** APPROVED for Phase 0; Phase 1+ selections are provisional pending David's approval

---

## Purpose

This document records:
1. The Antigravity skill catalog that was inspected
2. Skills selected for Phase 0 and their justification
3. Skills selected for later phases (provisional)
4. Skills explicitly excluded and the rationale
5. Any conflicts between a skill's default behavior and this Phase 0 prompt
   (this prompt wins in all such conflicts)

---

## Phase 0 Skill Selection

Phase 0 requires only reading, analysis, and documentation. No code execution, Firebase
interaction, Flutter build, or cloud operation is performed. The following skills are
applicable to Phase 0:

| Skill Name | Selected? | Justification |
|---|---|---|
| `accidental-data-loss-prevention` | YES | Phase 0 reads only; applies to all phases to prevent destructive operations |
| `agy-customizations` | Informational | Used to understand the skill catalog and loading priority |
| `antigravity-guide` | Informational | Reference for how Antigravity executes phases |

No other skills are needed for Phase 0. The instruction "Do not install or load unrelated
skills" is followed.

**Conflict with skill defaults (Phase 0):** None. Phase 0 is read-only and documentation-only.
No skill attempted to take an action that conflicts with the clean-room constraint.

---

## Provisional Phase-by-Phase Skill Plan

The following is the planned skill activation by phase. All selections are provisional
and subject to David's Phase 0 approval before any skill is activated in Phase 1+.

### Phase 1 — Repository Skeleton

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory safety guard throughout |
| `flutter-apply-architecture-best-practices` | Layered Flutter architecture (UI/Logic/Data) |
| `dart-run-static-analysis` | Enforcing Dart/Flutter analysis standards |
| `modern-web-guidance` | Modern Next.js/React patterns and web standards |
| `firebase-basics` | Firebase CLI workflows (not connecting to cloud yet) |

### Phase 2 — Firebase Bootstrap

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Critical: prevents operating on wrong Firebase project |
| `firebase-basics` | Firebase CLI, project init, emulator configuration |
| `firebase-auth-basics` | Auth provider planning |
| `firebase-firestore` | Firestore database creation and index planning |

**Conflict to flag:** `firebase-basics` skill may default to using existing Firebase CLI state.
Phase 2 requires proving the selected Firebase project is brand-new V2 and not any former
Crowdbeats project before any command. This prompt wins.

### Phase 3 — Trust Foundation (Contracts, Identity, RBAC, Rules)

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `firebase-firestore` | Firestore collection design and security rules |
| `firebase-security-rules-auditor` | Auditing default-deny rules for privilege escalation |
| `firebase-auth-basics` | Custom claims lifecycle |
| `flutter-apply-architecture-best-practices` | Dart contract model architecture |
| `modern-web-guidance` | TypeScript contract patterns |

### Phase 4 — Design System and Google Stitch Mapping

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `flutter-build-responsive-layout` | Flutter component and token gallery |
| `flutter-fix-layout-issues` | Diagnosing Flutter layout constraints |
| `modern-web-guidance` | CSS custom properties, container queries, modern web tokens |
| `a11y-debugging` | Chrome DevTools MCP accessibility audit of web component gallery |
| `flutter_a11y_agent` (subagent) | Flutter widget semantics and accessibility review |

### Phase 5 — Authentication and Onboarding

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `firebase-auth-basics` | Email/password, Google, Apple auth flows |
| `firebase-firestore` | /users/{uid} lifecycle rules |
| `flutter-apply-architecture-best-practices` | Auth state management in Flutter |
| `flutter-setup-declarative-routing` | go_router auth guards |
| `modern-web-guidance` | Next.js middleware auth guards |
| `a11y-debugging` | Auth form accessibility |

### Phase 6 — Fan Vertical Slice

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `flutter-apply-architecture-best-practices` | Fan tab architecture |
| `flutter-add-widget-test` | Fan component widget tests |
| `flutter-build-responsive-layout` | Adaptive fan layouts |
| `firebase-firestore` | Fan data access and rules |
| `modern-web-guidance` | Fan web account dashboard |
| `a11y-debugging` | Fan accessibility audit |

### Phases 7–8 — Musician and Band

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `flutter-apply-architecture-best-practices` | Creator/band architecture |
| `flutter-add-widget-test` | Component tests |
| `firebase-firestore` | Creator/band data model |
| `firebase-security-rules-auditor` | Band governance rule coverage |
| `modern-web-guidance` | Creator studio web patterns |

### Phases 9–10 — Sponsor, Venue, Enterprise Admin

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `firebase-security-rules-auditor` | Enterprise and sponsor rules |
| `modern-web-guidance` | High-density admin web patterns |
| `a11y-debugging` | Enterprise web accessibility |

### Phase 11 — Integration

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `firebase-firestore` | Indexes, transactions, concurrency |
| `firebase-auth-basics` | App Check integration |
| `memory-leak-debugging` | Firestore snapshot listener cleanup detection |

### Phase 12 — Full QA

| Skill | Justification |
|---|---|
| `accidental-data-loss-prevention` | Mandatory |
| `a11y-debugging` | WCAG 2.2 AA audit |
| `flutter_a11y_agent` | Flutter a11y review |
| `debug-optimize-lcp` | Core Web Vitals LCP optimization |
| `memory-leak-debugging` | Heap analysis |
| `chrome-devtools` | Network, performance, DOM audit |
| `firebase-security-rules-auditor` | Final security rules review |

---

## Explicitly Excluded Skills (All Phases)

These skills MUST NOT be loaded in this workspace. Loading them risks context degradation,
cross-technology hallucination, and irrelevant tool dispatch as documented in REF-04 §15–16.

| Skill | Reason for Exclusion |
|---|---|
| `bigquery-sql`, `bigquery-ai-ml`, `bigquery-bigframes`, `bigquery-data-transfer-service`, `bigquery-graph` | Crowdbeats uses Firestore, not BigQuery. SQL schemas would conflict with Firestore model |
| `dataform-bigquery`, `dbt-bigquery`, `data-autocleaning` | No data warehouse or dbt pipeline |
| `federate-lakehouse-catalog`, `discovering-gcp-data-assets` | No Iceberg/Lakehouse; Firestore only |
| `gcp-spark`, `gcp-dataflow`, `gcp-composer-troubleshooting`, `gcp-pipeline-orchestration`, `gcp-pipeline-resource-provisioning`, `gcp-managed-airflow-migrations` | No Spark, Beam, Airflow, or Dataproc |
| `ml-best-practices`, `notebook-guidance` | No Jupyter notebooks or ML training pipelines |
| `chrome-extensions` | Not a browser extension product |
| `remotion` | No programmatic video generation |
| `dart-setup-ffi-assets`, `dart-use-ffigen` | Standard Flutter plugins only; no custom C/C++ FFI |
| `managing-python-dependencies` | Zero Python in monorepo |
| `react-vite-dashboard` | Crowdbeats uses Next.js App Router, not Vite |
| `gcs-security-assessment` | Not applicable to this project |

---

## Conflicts Between Skill Defaults and This Prompt

| Skill | Potential Conflict | Resolution |
|---|---|---|
| `firebase-basics` | May suggest using existing Firebase CLI login or existing .firebaserc | Phase 2 explicitly requires proving a brand-new project before any Firebase command; this prompt wins |
| `flutter-apply-architecture-best-practices` | May reference Riverpod as default | Riverpod is a recommendation; David's decision required (OD-02) before committing |
| `firebase-app-hosting-basics` | May assume Next.js deployment to App Hosting is ready | Phase 2 must verify current official App Hosting + Next.js support before selecting hosting target |
| `accidental-data-loss-prevention` | Skill requires explicit user consent before destructive operations | ALIGNED with this prompt; no conflict — reinforces the clean-room mandate |

**Ruling:** This Phase 0 prompt wins over any generic skill default in all cases listed above.

---

## Notes on Skill Catalog Inspection

The Antigravity skill catalog was inspected. The following Phase 0–relevant observations
were recorded:

- The `accidental-data-loss-prevention` skill aligns with the clean-room boundary and must
  be active throughout all phases.
- The `firebase-security-rules-auditor` skill is specifically valuable for Firestore rule
  coverage; however, it should not attempt to audit rules that do not yet exist in Phase 0.
- The `flutter_a11y_agent` subagent will be useful for Phase 4 and Phase 12 accessibility
  audits of Flutter widgets.
- The `stitch::*` skill family is relevant if Google Stitch projects are attached. No Stitch
  exports were present in the workspace at Phase 0.

---
*Phase 0 documentation only. No application code, Firebase resource, Stripe resource,
or deployment was created or modified.*
