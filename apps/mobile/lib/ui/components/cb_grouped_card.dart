// Crowdbeats V2 — Grouped Card Container Component
//
// Implements the Uber/Lyft grouped card pattern from Stitch Mobile Authority:
// Solid obsidian container (#161B22), 12px border radius, 1px subtle hairline stroke (rgba(255,255,255,0.08)),
// and automated inset hairline dividers between child rows.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CbGroupedCard extends StatelessWidget {
  const CbGroupedCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.borderColor,
    this.borderRadius = 12.0,
  });

  /// Factory constructor that automatically places subtle 1px hairline dividers
  /// between rows with an optional left indent (matching Uber/Lyft list styling).
  factory CbGroupedCard.divided({
    Key? key,
    required List<Widget> children,
    double dividerIndent = 16.0,
    double dividerEndIndent = 16.0,
    EdgeInsetsGeometry? margin,
    Color? backgroundColor,
    Color? borderColor,
    double borderRadius = 12.0,
  }) {
    final dividedChildren = <Widget>[];
    for (int i = 0; i < children.length; i++) {
      dividedChildren.add(children[i]);
      if (i < children.length - 1) {
        dividedChildren.add(
          Divider(
            height: 1.0,
            thickness: 1.0,
            indent: dividerIndent,
            endIndent: dividerEndIndent,
            color: borderColor ?? CbColors.outlineVariant,
          ),
        );
      }
    }

    return CbGroupedCard(
      key: key,
      margin: margin,
      padding: EdgeInsets.zero,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderRadius: borderRadius,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: dividedChildren,
      ),
    );
  }

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? backgroundColor;
  final Color? borderColor;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveBg = backgroundColor ??
        (isDark ? CbColors.surfaceContainer : Colors.white);
    final effectiveBorder = borderColor ??
        (isDark ? CbColors.outlineVariant : const Color(0x1A000000));

    return Container(
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
      decoration: BoxDecoration(
        color: effectiveBg,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: effectiveBorder,
          width: 1.0,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: padding == null
          ? child
          : Padding(
              padding: padding!,
              child: child,
            ),
    );
  }
}
