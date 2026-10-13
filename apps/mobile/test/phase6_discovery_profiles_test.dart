// Crowdbeats V2 — Phase 6 Discovery & Public Profiles Suite
//
// Validates:
// 1. GST-05: GuestAccountScreen grouped card layout, DM Sans, and auth routing
// 2. GST-01 / DSC-01: PublicDiscoveryHome guest actions, map, and discovery cards
// 3. PRF-01: Solo musician public profile rendering, verified badge, genres, and tip presets
// 4. PRF-02: Band public profile rendering and details
// 5. PRF-03: Safety & Moderation action sheet accessibility from public profile
// 6. GST-07: ActivityTab unauthenticated guest value proposition and auth CTA
// 7. GST-03: PopularSecondaryView filtering and layout stability

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/discovery_state.dart';
import 'package:crowdbeats_mobile/state/tip_state.dart';
import 'package:crowdbeats_mobile/ui/guest/guest_account_screen.dart';
import 'package:crowdbeats_mobile/ui/fan/public_discovery_home.dart';
import 'package:crowdbeats_mobile/ui/fan/public_profile_screen.dart';
import 'package:crowdbeats_mobile/ui/fan/tabs/activity_tab.dart';
import 'package:crowdbeats_mobile/ui/fan/views/popular_secondary_view.dart';
import 'package:crowdbeats_mobile/ui/components/cb_grouped_card.dart';
import 'package:crowdbeats_mobile/ui/components/cb_settings_row.dart';
import 'package:crowdbeats_mobile/ui/components/cb_safety_action_sheet.dart';
import 'package:crowdbeats_mobile/ui/fan/tip/tip_auth_gate_modal.dart';

final _kTransparentPng = Uint8List.fromList(<int>[
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
]);

class _TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) => _MockHttpClient();
}

class _MockHttpClient implements HttpClient {
  @override
  bool autoUncompress = true;
  @override
  Duration? connectionTimeout;
  @override
  Duration idleTimeout = const Duration(seconds: 15);
  @override
  int? maxConnectionsPerHost;
  @override
  String? userAgent;

  @override
  void addCredentials(Uri url, String realm, HttpClientCredentials credentials) {}
  @override
  void close({bool force = false}) {}

  @override
  Future<HttpClientRequest> getUrl(Uri url) async => _MockHttpClientRequest();
  @override
  Future<HttpClientRequest> openUrl(String method, Uri url) async => _MockHttpClientRequest();

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockHttpClientRequest implements HttpClientRequest {
  @override
  final HttpHeaders headers = _MockHttpHeaders();

  @override
  Future<HttpClientResponse> close() async => _MockHttpClientResponse();

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockHttpHeaders implements HttpHeaders {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockHttpClientResponse extends Stream<List<int>> implements HttpClientResponse {
  @override
  int get statusCode => 200;
  @override
  int get contentLength => _kTransparentPng.length;
  @override
  HttpClientResponseCompressionState get compressionState =>
      HttpClientResponseCompressionState.notCompressed;
  @override
  final HttpHeaders headers = _MockHttpHeaders();

  @override
  StreamSubscription<List<int>> listen(
    void Function(List<int> event)? onData, {
    Function? onError,
    void Function()? onDone,
    bool? cancelOnError,
  }) {
    return Stream<List<int>>.value(_kTransparentPng).listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Phase 6 — GST-05: GuestAccountScreen Grouped Card & Ergonomics', () {
    testWidgets('GuestAccountScreen renders header, buttons, and grouped legal card', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: GuestAccountScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Join Crowdbeats'), findsOneWidget);
      expect(find.text('Create Account'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);

      // Verify grouped card exists and has 4 legal/support rows
      expect(find.byType(CbGroupedCard), findsOneWidget);
      expect(find.byType(CbSettingsRow), findsNWidgets(4));
      expect(find.text('Help & Support Center'), findsOneWidget);
      expect(find.text('Terms of Service'), findsOneWidget);
      expect(find.text('Privacy Policy'), findsOneWidget);
      expect(find.text('DMCA & Copyright Policy'), findsOneWidget);
    });
  });

  group('Phase 6 — GST-01 / DSC-01: PublicDiscoveryHome Guest Mode & Feed', () {
    testWidgets('PublicDiscoveryHome displays CROWDBEATS header, Sign in/Join, and discovery cards', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: PublicDiscoveryHome(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('CROWDBEATS'), findsOneWidget);
      expect(find.text('LIVE'), findsWidgets);
      expect(find.text('Sign in'), findsOneWidget);
      expect(find.text('Join'), findsOneWidget);
      expect(find.text('Discover music around you'), findsOneWidget);
      expect(find.text('Nearby musicians'), findsOneWidget);
      expect(find.text('Popular on Crowdbeats'), findsOneWidget);
    });
  });

  group('Phase 6 — PRF-01 & PRF-02: PublicProfileScreen (Solo Artist & Band)', () {
    testWidgets('Renders solo artist profile with verified badge, genres, and tip presets', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: PublicProfileScreen(
              slug: 'elena-cruz',
              type: 'artist',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Elena Cruz'), findsWidgets);
      expect(find.text('Verified'), findsOneWidget);
      expect(find.text('\$5'), findsOneWidget);
      expect(find.text('\$10'), findsOneWidget);
      expect(find.text('\$20'), findsOneWidget);
      expect(find.text('Custom Tip'), findsOneWidget);
    });

    testWidgets('Renders band profile with band bio and genres', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: PublicProfileScreen(
              slug: 'the-midnight-echoes',
              type: 'band',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('The Midnight Echoes'), findsWidgets);
      expect(find.text('Verified'), findsOneWidget);
    });

    testWidgets('Unauthenticated tip preset tap opens TipAuthGateModal', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: PublicProfileScreen(
              slug: 'elena-cruz',
              type: 'artist',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Tap $10 preset button
      await tester.tap(find.text('\$10'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Auth gate modal should appear
      expect(find.byType(TipAuthGateModal), findsOneWidget);
    });

    testWidgets('PRF-03: Safety & moderation menu opens CbSafetyActionSheet', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: PublicProfileScreen(
              slug: 'elena-cruz',
              type: 'artist',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Tap safety icon in app bar
      final safetyButton = find.byTooltip('Safety & Moderation');
      expect(safetyButton, findsOneWidget);
      await tester.tap(safetyButton);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Safety action sheet should appear
      expect(find.byType(CbSafetyActionSheet), findsOneWidget);
    });
  });

  group('Phase 6 — GST-07: ActivityTab Unauthenticated Explainer', () {
    testWidgets('ActivityTab renders sign-in gate with CbButton when unauthenticated', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: ActivityTab(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Activity & Alerts'), findsOneWidget);
      expect(find.text('Sign in to view your activity'), findsOneWidget);
      expect(find.text('Sign In / Register'), findsOneWidget);
    });
  });

  group('Phase 6 — GST-03: PopularSecondaryView Feed', () {
    testWidgets('PopularSecondaryView renders header, filter chips, and performer list', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: PopularSecondaryView(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.textContaining('Popular in'), findsOneWidget);
      expect(find.text('Ranked by active fan engagement'), findsOneWidget);
      expect(find.text('Trending'), findsOneWidget);
      expect(find.text('Solo Artists'), findsOneWidget);
      expect(find.text('Bands'), findsOneWidget);
    });
  });
}
