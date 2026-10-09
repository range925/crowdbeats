// Crowdbeats V2 — Location-First Public Discovery Home (Phase 1 Compliant)
//
// Strict First-Screen Visual Hierarchy:
// 1. CROWDBEATS Header (wordmark, "Discover music around you" + Guest "Create account" / "Sign in" buttons)
// 2. Location Search (Search city, town, venue, or area) with Google Places Autocomplete (New)
// 3. Compact Google Map (directly below search field)
// 4. Exactly three Nearby musicians cards (with "See all" action)
// 5. Exactly three Popular on Crowdbeats cards (with "See all" action)
// 6. Exactly three You may like (Suggested) cards (with "See all" action)
// Truthful fewer-than-three and empty states; never duplicate profiles or fabricate cards.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/discovery.dart';
import '../../state/auth_state.dart';
import '../../state/discovery_state.dart';
import '../theme/cb_colors.dart';
import 'widgets/crowdbeats_location_search.dart';
import 'widgets/compact_google_map.dart';
import 'widgets/nearby_creator_card.dart';
import 'widgets/popular_creator_card.dart';
import 'widgets/discovery_campaign_card.dart';
import 'views/nearby_secondary_view.dart';
import 'views/popular_secondary_view.dart';

class PublicDiscoveryHome extends ConsumerStatefulWidget {
  const PublicDiscoveryHome({super.key});

  @override
  ConsumerState<PublicDiscoveryHome> createState() => _PublicDiscoveryHomeState();
}

class _PublicDiscoveryHomeState extends ConsumerState<PublicDiscoveryHome> {
  PublicPerformer? _selectedPerformer;
  bool _dismissedPrimer = false;

