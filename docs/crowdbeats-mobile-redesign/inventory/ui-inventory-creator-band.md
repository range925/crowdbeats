# Crowdbeats Mobile Redesign: UX & Screen Inventory — Solo Musician & Band Creators

**Phase:** Phase 1 Discovery & Baseline  
**Target:** Flutter Mobile App (`apps/mobile/lib/ui/creator/`, `apps/mobile/lib/ui/band/`, `apps/mobile/lib/ui/musician/`)  
**Scope:** Solo Musician, Band, Creator Studio, Live/Go Live, Analytics, Campaigns, Finance/Payouts, Band Management, and Shared Controls  

---

## 1. Creator Shell, Context Switching & Dashboard

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `CRS-01` | route | Creator Shell (`/creator`) | `lib/ui/creator/creator_shell.dart:45` | Route `/creator`, Persona switch | Switch Shell | Render Bottom Navigation (Studio, Live, Fans, Finance) | Switch Context (Solo <-> Band) via AppBar Pill | `creatorContextProvider` | Authenticated (Solo / Band) | Content | Unauthenticated (B-20: Fan can open) | Real |
| `CRS-02` | component| Creator Context Switcher Pill | `lib/ui/components/cb_context_switcher_pill.dart:25` | Creator AppBar | Context Selection Modal | Open Context Picker | None | `creatorContextProvider.availableContexts` | Authenticated | Current Context Chip | None | Real |
| `CRS-03` | sheet | Context Selection Modal Sheet | `lib/ui/components/cb_context_switcher_pill.dart:80` | Context Switcher Pill tap | Dismiss sheet | Select Active Context (Solo vs Band) | "Add Band Profile" | `creatorContextProvider` | Authenticated (Disabled if Live) | Radio List | Live Session Lock Error | Real (hardcoded Elena Cruz / Midnight Echoes) |
| `CRS-04` | tab | Creator Studio Hub Tab (Tab 0) | `lib/ui/creator/creator_studio_tab.dart:40` | CreatorShell Index 0 | Capability routes / modals | Go Live Banner CTA | 12 Capability Tiles, Metric Summaries | `creatorStudioSummaryProvider` | Authenticated | Content | Offline, Refresh Error | Mixed: 10 tiles open placeholder modal |
| `CRS-05` | widget| Creator Metric Cards | `lib/ui/creator/dashboard/creator_metric_card.dart:20` | Studio Hub header | Tap to view Finance / Analytics | View Total Tips, Active Listeners, Live Hours | Refresh | `creatorStudioSummaryProvider` | Authenticated | Content | Loading skeleton | Real |

---

## 2. Go Live & Live Session Lifecycle

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `CRS-06` | tab | Go Live / Active Session Tab (Tab 1) | `lib/ui/creator/creator_live_tab.dart:35` | CreatorShell Index 1 | Session Summary Modal | "Start Live Session" / "End Session" | Toggle GPS Broadcasting, Stage selection | `liveSessionStateProvider`, `session_service.dart` | Location Permission, Authenticated | Idle, Active Session | Permission Denied, GPS Inaccurate | Real (B-08: missing required `idempotencyKey`) |
| `CRS-07` | sheet | Stage / Venue Proximity Picker | `lib/ui/creator/live/creator_stage_picker_sheet.dart:30` | Go Live Tab "Select Venue" | Return to Live Tab | Select Verified Stage | "Perform Anywhere (Street/Park)" | `venues` Firestore query | Location active | Loading, List, Empty | Venue Not Found | Real |
| `CRS-08` | sheet | Active Session QR Modal | `lib/ui/creator/live/persistent_qr_modal.dart:24` | Live Tab "Display QR" | Dismiss modal | Fullscreen Tip QR Display | Brightness toggle, Save to Gallery | `generateQrToken` callable | Active Session | QR Display | Token Expired, Generation Error | Real |
| `CRS-09` | dialog| End Session Confirmation Dialog | `lib/ui/creator/live/end_session_dialog.dart:20` | Live Tab "End Session" button | Session Summary Sheet | "Confirm End Session" | "Cancel" | `endSession` callable | Session Host | Loading | Network Error during End | Real |
| `CRS-10` | sheet | Live Session Summary Sheet | `lib/ui/creator/live/session_summary_sheet.dart:28` | Post session end | Dismiss to Studio Hub | "View Analytics" | "Done" | `liveSessions/{id}` | Authenticated | Summary Numbers | Receipt Generation Error | Real |

