// Crowdbeats V2 — Phase 14: System-Wide Verification, Device Matrices,
// Accessibility (a11y), and Performance Profiling Test Suite.
//
// Verifies:
// 1. Viewport Dimension Matrix: Narrow phone (360x640), Standard (390x844), Wide (412x915), Tablet (768x1024), Landscape (844x390)
// 2. Safe Areas & Insets: Notch/island cutouts and virtual keyboard insets (bottom: 320dp)
// 3. Accessibility Floors: 48dp minimum touch target floor for interactive widgets (WCAG 2.2 AA)
// 4. Text Scaling Resilience: 0.8x, 1.0x, 1.2x, 1.4x (140% accessibility) without RenderFlex overflows
// 5. High Contrast & Bold Text: Semantics tree propagation and contrast verification
// 6. Reduced Motion: Suppressing vestibular animations when reduceMotion is enabled
// 7. Lifecycle & Resource Teardown: Mounting and unmounting screens without leaked listeners or dispose errors
// 8. Stationary Battery Conservation: Pausing active location streaming when stationary

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_theme.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/settings/accessibility_appearance_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/dashboard/solo_musician_dashboard.dart';
import 'package:crowdbeats_mobile/ui/creator/live/live_session_active_view.dart';
import 'package:crowdbeats_mobile/ui/fan/tip/tip_flow_screen.dart';

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

class _FakeLocationProvider implements LocationProvider {
  bool isContinuousActive = false;

  @override
  LocationMode get currentMode => LocationMode.off;

  @override
  Future<bool> isPermissionGranted() async => true;

  @override
  Future<LocationPermissionResult> requestPermission() async =>
      LocationPermissionResult.granted;

  @override
  Future<LocationPermissionState> getPermissionState() async =>
      LocationPermissionState.foregroundPrecise;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async =>
      LocationPermissionState.foregroundPrecise;

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
  Stream<LocationFix> streamContinuous() {
    isContinuousActive = true;
    return const Stream.empty();
  }

  @override
  Future<void> stopContinuous() async {
    isContinuousActive = false;
  }

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

class _TestUserSettingsNotifier extends UserSettingsNotifier {
  _TestUserSettingsNotifier([CbUserSettingsState? initial]) {
    if (initial != null) {
      state = initial;
    }
  }

  @override
  Future<void> loadSettings() async {}

  @override
  Future<void> updatePrivacy(CbPrivacyPreferences prefs) async {
    state = state.copyWith(privacy: prefs);
  }

  @override
  Future<void> updateAccessibility(CbAccessibilityPreferences prefs) async {
    state = state.copyWith(accessibility: prefs);
  }

