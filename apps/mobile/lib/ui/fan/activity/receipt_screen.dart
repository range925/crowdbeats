// Crowdbeats V2 — Receipt Screen (Stitch Screen 2310da91984f41ecb30a59d7ee64e62a)
// Full tip receipt. Shows fee breakdown, Stripe payment ID, and refund request action.
// Refund button visible only within 24-hour window.
// Two-step refund confirmation with reason capture.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:uuid/uuid.dart';

import '../../theme/cb_colors.dart';
import '../../../firebase/tip_service.dart';

class ReceiptScreen extends ConsumerStatefulWidget {
  const ReceiptScreen({super.key, required this.tip});
  final Map<String, dynamic> tip;

  @override
  ConsumerState<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends ConsumerState<ReceiptScreen> {
  bool _refunding = false;
  String? _refundError;

  final _uuid = const Uuid();

  // ── Computed properties ────────────────────────────────────────────────────

  String get _tipId => widget.tip['tipId'] as String? ?? widget.tip['id'] as String? ?? '';
  String get _status => widget.tip['status'] as String? ?? 'unknown';
  int get _amountCents => (widget.tip['amountCents'] as num?)?.toInt() ?? 0;
  int get _platformFeeCents => (widget.tip['platformFeeCents'] as num?)?.toInt() ?? ((_amountCents * 600) ~/ 10000);
  int get _stripeFeeCents => (widget.tip['stripeFeeCents'] as num?)?.toInt() ??
      (_amountCents > 0 ? ((_amountCents * 290) ~/ 10000) + 30 : 0);
  int get _totalDeductionsCents => (widget.tip['totalDeductionsCents'] as num?)?.toInt() ??
      (_platformFeeCents + _stripeFeeCents);
  int get _netAmountCents => (widget.tip['netAmountCents'] as num?)?.toInt() ??
      (_amountCents > _totalDeductionsCents ? _amountCents - _totalDeductionsCents : 0);
  String get _recipientName => widget.tip['recipientName'] as String? ?? 'Artist';
  String get _stripeIntentId => widget.tip['stripePaymentIntentId'] as String? ?? '';

  /// Within 24h refund window
  bool get _canRefund {
    if (_status != 'succeeded') return false;
    final createdAt = widget.tip['createdAt'];
    if (createdAt == null) return false;
    try {
      final dt = (createdAt as dynamic).toDate() as DateTime;
      final windowEnd = dt.add(const Duration(hours: 24));
      return DateTime.now().isBefore(windowEnd);
    } catch (_) {
      return false;
    }
  }

  String _formatCents(int cents) {
    final d = cents ~/ 100;
    final c = cents % 100;
    return '\$$d.${c.toString().padLeft(2, '0')}';
  }

  String _formatDate(dynamic ts) {
    if (ts == null) return 'Unknown';
    try {
      final dt = (ts as dynamic).toDate() as DateTime;
      return '${dt.month}/${dt.day}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return 'Unknown';
    }
  }

  // ── Refund flow ────────────────────────────────────────────────────────────

  Future<void> _onRefund() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceContainer,
        title: Text(
          'Request Refund',
          style: GoogleFonts.dmSans(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Refund ${_formatCents(_amountCents)} to your original payment method?'
          '\n\nRefunds are processed within 5–10 business days.',
          style: GoogleFonts.dmSans(color: CbColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Cancel', style: GoogleFonts.dmSans(color: CbColors.textMuted)),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: CbColors.statusError),
            child: Text('Request Refund', style: GoogleFonts.dmSans(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _refunding = true;
      _refundError = null;
    });

    try {
      await TipService.instance.requestRefund(
        tipId: _tipId,
        reason: 'Fan-initiated within 24h window',
        idempotencyKey: _uuid.v4(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Refund requested. Allow 5–10 business days.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() {
        _refunding = false;
        _refundError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _shareReceipt() {
    SharePlus.instance.share(
      ShareParams(
        text:
            'Tip receipt: ${_formatCents(_amountCents)} to $_recipientName on Crowdbeats 🎶',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Receipt',
          style: GoogleFonts.dmSans(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Colors.white),
            onPressed: _shareReceipt,
            tooltip: 'Share receipt',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Status badge at top
              _StatusHeader(status: _status),
              const SizedBox(height: 20),

              // Receipt details card
              _ReceiptCard(
                recipientName: _recipientName,
                amountCents: _amountCents,
                platformFeeCents: _platformFeeCents,
                stripeFeeCents: _stripeFeeCents,
                totalDeductionsCents: _totalDeductionsCents,
                netAmountCents: _netAmountCents,
                createdAt: widget.tip['createdAt'],
                refundedAt: widget.tip['refundedAt'],
                tipId: _tipId,
                stripeIntentId: _stripeIntentId,
                formatCents: _formatCents,
                formatDate: _formatDate,
              ),

              const SizedBox(height: 20),

              // Refund section
              if (_status == 'refunded') ...[
                _InfoBanner(
                  message: 'Refund processed on ${_formatDate(widget.tip['refundedAt'])}.',
                  color: Colors.blueAccent,
                ),
              ] else if (_canRefund) ...[
                if (_refundError != null)
                  _InfoBanner(message: _refundError!, color: CbColors.statusError),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: _refunding ? null : _onRefund,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: CbColors.statusError,
                    side: const BorderSide(color: CbColors.statusError),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _refunding
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: CbColors.statusError),
                        )
                      : Text('Request Refund', style: GoogleFonts.dmSans(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 6),
                Text(
                  'Refunds available within 24 hours of tip.',
                  style: GoogleFonts.dmSans(fontSize: 11, color: CbColors.textMuted),
                  textAlign: TextAlign.center,
                ),
              ] else if (_status == 'succeeded') ...[
                Text(
                  'Refund window expired (24h).',
                  style: GoogleFonts.dmSans(fontSize: 12, color: CbColors.textMuted),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StatusHeader extends StatelessWidget {
  const _StatusHeader({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    Icon icon;
    String label;
    Color color;

    switch (status) {
      case 'succeeded':
        icon = const Icon(Icons.check_circle, size: 52, color: CbColors.liveGreen);
        label = 'Tip Confirmed';
        color = CbColors.liveGreen;
        break;
      case 'refunded':
        icon = const Icon(Icons.undo, size: 52, color: Colors.blueAccent);
        label = 'Refunded';
        color = Colors.blueAccent;
        break;
      case 'failed':
        icon = const Icon(Icons.error_outline, size: 52, color: CbColors.statusError);
        label = 'Payment Failed';
        color = CbColors.statusError;
        break;
      default:
        icon = const Icon(Icons.schedule, size: 52, color: Colors.orange);
        label = 'Processing';
        color = Colors.orange;
    }

    return Column(
      children: [
        icon,
        const SizedBox(height: 8),
        Text(
          label,
          style: GoogleFonts.dmSans(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _ReceiptCard extends StatelessWidget {
  const _ReceiptCard({
    required this.recipientName,
    required this.amountCents,
    required this.platformFeeCents,
    required this.stripeFeeCents,
    required this.totalDeductionsCents,
    required this.netAmountCents,
    required this.createdAt,
    required this.refundedAt,
    required this.tipId,
    required this.stripeIntentId,
    required this.formatCents,
    required this.formatDate,
  });

  final String recipientName;
  final int amountCents;
  final int platformFeeCents;
  final int stripeFeeCents;
  final int totalDeductionsCents;
  final int netAmountCents;
  final dynamic createdAt;
  final dynamic refundedAt;
  final String tipId;
  final String stripeIntentId;
  final String Function(int) formatCents;
  final String Function(dynamic) formatDate;

  @override
  Widget build(BuildContext context) {
    final shortId = tipId.length > 8
        ? '…${tipId.substring(tipId.length - 8)}'
        : tipId;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: CbColors.surfaceContainer,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CbColors.outline),
      ),
      child: Column(
        children: [
          _Row('Artist', recipientName),
          _Row('Gross Amount', formatCents(amountCents)),
          _Row('Crowdbeats fee (6%)', '−${formatCents(platformFeeCents)}', muted: true),
          _Row('Stripe processing fee', '−${formatCents(stripeFeeCents)}', muted: true),
          _Row('Total deductions', '−${formatCents(totalDeductionsCents)}', muted: true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(color: CbColors.outline, height: 1),
          ),
          _Row('Musician net proceeds', formatCents(netAmountCents), bold: true, accent: true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(color: CbColors.outline, height: 1),
          ),
          _Row('Date', formatDate(createdAt)),
          _Row('Receipt ID', shortId, mono: true),
          if (stripeIntentId.isNotEmpty)
            _Row(
              'Payment ref',
              stripeIntentId.length > 12
                  ? '…${stripeIntentId.substring(stripeIntentId.length - 8)}'
                  : stripeIntentId,
              mono: true,
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value,
      {this.bold = false, this.accent = false, this.muted = false, this.mono = false});

  final String label;
  final String value;
  final bool bold;
  final bool accent;
  final bool muted;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    final color = accent
        ? const Color(0xFF00D8C4)
        : muted
            ? CbColors.textMuted
            : Colors.white;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.dmSans(fontSize: 13, color: CbColors.textMuted)),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: bold ? FontWeight.bold : FontWeight.normal,
                color: color,
                fontFamily: mono ? 'monospace' : null,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.message, required this.color});
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        border: Border.all(color: color.withAlpha(80)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(message, style: GoogleFonts.dmSans(color: color, fontSize: 12)),
    );
  }
}
