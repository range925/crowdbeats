// Crowdbeats V2 — Email Verification Gate (Phase 5)

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/auth_state.dart';
import '../../firebase/auth_service.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  Timer? _pollTimer;
  int _cooldown = 0;
  bool _resending = false;
  String? _notice;

  static const _pollIntervalSec = 3;
  static const _cooldownSec = 60;

  @override
  void initState() {
    super.initState();
    _pollTimer = Timer.periodic(
      const Duration(seconds: _pollIntervalSec),
      (_) async {
        await ref.read(authNotifierProvider.notifier).reloadUser();
      },
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    setState(() => _cooldown = _cooldownSec);
    Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() {
        if (_cooldown <= 0) { t.cancel(); } else { _cooldown--; }
      });
    });
  }

  Future<void> _resend() async {
    setState(() { _resending = true; _notice = null; });
    try {
      await AuthService.instance.resendVerification();
      setState(() => _notice = 'Verification email sent! Check your inbox.');
      _startCooldown();
    } catch (_) {
      setState(() => _notice = 'Failed to resend. Please try again.');
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth  = ref.watch(authStateProvider);
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(CbSpacing.s6),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('✉️', style: TextStyle(fontSize: 64), textAlign: TextAlign.center),
              const SizedBox(height: CbSpacing.s5),
              Text('Check your email',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
                textAlign: TextAlign.center),
              const SizedBox(height: CbSpacing.s3),
              Text('We sent a verification link to\n${auth.email ?? "your email address"}',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s4),
              Text('This page checks automatically every 3 seconds.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(color: CbColors.textTertiary)),
              if (_notice != null) ...[
                const SizedBox(height: CbSpacing.s4),
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s3),
                  decoration: BoxDecoration(
                    color: CbColors.statusInfo.withAlpha(30),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    border: Border.all(color: CbColors.statusInfo.withAlpha(80)),
                  ),
                  child: Text(_notice!, style: const TextStyle(fontSize: 13)),
                ),
              ],
              const SizedBox(height: CbSpacing.s8),
              OutlinedButton(
                onPressed: (_cooldown > 0 || _resending) ? null : _resend,
                child: _resending
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(_cooldown > 0 ? 'Resend in ${_cooldown}s' : 'Resend verification email'),
              ),
              const SizedBox(height: CbSpacing.s3),
              TextButton(
                onPressed: () => ref.read(authNotifierProvider.notifier).signOut(),
                child: const Text('Sign out'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
