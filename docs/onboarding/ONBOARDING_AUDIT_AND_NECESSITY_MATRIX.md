# Crowdbeats V2 — Onboarding Audit & Field Necessity Matrix

**Authoritative Design Authority:** Google Stitch 5326179813018056505  
**Compliance Standard:** Non-negotiable No-Fake-Autofill & Progressive Disclosure Contract  

---

## 1. Field Necessity & Data Privacy Matrix

| Field Name | Category | Persona | Why Needed? | Mandatory / Optional | Initial Value Invariant | Storage Location | Retention / Sensitivity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Email Address** | Authentication | All | Account identification & credential recovery | Mandatory | Empty unless from Google/Apple ID token | `/users/{uid}.email` | Core Identity / PII |
| **Age / Legal Majority** | Compliance | All | Enforce 18+ legal contract eligibility | Mandatory | **Unchecked (false)** | `/users/{uid}.isAdult` | Compliance record |
| **Terms of Service** | Compliance | All | Enforce binding Terms of Service (v2026-08-25) | Mandatory | **Unchecked (false)** | `/users/{uid}.termsAccepted` | Immutable server timestamp |
| **Privacy Policy** | Compliance | All | Acknowledge data processing practices | Mandatory | **Unchecked (false)** | `/users/{uid}.privacyAccepted` | Immutable server timestamp |
| **Marketing Consent** | Communication | All | Opt-in for live event updates | Optional | **Unchecked (false)** | `/users/{uid}.marketingConsent` | User-revocable |
| **Primary Persona** | Routing | All | Directs initial experience (Fan/Solo/Band/Sponsor) | Mandatory | **Unselected (null)** | `/users/{uid}.personaType` | Public role claim |
| **Display Name** | Public Identity | All | Visible label across stage sessions & tips | Mandatory | Pre-filled only if from OAuth; editable | `/users/{uid}.displayName` | Public profile data |
| **Unique Handle** | Public Identity | All | Creator / Fan routing slug (`@handle`) | Optional | Empty; validated for uniqueness | `/handles/{handle}` | Public profile data |
| **Favorite Genres** | Discovery | Fan | Personalize nearby stage sessions | Optional (Skip supported) | **Empty array `[]`** | `/users/{uid}.favoriteGenres` | Non-sensitive preferences |
| **Location / Metro** | Discovery | Fan / Performer | Filter events & stages geographically | Optional | User search or explicit GPS button | `/users/{uid}.city` | Coarse city level only |
| **Stage / Artist Name** | Creator | Solo Musician | Performer identity on stage cards | Mandatory (Defaults to display name) | User entered | `/artistProfiles/{uid}.stageName` | Public profile data |
| **Band Name** | Ensemble | Band | Collective artist brand | Mandatory | User entered | `/bands/{bandId}.bandName` | Public brand data |
| **Organization Name** | Corporate | Sponsor | Brand identification for match pools | Mandatory | User entered | `/sponsorProfiles/{uid}.orgName` | Business identity |

---

## 2. Eliminated Anti-Patterns

1. **Eliminated Placeholder-as-Value:**
   - Previous versions initialized state with fake demo identities (`Jordan Taylor`, `jordanlovesmusic`, `Rock, Indie`). All forms now initialize strictly to blank/empty values.
2. **Eliminated Prechecked Consents:**
   - Checkboxes for ToS, Privacy, and Age confirmation now strictly start unchecked (`false`).
3. **Eliminated Premature Financial KYC:**
   - Payout bank accounts, SSN/EIN, and tax documentation are fully deferred to the downstream `Start Earning / Set Up Payouts` Stripe Connect flow.
