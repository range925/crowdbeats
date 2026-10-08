// Crowdbeats V2 — Live Location Dart Models (Phase 2)
//
// Dart parity for: packages/contracts/src/location/liveLocation.ts
//
// PRIVACY INVARIANTS (permanent):
//  - PrivateLocationSession: SERVER_ONLY. This Dart class exists only so
//    the test suite can verify the public/private boundary at the type level.
//    It MUST NEVER be constructed from Firestore client data (rules deny it).
//  - PublicLivePresence: readable by signed-in clients. Fields lat/lng are
//    the VENUE's canonical pin or a geohash-7 centroid — NEVER device GPS.
//  - AudienceVisibilityGrant: readable by the session's performer only.
//    Creator never receives fan UID or exact coordinates.
//
// Serialisation:
//  - All models use manual fromJson/fromMap factories matching the existing
//    codebase convention (AuditEvent, PublicPerformer, etc.).
//  - Firestore Timestamps arrive as Dart Map{'_seconds':…} or as String ISO
//    when received through callable responses. Both are handled.
//  - Geohash fields are plain String; no encoding performed client-side.

import 'package:flutter/foundation.dart';

// ─── Supporting types ─────────────────────────────────────────────────────────

enum SessionStatus {
  live,
  paused,
  ending,
  ended,
  expired,
  adminEnded,
  error;

  static SessionStatus fromString(String s) => switch (s) {
        'live' => SessionStatus.live,
        'paused' => SessionStatus.paused,
        'ending' => SessionStatus.ending,
        'ended' => SessionStatus.ended,
        'expired' => SessionStatus.expired,
        'admin_ended' => SessionStatus.adminEnded,
        'error' => SessionStatus.error,
        _ => SessionStatus.error,
      };

  String get wire => switch (this) {
        SessionStatus.live => 'live',
        SessionStatus.paused => 'paused',
        SessionStatus.ending => 'ending',
        SessionStatus.ended => 'ended',
        SessionStatus.expired => 'expired',
        SessionStatus.adminEnded => 'admin_ended',
        SessionStatus.error => 'error',
      };

  bool get isTerminal =>
      this == SessionStatus.ended ||
      this == SessionStatus.expired ||
      this == SessionStatus.adminEnded;

  bool get isLive => this == SessionStatus.live || this == SessionStatus.paused;
}

enum AudienceConsentTier {
  aggregate,
  individualSession;

  static AudienceConsentTier fromString(String s) => switch (s) {
        'aggregate' => AudienceConsentTier.aggregate,
        'individual_session' => AudienceConsentTier.individualSession,
        _ => throw ArgumentError('Unknown AudienceConsentTier: $s'),
      };

  String get wire => switch (this) {
        AudienceConsentTier.aggregate => 'aggregate',
        AudienceConsentTier.individualSession => 'individual_session',
      };
}

enum AudienceCountBand {
  band1To4,
  band5To14,
  band15Plus;

  static AudienceCountBand fromString(String s) => switch (s) {
        '[1-4]' => AudienceCountBand.band1To4,
        '[5-14]' => AudienceCountBand.band5To14,
        '[15+]' => AudienceCountBand.band15Plus,
        _ => throw ArgumentError('Unknown AudienceCountBand: $s'),
      };

  String get wire => switch (this) {
        AudienceCountBand.band1To4 => '[1-4]',
        AudienceCountBand.band5To14 => '[5-14]',
        AudienceCountBand.band15Plus => '[15+]',
      };

  String get label => switch (this) {
        AudienceCountBand.band1To4 => '1–4',
        AudienceCountBand.band5To14 => '5–14',
        AudienceCountBand.band15Plus => '15+',
      };
}

// ─── 1. Venue (location-enriched) ────────────────────────────────────────────

class Venue {
  const Venue({
    required this.venueId,
    required this.name,
    required this.city,
    required this.country,
    required this.lat,
    required this.lng,
    required this.geohash5,
    required this.geofenceRadiusMeters,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.street,
    this.state,
    this.postalCode,
  });

