# Camera-Triggered Nearby Performer Tipping — Engineering Handoff & Architecture Guide

**Version:** 1.0.0  
**Target Release:** Crowdbeats V2  
**Branch:** `feat/camera-triggered-nearby-tipping`  
**Authors:** Lead Flutter & Backend Engineering Team  

---

## 1. Feature Architecture Overview

Camera-triggered nearby performer tipping provides fans and guests with a spontaneous, location-aware tipping entry point from directly within the Crowdbeats in-app camera.

```
                          ┌────────────────────────┐
                          │   Flutter In-App UI    │
                          │ (CameraCaptureScreen)  │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
   │ CameraLifecycle │       │ LocationProvider│       │ CameraMatching  │
   │  Photo & Video  │       │  CachedFix GPS  │       │    Notifier     │
   │ Unwatermarked   │       │  Accuracy check │       │  15s Throttling │
   └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
            │                         │                         │
            │                         ▼                         │
            │             ┌───────────────────────┐             │
            │             │  CameraNearbyService  │◄────────────┘
            │             │(getNearbyLivePerformers)
            │             └───────────┬───────────┘
            │                         │
            │                         ▼
            │             ┌───────────────────────┐
            │             │ Firebase Cloud Function│
            │             │   100m Geohash Search │
            │             │  Blocked & Band Filter│
            │             └───────────┬───────────┘
            │                         │
            ▼                         ▼
   ┌─────────────────┐       ┌─────────────────┐
   │ Media Finalized │       │ Nearby Candidate│
   │ (Pristine File) │       │ Single Act / Mlt│
   └────────┬────────┘       └────────┬────────┘
            │                         │
            ▼                         ▼
   ┌───────────────────────────────────────────┐
   │ If Video Recording: QueuedCameraTipIntent │
   │ Else: Immediate Banner / Chooser Sheet    │
   └─────────────────────┬─────────────────────┘
                         │
                         ▼
   ┌───────────────────────────────────────────┐
   │       Stripe Checkout / Tip Flow          │
   │     $5 Default (6% Fee Breakdown)         │
   │     Guest Auth Continuation Support       │
   └───────────────────────────────────────────┘
```

---

## 2. Key Modules & File Ownership

### 2.1 Shared Contracts (`packages/contracts`)
- **[packages/contracts/src/camera/index.ts](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/packages/contracts/src/camera/index.ts)**:
  - `NearbyLivePerformerQuery`: `{ latitude, longitude, accuracyMeters, limit? }`
  - `NearbyLivePerformerCandidate`: `{ performerId, name, avatarUrl, actType, distanceMeters, sessionId, genres, stageName }`
  - `GetNearbyLivePerformersRequest`: payload format.
  - `GetNearbyLivePerformersResponse`: `{ candidates, requiresChooser, queryTimestamp }`.

### 2.2 Backend Cloud Functions (`apps/functions`)
- **[apps/functions/src/session/nearbyPerformerCallables.ts](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/functions/src/session/nearbyPerformerCallables.ts)**:
  - Callable: `getNearbyLivePerformers`.
  - Geohash-bounded bounding box with high-precision Haversine distance verification ($\le 100\text{m}$).
  - `requiresChooser`: Set to `true` if `accuracyMeters > 50` OR candidates $\ge 2$.
  - Social safety exclusion: Filters out performers blocked by the caller or who have blocked the caller.
  - Band resolution: Resolves band member check-ins to the collective Band destination account.
- **[apps/functions/src/lib/rateLimiter.ts](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/functions/src/lib/rateLimiter.ts)**:
  - Enforces `camera_nearby_query` bucket: 20 requests per 60 seconds per user / IP.

### 2.3 Mobile Client (`apps/mobile`)
- **[apps/mobile/lib/data/models/camera_tipping.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/data/models/camera_tipping.dart)**:
  - Client domain models: `NearbyPerformerCandidate`, `QueuedCameraTipIntent`, `CameraNearbyMatchState`.
- **[apps/mobile/lib/data/services/camera_nearby_service.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/data/services/camera_nearby_service.dart)**:
  - Client callable invoker + `FakeCameraNearbyService` for unit testing and offline preview.
- **[apps/mobile/lib/state/camera_matching_state.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/state/camera_matching_state.dart)**:
  - `CameraMatchingNotifier`: Coordinates location subscription, 15-second debounce, 25-meter delta-movement trigger, 30-minute dismiss cooldown, and recording intent queuing.
