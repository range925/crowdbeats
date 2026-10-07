// Crowdbeats V2 — Nearby Live Music Discovery Tab
//
// Authoritative implementation of Stitch-derived Nearby Experience with:
// - Non-blocking location permission with upfront value explanation
// - Prominent Places Autocomplete geographic search ("Search city, town, state or country")
// - Segmented Map | List | Venues views driven by unified discovery state
// - Search Area Mode with "Use My Location" quick return action
// - Category & Genre filtering (Live Now, Near You, Popular, Trending, Solo, Bands, Venues)
// - Interactive dark map markers with selected preview cards and tip auth gating

import 'dart:math' as math;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../data/models/discovery.dart';
import '../../../state/auth_state.dart';
import '../../../state/discovery_state.dart';
import '../../../state/tip_state.dart';
import '../../components/cb_live_badge.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../public_profile_screen.dart';
import '../tip/tip_auth_gate_modal.dart';
import '../tip/tip_confirmation_sheet.dart';
import '../widgets/animated_performer_marker.dart';
import '../../location/fan_audience_visibility_sheet.dart';
import '../../camera/camera_capture_screen.dart';

class NearbyTab extends ConsumerStatefulWidget {
  const NearbyTab({
    super.key,
    this.isSecondaryView = false,
    this.onBack,
  });

  final bool isSecondaryView;
  final VoidCallback? onBack;

  @override
  ConsumerState<NearbyTab> createState() => _NearbyTabState();
}

class _NearbyTabState extends ConsumerState<NearbyTab> {
  GoogleMapController? _mapController;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  bool _showPermissionBanner = false;

  final List<String> _genres = const [
    'All',
    'Indie Pop',
    'Rock',
    'Electronic',
    'Jazz',
    'Acoustic',
    'Alternative',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkInitialLocation());
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  Future<void> _checkInitialLocation() async {
    // Invariant 1: Fans can browse by typed city/venue without granting location.
    // Never force or prompt for location permission on initial screen launch.
    setState(() => _showPermissionBanner = false);
  }

  Future<void> _requestLocationPermission() async {
    // Permission request is now fully managed by LocationProvider.requestOneShot().
    // Use requestNearMeLocation() which handles the permission check, GPS fix,
    // and immediate sensor stop — never passes hardcoded coordinates.
    await ref.read(discoveryProvider.notifier).requestNearMeLocation();
    setState(() => _showPermissionBanner = false);
  }

