# 03 — Canonical Data Dictionary
**Phase:** 3 — Trust Foundation
**Date:** 2026-08-25
**Status:** FINAL — Binding for all subsequent phases

---

## Privacy Legend

| Symbol | Class | Description |
|---|---|---|
| 🌐 | PUBLIC | Readable by any unauthenticated user |
| 🔐 | AUTH | Requires Firebase Auth sign-in |
| 👤 | OWNER | Only the document owner (uid match) |
| 🏢 | MEMBER | Active member of the entity |
| 🛡️ | STAFF | Platform staff role required |
| 🚫 | SERVER | Cloud Functions / Admin SDK only |

---

## Collection: `/users/{uid}`

**Ownership:** 1 per Firebase UID. Identity anchor.  
**Privacy:** 👤 OWNER + 🛡️ CUSTOMER_SUPPORT/TRUST_SAFETY/COMPLIANCE_OFFICER/SUPER_ADMIN  
**Retention:** Soft-delete only. `deletedAt` set by SUPER_ADMIN callable. Document never physically deleted (audit requirement). GDPR erasure replaces PII fields with redacted values.  
**Concurrency:** `v` field (optimistic lock). Client must send `v + 1` on update.  
**Indexing:** `uid` (primary key), `email` (composite — admin queries), `personaType`, `createdAt`

| Field | Type | Privacy | Mutable | Notes |
|---|---|---|---|---|
| `uid` | string | 👤 | ❌ | Firebase Auth UID |
| `email` | string | 👤 + 🛡️ | ❌ | Verified by Firebase Auth |
| `emailVerified` | bool | 👤 | ❌ | Set by Firebase Auth |
| `displayName` | string | 👤 | ✅ | 2–50 chars, no HTML |
| `photoUrl` | string? | 👤 | ✅ | https:// only |
| `personaType` | enum | 👤 | 🚫 | fan/artist/band_member/etc. |
| `createdAt` | timestamp | 👤 | ❌ | |
| `updatedAt` | timestamp | 👤 | 🚫 | Server-set on update |
| `v` | int | 👤 | ✅ | Must increment by 1 per update |
| `deletedAt` | timestamp? | 🛡️ | 🚫 | Soft-delete |
| `suspendedAt` | timestamp? | 🛡️ | 🚫 | TRUST_SAFETY only |
| `suspensionReason` | string? | 🛡️ | 🚫 | Staff-only visible |

**Subcollections:**
- `/users/{uid}/consents/{consentId}` — OWNER + COMPLIANCE_OFFICER read; server-created
- `/users/{uid}/settings/preferences` — OWNER read/write

---

## Collection: `/fanProfiles/{uid}`

**Privacy:** 👤 OWNER + 🛡️ CUSTOMER_SUPPORT  
**Retention:** Soft-deleted with user. `totalTippedCents` retained for audit; display name redacted.

| Field | Type | Privacy | Mutable | Notes |
|---|---|---|---|---|
| `uid` | string | 👤 | ❌ | Matches /users/{uid} |
| `displayName` | string | 👤 | ✅ | Denormalized for performance |
| `photoUrl` | string? | 👤 | ✅ | |
| `bio` | string? | 👤 | ✅ | Max 300 chars |
| `totalTippedCents` | int | 👤 | 🚫 | Server-maintained counter |
| `followingArtistIds` | string[] | 👤 | ✅ | Max 1000 |
| `createdAt` | timestamp | 👤 | ❌ | |
| `updatedAt` | timestamp | 👤 | 🚫 | |
| `v` | int | 👤 | ✅ | |

---

## Collection: `/artistProfiles/{artistId}`

**Privacy:** 🌐 PUBLIC (limited fields) + 👤 OWNER (full) + 🛡️ ARTIST_RELATIONS  
**Indexing:** `stageName`, `genres[]`, `isActive`, `verifiedAt`

| Field | Type | Privacy | Mutable | Notes |
|---|---|---|---|---|
| `artistId` | string | 🌐 | ❌ | = ownerUid for solo artists |
| `ownerUid` | string | 🌐 | ❌ | |
| `stageName` | string | 🌐 | ✅ | Max 80 chars |
| `bio` | string? | 🌐 | ✅ | Max 1000 chars |
| `photoUrl` | string? | 🌐 | ✅ | |
| `coverUrl` | string? | 🌐 | ✅ | |
| `genres` | enum[] | 🌐 | ✅ | Max 3 |
| `socialLinks` | object | 🌐 | ✅ | |
| `verifiedAt` | timestamp? | 🌐 | 🛡️ | ARTIST_RELATIONS callable |
| `totalTipsReceivedCents` | int | 🚫 | 🚫 | Server-maintained |
| `stripeAccountId` | string? | 🚫 | 🚫 | SERVER_ONLY |
| `bankLinked` | bool | 👤 | 🚫 | |
| `isActive` | bool | 🌐 | 👤 | |
| `createdAt` | timestamp | 🌐 | ❌ | |
| `updatedAt` | timestamp | 🌐 | 🚫 | |
| `v` | int | 👤 | ✅ | |

---

## Collection: `/bands/{bandId}` + `/bands/{bandId}/members/{uid}` + `/bands/{bandId}/splitConfig/current`

