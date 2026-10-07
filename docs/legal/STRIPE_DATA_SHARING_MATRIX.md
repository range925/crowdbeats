# Crowdbeats V2 — Stripe Data Sharing & Privacy Boundary Matrix

**Document Status:** Privacy & Security Specification  
**Governing Standard:** Stripe Privacy Policy & California Consumer Privacy Act (CPRA)  

---

## 1. Data Category & Privacy Role Mapping

| Data Category | Data Elements | Source | Destination | Stripe Privacy Role | Crowdbeats Privacy Role | Purpose & Legal Basis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cardholder Payment Data** | Card Number (PAN), CVC, Expiration Date | User Browser / App | Stripe Tokenization Vault | Independent Controller | Not Collected / Zero Exposure | Payment execution, fraud mitigation |
| **Tokenized Payment Metadata** | Stripe Customer ID, Card Brand, Last 4 Digits, Expiration Month/Year | Stripe API | Crowdbeats Encrypted Database | Processor / Service Provider | Business / Controller | Displaying saved cards, generating receipts |
| **Creator Identity (KYC)** | Legal Name, SSN/EIN, Date of Birth, Photo ID, Bank Account Routing | Creator Onboarding | Stripe Identity & Connect Vault | Independent Controller | Status Tracker Only (`kyc_verified`) | Anti-money laundering (AML), 1099-K reporting |
| **Transaction Event Telemetry** | Amount ($), Tip ID, Timestamp, Charge ID, Application Fee Split | Crowdbeats Functions | Stripe API & Webhook Stream | Joint / Service Provider | Business / Controller | Ledger settlement, band revenue distribution |
| **Risk & Fraud Signals** | Radar Score, IP Country, Decline Reason Code, Dispute Evidence | Stripe Radar API | Crowdbeats Trust & Safety Center | Independent Controller | Business / Controller | Chargeback mitigation, platform integrity |
