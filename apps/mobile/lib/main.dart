// Crowdbeats V2 — Mobile Application Entry Point (Phase 6: Fan Vertical Slice)
//
// Architecture invariants (permanent):
// - One Firebase Auth UID per human; personas via membership records
// - No client writes to ledger, balances, payouts, or audit records
// - All money in integer minor units (amountCents) + ISO currency code
// - Server-authoritative: Finance, staff claims, audit, QR tokens
// - Flutter = iOS + Android ONLY (no Flutter Web, Desktop)
// - State management: Riverpod
//
// Phase 5: Firebase init, ProviderScope, GoRouter auth-aware routing.

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:go_router/go_router.dart';
import 'firebase/firebase_options.dart';
import 'firebase/auth_service.dart';
import 'firebase/firestore_service.dart';
import 'state/auth_state.dart';
import 'state/user_settings_state.dart';
import 'ui/theme/cb_theme.dart';
import 'ui/gallery/gallery_page.dart';
import 'ui/auth/splash_screen.dart';
import 'ui/auth/auth_screen.dart';
import 'ui/auth/verify_email_screen.dart';
import 'ui/auth/forgot_password_screen.dart';
import 'ui/onboarding/persona_picker_screen.dart';
import 'ui/onboarding/fan_onboarding_screen.dart';
import 'ui/onboarding/artist_onboarding_screen.dart';
import 'ui/onboarding/band_onboarding_screen.dart';
import 'ui/onboarding/venue_onboarding_screen.dart';
import 'ui/onboarding/sponsor_onboarding_screen.dart';
import 'ui/onboarding/universal/universal_onboarding_wizard.dart';
import 'ui/persona/persona_switcher_sheet.dart';
import 'ui/fan/fan_shell.dart';
import 'ui/creator/creator_shell.dart';
import 'package:flutter/foundation.dart';
import 'ui/creator/profile/creator_social_links_screen.dart';
import 'ui/creator/media/creator_media_screen.dart';
import 'ui/creator/finance/creator_balances_screen.dart';
import 'ui/creator/fans/creator_fans_screen.dart';
import 'ui/creator/analytics/creator_analytics_screen.dart';
import 'ui/band/band_shell.dart';
import 'ui/fan/public_profile_screen.dart';
import 'ui/fan/tip/tip_flow_screen.dart';
import 'ui/settings/account_hub_screen.dart';
import 'ui/settings/personal_info_screen.dart';
import 'ui/settings/payment_methods_screen.dart';
import 'ui/settings/tipping_preferences_screen.dart';
import 'ui/settings/notifications_settings_screen.dart';
import 'ui/settings/privacy_location_screen.dart';
import 'ui/settings/security_sessions_screen.dart';
import 'ui/settings/blocked_accounts_screen.dart';
import 'ui/settings/support_center_screen.dart';
import 'ui/settings/legal_disclosures_screen.dart';
import 'ui/settings/account_deletion_screen.dart';
import 'ui/settings/accessibility_appearance_screen.dart';
import 'ui/preview/fan_mobile_preview_hub.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'ui/sponsor/sponsor_shell.dart';
import 'ui/components/cb_privacy_consent_banner.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Stripe publishable key is set via --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_...
  // In test/emulator mode, omit the flag — PaymentSheet will not be shown.
  const stripePublishableKey = String.fromEnvironment('STRIPE_PUBLISHABLE_KEY');
  if (!kIsWeb && stripePublishableKey.isNotEmpty) {
    try {
      Stripe.publishableKey = stripePublishableKey;
      await Stripe.instance.applySettings();
    } catch (e) {
      debugPrint('[Stripe] Initialization skipped or error: $e');
    }
  }

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    const useEmulator = bool.fromEnvironment('USE_EMULATOR', defaultValue: true);
    if (useEmulator && !kIsWeb) {
      await AuthService.instance.connectEmulator();
      await FirestoreService.instance.connectEmulator();
    }
  } catch (e) {
    debugPrint('[Firebase] Initialization error: $e');
  }

  String initialThemeMode = 'system';
  try {
    final sp = await SharedPreferences.getInstance();
    initialThemeMode = sp.getString('cb_theme_mode') ?? 'system';
  } catch (e) {
    debugPrint('[Theme] SharedPreferences init error: $e');
  }

  runApp(
    ProviderScope(
      overrides: [
        userSettingsProvider.overrideWith(
          (ref) => UserSettingsNotifier(initialThemeMode: initialThemeMode),
        ),
      ],
      child: const CrowdbeatsV2App(),
    ),
  );
}

