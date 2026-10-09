// Crowdbeats V2 — Profile Social Actions Widget (Phase 8)
//
// Interactive follow, messaging, and safety controls for mobile profile screens.
// Supports Follow / Following / Follow Back, "Follows you" badge,
// Direct message button, and Block / Restrict / Report safety menu.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/services/social_service.dart';
import '../../state/auth_state.dart';
import '../fan/social_messaging_screen.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'cb_safety_action_sheet.dart';

class CbProfileSocialActions extends ConsumerStatefulWidget {
  const CbProfileSocialActions({
    super.key,
    required this.targetId,
    required this.targetType,
    required this.targetName,
    this.actingAsBandId,
    this.actingAsArtistId,
  });

  final String targetId;
  final String targetType;
  final String targetName;
  final String? actingAsBandId;
  final String? actingAsArtistId;

  @override
  ConsumerState<CbProfileSocialActions> createState() => _CbProfileSocialActionsState();
}

class _CbProfileSocialActionsState extends ConsumerState<CbProfileSocialActions> {
  bool _isFollowing = false;
  bool _followsViewer = false;
  bool _isBlocked = false;
  bool _isRestricted = false;
  bool _actionLoading = false;

  @override
  void initState() {
    super.initState();
    _loadRelationshipState();
  }

  Future<void> _loadRelationshipState() async {
    final auth = ref.read(authStateProvider);
    if (auth.status != CbAuthStatus.authenticated) return;

    try {
      final state = await ref.read(socialServiceProvider).getRelationshipState(
        targetId: widget.targetId,
        targetType: widget.targetType,
        actingAsBandId: widget.actingAsBandId,
        actingAsArtistId: widget.actingAsArtistId,
      );

      if (mounted) {
        setState(() {
          _isFollowing = state.isFollowing;
          _followsViewer = state.followsViewer;
          _isBlocked = state.isBlocked;
          _isRestricted = state.isRestricted;
          _canMessage = state.canMessage;
        });
      }
    } catch (_) {
      // Ignore network / offline errors gracefully
    }
  }

  Future<void> _toggleFollow() async {
    final auth = ref.read(authStateProvider);
    if (auth.status != CbAuthStatus.authenticated) {
      unawaited(context.push('/auth'));
      return;
    }

    if (_actionLoading || _isBlocked) return;

    setState(() {
      _actionLoading = true;
    });

    final wasFollowing = _isFollowing;
    setState(() {
      _isFollowing = !wasFollowing;
    });

    try {
      if (!wasFollowing) {
        await ref.read(socialServiceProvider).followEntity(
          targetId: widget.targetId,
          targetType: widget.targetType,
          actingAsBandId: widget.actingAsBandId,
          actingAsArtistId: widget.actingAsArtistId,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Following ${widget.targetName}!')),
          );
        }
      } else {
        await ref.read(socialServiceProvider).unfollowEntity(
          targetId: widget.targetId,
          targetType: widget.targetType,
          actingAsBandId: widget.actingAsBandId,
          actingAsArtistId: widget.actingAsArtistId,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Unfollowed ${widget.targetName}.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isFollowing = wasFollowing; // Rollback
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Action failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _actionLoading = false;
        });
      }
    }
  }

  void _openMessaging() {
    final auth = ref.read(authStateProvider);
    if (auth.status != CbAuthStatus.authenticated) {
      unawaited(context.push('/auth'));
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SocialMessagingScreen(
          initialRecipientId: widget.targetId,
          initialRecipientType: widget.targetType,
          initialRecipientName: widget.targetName,
          actingAsBandId: widget.actingAsBandId,
          actingAsArtistId: widget.actingAsArtistId,
        ),
      ),
    );
  }

  bool _canMessage = true;

  void _showSafetyMenu() {
    CbSafetyActionSheet.show(
      context,
      targetId: widget.targetId,
      targetType: widget.targetType,
      targetName: widget.targetName,
      actingAsBandId: widget.actingAsBandId,
      actingAsArtistId: widget.actingAsArtistId,
      isBlocked: _isBlocked,
      isRestricted: _isRestricted,
      onRelationshipChanged: ({required bool isBlocked, required bool isRestricted}) {
        if (mounted) {
          setState(() {
            _isBlocked = isBlocked;
            _isRestricted = isRestricted;
            if (isBlocked) {
              _isFollowing = false;
              _followsViewer = false;
              _canMessage = false;
            }
          });
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isBlocked) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
          border: Border.all(color: Colors.red.withValues(alpha: 0.4)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.block, size: 14, color: Colors.red),
            const SizedBox(width: 6),
            const Text('Blocked', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _showSafetyMenu,
              child: const Text('Manage', style: TextStyle(color: Colors.white70, fontSize: 12, decoration: TextDecoration.underline)),
            ),
          ],
        ),
      );
    }

    final followLabel = _actionLoading
        ? '…'
        : _isFollowing
            ? 'Following'
            : _followsViewer
                ? 'Follow Back'
                : 'Follow';

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // "Follows you" badge
        if (_followsViewer) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: const Text(
              'Follows you',
              style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 8),
        ],

        // Follow Button
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            backgroundColor: _isFollowing
                ? const Color(0x33EC4899)
                : _followsViewer
                    ? CbColors.purpleDark
                    : Colors.white.withValues(alpha: 0.08),
            side: BorderSide(
              color: _isFollowing
                  ? const Color(0xFFEC4899)
                  : _followsViewer
                      ? CbColors.purpleLight
                      : Colors.white.withValues(alpha: 0.25),
            ),
            foregroundColor: _isFollowing ? const Color(0xFFEC4899) : Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
          ),
          onPressed: _actionLoading ? null : _toggleFollow,
          icon: Icon(
            _isFollowing ? Icons.favorite : Icons.favorite_border,
            size: 16,
            color: _isFollowing ? const Color(0xFFEC4899) : Colors.white,
          ),
          label: Text(followLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        ),

        const SizedBox(width: 8),

        // Message Button
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            backgroundColor: Colors.white.withValues(alpha: 0.08),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
          ),
          onPressed: _openMessaging,
          icon: const Icon(Icons.chat_bubble_outline, size: 16),
          label: const Text('Message', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        ),

        const SizedBox(width: 4),

        // Overflow Safety Menu Button
        IconButton(
          icon: const Icon(Icons.more_vert, color: Colors.white70, size: 20),
          onPressed: _showSafetyMenu,
          tooltip: 'Safety & Options',
        ),
      ],
    );
  }
}
