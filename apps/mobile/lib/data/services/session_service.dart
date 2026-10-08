// Crowdbeats V2 — SessionService (Phase B)
//
// Wraps the cloud_functions callable layer for performer session management.
//
// Architecture invariants:
//   - No client writes to Firestore directly for session state (server-authoritative).
//   - Client never passes or stores exact GPS coordinates beyond what is needed to
//     call the server; coordinates are obtained once, sent, then discarded.
//   - LIVE_MOBILE streaming is phase D; this service handles LIVE_STATIONARY only.

import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

// ── Result types ──────────────────────────────────────────────────────────────

/// Returned after a successful startSession call.
@immutable
class SessionStartResult {
  const SessionStartResult({
    required this.sessionId,
    required this.locationType,
    required this.endsAt,
  });

  final String sessionId;
  final String locationType; // 'venue' | 'street'
  final DateTime endsAt;

  factory SessionStartResult.fromData(Map<String, dynamic> data) {
    return SessionStartResult(
      sessionId: data['sessionId'] as String,
      locationType: data['locationType'] as String,
      endsAt: DateTime.parse(data['endsAt'] as String),
    );
  }
}

/// Parameters for starting a venue session.
@immutable
class VenueSessionParams {
  const VenueSessionParams({
    required this.performerName,
    required this.performerType,
    required this.venueId,
    required this.venueName,
  });

  final String performerName;
  final String performerType; // 'artist' | 'band_member'
  final String venueId;
  final String venueName;
}

/// Parameters for starting a street session.
@immutable
class StreetSessionParams {
  const StreetSessionParams({
    required this.performerName,
    required this.performerType,
    required this.lat,
    required this.lng,
    this.spotDescription,
    this.hasPermit = false,
  });

  final String performerName;
  final String performerType; // 'artist' | 'band_member'
  final double lat;
  final double lng;
  final String? spotDescription;
  final bool hasPermit;
}

// ── Service ───────────────────────────────────────────────────────────────────

/// Service wrapping the Cloud Functions session callables.
///
/// Prefer injecting this via [sessionServiceProvider] for testability.
class SessionService {
  SessionService({FirebaseFunctions? functions}) : _injectedFunctions = functions;

  final FirebaseFunctions? _injectedFunctions;

  /// Returns the injected instance (for tests) or the real Firebase singleton.
  /// Never called by FakeSessionService because it overrides all public methods.
  FirebaseFunctions get _functions => _injectedFunctions ?? FirebaseFunctions.instance;

  // ── startSession — venue ────────────────────────────────────────────────────

  /// Starts a LIVE_STATIONARY venue session.
  ///
  /// The server reads the venue's canonical GeoPoint from Firestore — the client
  /// never needs to supply raw GPS coordinates for venue mode.
  ///
  /// Throws [FirebaseFunctionsException] on validation failure or conflict.
  Future<SessionStartResult> startVenueSession(VenueSessionParams params) async {
    final callable = _functions.httpsCallable('startSession');
    final result = await callable.call<Map<String, dynamic>>({
      'performerName': params.performerName,
      'performerType': params.performerType,
      'locationType': 'venue',
      'venueId': params.venueId,
      'venueName': params.venueName,
    });
    return SessionStartResult.fromData(result.data);
  }

  // ── startSession — street ───────────────────────────────────────────────────

  /// Starts a LIVE_STATIONARY street/permit session.
  ///
  /// The client supplies a single GPS fix obtained immediately before this call;
  /// the coordinate is never stored on the device after the call returns.
  ///
  /// Throws [FirebaseFunctionsException] on validation failure or conflict.
  Future<SessionStartResult> startStreetSession(StreetSessionParams params) async {
    final callable = _functions.httpsCallable('startSession');
    final result = await callable.call<Map<String, dynamic>>({
      'performerName': params.performerName,
      'performerType': params.performerType,
      'locationType': 'street',
      'lat': params.lat,
      'lng': params.lng,
      if (params.spotDescription != null)
        'spotDescription': params.spotDescription,
      'hasPermit': params.hasPermit,
    });
    return SessionStartResult.fromData(result.data);
  }

  // ── endSession ──────────────────────────────────────────────────────────────

  /// Ends an active session. Idempotent — safe to call even if already ended.
  ///
  /// Throws [FirebaseFunctionsException] on auth failure or if sessionId is invalid.
  Future<void> endSession(String sessionId) async {
    final callable = _functions.httpsCallable('endSession');
    await callable.call<Map<String, dynamic>>({'sessionId': sessionId});
  }

  // ── heartbeat ───────────────────────────────────────────────────────────────

  /// Extends the session's server-side TTL by 2h (capped at startedAt+12h).
  ///
  /// No GPS is involved. Returns the updated [DateTime] for the new [endsAt],
  /// or null if the session is no longer live (graceful no-op).
  Future<DateTime?> heartbeat(String sessionId) async {
    final callable = _functions.httpsCallable('heartbeatSession');
    final result = await callable.call<Map<String, dynamic>>({
      'sessionId': sessionId,
    });
    final endsAtStr = result.data['endsAt'] as String?;
    return endsAtStr != null ? DateTime.parse(endsAtStr) : null;
  }
}
