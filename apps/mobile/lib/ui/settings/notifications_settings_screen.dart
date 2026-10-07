// Crowdbeats V2 — Notifications Settings Screen
//
// Granular notification controls categorized by Financial, Live Events, Social, and Delivery Channels.
// Mandatory security/transactional notices are permanently enabled.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_settings_row.dart';

class NotificationsSettingsScreen extends ConsumerWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(userSettingsProvider);
    final notifs = settings.notifications;
    final notifier = ref.read(userSettingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Delivery Channels
              CbSettingsSection(
                title: 'Channels',
                showTopDivider: false,
                children: [
                  CbSettingsRow(
                    title: 'Push Notifications',
                    subtitle: 'Receive real-time alerts on your device',
                    icon: Icons.notifications_active_outlined,
                    iconColor: CbColors.purpleLight,
                    isSwitch: true,
                    switchValue: notifs.pushEnabled,
                    onSwitchChanged: (val) => notifier.updateNotifications(notifs.copyWith(pushEnabled: val)),
                  ),
                  CbSettingsRow(
                    title: 'Email Digests',
                    subtitle: 'Weekly summary of top tipped artists and campaign updates',
                    icon: Icons.mark_email_read_outlined,
                    iconColor: CbColors.gpsBlue,
                    isSwitch: true,
                    switchValue: notifs.emailDigests,
                    onSwitchChanged: (val) => notifier.updateNotifications(notifs.copyWith(emailDigests: val)),
                  ),
                ],
              ),

              // Live Events & Music Discovery
              CbSettingsSection(
                title: 'Live Music & Discovery',
                children: [
                  CbSettingsRow(
                    title: 'Followed Artist Goes Live',
                    subtitle: 'Alert when an artist you follow starts a live stage',
                    icon: Icons.podcasts_outlined,
                    iconColor: CbColors.liveGreen,
                    isSwitch: true,
                    switchValue: notifs.followedArtistsLive,
                    onSwitchChanged: (val) => notifier.updateNotifications(notifs.copyWith(followedArtistsLive: val)),
                  ),
                  CbSettingsRow(
                    title: 'Nearby Concert Alerts',
                    subtitle: 'Beacon and GPS alerts when live music is detected within 5 miles',
                    icon: Icons.location_on_outlined,
                    iconColor: CbColors.heartOrange,
                    isSwitch: true,
                    switchValue: notifs.nearbyStageAlerts,
                    onSwitchChanged: (val) => notifier.updateNotifications(notifs.copyWith(nearbyStageAlerts: val)),
                  ),
                  CbSettingsRow(
                    title: 'New Music & EPK Updates',
                    subtitle: 'New tracks and tour announcements from saved bands',
                    icon: Icons.music_note_outlined,
                    iconColor: CbColors.purpleLight,
                    isSwitch: true,
                    switchValue: notifs.newReleases,
                    onSwitchChanged: (val) => notifier.updateNotifications(notifs.copyWith(newReleases: val)),
                  ),
                ],
              ),

              // Social & Band Activity
              CbSettingsSection(
                title: 'Social & Band Collaboration',
                children: [
                  CbSettingsRow(
                    title: 'New Followers',
                    subtitle: 'When other fans or musicians follow your profile',
                    icon: Icons.person_add_outlined,
                    iconColor: CbColors.purpleLight,
                    isSwitch: true,
                    switchValue: notifs.newFollowers,
                    onSwitchChanged: (val) => notifier.updateNotifications(notifs.copyWith(newFollowers: val)),
                  ),
                  CbSettingsRow(
                    title: 'Band & Team Invitations',
                    subtitle: 'Invitations to join a band roster or venue staff team',
                    icon: Icons.groups_outlined,
                    iconColor: CbColors.gpsBlue,
                    isSwitch: true,
                    switchValue: notifs.bandInvitations,
                    onSwitchChanged: (val) => notifier.updateNotifications(notifs.copyWith(bandInvitations: val)),
                  ),
                ],
              ),

              // Transactional Notices (Locked ON)
              CbSettingsSection(
                title: 'Security & Financial Notices',
                children: const [
                  CbSettingsRow(
                    title: 'Tip Receipts & Payouts',
                    subtitle: 'Legally required transactional receipts and security alerts (always active)',
                    icon: Icons.verified_user_outlined,
                    iconColor: CbColors.liveGreen,
                    statusBadge: 'Always Active',
                    statusBadgeColor: CbColors.liveGreen,
                    showChevron: false,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
