# Crowdbeats V2 — Architecture & Dependency Map

**Document Version:** 1.0.0  
**Phase:** 1 (Baseline & Discovery)  
**Author:** Lead Flutter Engineering Coordinator  
**Date:** 2026-10-12  
**Target Repository:** `apps/mobile` (Flutter 3.47.1 / Dart 3.13.1)  

---

## 1. Platform Scope & Target Build Capabilities

The `apps/mobile` codebase contains configurations for **Android**, **iOS**, and **Web**. Desktop platform directories (`windows/`, `macos/`, `linux/`) are **not present** in the mobile app repository.

### 1.1 Android Target Configuration
- **Application ID / Namespace:** `com.crowdbeats.crowdbeats_mobile` (`apps/mobile/android/app/build.gradle.kts:8, 19`).
- **Compile SDK:** `flutter.compileSdkVersion` (`build.gradle.kts:9`).
- **Min SDK:** `flutter.minSdkVersion` (`build.gradle.kts:22`).
- **Target SDK:** `flutter.targetSdkVersion` (`build.gradle.kts:23`).
- **Java / Kotlin Target:** Java 17, Kotlin JVM 17 (`build.gradle.kts:13-14, 43`).
- **Google Maps API Key:** Embedded in `AndroidManifest.xml:27-28` (`com.google.android.geo.API_KEY` = `AIzaSyDjo5fWusi26pzpLZVRL4YdFWahtn0zGsI`).
- **Declared Android Permissions (`AndroidManifest.xml:2-10`):**
  - `ACCESS_COARSE_LOCATION` & `ACCESS_FINE_LOCATION` (one-shot location discovery)
  - `ACCESS_BACKGROUND_LOCATION` (opt-in continuous mobile stage tracking)
  - `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_LOCATION` (Android 14 API 34 compliance for live mobile sessions)
  - `POST_NOTIFICATIONS` (Android 13 API 33 persistent foreground notification)
  - Service: `com.baseflow.geolocator.GeolocatorLocationService` (`enabled: true`, `exported: false`, `foregroundServiceType="location"`)
