# Phase 8 — Band Mobile Companion & Band Studio Report

**Status:** COMPLETE  
**Version:** 0.6.0-phase8  
**Date:** 2026-08-26  

---

## 1. Executive Summary

Phase 8 completes the **Band Native Companion App** (Flutter) and the **Responsive Web Band Studio** (Next.js 16 / React 19). A band is a shared entity resource governed through memberships where every band member signs in with their personal UID. Band splits, governance, and treasury distributions are strictly server-authoritative and versioned.

All architecture invariants have been preserved:
- **Per-Member UID Auth:** Every member signs in with their own UID and connects their own Stripe Express account.
- **Exact Split Arithmetic (100.00% / 10,000 bps):** Splits must total exactly 10,000 basis points. Odd cents are distributed deterministically via the **Largest Remainder Method (OD-09)**.
- **Immutable Earning-Time Versioning:** Each tip distribution captures the active `splitConfigVersion` at earning time, preserving historical integrity.
- **Unconnected Member Payout Protection:** Unconnected members' funds are preserved in `pendingKycBalance` on the server ledger and released upon KYC completion.
- **High-Risk Governance:** Server authorization, step-up typed confirmation (`TRANSFER OWNERSHIP`), optimistic-concurrency checks, and audit logging.

---

## 2. Mobile Companion App (`apps/mobile/lib/`)

The Band mobile companion app provides 5 dedicated tabs and an active session overlay:

### Navigation & Tabs (`ui/band/`)
1. **`BandShell` (`band_shell.dart`):** 5-tab `NavigationBar` (`IndexedStack`): **Home, Live, Campaigns, Members, Profile**. Features a context-aware **Go Live FAB** with pulsating ring.
2. **Home Tab (`tabs/band_home_tab.dart`):** Band total earnings, active member split allocations, and quick band creation modal.
3. **Live Tab (`tabs/band_live_tab.dart`):** Street GPS vs Venue Stage mode selector, expiring 90s QR display, live multi-member split attribution notice.
4. **Campaigns Tab (`tabs/band_campaigns_tab.dart`):** Band crowdfunding projects (album pressing, tour funding, merch drops).
5. **Members Tab (`tabs/band_members_tab.dart`):** Member roster with role badges (`Founder`, `Admin`, `Member`), split percentage chips, and 7-day expiring invitation modal.
6. **Profile Tab (`tabs/band_profile_tab.dart`):** Band Electronic Press Kit (EPK) summary and deep links to Web Band Studio.

### State & Firebase Services
- **`band_service.dart`:** Singleton wrapping all Band Cloud Functions callables (`createBand`, `inviteBandMember`, `respondToBandInvitation`, `updateBandMemberRole`, `removeBandMember`, `transferBandOwnership`, `setBandSplitConfig`, `getBandTreasury`).
- **`band_state.dart`:** Riverpod `NotifierProvider<BandNotifier, BandState>` with real-time Firestore listeners for band metadata, member list, and active split configurations.

---

## 3. Web Band Studio (`apps/web/app/(band)/`)

A responsive Band Studio with desktop sidebar and mobile drawer navigation:

### 17 Band Studio Pages
1. `/band/dashboard` — Gross revenue, member count, active split formula, mobile companion promo.
2. `/band/profile` — Band EPK editor, bio, multi-chip genre selector (up to 5), social and streaming URLs.
3. `/band/performances` — Live gig stage logs, performance duration, and split receipts.
4. `/band/campaigns` — Shared crowdfunding campaigns and album pressings.
5. `/band/fans` — Band audience, follower growth, and 30-day top supporters.
6. `/band/messages` — Band messaging portal placeholder.
7. `/band/members` — Member roster, 7-day invite modal, role assignment (`BAND_ADMIN`, `BAND_MEMBER`), and isolated ownership transfer dialog.
8. `/band/splits` — Versioned split config editor with exact 10,000 bps enforcement, interactive Largest Remainder odd-cents simulator (OD-09), and version history log.
9. `/band/payouts` — Member Stripe Connect onboarding matrix, KYC status badges, and balance overview.
10. `/band/revenue` — Band treasury breakdown, gross revenue, 5% platform fee deduction, and net split ledger.
11. `/band/analytics` — Gig tip revenue, venue trends, and growth charts.
12. `/band/marketing` — Direct band tip link copy button and embeddable iframe widget snippet.
13. `/band/media` — Press photos, stage backdrops, and media library.
14. `/band/sponsors` — Brand sponsorships and gear endorsements portal placeholder.
15. `/band/documents` — Legally binding split contracts and member ratification records.
16. `/band/security` — Governance audit trail log and step-up auth settings.
17. `/band/settings` — Multi-member notification preferences.

