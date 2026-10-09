// Crowdbeats V2 — Core Components (Phase 4)
// Avatar, StatusBadge, Skeleton, Card, Input, BottomSheet,
// EmptyState, ConfirmationSheet, AmountSelector, ProgressBar, LiveStageChip

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../theme/cb_theme.dart';
import 'cb_button.dart';

// ══════════════════════════════════════════════════════════════════════════════
// CB CARD
// ══════════════════════════════════════════════════════════════════════════════

class CbCard extends StatelessWidget {
  const CbCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.isLive = false,
    this.semanticLabel,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool isLive;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isLive ? ext.liveSurface : ext.surfaceCard;
    final border = isLive ? ext.borderFocus : ext.borderSubtle;
    final shadow = isLive
        ? <BoxShadow>[
            BoxShadow(
              color: ext.liveGlow,
              blurRadius: 24,
              spreadRadius: 0,
            ),
          ]
        : isDark
            ? <BoxShadow>[
                BoxShadow(
                  color: Colors.black.withAlpha(102),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : <BoxShadow>[
                BoxShadow(
                  color: Colors.black.withAlpha(15),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ];

    Widget card = Container(
      decoration: BoxDecoration(
        color:        bg,
        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
        border:       Border.all(color: border, width: 1),
        boxShadow:    shadow,
      ),
      padding: padding ?? CbSpacing.cardPadding,
      child:   child,
    );

    if (onTap != null) {
      card = Semantics(
        label:   semanticLabel,
        button:  true,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap:       onTap,
            borderRadius:BorderRadius.circular(CbSpacing.radiusMd),
            splashColor: CbColors.accentPrimarySubtle,
            child: card,
          ),
        ),
      );
    }

    return card;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CB INPUT
// ══════════════════════════════════════════════════════════════════════════════

class CbInput extends StatelessWidget {
  const CbInput({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.controller,
    this.obscureText = false,
    this.prefixIcon,
    this.suffix,
    this.keyboardType,
    this.onChanged,
    this.autofocus = false,
    this.textInputAction,
    this.onSubmitted,
    this.maxLines = 1,
  });

  final String? label;
  final String? hint;
  final String? errorText;
  final String? helperText;
  final TextEditingController? controller;
  final bool obscureText;
  final IconData? prefixIcon;
  final Widget? suffix;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final bool autofocus;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final int? maxLines;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller:      controller,
      obscureText:     obscureText,
      keyboardType:    keyboardType,
      onChanged:       onChanged,
      autofocus:       autofocus,
      textInputAction: textInputAction,
      onFieldSubmitted:onSubmitted,
      maxLines:        maxLines,
      style: GoogleFonts.plusJakartaSans(
        color:    CbColors.textPrimary,
        fontSize: 16,
      ),
      decoration: InputDecoration(
        labelText:  label,
        hintText:   hint,
        errorText:  errorText,
        helperText: helperText,
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, color: CbColors.textTertiary, size: 20)
            : null,
        suffixIcon: suffix,
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CB AVATAR
// ══════════════════════════════════════════════════════════════════════════════

enum CbAvatarSize { xs, sm, md, lg, xl, xxl }

extension _AvatarSizeExt on CbAvatarSize {
  double get px => switch (this) {
    CbAvatarSize.xs  => 24,
    CbAvatarSize.sm  => 32,
    CbAvatarSize.md  => 40,
    CbAvatarSize.lg  => 48,
    CbAvatarSize.xl  => 64,
    CbAvatarSize.xxl => 96,
  };

  double get fontSize => math.max(10, (px * 0.36).roundToDouble());
}

class CbAvatar extends StatelessWidget {
  const CbAvatar({
    super.key,
    required this.semanticLabel,
    this.imageUrl,
    this.initials,
    this.size = CbAvatarSize.md,
    this.isLive = false,
  });

  final String semanticLabel;
  final String? imageUrl;
  final String? initials;
  final CbAvatarSize size;
  final bool isLive;

  @override
  Widget build(BuildContext context) {
    final px = size.px;
    final ring = isLive
        ? BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: CbColors.accentPrimary, width: 2),
            boxShadow: [
              const BoxShadow(
                color: CbColors.liveGlow,
                blurRadius: 8,
              ),
            ],
          )
        : null;

    Widget avatar = Container(
      width:         px,
      height:        px,
      decoration: BoxDecoration(
        shape:  BoxShape.circle,
        color:  CbColors.accentPrimarySubtle,
        image: imageUrl != null
            ? DecorationImage(
                image:    NetworkImage(imageUrl!),
                fit:      BoxFit.cover,
                onError: (_, _) {},
              )
            : null,
      ),
      child: imageUrl == null
          ? Center(
              child: Text(
                initials ?? semanticLabel.characters.first.toUpperCase(),
                style: GoogleFonts.plusJakartaSans(
                  fontSize:   size.fontSize,
                  fontWeight: FontWeight.w600,
                  color:      CbColors.accentPrimary,
                ),
              ),
            )
          : null,
    );

    if (isLive) {
      avatar = Container(
        width:      px + 4,
        height:     px + 4,
        decoration: ring,
        padding:    const EdgeInsets.all(2),
        child: avatar,
      );
    }

    return Semantics(
      label: isLive ? '$semanticLabel, live' : semanticLabel,
      image: true,
      child: avatar,
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CB STATUS BADGE — never color-only
// ══════════════════════════════════════════════════════════════════════════════

enum CbStatus { success, warning, error, info, live, neutral }

extension _StatusExt on CbStatus {
  String get icon => switch (this) {
    CbStatus.success => '✓',
    CbStatus.warning => '⚠',
    CbStatus.error   => '✕',
    CbStatus.info    => 'i',
    CbStatus.live    => '●',
    CbStatus.neutral => '○',
  };

  String get defaultLabel => switch (this) {
    CbStatus.success => 'Success',
    CbStatus.warning => 'Warning',
    CbStatus.error   => 'Error',
    CbStatus.info    => 'Info',
    CbStatus.live    => 'Live',
    CbStatus.neutral => '',
  };

  Color get fg => switch (this) {
    CbStatus.success => CbColors.statusSuccess,
    CbStatus.warning => CbColors.statusWarning,
    CbStatus.error   => CbColors.statusError,
    CbStatus.info    => CbColors.statusInfo,
    CbStatus.live    => CbColors.statusLive,
    CbStatus.neutral => CbColors.textSecondary,
  };

  Color get bg => switch (this) {
    CbStatus.success => CbColors.statusSuccess.withAlpha(38),
    CbStatus.warning => CbColors.statusWarning.withAlpha(38),
    CbStatus.error   => CbColors.statusError.withAlpha(38),
    CbStatus.info    => CbColors.statusInfo.withAlpha(38),
    CbStatus.live    => CbColors.statusLive.withAlpha(38),
    CbStatus.neutral => CbColors.surfacePressed,
  };
}

class CbStatusBadge extends StatelessWidget {
  const CbStatusBadge({
    super.key,
    required this.status,
    this.label,
    this.showIcon = true,
  });

  final CbStatus status;
  final String? label;
  final bool showIcon;

  @override
  Widget build(BuildContext context) {
    final text = label ?? status.defaultLabel;
    return Semantics(
      label: '${status.defaultLabel}: $text',
      child: Container(
        height: 24,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color:        status.bg,
          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
          border: Border.all(color: status.fg.withAlpha(77)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showIcon) ...[
              Text(
                status.icon,
                style: TextStyle(fontSize: 10, color: status.fg),
              ),
              const SizedBox(width: 4),
            ],
            Text(
              text,
              style: GoogleFonts.plusJakartaSans(
                fontSize:      12,
                fontWeight:    FontWeight.w600,
                color:         status.fg,
                letterSpacing: 0.02,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CB SKELETON (shimmer)
// ══════════════════════════════════════════════════════════════════════════════

class CbSkeleton extends StatefulWidget {
  const CbSkeleton({
    super.key,
    this.width = double.infinity,
    this.height = 20,
    this.borderRadius,
  });

  final double width;
  final double height;
  final double? borderRadius;

  @override
  State<CbSkeleton> createState() => _CbSkeletonState();
}

class _CbSkeletonState extends State<CbSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );
    _anim = Tween<double>(begin: -1, end: 2).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!MediaQuery.of(context).disableAnimations) {
      _ctrl.repeat();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final radius = widget.borderRadius ?? CbSpacing.radiusXs;
    final noAnim = MediaQuery.of(context).disableAnimations;

    return Semantics(
      label: 'Loading content',
      child: AnimatedBuilder(
        animation: _anim,
        builder: (_, _) {
          return Container(
            width:  widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(radius),
              gradient: noAnim
                  ? const LinearGradient(
                      colors: [CbColors.surfaceCard, CbColors.surfacePressed],
                    )
                  : LinearGradient(
                      begin: Alignment.centerLeft,
                      end:   Alignment.centerRight,
                      stops: [
                        math.max(0, _anim.value - 0.5),
                        _anim.value.clamp(0, 1),
                        math.min(1, _anim.value + 0.5),
                      ],
                      colors: const [
                        CbColors.surfaceCard,
                        CbColors.surfacePressed,
                        CbColors.surfaceCard,
                      ],
                    ),
            ),
          );
        },
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CB TOAST
// ══════════════════════════════════════════════════════════════════════════════

class CbToast {
  static void show(
    BuildContext context, {
    required String message,
    CbStatus status = CbStatus.info,
    Duration duration = const Duration(seconds: 4),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration:    duration,
        behavior:    SnackBarBehavior.floating,
        padding:     const EdgeInsets.symmetric(
          horizontal: CbSpacing.s4,
          vertical:   CbSpacing.s3,
        ),
        content: Row(
          children: [
            Text(status.icon, style: TextStyle(color: status.fg, fontSize: 16)),
            const SizedBox(width: CbSpacing.s3),
            Expanded(
              child: Text(
                message,
                style: GoogleFonts.plusJakartaSans(
                  color: CbColors.textPrimary,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CB BOTTOM SHEET
// ══════════════════════════════════════════════════════════════════════════════

Future<T?> showCbBottomSheet<T>({
  required BuildContext context,
  required Widget child,
  String? title,
  bool isDismissible = true,
}) {
  final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
  return showModalBottomSheet<T>(
    context:         context,
    isDismissible:   isDismissible,
    isScrollControlled: true,
    backgroundColor: ext.surfaceOverlay,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(CbSpacing.radiusXl),
      ),
    ),
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: CbSpacing.s3),
            // Handle bar (36x4dp)
            Container(
              width:        36,
              height:       4,
              decoration: BoxDecoration(
                color:        ext.borderStrong,
                borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
              ),
            ),
            if (title != null) ...[
              const SizedBox(height: CbSpacing.s4),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5),
                child: Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize:   20,
                    fontWeight: FontWeight.w600,
                    color:      ext.textPrimary,
                  ),
                ),
              ),
            ],
            const SizedBox(height: CbSpacing.s2),
            child,
            const SizedBox(height: CbSpacing.s4),
          ],
        ),
      ),
    ),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE / ERROR STATE
// ══════════════════════════════════════════════════════════════════════════════

class CbEmptyState extends StatelessWidget {
  const CbEmptyState({
    super.key,
    required this.title,
    this.icon = Icons.music_note_rounded,
    this.subtitle,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: subtitle != null ? '$title. $subtitle' : title,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(CbSpacing.s12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 48, color: CbColors.textTertiary),
              const SizedBox(height: CbSpacing.s4),
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize:   18,
                  fontWeight: FontWeight.w600,
                  color:      CbColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              if (subtitle != null) ...[
                const SizedBox(height: CbSpacing.s2),
                Text(
                  subtitle!,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    color:    CbColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
              if (action != null) ...[
                const SizedBox(height: CbSpacing.s5),
                action!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class CbErrorState extends StatelessWidget {
  const CbErrorState({
    super.key,
    this.title = 'Something went wrong',
    this.subtitle,
    this.onRetry,
  });

  final String title;
  final String? subtitle;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return CbEmptyState(
      icon:     Icons.warning_amber_rounded,
      title:    title,
      subtitle: subtitle,
      action:   onRetry != null
          ? CbButton(
              label:    'Try again',
              variant:  CbButtonVariant.secondary,
              onPressed:onRetry,
            )
          : null,
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIRMATION SHEET
// ══════════════════════════════════════════════════════════════════════════════

Future<bool?> showCbConfirmationSheet({
  required BuildContext context,
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
  bool isDestructive = false,
}) {
  return showCbBottomSheet<bool>(
    context: context,
    title:   title,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            message,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              color:    CbColors.textSecondary,
            ),
          ),
          const SizedBox(height: CbSpacing.s6),
          CbButton(
            label:    confirmLabel,
            variant:  isDestructive
                ? CbButtonVariant.destructive
                : CbButtonVariant.primary,
            fullWidth:true,
            onPressed:() => Navigator.of(context).pop(true),
          ),
          const SizedBox(height: CbSpacing.s2),
          CbButton(
            label:    cancelLabel,
            variant:  CbButtonVariant.ghost,
            fullWidth:true,
            onPressed:() => Navigator.of(context).pop(false),
          ),
        ],
      ),
    ),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AMOUNT SELECTOR
// ══════════════════════════════════════════════════════════════════════════════

class CbAmountSelector extends StatefulWidget {
  const CbAmountSelector({
    super.key,
    this.presets = const [100, 200, 500, 1000],
    this.selectedAmount,
    this.minAmount = 100,
    this.maxAmount = 50000,
    required this.onChanged,
    this.currency = 'USD',
  });

  final List<int> presets;  // cents
  final int? selectedAmount; // cents
  final int minAmount;        // cents
  final int maxAmount;        // cents
  final ValueChanged<int> onChanged;
  final String currency;

  @override
  State<CbAmountSelector> createState() => _CbAmountSelectorState();
}

class _CbAmountSelectorState extends State<CbAmountSelector> {
  late final TextEditingController _ctrl;
  String? _error;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  String _fmt(int cents) {
    final dollars = cents / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  void _handleCustom(String raw) {
    final dollars = double.tryParse(raw);
    if (dollars == null || dollars <= 0) {
      setState(() => _error = 'Enter a valid amount');
      return;
    }
    final cents = (dollars * 100).round();
    if (cents < widget.minAmount) {
      setState(() => _error = 'Minimum is ${_fmt(widget.minAmount)}');
      return;
    }
    if (cents > widget.maxAmount) {
      setState(() => _error = 'Maximum is ${_fmt(widget.maxAmount)}');
      return;
    }
    setState(() => _error = null);
    widget.onChanged(cents);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: CbSpacing.s2,
          runSpacing: CbSpacing.s2,
          children: widget.presets.map((cents) {
            final isSelected = widget.selectedAmount == cents;
            return Semantics(
              label: '${_fmt(cents)}, ${isSelected ? 'selected' : ''}',
              button: true,
              child: GestureDetector(
                onTap: () {
                  setState(() { _ctrl.clear(); _error = null; });
                  widget.onChanged(cents);
                },
                child: Container(
                  height:     CbSpacing.touchMin, // 48dp
                  constraints:const BoxConstraints(minWidth: 72),
                  padding:    const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? CbColors.accentPrimary
                        : Colors.transparent,
                    borderRadius:BorderRadius.circular(CbSpacing.radiusSm),
                    border: Border.all(
                      color: isSelected
                          ? CbColors.accentPrimary
                          : CbColors.borderSubtle,
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      _fmt(cents),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize:   16,
                        fontWeight: FontWeight.w500,
                        color: isSelected
                            ? CbColors.textOnPrimary
                            : CbColors.textPrimary,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: CbSpacing.s4),
        CbInput(
          controller:   _ctrl,
          label:        'Custom amount',
          hint:         '0.00',
          prefixIcon:   Icons.attach_money_rounded,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          errorText:    _error,
          onChanged:    _handleCustom,
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR + MINI CHART
// ══════════════════════════════════════════════════════════════════════════════

class CbProgressBar extends StatelessWidget {
  const CbProgressBar({
    super.key,
    required this.value,
    required this.semanticLabel,
    this.color,
    this.showLabel = true,
  });

  final double value;         // 0.0–1.0
  final String semanticLabel;
  final Color? color;
  final bool showLabel;

  @override
  Widget build(BuildContext context) {
    final clamped = value.clamp(0.0, 1.0);
    final pct = (clamped * 100).round();
    final barColor = color ?? CbColors.accentPrimary;

    return Semantics(
      label: semanticLabel,
      value: '$pct%',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showLabel)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(semanticLabel,
                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: CbColors.textSecondary)),
                Text('$pct%',
                  style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: CbColors.textPrimary)),
              ],
            ),
          if (showLabel) const SizedBox(height: CbSpacing.s1_5),
          ClipRRect(
            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
            child: Stack(
              children: [
                Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: CbColors.surfacePressed,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                  ),
                ),
                FractionallySizedBox(
                  widthFactor: clamped,
                  child: Container(
                    height: 8,
                    decoration: BoxDecoration(
                      color:        barColor,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CbMiniChart extends StatelessWidget {
  const CbMiniChart({
    super.key,
    required this.values,
    required this.labels,
    required this.semanticLabel,
  });

  final List<double> values; // 0.0–100.0
  final List<String> labels; // One per bar
  final String semanticLabel;

  static const _colors = [
    CbColors.dataviz1,
    CbColors.dataviz2,
    CbColors.dataviz3,
    CbColors.dataviz4,
    CbColors.dataviz5,
  ];

  @override
  Widget build(BuildContext context) {
    final maxV = values.fold<double>(1, (m, v) => v > m ? v : m);
    final desc = List.generate(
      values.length,
      (i) => '${labels[i]}: ${values[i].toStringAsFixed(0)}',
    ).join(', ');

    return Semantics(
      label: '$semanticLabel. $desc',
      child: SizedBox(
        height: 80,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: List.generate(values.length, (i) {
            final h = (values[i] / maxV).clamp(0.04, 1.0);
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Align(
                        alignment: Alignment.bottomCenter,
                        child: FractionallySizedBox(
                          heightFactor: h,
                          child: Container(
                            decoration: BoxDecoration(
                              color: _colors[i % _colors.length],
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(CbSpacing.radiusXs),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: CbSpacing.s1),
                    Text(
                      labels[i],
                      style: GoogleFonts.plusJakartaSans(fontSize: 10, color: CbColors.textSecondary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE STAGE CHIP
// ══════════════════════════════════════════════════════════════════════════════

class CbLiveStageChip extends StatefulWidget {
  const CbLiveStageChip({
    super.key,
    required this.stageName,
    this.isLive = false,
    this.onTap,
  });

  final String stageName;
  final bool isLive;
  final VoidCallback? onTap;

  @override
  State<CbLiveStageChip> createState() => _CbLiveStageChipState();
}

class _CbLiveStageChipState extends State<CbLiveStageChip>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: CbMotion.livePulseDuration,
    );
    _pulse = Tween<double>(begin: 1, end: 0.6).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (widget.isLive && !MediaQuery.of(context).disableAnimations) {
      _ctrl.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bg = widget.isLive ? CbColors.liveSurface : CbColors.surfaceCard;
    final textColor = widget.isLive ? CbColors.liveText : CbColors.textSecondary;
    final borderColor = widget.isLive ? CbColors.accentPrimary : CbColors.borderSubtle;
    final label = widget.isLive
        ? 'Live stage: ${widget.stageName}'
        : 'Stage: ${widget.stageName}';

    final Widget chip = Container(
      height:  28,
      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s3),
      decoration: BoxDecoration(
        color:        bg,
        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
        border:       Border.all(color: borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.isLive) ...[
            AnimatedBuilder(
              animation: _pulse,
              builder: (_, _) => Opacity(
                opacity: _pulse.value,
                child: Container(
                  width:  8,
                  height: 8,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: CbColors.statusLive,
                  ),
                ),
              ),
            ),
            const SizedBox(width: CbSpacing.s2),
            Text(
              'LIVE',
              style: GoogleFonts.plusJakartaSans(
                fontSize:      10,
                fontWeight:    FontWeight.w800,
                color:         CbColors.accentPrimary,
                letterSpacing: 0.1,
              ),
            ),
            const SizedBox(width: CbSpacing.s1_5),
          ] else ...[
            Container(
              width: 8, height: 8,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: CbColors.borderDefault,
              ),
            ),
            const SizedBox(width: CbSpacing.s2),
          ],
          Text(
            widget.stageName,
            style: GoogleFonts.plusJakartaSans(
              fontSize:   14,
              fontWeight: FontWeight.w500,
              color:      textColor,
            ),
          ),
        ],
      ),
    );

    return Semantics(
      label:   label,
      button:  widget.onTap != null,
      child: widget.onTap != null
          ? GestureDetector(onTap: widget.onTap, child: chip)
          : chip,
    );
  }
}