- **[apps/mobile/lib/ui/camera/nearby_performer_banner.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/camera/nearby_performer_banner.dart)**:
  - Stitch floating banner: `"Live nearby: [Act Name] · Tip $5"`.
  - Recording mode pill: Compact unobtrusive chip during video recording.
  - WCAG-compliant $\ge 48\text{dp}$ touch targets, high-contrast borders, VoiceOver/TalkBack semantics.
- **[apps/mobile/lib/ui/camera/nearby_performer_chooser_sheet.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/camera/nearby_performer_chooser_sheet.dart)**:
  - Bottom sheet modal displaying candidate acts sorted by proximity with genre tags, badges (`Solo` / `Band`), and distance formatting.
- **[apps/mobile/lib/ui/camera/camera_capture_screen.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/camera/camera_capture_screen.dart)**:
  - Full-screen capture view with photo and video modes.
  - Lifecycle state management (AppLifecycleListener, resource disposal and reacquisition).
  - Media preservation: saves unwatermarked media to application documents/temp directory.
  - Queued tip resolution upon video recording stop.
- **Entry Points:**
  - **[apps/mobile/lib/ui/fan/tabs/nearby_tab.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/fan/tabs/nearby_tab.dart)**: Floating action button `"Capture the music"`.
  - **[apps/mobile/lib/ui/fan/public_profile_screen.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/fan/public_profile_screen.dart)**: Outlined button `"Capture the music & tip nearby"`.
  - **[apps/mobile/lib/ui/fan/tabs/tip_tab.dart](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/fan/tabs/tip_tab.dart)**: QR Scan & Camera action card navigation.

---

## 3. Core User Journeys

### Journey A: Single Solo Artist with High GPS Accuracy (<50m)
1. User taps "Capture the music" in Discover or Tip Tab.
2. `CameraCaptureScreen` opens and acquires GPS location (`accuracyMeters: 18.0`).
3. `CameraNearbyMatchingCoordinator` queries backend and receives single candidate `"Maya"` (42m away).
4. Direct in-app banner floats at top: `"Live nearby: Maya · Tip $5"`.
5. User taps `"Tip $5"`.
6. `TipFlowScreen` opens pre-populated with $5.00 default amount, showing 6% fee deduction and Maya's Stripe account.
7. User confirms and completes payment.

### Journey B: Multiple Bands or Coarse Accuracy (>50m)
1. User enters camera with GPS accuracy `65.0m` or at a festival stage with two check-ins within 100m.
2. Backend responds with `requiresChooser: true`.
3. Chooser bottom sheet opens: `"Select Performer Nearby"`.
4. User selects `"The Electric Waves (Band)"` (35m away).
5. App opens tip checkout directly to the band's collective account.

### Journey C: Video Recording Queued Tip Intent
1. User starts recording a live performance video.
2. A nearby performer is detected; banner displays as a small, quiet, non-obtrusive status pill: `"Maya · Tap to tip"`.
3. User taps the pill during recording.
4. UI shows brief check confirmation (`"Tip queued - completes after recording"`). Video recording continues uninterrupted with 0 dropped frames and zero audio glitch.
5. User taps stop recording.
6. Video file is safely flushed and finalized to local disk without any overlays or watermarks.
7. App automatically opens `TipFlowScreen` for Maya.

### Journey D: Unauthenticated Guest Tipping & Auth Continuation
1. A guest user (not logged in) opens the camera and selects a nearby performer.
2. When proceeding to checkout, guest is presented with sign-in/sign-up.
3. App captures `PendingTipContext`:
   ```dart
   PendingTipContext(
     performerId: candidate.performerId,
     performerName: candidate.name,
     sessionId: candidate.sessionId,
     amountCents: 500,
     sourceScreen: 'camera_nearby',
     draftMediaPath: savedMediaPath,
   )
   ```
4. After authenticating, app reads `pendingTipContext`, restores state, and finishes tip confirmation.

---

## 4. Operational & Deployment Notes

1. **Firebase Security Rules:**
   - Callable functions use Firebase Admin SDK to read active sessions and profiles with server-authoritative validation.
2. **Rate Limiting:**
   - Monitored via `camera_nearby_query` bucket in `rateLimiter.ts`. Set to 20 req/60s per user.
3. **Flutter Dependencies:**
   - Requires `mobile_scanner` or `camera` package for hardware feed. Tested with camera mock interface to guarantee zero runtime failures across test runners.

---

## 5. Verification Commands
```bash
# Verify Contracts
cd packages/contracts && npm run build

# Verify Backend Cloud Functions
cd apps/functions && npm test -- --testPathPattern=cameraNearbyTipping

# Verify Flutter Mobile Client
cd apps/mobile && flutter test test/camera_nearby_tipping_test.dart
```
