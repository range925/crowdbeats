// Crowdbeats V2 — Mobile Privacy & CCPA Consent Banner Widget Tests
//
// Verifies:
// 1. First-time visit: Banner renders statutory notice & choices.
// 2. Tapping "Accept All & Agree" removes the banner completely.
// 3. Tapping "Limit to Essential" removes the banner completely.
// 4. Returning user (already agreed): Banner is not rendered.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crowdbeats_mobile/ui/components/cb_privacy_consent_banner.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('CbPrivacyConsentBanner (First-time visit vs post-agreement removal)', () {
    testWidgets('1. Renders statutory notice and action buttons on first-time visit', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Stack(
                children: const [
                  Center(child: Text('App Content')),
                  CbPrivacyConsentBanner(initialAgreed: false),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Your Privacy Rights & Statutory Consent Choice'), findsOneWidget);
      expect(find.text('⚖️ CCPA § 1798.100 & GDPR NOTICE'), findsOneWidget);
      expect(find.byKey(const Key('btn_accept_all')), findsOneWidget);
      expect(find.byKey(const Key('btn_limit_essential')), findsOneWidget);
    });

    testWidgets('2. Removes widget completely after user taps "Accept All & Agree"', (tester) async {
      bool dismissed = false;

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Stack(
                children: [
                  const Center(child: Text('App Content')),
                  CbPrivacyConsentBanner(
                    initialAgreed: false,
                    onDismissed: () => dismissed = true,
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Accept All & Agree
      await tester.tap(find.byKey(const Key('btn_accept_all')));
      await tester.pumpAndSettle();

      // Widget is now dismissed and removed from view
      expect(find.text('Your Privacy Rights & Statutory Consent Choice'), findsNothing);
      expect(find.byKey(const Key('btn_accept_all')), findsNothing);
      expect(dismissed, isTrue);

      // Verify SharedPreferences updated
      final sp = await SharedPreferences.getInstance();
      expect(sp.getBool(CbPrivacyConsentBanner.storageKey), isTrue);
      expect(sp.getString('cb_privacy_consent_status'), 'accepted_all');
    });

    testWidgets('3. Removes widget completely after user taps "Limit to Essential"', (tester) async {
      bool dismissed = false;

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Stack(
                children: [
                  const Center(child: Text('App Content')),
                  CbPrivacyConsentBanner(
                    initialAgreed: false,
                    onDismissed: () => dismissed = true,
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Limit to Essential
      await tester.tap(find.byKey(const Key('btn_limit_essential')));
      await tester.pumpAndSettle();

      // Widget is now dismissed and removed from view
      expect(find.text('Your Privacy Rights & Statutory Consent Choice'), findsNothing);
      expect(find.byKey(const Key('btn_limit_essential')), findsNothing);
      expect(dismissed, isTrue);

      final sp = await SharedPreferences.getInstance();
      expect(sp.getBool(CbPrivacyConsentBanner.storageKey), isTrue);
      expect(sp.getString('cb_privacy_consent_status'), 'essential_only');
    });

    testWidgets('4. Does not render banner when user has already agreed', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Stack(
                children: const [
                  Center(child: Text('App Content')),
                  CbPrivacyConsentBanner(initialAgreed: true),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Your Privacy Rights & Statutory Consent Choice'), findsNothing);
      expect(find.byKey(const Key('btn_accept_all')), findsNothing);
      expect(find.byKey(const Key('btn_limit_essential')), findsNothing);
    });
  });
}
