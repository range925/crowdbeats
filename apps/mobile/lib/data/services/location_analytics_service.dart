// Crowdbeats V2 — Privacy-Preserving Location Analytics Service (Phase 3)
//
// Analytics constraints:
// - Track permission funnel events and state transitions ONLY.
// - NEVER attach exact coordinates, address, venue coordinates, or raw accuracy
//   to analytics or crash events.
// - All payloads are validated against a strict redaction whitelist before recording.

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'location_provider.dart';

@immutable
class LocationAnalyticsEvent {
  const LocationAnalyticsEvent({
    required this.name,
    required this.parameters,
    required this.timestamp,
  });

  final String name;
  final Map<String, dynamic> parameters;
  final DateTime timestamp;

  @override
  String toString() => 'LocationAnalyticsEvent($name, $parameters)';
}

/// Abstract analytics service interface for recording location and privacy lifecycle events.
abstract class LocationAnalyticsService {
  List<LocationAnalyticsEvent> get recordedEvents;

  void trackPermissionDisclosureViewed({
    required String role,
    required String mode,
  });

  void trackPermissionRequested({
    required String targetMode,
  });

  void trackPermissionStateChanged({
    required LocationPermissionState from,
    required LocationPermissionState to,
  });

  void trackAudienceVisibilityPromptViewed({
    required String sessionId,
  });

  void trackAudienceVisibilityOptIn({
    required String tier,
  });

  void trackAudienceVisibilityRevoked({
    required String reason,
  });

  void trackMobileSharingPaused({
    required String sessionId,
  });

  void trackMobileSharingResumed({
    required String sessionId,
  });

  void trackTemporaryAccuracyRequested({
    required String purposeKey,
    required bool granted,
  });

  void clear();
}

/// Production & testable implementation enforcing strict privacy redaction.
class DefaultLocationAnalyticsService implements LocationAnalyticsService {
  final List<LocationAnalyticsEvent> _events = [];

  @override
  List<LocationAnalyticsEvent> get recordedEvents => List.unmodifiable(_events);

  // Forbidden parameter names that could leak private coordinates or identifiers.
  static const _forbiddenKeys = {
    'lat',
    'latitude',
    'lng',
    'longitude',
    'address',
    'street',
    'venueCoordinates',
    'accuracyMeters',
    'accuracy',
    'rawPoint',
    'rawHistory',
    'deviceId',
    'hardwareId',
  };

  void _record(String name, Map<String, dynamic> params) {
    // Defense-in-depth: assert no forbidden fields are attached.
    for (final key in params.keys) {
      assert(
        !_forbiddenKeys.contains(key.toLowerCase()),
        'Privacy Violation: $key is forbidden in location analytics',
      );
      if (_forbiddenKeys.contains(key.toLowerCase())) {
        debugPrint('[LocationAnalytics] Rejected forbidden key: $key');
        return;
      }
    }

    final event = LocationAnalyticsEvent(
      name: name,
      parameters: Map.unmodifiable(params),
      timestamp: DateTime.now(),
    );
    _events.add(event);
    debugPrint('[LocationAnalytics] $event');
  }

  @override
  void trackPermissionDisclosureViewed({
    required String role,
    required String mode,
  }) {
    _record('location_permission_disclosure_viewed', {
      'role': role,
      'mode': mode,
    });
  }

  @override
  void trackPermissionRequested({
    required String targetMode,
  }) {
    _record('location_permission_requested', {
      'targetMode': targetMode,
    });
  }

  @override
  void trackPermissionStateChanged({
    required LocationPermissionState from,
    required LocationPermissionState to,
  }) {
    _record('location_permission_state_changed', {
      'fromState': from.name,
      'toState': to.name,
    });
  }

  @override
  void trackAudienceVisibilityPromptViewed({
    required String sessionId,
  }) {
    _record('audience_visibility_prompt_viewed', {
      'sessionId': sessionId,
    });
  }

  @override
  void trackAudienceVisibilityOptIn({
    required String tier,
  }) {
    _record('audience_visibility_opt_in', {
      'tier': tier,
    });
  }

  @override
  void trackAudienceVisibilityRevoked({
    required String reason,
  }) {
    _record('audience_visibility_revoked', {
      'reason': reason,
    });
  }

  @override
  void trackMobileSharingPaused({
    required String sessionId,
  }) {
    _record('mobile_sharing_paused', {
      'sessionId': sessionId,
    });
  }

  @override
  void trackMobileSharingResumed({
    required String sessionId,
  }) {
    _record('mobile_sharing_resumed', {
      'sessionId': sessionId,
    });
  }

  @override
  void trackTemporaryAccuracyRequested({
    required String purposeKey,
    required bool granted,
  }) {
    _record('temporary_accuracy_requested', {
      'purposeKey': purposeKey,
      'granted': granted,
    });
  }

  @override
  void clear() {
    _events.clear();
  }
}

/// Riverpod provider for [LocationAnalyticsService].
final locationAnalyticsServiceProvider =
    Provider<LocationAnalyticsService>((ref) {
  return DefaultLocationAnalyticsService();
});
