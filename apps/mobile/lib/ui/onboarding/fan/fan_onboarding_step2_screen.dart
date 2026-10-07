// Crowdbeats V2 — Fan Onboarding Step 2: Preferences & Artists (Stitch Screen 7)

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_pill_button.dart';
import '../../components/cb_linear_step_indicator.dart';
import 'fan_onboarding_model.dart';

class FanOnboardingStep2Screen extends StatefulWidget {
  const FanOnboardingStep2Screen({
    super.key,
    required this.data,
    required this.onNext,
    required this.onBack,
  });

  final FanOnboardingData data;
  final VoidCallback onNext;
  final VoidCallback onBack;

  @override
  State<FanOnboardingStep2Screen> createState() => _FanOnboardingStep2ScreenState();
}

class _FanOnboardingStep2ScreenState extends State<FanOnboardingStep2Screen> {
  final TextEditingController _artistSearchController = TextEditingController();

  final List<Map<String, dynamic>> _genreList = [
    {'name': 'Rock', 'icon': Icons.electric_bolt},
    {'name': 'Pop', 'icon': Icons.mic_none},
    {'name': 'Hip Hop', 'icon': Icons.headphones},
    {'name': 'Country', 'icon': Icons.star_border},
    {'name': 'EDM', 'icon': Icons.grid_view},
    {'name': 'R&B', 'icon': Icons.favorite_border},
    {'name': 'Indie', 'icon': Icons.auto_awesome},
    {'name': 'Jazz', 'icon': Icons.wine_bar},
    {'name': 'Alternative', 'icon': Icons.flash_on},
    {'name': 'Latin', 'icon': Icons.local_fire_department},
    {'name': 'Classical', 'icon': Icons.piano},
    {'name': 'Other', 'icon': Icons.more_horiz},
  ];

  final List<Map<String, dynamic>> _discoveryList = [
    {'name': 'Live Events', 'icon': Icons.calendar_today},
    {'name': 'Friends', 'icon': Icons.people_outline},
    {'name': 'Social Media', 'icon': Icons.favorite_border},
    {'name': 'Streaming Apps', 'icon': Icons.music_note},
    {'name': 'Other', 'icon': Icons.more_horiz},
  ];

  @override
  void dispose() {
    _artistSearchController.dispose();
    super.dispose();
  }

