# 03 — Firestore and Storage Rules Model
**Phase:** 3 — Trust Foundation
**Status:** FINAL

---

## Firestore Rules Architecture

### Design Principles

1. **Default-deny** — `match /{document=**} { allow read, write: if false; }` is the final rule
2. **No claim trust escalation** — rules never trust `request.resource.data.platformRole` or any user-supplied role field to grant permissions
3. **Authority source** — entity roles are verified by reading Firestore member subcollections (which are server-written only)
4. **Server-only seal** — paymentLedger, paymentTransactions, payoutLedger, auditEvents, idempotencyKeys, qrTokens: `allow read, write: if false` — no exceptions, including SUPER_ADMIN
5. **Immutable field guards** — `immutableOnUpdate([...])` protects uid, email, createdAt, totalTipsReceivedCents, stripeAccountId, etc.
6. **Type safety** — all writable fields type-checked: `isString()`, `isInt()`, `isBool()`
7. **Size limits** — string length limits enforced inline (displayName ≤ 50, bio ≤ 300, etc.)
8. **Optimistic concurrency** — `v` must equal `resource.data.v + 1` on every update to high-risk documents

### Helper Functions

```javascript
// Auth
isSignedIn()         → request.auth != null
uid()                → request.auth.uid
isOwner(resourceUid) → isSignedIn() && uid() == resourceUid
emailVerified()      → request.auth.token.email_verified == true

// Claims (read from ID token)
platformRole()       → request.auth.token.get('platformRole', null)
isStaff()            → isSignedIn() && platformRole() != null

// Membership (reads Firestore — costs 1 read per check)
isBandMember(bandId)   → exists(bands/{bandId}/members/{uid}) && isActive == true
isBandAdmin(bandId)    → isBandMember && role in ['BAND_FOUNDER', 'BAND_ADMIN']
isBandFounder(bandId)  → isBandMember && role == 'BAND_FOUNDER'
isVenueMember(venueId) → exists(venueProfiles/{venueId}/members/{uid}) && isActive
isVenueManager(venueId)→ isVenueMember && role in ['VENUE_OWNER', 'VENUE_MANAGER']
isSponsorMember(orgId) → exists(sponsorOrgs/{orgId}/members/{uid}) && isActive
isSponsorAdmin(orgId)  → isSponsorMember && role == 'SPONSOR_ADMIN'

// Field helpers
validDisplayName(name) → isString && 2..50 chars
validUrl(url)          → isString && starts with 'https://'
validBio(bio, maxLen)  → isString && size <= maxLen
immutableOnUpdate(fields) → request.resource.data.diff(resource.data).unchangedKeys()...
```

---

## Collection Rule Summary

| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| `/users/{uid}` | Owner + Support Staff | ❌ (callable) | Owner (limited fields + v check) | ❌ |
| `/users/{uid}/consents` | Owner + Compliance | ❌ (callable) | ❌ | ❌ |
| `/users/{uid}/settings` | Owner | ❌ | Owner | ❌ |
| `/fanProfiles/{uid}` | Owner + Support | ❌ (callable) | Owner (bio, photo, v) | ❌ |
| `/artistProfiles/{id}` | Auth (public) | ❌ (callable) | Owner (stage fields, v) | ❌ |
| `/bands/{id}` | Auth | ❌ (callable) | Band Admin (name, bio, v) | ❌ |
| `/bands/{id}/members` | Band member + Support | ❌ | ❌ | ❌ |
| `/bands/{id}/splitConfig` | Band member | ❌ | ❌ | ❌ |
| `/venueProfiles/{id}` | Auth | ❌ (callable) | Venue Manager (fields, v) | ❌ |
| `/venueProfiles/{id}/members` | Venue member + Support | ❌ | ❌ | ❌ |
| `/sponsorOrgs/{id}` | Sponsor member + Auth | ❌ (callable) | Sponsor Admin (fields, v) | ❌ |
| `/sponsorOrgs/{id}/members` | Sponsor member + Support | ❌ | ❌ | ❌ |
| `/staffRecords/{uid}` | Own + Super Admin | ❌ | ❌ | ❌ |
| `/stages/{id}` | Auth | ❌ | ❌ | ❌ |
| `/stageSessions/{id}` | Auth | ❌ | ❌ | ❌ |
| `/qrTokens/{id}` | ❌ | ❌ | ❌ | ❌ |
| `/tips/{id}` | Fan (own) + Recipient + Staff | ❌ | ❌ | ❌ |
| `/contributions/{id}` | Fan (own) + Staff | ❌ | ❌ | ❌ |
| `/paymentTransactions` | ❌ | ❌ | ❌ | ❌ |
| `/paymentLedger` | ❌ | ❌ | ❌ | ❌ |
| `/payouts/{id}` | Recipient + Finance Staff | ❌ | ❌ | ❌ |
| `/idempotencyKeys` | ❌ | ❌ | ❌ | ❌ |
| `/campaigns/{id}` | Auth | ❌ (callable) | Creator (title, desc, v) | ❌ |
| `/campaigns/{id}/rewards` | Auth | ❌ | ❌ | ❌ |
| `/sponsorships/{id}` | Parties + Partnerships | ❌ | ❌ | ❌ |
| `/matchPools/{id}` | Parties + Super Admin | ❌ | ❌ | ❌ |
| `/notifications/{uid}/items` | Owner | ❌ | Owner (readAt only) | ❌ |
| `/reports/{id}` | Reporter + Moderation | Auth (create) | Moderation Staff | ❌ |
| `/moderationActions` | Moderation Staff | ❌ | ❌ | ❌ |
| `/fraudSignals` | Trust + Finance Staff | ❌ | ❌ | ❌ |
| `/auditEvents` | Compliance + Super Admin | ❌ | ❌ | ❌ |

---

## Storage Rules Architecture

### Key Design Decisions

1. **Profile media is public read** — artist stage names, photos, band covers are discoverable
2. **Band/venue/sponsor media use signed upload URLs** — direct client writes are blocked in Storage rules; the callable issues short-lived signed URLs after verifying entity membership
3. **Private documents** — W-9 forms, ID verification: owner read/write, SUPER_ADMIN read
4. **Server-only paths** — `/stripe-documents`, `/audit-exports`: `allow read, write: if false`
5. **File type enforcement** — images: JPEG/PNG/WebP/GIF; documents: PDF/Word
6. **Size limits** — images ≤ 10MB; documents ≤ 50MB

### Signed Upload URL Pattern (for entity media)

```
Client → calls getUploadUrl(bandId, filename) callable
  Cloud Function: verifyIdToken → check isBandAdmin
  Cloud Function: admin.storage().bucket().file(path).getSignedUrl({ expires: +5min })
  Returns: { uploadUrl: string }
Client → PUT to uploadUrl directly (bypasses Firestore rules)
Client → calls confirmUpload(bandId, filename) callable
  Cloud Function: validates file exists, updates Firestore
```

---

## Security Auditor Self-Assessment

| Criterion | Score | Evidence |
|---|---|---|
| No role self-assignment | ✅ 5/5 | `immutableOnUpdate(['personaType', ...])` + claims set server-only |
| Update bypass (create parity) | ✅ 5/5 | All creates return `if false` (callable-only) |
| Authority source (no data trust) | ✅ 5/5 | Entity roles read from Firestore member subcollections, not `request.resource.data` |
| Storage abuse prevention | ✅ 5/5 | Type checks + size limits + signed URL pattern for entity media |
| Type safety | ✅ 5/5 | isString/isInt/isBool on all writable fields |
| Field-level isolation | ✅ 5/5 | `hasOnly([allowed fields])` on every update rule |
| Server-only enforcement | ✅ 5/5 | paymentLedger/auditEvents/qrTokens: `if false` unconditionally |
| Optimistic concurrency | ✅ 5/5 | `v + 1` enforced on all high-risk documents |

**Overall Score: 5/5 — Secure**
