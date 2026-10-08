// Crowdbeats V2 — Creator Recovery Card (Phase 10)
//
// Accessible, high-contrast visual card providing actionable recovery UI for:
// - Reconnecting (network lost, exponential retry in flight, lease active)
// - Needs permission (location toggled off in OS settings or downgraded)
// - Needs re-verification (geofence boundary exit or lease interruption)
// - Expired (session TTL lease ended)
// - Ended by Admin (administrative force-end)

import 'package:flutter/material.dart';
import '../../../data/services/session_reconciliation_service.dart';

class CreatorRecoveryCard extends StatelessWidget {
  const CreatorRecoveryCard({
    super.key,
    required this.recoveryState,
    this.onRetry,
    this.onOpenSettings,
    this.onReverify,
    this.onStartNewSession,
    this.onContactSupport,
    this.errorMessage,
  });

  final CreatorRecoveryState recoveryState;
  final VoidCallback? onRetry;
  final VoidCallback? onOpenSettings;
  final VoidCallback? onReverify;
  final VoidCallback? onStartNewSession;
  final VoidCallback? onContactSupport;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    if (recoveryState == CreatorRecoveryState.connected) {
      return const SizedBox.shrink();
    }

    final config = _getRecoveryConfig(recoveryState);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: config.backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: config.borderColor, width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(config.icon, color: config.iconColor, size: 24),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    config.title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: config.textColor,
                    ),
                  ),
                ),
                if (recoveryState == CreatorRecoveryState.reconnecting)
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.amber),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage ?? config.description,
              style: TextStyle(
                fontSize: 14,
                color: config.textColor.withValues(alpha: 0.9),
                height: 1.3,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                FilledButton.tonal(
                  style: FilledButton.styleFrom(
                    backgroundColor: config.buttonColor,
                    foregroundColor: config.buttonTextColor,
                    textStyle: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  onPressed: () {
                    switch (recoveryState) {
                      case CreatorRecoveryState.reconnecting:
                        onRetry?.call();
                      case CreatorRecoveryState.needsPermission:
                        onOpenSettings?.call();
                      case CreatorRecoveryState.needsReverification:
                        onReverify?.call();
                      case CreatorRecoveryState.expired:
                        onStartNewSession?.call();
                      case CreatorRecoveryState.endedByAdmin:
                        onContactSupport?.call();
                      case CreatorRecoveryState.connected:
                        break;
                    }
                  },
                  child: Text(config.actionLabel),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  _RecoveryUIConfig _getRecoveryConfig(CreatorRecoveryState state) {
    switch (state) {
      case CreatorRecoveryState.reconnecting:
        return const _RecoveryUIConfig(
          title: 'Reconnecting Live Stream',
          description:
              'Weak connection or service lost. Retrying automatically. Your live session lease remains active.',
          actionLabel: 'Retry Now',
          icon: Icons.wifi_off_rounded,
          iconColor: Colors.amber,
          backgroundColor: Color(0xFF2E2415),
          borderColor: Colors.amber,
          textColor: Color(0xFFFDE68A),
          buttonColor: Colors.amber,
          buttonTextColor: Colors.black87,
        );
      case CreatorRecoveryState.needsPermission:
        return const _RecoveryUIConfig(
          title: 'Location Permission Required',
          description:
              'Device location was disabled or downgraded to approximate in system settings. Precise location is required for live map updates.',
          actionLabel: 'Open OS Settings',
          icon: Icons.location_off_rounded,
          iconColor: Colors.orangeAccent,
          backgroundColor: Color(0xFF2E1C15),
          borderColor: Colors.orangeAccent,
          textColor: Color(0xFFFED7AA),
          buttonColor: Colors.orangeAccent,
          buttonTextColor: Colors.black87,
        );
      case CreatorRecoveryState.needsReverification:
        return const _RecoveryUIConfig(
          title: 'Re-verification Needed',
          description:
              'You exited the venue perimeter or your session lease was interrupted. Please check in again to re-verify proximity.',
          actionLabel: 'Check In Now',
          icon: Icons.verified_user_outlined,
          iconColor: Colors.lightBlueAccent,
          backgroundColor: Color(0xFF15222E),
          borderColor: Colors.lightBlueAccent,
          textColor: Color(0xFFBAE6FD),
          buttonColor: Colors.lightBlueAccent,
          buttonTextColor: Colors.black87,
        );
      case CreatorRecoveryState.expired:
        return const _RecoveryUIConfig(
          title: 'Session Expired',
          description:
              'Your live stage session lease has expired. Fans can no longer view your live pin on the map.',
          actionLabel: 'Start New Session',
          icon: Icons.timer_off_outlined,
          iconColor: Colors.grey,
          backgroundColor: Color(0xFF222222),
          borderColor: Colors.grey,
          textColor: Color(0xFFE5E7EB),
          buttonColor: Color(0xFF4B5563),
          buttonTextColor: Colors.white,
        );
      case CreatorRecoveryState.endedByAdmin:
        return const _RecoveryUIConfig(
          title: 'Session Ended by Admin',
          description:
              'Your live session was terminated by Crowdbeats moderation. Private operational location coordinates were destroyed.',
          actionLabel: 'Contact Support',
          icon: Icons.gavel_rounded,
          iconColor: Colors.redAccent,
          backgroundColor: Color(0xFF2E1515),
          borderColor: Colors.redAccent,
          textColor: Color(0xFFFECACA),
          buttonColor: Colors.redAccent,
          buttonTextColor: Colors.white,
        );
      case CreatorRecoveryState.connected:
        return const _RecoveryUIConfig(
          title: 'Connected',
          description: '',
          actionLabel: '',
          icon: Icons.check,
          iconColor: Colors.green,
          backgroundColor: Colors.transparent,
          borderColor: Colors.transparent,
          textColor: Colors.white,
          buttonColor: Colors.white,
          buttonTextColor: Colors.black,
        );
    }
  }
}

class _RecoveryUIConfig {
  const _RecoveryUIConfig({
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
    required this.buttonColor,
    required this.buttonTextColor,
  });

  final String title;
  final String description;
  final String actionLabel;
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;
  final Color buttonColor;
  final Color buttonTextColor;
}