  void _addArtist(String artist) {
    if (artist.trim().isNotEmpty && widget.data.favoriteArtists.length < 5) {
      if (!widget.data.favoriteArtists.contains(artist.trim())) {
        setState(() {
          widget.data.favoriteArtists.add(artist.trim());
          _artistSearchController.clear();
        });
      }
    }
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
              const CbLinearStepIndicator(currentStep: 2, totalSteps: 4),
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
                    TextSpan(text: 'Tell us more\n'),
                    TextSpan(
                      text: 'about you',
                      style: TextStyle(color: CbColors.purpleLight),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Help us personalize Crowdbeats for the music you love.',
                style: TextStyle(
                  fontSize: 14,
                  color: CbColors.textSecondary,
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              // Favorite Music Genres
              const Text(
                'Favorite Music Genres',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary),
              ),
              const SizedBox(height: 2),
              const Text('Select all that you love', style: TextStyle(fontSize: 12, color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s3),

              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 2.8,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: _genreList.length,
                itemBuilder: (context, index) {
                  final genre = _genreList[index];
                  final String name = genre['name'] as String;
                  final IconData icon = genre['icon'] as IconData;
                  final bool isSelected = widget.data.favoriteGenres.contains(name);

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          widget.data.favoriteGenres.remove(name);
                        } else {
                          widget.data.favoriteGenres.add(name);
                        }
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 120),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                        border: Border.all(
                          color: isSelected ? CbColors.purpleMain : CbColors.borderSubtle,
                          width: isSelected ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(icon, size: 16, color: isSelected ? CbColors.purpleLight : CbColors.textMuted),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              name,
                              style: TextStyle(
                                color: isSelected ? Colors.white : CbColors.textSecondary,
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                          ),
                          if (isSelected)
                            const Icon(Icons.check, size: 14, color: CbColors.purpleLight),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: CbSpacing.s6),

              // Discovery Channels
              const Text(
                'How do you usually discover music?',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary),
              ),
              const SizedBox(height: 2),
              const Text('Select all that apply', style: TextStyle(fontSize: 12, color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s3),

              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _discoveryList.map((ch) {
                    final String name = ch['name'] as String;
                    final IconData icon = ch['icon'] as IconData;
                    final bool isSelected = widget.data.discoveryChannels.contains(name);

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            widget.data.discoveryChannels.remove(name);
                          } else {
                            widget.data.discoveryChannels.add(name);
                          }
                        });
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: CbColors.surface2,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                          border: Border.all(
                            color: isSelected ? CbColors.purpleMain : CbColors.borderSubtle,
                            width: isSelected ? 1.5 : 1.0,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(icon, size: 16, color: isSelected ? CbColors.purpleLight : CbColors.textMuted),
                            const SizedBox(width: 8),
                            Text(
                              name,
                              style: TextStyle(
                                color: isSelected ? Colors.white : CbColors.textSecondary,
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              // Favorite Artists / Bands Tags
              const Text(
                'Who are your favorite artists or bands?',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary),
              ),
              const SizedBox(height: 2),
              const Text('Add up to 5 (optional)', style: TextStyle(fontSize: 12, color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s3),

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
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: widget.data.favoriteArtists.map((artist) {
                        return Chip(
                          label: Text(artist, style: const TextStyle(fontSize: 12, color: Colors.white)),
                          deleteIcon: const Icon(Icons.close, size: 14, color: CbColors.textMuted),
                          onDeleted: () {
                            setState(() {
                              widget.data.favoriteArtists.remove(artist);
                            });
                          },
                          backgroundColor: CbColors.surface3,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                          side: const BorderSide(color: CbColors.borderSubtle),
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _artistSearchController,
                      onSubmitted: _addArtist,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Search artists or bands...',
                        hintStyle: TextStyle(color: CbColors.textMuted, fontSize: 13),
                        prefixIcon: Icon(Icons.search, color: CbColors.textMuted, size: 18),
                        prefixIconConstraints: BoxConstraints(minWidth: 36, minHeight: 36),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s6),

              // Notification Preferences
              const Text(
                'Notification Preferences',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CbColors.textPrimary),
              ),
              const SizedBox(height: 2),
              const Text('Choose what you want to stay updated on.', style: TextStyle(fontSize: 12, color: CbColors.textSecondary)),
              const SizedBox(height: CbSpacing.s3),

              Container(
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Column(
                  children: [
                    _buildSwitchTile(
                      icon: Icons.calendar_today,
                      title: 'Live shows near me',
                      value: widget.data.notifyLiveShows,
                      onChanged: (v) => setState(() => widget.data.notifyLiveShows = v),
                    ),
                    const Divider(color: CbColors.borderSubtle, height: 1),
                    _buildSwitchTile(
                      icon: Icons.campaign,
                      title: 'New campaigns from artists I follow',
                      value: widget.data.notifyCampaigns,
                      onChanged: (v) => setState(() => widget.data.notifyCampaigns = v),
                    ),
                    const Divider(color: CbColors.borderSubtle, height: 1),
                    _buildSwitchTile(
                      icon: Icons.favorite_border,
                      title: 'Tips & activity',
                      value: widget.data.notifyTipsActivity,
                      onChanged: (v) => setState(() => widget.data.notifyTipsActivity = v),
                    ),
                    const Divider(color: CbColors.borderSubtle, height: 1),
                    _buildSwitchTile(
                      icon: Icons.card_giftcard,
                      title: 'Special offers & giveaways',
                      value: widget.data.notifySpecialOffers,
                      onChanged: (v) => setState(() => widget.data.notifySpecialOffers = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s8),

              // Continue CTA
              CbPillButton(
                label: 'Continue',
                trailingIcon: const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                onPressed: widget.onNext,
              ),
              const SizedBox(height: CbSpacing.s6),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      secondary: Icon(icon, size: 20, color: CbColors.textSecondary),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
      ),
      value: value,
      activeThumbColor: Colors.white,
      activeTrackColor: CbColors.purpleMain,
      inactiveTrackColor: CbColors.surface3,
      onChanged: onChanged,
    );
  }
}
