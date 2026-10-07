// Crowdbeats V2 — Musician Live Tab (Phase 7)
//
// The "nerve centre" during a live session.
// Context-aware primary action:
//   - No session → "Check In / Go Live" flow
//   - Active session → live QR + real-time tip stream

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../state/auth_state.dart';
import '../../../state/musician_state.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/permission_education_sheet.dart';
import '../../components/persistent_qr_modal.dart';
import '../live/qr_display_widget.dart';
import '../live/session_active_sheet.dart';

class MusicianLiveTab extends ConsumerStatefulWidget {
  const MusicianLiveTab({super.key});

  @override
  ConsumerState<MusicianLiveTab> createState() => _MusicianLiveTabState();
}

class _MusicianLiveTabState extends ConsumerState<MusicianLiveTab> {
  bool _isStarting = false;

  Future<void> _startStreetSession() async {
    setState(() => _isStarting = true);
    try {
      // Location permission education → OS prompt
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        if (!mounted) return;
        final educated = await PermissionEducationSheet.show(context, permission: CbPermission.location);
        if (!educated || !mounted) { setState(() => _isStarting = false); return; }
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
          if (mounted) setState(() => _isStarting = false);
          return;
        }
      }

      final pos = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
      final auth = ref.read(authStateProvider);

      await ref.read(musicianSessionProvider.notifier).startSession(
        performerName: auth.displayName ?? 'Musician',
        performerType: 'artist',
        locationType: 'street',
        lat: pos.latitude,
        lng: pos.longitude,
      );
    } on Exception catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: CbColors.statusError),
        );
      }
    } finally {
      if (mounted) setState(() => _isStarting = false);
    }
  }

  Future<void> _showSessionOptions() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _StartSessionSheet(onStreet: _startStreetSession),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(musicianSessionProvider);

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      body: SafeArea(
        child: session.isActive
            ? _ActiveSessionView(session: session)
            : _IdleView(isStarting: _isStarting, onGoLive: _showSessionOptions),
      ),
    );
  }
}

// ── Idle (no session) view ────────────────────────────────────────────────────

class _IdleView extends StatelessWidget {
  const _IdleView({required this.isStarting, required this.onGoLive});

  final bool isStarting;
  final VoidCallback onGoLive;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(CbSpacing.s8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  color: CbColors.accentPrimary.withAlpha(20),
                  shape: BoxShape.circle,
                  border: Border.all(color: CbColors.accentPrimary.withAlpha(80), width: 2),
                ),
                child: const Icon(Icons.mic, size: 36, color: CbColors.accentPrimary),
              ),
              const SizedBox(height: CbSpacing.s6),
              Text(
                'Ready to perform?',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: CbSpacing.s3),
              const Text(
                'Start a session so fans nearby can discover and tip you.',
                textAlign: TextAlign.center,
                style: TextStyle(color: CbColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: CbSpacing.s8),
              FilledButton.icon(
                onPressed: isStarting ? null : onGoLive,
                icon: isStarting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.play_arrow),
                label: Text(isStarting ? 'Starting…' : 'Check In / Go Live'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(260, 56),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ],
          ),
        ),
      );
}

// ── Active session view ───────────────────────────────────────────────────────

class _ActiveSessionView extends ConsumerWidget {
  const _ActiveSessionView({required this.session});

  final MusicianSessionState session;

