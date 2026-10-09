// Crowdbeats V2 — Email Verification Gate (Phase 5)
// Live status polling, manual verification trigger, resend cooldown timer,
// CbSafeScaffold, CbButton, and Stitch design token architecture.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../firebase/auth_service.dart';
import '../../state/auth_state.dart';
import '../../ui/theme/cb_spacing.dart';
import '../../ui/theme/cb_theme.dart';
import '../../ui/theme/cb_typography.dart';
import '../components/cb_button.dart';
import '../components/cb_scaffold.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  Timer? _pollTimer;
  Timer? _cooldownTimer;
  int _cooldown = 0;
  bool _resending = false;
  bool _checking = false;
  String? _notice;
  bool _isSuccessNotice = false;

  static const _pollIntervalSec = 3;
  static const _cooldownSec = 60;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(
      const Duration(seconds: _pollIntervalSec),
      (_) async {
        if (!mounted) return;
        await ref.read(authNotifierProvider.notifier).reloadUser();
      },
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    setState(() => _cooldown = _cooldownSec);
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        if (_cooldown <= 1) {
          _cooldown = 0;
          t.cancel();
        } else {
          _cooldown--;
        }
      });
    });
  }

  Future<void> _resend() async {
    if (_resending || _cooldown > 0) return;
    setState(() {
      _resending = true;
      _notice = null;
    });

    try {
      await AuthService.instance.resendVerification();
      if (mounted) {
        setState(() {
          _isSuccessNotice = true;
          _notice = 'Verification link sent! Please check your inbox and spam folder.';
        });
        _startCooldown();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isSuccessNotice = false;
          _notice = 'Unable to send verification link right now. Please try again in a moment.';
        });
      }
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _checkNow() async {
    if (_checking) return;
    setState(() => _checking = true);
    await ref.read(authNotifierProvider.notifier).reloadUser();
    if (mounted) {
      setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    final auth = ref.watch(authStateProvider);

    return CbSafeScaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6, vertical: CbSpacing.s8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero Graphic
              Center(
                child: Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: ext.surfaceRaised,
                    shape: BoxShape.circle,
                    border: Border.all(color: ext.borderFocus.withAlpha(80), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: ext.borderFocus.withAlpha(30),
                        blurRadius: 24,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Icon(
                      Icons.mark_email_unread_outlined,
                      size: 48,
                      color: ext.borderFocus,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              Text(
                'Check your email',
                style: CbTypography.pageTitle(color: ext.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: CbSpacing.s3),
              Text(
                'We sent a verification link to',
                textAlign: TextAlign.center,
                style: CbTypography.bodyMd(color: ext.textSecondary),
              ),
              const SizedBox(height: CbSpacing.s1),
              Text(
                auth.email ?? 'your email address',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: ext.textPrimary,
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Live Polling Badge
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s3, vertical: CbSpacing.s2),
                  decoration: BoxDecoration(
                    color: ext.surfaceRaised,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    border: Border.all(color: ext.borderSubtle),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: ext.borderFocus,
                        ),
                      ),
                      const SizedBox(width: CbSpacing.s2),
                      Text(
                        'Checking automatically every 3 seconds',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: ext.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              if (_notice != null) ...[
                const SizedBox(height: CbSpacing.s5),
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s3),
                  decoration: BoxDecoration(
                    color: _isSuccessNotice
                        ? ext.statusSuccess.withAlpha(25)
                        : ext.statusError.withAlpha(25),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    border: Border.all(
                      color: _isSuccessNotice
                          ? ext.statusSuccess.withAlpha(80)
                          : ext.statusError.withAlpha(80),
                    ),
                  ),
                  child: Text(
                    _notice!,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      color: _isSuccessNotice ? ext.statusSuccess : ext.statusError,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],

              const SizedBox(height: CbSpacing.s8),

              // Manual Check Button
              CbButton(
                label: "I've Verified My Email",
                fullWidth: true,
                isLoading: _checking,
                onPressed: _checking ? null : _checkNow,
              ),
              const SizedBox(height: CbSpacing.s3),

              // Resend Button with Cooldown
              CbButton(
                label: _cooldown > 0
                    ? 'Resend in ${_cooldown}s'
                    : 'Resend Verification Email',
                variant: CbButtonVariant.secondary,
                fullWidth: true,
                isLoading: _resending,
                onPressed: (_cooldown > 0 || _resending) ? null : _resend,
              ),
              const SizedBox(height: CbSpacing.s3),

              // Sign Out Action
              CbButton(
                label: 'Sign Out',
                variant: CbButtonVariant.ghost,
                fullWidth: true,
                onPressed: () => ref.read(authNotifierProvider.notifier).signOut(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
