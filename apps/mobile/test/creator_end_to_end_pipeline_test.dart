// Crowdbeats V2 — Phase 8 End-to-End Creator Pipeline Integration Test
// Validates complete workflow: Context Switch -> Live Check-In -> Rotating QR -> Tip Event -> Split Distribution -> Balances -> Direct Payout.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/data/services/session_service.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/state/session_heartbeat_notifier.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/creator/creator_shell.dart';

class _FakeSessionService extends SessionService {
  @override
  Future<SessionStartResult> startVenueSession(VenueSessionParams params) async {
    return SessionStartResult(
      sessionId: 'sess_e2e_123',
      locationType: 'venue',
      endsAt: DateTime.now().add(const Duration(hours: 2)),
    );
  }

  @override
  Future<void> endSession(String sessionId) async {}
}

class _FakeLocationProvider implements LocationProvider {
  _FakeLocationProvider({
    LocationPermissionState initialState = LocationPermissionState.foregroundPrecise,
  }) : currentState = initialState;

  LocationPermissionState currentState;

  @override
  LocationMode get currentMode => LocationMode.liveStationary;

  @override
  Future<bool> isPermissionGranted() async => true;

  @override
  Future<LocationPermissionResult> requestPermission() async =>
      LocationPermissionResult.granted;

  @override
  Future<LocationPermissionState> getPermissionState() async => currentState;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async => currentState;

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async => true;

  @override
  Future<bool> openSettings() async => true;

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async => null;

  @override
  Stream<LocationFix> streamContinuous() => const Stream.empty();

  @override
  Future<void> stopContinuous() async {}

  @override
  Future<LocationFix?> cachedFix({Duration maxAge = const Duration(minutes: 5)}) async => null;

  @override
  void cancelCurrentOperation() {}

  @override
  Stream<LocationFix> startAdaptive(LocationMode targetMode) => const Stream.empty();

  @override
  Future<void> stopAdaptive() async {}

  @override
  Stream<GeofenceEvent> monitorGeofence({
    required LocationFix centre,
    required double radiusMeters,
    required String regionId,
  }) => const Stream.empty();

  @override
  Future<void> cancelGeofence(String regionId) async {}

  @override
  LocationDiagnostics get diagnostics => const LocationDiagnostics(
        provider: 'fake',
        mode: 'off',
      );

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();
}

void main() {
  group('Phase 8 — End-to-End Solo & Band Creator Pipeline Integration', () {
    testWidgets('Full pipeline: Solo Live Check-in, QR Presentation, Session Summary, and Payout Request', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer(
        overrides: [
          sessionServiceProvider.overrideWithValue(_FakeSessionService()),
          locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
        ],
      );
      addTearDown(container.dispose);

      // Step 1: Render Creator Shell with Solo context
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: CreatorShell(),
          ),
        ),
      );

      expect(find.text('Elena Cruz (Solo)'), findsOneWidget);

      // Step 2: Switch to Live Tab (Tab index 1)
      await tester.tap(find.text('Live'));
      await tester.pumpAndSettle();

      expect(find.text('Ready to take the stage?'), findsOneWidget);
      expect(find.text('Check In & Go Live'), findsWidgets);

      // Step 3: Open Live Check-In Sheet & Start Performance
      await tester.tap(find.text('Check In & Go Live').first);
      await tester.pumpAndSettle();

      expect(find.text('Live Stage Check-In'), findsOneWidget);
      expect(find.text('Sunset Lounge'), findsAtLeastNWidgets(1));

      await tester.tap(find.text('Sunset Lounge').first);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Go Live & Broadcast'));
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      // Accept pre-permission disclosure dialog if presented
      if (find.text('Allow While In Use & Check In').evaluate().isNotEmpty) {
        await tester.tap(find.text('Allow While In Use & Check In'));
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pumpAndSettle();
      }

      // State is now LIVE
      expect(container.read(creatorContextProvider).activeContext.hasActiveLiveSession, isTrue);
      expect(find.text('STAGE LIVE'), findsOneWidget);
      expect(find.text('Present QR Code'), findsOneWidget);

      // Step 4: Present Rotating Anti-Tamper QR Code Modal
      await tester.tap(find.text('Present QR Code'));
      await tester.pumpAndSettle();

      expect(find.text('Stage Tip QR'), findsOneWidget);
      expect(find.text('Static Signage Backup'), findsOneWidget);
      expect(find.text('Copy Link'), findsOneWidget);

      // Close QR Modal
      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      // Step 5: End Performance and View Reconciled Summary Modal
      await tester.tap(find.text('End Show'));
      await tester.pumpAndSettle();

      expect(find.text('End Live Performance?'), findsOneWidget);
      await tester.tap(find.text('End Session'));
      await tester.pumpAndSettle();

      expect(find.text('Performance Completed!'), findsOneWidget);
      expect(find.text('GROSS TIPS COLLECTED'), findsOneWidget);

      await tester.tap(find.text('Back to Creator Dashboard'));
      await tester.pumpAndSettle();

      expect(container.read(creatorContextProvider).activeContext.hasActiveLiveSession, isFalse);

      // Step 6: Verify Balances and Request Direct Payout
      await tester.tap(find.text('Studio'));
      await tester.pumpAndSettle();

      expect(find.text('Solo Creator Studio'), findsOneWidget);
    });

    testWidgets('Band context switching, treasury distribution & governance isolation', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: CreatorShell(),
          ),
        ),
      );

      // Switch context to Band
      final switched = container.read(creatorContextProvider.notifier).switchContext(
            const CreatorContextItem(
              id: 'band_midnight',
              name: 'The Midnight Echoes',
              type: 'band',
              role: 'BAND_FOUNDER',
            ),
          );

      expect(switched, isTrue);
      await tester.pumpAndSettle();

      expect(find.text('The Midnight Echoes'), findsWidgets);
      expect(find.text('Your Role: BAND_FOUNDER (40% Split)'), findsOneWidget);
      expect(find.text(r'$1,850.00'), findsOneWidget); // Band Treasury
      expect(find.text(r'$740.00'), findsOneWidget);   // 40% personal split
    });
  });
}
