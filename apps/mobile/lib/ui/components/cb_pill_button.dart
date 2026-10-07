// Crowdbeats V2 — Stitch Authoritative Pill Button (Project 5326179813018056505)
// Full-width or inline vibrant purple gradient CTA with glow shadow and loading state.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CbPillButton extends StatefulWidget {
  const CbPillButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.leadingIcon,
    this.trailingIcon,
    this.sublabel,
    this.isLoading = false,
    this.isFullWidth = true,
    this.height = 54,
    this.backgroundColor,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final String? sublabel;
  final bool isLoading;
  final bool isFullWidth;
  final double height;
  final Color? backgroundColor;
  final String? semanticLabel;

  @override
  State<CbPillButton> createState() => _CbPillButtonState();
}

class _CbPillButtonState extends State<CbPillButton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1, end: 0.97).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isEnabled = widget.onPressed != null && !widget.isLoading;

    final Widget buttonContent = Container(
      height: widget.height,
      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
        gradient: isEnabled
            ? (widget.backgroundColor != null
                ? null
                : CbColors.primaryGradient)
            : null,
        color: isEnabled
            ? widget.backgroundColor
            : CbColors.surface3,
        boxShadow: isEnabled
            ? const [
                BoxShadow(
                  color: CbColors.purpleGlow,
                  blurRadius: 20,
                  spreadRadius: -2,
                  offset: Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Center(
        child: widget.isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisSize: widget.isFullWidth ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (widget.leadingIcon != null) ...[
                    widget.leadingIcon!,
                    const SizedBox(width: CbSpacing.s2),
                  ],
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.label,
                        style: const TextStyle(
                          color: CbColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.2,
                        ),
                      ),
                      if (widget.sublabel != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          widget.sublabel!,
                          style: const TextStyle(
                            color: Color(0xCCFFFFFF),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (widget.trailingIcon != null) ...[
                    const SizedBox(width: CbSpacing.s2),
                    widget.trailingIcon!,
                  ],
                ],
              ),
      ),
    );

    return Semantics(
      button: true,
      enabled: isEnabled,
      label: widget.semanticLabel ?? widget.label,
      child: GestureDetector(
        onTapDown: isEnabled ? (_) => _controller.forward() : null,
        onTapUp: isEnabled ? (_) => _controller.reverse() : null,
        onTapCancel: isEnabled ? () => _controller.reverse() : null,
        onTap: isEnabled ? widget.onPressed : null,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: widget.isFullWidth
              ? SizedBox(width: double.infinity, child: buttonContent)
              : buttonContent,
        ),
      ),
    );
  }
}
