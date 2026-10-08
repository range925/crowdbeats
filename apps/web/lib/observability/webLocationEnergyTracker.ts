/**
 * Crowdbeats V2 — Web Location Quality & Energy Observability Tracker (Phase 11)
 *
 * Captures browser-side location telemetry, state durations, sensor usage,
 * network upload volume, and database attribution without ever collecting
 * exact coordinates, addresses, routes, or persistent identifiers.
 *
 * Privacy Invariant:
 * Strictly zero geographic coordinates, lat/lng coordinates, altitude, speed,
 * bearing, street addresses, venue coordinates, device IDs, or raw routes.
 */

import {
  assertZeroCoordinatesInMetrics,
  type LocationAccuracyClassBand,
  type LocationDistanceFilterBand,
  type LocationEnergyMetricsSnapshot,
  type LocationIntervalBand,
} from '@crowdbeats/contracts';

export type WebTrackingStateMode =
  | 'off'
  | 'discovery'
  | 'check_in'
  | 'live_stationary'
  | 'live_mobile';

export class WebLocationEnergyTracker {
  private currentMode: WebTrackingStateMode = 'off';
  private modeEnteredAt: number = Date.now();
  private timeInStateMs: Record<WebTrackingStateMode, number> = {
    off: 0,
    discovery: 0,
    check_in: 0,
    live_stationary: 0,
    live_mobile: 0,
  };

  // Sensor lifecycle
  private requestsStarted = 0;
  private requestsStopped = 0;
  private isSensorActive = false;
  private sensorActiveSince: number | null = null;
  private totalActiveSensorDurationMs = 0;

  // Visibility & Tab lifecycle
  private isForeground = true;
  private foregroundSince: number | null = Date.now();
  private backgroundSince: number | null = null;
  private totalForegroundDurationMs = 0;
  private totalBackgroundDurationMs = 0;

  // Samples & Quality
  private samplesReceived = 0;
  private samplesAccepted = 0;
  private samplesRejected = 0;
  private rejectedReasons: Record<string, number> = {};

  private accuracyClassBands: Record<LocationAccuracyClassBand, number> = {
    balanced: 0,
    high: 0,
    coarse: 0,
    unknown: 0,
  };

  private intervalBands: Record<LocationIntervalBand, number> = {
    sub_15s: 0,
    '15_to_60s': 0,
    over_60s: 0,
  };

  private distanceFilterBands: Record<LocationDistanceFilterBand, number> = {
    sub_25m: 0,
    '25_to_100m': 0,
    over_100m: 0,
  };

  private geofenceEventCount = 0;

  // Network & Queue
  private uploadCount = 0;
  private bytesUploaded = 0;
  private retryCount = 0;
  private queueHighWaterMark = 0;

  // Database Attribution
  private firestoreReads = 0;
  private firestoreWrites = 0;
  private rtdbReads = 0;
  private rtdbWrites = 0;

  // Listeners & Subscriptions
  private concurrentListeners = 0;
  private listenerLifetimeAccumulatorMs = 0;
  private activeListenerStartTimes: Map<string, number> = new Map();

  // Check-In
  private checkInsAttempted = 0;
  private checkInSuccess = false;
  private timeToVerifiedMs?: number;
  private checkInFailureCategory?: string;
  private cleanupLatencyMs?: number;

  // Privacy & Audience Radar
  private zonesSuppressed = 0;
  private zonesPublished = 0;
  private countBands: Record<string, number> = { '< 5': 0, '5-14': 0, '15+': 0 };

  // Security Events
  private blockedDenials = 0;
  private rateLimitThrottles = 0;
  private suspectedProbes = 0;

  private nowFn: () => number;

  constructor(nowFn: () => number = () => Date.now()) {
    this.nowFn = nowFn;
    this.modeEnteredAt = this.nowFn();
    this.foregroundSince = this.nowFn();
  }

  // ── State Transitions ────────────────────────────────────────────────────────

  transitionMode(newMode: WebTrackingStateMode): void {
    const now = this.nowFn();
    const elapsed = now - this.modeEnteredAt;
    this.timeInStateMs[this.currentMode] = (this.timeInStateMs[this.currentMode] || 0) + elapsed;
    this.currentMode = newMode;
    this.modeEnteredAt = now;
  }

  recordSensorStarted(): void {
    this.requestsStarted++;
    if (!this.isSensorActive) {
      this.isSensorActive = true;
      this.sensorActiveSince = this.nowFn();
    }
  }

  recordSensorStopped(): void {
    this.requestsStopped++;
    if (this.isSensorActive && this.sensorActiveSince !== null) {
      this.totalActiveSensorDurationMs += this.nowFn() - this.sensorActiveSince;
      this.isSensorActive = false;
      this.sensorActiveSince = null;
    }
  }

