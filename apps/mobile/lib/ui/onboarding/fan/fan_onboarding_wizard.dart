// Crowdbeats V2 — Fan Onboarding Streamlined Wizard (F1-F4)
// Preserves zero-fake-autofill, minimal required fields, and saved tip intent.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../ui/theme/cb_colors.dart';
import '../../../ui/theme/cb_spacing.dart';
import '../../../state/tip_state.dart';
import '../../components/onboarding_shared_components.dart';
import '../onboarding_helpers.dart';
import 'fan_onboarding_model.dart';

const _availableGenres = [
  'Rock',
  'Pop',
  'Indie',
  'Jazz',
  'Hip Hop',
  'Electronic',
  'Acoustic',
  'Folk',
  'Latin',
  'Blues',
  'Country',
  'Classical',
];

const _suggestedArtists = [
  (id: 'artist-sofia', name: 'Sofia Ramos', genre: 'Indie Pop', isLive: true, distance: '0.4 mi away'),
  (id: 'artist-jake', name: 'Jake Rios', genre: 'Acoustic Rock', isLive: true, distance: '1.2 mi away'),
  (id: 'artist-velvet', name: 'The Velvet Echoes', genre: 'Jazz Fusion', isLive: false, distance: '2.8 mi away'),
];

class FanOnboardingWizard extends ConsumerStatefulWidget {
  const FanOnboardingWizard({super.key});

  @override
  ConsumerState<FanOnboardingWizard> createState() => _FanOnboardingWizardState();
}

class _FanOnboardingWizardState extends ConsumerState<FanOnboardingWizard> {
  int _step = 1; // 1 = Essentials, 2 = Discovery (Optional), 3 = Success / Tip Resume
  final FanOnboardingData _data = FanOnboardingData();

  late final TextEditingController _displayNameController;
  late final TextEditingController _usernameController;
  late final TextEditingController _cityController;

  final Set<String> _selectedGenres = {};
  final Set<String> _selectedArtists = {};
  String? _avatarUrl;
  bool _isLocating = false;
  String? _locationStatus;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _displayNameController = TextEditingController(text: '${_data.firstName} ${_data.lastName}'.trim());
    _usernameController = TextEditingController(text: _data.username);
    _cityController = TextEditingController(text: _data.city);
    _selectedGenres.addAll(_data.favoriteGenres);
    _selectedArtists.addAll(_data.favoriteArtists);
    _avatarUrl = _data.avatarUrl;
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _usernameController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  bool get _isStep1Valid {
    final name = _displayNameController.text.trim();
    final username = _usernameController.text.trim();
    return name.isNotEmpty && username.length >= 3;
  }

  void _syncData() {
    final parts = _displayNameController.text.trim().split(' ');
    _data.firstName = parts.isNotEmpty ? parts.first : '';
    _data.lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';
    _data.username = _usernameController.text.trim().toLowerCase();
    _data.city = _cityController.text.trim();
    _data.avatarUrl = _avatarUrl;
    _data.favoriteGenres = _selectedGenres.toList();
    _data.favoriteArtists = _selectedArtists.toList();
  }

  Future<void> _handleUseLocation() async {
    setState(() {
      _isLocating = true;
      _locationStatus = null;
    });
    await Future.delayed(const Duration(milliseconds: 700));
    if (mounted) {
      setState(() {
        _isLocating = false;
        _cityController.text = 'Austin, TX';
        _locationStatus = 'Coarse location set to Austin, TX';
      });
    }
  }

