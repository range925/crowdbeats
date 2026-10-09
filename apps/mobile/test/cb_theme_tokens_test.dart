// Crowdbeats V2 — Phase 4 Theme Tokens & Cold Start Persistence Tests

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_theme.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';

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

  group('Phase 4 — Semantic Token Architecture & Palettes', () {
    test('CbColors provides ratified Direction B brand and neutral tokens', () {
      expect(CbColors.brandCoralPink, const Color(0xFFFF97BA));
      expect(CbColors.brandElectricViolet, const Color(0xFF8B5CF6));
      expect(CbColors.brandAquaMint, const Color(0xFF2DD4BF));
      expect(CbColors.brandObsidian, const Color(0xFF131315));

      // Neutral dark surfaces
      expect(CbColors.darkCanvas, const Color(0xFF131315));
      expect(CbColors.darkCard, const Color(0xFF27272A));
      expect(CbColors.darkRaised, const Color(0xFF1C1C1F));
      expect(CbColors.darkOverlay, const Color(0xFF222226));

      // Neutral light surfaces
      expect(CbColors.lightCanvas, const Color(0xFFF8F9FA));
      expect(CbColors.lightRaised, const Color(0xFFFFFFFF));
      expect(CbColors.lightCard, const Color(0xFFFFFFFF));
      expect(CbColors.lightBorderSubtle, const Color(0xFFE5E7EB));
      expect(CbColors.lightTextPrimary, const Color(0xFF111827));
      expect(CbColors.lightTextSecondary, const Color(0xFF4B5563));
      expect(CbColors.lightStatusLive, const Color(0xFF0D9488));
    });

    test('CbThemeExtension.defaults defines dark theme semantic contracts', () {
      const ext = CbThemeExtension.defaults;
      expect(ext.surfaceCanvas, CbColors.darkCanvas);
      expect(ext.surfaceRaised, CbColors.darkRaised);
      expect(ext.surfaceCard, CbColors.surfaceCard);
      expect(ext.borderFocus, CbColors.brandElectricViolet);
      expect(ext.statusLive, CbColors.brandAquaMint);
      expect(ext.statusError, CbColors.errorRed);
      expect(ext.textPrimary, CbColors.textPrimary);
      expect(ext.textSecondary, CbColors.textSecondary);
    });

    test('CbThemeExtension.lightDefaults defines light theme semantic contracts', () {
      const ext = CbThemeExtension.lightDefaults;
      expect(ext.surfaceCanvas, CbColors.lightCanvas);
      expect(ext.surfaceRaised, CbColors.lightRaised);
      expect(ext.surfaceCard, CbColors.lightCard);
      expect(ext.borderFocus, CbColors.brandElectricViolet);
      expect(ext.statusLive, CbColors.lightStatusLive);
      expect(ext.textPrimary, CbColors.lightTextPrimary);
      expect(ext.textSecondary, CbColors.lightTextSecondary);
      expect(ext.borderSubtle, CbColors.lightBorderSubtle);
    });

    testWidgets('CbThemeContext extension retrieves tokens from BuildContext in Dark mode', (tester) async {
      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark().copyWith(
            extensions: const [CbThemeExtension.defaults],
          ),
          home: Builder(
            builder: (ctx) {
              capturedContext = ctx;
              return const SizedBox();
            },
          ),
        ),
      );

      expect(capturedContext.isDark, isTrue);
      expect(capturedContext.cbTheme.surfaceCanvas, CbColors.darkCanvas);
      expect(capturedContext.cbTheme.borderFocus, CbColors.brandElectricViolet);
    });

    testWidgets('CbThemeContext extension retrieves tokens from BuildContext in Light mode', (tester) async {
      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light().copyWith(
            extensions: const [CbThemeExtension.lightDefaults],
          ),
          home: Builder(
            builder: (ctx) {
              capturedContext = ctx;
              return const SizedBox();
            },
          ),
        ),
      );

      expect(capturedContext.isDark, isFalse);
      expect(capturedContext.cbTheme.surfaceCanvas, CbColors.lightCanvas);
      expect(capturedContext.cbTheme.statusLive, CbColors.lightStatusLive);
    });
  });

  group('Phase 4 — Cold Start & Persisted Preference', () {
    test('UserSettingsNotifier initializes with given cold-start themeMode', () {
      final notifier = UserSettingsNotifier(initialThemeMode: 'light');
      expect(notifier.state.privacy.themeMode, 'light');
    });

    test('UserSettingsNotifier persists theme changes to SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({});
      final notifier = UserSettingsNotifier(initialThemeMode: 'system');

      await notifier.setThemeMode('dark');
      expect(notifier.state.privacy.themeMode, 'dark');

      final sp = await SharedPreferences.getInstance();
      expect(sp.getString('cb_theme_mode'), 'dark');

      await notifier.setThemeMode('light');
      expect(notifier.state.privacy.themeMode, 'light');
      expect(sp.getString('cb_theme_mode'), 'light');
    });
  });
}
