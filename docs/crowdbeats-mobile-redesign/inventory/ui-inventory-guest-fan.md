# Crowdbeats Mobile Redesign: UX & Screen Inventory — Guest & Fan Personas

**Phase:** Phase 1 Discovery & Baseline  
**Target:** Flutter Mobile App (`apps/mobile/lib/ui/`)  
**Scope:** Guest, Fan, Launch, Auth, Onboarding, Discovery, Profiles, Tipping, Social, Activity, and Settings  

---

## 1. Launch, Authentication & Onboarding

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `SYS-01` | route | Splash / Bootstrap Screen | `lib/main.dart:185` | App launch | `/` (FanShell) or `/auth` | Initialize Riverpod & Firebase | None | `authStateProvider` | None | Loading | Offline, Error, Retry | Real |
| `AUTH-01` | route | Auth Screen (Tabs: Sign In / Sign Up) | `lib/ui/auth/auth_screen.dart:45` | App launch, `/account` redirect, protected actions | Target route (`?from=`) or `/` | Submit Email Auth Form | Google Auth, Apple Auth, "Explore as Guest" | `AuthService`, `FirebaseAuth` | Public | Loading, Error | Offline, Rate-limited | Real (except `/explore` button navigates to missing route) |
| `AUTH-02` | sheet | Forgot Password Modal | `lib/ui/auth/auth_screen.dart:580` | Link on Auth Screen | Dismiss sheet | Send Password Reset Email | Cancel | `AuthService.sendPasswordResetEmail` | Public | Loading, Success, Error | Offline | Real |
| `ONB-01` | route | Universal Onboarding Wizard (Step 1: Welcome/Handle) | `lib/ui/onboarding/universal/universal_onboarding_wizard.dart:35` | Post-registration (`/onboarding`) | Step 2 (Persona Choice) | Check Handle & Continue | Skip to default | `checkHandleAvailability` callable | Authenticated | Loading, Validation Error | Offline | Real |
| `ONB-02` | route | Universal Onboarding Wizard (Step 2: Persona Selection) | `lib/ui/onboarding/universal/universal_onboarding_wizard.dart:180` | Step 1 | Step 3 or Complete | Select Persona (`fan`, `artist`, `band`) | Back | Local state | Authenticated | Selection state | None | Real |
| `ONB-03` | route | Universal Onboarding Wizard (Step 3: Profile/Genres) | `lib/ui/onboarding/universal/universal_onboarding_wizard.dart:275` | Step 2 | Complete -> Dashboard | Save Profile & Finish | Back | `completeUniversalOnboarding` callable | Authenticated | Loading, Success, Error | Retry | Real |
| `LEG-01` | route | Legacy Persona Selection Screen | `lib/ui/onboarding/persona_selection_screen.dart:25` | Legacy `/onboarding/persona` | Selected persona route | Select role | Back | Local state | Authenticated | Static | None | Orphaned (bounced by `cbAuthRedirect`) |

---

## 2. Guest & Fan Discovery, Maps & QR Scanning

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `GST-01` | route | FanShell (Discover Tab - Index 0) | `lib/ui/fan/fan_shell.dart:82` | App root `/` | Tab switch or detail navigation | Browse Live Stages | Filter by genre, Search | `nearbyLivePerformersProvider` | Public / Guest | Loading, Empty, Success | Offline, Error, Denied | Real |
| `DSC-01` | route | Public Discovery Home | `lib/ui/fan/discovery/public_discovery_home.dart:38` | Embedded in FanShell Tab 0 | Open Performer Profile | Tap Featured Performer | View All Nearby | `discoveryFeedProvider` | Public | Loading, Empty, Content | Offline, Retry | Real |
| `DSC-02` | tab | Nearby Performers Map & List | `lib/ui/fan/nearby/nearby_tab.dart:45` | FanShell Discover subview | Tap Marker / Card | View Map of Live Acts | Toggle List/Map view, Distance slider | `geolocator`, `liveSessions` Firestore | Location Permission | Loading, Content | Permission Denied, GPS Disabled | Real |
| `DSC-03` | sheet | Location Permission Explainer Sheet | `lib/ui/location/location_permission_sheet.dart:22` | First map access | Dismiss sheet | "Allow Location" | "Maybe Later" | OS Permission Handler | Public | Static | None | Real |
| `DSC-04` | route | QR Scanner Screen | `lib/ui/fan/qr/qr_scanner_screen.dart:32` | Tap QR icon in App Bar | Performer Tip Flow `/tip/:id` | Scan Performer QR Code | Torch toggle, Enter code manually | `mobile_scanner`, `verifyQrToken` callable | Camera Permission | Scanning, Success, Error | Permission Denied, Camera Unavailable | Real (B-04: contains `test_` HMAC bypass) |
| `DSC-05` | sheet | Manual Performer Code Entry Sheet | `lib/ui/fan/qr/manual_code_sheet.dart:18` | QR Scanner button | Performer Tip Flow | Lookup Performer by Code | Cancel | `verifyQrToken` callable | Public | Loading, Error | Offline | Real |

