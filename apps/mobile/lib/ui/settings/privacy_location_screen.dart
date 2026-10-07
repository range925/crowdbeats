// Crowdbeats V2 — Privacy & Location Settings Screen (Phase 3)
//
// Truthful privacy controls:
// - Granular precision selection (Precise vs. Approximate)
// - Master stealth toggle ("Hide me from performers")
// - OS permission state inspect & open settings recovery
// - "What fans will see" interactive preview
// - Consent history & recent location access explanations
// - Appearance theme selection (System default, Dark, Light)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/location_provider.dart';
import '../../state/audience_visibility_state.dart';
import '../../state/location_provider_state.dart';
import '../../state/user_settings_state.dart';
import '../components/cb_settings_row.dart';
import '../location/location_permission_state_view.dart';
import '../location/what_fans_will_see_card.dart';
import '../theme/cb_colors.dart';

class PrivacyLocationScreen extends ConsumerStatefulWidget {
  const PrivacyLocationScreen({super.key});

  @override
  ConsumerState<PrivacyLocationScreen> createState() =>
      _PrivacyLocationScreenState();
}

class _PrivacyLocationScreenState extends ConsumerState<PrivacyLocationScreen> {
  LocationPermissionState _osPermissionState =
      LocationPermissionState.notDetermined;
  bool _previewIsVenue = true;

  @override
  void initState() {
    super.initState();
    _refreshPermission();
  }

  Future<void> _refreshPermission() async {
    final provider = ref.read(locationProviderProvider);
    final state = await provider.getPermissionState();
    if (mounted) {
      setState(() => _osPermissionState = state);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(userSettingsProvider);
    final privacy = settings.privacy;
    final notifier = ref.read(userSettingsProvider.notifier);
    final visibilityState = ref.watch(audienceVisibilityProvider);
    final locationProvider = ref.read(locationProviderProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy & Location'),
        backgroundColor: isDark ? CbColors.bgApp : Colors.white,
      ),
      backgroundColor: isDark ? CbColors.bgApp : const Color(0xFFF9FAFB),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // OS Location Permission State View
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: LocationPermissionStateView(
                  state: _osPermissionState,
                  onRequestPermission: () async {
                    await locationProvider.requestFullPermissionState();
                    await _refreshPermission();
                  },
                  onOpenSettings: () async {
                    await locationProvider.openSettings();
                  },
                  onRequestPrecisionUpgrade: () async {
                    await locationProvider.requestTemporaryFullAccuracy(
                      purposeKey: 'privacy_settings_upgrade',
                    );
                    await _refreshPermission();
                  },
                ),
              ),

              // Location Precision (In-App)
              CbSettingsSection(
                title: 'Location Precision',
                children: [
                  CbSettingsRow(
                    title: 'Live GPS Radar (Precise)',
                    subtitle:
                        'Pinpoints nearby performing artists and active stages within walking distance',
                    icon: Icons.my_location,
                    iconColor: privacy.locationPrecision == 'precise'
                        ? CbColors.liveGreen
                        : Colors.white54,
                    statusBadge:
                        privacy.locationPrecision == 'precise' ? 'Selected' : null,
                    showChevron: false,
                    onTap: () => notifier.updatePrivacy(
                        privacy.copyWith(locationPrecision: 'precise')),
                  ),
                  CbSettingsRow(
                    title: 'City-Level (Approximate)',
                    subtitle:
                        'Discovers trending live events in your broader metro region without precise coordinates',
                    icon: Icons.location_city_outlined,
                    iconColor: privacy.locationPrecision == 'approximate'
                        ? CbColors.liveGreen
                        : Colors.white54,
                    statusBadge: privacy.locationPrecision == 'approximate'
                        ? 'Selected'
                        : null,
                    showChevron: false,
                    onTap: () => notifier.updatePrivacy(
                        privacy.copyWith(locationPrecision: 'approximate')),
                  ),
                ],
              ),

              // Fan Stealth & Discovery Controls
              CbSettingsSection(
                title: 'Performer Visibility & Stealth',
                children: [
                  CbSettingsRow(
                    title: 'Hide Me From Performers (Stealth)',
                    subtitle:
                        'Disables all audience visibility sharing across all shows. Incognito mode for listeners.',
                    icon: Icons.visibility_off,
                    iconColor: privacy.hideMeFromPerformers
                        ? CbColors.rankGold
                        : Colors.white54,
                    isSwitch: true,
                    switchValue: privacy.hideMeFromPerformers,
                    onSwitchChanged: (val) {
                      ref
                          .read(audienceVisibilityProvider.notifier)
                          .setStealthMode(val);
                    },
                  ),
                  CbSettingsRow(
                    title: 'Visible in Nearby Live Radar',
                    subtitle:
                        'Allow musicians to see your fan avatar near the stage if you explicitly opt in',
                    icon: Icons.radar,
                    iconColor: CbColors.purpleLight,
                    isSwitch: true,
                    switchValue: privacy.profileDiscoverableInRadar,
                    onSwitchChanged: (val) => notifier.updatePrivacy(
                        privacy.copyWith(profileDiscoverableInRadar: val)),
                  ),
                  CbSettingsRow(
                    title: 'Default Anonymous Tipping',
                    subtitle:
                        'Hide your name on public concert tip boards by default',
                    icon: Icons.shield,
                    iconColor: CbColors.heartOrange,
                    isSwitch: true,
                    switchValue: privacy.defaultAnonymousTipping,
                    onSwitchChanged: (val) => notifier.updatePrivacy(
                        privacy.copyWith(defaultAnonymousTipping: val)),
                  ),
                ],
              ),

              // "What Fans Will See" Preview Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'LOCATION PREVIEW MODE',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: isDark ? CbColors.textSecondary : Colors.black54,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                        TextButton(
                          onPressed: () => setState(() => _previewIsVenue = !_previewIsVenue),
                          child: Text(
                            _previewIsVenue ? 'Preview Mobile' : 'Preview Venue',
                            style: const TextStyle(color: CbColors.tealGas, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    WhatFansWillSeeCard(
                      isVenue: _previewIsVenue,
                      venueName: 'Sunset Lounge',
                      venueCityState: 'San Diego, CA',
                      neighborhoodArea: 'Gaslamp Quarter (~100m grid)',
                      freshnessText: 'Active Session',
                    ),
                  ],
                ),
              ),

