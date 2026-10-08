// Crowdbeats V2 — Active Subscription & Read Volume Tracker (Phase 8)
//
// Monitors active real-time Firestore subscriptions, document read volume,
// cache hits, and deduplication efficiency without logging any PII or coordinates.

import 'package:flutter_riverpod/flutter_riverpod.dart';

class ActiveSubscriptionTracker {
  ActiveSubscriptionTracker();

  int _activeSubscriptions = 0;
  int _documentReads = 0;
  int _cacheHits = 0;
  int _deduplicatedDocs = 0;
  int _snapshotEvents = 0;
  int _queriesExecuted = 0;

  int get activeSubscriptions => _activeSubscriptions;
  int get documentReads => _documentReads;
  int get cacheHits => _cacheHits;
  int get deduplicatedDocs => _deduplicatedDocs;
  int get snapshotEvents => _snapshotEvents;
  int get queriesExecuted => _queriesExecuted;

  void trackSubscriptionAttached() {
    _activeSubscriptions++;
  }

  void trackSubscriptionDetached() {
    if (_activeSubscriptions > 0) {
      _activeSubscriptions--;
    }
  }

  void recordQueryExecution({int cellsQueried = 1}) {
    _queriesExecuted += cellsQueried;
  }

  void recordDocumentReads(int count) {
    _documentReads += count;
  }

  void recordCacheHit() {
    _cacheHits++;
  }

  void recordDeduplicatedDocs(int count) {
    _deduplicatedDocs += count;
  }

  void recordSnapshotEvent() {
    _snapshotEvents++;
  }

  void reset() {
    _activeSubscriptions = 0;
    _documentReads = 0;
    _cacheHits = 0;
    _deduplicatedDocs = 0;
    _snapshotEvents = 0;
    _queriesExecuted = 0;
  }

  Map<String, int> toMetrics() => {
        'activeSubscriptions': _activeSubscriptions,
        'documentReads': _documentReads,
        'cacheHits': _cacheHits,
        'deduplicatedDocs': _deduplicatedDocs,
        'snapshotEvents': _snapshotEvents,
        'queriesExecuted': _queriesExecuted,
      };
}

final activeSubscriptionTrackerProvider = Provider<ActiveSubscriptionTracker>((ref) {
  return ActiveSubscriptionTracker();
});
