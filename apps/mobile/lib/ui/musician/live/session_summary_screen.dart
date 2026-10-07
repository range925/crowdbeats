// Crowdbeats V2 — Session Summary Screen (Phase 7)
//
// Post-session summary after endSession().
// Shows: total tips, unique tippers, session duration,
//        "Request Payout" CTA (gated by KYC status),
//        recent tip list.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../state/musician_state.dart';
import '../../../firebase/musician_service.dart';
import '../../theme/cb_colors.dart';

class SessionSummaryScreen extends ConsumerStatefulWidget {
  const SessionSummaryScreen({
    super.key,
    required this.totalTipsCents,
    required this.tipCount,
    required this.duration,
    required this.tips,
  });

  final int totalTipsCents;
  final int tipCount;
  final Duration duration;
  final List<LiveTip> tips;

  @override
  ConsumerState<SessionSummaryScreen> createState() => _SessionSummaryScreenState();
}

class _SessionSummaryScreenState extends ConsumerState<SessionSummaryScreen> {
  ConnectStatus? _connectStatus;
  bool _isLoadingKyc = true;
  bool _isRequestingPayout = false;
  String? _payoutError;

  @override
  void initState() {
    super.initState();
    _fetchKycStatus();
  }

  Future<void> _fetchKycStatus() async {
    try {
      final status = await MusicianService.instance.getConnectStatus();
      if (mounted) setState(() { _connectStatus = status; _isLoadingKyc = false; });
    } on Exception {
      if (mounted) setState(() => _isLoadingKyc = false);
    }
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return h > 0 ? '$h:$m:$s' : '$m:$s';
  }

  Future<void> _requestPayout() async {
    if (widget.totalTipsCents < 1000) {
      setState(() => _payoutError = 'Minimum payout is \$10.');
      return;
    }
    setState(() { _isRequestingPayout = true; _payoutError = null; });
    try {
      await MusicianService.instance.requestPayout(
        amountCents: widget.totalTipsCents,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payout of \$${(widget.totalTipsCents / 100).toStringAsFixed(2)} requested!'),
            backgroundColor: CbColors.statusSuccess,
          ),
        );
      }
    } on Exception catch (e) {
      setState(() => _payoutError = e.toString().replaceAll('Exception:', '').trim());
    } finally {
      if (mounted) setState(() => _isRequestingPayout = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canPayout = _connectStatus?.isFullyEnabled ?? false;
    final earningsDollars = (widget.totalTipsCents / 100).toStringAsFixed(2);

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Session Summary'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Celebration emoji
          const Center(
            child: Text('🎉', style: TextStyle(fontSize: 56)),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'Great performance!',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 32),

          // Stats row
          Row(children: [
            _SummaryStat(
              label: 'Earned',
              value: '\$$earningsDollars',
              icon: Icons.attach_money,
              color: CbColors.accentPrimary,
            ),
            const SizedBox(width: 12),
            _SummaryStat(
              label: 'Tips',
              value: '${widget.tipCount}',
              icon: Icons.favorite,
              color: CbColors.accentSecondary,
            ),
            const SizedBox(width: 12),
            _SummaryStat(
              label: 'Duration',
              value: _formatDuration(widget.duration),
              icon: Icons.timer_outlined,
              color: CbColors.statusInfo,
            ),
          ]),
          const SizedBox(height: 32),

          // Payout CTA
          if (_isLoadingKyc)
            const Center(child: CircularProgressIndicator(strokeWidth: 2))
          else if (!canPayout)
            _KycBanner()
          else ...[
            FilledButton(
              onPressed: _isRequestingPayout ? null : _requestPayout,
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              child: _isRequestingPayout
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('Request payout · \$$earningsDollars', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            if (_payoutError != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(_payoutError!, style: const TextStyle(color: CbColors.statusError, fontSize: 13)),
              ),
            const SizedBox(height: 8),
            const Text(
              'Payouts are processed via Stripe Connect.\nMinimum payout: \$10.',
              textAlign: TextAlign.center,
              style: TextStyle(color: CbColors.textTertiary, fontSize: 12),
            ),
          ],
          const SizedBox(height: 32),

          // Tip list
          if (widget.tips.isNotEmpty) ...[
            const Text(
              'Tips this session',
              style: TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5),
            ),
            const SizedBox(height: 8),
            ...widget.tips.map((t) => _SummaryTipRow(tip: t)),
          ],
        ],
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _SummaryStat extends StatelessWidget {
  const _SummaryStat({required this.label, required this.value, required this.icon, required this.color});

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: CbColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withAlpha(40)),
          ),
          child: Column(children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
            Text(label, style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
          ]),
        ),
      );
}

class _KycBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: CbColors.statusWarning.withAlpha(25),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CbColors.statusWarning.withAlpha(80)),
        ),
        child: const Row(children: [
          Icon(Icons.warning_amber_rounded, color: CbColors.statusWarning),
          SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Connect your payout account', style: TextStyle(fontWeight: FontWeight.w700)),
              SizedBox(height: 2),
              Text('Complete identity verification in Profile → Payouts to receive funds.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
            ]),
          ),
        ]),
      );
}

class _SummaryTipRow extends StatelessWidget {
  const _SummaryTipRow({required this.tip});

  final LiveTip tip;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: CbColors.accentPrimary.withAlpha(25), shape: BoxShape.circle),
            child: const Icon(Icons.favorite, size: 14, color: CbColors.accentPrimary),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(tip.isAnonymous ? 'Anonymous' : (tip.displayName ?? 'Fan'), style: const TextStyle(fontWeight: FontWeight.w500))),
          Text('\$${(tip.amountCents / 100).toStringAsFixed(2)}', style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold)),
        ]),
      );
}
