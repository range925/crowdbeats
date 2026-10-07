// Crowdbeats V2 — Fan Onboarding Step 4: Profile Review (Stitch Screen 6)

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_pill_button.dart';
import '../../components/cb_linear_step_indicator.dart';
import 'fan_onboarding_model.dart';

class FanOnboardingStep4ReviewScreen extends StatelessWidget {
  const FanOnboardingStep4ReviewScreen({
    super.key,
    required this.data,
    required this.onSubmit,
    required this.onEditStep,
    required this.onBack,
    this.isLoading = false,
    this.errorMessage,
  });

  final FanOnboardingData data;
  final VoidCallback onSubmit;
  final ValueChanged<int> onEditStep;
  final VoidCallback onBack;
  final bool isLoading;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: onBack,
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5, vertical: CbSpacing.s2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress Bar
              const CbLinearStepIndicator(currentStep: 4, totalSteps: 4),
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
                    TextSpan(text: 'Review your\n'),
                    TextSpan(
                      text: 'profile',
                      style: TextStyle(color: CbColors.purpleLight),
                    ),
                    TextSpan(text: ' ✓'),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Almost done! Please review your information before creating your Crowdbeats profile.',
                style: TextStyle(
                  fontSize: 14,
                  color: CbColors.textSecondary,
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              if (errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: CbColors.errorRed.withAlpha(30),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: CbColors.errorRed),
                  ),
                  child: Text(errorMessage!, style: const TextStyle(color: Colors.white, fontSize: 13)),
                ),
                const SizedBox(height: CbSpacing.s4),
              ],

              // Card 1: About You
              _buildReviewCard(
                title: 'About You',
                onEdit: () => onEditStep(1),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: CbColors.surface3,
                            border: Border.all(color: CbColors.purpleMain, width: 2),
                            image: const DecorationImage(
                              image: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${data.firstName} ${data.lastName}', style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                              Text('@${data.username}', style: const TextStyle(color: CbColors.purpleLight, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildRow('Email', data.email),
                    _buildRow('Phone', data.phone),
                    _buildRow('Location', data.city),
                    _buildRow('Birth Date', data.birthDate),
                    _buildRow('Occupation', data.occupation),
                    _buildRow('Pronouns', data.pronouns),
                    const SizedBox(height: 6),
                    Text(
                      '"${data.bio}"',
                      style: const TextStyle(color: CbColors.textSecondary, fontSize: 12, fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Card 2: Your Preferences
              _buildReviewCard(
                title: 'Your Preferences',
                onEdit: () => onEditStep(2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildTagSection('Favorite Genres', data.favoriteGenres),
                    const SizedBox(height: 8),
                    _buildTagSection('Discovery Channels', data.discoveryChannels),
                    const SizedBox(height: 8),
                    _buildTagSection('Interests', data.interests),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Card 3: Music Experience & Favorite Artists
              _buildReviewCard(
                title: 'Music Experience & Artists',
                onEdit: () => onEditStep(2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildRow('Show Attendance', data.showFrequency),
                    const SizedBox(height: 6),
                    _buildTagSection('Favorite Artists', data.favoriteArtists),
                    const SizedBox(height: 6),
                    _buildTagSection('Platform Goals', data.platformPriorities),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Card 4: Notification Preferences
              _buildReviewCard(
                title: 'Notification Settings',
                onEdit: () => onEditStep(2),
                child: Column(
                  children: [
                    _buildStatusRow('Live shows near me', data.notifyLiveShows),
                    _buildStatusRow('New campaigns from artists', data.notifyCampaigns),
                    _buildStatusRow('Tips & activity updates', data.notifyTipsActivity),
                    _buildStatusRow('Special offers & giveaways', data.notifySpecialOffers),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s8),

              // Submit Button
              CbPillButton(
                label: 'Create My Profile',
                trailingIcon: const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                isLoading: isLoading,
                onPressed: onSubmit,
              ),
              const SizedBox(height: CbSpacing.s3),
              const Center(
                child: Text(
                  'By creating your profile, you agree to our Terms of Service and Privacy Policy.',
                  textAlign: TextAlign.center,
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

  Widget _buildReviewCard({required String title, required VoidCallback onEdit, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: CbColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Semantics(
                button: true,
                label: 'Edit $title',
                child: TextButton.icon(
                  onPressed: onEdit,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(48, 48),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    tapTargetSize: MaterialTapTargetSize.padded,
                  ),
                  icon: const Icon(Icons.edit, size: 14, color: CbColors.purpleLight),
                  label: const Text(
                    'Edit',
                    style: TextStyle(color: CbColors.purpleLight, fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: CbColors.textMuted, fontSize: 12)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, bool isEnabled) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
          Icon(
            isEnabled ? Icons.check_circle : Icons.cancel,
            size: 16,
            color: isEnabled ? CbColors.liveGreen : CbColors.textMuted,
          ),
        ],
      ),
    );
  }

  Widget _buildTagSection(String label, List<String> tags) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
        const SizedBox(height: 4),
        Wrap(
          spacing: 6,
          runSpacing: 4,
          children: tags.map((tag) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: CbColors.surface3,
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
              ),
              child: Text(tag, style: const TextStyle(color: Colors.white, fontSize: 11)),
            );
          }).toList(),
        ),
      ],
    );
  }
}
