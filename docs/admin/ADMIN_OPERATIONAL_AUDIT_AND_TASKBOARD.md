# Crowdbeats V2 — Admin Operational Audit, Shared Contracts & Task Board

## Status: ACTIVE (Phase A Completed, Phase B & C in progress)
**Branch:** `feat/admin-operations-overhaul`  
**Lead & Integration Agent:** Master Orchestrator  

---

## 1. Master Shared Contracts & Architecture Invariants

### 1.1 Canonical Identifiers
- **User Record:** `uid` (Firebase Auth UID, string)
- **Creator Profile:** `uid` / `creatorId` (1:1 with Auth UID for Solo Musicians)
- **Band Entity:** `bandId` (UUID/Firestore ID; members reference `bandId` via membership subcollections/records)
- **Sponsor Org:** `orgId` (Firestore ID; members reference `orgId`)
- **Venue:** `venueId` (Firestore ID)
- **Support Ticket:** `ticketId` (collection: `supportRequests`)
- **Abuse Report:** `reportId` (collection: `reports`)
- **Transaction/Tip:** `tipId` (collection: `tips`), `stripePaymentIntentId` (Stripe provider ID)
- **Audit Event:** `eventId` (collection: `auditEvents`, format: `audit_${timestamp}_${rand}`)

### 1.2 Admin Roles & Permission Matrix (OD-07 Invariant)
```
SUPER_ADMIN           -> Full authority, dual-signoff on staff grant/revoke, sensitive exports
CUSTOMER_SUPPORT      -> User directory read, public profile edit, support ticket assignment & resolution, standard refund (<$100)
TRUST_SAFETY          -> Reports, strikes, user suspension, moderation appeals, content removal
FINANCE_ANALYST       -> Ledger read, daily bank reconciliation, payout inspection, fee configuration audit
COMPLIANCE_OFFICER    -> Legal registers, DSAR data exports, compliance payout holds
ARTIST_RELATIONS      -> Musician profile inspection, EPK review, badge verification, genre/stage adjustments
READ_ONLY_AUDITOR     -> System-wide read-only view of users, ledger, and audit log
```

### 1.3 Field Editability Allowlist & Rejection Rules
| Category | Allowed Fields | Required Role | Destination Collections |
| :--- | :--- | :--- | :--- |
| **Public Profile** | `displayName`, `bio`, `photoUrl`, `genre`, `city`, `publicLocation` | `CUSTOMER_SUPPORT`, `ARTIST_RELATIONS`, `SUPER_ADMIN` | `users/{uid}`, `artistProfiles/{uid}` |
| **Internal Notes** | `note`, `priority`, `tags` | All authorized staff | `users/{uid}/internalNotes/{noteId}` (Excluded from public APIs) |
| **Status / Safety** | `suspendedAt`, `suspensionReason` | `TRUST_SAFETY`, `SUPER_ADMIN` | Dedicated callables (`suspendAccount`, `reinstateAccount`) |
| **Staff Roles** | `platformRole` | `SUPER_ADMIN` only | Dedicated callables (`grantStaffRole`, `revokeStaffRole` with confirmation) |
| **FORBIDDEN (Reject)** | `balances`, `totalEarnedCents`, `stripeAccountId`, `stripeCustomerId`, `isAdmin`, `emailVerified` | **NONE** | Server rejects any attempt to mutate directly with `403 PermissionDenied` |

### 1.4 Cloud Function Contracts
1. **`adminUpdateUserProfile`**:
   - Request: `{ targetUid: string, updates: { displayName?: string, bio?: string, photoUrl?: string, genre?: string, city?: string, publicLocation?: string, internalNotes?: string }, reason: string }`
   - Response: `{ ok: boolean, data: { targetUid: string, updatedFields: string[], auditEventId: string }, requestId: string }`
2. **`updateSupportTicket`**:
   - Request: `{ ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed', assignedTo?: string, resolutionNotes?: string }`
   - Response: `{ ok: boolean, data: { ticketId: string, status: string }, requestId: string }`