- **`google-services.json`:** **Not committed** in repository (resolved locally or via mock environment; pending David's OD-03/OD-05 decisions).

### 1.2 iOS Target Configuration
- **Bundle Identifier:** `com.crowdbeats.crowdbeatsMobile` (`apps/mobile/ios/Runner.xcodeproj/project.pbxproj:386`).
- **Deployment Target:** iOS 15.0 (`project.pbxproj:363, 490, 542`).
- **Declared Usage Descriptions (`Info.plist:69-76`):**
  - `NSLocationWhenInUseUsageDescription`: *"Crowdbeats uses your location to discover nearby live performances, find venues, and verify venue check-ins."*
  - `NSLocationAlwaysAndWhenInUseUsageDescription`: *"Crowdbeats uses background location during mobile live performances so fans can follow your stage location in real time."*
  - `NSLocationTemporaryUsageDescriptionDictionary` -> `VenueProximityVerificationKey`.
- **Identified iOS Omission:** `NSCameraUsageDescription` is **missing** from `Info.plist`, even though `mobile_scanner` and `CameraCaptureScreen` are active. Must be added before running native camera features on physical iOS hardware.
- **`GoogleService-Info.plist`:** **Not committed** in repository (pending OD-04/OD-05).

### 1.3 Web Target Configuration (Flutter Web)
- **Web Root:** `apps/mobile/web/index.html` (registers service worker, PWA manifest, and Google Maps script tag).
- **Preview Runners:** `serve_web.js` (port 8081) and `serve_preview.js` (port 8085).
- **URL Routing Strategy:** `GoRouter` defaults to path-based routing. On `kIsWeb`, `main.dart:206` sets `initialLocation: '/preview'`.

---

## 2. Responsive Web Determination

### Verdict: Production Responsive Web is NEXT.JS, NOT Flutter Web

1. **Production Deployment Binding:**
   - In root `firebase.json:9-10`, the primary hosting site specifies:
     ```json
     "hosting": {
       "public": "apps/web/dist",
       "cleanUrls": true,
       ...
     }
     ```
   - In root `package.json:28`, `npm run deploy:prod` executes:
     `npm run web:build:prod && node scripts/sync_dist.js && npx firebase-tools deploy --only hosting --project crowdbeats-01`
   - This compiles the **Next.js App Router** application in `apps/web/`, synchronizes static HTML + Server Components to `apps/web/dist`, and deploys to Firebase Hosting.
2. **Role of Flutter Web (`apps/mobile/web`):**
   - Flutter web is an internal development emulator / component gallery preview tool (`FanMobilePreviewHub` at `/preview` and `GalleryPage` at `/gallery`).
   - It is **not** deployed to public users or marketing traffic.
3. **Redesign Boundary Guarantee:**
   - The Flutter mobile redesign (`apps/mobile`) does **not** alter the production Next.js application (`apps/web`).
   - Changes to shared packages (`packages/design-tokens`, `packages/contracts`) require validation against `npm run typecheck` across web and functions.

---

## 3. Authoritative Package Versions

All versions resolved directly from `apps/mobile/pubspec.lock` and `package.json`:

### 3.1 Flutter Direct Dependencies (`apps/mobile/pubspec.lock`)
| Package Name | Resolved Version | Role in Architecture |
|---|---|---|
| `flutter` | `3.47.1` (channel stable) | UI Framework |
| `dart` | `3.13.1` (DevTools 2.60.0) | Programming Language |
| `flutter_riverpod` | `2.6.1` | State management (StateNotifier, Provider, AsyncNotifier) |
| `go_router` | `18.0.0` | Declarative routing & auth redirect |
| `firebase_core` | `4.14.0` | Firebase app initialization |
| `firebase_auth` | `6.6.0` | Auth listener, email/password, OAuth |
| `cloud_firestore` | `6.9.0` | Real-time database listeners & collection queries |
| `cloud_functions` | `6.4.0` | HTTPS Callable functions client |
| `firebase_messaging` | `16.6.0` | Push notifications client |
| `flutter_stripe` | `14.0.0` | Stripe PaymentSheet & card confirmation |
| `google_maps_flutter`| `2.18.0` | Google Maps native rendering & markers |
| `geolocator` | `14.0.3` | GPS coordinate acquisition & background service |
| `permission_handler` | `13.0.1` | OS permission requests & settings redirection |
| `mobile_scanner` | `7.4.0` | Camera QR code scanning |
| `google_fonts` | `6.3.3` | Dynamic font asset loader (Plus Jakarta Sans, DM Sans) |
| `cached_network_image`| `3.4.1` | Asynchronous image caching for performer avatars |
| `qr_flutter` | `4.1.0` | Vector QR code rendering for performer stages |
| `fl_chart` | `1.2.0` | Creator financial & attendance analytics charts |
| `flutter_svg` | `2.3.0` | Vector asset rendering |
| `shared_preferences` | `2.5.5` | Key-value local storage (theme mode, tipping cache) |
| `uuid` | `4.6.0` | UUID v4 client idempotency key generation |
| `share_plus` | `13.3.0` | Native OS share sheet integration |

### 3.2 Web & Functions Ecosystem Versions
- **`apps/web`:** Next.js `16.3.3`, React `19.2.8`, `@stripe/stripe-js` `9.14.0`, `firebase` `12.18.0`.
- **`apps/functions`:** Node.js `22`, `firebase-functions` `7.4.0`, `firebase-admin` `13.10.0`, `stripe` `17.7.0`.

---

## 4. End-to-End Journey Dependency Graph

```mermaid
flowchart TD
  subgraph "Launch & Auth Journey"
    A1["SplashScreen (/splash)"] --> P1["authStateProvider"]
    A2["AuthScreen (/auth)"] --> S1["AuthService"]
    S1 --> FB1["Firebase Auth"]
    A3["cbAuthRedirect"] --> P1
  end

  subgraph "Discovery & Location Journey"
    D1["Discover Screen (/discover)"] --> P2["discoveryProvider"]
    D1 --> P3["locationProviderProvider"]
    P3 --> S2["LocationProvider (Fused / CoreLocation)"]
    P2 --> S3["CameraNearbyService"]
    P2 --> CF1["getPublicDiscoveryFeed (Cloud Function)"]
    CF1 --> FS1[("Firestore: sessions, stages, bands")]
  end

  subgraph "Tipping & Payment Journey"
    T1["Amount Screen (/tip/:id)"] --> P4["tipFlowProvider"]
    T2["Payment Confirmation Sheet"] --> P4
    P4 --> S4["StripeFeeService"]
    P4 --> S5["TipService"]
    S5 --> CF2["createTipIntent (Cloud Function)"]
    CF2 --> STRIPE["Stripe PaymentIntents API"]
    T2 --> SDK_STRIPE["flutter_stripe (PaymentSheet)"]
  end

  subgraph "Creator Studio & Go Live Journey"
    C1["Studio Hub (/studio)"] --> P5["creatorContextProvider"]
    C2["Go Live Sheet (/studio/go-live)"] --> S6["SessionService"]
    S6 --> CF3["startSession (Cloud Function)"]
    CF3 --> FS2[("Firestore: sessions/{id}")]
    C3["Creator Balances (/studio/finance)"] --> S7["FirestoreService"]
    S7 --> CF4["requestPayout (Cloud Function)"]
    CF4 --> STRIPE_CONN["Stripe Connect Transfers"]
  end
```

---

## 5. Shared-Change Blast Radius & Risk Matrix

Modifying core infrastructure elements carries distinct regression blast radii across the app:

| Core File / Component | Direct Importers in `lib/` | Critical Consumers | Regression Risk |
|---|---|---|---|
| `lib/main.dart` (Router & Redirect) | 4 | Entire navigation stack, all 59 routes, deep links | **CRITICAL** |
| `lib/ui/theme/cb_colors.dart` | 84 | All UI screens, components, widgets | **CRITICAL** |
| `lib/ui/theme/cb_theme.dart` | 14 | App bootstrap, test wrappers, preview hubs | **HIGH** |
| `lib/ui/components/cb_components.dart` | 18 | Buttons, cards, scaffolds, chips | **HIGH** |
| `lib/ui/components/cb_glass_card.dart` | 29 | Discovery cards, studio hub tiles, modal sheets | **HIGH** |
| `lib/state/auth_state.dart` | 42 | Route guards, profile headers, settings, tipping gates | **CRITICAL** |
| `lib/state/creator_context_state.dart` | 22 | Studio shell, dashboards, live checks, analytics | **HIGH** |
| `lib/state/discovery_state.dart` | 16 | Discover map, search, filter sheet, guest home | **HIGH** |
| `lib/state/tip_state.dart` | 12 | Amount selection, confirmation, receipts, history | **HIGH** |

### Hardcoded Color Literals Breakdown (Theme Modernization Targets)
Across `apps/mobile/lib/ui/`, hardcoded colors currently prevent proper neutral light mode rendering:
- `apps/mobile/lib/ui/fan/`: 284 `Color(0x...)` literals, 312 `Colors.white`
- `apps/mobile/lib/ui/creator/`: 342 `Color(0x...)` literals, 396 `Colors.white`
- `apps/mobile/lib/ui/band/`: 118 `Color(0x...)` literals, 140 `Colors.white`
- `apps/mobile/lib/ui/settings/`: 186 `Color(0x...)` literals, 214 `Colors.white`
- `apps/mobile/lib/ui/components/`: 144 `Color(0x...)` literals, 126 `Colors.white`
- `apps/mobile/lib/ui/auth/`: 62 `Color(0x...)` literals, 54 `Colors.white`
- `apps/mobile/lib/ui/onboarding/`: 41 `Color(0x...)` literals, 45 `Colors.white`
**Total:** ~1,177 raw hex color literals and ~1,287 `Colors.white` instances to be migrated systematically to `CbTheme.of(context)` tokens during screen redesigns.

---

## 6. Auth Listeners & Lifecycle Analysis

1. **Auth Stream & Router Re-evaluation:**
   - In `lib/state/auth_state.dart:305-309`, `_authStreamProvider` listens to `FirebaseAuth.instance.authStateChanges()`.
   - `authNotifierProvider` subscribes to this stream and maps Firebase user state into `CbAuthState`.
   - In `lib/main.dart:202-205`, `_GoRouterRefreshNotifier` listens to `authStateProvider` and triggers `router.refresh()` on state changes.
2. **Token Revocation Probe:**
   - In `lib/state/auth_state.dart:101-134`, a periodic timer runs every **10 minutes** calling `user.getIdTokenResult(true)` to detect revoked or expired sessions.
   - On revocation, it transitions `status` to `CbAuthStatus.revoked` or `expired`.
3. **Session Heartbeat & Reconnection:**
   - In `lib/state/session_heartbeat_notifier.dart:24, 154`, when an artist or band goes live, an active timer pings `heartbeatSession` every **30 seconds**.
   - If 3 consecutive heartbeats fail, `SessionReconciliationService` enters recovery mode (`CreatorRecoveryCard`).
4. **Location Stream Lifecycle:**
   - `LocationProvider` implements explicit `startContinuousTracking()` and `stopContinuousTracking()`.
   - In `lib/state/discovery_state.dart:167-177`, `pauseForBackground()` and `resumeFromBackground()` ensure location listeners are deactivated when the app enters the background during standard fan discovery, safeguarding battery life.

---

## 7. Recommended Ownership & Integration Governance

To prevent concurrent file collision and maintain clean architecture invariants:
- **Coordinator:** Owns `main.dart`, theme tokens, shared component primitives, state data models, and final merge integration.
- **Feature Specialists:** Own disjoint UI screen trees as assigned in `task-record.md §11`.
- **Contracts Integrity:** Any modification to `packages/contracts` must be accompanied by `npm run typecheck` across all JS/TS workspaces before Flutter consumption.
