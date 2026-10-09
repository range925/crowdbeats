import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../theme/cb_theme.dart';
import '../theme/cb_typography.dart';
import 'package:google_fonts/google_fonts.dart';

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
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;

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
            color: isSelected ? ext.surfaceOverlay : ext.surfaceCard,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            border: Border.all(
              color: isSelected ? ext.borderFocus : ext.borderSubtle,
              width: isSelected ? 2.0 : 1.0,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: ext.borderFocus.withAlpha(60),
                      blurRadius: 16,
                      spreadRadius: -2,
                      offset: const Offset(0, 4),
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
                      color: ext.borderFocus,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                    child: Text(
                      badgeText!,
                      style: GoogleFonts.plusJakartaSans(
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
                      style: CbTypography.monoNumberMd(
                        color: isSelected ? ext.textPrimary : ext.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    icon ??
                        Icon(
                          isSelected ? Icons.favorite : Icons.favorite_border,
                          size: 16,
                          color: isSelected ? ext.borderFocus : ext.textTertiary,
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

