// Crowdbeats V2 — Appearance & Accessibility Screen (Phase 12)
//
// Authoritative Design: Stitch Screen 8d61b07c29ca4150baed2d9a43032bee
// Implements:
// - Immediate & persistent Theme Mode switching (Dark, Light, System)
// - OLED Pitch Black AMOLED mode
// - High Contrast Mode toggle (WCAG 2.2 AA compliance)
// - Reduced Motion toggle for vestibular comfort
// - Text Scaling slider with live typography preview
// - Screen Reader optimization toggle
// - Language & Locale selector
// - Expandable FAQ accordion & Help Desk

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_settings_row.dart';

class AccessibilityAppearanceScreen extends ConsumerStatefulWidget {
  const AccessibilityAppearanceScreen({super.key});

  @override
  ConsumerState<AccessibilityAppearanceScreen> createState() =>
      _AccessibilityAppearanceScreenState();
}

class _AccessibilityAppearanceScreenState
    extends ConsumerState<AccessibilityAppearanceScreen> {
  final Set<int> _expandedFaqs = {};

  void _toggleFaq(int index) {
    setState(() {
      if (_expandedFaqs.contains(index)) {
        _expandedFaqs.remove(index);
      } else {
        _expandedFaqs.add(index);
      }
    });
  }

  void _showLanguagePicker(BuildContext context, String currentLang) {
    final languages = [
      {'code': 'en', 'name': 'English (US)'},
      {'code': 'es', 'name': 'Español (América Latina)'},
      {'code': 'fr', 'name': 'Français'},
      {'code': 'de', 'name': 'Deutsch'},
      {'code': 'ja', 'name': '日本語'},
    ];

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF151722),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Interface Language',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...languages.map((l) {
                final isSelected = l['code'] == currentLang;
                return ListTile(
                  title: Text(
                    l['name']!,
                    style: TextStyle(
                      color: isSelected ? CbColors.purpleLight : Colors.white,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check, color: CbColors.purpleLight)
                      : null,
                  onTap: () {
                    ref
                        .read(userSettingsProvider.notifier)
                        .setLanguage(l['code']!);
                    Navigator.pop(ctx);
                  },
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(userSettingsProvider);
    final a11y = settings.accessibility;
    final privacy = settings.privacy;
    final notifier = ref.read(userSettingsProvider.notifier);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final langDisplay = switch (a11y.language) {
      'es' => 'Español (América Latina)',
      'fr' => 'Français',
      'de' => 'Deutsch',
      'ja' => '日本語',
      _ => 'English (US)',
    };

    return Scaffold(
      backgroundColor: isDark ? CbColors.bgApp : const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Appearance & Accessibility'),
        backgroundColor: isDark ? CbColors.bgApp : Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── 1. THEME & DISPLAY ─────────────────────────────────────────
              CbSettingsSection(
                title: 'Theme & Display',
                showTopDivider: false,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        _ThemeCard(
                          title: 'Dark Mode',
                          subtitle: 'Obsidian Neon',
                          icon: Icons.dark_mode_outlined,
                          isSelected: privacy.themeMode == 'dark',
                          onTap: () => notifier.setThemeMode('dark'),
                        ),
                        const SizedBox(width: 10),
                        _ThemeCard(
                          title: 'Light Mode',
                          subtitle: 'High Contrast',
                          icon: Icons.light_mode_outlined,
                          isSelected: privacy.themeMode == 'light',
                          onTap: () => notifier.setThemeMode('light'),
                        ),
                        const SizedBox(width: 10),
                        _ThemeCard(
                          title: 'System',
                          subtitle: 'Device Auto',
                          icon: Icons.brightness_auto,
                          isSelected: privacy.themeMode == 'system',
                          onTap: () => notifier.setThemeMode('system'),
                        ),
                      ],
                    ),
                  ),
                  CbSettingsRow(
                    title: 'OLED Pitch Black',
                    subtitle: 'Pure #000000 dark canvas to maximize battery on OLED displays',
                    icon: Icons.battery_charging_full,
                    iconColor: CbColors.liveGreen,
                    isSwitch: true,
                    switchValue: a11y.oledBlack,
                    onSwitchChanged: (val) => notifier.setOledBlack(val),
                  ),
                ],
              ),

              // ── 2. ACCESSIBILITY & VISION ──────────────────────────────────
              CbSettingsSection(
                title: 'Accessibility & Vision',
                children: [
                  CbSettingsRow(
                    title: 'High Contrast Mode',
                    subtitle: 'Enhances container boundaries, contrast ratios, and stroke weights',
                    icon: Icons.contrast,
                    iconColor: CbColors.purpleLight,
                    isSwitch: true,
                    switchValue: a11y.highContrastMode,
                    onSwitchChanged: (val) => notifier.setHighContrast(val),
                  ),
                  CbSettingsRow(
                    title: 'Reduce Motion',
                    subtitle: 'Pauses live stage breathing glows and radar waves for vestibular safety',
                    icon: Icons.motion_photos_off_outlined,
                    iconColor: CbColors.tealGas,
                    isSwitch: true,
                    switchValue: a11y.reduceMotion,
                    onSwitchChanged: (val) => notifier.setReduceMotion(val),
                  ),
                  // Text scaling slider
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E2032) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Expanded(
                                child: Text(
                                  'Text Scaling & Legibility',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${(a11y.fontScale * 100).round()}%',
                                style: const TextStyle(
                                  color: CbColors.purpleLight,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Slider(
                            value: a11y.fontScale,
                            min: 0.8,
                            max: 1.4,
                            divisions: 6,
                            activeColor: CbColors.purpleMain,
                            inactiveColor: isDark ? Colors.white24 : Colors.black12,
                            onChanged: (val) => notifier.setFontScale(val),
                          ),
                          const SizedBox(height: 8),
                          // Live typography preview badge
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF151722) : const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: CbColors.purpleMain.withValues(alpha: 0.4),
                                ),
                              ),
                              child: const Text(
                                'Aa Live Soundwave • Setlist Stage Preview',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  CbSettingsRow(
                    title: 'Screen Reader Optimization',
                    subtitle: 'Enhances acoustic spatial landmarks and semantic hierarchy',
                    icon: Icons.record_voice_over_outlined,
                    iconColor: CbColors.heartOrange,
                    isSwitch: true,
                    switchValue: a11y.screenReaderOptimized,
                    onSwitchChanged: (val) {
                      notifier.updateAccessibility(
                        a11y.copyWith(screenReaderOptimized: val),
                      );
                    },
                  ),
                ],
              ),

              // ── 3. LANGUAGE & LOCALIZATION ─────────────────────────────────
              CbSettingsSection(
                title: 'Language & Localization',
                children: [
                  CbSettingsRow(
                    title: 'Interface Language',
                    subtitle: 'Select application locale',
                    icon: Icons.language,
                    iconColor: CbColors.gpsBlue,
                    valueText: langDisplay,
                    onTap: () => _showLanguagePicker(context, a11y.language),
                  ),
                  const CbSettingsRow(
                    title: 'Display Currency',
                    subtitle: 'All platform ledger values calculated in minor units',
                    icon: Icons.attach_money,
                    iconColor: CbColors.liveGreen,
                    valueText: 'USD (\$)',
                    showChevron: false,
                  ),
                ],
              ),

              // ── 4. HELP CENTER & FAQ ACCORDION ─────────────────────────────
              CbSettingsSection(
                title: 'Help Center & FAQs',
                children: [
                  _FaqTile(
                    index: 0,
                    question: 'How do tipping revenue splits work?',
                    answer:
                        'On live stages, tips are distributed according to the performer contract. For Solo performers, 94% settles directly to your Stripe account, with a 6% platform fee. For Bands, splits are calculated in integer minor units according to member percentages.',
                    isExpanded: _expandedFaqs.contains(0),
                    onToggle: () => _toggleFaq(0),
                  ),
                  _FaqTile(
                    index: 1,
                    question: 'What is the 6% platform fee?',
                    answer:
                        'The standard 6% platform fee covers low-latency crowd stage radar, 300s rotating QR generation, double-entry financial settlement ledgers, and 24/7 trust & safety monitoring.',
                    isExpanded: _expandedFaqs.contains(1),
                    onToggle: () => _toggleFaq(1),
                  ),
                  _FaqTile(
                    index: 2,
                    question: 'How do I withdraw creator payouts?',
                    answer:
                        'Creators can withdraw cleared available balances via Stripe Connect. Standard ACH transfers settle in 1-2 business days (\$0 fee). Instant payouts settle in minutes for an additional 1% fee.',
                    isExpanded: _expandedFaqs.contains(2),
                    onToggle: () => _toggleFaq(2),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.support_agent, color: CbColors.purpleLight),
                      label: const Text('Contact 24/7 Crew Support'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: isDark ? Colors.white : Colors.black87,
                        side: const BorderSide(color: CbColors.borderSubtle),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => context.push('/account/support'),
                    ),
                  ),
                ],
              ),

              // ── 5. LEGAL DISCLOSURES ───────────────────────────────────────
              CbSettingsSection(
                title: 'Legal Documents',
                children: [
                  CbSettingsRow(
                    title: 'Terms of Service',
                    subtitle: 'Platform user agreements and acceptable use policies',
                    icon: Icons.description_outlined,
                    iconColor: Colors.white70,
                    onTap: () => context.push('/account/legal'),
                  ),
                  CbSettingsRow(
                    title: 'Privacy Policy',
                    subtitle: 'GDPR/CCPA compliance and biometric sensor safeguards',
                    icon: Icons.privacy_tip_outlined,
                    iconColor: CbColors.purpleLight,
                    onTap: () => context.push('/account/legal'),
                  ),
                  CbSettingsRow(
                    title: 'Open Source Licenses',
                    subtitle: 'Flutter and third-party library attributions',
                    icon: Icons.code,
                    iconColor: CbColors.tealGas,
                    onTap: () => showLicensePage(
                      context: context,
                      applicationName: 'Crowdbeats',
                      applicationVersion: '2.0.0',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _ThemeCard extends StatelessWidget {
  const _ThemeCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? CbColors.purpleMain.withValues(alpha: 0.15)
                : const Color(0xFF1E2032),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isSelected ? CbColors.purpleLight : Colors.white70,
                size: 24,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(color: CbColors.textSecondary, fontSize: 10),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FaqTile extends StatelessWidget {
  const _FaqTile({
    required this.index,
    required this.question,
    required this.answer,
    required this.isExpanded,
    required this.onToggle,
  });

  final int index;
  final String question;
  final String answer;
  final bool isExpanded;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onToggle,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: CbColors.borderSubtle, width: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    question,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Icon(
                  isExpanded ? Icons.expand_less : Icons.expand_more,
                  color: CbColors.purpleLight,
                  size: 20,
                ),
              ],
            ),
            if (isExpanded) ...[
              const SizedBox(height: 8),
              Text(
                answer,
                style: const TextStyle(
                  color: CbColors.textSecondary,
                  fontSize: 12.5,
                  height: 1.4,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
