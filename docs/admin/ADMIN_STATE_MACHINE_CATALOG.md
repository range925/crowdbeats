# Crowdbeats V2 — Admin State Machine Catalog

**Document Status:** Permanent Architecture Specification  
**Scope:** Lifecycle State Transitions for Accounts, Personas, Verifications, Campaigns, and DMCA Notices.  

---

## 1. User Account Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_ONBOARDING: User Signed Up
    PENDING_ONBOARDING --> ACTIVE: Consent & Age Gate Accepted
    ACTIVE --> RESTRICTED: Trust & Safety Strike 1-2
    ACTIVE --> SUSPENDED: Severe Violation / Strike 3
    RESTRICTED --> ACTIVE: Remediation / Appeal Approved
    SUSPENDED --> ACTIVE: Ban Appeal Upheld by Admin
    ACTIVE --> DELETION_REQUESTED: User Initiates Deletion
    DELETION_REQUESTED --> DELETION_PROCESSING: 24h Soft-Delete Window
    DELETION_PROCESSING --> LEGALLY_RETAINED: PII Redacted / Ledger Kept 7 Years
    LEGALLY_RETAINED --> [*]
```

---

## 2. Creator & Musician Verification State Machine

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED: Musician Profile Created
    NOT_STARTED --> UNDER_REVIEW: EPK & Identity Submitted
    UNDER_REVIEW --> INFORMATION_REQUIRED: Incomplete Audio / Social Link
    INFORMATION_REQUIRED --> UNDER_REVIEW: Creator Re-submits Evidence
    UNDER_REVIEW --> VERIFIED: Admin Approves Verification
    UNDER_REVIEW --> REJECTED: Ineligible / Impersonation
    VERIFIED --> REVOKED: Copyright Infringement / Ban
    REVOKED --> UNDER_REVIEW: Formal Reinstatement Appeal
```

---

## 3. DMCA Notice & Takedown State Machine

```mermaid
stateDiagram-v2
    [*] --> NOTICE_RECEIVED: Rights Holder Submits Form
    NOTICE_RECEIVED --> DEFICIENT_NOTICE: Missing Statutory Elements
    NOTICE_RECEIVED --> EXPEDITED_TAKEDOWN: Compliant 512(c) Notice
    EXPEDITED_TAKEDOWN --> CONTENT_DISABLED: Stream / Track Removed
    CONTENT_DISABLED --> COUNTER_NOTICE_FILED: Creator Submits Counter-Notice
    COUNTER_NOTICE_FILED --> FEDERAL_LAWSUIT_FILED: Claimant Files Court Action (10-14 Days)
    COUNTER_NOTICE_FILED --> CONTENT_RESTORED: No Court Action within 14 Days
```