  final String venueId;
  final String name;
  final String? street;
  final String city;
  final String? state;
  final String? postalCode;
  final String country;
  /// Canonical WGS84 latitude. Indexed for bounding-box queries.
  final double lat;
  /// Canonical WGS84 longitude. Indexed for bounding-box queries.
  final double lng;
  /// Geohash at precision 5 (~4.9 km²). Indexed for geohash-prefix range queries.
  final String geohash5;
  final double geofenceRadiusMeters;
  final bool isActive;
  final String createdAt;
  final String updatedAt;

  factory Venue.fromJson(Map<String, dynamic> json) {
    final addr = json['address'] as Map<String, dynamic>?;
    return Venue(
      venueId: json['venueId'] as String,
      name: json['name'] as String,
      street: addr?['street'] as String?,
      city: addr?['city'] as String? ?? json['city'] as String? ?? '',
      state: addr?['state'] as String?,
      postalCode: addr?['postalCode'] as String?,
      country: addr?['country'] as String? ?? json['country'] as String? ?? 'US',
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      geohash5: json['geohash5'] as String,
      geofenceRadiusMeters: (json['geofenceRadiusMeters'] as num?)?.toDouble() ?? 200,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: _timestampToIso(json['createdAt']),
      updatedAt: _timestampToIso(json['updatedAt']),
    );
  }
}

// ─── 2. PublicLivePresence — client-readable presence ────────────────────────

/// The ONLY location model that should ever be stored in a Riverpod state
/// provider that a fan or creator client can access.
///
/// lat/lng are the venue's canonical pin OR a server-coarsened geohash-7
/// centroid. They are NEVER the performer's exact device coordinates.
@immutable
class PublicLivePresence {
  const PublicLivePresence({
    required this.sessionId,
    required this.performerId,
    required this.performerName,
    required this.performerType,
    required this.status,
    required this.locationType,
    required this.lat,
    required this.lng,
    required this.geohash5,
    required this.startedAt,
    required this.endsAt,
    this.venueId,
    this.venueName,
    this.genre,
    this.genreTags = const [],
    this.endedAt,
    this.v = 1,
  });

  final String sessionId;
  final String performerId;
  final String performerName;
  final String performerType; // 'artist' | 'band_member' | 'venue_manager'
  final SessionStatus status;
  /// 'venue' | 'street' | 'mobile'
  final String locationType;
  /// Venue canonical lat OR geohash-7 centroid. NEVER device GPS.
  final double lat;
  /// Venue canonical lng OR geohash-7 centroid. NEVER device GPS.
  final double lng;
  /// Geohash at precision 5. Used for client-side proximity display grouping.
  final String geohash5;
  final String? venueId;
  final String? venueName;
  final String? genre;
  final List<String> genreTags;
  final String startedAt;
  final String endsAt;
  final String? endedAt;
  final int v;

  /// Whether this presence is current — checks status AND server-authoritative
  /// endsAt even when Firestore TTL deletion hasn't run yet.
  bool get isEffectivelyLive =>
      status.isLive && DateTime.tryParse(endsAt)?.isAfter(DateTime.now()) == true;

  factory PublicLivePresence.fromJson(Map<String, dynamic> json) {
    // Defensive: PublicLivePresence must never have raw lat/lng from private fields.
    // Caller (trusted code or Firestore rule) must not include these.
    assert(
      !json.containsKey('lastRawPoint') &&
          !json.containsKey('rawHistory') &&
          !json.containsKey('deviceId') &&
          !json.containsKey('accuracyMeters'),
      'PublicLivePresence.fromJson received private fields — data pipeline breach',
    );
    return PublicLivePresence(
      sessionId: json['sessionId'] as String,
      performerId: json['performerId'] as String,
      performerName: json['performerName'] as String,
      performerType: json['performerType'] as String,
      status: SessionStatus.fromString(json['status'] as String),
      locationType: json['locationType'] as String? ?? 'venue',
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      geohash5: json['geohash5'] as String? ?? '',
      venueId: json['venueId'] as String?,
      venueName: json['venueName'] as String?,
      genre: json['genre'] as String?,
      genreTags: (json['genreTags'] as List<dynamic>?)?.cast<String>() ?? [],
      startedAt: _timestampToIso(json['startedAt']),
      endsAt: _timestampToIso(json['endsAt']),
      endedAt: json['endedAt'] != null ? _timestampToIso(json['endedAt']) : null,
      v: json['v'] as int? ?? 1,
    );
  }