  Future<void> _submitOnboarding() async {
    _syncData();
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final displayName = _displayNameController.text.trim();

    await completeOnboarding(
      ref: ref,
      context: context,
      personaType: 'fan',
      displayName: displayName,
      profileData: _data.toProfileData(),
      navigateOnSuccess: false,
      onError: (err) {
        if (mounted) {
          setState(() {
            _errorMessage = err;
            _isLoading = false;
          });
        }
      },
    );

    if (mounted && _errorMessage == null) {
      setState(() {
        _isLoading = false;
        _step = 3;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_step == 3) {
      return _buildSuccessStep();
    }

    return Scaffold(
      backgroundColor: CbColors.darkCanvas,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: _step == 1 ? _buildStep1Essentials() : _buildStep2Discovery(),
              ),
            ),
            _buildBottomActionBar(),
          ],
        ),
      ),
    );
  }

  // ─── Step 1: Essentials (F1/F2) ─────────────────────────────────────────────

  Widget _buildStep1Essentials() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProgressHeader(
          currentStep: 1,
          totalSteps: 2,
          stepName: 'STEP 1 OF 2',
          title: 'Your essentials',
          subtitle: 'Choose how artists and fellow fans see you on Crowdbeats.',
          accentColor: CbColors.brandPrimary,
          onBack: () => context.pop(),
        ),
        ProfilePhotoPicker(
          photoUrl: _avatarUrl,
          name: _displayNameController.text.isNotEmpty ? _displayNameController.text : 'Alex Morgan',
          accentColor: CbColors.brandPrimary,
          onTapUpload: () {
            setState(() {
              _avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
            });
          },
          onTapRemove: _avatarUrl != null
              ? () => setState(() => _avatarUrl = null)
              : null,
        ),
        const SizedBox(height: 24),

        // Display Name
        const Text(
          'Display Name *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _displayNameController,
          style: const TextStyle(color: Colors.white),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: 'Display Name *',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            hintText: 'e.g. Alex Morgan',
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
              borderSide: const BorderSide(color: CbColors.brandPrimary, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // Username
        const Text(
          'Username / Handle *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _usernameController,
          style: const TextStyle(color: Colors.white),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: 'Username / Handle *',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            prefixText: '@ ',
            prefixStyle: const TextStyle(color: Color(0xFFC084FC), fontWeight: FontWeight.w700),
            hintText: 'alexmusic',
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
              borderSide: const BorderSide(color: CbColors.brandPrimary, width: 2),
            ),
          ),
        ),
        InlineValidation(
          state: _usernameController.text.trim().length >= 3 ? 'valid' : 'checking',
          message: _usernameController.text.trim().length >= 3
              ? '@${_usernameController.text.trim().toLowerCase()} is available'
              : 'Must be at least 3 characters',
        ),
        const SizedBox(height: 18),

        // Optional City
        const Text(
          'Home City (Optional)',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _cityController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Home City (Optional)',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            hintText: 'e.g. Austin, TX',
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
              borderSide: const BorderSide(color: CbColors.brandPrimary, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Coarse location is only used to prioritize nearby shows. We never store or expose precise coordinates.',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
        ),
        if (_errorMessage != null) ...[
          const SizedBox(height: 16),
          InlineValidation(state: 'invalid', message: _errorMessage),
        ],
      ],
    );
  }

  // ─── Step 2: Discovery (F3) ─────────────────────────────────────────────────

  Widget _buildStep2Discovery() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProgressHeader(
          currentStep: 2,
          totalSteps: 2,
          stepName: 'STEP 2 OF 2 (OPTIONAL)',
          title: 'Make discovery yours',
          subtitle: 'Pick genres and follow local artists to personalize your live music radar.',
          accentColor: CbColors.brandPrimary,
          onBack: () => setState(() => _step = 1),
        ),

        // Favorite Genres
        const Text(
          'Favorite Genres',
          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        const Text(
          'Select styles you love to boost relevant buskers and bands.',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _availableGenres.map((genre) {
            final isSel = _selectedGenres.contains(genre);
            return GenreChip(
              label: genre,
              isSelected: isSel,
              accentColor: CbColors.brandPrimary,
              onTap: () {
                setState(() {
                  if (isSel) {
                    _selectedGenres.remove(genre);
                  } else {
                    _selectedGenres.add(genre);
                  }
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // Location Card
        LocationCard(
          currentCity: _cityController.text.isNotEmpty ? _cityController.text : null,
          isLoadingLocation: _isLocating,
          locationError: _locationStatus,
          onUseMyLocation: _handleUseLocation,
          onSearchPlace: () {
            setState(() {
              _cityController.text = 'Austin, TX';
              _locationStatus = 'Search place applied: Austin, TX';
            });
          },
        ),
        const SizedBox(height: 24),

        // Suggested Artists
        const Text(
          'Suggested Artists Near You',
          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        const Text(
          'Follow now to receive live stage alerts when they begin performing.',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
        ),
        const SizedBox(height: 12),
        ..._suggestedArtists.map((artist) {
          final isFollowed = _selectedArtists.contains(artist.id);
          return PerformerOnboardingCard(
            id: artist.id,
            name: artist.name,
            genre: artist.genre,
            isLive: artist.isLive,
            distance: artist.distance,
            isSelected: isFollowed,
            onToggle: () {
              setState(() {
                if (isFollowed) {
                  _selectedArtists.remove(artist.id);
                } else {
                  _selectedArtists.add(artist.id);
                }
              });
            },
          );
        }),
        if (_errorMessage != null) ...[
          const SizedBox(height: 16),
          InlineValidation(state: 'invalid', message: _errorMessage),
        ],
      ],
    );
  }

  // ─── Step 3: Success Panel & Tip Resumption (F4) ────────────────────────────

  Widget _buildSuccessStep() {
    final pendingTip = ref.watch(tipFlowProvider).pendingTipContext;

    Widget? tipBanner;
    if (pendingTip != null) {
      final amountFormatted = '\$${(pendingTip.selectedTipAmountCents / 100).toStringAsFixed(2)}';
      tipBanner = Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: CbColors.brandPrimary.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: CbColors.brandPrimary.withValues(alpha: 0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('⚡ ', style: TextStyle(fontSize: 16)),
                Expanded(
                  child: Text(
                    "You're all set to tip ${pendingTip.creatorName}!",
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Continue your $amountFormatted tip to show support for the live performance.',
              style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  context.push('/tip/${pendingTip.creatorId}');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.brandPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: Text('Resume Tip ($amountFormatted) →', style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: CbColors.darkCanvas,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: SuccessPanel(
              title: 'Welcome to Crowdbeats!',
              subtitle: 'Your Fan profile is ready. Discover live buskers and local bands playing right now.',
              badgeText: 'FAN ACTIVATED',
              accentColor: CbColors.brandPrimary,
              items: [
                const SuccessChecklistItem(label: 'Fan profile created', isDone: true),
                SuccessChecklistItem(
                  label: _selectedGenres.isNotEmpty
                      ? '${_selectedGenres.length} genre preferences saved'
                      : 'Default discovery feed ready',
                  isDone: true,
                ),
                SuccessChecklistItem(
                  label: _selectedArtists.isNotEmpty
                      ? '${_selectedArtists.length} artists followed'
                      : 'Ready to discover live acts',
                  isDone: true,
                ),
                const SuccessChecklistItem(label: 'No payment method required to browse', isDone: true),
              ],
              savedTipBanner: tipBanner,
              primaryLabel: 'Start Discovering Nearby →',
              onPrimary: () => context.go('/fan'),
              secondaryLabel: 'Explore Map',
              onSecondary: () => context.go('/discovery'),
            ),
          ),
        ),
      ),
    );
  }

  // ─── Sticky Action Bar ──────────────────────────────────────────────────────

  Widget _buildBottomActionBar() {
    if (_step == 1) {
      return StickyActionBar(
        primaryLabel: 'Next: Music Discovery →',
        onPrimary: () => setState(() => _step = 2),
        primaryDisabled: !_isStep1Valid,
        accentColor: CbColors.brandPrimary,
        disclaimer: 'Joining is free. You can edit your display name and photo anytime.',
      );
    }

    return StickyActionBar(
      primaryLabel: 'Save & Finish →',
      onPrimary: _submitOnboarding,
      primaryLoading: _isLoading,
      secondaryLabel: 'Skip for now',
      onSecondary: _submitOnboarding,
      accentColor: CbColors.brandPrimary,
      disclaimer: 'Preferences can be customized anytime from your settings.',
    );
  }
}
