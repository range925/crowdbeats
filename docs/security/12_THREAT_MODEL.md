# Crowdbeats V2 — Threat Model & Attack Surface Evaluation (STRIDE)

**Date:** 2026-08-26  
**Auditor:** Antigravity AI Security Engineering  
**Standard:** Microsoft STRIDE / OWASP Top 10 API Security  

---

## 1. System Architecture & Trust Boundaries

```
[ Unauthenticated Internet ]
           │
           ▼
[ Cloudflare / CDN / WAF ]
           │
           ▼
[ Firebase Auth & App Check ]  <─── Trust Boundary 1: Identity & Device Integrity
           │
           ▼
[ Cloud Functions v2 (Node 20) ]  <─── Trust Boundary 2: Server-Authoritative Logic & Stripe Gateway
           │
           ▼
[ Cloud Firestore & Storage ]  <─── Trust Boundary 3: Security Rules & Double-Entry Ledger
```

---

## 2. STRIDE Threat Analysis

### 2.1 Spoofing Identity (S)
- **Threat:** Attacker attempts to impersonate an artist, band founder, or staff member to redirect payouts or modify splits.
- **Mitigations Implemented:**
  - Firebase Authentication verified on every callable Cloud Function (`request.auth.uid`).
  - Entity membership checks read directly from trusted Firestore collections (`/bands/{id}/members`, `/venueProfiles/{id}/members`, `/sponsorOrgs/{id}/members`).
  - Staff roles restricted to verified JWT custom claims (`platformRole`), granted only via audited server functions (`grantStaffRole.ts`).
- **Residual Risk:** Low.

### 2.2 Tampering with Data (T)
- **Threat:** Client attempts to manipulate tip amounts, reduce platform fees, fabricate balance increases, or alter band split percentages.
- **Mitigations Implemented:**
  - Client has zero write permissions to `/paymentLedger`, `/auditEvents`, `/payouts`, and `/idempotencyKeys`.
  - All financial math is computed exclusively in Cloud Functions.
  - Fee split strictly fixed to 500 bps (5%) in server logic.
  - Band splits must sum to exactly 10,000 bps (100.00%) with deterministic remainder calculation.
- **Residual Risk:** Negligible.

### 2.3 Repudiation (R)
- **Threat:** Malicious staff member denies performing an unauthorized suspension, role grant, or manual refund.
- **Mitigations Implemented:**
  - Every high-risk governance action requires typed step-up confirmation (`"GRANT SUPER_ADMIN"`, `"SUSPEND ACCOUNT"`, `"APPROVE REFUND"`).
  - All governance events write an immutable audit log entry to `/auditEvents/{id}` containing caller UID, target entity, timestamp, and IP/user agent.
  - Security rules completely prohibit delete or update operations on `/auditEvents`.
- **Residual Risk:** Negligible.

### 2.4 Information Disclosure (I)
- **Threat:** Sensitive data leakage (credit card PAN, Stripe secrets, full private messages, or unredacted PII) in application logs or client queries.
- **Mitigations Implemented:**
  - `RedactedLogger` automatically masks Luhn PAN card numbers, Stripe secrets (`sk_test_...`, `whsec_...`), authorization tokens, and truncated messages.
  - Credit card data is collected directly by Stripe Elements / Payment Sheet without touching Crowdbeats application servers.
  - Privacy export endpoints (`requestPrivacyExport`) sanitize data exports and verify email ownership.
- **Residual Risk:** Low.

### 2.5 Denial of Service (D)
- **Threat:** Replay attack on stage QR codes, concurrent webhook flooding, or resource exhaustion via rapid tipping requests.
- **Mitigations Implemented:**
  - Stage QR tokens expire within 90 seconds and enforce atomic `usedAt` marking.
  - Idempotency collection (`/idempotencyKeys/{key}`) blocks duplicate payment requests.
  - Webhook handler handles `payment_intent.succeeded` idempotently, checking existing tip status to prevent duplicate ledger credits.
  - String length and payload bounds enforced on all input schemas.
- **Residual Risk:** Low.

### 2.6 Elevation of Privilege (E)
- **Threat:** Standard fan attempts to elevate privileges to artist, venue manager, or platform super admin.
- **Mitigations Implemented:**
  - Custom claims cannot be modified by client SDKs.
  - `grantStaffRole` prevents non-super admins from granting roles and prevents super admin self-demotion without checker redundancy.
  - Default-deny Firestore security rules block unauthorized collections.
- **Residual Risk:** Negligible.

---

## 3. Conclusion & Security Gate Verdict

The Crowdbeats V2 platform implements defense-in-depth across identity, storage, transport, and database boundaries.

**Security Release Gate Verdict:** ✅ **PASS**