  /// Converts to a plain map suitable for Firestore writes (trusted server code only).
  /// Client code should never write PublicLivePresence — this is exposed for testing.
  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'performerId': performerId,
        'performerName': performerName,
        'performerType': performerType,
        'status': status.wire,
        'locationType': locationType,
        'lat': lat,
        'lng': lng,
        'geohash5': geohash5,
        if (venueId != null) 'venueId': venueId,
        if (venueName != null) 'venueName': venueName,
        if (genre != null) 'genre': genre,
        'genreTags': genreTags,
        'startedAt': startedAt,
        'endsAt': endsAt,
        if (endedAt != null) 'endedAt': endedAt,
        'v': v,
        // Explicitly absent: lastRawPoint, rawHistory, deviceId, accuracyMeters
      };

  PublicLivePresence copyWith({
    SessionStatus? status,
    String? endsAt,
    String? endedAt,
    double? lat,
    double? lng,
    String? geohash5,
  }) =>
      PublicLivePresence(
        sessionId: sessionId,
        performerId: performerId,
        performerName: performerName,
        performerType: performerType,
        status: status ?? this.status,
        locationType: locationType,
        lat: lat ?? this.lat,
        lng: lng ?? this.lng,
        geohash5: geohash5 ?? this.geohash5,
        venueId: venueId,
        venueName: venueName,
        genre: genre,
        genreTags: genreTags,
        startedAt: startedAt,
        endsAt: endsAt ?? this.endsAt,
        endedAt: endedAt ?? this.endedAt,
        v: v,
      );
}

// ─── 3. PrivateLocationSession — SERVER_ONLY marker type ────────────────────

/// Dart marker type for the server-only private location capture.
/// This class MUST NOT be constructed from Firestore client data.
/// It exists so tests can verify the public/private boundary by type.
///
/// Firestore rule: sessions/{id}/private/location has allow read: if false.
@visibleForTesting
class PrivateLocationSession {
  const PrivateLocationSession({
    required this.sessionId,
    required this.performerId,
    required this.lat,
    required this.lng,
    required this.geohash9,
    required this.geohash7,
    required this.geohash5,
    required this.accuracyMeters,
    required this.idempotencyKey,
    required this.capturedAt,
    this.isMockRejected = false,
  });

  final String sessionId;
  final String performerId;
  final double lat;
  final double lng;
  final String geohash9;
  final String geohash7;
  final String geohash5;
  final double accuracyMeters;
  final String idempotencyKey;
  final bool isMockRejected;
  final String capturedAt;

  /// Returns a map that contains ONLY server-safe fields for audit purposes.
  /// Caller must NEVER pass this to a Firestore client write — audit only.
  Map<String, dynamic> toAuditSafeMap() => {
        'sessionId': sessionId,
        'performerId': performerId,
        'geohash5': geohash5, // coarse only
        'isMockRejected': isMockRejected,
        // Deliberately absent: lat, lng, geohash9, geohash7, accuracyMeters
      };
}

// ─── 4. LocationSample — SERVER_ONLY telemetry ───────────────────────────────

/// Marker type for LIVE_MOBILE ephemeral telemetry.
/// Client-side this is write-only via callable; never read back.
@visibleForTesting
class LocationSample {
  const LocationSample({
    required this.sampleId,
    required this.sessionId,
    required this.seq,
    required this.idempotencyKey,
    required this.lat,
    required this.lng,
    required this.geohash9,
    required this.accuracyMeters,
    required this.capturedAt,
    required this.receivedAt,
    required this.expiresAt,
  });

