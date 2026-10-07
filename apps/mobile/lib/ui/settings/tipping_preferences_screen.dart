// Crowdbeats V2 — Tipping Preferences Screen
//
// Allows fans to configure preset tipping amounts ($2, $5, $10, $20),
// default tipping currency, and 1-tap quick tipping.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_settings_row.dart';

class TippingPreferencesScreen extends ConsumerWidget {
  const TippingPreferencesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(userSettingsProvider);
    final tipping = settings.tipping;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tipping Preferences'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CbSettingsSection(
                title: 'Quick Tipping',
                showTopDivider: false,
                children: [
                  CbSettingsRow(
                    title: '1-Tap Fast Tipping',
                    subtitle: 'Send tips directly from the live stage view without leaving the concert screen',
                    icon: Icons.flash_on_outlined,
                    iconColor: CbColors.rankGold,
                    isSwitch: true,
                    switchValue: tipping.quickOneTap,
                    onSwitchChanged: (val) {
                      ref.read(userSettingsProvider.notifier).updateTipping(
                        tipping.copyWith(quickOneTap: val),
                      );
                    },
                  ),
                ],
              ),

              CbSettingsSection(
                title: 'Default Currency',
                children: [
                  ...['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((curr) {
                    final isSelected = curr == tipping.defaultCurrency;
                    return CbSettingsRow(
                      title: curr,
                      icon: Icons.monetization_on_outlined,
                      iconColor: isSelected ? CbColors.liveGreen : Colors.white54,
                      statusBadge: isSelected ? 'Active' : null,
                      showChevron: false,
                      onTap: () {
                        ref.read(userSettingsProvider.notifier).updateTipping(
                          tipping.copyWith(defaultCurrency: curr),
                        );
                      },
                    );
                  }),
                ],
              ),

              CbSettingsSection(
                title: 'Tip Presets',
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Text(
                      'Default quick tip buttons shown during live performances: ${tipping.presetAmounts.map((a) => '\$$a').join(', ')}',
                      style: const TextStyle(color: CbColors.textSecondary, fontSize: 13, height: 1.4),
                    ),
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
