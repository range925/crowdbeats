// Crowdbeats V2 — Fan Onboarding Step 3: Details & Experience (Stitch Screen 4)

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_pill_button.dart';
import '../../components/cb_linear_step_indicator.dart';
import 'fan_onboarding_model.dart';

class FanOnboardingStep3Screen extends StatefulWidget {
  const FanOnboardingStep3Screen({
    super.key,
    required this.data,
    required this.onNext,
    required this.onBack,
  });

  final FanOnboardingData data;
  final VoidCallback onNext;
  final VoidCallback onBack;

  @override
  State<FanOnboardingStep3Screen> createState() => _FanOnboardingStep3ScreenState();
}

class _FanOnboardingStep3ScreenState extends State<FanOnboardingStep3Screen> {
  late final TextEditingController _bioController;
  late final TextEditingController _cityController;
  late final TextEditingController _occupationController;
  late final TextEditingController _pronounsController;

  final List<String> _interestOptions = [
    'Concerts', 'Festivals', 'Travel', 'Photography', 'Art', 'Food', 'Gaming', 'Fitness', 'Fashion', 'Reading', 'Other',
  ];

  final List<String> _frequencyOptions = [
    'Never', 'Rarely', 'Sometimes', 'Often', 'All the time',
  ];

  final List<Map<String, dynamic>> _priorityCards = [
    {'title': 'Discover new artists', 'subtitle': 'Find fresh music and new talent', 'icon': Icons.mic_none},
    {'title': 'Support my favorites', 'subtitle': 'Tip, donate and help artists grow', 'icon': Icons.favorite_border},
    {'title': 'Be in the community', 'subtitle': 'Connect with fans and artists', 'icon': Icons.people_outline},
    {'title': 'Exclusive experiences', 'subtitle': 'VIP access, presales and more', 'icon': Icons.star_border},
  ];

  @override
  void initState() {
    super.initState();
    _bioController = TextEditingController(text: widget.data.bio);
    _cityController = TextEditingController(text: widget.data.city);
    _occupationController = TextEditingController(text: widget.data.occupation);
    _pronounsController = TextEditingController(text: widget.data.pronouns);
  }

  @override
  void dispose() {
    _bioController.dispose();
    _cityController.dispose();
    _occupationController.dispose();
    _pronounsController.dispose();
    super.dispose();
  }

  void _saveData() {
    widget.data.bio = _bioController.text;
    widget.data.city = _cityController.text;
    widget.data.occupation = _occupationController.text;
    widget.data.pronouns = _pronounsController.text;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: widget.onBack,
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5, vertical: CbSpacing.s2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress Bar
              const CbLinearStepIndicator(currentStep: 3, totalSteps: 4),
              const SizedBox(height: CbSpacing.s5),

              // Title
              RichText(
                text: const TextSpan(
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: CbColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                  children: [
                    TextSpan(text: 'Your '),
                    TextSpan(
                      text: 'profile',
                      style: TextStyle(color: CbColors.purpleLight),
                    ),
                    TextSpan(text: ' details'),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Add a few more details to personalize your Crowdbeats experience.',
                style: TextStyle(
                  fontSize: 14,
                  color: CbColors.textSecondary,
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              // About You
              const Text('About You', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary)),
              const SizedBox(height: CbSpacing.s3),

              // Bio textarea
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Short Bio', style: TextStyle(fontSize: 11, color: CbColors.textMuted)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: _bioController,
                      maxLines: 3,
                      maxLength: 160,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                        counterStyle: TextStyle(color: CbColors.textMuted, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s3),

              // City and Birth Date Row
              Row(
                children: [
                  Expanded(
                    child: _buildInputCard('City', _cityController, Icons.location_on_outlined),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildDropdownCard('Birth Date', widget.data.birthDate, Icons.calendar_today_outlined),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s3),

              // Occupation and Pronouns Row
              Row(
                children: [
                  Expanded(
                    child: _buildInputCard('Occupation (Optional)', _occupationController, Icons.work_outline),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildInputCard('Pronouns (Optional)', _pronounsController, Icons.person_outline),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s6),

              // Your Interests
              const Text('Your Interests', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary)),
              const SizedBox(height: 2),
              const Text('What else are you into? (Select all that apply)', style: TextStyle(fontSize: 12, color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s3),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _interestOptions.map((interest) {
                  final bool isSelected = widget.data.interests.contains(interest);
                  return FilterChip(
                    label: Text(interest),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          widget.data.interests.add(interest);
                        } else {
                          widget.data.interests.remove(interest);
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
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                      side: BorderSide(color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: CbSpacing.s6),

              // Your Music Experience
              const Text('Your Music Experience', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary)),
              const SizedBox(height: 2),
              const Text('How often do you go to live shows?', style: TextStyle(fontSize: 12, color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s3),

              // Frequency selector
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _frequencyOptions.map((freq) {
                    final bool isSelected = widget.data.showFrequency == freq;
                    return GestureDetector(
                      onTap: () => setState(() => widget.data.showFrequency = freq),
                      child: Container(
                        margin: const EdgeInsets.only(right: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? CbColors.purpleMain : CbColors.surface2,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          border: Border.all(color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            Text(
                              freq,
                              style: TextStyle(
                                color: isSelected ? Colors.white : CbColors.textSecondary,
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                            if (isSelected) ...[
                              const SizedBox(width: 4),
                              const Icon(Icons.check, size: 14, color: Colors.white),
                            ],
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              // What's most important to you? (Platform priorities)
              const Text("What's most important to you?", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary)),
              const SizedBox(height: CbSpacing.s3),

              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.35,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: _priorityCards.length,
                itemBuilder: (context, index) {
                  final card = _priorityCards[index];
                  final String title = card['title'] as String;
                  final String subtitle = card['subtitle'] as String;
                  final IconData icon = card['icon'] as IconData;
                  final bool isSelected = widget.data.platformPriorities.contains(title);

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          widget.data.platformPriorities.remove(title);
                        } else {
                          widget.data.platformPriorities.add(title);
                        }
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                        border: Border.all(
                          color: isSelected ? CbColors.purpleMain : CbColors.borderSubtle,
                          width: isSelected ? 1.5 : 1.0,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Icon(icon, size: 20, color: isSelected ? CbColors.purpleLight : CbColors.textMuted),
                              if (isSelected)
                                const Icon(Icons.check_circle, size: 16, color: CbColors.purpleLight),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : CbColors.textPrimary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                subtitle,
                                style: const TextStyle(color: CbColors.textMuted, fontSize: 10),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: CbSpacing.s6),

              // Profile Visibility
              const Text('Profile Visibility', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary)),
              const SizedBox(height: CbSpacing.s3),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.public, color: CbColors.textMuted, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        widget.data.profileVisibility,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ),
                    const Icon(Icons.keyboard_arrow_down, color: CbColors.textMuted, size: 18),
                  ],
                ),
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
                  '🔒 Your information is secure and will never be shared.',
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

  Widget _buildInputCard(String label, TextEditingController controller, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
        border: Border.all(color: CbColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
          const SizedBox(height: 2),
          TextField(
            controller: controller,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
            decoration: const InputDecoration(
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.symmetric(vertical: 2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownCard(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
        border: Border.all(color: CbColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
          const SizedBox(height: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
              const Icon(Icons.keyboard_arrow_down, color: CbColors.textMuted, size: 16),
            ],
          ),
        ],
      ),
    );
  }
}
