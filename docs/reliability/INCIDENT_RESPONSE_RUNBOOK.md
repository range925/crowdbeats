# CROWDBEATS V2 — RELIABILITY & INCIDENT RESPONSE RUNBOOK

**Document Version:** 1.0.0 (Phase 23)  
**Authoritative Scope:** Production & Staging Disaster Recovery, System Alerting, Webhook Replay, Queue Recovery & Data Protection  
**Target RTO (Recovery Time Objective):** < 15 minutes (Core Tipping & Payment Ingestion)  
**Target RPO (Recovery Point Objective):** < 5 minutes (Firestore Point-In-Time Recovery & Financial Ledger)  

---

## 1. Severity Classification Matrix

| Severity Level | Definition | Impact Scope | Notification SLA | Target RTO | Target RPO |
|---|---|---|---|---|---|
| **SEV-1 (Critical)** | Core payment processing down, Firestore unavailable, security breach, or potential financial loss | All users, tipping blocked, or ledger integrity at risk | < 5 mins | **< 15 mins** | **< 5 mins** |
| **SEV-2 (Major)** | Major platform flow degraded (e.g. notifications queue jammed, webhook sync delayed > 5m, check-in degraded) | Significant subset of creators or fans; financial flow degraded but functional | < 15 mins | **< 1 hour** | **< 15 mins** |
| **SEV-3 (Moderate)** | Non-critical auxiliary feature unavailable (e.g. analytics report generation delay, social follows slow) | Isolated personas or background rollups | < 30 mins | **< 4 hours** | < 1 hour |
| **SEV-4 (Minor)** | Minor visual defect, non-blocking telemetry warning | Minimal user impact | Next Business Day | Regular Sprint | N/A |

---

## 2. Incident Command Protocol & Roles

When a **SEV-1** or **SEV-2** is declared:

1. **Incident Commander (IC)**:
   - Owns the response lifecycle, triage decisions, and rollback authority.
   - Assigned by default to the on-call Lead Infrastructure Engineer.
2. **Operations Lead**:
   - Executes remediation scripts, diagnostic queries, rollbacks, or service restarts.
3. **Communications Lead**:
   - Maintains external status updates (StatusPage) and internal executive notifications every 15 minutes for SEV-1.
4. **Finance / Compliance Lead**:
   - Verifies double-entry ledger balance, Stripe Connect payouts, and compliance obligations.

---

## 3. Disaster Recovery Procedures

### A. Stripe Webhook Outage & Automated Replay Procedure
**Trigger:** Spike in failed webhook events or upstream Stripe delivery delays.

1. **Telemetry Inspection:**
   - Query `/stripeWebhookEvents` where `processingStatus == 'FAILED'`.
   - Inspect `operationsMonitoringService` snapshot for `paymentWebhook.failedWebhooksCount`.
2. **Root Cause Resolution:**
   - If due to network blip or temporary cloud function timeout, resolve underlying issue.
3. **Execute Safe Replay:**
   - Authorized roles: `SUPER_ADMIN`, `FINANCE_ADMIN`, `DEVELOPER`.
   - Call `replayStripeWebhookCallable`:
     ```typescript
     await replayStripeWebhookCallable({
       eventId: 'evt_stripe_xxx',
       reason: 'Disaster recovery replay post-network recovery',
       force: false, // Prevents duplicate execution if already COMPLETED
     });
     ```
   - **Idempotency Guarantee:** The internal dispatcher verifies that already succeeded tips or ledger credits are never duplicated.
4. **Reconciliation Audit:**
   - Execute `reconcileFinancialLedger()` to verify that debits equal credits and discrepancy count is 0.

---

### B. Notification Queue Recovery (DLQ Redrive)
**Trigger:** Exhausted notifications routed to `/notificationDlq` (status: `unresolved`).

1. **Queue Inspection:**
   - Inspect `/notificationDlq` for failure patterns (e.g. FCM 503, invalid device tokens, transient email provider outage).
2. **Execute Automated Redrive:**
   - Authorized roles: `SUPER_ADMIN`, `CUSTOMER_SUPPORT`, `DEVELOPER`.
   - Call `redriveNotificationDlqCallable`:
     ```typescript
     await redriveNotificationDlqCallable({
       maxItems: 50,
     });
     ```
   - The redrive service marks items as `recovering`, re-attempts dispatch with `bypassRateLimit: true`, marks resolved items as `resolved`, and updates CRM audit trails.
3. **Unrecoverable Item Triage:**
   - Items failing redrive retain error logs in `lastRedriveError` for manual customer support triage.

---

### C. Cloud Firestore Point-In-Time Recovery (PITR) & Backups
**Objective:** Non-destructive snapshot verification and rapid state restoration.

1. **Scheduled Daily Exports:**
   - Automated Cloud Scheduler job triggers daily full database exports to Cloud Storage bucket:
     `gs://${PROJECT_ID}-firestore-backups/exports/{YYYY-MM-DD}/`
