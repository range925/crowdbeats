# Crowdbeats Mobile Redesign: Route & Action Matrix (Phase 2)

**Document Status:** Complete & Approved Specification  
**Owners:** Flutter Navigation Architect, UX Coordinator, QA Lead  
**Scope:** Exhaustive Screen-by-Screen Heading, Dominant Next CTA, Secondary Controls, Data Binding, Return Behavior, and Complete State Sets  

---

## 1. Matrix Specification Standards

For every screen and modal in the Crowdbeats mobile application:
* **Heading:** Short, contextual title (24–28 px).
* **Dominant Next CTA:** Exactly one primary action button per screen (min 48 px touch target, purple accent).
* **Secondary Controls:** Text buttons, ghost buttons, or iconography for auxiliary tasks.
* **Data Binding:** Riverpod provider, Cloud Firestore collection, or Cloud Functions callable.
* **Return Behavior:** Explicit hardware back, App Bar back button, or modal dismiss outcome.
* **State Set:** Loading, Empty, Denied, Offline, Validation Error, Retry, Success; plus financial states: Canceled, Pending, Failed, Duplicate-Submission Protection.

---

## 2. Launch, Authentication & Onboarding Routes

| Route Path | Screen / Modal | Heading | Dominant Next CTA | Secondary Controls | Data Binding | Return Behavior | Complete State Coverage |
|---|---|---|---|---|---|---|---|
| `/` (Auth check) | Splash Screen | Brand Logo | None (Auto-transition) | None | `authStateProvider` | Transitions to `/` or `/auth` | Loading, Error |
| `/auth` | Auth Screen | "Welcome to Crowdbeats" | "Sign In" / "Create Account" | "Continue with Google", "Continue with Apple", "Explore as Guest", "Forgot Password" | `AuthService`, `FirebaseAuth` | Bounces to target route (`?from=`) or `/` | Loading, Error, Validation Error, Offline |
| `/auth/forgot` | Forgot Password Sheet | "Reset Password" | "Send Reset Link" | "Back to Sign In" | `AuthService.sendPasswordResetEmail` | Dismisses sheet back to Auth Screen | Loading, Success, Error, Offline |
| `/onboarding` | Universal Onboarding Wizard (Step 1) | "Choose Your Handle" | "Continue" | "Skip" (auto-assigns handle) | `checkHandleAvailability` callable | Back exits app or prompts logout | Loading, Validation Error, Handle Taken, Offline |
| `/onboarding/persona`| Universal Onboarding Wizard (Step 2) | "How Will You Use Crowdbeats?" | "Continue" | "Back" | Local wizard state | Back to Step 1 | Selection Active |
| `/onboarding/profile`| Universal Onboarding Wizard (Step 3) | "Complete Your Profile" | "Get Started" | "Back", "Upload Later" (avatar) | `completeUniversalOnboarding` callable | Back to Step 2 | Loading, Success, Error, Retry, Offline |

---

## 3. Fan & Guest Discovery, Performer Profiles & QR

| Route Path | Screen / Modal | Heading | Dominant Next CTA | Secondary Controls | Data Binding | Return Behavior | Complete State Coverage |
|---|---|---|---|---|---|---|---|
| `/` (Tab 0) | Discover Screen | "Live Around You" | Performer Card Tap | View Toggle (Map / List), Radius Slider (500m - 25km), Genre Filters, QR Scanner Icon | `nearbyLivePerformersProvider`, `Geolocator` | System back exits app | Loading, Empty, Content, Location Denied, GPS Disabled, Offline, Retry |
| `/artist/:id` | Solo Artist Profile | Artist Stage Name | "Send Tip" | Follow / Following toggle, Share Performer, Message Artist, View Setlist, Upcoming Stages | `artistProfiles/{id}`, `liveSessions` query | Back to previous discovery position | Loading, Content, Offline, Performer Inactive, Error |
| `/band/:slug` | Band Public Profile | Band Name | "Tip Band" | Follow Band, Share, Member Roster, Setlist, Active Venue Tag | `bands/{id}` query | Back to previous discovery position | Loading, Content, Offline, Error |
| `/qr/scan` | QR Scanner Screen | "Scan Stage QR" | Automatic Scan Detection | Torch Toggle, "Enter Performer Code Manually", Close Button | `mobile_scanner`, `verifyQrToken` callable | Back returns to Discover tab | Scanning, Camera Denied, Camera Error, Invalid Token, Expired Token, Success |
| `/qr/manual` | Manual Code Sheet | "Enter Stage Code" | "Find Performer" | "Cancel" | `verifyQrToken` callable | Dismisses back to scanner | Loading, Error, Not Found, Success |

