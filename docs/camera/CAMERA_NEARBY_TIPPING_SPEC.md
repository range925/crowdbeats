# Crowdbeats V2 — Camera-Triggered Nearby Performer Tipping Specification

## 1. Executive Summary & Product Architecture

Crowdbeats adds an in-app camera tipping entry point designed for live music environments:
- A Fan or Guest opens the camera inside the Crowdbeats app ("Capture the music" entry from Discovery or Performer pages) to take a photo or video.
- With location permission granted, Crowdbeats periodically resolves the fan's coarse location against active performer check-in sessions.
- When an active Solo Musician or Band is verified nearby (within 100 meters), an unobtrusive in-app banner appears: `"Live nearby: [Act Name] · Tip $5"`.
- During video recording, the UI remains non-intrusive and quiet. Any tip tap queues checkout until recording has stopped and media is safely finalized.
- Tapping the banner initiates the tipping flow with an editable default amount of \$5.00 USD, transparent 6% platform fee + Stripe fees, and authoritative confirmation.
- If more than 1 live act is detected within 100m, or if the device's horizontal accuracy is coarser than 50 meters, a Performer Chooser bottom sheet is presented instead of auto-suggesting a single act.
- Unauthenticated Guests can proceed seamlessly: their intended tip and captured media draft are safely held in `PendingTipContext` across login/signup.

---

## 2. Hard Invariants & Privacy Guardrails

1. **GPS-Only Proximity (No Surveillance / No Biometrics):**
   - Matching relies exclusively on geospatial proximity and active session check-ins.
   - **NO** facial recognition, **NO** audio fingerprinting, **NO** media file content scanning or frame analysis.
   - Camera frames are rendered locally in the viewfinder; never transmitted to servers for discovery.

2. **Media Preservation & Zero Watermarking:**
   - Overlays, banners, reticles, or tipping badges must **NEVER** be composited, rendered, or saved into the user's photo or video files.
   - Media capture remains pristine and is saved directly to local device storage.

3. **Recording Safety & Tipping Queue:**
   - During active video recording, banner taps do not interrupt the camera stream or open full-screen modals.
   - The tip intent is queued in `QueuedCameraTipIntent`. Once recording terminates and the video file is safely flushed to disk, the tip sheet opens automatically.

4. **Throttling, Deduplication & Battery Conservation:**
   - Max 1 nearby check every 15 seconds.
   - Movement trigger threshold: min 25 meters before requerying.
   - Maximum search radius: 100 meters. Max location sample age: 30 seconds.
   - Horizontal accuracy threshold: if `accuracyMeters > 50`, show Performer Chooser list instead of single prompt.
   - Frequency capping: Max 1 prompt per act/session per camera session.
   - Dismiss cooldown: 30 minutes if user taps close on a suggestion.
   - Suppression: Suppress prompt if user already tipped this session.

5. **Entity & Multi-Tenant Payout Integrity:**
   - For Band check-ins, tips are directed to the Band collective entity/destination, not member UIDs.
   - Blocked entities (in either direction) are excluded from discovery results.
   - Restricted entities are allowed to receive tips, but quiet routing applies.

---

## 3. Contracts & Data Models

### 3.1 Contract Definition (`packages/contracts/src/camera/index.ts`)

```typescript
export interface NearbyLivePerformerQuery {
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: string; // ISO 8601
}

export interface NearbyLivePerformerCandidate {
  performerId: string;
  performerType: 'artist' | 'band';
  performerName: string;
  performerAvatarUrl?: string;
  activeSessionId: string;
  locationType: 'venue' | 'street';
  venueName?: string;
  distanceMeters: number;
  genres: string[];
  bio?: string;
}

export interface GetNearbyLivePerformersResponse {
  candidates: NearbyLivePerformerCandidate[];
  requiresChooser: boolean; // true if >1 candidate or accuracyMeters > 50
  queriedAt: string;
}
```

### 3.2 Mobile Models (`apps/mobile/lib/data/models/camera_tipping.dart`)

```dart
class NearbyPerformerCandidate {
  final String performerId;
  final String performerType; // 'artist' | 'band'
  final String performerName;
  final String? performerAvatarUrl;
  final String activeSessionId;
  final String locationType;
  final String? venueName;
  final double distanceMeters;
  final List<String> genres;
}

class QueuedCameraTipIntent {
  final NearbyPerformerCandidate candidate;
  final int defaultAmountCents;
  final DateTime queuedAt;
  final String? mediaDraftPath;
}
```

---

## 4. UI/UX Flow & Stitch Compliance

1. **Camera Screen (`CameraCaptureScreen`):**
   - Fullscreen viewfinder preview.
   - Header: Close button, Flash toggle, Lens switch.
   - Bottom Floating Banner:
     - Normal Mode: Glassmorphic dark card with green live dot, act avatar, text `"Live nearby: [Act Name] · Tip $5"`, `Tip $5` CTA, and `Dismiss` (X).
     - Recording Mode: Minimal quiet pill `"Performer nearby · Tip queued"` with zero screen obstruction.
   - Footer: Shutter button (tap for photo, hold/tap for video), Mode switcher (Photo / Video).

2. **Performer Chooser Bottom Sheet (`NearbyPerformerChooserSheet`):**
   - Title: "Performers Playing Nearby"
   - Subtitle: "Select who you'd like to support"
   - List of candidates sorted by distance with Live badge, genres, and distance indicator.

3. **Tip Review & Confirmation (`TipFlowScreen`):**
   - Pre-filled with candidate and $5.00 default.
   - Quick amount selectors ($5, $10, $20, custom).
   - Fee breakdown: Base tip + 6% platform fee + Stripe processing fee.
   - Explicit "Send Tip" action.
