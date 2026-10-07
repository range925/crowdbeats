// Crowdbeats V2 — Persona Switcher Bottom Sheet
//
// Allows seamless switching between all active personas (Fan, Musician, Band, Venue, Sponsor).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/auth_state.dart';
import '../../ui/theme/cb_colors.dart';

const _personaInfo = {
  'fan':           (icon: '❤️',  label: 'Fan',     route: '/fan',           description: 'Discover live music & tip artists'),
  'artist':        (icon: '🎤',  label: 'Musician', route: '/artist',        description: 'Live performance dashboard & tips'),
  'band_member':   (icon: '🎸',  label: 'Band',     route: '/band_member',   description: 'Band tip splits & live stages'),
  'venue_manager': (icon: '🏟️', label: 'Venue',    route: '/venue_manager', description: 'Stage management & analytics'),
  'sponsor_rep':   (icon: '💼',  label: 'Sponsor',  route: '/sponsor_rep',   description: 'Campaigns & local promotions'),
};

class PersonaSwitcherSheet extends ConsumerWidget {
  const PersonaSwitcherSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final currentPersona = auth.personaType ?? 'fan';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: Color(0xFF151722),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
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
                const Text(
                  'Switch Persona',
                  style: TextStyle(
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
            const SizedBox(height: 6),
            Text(
              'Switch between fan discovery and creator management dashboards:',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13),
            ),
            const SizedBox(height: 16),

            // Persona List
            ..._personaInfo.entries.map((entry) {
              final key = entry.key;
              final info = entry.value;
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
                                    style: TextStyle(
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
                                      child: const Text(
                                        'ACTIVE',
                                        style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                info.description,
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 12),
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

            const SizedBox(height: 12),
            const Divider(color: Color(0x1AFFFFFF)),
            const SizedBox(height: 8),

            // Sign out tile
            ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.logout, color: Color(0xFFEF4444), size: 20),
              title: const Text('Sign out of all personas', style: TextStyle(color: Color(0xFFEF4444), fontSize: 14, fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.of(context).pop();
                ref.read(authNotifierProvider.notifier).signOut();
              },
            ),
          ],
        ),
      ),
    );
  }
}
