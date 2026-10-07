# Crowdbeats V2 — Official Stripe Agreement Register & Governance Record

**Document Status:** Permanent Governance Register  
**Jurisdiction:** United States  
**Last Comprehensive Review:** 2026-08-29  

---

## 1. Authoritative Stripe Agreements Log

| Agreement Title | Official Canonical URL | Country | Applicable Product | Source Effective Date | Crowdbeats Review Date | Crowdbeats Documents Affected | Implementation Controls Affected | Counsel Status | Next Review Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Stripe Services Agreement (US)** | https://stripe.com/legal/ssa | US | Core Payment Processing & Tokenization | 2024-06-20 | 2026-08-29 | Terms of Service § 4, Privacy Policy § 2 | `StripeAdapter`, `createTipIntent` | APPROVED | 2026-11-29 |
| **Stripe Services Terms** | https://stripe.com/legal/ssa-services-terms | US | Payment Methods & Financial Network Rules | 2024-06-20 | 2026-08-29 | Terms of Service § 4.1 | PaymentSheet, PaymentIntent metadata | APPROVED | 2026-11-29 |
| **Stripe Connected Account Agreement** | https://stripe.com/legal/connect-account | US | Stripe Connect Custom/Express Marketplace | 2024-06-20 | 2026-08-29 | Creator Monetization Policy, Band Governance | `createConnectLink`, `bandRevenueSplits` | APPROVED | 2026-11-29 |
| **Stripe Privacy Policy** | https://stripe.com/privacy | Global / US | Fraud Detection, Identity (KYC), & Processing | 2024-06-20 | 2026-08-29 | Privacy Policy § 4 (Subprocessors) | `RedactedLogger`, `SubprocessorRegister` | APPROVED | 2026-11-29 |
| **Stripe Restricted Businesses List** | https://stripe.com/legal/restricted-businesses | US | Risk Engine, Prohibited Goods & Services | 2024-06-20 | 2026-08-29 | Acceptable Use Policy § 2 | `ModerationScanner`, KYC Onboarding Gates | APPROVED | 2026-11-29 |
| **Stripe Connect Documentation** | https://docs.stripe.com/connect | US | Destination Charges, Application Fees, Splits | 2024-06-20 | 2026-08-29 | Marketplace Architecture Specification | `createTipIntent`, `payoutHoldService` | APPROVED | 2026-11-29 |
| **Merchant of Record Guidance** | https://docs.stripe.com/connect/merchant-of-record | US | Multi-Party Marketplace Compliance | 2024-06-20 | 2026-08-29 | Merchant of Record Matrix | Statement Descriptors, Receipt Routing | APPROVED | 2026-11-29 |
| **Refunds & Disputes Guidance** | https://docs.stripe.com/connect/marketplace/tasks/refunds-disputes | US | Chargeback Liability & Negative Balances | 2024-06-20 | 2026-08-29 | Refund & Dispute Policy | `requestRefund`, `disputeEvidenceService` | APPROVED | 2026-11-29 |
| **Stripe API Key Security** | https://docs.stripe.com/keys | US | Restricted Key Isolation & Storage | 2024-06-20 | 2026-08-29 | Secret Management Architecture | GCP Secret Manager, Write-Only Fields | APPROVED | 2026-11-29 |
| **Stripe Webhook Architecture** | https://docs.stripe.com/webhooks | US | Raw Signature Verification & Idempotency | 2024-06-20 | 2026-08-29 | Webhook Processing Guide | `webhookHandler.ts`, Idempotency Keys | APPROVED | 2026-11-29 |
