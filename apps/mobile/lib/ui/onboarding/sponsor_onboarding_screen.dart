// Sponsor Onboarding
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../ui/theme/cb_spacing.dart';
import 'onboarding_helpers.dart';

class SponsorOnboardingScreen extends ConsumerStatefulWidget {
  const SponsorOnboardingScreen({super.key});
  @override ConsumerState<SponsorOnboardingScreen> createState() => _State();
}

class _State extends ConsumerState<SponsorOnboardingScreen> {
  final _name    = TextEditingController();
  final _orgName = TextEditingController();
  String _industry = '';
  bool _loading = false;
  String? _error;

  static const _industries = [
    'Music & Entertainment','Beverages & Food','Technology','Fashion & Apparel',
    'Health & Wellness','Finance','Automotive','Media & Publishing','Other',
  ];

  @override void dispose() { _name.dispose(); _orgName.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final valid = _name.text.trim().length >= 2 && _orgName.text.trim().length >= 2;
    return OnboardingFormShell(
      title: 'Sponsor Profile', icon: '💼', subtitle: 'Discover artists. Sponsor shows. Measure impact.',
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (_error != null) ...[Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)), const SizedBox(height: 12)],
        TextField(controller: _name, onChanged: (_) => setState((){}), decoration: const InputDecoration(labelText: 'Your name')),
        const SizedBox(height: CbSpacing.s4),
        TextField(controller: _orgName, onChanged: (_) => setState((){}), decoration: const InputDecoration(labelText: 'Organisation / brand name')),
        const SizedBox(height: CbSpacing.s4),
        DropdownButtonFormField<String>(
          initialValue: _industry.isEmpty ? null : _industry,
          decoration: const InputDecoration(labelText: 'Industry (optional)'),
          items: _industries.map((i) => DropdownMenuItem(value: i, child: Text(i))).toList(),
          onChanged: (v) => setState(() => _industry = v ?? ''),
        ),
        const SizedBox(height: CbSpacing.s8),
        FilledButton(
          onPressed: (_loading || !valid) ? null : () async {
            setState(() { _loading = true; _error = null; });
            await completeOnboarding(ref: ref, context: context, personaType: 'sponsor_rep', displayName: _name.text,
              profileData: {'orgName': _orgName.text.trim(), 'industry': _industry, 'sponsorRole': 'SPONSOR_REP'},
              onError: (e) => setState(() { _error = e; _loading = false; }));
            if (mounted) setState(() => _loading = false);
          },
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          child: _loading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Create Sponsor profile'),
        ),
      ]),
    );
  }
}
