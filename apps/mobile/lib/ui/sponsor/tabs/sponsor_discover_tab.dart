// Crowdbeats V2 — Sponsor Discover Tab
// Talent and Venue discovery engine with search bar, category chips,
// PerformerSpotlightCards, advanced filter bottom sheet, and sponsorship offer workflow.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';
import '../state/sponsor_state.dart';
import '../widgets/performer_spotlight_card.dart';

class SponsorDiscoverTab extends ConsumerStatefulWidget {
  const SponsorDiscoverTab({super.key});

  @override
  ConsumerState<SponsorDiscoverTab> createState() => _SponsorDiscoverTabState();
}

class _SponsorDiscoverTabState extends ConsumerState<SponsorDiscoverTab> {
  late final TextEditingController _searchController;
  static const _categories = ['All', 'Indie', 'Rock', 'Electronic', 'R&B', 'Venues', 'Jazz'];

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: ref.read(sponsorProvider).searchQuery);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sponsorProvider);
    final notifier = ref.read(sponsorProvider.notifier);

    // Apply filtering: search query, category chip, city, and min draw
    final filteredTalent = state.talentList.where((talent) {
      // 1. Category chip
      if (state.selectedCategory != 'All') {
        if (state.selectedCategory == 'Venues') {
          if (talent.type != 'Venue') return false;
        } else if (talent.primaryGenre != state.selectedCategory) {
          return false;
        }
      }

      // 2. Search query
      if (state.searchQuery.isNotEmpty) {
        final query = state.searchQuery.toLowerCase();
        final matchesName = talent.name.toLowerCase().contains(query);
        final matchesGenre = talent.primaryGenre.toLowerCase().contains(query);
        final matchesCity = talent.city.toLowerCase().contains(query);
        if (!matchesName && !matchesGenre && !matchesCity) return false;
      }

      // 3. City filter
      if (state.cityFilter != null && state.cityFilter!.isNotEmpty) {
        if (!talent.city.toLowerCase().contains(state.cityFilter!.toLowerCase())) {
          return false;
        }
      }

      // 4. Min draw filter
      if (state.minDrawFilter != null) {
        if (talent.averageDraw < state.minDrawFilter!) {
          return false;
        }
      }

      return true;
    }).toList();

    final hasActiveFilters = state.cityFilter != null || state.minDrawFilter != null;

    return ListView(
      padding: const EdgeInsets.only(
        top: CbSpacing.s4,
        bottom: 100, // accommodate bottom nav bar
      ),
      children: [
        // Title & Search Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Talent & Venue Discovery',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Find high-engagement performers & stages for brand activations.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Search Bar & Filter Button
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: CbColors.surface1,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        border: Border.all(color: const Color(0x2BFFFFFF)),
                      ),
                      child: TextField(
                        controller: _searchController,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        onChanged: (val) => notifier.setSearchQuery(val.trim()),
                        decoration: InputDecoration(
                          hintText: 'Search artist, band, venue, city...',
                          hintStyle: const TextStyle(color: CbColors.textMuted, fontSize: 13),
                          prefixIcon: const Icon(Icons.search, color: CbColors.purpleLight, size: 20),
                          suffixIcon: _searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, color: Colors.white60, size: 18),
                                  onPressed: () {
                                    _searchController.clear();
                                    notifier.setSearchQuery('');
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: CbSpacing.s2),

                  // Filter Modal Trigger (Min 48x48dp touch target)
                  Semantics(
                    button: true,
                    label: 'Open Discovery Filters',
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: hasActiveFilters ? CbColors.purpleMain : CbColors.surface1,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: hasActiveFilters ? CbColors.purpleLight : const Color(0x2BFFFFFF),
                        ),
                      ),
                      child: IconButton(
                        icon: Icon(
                          Icons.tune,
                          color: hasActiveFilters ? Colors.white : CbColors.purpleLight,
                          size: 20,
                        ),
                        onPressed: () => _openFilterBottomSheet(context),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: CbSpacing.s3),

        // Horizontal Category Chips
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            itemCount: _categories.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final cat = _categories[index];
              final isSelected = state.selectedCategory == cat;

              return ChoiceChip(
                label: Text(cat),
                selected: isSelected,
                onSelected: (_) => notifier.setSelectedCategory(cat),
                selectedColor: CbColors.purpleMain,
                backgroundColor: CbColors.surface1,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : CbColors.textSecondary,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                  side: BorderSide(
                    color: isSelected ? CbColors.purpleLight : const Color(0x1FFFFFFF),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: CbSpacing.s4),

        // Active Filter Indicators / Reset
        if (hasActiveFilters)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: Row(
              children: [
                if (state.cityFilter != null) ...[
                  Chip(
                    backgroundColor: CbColors.surface2,
                    label: Text('City: ${state.cityFilter}', style: const TextStyle(color: Colors.white, fontSize: 11)),
                    deleteIcon: const Icon(Icons.close, size: 14, color: Colors.white60),
                    onDeleted: () => notifier.setFilterCriteria(city: null, minDraw: state.minDrawFilter),
                  ),
                  const SizedBox(width: 6),
                ],
                if (state.minDrawFilter != null) ...[
                  Chip(
                    backgroundColor: CbColors.surface2,
                    label: Text('${state.minDrawFilter}+ Draw', style: const TextStyle(color: Colors.white, fontSize: 11)),
                    deleteIcon: const Icon(Icons.close, size: 14, color: Colors.white60),
                    onDeleted: () => notifier.setFilterCriteria(city: state.cityFilter, minDraw: null),
                  ),
                  const SizedBox(width: 6),
                ],
                TextButton(
                  onPressed: () => notifier.setFilterCriteria(city: null, minDraw: null),
                  child: const Text('Reset', style: TextStyle(color: CbColors.purpleLight, fontSize: 12)),
                ),
              ],
            ),
          ),

        // Talent Cards List
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: filteredTalent.isEmpty
              ? _buildEmptyState(context)
              : Column(
                  children: filteredTalent.map((talent) {
                    return PerformerSpotlightCard(
                      talent: talent,
                      onToggleBookmark: () => notifier.toggleTalentBookmark(talent.id),
                      onOfferSponsorship: (t) => _openOfferSponsorshipModal(context, t),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(CbSpacing.s6),
      margin: const EdgeInsets.only(top: CbSpacing.s4),
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: Center(
        child: Column(
          children: [
            const Icon(Icons.search_off_rounded, color: CbColors.textMuted, size: 42),
            const SizedBox(height: CbSpacing.s3),
            const Text(
              'No matches found',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'Try adjusting your search criteria or resetting filters.',
              style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: CbSpacing.s4),
            OutlinedButton(
              onPressed: () {
                _searchController.clear();
                ref.read(sponsorProvider.notifier).setSearchQuery('');
                ref.read(sponsorProvider.notifier).setSelectedCategory('All');
                ref.read(sponsorProvider.notifier).setFilterCriteria(city: null, minDraw: null);
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: CbColors.purpleLight,
                side: const BorderSide(color: CbColors.purpleLight),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                ),
              ),
              child: const Text('Reset All Filters'),
            ),
          ],
        ),
      ),
    );
  }

  void _openFilterBottomSheet(BuildContext context) {
    final state = ref.read(sponsorProvider);
    String? selectedCity = state.cityFilter;
    int? selectedMinDraw = state.minDrawFilter;

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (modalContext, setModalState) {
          const cities = ['Austin', 'Los Angeles', 'New York', 'Nashville', 'Chicago', 'Dallas'];
          const draws = [500, 1000, 1500, 2000];

          return Container(
            padding: const EdgeInsets.all(CbSpacing.s5),
            decoration: const BoxDecoration(
              color: CbColors.surface1,
              borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
              border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1.5)),
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Filter Talent & Venues',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white54),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: CbSpacing.s3),

                  // City / Location Filter
                  const Text('Metropolitan Area', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: CbSpacing.s2),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: cities.map((city) {
                      final isSelected = selectedCity == city;
                      return ChoiceChip(
                        label: Text(city),
                        selected: isSelected,
                        onSelected: (val) {
                          setModalState(() {
                            selectedCity = val ? city : null;
                          });
                        },
                        selectedColor: CbColors.purpleMain,
                        backgroundColor: CbColors.surface2,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : CbColors.textSecondary,
                          fontSize: 12,
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: CbSpacing.s4),

                  // Minimum Draw Filter
                  const Text('Minimum Audience Draw', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: CbSpacing.s2),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: draws.map((draw) {
                      final isSelected = selectedMinDraw == draw;
                      return ChoiceChip(
                        label: Text('$draw+ attendees'),
                        selected: isSelected,
                        onSelected: (val) {
                          setModalState(() {
                            selectedMinDraw = val ? draw : null;
                          });
                        },
                        selectedColor: CbColors.purpleMain,
                        backgroundColor: CbColors.surface2,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : CbColors.textSecondary,
                          fontSize: 12,
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: CbSpacing.s5),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setModalState(() {
                              selectedCity = null;
                              selectedMinDraw = null;
                            });
                            ref.read(sponsorProvider.notifier).setFilterCriteria(city: null, minDraw: null);
                            Navigator.of(ctx).pop();
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white70,
                            side: const BorderSide(color: Colors.white24),
                            minimumSize: const Size.fromHeight(48),
                          ),
                          child: const Text('Clear All'),
                        ),
                      ),
                      const SizedBox(width: CbSpacing.s3),
                      Expanded(
                        child: FilledButton(
                          onPressed: () {
                            ref.read(sponsorProvider.notifier).setFilterCriteria(
                                  city: selectedCity,
                                  minDraw: selectedMinDraw,
                                );
                            Navigator.of(ctx).pop();
                          },
                          style: FilledButton.styleFrom(
                            backgroundColor: CbColors.purpleMain,
                            minimumSize: const Size.fromHeight(48),
                          ),
                          child: const Text('Apply Filters'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _openOfferSponsorshipModal(BuildContext context, TalentProfile talent) {
    final eventNameCtrl = TextEditingController(text: '${talent.name} Brand Activation');
    final amountCtrl = TextEditingController(text: '2500');
    final pitchCtrl = TextEditingController(
      text: 'We would love to sponsor your upcoming tour dates with gear and marketing backing.',
    );
    final selectedDeliverables = <String>{
      'Logo on digital event flyers',
      'Live shoutout before encore',
      'VIP passes for sponsor team',
    };

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (modalContext, setModalState) {
          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.90,
            ),
            padding: const EdgeInsets.all(CbSpacing.s5),
            decoration: const BoxDecoration(
              color: CbColors.surface1,
              borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
              border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1.5)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Offer Sponsorship',
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Propose deal to ${talent.name}',
                            style: const TextStyle(color: CbColors.purpleLight, fontSize: 12),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white54),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                  const Divider(color: Color(0x14FFFFFF)),
                  Expanded(
                    child: ListView(
                      children: [
                        const SizedBox(height: CbSpacing.s2),
                        TextField(
                          controller: eventNameCtrl,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Campaign / Event Name',
                            filled: true,
                            fillColor: CbColors.surface2,
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: CbSpacing.s3),
                        TextField(
                          controller: amountCtrl,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          decoration: const InputDecoration(
                            labelText: 'Compensation (USD \$)',
                            prefixText: '\$ ',
                            prefixStyle: TextStyle(color: CbColors.liveGreen, fontWeight: FontWeight.bold),
                            filled: true,
                            fillColor: CbColors.surface2,
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: CbSpacing.s3),
                        TextField(
                          controller: pitchCtrl,
                          maxLines: 2,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            labelText: 'Sponsor Pitch & Scope',
                            filled: true,
                            fillColor: CbColors.surface2,
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: CbSpacing.s4),
                        const Text(
                          'Required Deliverables',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: CbSpacing.s2),
                        ...[
                          'Logo on digital event flyers',
                          'Live shoutout before encore',
                          'VIP passes for sponsor team',
                          'Stage banner placement',
                          'Dedicated Instagram reel / post',
                        ].map((del) {
                          final isChecked = selectedDeliverables.contains(del);
                          return CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            activeColor: CbColors.purpleMain,
                            title: Text(del, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                            value: isChecked,
                            onChanged: (val) {
                              setModalState(() {
                                if (val == true) {
                                  selectedDeliverables.add(del);
                                } else {
                                  selectedDeliverables.remove(del);
                                }
                              });
                            },
                          );
                        }),
                      ],
                    ),
                  ),
                  const SizedBox(height: CbSpacing.s3),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton(
                      onPressed: () {
                        final dollars = int.tryParse(amountCtrl.text.trim()) ?? 1000;
                        ref.read(sponsorProvider.notifier).offerSponsorship(
                              talent: talent,
                              amountCents: dollars * 100,
                              eventName: eventNameCtrl.text.trim(),
                              pitch: pitchCtrl.text.trim(),
                              deliverables: selectedDeliverables.toList(),
                            );
                        Navigator.of(ctx).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: CbColors.liveGreen,
                            content: Text('Sponsorship offer dispatched to ${talent.name}!'),
                          ),
                        );
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: CbColors.purpleMain,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        ),
                      ),
                      child: const Text('Send Official Offer', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
