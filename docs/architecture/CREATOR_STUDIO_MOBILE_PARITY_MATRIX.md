# Crowdbeats V2 — Creator Studio Mobile Parity Matrix
## Detailed Capability Inventory: Web Creator Studio vs. Solo & Band Mobile

**Status:** Audited  
**Date:** 2026-08-30  

---

| # | Capability Area | Web Creator Studio Route | Solo Mobile Status | Band Mobile Status | Backend Readiness | Permission Model | Data Source / Collection | Phase |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| **1** | **Public Profile** | `/creator/profile` | ⚠️ Basic Tab | ⚠️ Basic Tab | ✅ Production | Owner / Band Member | `artistProfiles`, `bands` | **Phase 5** |
| **2** | **Live Check-In & QR** | `/creator/performances` | ⚠️ Basic Live Tab | ⚠️ Basic Live Tab | ⚠️ Needs Geofence | Check-in Operator | `stageSessions`, `qrTokens` | **Phase 4** |
| **3** | **Campaigns** | `/creator/campaigns` | ⚠️ Read-only | ⚠️ Read-only | ✅ Production | Campaign Manager | `campaigns`, `contributions` | **Phase 6** |
| **4** | **Tips & Earnings** | `/creator/dashboard` | ⚠️ Static Snapshot | ⚠️ Static Snapshot | ✅ Production | Owner / Member | `paymentLedger`, `tips` | **Phase 8** |
| **5** | **Payouts & KYC** | `/creator/payouts` | ⚠️ Missing KYC UI | ⚠️ Missing KYC UI | ✅ Production | Payout Rep | `stripeAccounts`, `payouts` | **Phase 8** |
| **6** | **Analytics & Insights** | `/creator/analytics` | ❌ Placeholder | ❌ Placeholder | ⚠️ Aggregated | Member / Manager | `analyticsEvents`, `tips` | **Phase 9** |
| **7** | **Fans & Followers** | `/creator/fans` | ⚠️ List only | ⚠️ List only | ✅ Production | Public / Member | `follows`, `tips` | **Phase 7** |
| **8** | **Messages & Requests** | `/creator/messages` | ❌ Missing | ❌ Missing | ⚠️ Message Schema | Member / Manager | `messages`, `threads` | **Phase 7** |
| **9** | **Events & Bookings** | `/creator/performances` | ⚠️ History only | ⚠️ History only | ⚠️ Calendar Schema | Member / Manager | `events`, `bookings` | **Phase 9** |
| **10**| **Media Library** | `/creator/media` | ❌ Missing | ❌ Missing | ✅ Storage Rules | Member / Manager | `storage: media/{uid}/*` | **Phase 5** |
| **11**| **Marketing Tools** | `/creator/marketing` | ❌ Missing | ❌ Missing | ✅ Production | Member / Manager | `artistProfiles.slug` | **Phase 9** |
| **12**| **Share Profile & QR** | `/creator/marketing` | ⚠️ Partial | ⚠️ Partial | ✅ Production | Public / Member | `qrTokens`, Dynamic Links | **Phase 5** |
| **13**| **Verification & Trust** | `/creator/payouts` | ⚠️ Missing Badges | ⚠️ Missing Badges | ✅ Production | Admin / Automated | `users/{uid}.isVerified` | **Phase 5** |
| **14**| **Notifications** | `/creator/settings` | ⚠️ Settings only | ⚠️ Settings only | ✅ Production | Owner / Member | `notifications/{uid}` | **Phase 7** |
| **15**| **Account & Security** | `/creator/security` | ✅ AccountHub | ✅ AccountHub | ✅ Production | Authenticated UID | `users/{uid}` | **Phase 2** |
| **16**| **Help & Support** | `/creator/settings` | ✅ SupportCenter | ✅ SupportCenter | ✅ Production | Authenticated UID | `supportTickets` | **Phase 2** |
| **17**| **Members & Roles** | N/A (Band Only) | N/A | ⚠️ Read-only | ✅ Production | Band Owner / Manager | `bandMemberships` | **Phase 10**|
| **18**| **Ownership Approvals**| N/A (Band Only) | N/A | ❌ Missing Queue | ✅ Production | Band Owner | `bandApprovals` | **Phase 10**|
| **19**| **Splits & Allocations**| N/A (Band Only) | N/A | ❌ Missing UI | ✅ Production | Band Owner / Payout Rep | `bandSplits` | **Phase 8** |
| **20**| **Band Governance Audit**| N/A (Band Only)| N/A | ❌ Missing UI | ✅ Production | Band Members | `bandAuditLogs` | **Phase 10**|
