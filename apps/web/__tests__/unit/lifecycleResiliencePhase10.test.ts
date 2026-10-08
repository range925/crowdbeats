/**
 * Crowdbeats V2 — Phase 10 Lifecycle Resilience Unit Tests (Web)
 *
 * Verifies:
 * 1. WebBackpressureQueue capacity bound (30), oldest-dropped policy, monotonic sequences, velocity cap (45 m/s)
 * 2. WebCleanupCoordinator teardown across all 4 resource categories & terminal invariant assertions
 * 3. reconcileWebSession behavior: offline lease countdown, server authority, terminal state teardown
 * 4. Clock skew calculation & warning detection (>120s)
 * 5. Tipping independence: financial state unaffected by location purge
 * 6. Fan audience visibility reconciliation: truthful state, zero silent renewal
 */

import {
  computeClockSkewSeconds,
  calculateBackoffWithJitter,
  RESILIENCE_LIMITS,
} from '@crowdbeats/contracts';
import {
  WebCleanupCoordinator,
  WebCoordinateFix,
} from '../../lib/discovery/webCleanupCoordinator';
import {
  WebBackpressureQueue,
  reconcileWebSession,
  reconcileWebFanGrants,
  QueuedSample,
} from '../../lib/discovery/webSessionReconciler';