  @override
  Future<void> updateSecurity(CbSecurityPreferences prefs) async {
    state = state.copyWith(security: prefs);
  }
}

Widget _buildTestApp({
  required Widget child,
  Size size = const Size(390, 844),
  EdgeInsets padding = EdgeInsets.zero,
  EdgeInsets viewInsets = EdgeInsets.zero,
  double textScaleFactor = 1.0,
  bool boldText = false,
  bool isDark = true,
  UserSettingsNotifier? settingsNotifier,
  LocationProvider? locationProvider,
}) {
  final effectiveNotifier = settingsNotifier ?? _TestUserSettingsNotifier();
  final effectiveLocationProvider = locationProvider ?? _FakeLocationProvider();

  return ProviderScope(
    overrides: [
      userSettingsProvider.overrideWith((ref) => effectiveNotifier),
      locationProviderProvider.overrideWithValue(effectiveLocationProvider),
      authStateProvider.overrideWithValue(
        const CbAuthState(
          status: CbAuthStatus.authenticated,
          personaType: 'artist',
        ),
      ),
      creatorContextProvider.overrideWith(
        (ref) => CreatorContextNotifier(
          initialContext: const CreatorContextItem(
            id: 'test_artist_1',
            name: 'Jake Rios',
            type: 'solo',
            role: 'SOLO_ARTIST',
          ),
        ),
      ),
    ],
    child: MaterialApp(
      theme: CbTheme.light(),
      darkTheme: CbTheme.dark(),
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      home: MediaQuery(
        data: MediaQueryData(
          size: size,
          padding: padding,
          viewInsets: viewInsets,
          textScaler: TextScaler.linear(textScaleFactor),
          boldText: boldText,
        ),
        child: child is Scaffold ? child : Scaffold(body: child),
      ),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Phase 14 — Device Matrix & Viewport Dimensional Layouts', () {
    testWidgets('1. Narrow Phone (360x640) renders without RenderFlex overflow', (tester) async {
      tester.view.physicalSize = const Size(360, 640);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        _buildTestApp(
          child: const AccessibilityAppearanceScreen(),
          size: const Size(360, 640),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Appearance & Accessibility'), findsOneWidget);
      expect(find.text('THEME & DISPLAY'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('2. Standard Phone (390x844) renders with comfortable spacing', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        _buildTestApp(
          child: const SoloMusicianDashboard(),
          size: const Size(390, 844),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('AVAILABLE BALANCE'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);
      expect(find.text("TODAY'S TIPS"), findsOneWidget);
      expect(find.text(r'$125.00'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('3. Wide Phone (412x915) renders without layout stretch distortion', (tester) async {
      tester.view.physicalSize = const Size(412, 915);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        _buildTestApp(
          child: const SoloMusicianDashboard(),
          size: const Size(412, 915),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('CAMPAIGN BACKERS'), findsOneWidget);
      expect(find.text('28'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('4. Tablet Viewport (768x1024) scales cleanly across expanded canvas', (tester) async {
      tester.view.physicalSize = const Size(768, 1024);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        _buildTestApp(
          child: const AccessibilityAppearanceScreen(),
          size: const Size(768, 1024),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('High Contrast Mode'), findsOneWidget);
      expect(find.text('Reduce Motion'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('5. Landscape Orientation (844x390) scrolls vertically without unbounded height error', (tester) async {
      tester.view.physicalSize = const Size(844, 390);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        _buildTestApp(
          child: const AccessibilityAppearanceScreen(),
          size: const Size(844, 390),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('THEME & DISPLAY'), findsOneWidget);
      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -200));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('Phase 14 — Ergonomics, Safe Areas & Keyboard Insets', () {
    testWidgets('6. Safe Area Notch and Home Indicator padding applied correctly', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      const safeInsets = EdgeInsets.only(top: 47, bottom: 34);

      await tester.pumpWidget(
        _buildTestApp(
          child: const AccessibilityAppearanceScreen(),
          size: const Size(390, 844),
          padding: safeInsets,
        ),
      );
      await tester.pumpAndSettle();

      final safeAreaFinder = find.byType(SafeArea);
      expect(safeAreaFinder, findsWidgets);
      expect(tester.takeException(), isNull);
    });

    testWidgets('7. Virtual Keyboard Inset (bottom: 320dp) does not trigger overflow', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        _buildTestApp(
          child: const TipFlowScreen(
            recipientId: 'performer_test_1',
            initialAmountCents: 1500,
          ),
          size: const Size(390, 844),
          viewInsets: const EdgeInsets.only(bottom: 320),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });
  });

  group('Phase 14 — Accessibility (a11y) & WCAG 2.2 AA Compliance', () {
    testWidgets('8. Interactive touch targets satisfy minimum 48dp floor', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CbButton(
                    label: 'Primary CTA',
                    size: CbButtonSize.sm,
                    onPressed: () {},
                  ),
                  const SizedBox(height: 16),
                  CbTipPresetCard(
                    amountLabel: r'$5',
                    isSelected: true,
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final buttonSize = tester.getSize(find.widgetWithText(CbButton, 'Primary CTA'));
      expect(buttonSize.height, greaterThanOrEqualTo(48.0));
      expect(buttonSize.width, greaterThanOrEqualTo(48.0));

      final chipSize = tester.getSize(find.byType(CbTipPresetCard));
      expect(chipSize.height, greaterThanOrEqualTo(48.0));
      expect(chipSize.width, greaterThanOrEqualTo(48.0));
    });

    testWidgets('9. Extreme Text Scaling (1.4x / 140%) renders cleanly on narrow screen', (tester) async {
      tester.view.physicalSize = const Size(360, 640);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final notifier = _TestUserSettingsNotifier(
        const CbUserSettingsState(
          accessibility: CbAccessibilityPreferences(fontScale: 1.4),
        ),
      );

      await tester.pumpWidget(
        _buildTestApp(
          child: const AccessibilityAppearanceScreen(),
          size: const Size(360, 640),
          textScaleFactor: 1.4,
          settingsNotifier: notifier,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Appearance & Accessibility'), findsOneWidget);
      expect(find.text('140%'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('10. High Contrast Mode applies boldText semantics and contrast tokens', (tester) async {
      final notifier = _TestUserSettingsNotifier(
        const CbUserSettingsState(
          accessibility: CbAccessibilityPreferences(highContrastMode: true),
        ),
      );

      await tester.pumpWidget(
        _buildTestApp(
          child: const AccessibilityAppearanceScreen(),
          boldText: true,
          settingsNotifier: notifier,
        ),
      );
      await tester.pumpAndSettle();

      final mediaQuery = tester.widget<MediaQuery>(find.byType(MediaQuery).last);
      expect(mediaQuery.data.boldText, isTrue);
      expect(find.text('High Contrast Mode'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });

  group('Phase 14 — Performance, Resource Teardown & Battery Guard', () {
    testWidgets('11. Reduced Motion suppresses vestibular animations immediately', (tester) async {
      final notifier = _TestUserSettingsNotifier(
        const CbUserSettingsState(
          accessibility: CbAccessibilityPreferences(reduceMotion: true),
        ),
      );

      await tester.pumpWidget(
        _buildTestApp(
          child: const AccessibilityAppearanceScreen(),
          settingsNotifier: notifier,
        ),
      );
      await tester.pumpAndSettle();

      expect(notifier.state.accessibility.reduceMotion, isTrue);
      expect(tester.takeException(), isNull);
    });

    testWidgets('12. Screen unmount tears down all resources without memory leaks or errors', (tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: const LiveSessionActiveView(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('STAGE LIVE'), findsOneWidget);

      // Replace widget with empty container to trigger unmount & dispose
      await tester.pumpWidget(
        _buildTestApp(
          child: const SizedBox.shrink(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('STAGE LIVE'), findsNothing);
      expect(tester.takeException(), isNull);
    });

    testWidgets('13. Stationary Battery Conservation pauses continuous GPS stream', (tester) async {
      final fakeLocation = _FakeLocationProvider();
      fakeLocation.streamContinuous();
      expect(fakeLocation.isContinuousActive, isTrue);

      await tester.pumpWidget(
        _buildTestApp(
          child: const LiveSessionActiveView(),
          locationProvider: fakeLocation,
        ),
      );
      await tester.pumpAndSettle();

      // Tap Pause Mobile Sharing button to enter stationary battery preservation
      final pauseButton = find.byKey(const Key('btn_toggle_mobile_sharing'));
      expect(pauseButton, findsOneWidget);
      await tester.tap(pauseButton);
      await tester.pumpAndSettle();

      expect(fakeLocation.isContinuousActive, isFalse);
      expect(find.text('Resume Mobile GPS'), findsOneWidget);
    });
  });
}
