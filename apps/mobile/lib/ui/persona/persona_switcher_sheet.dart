// Crowdbeats V2 — Persona Switcher Bottom Sheet
//
// Role-gated context switcher adhering to persona permission boundaries:
// Fans only see Fan persona + creator onboarding pathway (cannot switch to unauthorized creator roles).
// Creators can switch between Solo Musician, Band, and Fan modes.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../state/auth_state.dart';
import '../../ui/theme/cb_colors.dart';

const _allPersonaInfo = {
  'fan':           (icon: '❤️',  label: 'Fan',     route: '/fan',           description: 'Discover live music & tip artists'),
  'artist':        (icon: '🎤',  label: 'Solo Musician', route: '/artist',        description: 'Live performance dashboard & tips'),
  'band_member':   (icon: '🎸',  label: 'Band Member',     route: '/band_member',   description: 'Band tip splits & live stages'),
  'venue_manager': (icon: '🏟️', label: 'Venue Manager',    route: '/venue_manager', description: 'Stage management & analytics'),
  'sponsor_rep':   (icon: '💼',  label: 'Sponsor',  route: '/sponsor_rep',   description: 'Campaigns & local promotions'),
};

class PersonaSwitcherSheet extends ConsumerWidget {
  const PersonaSwitcherSheet({super.key});

  List<String> _getPermittedPersonas(String current) {
    if (current == 'artist' || current == 'band_member') {
      return const ['artist', 'band_member', 'fan'];
    } else if (current == 'sponsor_rep') {
      return const ['sponsor_rep', 'fan'];
    } else if (current == 'venue_manager') {
      return const ['venue_manager', 'fan'];
    } else if (current == 'admin') {
      return const ['fan', 'artist', 'band_member', 'venue_manager', 'sponsor_rep'];
    }
    // Fan default: only permitted in Fan persona
    return const ['fan'];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final currentPersona = auth.personaType ?? 'fan';
    final permittedKeys = _getPermittedPersonas(currentPersona);

    return Material(
      color: const Color(0xFF151722),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Switch Persona',
                  style: GoogleFonts.dmSans(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              currentPersona == 'fan'
                  ? 'Your active identity on Crowdbeats:'
                  : 'Switch between authorized creator and discovery roles:',
              style: GoogleFonts.dmSans(color: Colors.white.withValues(alpha: 0.6), fontSize: 13),
            ),
            const SizedBox(height: 16),

            // Permitted Persona List
            ...permittedKeys.map((key) {
              final info = _allPersonaInfo[key]!;
              final isActive = key == currentPersona;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  onTap: () {
                    Navigator.of(context).pop();
                    if (!isActive) {
                      context.go(info.route);
                    }
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isActive ? const Color(0x228B5CF6) : const Color(0xFF1A1D28),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isActive ? CbColors.purpleMain : const Color(0x1AFFFFFF),
                        width: isActive ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(info.icon, style: const TextStyle(fontSize: 26)),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    info.label,
                                    style: GoogleFonts.dmSans(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                                    ),
                                  ),
                                  if (isActive) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: CbColors.purpleMain,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'ACTIVE',
                                        style: GoogleFonts.dmSans(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                info.description,
                                style: GoogleFonts.dmSans(
                                  color: Colors.white.withValues(alpha: 0.55),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          isActive ? Icons.check_circle : Icons.chevron_right,
                          color: isActive ? CbColors.purpleLight : Colors.white38,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),

            // If Fan only: show creator onboarding registration card
            if (currentPersona == 'fan') ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1D28),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0x1AFFFFFF)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.music_note, color: CbColors.purpleLight, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Perform or Sponsor Live Music',
                          style: GoogleFonts.dmSans(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Ready to broadcast live stages, accept tips, or manage band splits? Set up your Creator profile.',
                      style: GoogleFonts.dmSans(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 12,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: CbColors.purpleLight,
                              side: const BorderSide(color: CbColors.purpleLight),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () {
                              Navigator.of(context).pop();
                              context.push('/onboarding/artist');
                            },
                            child: Text(
                              'Solo Musician',
                              style: GoogleFonts.dmSans(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: CbColors.tealGas,
                              side: const BorderSide(color: CbColors.tealGas),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () {
                              Navigator.of(context).pop();
                              context.push('/onboarding/band');
                            },
                            child: Text(
                              'Band Profile',
                              style: GoogleFonts.dmSans(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 12),
            const Divider(color: Color(0x1AFFFFFF)),
            const SizedBox(height: 8),

            // Sign out tile
            ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.logout, color: Color(0xFFEF4444), size: 20),
              title: Text(
                'Sign out of account',
                style: GoogleFonts.dmSans(
                  color: const Color(0xFFEF4444),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () {
                Navigator.of(context).pop();
                ref.read(authNotifierProvider.notifier).signOut();
              },
            ),
          ],
        ),
      ),
    ),
  );
}
}
