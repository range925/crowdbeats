# CROWDBEATS V2 — PRIVACY & DATA MINIMIZATION AUDIT

**Document Type:** Compliance & Privacy Engineering Audit (Phase 20)  
**Applicable Frameworks:** GDPR, CCPA/CPRA, Stripe Content Platform Standards  
**Last Updated:** 2026-08-30  

---

## 1. Principles of Data Minimization

Crowdbeats operates under a strict principle of data minimization:
1. We collect only what is strictly necessary to authenticate users, facilitate live music engagement, and enforce Trust & Safety policies.
2. We never hold custodial financial balances or store primary cardholder data.
3. We do not sell user personal data.

---

## 2. Firestore Collection Privacy & Access Matrix

| Collection | User Access | Creator Access | Admin Access | Server-Only Privileged Fields | Redaction / Privacy Guarantee |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/users/{uid}` | Own profile only | Own profile only | Limited staff roles | `complianceHold`, `payoutHoldReason`, `isSuspended`, `monetizationStatus` | Private PII is inaccessible to other users |
| `/artistProfiles/{uid}` | Public read | Own profile write | Full access | `chargesEnabled`, `bankLinked`, `monetizationStatus` | Public artist persona only |
| `/bands/{bandId}` | Public read | Members write | Full access | `stripeAccountId`, `complianceHold` | Public band persona only |
| `/tips/{tipId}` | Sender read | Recipient read | Finance staff | `stripePaymentIntentId`, `platformFeeCents`, `netAmountCents` | Anonymous tips hide fan UID from recipient |
| `/paymentLedger/{id}` | No client read | No client read | Finance staff | All fields server-only | Double-entry accounting ledger |
| `/contentReports/{id}` | No client read | No client read | Trust & Safety | All fields server-only | Reporter UID is never exposed to reported creator |
| `/rightsHolderReports/{id}` | No client read | No client read | Compliance Officers | All fields server-only | Claimant address, phone, and email are strictly restricted |
| `/moderationAppeals/{id}` | Creator own read | Creator own read | Trust & Safety | `reviewedByUid`, `internalNotes` | Internal moderator discussion notes remain hidden |
| `/stripeWebhookEvents/{id}`| No client read | No client read | Finance staff | All fields server-only | Zero raw CVV, full card number, or banking credentials |
| `/auditEvents/{id}` | No client read | No client read | Super Admin & Compliance | All fields server-only | Immutable, append-only compliance audit trail |

---

## 3. Prohibited Sensitive Data Storage (Zero Exposure)

- **Zero PAN/CVV Storage:** Card data is entered strictly into Stripe Elements / PaymentSheet; Crowdbeats servers never receive or store raw card numbers.
- **Zero Identity Document Storage:** Passports, driver licenses, and SSN/EIN provided for Stripe Connect KYC are processed exclusively by Stripe.
- **Zero Raw Secrets in Database:** Secret keys reside in Google Cloud Secret Manager.
