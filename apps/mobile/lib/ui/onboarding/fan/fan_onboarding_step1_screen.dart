// Crowdbeats V2 — Fan Onboarding Step 1: Basic Info (Stitch Screen 2)

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_pill_button.dart';
import '../../components/cb_form_field.dart';
import '../../components/cb_linear_step_indicator.dart';
import 'fan_onboarding_model.dart';

class FanOnboardingStep1Screen extends StatefulWidget {
  const FanOnboardingStep1Screen({
    super.key,
    required this.data,
    required this.onNext,
    this.onBack,
  });

  final FanOnboardingData data;
  final VoidCallback onNext;
  final VoidCallback? onBack;

  @override
  State<FanOnboardingStep1Screen> createState() => _FanOnboardingStep1ScreenState();
}

class _FanOnboardingStep1ScreenState extends State<FanOnboardingStep1Screen> {
  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _usernameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;

  final List<String> _genreOptions = [
    'Rock', 'Pop', 'Hip Hop', 'Country', 'EDM', 'R&B', 'Indie', 'Other',
  ];

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.data.firstName);
    _lastNameController = TextEditingController(text: widget.data.lastName);
    _usernameController = TextEditingController(text: widget.data.username);
    _emailController = TextEditingController(text: widget.data.email);
    _phoneController = TextEditingController(text: widget.data.phone);
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _saveData() {
    widget.data.firstName = _firstNameController.text;
    widget.data.lastName = _lastNameController.text;
    widget.data.username = _usernameController.text;
    widget.data.email = _emailController.text;
    widget.data.phone = _phoneController.text;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: widget.onBack != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                tooltip: 'Back',
                onPressed: widget.onBack,
              )
            : null,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5, vertical: CbSpacing.s2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress Bar
              const CbLinearStepIndicator(currentStep: 1, totalSteps: 4),
              const SizedBox(height: CbSpacing.s5),

              // Title & Subtitle
              RichText(
                text: const TextSpan(
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: CbColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                  children: [
                    TextSpan(text: 'Create your '),
                    TextSpan(
                      text: 'Fan',
                      style: TextStyle(color: CbColors.purpleLight),
                    ),
                    TextSpan(text: ' profile'),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Join Crowdbeats and start supporting the music you love.',
                style: TextStyle(
                  fontSize: 14,
                  color: CbColors.textSecondary,
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Live Concert Atmosphere Hero Banner (Vision Board Panel 1)
              Container(
                height: 110,
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                  border: Border.all(color: const Color(0x26A855F7)),
                  image: const DecorationImage(
                    image: AssetImage('assets/images/fan_onboarding_hero.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xCC0B0C10)],
                    ),
                  ),
                  alignment: Alignment.bottomLeft,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: const Row(
                    children: [
                      Icon(Icons.music_note, color: CbColors.purpleLight, size: 16),
                      SizedBox(width: 6),
                      Text(
                        'Direct support for live underground performers',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s5),

              // Profile Picture Section
              const Text(
                'Profile Picture',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: CbColors.textPrimary,
                ),
              ),
              const SizedBox(height: CbSpacing.s3),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Avatar with camera badge
                  Stack(
                    children: [
                      Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: CbColors.surface2,
                          border: Border.all(color: CbColors.purpleMain, width: 2),
                          image: const DecorationImage(
                            image: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: CbColors.purpleMain,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: CbSpacing.s4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Show your love for live music!',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: CbColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Add a photo so artists and bands can see who\'s supporting them.',
                          style: TextStyle(
                            fontSize: 11,
                            color: CbColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            OutlinedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.image, size: 14, color: Colors.white),
                              label: const Text('Choose Photo', style: TextStyle(color: Colors.white, fontSize: 12)),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: CbColors.purpleMain),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                minimumSize: const Size(0, 48),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed: () {},
                              tooltip: 'Remove photo',
                              icon: const Icon(Icons.delete_outline, color: CbColors.textSecondary, size: 20),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s6),

              // Basic Information Form
              const Text(
                'Basic Information',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: CbColors.textPrimary,
                ),
              ),
              const SizedBox(height: CbSpacing.s3),
              Row(
                children: [
                  Expanded(
                    child: CbFormField(
                      label: 'First Name',
                      controller: _firstNameController,
                      leadingIcon: const Icon(Icons.person_outline, size: 18, color: CbColors.textMuted),
                    ),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Expanded(
                    child: CbFormField(
                      label: 'Last Name',
                      controller: _lastNameController,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s3),
              CbFormField(
                label: 'Username',
                controller: _usernameController,
                leadingIcon: const Icon(Icons.alternate_email, size: 18, color: CbColors.textMuted),
                isValid: true,
                validationText: '✓ Available',
              ),
              const SizedBox(height: CbSpacing.s3),
              CbFormField(
                label: 'Email Address',
                controller: _emailController,
                leadingIcon: const Icon(Icons.email_outlined, size: 18, color: CbColors.textMuted),
                isValid: true,
              ),
              const SizedBox(height: CbSpacing.s3),
              CbFormField(
                label: 'Phone Number (Optional)',
                controller: _phoneController,
                leadingIcon: const Icon(Icons.phone_outlined, size: 18, color: CbColors.textMuted),
              ),
              const SizedBox(height: CbSpacing.s6),

              // Music Preferences
              const Text(
                'Tell us about you (Optional)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: CbColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'What kind of music do you love?',
                style: TextStyle(fontSize: 12, color: CbColors.textSecondary),
              ),
              const SizedBox(height: CbSpacing.s3),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _genreOptions.map((genre) {
                  final bool isSelected = widget.data.quickGenres.contains(genre);
                  return FilterChip(
                    label: Text(genre),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          widget.data.quickGenres.add(genre);
                        } else {
                          widget.data.quickGenres.remove(genre);
                        }
                      });
                    },
                    selectedColor: CbColors.purpleMain,
                    backgroundColor: CbColors.surface2,
                    checkmarkColor: Colors.white,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : CbColors.textSecondary,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                      side: BorderSide(
                        color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: CbSpacing.s6),

              // Connect Socials
              const Text(
                'Connect your socials (Optional)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: CbColors.textPrimary,
                ),
              ),
              const SizedBox(height: CbSpacing.s3),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: ['Instagram', 'TikTok', 'Facebook', 'X', 'YouTube'].map((social) {
                  return Container(
                    width: 54,
                    height: 48,
                    decoration: BoxDecoration(
                      color: CbColors.surface2,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                      border: Border.all(color: CbColors.borderSubtle),
                    ),
                    child: Center(
                      child: Icon(
                        social == 'Instagram' ? Icons.camera_alt_outlined
                            : social == 'TikTok' ? Icons.music_note
                            : social == 'Facebook' ? Icons.facebook
                            : social == 'YouTube' ? Icons.play_circle_fill
                            : Icons.alternate_email,
                        size: 20,
                        color: Colors.white,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: CbSpacing.s8),

              // Continue CTA
              CbPillButton(
                label: 'Continue',
                trailingIcon: const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                onPressed: () {
                  _saveData();
                  widget.onNext();
                },
              ),
              const SizedBox(height: CbSpacing.s3),
              const Center(
                child: Text(
                  'You can update your profile anytime in settings.',
                  style: TextStyle(fontSize: 11, color: CbColors.textMuted),
                ),
              ),
              const SizedBox(height: CbSpacing.s6),
            ],
          ),
        ),
      ),
    );
  }
}
