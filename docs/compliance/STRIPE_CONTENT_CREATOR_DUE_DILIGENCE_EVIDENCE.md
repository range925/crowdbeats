# STRIPE CONTENT CREATOR DUE DILIGENCE EVIDENCE REPORT

**Organization:** Crowdbeats LLC  
**Product:** Crowdbeats V2  
**Purpose:** Formal technical and operational evidence response to Stripe Content Platform Due Diligence inquiries.  
**Classification:** Confirmed Operational Implementation  
**Last Updated:** 2026-08-30  

---

## 1. Due Diligence Responses & Evidence Matrix

### Q1: Is Stripe Connect implemented?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Yes. Solo Musicians and Bands operate as Stripe Connect Express connected accounts (`stripeConnectAccountId`).
- **Code Reference:** `apps/functions/src/connect/createConnectLink.ts`, `apps/functions/src/connect/getConnectStatus.ts`.
- **Test Evidence:** `apps/functions/src/connect/__tests__/connect.test.ts` (12/12 passing).

### Q2: How are connected creators onboarded?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Creators initiate onboarding in the app, generating an official Stripe Account Link (`type: 'account_onboarding'`). They perform identity verification, tax classification, and bank account setup directly on Stripe's hosted Express interface.
- **Code Reference:** `apps/functions/src/connect/createConnectLink.ts`.

### Q3: Does every creator have a unique URL?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Yes. Every solo musician is registered under a normalized, collision-protected canonical URL (`https://crowdbeats.ai/artist/{slug}`) and every band under (`https://crowdbeats.ai/band/{slug}`). This URL is supplied to Stripe's `business_profile.url` parameter during account provisioning.
- **Code Reference:** `apps/functions/src/profiles/slugService.ts`.
- **Test Evidence:** `apps/functions/src/profiles/__tests__/slugService.test.ts` (14/14 passing).

### Q4: How is creator monetization eligibility enforced?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Server-authoritative function `assertCreatorMayMonetize()` executes on every payment creation. It validates active account standing, Terms/AUP acceptance, verified Stripe Connect status with `charges_enabled: true`, absence of moderation strikes, and lack of compliance holds.
- **Code Reference:** `apps/functions/src/monetization/eligibilityService.ts`, `apps/functions/src/tip/createTipIntent.ts:128`.
- **Test Evidence:** `apps/functions/src/monetization/__tests__/eligibilityService.test.ts` (12/12 passing).

### Q5: What prohibited content categories exist?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Prohibitions explicitly forbid adult/sexually explicit material, unauthorized copyrighted media/pirated music, violent extremism/terrorism, hate speech, scams/fraud, and deceptive fundraising.
- **Code Reference:** `legal/ACCEPTABLE_USE_POLICY.md`, `legal/CREATOR_MONETIZATION_POLICY.md`.

### Q6: Where are policies published?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Published in the `legal/` directory, displayed during user onboarding, and accessible in the mobile settings hub (`/account/legal`) and web footer.

### Q7: How is content automatically evaluated?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Programmatic regex and heuristic pipeline (`screenTextContent`) analyzes all user-generated text and tip messages in real time prior to payment creation, categorizing risk from `LOW` to `CRITICAL`.
- **Code Reference:** `apps/functions/src/moderation/moderationScanner.ts`.

### Q8: How is manual moderation performed?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Admin Trust & Safety officers review flagged queue items and user reports in the Admin Control Center, executing actions (`APPROVE`, `REJECT`, `DEMONETIZE`, `SUSPEND`, `TERMINATE`) with mandatory reason codes.
- **Code Reference:** `apps/functions/src/moderation/moderationReview.ts`, `apps/functions/src/moderation/lifecycleService.ts`.

### Q9: How can users report content?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** In-app reporting callable `submitReport` allows users to flag profiles, posts, campaigns, and media with standardized reason codes into `/contentReports`.
- **Code Reference:** `apps/functions/src/moderation/reportService.ts`.

### Q10: How can rights holders report content?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Public web form at `/legal/copyright-report` allows external copyright owners to submit DMCA notices without an account, saving to restricted `/rightsHolderReports`.
- **Code Reference:** `apps/functions/src/moderation/submitCopyrightReportCallable.ts`, `apps/web/app/legal/copyright-report/page.tsx`.

### Q11: What happens to repeat offenders?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** 5-tier escalation ladder (`LEVEL_0_CLEAR` to `LEVEL_4_TERMINATED`) tracks verified policy strikes, automatically disabling monetization and terminating repeat violators.
- **Code Reference:** `apps/functions/src/moderation/strikeService.ts`.

### Q12: How are creators demonetized?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Demonetization is decoupled from visibility. Setting `monetizationStatus: 'DEMONETIZED'` blocks financial inflow while permitting non-monetized streaming if appropriate.
- **Code Reference:** `apps/functions/src/moderation/lifecycleService.ts`.

### Q13: How are payouts restricted?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** Setting `complianceHold: true` with reason codes freezes payout execution in `requestPayout` and pauses Stripe Express payouts.
- **Code Reference:** `apps/functions/src/financial/payoutHoldService.ts`.

### Q14: How are audit records preserved?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** All administrative mutations, strike issuances, and policy acceptances write immutable records to server-only `/auditEvents` and `/auditLogs`.
- **Code Reference:** `firebase/firestore.rules`.

### Q15: What test coverage proves these controls?
- **Status:** **`IMPLEMENTED`**
- **Technical Answer:** 35 Jest test suites comprising 286 automated tests verify all compliance, Connect, moderation, fee engine, and security rules mechanisms.
