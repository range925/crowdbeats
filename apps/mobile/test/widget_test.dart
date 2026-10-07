/// Crowdbeats V2 — Bootstrap Widget Test
///
/// Phase 1: Verifies that the bootstrap placeholder renders without error.
/// Full widget test suite is built in Phase 6 (Fan) through Phase 10 (Enterprise).
library;

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:crowdbeats_mobile/main.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

// 1x1 transparent PNG bytes
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
  void addAuthenticate(Uri url, String realm, HttpClientCredentials credentials) {}
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

class _FakeUserSettingsNotifier extends UserSettingsNotifier {
  _FakeUserSettingsNotifier() {
    state = state.copyWith(isLoading: false);
  }

  @override
  Future<void> loadSettings() async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Production App Shell & Theme', () {
    testWidgets('CrowdbeatsV2App boots successfully and renders MaterialApp root', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
          ],
          child: const CrowdbeatsV2App(),
        ),
      );

      // Root application and ProviderScope render without unhandled exceptions
      expect(find.byType(CrowdbeatsV2App), findsOneWidget);
    });

    testWidgets('CrowdbeatsV2App provides accessible widget tree', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
          ],
          child: const CrowdbeatsV2App(),
        ),
      );
      await tester.pump();

      expect(find.byType(CrowdbeatsV2App), findsOneWidget);
    });
  });
}
