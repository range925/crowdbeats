/**
 * Crowdbeats V2 — Location Remote Config Policy & Kill Switches (Phase 11)
 *
 * Emergency kill switches and validated runtime bounds for live location features.
 */

export interface LocationRemoteConfigPolicy {
  // Emergency Kill Switches (true = feature operational, false = immediately halt/disable)
  readonly mobileTrackingEnabled: boolean;
  readonly publicPresenceEnabled: boolean;
  readonly aggregateCrowdRadarEnabled: boolean;
  readonly individualAudienceVisibilityEnabled: boolean;

  // Validated Operational Bounds
  readonly minUploadIntervalSeconds: number; // e.g. 15s (bounds: [5, 300])
  readonly maxQueueCapacity: number; // e.g. 30 (bounds: [5, 50])
  readonly stationaryGeofenceRadiusMeters: number; // e.g. 200m (bounds: [50, 1000])
  readonly maxSessionDurationHours: number; // e.g. 8h (bounds: [1, 12])
  readonly velocityCapMps: number; // e.g. 45 m/s (bounds: [10, 100])
  readonly kAnonymityMinFans: number; // e.g. 5 (bounds: [5, 50])

  // Observability & Anomaly Alerting Thresholds
  readonly runawayMobileAlertThresholdHours: number; // e.g. 4h (bounds: [1, 8])
  readonly stalePresenceAlertThresholdMinutes: number; // e.g. 15m (bounds: [5, 60])
  readonly maxConsecutiveCheckInFailuresAlert: number; // e.g. 5 (bounds: [3, 20])
}

export const DEFAULT_LOCATION_REMOTE_CONFIG: LocationRemoteConfigPolicy = Object.freeze({
  mobileTrackingEnabled: true,
  publicPresenceEnabled: true,
  aggregateCrowdRadarEnabled: true,
  individualAudienceVisibilityEnabled: true,

  minUploadIntervalSeconds: 15,
  maxQueueCapacity: 30,
  stationaryGeofenceRadiusMeters: 200,
  maxSessionDurationHours: 8,
  velocityCapMps: 45,
  kAnonymityMinFans: 5,

  runawayMobileAlertThresholdHours: 4,
  stalePresenceAlertThresholdMinutes: 15,
  maxConsecutiveCheckInFailuresAlert: 5,
});

/**
 * Validates and clamps a raw or partial Remote Config payload against enforced safe bounds.
 */
export function validateRemoteConfigPolicy(
  raw?: Partial<LocationRemoteConfigPolicy> | null,
): LocationRemoteConfigPolicy {
  if (!raw) return DEFAULT_LOCATION_REMOTE_CONFIG;

  const clamp = (val: unknown, min: number, max: number, fallback: number): number => {
    if (typeof val !== 'number' || isNaN(val)) return fallback;
    return Math.max(min, Math.min(max, val));
  };

  const toBool = (val: unknown, fallback: boolean): boolean => {
    if (typeof val === 'boolean') return val;
    return fallback;
  };

  return {
    mobileTrackingEnabled: toBool(raw.mobileTrackingEnabled, DEFAULT_LOCATION_REMOTE_CONFIG.mobileTrackingEnabled),
    publicPresenceEnabled: toBool(raw.publicPresenceEnabled, DEFAULT_LOCATION_REMOTE_CONFIG.publicPresenceEnabled),
    aggregateCrowdRadarEnabled: toBool(
      raw.aggregateCrowdRadarEnabled,
      DEFAULT_LOCATION_REMOTE_CONFIG.aggregateCrowdRadarEnabled,
    ),
    individualAudienceVisibilityEnabled: toBool(
      raw.individualAudienceVisibilityEnabled,
      DEFAULT_LOCATION_REMOTE_CONFIG.individualAudienceVisibilityEnabled,
    ),

    minUploadIntervalSeconds: clamp(raw.minUploadIntervalSeconds, 5, 300, DEFAULT_LOCATION_REMOTE_CONFIG.minUploadIntervalSeconds),
    maxQueueCapacity: clamp(raw.maxQueueCapacity, 5, 50, DEFAULT_LOCATION_REMOTE_CONFIG.maxQueueCapacity),
    stationaryGeofenceRadiusMeters: clamp(
      raw.stationaryGeofenceRadiusMeters,
      50,
      1000,
      DEFAULT_LOCATION_REMOTE_CONFIG.stationaryGeofenceRadiusMeters,
    ),
    maxSessionDurationHours: clamp(raw.maxSessionDurationHours, 1, 12, DEFAULT_LOCATION_REMOTE_CONFIG.maxSessionDurationHours),
    velocityCapMps: clamp(raw.velocityCapMps, 10, 100, DEFAULT_LOCATION_REMOTE_CONFIG.velocityCapMps),
    kAnonymityMinFans: clamp(raw.kAnonymityMinFans, 5, 50, DEFAULT_LOCATION_REMOTE_CONFIG.kAnonymityMinFans),

    runawayMobileAlertThresholdHours: clamp(
      raw.runawayMobileAlertThresholdHours,
      1,
      8,
      DEFAULT_LOCATION_REMOTE_CONFIG.runawayMobileAlertThresholdHours,
    ),
    stalePresenceAlertThresholdMinutes: clamp(
      raw.stalePresenceAlertThresholdMinutes,
      5,
      60,
      DEFAULT_LOCATION_REMOTE_CONFIG.stalePresenceAlertThresholdMinutes,
    ),
    maxConsecutiveCheckInFailuresAlert: clamp(
      raw.maxConsecutiveCheckInFailuresAlert,
      3,
      20,
      DEFAULT_LOCATION_REMOTE_CONFIG.maxConsecutiveCheckInFailuresAlert,
    ),
  };
}
