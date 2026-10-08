// Crowdbeats V2 — Fan Audience Visibility Sheet (Phase 3)
//
// Authoritative implementation of "Let this performer know I'm nearby".
// Requirements:
// 1. Shows which performer/session can see the Fan, which profile fields are shared,
//    approximate zone/distance band, and exact expiry time.
// 2. Separate choices: Anonymous Crowd Radar vs. Individual Visibility.
// 3. NEITHER OPTION IS PRESELECTED.
// 4. Neither is activated by Near Me, tipping, following, or saving.
// 5. Includes "Stop sharing", "Hide me from performers" stealth mode,
//    blocked-performer enforcement, and prompt revocation confirmation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/live_location.dart';
import '../../state/audience_visibility_state.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class FanAudienceVisibilitySheet extends ConsumerStatefulWidget {
  const FanAudienceVisibilitySheet({
    super.key,
    required this.sessionId,
    required this.performerId,
    required this.performerName,
    required this.sessionEndsAt,
  });

  final String sessionId;
  final String performerId;
  final String performerName;
  final DateTime sessionEndsAt;

  static Future<void> show(
    BuildContext context, {
    required String sessionId,
    required String performerId,
    required String performerName,
    required DateTime sessionEndsAt,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FanAudienceVisibilitySheet(
        sessionId: sessionId,
        performerId: performerId,
        performerName: performerName,
        sessionEndsAt: sessionEndsAt,
      ),
    );
  }

  @override
  ConsumerState<FanAudienceVisibilitySheet> createState() =>
      _FanAudienceVisibilitySheetState();
}

