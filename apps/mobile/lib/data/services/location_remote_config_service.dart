// Crowdbeats V2 — Location Remote Config Service (Phase 11)
//
// Manages runtime bounds and emergency kill switches for location services.

import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

@immutable
class LocationRemoteConfigPolicy {
  const LocationRemoteConfigPolicy({
    this.mobileTrackingEnabled = true,
    this.publicPresenceEnabled = true,
    this.aggregateCrowdRadarEnabled = true,
    this.individualAudienceVisibilityEnabled = true,
    this.minUploadIntervalSeconds = 15,
    this.maxQueueCapacity = 30,
    this.stationaryGeofenceRadiusMeters = 200,
    this.maxSessionDurationHours = 8,
    this.velocityCapMps = 45,
    this.kAnonymityMinFans = 5,
    this.runawayMobileAlertThresholdHours = 4,
    this.stalePresenceAlertThresholdMinutes = 15,
    this.maxConsecutiveCheckInFailuresAlert = 5,
  });

  final bool mobileTrackingEnabled;
  final bool publicPresenceEnabled;
  final bool aggregateCrowdRadarEnabled;
  final bool individualAudienceVisibilityEnabled;

  final int minUploadIntervalSeconds;
  final int maxQueueCapacity;
  final int stationaryGeofenceRadiusMeters;
  final int maxSessionDurationHours;
  final int velocityCapMps;
  final int kAnonymityMinFans;

  final int runawayMobileAlertThresholdHours;
  final int stalePresenceAlertThresholdMinutes;
  final int maxConsecutiveCheckInFailuresAlert;

  LocationRemoteConfigPolicy copyWith({
    bool? mobileTrackingEnabled,
    bool? publicPresenceEnabled,
    bool? aggregateCrowdRadarEnabled,
    bool? individualAudienceVisibilityEnabled,
    int? minUploadIntervalSeconds,
    int? maxQueueCapacity,
    int? stationaryGeofenceRadiusMeters,
    int? maxSessionDurationHours,
    int? velocityCapMps,
    int? kAnonymityMinFans,
    int? runawayMobileAlertThresholdHours,
    int? stalePresenceAlertThresholdMinutes,
    int? maxConsecutiveCheckInFailuresAlert,
  }) {
    return LocationRemoteConfigPolicy(
      mobileTrackingEnabled: mobileTrackingEnabled ?? this.mobileTrackingEnabled,
      publicPresenceEnabled: publicPresenceEnabled ?? this.publicPresenceEnabled,
      aggregateCrowdRadarEnabled: aggregateCrowdRadarEnabled ?? this.aggregateCrowdRadarEnabled,
      individualAudienceVisibilityEnabled: individualAudienceVisibilityEnabled ?? this.individualAudienceVisibilityEnabled,
      minUploadIntervalSeconds: minUploadIntervalSeconds ?? this.minUploadIntervalSeconds,
      maxQueueCapacity: maxQueueCapacity ?? this.maxQueueCapacity,
      stationaryGeofenceRadiusMeters: stationaryGeofenceRadiusMeters ?? this.stationaryGeofenceRadiusMeters,
      maxSessionDurationHours: maxSessionDurationHours ?? this.maxSessionDurationHours,
      velocityCapMps: velocityCapMps ?? this.velocityCapMps,
      kAnonymityMinFans: kAnonymityMinFans ?? this.kAnonymityMinFans,
      runawayMobileAlertThresholdHours: runawayMobileAlertThresholdHours ?? this.runawayMobileAlertThresholdHours,
      stalePresenceAlertThresholdMinutes: stalePresenceAlertThresholdMinutes ?? this.stalePresenceAlertThresholdMinutes,
      maxConsecutiveCheckInFailuresAlert: maxConsecutiveCheckInFailuresAlert ?? this.maxConsecutiveCheckInFailuresAlert,
    );
  }

  factory LocationRemoteConfigPolicy.fromMap(Map<String, dynamic> raw) {
    int clamp(dynamic val, int minVal, int maxVal, int fallback) {
      if (val is int) return max(minVal, min(maxVal, val));
      if (val is double) return max(minVal, min(maxVal, val.toInt()));
      return fallback;
    }

    bool toBool(dynamic val, bool fallback) {
      if (val is bool) return val;
      return fallback;
    }

    return LocationRemoteConfigPolicy(
      mobileTrackingEnabled: toBool(raw['mobileTrackingEnabled'], true),
      publicPresenceEnabled: toBool(raw['publicPresenceEnabled'], true),
      aggregateCrowdRadarEnabled: toBool(raw['aggregateCrowdRadarEnabled'], true),
      individualAudienceVisibilityEnabled: toBool(raw['individualAudienceVisibilityEnabled'], true),
      minUploadIntervalSeconds: clamp(raw['minUploadIntervalSeconds'], 5, 300, 15),
      maxQueueCapacity: clamp(raw['maxQueueCapacity'], 5, 50, 30),
      stationaryGeofenceRadiusMeters: clamp(raw['stationaryGeofenceRadiusMeters'], 50, 1000, 200),
      maxSessionDurationHours: clamp(raw['maxSessionDurationHours'], 1, 12, 8),
      velocityCapMps: clamp(raw['velocityCapMps'], 10, 100, 45),
      kAnonymityMinFans: clamp(raw['kAnonymityMinFans'], 5, 50, 5),
      runawayMobileAlertThresholdHours: clamp(raw['runawayMobileAlertThresholdHours'], 1, 8, 4),
      stalePresenceAlertThresholdMinutes: clamp(raw['stalePresenceAlertThresholdMinutes'], 5, 60, 15),
      maxConsecutiveCheckInFailuresAlert: clamp(raw['maxConsecutiveCheckInFailuresAlert'], 3, 20, 5),
    );
  }
}

class LocationRemoteConfigService {
  LocationRemoteConfigService({
    LocationRemoteConfigPolicy? initialPolicy,
  }) : _policy = initialPolicy ?? const LocationRemoteConfigPolicy();

  LocationRemoteConfigPolicy _policy;

  LocationRemoteConfigPolicy get policy => _policy;

  bool get isMobileTrackingAllowed => _policy.mobileTrackingEnabled;
  bool get isPublicPresenceAllowed => _policy.publicPresenceEnabled;
  bool get isCrowdRadarAllowed => _policy.aggregateCrowdRadarEnabled;
  bool get isAudienceVisibilityAllowed => _policy.individualAudienceVisibilityEnabled;

  void updatePolicy(LocationRemoteConfigPolicy newPolicy) {
    _policy = newPolicy;
  }

  void updateFromMap(Map<String, dynamic> raw) {
    _policy = LocationRemoteConfigPolicy.fromMap(raw);
  }

  /// Emergency kill switch override for testing or instant triage
  void setKillSwitch({
    bool? mobileTracking,
    bool? publicPresence,
    bool? crowdRadar,
    bool? audienceVisibility,
  }) {
    _policy = _policy.copyWith(
      mobileTrackingEnabled: mobileTracking,
      publicPresenceEnabled: publicPresence,
      aggregateCrowdRadarEnabled: crowdRadar,
      individualAudienceVisibilityEnabled: audienceVisibility,
    );
  }
}

final locationRemoteConfigServiceProvider = Provider<LocationRemoteConfigService>((ref) {
  return LocationRemoteConfigService();
});
