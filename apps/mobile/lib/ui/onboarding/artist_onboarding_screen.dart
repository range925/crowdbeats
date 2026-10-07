// Artist Onboarding
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../ui/theme/cb_spacing.dart';
import '../../ui/theme/cb_colors.dart';
import 'onboarding_helpers.dart';

const _genreList = ['Rock','Pop','Hip-Hop','Jazz','Classical','Electronic','Folk','Country','R&B','Indie','Metal','Other'];

class ArtistOnboardingScreen extends ConsumerStatefulWidget {
  const ArtistOnboardingScreen({super.key});
  @override ConsumerState<ArtistOnboardingScreen> createState() => _ArtistOnboardingState();
}

class _ArtistOnboardingState extends ConsumerState<ArtistOnboardingScreen> {
  final _name      = TextEditingController();
  final _social    = TextEditingController();
  final _selected  = <String>[];
  bool _loading    = false;
  String? _error;

  @override
  void dispose() { _name.dispose(); _social.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => OnboardingFormShell(
    title: 'Artist Profile', icon: '🎤', subtitle: 'Receive tips. Grow your fanbase. Monetise your craft.',
    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (_error != null) ...[
        Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
        const SizedBox(height: 12),
      ],
      TextField(
        controller: _name,
        onChanged: (_) => setState((){}),
        decoration: const InputDecoration(labelText: 'Artist name'),
      ),
      const SizedBox(height: CbSpacing.s5),
      const Text('Genres (up to 3)', style: TextStyle(fontSize: 13, color: CbColors.textSecondary)),
      const SizedBox(height: CbSpacing.s2),
      Wrap(
        spacing: 8,
        runSpacing: 6,
        children: _genreList.map((g) {
          final sel = _selected.contains(g);
          return FilterChip(
            label: Text(g),
            selected: sel,
            onSelected: (_) => setState(() {
              if (sel) {
                _selected.remove(g);
              } else if (_selected.length < 3) {
                _selected.add(g);
              }
            }),
          );
        }).toList(),
      ),
      const SizedBox(height: CbSpacing.s5),
      TextField(
        controller: _social,
        decoration: const InputDecoration(
          labelText: 'Social link (optional)',
          hintText: 'https://instagram.com/...',
        ),
      ),
      const SizedBox(height: CbSpacing.s8),
      FilledButton(
        onPressed: (_loading || _name.text.trim().length < 2) ? null : () async {
          setState(() { _loading = true; _error = null; });
          await completeOnboarding(
            ref: ref,
            context: context,
            personaType: 'artist',
            displayName: _name.text,
            profileData: {
              'genres': _selected,
              'socialLink': _social.text.trim().isEmpty ? null : _social.text.trim(),
            },
            onError: (e) => setState(() { _error = e; _loading = false; }),
          );
          if (mounted) setState(() => _loading = false);
        },
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
        child: _loading
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Text('Create Artist profile'),
      ),
    ]),
  );
}
