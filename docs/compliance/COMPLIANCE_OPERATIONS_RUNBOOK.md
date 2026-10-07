# CROWDBEATS V2 — COMPLIANCE OPERATIONS RUNBOOK

**Document Type:** Standard Operating Procedure (SOP)  
**Target Audience:** Trust & Safety Officers, Compliance Administrators, Legal Counsel  
**Last Updated:** 2026-08-30  

---

## 1. DMCA Notice Processing Procedure
1. Review incoming report in `/rightsHolderReports`.
2. Verify completeness: claimant name, signature, specific URL, work description.
3. If valid, execute content takedown and notify creator with counter-notice instructions.
4. Record action in audit log.

## 2. Payout Hold & Fraud Investigation Procedure
1. When fraud or chargeback risk is detected, invoke `applyPayoutHold` with reason code (`RISK`, `DISPUTE`, `POLICY`).
2. Verify creator KYC status on Stripe dashboard.
3. Release hold via `releasePayoutHold` only upon full resolution.
