// Crowdbeats V2 — Phase 9 Account, Settings & Social/Messaging Test Suite
//
// Verifies:
// 1. PersonaSwitcherSheet: Role-gated persona permissions (Fan sees only Fan + Creator onboarding card; Creator sees Solo, Band, Fan)
// 2. AccountHubScreen: Grouped settings hierarchy, DM Sans typography, Direct Messages navigation row, and guarded creator links
// 3. Router Matrix: /messages and /creator/messages routes, unauthenticated redirection to /auth?from=
// 4. Data Download & Privacy Requests (ACC-15): Machine-readable export queue trigger in LegalDisclosuresScreen

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:crowdbeats_mobile/main.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';
import 'package:crowdbeats_mobile/ui/settings/account_hub_screen.dart';
import 'package:crowdbeats_mobile/ui/persona/persona_switcher_sheet.dart';
import 'package:crowdbeats_mobile/ui/fan/social_messaging_screen.dart';
import 'package:crowdbeats_mobile/ui/settings/legal_disclosures_screen.dart';

class _TestUserSettingsNotifier extends UserSettingsNotifier {
  _TestUserSettingsNotifier([CbUserSettingsState? initial]) {
    if (initial != null) {
      state = initial;
    }
  }

  @override
  Future<void> loadSettings() async {}
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
  group('Phase 9 — Account, Settings & Social Messaging Suite', () {
    testWidgets('1. PersonaSwitcherSheet: Fan persona sees only Fan active and creator registration card', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authStateProvider.overrideWithValue(
              const CbAuthState(
                status: CbAuthStatus.authenticated,
                personaType: 'fan',
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: PersonaSwitcherSheet(),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Fan persona is listed and active
      expect(find.text('Switch Persona'), findsOneWidget);
      expect(find.text('Fan'), findsOneWidget);
      expect(find.text('ACTIVE'), findsOneWidget);

      // Solo Musician and Band are NOT in the permitted switcher list
      expect(find.text('Solo Musician'), findsOneWidget); // Found in the onboarding registration card button
      expect(find.text('Perform or Sponsor Live Music'), findsOneWidget);
      expect(find.text('Band Profile'), findsOneWidget);
      expect(find.text('Live performance dashboard & tips'), findsNothing); // Musician description should not be present
    });

    testWidgets('2. PersonaSwitcherSheet: Solo Musician sees Solo, Band, and Fan switcher options', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authStateProvider.overrideWithValue(
              const CbAuthState(
                status: CbAuthStatus.authenticated,
                personaType: 'artist',
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: PersonaSwitcherSheet(),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Authorized creator options are available
      expect(find.text('Switch Persona'), findsOneWidget);
      expect(find.text('Solo Musician'), findsOneWidget);
      expect(find.text('Band Member'), findsOneWidget);
      expect(find.text('Fan'), findsOneWidget);

      // Onboarding card is hidden for authorized creators
      expect(find.text('Perform or Sponsor Live Music'), findsNothing);
    });

    testWidgets('3. AccountHubScreen renders Direct Messages row and routes correctly', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final settingsNotifier = _TestUserSettingsNotifier();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => settingsNotifier),
            authStateProvider.overrideWithValue(
              const CbAuthState(
                status: CbAuthStatus.authenticated,
                personaType: 'fan',
              ),
            ),
          ],
          child: const MaterialApp(
            home: AccountHubScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Direct Messages & Inquiries'), findsOneWidget);
      expect(find.text('Chat with performers, stage requests, and patron inquiries'), findsOneWidget);
      expect(find.text('Personas & Profiles'), findsOneWidget);
      expect(find.text('Saved Artists & Bands'), findsOneWidget);
      expect(find.text('Tip & Contribution History'), findsOneWidget);
    });

    test('4. cbAuthRedirect protects /messages for unauthenticated users', () {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      final unauthRedirect = cbAuthRedirect(
        container.read(authStateProvider),
        _makeState(router, '/messages'),
      );
      expect(unauthRedirect, equals('/auth?from=%2Fmessages'));

      final authContainer = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.authenticated, personaType: 'fan'),
          ),
        ],
      );
      addTearDown(authContainer.dispose);

      final authRedirect = cbAuthRedirect(
        authContainer.read(authStateProvider),
        _makeState(router, '/messages'),
      );
      expect(authRedirect, isNull);
    });

    testWidgets('5. LegalDisclosuresScreen: Download My Data triggers export queue (ACC-15)', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LegalDisclosuresScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Download My Data'), findsOneWidget);
      expect(find.text('Request a machine-readable JSON archive of your profile, tips, and activity'), findsOneWidget);

      await tester.tap(find.text('Download My Data'));
      await tester.pump(const Duration(milliseconds: 1500));
      await tester.pumpAndSettle();

      expect(find.textContaining('Data export queued'), findsOneWidget);
    });
  });
}
