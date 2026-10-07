# Crowdbeats V2 — Account Settings Role Visibility Matrix

**Audit Date:** August 29, 2026  
**Security Model:** Server-enforced Firestore Rules + Route Guards + Client UI Dynamic Rendering  

---

## 1. Persona Visibility Matrix

The following matrix dictates exactly which sections and menu items are visible and interactive for each persona.

| Section / Menu Row | Fan | Solo Musician (`artist`) | Band Member (`band_member`) | Band Founder/Admin | Sponsor (`sponsor_rep`) | Venue Manager (`venue_manager`) | Admin / Staff (`admin`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A. Profile Header** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Switch Persona Sheet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Verified Badge | — | ✅ *(if verified)*| ✅ *(if verified)*| ✅ *(if verified)*| ✅ *(if verified)*| ✅ *(if verified)*| ✅ *(Staff badge)* |
| └─ Edit Profile | ✅ *(Fan)* | ✅ *(EPK)* | ✅ *(Bio)* | ✅ *(Band)* | ✅ *(Org)* | ✅ *(Venue)* | ✅ |
| **B. Your Crowdbeats** | | | | | | | |
| ├─ Personas & Profiles | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Saved Artists & Bands | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Tip & Contribution History| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Campaign Activity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **C. Money & Payments** | | | | | | | |
| ├─ Payment Methods (Cards) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Tips & Receipts History | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Tipping Preferences | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Refund & Payment Support | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Stripe Connect Account | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ├─ Payout Methods & Balance | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ├─ Band Payment Splits | ❌ | ❌ | ✅ *(Read-only)*| ✅ *(Manage)* | ❌ | ❌ | ❌ |
| └─ Sponsorship Escrow/Billing| ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **D. Creator Tools** | | | | | | | |
| ├─ Live Performance Settings | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ├─ QR Tip Code Generator | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ├─ Band Roster & Roles | ❌ | ❌ | ✅ *(Read-only)*| ✅ *(Manage)* | ❌ | ❌ | ❌ |
| └─ EPK & Social Links | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **E. Sponsor Tools** | | | | | | | |
| ├─ Organization Profile | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| ├─ Match Pools & Budget | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| └─ Sponsorship Invoices | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **F. Account & Security** | | | | | | | |
| ├─ Personal Info (Email/Phone)| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Sign-In & Security (Pwd/OAuth)| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Active Sessions & Devices | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Biometric App Lock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **G. Preferences** | | | | | | | |
| ├─ Notification Categories | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Privacy & Location Precision| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Appearance & Accessibility| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Language & Currency | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **H. Trust & Safety** | | | | | | | |
| ├─ Safety Hub & Guidelines | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Blocked Accounts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Reports & Cases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **I. Legal & Data** | | | | | | | |
| ├─ Legal Policies (TOS/Privacy)| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Download My Data Export | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **J. Session & Danger Zone** | | | | | | | |
| ├─ Sign Out | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Delete Account Flow | ✅ | ✅ *(no hold)*| ✅ *(member)* | ✅ *(after transfer)*| ✅ *(no escrow)*| ✅ | ✅ |

---

## 2. Band Role Sub-Matrix

Inside a Band, granular role permissions are strictly enforced:

| Action / Capability | `BAND_FOUNDER` | `BAND_ADMIN` | `BAND_MEMBER` |
| :--- | :---: | :---: | :---: |
| View Band Profile & Roster | ✅ | ✅ | ✅ |
| View Band Revenue Splits | ✅ | ✅ | ✅ |
| Edit Band Profile & EPK | ✅ | ✅ | ❌ |
| Invite New Band Members | ✅ | ✅ | ❌ |
| Remove Members | ✅ | ✅ *(except Founder)*| ❌ |
| Modify Split Percentages | ✅ | ❌ | ❌ |
| View Stripe Payout Dashboard | ✅ | ❌ | ❌ |
| Transfer Band Ownership | ✅ | ❌ | ❌ |
| Delete Band | ✅ *(Founder only)* | ❌ | ❌ |