class _GoRouterRefreshNotifier extends ChangeNotifier {
  _GoRouterRefreshNotifier(Ref ref) {
    ref.listen(authStateProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  return _buildRouter(ref);
});

String? cbAuthRedirect(CbAuthState authState, GoRouterState state) {
  final loc = state.matchedLocation;

  // Allow unrestricted public discovery, tipping, legal disclosures, and developer preview routes
  if (loc == '/fan' ||
      loc == '/preview' ||
      loc.startsWith('/preview') ||
      loc == '/gallery' ||
      loc == '/legal' ||
      loc == '/terms' ||
      loc == '/privacy' ||
      loc == '/account/legal' ||
      loc == '/tip' ||
      loc.startsWith('/tip/') ||
      loc.startsWith('/artist/') ||
      loc.startsWith('/band/')) {
    return null;
  }

  switch (authState.status) {
    case CbAuthStatus.loading:
      return loc == '/splash' ? null : null; // Allow unauthenticated browsing immediately
    case CbAuthStatus.unauthenticated:
      if (loc.startsWith('/auth') || loc == '/splash') return null;
      // Protect account and creator/sponsor management dashboards
      if (loc.startsWith('/account') ||
          loc == '/artist' ||
          loc == '/musician' ||
          loc == '/creator' ||
          loc.startsWith('/creator') ||
          loc == '/band' ||
          loc == '/band_member' ||
          loc == '/venue_manager' ||
          loc == '/sponsor' ||
          loc == '/sponsor_rep' ||
          loc.startsWith('/sponsor')) {
        final targetUri = state.uri.toString();
        return '/auth?from=${Uri.encodeComponent(targetUri)}';
      }
      return null; // Default: allow public exploration
    case CbAuthStatus.unverified:
      if (loc == '/auth/verify-email') return null;
      final fromUnverified = state.uri.queryParameters['from'];
      if (fromUnverified != null && fromUnverified.isNotEmpty) {
        return '/auth/verify-email?from=${Uri.encodeComponent(fromUnverified)}';
      }
      return '/auth/verify-email';
    case CbAuthStatus.unonboarded:
      if (loc.startsWith('/onboarding')) return null;
      final fromOnboarding = state.uri.queryParameters['from'];
      if (fromOnboarding != null && fromOnboarding.isNotEmpty) {
        return '/onboarding?from=${Uri.encodeComponent(fromOnboarding)}';
      }
      return '/onboarding';
    case CbAuthStatus.suspended:
      return loc == '/suspended' ? null : '/suspended';
    case CbAuthStatus.deleted:
      return loc == '/deleted' ? null : '/deleted';
    case CbAuthStatus.revoked:
      return loc == '/session-revoked' ? null : '/session-revoked';
    case CbAuthStatus.expired:
      return loc == '/session-expired' ? null : '/session-expired';
    case CbAuthStatus.authenticated:
      // Allow account settings hub and subroutes
      if (loc.startsWith('/account')) return null;
      // Redirect to persona dashboard or return destination if on auth/splash/onboarding
      if (loc.startsWith('/auth') || loc == '/splash' || loc.startsWith('/onboarding')) {
        final from = state.uri.queryParameters['from'];
        if (from != null && from.isNotEmpty && from.startsWith('/') && !from.startsWith('/auth')) {
          return from;
        }
        return '/${authState.personaType ?? "fan"}';
      }
      return null;
  }
}

GoRouter _buildRouter(Ref ref) {
  final refreshNotifier = _GoRouterRefreshNotifier(ref);
  ref.onDispose(refreshNotifier.dispose);
  return GoRouter(
    refreshListenable: refreshNotifier,
    initialLocation: kIsWeb ? '/preview' : '/fan',
    redirect: (context, state) => cbAuthRedirect(ref.read(authStateProvider), state),
    routes: [
      GoRoute(path: '/splash',                        builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/auth',                          builder: (_, _) => const AuthScreen()),
      GoRoute(path: '/auth/verify-email',             builder: (_, _) => const VerifyEmailScreen()),
      GoRoute(path: '/auth/forgot-password',          builder: (_, _) => const ForgotPasswordScreen()),
      GoRoute(path: '/onboarding',                    builder: (_, _) => const UniversalOnboardingWizard()),
      GoRoute(path: '/onboarding/persona',            builder: (_, _) => const PersonaPickerScreen()),
      GoRoute(path: '/onboarding/fan',                builder: (_, _) => const FanOnboardingScreen()),
      GoRoute(path: '/onboarding/artist',             builder: (_, _) => const ArtistOnboardingScreen()),
      GoRoute(path: '/onboarding/band',               builder: (_, _) => const BandOnboardingScreen()),
      GoRoute(path: '/onboarding/venue',              builder: (_, _) => const VenueOnboardingScreen()),
      GoRoute(path: '/onboarding/sponsor',            builder: (_, _) => const SponsorOnboardingScreen()),
      GoRoute(path: '/gallery',                       builder: (_, _) => const GalleryPage()),
      GoRoute(path: '/suspended',                     builder: (_, _) => const _SuspendedScreen()),
      GoRoute(path: '/deleted',                       builder: (_, _) => const _DeletedScreen()),
      GoRoute(path: '/session-revoked',               builder: (_, _) => const _SessionRevokedScreen()),
      GoRoute(path: '/session-expired',               builder: (_, _) => const _SessionExpiredScreen()),
      // Unrestricted Legal Disclosures Routes
      GoRoute(path: '/legal',                         builder: (_, _) => const LegalDisclosuresScreen()),
      GoRoute(path: '/terms',                         builder: (_, _) => const LegalDisclosuresScreen()),
      GoRoute(path: '/privacy',                       builder: (_, _) => const LegalDisclosuresScreen()),
      // Account Settings Hub & Sub-routes
      GoRoute(path: '/account',                       builder: (_, _) => const AccountHubScreen()),
      GoRoute(path: '/account/personal-info',         builder: (_, _) => const PersonalInfoScreen()),
      GoRoute(path: '/account/payment-methods',       builder: (_, _) => const PaymentMethodsScreen()),
      GoRoute(path: '/account/tipping-preferences',   builder: (_, _) => const TippingPreferencesScreen()),
      GoRoute(path: '/account/notifications',         builder: (_, _) => const NotificationsSettingsScreen()),
      GoRoute(path: '/account/privacy',               builder: (_, _) => const PrivacyLocationScreen()),
      GoRoute(path: '/account/accessibility',         builder: (_, _) => const AccessibilityAppearanceScreen()),
      GoRoute(path: '/account/security',              builder: (_, _) => const SecuritySessionsScreen()),
      GoRoute(path: '/account/blocked',               builder: (_, _) => const BlockedAccountsScreen()),
      GoRoute(path: '/account/support',               builder: (_, _) => const SupportCenterScreen()),
      GoRoute(path: '/account/legal',                 builder: (_, _) => const LegalDisclosuresScreen()),
      GoRoute(path: '/account/delete',                builder: (_, _) => const AccountDeletionScreen()),
      GoRoute(path: '/creator/social-links',          builder: (_, _) => const CreatorSocialLinksScreen()),
      GoRoute(path: '/creator/media',                 builder: (_, _) => const CreatorMediaScreen()),
      GoRoute(path: '/creator/balances',              builder: (_, _) => const CreatorBalancesScreen()),
      GoRoute(path: '/creator/fans',                  builder: (_, _) => const CreatorFansScreen()),
      // Public Discovery Routes (accessible without auth)
      GoRoute(
        path: '/artist/:slug',
        builder: (_, state) => PublicProfileScreen(
          slug: state.pathParameters['slug'] ?? '',
          type: 'artist',
        ),
      ),
      GoRoute(
        path: '/band/:slug',
        builder: (_, state) => PublicProfileScreen(
          slug: state.pathParameters['slug'] ?? '',
          type: 'band',
        ),
      ),
      // Direct Tipping Route (accessible without auth)
      GoRoute(
        path: '/tip/:performerId',
        builder: (_, state) {
          final performerId = state.pathParameters['performerId'] ?? '';
          final amountStr = state.uri.queryParameters['amount'];
          final initialAmountCents = amountStr != null ? int.tryParse(amountStr) ?? 1000 : 1000;
          return TipFlowScreen(
            recipientId: performerId,
            initialAmountCents: initialAmountCents,
          );
        },
      ),
      GoRoute(path: '/tip',           builder: (_, _) => const FanShell()),
      // Persona dashboards & Creator Studio
      GoRoute(path: '/fan',           builder: (_, _) => const FanShell()),
      GoRoute(path: '/preview',       builder: (_, _) => const FanMobilePreviewHub()),
      GoRoute(path: '/preview/dashboard', builder: (_, _) => const FanMobilePreviewHub(initialScreenIndex: 0)),
      GoRoute(path: '/preview/discover',  builder: (_, _) => const FanMobilePreviewHub(initialScreenIndex: 1)),
      GoRoute(path: '/preview/tip',       builder: (_, _) => const FanMobilePreviewHub(initialScreenIndex: 2)),
      GoRoute(path: '/preview/confirm',   builder: (_, _) => const FanMobilePreviewHub(initialScreenIndex: 3)),
      GoRoute(path: '/creator',       builder: (_, _) => const CreatorShell()),
      GoRoute(path: '/creator/home',  builder: (_, _) => const CreatorShell(initialTab: 0)),
      GoRoute(path: '/creator/live',  builder: (_, _) => const CreatorShell(initialTab: 1)),
      GoRoute(path: '/creator/campaigns', builder: (_, _) => const CreatorShell(initialTab: 2)),
      GoRoute(path: '/creator/inbox', builder: (_, _) => const CreatorShell(initialTab: 3)),
      GoRoute(path: '/creator/studio', builder: (_, _) => const CreatorShell(initialTab: 4)),
      GoRoute(path: '/creator/analytics', builder: (_, _) => const CreatorAnalyticsScreen()),
      GoRoute(path: '/artist',        builder: (_, _) => const CreatorShell()),
      GoRoute(path: '/musician',      builder: (_, _) => const CreatorShell()),
      GoRoute(path: '/band_member',   builder: (_, _) => const BandShell()),
      GoRoute(path: '/band',          builder: (_, _) => const BandShell()),
      GoRoute(path: '/venue_manager', builder: (_, _) => const _PersonaDashboard(persona: 'Venue',   icon: '🏟️')),
      GoRoute(path: '/sponsor_rep',   builder: (_, _) => const SponsorShell()),
      GoRoute(path: '/sponsor',       builder: (_, _) => const SponsorShell()),
    ],
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

class CrowdbeatsV2App extends ConsumerWidget {
  const CrowdbeatsV2App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final settings = ref.watch(userSettingsProvider);
    final themeMode = switch (settings.privacy.themeMode) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };

    final a11y = settings.accessibility;

    return MaterialApp.router(
      title:                      'Crowdbeats',
      debugShowCheckedModeBanner: false,
      theme:                      CbTheme.light(),
      darkTheme:                  CbTheme.dark(),
      themeMode:                  themeMode,
      routerConfig:               router,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(a11y.fontScale),
            boldText: a11y.highContrastMode,
          ),
          child: Stack(
            children: [
              child ?? const SizedBox.shrink(),
              const CbPrivacyConsentBanner(),
            ],
          ),
        );
      },
    );
  }
}

