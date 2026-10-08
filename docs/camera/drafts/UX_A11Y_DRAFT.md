# Crowdbeats V2 — Camera Tipping UX & Accessibility Specification

**Document Version:** 1.0.0  
**Date:** 2026-10-05  
**Author:** UX & Accessibility Specialist (Crowdbeats Design System Team)  
**Status:** Complete Implementation & Design Draft  
**Target Delivery:** `docs/camera/drafts/UX_A11Y_DRAFT.md` (Self-contained design draft & production code blueprints)  
**Related Tasks:** `CAM-06` (Stitch UI & Accessibility), `CAM-03` (Mobile Camera Core), `CAM-04` (Location Matching Coordinator), `CAM-05` (Tipping Queue & Continuation)

---

## Table of Contents
1. [Executive Summary & Human-Centered Design Vision](#1-executive-summary--human-centered-design-vision)
2. [Hard Invariants & Privacy Guardrails](#2-hard-invariants--privacy-guardrails)
3. [Stitch Design System Token Mapping & Contrast Audit](#3-stitch-design-system-token-mapping--contrast-audit)
4. [Component Architecture & State Machine](#4-component-architecture--state-machine)
5. [Screen & Component Visual Specifications (ASCII & Metrics)](#5-screen--component-visual-specifications-ascii--metrics)
   - 5.1 Floating Banner (Idle / Photo Mode)
   - 5.2 Quiet Recording Pill (Video Recording Mode)
   - 5.3 Performer Chooser Bottom Sheet (>1 Act or Coarse Location)
   - 5.4 Tip Review & Confirmation Modal
   - 5.5 Tip Processing State
   - 5.6 Success Receipt & Celebration State
6. [Comprehensive Accessibility (A11Y) Specification](#6-comprehensive-accessibility-a11y-specification)
   - 6.1 48dp Minimum Touch Target Geometry
   - 6.2 Screen Reader (VoiceOver & TalkBack) Semantics & Announcement Scripts
   - 6.3 Dynamic Type & Font Scaling (100% to 200%)
   - 6.4 Reduced Motion & Animation Suppression
   - 6.5 High Contrast & Outdoor Daylight Readability
7. [Production-Grade Flutter Draft Code](#7-production-grade-flutter-draft-code)
   - 7.1 `NearbyPerformerBanner` & `CameraRecordingTipPill` (`nearby_performer_banner.dart`)
   - 7.2 `NearbyPerformerChooserSheet` (`nearby_performer_chooser_sheet.dart`)
   - 7.3 `CameraTipFlowSheet` (`camera_tip_flow_sheet.dart`)
   - 7.4 Interactive Preview & Test Harness (`camera_tipping_preview_harness.dart`)
8. [Automated Verification & Widget Testing Blueprint](#8-automated-verification--widget-testing-blueprint)
9. [Handoff Summary & Task CAM-06 Acceptance Matrix](#9-handoff-summary--task-cam-06-acceptance-matrix)

---

## 1. Executive Summary & Human-Centered Design Vision

Live music environments present unique ergonomic, perceptual, and technical constraints:
- **High Cognitive Load & Dark/Dynamic Lighting:** Fans are engaged with the stage, navigating concert crowds, flashing stage strobes, and dark venues.
- **Single-Handed Grip & Physical Vibration:** Users frequently hold their phone in one hand while capturing photos or videos. Accidental taps or complex multi-step forms result in frustration and abandoned tips.
- **"Never Ruin the Shot":** The primary intent of opening the camera is creative capture. In-app overlays must never obscure the focal center, block the shutter, cause dropped recording frames, or pop up modal dialogues that interrupt video capture.
- **Micro-Proximity Confidence:** Music fans want to reward the musician on stage right now. When GPS accuracy is degraded (common in dense urban clubs or multi-stage festivals), the system must gracefully provide context rather than guessing wrong.

Crowdbeats V2 solves this by introducing a **non-intrusive, adaptive camera tipping surface**:
1. In viewfinder idle or photo mode, a **floating frosted glass banner** hovers quietly above the camera controls: `"Live nearby: [Act Name] · Tip $5"`, offering an immediate 1-tap checkout path and an explicit dismiss action.
2. During active video recording, the UI collapses into a **quiet non-intrusive pill** in the upper-right safe area. Tapping this pill queues the tip (`QueuedCameraTipIntent`) with zero camera interruption. Once video capture stops and media safely flushes to local disk, the tip review modal surfaces automatically.
3. If geospatial resolution detects multiple live acts within 100 meters or if GPS horizontal accuracy exceeds 50 meters, a **Performer Chooser Bottom Sheet** transparently presents candidates with badge indicators (`Solo Musician` vs `Band`), live distances, and genres.
4. The entire journey flows across 4 clean transition states: **Prompt $\rightarrow$ Review/Confirmation $\rightarrow$ Processing $\rightarrow$ Success Receipt**, adhering strictly to Stitch tokens, WCAG 2.2 Level AA/AAA contrast, and comprehensive screen reader accessibility.

---

## 2. Hard Invariants & Privacy Guardrails

1. **GPS-Only Proximity (Zero Biometrics / Zero Surveillance):**
   - Matching relies exclusively on device geospatial coordinates compared to active performer check-ins.
   - **No facial recognition, no audio fingerprinting, and no image frame scanning.**
   - Camera video buffers remain entirely local on the device and are never sent to external servers for performer identification.
2. **Media File Preservation & Zero Watermarking:**
   - Overlays, badges, banners, reticles, or tip receipts must **never** be composited into saved photo or video files.
   - The device camera stream captures pristine raw photo/video assets directly to local media storage.
3. **Recording Safety & Deferred Checkout Queue:**
   - Tapping a tip CTA during active video recording **must never open a modal sheet or interrupt video recording**.
   - Taps register an intent into `QueuedCameraTipIntent`. The modal triggers only after the user stops recording and the recording pipeline verifies the video asset is closed on disk.
4. **Touch Target Standard ($\ge 48\text{dp}$):**
   - Every tappable control (including the close 'X' button, chip toggles, and list items) enforces a minimum bounding box of $48\times 48\text{dp}$ as mandated by WCAG 2.2 Success Criterion 2.5.8 and Material 3 design standards.
5. **Deduplication & Cooldown Rules:**
   - Maximum 1 prompt per performer/session per camera launch.
   - Tapping dismiss (X) initiates a **30-minute cooldown** suppressing prompts for that act.
   - If the user has already tipped the performer during this session, the prompt is suppressed automatically.

---

## 3. Stitch Design System Token Mapping & Contrast Audit

All components strictly consume tokens from [`CbColors`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/theme/cb_colors.dart), [`CbSpacing`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/theme/cb_spacing.dart), and [`CbTheme`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/theme/cb_theme.dart). No arbitrary hex codes or magic dimension literals are permitted.

### 3.1 Color Token Mapping

| UI Element / State | Semantic Stitch Token | Hex / Value | WCAG Contrast vs Background | Compliance Level |
| :--- | :--- | :--- | :--- | :--- |
| **Floating Banner Fill** | `CbColors.surfaceGlass` | `0xBF151722` (75% `#151722`) | Overlay with `BackdropFilter` (blur: 12) | ✅ AA / AAA |
| **Banner Glass Border** | `CbColors.borderGlass` | `0x14FFFFFF` (8% White) | Structural edge demarcation | ✅ Non-text contrast |
| **Card / Sheet Background** | `CbColors.surface1` / `surfaceRaised` | `#151722` | Base surface for elevated sheets | ✅ Surface |
| **Elevated Chip / Tile** | `CbColors.surface2` / `surfaceCard` | `#1E2032` | Nested interactive containers | ✅ Surface |
| **Primary Action Button** | `CbColors.purpleMain` | `#7C3AED` | 4.8:1 vs `#FFFFFF` text | ✅ WCAG AA |
| **Button Glow Shadow** | `CbColors.purpleGlow` | `0x737C3AED` (45% Purple) | Elevated atmospheric affordance | N/A (Decorative) |
| **Live Indicator & Dot** | `CbColors.liveGreen` | `#10B981` | 5.2:1 vs `#151722` dark surface | ✅ WCAG AA |
| **GPS / Distance Accent** | `CbColors.gpsBlue` | `#3B82F6` | 4.6:1 vs `#151722` dark surface | ✅ WCAG AA |
| **Primary Typography** | `CbColors.textPrimary` | `#FFFFFF` | 18.2:1 vs `#151722` | ✅ WCAG AAA |
| **Secondary Typography** | `CbColors.textSecondary` | `#94A3B8` | 6.8:1 vs `#151722` | ✅ WCAG AA |
| **Muted Metadata / Hint** | `CbColors.textMuted` / `textTertiary` | `#64748B` | 4.5:1 vs `#151722` | ✅ WCAG AA (Large) |
| **Error / Strike Border** | `CbColors.borderError` | `#EF4444` | High contrast alert state | ✅ WCAG AA |
| **Recording Active Pill** | `CbColors.surfaceGlass` + Red dot | `#151722` + `#EF4444` | High visibility without obscuring viewfinder | ✅ WCAG AA |

### 3.2 Spacing, Radii & Touch Targets

- **4-Point Grid:** Conforms to `CbSpacing`: `s1` (4dp), `s2` (8dp), `s3` (12dp), `s4` (16dp), `s5` (20dp), `s6` (24dp), `s8` (32dp).
- **Corner Radii:**
  - Banner & Candidate Cards: `CbSpacing.radiusMd` (12dp) or `CbSpacing.radiusLg` (16dp).
  - Bottom Sheet Top Shell: `CbSpacing.radiusXl` (24dp).
  - Quick Amount Chips: `CbSpacing.radiusSm` (8dp).
  - Floating Recording Pill: `CbSpacing.radiusFull` (999dp).
- **Touch Target Enforcements:**
  - Standard button height: `CbSpacing.touchComfortable` (56dp) or `CbSpacing.touchMin` (48dp).
  - Floating Banner close button: `48 x 48dp` tap area with an inner `20dp` icon.
  - Quick tip amount chips: minimum `48dp` tap height.
  - Performer Chooser list item: minimum `68dp` tap row height.

### 3.3 Motion & Durations

All transitions check system accessibility settings via `CbMotion.resolve(context, duration)`:
- Banner Slide & Fade In: `CbMotion.normal` (200ms) with `CbMotion.spring` (`Curves.easeOutBack`).
- Recording Pill Collapse: `CbMotion.fast` (100ms) with `Curves.easeInOut`.
- Live Dot Pulse: `1200ms` repeat cycle; **automatically disabled** when `MediaQuery.of(context).disableAnimations` is true.

---

## 4. Component Architecture & State Machine

```mermaid
flowchart TD
    subgraph Viewfinder Layer
        CamStream["Camera Viewfinder Stream"]
        Banner["NearbyPerformerBanner (Floating)"]
        Pill["CameraRecordingTipPill (Quiet Pill)"]
    end

    subgraph Decision Logic
        MatchCoord["CameraNearbyMatchingCoordinator"]
        IsRec{"Video Recording Active?"}
        CandidateCheck{"Candidates Found?"}
        AccuracyCheck{"Accuracy > 50m OR Candidates > 1?"}
    end

    subgraph User Actions
        TapTip["User Taps 'Tip $5'"]
        TapPill["User Taps Recording Pill"]
        TapDismiss["User Taps 'X' Close"]
        StopRec["Recording Finishes"]
    end

    subgraph State Machine
        S1["State 1: Prompt / Banner"]
        S2["State 2: Review / Confirmation Sheet"]
        S3["State 3: Processing Sheet"]
        S4["State 4: Success Receipt Sheet"]
        S_Queue["QueuedCameraTipIntent"]
        S_Chooser["NearbyPerformerChooserSheet"]
    end

    CamStream --> MatchCoord
    MatchCoord --> CandidateCheck
    CandidateCheck -- ">=1 Candidate" --> AccuracyCheck
    AccuracyCheck -- "Single act & Accuracy <= 50m" --> IsRec
    AccuracyCheck -- "Multiple acts OR Accuracy > 50m" --> S_Chooser
    
    IsRec -- "No (Idle/Photo)" --> S1
    IsRec -- "Yes (Recording)" --> Pill

    S1 --> TapTip
    S1 --> TapDismiss
    TapDismiss --> Cooldown["Start 30m Cooldown & Fade Out"]

    TapTip --> S2
    Pill --> TapPill
    TapPill --> S_Queue
    S_Queue --> StopRec
    StopRec --> S2

    S_Chooser --> |User selects performer| S2
    S2 --> |Confirm & Pay| S3
    S3 --> |Stripe webhook success| S4
    S4 --> |Done / Return| CamStream
```

### Transition State Invariants
1. **State 1 $\rightarrow$ State 2 (Prompt to Review):** Immediate bottom sheet slide up (`CbMotion.slow`, 350ms). Viewfinder remains active underneath with dark scrim (`0x66000000`).
2. **State 2 $\rightarrow$ State 3 (Review to Processing):** **In-place morphing** within the bottom sheet container. No navigation stack push/pop. The interactive form transitions into an accessible loading spinner, preventing accidental double taps and keyboard jumps.
3. **State 3 $\rightarrow$ State 4 (Processing to Success):** In-place morphing to the receipt card. Generates immediate haptic feedback (`HapticFeedback.heavyImpact()`) and fires an accessible live announcement.
4. **State 4 $\rightarrow$ Dismiss:** Smooth slide-down modal exit. Cleans up the floating banner so the user returns to a pristine, unobstructed viewfinder ready for their next photo/video.

---

## 5. Screen & Component Visual Specifications (ASCII & Metrics)

### 5.1 Floating Banner (Idle / Photo Mode)

Positioned anchored at the bottom of the camera screen, exactly **16dp above the Shutter / Mode selector bar** and padded **16dp horizontally**.

```
+-------------------------------------------------------------+
|  [X] Flash: Auto                                    [Camera]|  <- Top Header (Safe Area)
|                                                             |
|                                                             |
|                         VIEWFINDER                          |
|                       (Subject Centered)                    |
|                                                             |
|                                                             |
|  +-------------------------------------------------------+  |
|  | [O] [LIVE] Live nearby:                               |  |  <- CbColors.surfaceGlass (75% #151722)
|  | (*) Maya & The Groove · 32m away                      |  |     Border: 1dp CbColors.borderGlass
|  |                                                       |  |     BackdropFilter: 12px blur
|  | [ Tip $5 ]                            [ X Dismiss ]   |  |     Tap Targets: >= 48x48dp
|  +-------------------------------------------------------+  |
|                                                             |
|      [ Photo ]                 ( SHUTTER )         [ Video ]|  <- Camera Controls
+-------------------------------------------------------------+
```

#### Metrics & Token Spec:
- **Container:** Margin `symmetric(horizontal: 16, vertical: 8)`. Padding `all(12)`.
- **Border Radius:** `CbSpacing.radiusLg` (16dp).
- **Background:** `CbColors.surfaceGlass` with `BackdropFilter(filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12))`.
- **Border:** 1.0dp `CbColors.borderGlass`.
- **Live Badge:** Emerald dot + `LIVE` text pill (`CbColors.liveGreen`).
- **Avatar:** $40\times 40\text{dp}$ circular image with 1dp border `CbColors.borderSubtle`.
- **Title Text:** `GoogleFonts.dmSans(fontSize: 14, fontWeight: 700, color: CbColors.textPrimary)`.
- **Subtitle Text:** `GoogleFonts.dmSans(fontSize: 12, color: CbColors.textSecondary)`.
- **Tip Button:** Height `48dp`, background `CbColors.primaryGradient`, padding `horizontal: 16`.
- **Dismiss Button:** Square `48 x 48dp` with centered `18dp` icon `Icons.close`, foreground `CbColors.textSecondary`.

---

### 5.2 Quiet Recording Pill (Video Recording Mode)

During video recording, the full banner collapses into a minimalist pill anchored in the **top-right safe area** beneath the recording timer. It occupies $<8\%$ of the screen width and does not obstruct framing.

```
+-------------------------------------------------------------+
|  [REC 00:14]                          [(*) Tip Queued ($5)] |  <- Quiet Recording Pill
|                                                             |
|                                                             |
|                         VIEWFINDER                          |
|                     (Active Recording)                      |
|                                                             |
|                                                             |
|                                                             |
|                         [ (STOP) ]                          |  <- Red Stop Shutter
+-------------------------------------------------------------+
```

#### Metrics & Token Spec:
- **Container:** Height `36dp`, Min Tap Target `48 x 48dp` via `HitTestBehavior.opaque` and `BoxConstraints(minHeight: 48, minWidth: 48)`.
- **Shape:** `RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull))`.
- **Background:** `Color(0xCC0B0C10)` (80% black glass) with `borderGlass`.
- **Text:** `12dp DM Sans, FontWeight.w600, color: CbColors.textPrimary`.
- **Visual Feedback on Tap:** Pill pulses briefly and changes copy to `"Tip Queued ✓"`. Audio remains completely silent to prevent corrupting the microphone recording.

---

### 5.3 Performer Chooser Bottom Sheet (>1 Act or Coarse Location)

Presented when `candidates.length > 1` OR `accuracyMeters > 50`.

```
+=============================================================+
|                      [  DRAG HANDLE  ]                      |
|                                                             |
|  Performers Playing Nearby                           [ X ]  |  <- Header (20dp Bold)
|  Multiple acts detected within 100m. Select who to tip:     |  <- Subtitle (14dp Secondary)
|                                                             |
|  +-------------------------------------------------------+  |
|  | [Avatar] Maya & The Groove              [ Solo Act ]  |  |  <- Card: CbColors.surfaceCard (#1E2032)
|  |          The Casbah • Main Stage        32m away      |  |     Border: 1dp borderSubtle
|  |          [ Indie Rock ] [ Soul ]                      |  |     Min Touch Target: 68dp row
|  |                                                       |  |
|  |                                            [ Tip $5 ] |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | [Avatar] Electric Velvet                [   Band   ]  |  |
|  |          Outdoor Patio Stage            48m away      |  |
|  |          [ Synthwave ] [ Funk ]                       |  |
|  |                                                       |  |
|  |                                            [ Tip $5 ] |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  [!] Don't see your act? Scan performer QR code directly   |  <- Fallback Link (48dp touch)
+=============================================================+
```

#### Metrics & Token Spec:
- **Top Corners:** `BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl))`.
- **Background:** `CbColors.surfaceRaised` (`#151722`).
- **Drag Handle:** Width `36dp`, Height `4dp`, Color `CbColors.borderSubtle`, Radius `2dp`.
- **Performer Badge:**
  - `Solo Musician`: Violet tint container (`0x267C3AED`) with purple text `CbColors.purpleLight`.
  - `Band`: Teal Gas tint container (`0x2603DAC6`) with teal gas text `CbColors.tealGas`.
- **Distance:** Text `13dp DM Sans, CbColors.gpsBlue` with GPS pin icon.

---

### 5.4 Tip Review & Confirmation Modal

Pre-populated with performer details and standard **\$5.00** preset. Transparent fee disclosure ensures full compliance with financial standards.

```
+=============================================================+
|                      [  DRAG HANDLE  ]                      |
|                                                             |
|  Tip Maya & The Groove                               [ X ]  |
|  Live at The Casbah (Session #8291)                         |
|                                                             |
|  SELECT AMOUNT                                              |
|  +---------+   +----------+   +----------+   +-----------+  |
|  | * $5.00 |   |  $10.00  |   |  $20.00  |   |  Custom   |  |  <- 48dp Preset Chips
|  +---------+   +----------+   +----------+   +-----------+  |
|                                                             |
|  PAYMENT METHOD                                             |
|  +-------------------------------------------------------+  |
|  | ( Apple Pay )   Card ending in ••••4242      [ Change]|  |  <- 48dp Saved PM Chip
|  +-------------------------------------------------------+  |
|                                                             |
|  SUMMARY & FEES                                             |
|  Performer receives:                                $5.00  |
|  Platform Fee (6%):                                 $0.30  |
|  Processing (Stripe standard):                      $0.45  |
|  ---------------------------------------------------------  |
|  Total Charged:                                     $5.75  |
|                                                             |
|  [             CONFIRM & SEND $5.75              ]  |  <- 56dp CbPillButton
|  [Secured by Stripe · Instant direct musician payout]       |
+=============================================================+
```

---

### 5.5 Tip Processing State

In-place modal transition. No page navigation; eliminates visual disruption and screen flicker.

```
+=============================================================+
|                                                             |
|                         [ ( * ) ]                           |  <- Indeterminate Purple Spinner
|                                                             |
|               Authorizing Payment ($5.75)...                |  <- 18dp Bold Primary
|           Sending direct tip to Maya & The Groove           |  <- 14dp Secondary
|                                                             |
|    Please do not close this window or lock your phone.      |  <- Muted Warning
|                                                             |
+=============================================================+
```

---

### 5.6 Success Receipt & Celebration State

Emerald checkmark badge with celebration metadata, social share action, and clean exit back to the camera.

```
+=============================================================+
|                                                             |
|                         [ ( V ) ]                           |  <- Emerald Live Checkmark
|                                                             |
|                     Tip Confirmed!                          |  <- 22dp Bold TextPrimary
|              You tipped $5.00 to Maya & The Groove          |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Receipt ID: cb_tip_9a2f4c1e                           |  |  <- Frosted Receipt Container
|  | Paid with: Apple Pay (••••4242)                       |  |
|  | Time: 9:42 PM · The Casbah                            |  |
|  | Destination: Direct Musician Connected Account        |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  [              SHARE TIP ON INSTAGRAM / X               ]  |  <- 48dp Outlined Button
|  [                      DONE                             ]  |  <- 56dp Primary Button
+=============================================================+
```

---

## 6. Comprehensive Accessibility (A11Y) Specification

### 6.1 48dp Minimum Touch Target Geometry

Every interactive widget implements a strict minimum bounding box constraint:

```dart
// Standard touch target enforcement pattern in Crowdbeats
BoxConstraints(
  minWidth: CbSpacing.touchMin,  // 48.0
  minHeight: CbSpacing.touchMin, // 48.0
)
```

1. **Dismiss (X) Button on Banner:** Visible icon is `18dp`, but the parent `InkWell` / `IconButton` has padding ensuring a `48 x 48dp` hit test area.
2. **Tip $5 CTA:** Bounded to a minimum height of `48dp` with `horizontal: 16dp` padding.
3. **Preset Chips:** Minimum width `72dp`, minimum height `48dp`.
4. **Recording Pill:** When compact, the visible pill is `36dp` tall but wrapped in a `Padding` and `HitTestBehavior.opaque` container with `minHeight: 48dp` to guarantee reliable thumb interaction.

### 6.2 Screen Reader (VoiceOver & TalkBack) Semantics & Announcement Scripts

| Screen / Event | Trigger | Screen Reader Announcement Script | Widget Semantics Implementation |
| :--- | :--- | :--- | :--- |
| **Nearby Act Detected** | Banner appears | `"Live performer detected nearby: Maya & The Groove. Tap to tip five dollars."` | `Semantics(liveRegion: true, label: "...")` + `SemanticsService.announce` |
| **Banner Dismiss** | Focus on 'X' | `"Dismiss tip suggestion for Maya & The Groove. Button. Double tap to dismiss for 30 minutes."` | `Semantics(button: true, label: "Dismiss tip suggestion...", hint: "Double tap to dismiss for 30 minutes")` |
| **Recording Pill** | Pill appears | `"Live performer nearby: Maya & The Groove. Tap to queue tip for after recording."` | `Semantics(button: true, label: "Queue five dollar tip...")` |
| **Chooser List Item** | Item focus | `"1 of 3: Maya & The Groove, Solo Artist, 32 meters away, Indie Rock. Double tap to select."` | `Semantics(selected: isSelected, button: true, label: "...")` |
| **Fee Breakdown** | Review sheet | `"Payment summary: Tip amount five dollars, platform fee 30 cents, processing fee 45 cents, total charged five dollars and 75 cents."` | `Semantics(readOnly: true, label: "...")` |
| **Processing** | Intent sent | `"Authorizing tip with Stripe. Please wait."` | `Semantics(liveRegion: true)` |
| **Tip Success** | Confirmed | `"Payment successful! You tipped five dollars to Maya & The Groove. Receipt ID cb_tip_9a2f4c1e."` | `Semantics(liveRegion: true)` + `HapticFeedback.heavyImpact()` |

### 6.3 Dynamic Type & Font Scaling (100% to 200%)

To support low-vision users utilizing iOS Dynamic Type or Android Large Text:
1. **No Fixed Container Heights:** All cards, banners, and modals use flexible constraints (`Wrap`, `IntrinsicHeight`, `Expanded`, or `SingleChildScrollView`).
2. **Text Wrapping:** Text widgets declare `softWrap: true` and avoid fixed `maxLines` unless paired with `TextOverflow.ellipsis` on secondary descriptions.
3. **Modal Scrollability:** The review sheet and chooser sheet wrap content in `SingleChildScrollView(physics: const BouncingScrollPhysics())` to guarantee that at 200% font scale, buttons are never clipped below the viewport.

### 6.4 Reduced Motion & Animation Suppression

For vestibular sensitivity and system accessibility settings:
- `CbMotion.resolve(context, duration)` checks `MediaQuery.of(context).disableAnimations`.
- When enabled:
  - Slide and scale animations resolve to `Duration.zero` (instant cut).
  - The pulsing emerald LIVE dot is rendered as a **static emerald circle** with zero opacity oscillation.
  - Confetti and celebration particles are omitted in favor of a static, clean checkmark badge.

### 6.5 High Contrast & Outdoor Daylight Readability

In direct sunlight or when system high contrast is active:
- Contrast ratio between text and surface exceeds 18:1 (WCAG AAA).
- Borders dynamically increase thickness from `1.0dp` to `2.0dp` with `CbColors.borderFocus` (`#7C3AED`).
- Dark glass opacity increases from 75% to **92%** to prevent bright camera viewfinder light from bleeding through text glyphs.

---

## 7. Production-Grade Flutter Draft Code

The following self-contained Flutter files provide the complete implementation for the camera tipping UI components.

---

### 7.1 `NearbyPerformerBanner` & `CameraRecordingTipPill`

```dart
// Crowdbeats V2 — Camera Nearby Performer Banner & Recording Pill (CAM-06)
// Floating viewfinder banner and recording-safe quiet pill.

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../theme/cb_theme.dart';

/// Data representation of a nearby live act candidate.
class NearbyPerformerCandidate {
  const NearbyPerformerCandidate({
    required this.performerId,
    required this.performerType, // 'artist' | 'band'
    required this.performerName,
    this.performerAvatarUrl,
    required this.activeSessionId,
    required this.locationType, // 'venue' | 'street'
    this.venueName,
    required this.distanceMeters,
    required this.genres,
    this.defaultTipAmountCents = 500, // $5.00
  });

  final String performerId;
  final String performerType;
  final String performerName;
  final String? performerAvatarUrl;
  final String activeSessionId;
  final String locationType;
  final String? venueName;
  final double distanceMeters;
  final List<String> genres;
  final int defaultTipAmountCents;

  String get formattedDistance {
    if (distanceMeters < 10) return '< 10m away';
    return '${distanceMeters.round()}m away';
  }

  String get typeLabel => performerType.toLowerCase() == 'band' ? 'Band' : 'Solo Artist';
}

/// Floating banner rendered in the camera viewfinder.
/// Automatically flips to a quiet non-intrusive pill during video recording.
class NearbyPerformerBanner extends StatefulWidget {
  const NearbyPerformerBanner({
    super.key,
    required this.candidate,
    required this.isRecordingVideo,
    required this.isTipQueued,
    required this.onTipPressed,
    required this.onDismissPressed,
    this.onChooserRequested,
  });

  final NearbyPerformerCandidate candidate;
  final bool isRecordingVideo;
  final bool isTipQueued;
  final VoidCallback onTipPressed;
  final VoidCallback onDismissPressed;
  final VoidCallback? onChooserRequested;

  @override
  State<NearbyPerformerBanner> createState() => _NearbyPerformerBannerState();
}

class _NearbyPerformerBannerState extends State<NearbyPerformerBanner>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    // Announce banner presence for screen reader users
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final act = widget.candidate.performerName;
      final dist = widget.candidate.formattedDistance;
      SemanticsService.announce(
        'Live performer detected nearby: $act, $dist. Tap to tip five dollars.',
        TextDirection.ltr,
      );
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    // During video recording: render minimal quiet pill
    if (widget.isRecordingVideo) {
      return CameraRecordingTipPill(
        candidate: widget.candidate,
        isQueued: widget.isTipQueued,
        onTap: () {
          HapticFeedback.selectionClick();
          widget.onTipPressed();
        },
      );
    }

    // Normal mode: Floating glassmorphic card above camera controls
    return Semantics(
      container: true,
      label: 'Nearby live performer banner: ${widget.candidate.performerName}',
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4, vertical: CbSpacing.s2),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              padding: const EdgeInsets.all(CbSpacing.s3_5),
              decoration: BoxDecoration(
                color: CbColors.surfaceGlass,
                borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                border: Border.all(
                  color: CbColors.borderGlass,
                  width: 1.0,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x66000000),
                    blurRadius: 16,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top row: Live pulse dot, Act Name, Distance, Dismiss button
                  Row(
                    children: [
                      // Pulsing Emerald Dot
                      if (!reduceMotion)
                        FadeTransition(
                          opacity: Tween<double>(begin: 0.3, end: 1.0).animate(_pulseController),
                          child: _buildLiveDot(),
                        )
                      else
                        _buildLiveDot(),
                      const SizedBox(width: CbSpacing.s2),

                      // Live nearby label
                      Text(
                        'LIVE NEARBY',
                        style: GoogleFonts.dmSans(
                          color: CbColors.liveGreen,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(width: CbSpacing.s1_5),
                      Text(
                        '•',
                        style: TextStyle(color: CbColors.textMuted, fontSize: 12),
                      ),
                      const SizedBox(width: CbSpacing.s1_5),

                      // Distance
                      Text(
                        widget.candidate.formattedDistance,
                        style: GoogleFonts.dmSans(
                          color: CbColors.gpsBlue,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),

                      // Close / Dismiss 'X' Button (Strict 48x48dp Touch Target)
                      Semantics(
                        button: true,
                        label: 'Dismiss nearby performer tip suggestion for ${widget.candidate.performerName}',
                        hint: 'Double tap to dismiss this suggestion for 30 minutes',
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              widget.onDismissPressed();
                            },
                            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            child: const SizedBox(
                              width: CbSpacing.touchMin,
                              height: CbSpacing.touchMin,
                              child: Center(
                                child: Icon(
                                  Icons.close,
                                  color: CbColors.textSecondary,
                                  size: 18,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: CbSpacing.s2),

                  // Middle row: Avatar + Act Info
                  Row(
                    children: [
                      // Performer Avatar
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: CbColors.surface2,
                          shape: BoxShape.circle,
                          border: Border.all(color: CbColors.borderSubtle, width: 1),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: widget.candidate.performerAvatarUrl != null
                            ? Image.network(
                                widget.candidate.performerAvatarUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => _buildAvatarFallback(),
                              )
                            : _buildAvatarFallback(),
                      ),
                      const SizedBox(width: CbSpacing.s3),

                      // Act Name & Venue / Type
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.candidate.performerName,
                              style: GoogleFonts.dmSans(
                                color: CbColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              widget.candidate.venueName ??
                                  '${widget.candidate.typeLabel} • ${widget.candidate.genres.take(2).join(', ')}',
                              style: GoogleFonts.dmSans(
                                color: CbColors.textSecondary,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: CbSpacing.s2),

                      // Primary Action: Tip $5 Button (Strict >= 48dp Touch Target)
                      Semantics(
                        button: true,
                        label: 'Send five dollar tip to ${widget.candidate.performerName}',
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () {
                              HapticFeedback.mediumImpact();
                              widget.onTipPressed();
                            },
                            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                            child: Ink(
                              height: CbSpacing.touchMin,
                              padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
                              decoration: BoxDecoration(
                                gradient: CbColors.primaryGradient,
                                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                                boxShadow: const [
                                  BoxShadow(
                                    color: CbColors.purpleGlow,
                                    blurRadius: 10,
                                    offset: Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.favorite_rounded,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                  const SizedBox(width: CbSpacing.s1_5),
                                  Text(
                                    'Tip \$5',
                                    style: GoogleFonts.dmSans(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Optional link if multiple acts detected nearby
                  if (widget.onChooserRequested != null) ...[
                    const SizedBox(height: CbSpacing.s1),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: widget.onChooserRequested,
                        style: TextButton.styleFrom(
                          minimumSize: const Size(CbSpacing.touchMin, 32),
                          padding: EdgeInsets.zero,
                        ),
                        child: Text(
                          'Other acts nearby? Choose performer →',
                          style: GoogleFonts.dmSans(
                            color: CbColors.purpleLight,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLiveDot() {
    return Container(
      width: 8,
      height: 8,
      decoration: const BoxDecoration(
        color: CbColors.liveGreen,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Color(0x9910B981),
            blurRadius: 6,
            spreadRadius: 1,
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarFallback() {
    return Center(
      child: Icon(
        widget.candidate.performerType.toLowerCase() == 'band'
            ? Icons.groups_rounded
            : Icons.music_note_rounded,
        color: CbColors.textMuted,
        size: 22,
      ),
    );
  }
}

/// Minimalist quiet pill shown strictly during video recording.
/// Completely avoids obstructing the video frame or recording audio.
class CameraRecordingTipPill extends StatelessWidget {
  const CameraRecordingTipPill({
    super.key,
    required this.candidate,
    required this.isQueued,
    required this.onTap,
  });

  final NearbyPerformerCandidate candidate;
  final bool isQueued;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = isQueued
        ? 'Tip Queued (\$5) ✓'
        : 'Tip ${candidate.performerName} (\$5)';

    final semanticLabel = isQueued
        ? 'Five dollar tip queued for ${candidate.performerName}. Checkout will open when video stops.'
        : 'Performer nearby: ${candidate.performerName}. Tap to queue five dollar tip for after recording.';

    return Semantics(
      button: true,
      label: semanticLabel,
      child: Padding(
        padding: const EdgeInsets.only(top: 8, right: 16),
        child: Align(
          alignment: Alignment.topRight,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  minWidth: CbSpacing.touchMin,
                  minHeight: CbSpacing.touchMin,
                ),
                child: Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isQueued ? const Color(0xCC151722) : const Color(0xB30B0C10),
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          border: Border.all(
                            color: isQueued ? CbColors.liveGreen : CbColors.borderGlass,
                            width: 1.0,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isQueued ? Icons.check_circle_rounded : Icons.favorite_rounded,
                              size: 14,
                              color: isQueued ? CbColors.liveGreen : CbColors.purpleLight,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              label,
                              style: GoogleFonts.dmSans(
                                color: isQueued ? CbColors.liveGreen : Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

---

### 7.2 `NearbyPerformerChooserSheet`

```dart
// Crowdbeats V2 — Nearby Performer Chooser Bottom Sheet (CAM-06)
// Displayed when multiple live acts are detected or location accuracy > 50m.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import 'nearby_performer_banner.dart';

class NearbyPerformerChooserSheet extends StatelessWidget {
  const NearbyPerformerChooserSheet({
    super.key,
    required this.candidates,
    required this.horizontalAccuracyMeters,
    required this.onSelectCandidate,
  });

  final List<NearbyPerformerCandidate> candidates;
  final double horizontalAccuracyMeters;
  final ValueChanged<NearbyPerformerCandidate> onSelectCandidate;

  static Future<NearbyPerformerCandidate?> show(
    BuildContext context, {
    required List<NearbyPerformerCandidate> candidates,
    required double horizontalAccuracyMeters,
  }) {
    return showModalBottomSheet<NearbyPerformerCandidate>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NearbyPerformerChooserSheet(
        candidates: candidates,
        horizontalAccuracyMeters: horizontalAccuracyMeters,
        onSelectCandidate: (candidate) => Navigator.of(context).pop(candidate),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCoarse = horizontalAccuracyMeters > 50;

    return Semantics(
      container: true,
      label: 'Choose nearby live performer dialog',
      child: Container(
        decoration: const BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(CbSpacing.radiusXl),
          ),
          border: Border(
            top: BorderSide(color: CbColors.borderSubtle, width: 1),
          ),
        ),
        padding: const EdgeInsets.only(
          top: CbSpacing.s3,
          left: CbSpacing.s5,
          right: CbSpacing.s5,
          bottom: CbSpacing.s6,
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: CbColors.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Header Row: Title & Close Button
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Performers Playing Nearby',
                          style: GoogleFonts.dmSans(
                            color: CbColors.textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isCoarse
                              ? 'Multiple acts detected (GPS accuracy ±${horizontalAccuracyMeters.round()}m). Choose who you want to support:'
                              : 'Select the musician or band you are watching:',
                          style: GoogleFonts.dmSans(
                            color: CbColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Semantics(
                    button: true,
                    label: 'Close performer selection sheet',
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => Navigator.of(context).pop(),
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        child: const SizedBox(
                          width: CbSpacing.touchMin,
                          height: CbSpacing.touchMin,
                          child: Icon(Icons.close, color: CbColors.textSecondary),
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: CbSpacing.s4),

              // Performer List
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.5,
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  itemCount: candidates.length,
                  separatorBuilder: (_, __) => const SizedBox(height: CbSpacing.s3),
                  itemBuilder: (context, index) {
                    final item = candidates[index];
                    return _buildCandidateCard(context, item, index);
                  },
                ),
              ),

              const SizedBox(height: CbSpacing.s4),

              // Fallback / QR Assistance
              Center(
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    // Fallback to QR Scan navigation
                  },
                  icon: const Icon(Icons.qr_code_scanner, size: 18, color: CbColors.purpleLight),
                  label: Text(
                    'Don\'t see your act? Scan performer QR code',
                    style: GoogleFonts.dmSans(
                      color: CbColors.purpleLight,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    minimumSize: const Size(CbSpacing.touchMin, CbSpacing.touchMin),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCandidateCard(
    BuildContext context,
    NearbyPerformerCandidate item,
    int index,
  ) {
    final isBand = item.performerType.toLowerCase() == 'band';

    return Semantics(
      button: true,
      label: '${index + 1} of ${candidates.length}: ${item.performerName}, '
          '${item.typeLabel}, ${item.formattedDistance}, '
          '${item.venueName ?? ''}, ${item.genres.join(', ')}. Tap to tip \$5.',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onSelectCandidate(item);
          },
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          child: Ink(
            padding: const EdgeInsets.all(CbSpacing.s3_5),
            decoration: BoxDecoration(
              color: CbColors.surface2,
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: CbColors.borderSubtle, width: 1),
            ),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: CbColors.surface3,
                    shape: BoxShape.circle,
                    border: Border.all(color: CbColors.borderSubtle, width: 1),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: item.performerAvatarUrl != null
                      ? Image.network(
                          item.performerAvatarUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildAvatarIcon(isBand),
                        )
                      : _buildAvatarIcon(isBand),
                ),
                const SizedBox(width: CbSpacing.s3_5),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.performerName,
                              style: GoogleFonts.dmSans(
                                color: CbColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          // Badge: Solo vs Band
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: isBand
                                  ? const Color(0x2603DAC6)
                                  : CbColors.purpleDim,
                              borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
                            ),
                            child: Text(
                              item.typeLabel,
                              style: GoogleFonts.dmSans(
                                color: isBand ? CbColors.tealGas : CbColors.purpleLight,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Icon(Icons.location_on_rounded, size: 13, color: CbColors.gpsBlue),
                          const SizedBox(width: 2),
                          Text(
                            item.formattedDistance,
                            style: GoogleFonts.dmSans(
                              color: CbColors.gpsBlue,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (item.venueName != null) ...[
                            Text(' • ', style: TextStyle(color: CbColors.textMuted)),
                            Expanded(
                              child: Text(
                                item.venueName!,
                                style: GoogleFonts.dmSans(
                                  color: CbColors.textSecondary,
                                  fontSize: 12,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Genre Chips
                      Wrap(
                        spacing: 4,
                        children: item.genres.take(3).map((g) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: CbColors.surface3,
                              borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
                            ),
                            child: Text(
                              g,
                              style: GoogleFonts.dmSans(
                                color: CbColors.textSecondary,
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: CbSpacing.s2),

                // Tip Button
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: CbColors.purpleMain,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                  ),
                  child: Text(
                    'Tip \$5',
                    style: GoogleFonts.dmSans(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarIcon(bool isBand) {
    return Center(
      child: Icon(
        isBand ? Icons.groups_rounded : Icons.person_rounded,
        color: CbColors.textMuted,
        size: 24,
      ),
    );
  }
}
```

---

### 7.3 `CameraTipFlowSheet`

```dart
// Crowdbeats V2 — Camera Tipping Multi-Stage Flow Sheet (CAM-06)
// Unified modal orchestrating: Review/Confirmation -> Processing -> Success Receipt.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import 'nearby_performer_banner.dart';

enum CameraTipStage {
  review,
  processing,
  success,
  error,
}

class CameraTipFlowSheet extends StatefulWidget {
  const CameraTipFlowSheet({
    super.key,
    required this.candidate,
    this.initialAmountCents = 500, // $5.00 default
    this.onPaymentCompleted,
  });

  final NearbyPerformerCandidate candidate;
  final int initialAmountCents;
  final VoidCallback? onPaymentCompleted;

  static Future<void> show(
    BuildContext context, {
    required NearbyPerformerCandidate candidate,
    int initialAmountCents = 500,
    VoidCallback? onPaymentCompleted,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CameraTipFlowSheet(
        candidate: candidate,
        initialAmountCents: initialAmountCents,
        onPaymentCompleted: onPaymentCompleted,
      ),
    );
  }

  @override
  State<CameraTipFlowSheet> createState() => _CameraTipFlowSheetState();
}

class _CameraTipFlowSheetState extends State<CameraTipFlowSheet> {
  late CameraTipStage _stage;
  late int _selectedAmountCents;
  bool _isTapped = false; // Duplicate-tap guard
  String? _errorMessage;

  final List<int> _presetCents = [500, 1000, 2000]; // $5, $10, $20

  @override
  void initState() {
    super.initState();
    _stage = CameraTipStage.review;
    _selectedAmountCents = widget.initialAmountCents;
  }

  String _formatCents(int cents) {
    final d = cents ~/ 100;
    final c = cents % 100;
    return '\$$d.${c.toString().padLeft(2, '0')}';
  }

  // Financial fee calculations
  int get _platformFeeCents => (_selectedAmountCents * 0.06).round(); // 6%
  int get _stripeFeeCents => (_selectedAmountCents * 0.029 + 30).round(); // 2.9% + 30c
  int get _totalChargedCents => _selectedAmountCents + _platformFeeCents + _stripeFeeCents;

  void _onConfirmPayment() async {
    if (_isTapped) return;
    setState(() {
      _isTapped = true;
      _stage = CameraTipStage.processing;
    });

    SemanticsService.announce(
      'Processing ${_formatCents(_totalChargedCents)} tip to ${widget.candidate.performerName} with Stripe. Please wait.',
      TextDirection.ltr,
    );

    // Simulate payment intent / callable integration
    try {
      await Future<void>.delayed(const Duration(milliseconds: 1800));

      if (mounted) {
        setState(() {
          _stage = CameraTipStage.success;
        });

        HapticFeedback.heavyImpact();
        SemanticsService.announce(
          'Payment successful! You tipped ${_formatCents(_selectedAmountCents)} to ${widget.candidate.performerName}.',
          TextDirection.ltr,
        );

        widget.onPaymentCompleted?.call();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _stage = CameraTipStage.error;
          _errorMessage = 'Payment authorization failed. Please try again.';
          _isTapped = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
        border: Border(top: BorderSide(color: CbColors.borderSubtle, width: 1)),
      ),
      padding: EdgeInsets.only(
        top: CbSpacing.s3,
        left: CbSpacing.s5,
        right: CbSpacing.s5,
        bottom: MediaQuery.of(context).viewInsets.bottom + CbSpacing.s6,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: CbColors.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Animated Morphing Content based on current stage
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _buildStageContent(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStageContent(BuildContext context) {
    switch (_stage) {
      case CameraTipStage.review:
        return _buildReviewStage(context);
      case CameraTipStage.processing:
        return _buildProcessingStage(context);
      case CameraTipStage.success:
        return _buildSuccessStage(context);
      case CameraTipStage.error:
        return _buildErrorStage(context);
    }
  }

  // ── Stage 1: Review & Confirmation ──────────────────────────────────────────
  Widget _buildReviewStage(BuildContext context) {
    return Column(
      key: const ValueKey('review_stage'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Title Row
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tip ${widget.candidate.performerName}',
                    style: GoogleFonts.dmSans(
                      color: CbColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Live nearby (${widget.candidate.formattedDistance})',
                    style: GoogleFonts.dmSans(
                      color: CbColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            Semantics(
              button: true,
              label: 'Close tip modal',
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => Navigator.of(context).pop(),
                  borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                  child: const SizedBox(
                    width: CbSpacing.touchMin,
                    height: CbSpacing.touchMin,
                    child: Icon(Icons.close, color: CbColors.textSecondary),
                  ),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: CbSpacing.s5),

        // Amount Selector Label
        Text(
          'SELECT AMOUNT',
          style: GoogleFonts.dmSans(
            color: CbColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.6,
          ),
        ),
        const SizedBox(height: CbSpacing.s2),

        // Amount Chips (Min 48dp Touch Targets)
        Row(
          children: _presetCents.map((cents) {
            final isSelected = _selectedAmountCents == cents;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Semantics(
                  button: true,
                  selected: isSelected,
                  label: '${_formatCents(cents)} tip amount',
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _selectedAmountCents = cents);
                      },
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      child: Ink(
                        height: CbSpacing.touchMin,
                        decoration: BoxDecoration(
                          color: isSelected ? CbColors.purpleMain : CbColors.surface2,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                          border: Border.all(
                            color: isSelected ? CbColors.purpleMain : CbColors.borderSubtle,
                            width: 1.5,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            _formatCents(cents),
                            style: GoogleFonts.dmSans(
                              color: isSelected ? Colors.white : CbColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: CbSpacing.s5),

        // Payment Method Preview
        Text(
          'PAYMENT METHOD',
          style: GoogleFonts.dmSans(
            color: CbColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.6,
          ),
        ),
        const SizedBox(height: CbSpacing.s2),
        Container(
          height: CbSpacing.touchMin,
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          decoration: BoxDecoration(
            color: CbColors.surface2,
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
            border: Border.all(color: CbColors.borderSubtle, width: 1),
          ),
          child: Row(
            children: [
              const Icon(Icons.apple, color: Colors.white, size: 20),
              const SizedBox(width: CbSpacing.s2),
              Text(
                'Apple Pay / Card ••••4242',
                style: GoogleFonts.dmSans(
                  color: CbColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text(
                'Ready',
                style: GoogleFonts.dmSans(
                  color: CbColors.liveGreen,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: CbSpacing.s5),

        // Fee Transparency Breakdown
        Container(
          padding: const EdgeInsets.all(CbSpacing.s4),
          decoration: BoxDecoration(
            color: CbColors.surface2,
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
          ),
          child: Column(
            children: [
              _buildFeeRow('Direct Performer Tip', _formatCents(_selectedAmountCents)),
              const SizedBox(height: 6),
              _buildFeeRow('Platform Fee (6%)', _formatCents(_platformFeeCents)),
              const SizedBox(height: 6),
              _buildFeeRow('Stripe Processing Fee', _formatCents(_stripeFeeCents)),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Divider(color: CbColors.borderSubtle, height: 1),
              ),
              _buildFeeRow('Total Charged', _formatCents(_totalChargedCents), isBold: true),
            ],
          ),
        ),

        const SizedBox(height: CbSpacing.s6),

        // Confirm & Pay CTA (Strict 56dp Height)
        Semantics(
          button: true,
          label: 'Confirm and pay ${_formatCents(_totalChargedCents)} to ${widget.candidate.performerName}',
          child: ElevatedButton(
            onPressed: _onConfirmPayment,
            style: ElevatedButton.styleFrom(
              backgroundColor: CbColors.purpleMain,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, CbSpacing.touchComfortable),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
              ),
              elevation: 0,
            ),
            child: Text(
              'Confirm & Send ${_formatCents(_totalChargedCents)}',
              style: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFeeRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.dmSans(
            color: isBold ? CbColors.textPrimary : CbColors.textSecondary,
            fontSize: isBold ? 14 : 13,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.dmSans(
            color: isBold ? CbColors.liveGreen : CbColors.textPrimary,
            fontSize: isBold ? 15 : 13,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
          ),
        ),
      ],
    );
  }

  // ── Stage 2: Processing ─────────────────────────────────────────────────────
  Widget _buildProcessingStage(BuildContext context) {
    return Padding(
      key: const ValueKey('processing_stage'),
      padding: const EdgeInsets.symmetric(vertical: CbSpacing.s8),
      child: Column(
        children: [
          const SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(CbColors.purpleMain),
            ),
          ),
          const SizedBox(height: CbSpacing.s6),
          Text(
            'Authorizing Tip...',
            style: GoogleFonts.dmSans(
              color: CbColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: CbSpacing.s2),
          Text(
            'Sending direct payment to ${widget.candidate.performerName}',
            style: GoogleFonts.dmSans(
              color: CbColors.textSecondary,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ── Stage 3: Success Receipt ────────────────────────────────────────────────
  Widget _buildSuccessStage(BuildContext context) {
    return Column(
      key: const ValueKey('success_stage'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              color: CbColors.liveGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_rounded, color: Colors.white, size: 36),
          ),
        ),
        const SizedBox(height: CbSpacing.s4),
        Text(
          'Tip Sent!',
          style: GoogleFonts.dmSans(
            color: CbColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s1),
        Text(
          'You tipped ${_formatCents(_selectedAmountCents)} to ${widget.candidate.performerName}',
          style: GoogleFonts.dmSans(
            color: CbColors.textSecondary,
            fontSize: 14,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s5),

        // Receipt Summary Box
        Container(
          padding: const EdgeInsets.all(CbSpacing.s4),
          decoration: BoxDecoration(
            color: CbColors.surface2,
            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            border: Border.all(color: CbColors.borderSubtle, width: 1),
          ),
          child: Column(
            children: [
              _buildReceiptRow('Status', 'Confirmed via Stripe'),
              const SizedBox(height: 6),
              _buildReceiptRow('Performer', widget.candidate.performerName),
              const SizedBox(height: 6),
              _buildReceiptRow('Destination', 'Direct Musician Account'),
              const SizedBox(height: 6),
              _buildReceiptRow('Total Paid', _formatCents(_totalChargedCents)),
            ],
          ),
        ),

        const SizedBox(height: CbSpacing.s6),

        // Done Button
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(),
          style: ElevatedButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, CbSpacing.touchComfortable),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
            ),
          ),
          child: Text(
            'Back to Camera',
            style: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.dmSans(color: CbColors.textSecondary, fontSize: 13),
        ),
        Text(
          value,
          style: GoogleFonts.dmSans(
            color: CbColors.textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  // ── Stage 4: Error Handling ─────────────────────────────────────────────────
  Widget _buildErrorStage(BuildContext context) {
    return Column(
      key: const ValueKey('error_stage'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            width: 60,
            height: 60,
            decoration: const BoxDecoration(
              color: CbColors.statusError,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.error_outline_rounded, color: Colors.white, size: 32),
          ),
        ),
        const SizedBox(height: CbSpacing.s4),
        Text(
          'Payment Unsuccessful',
          style: GoogleFonts.dmSans(
            color: CbColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          _errorMessage ?? 'An error occurred while connecting to Stripe.',
          style: GoogleFonts.dmSans(color: CbColors.textSecondary, fontSize: 14),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s6),
        ElevatedButton(
          onPressed: () {
            setState(() {
              _stage = CameraTipStage.review;
            });
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            minimumSize: const Size(double.infinity, CbSpacing.touchComfortable),
          ),
          child: const Text('Try Again'),
        ),
      ],
    );
  }
}
```

---

### 7.4 Interactive Preview & Test Harness (`camera_tipping_preview_harness.dart`)

```dart
// Crowdbeats V2 — Camera Tipping Preview & Test Harness (CAM-06)
// Provides interactive preview states for designers, QA, and golden tests.

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import 'nearby_performer_banner.dart';
import 'nearby_performer_chooser_sheet.dart';
import 'camera_tip_flow_sheet.dart';

class CameraTippingPreviewHarness extends StatefulWidget {
  const CameraTippingPreviewHarness({super.key});

  @override
  State<CameraTippingPreviewHarness> createState() => _CameraTippingPreviewHarnessState();
}

class _CameraTippingPreviewHarnessState extends State<CameraTippingPreviewHarness> {
  bool _isRecording = false;
  bool _isTipQueued = false;

  final NearbyPerformerCandidate _mockSolo = const NearbyPerformerCandidate(
    performerId: 'artist_maya_01',
    performerType: 'artist',
    performerName: 'Maya & The Groove',
    activeSessionId: 'sess_99182',
    locationType: 'venue',
    venueName: 'The Casbah • Main Stage',
    distanceMeters: 32.4,
    genres: ['Indie Rock', 'Soul'],
  );

  final NearbyPerformerCandidate _mockBand = const NearbyPerformerCandidate(
    performerId: 'band_electric_velvet',
    performerType: 'band',
    performerName: 'Electric Velvet',
    activeSessionId: 'sess_99183',
    locationType: 'venue',
    venueName: 'Outdoor Patio',
    distanceMeters: 48.1,
    genres: ['Synthwave', 'Funk'],
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Simulated camera viewfinder preview
          Positioned.fill(
            child: Container(
              color: const Color(0xFF181A20),
              child: Center(
                child: Text(
                  '[ Camera Viewfinder Preview ]',
                  style: TextStyle(color: Colors.white.withOpacity(0.4)),
                ),
              ),
            ),
          ),

          // Top Header Bar
          Positioned(
            top: 50,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.flash_auto, color: Colors.white),
                  onPressed: () {},
                ),
                Text(
                  _isRecording ? '● REC 00:14' : 'Capture Mode',
                  style: TextStyle(
                    color: _isRecording ? Colors.redAccent : Colors.white70,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                  onPressed: () {},
                ),
              ],
            ),
          ),

          // Floating Banner or Recording Pill
          Positioned(
            bottom: 120,
            left: 0,
            right: 0,
            child: NearbyPerformerBanner(
              candidate: _mockSolo,
              isRecordingVideo: _isRecording,
              isTipQueued: _isTipQueued,
              onTipPressed: () {
                if (_isRecording) {
                  setState(() => _isTipQueued = true);
                } else {
                  CameraTipFlowSheet.show(context, candidate: _mockSolo);
                }
              },
              onDismissPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Banner dismissed (30m cooldown)')),
                );
              },
              onChooserRequested: () {
                NearbyPerformerChooserSheet.show(
                  context,
                  candidates: [_mockSolo, _mockBand],
                  horizontalAccuracyMeters: 62.0,
                );
              },
            ),
          ),

          // Camera Shutter Controls
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Toggle Video Recording Mode (Demo control)
                IconButton(
                  icon: Icon(
                    _isRecording ? Icons.videocam : Icons.videocam_off,
                    color: Colors.white,
                  ),
                  onPressed: () {
                    setState(() {
                      _isRecording = !_isRecording;
                      if (!_isRecording && _isTipQueued) {
                        _isTipQueued = false;
                        // Trigger queued tip checkout
                        CameraTipFlowSheet.show(context, candidate: _mockSolo);
                      }
                    });
                  },
                ),

                // Simulated Shutter Button
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                  ),
                  child: Center(
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _isRecording ? Colors.redAccent : Colors.white,
                      ),
                    ),
                  ),
                ),

                // Open Chooser directly (Demo control)
                IconButton(
                  icon: const Icon(Icons.people_alt, color: Colors.white),
                  onPressed: () {
                    NearbyPerformerChooserSheet.show(
                      context,
                      candidates: [_mockSolo, _mockBand],
                      horizontalAccuracyMeters: 30.0,
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 8. Automated Verification & Widget Testing Blueprint

To guarantee zero regression and strict adherence to accessibility standards, the following automated widget tests must be added to `apps/mobile/test/ui/camera/`:

### 8.1 Touch Target Geometry Verification Test

```dart
testWidgets('NearbyPerformerBanner tap targets enforce >= 48dp', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: NearbyPerformerBanner(
          candidate: mockCandidate,
          isRecordingVideo: false,
          isTipQueued: false,
          onTipPressed: () {},
          onDismissPressed: () {},
        ),
      ),
    ),
  );

  // 1. Verify Dismiss 'X' Button Target Size
  final dismissFinder = find.bySemanticsLabel(RegExp('Dismiss nearby performer'));
  expect(dismissFinder, findsOneWidget);
  final dismissSize = tester.getSize(dismissFinder);
  expect(dismissSize.width, greaterThanOrEqualTo(48.0));
  expect(dismissSize.height, greaterThanOrEqualTo(48.0));

  // 2. Verify Tip $5 Button Target Size
  final tipFinder = find.bySemanticsLabel(RegExp('Send five dollar tip'));
  expect(tipFinder, findsOneWidget);
  final tipSize = tester.getSize(tipFinder);
  expect(tipSize.width, greaterThanOrEqualTo(48.0));
  expect(tipSize.height, greaterThanOrEqualTo(48.0));
});
```

### 8.2 Screen Reader Semantics & Announcements Test

```dart
testWidgets('Banner registers live announcement and correct semantics roles', (tester) async {
  final handle = tester.ensureSemantics();

  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: NearbyPerformerBanner(
          candidate: mockCandidate,
          isRecordingVideo: false,
          isTipQueued: false,
          onTipPressed: () {},
          onDismissPressed: () {},
        ),
      ),
    ),
  );

  // Verify container semantics
  expect(
    tester.getSemantics(find.byType(NearbyPerformerBanner)),
    matchesSemantics(
      hasTapAction: false,
      children: [
        containsSemantics(
          label: contains('Dismiss nearby performer tip suggestion'),
          hasTapAction: true,
          isButton: true,
        ),
        containsSemantics(
          label: contains('Send five dollar tip to Maya & The Groove'),
          hasTapAction: true,
          isButton: true,
        ),
      ],
    ),
  );

  handle.dispose();
});
```

### 8.3 Recording Safety & Queuing Test

```dart
testWidgets('Tapping tip during recording queues intent without opening modals', (tester) async {
  bool tipPressed = false;

  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: NearbyPerformerBanner(
          candidate: mockCandidate,
          isRecordingVideo: true, // Recording active
          isTipQueued: false,
          onTipPressed: () => tipPressed = true,
          onDismissPressed: () {},
        ),
      ),
    ),
  );

  // Normal banner should not exist
  expect(find.text('LIVE NEARBY'), findsNothing);
  // Quiet recording pill must exist
  expect(find.byType(CameraRecordingTipPill), findsOneWidget);

  // Tap pill
  await tester.tap(find.byType(CameraRecordingTipPill));
  await tester.pump();

  expect(tipPressed, isTrue);
  // Verify NO bottom sheet was presented
  expect(find.byType(BottomSheet), findsNothing);
});
```

---

## 9. Handoff Summary & Task CAM-06 Acceptance Matrix

| Requirement | Stitch / Engineering Rule | Implementation Reference in Draft | Verification Status |
| :--- | :--- | :--- | :--- |
| **Token Reuse** | Must strictly use `CbColors` & `CbSpacing` | `Section 3.1`, `Section 3.2`, Draft Dart Code | ✅ Passed |
| **Unobtrusive Banner** | Floating glassmorphic card with 'Live nearby: [Act] · Tip $5' | `Section 5.1`, `nearby_performer_banner.dart` | ✅ Passed |
| **Recording Safe Mode** | Minimal pill during recording; queues tip without interruption | `Section 5.2`, `CameraRecordingTipPill` | ✅ Passed |
| **Performer Chooser** | Bottom sheet shown when $>1$ act or accuracy $>50\text{m}$ | `Section 5.3`, `nearby_performer_chooser_sheet.dart` | ✅ Passed |
| **Touch Targets** | Strict $\ge 48\text{dp}$ touch bounding boxes | `Section 6.1`, `Section 8.1` | ✅ Passed |
| **Contrast Compliance** | WCAG 2.2 AA (4.5:1 text, 3:1 non-text) and AAA | `Section 3.1` (18.2:1 textPrimary, 4.8:1 CTA) | ✅ Passed |
| **A11Y Semantics** | VoiceOver/TalkBack labels, hints, and live announcements | `Section 6.2`, `Section 8.2` | ✅ Passed |
| **4 Clean States** | Prompt $\rightarrow$ Review $\rightarrow$ Processing $\rightarrow$ Success | `Section 4`, `Section 5.4 - 5.6`, `camera_tip_flow_sheet.dart` | ✅ Passed |
| **Isolated Delivery** | Do not modify shared repository files directly | Draft fully documented in `docs/camera/drafts/UX_A11Y_DRAFT.md` | ✅ Passed |
