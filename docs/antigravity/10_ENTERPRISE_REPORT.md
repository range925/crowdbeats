# Phase 10 — Enterprise Control Plane and CRM Report

**Status:** COMPLETE  
**Version:** 0.8.0-phase10  
**Date:** 2026-08-26  

---

## 1. Executive Summary

Phase 10 delivers the desktop-first, responsive **Enterprise Control Plane & CRM** for Crowdbeats V2, strictly governed by the canonical 16-role staff permission model (OD-07).

Key architectural achievements:
- **Canonical 16-Role Staff Hierarchy (OD-07):** Custom claims strictly carry only `platformRole` and `personaType: 'staff'`. Server-side validation occurs on every mutation.
- **Step-Up Authentication & Typed Confirmation:** Destructive, high-risk actions (granting roles, revoking roles, suspending performers, and refunding transactions) require explicit typed confirmation phrases (e.g. `"GRANT SUPER_ADMIN"`, `"SUSPEND ACCOUNT"`, `"APPROVE REFUND"`).
- **Self-Demotion Prevention:** Super Administrators are strictly barred from revoking their own roles to prevent accidental loss of all platform super admins.
- **Maker/Checker Governance:** High-risk financial operations log initiating staff UIDs, approval roles, and timestamps in immutable audit collections (`/auditEvents/{id}`).
- **Reversible Soft State Transitions:** All suspensions and deactivations use soft flags (`isSuspended: true`, `isActive: false`) with reason tracking; destructive unrecoverable production mutations are strictly prohibited.

---

## 2. Canonical Staff Role & Permission Matrix (OD-07)

| Role | Tier | Read Scope | Mutation Scope | Step-Up Required |
| :--- | :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Tier 1 | Full platform read (ledger, telemetry, PII) | All actions, staff role grants/revocations, config | Yes (`"GRANT {ROLE}"`, `"REVOKE {ROLE}"`) |
| **`EXECUTIVE`** | Tier 2 | GMV, take-rate (500 bps), platform revenue, high-level metrics | None (Read-only) | No |
| **`FINANCE_ANALYST`** | Tier 2 | Ledger, payout logs, escrow accounts, dispute records | Payout approval, refund review | Yes (`"APPROVE REFUND"`) |
| **`DATA_ANALYST`** | Tier 2 | Anonymized cohorts, tipping velocity, stage attendance (No PII) | None (Read-only) | No |
| **`CONTENT_MODERATOR`** | Tier 3 | Flagged media, EPK text, reported content | Content flag resolution, media removal | No |
| **`TRUST_SAFETY`** | Tier 3 | Fraud signals, dispute escalation, identity records | Account suspension & reinstatement | Yes (`"SUSPEND ACCOUNT"`) |
| **`COMPLIANCE_OFFICER`**| Tier 3 | Audit logs, GDPR/CCPA export logs, consent records | Data export authorization, deletion queues | Yes |
| **`CUSTOMER_SUPPORT`** | Tier 3 | Non-PII user lookup, tip transactions, support tickets | Refund initiation & approval | Yes (`"APPROVE REFUND"`) |
| **`GROWTH_MANAGER`** | Tier 4 | Campaign metrics, featured artist roster, onboardings | Featured performer curation | No |
| **`PARTNERSHIPS`** | Tier 4 | Sponsor organizations, match pool oversight | Sponsor verification approval | No |
| **`ARTIST_RELATIONS`** | Tier 4 | Artist & band directory, Stripe Connect KYC status | Profile assistance, KYC support | No |
| **`VENUE_RELATIONS`** | Tier 4 | Venue directory, stage setups, geofence radius | Venue verification assistance | No |
| **`DEVELOPER`** | Tier 5 | Cloud Functions telemetry, API error rates, webhooks | Non-prod configs only | No |
| **`QA_TESTER`** | Tier 5 | Sandbox emulator accounts, test flags | Sandbox transaction simulations | No |
| **`LEGAL`** | Tier 6 | Executed sponsorship contracts, ToS audit logs | Terms of Service updates | No |
| **`MARKETING`** | Tier 6 | Acquisition channels, attribution reports | Campaign newsletter export | No |

---

## 3. Enterprise Control Plane Route Structure (`apps/web/app/(admin)/`)

The Enterprise Admin Control Plane contains 16 desktop-first, responsive route groups:

