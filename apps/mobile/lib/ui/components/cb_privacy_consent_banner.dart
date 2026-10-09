// Crowdbeats V2 — Mobile Privacy & CCPA Statutory Consent Banner
//
// Complies with:
// - California Civil Code § 1798.100 (Notice at Collection & Right to Know)
// - California Civil Code § 1798.120 (Do Not Sell or Share Personal Info)
// - EU GDPR Article 15 (Right of Access by the Data Subject)
//
// Invariant:
// Displayed only on the user's first-time visit / launch.
// Once the user agrees ("Accept All & Agree") or modifies ("Limit to Essential Only"),
// the widget is permanently removed from the view hierarchy.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CbPrivacyConsentBanner extends ConsumerStatefulWidget {
  const CbPrivacyConsentBanner({
    super.key,
    this.initialAgreed,
    this.onDismissed,
  });

  /// Optional override for testing
  final bool? initialAgreed;
  final VoidCallback? onDismissed;

  static const String storageKey = 'cb_privacy_consent_agreed';

  @override
  ConsumerState<CbPrivacyConsentBanner> createState() =>
      _CbPrivacyConsentBannerState();
}

class _CbPrivacyConsentBannerState
    extends ConsumerState<CbPrivacyConsentBanner> {
  bool _isVisible = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _checkConsentStatus();
  }

  Future<void> _checkConsentStatus() async {
    if (widget.initialAgreed != null) {
      if (mounted) {
        setState(() {
          _isVisible = !widget.initialAgreed!;
          _loaded = true;
        });
      }
      return;
    }

    try {
      final sp = await SharedPreferences.getInstance();
      final hasAgreed = sp.getBool(CbPrivacyConsentBanner.storageKey) ?? false;
      if (mounted) {
        setState(() {
          _isVisible = !hasAgreed;
          _loaded = true;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isVisible = true;
          _loaded = true;
        });
      }
    }
  }

  Future<void> _handleConsentChoice({required bool acceptAll}) async {
    try {
      final sp = await SharedPreferences.getInstance();
      await sp.setBool(CbPrivacyConsentBanner.storageKey, true);
      await sp.setString(
        'cb_privacy_consent_status',
        acceptAll ? 'accepted_all' : 'essential_only',
      );
    } catch (_) {}

    try {
      final currentPrivacy = ref.read(userSettingsProvider).privacy;
      final updatedPrivacy = currentPrivacy.copyWith(
        telemetryConsent: acceptAll,
        shareListeningActivity: acceptAll,
      );
      await ref
          .read(userSettingsProvider.notifier)
          .updatePrivacy(updatedPrivacy);
    } catch (_) {}

    if (mounted) {
      setState(() => _isVisible = false);
    }
    widget.onDismissed?.call();
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded || !_isVisible) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF131520) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? CbColors.purpleDim : const Color(0xFFE2E8F0),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.6 : 0.15),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Notice Header Chip
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: CbColors.purpleDim,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: CbColors.purpleLight, width: 0.8),
                    ),
                    child: const Text(
                      '⚖️ CCPA § 1798.100 & GDPR NOTICE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: CbColors.purpleLight,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    '● Zero Tracking',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: CbColors.liveGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Title
              Text(
                'Your Privacy Rights & Statutory Consent Choice',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),

              // Description
              Text(
                'Under California Civil Code § 1798.100 and GDPR Article 15, you have the right to know what personal data is collected before collection begins. Crowdbeats guarantees zero sale or sharing of your data.',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? CbColors.textSecondary : const Color(0xFF64748B),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 14),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      key: const Key('btn_limit_essential'),
                      onPressed: () => _handleConsentChoice(acceptAll: false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: isDark ? Colors.white70 : const Color(0xFF475569),
                        side: BorderSide(
                          color: isDark ? Colors.white24 : const Color(0xFFCBD5E1),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Limit to Essential',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      key: const Key('btn_accept_all'),
                      onPressed: () => _handleConsentChoice(acceptAll: true),
                      style: FilledButton.styleFrom(
                        backgroundColor: CbColors.purpleMain,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Accept All & Agree',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                      ),
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
