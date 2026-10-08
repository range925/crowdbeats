/**
 * Crowdbeats V2 — Web Centralized Cleanup Coordinator (Phase 10)
 *
 * Single point of responsibility for tearing down all browser location watchers,
 * requestAnimationFrame loops, heartbeat intervals, Firestore listeners,
 * and sensitive memory coordinates.
 *
 * Terminal State Invariants:
 * 1. assertZeroActiveWatchers
 * 2. assertZeroTimers
 * 3. assertZeroListeners
 * 4. assertZeroPrivateCoordinates
 */

import type { TerminalCleanupReason, TerminalStateInvariantReport } from '@crowdbeats/contracts';

export type UnsubscribeFn = () => void;

export interface WebCoordinateFix {
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: number;
}

export class WebCleanupCoordinator {
  private trackedWatchIds: Set<number> = new Set();
  private trackedIntervals: Set<NodeJS.Timeout | number> = new Set();
  private trackedRafs: Set<number> = new Set();
  private trackedUnsubscribes: Set<UnsubscribeFn> = new Set();
  private inMemoryQueue: WebCoordinateFix[] = [];
  private lastCoordinate: WebCoordinateFix | null = null;
  private isTrackingActive: boolean = false;

  public get activeWatchCount(): number {
    return this.trackedWatchIds.size;
  }

  public get activeIntervalCount(): number {
    return this.trackedIntervals.size;
  }

  public get activeRafCount(): number {
    return this.trackedRafs.size;
  }

  public get activeListenerCount(): number {
    return this.trackedUnsubscribes.size;
  }

  public get isTracking(): boolean {
    return this.isTrackingActive;
  }

  public get queueSize(): number {
    return this.inMemoryQueue.length;
  }

  // ── Registration ───────────────────────────────────────────────────────────

  public registerWatchId(watchId: number): void {
    this.trackedWatchIds.add(watchId);
    this.isTrackingActive = true;
  }

  public registerInterval(intervalId: NodeJS.Timeout | number): void {
    this.trackedIntervals.add(intervalId);
  }

  public registerRaf(rafId: number): void {
    this.trackedRafs.add(rafId);
  }

  public registerListener(unsubscribe: UnsubscribeFn): void {
    this.trackedUnsubscribes.add(unsubscribe);
  }

  public recordFix(fix: WebCoordinateFix): void {
    this.lastCoordinate = fix;
    this.inMemoryQueue.push(fix);
  }

  public setTrackingActive(active: boolean): void {
    this.isTrackingActive = active;
  }

  // ── Granular Teardown Steps ────────────────────────────────────────────────

  /**
   * 1. Clears all browser Geolocation watchPosition IDs.
   */
  public clearAllWatchers(): void {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      for (const watchId of this.trackedWatchIds) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch {
          // ignore in unsupported or mocked test envs
        }
      }
    }
    this.trackedWatchIds.clear();
    this.isTrackingActive = false;
  }

  /**
   * 2. Clears all active intervals, timeouts, and requestAnimationFrame loops.
   */
  public clearAllTimersAndRafs(): void {
    for (const id of this.trackedIntervals) {
      clearInterval(id as any);
      clearTimeout(id as any);
    }
    this.trackedIntervals.clear();

    if (typeof cancelAnimationFrame !== 'undefined') {
      for (const rafId of this.trackedRafs) {
        cancelAnimationFrame(rafId);
      }
    }
    this.trackedRafs.clear();
  }

  /**
   * 3. Detaches and unsubscribes all Firestore snapshots and listeners.
   */
  public detachAllListeners(): void {
    for (const unsub of this.trackedUnsubscribes) {
      try {
        unsub();
      } catch {
        // ignore errors on already detached listeners
      }
    }
    this.trackedUnsubscribes.clear();
  }

  /**
   * 4. Purges all in-memory coordinate queues and buffers.
   */
  public purgeSensitiveLocalTelemetry(): void {
    this.inMemoryQueue = [];
    this.lastCoordinate = null;
  }

  // ── Unified Terminal Teardown ─────────────────────────────────────────────

  /**
   * Sequenced teardown executed upon reaching any terminal state.
   */
  public cleanupTerminalState(reason: TerminalCleanupReason): TerminalStateInvariantReport {
    this.clearAllWatchers();
    this.clearAllTimersAndRafs();
    this.detachAllListeners();
    this.purgeSensitiveLocalTelemetry();

    return this.verifyAllInvariants(reason);
  }

  // ── Invariant Assertions ──────────────────────────────────────────────────

  public assertZeroActiveWatchers(): void {
    if (this.trackedWatchIds.size > 0 || this.isTrackingActive) {
      throw new Error(
        `Terminal invariant violation: ${this.trackedWatchIds.size} watchers remained active after cleanup.`,
      );
    }
  }

  public assertZeroTimers(): void {
    if (this.trackedIntervals.size > 0 || this.trackedRafs.size > 0) {
      throw new Error(
        `Terminal invariant violation: ${this.trackedIntervals.size} intervals or ${this.trackedRafs.size} animation frames remained active.`,
      );
    }
  }

  public assertZeroListeners(): void {
    if (this.trackedUnsubscribes.size > 0) {
      throw new Error(
        `Terminal invariant violation: ${this.trackedUnsubscribes.size} Firestore listeners remained attached.`,
      );
    }
  }

  public assertZeroPrivateCoordinates(): void {
    if (this.inMemoryQueue.length > 0 || this.lastCoordinate !== null) {
      throw new Error(
        `Terminal invariant violation: Private coordinates retained in memory after cleanup (queue: ${this.inMemoryQueue.length}).`,
      );
    }
  }

  public verifyAllInvariants(reason: TerminalCleanupReason): TerminalStateInvariantReport {
    const zeroSensors = this.trackedWatchIds.size === 0 && !this.isTrackingActive;
    const zeroBackgroundServices = true; // Web has no native persistent OS background services
    const zeroListeners = this.trackedUnsubscribes.size === 0 && this.trackedIntervals.size === 0 && this.trackedRafs.size === 0;
    const zeroPrivateCoordinates = this.inMemoryQueue.length === 0 && this.lastCoordinate === null;
    const allPassed = zeroSensors && zeroListeners && zeroPrivateCoordinates;

    return {
      zeroSensors,
      zeroBackgroundServices,
      zeroListeners,
      zeroPrivateCoordinates,
      allPassed,
      timestamp: new Date().toISOString(),
      reason,
    };
  }
}

export const webCleanupCoordinator = new WebCleanupCoordinator();
