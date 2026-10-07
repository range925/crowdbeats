# Crowdbeats V2 — US Compliance Obligation Register (28 Subject Areas)

**Document Status:** Operational Control Register & Legal Evidence Tracker  
**Legal Disclaimer:** This register provides an operational mapping of technical controls and evidence files. It does not certify legal compliance. Official certification requires review by qualified legal counsel.

---

## 1. Statutory Obligation Register

| ID | Subject Area | Statutory Citation | Operational Control | Status | Evidence Location | Review Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **COMP-01** | Consumer Protection | 15 U.S.C. § 45 (FTC Act § 5) | Transparent 5% fee disclosure prior to tip confirmation. | `evidence_collected` | `docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#comp-01` | 2026-11-01 |
| **COMP-02** | State Privacy Rights | Cal. Civ. Code § 1798.100 (CPRA) | In-app DSAR data export and soft-delete workflow. | `evidence_collected` | `docs/compliance/CALIFORNIA_COMPLIANCE_MATRIX.md` | 2026-11-01 |
| **COMP-03** | Geolocation Privacy | CPRA § 1798.121; VCDPA § 59.1-577 | Runtime location consent, coarse fallback, zero background tracking. | `evidence_collected` | `apps/mobile/lib/ui/settings/privacy_location_screen.dart` | 2026-11-01 |
| **COMP-04** | Children & Teens | 15 U.S.C. § 6501 (COPPA) | Explicit 18+ adult age eligibility gate on onboarding & payments. | `evidence_collected` | `docs/compliance/CHILDREN_AND_AGE_POLICY.md` | 2026-11-01 |
| **COMP-05** | Data Security | Cal. Civ. Code § 1798.81.5 | TLS 1.3, App Check, Firestore deny-by-default rules. | `evidence_collected` | `docs/design/ACCOUNT_SETTINGS_SECURITY_REVIEW.md` | 2026-11-01 |
| **COMP-06** | Breach Notification | 50 State Breach Laws | 72-hour incident notification response plan. | `evidence_collected` | `docs/compliance/BREACH_NOTIFICATION_RESPONSE_PLAN.md` | 2026-11-01 |
| **COMP-07** | Payment Processing | PCI-DSS SAQ-A v4.0 | Stripe PaymentSheet iframe encapsulation. Zero PAN in databases. | `evidence_collected` | `docs/compliance/PAYMENTS_AND_MONEY_TRANSMISSION_REVIEW.md` | 2026-11-01 |
| **COMP-08** | Money Transmission | 31 U.S.C. § 5330; 31 C.F.R. § 1010 | Direct marketplace model with Stripe Connect agent-of-payee. | `legal_review_required`| `docs/compliance/PAYMENTS_AND_MONEY_TRANSMISSION_REVIEW.md` | 2026-10-15 |
| **COMP-09** | Stripe Connect | Stripe Connect Services Agreement | Hosted KYC/KYB identity onboarding before payout activation. | `evidence_collected` | `apps/functions/src/connect/createConnectLink.ts` | 2026-11-01 |
| **COMP-10** | Tax Reporting | 26 U.S.C. § 6050W (1099-K) | Stripe Express 1099-K delivery; platform masked TIN viewing. | `evidence_collected` | `docs/compliance/TAX_REPORTING_RESPONSIBILITY_MATRIX.md` | 2026-11-01 |
| **COMP-11** | Sanctions & AML | 31 C.F.R. Part 500 (OFAC) | Stripe Radar automated sanctions & SDN list screening. | `evidence_collected` | `docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#ofac` | 2026-11-01 |
| **COMP-12** | Copyright & DMCA | 17 U.S.C. § 512(c) | Copyright agent registered; structured intake & counter-notice. | `evidence_collected` | `docs/compliance/DMCA_OPERATIONS_PLAN.md` | 2026-10-15 |
| **COMP-13** | UGC & Moderation | 47 U.S.C. § 230(c)(2) | In-app report flow, strike system, and moderation review queue. | `evidence_collected` | `apps/functions/src/moderation/moderationReview.ts` | 2026-11-01 |
| **COMP-14** | Electronic Consent | 15 U.S.C. § 7001 (E-SIGN) | Clickwrap consent records with version IDs, timestamps, and IP hashes. | `evidence_collected` | `packages/contracts/src/compliance/policies.ts` | 2026-11-01 |
| **COMP-15** | Commercial Email | 15 U.S.C. § 7701 (CAN-SPAM) | 1-click unsubscribe headers and physical postal footer address. | `evidence_collected` | `apps/mobile/lib/ui/settings/notifications_settings_screen.dart` | 2026-11-01 |
| **COMP-16** | Telemarketing & SMS | 47 U.S.C. § 227 (TCPA) | Explicit opt-in for transactional/marketing SMS (default FALSE). | `evidence_collected` | `packages/contracts/src/settings/userSettings.ts` | 2026-11-01 |
| **COMP-17** | Accessibility | ADA Title III; WCAG 2.2 AA | >=56px touch targets, >=4.5:1 text contrast, semantic labels. | `evidence_collected` | `docs/compliance/ACCESSIBILITY_VALIDATION.md` | 2026-11-01 |
| **COMP-18** | Auto-Renewal | Cal. Bus. & Prof. Code § 17600 | Crowdbeats V2 offers one-time tips only. Zero subscriptions. | `not_applicable_with_reason` | `docs/compliance/CALIFORNIA_COMPLIANCE_MATRIX.md#arl` | 2026-11-01 |
| **COMP-19** | Gift Cards | 15 U.S.C. § 1693l-1 | No stored value certificates or closed-loop cards issued. | `not_applicable_with_reason` | `docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#gift-cards` | 2026-11-01 |
| **COMP-20** | Unclaimed Property | Uniform Unclaimed Property Act | Direct payouts to creator bank routing; no long-term funds held. | `evidence_collected` | `docs/compliance/PAYMENTS_AND_MONEY_TRANSMISSION_REVIEW.md` | 2026-11-01 |
| **COMP-21** | Charity Solicitation | Cal. Gov. Code § 12580 | All tips classified as non-charitable creator honorariums. | `evidence_collected` | `packages/contracts/src/compliance/policies.ts` | 2026-11-01 |
| **COMP-22** | Employment Standards | 29 U.S.C. § 201 (FLSA) | Staff payroll and wage records maintained pursuant to FLSA. | `evidence_collected` | `docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#employment` | 2026-11-01 |
| **COMP-23** | Independent Contractor | Cal. Lab. Code § 2775 (AB 5) | Performing creators operate independently using marketplace tools. | `evidence_collected` | `docs/compliance/CALIFORNIA_COMPLIANCE_MATRIX.md#abc-test` | 2026-11-01 |
| **COMP-24** | Records Retention | 31 C.F.R. § 1010.410; 26 U.S.C. | 7-year retention of transaction ledgers post-account deletion. | `evidence_collected` | `apps/functions/src/auth/requestAccountDeletion.ts` | 2026-11-01 |
| **COMP-25** | Terms Versioning | Restatement Contracts § 19 | Clickwrap versioning and historical consent tracking. | `evidence_collected` | `packages/contracts/src/compliance/policies.ts` | 2026-11-01 |
| **COMP-26** | Endorsement Guides | 16 C.F.R. Part 255 | Mandatory "#Sponsored" badges on match pools and brand stages. | `evidence_collected` | `docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#endorsements` | 2026-11-01 |
| **COMP-27** | AI Governance | NIST AI 100-1 | Human-in-the-loop review on automated scans. Zero AI certs. | `evidence_collected` | `docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#ai-governance` | 2026-11-01 |
| **COMP-28** | Biometric Privacy | 740 ILCS 14/1 (BIPA) | Zero collection or storage of biometrics. Local OS biometrics only. | `evidence_collected` | `docs/compliance/STATE_COMPLIANCE_RESEARCH_PLAN.md#bipa` | 2026-11-01 |