  final String sampleId;
  final String sessionId;
  final int seq;
  final String idempotencyKey;
  final double lat;
  final double lng;
  final String geohash9;
  final double accuracyMeters;
  final String capturedAt;
  final String receivedAt;
  final String expiresAt;
}

// ─── 5. HeartbeatRequest / HeartbeatResponse ─────────────────────────────────

class HeartbeatRequest {
  const HeartbeatRequest({
    required this.sessionId,
    required this.seq,
    required this.idempotencyKey,
  });

  final String sessionId;
  final int seq;
  final String idempotencyKey;

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'seq': seq,
        'idempotencyKey': idempotencyKey,
      };
}

class HeartbeatResponse {
  const HeartbeatResponse({
    required this.sessionId,
    required this.status,
    required this.endsAt,
    required this.extended,
    required this.seq,
  });

  final String sessionId;
  final SessionStatus status;
  final String endsAt;
  final bool extended;
  final int seq;

  factory HeartbeatResponse.fromJson(Map<String, dynamic> json) =>
      HeartbeatResponse(
        sessionId: json['sessionId'] as String,
        status: SessionStatus.fromString(json['status'] as String),
        endsAt: json['endsAt'] as String,
        extended: json['extended'] as bool,
        seq: json['seq'] as int,
      );
}

// ─── 6. SessionLease ────────────────────────────────────────────────────────

class SessionLease {
  const SessionLease({
    required this.lastHeartbeatAt,
    required this.lastHeartbeatSeq,
    required this.heartbeatCount,
  });

  final String lastHeartbeatAt;
  final int lastHeartbeatSeq;
  final int heartbeatCount;

  factory SessionLease.fromJson(Map<String, dynamic> json) => SessionLease(
        lastHeartbeatAt: _timestampToIso(json['lastHeartbeatAt']),
        lastHeartbeatSeq: json['lastHeartbeatSeq'] as int? ?? 0,
        heartbeatCount: json['heartbeatCount'] as int? ?? 0,
      );
}

// ─── 7. AudienceVisibilityGrant ──────────────────────────────────────────────

/// Client-readable by session's performer (performerId == auth.uid) only.
/// Creator NEVER sees fan UID or exact coordinates.
@immutable
class AudienceVisibilityGrant {
  const AudienceVisibilityGrant({
    required this.grantId,
    required this.sessionId,
    required this.performerId,
    required this.grantRef,
    required this.tier,
    required this.grantedAt,
    required this.expiresAt,
    this.approxGeohash7,
    this.zoneGeohash5,
    this.revokedAt,
  });

  final String grantId;
  final String sessionId;
  final String performerId;
  /// Opaque reference — NOT the fan UID.
  final String grantRef;
  final AudienceConsentTier tier;
  /// Server-coarsened geohash-7 centroid. Creator receives lat/lng derived
  /// from this; never the raw device position.
  final String? approxGeohash7;
  final String? zoneGeohash5;
  final String grantedAt;
  final String expiresAt;
  final String? revokedAt;

  bool get isActive => revokedAt == null &&
      DateTime.tryParse(expiresAt)?.isAfter(DateTime.now()) == true;

  factory AudienceVisibilityGrant.fromJson(Map<String, dynamic> json) =>
      AudienceVisibilityGrant(
        grantId: json['grantId'] as String,
        sessionId: json['sessionId'] as String,
        performerId: json['performerId'] as String,
        grantRef: json['grantRef'] as String,
        tier: AudienceConsentTier.fromString(json['tier'] as String),
        approxGeohash7: json['approxGeohash7'] as String?,
        zoneGeohash5: json['zoneGeohash5'] as String?,
        grantedAt: _timestampToIso(json['grantedAt']),
        expiresAt: _timestampToIso(json['expiresAt']),
        revokedAt:
            json['revokedAt'] != null ? _timestampToIso(json['revokedAt']) : null,
      );
}

