// Crowdbeats V2 — LocationProvider Interface
//
// Testable abstraction over the device location sensor (geolocator on mobile,
// browser Geolocation API on web).
//
// Non-negotiable invariants (enforced here; verified in tests):
// - Permission prompts are SEPARATE from sensor access.
//   isPermissionGranted() and requestPermission() never touch the sensor.
// - requestOneShot() obtains a SINGLE fix then stops the sensor immediately.
//   It is the only mode used for Fan Near Me discovery and performer check-in.
// - streamContinuous() is ONLY for LIVE_MOBILE mode; never started implicitly.
// - LocationMode tracks the highest-powered mode currently active.
// - This interface is pure Dart — no Flutter framework dependency — so it can
//   be tested in plain dart test (no widget harness needed).

import '../models/location_diagnostics.dart';
import '../models/location_fix.dart';

// ── Geofence & Integrity Events ───────────────────────────────────────────────

enum GeofenceEvent {
  entered,
  exited,
}

enum LocationIntegrityRisk {
  none,
  low,
  medium,
  high,
}

// ── Mode Ladder ───────────────────────────────────────────────────────────────
// Progression: off → discovery → checkIn → liveStationary → liveMobile
// Downgrade is always allowed; upgrade requires explicit user action.

enum LocationMode {
  /// GPS is off; no sensor access has been requested.
  off,

  /// One-shot fix was obtained for city-level discovery (Near Me).
  /// Sensor has stopped after the fix.
  discovery,

  /// One-shot fix was obtained to verify proximity to a venue for check-in.
  /// Sensor has stopped after the fix.
  checkIn,

  /// Performer's session is live at a fixed location.
  /// Venue GeoPoint (or one street fix) is published; GPS is off.
  liveStationary,

  /// Performer's session is live with continuous GPS (optional, explicit opt-in).
  /// Visible indicator must be shown at all times.
  liveMobile,
}

// ── Permission Result ─────────────────────────────────────────────────────────

enum LocationPermissionResult {
  /// OS permission is already granted; sensor may be used.
  granted,

  /// OS permission is denied but can be requested via the system dialog.
  denied,

  /// OS permission is permanently denied; must be granted in system settings.
  permanentlyDenied,

  /// Permission is restricted (iOS parental controls or MDM policy).
  restricted,

  /// The device has no location hardware.
  serviceDisabled,
}

// ── Full 9 Permission States (Phase 3) ────────────────────────────────────────

enum LocationPermissionState {
  /// Permission has never been requested from the user.
  notDetermined,

  /// Location services are toggled off at the OS/hardware level.
  servicesDisabled,

  /// Permission was denied in the standard system prompt (can prompt again).
  denied,

  /// Permission was permanently denied / "Don't ask again" selected.
  permanentlyDenied,

  /// Device policy or parental controls prevent location access.
  restricted,

  /// Foreground (While in Use) permission granted with Reduced / Approximate accuracy.
  foregroundApproximate,

  /// Foreground (While in Use) permission granted with Full / Precise accuracy.
  foregroundPrecise,

  /// Background (Always) permission granted with Reduced / Approximate accuracy.
  backgroundApproximate,

  /// Background (Always) permission granted with Full / Precise accuracy.
  backgroundPrecise;

  /// Whether any level of location access is currently granted.
  bool get isGranted =>
      this == LocationPermissionState.foregroundApproximate ||
      this == LocationPermissionState.foregroundPrecise ||
      this == LocationPermissionState.backgroundApproximate ||
      this == LocationPermissionState.backgroundPrecise;

  /// Whether full / precise accuracy is available.
  bool get isPrecise =>
      this == LocationPermissionState.foregroundPrecise ||
      this == LocationPermissionState.backgroundPrecise;

  /// Whether accuracy is reduced / coarse / approximate.
  bool get isApproximate =>
      this == LocationPermissionState.foregroundApproximate ||
      this == LocationPermissionState.backgroundApproximate;

  /// Whether background tracking capability is granted.
  bool get isBackground =>
      this == LocationPermissionState.backgroundApproximate ||
      this == LocationPermissionState.backgroundPrecise;

  /// Whether an in-app system permission request can still be shown.
  bool get canRequestInApp =>
      this == LocationPermissionState.notDetermined ||
      this == LocationPermissionState.denied;

  /// Whether the user must be redirected to system settings.
  bool get requiresSystemSettings =>
      this == LocationPermissionState.permanentlyDenied ||
      this == LocationPermissionState.servicesDisabled;

  /// Human-readable label for UI status badges.
  String get label => switch (this) {
        LocationPermissionState.notDetermined => 'Not Requested',
        LocationPermissionState.servicesDisabled => 'Services Disabled',
        LocationPermissionState.denied => 'Denied',
        LocationPermissionState.permanentlyDenied => 'Blocked in Settings',
        LocationPermissionState.restricted => 'Restricted by Policy',
        LocationPermissionState.foregroundApproximate => 'Approximate (While Using)',
        LocationPermissionState.foregroundPrecise => 'Precise (While Using)',
        LocationPermissionState.backgroundApproximate => 'Approximate (Always)',
        LocationPermissionState.backgroundPrecise => 'Precise (Always)',
      };

