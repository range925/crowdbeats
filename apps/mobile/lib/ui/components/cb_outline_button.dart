// Crowdbeats V2 — Stitch Authoritative Outline Button (Project 5326179813018056505)
// Secondary outline pill button with vibrant purple border and transparent background.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CbOutlineButton extends StatelessWidget {
  const CbOutlineButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.leadingIcon,
    this.trailingIcon,
    this.isFullWidth = false,
    this.height = 44.0,
    this.borderColor = CbColors.purpleMain,
    this.textColor = CbColors.textPrimary,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final bool isFullWidth;
  final double height;
  final Color borderColor;
  final Color textColor;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final bool isEnabled = onPressed != null;

    final Widget content = Container(
      height: height,
      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
        border: Border.all(
          color: isEnabled ? borderColor : CbColors.borderSubtle,
          width: 1.5,
        ),
      ),
      child: Center(
        child: Row(
          mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (leadingIcon != null) ...[
              leadingIcon!,
              const SizedBox(width: CbSpacing.s2),
            ],
            Text(
              label,
              style: TextStyle(
                color: isEnabled ? textColor : CbColors.textMuted,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (trailingIcon != null) ...[
              const SizedBox(width: CbSpacing.s2),
              trailingIcon!,
            ],
          ],
        ),
      ),
    );

    return Semantics(
      button: true,
      enabled: isEnabled,
      label: semanticLabel ?? label,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
        splashColor: CbColors.purpleDim,
        highlightColor: CbColors.purpleDim,
        child: isFullWidth ? SizedBox(width: double.infinity, child: content) : content,
      ),
    );
  }
}
