// Crowdbeats V2 — Consent Screen (Phase 5)
// Step 1 of onboarding. Both checkboxes required.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../firebase/firestore_service.dart';
import '../../state/auth_state.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';

const _consentVersion = '2026-08-25';

class ConsentScreen extends ConsumerStatefulWidget {
  const ConsentScreen({super.key});

  @override
  ConsumerState<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends ConsumerState<ConsentScreen> {
  bool _tos     = false;
  bool _privacy = false;
  bool _age     = false;
  bool _loading = false;
  String? _error;

  Future<void> _proceed() async {
    final uid = ref.read(authStateProvider).uid;
    if (uid == null) return;
    setState(() { _loading = true; _error = null; });
    try {
      await FirestoreService.instance.recordConsent(
        uid: uid, consentVersion: _consentVersion, platform: 'ios',
      );
      if (mounted) context.go('/onboarding/persona');
    } catch (_) {
      setState(() => _error = 'Failed to save consent. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canProceed = _tos && _privacy && _age;
    return Scaffold(
      appBar: AppBar(title: const Text('Before you continue')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(CbSpacing.s6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Please read and agree to the following terms and age eligibility requirements.',
                style: theme.textTheme.bodyMedium?.copyWith(color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s6),

              // ToS card
              _ConsentCard(
                title: 'Terms of Service — v$_consentVersion',
                body: 'Tip transactions are final. Crowdbeats charges a 6% platform fee on tips; Stripe processing fees are additional.',
                checked: _tos,
                label: 'I agree to the Terms of Service',
                onChanged: (v) => setState(() => _tos = v ?? false),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Privacy card
              _ConsentCard(
                title: 'Privacy Policy',
                body: 'Crowdbeats collects email, display name, and optional location data with consent. '
                  'We do not sell personal data. You can request deletion from Account Settings.',
                checked: _privacy,
                label: 'I agree to the Privacy Policy',
                onChanged: (v) => setState(() => _privacy = v ?? false),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Age & Legal Eligibility card
              _ConsentCard(
                title: 'Age Eligibility & Legal Capacity',
                body: 'To send tips, back campaigns, or monetize live stages with Stripe Connect, '
                  'you must be at least 18 years of age (or the age of majority in your jurisdiction).',
                checked: _age,
                label: 'I confirm that I am 18 years of age or older',
                onChanged: (v) => setState(() => _age = v ?? false),
              ),

              if (_error != null) ...[
                const SizedBox(height: CbSpacing.s4),
                Text(_error!, style: const TextStyle(color: CbColors.statusError, fontSize: 13)),
              ],

              const SizedBox(height: CbSpacing.s8),
              FilledButton(
                onPressed: (canProceed && !_loading) ? _proceed : null,
                child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('I agree — continue'),
              ),
              const SizedBox(height: CbSpacing.s3),
              const Text('Consent v$_consentVersion · Both checkboxes required',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: CbColors.textTertiary)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConsentCard extends StatelessWidget {
  final String title, body, label;
  final bool checked;
  final ValueChanged<bool?> onChanged;
  const _ConsentCard({required this.title, required this.body, required this.label, required this.checked, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(CbSpacing.s4),
      decoration: BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
        border: Border.all(color: checked ? CbColors.accentPrimary : CbColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: CbSpacing.s2),
          Text(body, style: const TextStyle(fontSize: 12, color: CbColors.textSecondary, height: 1.5)),
          const SizedBox(height: CbSpacing.s4),
          CheckboxListTile(
            value: checked,
            onChanged: onChanged,
            title: Text(label, style: const TextStyle(fontSize: 13)),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}