---

## 3. Creator Studio Capability Tiles (CRS-04 Subsection)

| ID | Kind | Capability Tile Label | File:Line | Target Destination | Handler Status | Data Source / Action |
|---|---|---|---|---|---|---|
| `CRS-27.t1` | tile | "Live Performance & Setlist" | `lib/ui/creator/creator_studio_tab.dart:185` | Switched to Tab 1 | Real | Switches `CreatorShell` index to 1 |
| `CRS-27.t2` | tile | "Band Management & Splits" | `lib/ui/creator/creator_studio_tab.dart:198` | Navigates to `/creator/band` | Real | Opens Band Management screen |
| `CRS-27.t3` | tile | "Payouts & Bank Account" | `lib/ui/creator/creator_studio_tab.dart:211` | Switched to Tab 3 | Real | Switches `CreatorShell` index to 3 (Finance) |
| `CRS-27.t4` | tile | "Crowd Radar & Heatmap" | `lib/ui/creator/creator_studio_tab.dart:224` | `_showCapabilityPlaceholder` | Dead Control | Shows "Crowd Radar coming soon" modal |
| `CRS-27.t5` | tile | "Stage Booking & Requests" | `lib/ui/creator/creator_studio_tab.dart:237` | `_showCapabilityPlaceholder` | Dead Control | Shows "Stage Booking coming soon" modal |
| `CRS-27.t6` | tile | "Crowdfunding Campaigns" | `lib/ui/creator/creator_studio_tab.dart:250` | `_showCapabilityPlaceholder` | Dead Control | Shows "Campaigns coming soon" modal |
| `CRS-27.t7` | tile | "Audio / Video Media Hub" | `lib/ui/creator/creator_studio_tab.dart:263` | `_showCapabilityPlaceholder` | Dead Control | Shows "Media Hub coming soon" modal |
| `CRS-27.t8` | tile | "Merch Store Integrations" | `lib/ui/creator/creator_studio_tab.dart:276` | `_showCapabilityPlaceholder` | Dead Control | Shows "Merch Store coming soon" modal |
| `CRS-27.t9` | tile | "Custom QR & Physical Signage" | `lib/ui/creator/creator_studio_tab.dart:289` | `_showCapabilityPlaceholder` | Dead Control | Shows "Signage Studio coming soon" modal |
| `CRS-27.t10`| tile | "Sponsor Matching" | `lib/ui/creator/creator_studio_tab.dart:302` | `_showCapabilityPlaceholder` | Dead Control | Shows "Sponsor Hub coming soon" modal |
| `CRS-27.t11`| tile | "Fan CRM & VIP Segments" | `lib/ui/creator/creator_studio_tab.dart:315` | Switched to Tab 2 | Real | Switches `CreatorShell` index to 2 (Fans) |
| `CRS-27.t12`| tile | "Analytics & Heatmaps" | `lib/ui/creator/creator_studio_tab.dart:328` | `_showCapabilityPlaceholder` | Dead Control | Shows "Advanced Analytics coming soon" modal |

---