// ─── 8. CreatorAudienceZone ──────────────────────────────────────────────────

/// Creator-visible aggregate zone. NEVER contains fan UIDs, raw coordinates,
/// individual geohashes at precision > 5, or exact counts.
@immutable
class CreatorAudienceZone {
  const CreatorAudienceZone({
    required this.zoneId,
    required this.sessionId,
    required this.performerId,
    required this.geohash5,
    required this.countBand,
    required this.aggregatedAtMs,
    required this.expiresAt,
  });

  final String zoneId;
  final String sessionId;
  final String performerId;
  final String geohash5;
  final AudienceCountBand countBand;
  final int aggregatedAtMs;
  final String expiresAt;

  bool get isStale =>
      DateTime.tryParse(expiresAt)?.isBefore(DateTime.now()) == true;

  factory CreatorAudienceZone.fromJson(Map<String, dynamic> json) =>
      CreatorAudienceZone(
        zoneId: json['zoneId'] as String,
        sessionId: json['sessionId'] as String,
        performerId: json['performerId'] as String,
        geohash5: json['geohash5'] as String,
        countBand: AudienceCountBand.fromString(json['countBand'] as String),
        aggregatedAtMs: json['aggregatedAtMs'] as int,
        expiresAt: _timestampToIso(json['expiresAt']),
      );
}

// ─── 9. ConsentReceipt ───────────────────────────────────────────────────────

@immutable
class ConsentReceipt {
  const ConsentReceipt({
    required this.receiptId,
    required this.fanUid,
    required this.sessionId,
    required this.performerId,
    required this.tier,
    required this.action,
    required this.grantId,
    required this.createdAt,
    required this.expiresAt,
  });

  final String receiptId;
  final String fanUid;
  final String sessionId;
  final String performerId;
  final AudienceConsentTier tier;
  final String action; // 'granted' | 'revoked'
  final String grantId;
  final String createdAt;
  final String expiresAt;

  factory ConsentReceipt.fromJson(Map<String, dynamic> json) => ConsentReceipt(
        receiptId: json['receiptId'] as String,
        fanUid: json['fanUid'] as String,
        sessionId: json['sessionId'] as String,
        performerId: json['performerId'] as String,
        tier: AudienceConsentTier.fromString(json['tier'] as String),
        action: json['action'] as String,
        grantId: json['grantId'] as String,
        createdAt: _timestampToIso(json['createdAt']),
        expiresAt: _timestampToIso(json['expiresAt']),
      );
}

// ─── 10. VerificationResult ──────────────────────────────────────────────────

class VerificationResult {
  const VerificationResult({
    required this.ok,
    required this.distanceMeters,
    required this.allowedRadiusMeters,
    this.venueGeohash5,
    this.rejectionReason,
  });

  final bool ok;
  final double distanceMeters;
  final double allowedRadiusMeters;
  final String? venueGeohash5;
  final String? rejectionReason;
}

// ─── 11. StartSession request/response ───────────────────────────────────────

class StartSessionRequest {
  const StartSessionRequest({
    required this.performerName,
    required this.performerType,
    required this.locationType,
    required this.idempotencyKey,
    this.venueId,
    this.lat,
    this.lng,
    this.accuracyMeters,
    this.isMock = false,
  });

  final String performerName;
  final String performerType;
  final String locationType;
  final String? venueId;
  final double? lat;
  final double? lng;
  final double? accuracyMeters;
  final bool isMock;
  final String idempotencyKey;

  Map<String, dynamic> toJson() => {
        'performerName': performerName,
        'performerType': performerType,
        'locationType': locationType,
        'idempotencyKey': idempotencyKey,
        if (venueId != null) 'venueId': venueId,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (accuracyMeters != null) 'accuracyMeters': accuracyMeters,
        'isMock': isMock,
      };
}

class StartSessionResponse {
  const StartSessionResponse({
    required this.sessionId,
    required this.locationType,
    required this.publicLat,
    required this.publicLng,
    required this.endsAt,
  });

