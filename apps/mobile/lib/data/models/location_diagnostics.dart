// Crowdbeats V2 — Location Diagnostics Snapshot Model
//
// Exposes operational metrics for telemetry, crash reports, and live debugging
// WITHOUT disclosing raw coordinates, accuracy meters, or street addresses.
//
// Privacy Invariant:
// - MUST NOT contain latitude, longitude, altitude, speed, bearing, or address.
// - Asserts this invariant at construction and in toJson().

class LocationDiagnostics {
  const LocationDiagnostics({
    required this.provider,
    required this.mode,
    this.sampleCount = 0,
    this.acceptedCount = 0,
    this.rejectedCount = 0,
    this.activeDurationMs = 0,
    this.averageRequestedIntervalMs = 0,
    this.uploadCount = 0,
    this.cleanupStatus = 'idle',
    this.isForegroundServiceRunning = false,
    this.geofenceRegistered = false,
    this.backpressureQueueSize = 0,
    this.mockRiskDetected = false,
  });

  /// Name of the location provider engine (e.g. 'android_fused', 'geolocator', 'fake').
  final String provider;

  /// Current operating location mode name (e.g. 'off', 'discovery', 'checkIn', 'liveStationary', 'liveMobile').
  final String mode;

  /// Total number of raw samples received from the location sensor.
  final int sampleCount;

  /// Total number of samples accepted after passing freshness and accuracy filters.
  final int acceptedCount;

  /// Total number of samples rejected (stale, low accuracy, excessive jitter, mock).
  final int rejectedCount;

  /// Time in milliseconds location tracking has been active.
  final int activeDurationMs;

  /// Current target update interval requested from the OS in milliseconds.
  final int averageRequestedIntervalMs;

  /// Number of location sample batches or fixes successfully uploaded.
  final int uploadCount;

  /// Status of resource teardown ('idle', 'active', 'cleaned_up', 'failed').
  final String cleanupStatus;

  /// Whether an Android foreground service with persistent notification is running.
  final bool isForegroundServiceRunning;

  /// Whether a venue boundary geofence is currently registered with the OS.
  final bool geofenceRegistered;

  /// Current number of samples awaiting upload in the backpressure buffer.
  final int backpressureQueueSize;

  /// Whether any mock location or spoofing risk signals have been observed.
  final bool mockRiskDetected;

  /// Serializes diagnostics to a map for telemetry or crash reports.
  /// Throws an [AssertionError] if any coordinate or address key is present.
  Map<String, Object?> toJson() {
    final map = <String, Object?>{
      'provider': provider,
      'mode': mode,
      'sampleCount': sampleCount,
      'acceptedCount': acceptedCount,
      'rejectedCount': rejectedCount,
      'activeDurationMs': activeDurationMs,
      'averageRequestedIntervalMs': averageRequestedIntervalMs,
      'uploadCount': uploadCount,
      'cleanupStatus': cleanupStatus,
      'isForegroundServiceRunning': isForegroundServiceRunning,
      'geofenceRegistered': geofenceRegistered,
      'backpressureQueueSize': backpressureQueueSize,
      'mockRiskDetected': mockRiskDetected,
    };

    assertZeroCoordinates(map);
    return map;
  }

  /// Strict assertion verifying that no coordinates, accuracy meters, or addresses
  /// leak into the diagnostic representation.
  static void assertZeroCoordinates(Map<String, Object?> data) {
    const forbiddenKeys = [
      'lat',
      'lng',
      'latitude',
      'longitude',
      'altitude',
      'accuracy',
      'accuracyMeters',
      'speed',
      'bearing',
      'heading',
      'address',
      'street',
      'coordinates',
      'rawPoint',
    ];

    for (final key in data.keys) {
      final lower = key.toLowerCase();
      for (final forbidden in forbiddenKeys) {
        if (lower == forbidden.toLowerCase() || lower.contains('coord')) {
          throw AssertionError(
            'PRIVACY VIOLATION: LocationDiagnostics contains prohibited key: $key',
          );
        }
      }
    }
  }

  LocationDiagnostics copyWith({
    String? provider,
    String? mode,
    int? sampleCount,
    int? acceptedCount,
    int? rejectedCount,
    int? activeDurationMs,
    int? averageRequestedIntervalMs,
    int? uploadCount,
    String? cleanupStatus,
    bool? isForegroundServiceRunning,
    bool? geofenceRegistered,
    int? backpressureQueueSize,
    bool? mockRiskDetected,
  }) {
    return LocationDiagnostics(
      provider: provider ?? this.provider,
      mode: mode ?? this.mode,
      sampleCount: sampleCount ?? this.sampleCount,
      acceptedCount: acceptedCount ?? this.acceptedCount,
      rejectedCount: rejectedCount ?? this.rejectedCount,
      activeDurationMs: activeDurationMs ?? this.activeDurationMs,
      averageRequestedIntervalMs:
          averageRequestedIntervalMs ?? this.averageRequestedIntervalMs,
      uploadCount: uploadCount ?? this.uploadCount,
      cleanupStatus: cleanupStatus ?? this.cleanupStatus,
      isForegroundServiceRunning:
          isForegroundServiceRunning ?? this.isForegroundServiceRunning,
      geofenceRegistered: geofenceRegistered ?? this.geofenceRegistered,
      backpressureQueueSize:
          backpressureQueueSize ?? this.backpressureQueueSize,
      mockRiskDetected: mockRiskDetected ?? this.mockRiskDetected,
    );
  }

  @override
  String toString() {
    return 'LocationDiagnostics(provider=$provider, mode=$mode, '
        'samples=$sampleCount, accepted=$acceptedCount, rejected=$rejectedCount, '
        'interval=${averageRequestedIntervalMs}ms, cleanup=$cleanupStatus, '
        'fgService=$isForegroundServiceRunning, geofence=$geofenceRegistered, '
        'queue=$backpressureQueueSize, mockRisk=$mockRiskDetected)';
  }
}
