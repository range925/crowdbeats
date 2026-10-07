import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/state/discovery_state.dart';
import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/ui/fan/fan_shell.dart';
import 'package:crowdbeats_mobile/ui/fan/tabs/nearby_tab.dart';
import 'package:crowdbeats_mobile/ui/fan/public_profile_screen.dart';

class _TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context);
  }
}

/// No-op LocationProvider for tests that don't exercise GPS flows.
/// Always returns null for one-shot (permission implicitly denied).
class _NoOpLocationProvider implements LocationProvider {
  @override
  LocationMode get currentMode => LocationMode.off;

  @override
  Future<bool> isPermissionGranted() async => false;

  @override
  Future<LocationPermissionResult> requestPermission() async =>
      LocationPermissionResult.denied;

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async => null;

  @override
  Future<LocationPermissionState> getPermissionState() async =>
      LocationPermissionState.notDetermined;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async =>
      LocationPermissionState.denied;

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async => false;

  @override
  Future<bool> openSettings() async => true;

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
        provider: 'noop',
        mode: 'off',
      );

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Phase 2 — Mobile Public Discovery & Navigation', () {
    testWidgets('FanShell renders Home and Nearby navigation without login', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_NoOpLocationProvider()),
          ],
          child: const MaterialApp(
            home: FanShell(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(FanShell), findsOneWidget);
      expect(find.text('Nearby'), findsWidgets);
      expect(find.text('Discover'), findsOneWidget);
      expect(find.text('Account'), findsOneWidget);
    });

    test('DiscoveryNotifier correctly handles location search and hierarchy', () async {
      // Inject a mock LocationProvider so no real GPS is accessed in tests.
      final container = ProviderContainer(
        overrides: [
          locationProviderProvider.overrideWithValue(_NoOpLocationProvider()),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(discoveryProvider.notifier);

      // Default location is San Diego
      expect(container.read(discoveryProvider).discoveryLocation.city, 'San Diego');
      expect(container.read(discoveryProvider).isSearchAreaMode, false);

      // Search Torrance
      notifier.onLocationSearchInput('Tor');
      final suggestions = container.read(discoveryProvider).autocompleteSuggestions;
      expect(suggestions.any((s) => s.city == 'Torrance'), true);

      // Select Torrance
      notifier.selectSearchedLocation(DiscoveryLocation.torrance);
      expect(container.read(discoveryProvider).discoveryLocation.city, 'Torrance');
      expect(container.read(discoveryProvider).isSearchAreaMode, true);

      // "Use My Location" with no cached fix — triggers one-shot GPS (mock returns null)
      // isSearchAreaMode remains false after the call completes.
      await notifier.useMyLocation();
      expect(container.read(discoveryProvider).isSearchAreaMode, false);
    });

    testWidgets('NearbyTab renders search bar and segmented controls', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_NoOpLocationProvider()),
          ],
          child: const MaterialApp(
            home: NearbyTab(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Nearby Live Music'), findsOneWidget);
      expect(find.text('Search city, town, state or country'), findsOneWidget);
      expect(find.text('Map'), findsOneWidget);
      expect(find.text('List'), findsOneWidget);
      expect(find.text('Venues'), findsNWidgets(2)); // Segmented bar + category chip
    });

    testWidgets('PublicProfileScreen renders without authentication', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_NoOpLocationProvider()),
          ],
          child: const MaterialApp(
            home: PublicProfileScreen(slug: 'jake-rios', type: 'artist'),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Jake Rios'), findsOneWidget);
      expect(find.text('About'), findsOneWidget);
      expect(find.text('\$5'), findsOneWidget);
      expect(find.text('\$10'), findsOneWidget);
      expect(find.text('\$20'), findsOneWidget);
    });
  });
}
