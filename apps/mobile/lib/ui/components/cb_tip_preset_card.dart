// Crowdbeats V2 — Stitch Authoritative Tip Preset Card (Project 5326179813018056505)
// Amount selector tile ($5, $10, $20, Custom) with glowing selected purple border and heart/star icons.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CbTipPresetCard extends StatelessWidget {
  const CbTipPresetCard({
    super.key,
    required this.amountLabel,
    required this.isSelected,
    required this.onTap,
    this.icon,
    this.badgeText,
    this.semanticLabel,
  });

  final String amountLabel;
  final bool isSelected;
  final VoidCallback onTap;
  final Widget? icon;
  final String? badgeText;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: isSelected,
      label: semanticLabel ?? 'Tip preset $amountLabel',
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          curve: Curves.easeInOut,
          padding: const EdgeInsets.symmetric(
            horizontal: CbSpacing.s3,
            vertical: CbSpacing.s3_5,
          ),
          decoration: BoxDecoration(
            color: CbColors.surface2,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            border: Border.all(
              color: isSelected ? CbColors.purpleMain : CbColors.borderSubtle,
              width: isSelected ? 2.0 : 1.0,
            ),
            boxShadow: isSelected
                ? const [
                    BoxShadow(
                      color: CbColors.purpleGlow,
                      blurRadius: 16,
                      spreadRadius: -2,
                      offset: Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              if (badgeText != null)
                Positioned(
                  top: -8,
                  right: -8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: CbColors.purpleMain,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                    child: Text(
                      badgeText!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      amountLabel,
                      style: TextStyle(
                        color: isSelected ? CbColors.textPrimary : CbColors.textSecondary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    icon ??
                        Icon(
                          isSelected ? Icons.favorite : Icons.favorite_border,
                          size: 16,
                          color: isSelected ? CbColors.purpleLight : CbColors.textMuted,
                        ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
