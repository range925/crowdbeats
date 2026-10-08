// Crowdbeats V2 — LocationFix Value Object
//
// An immutable snapshot of a single GPS position obtained from the device.
//
// Privacy invariants (permanent):
// - This object is NEVER serialised to Firestore, logs, analytics, or crash reports.
// - Debug output redacts coordinates to ±0.1° bucket labels only.
// - isMock: true when obtained from a location emulator or test double;
//   checked before any real server operation in the check-in and Near Me flows.

class LocationFix {
  const LocationFix({
    required this.latitude,
    required this.longitude,
    required this.accuracyMeters,
    required this.timestamp,
    this.altitudeMeters,
    this.isMock = false,
  });

  final double latitude;
  final double longitude;
  final double accuracyMeters;
  final DateTime timestamp;
  final double? altitudeMeters;

  /// True when produced by a device GPS emulator, test double, or explicit
  /// dart-define override. Prevents mock coordinates from being submitted to
  /// real Cloud Functions.
  final bool isMock;

  /// Age of this fix relative to [now].
  Duration ageAt(DateTime now) => now.difference(timestamp);

  /// Whether this fix is fresh enough for the given [maxAge].
  bool isFreshFor(Duration maxAge, {DateTime? now}) =>
      ageAt(now ?? DateTime.now()) <= maxAge;

  /// Redacted representation for debugging — never logs real coordinates.
  /// Rounds to nearest ±0.1° so a developer can confirm the city-level fix
  /// without recording exact position.
  @override
  String toString() {
    final latBucket = (latitude * 10).round() / 10;
    final lngBucket = (longitude * 10).round() / 10;
    return 'LocationFix(±≈$latBucket°N, ±≈$lngBucket°E, '
        'acc=${accuracyMeters.toStringAsFixed(0)}m, mock=$isMock)';
  }
}
