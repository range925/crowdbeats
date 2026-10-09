// Crowdbeats V2 — Forgot Password Screen (Phase 5)
// Enumeration-resistant: always shows success confirmation card.
// Adheres to CbSafeScaffold, CbFormField, CbButton, and Stitch design token architecture.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../firebase/auth_service.dart';
import '../../ui/theme/cb_spacing.dart';
import '../../ui/theme/cb_theme.dart';
import '../../ui/theme/cb_typography.dart';
import '../components/cb_button.dart';
import '../components/cb_form_field.dart';
import '../components/cb_scaffold.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key, this.returnPath});

  final String? returnPath;

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading) return;
    final emailText = _email.text.trim();
    if (emailText.isEmpty || !emailText.contains('@')) return;

    setState(() => _loading = true);
    try {
      await AuthService.instance.requestPasswordReset(emailText);
    } catch (_) {
      // Enumeration-resistant: silently proceed to confirmation state
    }
    if (mounted) {
      setState(() {
        _loading = false;
        _sent = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    String? from = widget.returnPath;
    if (from == null) {
      try {
        from = GoRouterState.of(context).uri.queryParameters['from'];
      } catch (_) {}
    }

    return CbSafeScaffold(
      appBar: AppBar(
        title: Text(
          'Reset Password',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              final query = from != null ? '?from=${Uri.encodeComponent(from)}' : '';
              context.go('/auth$query');
            }
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(CbSpacing.s6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: CbSpacing.s4),
            Text(
              'Forgot your password?',
              style: CbTypography.sectionTitle(color: ext.textPrimary),
            ),
            const SizedBox(height: CbSpacing.s2),
            Text(
              'Enter the email address associated with your account, and we will send you secure recovery instructions.',
              style: CbTypography.bodyMd(color: ext.textSecondary),
            ),
            const SizedBox(height: CbSpacing.s6),
            if (_sent) ...[
              Container(
                padding: const EdgeInsets.all(CbSpacing.s5),
                decoration: BoxDecoration(
                  color: ext.statusSuccess.withAlpha(20),
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: ext.statusSuccess.withAlpha(80)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.check_circle_outline_rounded, color: ext.statusSuccess, size: 22),
                        const SizedBox(width: CbSpacing.s2),
                        Text(
                          'Instructions Sent',
                          style: GoogleFonts.plusJakartaSans(
                            color: ext.statusSuccess,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: CbSpacing.s3),
                    Text(
                      "If an account exists for ${_email.text.trim()}, you will receive a password reset link shortly. Please check your spam folder.",
                      style: GoogleFonts.plusJakartaSans(
                        color: ext.textPrimary,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: CbSpacing.s2),
                    Text(
                      "Reset links expire in 15 minutes for your security.",
                      style: GoogleFonts.plusJakartaSans(
                        color: ext.textTertiary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s6),
              CbButton(
                label: 'Return to Sign In',
                variant: CbButtonVariant.primary,
                fullWidth: true,
                onPressed: () {
                  final query = from != null ? '?from=${Uri.encodeComponent(from)}' : '';
                  context.go('/auth$query');
                },
              ),
            ] else ...[
              CbFormField(
                label: 'Email address',
                controller: _email,
                hintText: 'you@example.com',
                leadingIcon: Icon(Icons.email_outlined, size: 20, color: ext.textTertiary),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: CbSpacing.s6),
              CbButton(
                label: 'Send Reset Link',
                fullWidth: true,
                isLoading: _loading,
                onPressed: _loading ? null : _submit,
              ),
              const SizedBox(height: CbSpacing.s4),
              CbButton(
                label: 'Return to Sign In',
                variant: CbButtonVariant.ghost,
                fullWidth: true,
                onPressed: () {
                  final query = from != null ? '?from=${Uri.encodeComponent(from)}' : '';
                  context.go('/auth$query');
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