  updateVisibilityState(isForeground: boolean): void {
    const now = this.nowFn();
    if (this.isForeground !== isForeground) {
      if (this.isForeground && this.foregroundSince !== null) {
        this.totalForegroundDurationMs += now - this.foregroundSince;
      } else if (!this.isForeground && this.backgroundSince !== null) {
        this.totalBackgroundDurationMs += now - this.backgroundSince;
      }
      this.isForeground = isForeground;
      if (isForeground) {
        this.foregroundSince = now;
        this.backgroundSince = null;
      } else {
        this.backgroundSince = now;
        this.foregroundSince = null;
      }
    }
  }

  // ── Quality & Telemetry ──────────────────────────────────────────────────────

  recordSampleReceived(opts: {
    accepted: boolean;
    rejectionReason?: string;
    accuracyClass?: LocationAccuracyClassBand;
    intervalSeconds?: number;
    distanceFilterMeters?: number;
  }): void {
    this.samplesReceived++;
    if (opts.accepted) {
      this.samplesAccepted++;
    } else {
      this.samplesRejected++;
      if (opts.rejectionReason) {
        this.rejectedReasons[opts.rejectionReason] =
          (this.rejectedReasons[opts.rejectionReason] || 0) + 1;
      }
    }

    if (opts.accuracyClass) {
      this.accuracyClassBands[opts.accuracyClass] =
        (this.accuracyClassBands[opts.accuracyClass] || 0) + 1;
    }

    if (opts.intervalSeconds !== undefined) {
      if (opts.intervalSeconds < 15) {
        this.intervalBands.sub_15s++;
      } else if (opts.intervalSeconds <= 60) {
        this.intervalBands['15_to_60s']++;
      } else {
        this.intervalBands.over_60s++;
      }
    }

    if (opts.distanceFilterMeters !== undefined) {
      if (opts.distanceFilterMeters < 25) {
        this.distanceFilterBands.sub_25m++;
      } else if (opts.distanceFilterMeters <= 100) {
        this.distanceFilterBands['25_to_100m']++;
      } else {
        this.distanceFilterBands.over_100m++;
      }
    }
  }

  recordGeofenceEvent(): void {
    this.geofenceEventCount++;
  }

  recordUpload(bytes: number, currentQueueSize: number): void {
    this.uploadCount++;
    this.bytesUploaded += bytes;
    if (currentQueueSize > this.queueHighWaterMark) {
      this.queueHighWaterMark = currentQueueSize;
    }
  }

  recordUploadRetry(): void {
    this.retryCount++;
  }

  // ── Database Attribution ─────────────────────────────────────────────────────

  recordFirestoreRead(count = 1): void {
    this.firestoreReads += count;
  }

  recordFirestoreWrite(count = 1): void {
    this.firestoreWrites += count;
  }

  recordRtdbRead(count = 1): void {
    this.rtdbReads += count;
  }

  recordRtdbWrite(count = 1): void {
    this.rtdbWrites += count;
  }

  // ── Listeners ────────────────────────────────────────────────────────────────

  recordListenerAttached(id: string): void {
    this.concurrentListeners++;
    this.activeListenerStartTimes.set(id, this.nowFn());
  }

  recordListenerDetached(id: string): void {
    if (this.concurrentListeners > 0) {
      this.concurrentListeners--;
    }
    const started = this.activeListenerStartTimes.get(id);
    if (started !== undefined) {
      this.listenerLifetimeAccumulatorMs += this.nowFn() - started;
      this.activeListenerStartTimes.delete(id);
    }
  }

  // ── Verification & Security ──────────────────────────────────────────────────

  recordCheckInResult(opts: {
    success: boolean;
    timeToVerifiedMs?: number;
    failureCategory?: string;
  }): void {
    this.checkInsAttempted++;
    this.checkInSuccess = opts.success;
    if (opts.success && opts.timeToVerifiedMs !== undefined) {
      this.timeToVerifiedMs = opts.timeToVerifiedMs;
    }
    if (!opts.success && opts.failureCategory) {
      this.checkInFailureCategory = opts.failureCategory;
    }
  }

  recordCleanupLatency(ms: number): void {
    this.cleanupLatencyMs = ms;
  }

  recordAudienceZoneEvaluated(opts: { published: boolean; band?: string }): void {
    if (opts.published) {
      this.zonesPublished++;
      if (opts.band && opts.band in this.countBands) {
        this.countBands[opts.band]++;
      }
    } else {
      this.zonesSuppressed++;
    }
  }

  recordSecurityEvent(type: 'denial' | 'rate_limit' | 'probe'): void {
    if (type === 'denial') this.blockedDenials++;
    else if (type === 'rate_limit') this.rateLimitThrottles++;
    else if (type === 'probe') this.suspectedProbes++;
  }

  // ── Snapshot & Privacy Assertion ─────────────────────────────────────────────

