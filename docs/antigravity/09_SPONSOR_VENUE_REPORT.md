# Phase 9 — Sponsor and Venue Web Platforms Report

**Status:** COMPLETE  
**Version:** 0.7.0-phase9  
**Date:** 2026-08-26  

---

## 1. Executive Summary

Phase 9 delivers the responsive web-first workspaces for **Brand Sponsors** and **Live Music Venues** in Crowdbeats V2.

Key architectural achievements:
- **Strict Tenancy Authorization:** Clients never supply unverified `orgId` or `venueId`. Every server query/mutation verifies caller membership in `/sponsorOrgs/{orgId}/members/{uid}` or `/venueProfiles/{venueId}/members/{uid}`.
- **Privacy-Preserving Aggregate Talent Discovery:** Sponsor talent directory queries use privacy-preserving aggregate metrics (performance volume, follower cohorts, engagement index) without exposing individual fan identities or private donor data.
- **Server-Authoritative Non-Negative Escrow & Match Pools:** All escrow deposits, match pool activations, and drawdowns are strictly server-authoritative, idempotent, and ledger-backed (`paymentLedger`). Balances can never drop below zero.
- **Role Hierarchy & Staff Boundaries:**
  - Sponsors: `SPONSOR_ADMIN` (deposits, legal contracts, member invites) vs `SPONSOR_REP` (discovery, proposals, match pool monitoring).
  - Venues: `VENUE_OWNER` (bank accounts, manager invites, profile) vs `VENUE_MANAGER` (stages, events, sessions) vs `VENUE_STAFF` (live monitoring, check-ins).
- **Physical & Virtual Stage Invariant:** Exact 1-active-session limit enforced per stage to prevent concurrent conflicting QR rotations.

---

## 2. Sponsor Web Workspace (`apps/web/app/(sponsor)/`)

The Sponsor Workspace provides a 14-section responsive sidebar and drawer navigation:

1. `/sponsor/dashboard` — Overview of available escrow, active match pools, total matched tips, and deals in progress.
2. `/sponsor/discovery` — Search & comparison directory of verified musicians and bands with aggregate performance ratings and genre filters.
3. `/sponsor/sponsorships` — Deal pipeline (Proposed, Negotiating, Active, Completed, Cancelled) and contract links.
4. `/sponsor/applications` — Inbound talent pitches and EPK reviews.
5. `/sponsor/shortlist` — Bookmarked performers for upcoming campaigns.
6. `/sponsor/opportunities` — Match pool creation wizard (1:1 tip matching) and open RFP listings.
7. `/sponsor/messages` — Deal communication and negotiation channels.
8. `/sponsor/documents` — Bilateral executed contracts, deliverable signoffs, and brand safety agreements.
9. `/sponsor/payments` — Escrow funding portal, corporate deposit receipts, and ledger transactions.
10. `/sponsor/analytics` — Brand impressions, tip multiplier lift, and demographic cohorts.
11. `/sponsor/organization` — Brand profile, industry categorization, and verified sponsor credentials.
12. `/sponsor/team` — Member roster, 7-day invitations, and role management.
13. `/sponsor/security` — Escrow protection rules and immutable audit log trail.
14. `/sponsor/settings` — Low-balance alerts and match depletion triggers.

---

## 3. Venue Web Workspace (`apps/web/app/(venue)/`)

The Venue Workspace provides an 11-section responsive sidebar and drawer navigation:

1. `/venue/dashboard` — Tonight's stage lineup, room occupancy limits, and live tip velocity.
2. `/venue/profile` — Venue EPK, street address, capacity, and 100m check-in geofence radius.
3. `/venue/stages` — Stage configuration (Main Stage, Lounge, Patio) with capacity limits and QR presets.
4. `/venue/events` — Scheduled gigs, multi-act lineups, and door times.
5. `/venue/performances` — Historical stage performance logs and check-in records.
6. `/venue/artists` — Performer directory and historical booking records.
7. `/venue/live` — Real-time live stage session monitor, active QR token status, and live tip feed.
8. `/venue/analytics` — Stage foot traffic, hourly tipping heatmaps, and peak performance windows.
9. `/venue/staff` — Staff roster, 7-day invitations, and role privileges.
10. `/venue/security` — Access control boundaries and staff security audit logs.
11. `/venue/settings` — QR auto-rotation intervals and notification preferences.

