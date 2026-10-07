// Crowdbeats V2 — Persona Picker Screen (Phase 5)
// No STAFF option — server-only.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';

const _personas = [
  (id: 'fan',           icon: '❤️',  title: 'Fan',          desc: 'Discover artists, send tips, follow shows.'),
  (id: 'artist',        icon: '🎤',  title: 'Artist (Solo)', desc: 'Receive tips, manage profile, grow fanbase.'),
  (id: 'band',          icon: '🎸',  title: 'Band / Group',  desc: 'Create a band, split tips, manage members.'),
  (id: 'venue',         icon: '🏟️', title: 'Venue',         desc: 'Host shows, manage stages, support artists.'),
  (id: 'sponsor',       icon: '💼',  title: 'Sponsor / Brand', desc: 'Discover talent, sponsor shows, track ROI.'),
];

class PersonaPickerScreen extends StatefulWidget {
  const PersonaPickerScreen({super.key});

  @override
  State<PersonaPickerScreen> createState() => _PersonaPickerScreenState();
}

class _PersonaPickerScreenState extends State<PersonaPickerScreen> {
  String? _selected;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose your role')),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(CbSpacing.s5),
                itemCount: _personas.length,
                separatorBuilder: (_, _) => const SizedBox(height: CbSpacing.s3),
                itemBuilder: (context, i) {
                  final p = _personas[i];
                  final sel = _selected == p.id;
                  return InkWell(
                    onTap: () => setState(() => _selected = p.id),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    child: Container(
                      padding: const EdgeInsets.all(CbSpacing.s4),
                      decoration: BoxDecoration(
                        color: sel ? CbColors.accentPrimary.withAlpha(20) : CbColors.surfaceCard,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                        border: Border.all(
                          color: sel ? CbColors.accentPrimary : CbColors.borderSubtle,
                          width: sel ? 2 : 1,
                        ),
                      ),
                      child: Row(children: [
                        Container(
                          width: 48, height: 48,
                          decoration: BoxDecoration(
                            color: CbColors.surfaceRaised,
                            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                          ),
                          child: Center(child: Text(p.icon, style: const TextStyle(fontSize: 24))),
                        ),
                        const SizedBox(width: CbSpacing.s4),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                            const SizedBox(height: 2),
                            Text(p.desc, style: const TextStyle(fontSize: 12, color: CbColors.textSecondary, height: 1.4)),
                          ],
                        )),
                        if (sel) const Icon(Icons.check_circle, color: CbColors.accentPrimary),
                      ]),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(CbSpacing.s5),
              child: FilledButton(
                onPressed: _selected == null ? null : () => context.push('/onboarding/$_selected'),
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                child: const Text('Continue →'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