class _FanAudienceVisibilitySheetState
    extends ConsumerState<FanAudienceVisibilitySheet> {
  // Invariant 10: Neither option is preselected!
  AudienceConsentTier? _selectedTier;
  bool _isSubmitting = false;

  String _formatExpiry(DateTime dt) {
    final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute $ampm';
  }

  Future<void> _handleActivate() async {
    if (_selectedTier == null) return;
    setState(() => _isSubmitting = true);

    try {
      await ref.read(audienceVisibilityProvider.notifier).optIn(
            sessionId: widget.sessionId,
            performerId: widget.performerId,
            performerName: widget.performerName,
            tier: _selectedTier!,
            expiresAt: widget.sessionEndsAt,
          );

      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _selectedTier == AudienceConsentTier.aggregate
                      ? 'Added anonymous point to Crowd Radar for ${widget.performerName}.'
                      : 'You are now visible to ${widget.performerName} for this show.',
                ),
              ),
            ],
          ),
          backgroundColor: CbColors.statusLive,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not share visibility: $e'),
          backgroundColor: CbColors.statusError,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleStopSharing() async {
    setState(() => _isSubmitting = true);
    await ref.read(audienceVisibilityProvider.notifier).stopSharing();

    if (!mounted) return;
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.visibility_off, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Expanded(
              child: Text('Stopped sharing location. Access was promptly removed.'),
            ),
          ],
        ),
        backgroundColor: CbColors.purpleMain,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final visibilityState = ref.watch(audienceVisibilityProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final isCurrentlySharingWithThisSession =
        visibilityState.activeGrant?.sessionId == widget.sessionId &&
            visibilityState.activeGrant?.isActive == true;

    final isBlocked = ref
        .read(audienceVisibilityProvider.notifier)
        .isPerformerBlocked(widget.performerId);

    return Semantics(
      container: true,
      label: 'Audience Visibility and Privacy Controls',
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
              // Grab Handle
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

              // Title
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: CbColors.purpleDim,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    ),
                    child: const Icon(
                      Icons.radar,
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
                          'Audience Nearby',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        Text(
                          'Let ${widget.performerName} know you’re here',
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

              // Case A: Blocked Performer
              if (isBlocked) ...[
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s4),
                  decoration: BoxDecoration(
                    color: const Color(0x22EF4444),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: CbColors.statusError.withAlpha(80)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.block, color: CbColors.statusError, size: 24),
                      const SizedBox(width: CbSpacing.s3),
                      Expanded(
                        child: Text(
                          'You have blocked ${widget.performerName}. Location sharing is disabled.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: CbColors.statusError,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: CbSpacing.s4),
                OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Close'),
                ),
              ]
              // Case B: Stealth Mode Active
              else if (visibilityState.hideMeFromPerformers) ...[
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s4),
                  decoration: BoxDecoration(
                    color: const Color(0x22F59E0B),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: CbColors.rankGold.withAlpha(80)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.visibility_off,
                          color: CbColors.rankGold, size: 24),
                      const SizedBox(width: CbSpacing.s3),
                      Expanded(
                        child: Text(
                          'Stealth Mode ("Hide me from performers") is active in Settings. Turn it off to share location.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: CbSpacing.s4),
                OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Close'),
                ),
              ]
              // Case C: Currently Sharing with This Session
              else if (isCurrentlySharingWithThisSession) ...[
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s4),
                  decoration: BoxDecoration(
                    color: const Color(0x2210B981),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: CbColors.statusLive.withAlpha(80)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.check_circle,
                              color: CbColors.statusLive, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'ACTIVELY SHARING VISIBILITY',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: CbColors.statusLive,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Sharing ${visibilityState.activeGrant?.tier == AudienceConsentTier.individualSession ? "performer visibility (display name & avatar)" : "anonymous count"} with ${widget.performerName}.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? Colors.white70 : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Expires at ${_formatExpiry(widget.sessionEndsAt)} (when performance ends).',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: CbColors.textMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: CbSpacing.s4),
                ElevatedButton.icon(
                  key: const Key('btn_stop_sharing_visibility'),
                  icon: const Icon(Icons.stop_circle_outlined, size: 18),
                  label: const Text('Stop Sharing Location'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.statusError,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: _isSubmitting ? null : _handleStopSharing,
                ),
                const SizedBox(height: CbSpacing.s2),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Keep Active'),
                ),
              ]
              // Case D: Ready to Opt-In
              else ...[
                // Expiry and Session Info Card
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s3),
                  decoration: BoxDecoration(
                    color: isDark ? CbColors.surfaceCard : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    border: Border.all(
                      color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time,
                          size: 16, color: CbColors.textMuted),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Expires automatically at ${_formatExpiry(widget.sessionEndsAt)}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? CbColors.textSecondary : Colors.black54,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: CbSpacing.s4),

                Text(
                  'CHOOSE VISIBILITY LEVEL (SELECT ONE)',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: isDark ? CbColors.textSecondary : Colors.black54,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: CbSpacing.s2),

                // Choice 1: Anonymous Crowd Radar
                _buildChoiceTile(
                  key: const Key('choice_tier_aggregate'),
                  context,
                  tier: AudienceConsentTier.aggregate,
                  title: 'Anonymous Crowd Radar',
                  subtitle:
                      'Adds +1 to ${widget.performerName}’s approximate crowd demand count. Zero personal data, display name, or avatar is shared.',
                  icon: Icons.pie_chart_outline,
                ),
                const SizedBox(height: CbSpacing.s2),

                // Choice 2: Performer Approximate Visibility
                _buildChoiceTile(
                  key: const Key('choice_tier_individual'),
                  context,
                  tier: AudienceConsentTier.individualSession,
                  title: 'Performer Visibility',
                  subtitle:
                      'Allows ${widget.performerName} to see your display name and avatar in their nearby supporter list. Only a coarse distance band (~500m) is shared.',
                  icon: Icons.person_pin_circle_outlined,
                ),
                const SizedBox(height: CbSpacing.s4),

                // Truthful Non-Tying Disclaimer
                Container(
                  padding: const EdgeInsets.all(CbSpacing.s3),
                  decoration: BoxDecoration(
                    color: isDark ? CbColors.surfaceCard : const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    border: Border.all(
                      color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.shield_outlined,
                          size: 16, color: CbColors.tealGas),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Tipping, following, saving, or Near Me searches NEVER share your location. This setting applies only to this active performance.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? CbColors.textMuted : Colors.black54,
                            fontSize: 11,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: CbSpacing.s5),

                // Primary Activate Button (Disabled until an option is picked)
                ElevatedButton(
                  key: const Key('btn_activate_visibility'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _selectedTier != null
                        ? CbColors.accentPrimary
                        : (isDark ? const Color(0xFF2D2F3E) : const Color(0xFFE5E7EB)),
                    foregroundColor: _selectedTier != null
                        ? Colors.white
                        : (isDark ? Colors.white38 : Colors.black38),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    ),
                  ),
                  onPressed: _selectedTier != null && !_isSubmitting
                      ? _handleActivate
                      : null,
                  child: Text(
                    _selectedTier == null
                        ? 'Select an Option Above'
                        : 'Share Visibility for This Show',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: CbSpacing.s2),

                // Cancel Button
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(
                    'Cancel',
                    style: TextStyle(
                      color: isDark ? CbColors.textSecondary : Colors.black54,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChoiceTile(
    BuildContext context, {
    required Key key,
    required AudienceConsentTier tier,
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isSelected = _selectedTier == tier;

    return InkWell(
      key: key,
      onTap: () => setState(() => _selectedTier = tier),
      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
      child: Container(
        padding: const EdgeInsets.all(CbSpacing.s3_5),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? CbColors.purpleDim : const Color(0x1A7C3AED))
              : (isDark ? CbColors.surfaceCard : const Color(0xFFF9FAFB)),
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(
            color: isSelected
                ? CbColors.accentPrimary
                : (isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB)),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Radio<AudienceConsentTier>(
              value: tier,
              groupValue: _selectedTier,
              onChanged: (val) => setState(() => _selectedTier = val),
              activeColor: CbColors.accentPrimary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(icon,
                          size: 16,
                          color: isSelected
                              ? CbColors.accentPrimary
                              : (isDark ? Colors.white70 : Colors.black87)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          title,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? CbColors.textSecondary : Colors.black54,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