  final String sessionId;
  final String locationType;
  final double publicLat;
  final double publicLng;
  final String endsAt;

  factory StartSessionResponse.fromJson(Map<String, dynamic> json) =>
      StartSessionResponse(
        sessionId: json['sessionId'] as String,
        locationType: json['locationType'] as String,
        publicLat: (json['publicLat'] as num).toDouble(),
        publicLng: (json['publicLng'] as num).toDouble(),
        endsAt: json['endsAt'] as String,
      );
}

// ─── 12. AudienceSafetyPolicy ────────────────────────────────────────────────

class AudienceSafetyPolicy {
  const AudienceSafetyPolicy({
    this.aggregationThreshold = 5,
    this.zoneCellGeohashLength = 5,
    this.individualGeohashLength = 7,
    this.individualSnapMeters = 100,
    this.publishDelaySeconds = 30,
    this.zoneFreshnessSeconds = 300,
    this.heartbeatIntervalSeconds = 90,
    this.heartbeatExtensionHours = 2,
    this.maxSessionTtlHours = 12,
    this.venueProximityRadiusMeters = 200,
    this.streetModeMaxAccuracyMeters = 100,
    this.pinFreshnessMaxAgeMinutes = 10,
  });

  final int aggregationThreshold;
  final int zoneCellGeohashLength;
  final int individualGeohashLength;
  final double individualSnapMeters;
  final int publishDelaySeconds;
  final int zoneFreshnessSeconds;
  final int heartbeatIntervalSeconds;
  final double heartbeatExtensionHours;
  final int maxSessionTtlHours;
  final double venueProximityRadiusMeters;
  final double streetModeMaxAccuracyMeters;
  final int pinFreshnessMaxAgeMinutes;

  factory AudienceSafetyPolicy.fromJson(Map<String, dynamic> json) =>
      AudienceSafetyPolicy(
        aggregationThreshold: json['aggregationThreshold'] as int? ?? 5,
        zoneCellGeohashLength: json['zoneCellGeohashLength'] as int? ?? 5,
        individualGeohashLength: json['individualGeohashLength'] as int? ?? 7,
        individualSnapMeters: (json['individualSnapMeters'] as num?)?.toDouble() ?? 100,
        publishDelaySeconds: json['publishDelaySeconds'] as int? ?? 30,
        zoneFreshnessSeconds: json['zoneFreshnessSeconds'] as int? ?? 300,
        heartbeatIntervalSeconds: json['heartbeatIntervalSeconds'] as int? ?? 90,
        heartbeatExtensionHours:
            (json['heartbeatExtensionHours'] as num?)?.toDouble() ?? 2,
        maxSessionTtlHours: json['maxSessionTtlHours'] as int? ?? 12,
        venueProximityRadiusMeters:
            (json['venueProximityRadiusMeters'] as num?)?.toDouble() ?? 200,
        streetModeMaxAccuracyMeters:
            (json['streetModeMaxAccuracyMeters'] as num?)?.toDouble() ?? 100,
        pinFreshnessMaxAgeMinutes:
            json['pinFreshnessMaxAgeMinutes'] as int? ?? 10,
      );
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/// Converts a Firestore Timestamp-like value or ISO string to ISO 8601 string.
/// Firestore Timestamp fields arrive as {'_seconds': N, '_nanoseconds': N} maps
/// when accessed via REST; as DateTime when via FlutterFire; as String in callable
/// responses.
String _timestampToIso(dynamic value) {
  if (value == null) return DateTime.now().toIso8601String();
  if (value is String) return value;
  if (value is DateTime) return value.toIso8601String();
  if (value is Map) {
    final m = Map<String, dynamic>.from(value);
    final seconds = m['_seconds'] as int? ?? m['seconds'] as int? ?? 0;
    return DateTime.fromMillisecondsSinceEpoch(seconds * 1000).toIso8601String();
  }
  return value.toString();
}
