// Venue Onboarding
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../ui/theme/cb_spacing.dart';
import 'onboarding_helpers.dart';

class VenueOnboardingScreen extends ConsumerStatefulWidget {
  const VenueOnboardingScreen({super.key});
  @override ConsumerState<VenueOnboardingScreen> createState() => _State();
}

class _State extends ConsumerState<VenueOnboardingScreen> {
  final _name      = TextEditingController();
  final _venueName = TextEditingController();
  final _city      = TextEditingController();
  final _country   = TextEditingController();
  bool _loading = false;
  String? _error;
  @override void dispose() { _name.dispose(); _venueName.dispose(); _city.dispose(); _country.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final valid = _name.text.trim().length >= 2 && _venueName.text.trim().length >= 2 && _city.text.trim().isNotEmpty;
    return OnboardingFormShell(
      title: 'Venue Profile', icon: '🏟️', subtitle: 'Host shows. Manage stages. Support live music.',
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (_error != null) ...[Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)), const SizedBox(height: 12)],
        TextField(controller: _name, onChanged: (_) => setState((){}), decoration: const InputDecoration(labelText: 'Your name (venue manager)')),
        const SizedBox(height: CbSpacing.s4),
        TextField(controller: _venueName, onChanged: (_) => setState((){}), decoration: const InputDecoration(labelText: 'Venue name')),
        const SizedBox(height: CbSpacing.s4),
        Row(children: [
          Expanded(child: TextField(controller: _city, onChanged: (_) => setState((){}), decoration: const InputDecoration(labelText: 'City'))),
          const SizedBox(width: 12),
          Expanded(child: TextField(controller: _country, decoration: const InputDecoration(labelText: 'Country'))),
        ]),
        const SizedBox(height: CbSpacing.s8),
        FilledButton(
          onPressed: (_loading || !valid) ? null : () async {
            setState(() { _loading = true; _error = null; });
            await completeOnboarding(ref: ref, context: context, personaType: 'venue_manager', displayName: _name.text,
              profileData: {'venueName': _venueName.text.trim(), 'city': _city.text.trim(), 'country': _country.text.trim(), 'venueRole': 'VENUE_OWNER'},
              onError: (e) => setState(() { _error = e; _loading = false; }));
            if (mounted) setState(() => _loading = false);
          },
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          child: _loading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Create Venue profile'),
        ),
      ]),
    );
  }
}
