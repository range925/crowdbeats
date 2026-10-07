// Crowdbeats V2 — PopularSecondaryView
//
// Dedicated secondary screen opened upon tapping "Popular".
// Displays top trending musicians, solo artists, bands, and venues
// ranked by real server signals in the selected location.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/discovery.dart';
import '../../../state/discovery_state.dart';
import '../public_profile_screen.dart';
import '../tip/tip_auth_gate_modal.dart';

class PopularSecondaryView extends ConsumerStatefulWidget {
  const PopularSecondaryView({super.key});

  static Route<void> route() {
    return MaterialPageRoute<void>(
      builder: (_) => const PopularSecondaryView(),
    );
  }

  @override
  ConsumerState<PopularSecondaryView> createState() => _PopularSecondaryViewState();
}

class _PopularSecondaryViewState extends ConsumerState<PopularSecondaryView> {
  int _selectedFilterIndex = 0; // 0: All, 1: Solo Artists, 2: Bands, 3: Venues

  final List<String> _filters = ['Trending', 'Solo Artists', 'Bands', 'Top Venues'];

  @override
  Widget build(BuildContext context) {
    final discovery = ref.watch(discoveryProvider);
    final cityName = discovery.discoveryLocation.city;

    // Filter performers based on selected sub-filter
    final filteredPerformers = discovery.performers.where((p) {
      if (_selectedFilterIndex == 1 && p.type != 'artist') return false;
      if (_selectedFilterIndex == 2 && p.type != 'band') return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0C10),
      appBar: AppBar(
        backgroundColor: const Color(0xFF131315),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Popular in $cityName',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.2,
              ),
            ),
            const Text(
              'Ranked by active fan engagement',
              style: TextStyle(
                color: Color(0xFFF59E0B),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Filter Chips Row
          Container(
            height: 52,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final isSelected = _selectedFilterIndex == index;
                return ChoiceChip(
                  label: Text(_filters[index]),
                  selected: isSelected,
                  onSelected: (_) {
                    setState(() => _selectedFilterIndex = index);
                  },
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                  selectedColor: const Color(0xFFF59E0B),
                  backgroundColor: const Color(0xFF151722),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(9999),
                    side: BorderSide(
                      color: isSelected ? const Color(0xFFF59E0B) : Colors.white.withOpacity(0.08),
                    ),
                  ),
                );
              },
            ),
          ),
          // Content List
          Expanded(
            child: _selectedFilterIndex == 3
                ? _buildVenuesList(discovery.venues)
                : _buildPerformersList(filteredPerformers),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformersList(List<PublicPerformer> performers) {
    if (performers.isEmpty) {
      return const Center(
        child: Text('No performers found in this category', style: TextStyle(color: Color(0xFF94A3B8))),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: performers.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final performer = performers[index];
        final rank = index + 1;

        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => PublicProfileScreen(
                    slug: performer.slug,
                    type: performer.type,
                  ),
                ),
              );
            },
            borderRadius: BorderRadius.circular(16),
            child: Ink(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF151722),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Row(
                children: [
                  // Rank badge
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: rank == 1
                          ? const Color(0xFFF59E0B).withOpacity(0.2)
                          : Colors.white.withOpacity(0.06),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '#$rank',
                      style: TextStyle(
                        color: rank == 1 ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8),
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Avatar
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: const Color(0xFF232533),
                    backgroundImage: performer.photoUrl != null ? NetworkImage(performer.photoUrl!) : null,
                    child: performer.photoUrl == null
                        ? Text(performer.name.substring(0, 1), style: const TextStyle(color: Colors.white))
                        : null,
                  ),
                  const SizedBox(width: 12),
                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                performer.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (performer.isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(Icons.verified_rounded, color: Color(0xFF38BDF8), size: 14),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${performer.genres.join(' · ')} · ${performer.currentVenueName ?? 'Active Artist'}',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  // Tip Button
                  ElevatedButton(
                    onPressed: () {
                      TipAuthGateModal.show(
                        context,
                        creatorId: performer.id,
                        creatorSlug: performer.slug,
                        creatorName: performer.name,
                        creatorType: performer.type,
                        initialAmountCents: 2000,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7C3AED),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Tip', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildVenuesList(List<PublicVenue> venues) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: venues.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final v = venues[index];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF151722),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.stadium_rounded, color: Color(0xFFA855F7), size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      v.name,
                      style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${v.city} · ${v.activeMusicianCount} active live acts',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
