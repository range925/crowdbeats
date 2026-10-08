// Crowdbeats V2 — Persona Picker Screen (Phase 5)
// No STAFF option — server-only.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';
import '../components/onboarding_shared_components.dart';

class PersonaOption {
  final String id;
  final String title;
  final String? badge;
  final String desc;
  final String iconEmoji;
  final Color accentColor;
  final List<String> benefits;

  const PersonaOption({
    required this.id,
    required this.title,
    this.badge,
    required this.desc,
    required this.iconEmoji,
    required this.accentColor,
    required this.benefits,
  });
}

const _personas = [
  PersonaOption(
    id: 'fan',
    title: 'Fan & Listener',
    badge: 'POPULAR',
    desc: 'Discover live street performers, tip local talent, and follow your favorites.',
    iconEmoji: '❤️',
    accentColor: CbColors.brandPrimary,
    benefits: [
      'Instant cashless tipping with verified receipts',
      'Follow solo artists and bands near you',
      'Personalized live music discovery stream',
    ],
  ),
  PersonaOption(
    id: 'artist',
    title: 'Solo Musician',
    badge: 'CREATOR',
    desc: 'Receive direct tips, grow your local fanbase, and broadcast live performance locations.',
    iconEmoji: '🎤',
    accentColor: CbColors.creatorAmber,
    benefits: [
      'Personal stage QR code for immediate tipping',
      '6% transparent tech fee with secure Stripe payouts',
      'Broadcast live street performance pins',
    ],
  ),
  PersonaOption(
    id: 'band',
    title: 'Band / Group',
    badge: 'COLLABORATIVE',
    desc: 'Create a shared band profile, automate tip splits, and manage musician rosters.',
    iconEmoji: '🎸',
    accentColor: CbColors.communityBlue,
    benefits: [
      'Automated multi-member tip splits (exact 100% distribution)',
      'Unified group stage QR code',
      'Member invitation & role-based management',
    ],
  ),
  PersonaOption(
    id: 'venue',
    title: 'Venue / Stage',
    badge: 'PARTNER',
    desc: 'Host shows, manage stages, boost foot traffic, and support local talent.',
    iconEmoji: '🏟️',
    accentColor: CbColors.discoveryCyan,
    benefits: [
      'Official verified stage check-ins',
      'Schedule lineups and attract local crowds',
    ],
  ),
  PersonaOption(
    id: 'sponsor',
    title: 'Sponsor / Brand',
    badge: 'BUSINESS',
    desc: 'Discover grassroots talent, sponsor community shows, and track engagement.',
    iconEmoji: '💼',
    accentColor: CbColors.expressivePink,
    benefits: [
      'Fund grassroots musical activations',
      'Verified performance analytics & brand reach',
    ],
  ),
];

class PersonaPickerScreen extends StatefulWidget {
  const PersonaPickerScreen({super.key});

  @override
  State<PersonaPickerScreen> createState() => _PersonaPickerScreenState();
}

class _PersonaPickerScreenState extends State<PersonaPickerScreen> {
  String? _selected = 'fan';

  @override
  Widget build(BuildContext context) {
    final selectedPersona = _personas.firstWhere(
      (p) => p.id == _selected,
      orElse: () => _personas.first,
    );

    return Scaffold(
      backgroundColor: CbColors.darkCanvas,
      appBar: AppBar(
        title: const Text('Choose your journey'),
        backgroundColor: CbColors.darkCanvas,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'How will you experience Crowdbeats?',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Select the role that best fits your immediate goal. Joining is free for all personas.',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                itemCount: _personas.length,
                itemBuilder: (context, i) {
                  final p = _personas[i];
                  final isSel = _selected == p.id;
                  return RoleCard(
                    roleId: p.id,
                    title: p.title,
                    badge: p.badge,
                    description: p.desc,
                    icon: Text(p.iconEmoji, style: const TextStyle(fontSize: 22)),
                    accentColor: p.accentColor,
                    isSelected: isSel,
                    benefits: p.benefits,
                    onTap: () => setState(() => _selected = p.id),
                  );
                },
              ),
            ),
            StickyActionBar(
              primaryLabel: _selected != null
                  ? 'Continue as ${selectedPersona.title} →'
                  : 'Select a persona to continue',
              primaryDisabled: _selected == null,
              accentColor: selectedPersona.accentColor,
              onPrimary: () {
                if (_selected != null) {
                  context.push('/onboarding/$_selected');
                }
              },
              disclaimer: 'Joining is free. Roles can be expanded later without losing your history.',
            ),
          ],
        ),
      ),
    );
  }
}
