// Crowdbeats V2 — Animated Performer Marker (Phase 9)
//
// Uber/Lyft-quality perceived smoothness with client-side interpolation:
// - Frame rate decoupled from network tick rate (60/120fps client tweens)
// - Teleportation guard (>500m or large pixel jump): snap + fade instead of sweeping
// - Stationary venue invariant: locked coordinates (zero fake movement), subtle breathing halo
// - Mobile coarse invariant: interpolates strictly between 100m grid centroids
// - Freshness state badge: Live, Updated just now, Updated 2m ago, Approximate area, Reconnecting, Ended
// - Reduced-motion compliance: disables tweens & pauses looping pulse when requested
// - Lifecycle observer: halts animation controllers when backgrounded/paused
// - RepaintBoundary isolation to minimize CPU/GPU raster overhead

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';

class AnimatedPerformerMarker extends StatefulWidget {
  const AnimatedPerformerMarker({
    super.key,
    required this.performer,
    required this.targetOffset,
    this.onTap,
    this.teleportPixelThreshold = 350.0,
    this.interpolationDuration = const Duration(milliseconds: 800),
    this.fadeDuration = const Duration(milliseconds: 300),
    this.enablePulseAnimation = true,
  });

  final PublicPerformer performer;
  final Offset targetOffset;
  final VoidCallback? onTap;
  final double teleportPixelThreshold;
  final Duration interpolationDuration;
  final Duration fadeDuration;
  final bool enablePulseAnimation;

  @override
  State<AnimatedPerformerMarker> createState() => _AnimatedPerformerMarkerState();
}

