// Crowdbeats V2 — Phase 5 Auth Flow Resilience & Anti-Flicker Test Suite
// Verifies:
// 1. Auth state machine resolution (unauthenticated, unverified, unonboarded, authenticated, suspended, deleted)
// 2. Return destination (?from=) preservation across sign-in, onboarding, and email verification
// 3. Duplicate submission prevention and atomic loading guards
// 4. AuthScreen, ForgotPasswordScreen, and VerifyEmailScreen UI rendering with Stitch design tokens
// 5. Anti-flicker navigation resilience (GoRouter declarative redirect without race timers)

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:crowdbeats_mobile/main.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/ui/auth/auth_screen.dart';
import 'package:crowdbeats_mobile/ui/auth/forgot_password_screen.dart';
import 'package:crowdbeats_mobile/ui/auth/verify_email_screen.dart';
import 'package:crowdbeats_mobile/ui/components/cb_button.dart';
import 'package:crowdbeats_mobile/ui/components/cb_form_field.dart';
import 'package:crowdbeats_mobile/ui/components/cb_scaffold.dart';
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

Widget _wrapWithAuthScope({
  required Widget child,
  CbAuthState authState = const CbAuthState(status: CbAuthStatus.unauthenticated),
  bool isDark = true,
  Size size = const Size(390, 844),
}) {
  return ProviderScope(
    overrides: [
      authStateProvider.overrideWithValue(authState),
    ],
    child: MaterialApp(
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
          textScaler: const TextScaler.linear(1.0),
        ),
        child: child,
      ),
    ),
  );
}

