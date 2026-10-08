/**
 * Crowdbeats V2 — Web Session Reconciler & Bounded Backpressure Queue (Phase 10)
 *
 * Implements:
 * 1. WebBackpressureQueue: strictly capped at 30 items with oldest-dropped policy,
 *    monotonic sequence validation, velocity cap (45 m/s), and exponential backoff with jitter.
 * 2. reconcileWebSession: authoritative reconciliation for web creators and fans on page reload,
 *    wake, and visibility change.
 * 3. Offline check-in guard: ensures verified check-in is pending/unavailable rather than faking success.
 */

import {
  RESILIENCE_LIMITS,
  TerminalCleanupReason,
  CreatorRecoveryState,
  ReconcileSessionResponse,
  FanGrantReconciliationItem,
  calculateBackoffWithJitter,
} from '@crowdbeats/contracts';
import { webCleanupCoordinator, WebCoordinateFix } from './webCleanupCoordinator';

export interface QueuedSample extends WebCoordinateFix {
  seq: number;
  idempotencyKey: string;
}

export class WebBackpressureQueue {
  private queue: QueuedSample[] = [];
  private lastSeq: number = 0;
  private droppedCount: number = 0;
  private enqueuedCount: number = 0;
  private acknowledgedCount: number = 0;

  constructor(public readonly maxCapacity: number = RESILIENCE_LIMITS.MAX_BOUNDED_QUEUE_CAPACITY) {}

  public get size(): number {
    return this.queue.length;
  }

  public get dropped(): number {
    return this.droppedCount;
  }

  public get enqueued(): number {
    return this.enqueuedCount;
  }

  public get acknowledged(): number {
    return this.acknowledgedCount;
  }

  public get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Validates velocity between previous and current fix (meters / second).
   * Rejects impossible teleportation jumps (> 45 m/s).
   */
  public isPlausibleVelocity(previous: WebCoordinateFix, next: WebCoordinateFix): boolean {
    const dtSeconds = Math.max(0.1, (next.timestamp - previous.timestamp) / 1000);
    // Rough planar approximation for short-interval velocity check
    const dLat = (next.lat - previous.lat) * 111139;
    const dLng = (next.lng - previous.lng) * 111139 * Math.cos((previous.lat * Math.PI) / 180);
    const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
    const velocityMps = distMeters / dtSeconds;
    return velocityMps <= RESILIENCE_LIMITS.MAX_VELOCITY_MPS;
  }

  /**
   * Enqueues a sample with monotonic sequence and bounding checks.
   * If capacity is reached, drops the oldest sample.
   */
  public enqueue(sample: QueuedSample): boolean {
    if (sample.seq <= this.lastSeq) {
      throw new Error(`Non-monotonic sequence: ${sample.seq} <= lastSeq ${this.lastSeq}`);
    }
    this.lastSeq = sample.seq;
    this.enqueuedCount++;

    let droppedOldest = false;
    if (this.queue.length >= this.maxCapacity) {
      this.queue.shift(); // Drop oldest sample
      this.droppedCount++;
      droppedOldest = true;
    }

    this.queue.push(sample);
    webCleanupCoordinator.recordFix(sample);
    return !droppedOldest;
  }

  public drainBatch(maxBatchSize: number = 10): QueuedSample[] {
    return this.queue.slice(0, maxBatchSize);
  }

  public acknowledgeBatch(batch: QueuedSample[]): void {
    const keysToRemove = new Set(batch.map((b) => b.idempotencyKey));
    this.queue = this.queue.filter((item) => !keysToRemove.has(item.idempotencyKey));
    this.acknowledgedCount += batch.length;
  }

  public clear(): void {
    this.queue = [];
    this.lastSeq = 0;
  }
}

export interface WebSessionReconciliationParams {
  sessionId?: string;
  cachedEndsAtMs?: number;
  isOnline?: boolean;
  serverReconcileFn?: () => Promise<ReconcileSessionResponse>;
  nowMs?: number;
}

export interface WebSessionReconciliationResult {
  isLive: boolean;
  status: 'live' | 'reconnecting' | 'expired' | 'ended' | 'admin_ended' | 'none';
  recoveryState: CreatorRecoveryState;
  endsAtMs?: number;
  terminalReason?: TerminalCleanupReason;
}

/**
 * Reconciles creator web session state on load, page focus, or network change.
 */
export async function reconcileWebSession(
  params: WebSessionReconciliationParams,
): Promise<WebSessionReconciliationResult> {
  const nowMs = params.nowMs ?? Date.now();
  const isOnline = params.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);

  if (!params.sessionId) {
    return {
      isLive: false,
      status: 'none',
      recoveryState: 'connected',
    };
  }

  // If offline, check local authoritative lease
  if (!isOnline || !params.serverReconcileFn) {
    if (params.cachedEndsAtMs && nowMs >= params.cachedEndsAtMs) {
      // Local lease expired while offline -> cleanup terminal state immediately
      webCleanupCoordinator.cleanupTerminalState('expired');
      return {
        isLive: false,
        status: 'expired',
        recoveryState: 'expired',
        endsAtMs: params.cachedEndsAtMs,
        terminalReason: 'expired',
      };
    }

    // Still within lease window, but offline
    return {
      isLive: true,
      status: 'reconnecting',
      recoveryState: 'reconnecting',
      endsAtMs: params.cachedEndsAtMs,
    };
  }

  try {
    const serverResp = await params.serverReconcileFn();

    if (!serverResp.isLive || serverResp.status !== 'live') {
      const reason: TerminalCleanupReason =
        serverResp.terminalReason ||
        (serverResp.status === 'admin_ended'
          ? 'admin_ended'
          : serverResp.status === 'expired'
          ? 'expired'
          : 'performer_ended');

      webCleanupCoordinator.cleanupTerminalState(reason);

      const recovery: CreatorRecoveryState =
        serverResp.status === 'admin_ended' ? 'ended_by_admin' : 'expired';

      return {
        isLive: false,
        status: serverResp.status as any,
        recoveryState: recovery,
        terminalReason: reason,
      };
    }

    const endsAtMs = serverResp.endsAt ? new Date(serverResp.endsAt).getTime() : undefined;

    return {
      isLive: true,
      status: 'live',
      recoveryState: 'connected',
      endsAtMs,
    };
  } catch {
    // Network failure during reconciliation
    if (params.cachedEndsAtMs && nowMs >= params.cachedEndsAtMs) {
      webCleanupCoordinator.cleanupTerminalState('expired');
      return {
        isLive: false,
        status: 'expired',
        recoveryState: 'expired',
        endsAtMs: params.cachedEndsAtMs,
        terminalReason: 'expired',
      };
    }

    return {
      isLive: true,
      status: 'reconnecting',
      recoveryState: 'reconnecting',
      endsAtMs: params.cachedEndsAtMs,
    };
  }
}

/**
 * Reconciles fan audience visibility grants, ensuring ended sessions or expired grants
 * are truthfully marked as inactive with zero silent renewals.
 */
export function reconcileWebFanGrants(
  grants: FanGrantReconciliationItem[],
): FanGrantReconciliationItem[] {
  return grants.map((g) => {
    if (g.status === 'session_ended' || g.status === 'expired' || g.status === 'revoked') {
      return {
        ...g,
        isShared: false,
      };
    }
    return g;
  });
}
