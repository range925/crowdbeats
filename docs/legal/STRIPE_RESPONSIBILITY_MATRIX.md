# Crowdbeats V2 — Stripe vs. Platform Operational Responsibility Matrix

**Document Status:** Permanent Operations Specification  

---

## 1. Division of Responsibilities

| Operational Domain | Stripe Responsibility | Crowdbeats LLC Responsibility | Creator / Band Responsibility |
| :--- | :--- | :--- | :--- |
| **PCI-DSS Compliance** | PCI Level 1 Service Provider certification, card tokenization vaulting | PCI SAQ A compliance, HTTPS TLS 1.3 enforcement, zero raw PAN entry | N/A |
| **Customer KYC & AML Verification** | Document verification, sanctions screening, TIN matching | Enforcing onboarding gate before tip payouts are enabled | Providing accurate identity and tax documentation |
| **Payment Authorization** | Direct interchange routing, 3D Secure 2 authentication | Calculating 5% application fee, creating PaymentIntent with metadata | N/A |
| **Funds Disbursement** | Direct ACH/card transfer to Connected Account bank account | Determining split percentages, initiating transfer calls | Maintaining valid bank account information |
| **Chargeback & Dispute Handling** | Transmitting network dispute notifications, collecting evidence | Alerting creator, placing temporary balance hold, submitting proof | Providing performance delivery proof (session logs) |
| **Tax Reporting (1099-K)** | Generating and filing IRS Form 1099-K for eligible accounts | Maintaining transaction ledger and reconciling gross volume | Reporting gross income on personal/business tax returns |
| **Customer Support** | Payment gateway status and Connected Account payout failures | User-facing transaction inquiries, refund requests, app usability | Session schedule inquiries, physical merchandise fulfillment |