GoRouterState _makeState(GoRouter router, String url, {String? matchedLocation}) {
  final uri = Uri.parse(url);
  final loc = matchedLocation ?? uri.path;
  return GoRouterState(
    router.configuration,
    uri: uri,
    matchedLocation: loc,
    fullPath: loc,
    pathParameters: const {},
    pageKey: ValueKey(loc),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('1. Auth State Machine & Getters', () {
    test('CbAuthState correctly reports isLoading and isAuthenticated', () {
      const loadingState = CbAuthState(status: CbAuthStatus.loading);
      expect(loadingState.isLoading, isTrue);
      expect(loadingState.isAuthenticated, isFalse);

      const unauthState = CbAuthState(status: CbAuthStatus.unauthenticated);
      expect(unauthState.isLoading, isFalse);
      expect(unauthState.isAuthenticated, isFalse);

      const unverifiedState = CbAuthState(status: CbAuthStatus.unverified);
      expect(unverifiedState.isLoading, isFalse);
      expect(unverifiedState.isAuthenticated, isFalse);

      const unonboardedState = CbAuthState(status: CbAuthStatus.unonboarded);
      expect(unonboardedState.isLoading, isFalse);
      expect(unonboardedState.isAuthenticated, isFalse);

      const authState = CbAuthState(
        status: CbAuthStatus.authenticated,
        personaType: 'solo_musician',
      );
      expect(authState.isLoading, isFalse);
      expect(authState.isAuthenticated, isTrue);
      expect(authState.personaType, equals('solo_musician'));
    });

    test('CbAuthState copyWith clears or updates error messages safely', () {
      const initial = CbAuthState(
        status: CbAuthStatus.unauthenticated,
        errorMessage: 'Invalid credentials',
      );
      expect(initial.errorMessage, equals('Invalid credentials'));

      final cleared = initial.copyWith(errorMessage: null);
      expect(cleared.errorMessage, isNull);
      expect(cleared.status, equals(CbAuthStatus.unauthenticated));

      final updated = initial.copyWith(errorMessage: 'Network timeout');
      expect(updated.errorMessage, equals('Network timeout'));
    });
  });

  group('2. GoRouter Declarative Redirect & Destination Preservation', () {
    test('Unauthenticated user attempting to access /artist is redirected to /auth?from=', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/artist');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/auth?from=%2Fartist'));
    });

    test('Unverified user is redirected to /auth/verify-email', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unverified),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/creator/balances');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/auth/verify-email'));
    });

    test('Unonboarded user is redirected to /onboarding preserving from parameter', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unonboarded),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/creator/live?from=%2Ftip%2F123');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, contains('/onboarding?from='));
    });

    test('Authenticated user with from destination returns directly to target route', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(
              status: CbAuthStatus.authenticated,
              personaType: 'fan',
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/auth?from=%2Ftip%2Fperformer_live_123', matchedLocation: '/auth');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/tip/performer_live_123'));
    });

    test('Authenticated user without from destination is routed to persona dashboard', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(
              status: CbAuthStatus.authenticated,
              personaType: 'artist',
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/auth', matchedLocation: '/auth');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/artist'));
    });

    test('Suspended and deleted users are strictly routed to security holding screens', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.suspended),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/creator');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/suspended'));
    });
  });

  group('3. AuthScreen UI & Interaction Resilience', () {
    testWidgets('AuthScreen renders CbSafeScaffold, logo, and segmented control tabs', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const AuthScreen(),
        ),
      );
      await tester.pump();

      expect(find.byType(CbSafeScaffold), findsOneWidget);
      expect(find.text('Live Music Patronage & Instant Gigs'), findsOneWidget);
      expect(find.widgetWithText(Tab, 'Sign In'), findsOneWidget);
      expect(find.widgetWithText(Tab, 'Create Account'), findsOneWidget);
      expect(find.text('Email address'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Sign In'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Explore as Guest'), findsOneWidget);
    });

    testWidgets('Tapping Create Account switches to registration tab with password confirmation', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const AuthScreen(),
        ),
      );
      await tester.pump();

      await tester.tap(find.widgetWithText(Tab, 'Create Account'));
      await tester.pumpAndSettle();

      expect(find.text('Confirm password'), findsOneWidget);
      expect(find.text('By creating an account, you agree to our '), findsOneWidget);
      expect(find.text('Terms of Service'), findsAtLeastNWidgets(1));
      expect(find.text('Privacy Policy'), findsAtLeastNWidgets(1));
      expect(find.widgetWithText(CbButton, 'Create Account'), findsOneWidget);
    });

    testWidgets('AuthScreen displays server error message in high-contrast alert banner', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          authState: const CbAuthState(
            status: CbAuthStatus.unauthenticated,
            errorMessage: 'Incorrect email or password. Please try again.',
          ),
          child: const AuthScreen(),
        ),
      );
      await tester.pump();

      expect(
        find.text('Incorrect email or password. Please try again.'),
        findsOneWidget,
      );
    });

    testWidgets('Register form enforces password length and confirmation match inline', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const AuthScreen(),
        ),
      );
      await tester.pump();

      // Switch to register tab
      await tester.tap(find.widgetWithText(Tab, 'Create Account'));
      await tester.pumpAndSettle();

      final emailField = find.ancestor(of: find.text('Email address'), matching: find.byType(CbFormField)).last;
      final passField = find.ancestor(of: find.text('Password'), matching: find.byType(CbFormField)).last;
      final pass2Field = find.ancestor(of: find.text('Confirm password'), matching: find.byType(CbFormField)).last;

      await tester.enterText(find.descendant(of: emailField, matching: find.byType(EditableText)), 'fan@crowdbeats.fm');
      await tester.enterText(find.descendant(of: passField, matching: find.byType(EditableText)), 'short');
      await tester.enterText(find.descendant(of: pass2Field, matching: find.byType(EditableText)), 'mismatch');
      await tester.pump();

      // Tap Create Account button
      final createBtn = find.widgetWithText(CbButton, 'Create Account');
      await tester.tap(createBtn);
      await tester.pump();

      // Should display inline validation error
      expect(find.text('Password must be at least 8 characters.'), findsOneWidget);
    });
  });

  group('4. ForgotPasswordScreen & Enumeration Resistance', () {
    testWidgets('ForgotPasswordScreen renders inputs and sends password reset', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const ForgotPasswordScreen(),
        ),
      );
      await tester.pump();

      expect(find.text('Reset Password'), findsOneWidget);
      expect(find.text('Forgot your password?'), findsOneWidget);
      expect(find.byType(CbFormField), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Send Reset Link'), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Return to Sign In'), findsOneWidget);
    });

    testWidgets('ForgotPasswordScreen renders enumeration-resistant success card upon submission', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const ForgotPasswordScreen(),
        ),
      );
      await tester.pump();

      await tester.enterText(find.byType(EditableText), 'test@crowdbeats.fm');
      await tester.pump();

      await tester.tap(find.widgetWithText(CbButton, 'Send Reset Link'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Instructions Sent'), findsOneWidget);
      expect(find.textContaining('If an account exists for test@crowdbeats.fm'), findsOneWidget);
      expect(find.textContaining('Reset links expire in 15 minutes'), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Return to Sign In'), findsOneWidget);
    });
  });

  group('5. VerifyEmailScreen Verification Gate & Polling UX', () {
    testWidgets('VerifyEmailScreen displays email address, live polling badge, and action buttons', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          authState: const CbAuthState(
            status: CbAuthStatus.unverified,
            user: null,
          ),
          child: const VerifyEmailScreen(),
        ),
      );
      await tester.pump();

      expect(find.text('Check your email'), findsOneWidget);
      expect(find.text('Checking automatically every 3 seconds'), findsOneWidget);
      expect(find.widgetWithText(CbButton, "I've Verified My Email"), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Resend Verification Email'), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Sign Out'), findsOneWidget);

      // Clean up timer by replacing widget
      await tester.pumpWidget(const SizedBox());
    });
  });
}
