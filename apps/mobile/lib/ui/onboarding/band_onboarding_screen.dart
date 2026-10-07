// Band Onboarding
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../ui/theme/cb_spacing.dart';
import 'onboarding_helpers.dart';

class BandOnboardingScreen extends ConsumerStatefulWidget {
  const BandOnboardingScreen({super.key});
  @override ConsumerState<BandOnboardingScreen> createState() => _State();
}

class _State extends ConsumerState<BandOnboardingScreen> {
  final _name     = TextEditingController();
  final _bandName = TextEditingController();
  bool _loading = false;
  String? _error;
  @override void dispose() { _name.dispose(); _bandName.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => OnboardingFormShell(
    title: 'Band Profile', icon: '🎸', subtitle: 'You\'ll be Band Founder. Invite members after setup.',
    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (_error != null) ...[Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)), const SizedBox(height: 12)],
      TextField(controller: _name, decoration: const InputDecoration(labelText: 'Your name (as band member)')),
      const SizedBox(height: CbSpacing.s4),
      TextField(controller: _bandName, decoration: const InputDecoration(labelText: 'Band / Group name', helperText: 'You\'ll be assigned the Band Founder role.')),
      const SizedBox(height: CbSpacing.s8),
      FilledButton(
        onPressed: (_loading || _name.text.trim().length < 2 || _bandName.text.trim().length < 2) ? null : () async {
          setState(() { _loading = true; _error = null; });
          await completeOnboarding(ref: ref, context: context, personaType: 'band_member', displayName: _name.text,
            profileData: {'bandName': _bandName.text.trim(), 'bandRole': 'BAND_FOUNDER'},
            onError: (e) => setState(() { _error = e; _loading = false; }));
          if (mounted) setState(() => _loading = false);
        },
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
        child: _loading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Create Band profile'),
      ),
    ]),
  );
}
