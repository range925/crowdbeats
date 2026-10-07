// Crowdbeats V2 — Fan Onboarding Complete: Welcome (Stitch Screen 5)

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_pill_button.dart';
import '../../components/cb_linear_step_indicator.dart';
import 'fan_onboarding_model.dart';

class FanOnboardingCompleteScreen extends StatelessWidget {
  const FanOnboardingCompleteScreen({
    super.key,
    required this.data,
    required this.onExplore,
  });

  final FanOnboardingData data;
  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5, vertical: CbSpacing.s4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Progress Bar (all 4 checked)
              const CbLinearStepIndicator(
                currentStep: 4,
                totalSteps: 4,
                stepLabels: ['Basic Info', 'Preferences', 'Details', 'Complete'],
              ),
              const SizedBox(height: CbSpacing.s5),

              // Celebratory Stage Hero Banner (Vision Board Panel 5)
              Container(
                height: 130,
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: CbSpacing.s5),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
                  border: Border.all(color: const Color(0x33A855F7), width: 1.5),
                  boxShadow: const [
                    BoxShadow(
                      color: CbColors.purpleGlow,
                      blurRadius: 18,
                      offset: Offset(0, 6),
                    ),
                  ],
                  image: const DecorationImage(
                    image: AssetImage('assets/images/fan_celebration_stage.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xD90B0C10)],
                    ),
                  ),
                  alignment: Alignment.bottomCenter,
                  padding: const EdgeInsets.all(CbSpacing.s3),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_awesome, color: CbColors.rankGold, size: 16),
                      SizedBox(width: 6),
                      Text(
                        'VIP FAN ACCESS UNLOCKED',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Celebratory Avatar & Checkmark
              Stack(
                alignment: Alignment.center,
                children: [
                  // Outer Glow Ring
                  Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: CbColors.purpleGlow.withAlpha(120),
                          blurRadius: 30,
                          spreadRadius: 8,
                        ),
                      ],
                    ),
                  ),
                  // Avatar Photo
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: CbColors.purpleLight, width: 3),
                      image: const DecorationImage(
                        image: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  // Green Check Badge
                  Positioned(
                    bottom: 0,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: CbColors.liveGreen,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check, color: Colors.white, size: 16),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s4),

              // Title
              RichText(
                textAlign: TextAlign.center,
                text: const TextSpan(
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: CbColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                  children: [
                    TextSpan(text: 'Your profile is\n'),
                    TextSpan(
                      text: 'created!',
                      style: TextStyle(color: CbColors.purpleLight),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Welcome to Crowdbeats, ${data.firstName}! You\'re all set to discover music, support artists, and get the most out of every live show.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: CbColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              // Next Steps Section
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'What\'s next? Start exploring and connecting.',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: CbColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s3),

              _buildActionCard(
                icon: Icons.music_note,
                title: 'Discover Artists & Campaigns',
                subtitle: 'Browse live shows and support crowdfunding projects',
                onTap: onExplore,
              ),
              const SizedBox(height: 8),
              _buildActionCard(
                icon: Icons.favorite,
                title: 'Follow Your Favorites',
                subtitle: 'Get notified when they go live or announce new events',
                onTap: onExplore,
              ),
              const SizedBox(height: 8),
              _buildActionCard(
                icon: Icons.qr_code_scanner,
                title: 'Tip at Live Shows',
                subtitle: 'Use Vision Tip to instantly tip performers on stage',
                onTap: onExplore,
              ),
              const SizedBox(height: 8),
              _buildActionCard(
                icon: Icons.notifications_outlined,
                title: 'Stay in the Loop',
                subtitle: 'Customize your notification preferences anytime',
                onTap: onExplore,
              ),
              const SizedBox(height: CbSpacing.s5),

              // Referral Banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: CbColors.purpleDim,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: CbColors.purpleLight.withAlpha(100)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: CbColors.purpleMain,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.card_giftcard, color: Colors.white, size: 18),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Invite friends. Earn rewards.', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          SizedBox(height: 2),
                          Text('Share your invite code with friends', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                        ],
                      ),
                    ),
                    OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: CbColors.purpleLight),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      ),
                      child: const Text('Invite Friends', style: TextStyle(color: Colors.white, fontSize: 11)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s8),

              // Explore CTA
              CbPillButton(
                label: '✨ Explore Crowdbeats',
                trailingIcon: const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                onPressed: onExplore,
              ),
              const SizedBox(height: CbSpacing.s2),
              TextButton(
                onPressed: onExplore,
                child: const Text('Go to Home', style: TextStyle(color: CbColors.textMuted, fontSize: 13)),
              ),
              const SizedBox(height: CbSpacing.s4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: CbColors.surface2,
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(color: CbColors.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: CbColors.surface3,
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
              ),
              child: Icon(icon, color: CbColors.purpleLight, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: CbColors.textMuted, size: 14),
          ],
        ),
      ),
    );
  }
}
