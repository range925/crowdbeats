/**
 * Phase 11 Unit Tests — Web Location Quality & Energy Observability
 */

import { WebLocationEnergyTracker } from '../../lib/observability/webLocationEnergyTracker';
import { WebRemoteConfigService } from '../../lib/config/webRemoteConfig';
import { assertZeroCoordinatesInMetrics } from '@crowdbeats/contracts';

describe('Phase 11: Location Quality & Energy Observability (Web Unit)', () => {
  let mockNow: number;
  let tracker: WebLocationEnergyTracker;

  beforeEach(() => {
    mockNow = 1758456000000; // Fixed timestamp
    tracker = new WebLocationEnergyTracker(() => mockNow);
  });

  test('1. Tracks state durations and sensor active time accurately', () => {
    tracker.transitionMode('discovery');
    mockNow += 5000;

    tracker.recordSensorStarted();
    mockNow += 2000;
    tracker.recordSensorStopped();

    tracker.transitionMode('live_stationary');
    mockNow += 10000;

    const snapshot = tracker.toSnapshotJson({ appVersion: '2.0.0-web' });

    expect(snapshot.timeInStateMs.discovery).toBe(7000);
    expect(snapshot.timeInStateMs.live_stationary).toBe(10000);
    expect(snapshot.activeSensorDurationMs).toBe(2000);
    expect(snapshot.locationRequests.started).toBe(1);
    expect(snapshot.locationRequests.stopped).toBe(1);
  });

  test('2. Records sample quality, accuracy bands, and rejected reasons', () => {
    tracker.recordSampleReceived({
      accepted: true,
      accuracyClass: 'high',
      intervalSeconds: 10,
      distanceFilterMeters: 15,
    });
    tracker.recordSampleReceived({
      accepted: false,
      rejectionReason: 'mock_gps_detected',
      accuracyClass: 'coarse',
      intervalSeconds: 30,
      distanceFilterMeters: 50,
    });

    const snapshot = tracker.toSnapshotJson({ appVersion: '2.0.0-web' });

    expect(snapshot.sampleCounts.received).toBe(2);
    expect(snapshot.sampleCounts.accepted).toBe(1);
    expect(snapshot.sampleCounts.rejected).toBe(1);
    expect(snapshot.sampleCounts.rejectedReasons['mock_gps_detected']).toBe(1);
    expect(snapshot.accuracyClassBands.high).toBe(1);
    expect(snapshot.accuracyClassBands.coarse).toBe(1);
    expect(snapshot.intervalBands.sub_15s).toBe(1);
    expect(snapshot.intervalBands['15_to_60s']).toBe(1);
    expect(snapshot.distanceFilterBands.sub_25m).toBe(1);
    expect(snapshot.distanceFilterBands['25_to_100m']).toBe(1);
  });

  test('3. Records network telemetry, upload counts, and queue high-water marks', () => {
    tracker.recordUpload(512, 2);
    tracker.recordUpload(1024, 6);
    tracker.recordUploadRetry();

    const snapshot = tracker.toSnapshotJson({ appVersion: '2.0.0-web' });

    expect(snapshot.networkTelemetry.uploadCount).toBe(2);
    expect(snapshot.networkTelemetry.bytesUploaded).toBe(1536);
    expect(snapshot.networkTelemetry.retryCount).toBe(1);
    expect(snapshot.networkTelemetry.queueHighWaterMark).toBe(6);
  });

  test('4. Enforces database read and write attribution tracking', () => {
    tracker.recordFirestoreRead(5);
    tracker.recordFirestoreWrite(2);
    tracker.recordRtdbRead(10);
    tracker.recordRtdbWrite(3);

    const snapshot = tracker.toSnapshotJson({ appVersion: '2.0.0-web' });

    expect(snapshot.databaseAttribution.firestoreReads).toBe(5);
    expect(snapshot.databaseAttribution.firestoreWrites).toBe(2);
    expect(snapshot.databaseAttribution.rtdbReads).toBe(10);
    expect(snapshot.databaseAttribution.rtdbWrites).toBe(3);
  });

  test('5. Strict zero-coordinate privacy assertion enforces clean telemetry', () => {
    const validSnapshot = tracker.toSnapshotJson({ appVersion: '2.0.0-web' });
    expect(() => assertZeroCoordinatesInMetrics(validSnapshot as unknown as Record<string, unknown>)).not.toThrow();

    const taintedSnapshot = {
      ...validSnapshot,
      latitude: 37.7749,
    };
    expect(() => assertZeroCoordinatesInMetrics(taintedSnapshot as unknown as Record<string, unknown>)).toThrow(
      /Privacy violation: key .* is forbidden/
    );

    const nestedTaintedSnapshot = {
      ...validSnapshot,
      diagnostics: {
        rawPoint: [37.7749, -122.4194],
      },
    };
    expect(() => assertZeroCoordinatesInMetrics(nestedTaintedSnapshot as unknown as Record<string, unknown>)).toThrow(
      /Privacy violation: key .* is forbidden/
    );
  });

  test('6. WebRemoteConfigService clamps bounds and supports emergency kill switches', () => {
    const service = new WebRemoteConfigService();

    expect(service.isMobileTrackingAllowed).toBe(true);
    expect(service.isPublicPresenceAllowed).toBe(true);
    expect(service.isCrowdRadarAllowed).toBe(true);
    expect(service.isAudienceVisibilityAllowed).toBe(true);

    // Toggle emergency kill switch
    service.setKillSwitch({ mobileTracking: false });
    expect(service.isMobileTrackingAllowed).toBe(false);

    // Clamps out of bound configs
    service.updatePolicy({
      minUploadIntervalSeconds: 2, // min is 5
      maxQueueCapacity: 100, // max is 50
      velocityCapMps: 500, // max is 100
    });

    expect(service.policy.minUploadIntervalSeconds).toBe(5);
    expect(service.policy.maxQueueCapacity).toBe(50);
    expect(service.policy.velocityCapMps).toBe(100);
  });
});