---

## 3. Public Performer Profiles & Social Interaction

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PRF-01` | route | Solo Artist Public Profile Screen | `lib/ui/fan/profile/artist_profile_screen.dart:42` | Tap performer card `/artist/:id` | Back button | Tap "Send Tip" (Opens Tip Flow) | Follow/Unfollow, Share, Message | `artistProfiles/{id}`, `liveSessions` | Public | Loading, Content, Error | Offline, Performer Inactive | Real |
| `PRF-02` | route | Band Public Profile Screen | `lib/ui/fan/profile/band_profile_screen.dart:40` | Tap band card `/band/:slug` | Back button | Tap "Tip Band" | Follow, View Members, View Setlist | `bands/{id}` | Public | Loading, Content, Error | Offline | Real (B-19: matched by `/band/:slug` catching live/studio) |
| `PRF-03` | sheet | Share Performer Sheet | `lib/ui/fan/profile/share_performer_sheet.dart:20` | Profile AppBar share icon | Dismiss sheet | Copy Link | Share to System Sheet | `share_plus` | Public | Static | None | Real |
| `SOC-01` | route | Following Tab (FanShell Index 1) | `lib/ui/fan/fan_shell.dart:95` | FanShell Tab 1 | Performer Profile | Browse Followed Artists | Unfollow, Notifications toggle | `social_service.dart:listFollowing` | Authenticated (Guest redirected) | Loading, Empty, Content | Offline, Retry | Real |
| `SOC-02` | route | Messaging Conversations List | `lib/ui/fan/social/conversations_screen.dart:30` | Following Tab header / Profile | Conversation Detail | Select Conversation | New Chat (if allowed) | `getConversations` callable | Authenticated (Guest gated) | Loading, Empty, Content | Offline | Real |
| `SOC-03` | route | Direct Chat Screen | `lib/ui/fan/social/direct_chat_screen.dart:35` | Conversation row | Back to list | Send Message | Block, Report | `sendMessage`, `getMessages` callables | Authenticated | Loading, Content | Offline, Message Failed | Real |
| `SOC-04` | dialog| Report / Safety Dialog | `lib/ui/fan/social/report_dialog.dart:24` | Chat or Profile overflow menu | Dismiss dialog | Submit Report | Cancel | `submitReport` callable | Authenticated | Loading, Success, Error | Offline | Real |

---

## 4. Tipping & Payment Flows

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `TIP-01` | route | Tip Amount Selection Screen | `lib/ui/fan/tip/tip_flow_screen.dart:44` | Profile "Send Tip", QR scan `/tip/:id` | Dismiss / Back | Tap "Continue to Payment" | Select preset ($2, $5, $10, $20), Custom amount, Add note | `artistProfiles/{id}`, local state | Public (Guest allowed) | Content | Zero amount, Currency error | Real |
| `TIP-02` | sheet | Payment Confirmation Sheet | `lib/ui/fan/tip/tip_confirmation_sheet.dart:55` | Tip Amount Screen | Tip Sent Screen (`/tip/sent`) | "Confirm & Pay" | Change Payment Method, Split tip | `createTipIntent` callable, `flutter_stripe` | Authenticated (Guest bounced) | Loading, Error | Pending, Canceled, Duplicate Protect | Compromised (B-03: swallows Stripe errors; displays incorrect fees) |
| `TIP-03` | sheet | Card Input Sheet | `lib/ui/fan/payment/cb_card_input_sheet.dart:32` | Payment Confirmation "Change Card" | Return to Confirmation | "Save Card" | Cancel | Local state, `PaymentService.savePaymentMethod` | Authenticated | Form Validation | 3DS, PCI-DSS compliance | Non-compliant (B-02: collects raw PAN in plain text) |
| `TIP-04` | route | Tip Sent / Receipt Screen | `lib/ui/fan/tip/tip_sent_screen.dart:35` | Successful payment confirmation | Return to Discovery `/` | "Done" | "Share Tip", "Follow Artist" | `paymentTransactions/{id}` / passed args | Authenticated | Static Success | Delayed confirmation, Webhook pending | Real |

---

## 5. Fan Activity, Account & Full Settings Subsection

| ID | Kind | Screen / Component Name | File:Line | Entry Points | Exit / Return Path | Primary Action | Other Actions | Data Source | Permission / Guard | States Present | Missing States | Handler Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ACT-01` | route | Activity Tab (FanShell Index 2) | `lib/ui/fan/fan_shell.dart:105` | FanShell Tab 2 | Receipt Detail | View Tip History & Badges | Filter by date | `paymentTransactions` query | Authenticated (Guest gated) | Loading, Empty, Content | Offline, Retry | Real |
| `ACT-02` | sheet | Tip Receipt Detail Sheet | `lib/ui/fan/activity/tip_receipt_sheet.dart:28` | Activity row tap | Dismiss sheet | "Download PDF Receipt" | "Report an Issue" | `paymentTransactions/{id}` | Authenticated | Content | Download Progress, PDF Error | "Download PDF" is simulated snackbar (Dead Control) |
| `ACC-01` | route | Account Hub Screen (FanShell Index 3) | `lib/ui/fan/fan_shell.dart:118` | FanShell Tab 3 | Sub-settings routes | View Profile & Settings Menu | Sign Out, Switch Persona | `AuthService`, `userSettingsProvider` | Authenticated (Guest gets GuestAccountScreen) | Content | Offline | Real |
| `ACC-02` | route | Guest Account Screen | `lib/ui/fan/account/guest_account_screen.dart:25` | Tab 3 when unauthenticated | Navigates to `/auth` | "Sign In or Sign Up" | About Crowdbeats, Legal links | Static | Public | Content | None | Real |
| `ACC-03` | route | Edit Profile Screen | `lib/ui/settings/edit_profile_screen.dart:35` | Account Hub row | Back to Account | "Save Changes" | Change Avatar, Edit Bio | `users/{uid}`, `storage_service` | Authenticated | Loading, Success, Error | Unsaved changes confirmation | Real |
| `ACC-04` | route | Notification Preferences | `lib/ui/settings/notification_settings_screen.dart:30` | Account Hub row | Back to Account | Toggle Push/Email switches | None | `userSettingsProvider` (Firestore) | Authenticated | Toggles | Sync Failure | Real |
| `ACC-05` | route | Privacy & Location Settings | `lib/ui/settings/privacy_settings_screen.dart:32` | Account Hub row | Back to Account | Select Location Precision | Toggle Discoverable in Radar | `userSettingsProvider` | Authenticated | Toggles, Radio buttons | Sync Failure | Real |
| `ACC-06` | route | Security & Sessions Screen | `lib/ui/settings/security_settings_screen.dart:36` | Account Hub row | Back to Account | "Revoke All Other Sessions" | Biometric Toggle, 2FA toggle | `userSettingsProvider` | Authenticated | List of sessions | Revoke error | Real |
| `ACC-07` | route | Accessibility & Theme Screen | `lib/ui/settings/accessibility_settings_screen.dart:28` | Account Hub row | Back to Account | Select Theme (Light/Dark/System) | Font Scale Slider, High Contrast | `userSettingsProvider`, `SharedPreferences` | Authenticated | Sliders, Toggles | None | Real |
| `ACC-08` | route | Payment Methods List | `lib/ui/settings/payment_methods_screen.dart:30` | Account Hub row | Back to Account | "Add Payment Method" | Set Default, Delete Card | `listPaymentMethods` callable | Authenticated | Loading, Empty, Content | Offline, Delete Error | Real |
| `ACC-09` | route | Legal & Terms Screen | `lib/ui/settings/legal_screen.dart:22` | Account Hub row | Back to Account | Read Terms & Privacy | Open external URL | Static | Public | Content | None | Real |
| `ACC-10` | sheet | Persona Switcher Sheet | `lib/ui/components/persona_switcher_sheet.dart:25` | Account Hub header avatar | Switch Persona | Select Creator / Band Persona | "Add Artist Persona" | `authStateProvider`, `creatorContextProvider` | Authenticated | List of personas | Fan-to-Creator prohibited | Broken: Fan cannot switch; "Add Artist" button navigates to bounced `/onboarding` |

---

## 6. Dead Controls & Compromised Handlers Index (Guest / Fan)

1. **`auth_screen.dart:274, 503`:** "Explore as Guest" button calls `context.go('/explore')`, which does not exist in the route table (falls back to error or `/`).
2. **`tip_receipt_sheet.dart:74`:** "Download PDF Receipt" displays `ScaffoldMessenger.showSnackBar(SnackBar(content: Text('Downloading receipt... (Simulated)')))`. No PDF generation or download occurs.
3. **`cb_card_input_sheet.dart:115`:** "Save Card" generates a client-side fake ID `pm_${DateTime.now().millisecondsSinceEpoch}_1234` instead of using Stripe Elements / SetupIntent.
4. **`tip_confirmation_sheet.dart:145`:** Catches Stripe payment error and swallows it, displaying a simulated success dialog to the user.
5. **`fan_shell.dart:65`:** QR scanning button in the guest app bar does not preserve the scanned performer intent if authentication is cancelled.
6. **`persona_switcher_sheet.dart:88`:** "Add Artist Persona" button navigates to `/onboarding/persona`, which immediately redirects back to `/fan` because `cbAuthRedirect` unconditionally bounces authenticated users away from onboarding.
