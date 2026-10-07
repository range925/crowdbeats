# Crowdbeats V2 — Federal Compliance Matrix

**Document Status:** Permanent Compliance Matrix  
**Jurisdiction:** United States Federal Statutes & Regulations  

---

## 1. Federal Statutory Areas

### COMP-01: FTC Act Section 5 (Unfair or Deceptive Practices)
- **Citation:** 15 U.S.C. § 45
- **Implementation:** Pre-transaction modal explicitly calculates and discloses the 5% platform fee ($0.25 on a $5.00 tip) prior to authorization. The 24-hour dispute and refund window is clearly communicated.
- **Evidence:** `apps/mobile/lib/ui/settings/tipping_preferences_screen.dart`, `apps/functions/src/tip/createTipIntent.ts`.

### COMP-04: COPPA (Children's Online Privacy Protection Act)
- **Citation:** 15 U.S.C. §§ 6501–6506; 16 C.F.R. Part 312
- **Implementation:** Crowdbeats is an adult music discovery and tipping platform. Onboarding enforces an explicit 18+ adult age confirmation checkbox. We do not collect date of birth or biometric data, and we do not target minors under 13.
- **Evidence:** `docs/compliance/CHILDREN_AND_AGE_POLICY.md`.

### COMP-07: PCI-DSS v4.0 (SAQ-A)
- **Citation:** Payment Card Industry Data Security Standard
- **Implementation:** Crowdbeats uses Stripe PaymentSheet on Mobile and Stripe Elements iframe on Web. No Primary Account Numbers (PAN), CVVs, or card magnetic stripe data ever touch Crowdbeats servers or databases.
- **Evidence:** `apps/functions/src/payment/setupPaymentMethod.ts`.

### COMP-11: OFAC Sanctions & AML
- **Citation:** 31 C.F.R. Part 500
- **Implementation:** Automated screening of connected accounts and payout recipients against OFAC Specially Designated Nationals (SDN) lists via Stripe Radar.
- **Evidence:** `apps/functions/src/connect/createConnectLink.ts`.

### COMP-12: DMCA § 512 Safe Harbor
- **Citation:** 17 U.S.C. § 512(c)
- **Implementation:** Registered Designated Copyright Agent with U.S. Copyright Office. Expedited notice intake, 14-day counter-notice hold period, and repeat infringer termination policy.
- **Evidence:** `docs/compliance/DMCA_OPERATIONS_PLAN.md`.

### COMP-15: CAN-SPAM Act of 2003
- **Citation:** 15 U.S.C. §§ 7701–7713
- **Implementation:** Transactional vs. promotional email preference toggles. All outbound emails include 1-click unsubscribe headers and Crowdbeats LLC physical postal address.
- **Evidence:** `apps/mobile/lib/ui/settings/notifications_settings_screen.dart`.

### COMP-16: TCPA (Telephone Consumer Protection Act)
- **Citation:** 47 U.S.C. § 227
- **Implementation:** SMS alerts require separate, affirmative opt-in with explicit frequency and message disclosure. Default setting is OFF.
- **Evidence:** `packages/contracts/src/settings/userSettings.ts`.

### COMP-26: FTC Endorsement Guides
- **Citation:** 16 C.F.R. Part 255
- **Implementation:** Visual "#Sponsored" badge rendered automatically on sponsor-funded match pools and corporate-backed live stages.
- **Evidence:** `apps/web/app/(admin)/admin/sponsorships/page.tsx`.

### COMP-27: NIST AI Risk Management Framework
- **Citation:** NIST AI 100-1
- **Implementation:** AI-generated discovery summaries and automated toxicity scans maintain human-in-the-loop oversight. AI tools are never represented as legal or medical certifications.
- **Evidence:** `packages/contracts/src/compliance/complianceRegister.ts`.