---

## 4. Cloud Functions & Governance (`apps/functions/src/`)

### Sponsor Functions (`apps/functions/src/sponsor/`)
- **`createSponsorOrg.ts`:** Creates `/sponsorOrgs/{orgId}`, sets caller as `SPONSOR_ADMIN`, initializes 0 escrow balances, and logs audit record.
- **`inviteSponsorMember.ts`:** Enforces `SPONSOR_ADMIN` permissions, 50-member cap, and writes 7-day expiring invitation doc.
- **`respondToSponsorInvitation.ts`:** Verifies 7-day TTL, validates email match, and adds member to organization.
- **`depositEscrow.ts`:** Enforces $10.00 minimum deposit, validates admin role, handles idempotency, credits `availableEscrowCents`, and writes `paymentLedger` record.
- **`createMatchPool.ts`:** Checks escrow balance availability (prevents negative balances), reserves escrow from `availableEscrowCents`, and activates `/matchPools/{poolId}`.

### Venue Functions (`apps/functions/src/venue/`)
- **`createVenue.ts`:** Creates `/venueProfiles/{venueId}` and assigns caller as `VENUE_OWNER`.
- **`inviteVenueStaff.ts`:** Enforces role hierarchy (`VENUE_STAFF` cannot invite; `VENUE_MANAGER` cannot invite another manager), generates 7-day expiring invite.
- **`respondToVenueInvitation.ts`:** Validates 7-day TTL, verifies email match, and adds staff member to venue.
- **`createVenueStage.ts`:** Configures `/stages/{stageId}` linked to venue.
- **`startVenueSession.ts`:** Enforces 1-active-session invariant per stage, generates `qrPrefix`, and sets session `status: 'active'`.
- **`endVenueSession.ts`:** Closes stage session with status `ended` and records summary statistics.

---

## 5. Security Rules & Indexing

### Firestore Security Rules (`firebase/firestore.rules`)
- Subcollections `/sponsorOrgs/{orgId}/invitations/{id}` and `/auditLogs/{id}` secured for sponsor admins.
- Subcollections `/venueProfiles/{venueId}/invitations/{id}` and `/auditLogs/{id}` secured for venue managers.
- Top-level `/invitations/{id}` index updated to allow verified recipient reads across all personas (`band`, `venue`, `sponsor`).

---

## 6. Contracts (`packages/contracts/src/`)

Updated contracts to `v0.7.0-phase9`:
- `packages/contracts/src/profiles/sponsor.ts`: Added `SponsorInvitation`, `InviteSponsorMemberPayload`, `RespondSponsorInvitationPayload`, `DepositEscrowPayload`, and `SPONSOR_INVITATION_TTL_DAYS = 7`.
- `packages/contracts/src/profiles/venue.ts`: Added `VenueInvitation`, `InviteVenueStaffPayload`, `RespondVenueInvitationPayload`, `CreateStagePayload`, and `VENUE_INVITATION_TTL_DAYS = 7`.

---

## 7. Verification Summary

| Verification Step | Status | Result |
| :--- | :--- | :--- |
| **Jest Cloud Functions Unit Tests** | ✅ PASSED | **123 / 123 passing (100%)** across all 10 test suites (including `sponsorPlatform.test.ts` and `venuePlatform.test.ts`) |
| **Cloud Functions TypeScript Check** | ✅ PASSED | `npx tsc --noEmit` exited with code 0 (clean compilation) |
| **Next.js Web Production Build** | ✅ PASSED | `npx next build` compiled all 89 routes including 14 Sponsor and 11 Venue pages |

---

## 8. Conclusion

Phase 9 completes all requirements for the web-first Sponsor and Venue workspaces. Multi-tenant isolation, 7-day cryptographic invitations, non-negative escrow accounting, and stage session governance are fully operational and verified.
