// Crowdbeats V2 — Reusable Settings Row & Section Components
//
// Compliant with Stitch Project 5326179813018056505
// Provides accessible >=56px touch targets, leading theme icon containers,
// subtitles, value chips, status badges, switches, and trailing navigation chevrons.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'cb_grouped_card.dart';

class CbSettingsSection extends StatelessWidget {
  const CbSettingsSection({
    super.key,
    required this.title,
    required this.children,
    this.showTopDivider = true,
    this.grouped = false,
  });

  final String title;
  final List<Widget> children;
  final bool showTopDivider;
  final bool grouped;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showTopDivider && !grouped) ...[
          const SizedBox(height: 16),
          const Divider(color: CbColors.borderSubtle, height: 1),
          const SizedBox(height: 16),
        ] else
          const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: CbColors.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
        ),
        const SizedBox(height: 6),
        if (grouped)
          CbGroupedCard.divided(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            children: children,
          )
        else
          ...children,
      ],
    );
  }
}

class CbSettingsRow extends StatelessWidget {
  const CbSettingsRow({
    super.key,
    required this.title,
    this.subtitle,
    required this.icon,
    this.iconColor = CbColors.primary,
    this.iconBgColor = CbColors.surfaceContainerHigh,
    this.valueText,
    this.statusBadge,
    this.statusBadgeColor,
    this.onTap,
    this.isSwitch = false,
    this.switchValue = false,
    this.onSwitchChanged,
    this.isDestructive = false,
    this.showChevron = true,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String? valueText;
  final String? statusBadge;
  final Color? statusBadgeColor;
  final VoidCallback? onTap;
  final bool isSwitch;
  final bool switchValue;
  final ValueChanged<bool>? onSwitchChanged;
  final bool isDestructive;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: !isSwitch && onTap != null,
      toggled: isSwitch ? switchValue : null,
      label: subtitle != null ? '$title, $subtitle' : title,
      value: valueText ?? (isSwitch ? (switchValue ? 'On' : 'Off') : null),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isSwitch ? () => onSwitchChanged?.call(!switchValue) : onTap,
          splashColor: CbColors.purpleDim,
          highlightColor: const Color(0x107C3AED),
        child: Container(
          constraints: const BoxConstraints(minHeight: 56),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              // Leading Icon Container
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isDestructive ? const Color(0x22EF4444) : iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDestructive ? const Color(0x44EF4444) : CbColors.borderSubtle,
                    width: 1,
                  ),
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: isDestructive ? CbColors.errorRed : iconColor,
                ),
              ),
              const SizedBox(width: 14),

              // Title & Subtitle Column
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: isDestructive ? CbColors.errorRed : CbColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          color: CbColors.textSecondary,
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Status Badge (if any)
              if (statusBadge != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: (statusBadgeColor ?? CbColors.liveGreen).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: (statusBadgeColor ?? CbColors.liveGreen).withValues(alpha: 0.4),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    statusBadge!,
                    style: TextStyle(
                      color: statusBadgeColor ?? CbColors.liveGreen,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],

              // Value Text (if any)
              if (valueText != null) ...[
                Text(
                  valueText!,
                  style: const TextStyle(
                    color: CbColors.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 6),
              ],

              // Trailing Switch or Chevron
              if (isSwitch)
                Switch.adaptive(
                  value: switchValue,
                  onChanged: onSwitchChanged,
                  activeColor: CbColors.purpleMain,
                  activeTrackColor: CbColors.purpleLight.withValues(alpha: 0.5),
                )
              else if (showChevron && onTap != null)
                const Icon(
                  Icons.chevron_right,
                  color: Colors.white30,
                  size: 20,
                ),
            ],
          ),
        ),
      ),
    ),
    );
  }
}
