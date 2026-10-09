// Crowdbeats V2 — Phase 12 Settings, Security & Account Lifecycle Test Suite
//
// Verifies:
// 1. Grouped settings navigation architecture (AccountHubScreen)
// 2. Appearance & Accessibility (theme mode switching, high contrast, reduce motion, font scaling, language picker)
// 3. Security & Active Sessions (2FA toggle, active session listing, individual session revocation, revoke all sessions)
// 4. Privacy & Location (precision selector, radar discoverability, anonymous tipping)
// 5. Account Lifecycle & Deletion (temporary deactivation, statutory 30-day cooling-off & 7-year AML retention, phrase validation)

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';
import 'package:crowdbeats_mobile/state/audience_visibility_state.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/data/models/live_location.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/ui/settings/account_hub_screen.dart';
import 'package:crowdbeats_mobile/ui/settings/accessibility_appearance_screen.dart';
import 'package:crowdbeats_mobile/ui/settings/security_sessions_screen.dart';
import 'package:crowdbeats_mobile/ui/settings/privacy_location_screen.dart';
import 'package:crowdbeats_mobile/ui/settings/account_deletion_screen.dart';
import 'package:crowdbeats_mobile/ui/components/cb_button.dart';
import 'package:crowdbeats_mobile/ui/components/cb_settings_row.dart';

class _FakeLocationProvider implements LocationProvider {
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
  Stream<LocationFix> streamContinuous() => const Stream.empty();

  @override
  Future<void> stopContinuous() async {}

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

  @override
  Future<void> updateNotifications(CbNotificationPreferences prefs) async {
    state = state.copyWith(notifications: prefs);
  }

  @override
  Future<void> updateTipping(CbTippingPreferences prefs) async {
    state = state.copyWith(tipping: prefs);
  }
}