  @override
  Widget build(BuildContext context, WidgetRef ref) => Column(
        children: [
          // Top bar
          Padding(
            padding: const EdgeInsets.all(CbSpacing.s4),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: CbColors.statusLive,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, size: 8, color: Colors.white),
                    SizedBox(width: 6),
                    Text('LIVE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
                  ],
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () {
                  final auth = ref.read(authStateProvider);
                  PersistentQrModal.show(
                    context,
                    performerId: auth.uid ?? 'musician',
                    performerName: auth.displayName ?? 'Musician',
                  );
                },
                icon: const Icon(Icons.qr_code, size: 16, color: CbColors.purpleLight),
                label: const Text('Permanent QR', style: TextStyle(color: CbColors.purpleLight)),
              ),
              const SizedBox(width: 4),
              TextButton.icon(
                onPressed: () => showSessionActiveSheet(context),
                icon: const Icon(Icons.open_in_full, size: 16, color: CbColors.textSecondary),
                label: const Text('Expand', style: TextStyle(color: CbColors.textSecondary)),
              ),
            ]),
          ),

          // QR (90s dynamic rotating code)
          const Expanded(
            flex: 5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  QrDisplayWidget(size: 220),
                  SizedBox(height: 8),
                  Text(
                    '90s Dynamic Live Stage QR · Anti-Tamper',
                    style: TextStyle(color: CbColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),

          // Stats
          Padding(
            padding: const EdgeInsets.all(CbSpacing.s5),
            child: Row(children: [
              _LiveStat(label: 'Earned', value: '\$${(session.totalTipsCents / 100).toStringAsFixed(2)}'),
              Container(width: 1, height: 40, color: CbColors.borderSubtle),
              _LiveStat(label: 'Tips', value: '${session.liveTips.length}'),
            ]),
          ),

          // Recent tips list
          Expanded(
            flex: 4,
            child: session.liveTips.isEmpty
                ? const Center(child: Text('Waiting for tips…', style: TextStyle(color: CbColors.textTertiary)))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5),
                    itemCount: session.liveTips.length.clamp(0, 10),
                    separatorBuilder: (_, _) => const Divider(height: 1, color: CbColors.borderSubtle),
                    itemBuilder: (_, i) {
                      final tip = session.liveTips[i];
                      return ListTile(
                        leading: const Icon(Icons.favorite, color: CbColors.accentPrimary, size: 18),
                        title: Text(tip.isAnonymous ? 'Anonymous' : (tip.displayName ?? 'Fan')),
                        subtitle: tip.message != null ? Text(tip.message!, maxLines: 1, overflow: TextOverflow.ellipsis) : null,
                        trailing: Text('\$${(tip.amountCents / 100).toStringAsFixed(2)}', style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold)),
                        dense: true,
                      );
                    },
                  ),
          ),
          const SizedBox(height: 80),
        ],
      );
}

class _LiveStat extends StatelessWidget {
  const _LiveStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(children: [
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: CbColors.textPrimary)),
          Text(label, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
        ]),
      );
}

// ── Start session bottom sheet ─────────────────────────────────────────────────

class _StartSessionSheet extends StatelessWidget {
  const _StartSessionSheet({required this.onStreet});

  final VoidCallback onStreet;

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1C1C1F),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.fromLTRB(
          CbSpacing.s6, CbSpacing.s4, CbSpacing.s6,
          MediaQuery.of(context).viewInsets.bottom + CbSpacing.s6,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(color: CbColors.borderSubtle, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: CbSpacing.s5),
            Text('Start a session', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: CbSpacing.s3),
            const Text('Choose your session type:', style: TextStyle(color: CbColors.textSecondary)),
            const SizedBox(height: CbSpacing.s5),

            _SessionTypeCard(
              icon: '📍',
              title: 'Street / Festival',
              subtitle: 'Play anywhere — we\'ll use your current GPS location.',
              onTap: () {
                Navigator.pop(context);
                onStreet();
              },
            ),
            const SizedBox(height: CbSpacing.s3),
            _SessionTypeCard(
              icon: '🏛️',
              title: 'Venue stage (coming soon)',
              subtitle: 'Linked to a registered venue. Set up via your venue manager.',
              isDisabled: true,
              onTap: () {},
            ),
            const SizedBox(height: CbSpacing.s4),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        ),
      );
}

class _SessionTypeCard extends StatelessWidget {
  const _SessionTypeCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.isDisabled = false,
  });

  final String icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: isDisabled ? null : onTap,
        child: AnimatedOpacity(
          opacity: isDisabled ? 0.4 : 1.0,
          duration: const Duration(milliseconds: 150),
          child: Container(
            padding: const EdgeInsets.all(CbSpacing.s4),
            decoration: BoxDecoration(
              color: CbColors.surfaceCard,
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: CbColors.borderSubtle),
            ),
            child: Row(children: [
              Text(icon, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: CbSpacing.s4),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text(subtitle, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12, height: 1.4)),
                ]),
              ),
              if (!isDisabled) const Icon(Icons.chevron_right, color: CbColors.textTertiary),
            ]),
          ),
        ),
      );
}
