# Stitch to Flutter Implementation Mapping — Crowdbeats V2

**Design Authority:** Google Stitch Project `5326179813018056505`  
**Target Codebase:** `apps/mobile/lib/` (Flutter Mobile Application)

---

## 1. Screen Mapping Matrix

| Stitch Screen # | Stitch Screen Title | Target Flutter File Path | Target Flutter Widget Class | Action Required |
| :-: | :--- | :--- | :--- | :--- |
| **01** | Direct Tipping Flow | `apps/mobile/lib/ui/fan/tip/tip_flow_screen.dart` | `TipFlowScreen` | `REFACTOR & REDESIGN` |
| **02** | Fan Onboarding Step 1 (Basic Info) | `apps/mobile/lib/ui/fan/onboarding/fan_onboarding_step1_screen.dart` | `FanOnboardingStep1Screen` | `NEW / REPLACE` |
| **03** | AR Camera Performer Detection | `apps/mobile/lib/ui/fan/tip/vision_tip_screen.dart` | `VisionTipScreen` | `NEW / REPLACE` |
| **04** | Fan Onboarding Step 3 (Details) | `apps/mobile/lib/ui/fan/onboarding/fan_onboarding_step3_screen.dart` | `FanOnboardingStep3Screen` | `NEW / REPLACE` |
| **05** | Fan Onboarding Step 4 (Welcome) | `apps/mobile/lib/ui/fan/onboarding/fan_onboarding_complete_screen.dart`| `FanOnboardingCompleteScreen` | `NEW / REPLACE` |
| **06** | Fan Onboarding Step 4 (Review) | `apps/mobile/lib/ui/fan/onboarding/fan_onboarding_review_screen.dart` | `FanOnboardingReviewScreen` | `NEW / REPLACE` |
| **07** | Fan Onboarding Step 2 (Preferences) | `apps/mobile/lib/ui/fan/onboarding/fan_onboarding_step2_screen.dart` | `FanOnboardingStep2Screen` | `NEW / REPLACE` |
| **08** | Nearby Live Music Map (Standard) | `apps/mobile/lib/ui/fan/tabs/nearby_tab.dart` | `NearbyTab` | `REFACTOR & REDESIGN` |
| **09** | Fan Activity & Notifications | `apps/mobile/lib/ui/fan/tabs/activity_tab.dart` | `ActivityTab` | `REFACTOR & REDESIGN` |
| **10** | Fan Home Dashboard | `apps/mobile/lib/ui/fan/tabs/home_tab.dart` | `HomeTab` | `REFACTOR & REDESIGN` |
| **11** | Enhanced Map (Radar View) | `apps/mobile/lib/ui/fan/nearby/enhanced_map_view.dart` | `EnhancedMapView` | `NEW` |
| **12** | Enhanced AR Viewfinder | `apps/mobile/lib/ui/fan/tip/ar_reticle_overlay.dart` | `ArReticleOverlay` | `NEW` |
| **Shell**| Main Navigation Scaffold | `apps/mobile/lib/ui/fan/fan_shell.dart` | `FanShell` | `REFACTOR & REDESIGN` |

---

## 2. Reusable Flutter Component Architecture (`apps/mobile/lib/ui/components/`)

1. **`cb_theme.dart`:**
   - Central definition of `CbColors`, `CbTypography`, `CbSpacing`, `CbRadii`, and `CbShadows`.
   - Replaces all legacy hardcoded colors with strict Stitch design tokens.

2. **`cb_pill_button.dart`:**
   - Stateless widget rendering full-width gradient pill button with loading spinner state and shadow glow.

3. **`cb_tip_preset_card.dart`:**
   - Animated amount selector tile (`$5`, `$10`, `$20`, `Custom`) supporting active border glow and heart icon state.

4. **`cb_performer_spotlight_card.dart`:**
   - Highly polished stage photo card with live emerald badge, venue info, distance, and direct tipping handler.

5. **`cb_linear_step_indicator.dart`:**
   - 4-step progress header with smooth animated progress and step checkmarks.

6. **`cb_floating_bottom_nav.dart`:**
   - Glassmorphic bottom bar using `BackdropFilter` with centered elevated floating "Tip" action button.

7. **`cb_activity_tile.dart`:**
   - Chronological event row with icon badges, performer avatars, and green transaction amounts.

8. **`cb_form_field.dart`:**
   - Dark theme input field with leading icon, validation checkmark, and character counter.

---

## 3. Flutter State & Backend Binding

- **Authentication & User Profile:** Bound to `AuthState` and Firestore `/users/{uid}`.
- **Tipping Execution:** Bound to Cloud Function `createTipIntent` and Stripe Payment Sheet.
- **Nearby Musicians Map:** Bound to Firestore `/sessions` (active live stages) and device GPS stream (`geolocator`).
- **Activity Feed:** Bound to Firestore real-time listener on `/users/{uid}/notifications` and `/tips` where fan is sender.