  @override
  Widget build(BuildContext context) {
    final discovery = ref.watch(discoveryProvider);
    final auth = ref.watch(authStateProvider);
    final isAuthenticated = auth.status == CbAuthStatus.authenticated;

    final isTabletOrDesktop = MediaQuery.of(context).size.width >= 768;

    if (isTabletOrDesktop) {
      return Scaffold(
        backgroundColor: CbColors.bgApp,
        body: SafeArea(
          bottom: false,
          child: Row(
            children: [
              // Left Panel: Map View with Selected Preview
              Expanded(
                flex: 5,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: _buildMapView(discovery, isAuthenticated),
                    ),
                    if (discovery.selectedPerformer != null)
                      Positioned(
                        bottom: 24,
                        left: 20,
                        right: 20,
                        child: _buildPerformerPreviewCard(discovery.selectedPerformer!, isAuthenticated),
                      ),
                  ],
                ),
              ),
              // Right Panel: Top Controls & List/Venues
              Expanded(
                flex: 5,
                child: Container(
                  decoration: const BoxDecoration(
                    border: Border(left: BorderSide(color: Color(0x1AFFFFFF))),
                  ),
                  child: Column(
                    children: [
                      _buildTopControls(discovery),
                      Expanded(
                        child: discovery.viewModeIndex == 2
                            ? _buildVenuesView(discovery)
                            : _buildListView(discovery, isAuthenticated),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const CameraCaptureScreen(),
          ),
        ),
        backgroundColor: CbColors.heartOrange,
        icon: const Icon(Icons.camera_alt, color: CbColors.bgApp),
        label: const Text(
          'Capture the music',
          style: TextStyle(fontWeight: FontWeight.bold, color: CbColors.bgApp),
        ),
      ),
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            // ── Main Content: Map / List / Venues ─────────────────────────────
            if (discovery.viewModeIndex == 0) ...[
              // Map View: Map fills background behind floating controls
              Positioned.fill(
                child: _buildMapView(discovery, isAuthenticated),
              ),
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: _buildTopControls(discovery),
              ),
            ] else ...[
              // List View (1) & Venues View (2): Non-overlapping Column layout
              Positioned.fill(
                child: Column(
                  children: [
                    _buildTopControls(discovery),
                    Expanded(
                      child: discovery.viewModeIndex == 1
                          ? _buildListView(discovery, isAuthenticated)
                          : _buildVenuesView(discovery),
                    ),
                  ],
                ),
              ),
            ],

            // ── Autocomplete Overlay (when typing in location search) ─────────
            if (discovery.autocompleteSuggestions.isNotEmpty)
              Positioned(
                top: _showPermissionBanner ? 175 : 135,
                left: 16,
                right: 16,
                child: _buildAutocompleteOverlay(discovery),
              ),

            // ── Selected Marker Preview Card (Map View) ──────────────────────
            if (discovery.viewModeIndex == 0 && discovery.selectedPerformer != null)
              Positioned(
                bottom: 96,
                left: 16,
                right: 16,
                child: _buildPerformerPreviewCard(discovery.selectedPerformer!, isAuthenticated),
              ),

            // ── Selected Venue Preview Card (Map View) ────────────────────────
            if (discovery.viewModeIndex == 0 && discovery.selectedVenue != null)
              Positioned(
                bottom: 96,
                left: 16,
                right: 16,
                child: _buildVenuePreviewCard(discovery.selectedVenue!),
              ),
          ],
        ),
      ),
    );
  }

  // ── Top Controls: Header + Location Search + Segmented Bar + Categories ────

  Widget _buildTopControls(DiscoveryState discovery) {
    return Container(
      decoration: BoxDecoration(
        color: CbColors.bgApp.withValues(alpha: 0.92),
        border: const Border(
          bottom: BorderSide(color: Color(0x1AFFFFFF), width: 1),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header & Location Indicator
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                if (widget.isSecondaryView) ...[
                  IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 22),
                    tooltip: 'Back',
                    onPressed: widget.onBack ?? () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Nearby Live Music',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.place, color: CbColors.purpleLight, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            discovery.isSearchAreaMode
                                ? 'Browsing: ${discovery.discoveryLocation.displayName}'
                                : 'Near: ${discovery.discoveryLocation.displayName}',
                            style: const TextStyle(
                              color: CbColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // "Use My Location" button (if in search area mode)
                if (discovery.isSearchAreaMode)
                  TextButton.icon(
                    onPressed: () {
                      _searchController.clear();
                      ref.read(discoveryProvider.notifier).useMyLocation();
                    },
                    icon: const Icon(Icons.my_location, size: 14, color: CbColors.purpleLight),
                    label: const Text(
                      'Use My Location',
                      style: TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      backgroundColor: const Color(0x228B5CF6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                    ),
                  ),
              ],
            ),
          ),

          // Non-blocking Permission Banner (if needed)
          if (_showPermissionBanner)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0x228B5CF6),
                borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                border: Border.all(color: const Color(0x448B5CF6)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.near_me, color: CbColors.purpleLight, size: 16),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Find live music near you',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ),
                  GestureDetector(
                    onTap: _requestLocationPermission,
                    child: const Text(
                      'Enable GPS',
                      style: TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => setState(() => _showPermissionBanner = false),
                    child: const Icon(Icons.close, size: 16, color: Colors.white54),
                  ),
                ],
              ),
            ),

          // Location Search Input Bar ("Search city, town, state or country")
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Container(
              height: 42,
              decoration: BoxDecoration(
                color: CbColors.surfaceCard,
                borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                border: Border.all(color: const Color(0x2BFFFFFF)),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                onChanged: (text) => ref.read(discoveryProvider.notifier).onLocationSearchInput(text),
                decoration: InputDecoration(
                  hintText: 'Search city, town, state or country',
                  hintStyle: const TextStyle(color: CbColors.textTertiary, fontSize: 13),
                  prefixIcon: const Icon(Icons.search, color: CbColors.purpleLight, size: 18),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 16, color: Colors.white54),
                          onPressed: () {
                            _searchController.clear();
                            ref.read(discoveryProvider.notifier).onLocationSearchInput('');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ),

          // Segmented Bar: Map | List | Venues
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: CbColors.surfaceBase,
                borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                border: Border.all(color: const Color(0x1AFFFFFF)),
              ),
              child: Row(
                children: [
                  _buildSegmentButton('Map', Icons.map_outlined, 0, discovery.viewModeIndex),
                  _buildSegmentButton('List', Icons.list_alt, 1, discovery.viewModeIndex),
                  _buildSegmentButton('Venues', Icons.stadium_outlined, 2, discovery.viewModeIndex),
                ],
              ),
            ),
          ),

          // Category Pills Filter Bar
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                // Filter Settings Button
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    key: const Key('nearby_filters_btn'),
                    onTap: _openFiltersModal,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: CbColors.surfaceCard,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        border: Border.all(color: const Color(0x338B5CF6)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.tune, size: 14, color: CbColors.purpleLight),
                          SizedBox(width: 4),
                          Text(
                            'Filters',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                ...DiscoveryCategory.values.map((cat) {
                  final isSelected = discovery.selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => ref.read(discoveryProvider.notifier).setCategory(cat),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: isSelected ? CbColors.purpleMain : CbColors.surfaceCard,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          border: Border.all(
                            color: isSelected ? CbColors.purpleLight : const Color(0x1AFFFFFF),
                          ),
                        ),
                        child: Text(
                          cat.label,
                          style: TextStyle(
                            color: isSelected ? Colors.white : CbColors.textSecondary,
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
                const SizedBox(width: 8),
                // Genre chips
                ..._genres.map((g) {
                  final isSelected = discovery.selectedGenre == g;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => ref.read(discoveryProvider.notifier).setGenre(g),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected ? CbColors.purpleMain : CbColors.surfaceCard,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          border: Border.all(color: isSelected ? CbColors.purpleLight : const Color(0x1AFFFFFF)),
                        ),
                        child: Text(
                          g,
                          style: TextStyle(
                            color: isSelected ? Colors.white : CbColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentButton(String label, IconData icon, int index, int selectedIndex) {
    final isSelected = index == selectedIndex;
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(discoveryProvider.notifier).setViewMode(index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? CbColors.purpleMain : Colors.transparent,
            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: isSelected ? Colors.white : CbColors.textSecondary),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : CbColors.textSecondary,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Autocomplete Overlay ───────────────────────────────────────────────────

  Widget _buildAutocompleteOverlay(DiscoveryState discovery) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xF0181926),
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: const Color(0x338B5CF6)),
        boxShadow: const [
          BoxShadow(color: Color(0x99000000), blurRadius: 16, offset: Offset(0, 8)),
        ],
      ),
      child: ListView.separated(
        shrinkWrap: true,
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: discovery.autocompleteSuggestions.length,
        separatorBuilder: (_, _) => const Divider(color: Color(0x1AFFFFFF), height: 1),
        itemBuilder: (context, idx) {
          final loc = discovery.autocompleteSuggestions[idx];
          return ListTile(
            dense: true,
            leading: const Icon(Icons.location_city, color: CbColors.purpleLight, size: 18),
            title: Text(
              loc.displayName,
              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${loc.city}, ${loc.administrativeArea} · ${loc.country}',
              style: const TextStyle(color: CbColors.textTertiary, fontSize: 11),
            ),
            onTap: () {
              _searchFocusNode.unfocus();
              _searchController.text = loc.displayName;
              ref.read(discoveryProvider.notifier).selectSearchedLocation(loc);

              if (_mapController != null) {
                _mapController!.animateCamera(
                  CameraUpdate.newLatLngZoom(LatLng(loc.latitude, loc.longitude), 14),
                );
              }
            },
          );
        },
      ),
    );
  }

  // ── 1. Map View ────────────────────────────────────────────────────────────

  Widget _buildMapView(DiscoveryState discovery, bool isAuthenticated) {
    if (kIsWeb) {
      return _GoogleMapsNightInteractiveView(
        discovery: discovery,
        onSelectPerformer: (p) => ref.read(discoveryProvider.notifier).selectPerformer(p),
        onSelectVenue: (v) => ref.read(discoveryProvider.notifier).selectVenue(v),
      );
    }

    try {
      final center = LatLng(
        discovery.discoveryLocation.latitude,
        discovery.discoveryLocation.longitude,
      );

      final Set<Marker> markers = {
        // Performer markers
        ...discovery.performers.map((p) {
          return Marker(
            markerId: MarkerId(p.id),
            position: LatLng(p.latitude, p.longitude),
            infoWindow: InfoWindow(title: p.name, snippet: '${p.currentVenueName ?? "Live"} · ${p.distanceMiles ?? 0.3} mi'),
            onTap: () => ref.read(discoveryProvider.notifier).selectPerformer(p),
          );
        }),
        // Venue markers
        ...discovery.venues.map((v) {
          return Marker(
            markerId: MarkerId(v.id),
            position: LatLng(v.latitude, v.longitude),
            infoWindow: InfoWindow(title: v.name, snippet: 'Venue · ${v.distanceMiles ?? 0.3} mi'),
            onTap: () => ref.read(discoveryProvider.notifier).selectVenue(v),
          );
        }),
      };

      return GoogleMap(
        initialCameraPosition: CameraPosition(target: center, zoom: 14),
        onMapCreated: (controller) => _mapController = controller,
        markers: markers,
        myLocationEnabled: discovery.deviceLocation != null,
        myLocationButtonEnabled: false,
        zoomControlsEnabled: false,
        mapToolbarEnabled: false,
      );
    } catch (_) {
      return _GoogleMapsNightInteractiveView(
        discovery: discovery,
        onSelectPerformer: (p) => ref.read(discoveryProvider.notifier).selectPerformer(p),
        onSelectVenue: (v) => ref.read(discoveryProvider.notifier).selectVenue(v),
      );
    }
  }

  // ── 2. List View (Synchronized with discovery query) ────────────────────────

  Widget _buildListView(DiscoveryState discovery, bool isAuthenticated) {
    if (discovery.performers.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      itemCount: discovery.performers.length,
      itemBuilder: (context, index) {
        final performer = discovery.performers[index];
        return _buildPerformerListCard(performer, isAuthenticated);
      },
    );
  }

  Widget _buildPerformerListCard(PublicPerformer performer, bool isAuthenticated) {
    final isSelected = ref.watch(discoveryProvider).selectedPerformer?.id == performer.id;
    return GestureDetector(
      onTap: () {
        ref.read(discoveryProvider.notifier).selectPerformer(performer);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: CbColors.surfaceCard,
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          border: Border.all(
            color: isSelected ? CbColors.purpleMain : const Color(0x1AFFFFFF),
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: CbColors.purpleMain.withValues(alpha: 0.35),
                    blurRadius: 12,
                    spreadRadius: 1,
                  ),
                ]
              : null,
        ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar / Photo
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: CbColors.surfaceBase,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: const Color(0x228B5CF6)),
                ),
                child: const Icon(Icons.music_note, color: CbColors.purpleLight, size: 28),
              ),
              const SizedBox(width: 12),
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
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (performer.isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.verified, color: CbColors.purpleLight, size: 14),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${performer.genres.join(", ")} · ${performer.distanceMiles ?? 0.3} mi away',
                      style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                    ),
                    if (performer.currentVenueName != null)
                      Text(
                        '@ ${performer.currentVenueName}',
                        style: const TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                  ],
                ),
              ),
              if (performer.isLive) const CbLiveBadge(),
            ],
          ),

          const SizedBox(height: 12),

          // Action Buttons: Tip & View Profile
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0x33FFFFFF)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => PublicProfileScreen(slug: performer.slug, type: performer.type),
                      ),
                    );
                  },
                  child: const Text('View Profile', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  onPressed: () => _handleTip(performer, isAuthenticated),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.volunteer_activism, size: 14),
                      SizedBox(width: 6),
                      Text('Tip', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

  // ── 3. Venues View ─────────────────────────────────────────────────────────

  Widget _buildVenuesView(DiscoveryState discovery) {
    if (discovery.venues.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      itemCount: discovery.venues.length,
      itemBuilder: (context, index) {
        final venue = discovery.venues[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: CbColors.surfaceCard,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            border: Border.all(color: const Color(0x1AFFFFFF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: CbColors.surfaceBase,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                      border: Border.all(color: const Color(0x228B5CF6)),
                    ),
                    child: const Icon(Icons.stadium, color: CbColors.purpleLight, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          venue.name,
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${venue.city}, ${venue.state} · ${venue.distanceMiles ?? 0.3} mi away',
                          style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                        ),
                        Text(
                          '${venue.activeMusicianCount} active performers tonight',
                          style: const TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (venue.description != null) ...[
                const SizedBox(height: 8),
                Text(
                  venue.description!,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  // ── Selected Marker Preview Cards (Bottom of Map) ──────────────────────────

  Widget _buildPerformerPreviewCard(PublicPerformer performer, bool isAuthenticated) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xF0181926),
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        border: Border.all(color: const Color(0x338B5CF6)),
        boxShadow: const [
          BoxShadow(color: Color(0x99000000), blurRadius: 20, offset: Offset(0, 8)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: CbColors.surfaceBase,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                ),
                child: const Icon(Icons.music_note, color: CbColors.purpleLight),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            performer.name,
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (performer.isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.verified, color: CbColors.purpleLight, size: 14),
                        ],
                      ],
                    ),
                    Text(
                      '@ ${performer.currentVenueName ?? "Live"} · ${performer.distanceMiles ?? 0.3} mi away',
                      style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                onPressed: () => ref.read(discoveryProvider.notifier).selectPerformer(null),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0x33FFFFFF)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => PublicProfileScreen(slug: performer.slug, type: performer.type),
                      ),
                    );
                  },
                  child: const Text('View Profile', style: TextStyle(fontSize: 12)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  onPressed: () => _handleTip(performer, isAuthenticated),
                  child: const Text('Tip \$20', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                key: const Key('performer_directions_btn'),
                tooltip: 'Directions',
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0x2210B981),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                ),
                icon: const Icon(Icons.directions_outlined, color: CbColors.tealGas, size: 20),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Directions to ${performer.currentVenueName ?? "Venue"} (${performer.distanceMiles ?? 0.3} mi away)'),
                      backgroundColor: CbColors.surfaceCard,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
              ),
              const SizedBox(width: 8),
              IconButton(
                key: const Key('performer_audience_visibility_btn'),
                tooltip: "Let performer know you're nearby",
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0x228B5CF6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                ),
                icon: const Icon(Icons.radar, color: CbColors.purpleLight, size: 20),
                onPressed: () => _handleAudienceVisibility(performer, isAuthenticated),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openFiltersModal() {
    final current = ref.read(discoveryProvider).filterState;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: CbColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Discovery Filters', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white60),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                SwitchListTile(
                  title: const Text('Live Now Only', style: TextStyle(color: Colors.white, fontSize: 14)),
                  value: current.liveNow,
                  activeColor: CbColors.statusLive,
                  onChanged: (v) {
                    ref.read(discoveryProvider.notifier).updateFilters(liveNow: v);
                    Navigator.of(context).pop();
                  },
                ),
                SwitchListTile(
                  title: const Text('Starting Soon', style: TextStyle(color: Colors.white, fontSize: 14)),
                  value: current.startingSoon,
                  activeColor: CbColors.purpleLight,
                  onChanged: (v) {
                    ref.read(discoveryProvider.notifier).updateFilters(startingSoon: v);
                    Navigator.of(context).pop();
                  },
                ),
                SwitchListTile(
                  title: const Text('Verified Check-in Only', style: TextStyle(color: Colors.white, fontSize: 14)),
                  value: current.verifiedOnly,
                  activeColor: CbColors.purpleLight,
                  onChanged: (v) {
                    ref.read(discoveryProvider.notifier).updateFilters(verifiedOnly: v);
                    Navigator.of(context).pop();
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildVenuePreviewCard(PublicVenue venue) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xF0181926),
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        border: Border.all(color: const Color(0x338B5CF6)),
      ),
      child: Row(
        children: [
          const Icon(Icons.stadium, color: CbColors.purpleLight, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  venue.name,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                ),
                Text(
                  '${venue.city} · ${venue.activeMusicianCount} active performers',
                  style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white54, size: 18),
            onPressed: () => ref.read(discoveryProvider.notifier).selectVenue(null),
          ),
        ],
      ),
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.music_off_outlined, color: Colors.white38, size: 56),
            const SizedBox(height: 16),
            const Text(
              'No live music found nearby.',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Try expanding your radius or search another city.',
              textAlign: TextAlign.center,
              style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
              onPressed: () {
                _searchController.text = 'Torrance, California';
                ref.read(discoveryProvider.notifier).selectSearchedLocation(DiscoveryLocation.torrance);
              },
              child: const Text('Search Torrance, CA'),
            ),
          ],
        ),
      ),
    );
  }

  void _handleTip(PublicPerformer performer, bool isAuthenticated) {
    final pendingContext = PendingTipContext(
      creatorId: performer.id,
      creatorSlug: performer.slug,
      creatorName: performer.name,
      creatorType: performer.type,
      creatorPhotoUrl: performer.photoUrl,
      selectedTipAmountCents: 2000, // Default $20 preset
      currency: 'USD',
      sourceScreen: 'nearby_tab',
    );

    if (!isAuthenticated) {
      TipAuthGateModal.show(
        context,
        pendingContext: pendingContext,
        from: '/tip/${performer.id}?amount=2000',
      );
    } else {
      ref.read(tipFlowProvider.notifier).prepare(
            recipientId: performer.id,
            recipientName: performer.name,
            recipientType: performer.type,
            amountCents: 2000,
          );
      TipConfirmationSheet.show(context);
    }
  }

  void _handleAudienceVisibility(PublicPerformer performer, bool isAuthenticated) {
    if (!isAuthenticated) {
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: CbColors.surfaceCard,
          title: const Text('Sign In to Share Visibility', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          content: const Text(
            'Guests can freely explore nearby live music. To let performers know you are nearby in the crowd, please create an account or sign in.',
            style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Browse as Guest', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: CbColors.accentPrimary),
              onPressed: () {
                Navigator.of(ctx).pop();
                // Navigate to auth
              },
              child: const Text('Sign In / Sign Up'),
            ),
          ],
        ),
      );
    } else {
      FanAudienceVisibilitySheet.show(
        context,
        sessionId: performer.id,
        performerId: performer.id,
        performerName: performer.name,
        sessionEndsAt: DateTime.now().add(const Duration(hours: 2)),
      );
    }
  }
}