## 4. Creator Fans, Finance & Payouts

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `CRS-11` | tab | Creator Fans Tab (Tab 2) | `lib/ui/creator/creator_fans_tab.dart:35` | CreatorShell Index 2 | Fan Profile modal | View Top Tippers & VIP Fans | Filter by period | `artistProfiles/{id}/fans` | Authenticated | Loading, List, Empty | Offline | Real |
| `CRS-12` | tab | Creator Finance Tab (Tab 3) | `lib/ui/creator/creator_finance_tab.dart:40` | CreatorShell Index 3 | Payout sheet | "Request Payout" CTA | Connect Stripe, View Ledger | `artistProfiles/{id}`, `payouts` query | Authenticated | Balance Display, Payout History | Stripe Disconnected, Payout Pending | Real |
| `CRS-13` | sheet | Creator Payout Request Sheet | `lib/ui/creator/finance/creator_payout_request_sheet.dart:42` | Finance Tab "Request Payout" | Return to Finance | "Confirm Payout" | Select Payout Method (Standard vs Instant) | `requestPayout` callable | Payout Eligible, Auth | Amount input | Insufficient Balance, Payout Blocked | Non-compliant (B-11: hardcodes "Instant Payout" 1% fee & mock Chase bank) |
| `CRS-14` | route | Stripe Connect Onboarding Webview / Launcher | `lib/ui/creator/finance/stripe_connect_launcher.dart:25` | Finance Tab "Connect Stripe" | Return to app | Launch Stripe Hosted Onboarding | Return URL handling | `createConnectLink` callable | Authenticated | Loading, Launching | Browser Launch Error | Real |

---

## 5. Band Management & Legacy Screens

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `BND-01` | route | Band Shell (`/band`) | `lib/ui/band/band_shell.dart:30` | Route `/band` | Switch Shell | Render Band Tabs | Switch Context | `bandStateProvider` | Band Member | Content | Non-member access | B-19: Route clashes with `/band/:slug` |
| `BND-02` | route | Band Management Hub (`/creator/band`) | `lib/ui/creator/band/creator_band_management_screen.dart:38` | Studio Tile 2 | Back to Studio | Manage Members & Splits | "Invite Member", "Edit Splits" | `bands/{bandId}`, `band_service.dart` | Band Admin / Owner | Member List, Split Breakdown | Save Error, Invalid Split Total | Real |
| `BND-03` | sheet | Invite Band Member Sheet | `lib/ui/creator/band/invite_band_member_sheet.dart:28` | Band Management "Invite" | Dismiss sheet | "Send Invitation" | Select Role, Assign Split % | `inviteBandMember` callable | Band Owner | Form | User Already Member, Invalid Email | Real |
| `BND-04` | sheet | Band Split Configuration Sheet | `lib/ui/creator/band/band_split_sheet.dart:35` | Band Management "Edit Splits" | Return to Hub | "Save Split Rules" | Adjust percentage sliders | `setBandSplitConfig` callable | Band Owner | Percentage inputs | Split sum != 100% | Real |
| `LEG-02` | dir | Orphaned Musician Directory | `lib/ui/musician/**` | None (Unrouted) | N/A | Legacy Solo Musician UI | N/A | Legacy local state | None | Legacy code | Deprecated | Orphaned: safe to remove / supersede |

---

## 6. Solo vs. Band Context Confusion & Hardcoded Mocks

1. **Hardcoded Mock Creator State (`lib/state/creator_context_state.dart:94-115`):**
   - Initial state hardcodes active context: `"Elena Cruz (Solo)"` (`id: 'artist_elena_cruz'`).
   - Hardcodes secondary context: `"The Midnight Echoes"` (`id: 'band_midnight'`).
   - If user logs into a real account, these mock contexts remain if no remote fetch overrides them.
2. **App Bar Initials Hardcoding (`lib/ui/creator/creator_shell.dart:95-102`):**
   - Initials in the avatar circle are hardcoded to `'EC'` (for solo) or `'ME'` (for band).
3. **Tab 3 Naming Discrepancy (`lib/ui/creator/creator_shell.dart:125`):**
   - Shell label says `"Inbox"`, but the body widget rendered is `CreatorFansTab` (a fan list/CRM, not messaging).
4. **Duplicate Route Namespace (`lib/main.dart:130-145`):**
   - Route `/band/:slug` captures all paths starting with `/band/` including `/band/live` and `/band/studio`, preventing dedicated band subroutes from executing unless refactored into a `StatefulShellRoute`.

---

## 7. Sponsor Shared Components & Regression Boundaries

* **`apps/mobile/lib/ui/sponsor/**`:**
  - Uses shared `CbButton`, `CbCard`, `CbTextField`, and `CbTheme`.
  - Redesign of base components in `lib/ui/components/` must ensure no breaking signature changes to prevent breaking sponsor or venue administrative tools.
