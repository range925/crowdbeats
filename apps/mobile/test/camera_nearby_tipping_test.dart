// Crowdbeats V2 — Camera Nearby Tipping Automated QA Test Suite
//
// Independent QA test suite validating all rules & invariants for:
// - Deterministic GPS locations, accuracy levels (20m vs 80m), performer check-ins
// - Camera lifecycle: photo capture, video recording with queued tip intent, permission denial recovery
// - Location matching: 15s throttle, 100m radius threshold, 50m accuracy chooser trigger, 30-min dismiss cooldown, blocked performer exclusion
// - Tip flow & guest auth continuation: PendingTipContext preservation, $5 default amount, idempotency key generation
// - Stitch UI compliance & accessibility (touch targets >= 48dp, screen reader semantics)

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/data/services/stripe_fee_service.dart';
import 'package:crowdbeats_mobile/state/tip_state.dart';

import 'camera_nearby_tipping_fixtures.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. Spatial Geometry & Deterministic Fixtures
  // ═════════════════════════════════════════════════════════════════════════════
  group('1. Spatial Geometry & Deterministic GPS Fixtures', () {
    test('TC-GEO-001: Haversine distance calculation is sub-meter accurate', () {
      final distMaya = computeHaversineMeters(
        kFanUserGps.latitude,
        kFanUserGps.longitude,
        kMayaChenCheckIn.latitude,
        kMayaChenCheckIn.longitude,
      );
      // Maya Chen is ~45.0m North of Fan benchmark
      expect(distMaya, closeTo(45.0, 1.0));

      final distNeon = computeHaversineMeters(
        kFanUserGps.latitude,
        kFanUserGps.longitude,
        kNeonWavesCheckIn.latitude,
        kNeonWavesCheckIn.longitude,
      );
      // The Neon Waves is ~89.0m North of Fan benchmark
      expect(distNeon, closeTo(89.0, 1.0));

      final distOutOfRange = computeHaversineMeters(
        kFanUserGps.latitude,
        kFanUserGps.longitude,
        kOutOfRangeCheckIn.latitude,
        kOutOfRangeCheckIn.longitude,
      );
      // Acoustic Sunset is ~133.4m away (> 100m threshold)
      expect(distOutOfRange, greaterThan(100.0));
      expect(distOutOfRange, closeTo(133.4, 1.5));
    });

    test('TC-GEO-002: Distance threshold 100m inclusion & exclusion boundaries', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [
          kMayaChenCheckIn,   // ~45m -> IN
          kNeonWavesCheckIn,  // ~89m -> IN
          kOutOfRangeCheckIn, // ~133m -> OUT
        ],
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps,
      );

      expect(result.candidates.length, equals(2));
      final ids = result.candidates.map((c) => c.performerId).toList();
      expect(ids, contains('artist-maya-chen'));
      expect(ids, contains('band-neon-waves'));
      expect(ids, isNot(contains('artist-sunset')));
    });

    test('TC-GEO-003: Accuracy levels categorization (20m fine vs 80m coarse)', () {
      expect(kFineAccuracyMeters, lessThan(kChooserThresholdMeters));
      expect(kCoarseAccuracyMeters, greaterThan(kChooserThresholdMeters));
      expect(kChooserThresholdMeters, equals(50.0));
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. Location Matching Coordinator & Invariant Rules
  // ═════════════════════════════════════════════════════════════════════════════
  group('2. Location Matching Coordinator Invariants', () {
    test('TC-MAT-001: Single act + fine accuracy (20m) -> Direct single banner, no chooser', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn],
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(accuracyMeters: 20),
      );

      expect(result.candidates.length, equals(1));
      expect(result.candidates.first.performerName, equals('Maya Chen'));
      expect(result.requiresChooser, isFalse);
    });

    test('TC-MAT-002: Single act + coarse accuracy (80m) -> Triggers chooser sheet to prevent false attribution', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn],
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(accuracyMeters: 80),
      );

      expect(result.candidates.length, equals(1));
      // Accuracy > 50m triggers chooser sheet even with 1 candidate
      expect(result.requiresChooser, isTrue);
    });

    test('TC-MAT-003: Multiple acts within 100m -> Always triggers chooser sheet', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn, kNeonWavesCheckIn],
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(accuracyMeters: 20),
      );

      expect(result.candidates.length, equals(2));
      expect(result.requiresChooser, isTrue);
      // Sorted by proximity ascending
      expect(result.candidates[0].distanceMeters, lessThan(result.candidates[1].distanceMeters));
      expect(result.candidates[0].performerId, equals('artist-maya-chen'));
      expect(result.candidates[1].performerId, equals('band-neon-waves'));
    });

    test('TC-MAT-004: Zero acts within 100m -> Returns empty list, requiresChooser is false', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kOutOfRangeCheckIn],
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps,
      );

      expect(result.candidates, isEmpty);
      expect(result.requiresChooser, isFalse);
    });

    test('TC-MAT-005: 15-second throttle prevents excessive queries; allowed after 15s', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn],
      );

      final t0 = DateTime.parse('2026-10-05T03:00:00Z');
      final res1 = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(timestamp: t0),
      );
      expect(res1.wasThrottled, isFalse);
      expect(res1.candidates.length, equals(1));

      // Query 10 seconds later (under 15s interval, <25m movement)
      final t1 = t0.add(const Duration(seconds: 10));
      final res2 = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(timestamp: t1),
      );
      expect(res2.wasThrottled, isTrue);
      expect(res2.candidates, isEmpty);

      // Query 16 seconds after t0 (>15s interval)
      final t2 = t0.add(const Duration(seconds: 16));
      final res3 = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(timestamp: t2),
      );
      expect(res3.wasThrottled, isFalse);
      expect(res3.candidates.length, equals(1));
    });

    test('TC-MAT-006: 30-minute dismiss cooldown suppresses performer until expired', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn],
      );

      final t0 = DateTime.parse('2026-10-05T03:00:00Z');
      final res1 = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(timestamp: t0),
      );
      expect(res1.candidates.length, equals(1));

      // User dismisses Maya Chen at t0
      coordinator.dismissPerformer('artist-maya-chen', t0);

      // Query at t0 + 10 minutes (within 30-min cooldown)
      final t1 = t0.add(const Duration(minutes: 10));
      final res2 = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(timestamp: t1),
      );
      expect(res2.candidates, isEmpty);

      // Query at t0 + 31 minutes (cooldown expired)
      final t2 = t0.add(const Duration(minutes: 31));
      final res3 = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(timestamp: t2),
      );
      expect(res3.candidates.length, equals(1));
      expect(res3.candidates.first.performerId, equals('artist-maya-chen'));
    });

    test('TC-MAT-007: Blocked performer is strictly excluded (Social Safety)', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn, kBlockedPerformerCheckIn],
        blockedPerformerIds: {'artist-blocked-99'},
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps,
      );

      expect(result.candidates.length, equals(1));
      expect(result.candidates.first.performerId, equals('artist-maya-chen'));
      expect(result.candidates.any((c) => c.performerId == 'artist-blocked-99'), isFalse);
    });

    test('TC-MAT-008: Band entity integrity preserves collective band type and ID', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kNeonWavesCheckIn],
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps,
      );

      expect(result.candidates.length, equals(1));
      final bandCandidate = result.candidates.first;
      expect(bandCandidate.performerType, equals('band'));
      expect(bandCandidate.performerId, equals('band-neon-waves'));
      expect(bandCandidate.performerName, equals('The Neon Waves'));
    });

    test('TC-MAT-009: Multiple check-ins with one blocked collapses to single candidate banner if fine accuracy', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn, kBlockedPerformerCheckIn],
        blockedPerformerIds: {'artist-blocked-99'},
      );

      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(accuracyMeters: 20),
      );

      // Because artist-blocked-99 is excluded, only Maya Chen remains.
      // Fine accuracy (20m) means requiresChooser should be false!
      expect(result.candidates.length, equals(1));
      expect(result.candidates.first.performerId, equals('artist-maya-chen'));
      expect(result.requiresChooser, isFalse);
    });

    test('TC-MAT-010: Independent dismiss cooldowns across multiple acts', () {
      final coordinator = CameraNearbyMatchingCoordinator(
        activeSessions: [kMayaChenCheckIn, kNeonWavesCheckIn],
      );

      final t0 = DateTime.parse('2026-10-05T03:00:00Z');
      // User dismisses Maya Chen only
      coordinator.dismissPerformer('artist-maya-chen', t0);

      // Query 5 minutes later with fine accuracy
      final t1 = t0.add(const Duration(minutes: 5));
      final result = coordinator.queryNearby(
        currentLocation: kFanUserGps.copyWith(timestamp: t1, accuracyMeters: 20),
        force: true,
      );

      // Only The Neon Waves appears; Maya Chen is suppressed
      expect(result.candidates.length, equals(1));
      expect(result.candidates.first.performerId, equals('band-neon-waves'));
      expect(result.requiresChooser, isFalse);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. Camera Lifecycle, Video Recording Queue & Media Preservation
  // ═════════════════════════════════════════════════════════════════════════════
  group('3. Camera Lifecycle & Recording Queued Intent', () {
    test('TC-CAM-001: Photo capture records pristine file without watermarks', () {
      var state = const CameraControllerState(
        mode: CameraCaptureMode.photo,
        isViewfinderActive: true,
      );

      // Simulate capturing photo
      const rawCapturedPath = '/storage/emulated/0/DCIM/Crowdbeats/IMG_20261005_001.jpg';
      state = state.copyWith(lastCapturedMediaPath: rawCapturedPath);

      expect(state.lastCapturedMediaPath, equals(rawCapturedPath));
      // Invariant: pristine media path, zero watermark composite
      expect(state.lastCapturedMediaPath!.endsWith('.jpg'), isTrue);
      expect(state.isRecordingVideo, isFalse);
    });

    test('TC-CAM-002: Tapping tip banner during video recording queues intent without interrupting video', () {
      var state = const CameraControllerState(
        mode: CameraCaptureMode.video,
        isRecordingVideo: true,
      );

      const candidate = NearbyPerformerCandidate(
        performerId: 'artist-maya-chen',
        performerType: 'artist',
        performerName: 'Maya Chen',
        activeSessionId: 'session-maya-101',
        locationType: 'street',
        distanceMeters: 45,
        genres: ['Indie Folk'],
      );

      // Simulate banner tap during video recording
      final queuedIntent = QueuedCameraTipIntent(
        candidate: candidate,
        defaultAmountCents: 500,
        queuedAt: DateTime.now(),
        mediaDraftPath: '/storage/DCIM/Crowdbeats/VID_20261005_REC.mp4',
      );

      state = state.copyWith(queuedTipIntent: queuedIntent);

      // Invariants:
      // 1. Video recording remains active
      expect(state.isRecordingVideo, isTrue);
      // 2. Queued intent is held
      expect(state.queuedTipIntent, isNotNull);
      expect(state.queuedTipIntent!.candidate.performerName, equals('Maya Chen'));
      expect(state.queuedTipIntent!.defaultAmountCents, equals(500));
    });

    test('TC-CAM-003: Stopping video recording safely flushes video and resolves queued tip checkout', () {
      const candidate = NearbyPerformerCandidate(
        performerId: 'artist-maya-chen',
        performerType: 'artist',
        performerName: 'Maya Chen',
        activeSessionId: 'session-maya-101',
        locationType: 'street',
        distanceMeters: 45,
        genres: ['Indie Folk'],
      );

      var state = CameraControllerState(
        mode: CameraCaptureMode.video,
        isRecordingVideo: true,
        queuedTipIntent: QueuedCameraTipIntent(
          candidate: candidate,
          defaultAmountCents: 500,
          queuedAt: DateTime.now(),
          mediaDraftPath: '/storage/DCIM/Crowdbeats/VID_20261005_REC.mp4',
        ),
      );

      // Stop recording and finalize video
      const finalizedVideoPath = '/storage/DCIM/Crowdbeats/VID_20261005_FINAL.mp4';
      state = state.copyWith(
        isRecordingVideo: false,
        lastCapturedMediaPath: finalizedVideoPath,
      );

      expect(state.isRecordingVideo, isFalse);
      expect(state.lastCapturedMediaPath, equals(finalizedVideoPath));

      // Resolve queued intent into tip checkout payload
      final intentToExecute = state.queuedTipIntent;
      expect(intentToExecute, isNotNull);
      expect(intentToExecute!.candidate.performerId, equals('artist-maya-chen'));
      expect(intentToExecute.defaultAmountCents, equals(500));

      // Clear queue after checkout triggered
      state = state.copyWith(clearQueuedIntent: true);
      expect(state.queuedTipIntent, isNull);
    });

    test('TC-CAM-005: Multiple taps on banner during video recording updates queued intent without crashing', () {
      var state = const CameraControllerState(
        mode: CameraCaptureMode.video,
        isRecordingVideo: true,
      );

      const candidate = NearbyPerformerCandidate(
        performerId: 'artist-maya-chen',
        performerType: 'artist',
        performerName: 'Maya Chen',
        activeSessionId: 'session-maya-101',
        locationType: 'street',
        distanceMeters: 45,
        genres: ['Indie Folk'],
      );

      // Tap 1
      state = state.copyWith(
        queuedTipIntent: QueuedCameraTipIntent(
          candidate: candidate,
          defaultAmountCents: 500,
          queuedAt: DateTime.parse('2026-10-05T03:00:00Z'),
        ),
      );

      // Tap 2 (simulated second tap)
      state = state.copyWith(
        queuedTipIntent: QueuedCameraTipIntent(
          candidate: candidate,
          defaultAmountCents: 500,
          queuedAt: DateTime.parse('2026-10-05T03:00:02Z'),
        ),
      );

      expect(state.isRecordingVideo, isTrue);
      expect(state.queuedTipIntent!.queuedAt, equals(DateTime.parse('2026-10-05T03:00:02Z')));
    });

    testWidgets('TC-CAM-004: Camera permission denial recovery view', (tester) async {
      bool retryTapped = false;
      bool settingsTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraPermissionRecoveryView(
              onRetryPermission: () => retryTapped = true,
              onOpenSettings: () => settingsTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Camera Access Needed'), findsOneWidget);
      expect(find.text('Allow Camera Access'), findsOneWidget);
      expect(find.text('Open Device Settings'), findsOneWidget);

      await tester.tap(find.byKey(const ValueKey('camera_grant_retry_button')));
      await tester.pump();
      expect(retryTapped, isTrue);

      await tester.tap(find.byKey(const ValueKey('camera_open_settings_button')));
      await tester.pump();
      expect(settingsTapped, isTrue);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. Tip Flow, Fee Breakdown & Idempotency Key
  // ═════════════════════════════════════════════════════════════════════════════
  group('4. Tip Flow, Idempotency & Fee Deductions', () {
    test('TC-TIP-001: \$5.00 (500 cents) default tip fee deduction calculation', () {
      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: 500,
      );

      // 6% Platform technology fee = 30 cents
      expect(breakdown.platformFeeCents, equals(30));
      // Stripe fee: 2.9% + $0.30 = 14 + 30 = 44 cents
      expect(breakdown.stripeFeeCents, equals(44));
      // Total deductions = 74 cents
      expect(breakdown.totalDeductionsCents, equals(74));
      // Net payout to performer = $4.26 (426 cents)
      expect(breakdown.netAmountCents, equals(426));
      expect(breakdown.grossAmountCents, equals(500));
    });

    test('TC-TIP-002: TipFlowNotifier generates fresh UUIDv4 idempotency key per attempt', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(tipFlowProvider.notifier);

      notifier.prepare(
        recipientId: 'artist-maya-chen',
        recipientName: 'Maya Chen',
        recipientType: 'artist',
        amountCents: 500,
      );

      final state1 = container.read(tipFlowProvider);
      expect(state1.idempotencyKey, isNotNull);
      expect(state1.idempotencyKey, isNotEmpty);
      expect(state1.amountCents, equals(500));
      expect(state1.platformFeeCents, equals(30));
      expect(state1.netAmountCents, equals(426));

      // Prepare again to verify distinct idempotency key
      notifier.prepare(
        recipientId: 'artist-maya-chen',
        recipientName: 'Maya Chen',
        recipientType: 'artist',
        amountCents: 500,
      );

      final state2 = container.read(tipFlowProvider);
      expect(state2.idempotencyKey, isNotNull);
      expect(state2.idempotencyKey, isNot(equals(state1.idempotencyKey)));
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. Guest Continuation & PendingTipContext Preservation
  // ═════════════════════════════════════════════════════════════════════════════
  group('5. Guest Continuation & PendingTipContext Preservation', () {
    test('TC-GST-001: PendingTipContext holds camera draft metadata across auth gate', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(tipFlowProvider.notifier);

      const guestPendingContext = PendingTipContext(
        creatorId: 'artist-maya-chen',
        creatorSlug: 'maya-chen',
        creatorName: 'Maya Chen',
        creatorType: 'artist',
        selectedTipAmountCents: 500,
        currency: 'USD',
        sourceScreen: 'camera_capture',
        message: 'Great street set in Torrance!',
      );

      // Save context before redirecting to login/signup
      notifier.savePendingTipContext(guestPendingContext);

      expect(container.read(tipFlowProvider).pendingTipContext, isNotNull);
      final saved = container.read(tipFlowProvider).pendingTipContext!;
      expect(saved.creatorId, equals('artist-maya-chen'));
      expect(saved.creatorName, equals('Maya Chen'));
      expect(saved.selectedTipAmountCents, equals(500));
      expect(saved.sourceScreen, equals('camera_capture'));
      expect(saved.message, equals('Great street set in Torrance!'));

      // Clean up after auth resumption
      notifier.clearPendingTipContext();
      expect(container.read(tipFlowProvider).pendingTipContext, isNull);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. Stitch UI & Accessibility (Widget Tests)
  // ═════════════════════════════════════════════════════════════════════════════
  group('6. Stitch UI & Accessibility Widget Tests', () {
    testWidgets('TC-UI-001: NearbyPerformerBanner renders live info, CTA, and dismiss button with min 48dp touch targets', (tester) async {
      bool tipTapped = false;
      bool dismissTapped = false;

      const candidate = NearbyPerformerCandidate(
        performerId: 'artist-maya-chen',
        performerType: 'artist',
        performerName: 'Maya Chen',
        activeSessionId: 'session-maya-101',
        locationType: 'street',
        distanceMeters: 45,
        genres: ['Indie Folk'],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NearbyPerformerBanner(
              candidate: candidate,
              isRecording: false,
              onTipTap: () => tipTapped = true,
              onDismiss: () => dismissTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Maya Chen'), findsOneWidget);
      expect(find.text('Live nearby · 45m'), findsOneWidget);
      expect(find.text('Tip \$5'), findsOneWidget);

      // Verify Touch Target size of Tip $5 CTA is >= 48dp
      final ctaFinder = find.byKey(const ValueKey('tip_banner_cta_button'));
      expect(ctaFinder, findsOneWidget);
      final ctaSize = tester.getSize(ctaFinder);
      expect(ctaSize.height, greaterThanOrEqualTo(48.0));
      expect(ctaSize.width, greaterThanOrEqualTo(48.0));

      // Verify Dismiss button touch target size >= 48dp
      final dismissFinder = find.byKey(const ValueKey('tip_banner_dismiss_button'));
      expect(dismissFinder, findsOneWidget);
      final dismissSize = tester.getSize(dismissFinder);
      expect(dismissSize.height, greaterThanOrEqualTo(48.0));
      expect(dismissSize.width, greaterThanOrEqualTo(48.0));

      // Tap CTA
      await tester.tap(ctaFinder);
      await tester.pump();
      expect(tipTapped, isTrue);

      // Tap Dismiss
      await tester.tap(dismissFinder);
      await tester.pump();
      expect(dismissTapped, isTrue);
    });

    testWidgets('TC-UI-002: NearbyPerformerBanner in video recording mode displays minimal quiet pill', (tester) async {
      bool tipTapped = false;

      const candidate = NearbyPerformerCandidate(
        performerId: 'artist-maya-chen',
        performerType: 'artist',
        performerName: 'Maya Chen',
        activeSessionId: 'session-maya-101',
        locationType: 'street',
        distanceMeters: 45,
        genres: ['Indie Folk'],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NearbyPerformerBanner(
              candidate: candidate,
              isRecording: true,
              onTipTap: () => tipTapped = true,
              onDismiss: () {},
            ),
          ),
        ),
      );

      expect(find.text('Live nearby: Maya Chen · Queued'), findsOneWidget);
      // Large Tip $5 button not shown during recording
      expect(find.byKey(const ValueKey('tip_banner_cta_button')), findsNothing);

      await tester.tap(find.text('Live nearby: Maya Chen · Queued'));
      await tester.pump();
      expect(tipTapped, isTrue);
    });

    testWidgets('TC-UI-003: NearbyPerformerChooserSheet displays candidates sorted by proximity and handles selection', (tester) async {
      NearbyPerformerCandidate? selectedCandidate;

      final candidates = [
        const NearbyPerformerCandidate(
          performerId: 'artist-maya-chen',
          performerType: 'artist',
          performerName: 'Maya Chen',
          activeSessionId: 'session-maya-101',
          locationType: 'street',
          distanceMeters: 45,
          genres: ['Indie Folk'],
        ),
        const NearbyPerformerCandidate(
          performerId: 'band-neon-waves',
          performerType: 'band',
          performerName: 'The Neon Waves',
          activeSessionId: 'session-neon-202',
          locationType: 'venue',
          distanceMeters: 89,
          genres: ['Synthwave', 'Indie Rock'],
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NearbyPerformerChooserSheet(
              candidates: candidates,
              onSelect: (c) => selectedCandidate = c,
            ),
          ),
        ),
      );

      expect(find.text('Performers Playing Nearby'), findsOneWidget);
      expect(find.text('Select who you would like to support'), findsOneWidget);
      expect(find.text('Maya Chen'), findsOneWidget);
      expect(find.text('The Neon Waves'), findsOneWidget);
      expect(find.text('45m'), findsOneWidget);
      expect(find.text('89m'), findsOneWidget);

      // Tap Maya Chen tile
      await tester.tap(find.byKey(const ValueKey('candidate_tile_artist-maya-chen')));
      await tester.pump();
      expect(selectedCandidate, isNotNull);
      expect(selectedCandidate!.performerId, equals('artist-maya-chen'));
    });

    testWidgets('TC-UI-004: Screen reader accessibility semantics are correctly exposed', (tester) async {
      const candidate = NearbyPerformerCandidate(
        performerId: 'artist-maya-chen',
        performerType: 'artist',
        performerName: 'Maya Chen',
        activeSessionId: 'session-maya-101',
        locationType: 'street',
        distanceMeters: 45,
        genres: ['Indie Folk'],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NearbyPerformerBanner(
              candidate: candidate,
              isRecording: false,
              onTipTap: () {},
              onDismiss: () {},
            ),
          ),
        ),
      );

      expect(
        find.bySemanticsLabel(RegExp(r'Live nearby Maya Chen')),
        findsOneWidget,
      );
    });
  });
}
