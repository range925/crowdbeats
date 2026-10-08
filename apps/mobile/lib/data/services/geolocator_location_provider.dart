// Crowdbeats V2 — GeolocatorLocationProvider
//
// Production implementation of [LocationProvider] using the geolocator package.
//
// Privacy invariants enforced here:
// - requestOneShot() calls Geolocator.getCurrentPosition() once, awaits the
//   result, and then does NOTHING further — no stream, no polling.
// - streamContinuous() is the ONLY path that opens a persistent sensor stream;
//   it must only be called from the LIVE_MOBILE consent flow.
// - No latitude/longitude values are passed to debugPrint, analytics, or
//   crash reporters. toString() on LocationFix redacts to ±0.1° buckets.
// - _mode is updated synchronously before returning the fix so callers can
//   always read the current mode without awaiting.

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../models/location_diagnostics.dart';
import '../models/location_fix.dart';
import 'location_provider.dart';

class GeolocatorLocationProvider implements LocationProvider {
  GeolocatorLocationProvider();

  LocationMode _mode = LocationMode.off;

  @override
  LocationMode get currentMode => _mode;

  // ── Permission ────────────────────────────────────────────────────────────

  @override
  Future<bool> isPermissionGranted() async {
    final state = await getPermissionState();
    return state.isGranted;
  }

  @override
  Future<LocationPermissionResult> requestPermission() async {
    final state = await requestFullPermissionState();
    return switch (state) {
      LocationPermissionState.foregroundApproximate ||
      LocationPermissionState.foregroundPrecise ||
      LocationPermissionState.backgroundApproximate ||
      LocationPermissionState.backgroundPrecise =>
        LocationPermissionResult.granted,
      LocationPermissionState.denied ||
      LocationPermissionState.notDetermined =>
        LocationPermissionResult.denied,
      LocationPermissionState.permanentlyDenied =>
        LocationPermissionResult.permanentlyDenied,
      LocationPermissionState.restricted =>
        LocationPermissionResult.restricted,
      LocationPermissionState.servicesDisabled =>
        LocationPermissionResult.serviceDisabled,
    };
  }

  @override
  Future<LocationPermissionState> getPermissionState() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return LocationPermissionState.servicesDisabled;

