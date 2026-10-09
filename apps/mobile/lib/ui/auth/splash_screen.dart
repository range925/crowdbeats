// Crowdbeats V2 — Splash Screen (Phase 5)
// Shows logo while auth state resolves. Route transitions are driven authoritatively by GoRouter redirect.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/auth_state.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';
import '../../ui/theme/cb_theme.dart';
import '../../ui/theme/cb_typography.dart';
import '../components/cb_logo.dart';
import '../components/cb_scaffold.dart';
import '../components/cb_button.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _showOfflineRecovery = false;
  Timer? _offlineNoticeTimer;

  @override
  void initState() {
    super.initState();
    // After 5s without resolution, surface explicit recovery controls rather than silent redirect
    _offlineNoticeTimer = Timer(const Duration(seconds: 5), () {
      if (mounted) {
        final auth = ref.read(authStateProvider);
        if (auth.status == CbAuthStatus.loading) {
          setState(() => _showOfflineRecovery = true);
        }
      }
    });
  }

  @override
  void dispose() {
    _offlineNoticeTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ext = context.cbTheme;

    return CbSafeScaffold(
      backgroundColor: ext.surfaceCanvas,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CbLogo(
                variant: CbLogoVariant.horizontal,
                surface: context.isDark ? CbLogoSurface.dark : CbLogoSurface.light,
                height: 48,
              ),
              const SizedBox(height: CbSpacing.s8),
              SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: ext.borderFocus,
                ),
              ),
              const SizedBox(height: CbSpacing.s6),
              Text(
                'Connecting to Crowdbeats…',
                style: CbTypography.bodySm(color: ext.textSecondary),
              ),
              if (_showOfflineRecovery) ...[
                const SizedBox(height: CbSpacing.s8),
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s4),
                  decoration: BoxDecoration(
                    color: ext.surfaceCard,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: ext.borderSubtle),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Connecting is taking longer than usual.',
                        style: CbTypography.bodySm(color: ext.textPrimary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: CbSpacing.s3),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CbButton(
                            label: 'Explore as Guest',
                            variant: CbButtonVariant.secondary,
                            size: CbButtonSize.sm,
                            onPressed: () => context.go('/fan'),
                          ),
                          const SizedBox(width: CbSpacing.s3),
                          CbButton(
                            label: 'Sign In',
                            variant: CbButtonVariant.primary,
                            size: CbButtonSize.sm,
                            onPressed: () => context.go('/auth'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
