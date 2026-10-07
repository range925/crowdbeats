// Crowdbeats V2 — QR Display Widget (Phase 7)
//
// Animated QR code display for live performer sessions.
// Shows:
//   - QR code (via qr_flutter package)
//   - Countdown ring (90s → 0)
//   - Auto-refresh when ≤ 20s remaining (via timer)
//   - Expiry state (grey out + "Refreshing…" overlay)
//   - Error state with retry button

import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../state/musician_state.dart';
import '../../theme/cb_colors.dart';

class QrDisplayWidget extends ConsumerStatefulWidget {
  const QrDisplayWidget({super.key, this.size = 220});

  /// Diameter of the QR + countdown ring area.
  final double size;

  @override
  ConsumerState<QrDisplayWidget> createState() => _QrDisplayWidgetState();
}

class _QrDisplayWidgetState extends ConsumerState<QrDisplayWidget>
    with SingleTickerProviderStateMixin {
  Timer? _countdownTimer;
  Timer? _refreshTimer;
  int _displaySeconds = 90;
  late final AnimationController _ringController;

  @override
  void initState() {
    super.initState();
    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 90),
    );
    _startTimers();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _refreshTimer?.cancel();
    _ringController.dispose();
    super.dispose();
  }

  void _startTimers() {
    _countdownTimer?.cancel();
    _refreshTimer?.cancel();

    // Reset ring animation from current remaining time
    final session = ref.read(musicianSessionProvider);
    final secs = session.currentToken?.remainingSeconds ?? 90;
    _displaySeconds = secs;
    _ringController.value = 1.0 - (secs / 90.0);
    _ringController.forward(from: 1.0 - (secs / 90.0));

    // Tick every second
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _displaySeconds = (_displaySeconds - 1).clamp(0, 90);
      });
    });

    // Auto-refresh at 20 seconds remaining
    final refreshIn = Duration(seconds: (secs - 20).clamp(0, secs));
    _refreshTimer = Timer(refreshIn, () {
      if (!mounted) return;
      ref.read(musicianSessionProvider.notifier).refreshToken();
    });
  }

  @override
  void didUpdateWidget(QrDisplayWidget old) {
    super.didUpdateWidget(old);
    // Restart timers when new token arrives
    WidgetsBinding.instance.addPostFrameCallback((_) => _startTimers());
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(musicianSessionProvider);
    final token = session.currentToken;
    final isRefreshing = session.isRefreshingToken;

    if (token == null) {
      return _buildPlaceholder('Generating QR…');
    }

    // Build QR data string: tokenId:sessionId:sig
    final qrData = '${token.tokenId}:${token.sessionId}:${token.sig}';

    return SizedBox(
      width: widget.size + 24,
      height: widget.size + 24,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Countdown ring
          CustomPaint(
            size: Size(widget.size + 24, widget.size + 24),
            painter: _CountdownRingPainter(
              fraction: _displaySeconds / 90.0,
              isExpiring: _displaySeconds <= 20,
            ),
          ),

          // QR code
          AnimatedOpacity(
            opacity: isRefreshing || _displaySeconds == 0 ? 0.4 : 1.0,
            duration: const Duration(milliseconds: 300),
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: QrImageView(
                data: qrData,
                version: QrVersions.auto,
                size: widget.size - 8,
                padding: const EdgeInsets.all(12),
                errorCorrectionLevel: QrErrorCorrectLevel.M,
              ),
            ),
          ),

          // Refreshing overlay
          if (isRefreshing)
            Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  SizedBox(height: 12),
                  Text('Refreshing…', style: TextStyle(color: Colors.white)),
                ],
              ),
            ),

          // Countdown text below ring
          Positioned(
            bottom: 0,
            child: Text(
              '${_displaySeconds}s',
              style: TextStyle(
                color: _displaySeconds <= 20
                    ? CbColors.statusWarning
                    : CbColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder(String msg) {
    return Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CbColors.borderSubtle),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(strokeWidth: 2),
          const SizedBox(height: 12),
          Text(msg, style: const TextStyle(color: CbColors.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }
}

// ── Countdown ring painter ─────────────────────────────────────────────────────

class _CountdownRingPainter extends CustomPainter {
  const _CountdownRingPainter({required this.fraction, required this.isExpiring});

  final double fraction;
  final bool isExpiring;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4;
    const strokeWidth = 4.0;

    // Background track
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi,
      false,
      Paint()
        ..color = CbColors.borderSubtle
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    // Progress arc (shrinks as time runs out)
    if (fraction > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        -2 * math.pi * fraction, // counterclockwise fill
        false,
        Paint()
          ..color = isExpiring ? CbColors.statusWarning : CbColors.accentPrimary
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(_CountdownRingPainter old) =>
      old.fraction != fraction || old.isExpiring != isExpiring;
}
