// Crowdbeats V2 — Unified Safety & Moderation Action Sheet (Phase 7)
//
// Reusable bottom sheet providing Block, Restrict, and Categorized Report
// actions for performers, bands, users, and conversations.
// Enforces safety guarantees both in UI state and via SocialService Cloud Functions.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/services/social_service.dart';
import '../../state/auth_state.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'cb_button.dart';

class CbSafetyActionSheet extends ConsumerStatefulWidget {
  const CbSafetyActionSheet({
    super.key,
    required this.targetId,
    required this.targetType,
    required this.targetName,
    this.actingAsBandId,
    this.actingAsArtistId,
    this.initialIsBlocked = false,
    this.initialIsRestricted = false,
    this.onRelationshipChanged,
  });

  final String targetId;
  final String targetType;
  final String targetName;
  final String? actingAsBandId;
  final String? actingAsArtistId;
  final bool initialIsBlocked;
  final bool initialIsRestricted;
  final void Function({required bool isBlocked, required bool isRestricted})? onRelationshipChanged;

  static Future<void> show(
    BuildContext context, {
    required String targetId,
    required String targetType,
    required String targetName,
    String? actingAsBandId,
    String? actingAsArtistId,
    bool isBlocked = false,
    bool isRestricted = false,
    void Function({required bool isBlocked, required bool isRestricted})? onRelationshipChanged,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CbSafetyActionSheet(
        targetId: targetId,
        targetType: targetType,
        targetName: targetName,
        actingAsBandId: actingAsBandId,
        actingAsArtistId: actingAsArtistId,
        initialIsBlocked: isBlocked,
        initialIsRestricted: isRestricted,
        onRelationshipChanged: onRelationshipChanged,
      ),
    );
  }

  @override
  ConsumerState<CbSafetyActionSheet> createState() => _CbSafetyActionSheetState();
}

class _CbSafetyActionSheetState extends ConsumerState<CbSafetyActionSheet> {
  late bool _isBlocked;
  late bool _isRestricted;
  bool _isProcessing = false;
  bool _isReporting = false;

  String _reportCategory = 'harassment';
  final TextEditingController _reportDescController = TextEditingController();

  final List<Map<String, String>> _categories = const [
    {'value': 'harassment', 'label': 'Harassment or Bullying'},
    {'value': 'hate_speech', 'label': 'Hate Speech or Discrimination'},
    {'value': 'spam', 'label': 'Spam, Scam, or Solicitation'},
    {'value': 'inappropriate', 'label': 'Inappropriate or Sensitive Content'},
    {'value': 'impersonation', 'label': 'Impersonation or Fake Account'},
    {'value': 'other', 'label': 'Other Violation'},
  ];

  @override
  void initState() {
    super.initState();
    _isBlocked = widget.initialIsBlocked;
    _isRestricted = widget.initialIsRestricted;
  }

  @override
  void dispose() {
    _reportDescController.dispose();
    super.dispose();
  }

