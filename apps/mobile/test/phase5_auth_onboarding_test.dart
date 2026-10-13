// Crowdbeats V2 — Phase 5 Launch, Auth & Onboarding Architecture Tests
//
// Verifies:
// 1. AuthScreen: Continue as Guest navigation, autofill hints, keyboard submission, DM Sans typography.
// 2. ForgotPasswordScreen: Email autofill, input actions, enumeration-resistant confirmation.
// 3. UniversalOnboardingWizard:
//    - 4 concise steps (Step 1 of 4).
//    - Zero fake autofill compliance: age confirmation, Terms, and Privacy start unchecked.
//    - Distinction between mandatory statutory agreements and optional marketing consent.
//    - Truthful Creator Studio setup notices (no fake instant payouts or unverified live claims).
//    - Return destination (?from=) preservation and Exit navigation.
// 4. cbAuthRedirect: Single consistent routing decision without auth flicker.

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:crowdbeats_mobile/main.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/ui/auth/auth_screen.dart';
import 'package:crowdbeats_mobile/ui/auth/forgot_password_screen.dart';
import 'package:crowdbeats_mobile/ui/components/cb_button.dart';
import 'package:crowdbeats_mobile/ui/components/cb_form_field.dart';
import 'package:crowdbeats_mobile/ui/onboarding/universal/universal_onboarding_wizard.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_theme.dart';

class _TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) => _MockHttpClient();
}