---

## 4. Cloud Functions & Split Engine (`apps/functions/src/band/`)

### Deployed Band Functions
- **`createBand.ts`:** Creates `/bands/{bandId}`, assigns caller as `BAND_FOUNDER`, initializes 100% split v1, and writes audit entry.
- **`inviteBandMember.ts`:** Validates admin/founder authorization, enforces 20-member cap, generates 7-day expiring invitation doc in `/bands/{bandId}/invitations/{id}` and top-level index.
- **`respondToBandInvitation.ts`:** Validates 7-day TTL and email match; atomically adds member, increments `memberCount`, updates status to `accepted`, and writes audit log.
- **`updateBandMemberRole.ts`:** Enforces founder authorization, restricts target changes to `BAND_ADMIN`/`BAND_MEMBER`, and logs audit trail.
- **`removeBandMember.ts`:** Prevents founder removal, enforces role hierarchy, soft-deletes membership with `isActive: false` and `leftAt`.
- **`transferBandOwnership.ts`:** Requires caller to be current founder, target to be active member, and exact confirmation phrase `"TRANSFER OWNERSHIP"`. Atomically promotes target to `BAND_FOUNDER` and demotes caller to `BAND_ADMIN`.
- **`setBandSplitConfig.ts`:** Validates sum of `splitBps === 10000`, ensures complete active member coverage, increments version number `v`, archives previous version to `/bands/{bandId}/splitHistory/{v}`, and updates `/bands/{bandId}/splitConfig/current`.
- **`getBandTreasury.ts`:** Computes gross revenue, 5% platform fees, net distributions, and member Stripe Connect KYC balances.
- **`webhookHandler.ts`:** Updated to support `recipientType === 'band'`. Fetches current split config, applies `_distributeLargestRemainder`, and creates individual `paymentLedger` credit entries tagged with `splitVersion`.

---

## 5. Security & Database Rules

### Firestore Security Rules (`firebase/firestore.rules`)
- `/bands/{bandId}`: Public read for active bands; update restricted to `isBandAdmin(bandId)` with immutable field guards.
- `/bands/{bandId}/members/{uid}`: Read allowed for band members; writes restricted to Cloud Functions.
- `/bands/{bandId}/splitConfig/{doc}` & `/bands/{bandId}/splitHistory/{v}`: Read allowed for band members; writes restricted to Cloud Functions.
- `/bands/{bandId}/invitations/{id}`: Read allowed for band admin or recipient email; writes restricted to Cloud Functions.
- `/bands/{bandId}/auditLogs/{id}`: Read allowed for band admins and super admins; writes restricted to Cloud Functions.

### Composite Indexes (`firebase/firestore.indexes.json`)
- `invitations` by `inviteeEmail` ASC, `status` ASC, `createdAt` DESC
- `members` (collectionGroup) by `isActive` ASC, `role` ASC

---

## 6. Contracts (`packages/contracts/src/`)

Updated contracts to `v0.6.0-phase8`:
- Added `BandInvitation`, `BandSplitVersion`, `MemberEarningsSnapshot`, `BandTreasurySummary`.
- Added payloads: `InviteMemberPayload`, `RespondInvitationPayload`, `UpdateMemberRolePayload`, `RemoveMemberPayload`, `TransferOwnershipPayload`.
- Added constant: `BAND_INVITATION_TTL_DAYS = 7`.

---

## 7. Verification Summary

| Suite | Status | Results |
| :--- | :--- | :--- |
| **Jest Cloud Functions Unit Tests** | ✅ PASSED | 100 / 100 passing (100%) across all 8 test suites including `bandGovernance.test.ts` (19/19) |
| **Cloud Functions TypeScript Check** | ✅ PASSED | `npx tsc --noEmit` exited with code 0 (clean compilation) |
| **Flutter Static Analysis** | ✅ PASSED | `flutter analyze` 0 errors, 0 warnings, 0 issues across all mobile files |
| **Next.js Web Build** | ✅ PASSED | Clean production build of all 17 Band Studio routes |

---

## 8. Conclusion

Phase 8 completes all requirements for the Band Native Mobile Companion and Web Band Studio. Multi-member governance, 7-day invitations, versioned split formulas with exact 10,000 bps arithmetic, and individual Stripe Connect onboarding are fully functional and verified.