1. **`/admin/command-center`:** Real-time pulse, active live stage sets, GMV, platform take-rate, and pending queues.
2. **`/admin/crm`:** Universal user directory, profile lookup, status flags, and activity drawer.
3. **`/admin/artists`:** Artist/band directory, Stripe Connect KYC standing, verification toggles, and step-up suspension holds.
4. **`/admin/campaigns`:** Crowdfunding campaign verification queue and milestone release tracking.
5. **`/admin/live`:** Live stage set concurrency, 90-second QR anti-replay rotation health, and webhook delivery latency.
6. **`/admin/finance`:** Double-entry ledger audit records, 500 bps take-rate reconciliation, and payout logs.
7. **`/admin/sponsorships`:** Sponsor organization verification, match pool monitoring, and corporate escrow security.
8. **`/admin/venues`:** Partner venue directory, stage capacity limits, and check-in geofence radius settings.
9. **`/admin/community`:** Platform fan loyalty metrics, top tipper cohorts, and audience retention graphs.
10. **`/admin/trust-safety`:** Fraud signals, dispute escalation, suspension/reinstatement tools, and safety alerts.
11. **`/admin/support`:** Customer support queues and step-up fan refund authorization modal.
12. **`/admin/marketing`:** User acquisition telemetry, conversion funnels, and marketing referral attribution.
13. **`/admin/content`:** Flagged media queue, EPK text moderation, and automated text filter flags.
14. **`/admin/analytics`:** Multi-dimensional GMV analytics, cohort retention grids, and performer lifetime value.
15. **`/admin/platform`:** Firebase Cloud Functions health, Stripe webhook delivery rates, and Firestore rules status.
16. **`/admin/administration`:** Platform staff directory, 16-role assignment modal (`grantStaffRole`), revocation modal (`revokeStaffRole`), self-demotion protection, and audit logs.

---

## 4. Cloud Functions Governance (`apps/functions/src/admin/`)

| Function | Callable Name | Authorization Check | Step-Up Confirmation Phrase | Audit Event |
| :--- | :--- | :--- | :--- | :--- |
| `grantStaffRole.ts` | `grantStaffRole` | `SUPER_ADMIN` only | `"GRANT {ROLE}"` | `STAFF_ROLE_GRANTED` |
| `revokeStaffRole.ts` | `revokeStaffRole` | `SUPER_ADMIN` only (No self-revocation) | `"REVOKE {ROLE}"` | `STAFF_ROLE_REVOKED` |
| `suspendAccount.ts` | `suspendAccount` | `TRUST_SAFETY`, `SUPER_ADMIN` | `"SUSPEND ACCOUNT"` | `USER_SUSPENDED` |
| `reinstateAccount.ts`| `reinstateAccount` | `TRUST_SAFETY`, `SUPER_ADMIN` | N/A | `USER_REACTIVATED` |
| `approveStaffRefund.ts` | `approveStaffRefund` | `CUSTOMER_SUPPORT`, `FINANCE_ANALYST`, `SUPER_ADMIN` | `"APPROVE REFUND"` | `REFUND_APPROVED` |

---

## 5. Verification & Test Matrix

| Test Suite | Test Area | Expected Behavior | Result |
| :--- | :--- | :--- | :--- |
| `enterpriseGovernance.test.ts` | Role Authorization | Non-Super Admin denied for `grantStaffRole` | ✅ PASSED |
| `enterpriseGovernance.test.ts` | Step-Up Verification | Invalid confirmation phrase throws `invalid-argument` | ✅ PASSED |
| `enterpriseGovernance.test.ts` | Custom Claims | `grantStaffRole` updates custom claims via Admin SDK | ✅ PASSED |
| `enterpriseGovernance.test.ts` | Self-Demotion Block | Super Admin self-revocation throws `failed-precondition` | ✅ PASSED |
| `enterpriseGovernance.test.ts` | Account Suspension | Trust & Safety can suspend with reason and audit log | ✅ PASSED |
| `enterpriseGovernance.test.ts` | Account Reinstatement| Reinstates suspended performer with audit log | ✅ PASSED |
| `enterpriseGovernance.test.ts` | Staff Refund Review | Customer Support approves refund, writes ledger entries | ✅ PASSED |
| **All Functions Tests** | Full Cloud Functions | 134 / 134 passing across all 11 test suites | ✅ **100% PASSED** |
| **TypeScript Check** | Static Typechecking | `npx tsc --noEmit` exited code 0 | ✅ **CLEAN** |
| **Next.js Production Build**| Full Web App | Compiled all 105 routes across all 6 personas | ✅ **CLEAN (0 errors)** |

---

## 6. Conclusion

Phase 10 completes the Enterprise Control Plane and CRM for Crowdbeats V2. Every staff role, route boundary, high-risk step-up confirmation, maker/checker audit record, and web route is operational, tested, and verified.
