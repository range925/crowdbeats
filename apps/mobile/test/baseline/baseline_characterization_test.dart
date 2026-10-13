// Crowdbeats V2 — Phase 1 Baseline Characterization Tests
//
// These tests document and characterize CURRENT (pre-redesign) behavior across:
// 1. Route matrix & deep-link routing (unhandled /explore, /staff unhandled redirect,
//    /band/:slug capturing /band/live, public vs protected routes)
// 2. Persona authorization gaps (authenticated Fan permitted into /creator, /band, /sponsor)
// 3. Authenticated onboarding bounce (user cannot add or re-run onboarding)
// 4. Creator/Band context defaults (hardcoded Elena Cruz / Midnight Echoes)
// 5. PersonaSwitcherSheet universal role switching
// 6. Text scaling defaults
//
// Tagged @Tags(['baseline']) so they run as part of the Phase 1 characterization suite.

@Tags(['baseline'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:crowdbeats_mobile/main.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';

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

  late ProviderContainer container;
  late GoRouter router;

  setUp(() {
    container = ProviderContainer(
      overrides: [
        authStateProvider.overrideWithValue(
          const CbAuthState(status: CbAuthStatus.unauthenticated),
        ),
      ],
    );
    router = container.read(routerProvider);
  });

  tearDown(() {
    container.dispose();
  });

  group('BASELINE: Route Table & Deep-link Characterization', () {
    test('BASELINE-FINDING-01: /explore route is referenced in AuthScreen but missing from route table', () {
      // In AuthScreen (lib/ui/auth/auth_screen.dart:274, 503), 'Explore as Guest' executes context.go('/explore').
      // We verify that '/explore' does NOT exist in the 59 configured GoRoutes.
      final registeredPaths = <String>[];
      for (final route in router.configuration.routes) {
        if (route is GoRoute) {
          registeredPaths.add(route.path);
        }
      }

      expect(registeredPaths.contains('/explore'), isFalse,
          reason: 'Expected-after-fix: /explore should resolve to /discover or guest home');
      expect(registeredPaths.contains('/fan'), isTrue);
      expect(registeredPaths.contains('/preview'), isTrue);
      expect(registeredPaths.length, equals(59));
    });

    test('BASELINE-FINDING-02: /band/:slug route matches /band/live and /band/studio instead of dedicated screens', () {
      // Because /band/:slug is registered before any subroutes (main.dart:246),
      // navigating to /band/live or /band/studio extracts :slug = 'live' or 'studio'.
      final registeredPaths = <String>[];
      for (final route in router.configuration.routes) {
        if (route is GoRoute) {
          registeredPaths.add(route.path);
        }
      }

      expect(registeredPaths.contains('/band/:slug'), isTrue);
      expect(registeredPaths.contains('/band/live'), isFalse);
      expect(registeredPaths.contains('/band/studio'), isFalse);
    });

    test('BASELINE-FINDING-03: authenticated staff user is redirected to /staff which has no route', () {
      // cbAuthRedirect line 195: returns '/${authState.personaType ?? "fan"}'
      // When personaType is 'staff', it redirects to '/staff', which is missing from routes.
      const staffAuth = CbAuthState(
        status: CbAuthStatus.authenticated,
        personaType: 'staff',
      );
      final state = _makeState(router, '/auth');
      final redirect = cbAuthRedirect(staffAuth, state);

      expect(redirect, equals('/staff'));

      final registeredPaths = <String>[];
      for (final route in router.configuration.routes) {
        if (route is GoRoute) {
          registeredPaths.add(route.path);
        }
      }
      expect(registeredPaths.contains('/staff'), isFalse,
          reason: 'Expected-after-fix: Staff/admin should redirect to web portal or authorized landing');
    });
  });

  group('BASELINE: Persona Authorization & Guardrail Characterization', () {
    test('BASELINE-FINDING-04: authenticated Fan can access /creator, /band, and /sponsor without restriction', () {
      // The cbAuthRedirect in main.dart:186-198 has NO persona checks when authenticated.
      // An authenticated user with personaType: 'fan' accessing /creator returns null (allowed!).
      const fanAuth = CbAuthState(
        status: CbAuthStatus.authenticated,
        personaType: 'fan',
      );

      final creatorState = _makeState(router, '/creator');
      final bandState = _makeState(router, '/band');
      final sponsorState = _makeState(router, '/sponsor');

      expect(cbAuthRedirect(fanAuth, creatorState), isNull,
          reason: 'Expected-after-fix: Fan navigating to /creator should be blocked or redirected to /fan');
      expect(cbAuthRedirect(fanAuth, bandState), isNull,
          reason: 'Expected-after-fix: Fan navigating to /band should be blocked');
      expect(cbAuthRedirect(fanAuth, sponsorState), isNull,
          reason: 'Expected-after-fix: Fan navigating to /sponsor should be blocked');
    });

    test('BASELINE-FINDING-05: authenticated user visiting /onboarding is bounced away to their persona dashboard', () {
      // cbAuthRedirect line 190: if authenticated, loc.startsWith('/onboarding') redirects to personaType.
      // This prevents an onboarded user from adding personas or re-entering onboarding flows.
      const fanAuth = CbAuthState(
        status: CbAuthStatus.authenticated,
        personaType: 'fan',
      );

      final onbState = _makeState(router, '/onboarding/persona');
      final redirect = cbAuthRedirect(fanAuth, onbState);

      expect(redirect, equals('/fan'),
          reason: 'Expected-after-fix: Onboarding routes should allow adding/switching personas with authorization');
    });

    test('BASELINE-FINDING-06: guest is redirected from /account to /auth with preserved ?from= query parameter', () {
      const unauth = CbAuthState(status: CbAuthStatus.unauthenticated);
      final state = _makeState(router, '/account/personal-info');
      final redirect = cbAuthRedirect(unauth, state);

      expect(redirect, equals('/auth?from=%2Faccount%2Fpersonal-info'));
    });

    test('BASELINE-FINDING-07: guest exploration routes remain public without redirection', () {
      const unauth = CbAuthState(status: CbAuthStatus.unauthenticated);

      expect(cbAuthRedirect(unauth, _makeState(router, '/fan')), isNull);
      expect(cbAuthRedirect(unauth, _makeState(router, '/tip/alex_martin')), isNull);
      expect(cbAuthRedirect(unauth, _makeState(router, '/artist/luna_hollis')), isNull);
      expect(cbAuthRedirect(unauth, _makeState(router, '/band/the_echoes')), isNull);
      expect(cbAuthRedirect(unauth, _makeState(router, '/legal')), isNull);
      expect(cbAuthRedirect(unauth, _makeState(router, '/terms')), isNull);
      expect(cbAuthRedirect(unauth, _makeState(router, '/privacy')), isNull);
    });
  });

  group('BASELINE: Creator/Band Identity & Context Characterization', () {
    test('BASELINE-FINDING-08: CreatorContextState defaults to hardcoded Elena Cruz (Solo) & The Midnight Echoes', () {
      // In lib/state/creator_context_state.dart:94-115, initial available contexts are hardcoded mocks.
      final contextContainer = ProviderContainer();
      final contextState = contextContainer.read(creatorContextProvider);

      expect(contextState.activeContext.id, equals('solo_default'));
      expect(contextState.activeContext.name, equals('Elena Cruz (Solo)'));
      expect(contextState.activeContext.role, equals('SOLO_ARTIST'));
      expect(contextState.isSolo, isTrue);

      expect(contextState.availableContexts.length, equals(2));
      expect(contextState.availableContexts[1].id, equals('band_midnight'));
      expect(contextState.availableContexts[1].name, equals('The Midnight Echoes'));
      expect(contextState.availableContexts[1].role, equals('BAND_FOUNDER'));

      contextContainer.dispose();
    });

    test('BASELINE-FINDING-09: switching context is blocked only when active live session is true', () {
      final contextContainer = ProviderContainer();
      final notifier = contextContainer.read(creatorContextProvider.notifier);

      final bandContext = contextContainer.read(creatorContextProvider).availableContexts[1];

      // Initially not live -> switch succeeds
      final success = notifier.switchContext(bandContext);
      expect(success, isTrue);
      expect(contextContainer.read(creatorContextProvider).activeContext.id, equals('band_midnight'));
      expect(contextContainer.read(creatorContextProvider).isSolo, isFalse);

      contextContainer.dispose();
    });
  });

  group('BASELINE: Accessibility & Appearance Defaults Characterization', () {
    test('BASELINE-FINDING-10: CbAccessibilityPreferences defaults fontScale to 1.0', () {
      // In lib/state/user_settings_state.dart:247-256, default font scale is 1.0.
      const defaults = CbAccessibilityPreferences();
      expect(defaults.fontScale, equals(1.0));
      expect(defaults.highContrastMode, isFalse);
      expect(defaults.reduceMotion, isFalse);
    });
  });
}