3. **`runDailyReconciliation`**:
   - Request: `{}`
   - Response: `{ ok: boolean, data: { internalLedgerGrossDollars: number, stripeSettledGrossDollars: number, varianceDollars: number, platformFeesCollectedDollars: number, lastReconciliationTimestamp: string }, requestId: string }`

---

## 2. Scoped Defect Inventory (Ranked by Severity)

| ID | Area | Severity | Description | Current State | Target State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | User Operations | **CRITICAL** | No server-side admin user profile edit endpoint with field allowlist. | Non-existent; admin could only suspend or reinstate. | Privileged `adminUpdateUserProfile` callable with strict allowlist, field validation, and audit logging. |
| **DEF-02** | Finance | **CRITICAL** | Reconciliation button was a dummy `alert()` and widget had hardcoded values (`4820.0`). | Mock-only button and static numbers. | Connected to `runDailyReconciliation` Cloud Function with real Firestore aggregation and variance audit. |
| **DEF-03** | User Operations | **HIGH** | Missing dedicated User Detail workspace (`/admin/crm/[id]`). Clicking a table row did nothing. | Single table without detail drill-down. | Dedicated workspace with 11 operational tabs (Overview, Profile, Roles, Activity, Payments, Payouts, Content, Safety, Notes, Privacy, Audit). |
| **DEF-04** | Support | **HIGH** | Support queue modal was read-only with a "Close" button. | No ticket workflow actions. | Interactive case workspace with assignment, status updates (`in_progress`, `resolved`), and internal notes. |
| **DEF-05** | Navigation | **MEDIUM** | Sidebar had disjointed links and lacked clear grouping per master spec. | Fragmented navigation. | Consolidated 7 operational sections with sidebar search, responsive drawer, and breadcrumbs. |
| **DEF-06** | UI & Accessibility | **MEDIUM** | Need dark/light mode toggle and WCAG AA contrast on tables. | Single dark style without mode switch. | Standardized data table with theme toggle (`data-theme`), sortable columns, and clear status chips. |

---

## 3. Subagent Wave Tracking & Ownership

### Wave 1: Foundation & Shared Backend Contracts
- **Subagent 1 (`22de55b0-2882-4c6e-80ee-9d5fd72c1c7e`) — Data & Security Specialist:**
  - Owns: `apps/functions/src/admin/`, `apps/functions/src/index.ts`, backend unit tests.
  - Deliverables: `adminUpdateUserProfile.ts`, `adminSupportWorkflow.ts`, verified reconciliation callable, audit logs.
  - Status: **RUNNING**
- **Subagent 2 (`5e183d2a-9ef8-48aa-8109-f22f62571fea`) — Admin UX & Navigation Specialist:**
  - Owns: `apps/web/app/(admin)/layout.tsx`, `apps/web/components/admin/`.
  - Deliverables: Consolidated 7-section sidebar, sidebar search, theme switcher, `AdminDataTable`, `AdminFilterBar`, `AdminStatusBadge`.
  - Status: **RUNNING**

### Wave 2: User Workspace & Profile Editing (Scheduled next)
- **Subagent 3 — User & Account Operations Specialist:**
  - Owns: `apps/web/app/(admin)/admin/crm/[id]/page.tsx`, `apps/web/app/(admin)/admin/crm/page.tsx`.
  - Deliverables: Searchable user directory with instant filters, 11-tab user detail workspace, controlled edit form with before/after diff and reason.
- **Subagent 4 — Trust, Support & Moderation Specialist:**
  - Owns: `apps/web/app/(admin)/admin/support/page.tsx`, `apps/web/app/(admin)/admin/trust-safety/page.tsx`.
  - Deliverables: Connected ticket management, case assignments, note threads, strike integration.

### Wave 3: Finance, Verification & Independent QA
- **Subagent 5 — Finance & Creator Operations Specialist:**
  - Owns: `apps/web/app/(admin)/admin/finance/page.tsx`, `FinancialReconciliationWidget.tsx`.
  - Deliverables: Real-time ledger vs Stripe settlement data, manual reconciliation trigger, payout holds view.
- **Subagent 6 — Independent QA Specialist:**
  - Owns: End-to-end verification, typechecks, automated tests, screenshot evidence.
