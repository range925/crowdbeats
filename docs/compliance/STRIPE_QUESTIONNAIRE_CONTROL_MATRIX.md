# STRIPE QUESTIONNAIRE CONTROL MATRIX

| Stripe Requirement | Crowdbeats Answer | Status | Code Location | Backend Enforcement | UI Location | Policy Location | Tests Evidence | Remaining Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Stripe Connect** | Express connected accounts used for all creator payouts | `IMPLEMENTED` | `apps/functions/src/connect/` | `createConnectLink.ts` | `/creator/payouts` | `CREATOR_MONETIZATION_POLICY.md` | `connect.test.ts` | Low / Managed |
| **Unique Creator URLs** | Canonical URLs (`/artist/{slug}`, `/band/{slug}`) | `IMPLEMENTED` | `apps/functions/src/profiles/` | `slugService.ts` | `/artist/[slug]` | `CREATOR_MONETIZATION_POLICY.md` | `slugService.test.ts` | Low / None |
| **Monetization Gate** | Pre-payment eligibility assertion on every charge | `IMPLEMENTED` | `apps/functions/src/monetization/` | `assertCreatorMayMonetize()` | `/fan/tip` | `CREATOR_MONETIZATION_POLICY.md` | `eligibilityService.test.ts` | Low / None |
| **Prohibited Content** | Adult, hate, violent extremism, fraud, piracy barred | `IMPLEMENTED` | `legal/ACCEPTABLE_USE_POLICY.md` | `moderationScanner.ts` | Modal warning | `ACCEPTABLE_USE_POLICY.md` | `lifecycleService.test.ts` | Low / Managed |
| **Programmatic Safety** | Real-time text & tip message safety screening | `IMPLEMENTED` | `apps/functions/src/moderation/` | `screenTextContent()` | In-line check | `CONTENT_MODERATION_POLICY.md` | `createTipIntent.test.ts` | Low / Managed |
| **DMCA / IP Intake** | Public copyright complaint form | `IMPLEMENTED` | `apps/web/app/legal/copyright-report/` | `submitCopyrightReport` | `/legal/copyright-report` | `COPYRIGHT_POLICY.md` | Type check verified | Low / None |
| **Repeat Violators** | 5-tier strike escalation system | `IMPLEMENTED` | `apps/functions/src/moderation/` | `strikeService.ts` | Admin queue | `REPEAT_OFFENDER_POLICY.md` | `strikeService.test.ts` | Low / None |
| **Demonetization** | Independent fail-closed monetization disabling | `IMPLEMENTED` | `apps/functions/src/moderation/` | `lifecycleService.ts` | Admin toggle | `CREATOR_MONETIZATION_POLICY.md` | `lifecycleService.test.ts` | Low / None |
| **Payout Holds** | Compliance hold state machine on creator payouts | `IMPLEMENTED` | `apps/functions/src/financial/` | `payoutHoldService.ts` | Admin hold | `CREATOR_MONETIZATION_POLICY.md` | `payoutHoldService.test.ts` | Low / None |
| **Webhook Security** | Raw signature verification & event log | `IMPLEMENTED` | `apps/functions/src/tip/` | `webhookHandler.ts` | N/A | Technical spec | `webhookHandler.test.ts` | Low / None |
