// Crowdbeats V2 — Tip Result Screen (Phase 6)
//
// Shows real-time tip status after Stripe PaymentSheet.
// Listens to tips/{tipId} Firestore doc for webhook-confirmed status.
// States: polling → succeeded | failed
// Offline banner shown when Firestore stream has no data for >5s.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../theme/cb_colors.dart';
import '../../../state/tip_state.dart';

class TipResultScreen extends ConsumerStatefulWidget {
  const TipResultScreen({super.key});

  @override
  ConsumerState<TipResultScreen> createState() => _TipResultScreenState();
}

class _TipResultScreenState extends ConsumerState<TipResultScreen> {
  Timer? _offlineTimer;
  bool _showOfflineBanner = false;

  @override
  void initState() {
    super.initState();
    // If still polling after 5s show offline banner
    _offlineTimer = Timer(const Duration(seconds: 5), () {
      if (mounted &&
          ref.read(tipFlowProvider).status == TipFlowStatus.polling) {
        setState(() => _showOfflineBanner = true);
      }
    });
  }

  @override
  void dispose() {
    _offlineTimer?.cancel();
    super.dispose();
  }

  String _formatCents(int cents) {
    final d = cents ~/ 100;
    final c = cents % 100;
    return '\$$d.${c.toString().padLeft(2, '0')}';
  }

  void _shareReceipt(ActiveTipState state) {
    final name = state.recipientName ?? 'the artist';
    final amount = _formatCents(state.amountCents ?? 0);
    SharePlus.instance.share(
      ShareParams(
        text:
            'I just tipped $name $amount on Crowdbeats! 🎶 crowdbeats.app',
      ),
    );
  }

  void _goHome() {
    ref.read(tipFlowProvider.notifier).reset();
    // Pop all the way back to FanShell
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tipFlowProvider);

    return PopScope(
      canPop: state.status != TipFlowStatus.polling,
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_showOfflineBanner &&
                    state.status == TipFlowStatus.polling)
                  _OfflineBanner(
                    onDismiss: () =>
                        setState(() => _showOfflineBanner = false),
                  ),
                const Spacer(),
                _StatusIcon(status: state.status),
                const SizedBox(height: 24),
                _StatusTitle(status: state.status, state: state),
                const SizedBox(height: 12),
                if (state.status == TipFlowStatus.succeeded) ...[
                  _ReceiptSummary(state: state, formatCents: _formatCents),
                  const SizedBox(height: 32),
                  OutlinedButton.icon(
                    onPressed: () => _shareReceipt(state),
                    icon: const Icon(Icons.share_outlined),
                    label: const Text('Share receipt'),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _goHome,
                    child: const Text('Back to Home'),
                  ),
                ],
                if (state.status == TipFlowStatus.failed) ...[
                  if (state.errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        state.errorMessage!,
                        style: const TextStyle(color: CbColors.statusError),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  FilledButton(
                    onPressed: () {
                      ref.read(tipFlowProvider.notifier).retry();
                      Navigator.of(context).pop();
                    },
                    child: const Text('Try Again'),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () {
                      ref.read(tipFlowProvider.notifier).reset();
                      Navigator.of(context).popUntil((r) => r.isFirst);
                    },
                    child: const Text('Cancel'),
                  ),
                ],
                if (state.status == TipFlowStatus.polling)
                  Column(
                    children: [
                      const CircularProgressIndicator(),
                      const SizedBox(height: 16),
                      Text(
                        'Confirming payment…',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'This usually takes just a moment.',
                        style: TextStyle(
                            fontSize: 12, color: Colors.white54),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StatusIcon extends StatelessWidget {
  const _StatusIcon({required this.status});
  final TipFlowStatus status;

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case TipFlowStatus.succeeded:
        return const Icon(Icons.check_circle,
            color: Colors.greenAccent, size: 80);
      case TipFlowStatus.failed:
        return const Icon(Icons.error_outline, color: CbColors.statusError, size: 80);
      case TipFlowStatus.polling:
        return const SizedBox.shrink();
      default:
        return const SizedBox.shrink();
    }
  }
}

class _StatusTitle extends StatelessWidget {
  const _StatusTitle({required this.status, required this.state});
  final TipFlowStatus status;
  final ActiveTipState state;

  @override
  Widget build(BuildContext context) {
    String title;
    switch (status) {
      case TipFlowStatus.succeeded:
        title = 'Tip sent! 🎉';
        break;
      case TipFlowStatus.failed:
        title = 'Payment failed';
        break;
      case TipFlowStatus.polling:
        title = 'Processing…';
        break;
      default:
        return const SizedBox.shrink();
    }
    return Text(
      title,
      style: Theme.of(context).textTheme.headlineMedium,
      textAlign: TextAlign.center,
    );
  }
}

class _ReceiptSummary extends StatelessWidget {
  const _ReceiptSummary({required this.state, required this.formatCents});
  final ActiveTipState state;
  final String Function(int) formatCents;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(20),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          if (state.recipientName != null)
            _Row('Artist', state.recipientName!),
          if (state.amountCents != null)
            _Row('Amount', formatCents(state.amountCents!)),
          if (state.netAmountCents != null)
            _Row(
              'Creator received',
              formatCents(state.netAmountCents!),
              bold: true,
              accent: true,
            ),
          if (state.tipId != null)
            _Row(
              'Receipt ID',
              state.tipId!.length > 12
                  ? '…${state.tipId!.substring(state.tipId!.length - 8)}'
                  : state.tipId!,
              mono: true,
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value,
      {this.bold = false, this.accent = false, this.mono = false});
  final String label;
  final String value;
  final bool bold;
  final bool accent;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white54)),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              color: accent ? CbColors.accentPrimary : null,
              fontFamily: mono ? 'monospace' : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner({required this.onDismiss});
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.orange.withAlpha(30),
        border: Border.all(color: Colors.orange.withAlpha(80)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.wifi_off, size: 16, color: Colors.orange),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'No connection — will confirm when reconnected.',
              style: TextStyle(color: Colors.orange, fontSize: 12),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 16),
            onPressed: onDismiss,
            color: Colors.orange,
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}
