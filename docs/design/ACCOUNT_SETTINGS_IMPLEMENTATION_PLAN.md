# Crowdbeats V2 — Account Settings Implementation Plan

**Goal:** Completely redesign and implement the Crowdbeats Account Settings hub across Flutter Mobile and Next.js Web with full role awareness, Stitch visual fidelity, robust backend integration, and zero dead routes.

---

## 1. Work Breakdown Structure

### Phase 1 — Core Contracts & Backend Support
1. **Contracts Package (`packages/contracts`):**
   - Define `UserSettings`, `NotificationPreferences`, `PrivacyPreferences`, `AccountDeletionRequest`, and `AccountDeletionResponse` in `packages/contracts/src/settings/userSettings.ts`.
   - Export in `packages/contracts/src/index.ts`.
2. **Cloud Functions (`apps/functions`):**
   - Add `requestAccountDeletion` callable in `apps/functions/src/auth/requestAccountDeletion.ts` with band founder and escrow safety checks.
   - Add `updateNotificationPreferences` and `updatePrivacyPreferences` helpers in `apps/functions/src/settings/`.
   - Export in `apps/functions/src/index.ts`.

### Phase 2 — Flutter Mobile Implementation (`apps/mobile`)
1. **Services & State:**
   - Extend `FirestoreService` with `getUserSettings()`, `updateUserSettings()`, `getBlockedUsers()`, `unblockUser()`.
   - Create `UserSettingsNotifier` and `userSettingsProvider` in `apps/mobile/lib/state/user_settings_state.dart`.
2. **UI Architecture & Components:**
   - Create `CbSettingsRow` and `CbSettingsSection` reusable components in `apps/mobile/lib/ui/components/cb_settings_row.dart`.
   - Create dedicated sub-screens in `apps/mobile/lib/ui/settings/`:
     - `account_hub_screen.dart`: Main role-aware settings hub.
     - `personal_info_screen.dart`: Name, email, phone, bio editor.
     - `payment_methods_screen.dart`: Saved cards, default PM selection, add card modal.
     - `tipping_preferences_screen.dart`: Preset amounts ($2, $5, $10, $20), currency, anonymity.
     - `notifications_settings_screen.dart`: Granular category toggles.
     - `privacy_location_screen.dart`: GPS precision, discoverability, telemetry consent.
     - `security_sessions_screen.dart`: Password change, biometric toggle, active sessions.
     - `blocked_accounts_screen.dart`: Blocked users list with 1-tap unblock.
     - `support_center_screen.dart`: FAQs, report concern, contact support.
     - `legal_disclosures_screen.dart`: Policy links & data export.
     - `account_deletion_screen.dart`: Multi-step deletion with safety verification.
3. **Routing Integration:**
   - Update `GoRouter` in `apps/mobile/lib/main.dart` with all `/account/*` routes.
   - Connect Profile tab in `fan_shell.dart`, `musician_shell.dart`, and `band_shell.dart` to the new `/account` hub.

### Phase 3 — Next.js Web Implementation (`apps/web`)
1. **Web Services & Hooks:**
   - Create `useUserSettings` hook in `apps/web/lib/hooks/useUserSettings.ts`.
2. **Web Settings Hub & Sub-Pages:**
   - Redesign `apps/web/app/account/page.tsx` with responsive layout matching Stitch design system.
   - Sub-sections / modals for Personal Info, Payment Methods, Notifications, Privacy, Security, Blocked, Legal & Data, and Account Deletion.

### Phase 4 — Testing & Verification
1. **Cloud Functions Unit Tests:**
   - Test `requestAccountDeletion` callable (validates unauthenticated rejection, band founder block, soft-delete execution).
2. **Flutter Static Analysis & Unit/Widget Tests:**
   - Run `flutter analyze` ensuring 0 issues.
   - Add widget tests for role visibility and settings interactions.
3. **TypeScript Validation:**
   - Run `npx tsc --noEmit` in `packages/contracts`, `apps/functions`, and `apps/web`.
4. **Live Visual Preview Verification:**
   - Verify on `http://localhost:3000/mobile-preview` and `http://localhost:8081`.
