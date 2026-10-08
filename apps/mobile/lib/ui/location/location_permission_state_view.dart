// Crowdbeats V2 — Location Permission State View (Phase 3)
//
// Reusable widget presenting all 9 granular permission states:
// - notDetermined
// - servicesDisabled
// - denied
// - permanentlyDenied
// - restricted
// - foregroundApproximate
// - foregroundPrecise
// - backgroundApproximate
// - backgroundPrecise
//
// Adheres strictly to WCAG expectations: non-color cues, accessible labels,
// Dynamic Type support, and interactive recovery actions.

import 'package:flutter/material.dart';
import '../../data/services/location_provider.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class LocationPermissionStateView extends StatelessWidget {
  const LocationPermissionStateView({
    super.key,
    required this.state,
    this.onRequestPermission,
    this.onOpenSettings,
    this.onRequestPrecisionUpgrade,
  });

  final LocationPermissionState state;
  final VoidCallback? onRequestPermission;
  final VoidCallback? onOpenSettings;
  final VoidCallback? onRequestPrecisionUpgrade;

  IconData _iconForState(LocationPermissionState s) => switch (s) {
        LocationPermissionState.notDetermined => Icons.help_outline,
        LocationPermissionState.servicesDisabled => Icons.location_off,
        LocationPermissionState.denied => Icons.block,
        LocationPermissionState.permanentlyDenied => Icons.settings_suggest,
        LocationPermissionState.restricted => Icons.admin_panel_settings,
        LocationPermissionState.foregroundApproximate => Icons.trip_origin,
        LocationPermissionState.foregroundPrecise => Icons.my_location,
        LocationPermissionState.backgroundApproximate => Icons.track_changes,
        LocationPermissionState.backgroundPrecise => Icons.gps_fixed,
      };

  Color _colorForState(LocationPermissionState s) => switch (s) {
        LocationPermissionState.notDetermined => CbColors.textSecondary,
        LocationPermissionState.servicesDisabled => CbColors.statusWarning,
        LocationPermissionState.denied => CbColors.statusError,
        LocationPermissionState.permanentlyDenied => CbColors.statusError,
        LocationPermissionState.restricted => CbColors.statusWarning,
        LocationPermissionState.foregroundApproximate => CbColors.tealGas,
        LocationPermissionState.foregroundPrecise => CbColors.liveGreen,
        LocationPermissionState.backgroundApproximate => CbColors.rankGold,
        LocationPermissionState.backgroundPrecise => CbColors.liveGreen,
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final color = _colorForState(state);
    final icon = _iconForState(state);

    return Semantics(
      container: true,
      label: 'Location permission status: ${state.label}. ${state.accessibilityDescription}',
      child: Container(
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: isDark ? CbColors.surfaceCard : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(
            color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withAlpha(isDark ? 35 : 25),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                  ),
                  child: Icon(icon, size: 20, color: color),
                ),
                const SizedBox(width: CbSpacing.s3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              state.label,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: color.withAlpha(isDark ? 35 : 20),
                              borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
                              border: Border.all(color: color.withAlpha(80)),
                            ),
                            child: Text(
                              state.isGranted ? 'GRANTED' : 'INACTIVE',
                              style: TextStyle(
                                color: color,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        state.accessibilityDescription,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? CbColors.textSecondary : Colors.black54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: CbSpacing.s3),

            // Recovery / Contextual Action Button
            if (state.requiresSystemSettings) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  key: const Key('btn_permission_open_settings'),
                  icon: const Icon(Icons.settings, size: 16),
                  label: const Text('Open System Settings'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? CbColors.surface2 : const Color(0xFFE5E7EB),
                    foregroundColor: isDark ? Colors.white : Colors.black87,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: onOpenSettings,
                ),
              ),
            ] else if (state.canRequestInApp) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  key: const Key('btn_permission_request_in_app'),
                  icon: const Icon(Icons.touch_app, size: 16),
                  label: const Text('Grant Location Permission'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.accentPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: onRequestPermission,
                ),
              ),
            ] else if (state.isApproximate && onRequestPrecisionUpgrade != null) ...[
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  key: const Key('btn_permission_upgrade_precision'),
                  icon: const Icon(Icons.my_location, size: 16),
                  label: const Text('Upgrade to Precise Accuracy'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: isDark ? CbColors.tealGas : CbColors.stitchPurple,
                    side: BorderSide(
                      color: isDark ? CbColors.tealGas : CbColors.stitchPurple,
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: onRequestPrecisionUpgrade,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