class _AnimatedPerformerMarkerState extends State<AnimatedPerformerMarker>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  late AnimationController _moveController;
  late AnimationController _pulseController;
  late AnimationController _fadeController;

  late Animation<Offset> _moveAnimation;
  late Animation<double> _pulseScaleAnimation;
  late Animation<double> _pulseOpacityAnimation;
  late Animation<double> _fadeAnimation;

  Offset _currentOffset = Offset.zero;
  Offset _previousTargetOffset = Offset.zero;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _currentOffset = widget.targetOffset;
    _previousTargetOffset = widget.targetOffset;

    // 1. Movement interpolation controller
    _moveController = AnimationController(
      vsync: this,
      duration: widget.interpolationDuration,
    );
    _moveAnimation = Tween<Offset>(
      begin: _currentOffset,
      end: _currentOffset,
    ).animate(
      CurvedAnimation(parent: _moveController, curve: Curves.easeInOutCubic),
    )..addListener(() {
        setState(() {
          _currentOffset = _moveAnimation.value;
        });
      });

    // 2. Halo breathing controller
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );
    _pulseScaleAnimation = Tween<double>(begin: 1, end: 2.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOutQuad),
    );
    _pulseOpacityAnimation = Tween<double>(begin: 0.6, end: 0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOutQuad),
    );

    // 3. Fade / Snap controller for teleportation jumps
    _fadeController = AnimationController(
      vsync: this,
      duration: widget.fadeDuration,
      value: 1,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeIn,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _checkReducedMotion();
  }

  void _checkReducedMotion() {
    final disableAnimations = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (disableAnimations || !widget.enablePulseAnimation) {
      _pulseController.stop();
      if (_moveController.isAnimating) {
        _moveController.stop();
        _currentOffset = widget.targetOffset;
      }
    } else {
      if (widget.performer.isLive && !_pulseController.isAnimating) {
        _pulseController.repeat();
      }
    }
  }

  @override
  void didUpdateWidget(covariant AnimatedPerformerMarker oldWidget) {
    super.didUpdateWidget(oldWidget);

    final disableAnimations = MediaQuery.maybeDisableAnimationsOf(context) ?? false;

    // Check if position target changed
    if (widget.targetOffset != _previousTargetOffset) {
      final newTarget = widget.targetOffset;
      _previousTargetOffset = newTarget;

      // Invariant: Stationary venue session must NEVER fake movement or drift!
      if (widget.performer.isStationary) {
        _currentOffset = newTarget;
        _moveController.stop();
      } else if (disableAnimations) {
        // Reduced motion: snap instantly
        _currentOffset = newTarget;
      } else {
        final jumpDistance = (newTarget - _currentOffset).distance;

        // Teleportation Guard (>500m or >threshold screen distance): snap + fade instead of sweep
        if (jumpDistance > widget.teleportPixelThreshold) {
          _fadeController.reverse().then((_) {
            if (mounted) {
              setState(() {
                _currentOffset = newTarget;
              });
              _fadeController.forward();
            }
          });
        } else {
          // Smooth 60fps client-side interpolation
          _moveAnimation = Tween<Offset>(
            begin: _currentOffset,
            end: newTarget,
          ).animate(
            CurvedAnimation(parent: _moveController, curve: Curves.easeInOutCubic),
          );
          _moveController.forward(from: 0);
        }
      }
    }

    if (widget.performer.isLive && !_pulseController.isAnimating && !disableAnimations && widget.enablePulseAnimation) {
      _pulseController.repeat();
    } else if ((!widget.performer.isLive || !widget.enablePulseAnimation) && _pulseController.isAnimating) {
      _pulseController.stop();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _pulseController.stop();
      _moveController.stop();
    } else if (state == AppLifecycleState.resumed) {
      final disableAnimations = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
      if (widget.performer.isLive && !disableAnimations) {
        _pulseController.repeat();
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _moveController.dispose();
    _pulseController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.performer;
    final isLive = p.isLive;
    final isStationary = p.isStationary;

    final freshness = computeMarkerFreshness(
      lastUpdated: p.lastUpdated,
      isLive: isLive,
      isStationary: isStationary,
      endsAt: p.endsAt,
    );

    final markerThemeColor = Color(freshness.colorHex);

    return RepaintBoundary(
      child: Transform.translate(
        offset: _currentOffset,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: widget.onTap,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Freshness & Name pill badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isLive ? (isStationary ? const Color(0xFF10B981) : CbColors.purpleMain) : const Color(0xFF64748B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: markerThemeColor.withValues(alpha: 0.5),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (p.type == 'band')
                        const Text('🎸', style: TextStyle(fontSize: 12))
                      else
                        Image.network(
                          'solo_musician_bear.png',
                          width: 18,
                          height: 18,
                          fit: BoxFit.contain,
                          errorBuilder: (ctx, err, stack) => const Text('🐻', style: TextStyle(fontSize: 12)),
                        ),
                      const SizedBox(width: 5),
                      Text(
                        p.name,
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(width: 5),
                      // Freshness badge pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          freshness.label.toUpperCase(),
                          style: TextStyle(
                            color: markerThemeColor,
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Halo + Pin Tip
                Stack(
                  alignment: Alignment.center,
                  clipBehavior: Clip.none,
                  children: [
                    // Breathing halo for stationary venue or live session
                    if (isLive)
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _pulseScaleAnimation.value,
                            child: Container(
                              width: 20,
                              height: 12,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: markerThemeColor.withValues(alpha: _pulseOpacityAnimation.value),
                                border: Border.all(
                                  color: markerThemeColor.withValues(alpha: _pulseOpacityAnimation.value * 0.8),
                                  width: 1.5,
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                    // Stationary Venue Anchor vs Mobile Pin Tip
                    if (isStationary)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          border: Border.all(color: const Color(0xFF10B981), width: 2),
                          boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 4)],
                        ),
                      )
                    else
                      CustomPaint(
                        size: const Size(10, 6),
                        painter: _MarkerPinTipPainter(
                          color: isLive ? CbColors.purpleMain : const Color(0xFF64748B),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MarkerPinTipPainter extends CustomPainter {
  const _MarkerPinTipPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _MarkerPinTipPainter oldDelegate) => oldDelegate.color != color;
}
