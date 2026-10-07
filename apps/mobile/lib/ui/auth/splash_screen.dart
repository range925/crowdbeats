// Crowdbeats V2 — Splash Screen (Phase 5)
// Shows logo while auth state resolves. Auto-navigates via GoRouter redirect.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/auth_state.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';
import '../components/cb_logo.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  Timer? _fallbackTimer;

  @override
  void initState() {
    super.initState();
    // Safety fallback: if auth takes more than 1.5s (e.g. web/emulator offline), navigate to /auth
    _fallbackTimer = Timer(const Duration(milliseconds: 1500), () {
      if (mounted) {
        final auth = ref.read(authStateProvider);
        if (auth.status == CbAuthStatus.authenticated) {
          context.go('/${auth.personaType ?? "fan"}');
        } else {
          context.go('/auth');
        }
      }
    });
  }

  @override
  void dispose() {
    _fallbackTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authStateProvider, (_, next) {
      if (next.status == CbAuthStatus.authenticated) {
        context.go('/${next.personaType ?? "fan"}');
      } else if (next.status == CbAuthStatus.unauthenticated) {
        context.go('/auth');
      }
    });

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CbLogo(
                variant: CbLogoVariant.horizontal,
                surface: CbLogoSurface.dark,
                height: 44,
              ),
              const SizedBox(height: CbSpacing.s4),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: CbColors.accentPrimary,
                ),
              ),
              const SizedBox(height: CbSpacing.s10),
              // Fast Preview Shortcuts for localhost exploration
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  OutlinedButton.icon(
                    icon: const Icon(Icons.person, size: 16),
                    label: const Text('Fan View'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: CbColors.textPrimary,
                      side: const BorderSide(color: CbColors.borderDefault),
                    ),
                    onPressed: () => context.go('/fan'),
                  ),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.mic, size: 16),
                    label: const Text('Musician View'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: CbColors.textPrimary,
                      side: const BorderSide(color: CbColors.borderDefault),
                    ),
                    onPressed: () => context.go('/artist'),
                  ),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.groups, size: 16),
                    label: const Text('Band View'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: CbColors.textPrimary,
                      side: const BorderSide(color: CbColors.borderDefault),
                    ),
                    onPressed: () => context.go('/band_member'),
                  ),
                  FilledButton(
                    child: const Text('Sign In / Up'),
                    onPressed: () => context.go('/auth'),
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
