# 03 — Identity, Profile, and Membership Model
**Phase:** 3 — Trust Foundation
**Date:** 2026-08-25
**Status:** FINAL — binding for all subsequent phases

---

## 1. One Firebase UID Per Human

Every Crowdbeats user has exactly **one** Firebase Auth UID, regardless of how many personas they maintain.

```
Firebase Auth UID: "uid-david-123"
       │
       ├── /users/uid-david-123          (identity anchor)
       ├── /fanProfiles/uid-david-123    (fan persona)
       ├── /artistProfiles/artist-david  (artist persona — same uid as ownerUid)
       └── band memberships, venue memberships, sponsor memberships
           (subcollections, read server-side)
```

A user may be simultaneously:
- A Fan (always — every user has a fanProfile)
- An Artist (if they have created an artistProfile)
- A Band Member / Band Admin / Band Founder (if added to a band)
- A Venue Manager/Owner (if added to a venue)
- A Sponsor Rep/Admin (if added to a sponsor org)
- A Platform Staff member (if granted a platformRole via claims)

These are **not separate accounts** — they are **personas under one UID**.

---

## 2. Custom Claims Strategy

```typescript
// Firebase ID Token Custom Claims (max 1KB)
// ONLY these fields:
{
  platformRole?: PlatformRole,  // If staff (e.g. 'CONTENT_MODERATOR')
  personaType: PersonaType,     // Active persona ('fan' | 'artist' | ...)
  claimsVersion: number         // Schema version (currently 1)
}

// NEVER in claims:
// - Band memberships, band roles, split percentages
// - Venue memberships
// - Sponsor org memberships
// - Balance, payment status
// - Email, phone number
```

**Why:** Firebase custom claims have a hard 1KB limit. Band/venue/sponsor memberships are
unbounded (a user could be in 5 bands and 3 venues). These are always fetched from Firestore
server-side by Cloud Functions that verify the ID token first.

---

## 3. Persona Architecture

### Fan Persona
- Created automatically on first sign-in
- Every user has a fanProfile
- Can tip artists, follow artists, contribute to campaigns
- No special claims needed (default personaType: 'fan')

### Artist Persona
- Created via `createArtistProfile` callable
- Requires email verification
- One artistProfile per user (solo artist = artistId == uid)
- Can join a band (becomes a band member with a band role)
- Can receive tips, create campaigns, request payouts

### Band Entity
- Not a persona — a collective entity
- Has its own bandId (not a uid)
- Members are users with BandRole (BAND_FOUNDER / BAND_ADMIN / BAND_MEMBER)
- Bank account linked to band entity (not individual members)
- Tips go to the band, distributed per BandSplitConfig (server-only writes)

### Venue Entity
- Has its own venueId
- Members (users) have VenueRole (VENUE_OWNER / VENUE_MANAGER / VENUE_STAFF)
- Creates stages and stage sessions via callable

### Sponsor Organization
- Has its own orgId
- Members have SponsorRole (SPONSOR_ADMIN / SPONSOR_REP) — OD-08 Option A
- SPONSOR_ADMIN controls treasury, escrow deposits, contract signing
- SPONSOR_REP can discover artists, shortlist, message, view analytics

### Platform Staff
- Has platformRole in custom claims
- All 16 roles per OD-07
- No separate UI app for this phase — admin capabilities added in Phase 10

---

## 4. Membership Lifecycle

```
Invite Flow (all entities):
  Admin/Founder sends invite via callable
    → Cloud Function verifies sender role
    → Creates /entities/{id}/members/{uid} with isActive: true
    → Sends Firebase notification to invitee
    → Writes AuditEvent: BAND_MEMBER_ADDED / etc.

Leave/Remove Flow:
  Member leaves via callable OR Admin removes via callable
    → Cloud Function sets members/{uid}.isActive = false, leftAt = now()
    → Document RETAINED for audit (never deleted)
    → Writes AuditEvent

Role Upgrade/Downgrade:
  Only Founder/Admin can change member roles
  Only SUPER_ADMIN can change staff roles (step-up auth required)
```

---

## 5. Identity Lifecycle

```
Sign-Up:
  Firebase Auth creates UID
    → createUser callable fires (or Auth trigger)
    → Creates /users/{uid} with v:1
    → Creates /fanProfiles/{uid}
    → Sets custom claims: { personaType: 'fan', claimsVersion: 1 }
    → Writes AuditEvent: USER_CREATED

Email Verification:
  Firebase Auth sends email
    → User clicks link
    → emailVerified = true on token
    → (Unlocks artist profile creation, payout requests, etc.)

Soft-Delete (GDPR / User Request):
  SUPER_ADMIN callable: deleteUser(uid)
    → Sets /users/{uid}.deletedAt = now()
    → Replaces PII fields with '[redacted]'
    → Revokes Firebase Auth tokens
    → Writes AuditEvent: DATA_DELETION_COMPLETED
    → Does NOT delete ledger/tip/audit records (legal requirement)

Account Suspension:
  TRUST_SAFETY callable: suspendUser(uid, reason)
    → Sets /users/{uid}.suspendedAt = now()
    → Revokes Firebase Auth tokens
    → Writes AuditEvent: USER_SUSPENDED
```

---

## 6. Staff Role Grants

Staff roles can only be granted by SUPER_ADMIN via a step-up callable:
1. SUPER_ADMIN re-authenticates (step-up auth)
2. Calls `grantStaffRole(targetUid, role)` callable
3. Cloud Function verifies caller's ID token claims == SUPER_ADMIN
4. Sets custom claims on targetUid via Admin SDK
5. Creates /staffRecords/{targetUid}
6. Writes AuditEvent: STAFF_ROLE_GRANTED

No client SDK call can set custom claims. No Firestore rule can grant them.
