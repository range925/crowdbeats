// Crowdbeats V2 — Shared Onboarding UI Components (Flutter Mobile)
//
// Implements the colorful, focused component system adhering to the
// Crowdbeats provisional palette:
// - Brand/primary: Violet #7C3AED
// - Secondary discovery: Cyan #0891B2
// - Creator energy: Amber #D97706
// - Community/bands: Blue #2563EB
// - Supporting expressive accent: Pink #DB2777
// - Light canvas: #F7F8FC | Dark canvas: #101218 | Dark card: #1B1E28

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

Color _accessibleBadgeColor(Color accentColor) {
  if (accentColor.value == CbColors.brandPrimary.value || accentColor.value == 0xFF7C3AED) {
    return const Color(0xFFC084FC); // Violet 300 (8.2:1 contrast against dark card)
  }
  if (accentColor.value == CbColors.communityBlue.value || accentColor.value == 0xFF2563EB) {
    return const Color(0xFF60A5FA); // Blue 400 (8.5:1 contrast)
  }
  if (accentColor.value == CbColors.expressivePink.value || accentColor.value == 0xFFDB2777) {
    return const Color(0xFFF472B6); // Pink 400 (7.8:1 contrast)
  }
  if (accentColor.value == CbColors.discoveryCyan.value || accentColor.value == 0xFF0891B2) {
    return const Color(0xFF22D3EE); // Cyan 400 (9.8:1 contrast)
  }
  return accentColor;
}

// ─── 1. RoleCard ──────────────────────────────────────────────────────────────

class RoleCard extends StatelessWidget {
  const RoleCard({
    super.key,
    required this.roleId,
    required this.title,
    this.badge,
    required this.description,
    required this.icon,
    required this.accentColor,
    required this.isSelected,
    required this.onTap,
    this.benefits,
    this.disabled = false,
  });

  final String roleId;
  final String title;
  final String? badge;
  final String description;
  final Widget icon;
  final Color accentColor;
  final bool isSelected;
  final VoidCallback onTap;
  final List<String>? benefits;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final benefitsText = (benefits != null && benefits!.isNotEmpty && isSelected)
        ? '. Key benefits: ${benefits!.join(", ")}'
        : '';
    final accessibleLabel = '$title${badge != null ? ", $badge badge" : ""}. $description$benefitsText';

    return Semantics(
      button: true,
      enabled: !disabled,
      selected: isSelected,
      label: accessibleLabel,
      child: InkWell(
        onTap: disabled ? null : onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isSelected
                ? accentColor.withValues(alpha: 0.08)
                : CbColors.darkCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? accentColor : CbColors.borderSubtle,
              width: isSelected ? 2.0 : 1.0,
            ),
            boxShadow: [
              if (isSelected)
                BoxShadow(
                  color: accentColor.withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                )
              else
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: accentColor.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: icon,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            Text(
                              title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (badge != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: accentColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                    color: accentColor.withValues(alpha: 0.4),
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  badge!,
                                  style: TextStyle(
                                    color: _accessibleBadgeColor(accentColor),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          description,
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 13,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isSelected ? accentColor : Colors.transparent,
                      border: Border.all(
                        color: isSelected ? accentColor : const Color(0xFF52525B),
                        width: 2,
                      ),
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                        : null,
                  ),
                ],
              ),
              if (benefits != null && benefits!.isNotEmpty && isSelected) ...[
                const SizedBox(height: 12),
                const Divider(color: Color(0x1AFFFFFF), height: 1),
                const SizedBox(height: 10),
                ...benefits!.map(
                  (b) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Text('✦ ', style: TextStyle(color: accentColor, fontSize: 12)),
                        Expanded(
                          child: Text(
                            b,
                            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                          ),
                        ),
                      ],
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
}

// ─── 2. GenreChip ─────────────────────────────────────────────────────────────

class GenreChip extends StatelessWidget {
  const GenreChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.accentColor = CbColors.brandPrimary,
    this.icon,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color accentColor;
  final String? icon;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: isSelected,
      label: '$label genre',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44, minWidth: 44),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? accentColor : const Color(0xFF1E2032),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: isSelected ? accentColor : const Color(0xFF2B2D44),
              width: 1.5,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: accentColor.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Text(icon!, style: const TextStyle(fontSize: 13)),
                const SizedBox(width: 4),
              ],
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFFCBD5E1),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (isSelected) ...[
                const SizedBox(width: 4),
                const Icon(Icons.check, size: 14, color: Colors.white),
              ],
            ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── 3. LocationCard ──────────────────────────────────────────────────────────

class LocationCard extends StatelessWidget {
  const LocationCard({
    super.key,
    this.currentCity,
    required this.onUseMyLocation,
    required this.onSearchPlace,
    this.isLoadingLocation = false,
    this.locationError,
  });