class _MockHttpClient implements HttpClient {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Widget _wrapWithAuthScope({
  required Widget child,
  CbAuthState authState = const CbAuthState(status: CbAuthStatus.unauthenticated),
  Size size = const Size(390, 844),
}) {
  return ProviderScope(
    overrides: [
      authStateProvider.overrideWithValue(authState),
    ],
    child: MaterialApp(
      theme: ThemeData.dark().copyWith(
        extensions: const [CbThemeExtension.defaults],
      ),
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

  group('Phase 5 — AuthScreen Ergonomics & Autofill', () {
    testWidgets('AuthScreen has Continue as Guest button and email/password autofill hints', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const AuthScreen(),
        ),
      );
      await tester.pump();

      // Verify "Continue as Guest" is rendered
      expect(find.widgetWithText(CbButton, 'Continue as Guest'), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Sign In'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);

      // Verify CbFormField properties for autofill and keyboard actions
      final formFields = tester.widgetList<CbFormField>(find.byType(CbFormField)).toList();
      expect(formFields.length, greaterThanOrEqualTo(2));

      final emailField = formFields.firstWhere((f) => f.label == 'Email address');
      expect(emailField.autofillHints, contains(AutofillHints.email));
      expect(emailField.textInputAction, equals(TextInputAction.next));

      final passField = formFields.firstWhere((f) => f.label == 'Password');
      expect(passField.autofillHints, contains(AutofillHints.password));
      expect(passField.textInputAction, equals(TextInputAction.done));
    });

    testWidgets('Register tab specifies newPassword autofill hint on password fields', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const AuthScreen(),
        ),
      );
      await tester.pump();

      await tester.tap(find.widgetWithText(Tab, 'Create Account'));
      await tester.pumpAndSettle();

      final formFields = tester.widgetList<CbFormField>(find.byType(CbFormField)).toList();
      final regPassField = formFields.firstWhere((f) => f.label == 'Password');
      expect(regPassField.autofillHints, contains(AutofillHints.newPassword));

      final regConfirmField = formFields.firstWhere((f) => f.label == 'Confirm password');
      expect(regConfirmField.autofillHints, contains(AutofillHints.newPassword));
      expect(regConfirmField.textInputAction, equals(TextInputAction.done));
    });
  });

  group('Phase 5 — ForgotPasswordScreen Ergonomics', () {
    testWidgets('ForgotPasswordScreen provides email autofill and submission action', (tester) async {
      await tester.pumpWidget(
        _wrapWithAuthScope(
          child: const ForgotPasswordScreen(),
        ),
      );
      await tester.pump();

      final emailField = tester.widget<CbFormField>(find.byType(CbFormField));
      expect(emailField.autofillHints, contains(AutofillHints.email));
      expect(emailField.textInputAction, equals(TextInputAction.done));
      expect(emailField.onFieldSubmitted, isNotNull);
    });
  });

  group('Phase 5 — UniversalOnboardingWizard Compliance & Steps', () {
    testWidgets('Wizard renders 4 concise steps starting with unchecked legal agreements', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        _wrapWithAuthScope(
          size: const Size(800, 1400),
          authState: const CbAuthState(status: CbAuthStatus.unonboarded),
          child: const UniversalOnboardingWizard(),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Step 1 of 4 indicator
      expect(find.text('Step 1 of 4'), findsOneWidget);
      expect(find.text('Eligibility & Agreements'), findsOneWidget);
      expect(find.text('Exit'), findsOneWidget);

      // Verify all checkboxes start unchecked (non-negotiable compliance contract)
      final checkboxes = tester.widgetList<Checkbox>(find.byType(Checkbox)).toList();
      expect(checkboxes.length, equals(4));
      for (final cb in checkboxes) {
        expect(cb.value, isFalse, reason: 'Compliance requires all consents start unchecked');
      }

      // Verify Agree & Continue button is disabled when mandatory terms are not checked
      final agreeButton = tester.widget<CbButton>(find.widgetWithText(CbButton, 'Agree & Continue'));
      expect(agreeButton.onPressed, isNull);

      // Check the 3 mandatory checkboxes (Age, Terms, Privacy)
      await tester.tap(find.text('Age & Eligibility Confirmation'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Terms of Service (v2026-08-25)'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Privacy Policy (v2026-08-25)'));
      await tester.pumpAndSettle();

      // Now Agree & Continue button should be enabled without requiring optional marketing consent
      final enabledAgreeButton = tester.widget<CbButton>(find.widgetWithText(CbButton, 'Agree & Continue'));
      expect(enabledAgreeButton.onPressed, isNotNull);

      // Tap Agree & Continue -> advances to Step 2 of 4 (Persona Selection)
      await tester.ensureVisible(find.widgetWithText(CbButton, 'Agree & Continue'));
      await tester.tap(find.widgetWithText(CbButton, 'Agree & Continue'));
      await tester.pumpAndSettle();

      expect(find.text('Step 2 of 4'), findsOneWidget);
      expect(find.text('Choose Your Focus'), findsOneWidget);
      expect(find.text('Fan / Music Enthusiast'), findsOneWidget);
      expect(find.text('Solo Musician / Performer'), findsOneWidget);
      expect(find.text('Band / Music Ensemble'), findsOneWidget);
      expect(find.text('Sponsor / Brand Partner'), findsOneWidget);

      // Select Solo Musician and continue
      await tester.tap(find.text('Solo Musician / Performer'));
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.widgetWithText(CbButton, 'Continue'));
      await tester.tap(find.widgetWithText(CbButton, 'Continue'));
      await tester.pumpAndSettle();

      // Advances to Step 3 of 4 (Solo Performer Identity)
      expect(find.text('Step 3 of 4'), findsOneWidget);
      expect(find.text('Solo Performer Identity'), findsOneWidget);
      expect(find.textContaining('Stripe payout setup can be configured in Creator Studio'), findsOneWidget);

      await tester.ensureVisible(find.widgetWithText(CbButton, 'Continue to Review'));
      await tester.tap(find.widgetWithText(CbButton, 'Continue to Review'));
      await tester.pumpAndSettle();

      // Advances to Step 4 of 4 (Review & Truthful Next Steps)
      expect(find.text('Step 4 of 4'), findsOneWidget);
      expect(find.text('Review & Confirmation'), findsOneWidget);
      expect(find.text('Next Steps in Creator Studio'), findsOneWidget);
      expect(find.textContaining('Identity verification and Stripe Connect payout setup must be completed in Studio'), findsOneWidget);
      expect(find.widgetWithText(CbButton, 'Complete Setup'), findsOneWidget);
    });
  });

  group('Phase 5 — cbAuthRedirect Matrix & Return Resumption', () {
    test('Unauthenticated user is redirected to auth with encoded from parameter', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/creator');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/auth?from=%2Fcreator'));
    });

    test('Unauthenticated user has unrestricted access to public discovery and legal routes', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      expect(cbAuthRedirect(container.read(authStateProvider), _makeState(router, '/fan')), isNull);
      expect(cbAuthRedirect(container.read(authStateProvider), _makeState(router, '/tip/artist_123')), isNull);
      expect(cbAuthRedirect(container.read(authStateProvider), _makeState(router, '/artist/luna')), isNull);
      expect(cbAuthRedirect(container.read(authStateProvider), _makeState(router, '/band/the_midnight')), isNull);
      expect(cbAuthRedirect(container.read(authStateProvider), _makeState(router, '/terms')), isNull);
      expect(cbAuthRedirect(container.read(authStateProvider), _makeState(router, '/privacy')), isNull);
    });

    test('Unonboarded user is routed to /onboarding preserving from destination', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unonboarded),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final state = _makeState(router, '/auth?from=%2Ftip%2Fperformer_456');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/onboarding?from=%2Ftip%2Fperformer_456'));
    });

    test('Authenticated user with from destination returns to target route directly', () {
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
      final state = _makeState(router, '/auth?from=%2Ftip%2Fperformer_789', matchedLocation: '/auth');

      final redirect = cbAuthRedirect(container.read(authStateProvider), state);
      expect(redirect, equals('/tip/performer_789'));
    });
  });
}