  Future<void> _toggleBlock() async {
    final auth = ref.read(authStateProvider);
    if (auth.status != CbAuthStatus.authenticated) {
      Navigator.pop(context);
      return;
    }

    if (!_isBlocked) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dCtx) => AlertDialog(
          backgroundColor: CbColors.surfaceCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusLg)),
          title: Text('Block ${widget.targetName}?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          content: Text(
            'They will not be able to find your profile, view live stage updates, send messages, or tip you. '
            'Any existing follow relationship will be immediately severed in both directions.',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13, height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx, false),
              child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: CbColors.statusError,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusSm)),
              ),
              onPressed: () => Navigator.pop(dCtx, true),
              child: const Text('Block Account', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );

      if (confirmed != true) return;
    }

    setState(() => _isProcessing = true);

    try {
      if (_isBlocked) {
        await ref.read(socialServiceProvider).unblockEntity(
          targetId: widget.targetId,
          targetType: widget.targetType,
          actingAsBandId: widget.actingAsBandId,
          actingAsArtistId: widget.actingAsArtistId,
        );
        await ref.read(userSettingsProvider.notifier).unblockUser(widget.targetId);
        if (mounted) {
          setState(() {
            _isBlocked = false;
          });
          widget.onRelationshipChanged?.call(isBlocked: false, isRestricted: _isRestricted);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${widget.targetName} unblocked.')),
          );
        }
      } else {
        await ref.read(socialServiceProvider).blockEntity(
          targetId: widget.targetId,
          targetType: widget.targetType,
          actingAsBandId: widget.actingAsBandId,
          actingAsArtistId: widget.actingAsArtistId,
        );
        await ref.read(userSettingsProvider.notifier).blockUser(widget.targetId, displayName: widget.targetName);
        if (mounted) {
          setState(() {
            _isBlocked = true;
            _isRestricted = false;
          });
          widget.onRelationshipChanged?.call(isBlocked: true, isRestricted: false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${widget.targetName} blocked.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Operation failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _toggleRestrict() async {
    final auth = ref.read(authStateProvider);
    if (auth.status != CbAuthStatus.authenticated) {
      Navigator.pop(context);
      return;
    }

    setState(() => _isProcessing = true);

    try {
      if (_isRestricted) {
        await ref.read(socialServiceProvider).unrestrictEntity(
          targetId: widget.targetId,
          targetType: widget.targetType,
          actingAsBandId: widget.actingAsBandId,
          actingAsArtistId: widget.actingAsArtistId,
        );
        if (mounted) {
          setState(() => _isRestricted = false);
          widget.onRelationshipChanged?.call(isBlocked: _isBlocked, isRestricted: false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Restriction removed from ${widget.targetName}.')),
          );
        }
      } else {
        await ref.read(socialServiceProvider).restrictEntity(
          targetId: widget.targetId,
          targetType: widget.targetType,
          actingAsBandId: widget.actingAsBandId,
          actingAsArtistId: widget.actingAsArtistId,
        );
        if (mounted) {
          setState(() => _isRestricted = true);
          widget.onRelationshipChanged?.call(isBlocked: _isBlocked, isRestricted: true);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${widget.targetName} restricted quietly.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Operation failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _submitReport() async {
    final desc = _reportDescController.text.trim();
    setState(() => _isProcessing = true);

    try {
      await ref.read(socialServiceProvider).submitReport(
        targetType: widget.targetType,
        targetId: widget.targetId,
        violationCategory: _reportCategory,
        description: desc,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: CbColors.surfaceCard,
            content: Row(
              children: [
                Icon(Icons.check_circle, color: CbColors.statusSuccess, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Report submitted to Crowdbeats Trust & Safety Admin Queue.',
                    style: TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Report failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFF151C2C), // Stitch surfaceContainer
        borderRadius: const BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
        border: Border.all(color: const Color(0x3300E5FF)),
        boxShadow: const [
          BoxShadow(
            color: Colors.black87,
            blurRadius: 32,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5, vertical: CbSpacing.s4),
          child: Material(
            color: Colors.transparent,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: CbSpacing.s4),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),

              // Header
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0x2200E5FF),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0x5500E5FF)),
                    ),
                    child: const Icon(Icons.shield_outlined, color: Color(0xFF00E5FF), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Safety & Moderation',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          widget.targetName,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 12,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (_isReporting)
                    TextButton(
                      onPressed: () => setState(() => _isReporting = false),
                      child: const Text('Back', style: TextStyle(color: Color(0xFF00E5FF))),
                    )
                  else
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                ],
              ),

              const SizedBox(height: CbSpacing.s4),
              const Divider(color: Color(0x1AFFFFFF), height: 1),
              const SizedBox(height: CbSpacing.s3),

              if (_isReporting) ...[
                // Reporting Form
                const Text(
                  'Reason for reporting:',
                  style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0A0E17),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    border: Border.all(color: const Color(0x26FFFFFF)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _reportCategory,
                      isExpanded: true,
                      dropdownColor: const Color(0xFF151C2C),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      items: _categories.map((c) {
                        return DropdownMenuItem<String>(
                          value: c['value'],
                          child: Text(c['label']!),
                        );
                      }).toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => _reportCategory = v);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Additional context (optional):',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _reportDescController,
                  maxLines: 3,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Describe violation or link to evidence...',
                    hintStyle: const TextStyle(color: Colors.white30, fontSize: 12),
                    filled: true,
                    fillColor: const Color(0xFF0A0E17),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      borderSide: const BorderSide(color: Color(0x26FFFFFF)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      borderSide: const BorderSide(color: Color(0xFF00E5FF)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Reports are encrypted and routed directly to the Crowdbeats Trust & Safety team.',
                  style: TextStyle(color: Colors.white38, fontSize: 11),
                ),
                const SizedBox(height: 16),
                CbButton(
                  label: _isProcessing ? 'Submitting…' : 'Submit Report',
                  variant: CbButtonVariant.primary,
                  onPressed: _isProcessing ? null : _submitReport,
                  fullWidth: true,
                ),
              ] else ...[
                // Main Options List
                // 1. Restrict
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _isRestricted ? const Color(0x3300E5FF) : Colors.white.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    ),
                    child: Icon(
                      Icons.shield_moon_outlined,
                      color: _isRestricted ? const Color(0xFF00E5FF) : Colors.white70,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    _isRestricted ? 'Unrestrict ${widget.targetName}' : 'Restrict ${widget.targetName}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  subtitle: const Text(
                    'Isolates messages into Restricted inbox without read receipts or online alerts',
                    style: TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  trailing: _isProcessing
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5FF)))
                      : Icon(
                          _isRestricted ? Icons.check_circle : Icons.chevron_right,
                          color: _isRestricted ? const Color(0xFF00E5FF) : Colors.white38,
                          size: 18,
                        ),
                  onTap: _isProcessing ? null : _toggleRestrict,
                ),

                const Divider(color: Color(0x14FFFFFF), height: 16),

                // 2. Block
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _isBlocked ? const Color(0x33EF4444) : Colors.white.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    ),
                    child: Icon(
                      Icons.block,
                      color: _isBlocked ? CbColors.statusError : CbColors.statusError.withValues(alpha: 0.8),
                      size: 20,
                    ),
                  ),
                  title: Text(
                    _isBlocked ? 'Unblock ${widget.targetName}' : 'Block ${widget.targetName}',
                    style: TextStyle(
                      color: _isBlocked ? Colors.white : CbColors.statusError,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  subtitle: const Text(
                    'Sever mutual follow edges, disable messaging, and hide profile activity',
                    style: TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  trailing: _isProcessing
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: CbColors.statusError))
                      : Icon(
                          _isBlocked ? Icons.lock_open : Icons.chevron_right,
                          color: _isBlocked ? Colors.white70 : Colors.white38,
                          size: 18,
                        ),
                  onTap: _isProcessing ? null : _toggleBlock,
                ),

                const Divider(color: Color(0x14FFFFFF), height: 16),

                // 3. Report
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    ),
                    child: const Icon(Icons.flag_outlined, color: Colors.orangeAccent, size: 20),
                  ),
                  title: Text(
                    'Report ${widget.targetName}',
                    style: const TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  subtitle: const Text(
                    'Send categorized incident report to Crowdbeats Trust & Safety Admin Queue',
                    style: TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  trailing: const Icon(Icons.chevron_right, color: Colors.white38, size: 18),
                  onTap: () => setState(() => _isReporting = true),
                ),
              ],
            ],
          ),
        ),
      ),
    ),
  );
}
}