  final String? currentCity;
  final VoidCallback onUseMyLocation;
  final VoidCallback onSearchPlace;
  final bool isLoadingLocation;
  final String? locationError;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: CbColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF2B2D44)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: CbColors.discoveryCyan.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: CbColors.discoveryCyan.withValues(alpha: 0.3),
                  ),
                ),
                alignment: Alignment.center,
                child: const Text('📍', style: TextStyle(fontSize: 18)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Find live music near you',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      currentCity != null
                          ? 'Current anchor: $currentCity'
                          : 'Set a coarse location to surface nearby stages.',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isLoadingLocation ? null : onUseMyLocation,
                  icon: isLoadingLocation
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('🎯', style: TextStyle(fontSize: 14)),
                  label: Text(isLoadingLocation ? 'Locating...' : 'Use my location'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: CbColors.discoveryCyan.withValues(alpha: 0.12),
                    side: const BorderSide(color: CbColors.discoveryCyan, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onSearchPlace,
                  icon: const Text('🔍', style: TextStyle(fontSize: 14)),
                  label: const Text('Search place'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFCBD5E1),
                    backgroundColor: const Color(0xFF151722),
                    side: const BorderSide(color: Color(0xFF2B2D44)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
          if (locationError != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: CbColors.errorRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                locationError!,
                style: const TextStyle(color: Color(0xFFF87171), fontSize: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── 4. ProgressHeader ────────────────────────────────────────────────────────

class ProgressHeader extends StatelessWidget {
  const ProgressHeader({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    this.stepName,
    required this.title,
    this.subtitle,
    this.onBack,
    this.accentColor = CbColors.brandPrimary,
  });

  final int currentStep;
  final int totalSteps;
  final String? stepName;
  final String title;
  final String? subtitle;
  final VoidCallback? onBack;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final progress = currentStep / totalSteps;
    final pct = (progress * 100).round();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (onBack != null)
              IconButton(
                onPressed: onBack,
                tooltip: 'Back',
                icon: const Icon(Icons.arrow_back, color: Color(0xFFCBD5E1), size: 20),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2032),
                  padding: const EdgeInsets.all(12),
                  minimumSize: const Size(48, 48),
                ),
              )
            else
              const SizedBox(width: 48),
            Row(
              children: [
                Text(
                  stepName ?? 'STEP $currentStep OF $totalSteps',
                  style: TextStyle(
                    color: _accessibleBadgeColor(accentColor),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '($pct%)',
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: const Color(0xFF27272A),
            valueColor: AlwaysStoppedAnimation<Color>(accentColor),
            minHeight: 6,
          ),
        ),
        const SizedBox(height: 20),
        Semantics(
          header: true,
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14, height: 1.4),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

// ─── 5. ProfilePhotoPicker ────────────────────────────────────────────────────

class ProfilePhotoPicker extends StatelessWidget {
  const ProfilePhotoPicker({
    super.key,
    this.photoUrl,
    required this.name,
    required this.onTapUpload,
    this.onTapRemove,
    this.accentColor = CbColors.brandPrimary,
  });

  final String? photoUrl;
  final String name;
  final VoidCallback onTapUpload;
  final VoidCallback? onTapRemove;
  final Color accentColor;

  String get _initials {
    final parts = name.trim().split(' ').where((s) => s.isNotEmpty).toList();
    if (parts.isEmpty) return 'CB';
    if (parts.length == 1) return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Stack(
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF1E2032),
                border: Border.all(color: accentColor, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: accentColor.withValues(alpha: 0.25),
                    blurRadius: 16,
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: photoUrl != null
                  ? ClipOval(
                      child: Image.network(photoUrl!, width: 76, height: 76, fit: BoxFit.cover),
                    )
                  : Text(
                      _initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
            Positioned(
              bottom: -4,
              right: -4,
              child: Semantics(
                button: true,
                label: photoUrl != null ? 'Change profile photo' : 'Upload profile photo',
                child: InkWell(
                  onTap: onTapUpload,
                  customBorder: const CircleBorder(),
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: accentColor,
                        border: Border.all(color: CbColors.darkCanvas, width: 2),
                      ),
                      child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Profile Photo',
                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              const Text(
                'Optional. Displayed with your public tips & follows.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  InkWell(
                    onTap: onTapUpload,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                      child: Text(
                        photoUrl != null ? 'Change photo' : 'Upload photo',
                        style: TextStyle(
                          color: _accessibleBadgeColor(accentColor),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),
                  if (photoUrl != null && onTapRemove != null) ...[
                    const SizedBox(width: 12),
                    InkWell(
                      onTap: onTapRemove,
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                        child: Text(
                          'Remove',
                          style: TextStyle(color: Color(0xFFF87171), fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── 6. SetupChecklist ────────────────────────────────────────────────────────

class SetupChecklistCard extends StatelessWidget {
  const SetupChecklistCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.status,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String subtitle;
  final String status; // 'ready', 'pending', 'action_required', 'optional', 'blocked'
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final (badgeText, badgeColor) = switch (status) {
      'ready' => ('Ready', const Color(0xFF10B981)),
      'pending' => ('In Review', const Color(0xFFFBBF24)),
      'action_required' => ('Action Needed', const Color(0xFFF87171)),
      'optional' => ('Optional', const Color(0xFF22D3EE)),
      _ => ('Blocked', const Color(0xFF94A3B8)),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CbColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2B2D44)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
                      ),
                      child: Text(
                        badgeText,
                        style: TextStyle(
                          color: badgeColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, height: 1.3),
                ),
              ],
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 10),
            ElevatedButton(
              onPressed: onAction,
              style: ElevatedButton.styleFrom(
                backgroundColor: status == 'action_required'
                    ? const Color(0xFFD97706)
                    : const Color(0xFF27272A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                minimumSize: const Size(60, 44),
              ),
              child: Text(actionLabel!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── 7. InlineValidation ──────────────────────────────────────────────────────

class InlineValidation extends StatelessWidget {
  const InlineValidation({
    super.key,
    required this.state,
    this.message,
  });

  final String state; // 'valid', 'invalid', 'checking', 'idle'
  final String? message;

  @override
  Widget build(BuildContext context) {
    if (state == 'idle' || message == null || message!.isEmpty) {
      return const SizedBox.shrink();
    }

    final (color, icon) = switch (state) {
      'valid' => (const Color(0xFF10B981), '✓'),
      'invalid' => (const Color(0xFFF87171), '⚠️'),
      _ => (const Color(0xFF22D3EE), '⏳'),
    };

    return Semantics(
      liveRegion: true,
      child: Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Row(
          children: [
            ExcludeSemantics(child: Text(icon, style: TextStyle(color: color, fontSize: 12))),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                message!,
                style: TextStyle(color: color, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── 8. StickyActionBar ───────────────────────────────────────────────────────

class StickyActionBar extends StatelessWidget {
  const StickyActionBar({
    super.key,
    required this.primaryLabel,
    required this.onPrimary,
    this.primaryDisabled = false,
    this.primaryLoading = false,
    this.secondaryLabel,
    this.onSecondary,
    this.disclaimer,
    this.accentColor = CbColors.brandPrimary,
  });

  final String primaryLabel;
  final VoidCallback onPrimary;
  final bool primaryDisabled;
  final bool primaryLoading;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final String? disclaimer;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        color: Color(0xF2101218),
        border: Border(top: BorderSide(color: Color(0x1AFFFFFF))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              if (secondaryLabel != null && onSecondary != null) ...[
                Expanded(
                  flex: 1,
                  child: OutlinedButton(
                    onPressed: onSecondary,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFCBD5E1),
                      side: const BorderSide(color: Color(0xFF2B2D44)),
                      backgroundColor: const Color(0xFF1E2032),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(secondaryLabel!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: primaryDisabled || primaryLoading ? null : onPrimary,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: accentColor,
                    disabledBackgroundColor: const Color(0xFF27272A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                  ),
                  child: primaryLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          primaryLabel,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                ),
              ),
            ],
          ),
          if (disclaimer != null) ...[
            const SizedBox(height: 8),
            Text(
              disclaimer!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── 9. SuccessPanel ──────────────────────────────────────────────────────────

class SuccessChecklistItem {
  const SuccessChecklistItem({required this.label, required this.isDone});
  final String label;
  final bool isDone;
}

class SuccessPanel extends StatelessWidget {
  const SuccessPanel({
    super.key,
    required this.title,
    required this.subtitle,
    this.badgeText = 'PROFILE READY',
    this.accentColor = CbColors.brandPrimary,
    required this.items,
    this.savedTipBanner,
    required this.primaryLabel,
    required this.onPrimary,
    this.secondaryLabel,
    this.onSecondary,
  });

  final String title;
  final String subtitle;
  final String badgeText;
  final Color accentColor;
  final List<SuccessChecklistItem> items;
  final Widget? savedTipBanner;
  final String primaryLabel;
  final VoidCallback onPrimary;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: CbColors.darkCard,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: accentColor.withValues(alpha: 0.3)),
            boxShadow: [
              BoxShadow(
                color: accentColor.withValues(alpha: 0.15),
                blurRadius: 30,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: accentColor, width: 2),
                  ),
                  alignment: Alignment.center,
                  child: Icon(Icons.check_circle_rounded, color: accentColor, size: 36),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: accentColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    badgeText,
                    style: TextStyle(
                      color: accentColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF151722),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF2B2D44)),
                ),
                child: Column(
                  children: items
                      .map(
                        (item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Icon(
                                item.isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                                size: 16,
                                color: item.isDone ? const Color(0xFF10B981) : const Color(0xFF64748B),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  item.label,
                                  style: TextStyle(
                                    color: item.isDone ? Colors.white : const Color(0xFF94A3B8),
                                    fontSize: 13,
                                    fontWeight: item.isDone ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              if (savedTipBanner != null) ...[
                const SizedBox(height: 16),
                savedTipBanner!,
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onPrimary,
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                ),
                child: Text(primaryLabel, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ),
              if (secondaryLabel != null && onSecondary != null) ...[
                const SizedBox(height: 10),
                TextButton(
                  onPressed: onSecondary,
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF94A3B8),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: Text(secondaryLabel!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─── 10. PermissionExplainer ──────────────────────────────────────────────────

class PermissionExplainer extends StatelessWidget {
  const PermissionExplainer({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.privacyNote,
    required this.onAllow,
    required this.onManualSearch,
    this.allowLabel = 'Enable Location',
    this.manualLabel = 'Search by City Instead',
    this.accentColor = CbColors.discoveryCyan,
  });

  final Widget icon;
  final String title;
  final String description;
  final String privacyNote;
  final VoidCallback onAllow;
  final VoidCallback onManualSearch;
  final String allowLabel;
  final String manualLabel;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: CbColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accentColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: accentColor.withValues(alpha: 0.3)),
                ),
                alignment: Alignment.center,
                child: icon,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      description,
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.3),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF151722),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('🔒 ', style: TextStyle(fontSize: 12)),
                Expanded(
                  child: Text(
                    privacyNote,
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, height: 1.3),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: onAllow,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: accentColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(allowLabel, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: onManualSearch,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFCBD5E1),
                    backgroundColor: const Color(0xFF1E2032),
                    side: const BorderSide(color: Color(0xFF2B2D44)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(manualLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── 11. PerformerOnboardingCard ──────────────────────────────────────────────

class PerformerOnboardingCard extends StatelessWidget {
  const PerformerOnboardingCard({
    super.key,
    required this.id,
    required this.name,
    required this.genre,
    this.isLive = false,
    this.distance,
    this.photoUrl,
    required this.isSelected,
    required this.onToggle,
  });

  final String id;
  final String name;
  final String genre;
  final bool isLive;
  final String? distance;
  final String? photoUrl;
  final bool isSelected;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final statusText = isLive ? ', currently live' : '';
    final distanceText = distance != null ? ', $distance' : '';
    final accessibleLabel = '$name, $genre$distanceText$statusText';

    return Semantics(
      button: true,
      selected: isSelected,
      label: accessibleLabel,
      child: InkWell(
        onTap: onToggle,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? CbColors.brandPrimary.withValues(alpha: 0.12) : const Color(0xFF1E2032),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? CbColors.brandPrimary : const Color(0xFF2B2D44),
              width: isSelected ? 1.5 : 1.0,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: CbColors.darkCanvas,
                  border: Border.all(color: const Color(0xFF3F3F46)),
                ),
                alignment: Alignment.center,
                child: photoUrl != null
                    ? ClipOval(child: Image.network(photoUrl!, width: 38, height: 38, fit: BoxFit.cover))
                    : Text(
                        name.isNotEmpty ? name[0] : '♪',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isLive) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFFEF4444), width: 0.5),
                            ),
                            child: const Text(
                              'LIVE',
                              style: TextStyle(
                                color: Color(0xFFF87171),
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      distance != null ? '$genre • $distance' : genre,
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? CbColors.brandPrimary : Colors.transparent,
                  border: Border.all(
                    color: isSelected ? CbColors.brandPrimary : const Color(0xFF52525B),
                    width: 2,
                  ),
                ),
                child: isSelected ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
