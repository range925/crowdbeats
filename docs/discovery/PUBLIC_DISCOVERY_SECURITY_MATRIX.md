# Crowdbeats V2 — Public Discovery Security & Privacy Matrix
**Document Reference**: `CB-DOC-DISCOVERY-SEC-002`  
**Classification**: Security Architecture & Data Classification Matrix  
**Last Updated**: 2026-08-28  

---

## 1. Domain Data Classification Matrix

| Entity | Field Name | Classification | Access Rule | Defense Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Artist** | `stageName` | PUBLIC | Unrestricted Public Read | Sanitized string index |
| **Artist** | `creatorSlug` | PUBLIC | Unrestricted Public Read | Lowercase alphanumeric kebab |
| **Artist** | `bio` / `genres` | PUBLIC | Unrestricted Public Read | Automated content moderation filter |
| **Artist** | `legalName` | CONFIDENTIAL | Owner & Super Admin only | Stored in `/users/{uid}/legal` |
| **Artist** | `email` / `phone` | CONFIDENTIAL | Owner & Super Admin only | Stored in `/users/{uid}` with rule auth check |
| **Artist** | `homeAddress` | RESTRICTED | Owner & Super Admin only | Never collected or stored in public collections |
| **Artist** | `stripeAccountId` | RESTRICTED | Server Functions only | Stored in `/users/{uid}/financial` |
| **Artist** | `kycDocuments` | RESTRICTED | Stripe Gateway only | Handled directly via Stripe Identity |
| **Band** | `bandName` | PUBLIC | Unrestricted Public Read | Public registry |
| **Band** | `memberSplits` | PRIVATE | Band Members only | Stored in `/bands/{bandId}/splits` |
| **Band** | `payoutRouting` | RESTRICTED | Band Admin & Server only | Financial subcollection |
| **Venue** | `venueName` | PUBLIC | Unrestricted Public Read | Public registry |
| **Venue** | `publicAddress` | PUBLIC | Unrestricted Public Read | Commercial venue street address |
| **Venue** | `ownerContact` | CONFIDENTIAL | Venue Manager only | Private staff subcollection |
| **Stage Session**| `currentPerformer`| PUBLIC | Unrestricted Public Read | Active session registry |
| **Stage Session**| `totalTipsCents` | PRIVATE | Host Venue & Performer only | Real-time aggregate security rule check |
| **Fan** | `deviceGpsLocation`| EPHEMERAL | Fan Device Memory only | Never transmitted in raw continuous stream |
| **Fan** | `paymentMethodId` | RESTRICTED | Server & Stripe only | Tokenized via Stripe Elements / PaymentSheet |

---

## 2. Spatial Privacy & Geolocation Protection

1. **Strict Decoupling of Device vs Discovery Location**:
   - `deviceLocation` represents the user's optional GPS coordinates.
   - `discoveryLocation` represents the search anchor (e.g. *Torrance, CA* or *San Diego, CA*).
   - If location access is denied or unavailable, `discoveryLocation` defaults to curated discovery hubs.
2. **Coarse Bounding Boxes**:
   - Server-authoritative geo-queries compute coarse latitude/longitude bounding boxes ($\pm 0.05^\circ$ to $\pm 0.5^\circ$) rather than pinpointing individual user devices.
   - Commercial venue coordinates are publicly anchored to physical commercial stages, protecting musicians' private residences.

---

## 3. Threat Modeling & Mitigation

| Threat Vector | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Scraping & Harvest Attacks** | Medium | Cloud Functions rate-limiting per IP (60 requests/min), Firebase App Check attestation on mobile and web. |
| **Fake Performer Sybil Attack** | High | `isVerified` badge requires automated Stripe Connect onboarding and verified payouts status. Non-verified performers cannot receive tips. |
| **Tampering with Tip Intent** | Critical | Server-authoritative `createTipIntent` callable re-calculates 5% platform fee and asserts creator discoverability before creating the Stripe PaymentIntent. |
| **Unauthenticated Write Injections**| Critical | Firestore security rules enforce `request.auth != null` on all write paths; public rules allow `read` strictly on active documents. |
| **Location Permission Denial Stalling**| Medium | Non-blocking permission UX with instant city fallback (e.g. Torrance, CA) ensures the app remains 100% operational without GPS. |
