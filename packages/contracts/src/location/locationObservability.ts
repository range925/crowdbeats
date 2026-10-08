/**
 * Crowdbeats V2 — Privacy-Safe Location Quality and Energy Observability (Phase 11)
 *
 * Metrics, telemetry contracts, and anomaly detection definitions.
 *
 * PRIVACY INVARIANT:
 * Strictly zero geographic coordinates, lat/lng coordinates, altitude, speed,
 * bearing, street addresses, venue coordinates, device advertising IDs, routes,
 * or raw timestamped breadcrumbs are collected, stored, or emitted.
 */

import type { IsoTimestamp } from '../common/timestamp';

export type LocationAccuracyClassBand = 'balanced' | 'high' | 'coarse' | 'unknown';
export type LocationIntervalBand = 'sub_15s' | '15_to_60s' | 'over_60s';
export type LocationDistanceFilterBand = 'sub_25m' | '25_to_100m' | 'over_100m';

export type LocationAnomalyType =
  | 'runaway_tracking_duration'
  | 'missing_cleanup_detected'
  | 'abnormal_upload_volume'
  | 'abnormal_read_write_volume'
  | 'repeated_verification_failures'
  | 'stale_public_session_detected'
  | 'privacy_threshold_violation_attempt'
  | 'grant_revocation_failure'
  | 'security_rule_or_function_error';

export interface LocationEnergyMetricsSnapshot {
  readonly sessionId?: string;
  readonly performerId?: string;
  readonly platform: 'android' | 'ios' | 'web';
  readonly platformVersion?: string;
  readonly appVersion: string;
  readonly timestamp: IsoTimestamp;

  // State Durations (ms)
  readonly timeInStateMs: {
    readonly off: number;
    readonly discovery: number;
    readonly check_in: number;
    readonly live_stationary: number;
    readonly live_mobile: number;
  };

  // Sensor lifecycle
  readonly locationRequests: {
    readonly started: number;
    readonly stopped: number;
  };
  readonly activeSensorDurationMs: number;
  readonly foregroundDurationMs: number;
  readonly backgroundDurationMs: number;

  // Samples & Quality
  readonly sampleCounts: {
    readonly received: number;
    readonly accepted: number;
    readonly rejected: number;
    readonly rejectedReasons: Record<string, number>;
  };
  readonly accuracyClassBands: Record<LocationAccuracyClassBand, number>;
  readonly intervalBands: Record<LocationIntervalBand, number>;
  readonly distanceFilterBands: Record<LocationDistanceFilterBand, number>;
  readonly geofenceEventCount: number;

  // Network & Queue Backpressure
  readonly networkTelemetry: {
    readonly uploadCount: number;
    readonly bytesUploaded: number;
    readonly retryCount: number;
    readonly queueHighWaterMark: number;
  };

  // Database Attribution (reads & writes attributable to location)
  readonly databaseAttribution: {
    readonly firestoreReads: number;
    readonly firestoreWrites: number;
    readonly rtdbReads: number;
    readonly rtdbWrites: number;
  };

  // Listeners & Subscriptions
  readonly listenerMetrics: {
    readonly lifetimeMs: number;
    readonly concurrentListeners: number;
  };

  // Verification & Cleanup
  readonly checkInMetrics: {
    readonly attempted: number;
    readonly success: boolean;
    readonly timeToVerifiedMs?: number;
    readonly failureCategory?: string;
  };
  readonly cleanupLatencyMs?: number;

  // Privacy & Audience Radar
  readonly audienceZoneMetrics: {
    readonly zonesSuppressed: number;
    readonly zonesPublished: number;
    readonly countBands: Record<string, number>; // e.g. '5-14': 2, '15+': 1
  };
  readonly grantMetrics: {
    readonly optInCount: number;
    readonly revokeCount: number;
    readonly expiryCount: number;
    readonly cleanupLatencyMs?: number;
  };
  readonly securityEvents: {
    readonly blockedDenials: number;
    readonly rateLimitThrottles: number;
    readonly suspectedProbes: number;
  };

  // Parity & Stability
  readonly parityFailure?: {
    readonly isParityFailure: boolean;
    readonly reason?: string;
  };
  readonly stabilitySignals: {
    readonly crashFreeSession: boolean;
    readonly osBackgroundTermination: boolean;
  };
}

export interface LocationAnomalyAlert {
  readonly alertId: string;
  readonly anomalyType: LocationAnomalyType;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly sessionId?: string;
  readonly entityId?: string;
  readonly description: string;
  readonly details: Record<string, unknown>;
  readonly detectedAt: IsoTimestamp;
  readonly requiresImmediateTeardown: boolean;
}

/**
 * Strict validator asserting zero coordinates or direct identifiers
 * in any metrics payload before transmission or storage.
 */
export const FORBIDDEN_ANALYTICS_KEYS = Object.freeze([
  'lat',
  'latitude',
  'lng',
  'longitude',
  'altitude',
  'speed',
  'bearing',
  'heading',
  'address',
  'street',
  'rawPoint',
  'rawHistory',
  'deviceId',
  'idfa',
  'adId',
  'advertisingId',
  'venueCoordinates',
  'exactFanCount',
  'fanCoordinates',
]);

export function assertZeroCoordinatesInMetrics(data: Record<string, unknown>): void {
  function checkObject(obj: unknown, path: string): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        checkObject(obj[i], `${path}[${i}]`);
      }
      return;
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      const isForbidden =
        lower === 'lat' ||
        lower === 'lng' ||
        lower.startsWith('lat_') ||
        lower.endsWith('_lat') ||
        lower.startsWith('lng_') ||
        lower.endsWith('_lng') ||
        lower.includes('latitude') ||
        lower.includes('longitude') ||
        lower.includes('altitude') ||
        lower === 'speed' ||
        lower === 'bearing' ||
        lower === 'heading' ||
        lower.includes('address') ||
        lower.includes('street') ||
        lower.includes('rawpoint') ||
        lower.includes('rawhistory') ||
        lower.includes('deviceid') ||
        lower === 'idfa' ||
        lower === 'adid' ||
        lower.includes('advertisingid') ||
        lower.includes('venuecoordinates') ||
        lower.includes('exactfancount') ||
        lower.includes('fancoordinates');

      if (isForbidden) {
        throw new Error(
          `Privacy violation: key "${path ? `${path}.${key}` : key}" is forbidden in location observability telemetry.`,
        );
      }
      checkObject(value, path ? `${path}.${key}` : key);
    }
  }

  checkObject(data, '');
}