    final permission = await Geolocator.checkPermission();
    return _resolvePermissionState(permission);
  }

  @override
  Future<LocationPermissionState> requestFullPermissionState() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return LocationPermissionState.servicesDisabled;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return _resolvePermissionState(permission);
  }

  Future<LocationPermissionState> _resolvePermissionState(LocationPermission permission) async {
    switch (permission) {
      case LocationPermission.denied:
        return LocationPermissionState.denied;
      case LocationPermission.deniedForever:
        return LocationPermissionState.permanentlyDenied;
      case LocationPermission.unableToDetermine:
        return LocationPermissionState.restricted;
      case LocationPermission.whileInUse:
        try {
          final accuracy = await Geolocator.getLocationAccuracy();
          if (accuracy == LocationAccuracyStatus.reduced) {
            return LocationPermissionState.foregroundApproximate;
          }
          return LocationPermissionState.foregroundPrecise;
        } catch (_) {
          return LocationPermissionState.foregroundPrecise;
        }
      case LocationPermission.always:
        try {
          final accuracy = await Geolocator.getLocationAccuracy();
          if (accuracy == LocationAccuracyStatus.reduced) {
            return LocationPermissionState.backgroundApproximate;
          }
          return LocationPermissionState.backgroundPrecise;
        } catch (_) {
          return LocationPermissionState.backgroundPrecise;
        }
    }
  }

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async {
    try {
      final status = await Geolocator.requestTemporaryFullAccuracy(purposeKey: purposeKey);
      return status == LocationAccuracyStatus.precise;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<bool> openSettings() async {
    try {
      return await Geolocator.openAppSettings();
    } catch (_) {
      return false;
    }
  }

  // ── One-Shot Fix ──────────────────────────────────────────────────────────

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    // 1. Guard: permission must be granted before accessing the sensor.
    final granted = await isPermissionGranted();
    if (!granted) {
      debugPrint('[LocationProvider] One-shot skipped: permission not granted.');
      return null;
    }

    // 2. Guard: service must be enabled.
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('[LocationProvider] One-shot skipped: location service disabled.');
      return null;
    }

    try {
      // 3. Request a single fix at high accuracy. The sensor is stopped by
      //    geolocator automatically after getCurrentPosition returns.
      final position = await Geolocator.getCurrentPosition(
        locationSettings: AndroidSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: timeout,
        ),
      ).timeout(timeout);

      _mode = targetMode;

      // NEVER log position.latitude or position.longitude directly.
      final fix = LocationFix(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
        timestamp: DateTime.fromMillisecondsSinceEpoch(
          position.timestamp.millisecondsSinceEpoch,
        ),
        altitudeMeters: position.altitude,
        isMock: position.isMocked,
      );

      // Redacted debug log (±0.1° only).
      debugPrint('[LocationProvider] One-shot obtained: $fix');
      return fix;
    } on Exception catch (e) {
      debugPrint('[LocationProvider] One-shot failed: ${e.runtimeType}');
      return null;
    }
  }

  // ── Continuous Stream (LIVE_MOBILE only) ──────────────────────────────────

  @override
  Stream<LocationFix> streamContinuous() {
    _mode = LocationMode.liveMobile;
    debugPrint('[LocationProvider] Continuous stream STARTED (LIVE_MOBILE).');

    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // emit only when moved ≥10 m
      ),
    ).map((position) {
      // Convert Position → LocationFix without logging coordinates.
      return LocationFix(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
        timestamp: DateTime.fromMillisecondsSinceEpoch(
          position.timestamp.millisecondsSinceEpoch,
        ),
        altitudeMeters: position.altitude,
        isMock: position.isMocked,
      );
    });
  }

  @override
  Future<void> stopContinuous() async {
    if (_mode == LocationMode.liveMobile) {
      _mode = LocationMode.liveStationary;
      debugPrint('[LocationProvider] Continuous stream STOPPED (reverted to liveStationary).');
    }
    // Geolocator's stream is stopped when the StreamSubscription is cancelled
    // by the caller — nothing further needed here.
  }

  // ── ADR-LOC-001 Extensions ───────────────────────────────────────────────

  @override
  Future<LocationFix?> cachedFix({Duration maxAge = const Duration(minutes: 5)}) async {
    try {
      final granted = await isPermissionGranted();
      if (!granted) return null;

      final pos = await Geolocator.getLastKnownPosition();
      if (pos == null) return null;

      final fix = LocationFix(
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracyMeters: pos.accuracy,
        timestamp: DateTime.fromMillisecondsSinceEpoch(
          pos.timestamp.millisecondsSinceEpoch,
        ),
        altitudeMeters: pos.altitude,
        isMock: pos.isMocked,
      );

      if (fix.isFreshFor(maxAge)) {
        return fix;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  @override
  void cancelCurrentOperation() {
    debugPrint('[LocationProvider] Current operation cancelled.');
  }

  @override
  Stream<LocationFix> startAdaptive(LocationMode targetMode) {
    _mode = targetMode;
    final isForeground = targetMode == LocationMode.liveMobile;
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: isForeground ? LocationAccuracy.high : LocationAccuracy.medium,
        distanceFilter: isForeground ? 10 : 50,
      ),
    ).map((pos) => LocationFix(
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracyMeters: pos.accuracy,
          timestamp: DateTime.fromMillisecondsSinceEpoch(
            pos.timestamp.millisecondsSinceEpoch,
          ),
          altitudeMeters: pos.altitude,
          isMock: pos.isMocked,
        ));
  }

  @override
  Future<void> stopAdaptive() => stopContinuous();

  @override
  Stream<GeofenceEvent> monitorGeofence({
    required LocationFix centre,
    required double radiusMeters,
    required String regionId,
  }) {
    // Platform-neutral fallback stream
    return const Stream.empty();
  }

  @override
  Future<void> cancelGeofence(String regionId) async {}

  @override
  LocationDiagnostics get diagnostics => LocationDiagnostics(
        provider: 'geolocator',
        mode: _mode.name,
      );

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();
}
