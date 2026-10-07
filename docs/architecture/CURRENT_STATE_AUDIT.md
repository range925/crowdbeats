# CROWDBEATS V2 — CURRENT STATE AUDIT

**Document Type:** Baseline Architecture Audit  
**Date:** 2026-08-30  
**Scope:** Identity, Role Transitions, Fan Wallet, Stripe Connect, Financial Subledger, Admin Observability, Profiles, and Guest Navigation.

---

## 1. Audit Summary Across Core Dimensions

| Dimension | Current State | Target Compliance State | Gap Analysis / Action Required |
| :--- | :--- | :--- | :--- |
| **Guest Navigation** | 5 bottom tabs on `FanShell` | Exactly 3 bottom tabs: Nearby, Discover, Account | Refactor `FanShell` to conditionally render a dedicated 3-tab Guest Shell for unauthenticated users. |
| **Guest Nearby Screen** | Location search + map + cards | Location search, Places Autocomplete (New), map, 3 Nearby cards, 3 Popular cards, 3 Suggested ("You may like") cards | Restrict card counts to exactly 3 max per section with truthful empty states; integrate Places Autocomplete New with session tokens. |
| **Tip Authentication Gate** | Direct tip intent creation | Modal auth gate on Guest profile tipping | Present authentication prompt preserving recipient ID; require authenticated user to review amount after sign-in. |
| **Canonical Role Model** | Firebase Auth UID with custom claims | One human = 1 UID; enforce state transition matrix | Server-authoritative role transition validators blocking self-service Fan-to-Musician promotion; Band ownership protection. |
| **Fan Wallet & Saved Cards** | SetupIntent callable available | Reusable saved card management UI + consent logging | Build `/account/payment-methods` UI in mobile and web showing safe metadata (brand, last4, exp), default selection, and delete. |
| **Stripe Connect & Payouts** | Express Connect onboarding & payout callable | State machine with plain-language status + balance/hold verification | Display 7 plain-language statuses (*Not started, Info required, Under review, Restricted, Verified, Action required*); enforce split rules. |
| **Financial Subledger** | Double-entry `/paymentLedger` | Immutable subledger + daily reconciliation runner | Add automated reconciliation runner comparing internal ledger against Stripe balance transactions; generate receipt snapshots. |
| **Admin Finance Control Plane**| Partial admin screens | 24 functional finance sections with live data & empty states | Ensure all 24 finance sections are fully navigable, permission-gated, and populated with truthful empty states. |
| **Profile Editing & Uploads** | Profile fields in settings | Secure image upload pipeline (<1MB, PNG/JPEG, magic bytes, EXIF stripped) | Create `uploadProfileImage` Cloud Function with image re-encoding, metadata stripping, and Storage rules. |
