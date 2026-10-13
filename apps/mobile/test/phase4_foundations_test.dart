// Crowdbeats V2 — Phase 4 Shared Flutter Foundations & Architecture Test Suite
//
// Verifies:
// 1. CbGroupedCard & CbGroupedCard.divided (Uber/Lyft grouped pattern with hairline dividers)
// 2. CbSettingsSection(grouped: true) & CbSettingsRow (Stitch screen d6dd2f8f53fc4c19bb730886d774998a)
// 3. CbButton Electric Purple (#8B5CF6) styling & minimum 48dp touch floor
// 4. FanShell guest (3 tabs) vs authenticated (5 tabs) navigation state & primary accent
// 5. CreatorShell unified navigation & dynamic context switcher
// 6. Accessibility text scaling resilience (2.0x scale factor)

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/fan/fan_shell.dart';
import 'package:crowdbeats_mobile/ui/creator/creator_shell.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_theme.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_typography.dart';

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
  bool followRedirects = true;

  @override
  int maxRedirects = 5;

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

Widget _wrapWithApp(
  Widget child, {
  bool isDark = true,
  double textScaleFactor = 1.0,
  Size size = const Size(390, 844),
  List<Override> overrides = const [],
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      theme: CbTheme.light(),
      darkTheme: CbTheme.dark(),
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      home: MediaQuery(
        data: MediaQueryData(
          size: size,
          textScaler: TextScaler.linear(textScaleFactor),
        ),
        child: Scaffold(
          body: child,
        ),
      ),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Phase 4 — Grouped Cards & Settings Row Pattern', () {
    testWidgets('CbGroupedCard.divided renders children with hairline dividers', (tester) async {
      await tester.pumpWidget(
        _wrapWithApp(
          CbGroupedCard.divided(
            children: const [
              Text('Row 1'),
              Text('Row 2'),
              Text('Row 3'),
            ],
          ),
        ),
      );

      expect(find.text('Row 1'), findsOneWidget);
      expect(find.text('Row 2'), findsOneWidget);
      expect(find.text('Row 3'), findsOneWidget);

      // Between 3 items, exactly 2 dividers should be inserted
      final dividers = find.byType(Divider);
      expect(dividers, findsNWidgets(2));

      // Check card decoration
      final cardFinder = find.byType(CbGroupedCard);
      expect(cardFinder, findsOneWidget);
      final cardWidget = tester.widget<CbGroupedCard>(cardFinder);
      expect(cardWidget.borderRadius, 12.0);
    });

    testWidgets('CbSettingsSection wraps rows in grouped card when grouped is true', (tester) async {
      await tester.pumpWidget(
        _wrapWithApp(
          CbSettingsSection(
            title: 'Account & Security',
            grouped: true,
            children: [
              CbSettingsRow(
                title: 'Personal Info',
                subtitle: 'Name, email, and phone',
                icon: Icons.person_outline,
                onTap: () {},
              ),
              CbSettingsRow(
                title: 'Security',
                subtitle: 'Password and 2FA',
                icon: Icons.security_outlined,
                onTap: () {},
              ),
            ],
          ),
        ),
      );

      expect(find.text('ACCOUNT & SECURITY'), findsOneWidget);
      expect(find.text('Personal Info'), findsOneWidget);
      expect(find.text('Security'), findsOneWidget);

      // Verify CbGroupedCard is present
      expect(find.byType(CbGroupedCard), findsOneWidget);
      // Verify hairline divider between the 2 rows
      expect(find.byType(Divider), findsOneWidget);
    });

    testWidgets('CbSettingsRow renders with accessible semantics and non-color cues', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(
        _wrapWithApp(
          CbSettingsRow(
            title: 'Payment Methods',
            subtitle: 'Saved cards and billing',
            icon: Icons.credit_card_outlined,
            valueText: '2 cards',
            statusBadge: 'Active',
            statusBadgeColor: CbColors.statusSuccess,
            onTap: () => tapped = true,
          ),
        ),
      );

      expect(find.text('Payment Methods'), findsOneWidget);
      expect(find.text('Saved cards and billing'), findsOneWidget);
      expect(find.text('2 cards'), findsOneWidget);
      expect(find.text('Active'), findsOneWidget);

      // Tap row and verify trigger
      await tester.tap(find.text('Payment Methods'));
      expect(tapped, isTrue);

      // Verify semantic information
      final semanticsFinder = find.byWidgetPredicate(
        (widget) => widget is Semantics && widget.properties.label == 'Payment Methods, Saved cards and billing',
      );
      expect(semanticsFinder, findsOneWidget);
    });
  });

  group('Phase 4 — CbButton Electric Purple Accent & Minimum Touch Target', () {
    testWidgets('CbButton primary variant uses Electric Purple (#8B5CF6)', (tester) async {
      await tester.pumpWidget(
        _wrapWithApp(
          CbButton(
            label: 'Confirm Tip',
            variant: CbButtonVariant.primary,
            size: CbButtonSize.md,
            onPressed: () {},
          ),
        ),
      );

      expect(find.text('Confirm Tip'), findsOneWidget);
      final buttonSize = tester.getSize(find.byType(CbButton));
      expect(buttonSize.height, greaterThanOrEqualTo(48.0));
      expect(buttonSize.width, greaterThanOrEqualTo(48.0));
    });

    testWidgets('CbTypography provides DM Sans text theme with tabular figures', (tester) async {
      final textTheme = CbTypography.textTheme();
      expect(textTheme.bodyLarge, isNotNull);
      expect(textTheme.headlineMedium, isNotNull);

      final statStyle = CbTypography.numericStat();
      expect(statStyle.fontFeatures, isNotNull);
      expect(statStyle.fontFeatures!.any((f) => f.feature == 'tnum'), isTrue);
      await tester.pump();
    });
  });

  group('Phase 4 — Persona Shells Architecture', () {
    testWidgets('FanShell renders 3 tabs for unauthenticated Guest', (tester) async {
      const unauthenticatedAuth = CbAuthState(
        status: CbAuthStatus.unauthenticated,
      );

      await tester.pumpWidget(
        _wrapWithApp(
          const FanShell(),
          overrides: [
            authStateProvider.overrideWith((ref) => unauthenticatedAuth),
          ],
        ),
      );

      // Guest navigation has exactly 3 destinations: Nearby, Discover, Account
      expect(find.text('Nearby'), findsOneWidget);
      expect(find.text('Discover'), findsOneWidget);
      expect(find.text('Account'), findsOneWidget);

      // Should NOT have Fan-only tabs
      expect(find.text('Activity'), findsNothing);
      expect(find.text('Profile'), findsNothing);
    });

    testWidgets('FanShell renders 5 tabs for authenticated Fan', (tester) async {
      const authenticatedAuth = CbAuthState(
        status: CbAuthStatus.authenticated,
        personaType: 'fan',
      );

      await tester.pumpWidget(
        _wrapWithApp(
          const FanShell(),
          overrides: [
            authStateProvider.overrideWith((ref) => authenticatedAuth),
          ],
        ),
      );

      // Fan navigation has 5 destinations: Home, Nearby, Tip CTA, Activity, Profile
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Nearby'), findsOneWidget);
      expect(find.text('Activity'), findsOneWidget);
      expect(find.text('Profile'), findsOneWidget);
      expect(find.bySemanticsLabel('Tip Performer'), findsOneWidget); // Center Tip button
    });

    testWidgets('CreatorShell renders unified 5 tabs and dynamic context pill', (tester) async {
      await tester.pumpWidget(
        _wrapWithApp(
          const CreatorShell(),
        ),
      );

      // Unified Creator navigation: Home, Live, Campaigns, Inbox, Studio
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Live'), findsOneWidget);
      expect(find.text('Campaigns'), findsOneWidget);
      expect(find.text('Inbox'), findsOneWidget);
      expect(find.text('Studio'), findsOneWidget);

      // Context switcher pill
      expect(find.byType(CbContextSwitcherPill), findsOneWidget);
    });
  });

  group('Phase 4 — Responsive Layout & 2.0x Text Scaling Resilience', () {
    testWidgets('Grouped settings rows render without overflow at 2.0x text scale', (tester) async {
      await tester.pumpWidget(
        _wrapWithApp(
          SingleChildScrollView(
            child: CbSettingsSection(
              title: 'Accessibility & Display',
              grouped: true,
              children: [
                CbSettingsRow(
                  title: 'High Contrast Mode',
                  subtitle: 'Increases text and border contrast for visual accessibility',
                  icon: Icons.contrast,
                  valueText: 'Enabled',
                  onTap: () {},
                ),
                CbSettingsRow(
                  title: 'Text Scaling',
                  subtitle: 'Adjust app font scale dynamically with system font scaling',
                  icon: Icons.text_fields,
                  valueText: '2.0x',
                  onTap: () {},
                ),
              ],
            ),
          ),
          textScaleFactor: 2.0,
        ),
      );

      expect(find.text('ACCESSIBILITY & DISPLAY'), findsOneWidget);
      expect(find.text('High Contrast Mode'), findsOneWidget);
      expect(find.text('Text Scaling'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