  toSnapshotJson(opts: {
    appVersion: string;
    sessionId?: string;
    performerId?: string;
    platformVersion?: string;
  }): LocationEnergyMetricsSnapshot {
    const now = this.nowFn();
    const activeSensorMs =
      this.totalActiveSensorDurationMs +
      (this.isSensorActive && this.sensorActiveSince !== null
        ? now - this.sensorActiveSince
        : 0);

    const computedTimeInState = { ...this.timeInStateMs };
    computedTimeInState[this.currentMode] =
      (computedTimeInState[this.currentMode] || 0) + (now - this.modeEnteredAt);

    const snapshot: LocationEnergyMetricsSnapshot = {
      sessionId: opts.sessionId,
      performerId: opts.performerId,
      platform: 'web',
      platformVersion: opts.platformVersion,
      appVersion: opts.appVersion,
      timestamp: new Date(now).toISOString(),
      timeInStateMs: {
        off: computedTimeInState.off,
        discovery: computedTimeInState.discovery,
        check_in: computedTimeInState.check_in,
        live_stationary: computedTimeInState.live_stationary,
        live_mobile: computedTimeInState.live_mobile,
      },
      locationRequests: {
        started: this.requestsStarted,
        stopped: this.requestsStopped,
      },
      activeSensorDurationMs: activeSensorMs,
      foregroundDurationMs:
        this.totalForegroundDurationMs +
        (this.isForeground && this.foregroundSince !== null ? now - this.foregroundSince : 0),
      backgroundDurationMs:
        this.totalBackgroundDurationMs +
        (!this.isForeground && this.backgroundSince !== null ? now - this.backgroundSince : 0),
      sampleCounts: {
        received: this.samplesReceived,
        accepted: this.samplesAccepted,
        rejected: this.samplesRejected,
        rejectedReasons: { ...this.rejectedReasons },
      },
      accuracyClassBands: { ...this.accuracyClassBands },
      intervalBands: { ...this.intervalBands },
      distanceFilterBands: { ...this.distanceFilterBands },
      geofenceEventCount: this.geofenceEventCount,
      networkTelemetry: {
        uploadCount: this.uploadCount,
        bytesUploaded: this.bytesUploaded,
        retryCount: this.retryCount,
        queueHighWaterMark: this.queueHighWaterMark,
      },
      databaseAttribution: {
        firestoreReads: this.firestoreReads,
        firestoreWrites: this.firestoreWrites,
        rtdbReads: this.rtdbReads,
        rtdbWrites: this.rtdbWrites,
      },
      listenerMetrics: {
        lifetimeMs: this.listenerLifetimeAccumulatorMs,
        concurrentListeners: this.concurrentListeners,
      },
      checkInMetrics: {
        attempted: this.checkInsAttempted,
        success: this.checkInSuccess,
        timeToVerifiedMs: this.timeToVerifiedMs,
        failureCategory: this.checkInFailureCategory,
      },
      cleanupLatencyMs: this.cleanupLatencyMs,
      audienceZoneMetrics: {
        zonesSuppressed: this.zonesSuppressed,
        zonesPublished: this.zonesPublished,
        countBands: { ...this.countBands },
      },
      grantMetrics: {
        optInCount: 0,
        revokeCount: 0,
        expiryCount: 0,
        cleanupLatencyMs: this.cleanupLatencyMs,
      },
      securityEvents: {
        blockedDenials: this.blockedDenials,
        rateLimitThrottles: this.rateLimitThrottles,
        suspectedProbes: this.suspectedProbes,
      },
      stabilitySignals: {
        crashFreeSession: true,
        osBackgroundTermination: false,
      },
    };

    assertZeroCoordinatesInMetrics(snapshot as unknown as Record<string, unknown>);
    return snapshot;
  }

  reset(): void {
    const now = this.nowFn();
    this.currentMode = 'off';
    this.modeEnteredAt = now;
    this.timeInStateMs = { off: 0, discovery: 0, check_in: 0, live_stationary: 0, live_mobile: 0 };
    this.requestsStarted = 0;
    this.requestsStopped = 0;
    this.isSensorActive = false;
    this.sensorActiveSince = null;
    this.totalActiveSensorDurationMs = 0;
    this.totalForegroundDurationMs = 0;
    this.totalBackgroundDurationMs = 0;
    this.samplesReceived = 0;
    this.samplesAccepted = 0;
    this.samplesRejected = 0;
    this.rejectedReasons = {};
    this.uploadCount = 0;
    this.bytesUploaded = 0;
    this.retryCount = 0;
    this.queueHighWaterMark = 0;
    this.firestoreReads = 0;
    this.firestoreWrites = 0;
    this.rtdbReads = 0;
    this.rtdbWrites = 0;
    this.concurrentListeners = 0;
    this.listenerLifetimeAccumulatorMs = 0;
    this.activeListenerStartTimes.clear();
    this.checkInsAttempted = 0;
    this.checkInSuccess = false;
    this.timeToVerifiedMs = undefined;
    this.checkInFailureCategory = undefined;
    this.cleanupLatencyMs = undefined;
    this.zonesSuppressed = 0;
    this.zonesPublished = 0;
    this.countBands = { '< 5': 0, '5-14': 0, '15+': 0 };
    this.blockedDenials = 0;
    this.rateLimitThrottles = 0;
    this.suspectedProbes = 0;
  }
}

export const webLocationEnergyTracker = new WebLocationEnergyTracker();
