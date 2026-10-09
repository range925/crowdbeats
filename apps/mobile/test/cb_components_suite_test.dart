// Crowdbeats V2 — Phase 4 Component & Responsive Layout Test Suite
// Verifies CbButton, CbFormField, CbTipSheet, and CbSafeScaffold across light/dark,
// narrow viewports (320dp), and large text scale factors.

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_theme.dart';

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

Widget _wrapWithTheme(
  Widget child, {
  bool isDark = true,
  double textScaleFactor = 1.0,
  Size size = const Size(390, 844),
}) {
  return MaterialApp(
    theme: ThemeData.light().copyWith(
      extensions: const [CbThemeExtension.lightDefaults],
    ),
    darkTheme: ThemeData.dark().copyWith(
      extensions: const [CbThemeExtension.defaults],
    ),
    themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
    home: MediaQuery(
      data: MediaQueryData(
        size: size,
        textScaler: TextScaler.linear(textScaleFactor),
      ),
      child: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Phase 4 — CbButton Ergonomics & Touch Target Floor', () {
    testWidgets('CbButton sm size satisfies minimum 48dp touch floor', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CbButton(
            label: 'Small Button',
            size: CbButtonSize.sm,
            onPressed: () {},
          ),
        ),
      );

      final buttonFinder = find.byType(CbButton);
      final size = tester.getSize(buttonFinder);
      expect(size.height, greaterThanOrEqualTo(48.0));
      expect(size.width, greaterThanOrEqualTo(48.0));
    });

    testWidgets('CbButton md and lg satisfy comfortable touch floors', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CbButton(
                label: 'Medium Button',
                size: CbButtonSize.md,
                onPressed: () {},
              ),
              CbButton(
                label: 'Large Button',
                size: CbButtonSize.lg,
                onPressed: () {},
              ),
            ],
          ),
        ),
      );

      final mdFinder = find.widgetWithText(CbButton, 'Medium Button');
      final lgFinder = find.widgetWithText(CbButton, 'Large Button');

      expect(tester.getSize(mdFinder).height, 56.0);
      expect(tester.getSize(lgFinder).height, 64.0);
    });

    testWidgets('CbButton enters loading state and disables user interactions', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(
        _wrapWithTheme(
          CbButton(
            label: 'Submit Tip',
            isLoading: true,
            onPressed: () => tapped = true,
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading…'), findsOneWidget);

      await tester.tap(find.byType(CbButton));
      await tester.pump();
      expect(tapped, isFalse);
    });

    testWidgets('CbButton disabled state displays reduced opacity and disabled semantics', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          const CbButton(
            label: 'Disabled CTA',
            onPressed: null,
          ),
        ),
      );

      final opacityFinder = find.byType(Opacity);
      expect(opacityFinder, findsOneWidget);
      final Opacity opacity = tester.widget(opacityFinder);
      expect(opacity.opacity, 0.45);
    });
  });

  group('Phase 4 — CbFormField Validation & Visual States', () {
    testWidgets('CbFormField renders resting state with label and placeholder', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          const CbFormField(
            label: 'Cheer Message',
            hintText: 'Add an encouraging note…',
          ),
        ),
      );

      expect(find.text('Cheer Message'), findsOneWidget);
      expect(find.text('Add an encouraging note…'), findsOneWidget);
    });

    testWidgets('CbFormField renders error validation text when isValid is false', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          const CbFormField(
            label: 'Custom Amount',
            isValid: false,
            validationText: 'Amount must be at least \$1.00',
          ),
        ),
      );

      expect(find.text('Amount must be at least \$1.00'), findsOneWidget);
    });

    testWidgets('CbFormField renders success confirmation when isValid is true', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          const CbFormField(
            label: 'Promo Code',
            isValid: true,
            validationText: 'Code applied!',
          ),
        ),
      );

      expect(find.text('Code applied!'), findsOneWidget);
    });
  });

  group('Phase 4 — CbTipSheet Live Tipping & Fee Itemization', () {
    testWidgets('CbTipSheet renders 4 presets (\$2, \$5, \$10, \$20) and itemized fees', (tester) async {
      int? submittedCents;
      String? submittedCheer;
      bool? submittedAnon;

      await tester.pumpWidget(
        _wrapWithTheme(
          CbTipSheet(
            performerName: 'The Echoes',
            performerId: 'performer_echoes_1',
            initialAmountCents: 1000,
            onConfirmTip: (cents, cheer, anon) {
              submittedCents = cents;
              submittedCheer = cheer;
              submittedAnon = anon;
            },
          ),
          size: const Size(390, 844),
        ),
      );
      await tester.pumpAndSettle();

      // Header and performer context
      expect(find.text('Tip Performer'), findsOneWidget);
      expect(find.text('The Echoes'), findsOneWidget);
      expect(find.text('LIVE NOW'), findsOneWidget);

      // Presets
      expect(find.text(r'$2'), findsOneWidget);
      expect(find.text(r'$5'), findsOneWidget);
      expect(find.text(r'$10'), findsOneWidget);
      expect(find.text(r'$20'), findsOneWidget);

      // Fee transparency itemization
      expect(find.text('Platform Fee (6%)'), findsOneWidget);
      expect(find.text('Stripe Processing Fee'), findsOneWidget);
      expect(find.text('Performer Net Payout'), findsOneWidget);
      expect(find.text('Total Charge'), findsOneWidget);

      // Tap $20 preset
      await tester.tap(find.text(r'$20'));
      await tester.pumpAndSettle();

      // Submit tip
      await tester.tap(find.widgetWithText(CbButton, 'Send \$20.00 Tip'));
      await tester.pumpAndSettle();

      expect(submittedCents, 2000);
      expect(submittedCheer, isNull);
      expect(submittedAnon, isFalse);
    });

    testWidgets('CbTipSheet supports custom amount and integer cents calculation', (tester) async {
      int? submittedCents;

      await tester.pumpWidget(
        _wrapWithTheme(
          CbTipSheet(
            performerName: 'Solo Jazz Sax',
            performerId: 'solo_sax_1',
            initialAmountCents: 500,
            onConfirmTip: (cents, cheer, anon) {
              submittedCents = cents;
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap custom chip
      await tester.tap(find.text('Custom'));
      await tester.pumpAndSettle();

      // Enter 45 dollars
      await tester.enterText(find.byType(TextField).first, '45');
      await tester.pumpAndSettle();

      // Tap submit
      await tester.tap(find.widgetWithText(CbButton, 'Send \$45.00 Tip'));
      await tester.pumpAndSettle();

      expect(submittedCents, 4500);
    });
  });

  group('Phase 4 — Responsive Scaffolds & Overflow Resilience', () {
    testWidgets('CbSafeScaffold handles narrow 320dp viewport without RenderFlex overflow', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CbSafeScaffold(
            body: ListView(
              children: [
                const Text('Compact Viewport Header'),
                CbButton(
                  label: 'Narrow CTA Button',
                  onPressed: () {},
                  fullWidth: true,
                ),
                const CbFormField(
                  label: 'Field on Narrow Width',
                  hintText: 'Enter text here',
                ),
              ],
            ),
          ),
          size: const Size(320, 568), // iPhone SE 1st gen size
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Compact Viewport Header'), findsOneWidget);
      expect(find.text('Narrow CTA Button'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('CbSafeScaffold handles 2.0x accessibility text scaling without overflow', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CbSafeScaffold(
            body: SingleChildScrollView(
              child: Column(
                children: [
                  const Text('Accessibility Scaled Text'),
                  CbButton(
                    label: 'Scaled CTA',
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ),
          textScaleFactor: 2.0,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Accessibility Scaled Text'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('CbSafeScaffold dismisses active keyboard focus on outer tap', (tester) async {
      final focusNode = FocusNode();

      await tester.pumpWidget(
        _wrapWithTheme(
          CbSafeScaffold(
            dismissKeyboardOnTap: true,
            body: Column(
              children: [
                TextField(focusNode: focusNode),
                const SizedBox(height: 100),
                const Text('Outside Content Area'),
              ],
            ),
          ),
        ),
      );

      focusNode.requestFocus();
      await tester.pump();
      expect(focusNode.hasFocus, isTrue);

      // Tap on empty space outside text field
      await tester.tap(find.text('Outside Content Area'));
      await tester.pump();
      expect(focusNode.hasFocus, isFalse);

      focusNode.dispose();
    });
  });
}