void main() {
  group('Phase 12 — Account Settings, Security, Appearance & Lifecycle Suite', () {
    testWidgets('1. AccountHubScreen renders grouped sections and persona header', (tester) async {
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
                personaType: 'artist',
              ),
            ),
          ],
          child: const MaterialApp(
            home: AccountHubScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Profile Header verification
      expect(find.text('Account Settings'), findsOneWidget);
      expect(find.text('David Naufahu'), findsOneWidget);
      expect(find.text('crowdbeatsllc@gmail.com'), findsOneWidget);
      expect(find.text('Solo Musician'), findsOneWidget);
      expect(find.text('Switch Persona'), findsOneWidget);
      expect(find.text('Edit Profile'), findsOneWidget);

      // Grouped Sections (uppercase rendered by CbSettingsSection)
      expect(find.text('YOUR CROWDBEATS'), findsOneWidget);
      expect(find.text('MONEY & PAYMENTS'), findsOneWidget);
      expect(find.text('ARTIST & BAND TOOLS'), findsOneWidget);
      expect(find.text('ACCOUNT & SECURITY'), findsOneWidget);
      expect(find.text('PREFERENCES'), findsOneWidget);
      expect(find.text('Appearance & Accessibility'), findsOneWidget);
      expect(find.text('Notifications'), findsOneWidget);
      expect(find.text('Privacy & Location'), findsOneWidget);
      expect(find.text('TRUST & SAFETY'), findsOneWidget);
      expect(find.text('LEGAL & PRIVACY POLICY'), findsOneWidget);
      expect(find.text('SESSION'), findsOneWidget);
      expect(find.text('Sign Out'), findsOneWidget);
      expect(find.text('Account Status & Deletion…'), findsOneWidget);
    });

    testWidgets('2. AccessibilityAppearanceScreen: Theme mode switching updates state', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final settingsNotifier = _TestUserSettingsNotifier();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => settingsNotifier),
          ],
          child: const MaterialApp(
            home: AccessibilityAppearanceScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Appearance & Accessibility'), findsOneWidget);
      expect(find.text('THEME & DISPLAY'), findsOneWidget);
      expect(find.text('Dark Mode'), findsOneWidget);
      expect(find.text('Light Mode'), findsOneWidget);
      expect(find.text('System'), findsOneWidget);

      // Initial theme mode is 'system'
      expect(settingsNotifier.state.privacy.themeMode, equals('system'));

      // Switch to Light Mode
      await tester.tap(find.text('Light Mode'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.privacy.themeMode, equals('light'));

      // Switch to Dark Mode
      await tester.tap(find.text('Dark Mode'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.privacy.themeMode, equals('dark'));
    });

    testWidgets('3. Accessibility controls: High Contrast, Reduce Motion & Text Scaling', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final settingsNotifier = _TestUserSettingsNotifier();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => settingsNotifier),
          ],
          child: const MaterialApp(
            home: AccessibilityAppearanceScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check initial a11y values
      expect(settingsNotifier.state.accessibility.highContrastMode, isFalse);
      expect(settingsNotifier.state.accessibility.reduceMotion, isFalse);
      expect(settingsNotifier.state.accessibility.fontScale, equals(1.0));

      // Toggle High Contrast via row tap
      expect(find.text('High Contrast Mode'), findsOneWidget);
      await tester.tap(find.text('High Contrast Mode'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.accessibility.highContrastMode, isTrue);

      // Toggle Reduce Motion via row tap
      expect(find.text('Reduce Motion'), findsOneWidget);
      await tester.tap(find.text('Reduce Motion'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.accessibility.reduceMotion, isTrue);

      // Change font scale via notifier directly
      await settingsNotifier.setFontScale(1.2);
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.accessibility.fontScale, equals(1.2));
      expect(find.text('120%'), findsOneWidget);

      // FAQ accordion expansion
      expect(find.text('How do tipping revenue splits work?'), findsOneWidget);
      await tester.tap(find.text('How do tipping revenue splits work?'));
      await tester.pumpAndSettle();
      expect(find.textContaining('For Solo performers, 94% settles directly'), findsOneWidget);
    });

    testWidgets('4. SecuritySessionsScreen: 2FA toggle, active sessions & revocation', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final settingsNotifier = _TestUserSettingsNotifier(
        const CbUserSettingsState(
          activeSessions: [
            {
              'id': 'sess_1',
              'device': 'iPhone 15 Pro',
              'location': 'Austin, TX',
              'lastActive': 'Active Now',
              'isCurrent': true,
              'client': 'Crowdbeats iOS',
            },
            {
              'id': 'sess_2',
              'device': 'MacBook Pro M3',
              'location': 'Austin, TX',
              'lastActive': '2 hours ago',
              'isCurrent': false,
              'client': 'Chrome on macOS',
            },
          ],
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => settingsNotifier),
          ],
          child: const MaterialApp(
            home: SecuritySessionsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check sessions listed
      expect(find.text('iPhone 15 Pro'), findsOneWidget);
      expect(find.text('Current Device'), findsOneWidget);
      expect(find.text('MacBook Pro M3'), findsOneWidget);
      expect(find.text('Revoke'), findsOneWidget);
      expect(find.text('Sign Out from All Other Devices'), findsOneWidget);

      // Check 2FA toggle
      expect(find.text('Two-Factor Authentication (2FA)'), findsOneWidget);
      expect(settingsNotifier.state.security.twoFactorEnabled, isTrue);
      await tester.tap(find.text('Two-Factor Authentication (2FA)'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.security.twoFactorEnabled, isFalse);

      // Tap Revoke on remote session
      await tester.tap(find.text('Revoke'));
      await tester.pumpAndSettle();

      // sess_2 is removed
      expect(settingsNotifier.state.activeSessions.length, equals(1));
      expect(settingsNotifier.state.activeSessions.first['device'], equals('iPhone 15 Pro'));
      expect(find.text('MacBook Pro M3'), findsNothing);
    });

    testWidgets('5. PrivacyLocationScreen: Location precision, radar discovery & stealth', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final settingsNotifier = _TestUserSettingsNotifier();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => settingsNotifier),
            locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
          ],
          child: const MaterialApp(
            home: PrivacyLocationScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Privacy & Location'), findsOneWidget);
      expect(find.text('LOCATION PRECISION'), findsOneWidget);
      expect(find.text('Live GPS Radar (Precise)'), findsOneWidget);
      expect(find.text('City-Level (Approximate)'), findsOneWidget);

      // Select approximate location
      await tester.tap(find.text('City-Level (Approximate)'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.privacy.locationPrecision, equals('approximate'));

      // Toggle radar discoverability
      expect(find.text('Visible in Nearby Live Radar'), findsOneWidget);
      await tester.tap(find.text('Visible in Nearby Live Radar'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.privacy.profileDiscoverableInRadar, isFalse);

      // Toggle anonymous tipping
      expect(find.text('Default Anonymous Tipping'), findsOneWidget);
      await tester.tap(find.text('Default Anonymous Tipping'));
      await tester.pumpAndSettle();
      expect(settingsNotifier.state.privacy.defaultAnonymousTipping, isTrue);
    });

    testWidgets('6. AccountDeletionScreen: Deactivation and deletion confirmation phrase gating', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final settingsNotifier = _TestUserSettingsNotifier();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userSettingsProvider.overrideWith((ref) => settingsNotifier),
          ],
          child: const MaterialApp(
            home: AccountDeletionScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verifications for Temporary Deactivation
      expect(find.text('Deactivate Account (Temporary)'), findsOneWidget);
      expect(find.text('Deactivate My Account'), findsOneWidget);

      // Verifications for Permanent Deletion disclosures
      expect(find.text('Permanent Account Deletion'), findsOneWidget);
      expect(find.textContaining('30-Day Statutory Cooling-Off Period'), findsOneWidget);
      expect(find.textContaining('Statutory 7-Year Financial Retention'), findsOneWidget);
      expect(find.textContaining('Band Founders'), findsOneWidget);

      // Verify destructive delete button is disabled before typing confirmation phrase
      final deleteBtnFinder = find.widgetWithText(CbButton, 'Permanently Delete My Account');
      expect(deleteBtnFinder, findsOneWidget);
      final deleteBtn = tester.widget<CbButton>(deleteBtnFinder);
      expect(deleteBtn.onPressed, isNull);

      // Enter incorrect phrase
      final phraseFieldFinder = find.byType(TextField).last;
      await tester.enterText(phraseFieldFinder, 'wrong phrase');
      await tester.pumpAndSettle();

      final deleteBtnStillDisabled = tester.widget<CbButton>(deleteBtnFinder);
      expect(deleteBtnStillDisabled.onPressed, isNull);

      // Enter correct phrase (case-insensitive)
      await tester.enterText(phraseFieldFinder, 'DELETE MY ACCOUNT');
      await tester.pumpAndSettle();

      final deleteBtnEnabled = tester.widget<CbButton>(deleteBtnFinder);
      expect(deleteBtnEnabled.onPressed, isNotNull);
    });
  });
}
