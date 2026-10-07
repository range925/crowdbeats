# Crowdbeats V2 — Editable vs. Immutable Admin Data Matrix

**Document Status:** Permanent Data Governance Specification  

---

## 1. Classification of Admin Data Objects

| Data Object | Editability Classification | Permitted Mutation Method | Audit Event Emitted |
| :--- | :--- | :--- | :--- |
| **Legal Document Drafts** | **Editable (with Permission)** | Section-by-section draft editor | `LEGAL_DOCUMENT_DRAFT_UPDATED` |
| **Published Legal Policies** | **IMMUTABLE** | Snapshot locked; requires new draft version | `LEGAL_DOCUMENT_PUBLISHED` |
| **Stripe Transactions & Tips**| **IMMUTABLE** | Append-only ledger; no direct edits | `PAYMENT_INTENT_LOGGED` |
| **Ledger Adjustments & Refunds**| **Append-Only** | Controlled reversal entries only | `ADMIN_REFUND_APPROVED` |
| **Webhook Event History** | **IMMUTABLE** | Raw payloads stored append-only | `WEBHOOK_EVENT_INGESTED` |
| **User Consent History** | **IMMUTABLE** | Cryptographic timestamped log | `USER_CONSENT_RECORDED` |
| **Platform Settings / Take-Rate**| **Editable (Dual Approval)**| Configuration form with dual signoff | `PLATFORM_SETTING_MODIFIED` |
| **Admin Audit Logs** | **IMMUTABLE** | Append-only Cloud Firestore collection | `AUDIT_EVENT_CREATED` |
