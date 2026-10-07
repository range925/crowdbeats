// Crowdbeats V2 — Forgot Password Screen (Phase 5)
// Enumeration-resistant: always shows success message.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../firebase/auth_service.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _email  = TextEditingController();
  bool _loading = false;
  bool _sent    = false;

  @override
  void dispose() { _email.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() => _loading = true);
    await AuthService.instance.requestPasswordReset(_email.text.trim());
    if (mounted) setState(() { _loading = false; _sent = true; });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(CbSpacing.s6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Enter the email address associated with your account.',
                style: theme.textTheme.bodyMedium?.copyWith(color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s6),
              if (_sent) ...[
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s4),
                  decoration: BoxDecoration(
                    color: CbColors.statusSuccess.withAlpha(30),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    border: Border.all(color: CbColors.statusSuccess.withAlpha(80)),
                  ),
                  child: const Text(
                    "If this email is registered, you'll receive a reset link shortly. Check your spam folder.",
                    style: TextStyle(fontSize: 14),
                  ),
                ),
              ] else ...[
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(labelText: 'Email address'),
                ),
                const SizedBox(height: CbSpacing.s6),
                FilledButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Send reset link'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
