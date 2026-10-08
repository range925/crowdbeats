// Crowdbeats V2 — Location Pre-Permission Dialog (Phase 3)
//
// Displayed to Solo Artists and Band members BEFORE triggering the OS location dialog.
// Explains:
// 1. What is collected (single one-shot GPS fix)
// 2. Why it is collected (confirming proximity within 200m of venue or street spot)
// 3. What fans see (canonical venue pin or coarse neighborhood zone)
// 4. When collection stops (immediately upon verification; kept alive via server lease)
//
// Enforces:
// - Default request is While In Use (foreground). Never asks for background/Always here.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'what_fans_will_see_card.dart';

class LocationPrePermissionDialog extends StatelessWidget {
  const LocationPrePermissionDialog({
    super.key,
    required this.isVenue,
    this.performerName,
    this.venueName,
    this.venueCityState,
    this.onContinue,
    this.onCancel,
  });

  final bool isVenue;
  final String? performerName;
  final String? venueName;
  final String? venueCityState;
  final VoidCallback? onContinue;
  final VoidCallback? onCancel;

  static Future<bool> show(
    BuildContext context, {
    required bool isVenue,
    String? performerName,
    String? venueName,
    String? venueCityState,
  }) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => LocationPrePermissionDialog(
        isVenue: isVenue,
        performerName: performerName,
        venueName: venueName,
        venueCityState: venueCityState,
        onContinue: () => Navigator.of(ctx).pop(true),
        onCancel: () => Navigator.of(ctx).pop(false),
      ),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Semantics(
      container: true,
      label: 'Location Access & Privacy Disclosure',
      child: Container(
        padding: EdgeInsets.fromLTRB(
          CbSpacing.s5,
          CbSpacing.s4,
          CbSpacing.s5,
          MediaQuery.of(context).viewInsets.bottom + CbSpacing.s6,
        ),
        decoration: BoxDecoration(
          color: isDark ? CbColors.surface1 : Colors.white,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(CbSpacing.radiusXl),
          ),
          border: Border.all(
            color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Sheet Grab Handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? CbColors.borderSubtle : Colors.black26,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Title with icon
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: CbColors.purpleDim,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    ),
                    child: const Icon(
                      Icons.verified_user_outlined,
                      color: CbColors.purpleLight,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Before Going Live',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        Text(
                          'How Crowdbeats protects your location',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? CbColors.textSecondary : Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s4),

              // Privacy Pillars List
              _buildPillar(
                context,
                icon: Icons.gps_fixed,
                title: 'What We Collect',
                body: isVenue
                    ? 'A single one-time device location sample to verify you are on-site.'
                    : 'A single one-time device location sample for your street performance spot.',
              ),
              const SizedBox(height: CbSpacing.s3),
              _buildPillar(
                context,
                icon: Icons.shield_outlined,
                title: 'Why We Need It',
                body: isVenue
                    ? 'To confirm you are within 200m of $venueName so fans find a real, verified show.'
                    : 'To position your performance on the map so nearby fans can discover you.',
              ),
              const SizedBox(height: CbSpacing.s3),
              _buildPillar(
                context,
                icon: Icons.timer_off_outlined,
                title: 'When Collection Stops',
                body: 'Immediately after verification! GPS is stopped at once. Your live status is maintained via server leases — never continuous GPS.',
              ),
              const SizedBox(height: CbSpacing.s4),

              // What fans will see preview card
              WhatFansWillSeeCard(
                isVenue: isVenue,
                venueName: venueName,
                venueCityState: venueCityState,
              ),
              const SizedBox(height: CbSpacing.s5),

              // Primary Continue Button
              ElevatedButton.icon(
                key: const Key('btn_pre_permission_continue'),
                icon: const Icon(Icons.check_circle_outline, size: 18),
                label: const Text(
                  'Allow While In Use & Check In',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.accentPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  ),
                ),
                onPressed: onContinue,
              ),
              const SizedBox(height: CbSpacing.s2),

              // Secondary Cancel Button
              TextButton(
                key: const Key('btn_pre_permission_cancel'),
                onPressed: onCancel,
                child: Text(
                  'Cancel',
                  style: TextStyle(
                    color: isDark ? CbColors.textSecondary : Colors.black54,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPillar(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String body,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: isDark ? CbColors.tealGas : CbColors.stitchPurple),
        const SizedBox(width: CbSpacing.s3),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                body,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark ? CbColors.textSecondary : Colors.black54,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
