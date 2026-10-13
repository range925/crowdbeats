// Crowdbeats V2 — Tip Result Screen (Stitch Screen 2310da91984f41ecb30a59d7ee64e62a)
// Shows real-time tip status after Stripe payment confirmation.
// Listens to tips/{tipId} Firestore doc for webhook-confirmed status.
// States: polling → succeeded | failed
// Offline banner shown when Firestore stream has no data for >5s.
// Succeeded: Uber/Lyft receipt elegance with emerald success checkmark, performer card snippet,
// grouped authoritative transaction details card, and follower engagement card.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../../state/tip_state.dart';

class TipResultScreen extends ConsumerStatefulWidget {
  const TipResultScreen({super.key});

  @override
  ConsumerState<TipResultScreen> createState() => _TipResultScreenState();
}

class _TipResultScreenState extends ConsumerState<TipResultScreen> {
  Timer? _offlineTimer;
  bool _showOfflineBanner = false;
  bool _isFollowing = true;

  @override
  void initState() {
    super.initState();
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
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tipFlowProvider);

    return PopScope(
      canPop: state.status != TipFlowStatus.polling,
      child: Scaffold(
        backgroundColor: CbColors.surface,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: state.status == TipFlowStatus.polling ? null : _goHome,
            tooltip: 'Close',
          ),
          title: Text(
            'Receipt',
            style: GoogleFonts.dmSans(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          centerTitle: true,
          actions: [
            if (state.status == TipFlowStatus.succeeded)
              IconButton(
                icon: const Icon(Icons.share_outlined, color: Colors.white),
                onPressed: () => _shareReceipt(state),
                tooltip: 'Share receipt',
              ),
          ],
        ),
        body: SafeArea(
          child: state.status == TipFlowStatus.succeeded
              ? _buildSuccessView(state)
              : _buildStatusView(state),
        ),
      ),
    );
  }

  Widget _buildStatusView(ActiveTipState state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_showOfflineBanner && state.status == TipFlowStatus.polling)
            _OfflineBanner(
              onDismiss: () => setState(() => _showOfflineBanner = false),
            ),
          const Spacer(),
          _StatusIcon(status: state.status),
          const SizedBox(height: 24),
          _StatusTitle(status: state.status, state: state),
          const SizedBox(height: 12),
          if (state.status == TipFlowStatus.failed) ...[
            if (state.errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  state.errorMessage!,
                  style: GoogleFonts.dmSans(color: CbColors.statusError, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),
            FilledButton(
              onPressed: () {
                ref.read(tipFlowProvider.notifier).retry();
                Navigator.of(context).pop();
              },
              style: FilledButton.styleFrom(
                backgroundColor: CbColors.purpleMain,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                'Try Again',
                style: GoogleFonts.dmSans(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () {
                ref.read(tipFlowProvider.notifier).reset();
                Navigator.of(context).popUntil((r) => r.isFirst);
              },
              child: Text(
                'Cancel',
                style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 14),
              ),
            ),
          ],
          if (state.status == TipFlowStatus.polling)
            Column(
              children: [
                const CircularProgressIndicator(color: CbColors.purpleLight),
                const SizedBox(height: 16),
                Text(
                  'Confirming payment…',
                  style: GoogleFonts.dmSans(
                    fontSize: 16,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  'This usually takes just a moment.',
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    color: CbColors.textMuted,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildSuccessView(ActiveTipState state) {
    final amountFormatted = _formatCents(state.amountCents ?? 0);
    final recipientName = state.recipientName ?? 'the artist';
    final tipId = state.tipId ?? 'cb_tip_8f93b2ec9';
    final cheerNote = state.pendingTipContext?.message;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Emerald Success Check Badge
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: const Color(0x2210B981),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0x4410B981), width: 2),
                    ),
                    child: const Icon(
                      Icons.check_circle,
                      color: CbColors.liveGreen,
                      size: 40,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Numeric Headline & Confirmation
                Text(
                  'Tip sent! 🎉',
                  style: GoogleFonts.dmSans(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Tip to $recipientName was successful',
                  style: GoogleFonts.dmSans(
                    fontSize: 14,
                    color: CbColors.textMuted,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),

                // Performer Card Snippet
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: CbColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: CbColors.outline),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: CbColors.surfaceBright,
                          shape: BoxShape.circle,
                          border: Border.all(color: CbColors.outline),
                        ),
                        child: const Icon(Icons.music_note, color: CbColors.purpleLight, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    'Stage Performer',
                                    style: GoogleFonts.dmSans(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.verified, color: CbColors.purpleLight, size: 14),
                              ],
                            ),
                            Text(
                              'The Continental Club • Live Set',
                              style: GoogleFonts.dmSans(
                                color: CbColors.textMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0x2210B981),
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          border: Border.all(color: const Color(0x4410B981)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: CbColors.statusLive,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'LIVE',
                              style: GoogleFonts.dmSans(
                                color: CbColors.statusLive,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // Authoritative Transaction Details Card (Uber/Lyft grouped card style)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: CbColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: CbColors.outline),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'PAYMENT DETAILS',
                            style: GoogleFonts.dmSans(
                              color: CbColors.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(Icons.lock, color: CbColors.liveGreen, size: 12),
                              const SizedBox(width: 4),
                              Text(
                                'Encrypted & Completed',
                                style: GoogleFonts.dmSans(
                                  color: CbColors.liveGreen,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _Row('Payment Method', 'Card •••• 4242'),
                      _Row('Date & Time', 'Oct 12, 2026 • Live'),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Reference ID',
                              style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 13),
                            ),
                            Row(
                              children: [
                                Text(
                                  tipId.length > 14 ? '…${tipId.substring(tipId.length - 10)}' : tipId,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                const SizedBox(width: 4),
                                InkWell(
                                  onTap: () {
                                    Clipboard.setData(ClipboardData(text: tipId));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Reference ID copied to clipboard')),
                                    );
                                  },
                                  child: const Icon(Icons.copy, color: CbColors.purpleLight, size: 14),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Divider(color: CbColors.outline, height: 1),
                      ),
                      // Key-value summary rows tested by tipping_payment_flow_test
                      _ReceiptSummary(state: state, formatCents: _formatCents),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Divider(color: CbColors.outline, height: 1),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total Paid',
                            style: GoogleFonts.dmSans(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '$amountFormatted USD',
                            style: GoogleFonts.dmSans(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // Follower Engagement Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: CbColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: CbColors.outline),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Support $recipientName further',
                                  style: GoogleFonts.dmSans(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'Get notified for upcoming shows & drops',
                                  style: GoogleFonts.dmSans(
                                    color: CbColors.textMuted,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: () => setState(() => _isFollowing = !_isFollowing),
                            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: _isFollowing ? CbColors.surfaceBright : CbColors.purpleMain,
                                borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                                border: Border.all(color: _isFollowing ? CbColors.purpleLight : Colors.transparent),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    _isFollowing ? Icons.check : Icons.add,
                                    color: Colors.white,
                                    size: 14,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _isFollowing ? 'Following' : 'Follow',
                                    style: GoogleFonts.dmSans(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (cheerNote != null && cheerNote.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: CbColors.surface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: CbColors.outline),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.chat_bubble_outline, color: CbColors.purpleLight, size: 14),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Your Attached Cheer Note',
                                        style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0x2210B981),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'Displayed On Stage Screen',
                                      style: GoogleFonts.dmSans(color: CbColors.liveGreen, fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '“$cheerNote”',
                                style: GoogleFonts.dmSans(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Sticky Fixed Action Bar
        Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          decoration: const BoxDecoration(
            color: CbColors.surface,
            border: Border(top: BorderSide(color: CbColors.outline)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton(
                  onPressed: _goHome,
                  style: FilledButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    'Back to Home',
                    style: GoogleFonts.dmSans(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                height: 42,
                child: OutlinedButton.icon(
                  onPressed: () => _shareReceipt(state),
                  icon: const Icon(Icons.share_outlined, size: 16),
                  label: Text(
                    'Share receipt',
                    style: GoogleFonts.dmSans(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: CbColors.textSecondary,
                    side: const BorderSide(color: CbColors.outline),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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
            color: CbColors.liveGreen, size: 80);
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
      style: GoogleFonts.dmSans(
        fontSize: 22,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
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
    return Column(
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
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value,
      {this.bold = false, this.accent = false});
  final String label;
  final String value;
  final bool bold;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 13),
          ),
          Text(
            value,
            style: GoogleFonts.dmSans(
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              color: accent ? const Color(0xFF00D8C4) : Colors.white,
              fontSize: 13,
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
          Expanded(
            child: Text(
              'No connection — will confirm when reconnected.',
              style: GoogleFonts.dmSans(color: Colors.orange, fontSize: 12),
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
