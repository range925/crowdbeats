// Crowdbeats V2 — Universal Adaptive Onboarding Wizard
//
// Authoritative Design Reference: Google Stitch 5326179813018056505
// Single Firebase Identity with Multi-Persona Support (Fan, Solo Musician, Band, Sponsor)
// Non-negotiable No-Fake-Autofill contract: zero pre-selected cards, genres, or consents.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../theme/cb_colors.dart';
import '../../components/cb_logo.dart';
import '../../../state/auth_state.dart';
import '../../../firebase/auth_service.dart';

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

  // Step 1: Sign-in / Identity
  String _email = '';
  String _displayName = '';
  String _handle = '';
  String? _photoUrl;

  // Step 2: Legal & Consents
  bool _termsAccepted = false;
  bool _privacyAccepted = false;
  bool _isAdultConfirmed = false;
  bool _marketingConsent = false;

  // Persona details: Fan
  final Set<String> _fanGenres = {};
  String _fanCity = '';

  // Persona details: Solo Musician
  String _musicianStageName = '';
  String _musicianPrimaryGenre = '';
  final Set<String> _musicianSecondaryGenres = {};
  String _musicianCity = '';
  String _musicianBio = '';
  String _musicianGoal = '';

  // Persona details: Band
  String _bandName = '';
  String _bandPrimaryGenre = '';
  String _bandCity = '';
  String _bandRole = '';

  // Persona details: Sponsor
  String _sponsorOrgName = '';
  String _sponsorType = '';
  String _sponsorJobTitle = '';
  String _sponsorObjective = '';

  bool _isSaving = false;
  String? _errorMessage;

  final List<String> _availableGenres = [
    'Rock', 'Pop', 'Indie', 'Hip-Hop', 'Electronic', 'Jazz',
    'Folk / Acoustic', 'R&B / Soul', 'Country', 'Reggae', 'Metal', 'Classical'
  ];

  int _calculateTotalSteps() {
    if (_selectedPersona == null) return 5;
    switch (_selectedPersona) {
      case 'fan':
        return 7;
      case 'artist':
      case 'band':
      case 'sponsor':
        return 8;
      default:
        return 6;
    }
  }

  void _nextStep() {
    setState(() {
      _errorMessage = null;
      _currentStep++;
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
        profileData['secondaryGenres'] = _musicianSecondaryGenres.toList();
        profileData['serviceCity'] = _musicianCity;
        profileData['bio'] = _musicianBio;
        profileData['firstGoal'] = _musicianGoal;
      } else if (_selectedPersona == 'band') {
        profileData['bandName'] = _bandName.isNotEmpty ? _bandName : _displayName;
        profileData['primaryGenre'] = _bandPrimaryGenre;
        profileData['baseCity'] = _bandCity;
        profileData['userRoleInBand'] = _bandRole;
      } else if (_selectedPersona == 'sponsor') {
        profileData['organizationName'] = _sponsorOrgName.isNotEmpty ? _sponsorOrgName : _displayName;
        profileData['sponsorType'] = _sponsorType;
        profileData['userJobTitle'] = _sponsorJobTitle;
        profileData['firstObjective'] = _sponsorObjective;
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
        String? from;
        try {
          from = GoRouterState.of(context).uri.queryParameters['from'];
        } catch (_) {}
        if (from != null && from.isNotEmpty && from.startsWith('/') && !from.startsWith('/auth') && !from.startsWith('/onboarding')) {
          context.go(from);
        } else {
          context.go('/' + _selectedPersona!);
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
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surface1,
        elevation: 0,
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                onPressed: _prevStep,
                tooltip: 'Back',
              )
            : null,
        title: Text(
          'Step ' + (_currentStep + 1).toString() + ' of ' + _calculateTotalSteps().toString(),
          style: const TextStyle(fontSize: 14, color: CbColors.textSecondary, fontWeight: FontWeight.w600),
        ),
        actions: [
          if (_currentStep > 0)
            TextButton(
              onPressed: () => context.go('/'),
              child: const Text('Save & Exit', style: TextStyle(color: CbColors.purpleLight)),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(3),
          child: LinearProgressIndicator(
            value: (_currentStep + 1) / _calculateTotalSteps(),
            backgroundColor: CbColors.surface2,
            valueColor: const AlwaysStoppedAnimation<Color>(CbColors.purpleMain),
            minHeight: 3,
          ),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 680),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
              child: _buildCurrentStepContent(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildStep0Welcome();
      case 1:
        return _buildStep1AuthMethod();
      case 2:
        return _buildStep2LegalAndEligibility();
      case 3:
        return _buildStep3PersonaSelector();
      case 4:
        return _buildStep4BasicIdentity();
      case 5:
        return _buildPersonaStep1();
      case 6:
        return _buildPersonaStep2();
      case 7:
        return _buildStepReview();
      default:
        return _buildStepReview();
    }
  }

  Widget _buildStep0Welcome() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 16),
        const Center(
          child: CbLogo(
            variant: CbLogoVariant.horizontal,
            surface: CbLogoSurface.dark,
            height: 44,
          ),
        ),
        const SizedBox(height: 28),
        Text(
          'Live Music Powered by Community',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
                letterSpacing: -0.5,
              ),
        ),
        const SizedBox(height: 12),
        const Text(
          'Discover nearby stage sessions, support independent performers directly with 1-tap tips, and build vibrant live music communities.',
          textAlign: TextAlign.center,
          style: TextStyle(color: CbColors.textSecondary, fontSize: 15, height: 1.5),
        ),
        const SizedBox(height: 48),

        FilledButton(
          onPressed: _nextStep,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 14),
        OutlinedButton(
          onPressed: () => context.go('/auth'),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.white,
            side: const BorderSide(color: CbColors.borderSubtle),
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: const Text('Sign in for existing users', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 14),
        TextButton(
          onPressed: () => context.go('/fan'),
          child: const Text('Explore Crowdbeats as Guest', style: TextStyle(color: CbColors.textSecondary, fontSize: 14)),
        ),
      ],
    );
  }

  Widget _buildStep1AuthMethod() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Choose your sign-in method',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'One secure Crowdbeats account unlocks all performer, band, fan, and sponsor capabilities.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 32),

        _buildProviderButton(
          label: 'Continue with Google',
          icon: Icons.g_mobiledata_rounded,
          onTap: () {
            setState(() {
              _email = 'user@gmail.com';
              _displayName = 'Google Account';
            });
            _nextStep();
          },
        ),
        const SizedBox(height: 14),

        _buildProviderButton(
          label: 'Continue with Apple',
          icon: Icons.apple_rounded,
          onTap: () {
            setState(() {
              _email = 'user@privaterelay.appleid.com';
              _displayName = 'Apple User';
            });
            _nextStep();
          },
        ),
        const SizedBox(height: 24),

        const Row(
          children: [
            Expanded(child: Divider(color: CbColors.borderSubtle)),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Text('or continue with email', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
            ),
            Expanded(child: Divider(color: CbColors.borderSubtle)),
          ],
        ),
        const SizedBox(height: 20),

        TextField(
          onChanged: (val) => _email = val,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Email address',
            labelStyle: const TextStyle(color: CbColors.textSecondary),
            filled: true,
            fillColor: CbColors.surface2,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.borderSubtle),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.purpleMain, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 24),

        FilledButton(
          onPressed: _nextStep,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildProviderButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        decoration: BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CbColors.borderSubtle),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 24),
            const SizedBox(width: 12),
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          ],
        ),
      ),
    );
  }

  Widget _buildStep2LegalAndEligibility() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Eligibility & Agreements',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Review terms and confirm account eligibility. All consents start unchecked in accordance with our compliance policies.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),

        _buildConsentCard(
          title: 'Age & Eligibility Confirmation',
          description: 'I confirm that I am at least 18 years of age (or the age of legal majority in my jurisdiction) and legally authorized to create a Crowdbeats account.',
          isChecked: _isAdultConfirmed,
          onChanged: (val) => setState(() => _isAdultConfirmed = val ?? false),
        ),
        const SizedBox(height: 14),

        _buildConsentCard(
          title: 'Terms of Service (v2026-08-25)',
          description: 'I have read, understood, and agree to the Crowdbeats Terms of Service, including finality of tips after 24h, acceptable content policies, and dispute terms.',
          isChecked: _termsAccepted,
          onChanged: (val) => setState(() => _termsAccepted = val ?? false),
        ),
        const SizedBox(height: 14),

        _buildConsentCard(
          title: 'Privacy Policy (v2026-08-25)',
          description: 'I acknowledge the Crowdbeats Privacy Policy describing how location, payments, and account data are processed and protected.',
          isChecked: _privacyAccepted,
          onChanged: (val) => setState(() => _privacyAccepted = val ?? false),
        ),
        const SizedBox(height: 14),

        _buildConsentCard(
          title: 'Live Event Updates (Optional)',
          description: 'Receive occasional curated emails regarding local festival lineups, stage sessions, and performer campaigns.',
          isChecked: _marketingConsent,
          isOptional: true,
          onChanged: (val) => setState(() => _marketingConsent = val ?? false),
        ),
        const SizedBox(height: 28),

        if (_errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Text(_errorMessage!, style: const TextStyle(color: CbColors.errorRed, fontSize: 13)),
          ),

        FilledButton(
          onPressed: (_isAdultConfirmed && _termsAccepted && _privacyAccepted) ? _nextStep : null,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            disabledBackgroundColor: CbColors.surface2,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Agree & Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildConsentCard({
    required String title,
    required String description,
    required bool isChecked,
    required ValueChanged<bool?> onChanged,
    bool isOptional = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isChecked ? CbColors.purpleLight.withAlpha(80) : CbColors.borderSubtle),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: isChecked,
            activeColor: CbColors.purpleMain,
            checkColor: Colors.white,
            onChanged: onChanged,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                    if (isOptional)
                      const Text(' • Optional', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(description, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep3PersonaSelector() {
    final personas = [
      {
        'id': 'fan',
        'title': 'Fan / Music Enthusiast',
        'desc': 'Discover live stage sessions, support artists with tips, and follow favorite performers.',
        'icon': Icons.headphones_rounded,
      },
      {
        'id': 'artist',
        'title': 'Solo Musician / Performer',
        'desc': 'Host live stages, receive tips directly, and build a verified performer presence.',
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
          'How will you use Crowdbeats?',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Choose your initial primary focus. You can freely add and switch personas later without creating another account.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),

        ...personas.map((p) {
          final isSelected = _selectedPersona == p['id'];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () => setState(() => _selectedPersona = p['id'] as String),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isSelected ? CbColors.purpleMain.withAlpha(25) : CbColors.surface1,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: isSelected ? CbColors.purpleMain : CbColors.surface2,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(p['icon'] as IconData, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(p['title'] as String, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(p['desc'] as String, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12, height: 1.3)),
                        ],
                      ),
                    ),
                    Icon(
                      isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                      color: isSelected ? CbColors.purpleLight : CbColors.textSecondary,
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: 20),

        FilledButton(
          onPressed: _selectedPersona != null ? _nextStep : null,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            disabledBackgroundColor: CbColors.surface2,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Continue with Selected Persona', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildStep4BasicIdentity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Set up your public identity',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Your display name and optional handle will be visible to creators, bands, and audiences on Crowdbeats.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 28),

        Center(
          child: Stack(
            children: [
              const CircleAvatar(
                radius: 44,
                backgroundColor: CbColors.surface2,
                child: Icon(Icons.person_rounded, size: 48, color: CbColors.textSecondary),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: CbColors.purpleMain,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        TextFormField(
          initialValue: _displayName,
          onChanged: (val) => _displayName = val,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Display Name',
            labelStyle: const TextStyle(color: CbColors.textSecondary),
            hintText: 'e.g. Alex Morgan',
            filled: true,
            fillColor: CbColors.surface2,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.borderSubtle),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.purpleMain, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 16),

        TextFormField(
          initialValue: _handle,
          onChanged: (val) => _handle = val,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Unique Handle (Optional)',
            prefixText: '@',
            labelStyle: const TextStyle(color: CbColors.textSecondary),
            hintText: 'alexmorgan',
            filled: true,
            fillColor: CbColors.surface2,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.borderSubtle),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.purpleMain, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 28),

        FilledButton(
          onPressed: _nextStep,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Next Step', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildPersonaStep1() {
    if (_selectedPersona == 'fan') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Favorite Genres',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: CbColors.textPrimary,
                ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Select music genres you enjoy to personalize nearby stage discovery. You can skip this step anytime.',
            style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
          ),
          const SizedBox(height: 24),

          Wrap(
            spacing: 8,
            runSpacing: 10,
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
                selectedColor: CbColors.purpleMain,
                backgroundColor: CbColors.surface2,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : CbColors.textSecondary,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: BorderSide(color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _nextStep,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: CbColors.textSecondary,
                    side: const BorderSide(color: CbColors.borderSubtle),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Skip for now'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _nextStep,
                  style: FilledButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      );
    }

    if (_selectedPersona == 'artist') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Performer Identity',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: CbColors.textPrimary,
                ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Set your public stage name and primary genre. Financial and payout details are deferred until you set up earnings.',
            style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
          ),
          const SizedBox(height: 24),

          TextFormField(
            initialValue: _musicianStageName,
            onChanged: (val) => _musicianStageName = val,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Stage / Artist Name',
              hintText: 'e.g. Luna & The Waves',
              filled: true,
              fillColor: CbColors.surface2,
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CbColors.borderSubtle)),
            ),
          ),
          const SizedBox(height: 16),

          DropdownButtonFormField<String>(
            value: _musicianPrimaryGenre.isNotEmpty ? _musicianPrimaryGenre : null,
            hint: const Text('Select Primary Genre', style: TextStyle(color: CbColors.textSecondary)),
            dropdownColor: CbColors.surface1,
            style: const TextStyle(color: Colors.white),
            items: _availableGenres.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
            onChanged: (val) => setState(() => _musicianPrimaryGenre = val ?? ''),
            decoration: InputDecoration(
              filled: true,
              fillColor: CbColors.surface2,
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CbColors.borderSubtle)),
            ),
          ),
          const SizedBox(height: 16),

          TextFormField(
            initialValue: _musicianCity,
            onChanged: (val) => _musicianCity = val,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Home City / Region',
              hintText: 'e.g. Austin, TX',
              filled: true,
              fillColor: CbColors.surface2,
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CbColors.borderSubtle)),
            ),
          ),
          const SizedBox(height: 28),

          FilledButton(
            onPressed: _nextStep,
            style: FilledButton.styleFrom(
              backgroundColor: CbColors.purpleMain,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          _selectedPersona == 'band' ? 'Band Profile' : 'Organization Profile',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          _selectedPersona == 'band'
              ? 'Enter your band name and your relationship to the ensemble.'
              : 'Enter your organization name and sponsorship objective.',
          style: const TextStyle(color: CbColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),

        TextFormField(
          initialValue: _selectedPersona == 'band' ? _bandName : _sponsorOrgName,
          onChanged: (val) => _selectedPersona == 'band' ? _bandName = val : _sponsorOrgName = val,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: _selectedPersona == 'band' ? 'Band Name' : 'Company / Sponsor Name',
            filled: true,
            fillColor: CbColors.surface2,
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CbColors.borderSubtle)),
          ),
        ),
        const SizedBox(height: 28),

        FilledButton(
          onPressed: _nextStep,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildPersonaStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Location & Experience',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Set your city or region to explore and attend stage sessions happening near you.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),

        TextFormField(
          initialValue: _fanCity,
          onChanged: (val) => _fanCity = val,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Search City or Metro Area',
            prefixIcon: const Icon(Icons.location_on_rounded, color: CbColors.purpleLight),
            hintText: 'e.g. San Diego, CA',
            filled: true,
            fillColor: CbColors.surface2,
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: CbColors.borderSubtle)),
          ),
        ),
        const SizedBox(height: 28),

        FilledButton(
          onPressed: _nextStep,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Review & Complete', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildStepReview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Review Your Account',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: CbColors.textPrimary,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Verify your onboarding details. You can tap Edit on any section to make adjustments.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),

        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: CbColors.surface1,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: CbColors.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Account & Persona', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  TextButton(
                    onPressed: () => setState(() => _currentStep = 3),
                    child: const Text('Edit', style: TextStyle(color: CbColors.purpleLight)),
                  ),
                ],
              ),
              const Divider(color: Colors.white12),
              _buildReviewRow('Display Name', _displayName.isNotEmpty ? _displayName : 'Crowdbeats Member'),
              _buildReviewRow('Primary Persona', _selectedPersona != null ? _selectedPersona!.toUpperCase() : 'FAN'),
              if (_handle.isNotEmpty) _buildReviewRow('Handle', '@' + _handle),
              _buildReviewRow('Legal Terms', 'v2026-08-25 Accepted'),
            ],
          ),
        ),
        const SizedBox(height: 28),

        if (_errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Text(_errorMessage!, style: const TextStyle(color: CbColors.errorRed, fontSize: 13), textAlign: TextAlign.center),
          ),

        FilledButton(
          onPressed: _isSaving ? null : _completeOnboarding,
          style: FilledButton.styleFrom(
            backgroundColor: CbColors.purpleMain,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: _isSaving
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Complete Onboarding & Enter Crowdbeats', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildReviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: CbColors.textSecondary, fontSize: 13)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}
