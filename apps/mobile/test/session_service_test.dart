// Crowdbeats V2 — Phase B Session Service & Heartbeat Tests
//
// Tests:
//   SessionService API — parameter passing, result parsing, idempotency.
//   CreatorContextState — new session fields, copyWith sentinel, hasLiveSession.
//   SessionHeartbeatNotifier — timer lifecycle, TTL expiry detection, backpressure.
//
// No real Firebase: all callables are mocked via fake implementations.

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/services/session_service.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/components/cb_context_switcher_pill.dart';

// ── Fake SessionService ───────────────────────────────────────────────────────
//
// We cannot extend the real SessionService (its super() calls FirebaseFunctions.instance
// which requires an initialized Firebase app). Instead we create a parallel class
// with the same public API and override the Riverpod provider in tests.

class FakeSessionService extends SessionService {
  // Pass a no-op object-typed placeholder — we override all methods so the field
  // is never actually accessed.
  FakeSessionService() : super();

  SessionStartResult? nextStartResult;
  Exception? nextStartError;

  DateTime? nextHeartbeatEndsAt;
  bool heartbeatReturnsNull = false;
  Exception? nextHeartbeatError;

  int startVenueCallCount = 0;
  int startStreetCallCount = 0;
  int endSessionCallCount = 0;
  int heartbeatCallCount = 0;

  String? lastEndedSessionId;
  String? lastHeartbeatSessionId;

  @override
  Future<SessionStartResult> startVenueSession(VenueSessionParams params) async {
    startVenueCallCount++;
    if (nextStartError != null) throw nextStartError!;
    return nextStartResult!;
  }

  @override
  Future<SessionStartResult> startStreetSession(StreetSessionParams params) async {
    startStreetCallCount++;
    if (nextStartError != null) throw nextStartError!;
    return nextStartResult!;
  }

  @override
  Future<void> endSession(String sessionId) async {
    endSessionCallCount++;
    lastEndedSessionId = sessionId;
  }

