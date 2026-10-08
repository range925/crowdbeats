// Crowdbeats V2 — Solo Musician Onboarding (S1 - S5)
// Clear creator identity, readiness checklist, go-live explainer & fee transparency.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';
import '../components/onboarding_shared_components.dart';
import 'onboarding_helpers.dart';

const _creatorGenres = [
  'Acoustic',
  'Singer-Songwriter',
  'Rock',
  'Pop',
  'Indie',
  'Jazz',
  'Blues',
  'Hip-Hop',
  'Folk',
  'Electronic',
  'Country',
  'Classical',
];

class ArtistOnboardingScreen extends ConsumerStatefulWidget {
  const ArtistOnboardingScreen({super.key});

  @override
  ConsumerState<ArtistOnboardingScreen> createState() => _ArtistOnboardingScreenState();
}

class _ArtistOnboardingScreenState extends ConsumerState<ArtistOnboardingScreen> {
  int _step = 1; // 1 = Public Identity (S1), 2 = Readiness & Payout Disclosure (S2-S4)

  late final TextEditingController _stageNameController;
  late final TextEditingController _handleController;
  late final TextEditingController _bioController;
  late final TextEditingController _socialController;

  final Set<String> _selectedGenres = {'Acoustic'};
  String? _avatarUrl;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _stageNameController = TextEditingController();
    _handleController = TextEditingController();
    _bioController = TextEditingController();
    _socialController = TextEditingController();
  }

  @override
  void dispose() {
    _stageNameController.dispose();
    _handleController.dispose();
    _bioController.dispose();
    _socialController.dispose();
    super.dispose();
  }

  bool get _isStep1Valid {
    return _stageNameController.text.trim().length >= 2 &&
        _handleController.text.trim().length >= 3 &&
        _selectedGenres.isNotEmpty;
  }

  Future<void> _submitArtistProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final stageName = _stageNameController.text.trim();
    final handle = _handleController.text.trim().toLowerCase();

    await completeOnboarding(
      ref: ref,
      context: context,
      personaType: 'artist',
      displayName: stageName,
      profileData: {
        'stageName': stageName,
        'handle': handle,
        'bio': _bioController.text.trim(),
        'genres': _selectedGenres.toList(),
        'socialLink': _socialController.text.trim().isEmpty ? null : _socialController.text.trim(),
        'avatarUrl': _avatarUrl,
        'creatorType': 'SOLO_ARTIST',
        'payoutReadiness': 'ACTION_REQUIRED',
        'techFeeRateBps': 600, // 6.00%
      },
      onError: (err) {
        if (mounted) {
          setState(() {
            _errorMessage = err;
            _isLoading = false;
          });
        }
      },
    );

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.darkCanvas,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: _step == 1 ? _buildStep1Identity() : _buildStep2Readiness(),
              ),
            ),
            _buildBottomActionBar(),
          ],
        ),
      ),
    );
  }

  // ─── Step 1: Public Performer Identity (S1) ─────────────────────────────────

  Widget _buildStep1Identity() {
    final stageName = _stageNameController.text.trim();
    final handle = _handleController.text.trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProgressHeader(
          currentStep: 1,
          totalSteps: 2,
          stepName: 'STEP 1 OF 2',
          title: 'Public performer identity',
          subtitle: 'Set up your stage presence and how fans discover your live performances.',
          accentColor: CbColors.creatorAmber,
          onBack: () => context.pop(),
        ),

        // Photo Picker
        ProfilePhotoPicker(
          photoUrl: _avatarUrl,
          name: stageName.isNotEmpty ? stageName : 'Stage Name',
          accentColor: CbColors.creatorAmber,
          onTapUpload: () {
            setState(() {
              _avatarUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80';
            });
          },
          onTapRemove: _avatarUrl != null
              ? () => setState(() => _avatarUrl = null)
              : null,
        ),
        const SizedBox(height: 24),

        // Stage Name
        const Text(
          'Stage / Performer Name *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _stageNameController,
          style: const TextStyle(color: Colors.white),
          onChanged: (val) {
            if (_handleController.text.isEmpty || _handleController.text == val.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toLowerCase()) {
              _handleController.text = val.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toLowerCase();
            }
            setState(() {});
          },
          decoration: InputDecoration(
            labelText: 'Stage / Performer Name *',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            hintText: 'e.g. Maya Lin, The Midnight Busker',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: CbColors.darkCard,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.creatorAmber, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // Performer Handle / Slug
        const Text(
          'Stage Handle / URL Slug *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _handleController,
          style: const TextStyle(color: Colors.white),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: 'Stage Handle / URL Slug *',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            prefixText: 'crowdbeats.app/@',
            prefixStyle: const TextStyle(color: CbColors.creatorAmber, fontWeight: FontWeight.w600),
            hintText: 'mayamusic',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: CbColors.darkCard,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.creatorAmber, width: 2),
            ),
          ),
        ),
        InlineValidation(
          state: handle.length >= 3 ? 'valid' : 'checking',
          message: handle.length >= 3
              ? 'Handle is valid for public stage QR code'
              : 'Must be at least 3 characters',
        ),
        const SizedBox(height: 18),

        // Primary Genres
        const Text(
          'Primary Genres (Pick 1 to 3) *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _creatorGenres.map((g) {
            final isSel = _selectedGenres.contains(g);
            return GenreChip(
              label: g,
              isSelected: isSel,
              accentColor: CbColors.creatorAmber,
              onTap: () {
                setState(() {
                  if (isSel) {
                    if (_selectedGenres.length > 1) _selectedGenres.remove(g);
                  } else if (_selectedGenres.length < 3) {
                    _selectedGenres.add(g);
                  }
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 18),

        // Short Bio
        const Text(
          'Short Bio (Optional)',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _bioController,
          maxLines: 2,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Short Bio (Optional)',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            hintText: 'Acoustic melodies, street rhythms, Austin native.',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: CbColors.darkCard,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.creatorAmber, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // Social Link
        const Text(
          'Social Link (Optional)',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _socialController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Social Link (Optional)',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            hintText: 'https://instagram.com/yourhandle',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: CbColors.darkCard,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.creatorAmber, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  // ─── Step 2: Readiness & Financial Disclosure (S2-S4) ────────────────────────

  Widget _buildStep2Readiness() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProgressHeader(
          currentStep: 2,
          totalSteps: 2,
          stepName: 'STEP 2 OF 2',
          title: 'Creator readiness & payout terms',
          subtitle: 'Review requirements for receiving live tips and understand how earnings work.',
          accentColor: CbColors.creatorAmber,
          onBack: () => setState(() => _step = 1),
        ),

        // Checklist
        const Text(
          'Activation Checklist',
          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        const SetupChecklistCard(
          title: '1. Musician Profile',
          subtitle: 'Stage name, handle & genres configured.',
          status: 'ready',
        ),
        const SetupChecklistCard(
          title: '2. Identity Verification (KYC)',
          subtitle: 'Required by Stripe before payouts can be routed.',
          status: 'action_required',
        ),
        const SetupChecklistCard(
          title: '3. Payout Bank Account',
          subtitle: 'Direct deposit via Stripe Connect Express.',
          status: 'action_required',
        ),
        const SetupChecklistCard(
          title: '4. Stage Geolocation Check-in',
          subtitle: 'Broadcast your live pin when you arrive at your busking stage.',
          status: 'optional',
        ),
        const SizedBox(height: 24),

        // Go-Live Explainer
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: CbColors.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF2B2D44)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: CbColors.discoveryCyan.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: CbColors.discoveryCyan.withValues(alpha: 0.3)),
                    ),
                    alignment: Alignment.center,
                    child: const Text('📡', style: TextStyle(fontSize: 18)),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'How Live Discovery Works',
                    style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                '1. Check into your physical performance spot in the app.\n'
                '2. Nearby fans browsing the Crowdbeats map see your live card.\n'
                '3. Fans tap to send tips or scan your personal stage QR code.\n'
                '4. Coarse location ensures safety while keeping fans engaged.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.5),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Transparent Economics
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: CbColors.creatorAmber.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: CbColors.creatorAmber.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text('💵 ', style: TextStyle(fontSize: 16)),
                  const Text(
                    'Transparent Earnings & Fee Disclosure',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                '• Joining and creating your stage profile is 100% free.\n'
                '• Technology fee: 6.00% Crowdbeats platform fee.\n'
                '• Payment processing: Standard Stripe rates (2.9% + 30¢).\n'
                '• For a \$10.00 tip: Processor fee is \$0.59, Crowdbeats fee is \$0.60. You take home \$8.81 net.\n'
                '• Payouts: Initiated directly to your connected bank once Stripe verification is complete.',
                style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, height: 1.5),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF151722),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  children: [
                    Text('⚠️ ', style: TextStyle(fontSize: 12)),
                    Expanded(
                      child: Text(
                        'Payouts remain paused until Stripe identity verification is completed. You can finish your profile now and connect banking anytime.',
                        style: TextStyle(color: Color(0xFFFBBF24), fontSize: 11, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (_errorMessage != null) ...[
          const SizedBox(height: 16),
          InlineValidation(state: 'invalid', message: _errorMessage),
        ],
      ],
    );
  }

  // ─── Bottom Action Bar ──────────────────────────────────────────────────────

  Widget _buildBottomActionBar() {
    if (_step == 1) {
      return StickyActionBar(
        primaryLabel: 'Next: Readiness & Terms →',
        onPrimary: () => setState(() => _step = 2),
        primaryDisabled: !_isStep1Valid,
        accentColor: CbColors.creatorAmber,
        disclaimer: 'Joining is free. Your public profile will be visible to nearby fans.',
      );
    }

    return StickyActionBar(
      primaryLabel: 'Create Musician Profile →',
      onPrimary: _submitArtistProfile,
      primaryLoading: _isLoading,
      secondaryLabel: 'Back to Edit',
      onSecondary: () => setState(() => _step = 1),
      accentColor: CbColors.creatorAmber,
      disclaimer: 'By creating your profile, you acknowledge the 6% tech fee policy.',
    );
  }
}
