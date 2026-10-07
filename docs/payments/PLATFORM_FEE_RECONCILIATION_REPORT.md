# Crowdbeats V2 — Automated Financial Reconciliation & Exception Report

**Document Status:** Permanent Operations Specification  
**Dashboard Route:** `/admin/payments/platform-fees` (Reconciliation Tab)  

---

## 1. Reconciliation States & Remediation

| State | Definition | Automated Action | Manual Remediation Option |
| :--- | :--- | :--- | :--- |
| `matched` | Stripe fee matches internal calculated fee exactly. | Marked balanced in ledger | None required |
| `amount_mismatch` | Stripe fee differs from internal calculation by > 1 cent. | Alerts Finance Admin | Review fee rule version history |
| `missing_application_fee`| Payment succeeded but no Application Fee object exists. | Retries webhook retrieval | Query Stripe API / adjust ledger |
| `fully_refunded` | Charge and application fee 100% reversed. | Reverses ledger rows | None required |
| `dispute_open` | Chargeback initiated on charge. | Places balance hold | Submit session evidence |