---

## 4. Tipping & Financial Transaction Screens

| Route Path | Screen / Modal | Heading | Dominant Next CTA | Secondary Controls | Data Binding | Return Behavior | Complete State Coverage |
|---|---|---|---|---|---|---|---|
| `/tip/:id` | Tip Amount Selection | "Tip {Artist Name}" | "Continue to Payment" | Preset Chips ($2, $5, $10, $20), Custom Amount Keypad, Add Cheer Note, Anonymous Tip Toggle | `artistProfiles/{id}`, local state | Back returns to Performer Profile | Content, Zero Amount Error, Max Limit Error |
| `/tip/:id/confirm` | Payment Confirmation | "Confirm Your Tip" | "Confirm & Pay (${Total})" | Change Payment Method, Split Tip with Band Toggle, Fee Breakdown Accordion | `createTipIntent` callable, `flutter_stripe` | Back returns to Amount Selection | Loading, Fee Quote Ready, Canceled, Pending, Failed, Dup-Protect, Auth Gate |
| `/tip/sent` | Tip Sent / Receipt Screen | "Tip Sent!" | "Done" | "Follow Artist", "Share Tip", "Download Receipt" | `paymentTransactions/{id}` | Returns to Performer Profile (or Discovery) | Success, Pending Webhook, Transaction Detail |

---

## 5. Fan Social, Activity & Messaging

| Route Path | Screen / Modal | Heading | Dominant Next CTA | Secondary Controls | Data Binding | Return Behavior | Complete State Coverage |
|---|---|---|---|---|---|---|---|
| `/following` (Tab 1)| Following Hub | "Following" | Performer Row Tap | Direct Messages Icon (with unread badge), Filter by Live Acts | `social_service.dart:listFollowing` | System back exits app | Loading, Empty, Content, Offline, Retry |
| `/activity` (Tab 2) | Activity Hub | "Your Activity" | Receipt Row Tap | Filter by Date, Supporter Badges carousel | `paymentTransactions` query | System back exits app | Loading, Empty, Content, Offline, Retry |
| `/social/conversations`| Conversations List | "Messages" | Open Conversation | "New Message" (search followed acts) | `getConversations` callable | Back returns to Following | Loading, Empty, Content, Offline |
| `/social/chat/:id` | Direct Chat Screen | Performer Name | "Send" (message input) | More Options (Report, Block, View Profile) | `sendMessage`, `getMessages` callables | Back returns to Conversations List | Loading, Content, Sending, Offline, Send Failed, Blocked |

---

## 6. Creator Studio, Live Performance & Band Management

| Route Path | Screen / Modal | Heading | Dominant Next CTA | Secondary Controls | Data Binding | Return Behavior | Complete State Coverage |
|---|---|---|---|---|---|---|---|
| `/creator` (Tab 0) | Creator Studio Hub | "Creator Studio" | "Go Live" Hero Banner | Context Switcher Pill (Solo <-> Band), 12 Capability Tiles, Metric Cards, Announcements | `creatorStudioSummaryProvider`, `creatorContextProvider` | System back exits app | Content, Loading Skeletons, Offline, Refresh Error |
| `/creator/live` (Tab 1)| Go Live Operational Cockpit | "Live Cockpit" | "Start Live Session" / "End Session" | Proximity Stage Selector, Broadcast GPS Toggle, "Display QR Code" | `liveSessionStateProvider`, `session_service.dart` | Back returns to Studio | Idle, Active Session, GPS Inaccurate, Permission Denied, Ending |
| `/creator/live/qr` | Persistent QR Modal | "Scan to Tip" | "Full Screen Brightness" | Save to Photos, Share Link, Dismiss | `generateQrToken` callable | Dismiss returns to Live Cockpit | QR Display, Token Expired, Generation Error |
| `/creator/live/summary`| Session Summary Sheet| "Performance Ended" | "Done" | "View Full Analytics", "Share Milestones" | `liveSessions/{id}` | Returns to Studio Hub | Summary Numbers, Loading, Error |
| `/creator/band` | Band Management Hub | "Band Management" | "Invite Band Member" | "Configure Splits", Member List Rows, Role Badges | `bands/{bandId}`, `band_service.dart` | Back returns to Studio Hub | Loading, Content, Offline, Unauthorized |
| `/creator/band/invite`| Invite Member Sheet | "Invite Band Member"| "Send Invitation" | Email Input, Role Dropdown (Admin/Member), Split % Input, Cancel | `inviteBandMember` callable | Dismiss returns to Band Hub | Form Validating, Sending, Success, Error |
| `/creator/band/splits`| Split Config Sheet | "Band Revenue Splits"| "Save Split Rules" | Percentage Sliders, "Reset to Equal", Split Total Indicator (100% check) | `setBandSplitConfig` callable | Back returns to Band Hub | Sliders Active, Invalid Total Error (Sum != 100%), Locked while Live, Saving |
| `/creator/finance` (Tab 3)| Creator Finance & Treasury| "Earnings & Payouts"| "Request Payout" | Connect Stripe CTA, Available vs Pending Balance, Transaction Ledger | `artistProfiles/{id}`, `payouts` query, `getBandTreasury` | System back exits app | Balance Content, Stripe Disconnected, Loading, Offline |
| `/creator/finance/payout`| Payout Request Sheet | "Request Payout" | "Confirm Transfer" | Amount Input, Payout Destination (Verified Bank), Fee & Schedule Summary | `requestPayout` callable | Dismiss returns to Finance | Form Validating, Processing, Success, Insufficient Funds, Blocked |
| `/creator/finance/connect`| Stripe Connect Launcher| "Stripe Verification"| "Open Stripe Dashboard" | Refresh Status, Help Link | `createConnectLink`, `getConnectStatus` callables | Returns to Finance | Launching, Verifying, Verified, Action Required |