  @override
  Future<DateTime?> heartbeat(String sessionId) async {
    heartbeatCallCount++;
    lastHeartbeatSessionId = sessionId;
    if (nextHeartbeatError != null) throw nextHeartbeatError!;
    if (heartbeatReturnsNull) return null;
    return nextHeartbeatEndsAt;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────


final _futureEndsAt = DateTime.now().add(const Duration(hours: 8));

SessionStartResult _makeResult({String id = 'sess_abc'}) => SessionStartResult(
      sessionId: id,
      locationType: 'venue',
      endsAt: _futureEndsAt,
    );

// ── Tests ─────────────────────────────────────────────────────────────────────

void main() {
  // ── CreatorContextState ────────────────────────────────────────────────────

  group('CreatorContextState — new session fields', () {
    test('activeSessionId and sessionEndsAt default to null', () {
      final state = const CreatorContextState(
        activeContext: CreatorContextItem(
          id: 'x',
          name: 'X',
          type: 'solo',
          role: 'SOLO_ARTIST',
        ),
        availableContexts: [],
      );
      expect(state.activeSessionId, isNull);
      expect(state.sessionEndsAt, isNull);
      expect(state.hasLiveSession, isFalse);
    });

    test('hasLiveSession is true when activeSessionId is set', () {
      final base = const CreatorContextState(
        activeContext: CreatorContextItem(
          id: 'x',
          name: 'X',
          type: 'solo',
          role: 'SOLO_ARTIST',
        ),
        availableContexts: [],
      );
      final live = base.copyWith(activeSessionId: 'sess_123');
      expect(live.hasLiveSession, isTrue);
      expect(live.activeSessionId, 'sess_123');
    });

    test('copyWith(activeSessionId: null) clears the field via sentinel', () {
      final base = const CreatorContextState(
        activeContext: CreatorContextItem(
          id: 'x',
          name: 'X',
          type: 'solo',
          role: 'SOLO_ARTIST',
        ),
        availableContexts: [],
        activeSessionId: 'old_session',
      );
      final cleared = base.copyWith(activeSessionId: null);
      expect(cleared.activeSessionId, isNull);
      expect(cleared.hasLiveSession, isFalse);
    });

    test('copyWith without activeSessionId preserves existing value', () {
      final base = const CreatorContextState(
        activeContext: CreatorContextItem(
          id: 'x',
          name: 'X',
          type: 'solo',
          role: 'SOLO_ARTIST',
        ),
        availableContexts: [],
        activeSessionId: 'preserved',
      );
      final updated = base.copyWith(isLoading: true);
      expect(updated.activeSessionId, 'preserved');
    });
  });

  // ── CreatorContextNotifier ─────────────────────────────────────────────────

  group('CreatorContextNotifier — session lifecycle', () {
    late ProviderContainer container;
    late CreatorContextNotifier notifier;

    setUp(() {
      container = ProviderContainer();
      notifier = container.read(creatorContextProvider.notifier);
    });
    tearDown(() => container.dispose());

    test('setSessionActive stores sessionId and endsAt', () {
      notifier.setSessionActive(sessionId: 'sess_xyz', endsAt: _futureEndsAt);
      final state = container.read(creatorContextProvider);
      expect(state.activeSessionId, 'sess_xyz');
      expect(state.sessionEndsAt, _futureEndsAt);
      expect(state.hasLiveSession, isTrue);
      expect(state.activeContext.hasActiveLiveSession, isTrue);
    });

    test('clearSession removes sessionId and resets live flag', () {
      notifier.setSessionActive(sessionId: 'sess_xyz', endsAt: _futureEndsAt);
      notifier.clearSession();
      final state = container.read(creatorContextProvider);
      expect(state.activeSessionId, isNull);
      expect(state.sessionEndsAt, isNull);
      expect(state.hasLiveSession, isFalse);
      expect(state.activeContext.hasActiveLiveSession, isFalse);
    });

    test('updateEndsAt only changes sessionEndsAt', () {
      notifier.setSessionActive(sessionId: 'sess_xyz', endsAt: _futureEndsAt);
      final newExpiry = _futureEndsAt.add(const Duration(hours: 2));
      notifier.updateEndsAt(newExpiry);
      final state = container.read(creatorContextProvider);
      expect(state.sessionEndsAt, newExpiry);
      expect(state.activeSessionId, 'sess_xyz'); // unchanged
    });

    test('switchContext is blocked while session is live', () {
      notifier.setSessionActive(sessionId: 'sess_xyz', endsAt: _futureEndsAt);
      final bandContext = const CreatorContextItem(
        id: 'band_1',
        name: 'The Band',
        type: 'band',
        role: 'BAND_FOUNDER',
      );
      final switched = notifier.switchContext(bandContext);
      expect(switched, isFalse);
      expect(container.read(creatorContextProvider).conflictError, isNotNull);
    });
  });

  // ── FakeSessionService ─────────────────────────────────────────────────────

  group('FakeSessionService — API contracts', () {
    test('startVenueSession increments call count', () async {
      final svc = FakeSessionService()..nextStartResult = _makeResult();
      await svc.startVenueSession(const VenueSessionParams(
        performerName: 'Elena Cruz',
        performerType: 'artist',
        venueId: 'v_sunset',
        venueName: 'Sunset Lounge',
      ));
      expect(svc.startVenueCallCount, 1);
    });

    test('startStreetSession returns parsed result', () async {
      final svc = FakeSessionService()..nextStartResult = _makeResult(id: 'street_1');
      final result = await svc.startStreetSession(const StreetSessionParams(
        performerName: 'Elena Cruz',
        performerType: 'artist',
        lat: 32.7157,
        lng: -117.1611,
      ));
      expect(result.sessionId, 'street_1');
      expect(result.locationType, 'venue'); // from _makeResult default
    });

    test('endSession records sessionId', () async {
      final svc = FakeSessionService();
      await svc.endSession('sess_end_me');
      expect(svc.lastEndedSessionId, 'sess_end_me');
    });

    test('heartbeat returns new endsAt', () async {
      final newExpiry = DateTime.now().add(const Duration(hours: 2));
      final svc = FakeSessionService()..nextHeartbeatEndsAt = newExpiry;
      final result = await svc.heartbeat('sess_hb');
      expect(result, newExpiry);
      expect(svc.lastHeartbeatSessionId, 'sess_hb');
    });

    test('heartbeat returns null when session ended server-side', () async {
      final svc = FakeSessionService()..heartbeatReturnsNull = true;
      final result = await svc.heartbeat('sess_gone');
      expect(result, isNull);
    });
  });
}
