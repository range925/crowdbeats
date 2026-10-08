// Crowdbeats V2 — Creator Audience Nearby Explanation Modal (Phase 3)
//
// Explains the two-way Crowd Radar experience to creators:
// 1. Distinguishes aggregate fan demand from individually opted-in supporters.
// 2. Explains the 5-fan minimum threshold (suppression below 5).
// 3. Truthfully states that Crowdbeats never implies showing every fan or tipper.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CreatorAudienceNearbyModal extends StatelessWidget {
  const CreatorAudienceNearbyModal({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const CreatorAudienceNearbyModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Semantics(
      container: true,
      label: 'Understanding Audience Nearby and Privacy Guarantees',
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

              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0x2210B981),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      border: Border.all(color: const Color(0x4410B981)),
                    ),
                    child: const Icon(
                      Icons.radar,
                      color: CbColors.statusLive,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'How Audience Nearby Works',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        Text(
                          'Understanding privacy-safe crowd signals',
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

              _buildExplanationItem(
                context,
                icon: Icons.groups_outlined,
                title: 'Aggregate Crowd Radar (Demand)',
                description:
                    'Shows coarse neighborhood cells where groups of fans are listening. To protect individual privacy, zones appear only when at least 5 fans are present.',
              ),
              const SizedBox(height: CbSpacing.s3),
              _buildExplanationItem(
                context,
                icon: Icons.person_pin_circle_outlined,
                title: 'Individually Opted-In Supporters',
                description:
                    'Supporters who appear with name and avatar have explicitly chosen to tap "Let this performer know I’m nearby" for your active performance session.',
              ),
              const SizedBox(height: CbSpacing.s3),
              _buildExplanationItem(
                context,
                icon: Icons.shield_outlined,
                title: 'Truth in Location: Not Every Fan is Visible',
                description:
                    'Crowdbeats respects fan privacy. Near Me searches, tipping, following, and attending do NOT share location. Never assume the radar reflects all in-person listeners.',
              ),
              const SizedBox(height: CbSpacing.s5),

              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.accentPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  ),
                ),
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Got It', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExplanationItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: isDark ? CbColors.tealGas : CbColors.stitchPurple),
        const SizedBox(width: CbSpacing.s3),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
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