/// Full-screen Interactive Google Maps Night Theme View
class _GoogleMapsNightInteractiveView extends StatefulWidget {
  const _GoogleMapsNightInteractiveView({
    required this.discovery,
    required this.onSelectPerformer,
    required this.onSelectVenue,
  });

  final DiscoveryState discovery;
  final ValueChanged<PublicPerformer> onSelectPerformer;
  final ValueChanged<PublicVenue> onSelectVenue;

  @override
  State<_GoogleMapsNightInteractiveView> createState() => _GoogleMapsNightInteractiveViewState();
}

class _GoogleMapsNightInteractiveViewState extends State<_GoogleMapsNightInteractiveView> {
  Offset _panOffset = Offset.zero;
  double _zoom = 1.0;
  bool _isSatellite = false;

  @override
  void didUpdateWidget(_GoogleMapsNightInteractiveView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.discovery.discoveryLocation.placeId != widget.discovery.discoveryLocation.placeId) {
      setState(() {
        _panOffset = Offset.zero;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final performers = widget.discovery.performers;
    final venues = widget.discovery.venues;
    final locationName = widget.discovery.discoveryLocation.displayName;

    return GestureDetector(
      onPanUpdate: (details) {
        setState(() {
          _panOffset += details.delta;
        });
      },
      child: Container(
        color: _isSatellite ? const Color(0xFF141820) : const Color(0xFF1A1D28),
        child: Stack(
          children: [
            // 1. Google Maps Dark/Night Basemap
            Positioned.fill(
              child: Transform.translate(
                offset: _panOffset,
                child: Transform.scale(
                  scale: _zoom,
                  child: CustomPaint(
                    painter: _GoogleMapsFullCanvasPainter(
                      locationName: locationName,
                      isSatellite: _isSatellite,
                    ),
                  ),
                ),
              ),
            ),

            // Explored Area Mode Indicator (Worldwide city search)
            if (widget.discovery.isSearchAreaMode)
              Positioned(
                top: 175,
                left: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xEB151722),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    border: Border.all(color: const Color(0x668B5CF6)),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black45,
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFA855F7),
                          boxShadow: [
                            BoxShadow(color: Color(0xFFA855F7), blurRadius: 4),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Exploring ${widget.discovery.discoveryLocation.city}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // 2. Center GPS Blue Dot
            Center(
              child: Transform.translate(
                offset: _panOffset,
                child: const _GoogleMapsBlueLocationDot(),
              ),
            ),

            // 3. Interactive Musician Drop-Pin Markers
            ...performers.asMap().entries.map((entry) {
              final idx = entry.key;
              final p = entry.value;
              final angle = (idx * (2 * math.pi / math.max(performers.length, 1))) + 0.5;
              final radius = 90.0 + (idx % 3) * 35.0;

              return Center(
                child: AnimatedPerformerMarker(
                  performer: p,
                  targetOffset: _panOffset + Offset(math.cos(angle) * radius * _zoom, math.sin(angle) * radius * _zoom),
                  onTap: () => widget.onSelectPerformer(p),
                ),
              );
            }),

            // 4. Interactive Venue Markers
            ...venues.asMap().entries.map((entry) {
              final idx = entry.key;
              final v = entry.value;
              final angle = (idx * (2 * math.pi / math.max(venues.length, 1))) + 2.2;
              final radius = 120.0 + (idx % 2) * 40.0;

              return Center(
                child: Transform.translate(
                  offset: _panOffset + Offset(math.cos(angle) * radius * _zoom, math.sin(angle) * radius * _zoom),
                  child: GestureDetector(
                    onTap: () => widget.onSelectVenue(v),
                    child: _GoogleMapsVenueMarker(venue: v),
                  ),
                ),
              );
            }),

            // 5. Google Maps Controls (Map/Satellite on top-left, Zoom/Compass on top-right)
            Positioned(
              top: 220,
              left: 14,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xE61E2230),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () => setState(() => _isSatellite = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: !_isSatellite ? CbColors.purpleMain : Colors.transparent,
                          borderRadius: BorderRadius.circular(7),
                        ),
                        child: Text(
                          'Map',
                          style: TextStyle(
                            color: !_isSatellite ? Colors.white : Colors.white70,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _isSatellite = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: _isSatellite ? CbColors.purpleMain : Colors.transparent,
                          borderRadius: BorderRadius.circular(7),
                        ),
                        child: Text(
                          'Satellite',
                          style: TextStyle(
                            color: _isSatellite ? Colors.white : Colors.white70,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Top-right Zoom & Compass Controls
            Positioned(
              top: 220,
              right: 14,
              child: Column(
                children: [
                  // Compass
                  GestureDetector(
                    onTap: () => setState(() => _panOffset = Offset.zero),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xE61E2230),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                        boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                      ),
                      child: const Center(
                        child: Icon(Icons.explore_rounded, color: Color(0xFFEA4335), size: 18),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Zoom In / Out
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xE61E2230),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                    ),
                    child: Column(
                      children: [
                        GestureDetector(
                          onTap: () => setState(() => _zoom = math.min(_zoom + 0.15, 2.0)),
                          child: SizedBox(
                            width: 32,
                            height: 28,
                            child: const Center(
                              child: Text('+', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                        Container(width: 24, height: 1, color: Colors.white.withValues(alpha: 0.1)),
                        GestureDetector(
                          onTap: () => setState(() => _zoom = math.max(_zoom - 0.15, 0.7)),
                          child: SizedBox(
                            width: 32,
                            height: 28,
                            child: const Center(
                              child: Text('−', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 6. Google Watermark (Bottom Left)
            Positioned(
              bottom: 80,
              left: 14,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                decoration: BoxDecoration(
                  color: const Color(0xCC111319),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text('G', style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 12)),
                    Text('o', style: TextStyle(color: Color(0xFFEA4335), fontWeight: FontWeight.w900, fontSize: 12)),
                    Text('o', style: TextStyle(color: Color(0xFFFBBC05), fontWeight: FontWeight.w900, fontSize: 12)),
                    Text('g', style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 12)),
                    Text('l', style: TextStyle(color: Color(0xFF34A853), fontWeight: FontWeight.w900, fontSize: 12)),
                    Text('e', style: TextStyle(color: Color(0xFFEA4335), fontWeight: FontWeight.w900, fontSize: 12)),
                  ],
                ),
              ),
            ),

            Positioned(
              bottom: 82,
              right: 14,
              child: Text(
                'Map data ©2026 Google',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.35),
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoogleMapsBlueLocationDot extends StatelessWidget {
  const _GoogleMapsBlueLocationDot();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0x334285F4),
            border: Border.all(color: const Color(0x664285F4), width: 1.5),
          ),
        ),
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF4285F4),
            border: Border.all(color: Colors.white, width: 2.5),
            boxShadow: const [BoxShadow(color: Color(0x804285F4), blurRadius: 10)],
          ),
        ),
      ],
    );
  }
}

class _GoogleMapsVenueMarker extends StatelessWidget {
  const _GoogleMapsVenueMarker({required this.venue});
  final PublicVenue venue;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFF1E2032),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFA855F7), width: 1.5),
            boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
          ),
          child: const Icon(Icons.stadium, color: Color(0xFFA855F7), size: 16),
        ),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
          decoration: BoxDecoration(
            color: const Color(0xE60F111A),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            venue.name,
            style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 9, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _GoogleMapsFullCanvasPainter extends CustomPainter {
  const _GoogleMapsFullCanvasPainter({required this.locationName, required this.isSatellite});
  final String locationName;
  final bool isSatellite;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Base Land
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = isSatellite ? const Color(0xFF141820) : const Color(0xFF1A1D28));

    // 2. Ocean Coastline (Left)
    final waterPath = Path()
      ..moveTo(0, 0)
      ..lineTo(w * 0.24, 0)
      ..cubicTo(w * 0.20, h * 0.35, w * 0.12, h * 0.70, w * 0.18, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(waterPath, Paint()..color = const Color(0xFF0F172A));

    // Coastline highlight
    canvas.drawPath(
      waterPath,
      Paint()
        ..color = const Color(0x3338BDF8)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0,
    );

    // 3. Parks
    final parkPaint = Paint()..color = const Color(0xFF14241D);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.45, h * 0.22, 60, 40), const Radius.circular(8)), parkPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.30, h * 0.65, 70, 35), const Radius.circular(8)), parkPaint);

    // 4. City Street Grid
    final streetPaint = Paint()
      ..color = const Color(0xFF242938)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    for (double y = 40; y < h; y += 30) {
      canvas.drawLine(Offset(w * 0.20, y), Offset(w, y), streetPaint);
    }
    for (double x = w * 0.22; x < w; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, h), streetPaint);
    }