2. **Point-in-Time Recovery (PITR):**
   - Cloud Firestore PITR is enabled with a 7-day continuous recovery window.
   - Allows point-in-time recovery to any minute in the past 7 days:
     ```bash
     gcloud firestore databases restore \
       --source-database='projects/crowdbeats-01/databases/(default)' \
       --destination-database='projects/crowdbeats-01/databases/restored-check' \
       --recovery-time='2026-10-13T12:00:00Z'
     ```
3. **Non-Destructive Validation Protocol:**
   - Never restore directly over the live production `(default)` database without isolated verification.
   - Always restore to a temporary or staging database first (`restored-check`).
   - Run verification checks against key collections (`users`, `tips`, `paymentLedger`, `campaigns`) to ensure record counts match expected RPO point.

---

### D. Staging & Production Rollback Procedure
**Objective:** Restore service within 5 minutes if a bad release causes failures.

1. **Web Frontend (Firebase Hosting):**
   - Roll back to the preceding known-good release:
     ```bash
     firebase hosting:rollback
     ```
   - Verify landing page, auth redirect, and tip routes load correctly.
2. **Cloud Functions:**
   - Checkout the latest release tag (e.g. `git checkout v2.1.0`).
   - Redeploy functions:
     ```bash
     firebase deploy --only functions
     ```
3. **Database Security Rules & Indexes:**
   - Revert `firebase/firestore.rules` or `firebase/firestore.indexes.json` to previous commit:
     ```bash
     firebase deploy --only firestore:rules,firestore:indexes
     ```

---

### E. Schema Backward & Forward Compatibility Guidelines
To ensure zero-downtime deployments and safe rollbacks:

1. **Expand / Contract Pattern:**
   - **Phase 1 (Expand):** Deploy code that supports both old and new schema fields. Write to both if necessary.
   - **Phase 2 (Migrate):** Backfill existing documents asynchronously.
   - **Phase 3 (Contract):** Remove support for obsolete fields only after all client versions are updated.
2. **Document Version Invariant (`v`):**
   - Mutated documents increment `v: resource.data.v + 1` to prevent concurrent write collisions.
3. **Immutable Fields Protection:**
   - Financial keys (`tipId`, `amountCents`, `creatorId`, `currency`, `createdAt`) are protected with `immutableOnUpdate()`.
4. **Soft Deletions:**
   - Records are soft-deleted with `deletedAt: IsoTimestamp` and `status: 'DELETED'`. Structural schema fields are preserved.

---

## 4. Disaster Recovery Drill Automation

To ensure recovery procedures work before real incidents occur, automated drills run quarterly or upon major platform upgrades:

| Drill Identifier | Description | Validation Criteria |
|---|---|---|
| `WEBHOOK_OUTAGE_REPLAY` | Simulates failed webhook queue and triggers replay | 100% replayed, 0 duplicate ledger records |
| `NOTIFICATION_DLQ_REDRIVE` | Injects synthetic failed notifications into DLQ and redrives | Status transitions to `resolved`, delivery verified |
| `BACKUP_SNAPSHOT_VERIFICATION` | Validates schema integrity and queryability across all 6 core collections | All collections queryable, export manifest valid |
| `SCHEMA_COMPATIBILITY_CHECK` | Verifies version increments and immutable financial constraints | Invariants enforced by Security Rules |

---

## 5. Post-Mortem & Blameless RCA Template

Following any SEV-1 or SEV-2 incident, a Post-Mortem document must be published within 48 hours:

```markdown
# Incident Post-Mortem: [INCIDENT TITLE]

**Date:** YYYY-MM-DD  
**Severity:** [SEV-1 / SEV-2]  
**Incident Commander:** [Name]  
**Duration:** [Start Time] to [End Time] ([Total Minutes])  
**User Impact:** [Summary of affected users, tips delayed, etc.]  

## 1. Executive Summary
Brief non-technical description of what occurred and how it was resolved.

## 2. Root Cause Analysis (5-Whys)
1. Why did the outage occur?
2. Why was that not detected earlier?
3. Why did the fallback not trigger immediately?
4. Why was the system in that state?
5. Root cause conclusion.

## 3. Timeline of Events (UTC)
- **HH:MM** - Anomaly detected / alert fired
- **HH:MM** - Incident Commander assigned & triage started
- **HH:MM** - Mitigation deployed
- **HH:MM** - Verification confirmed & incident resolved

## 4. What Went Well / What Could Be Improved
- Positive aspects of response
- Bottlenecks in discovery or remediation

## 5. Preventative Action Items
| Action Item | Owner | Target Date | Tracking Ticket |
|---|---|---|---|
| [Fix] | [Owner] | YYYY-MM-DD | [CB-XXXX] |
```
