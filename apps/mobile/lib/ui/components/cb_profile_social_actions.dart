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

  void _showSafetyMenu() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: CbColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_isBlocked)
                ListTile(
                  leading: const Icon(Icons.lock_open, color: Colors.green),
                  title: Text('Unblock ${widget.targetName}', style: const TextStyle(color: Colors.white)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    try {
                      await ref.read(socialServiceProvider).unblockEntity(
                        targetId: widget.targetId,
                        targetType: widget.targetType,
                        actingAsBandId: widget.actingAsBandId,
                        actingAsArtistId: widget.actingAsArtistId,
                      );
                      if (mounted) {
                        setState(() {
                          _isBlocked = false;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${widget.targetName} unblocked.')),
                        );
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Failed: $e')),
                        );
                      }
                    }
                  },
                )
              else ...[
                ListTile(
                  leading: const Icon(Icons.shield, color: Colors.blue),
                  title: Text(
                    _isRestricted ? 'Unrestrict ${widget.targetName}' : 'Restrict ${widget.targetName}',
                    style: const TextStyle(color: Colors.white),
                  ),
                  subtitle: const Text(
                    'Quietly isolates messages without read receipts',
                    style: TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  onTap: () async {
                    Navigator.pop(ctx);
                    try {
                      if (_isRestricted) {
                        await ref.read(socialServiceProvider).unrestrictEntity(
                          targetId: widget.targetId,
                          targetType: widget.targetType,
                          actingAsBandId: widget.actingAsBandId,
                          actingAsArtistId: widget.actingAsArtistId,
                        );
                        if (mounted) setState(() => _isRestricted = false);
                      } else {
                        await ref.read(socialServiceProvider).restrictEntity(
                          targetId: widget.targetId,
                          targetType: widget.targetType,
                          actingAsBandId: widget.actingAsBandId,
                          actingAsArtistId: widget.actingAsArtistId,
                        );
                        if (mounted) setState(() => _isRestricted = true);
                      }
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              _isRestricted
                                  ? '${widget.targetName} restricted.'
                                  : 'Restriction removed.',
                            ),
                          ),
                        );
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Failed: $e')),
                        );
                      }
                    }
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.block, color: Colors.red),
                  title: Text('Block ${widget.targetName}', style: const TextStyle(color: Colors.red)),
                  subtitle: const Text(
                    'Removes follow edges in both directions and disables messages',
                    style: TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (dCtx) => AlertDialog(
                        backgroundColor: CbColors.surfaceCard,
                        title: Text('Block ${widget.targetName}?', style: const TextStyle(color: Colors.white)),
                        content: const Text(
                          'You will unfollow each other and neither of you will be able to message or view live activity.',
                          style: TextStyle(color: Colors.white70),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(dCtx, false),
                            child: const Text('Cancel'),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                            onPressed: () => Navigator.pop(dCtx, true),
                            child: const Text('Block'),
                          ),
                        ],
                      ),
                    );

                    if (confirmed == true) {
                      try {
                        await ref.read(socialServiceProvider).blockEntity(
                          targetId: widget.targetId,
                          targetType: widget.targetType,
                          actingAsBandId: widget.actingAsBandId,
                          actingAsArtistId: widget.actingAsArtistId,
                        );
                        if (mounted) {
                          setState(() {
                            _isBlocked = true;
                            _isFollowing = false;
                            _followsViewer = false;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('${widget.targetName} blocked.')),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to block: $e')),
                          );
                        }
                      }
                    }
                  },
                ),
              ],
              ListTile(
                leading: const Icon(Icons.flag, color: Colors.orange),
                title: Text('Report ${widget.targetName}', style: const TextStyle(color: Colors.orange)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showReportDialog();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showReportDialog() {
    String selectedCategory = 'harassment';
    final descController = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (dCtx) {
        return AlertDialog(
          backgroundColor: CbColors.surfaceCard,
          title: Text('Report ${widget.targetName}', style: const TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: selectedCategory,
                dropdownColor: CbColors.surfaceCard,
                style: const TextStyle(color: Colors.white),
                items: const [
                  DropdownMenuItem(value: 'harassment', child: Text('Harassment or Bullying')),
                  DropdownMenuItem(value: 'hate_speech', child: Text('Hate Speech')),
                  DropdownMenuItem(value: 'spam', child: Text('Spam or Fraud')),
                  DropdownMenuItem(value: 'other', child: Text('Other Violation')),
                ],
                onChanged: (v) {
                  if (v != null) selectedCategory = v;
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Describe violation...',
                  hintStyle: TextStyle(color: Colors.white38),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () async {
                Navigator.pop(dCtx);
                try {
                  await ref.read(socialServiceProvider).submitReport(
                    targetType: widget.targetType,
                    targetId: widget.targetId,
                    violationCategory: selectedCategory,
                    description: descController.text.trim(),
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Report submitted to Admin Support.')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed: $e')),
                    );
                  }
                }
              },
              child: const Text('Submit Report'),
            ),
          ],
        );
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