---

## 7. Account & Settings Hierarchy Screens

| Route Path | Screen / Modal | Heading | Dominant Next CTA | Secondary Controls | Data Binding | Return Behavior | Complete State Coverage |
|---|---|---|---|---|---|---|---|
| `/account` (Tab 3) | Account Hub | "Account" | Edit Profile Row | Persona Switcher, 8 Grouped Settings Rows, Sign Out Button | `userSettingsProvider`, `AuthService` | System back exits app | Content, Unsaved State, Offline |
| `/account/guest` | Guest Account Screen | "Your Profile" | "Sign In or Sign Up" | About Crowdbeats, Legal Links, Help Center | Static | System back exits app | Content |
| `/settings/profile` | Edit Profile Screen | "Edit Profile" | "Save Changes" | Change Avatar, Bio Counter, Social Handles, Discard | `users/{uid}`, `storage_service` | Back to Account (Prompt if dirty) | Loading, Success, Error, Form Invalid |
| `/settings/security`| Security & Sessions | "Security" | "Revoke Other Sessions" | Biometric Toggle, 2FA Switch, Device Session List | `userSettingsProvider.security` | Back to Account | Content, Revoking, Revoke Error |
| `/settings/payments`| Payment Methods | "Payment Methods" | "Add Payment Method" | Set Default Card, Delete Card | `listPaymentMethods` callable, Stripe SDK | Back to Account | Loading, Empty, Card List, Deleting |
| `/settings/privacy` | Privacy & Safety | "Privacy & Safety" | Save (Auto-saved) | Location Precision Selector, Discoverable in Radar Toggle, Blocked Users Link | `userSettingsProvider.privacy` | Back to Account | Content, Toggling, Sync Error |
| `/settings/notifications`| Notifications | "Notifications" | Save (Auto-saved) | Live Alerts, Fan Messages, Tip Receipts, Push & Email Toggles | `userSettingsProvider.notifications` | Back to Account | Content, Toggling |
| `/settings/appearance`| Appearance & Theme | "Appearance" | Select Theme Option | System / Light / Dark / OLED Black Radio Options | `SharedPreferences`, `userSettingsProvider` | Back to Account | Instant Theme Update |
| `/settings/accessibility`| Accessibility | "Accessibility" | Save (Auto-saved) | Font Scale Slider (1.0x - 2.0x), High Contrast Toggle, Reduce Motion Toggle | `userSettingsProvider.accessibility` | Back to Account | Dynamic Preview |
| `/legal/fees` | Platform Fee Disclosure| "Platform Fees" | "Understood" | Breakdown: 6% Platform Fee + Stripe Processing Fees | Static Markdown | Back to Settings | Content |
| `/settings/close-account`| Account Closure | "Close Account" | "Permanently Delete" | "Deactivate Account Temporarily", Cancel | `requestAccountDeletion` callable | Bounces to `/auth` on deletion | Confirmation Dialog, Deleting, Error |
