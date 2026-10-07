// Crowdbeats V2 — Permission Education Screens (Phase 5)
//
// Shown BEFORE triggering OS permission dialogs.
// Pattern: explain WHY → explain WHAT happens if denied → show OS prompt.
//
// Usage:
//   final granted = await PermissionEducationSheet.show(
//     context,
//     permission: CbPermission.camera,
//   );
//
// Architecture:
// - Never show OS dialog without first showing education sheet
// - Never deny access silently — always show recovery path if denied
// - Permission state is NEVER stored in Firestore — OS manages it

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

// ── Permission types ──────────────────────────────────────────────────────────

enum CbPermission {
  camera,
  location,
  notification,
}

extension CbPermissionDetails on CbPermission {
  String get icon {
    switch (this) {
      case CbPermission.camera:       return '📷';
      case CbPermission.location:     return '📍';
      case CbPermission.notification: return '🔔';
    }
  }

  String get title {
    switch (this) {
      case CbPermission.camera:       return 'Camera Access';
      case CbPermission.location:     return 'Location Access';
      case CbPermission.notification: return 'Notifications';
    }
  }

  String get reason {
    switch (this) {
      case CbPermission.camera:
        return 'Crowdbeats uses your camera so you can scan QR codes at live shows to '
          'tip artists directly — no manual entry required.';
      case CbPermission.location:
        return 'Crowdbeats uses your location to show you nearby shows and artists '
          'performing around you right now.';
      case CbPermission.notification:
        return 'Crowdbeats sends you alerts when an artist you follow goes live nearby, '
          'when you receive a tip, or when a show you bookmarked starts soon.';
    }
  }

  String get deniedMessage {
    switch (this) {
      case CbPermission.camera:
        return 'Without camera access, you\'ll need to enter tip codes manually. '
          'You can enable it in Settings → Crowdbeats → Camera.';
      case CbPermission.location:
        return 'Without location, we can\'t show nearby shows. '
          'You can enable it in Settings → Crowdbeats → Location.';
      case CbPermission.notification:
        return 'Without notifications, you won\'t be alerted to nearby live shows. '
          'You can enable them in Settings → Crowdbeats → Notifications.';
    }
  }

  String get allowLabel {
    switch (this) {
      case CbPermission.camera:       return 'Allow camera access';
      case CbPermission.location:     return 'Allow location';
      case CbPermission.notification: return 'Allow notifications';
    }
  }
}

// ── Education sheet ──────────────────────────────────────────────────────────

/// Shows a permission education bottom sheet.
/// Returns true if the user taps "Allow", false if they tap "Skip for now".
/// Does NOT trigger the OS permission dialog — caller is responsible for
/// calling the relevant permission plugin after this returns true.
class PermissionEducationSheet extends StatelessWidget {
  final CbPermission permission;

  const PermissionEducationSheet({super.key, required this.permission});

  /// Convenience static method: shows the sheet and returns the user's choice.
  static Future<bool> show(BuildContext context, {required CbPermission permission}) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PermissionEducationSheet(permission: permission),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1C1C1E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(
        CbSpacing.s6, CbSpacing.s4, CbSpacing.s6,
        MediaQuery.of(context).viewInsets.bottom + CbSpacing.s6,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: CbColors.borderSubtle,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: CbSpacing.s5),

          // Icon + title
          Row(children: [
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(
                color: CbColors.accentPrimary.withAlpha(25),
                borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                border: Border.all(color: CbColors.accentPrimary.withAlpha(60)),
              ),
              child: Center(child: Text(permission.icon, style: const TextStyle(fontSize: 28))),
            ),
            const SizedBox(width: CbSpacing.s4),
            Expanded(
              child: Text(
                permission.title,
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
          ]),
          const SizedBox(height: CbSpacing.s5),

          // Why we need it
          Text('Why Crowdbeats needs this', style: theme.textTheme.labelMedium?.copyWith(color: CbColors.textTertiary, letterSpacing: 0.5)),
          const SizedBox(height: CbSpacing.s2),
          Text(permission.reason, style: theme.textTheme.bodyMedium?.copyWith(height: 1.5)),

          const SizedBox(height: CbSpacing.s5),

          // What happens if denied
          Container(
            padding: const EdgeInsets.all(CbSpacing.s3),
            decoration: BoxDecoration(
              color: CbColors.surfaceCard,
              borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
              border: Border.all(color: CbColors.borderSubtle),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('ℹ️', style: TextStyle(fontSize: 16)),
              const SizedBox(width: CbSpacing.s2),
              Expanded(
                child: Text(
                  permission.deniedMessage,
                  style: theme.textTheme.bodySmall?.copyWith(color: CbColors.textSecondary, height: 1.4),
                ),
              ),
            ]),
          ),

          const SizedBox(height: CbSpacing.s6),

          // Allow button
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: Text(permission.allowLabel),
          ),
          const SizedBox(height: CbSpacing.s3),

          // Skip
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Skip for now'),
          ),
        ],
      ),
    );
  }
}