  Widget _buildPrimerCard(String icon, String title, String subtitle, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(icon, style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    title,
                    style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              subtitle,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, height: 1.2),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isGuest = authState.status != CbAuthStatus.authenticated;
    final discoveryState = ref.watch(discoveryProvider);
    final discoveryNotifier = ref.read(discoveryProvider.notifier);
    final loc = discoveryState.discoveryLocation;
    final performers = discoveryState.performers;

    // Top 5 Nearby performers matching map markers (Phase 6), Top 3 Popular, and Top Campaigns
    final topNearby = performers.take(5).toList();
    final topPopular = performers.skip(0).take(3).toList();
    final topCampaigns = discoveryState.campaigns;
    final topSuggested = performers.skip(topNearby.length).take(3).toList().isNotEmpty
        ? performers.skip(topNearby.length).take(3).toList()
        : performers.take(3).toList();

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: RefreshIndicator(
          color: CbColors.purpleMain,
          backgroundColor: const Color(0xFF151722),
          onRefresh: () async {
            await Future<void>.delayed(const Duration(milliseconds: 400));
          },
          child: CustomScrollView(
            slivers: [
              // 1. CROWDBEATS Header with Guest Entry Points
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(
                                'CROWDBEATS',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5,
                                  fontFamily: Theme.of(context).textTheme.titleLarge?.fontFamily,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0x1F10B981),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0x6610B981)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      '●',
                                      style: TextStyle(color: Color(0xFF10B981), fontSize: 8),
                                    ),
                                    SizedBox(width: 4),
                                    Text(
                                      'LIVE',
                                      style: TextStyle(
                                        color: Color(0xFF10B981),
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          // Guest Header Entry Points
                          if (isGuest)
                            Row(
                              children: [
                                TextButton(
                                  onPressed: () => context.push('/auth'),
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                    minimumSize: const Size(48, 44),
                                  ),
                                  child: const Text(
                                    'Sign in',
                                    style: TextStyle(
                                      color: Color(0xFFA855F7),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                ElevatedButton(
                                  onPressed: () => context.push('/auth'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: CbColors.purpleMain,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                    minimumSize: const Size(48, 44),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: const Text(
                                    'Join',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Discover music around you',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Lightweight Dismissible Guest Introduction (G1)
              if (isGuest && !_dismissedPrimer)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  sliver: SliverToBoxAdapter(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1B1E28),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF2B2D44)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Text('✦ ', style: TextStyle(color: Color(0xFFA855F7), fontSize: 13)),
                                  Text(
                                    'Welcome to Crowdbeats',
                                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                              Semantics(
                                button: true,
                                label: 'Dismiss welcome card',
                                child: InkWell(
                                  onTap: () => setState(() => _dismissedPrimer = true),
                                  borderRadius: BorderRadius.circular(8),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                    child: Text(
                                      '✕ Dismiss',
                                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _buildPrimerCard('📍', 'Explore Live', 'Find live talent near you', const Color(0xFF0891B2)),
                              const SizedBox(width: 8),
                              _buildPrimerCard('🔔', 'Follow', 'Get live stage alerts', const Color(0xFF7C3AED)),
                              const SizedBox(width: 8),
                              _buildPrimerCard('⚡', 'Support', 'Tip performers directly', const Color(0xFFD97706)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // 2. ACCESSIBLE LOCATION SEARCH
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 4),
                sliver: SliverToBoxAdapter(
                  child: CrowdbeatsLocationSearch(
                    placeholder: 'Search city, town, venue, or area',
                    currentLocationName: loc.displayName,
                    isSearchAreaMode: discoveryState.isSearchAreaMode,
                    suggestions: discoveryState.autocompleteSuggestions,
                    onSearchInput: (query) {
                      discoveryNotifier.onLocationSearchInput(query);
                    },
                    onSelectLocation: (selectedLoc) {
                      discoveryNotifier.selectSearchedLocation(selectedLoc);
                    },
                    onUseMyLocation: () {
                      // useMyLocation is async; fire-and-forget from VoidCallback context.
                      // isLocating in discoveryState drives the spinner.
                      discoveryNotifier.useMyLocation();
                    },
                  ),
                ),
              ),

              // 3. COMPACT GOOGLE MAP (Directly below Search)
              SliverToBoxAdapter(
                child: CompactGoogleMap(
                  discoveryLocation: loc,
                  performers: performers,
                  isSearchAreaMode: discoveryState.isSearchAreaMode,
                  isLocating: discoveryState.isLocating,
                  selectedPerformer: _selectedPerformer,
                  onUseMyLocation: () {
                    discoveryNotifier.useMyLocation();
                  },
                  onSelectPerformer: (p) {
                    setState(() {
                      _selectedPerformer = p;
                    });
                  },
                  onSearchThisArea: () {
                    discoveryNotifier.onViewportChanged(
                      minLat: loc.latitude - 0.02,
                      maxLat: loc.latitude + 0.02,
                      minLng: loc.longitude - 0.02,
                      maxLng: loc.longitude + 0.02,
                    );
                  },
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 12)),

              // 4. EXACTLY THREE NEARBY MUSICIANS CARDS
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Nearby musicians',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              Text(
                                'Music around ${loc.city}',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const NearbySecondaryView()),
                              );
                            },
                            child: const Row(
                              children: [
                                Text(
                                  'See all',
                                  style: TextStyle(
                                    color: Color(0xFFA855F7),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward_rounded, color: Color(0xFFA855F7), size: 14),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (topNearby.isEmpty)
                        _buildEmptyState('No live or scheduled musicians found in ${loc.city}.')
                      else
                        ...topNearby.asMap().entries.map((entry) => NearbyCreatorCard(
                              performer: entry.value,
                              rank: entry.key + 1,
                              isSelected: _selectedPerformer?.id == entry.value.id,
                              onTap: () {
                                setState(() {
                                  _selectedPerformer = entry.value;
                                });
                              },
                            )),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // 5. EXACTLY THREE POPULAR ON CROWDBEATS CARDS
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Popular on Crowdbeats',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              Text(
                                'Top rated musicians & bands',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const PopularSecondaryView()),
                              );
                            },
                            child: const Row(
                              children: [
                                Text(
                                  'See all',
                                  style: TextStyle(
                                    color: Color(0xFFA855F7),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward_rounded, color: Color(0xFFA855F7), size: 14),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (topPopular.isEmpty)
                        _buildEmptyState('No popular artists recorded yet.')
                      else
                        ...topPopular.asMap().entries.map((entry) => PopularCreatorCard(
                              performer: entry.value,
                              rank: entry.key + 1,
                              isSelected: _selectedPerformer?.id == entry.value.id,
                              onTap: () {
                                setState(() {
                                  _selectedPerformer = entry.value;
                                });
                              },
                            )),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // 6. TOP CAMPAIGNS (CROWDFUNDING)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Top Campaigns',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          Text(
                            'Support local music projects & tours',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (topCampaigns.isEmpty)
                        _buildEmptyState('No active crowdfunding campaigns recorded for this region.')
                      else
                        ...topCampaigns.map((camp) => DiscoveryCampaignCard(
                              campaign: camp,
                            )),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // 7. EXACTLY THREE SUGGESTED FOR YOU (YOU MAY LIKE) CARDS
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'You may like',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              Text(
                                'Suggested based on area and genres',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const NearbySecondaryView()),
                              );
                            },
                            child: const Row(
                              children: [
                                Text(
                                  'See all',
                                  style: TextStyle(
                                    color: Color(0xFFA855F7),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward_rounded, color: Color(0xFFA855F7), size: 14),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (topSuggested.isEmpty)
                        _buildEmptyState('No suggestions available for this area.')
                      else
                        ...topSuggested.map((p) => NearbyCreatorCard(
                              performer: p,
                              isSelected: _selectedPerformer?.id == p.id,
                              onTap: () {
                                setState(() {
                                  _selectedPerformer = p;
                                });
                              },
                            )),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF151722),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          const Icon(Icons.music_off_outlined, color: CbColors.textMuted, size: 32),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: CbColors.textSecondary, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