  /// Non-color status semantic description for screen readers.
  String get accessibilityDescription => switch (this) {
        LocationPermissionState.notDetermined => 'Location permission has not been requested.',
        LocationPermissionState.servicesDisabled => 'Device location services are turned off.',
        LocationPermissionState.denied => 'Location access was denied. You can allow it when ready.',
        LocationPermissionState.permanentlyDenied => 'Location access is blocked. Open Settings to enable.',
        LocationPermissionState.restricted => 'Location access is restricted by device administrator.',
        LocationPermissionState.foregroundApproximate => 'Location is granted with approximate neighborhood accuracy while using the app.',
        LocationPermissionState.foregroundPrecise => 'Location is granted with precise accuracy while using the app.',
        LocationPermissionState.backgroundApproximate => 'Location is granted with approximate accuracy in background.',
        LocationPermissionState.backgroundPrecise => 'Location is granted with precise accuracy in background.',
      };
}

// ── Abstract Interface ────────────────────────────────────────────────────────

/// Testable abstraction over the device location sensor.
///
/// Implementations:
/// - [GeolocatorLocationProvider] — production (geolocator package)
/// - [MockLocationProvider] — test double injected via Riverpod
abstract class LocationProvider {
  /// Returns the currently active [LocationMode] without touching the sensor.
  LocationMode get currentMode;

  /// Returns `true` when location permission is already granted.
  /// Does NOT trigger a permission prompt or sensor access.
  Future<bool> isPermissionGranted();

  /// Requests the OS location permission dialog.
  /// Returns the result; does NOT access the sensor.
  /// If permission was already granted, returns [LocationPermissionResult.granted]
  /// without showing a dialog.
  Future<LocationPermissionResult> requestPermission();

  /// Returns the full, granular [LocationPermissionState] (one of 9 states).
  Future<LocationPermissionState> getPermissionState();

  /// Requests foreground permission and returns the new [LocationPermissionState].
  Future<LocationPermissionState> requestFullPermissionState();

  /// Requests a temporary precision upgrade (iOS 14+ / Android 12+) when
  /// venue check-in proximity verification cannot succeed with reduced accuracy.
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey});

  /// Opens the device system settings page for the application.
  Future<bool> openSettings();

  /// Obtains a single high-accuracy GPS fix and immediately stops the sensor.
  ///
  /// Sets [currentMode] to [LocationMode.discovery] or [LocationMode.checkIn]
  /// per the caller's context (callers pass [targetMode]).
  ///
  /// Returns `null` if:
  /// - Permission is not granted
  /// - The sensor times out (>15 s)
  /// - The device has no location service
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  });

  /// Returns a stream of continuous GPS fixes.
  ///
  /// MUST only be called after the user has EXPLICITLY opted in to LIVE_MOBILE
  /// mode — not by any automatic or background path.
  ///
  /// Callers are responsible for cancelling the subscription when the live
  /// session ends, the app is backgrounded, or the user opts out.
  Stream<LocationFix> streamContinuous();

  /// Signals that the continuous stream is no longer needed.
  /// Implementations must stop the sensor and set [currentMode] to
  /// [LocationMode.liveStationary].
  Future<void> stopContinuous();

  /// Returns the last cached fix without waking the GPS sensor.
  /// Returns null if no fix has been obtained or if the cached fix is older than [maxAge].
  Future<LocationFix?> cachedFix({Duration maxAge = const Duration(minutes: 5)});

  /// Cancels any in-flight one-shot or discovery operation immediately.
  void cancelCurrentOperation();

  /// Requests adaptive location updates suited to the [targetMode].
  /// - LIVE_MOBILE_FOREGROUND: high accuracy, 10 m filter, 5 s interval
  /// - LIVE_MOBILE_BACKGROUND: balanced power, 50 m filter, 30 s interval
  /// Contract: caller MUST call stopAdaptive() or stopContinuous() when done.
  Stream<LocationFix> startAdaptive(LocationMode targetMode);

  /// Stops adaptive location updates and sets [currentMode] to [LocationMode.liveStationary].
  Future<void> stopAdaptive();

  /// Registers a circular geofence centered on [centre] with radius [radiusMeters].
  /// Emits [GeofenceEvent.exited] only as an internal re-verification / termination signal.
  /// Never used as a public location or movement feed.
  Stream<GeofenceEvent> monitorGeofence({
    required LocationFix centre,
    required double radiusMeters,
    required String regionId,
  });

  /// Cancels and removes the geofence identified by [regionId].
  Future<void> cancelGeofence(String regionId);

  /// Real-time operational diagnostics without coordinates.
  LocationDiagnostics get diagnostics;

  /// Returns a snapshot map of operational diagnostics for crash reporting or telemetry.
  /// Never contains coordinates, accuracy meters, or street addresses.
  Map<String, Object?> diagnosticsSnapshot();
}
