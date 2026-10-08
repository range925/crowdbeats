// Crowdbeats V2 — Location Backpressure & Offline Sample Queue
//
// Enforces a strict upper bound on in-memory samples during network interruptions,
// sensor bursts, or slow uploads. Unlimited queues are explicitly prohibited.
//
// Invariants:
// - Maximum capacity is strictly bounded (default: 30 samples).
// - Drop policy: drops the oldest queued sample when capacity is reached.
// - Provides batch draining, acknowledgement, and backoff retry.

import 'location_fix.dart';

class LocationBackpressureQueue {
  LocationBackpressureQueue({
    this.maxCapacity = 30,
  }) : assert(maxCapacity > 0, 'maxCapacity must be greater than zero');

  /// Maximum number of samples allowed in the queue before dropping occurs.
  final int maxCapacity;

  final List<LocationFix> _queue = [];

  int _droppedCount = 0;
  int _enqueuedCount = 0;
  int _acknowledgedCount = 0;
  int _retryCount = 0;

  /// Current number of samples in the queue.
  int get size => _queue.length;

  /// Whether the queue is currently empty.
  bool get isEmpty => _queue.isEmpty;

  /// Whether the queue is currently at maximum capacity.
  bool get isFull => _queue.length >= maxCapacity;

  /// Total number of samples that were dropped due to capacity overflow.
  int get droppedCount => _droppedCount;

  /// Total number of samples enqueued since initialization.
  int get enqueuedCount => _enqueuedCount;

  /// Total number of samples successfully acknowledged after upload.
  int get acknowledgedCount => _acknowledgedCount;

  /// Total number of retry attempts for failed batches.
  int get retryCount => _retryCount;

  /// Adds a sample to the queue. If the queue is at capacity, the oldest sample
  /// is discarded to prevent unbounded memory growth.
  ///
  /// Returns `true` if added without dropping, or `false` if an older sample was dropped.
  bool enqueue(LocationFix sample) {
    _enqueuedCount++;
    var dropped = false;

    if (_queue.length >= maxCapacity) {
      _queue.removeAt(0); // Drop oldest sample
      _droppedCount++;
      dropped = true;
    }

    _queue.add(sample);
    return !dropped;
  }

  /// Drains up to [maxBatchSize] samples for an upload attempt without immediately
  /// removing them from the retry tracking buffer.
  List<LocationFix> drainBatch({int maxBatchSize = 10}) {
    if (_queue.isEmpty) return const [];
    final count = _queue.length < maxBatchSize ? _queue.length : maxBatchSize;
    return List<LocationFix>.from(_queue.sublist(0, count));
  }

  /// Acknowledges successful transmission of [batch], removing those samples
  /// from the queue.
  void acknowledgeBatch(List<LocationFix> batch) {
    for (final item in batch) {
      final index = _queue.indexOf(item);
      if (index != -1) {
        _queue.removeAt(index);
        _acknowledgedCount++;
      }
    }
  }

  /// Handles a failed transmission of [batch]. Samples that are still in the
  /// queue remain queued for the next attempt.
  void recordBatchFailure(List<LocationFix> batch) {
    _retryCount++;
    // The items remain in the queue naturally; if new items arrived and
    // filled the queue, older failed items will be dropped per the drop policy.
  }

  /// Clears all queued samples and resets counters if [resetCounters] is true.
  void clear({bool resetCounters = false}) {
    _queue.clear();
    if (resetCounters) {
      _droppedCount = 0;
      _enqueuedCount = 0;
      _acknowledgedCount = 0;
      _retryCount = 0;
    }
  }

  /// Returns an unmodifiable snapshot of the current queued samples.
  List<LocationFix> toList() => List.unmodifiable(_queue);
}
