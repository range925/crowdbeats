// Crowdbeats V2 — Button Component (Phase 4)
// Min 48×48dp touch target. Semantic labels. No color-only states.

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../theme/cb_theme.dart';

enum CbButtonVariant { primary, secondary, ghost, destructive }

enum CbButtonSize { sm, md, lg }

class CbButton extends StatefulWidget {
  const CbButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = CbButtonVariant.primary,
    this.size = CbButtonSize.md,
    this.leadingIcon,
    this.trailingIcon,
    this.isLoading = false,
    this.fullWidth = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final CbButtonVariant variant;
  final CbButtonSize size;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final bool isLoading;
  final bool fullWidth;

  @override
  State<CbButton> createState() => _CbButtonState();
}

class _CbButtonState extends State<CbButton>
    with SingleTickerProviderStateMixin {
  bool _pressed = false;

  double get _height => switch (widget.size) {
    CbButtonSize.sm => 48,
    CbButtonSize.md => CbSpacing.touchComfortable,  // 56
    CbButtonSize.lg => 64,
  };

  double get _fontSize => switch (widget.size) {
    CbButtonSize.sm => 14,
    CbButtonSize.md => 16,
    CbButtonSize.lg => 18,
  };

  double get _paddingH => switch (widget.size) {
    CbButtonSize.sm => CbSpacing.s4,
    CbButtonSize.md => CbSpacing.s5,
    CbButtonSize.lg => CbSpacing.s6,
  };

  (Color bg, Color fg, Color border) _resolveColors(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;

    return switch (widget.variant) {
      CbButtonVariant.primary => isDark
          ? (
              CbColors.brandCoralPink,
              const Color(0xFF131315),
              Colors.transparent,
            )
          : (
              CbColors.accentPrimary,
              Colors.white,
              Colors.transparent,
            ),
      CbButtonVariant.secondary => (
          Colors.transparent,
          isDark ? CbColors.accentSecondary : CbColors.accentPrimary,
          isDark ? CbColors.brandElectricViolet : CbColors.accentPrimary,
        ),
      CbButtonVariant.ghost => (
          Colors.transparent,
          ext.textSecondary,
          Colors.transparent,
        ),
      CbButtonVariant.destructive => (
          Colors.transparent,
          ext.statusError,
          ext.statusError,
        ),
    };
  }

  bool get _disabled => widget.onPressed == null || widget.isLoading;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = _resolveColors(context);
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;

    Widget child = Row(
      mainAxisSize: widget.fullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.isLoading)
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: fg,
            ),
          )
        else if (widget.leadingIcon != null)
          Icon(widget.leadingIcon, size: _fontSize + 4, color: fg),
        if (widget.isLoading || widget.leadingIcon != null)
          const SizedBox(width: CbSpacing.s2),
        Text(
          widget.isLoading ? 'Loading…' : widget.label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: _fontSize,
            fontWeight: FontWeight.w600,
            color: fg,
            letterSpacing: 0.01,
          ),
        ),
        if (!widget.isLoading && widget.trailingIcon != null) ...[
          const SizedBox(width: CbSpacing.s2),
          Icon(widget.trailingIcon, size: _fontSize + 4, color: fg),
        ],
      ],
    );

    child = AnimatedContainer(
      duration: CbMotion.fast,
      curve: CbMotion.easeOut,
      height: _height,
      constraints: BoxConstraints(minWidth: _height, minHeight: _height),
      padding: EdgeInsets.symmetric(horizontal: _paddingH),
      decoration: BoxDecoration(
        color:        _disabled
            ? (_pressed ? CbColors.surfacePressed : bg)
            : (_pressed ? _darken(bg) : bg),
        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
        border:       Border.all(color: border, width: 1.5),
      ),
      child: child,
    );

    if (_disabled) {
      return Opacity(
        opacity: 0.45,
        child: Semantics(
          label: widget.isLoading ? '${widget.label}, loading' : widget.label,
          enabled: false,
          child: SizedBox(
            width: widget.fullWidth ? double.infinity : null,
            child: child,
          ),
        ),
      );
    }

    return Semantics(
      label: widget.label,
      button: true,
      child: GestureDetector(
        onTapDown:   (_) => setState(() => _pressed = true),
        onTapUp:     (_) => setState(() => _pressed = false),
        onTapCancel: ()  => setState(() => _pressed = false),
        onTap:       widget.onPressed,
        child: Focus(
          child: Builder(builder: (ctx) {
            final focused = Focus.of(ctx).hasFocus;
            return AnimatedContainer(
              duration: CbMotion.fast,
              curve: CbMotion.easeOut,
              decoration: focused
                  ? BoxDecoration(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm + 2),
                      boxShadow: [
                        BoxShadow(
                          color: ext.borderFocus.withAlpha(153),
                          blurRadius: 0,
                          spreadRadius: 3,
                        ),
                      ],
                    )
                  : const BoxDecoration(),
              child: SizedBox(
                width: widget.fullWidth ? double.infinity : null,
                child: child,
              ),
            );
          }),
        ),
      ),
    );
  }

  Color _darken(Color c) {
    if (c == Colors.transparent) return CbColors.surfacePressed;
    final hsl = HSLColor.fromColor(c);
    return hsl.withLightness((hsl.lightness - 0.08).clamp(0, 1)).toColor();
  }
}