**Privacy:** 🔐 AUTH (public band info) + 🏢 MEMBER (financials) + 🚫 SERVER (splitConfig writes)

**Band fields:**

| Field | Type | Privacy | Mutable | Notes |
|---|---|---|---|---|
| `bandId` | string | 🌐 | ❌ | |
| `founderUid` | string | 🔐 | ❌ | |
| `name` | string | 🌐 | 🏢 ADMIN | Max 80 chars |
| `bio` | string? | 🌐 | 🏢 ADMIN | Max 1000 chars |
| `photoUrl` | string? | 🌐 | 🏢 ADMIN | |
| `memberCount` | int | 🌐 | 🚫 | Server-maintained |
| `totalTipsReceivedCents` | int | 🚫 | 🚫 | Server-maintained |
| `bankLinked` | bool | 🏢 | 🚫 | |
| `v` | int | 🏢 | 🏢 ADMIN | |

**BandSplitConfig fields:**

| Field | Type | Privacy | Mutable | Notes |
|---|---|---|---|---|
| `splits` | MemberSplitBps[] | 🏢 | 🚫 | SERVER_ONLY write |
| `validatedAt` | timestamp | 🏢 | 🚫 | Server-set |

---

## Collections: `/tips/{tipId}`, `/contributions/{contributionId}`

**Privacy:** 👤 FAN reads own; 👤 RECIPIENT reads received; 🛡️ CUSTOMER_SUPPORT read  
**Immutable after creation. No client writes.**

| Key Field | Notes |
|---|---|
| `amountCents` | Non-negative integer |
| `platformFeeCents` | floor(gross * PLATFORM_FEE_BPS / 10000) |
| `netAmountCents` | gross - fee |
| `stripePaymentIntentId` | 🚫 SERVER_ONLY |
| `status` | pending→succeeded→distributed→refunded/disputed |
| `refundedAt` | Only settable within 24h of createdAt (OD-10) |

---

## Collections: `/paymentTransactions/{txId}`, `/paymentLedger/{entryId}`, `/payouts/{payoutId}`, `/idempotencyKeys/{key}`

**Privacy:** 🚫 SERVER_ONLY  
- `paymentLedger` entries are IMMUTABLE (no `updatedAt`)
- Double-entry: every credit has a corresponding debit entry
- All amounts are integer cents
- Idempotency keys expire after 24 hours

---

## Collections: `/stages/{stageId}`, `/stageSessions/{sessionId}`, `/qrTokens/{tokenId}`

**Sessions:** 🔐 AUTH read; 🚫 SERVER writes  
**QR Tokens:** 🚫 SERVER_ONLY  
- One active session per stage at a time (server-enforced)
- QR tokens: HMAC SHA-256, 300s TTL, single-use

---

## Collections: `/auditEvents/{eventId}`, `/fraudSignals/{signalId}`, `/moderationActions/{actionId}`

**AuditEvents:** 🚫 No client reads ever; 🛡️ COMPLIANCE_OFFICER + SUPER_ADMIN only  
**AuditEvents are IMMUTABLE** — no `updatedAt` field  
**FraudSignals:** 🚫 SERVER_ONLY writes; 🛡️ TRUST_SAFETY/FINANCE_ANALYST read  
**ModerationActions:** 🛡️ CONTENT_MODERATOR/TRUST_SAFETY read/write via callable

---

## Version and Concurrency Strategy

| Collection | Has `v` field | Concurrency Strategy |
|---|---|---|
| `/users/{uid}` | ✅ | Optimistic: client sends `v + 1` |
| `/fanProfiles/{uid}` | ✅ | Optimistic: client sends `v + 1` |
| `/artistProfiles/{artistId}` | ✅ | Optimistic: client sends `v + 1` |
| `/bands/{bandId}` | ✅ | Optimistic: client sends `v + 1` |
| `/bands/{bandId}/splitConfig/current` | ✅ | Server-only write (atomic transaction) |
| `/venueProfiles/{venueId}` | ✅ | Optimistic: client sends `v + 1` |
| `/sponsorOrgs/{orgId}` | ✅ | Optimistic: client sends `v + 1` |
| `/tips/{tipId}` | ❌ | Immutable after creation |
| `/paymentLedger/{entryId}` | ❌ | Immutable — no updates ever |
| `/campaigns/{campaignId}` | ✅ | Optimistic: client sends `v + 1` |
| `/sponsorships/{sponsorshipId}` | ✅ | Optimistic: server-controlled |

---

## Deletion Behavior Summary

| Collection | Deletion Strategy | Trigger |
|---|---|---|
| `/users/{uid}` | Soft-delete (`deletedAt`) | SUPER_ADMIN callable / GDPR request |
| `/artistProfiles/{artistId}` | `isActive = false` | Owner callable |
| `/bands/{bandId}` | `isActive = false` | Founder callable |
| `/tips/{tipId}` | Never deleted — retained for audit | — |
| `/paymentLedger/{entryId}` | Never deleted — legally required | — |
| `/auditEvents/{eventId}` | Never deleted — compliance record | — |
| `/idempotencyKeys/{key}` | Firestore TTL auto-expiry after 24h | TTL policy |
| `/qrTokens/{tokenId}` | Firestore TTL auto-expiry after 5min | TTL policy |