// ── Suspended Screen ───────────────────────────────────────────────────────────

class _SuspendedScreen extends ConsumerWidget {
  const _SuspendedScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('🚫', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 16),
                Text('Account Suspended',
                  style: theme.textTheme.headlineSmall?.copyWith(color: Colors.redAccent),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Your account has been suspended. Contact support@crowdbeats.com for assistance.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 32),
                TextButton(
                  onPressed: () => ref.read(authNotifierProvider.notifier).signOut(),
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Persona Dashboard Stub ─────────────────────────────────────────────────────

class _PersonaDashboard extends ConsumerWidget {
  final String persona;
  final String icon;
  const _PersonaDashboard({required this.persona, required this.icon});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth  = ref.watch(authStateProvider);
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 8),
          Text('$persona Dashboard'),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.people_outline),
            tooltip: 'Switch persona',
            onPressed: () => showModalBottomSheet<void>(
              context: context,
              builder: (_) => const PersonaSwitcherSheet(),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () => ref.read(authNotifierProvider.notifier).signOut(),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(icon, style: const TextStyle(fontSize: 72)),
              const SizedBox(height: 16),
              Text(
                'Welcome${auth.displayName != null ? ", ${auth.displayName}" : ""}!',
                style: theme.textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                '$persona dashboard — Phase 6 features coming soon.',
                style: theme.textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Deleted Account Screen ─────────────────────────────────────────────────────

class _DeletedScreen extends ConsumerWidget {
  const _DeletedScreen();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SessionInfoScreen(
      icon: '🗑️',
      title: 'Account Removed',
      message: 'This account has been removed. If you believe this is an error, contact support@crowdbeats.com.',
      actionLabel: 'Back to sign in',
      onAction: () => ref.read(authNotifierProvider.notifier).signOut(),
    );
  }
}

// ── Session Revoked Screen ─────────────────────────────────────────────────────

class _SessionRevokedScreen extends ConsumerWidget {
  const _SessionRevokedScreen();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SessionInfoScreen(
      icon: '🔒',
      title: 'Session Revoked',
      message: 'Your session has been ended by an administrator. Please sign in again.',
      actionLabel: 'Sign in again',
      onAction: () => ref.read(authNotifierProvider.notifier).signOut(),
    );
  }
}

// ── Session Expired Screen ─────────────────────────────────────────────────────

class _SessionExpiredScreen extends ConsumerWidget {
  const _SessionExpiredScreen();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SessionInfoScreen(
      icon: '⏱️',
      title: 'Session Expired',
      message: 'Your session has expired. Please sign in again to continue.',
      actionLabel: 'Sign in again',
      onAction: () => ref.read(authNotifierProvider.notifier).signOut(),
    );
  }
}

// ── Shared Session Info Screen ─────────────────────────────────────────────────

class _SessionInfoScreen extends StatelessWidget {
  final String icon;
  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;
  const _SessionInfoScreen({
    required this.icon, required this.title,
    required this.message, required this.actionLabel, required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(icon, style: const TextStyle(fontSize: 64)),
                const SizedBox(height: 16),
                Text(title, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700), textAlign: TextAlign.center),
                const SizedBox(height: 12),
                Text(message, textAlign: TextAlign.center, style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70)),
                const SizedBox(height: 32),
                FilledButton(onPressed: onAction, child: Text(actionLabel)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

