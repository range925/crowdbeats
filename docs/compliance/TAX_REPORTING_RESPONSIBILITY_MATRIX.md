# Crowdbeats V2 — Tax Reporting & 1099-K Responsibility Matrix

**Document Status:** Permanent Tax Compliance Specification  
**Statutory Basis:** Internal Revenue Code § 6050W (26 U.S.C. § 6050W)  

---

## 1. Division of Tax Responsibilities

| Responsibility | Entity Accountable | Implementation Mechanism |
| :--- | :--- | :--- |
| **TIN / SSN / EIN Collection** | Stripe (Third-Party Settlement Org) | Stripe Express hosted onboarding. Zero raw TIN storage in Crowdbeats. |
| **1099-K Threshold Monitoring** | Stripe Connect | Automated tracking against federal ($5,000 / $600 statutory transitions) and state thresholds. |
| **1099-K Form Generation & Filing** | Stripe | Electronic e-filing with the IRS and relevant state tax authorities. |
| **Payee Form Delivery** | Stripe Express Portal | Electronic delivery via Stripe Express creator dashboard. |
| **Platform Masked TIN View** | Crowdbeats Admin Center | Masked display `***-**-1234` accessible only to `FINANCE_ADMIN` with logged audit record. |
| **Sales / Amusement Tax on Tips** | Creator / Venue | Tips are non-taxable gifts/honorariums. Ticket sales handled by venue. |
