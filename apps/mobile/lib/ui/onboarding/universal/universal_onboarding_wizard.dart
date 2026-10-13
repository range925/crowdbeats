// Crowdbeats V2 — Universal Adaptive Onboarding Wizard (Phase 5)
//
// Single Firebase Identity with Multi-Persona Support (Fan, Solo Musician, Band, Sponsor)
// Non-negotiable No-Fake-Autofill contract: zero pre-selected cards, genres, or consents.
// Truthful creator setup progress: distinguishes act creation from verified/payout-ready status.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_functions/cloud_functions.dart';

import '../../../firebase/auth_service.dart';
import '../../../state/auth_state.dart';
import '../../components/cb_button.dart';
import '../../components/cb_form_field.dart';
import '../../components/cb_logo.dart';
import '../../components/cb_scaffold.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../theme/cb_theme.dart';
import '../../theme/cb_typography.dart';

class UniversalOnboardingWizard extends ConsumerStatefulWidget {
  const UniversalOnboardingWizard({super.key});

  @override
  ConsumerState<UniversalOnboardingWizard> createState() =>
      _UniversalOnboardingWizardState();
}

class _UniversalOnboardingWizardState
    extends ConsumerState<UniversalOnboardingWizard> {
  int _currentStep = 0;
  String? _selectedPersona;

  // Identity (prefilled from authenticated user)
  String _email = '';
  String _displayName = '';
  String _handle = '';
  String? _photoUrl;

  // Legal & Consents (all default to false per compliance)
  bool _termsAccepted = false;
  bool _privacyAccepted = false;
  bool _isAdultConfirmed = false;
  bool _marketingConsent = false;

  // Fan specifics
  final Set<String> _fanGenres = {};
  String _fanCity = '';

  // Solo Musician specifics
  String _musicianStageName = '';
  String _musicianPrimaryGenre = '';
  String _musicianCity = '';

  // Band specifics
  String _bandName = '';
  String _bandPrimaryGenre = '';
  String _bandCity = '';
  String _bandRole = '';

  // Sponsor specifics
  String _sponsorOrgName = '';
  String _sponsorType = '';
  String _sponsorJobTitle = '';

  bool _isSaving = false;
  String? _errorMessage;

  static const List<String> _availableGenres = [
    'Rock', 'Pop', 'Indie', 'Hip-Hop', 'Electronic', 'Jazz',
    'Folk / Acoustic', 'R&B / Soul', 'Country', 'Reggae', 'Metal', 'Classical'
  ];

  static const int _totalSteps = 4;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authStateProvider).user ?? AuthService.instance.currentUser;
      if (user != null && mounted) {
        setState(() {
          if (_email.isEmpty) _email = user.email ?? '';
          if (_displayName.isEmpty) _displayName = user.displayName ?? '';
          _photoUrl ??= user.photoURL;
        });
      }
    });
  }

  void _nextStep() {
    setState(() {
      _errorMessage = null;
      if (_currentStep < _totalSteps - 1) {
        _currentStep++;
      }
    });
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() {
        _errorMessage = null;
        _currentStep--;
      });
    }
  }

  String? _getReturnDestination() {
    try {
      final from = GoRouterState.of(context).uri.queryParameters['from'];
      if (from != null &&
          from.isNotEmpty &&
          from.startsWith('/') &&
          !from.startsWith('/auth') &&
          !from.startsWith('/onboarding')) {
        return from;
      }
    } catch (_) {}
    return null;
  }

  Future<void> _completeOnboarding() async {
    if (_isSaving) return;
    if (!_termsAccepted || !_privacyAccepted || !_isAdultConfirmed) {
      setState(() => _errorMessage = 'Please confirm legal age and accept Terms & Privacy Policy.');
      return;
    }
    if (_selectedPersona == null) {
      setState(() => _errorMessage = 'Please select a primary persona.');
      return;
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final functions = FirebaseFunctions.instanceFor(region: 'us-central1');
      final callable = functions.httpsCallable('completeUniversalOnboarding');

      final profileData = <String, dynamic>{};
      if (_selectedPersona == 'fan') {
        profileData['favoriteGenres'] = _fanGenres.toList();
        profileData['city'] = _fanCity;
      } else if (_selectedPersona == 'artist') {
        profileData['stageName'] = _musicianStageName.isNotEmpty ? _musicianStageName : _displayName;
        profileData['primaryGenre'] = _musicianPrimaryGenre;
        profileData['serviceCity'] = _musicianCity;
      } else if (_selectedPersona == 'band') {
        profileData['bandName'] = _bandName.isNotEmpty ? _bandName : _displayName;
        profileData['primaryGenre'] = _bandPrimaryGenre;
        profileData['baseCity'] = _bandCity;
        profileData['userRoleInBand'] = _bandRole.isNotEmpty ? _bandRole : 'FOUNDER';
      } else if (_selectedPersona == 'sponsor') {
        profileData['organizationName'] = _sponsorOrgName.isNotEmpty ? _sponsorOrgName : _displayName;
        profileData['sponsorType'] = _sponsorType.isNotEmpty ? _sponsorType : 'LOCAL_BUSINESS';
        profileData['userJobTitle'] = _sponsorJobTitle;
      }

      await callable.call<Map<String, dynamic>>({
        'primaryPersona': _selectedPersona,
        'email': _email.isNotEmpty ? _email : null,
        'displayName': _displayName.isNotEmpty ? _displayName : 'Crowdbeats Member',
        'photoUrl': _photoUrl,
        'handle': _handle.isNotEmpty ? _handle : null,
        'termsAcceptedVersion': '2026-08-25',
        'privacyAcceptedVersion': '2026-08-25',
        'marketingConsent': _marketingConsent,
        'profileData': profileData,
      });

      await AuthService.instance.getIdTokenResult(forceRefresh: true);
      await ref.read(authNotifierProvider.notifier).refreshProfile();

      if (mounted) {
        final returnTarget = _getReturnDestination();
        if (returnTarget != null) {
          context.go(returnTarget);
        } else {
          context.go('/$_selectedPersona');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Profile creation could not be completed. Please check your connection and try again.';
          _isSaving = false;
        });
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;

    return CbSafeScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: _prevStep,
                tooltip: 'Back',
              )
            : null,
        title: Text(
          'Step ${_currentStep + 1} of $_totalSteps',
          style: GoogleFonts.dmSans(
            fontSize: 14,
            color: ext.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              final returnTarget = _getReturnDestination();
              context.go(returnTarget ?? '/fan');
            },
            child: Text(
              'Exit',
              style: GoogleFonts.dmSans(
                color: ext.borderFocus,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(3),
          child: LinearProgressIndicator(
            value: (_currentStep + 1) / _totalSteps,
            backgroundColor: ext.surfaceCard,
            valueColor: AlwaysStoppedAnimation<Color>(ext.borderFocus),
            minHeight: 3,
          ),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 640),
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6, vertical: CbSpacing.s5),
            child: _buildCurrentStepContent(ext),
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentStepContent(CbThemeExtension ext) {
    switch (_currentStep) {
      case 0:
        return _buildStep0Legal(ext);
      case 1:
        return _buildStep1Persona(ext);
      case 2:
        return _buildStep2ProfileDetails(ext);
      case 3:
      default:
        return _buildStep3Review(ext);
    }
  }

  // ── Step 0: Legal & Eligibility ──────────────────────────────────────────────

  Widget _buildStep0Legal(CbThemeExtension ext) {
    final canProceed = _isAdultConfirmed && _termsAccepted && _privacyAccepted;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: CbSpacing.s2),
        const Center(
          child: CbLogo(
            variant: CbLogoVariant.horizontal,
            surface: CbLogoSurface.auto,
            height: 38,
          ),
        ),
        const SizedBox(height: CbSpacing.s5),
        Text(
          'Eligibility & Agreements',
          style: CbTypography.sectionTitle(color: ext.textPrimary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          'Please confirm your eligibility and review our platform agreements before getting started.',
          textAlign: TextAlign.center,
          style: CbTypography.bodyMd(color: ext.textSecondary),
        ),
        const SizedBox(height: CbSpacing.s6),

        _buildConsentCard(
          ext: ext,
          title: 'Age & Eligibility Confirmation',
          description: 'I confirm that I am at least 18 years of age (or legal majority) and authorized to create a Crowdbeats account.',
          isChecked: _isAdultConfirmed,
          onChanged: (val) => setState(() => _isAdultConfirmed = val ?? false),
        ),
        const SizedBox(height: CbSpacing.s3),

        _buildConsentCard(
          ext: ext,
          title: 'Terms of Service (v2026-08-25)',
          description: 'I agree to the Crowdbeats Terms of Service, including finality of tips after 24h, code of conduct, and platform rules.',
          isChecked: _termsAccepted,
          onChanged: (val) => setState(() => _termsAccepted = val ?? false),
        ),
        const SizedBox(height: CbSpacing.s3),

        _buildConsentCard(
          ext: ext,
          title: 'Privacy Policy (v2026-08-25)',
          description: 'I acknowledge the Crowdbeats Privacy Policy describing how location, payments, and account data are processed.',
          isChecked: _privacyAccepted,
          onChanged: (val) => setState(() => _privacyAccepted = val ?? false),
        ),
        const SizedBox(height: CbSpacing.s3),

        _buildConsentCard(
          ext: ext,
          title: 'Live Event Updates (Optional)',
          description: 'Receive occasional emails regarding nearby stage sessions, festival lineups, and performer spotlights.',
          isChecked: _marketingConsent,
          isOptional: true,
          onChanged: (val) => setState(() => _marketingConsent = val ?? false),
        ),
        const SizedBox(height: CbSpacing.s6),

        if (_errorMessage != null) ...[
          Text(
            _errorMessage!,
            style: GoogleFonts.dmSans(color: ext.statusError, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: CbSpacing.s3),
        ],

        CbButton(
          label: 'Agree & Continue',
          fullWidth: true,
          onPressed: canProceed ? _nextStep : null,
        ),
      ],
    );
  }

  Widget _buildConsentCard({
    required CbThemeExtension ext,
    required String title,
    required String description,
    required bool isChecked,
    required ValueChanged<bool?> onChanged,
    bool isOptional = false,
  }) {
    return InkWell(
      onTap: () => onChanged(!isChecked),
      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
      child: Container(
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: ext.surfaceCard,
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(
            color: isChecked ? ext.borderFocus.withAlpha(120) : ext.borderSubtle,
          ),
        ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: isChecked,
            activeColor: ext.borderFocus,
            checkColor: Colors.white,
            onChanged: onChanged,
          ),
          const SizedBox(width: CbSpacing.s2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: GoogleFonts.dmSans(
                          color: ext.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (isOptional)
                      Text(
                        'Optional',
                        style: GoogleFonts.dmSans(
                          color: ext.textTertiary,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.dmSans(
                    color: ext.textSecondary,
                    fontSize: 12,
                    height: 1.4,
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

  // ── Step 1: Persona Selection ────────────────────────────────────────────────

  Widget _buildStep1Persona(CbThemeExtension ext) {
    final personas = [
      {
        'id': 'fan',
        'title': 'Fan / Music Enthusiast',
        'desc': 'Discover live stage sessions, support artists with tips, and follow favorite acts.',
        'icon': Icons.headphones_rounded,
      },
      {
        'id': 'artist',
        'title': 'Solo Musician / Performer',
        'desc': 'Host live stages, receive direct fan patronage, and manage your performer presence.',
        'icon': Icons.mic_external_on_rounded,
      },
      {
        'id': 'band',
        'title': 'Band / Music Ensemble',
        'desc': 'Create a shared band presence with automatic multi-member revenue splits.',
        'icon': Icons.groups_rounded,
      },
      {
        'id': 'sponsor',
        'title': 'Sponsor / Brand Partner',
        'desc': 'Discover grassroots music campaigns, fund match pools, and sponsor events.',
        'icon': Icons.handshake_rounded,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Choose Your Focus',
          style: CbTypography.sectionTitle(color: ext.textPrimary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          'Select how you primarily intend to use Crowdbeats. You can participate across roles with one unified account.',
          textAlign: TextAlign.center,
          style: CbTypography.bodyMd(color: ext.textSecondary),
        ),
        const SizedBox(height: CbSpacing.s6),

        ...personas.map((p) {
          final isSelected = _selectedPersona == p['id'];
          return Padding(
            padding: const EdgeInsets.only(bottom: CbSpacing.s3),
            child: InkWell(
              onTap: () => setState(() => _selectedPersona = p['id'] as String),
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              child: Container(
                padding: const EdgeInsets.all(CbSpacing.s4),
                decoration: BoxDecoration(
                  color: isSelected ? ext.borderFocus.withAlpha(20) : ext.surfaceCard,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(
                    color: isSelected ? ext.borderFocus : ext.borderSubtle,
                    width: isSelected ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isSelected ? ext.borderFocus : ext.surfaceRaised,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      ),
                      child: Icon(
                        p['icon'] as IconData,
                        color: isSelected ? Colors.white : ext.textSecondary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: CbSpacing.s4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p['title'] as String,
                            style: GoogleFonts.dmSans(
                              color: ext.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            p['desc'] as String,
                            style: GoogleFonts.dmSans(
                              color: ext.textSecondary,
                              fontSize: 12,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                      color: isSelected ? ext.borderFocus : ext.textTertiary,
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: CbSpacing.s5),

        CbButton(
          label: 'Continue',
          fullWidth: true,
          onPressed: _selectedPersona != null ? _nextStep : null,
        ),
      ],
    );
  }

  // ── Step 2: Profile & Act Details ────────────────────────────────────────────

  Widget _buildStep2ProfileDetails(CbThemeExtension ext) {
    if (_selectedPersona == 'fan') {
      return _buildFanDetails(ext);
    } else if (_selectedPersona == 'artist') {
      return _buildArtistDetails(ext);
    } else if (_selectedPersona == 'band') {
      return _buildBandDetails(ext);
    } else {
      return _buildSponsorDetails(ext);
    }
  }

  Widget _buildFanDetails(CbThemeExtension ext) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Your Fan Profile',
          style: CbTypography.sectionTitle(color: ext.textPrimary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          'Your display name appears when tipping or interacting with live acts.',
          textAlign: TextAlign.center,
          style: CbTypography.bodyMd(color: ext.textSecondary),
        ),
        const SizedBox(height: CbSpacing.s6),

        CbFormField(
          label: 'Display Name',
          initialValue: _displayName,
          hintText: 'e.g. Alex Morgan',
          leadingIcon: Icon(Icons.person_outline_rounded, color: ext.textTertiary, size: 20),
          onChanged: (val) => _displayName = val,
        ),
        const SizedBox(height: CbSpacing.s4),

        CbFormField(
          label: 'Home City / Metro Area (Optional)',
          initialValue: _fanCity,
          hintText: 'e.g. Austin, TX',
          leadingIcon: Icon(Icons.location_on_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _fanCity = val,
        ),
        const SizedBox(height: CbSpacing.s5),

        Text(
          'Favorite Music Genres (Optional)',
          style: GoogleFonts.dmSans(
            color: ext.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: CbSpacing.s3),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _availableGenres.map((genre) {
            final isSelected = _fanGenres.contains(genre);
            return FilterChip(
              label: Text(genre),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _fanGenres.add(genre);
                  } else {
                    _fanGenres.remove(genre);
                  }
                });
              },
              selectedColor: ext.borderFocus,
              backgroundColor: ext.surfaceCard,
              labelStyle: GoogleFonts.dmSans(
                color: isSelected ? Colors.white : ext.textSecondary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                side: BorderSide(color: isSelected ? ext.borderFocus : ext.borderSubtle),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: CbSpacing.s6),

        CbButton(
          label: 'Continue to Review',
          fullWidth: true,
          onPressed: _nextStep,
        ),
      ],
    );
  }

  Widget _buildArtistDetails(CbThemeExtension ext) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Solo Performer Identity',
          style: CbTypography.sectionTitle(color: ext.textPrimary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          'Set your public stage name and primary genre. Detailed bio and payout verification are deferred to Creator Studio.',
          textAlign: TextAlign.center,
          style: CbTypography.bodyMd(color: ext.textSecondary),
        ),
        const SizedBox(height: CbSpacing.s6),

        CbFormField(
          label: 'Stage / Artist Name',
          initialValue: _musicianStageName.isNotEmpty ? _musicianStageName : _displayName,
          hintText: 'e.g. Luna Hollis',
          leadingIcon: Icon(Icons.mic_none_rounded, color: ext.textTertiary, size: 20),
          onChanged: (val) => _musicianStageName = val,
        ),
        const SizedBox(height: CbSpacing.s4),

        CbFormField(
          label: 'Primary Genre',
          initialValue: _musicianPrimaryGenre,
          hintText: 'e.g. Indie / Folk',
          leadingIcon: Icon(Icons.music_note_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _musicianPrimaryGenre = val,
        ),
        const SizedBox(height: CbSpacing.s4),

        CbFormField(
          label: 'Home City / Primary Region',
          initialValue: _musicianCity,
          hintText: 'e.g. Nashville, TN',
          leadingIcon: Icon(Icons.location_on_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _musicianCity = val,
        ),
        const SizedBox(height: CbSpacing.s5),

        Container(
          padding: const EdgeInsets.all(CbSpacing.s4),
          decoration: BoxDecoration(
            color: ext.surfaceCard,
            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            border: Border.all(color: ext.borderSubtle),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline_rounded, color: ext.borderFocus, size: 20),
              const SizedBox(width: CbSpacing.s3),
              Expanded(
                child: Text(
                  'Bio, social media links, and Stripe payout setup can be configured in Creator Studio after completing basic onboarding.',
                  style: GoogleFonts.dmSans(
                    color: ext.textSecondary,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: CbSpacing.s6),

        CbButton(
          label: 'Continue to Review',
          fullWidth: true,
          onPressed: _nextStep,
        ),
      ],
    );
  }

  Widget _buildBandDetails(CbThemeExtension ext) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Band & Ensemble Setup',
          style: CbTypography.sectionTitle(color: ext.textPrimary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          'Name your ensemble and specify your role. Member invitations and revenue splits can be managed from Studio.',
          textAlign: TextAlign.center,
          style: CbTypography.bodyMd(color: ext.textSecondary),
        ),
        const SizedBox(height: CbSpacing.s6),

        CbFormField(
          label: 'Band / Ensemble Name',
          initialValue: _bandName,
          hintText: 'e.g. The Midnight Echoes',
          leadingIcon: Icon(Icons.groups_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _bandName = val,
        ),
        const SizedBox(height: CbSpacing.s4),

        CbFormField(
          label: 'Primary Genre',
          initialValue: _bandPrimaryGenre,
          hintText: 'e.g. Alternative Rock',
          leadingIcon: Icon(Icons.music_note_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _bandPrimaryGenre = val,
        ),
        const SizedBox(height: CbSpacing.s4),

        CbFormField(
          label: 'Base City',
          initialValue: _bandCity,
          hintText: 'e.g. Chicago, IL',
          leadingIcon: Icon(Icons.location_on_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _bandCity = val,
        ),
        const SizedBox(height: CbSpacing.s4),

        CbFormField(
          label: 'Your Role in Band',
          initialValue: _bandRole,
          hintText: 'e.g. Founder, Lead Vocalist, Drummer',
          leadingIcon: Icon(Icons.badge_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _bandRole = val,
        ),
        const SizedBox(height: CbSpacing.s6),

        CbButton(
          label: 'Continue to Review',
          fullWidth: true,
          onPressed: _nextStep,
        ),
      ],
    );
  }

  Widget _buildSponsorDetails(CbThemeExtension ext) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Sponsor & Partner Profile',
          style: CbTypography.sectionTitle(color: ext.textPrimary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          'Enter your organization details for local stage sponsorship and match funding.',
          textAlign: TextAlign.center,
          style: CbTypography.bodyMd(color: ext.textSecondary),
        ),
        const SizedBox(height: CbSpacing.s6),

        CbFormField(
          label: 'Organization / Business Name',
          initialValue: _sponsorOrgName,
          hintText: 'e.g. Austin Craft Brews',
          leadingIcon: Icon(Icons.business_outlined, color: ext.textTertiary, size: 20),
          onChanged: (val) => _sponsorOrgName = val,
        ),
        const SizedBox(height: CbSpacing.s4),

        CbFormField(
          label: 'Your Job Title / Function',
          initialValue: _sponsorJobTitle,
          hintText: 'e.g. Community Marketing Lead',
          leadingIcon: Icon(Icons.work_outline_rounded, color: ext.textTertiary, size: 20),
          onChanged: (val) => _sponsorJobTitle = val,
        ),
        const SizedBox(height: CbSpacing.s6),

        CbButton(
          label: 'Continue to Review',
          fullWidth: true,
          onPressed: _nextStep,
        ),
      ],
    );
  }

  // ── Step 3: Review & Complete ────────────────────────────────────────────────

  Widget _buildStep3Review(CbThemeExtension ext) {
    final actName = _selectedPersona == 'fan'
        ? (_displayName.isNotEmpty ? _displayName : 'Crowdbeats Fan')
        : (_selectedPersona == 'artist'
            ? (_musicianStageName.isNotEmpty ? _musicianStageName : _displayName)
            : (_selectedPersona == 'band'
                ? (_bandName.isNotEmpty ? _bandName : 'New Band')
                : (_sponsorOrgName.isNotEmpty ? _sponsorOrgName : _displayName)));

    final isCreator = _selectedPersona == 'artist' || _selectedPersona == 'band';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Review & Confirmation',
          style: CbTypography.sectionTitle(color: ext.textPrimary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Text(
          'Verify your account details before entering Crowdbeats.',
          textAlign: TextAlign.center,
          style: CbTypography.bodyMd(color: ext.textSecondary),
        ),
        const SizedBox(height: CbSpacing.s6),

        Container(
          padding: const EdgeInsets.all(CbSpacing.s5),
          decoration: BoxDecoration(
            color: ext.surfaceCard,
            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            border: Border.all(color: ext.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Account Summary',
                    style: GoogleFonts.dmSans(
                      color: ext.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _currentStep = 1),
                    child: Text(
                      'Change',
                      style: GoogleFonts.dmSans(
                        color: ext.borderFocus,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              Divider(color: ext.borderSubtle),
              _buildReviewRow(ext, 'Primary Focus', (_selectedPersona ?? 'fan').toUpperCase()),
              _buildReviewRow(ext, 'Display / Act Name', actName),
              if (_email.isNotEmpty)
                _buildReviewRow(ext, 'Account Email', _email),
              _buildReviewRow(ext, 'Terms of Service', 'v2026-08-25 Agreed'),
              _buildReviewRow(ext, 'Privacy Policy', 'v2026-08-25 Acknowledged'),
            ],
          ),
        ),
        const SizedBox(height: CbSpacing.s4),

        if (isCreator) ...[
          Container(
            padding: const EdgeInsets.all(CbSpacing.s4),
            decoration: BoxDecoration(
              color: ext.surfaceRaised,
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: ext.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.shield_outlined, color: ext.borderFocus, size: 20),
                    const SizedBox(width: CbSpacing.s2),
                    Text(
                      'Next Steps in Creator Studio',
                      style: GoogleFonts.dmSans(
                        color: ext.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: CbSpacing.s2),
                Text(
                  '• Basic act profile will be created upon confirmation.\n'
                  '• Identity verification and Stripe Connect payout setup must be completed in Studio before hosting live stages or withdrawing tips.\n'
                  '• No payouts are promised or issued until formal bank verification passes.',
                  style: GoogleFonts.dmSans(
                    color: ext.textSecondary,
                    fontSize: 12,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: CbSpacing.s4),
        ],

        if (_errorMessage != null) ...[
          Container(
            padding: const EdgeInsets.all(CbSpacing.s3),
            decoration: BoxDecoration(
              color: ext.statusError.withAlpha(20),
              borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
              border: Border.all(color: ext.statusError.withAlpha(80)),
            ),
            child: Text(
              _errorMessage!,
              style: GoogleFonts.dmSans(color: ext.statusError, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: CbSpacing.s4),
        ],

        CbButton(
          label: 'Complete Setup',
          fullWidth: true,
          isLoading: _isSaving,
          onPressed: _isSaving ? null : _completeOnboarding,
        ),
      ],
    );
  }

  Widget _buildReviewRow(CbThemeExtension ext, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.dmSans(color: ext.textSecondary, fontSize: 13),
          ),
          Text(
            value,
            style: GoogleFonts.dmSans(
              color: ext.textPrimary,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