              // Appearance & Theme Mode (Phase 3 Requirement 14)
              CbSettingsSection(
                title: 'Appearance & Theme',
                children: [
                  CbSettingsRow(
                    title: 'System Default',
                    subtitle: 'Follow your operating system’s light or dark mode',
                    icon: Icons.brightness_auto,
                    iconColor: privacy.themeMode == 'system'
                        ? CbColors.purpleLight
                        : Colors.white54,
                    statusBadge: privacy.themeMode == 'system' ? 'Selected' : null,
                    showChevron: false,
                    onTap: () => notifier
                        .updatePrivacy(privacy.copyWith(themeMode: 'system')),
                  ),
                  CbSettingsRow(
                    title: 'Dark Mode',
                    subtitle: 'Crowdbeats Stitch obsidian and violet night theme',
                    icon: Icons.dark_mode_outlined,
                    iconColor: privacy.themeMode == 'dark'
                        ? CbColors.purpleLight
                        : Colors.white54,
                    statusBadge: privacy.themeMode == 'dark' ? 'Selected' : null,
                    showChevron: false,
                    onTap: () => notifier
                        .updatePrivacy(privacy.copyWith(themeMode: 'dark')),
                  ),
                  CbSettingsRow(
                    title: 'Light Mode',
                    subtitle: 'High contrast clean daytime theme (WCAG 2.2 AA)',
                    icon: Icons.light_mode_outlined,
                    iconColor: privacy.themeMode == 'light'
                        ? CbColors.purpleLight
                        : Colors.white54,
                    statusBadge: privacy.themeMode == 'light' ? 'Selected' : null,
                    showChevron: false,
                    onTap: () => notifier
                        .updatePrivacy(privacy.copyWith(themeMode: 'light')),
                  ),
                ],
              ),

              // Consent Receipts & Transparency Log
              CbSettingsSection(
                title: 'Consent History & Audit Log',
                children: [
                  CbSettingsRow(
                    title: 'Recent Location Access Log',
                    subtitle: privacy.lastLocationAccessExplanation ??
                        'No location sensor access recorded during this session.',
                    icon: Icons.history_edu,
                    iconColor: CbColors.tealGas,
                    showChevron: false,
                  ),
                  if (visibilityState.consentHistory.isNotEmpty) ...[
                    ...visibilityState.consentHistory.take(3).map(
                          (receipt) => CbSettingsRow(
                            title:
                                '${receipt.action == "granted" ? "Granted" : "Revoked"} ${receipt.tier.wire} visibility',
                            subtitle:
                                'Session: ${receipt.sessionId} • ${receipt.createdAt.substring(0, 10)}',
                            icon: receipt.action == 'granted'
                                ? Icons.check_circle_outline
                                : Icons.cancel_outlined,
                            iconColor: receipt.action == 'granted'
                                ? CbColors.statusLive
                                : CbColors.statusError,
                            showChevron: false,
                          ),
                        ),
                  ] else ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Text(
                        'No active or past audience visibility grants for this account.',
                        style: TextStyle(color: CbColors.textMuted, fontSize: 12),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
