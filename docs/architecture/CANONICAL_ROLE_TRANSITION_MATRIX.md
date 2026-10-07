# CROWDBEATS V2 — CANONICAL ROLE & TRANSITION MATRIX

**Document Type:** Identity Specification  
**Architecture Rule:** One human = One Firebase Authentication UID.

---

## 1. Account Roles & Entities

- **Fan Account:** Consumer/supporter who can discover, follow, tip, donate, pay, receive receipts, and manage saved payment methods.
- **Musician Account:** Eligible creator identity holding a Solo Musician profile, one or more Band memberships, or both.
- **Band Profile:** An organization managed by verified human musician accounts with distinct membership roles (Owner, Manager, Member, Representative). A band is never an unaudited shared login.
- **Administrator/Staff Account:** Invitation-only, protected account with granular custom claims (e.g. `SUPER_ADMIN`, `TRUST_SAFETY`, `FINANCE_ANALYST`). Admin never appears in public signup.

---

## 2. Enforceable State Transition Matrix

| Starting State | Requested Target State | User Self-Service Result | Server & UI Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Fan** | Solo Musician | **DENIED** | Blocked in Cloud Functions & UI. Requires creator application & onboarding verification. |
| **Fan** | Create or Join Band | **DENIED** | Blocked. Only verified musicians can initiate or join bands. |
| **Fan** | Fan | **ALLOWED** | Identity update, profile metadata editing within Fan scope. |
| **Solo Musician** | Create a Band | **ALLOWED** | Permitted after creator eligibility check; user becomes initial Band Owner. |
| **Solo Musician** | Join Existing Band | **ALLOWED** | Allowed through invitation/request and mutual acceptance workflow. |
| **Solo Musician** | Remain Solo while in Band| **ALLOWED** | Retains independent Solo Musician profile and earnings. |
| **Band Member** | Create/Retain Solo Profile| **ALLOWED** | Retains independent solo creator profile. |
| **Band Member** | Leave a Band | **ALLOWED** | Permitted unless active contract/payout obligations require transfer. |
| **Band Owner/Manager**| Leave or Remove Last Ownership| **BLOCKED** | Blocked until ownership and financial responsibilities are transferred to another member. |
| **Musician** | Fan-only Account | **DEDICATED WORKFLOW** | Requires reviewed downgrade resolving balances, payouts, campaigns, and tax records. |

---

## 3. Administrative Role Modification Workflow

1. **Permission Check:** Actor must have `users.roles.manage` custom claim.
2. **Re-authentication:** Step-up authentication required within 15 minutes.
3. **Reason Code:** Selected reason code + written justification required.
4. **Audit Logging:** Immutable record written to `/auditEvents` with before/after state and correlation ID.
5. **User Notification:** Automated notification sent to the affected user.
