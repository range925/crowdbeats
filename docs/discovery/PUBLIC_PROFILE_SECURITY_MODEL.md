# CROWDBEATS V2 — PUBLIC PROFILE SECURITY & DATA ISOLATION MODEL

**Document:** `docs/discovery/PUBLIC_PROFILE_SECURITY_MODEL.md`  
**Classification:** Security Architecture & Access Control Specification  
**Status:** **AUTHORITATIVE DESIGN & IMPLEMENTATION SPECIFICATION**  
**Target Environment:** Cloud Firestore, Firebase Auth, Cloud Functions Gen 2  

---

## 1. Security Philosophy: "Public Browsing $\ne$ Public Database Access"

Enabling frictionless public discovery does **NOT** relax the core security invariants of Crowdbeats. The platform continues to enforce a strict **Default-Deny** security posture with clear isolation between public-safe projection fields and sensitive creator records:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             PUBLIC SURFACE                               │
│  (Read-only, Unauthenticated, CDN & Client cached, No PII or Financials) │
├─────────────────────────────────────┬────────────────────────────────────┤
│ Public Artist Projection:           │ Public Band Projection:            │
│ • stageName                         │ • name                             │
│ • creatorSlug                       │ • bandSlug                         │
│ • bio                               │ • bio                              │
│ • photoUrl, coverUrl                │ • photoUrl, coverUrl               │
│ • genres                            │ • genres, memberCount              │
│ • isVerified (badge display)        │ • isVerified, isLive               │
│ • isLive, currentVenueName          │ • socialLinks                      │
│ • public discovery coordinates      │ • public discovery coordinates     │
└─────────────────────────────────────┴────────────────────────────────────┘
                                  │
                                  │  ISOLATION FIREWALL (Default-Deny)
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         ISOLATED SERVER SECRETS                          │
│     (Server-Only, No Client Reads, Cloud Functions & Stripe Protected)   │
├─────────────────────────────────────┬────────────────────────────────────┤
│ Creator Financials & PII:           │ Creator Private Metadata:          │
│ 🔒 Stripe Connected Account ID      │ 🔒 Private Residential Address     │
│ 🔒 Total Ledger Balances            │ 🔒 Identity Verification (KYC) Docs│
│ 🔒 Bank Account Linking Status      │ 🔒 Continuous GPS Tracking History │
│ 🔒 Platform Fee Rates / Splits      │ 🔒 Moderation Notes & Strike Logs  │
│ 🔒 Private Legal Name, Email, Phone │ 🔒 Internal Platform Flags         │
└─────────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Public vs. Private Field Matrix

| Field Name | Storage Location | Public Read Allowed | Unauthenticated Access | Client Write Allowed | Rationale & Protection Method |
|---|---|---|---|---|---|
| `stageName` / `name` | `/artistProfiles`, `/bands` | ✅ YES | ✅ YES | 🔒 Owner only | Public identity for discovery |
| `bio`, `genres`, `photos`| `/artistProfiles`, `/bands` | ✅ YES | ✅ YES | 🔒 Owner only | Marketing & discovery EPK |
| `isVerified`, `isLive` | `/artistProfiles`, `/bands` | ✅ YES | ✅ YES | 🚫 SERVER ONLY | Verified status & live HUD badge |
| `discoveryCoordinates` | `/artistProfiles`, `/bands` | ✅ YES | ✅ YES | 🔒 Owner (General) | Approximate discovery area or venue |
| `homeAddress` / `privateGps`| `/users/{uid}/private` | ❌ NEVER | ❌ NEVER | 🔒 User private | Critical privacy protection |
| `stripeAccountId` | `/users/{uid}`, `/artistProfiles` | ❌ NEVER | ❌ NEVER | 🚫 SERVER ONLY | Financial isolation invariant |
| `totalTipsReceivedCents` | `/artistProfiles`, `/bands` | ❌ NEVER | ❌ NEVER | 🚫 SERVER ONLY | Financial ledger confidentiality |
| `popularityScore` | `/artistProfiles` | ✅ Read score only | ✅ YES | 🚫 SERVER ONLY | Calculated by trusted Cloud Functions |
| `moderationStatus` / `strikes`| `/moderationQueue`, `/strikes` | ❌ NEVER | ❌ NEVER | 🚫 STAFF ONLY | Internal trust & safety governance |

---

## 3. Server-Authoritative Eligibility Validation

To prevent banned, suspended, or unverified entities from leaking into public feeds, the backend enforces `assertCreatorPubliclyDiscoverable()`:

```typescript
// Enforced in Cloud Functions
const { isEligible, reason } = await assertCreatorPubliclyDiscoverable(db, creatorId);
if (!isEligible) {
  // Excluded from discovery feed and search autocomplete
}
```

### Eligibility Checklist:
1. `users/{uid}.isSuspended !== true`
2. `users/{uid}.isTerminated !== true`
3. `artistProfiles/{id}.isActive === true`
4. `profile.stageName` is populated and length valid ($\le 80$ chars).
5. `moderationStatus` is not `SUSPENDED` or `TERMINATED`.
6. Live performance window is active and verified.

---

## 4. Firestore Security Rules Enforcement

```javascript
// firebase/firestore.rules
match /artistProfiles/{artistId} {
  // Public read of discoverable profiles
  allow read: if isSignedIn() || resource.data.get('isActive', false) == true;
  allow create: if false; // Via callable only
  allow update: if isSignedIn() && (resource.data.ownerUid == uid()) && ...;
  allow delete: if false;
}

match /bands/{bandId} {
  // Public read of active bands
  allow read: if isBandMember(bandId) || resource.data.get('isActive', true) == true || isSignedIn();
  allow create, delete: if false;
}

match /venueProfiles/{venueId} {
  allow read: if isSignedIn() || resource.data.get('isActive', true) == true;
  allow create, delete: if false;
}
```
