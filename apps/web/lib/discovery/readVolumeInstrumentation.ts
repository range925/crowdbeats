/**
 * Crowdbeats V2 — Web Read Volume Instrumentation (Phase 8)
 *
 * Tracks client-side discovery read volume, query executions, cache reuse,
 * overlapping deduplication, and active subscription lifecycle.
 *
 * Privacy Invariant:
 * Strictly zero geographic coordinates, lat/lng tuples, IP addresses,
 * or identifiable user telemetry are stored or emitted by this service.
 */

import type { ReadVolumeMetrics } from '@crowdbeats/contracts';

export class WebReadVolumeInstrumentation {
  private documentReads = 0;
  private queryExecutions = 0;
  private cacheHits = 0;
  private deduplicatedDocs = 0;
  private snapshotEvents = 0;
  private activeSubscriptions = 0;

  recordQuery(): void {
    this.queryExecutions++;
  }

  recordReads(count: number): void {
    if (count > 0) {
      this.documentReads += count;
    }
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordDeduplicated(count: number): void {
    if (count > 0) {
      this.deduplicatedDocs += count;
    }
  }

  recordSnapshotEvent(): void {
    this.snapshotEvents++;
  }

  recordSubscriptionAttached(): void {
    this.activeSubscriptions++;
  }

  recordSubscriptionDetached(): void {
    if (this.activeSubscriptions > 0) {
      this.activeSubscriptions--;
    }
  }

  getMetrics(): ReadVolumeMetrics {
    return {
      documentReads: this.documentReads,
      queryExecutions: this.queryExecutions,
      cacheHits: this.cacheHits,
      deduplicatedDocs: this.deduplicatedDocs,
      snapshotEvents: this.snapshotEvents,
      activeSubscriptions: this.activeSubscriptions,
    };
  }

  reset(): void {
    this.documentReads = 0;
    this.queryExecutions = 0;
    this.cacheHits = 0;
    this.deduplicatedDocs = 0;
    this.snapshotEvents = 0;
    this.activeSubscriptions = 0;
  }
}

export const webReadVolumeTracker = new WebReadVolumeInstrumentation();
