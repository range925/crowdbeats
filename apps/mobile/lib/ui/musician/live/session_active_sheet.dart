// Crowdbeats V2 — Session Active Sheet (Phase 7)
//
// Full-screen bottom sheet overlay during a live session.
// Shows: QR display, tip counter, tip feed, duration timer, End Session.
// Opened from the Go Live FAB or the Live tab.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../state/musician_state.dart';
import '../../theme/cb_colors.dart';
import '../live/qr_display_widget.dart';

/// Shows the session overlay as a full-screen modal bottom sheet.
Future<void> showSessionActiveSheet(BuildContext context) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    isDismissible: false,
    enableDrag: false,
    backgroundColor: Colors.transparent,
    builder: (_) => const _SessionActiveSheet(),
  );
}

class _SessionActiveSheet extends ConsumerStatefulWidget {
  const _SessionActiveSheet();

  @override
  ConsumerState<_SessionActiveSheet> createState() => _SessionActiveSheetState();
}

class _SessionActiveSheetState extends ConsumerState<_SessionActiveSheet> {
  Timer? _durationTimer;
  Duration _elapsed = Duration.zero;

  @override
  void initState() {
    super.initState();
    final session = ref.read(musicianSessionProvider);
    if (session.sessionStartedAt != null) {
      _elapsed = DateTime.now().difference(session.sessionStartedAt!);
    }
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        final session = ref.read(musicianSessionProvider);
        _elapsed = session.sessionStartedAt != null
            ? DateTime.now().difference(session.sessionStartedAt!)
            : _elapsed + const Duration(seconds: 1);
      });
    });
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return h > 0 ? '$h:$m:$s' : '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(musicianSessionProvider);
    final isEnding = session.status == MusicianSessionStatus.ending;

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      minChildSize: 0.85,
      maxChildSize: 1,
      expand: false,
      builder: (ctx, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF131315),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 40),
          children: [
            // Handle
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: CbColors.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Live badge + duration
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
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
                const SizedBox(width: 12),
                Text(
                  _formatDuration(_elapsed),
                  style: const TextStyle(
                    color: CbColors.textSecondary,
                    fontSize: 15,
                    fontVariations: [FontVariation('wght', 600)],
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // QR
            const Center(child: QrDisplayWidget(size: 220)),
            const SizedBox(height: 8),
            const Center(
              child: Text(
                'Fan scans to tip you',
                style: TextStyle(color: CbColors.textTertiary, fontSize: 13),
              ),
            ),
            const SizedBox(height: 32),

            // Tip summary
            Row(children: [
              _StatCard(
                label: 'Tips received',
                value: '\$${(session.totalTipsCents / 100).toStringAsFixed(2)}',
                color: CbColors.accentPrimary,
              ),
              const SizedBox(width: 12),
              _StatCard(
                label: 'Tippers',
                value: '${session.uniqueTippers}',
                color: CbColors.accentSecondary,
              ),
            ]),
            const SizedBox(height: 24),

            // Live tip feed
            if (session.liveTips.isNotEmpty) ...[
              const Text(
                'Recent tips',
                style: TextStyle(
                  color: CbColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              ...session.liveTips.take(10).map((t) => _TipRow(tip: t)),
              const SizedBox(height: 24),
            ],

            // End session button
            FilledButton(
              onPressed: isEnding ? null : () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    backgroundColor: CbColors.surfaceCard,
                    title: const Text('End session?'),
                    content: const Text('Your QR will stop working and the session will be closed.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep going')),
                      FilledButton(
                        onPressed: () => Navigator.pop(context, true),
                        style: FilledButton.styleFrom(backgroundColor: CbColors.statusError),
                        child: const Text('End session'),
                      ),
                    ],
                  ),
                );
                if (confirmed == true && context.mounted) {
                  await ref.read(musicianSessionProvider.notifier).endSession();
                  if (context.mounted) Navigator.pop(context);
                }
              },
              style: FilledButton.styleFrom(
                backgroundColor: CbColors.statusError,
                minimumSize: const Size.fromHeight(52),
              ),
              child: isEnding
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('End session', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: CbColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withAlpha(40)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
              const SizedBox(height: 2),
              Text(label, style: const TextStyle(fontSize: 12, color: CbColors.textSecondary)),
            ],
          ),
        ),
      );
}

class _TipRow extends StatelessWidget {
  const _TipRow({required this.tip});

  final LiveTip tip;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: CbColors.accentPrimary.withAlpha(25),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.favorite, size: 16, color: CbColors.accentPrimary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tip.isAnonymous ? 'Anonymous' : (tip.displayName ?? 'Fan'),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (tip.message != null)
                  Text(tip.message!, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Text(
            '\$${(tip.amountCents / 100).toStringAsFixed(2)}',
            style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold),
          ),
        ]),
      );
}