    // 5. Arterial Boulevards
    final arterialPaint = Paint()
      ..color = const Color(0xFF2D3548)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5;
    // Torrance Blvd
    canvas.drawLine(Offset(w * 0.18, h * 0.48), Offset(w, h * 0.48), arterialPaint);
    // Hawthorne Blvd
    canvas.drawLine(Offset(w * 0.50, 0), Offset(w * 0.52, h), arterialPaint);
    // Sepulveda Blvd
    canvas.drawLine(Offset(w * 0.18, h * 0.78), Offset(w, h * 0.78), arterialPaint);

    // 6. Interstate Freeways (I-405 & CA-1 / PCH)
    final freewayUnderlay = Paint()
      ..color = const Color(0xFF3E475C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0;
    final freewayCore = Paint()
      ..color = const Color(0xFF4F5B75)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    final freeway405 = Path()
      ..moveTo(w * 0.68, 0)
      ..cubicTo(w * 0.72, h * 0.35, w * 0.84, h * 0.70, w * 0.90, h);
    canvas.drawPath(freeway405, freewayUnderlay);
    canvas.drawPath(freeway405, freewayCore);

    final pch = Path()
      ..moveTo(w * 0.25, 0)
      ..cubicTo(w * 0.22, h * 0.35, w * 0.15, h * 0.70, w * 0.20, h);
    canvas.drawPath(pch, freewayUnderlay);
    canvas.drawPath(pch, freewayCore);

    // 7. Highway Shields
    _drawShield(canvas, Offset(w * 0.76, h * 0.35), '405');
    _drawShield(canvas, Offset(w * 0.22, h * 0.20), '1');

    // 8. Labels
    final mainLabelPainter = TextPainter(
      text: TextSpan(
        text: locationName.toUpperCase(),
        style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.5),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    mainLabelPainter.paint(canvas, Offset(w * 0.40, h * 0.36));
  }

  void _drawShield(Canvas canvas, Offset pos, String number) {
    final rect = Rect.fromCenter(center: pos, width: 20, height: 15);
    canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(3)), Paint()..color = const Color(0xFF1D4ED8));
    canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(3)), Paint()..color = Colors.white..style = PaintingStyle.stroke..strokeWidth = 1.0);

    final textPainter = TextPainter(
      text: TextSpan(
        text: number,
        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    textPainter.paint(canvas, Offset(pos.dx - textPainter.width / 2, pos.dy - textPainter.height / 2));
  }

  @override
  bool shouldRepaint(covariant _GoogleMapsFullCanvasPainter oldDelegate) =>
      oldDelegate.locationName != locationName || oldDelegate.isSatellite != isSatellite;
}