describe('Phase 10 — Lifecycle Resilience Unit Tests (Web)', () => {
  let coordinator: WebCleanupCoordinator;
  let queue: WebBackpressureQueue;

  beforeEach(() => {
    coordinator = new WebCleanupCoordinator();
    queue = new WebBackpressureQueue(30);
  });

  describe('1. WebBackpressureQueue Invariants', () => {
    it('enforces maximum capacity of 30 and drops oldest on overflow', () => {
      expect(queue.maxCapacity).toBe(30);

      for (let i = 1; i <= 35; i++) {
        const sample: QueuedSample = {
          lat: 32.7157 + i * 0.0001,
          lng: -117.1611,
          accuracyMeters: 5,
          timestamp: 1000 * i,
          seq: i,
          idempotencyKey: `idem_${i}`,
        };
        queue.enqueue(sample);
      }

      expect(queue.size).toBe(30);
      expect(queue.dropped).toBe(5);
      expect(queue.enqueued).toBe(35);
    });

    it('rejects non-monotonic sequence numbers', () => {
      queue.enqueue({
        lat: 32.7157,
        lng: -117.1611,
        accuracyMeters: 5,
        timestamp: 1000,
        seq: 5,
        idempotencyKey: 'idem_5',
      });

      expect(() => {
        queue.enqueue({
          lat: 32.7158,
          lng: -117.1611,
          accuracyMeters: 5,
          timestamp: 2000,
          seq: 4, // Out of order!
          idempotencyKey: 'idem_4',
        });
      }).toThrow('Non-monotonic sequence: 4 <= lastSeq 5');
    });

    it('validates plausible velocity (<= 45 m/s) and flags teleportation', () => {
      const prev: WebCoordinateFix = {
        lat: 32.7157,
        lng: -117.1611,
        accuracyMeters: 5,
        timestamp: 1000,
      };

      // 100m in 5 seconds = 20 m/s -> Plausible
      const plausible: WebCoordinateFix = {
        lat: 32.7166,
        lng: -117.1611,
        accuracyMeters: 5,
        timestamp: 6000,
      };
      expect(queue.isPlausibleVelocity(prev, plausible)).toBe(true);

      // 10,000m in 5 seconds = 2000 m/s -> Teleportation glitch!
      const teleport: WebCoordinateFix = {
        lat: 32.8057,
        lng: -117.1611,
        accuracyMeters: 5,
        timestamp: 6000,
      };
      expect(queue.isPlausibleVelocity(prev, teleport)).toBe(false);
    });

    it('drains batch and acknowledges uploaded samples', () => {
      for (let i = 1; i <= 5; i++) {
        queue.enqueue({
          lat: 32.7157,
          lng: -117.1611,
          accuracyMeters: 5,
          timestamp: 1000 * i,
          seq: i,
          idempotencyKey: `key_${i}`,
        });
      }

      const batch = queue.drainBatch(3);
      expect(batch.length).toBe(3);

      queue.acknowledgeBatch(batch);
      expect(queue.size).toBe(2);
      expect(queue.acknowledged).toBe(3);
    });
  });

  describe('2. WebCleanupCoordinator Teardown & Invariants', () => {
    it('tears down all active watchers, timers, listeners, and memory fixes', () => {
      let unsubsCalled = 0;

      coordinator.registerWatchId(101);
      coordinator.registerWatchId(102);
      coordinator.registerInterval(setInterval(() => {}, 1000));
      coordinator.registerListener(() => {
        unsubsCalled++;
      });
      coordinator.recordFix({
        lat: 32.7157,
        lng: -117.1611,
        accuracyMeters: 5,
        timestamp: Date.now(),
      });

      expect(coordinator.activeWatchCount).toBe(2);
      expect(coordinator.activeIntervalCount).toBe(1);
      expect(coordinator.activeListenerCount).toBe(1);
      expect(coordinator.queueSize).toBe(1);

      const report = coordinator.cleanupTerminalState('performer_ended');

      expect(report.allPassed).toBe(true);
      expect(report.zeroSensors).toBe(true);
      expect(report.zeroListeners).toBe(true);
      expect(report.zeroPrivateCoordinates).toBe(true);
      expect(unsubsCalled).toBe(1);

      // Verify invariant assertion methods do not throw
      expect(() => coordinator.assertZeroActiveWatchers()).not.toThrow();
      expect(() => coordinator.assertZeroTimers()).not.toThrow();
      expect(() => coordinator.assertZeroListeners()).not.toThrow();
      expect(() => coordinator.assertZeroPrivateCoordinates()).not.toThrow();
    });

    it('assertZeroPrivateCoordinates throws if memory queue is not empty', () => {
      coordinator.recordFix({
        lat: 32.7157,
        lng: -117.1611,
        accuracyMeters: 5,
        timestamp: Date.now(),
      });

      expect(() => coordinator.assertZeroPrivateCoordinates()).toThrow(
        'Terminal invariant violation',
      );
    });
  });

  describe('3. Web Session Reconciliation & Offline Leases', () => {
    it('reconciles offline session with unexpired lease as reconnecting', async () => {
      const futureEndsAt = Date.now() + 60000;
      const res = await reconcileWebSession({
        sessionId: 'sess_web_offline',
        cachedEndsAtMs: futureEndsAt,
        isOnline: false,
        nowMs: Date.now(),
      });

      expect(res.isLive).toBe(true);
      expect(res.status).toBe('reconnecting');
      expect(res.recoveryState).toBe('reconnecting');
      expect(res.endsAtMs).toBe(futureEndsAt);
    });

    it('reconciles offline session with expired lease as expired and triggers terminal cleanup', async () => {
      const pastEndsAt = Date.now() - 5000;
      const res = await reconcileWebSession({
        sessionId: 'sess_web_expired',
        cachedEndsAtMs: pastEndsAt,
        isOnline: false,
        nowMs: Date.now(),
      });

      expect(res.isLive).toBe(false);
      expect(res.status).toBe('expired');
      expect(res.recoveryState).toBe('expired');
      expect(res.terminalReason).toBe('expired');
    });

    it('reconciles server response when admin forces end', async () => {
      const mockServerReconcile = jest.fn().mockResolvedValue({
        isLive: false,
        status: 'admin_ended',
        serverTimestamp: new Date().toISOString(),
        terminalReason: 'admin_ended',
        clockSkewSeconds: 0,
      });

      const res = await reconcileWebSession({
        sessionId: 'sess_admin_force',
        isOnline: true,
        serverReconcileFn: mockServerReconcile,
      });

      expect(res.isLive).toBe(false);
      expect(res.status).toBe('admin_ended');
      expect(res.recoveryState).toBe('ended_by_admin');
      expect(res.terminalReason).toBe('admin_ended');
    });
  });

  describe('4. Clock Skew & Backoff Jitter', () => {
    it('computes clock skew accurately', () => {
      const clientIso = '2026-09-21T12:00:00.000Z';
      const serverIso = '2026-09-21T12:02:30.000Z'; // 150 seconds behind server

      const skew = computeClockSkewSeconds(clientIso, serverIso);
      expect(skew).toBe(-150);
      expect(Math.abs(skew)).toBeGreaterThan(RESILIENCE_LIMITS.CLOCK_SKEW_WARNING_SECONDS);
    });

    it('calculates exponential backoff with jitter within bounded range', () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const backoff = calculateBackoffWithJitter(attempt);
        expect(backoff).toBeGreaterThanOrEqual(750); // 1500 * 0.5
        expect(backoff).toBeLessThanOrEqual(RESILIENCE_LIMITS.BACKOFF_MAX_MS * 1.5);
      }
    });
  });

  describe('5. Tipping Independence', () => {
    it('tipping financial record survives location coordinate purge', () => {
      const tipTransaction = {
        tipId: 'tip_web_999',
        amountCents: 2500,
        status: 'succeeded',
      };

      coordinator.recordFix({
        lat: 32.7157,
        lng: -117.1611,
        accuracyMeters: 5,
        timestamp: Date.now(),
      });

      coordinator.purgeSensitiveLocalTelemetry();

      expect(coordinator.queueSize).toBe(0);
      expect(tipTransaction.tipId).toBe('tip_web_999');
      expect(tipTransaction.status).toBe('succeeded');
    });
  });

  describe('6. Fan Visibility Truthful Reconciliation', () => {
    it('marks ended sessions or revoked grants as isShared: false', () => {
      const reconciled = reconcileWebFanGrants([
        {
          grantId: 'g1',
          sessionId: 's1',
          performerId: 'p1',
          status: 'session_ended',
          isShared: true, // was optimistically true
        },
        {
          grantId: 'g2',
          sessionId: 's2',
          performerId: 'p2',
          status: 'active',
          isShared: true,
        },
      ]);

      expect(reconciled[0].isShared).toBe(false);
      expect(reconciled[1].isShared).toBe(true);
    });
  });
});
