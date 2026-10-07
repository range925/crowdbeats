// Crowdbeats V2 — Public Profile Screen (Artist & Band Discovery)
//
// Unauthenticated visitors can view public profiles, bios, media, and initiate tips.
// Never exposes private home addresses, email, phone, or Stripe details.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/discovery.dart';
import '../../state/auth_state.dart';
import '../../state/discovery_state.dart';
import '../../state/tip_state.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../components/cb_button.dart';
import '../components/cb_live_badge.dart';
import '../components/cb_profile_social_actions.dart';
import 'tip/tip_auth_gate_modal.dart';
import 'tip/tip_confirmation_sheet.dart';
import '../camera/camera_capture_screen.dart';

class PublicProfileScreen extends ConsumerWidget {
  const PublicProfileScreen({
    super.key,
    required this.slug,
    this.type = 'artist',
  });

  final String slug;
  final String type; // 'artist' or 'band'

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final discovery = ref.watch(discoveryProvider);
    final isBand = type == 'band';

    // Find performer matching slug or fallback to first available
    final performer = discovery.performers.firstWhere(
      (p) => p.slug == slug || p.id == slug,
      orElse: () => PublicPerformer(
        id: slug,
        slug: slug,
        name: slug.replaceAll('-', ' ').split(' ').map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '').join(' '),
        type: type,
        bio: isBand
            ? 'Dynamic live band blending authentic melodies with modern instrumentation.'
            : 'Solo musician performing live acoustic sets and original songs.',
        genres: isBand ? const ['Rock', 'Indie'] : const ['Indie Pop', 'Acoustic'],
        isVerified: true,
        isLive: true,
        currentVenueName: 'The Main Stage',
        distanceMiles: 0.3,
        latitude: discovery.discoveryLocation.latitude,
        longitude: discovery.discoveryLocation.longitude,
      ),
    );

    final auth = ref.watch(authStateProvider);
    final isAuthenticated = auth.status == CbAuthStatus.authenticated;

    ref.listen<CbAuthState>(authStateProvider, (prev, next) {
      if (next.status == CbAuthStatus.authenticated) {
        final pending = ref.read(tipFlowProvider).pendingTipContext;
        if (pending != null && (pending.creatorSlug == slug || pending.creatorId == performer.id)) {
          ref.read(tipFlowProvider.notifier).clearPendingTipContext();
          ref.read(tipFlowProvider.notifier).prepare(
            recipientId: performer.id,
            recipientName: performer.name,
            recipientType: performer.type,
            amountCents: pending.selectedTipAmountCents,
          );
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (context.mounted) {
              TipConfirmationSheet.show(context);
            }
          });
        }
      }
    });

    if (isAuthenticated) {
      final pending = ref.read(tipFlowProvider).pendingTipContext;
      if (pending != null && (pending.creatorSlug == slug || pending.creatorId == performer.id)) {
        ref.read(tipFlowProvider.notifier).clearPendingTipContext();
        ref.read(tipFlowProvider.notifier).prepare(
          recipientId: performer.id,
          recipientName: performer.name,
          recipientType: performer.type,
          amountCents: pending.selectedTipAmountCents,
        );
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (context.mounted) {
            TipConfirmationSheet.show(context);
          }
        });
      }
    }

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: CustomScrollView(
        slivers: [
          // Sliver App Bar with Cover Photo
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: CbColors.surfaceBase,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => context.pop(),
            ),
            actions: [
              // Follow / Favorite Button
              IconButton(
                icon: const Icon(Icons.favorite_border, color: Colors.white),
                onPressed: () {
                  if (!isAuthenticated) {
                    _showFollowAuthGate(context, performer.name);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Following ${performer.name}!')),
                    );
                  }
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          CbColors.purpleDark.withValues(alpha: 0.8),
                          CbColors.bgApp,
                        ],
                      ),
                    ),
                    child: const Center(
                      child: Icon(Icons.music_note, size: 80, color: Color(0x33FFFFFF)),
                    ),
                  ),
                  // Dark bottom gradient overlay
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 100,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, CbColors.bgApp],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Profile Details & Actions
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Live badge + Verified
                  Row(
                    children: [
                      if (performer.isLive) ...[
                        const CbLiveBadge(),
                        const SizedBox(width: 8),
                      ],
                      if (performer.isVerified)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0x228B5CF6),
                            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            border: Border.all(color: const Color(0x558B5CF6)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified, color: CbColors.purpleLight, size: 12),
                              SizedBox(width: 4),
                              Text(
                                'Verified',
                                style: TextStyle(
                                  color: CbColors.purpleLight,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Performer Name
                  Text(
                    performer.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                    ),
                  ),

                  const SizedBox(height: 6),

                  // Venue & Distance Indicator
                  if (performer.currentVenueName != null)
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: CbColors.purpleLight, size: 15),
                        const SizedBox(width: 4),
                        Text(
                          '${performer.currentVenueName} · ${performer.distanceMiles ?? 0.3} mi away',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),

                  const SizedBox(height: 16),

                  // Genres
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: performer.genres.map((g) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: CbColors.surfaceCard,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          border: Border.all(color: const Color(0x22FFFFFF)),
                        ),
                        child: Text(
                          g,
                          style: const TextStyle(
                            color: CbColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 18),

                  // Social Actions (Follow, Message, Safety Menu)
                  CbProfileSocialActions(
                    targetId: performer.id,
                    targetType: performer.type,
                    targetName: performer.name,
                  ),

                  const SizedBox(height: 16),

                  OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const CameraCaptureScreen(),
                      ),
                    ),
                    icon: const Icon(Icons.camera_alt, color: CbColors.heartOrange, size: 18),
                    label: const Text(
                      'Capture the music & tip nearby',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: CbColors.heartOrange),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Tip Action Card (Preset buttons: $5, $10, $20)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: CbColors.surfaceCard,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                      border: Border.all(color: const Color(0x2B8B5CF6)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Support this artist directly with a real-time tip:',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            _buildTipPresetButton(context, ref, performer, 500, '\$5', isAuthenticated),
                            const SizedBox(width: 8),
                            _buildTipPresetButton(context, ref, performer, 1000, '\$10', isAuthenticated),
                            const SizedBox(width: 8),
                            _buildTipPresetButton(context, ref, performer, 2000, '\$20', isAuthenticated),
                          ],
                        ),
                        const SizedBox(height: 12),
                        CbButton(
                          label: 'Custom Tip',
                          onPressed: () => _handleTip(context, ref, performer, 2000, isAuthenticated),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Bio Section
                  if (performer.bio != null) ...[
                    const Text(
                      'About',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      performer.bio!,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Public Media & Performance Info
                  const Text(
                    'Upcoming & Live Performances',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: CbColors.surfaceCard,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                      border: Border.all(color: const Color(0x1AFFFFFF)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.event, color: CbColors.purpleLight, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                performer.currentVenueName ?? 'Main Stage',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Tonight · 8:30 PM - 10:00 PM',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTipPresetButton(
    BuildContext context,
    WidgetRef ref,
    PublicPerformer performer,
    int amountCents,
    String label,
    bool isAuthenticated,
  ) {
    return Expanded(
      child: GestureDetector(
        onTap: () => _handleTip(context, ref, performer, amountCents, isAuthenticated),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0x228B5CF6),
            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            border: Border.all(color: CbColors.purpleMain.withValues(alpha: 0.5)),
          ),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _handleTip(
    BuildContext context,
    WidgetRef ref,
    PublicPerformer performer,
    int amountCents,
    bool isAuthenticated,
  ) {
    final pendingContext = PendingTipContext(
      creatorId: performer.id,
      creatorSlug: performer.slug,
      creatorName: performer.name,
      creatorType: performer.type,
      creatorPhotoUrl: performer.photoUrl,
      selectedTipAmountCents: amountCents,
      currency: 'USD',
      sourceScreen: 'public_profile',
    );

    if (!isAuthenticated) {
      TipAuthGateModal.show(context, pendingContext: pendingContext);
    } else {
      ref.read(tipFlowProvider.notifier).prepare(
            recipientId: performer.id,
            recipientName: performer.name,
            recipientType: performer.type,
            amountCents: amountCents,
          );
      TipConfirmationSheet.show(context);
    }
  }

  void _showFollowAuthGate(BuildContext context, String creatorName) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xF0131315),
          borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Sign in to follow $creatorName',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Get notified when $creatorName goes live or announces upcoming shows.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13),
            ),
            const SizedBox(height: 20),
            CbButton(
              label: 'Sign In / Register',
              onPressed: () {
                Navigator.of(ctx).pop();
                context.push('/auth');
              },
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
          ],
        ),
      ),
    );
  }
}
