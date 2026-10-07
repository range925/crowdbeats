# Crowdbeats V2 — Account Settings Current State Audit

**Audit Date:** August 29, 2026  
**Document Status:** Final Audit  
**Authoritative Reference:** Google Stitch Project `5326179813018056505` (Vivid Resonance)  

---

## 1. Executive Summary

The existing Crowdbeats V2 Account Settings implementation across both Flutter Mobile (`apps/mobile/lib/main.dart`) and Next.js Web (`apps/web/app/account/page.tsx`) was a temporary placeholder.

### Current Deficiencies
1. **Limited Content:** Contains only 3 rudimentary cards:
   - **Current session:** Email, Display Name, Persona, User ID (read-only strings).
   - **Session:** Single "Sign out" button.
   - **Danger Zone:** "Delete my account…" button with text confirmation.
2. **Missing Essential Capabilities:**
   - No Profile management (avatar, bio, verified status, social links, public profile link).
   - No Role-Aware Persona switching or multi-persona management.
   - No Financial / Money tools (Payment methods, Tipping history/receipts, Stripe Connect status, Payouts, Band splits, Sponsorship escrow).
   - No Artist / Band creator tools (Live performance presets, QR tip settings, Band member roster, Campaign defaults).
   - No Sponsor tools (Organization profile, Team permissions, Match pools, Invoices).
   - No Security & Sign-In management (Password change, Connected OAuth accounts, Active device sessions, Biometric app lock).
   - No Granular Preferences (Notification category toggles, Location precision, Discovery preferences, Appearance, Accessibility).
   - No Trust & Safety controls (Safety Hub, Blocked accounts, Incident reports, Support tickets).
   - No Legal & Data transparency (Terms of Service, Privacy Policy, DMCA, Monetization policy, Download My Data export).
3. **Flawed Account Deletion Workflow:**
   - Client directly calls sign out without backend validation of active band founder roles, escrow balances, pending payouts, disputes, or statutory record retention.

---

## 2. Architecture & Codebase Inspection

### 2.1 Front-End Entry Points
| Platform | File Path | Route | Current Implementation |
| :--- | :--- | :--- | :--- |
| **Flutter Mobile** | `apps/mobile/lib/main.dart` (`_AccountSettingsScreen`) | `/account` | 3 nested cards, 0 sub-routes, 0 settings toggles |
| **Next.js Web** | `apps/web/app/account/page.tsx` (`AccountPage`) | `/account` | Single-column form, 0 sub-sections, 0 role adaptation |

### 2.2 Persona & Identity Architecture
- **Authentication:** Single Firebase Auth UID per human identity.
- **Supported Personas:**
  - `fan`: Music listener & live tipper
  - `artist`: Solo performing musician
  - `band_member`: Band member / owner / manager
  - `venue_manager`: Live music venue manager
  - `sponsor_rep`: Brand / local business sponsor
  - `admin`: Super admin / trust & safety / compliance staff
- **Multi-Persona Model:** A user's UID maps to multiple Firestore documents:
  - `/users/{uid}`: Core user profile and active persona type.
  - `/fanProfiles/{uid}`: Fan preferences, followed artists, total tips given.
  - `/artistProfiles/{artistId}`: Musician EPK, genres, Stripe account, tip stats.
  - `/bands/{bandId}/members/{uid}`: Band membership and split percentage.
  - `/sponsorOrgs/{orgId}/members/{uid}`: Sponsor organization membership.
  - `/venues/{venueId}/staff/{uid}`: Venue staff role.

### 2.3 Existing Backend Services & Cloud Functions
| Domain | Existing Backend Functions | Firestore Collections | Gap / Required Addition |
| :--- | :--- | :--- | :--- |
| **Profiles** | `resolveCreatorBySlug`, `checkMonetizationEligibility` | `users`, `fanProfiles`, `artistProfiles` | Full profile editor & avatar uploader |
| **Payment Methods** | `createSetupIntent`, `listPaymentMethods`, `setDefaultPaymentMethod` | `users/{uid}`, Stripe Customer | UI integration in Account Hub |
| **Stripe Connect & Payouts** | `createConnectLink`, `getConnectStatus`, `requestPayout`, `applyCreatorPayoutHold` | `payouts`, `payoutHolds`, `paymentLedger` | Payout history UI & Connect status banner |
| **Band Governance** | `createBand`, `inviteBandMember`, `updateBandMemberRole`, `setBandSplitConfig`, `getBandTreasury` | `bands`, `bands/{id}/members`, `bands/{id}/splits` | Band management sub-navigation in Settings |
| **Privacy & GDPR** | `requestPrivacyExport`, `recordConsent` | `privacyExportRequests`, `consent` | Privacy settings toggles & export trigger |
| **Notifications** | `registerDeviceToken`, `unregisterDeviceToken` | `deviceTokens`, `notifications` | Notification category preference controls |
| **Trust & Safety** | `submitReport`, `issueCreatorStrike`, `reviewFlaggedContent` | `reports`, `contentStrikes`, `moderationQueue` | Blocked users subcollection & safety hub |
| **Account Deletion** | *None (client only)* | *None* | `requestAccountDeletion` Cloud Function with cascade safety |

---

## 3. Reference Analysis: Lyft Inspection Takeaways

Based on the provided reference screenshots:
1. **Profile Header at Top:** Large user avatar, display name, genuine verification checkmark, tenure subtitle ("Member since..."), and explicit "View profile" / "Edit profile" action.
2. **Prominent Section Headings:** Large, clear section titles (**Your Crowdbeats**, **Money & Payouts**, **Artist & Band Tools**, **Account**, **Preferences**, **Trust, Safety & Support**, **Legal & Data**, **Session**) without wrapping each item in a card.
3. **Full-Width Menu Rows:**
   - Recognizable leading line icon with theme color.
   - High-contrast title and concise subtitle.
   - Value / Status pill (e.g., `Verified`, `Default`, `Connected`, `USD`).
   - Trailing chevron (`>`) indicating navigation.
   - Generous 56px touch targets meeting WCAG 2.2 AA accessibility standards.
4. **Separation of Danger Controls:** Destructive actions (Deactivate / Delete Account) are isolated from everyday settings.

---

## 4. Audit Conclusion & Mandate

A complete redesign of the Account Settings experience is required across Flutter Mobile and Next.js Web to replace the temporary 3-card screen with a role-aware, Stitch-themed Account Hub.
