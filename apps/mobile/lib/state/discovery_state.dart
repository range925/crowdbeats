// Crowdbeats V2 — Discovery State (Riverpod)
//
// Manages public music discovery, location hierarchy, search area mode,
// Google Places suggestions, category & advanced filtering,
// 2-minute geohash batch caching, debounced viewport queries,
// deduplication, and battery/read-cost lifecycle management.

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/discovery.dart';
import '../data/models/location_fix.dart';
import '../data/services/location_provider.dart';
import '../data/services/active_subscription_tracker.dart';
import 'location_provider_state.dart';

class _CachedBatch {
  _CachedBatch(this.performers, this.cachedAt, [this.campaigns = const []]);
  final List<PublicPerformer> performers;
  final List<DiscoveryCampaign> campaigns;
  final DateTime cachedAt;

  bool get isExpired => DateTime.now().difference(cachedAt).inSeconds > 120;
}

class DiscoveryState {
  const DiscoveryState({
    this.deviceLocation,
    this.discoveryLocation = DiscoveryLocation.sanDiego,
    this.selectedCategory = DiscoveryCategory.nearYou,
    this.selectedGenre = 'All',
    this.filterState = const DiscoveryFilterState(),
    this.searchQuery = '',
    this.locationSearchQuery = '',
    this.autocompleteSuggestions = const [],
    this.isSearchAreaMode = false,
    this.isLoading = false,
    this.isLocating = false,
    this.isDebouncing = false,
    this.isLifecyclePaused = false,
    this.activeSubscriptions = 0,
    this.cacheHitsCount = 0,
    this.deduplicatedCount = 0,
    this.locationMode = LocationMode.off,
    this.performers = const [],
    this.venues = const [],
    this.campaigns = const [],
    this.selectedPerformer,
    this.selectedVenue,
    this.viewModeIndex = 0, // 0: Map, 1: List, 2: Venues
  });

  final DiscoveryLocation? deviceLocation;
  final DiscoveryLocation discoveryLocation;
  final DiscoveryCategory selectedCategory;
  final String selectedGenre;
  final DiscoveryFilterState filterState;
  final String searchQuery;
  final String locationSearchQuery;
  final List<DiscoveryLocation> autocompleteSuggestions;
  final bool isSearchAreaMode;
  final bool isLoading;
  final bool isLocating;
  final bool isDebouncing;
  final bool isLifecyclePaused;
  final int activeSubscriptions;
  final int cacheHitsCount;
  final int deduplicatedCount;
  final LocationMode locationMode;
  final List<PublicPerformer> performers;
  final List<PublicVenue> venues;
  final List<DiscoveryCampaign> campaigns;
  final PublicPerformer? selectedPerformer;
  final PublicVenue? selectedVenue;
  final int viewModeIndex;

  DiscoveryState copyWith({
    DiscoveryLocation? deviceLocation,
    DiscoveryLocation? discoveryLocation,
    DiscoveryCategory? selectedCategory,
    String? selectedGenre,
    DiscoveryFilterState? filterState,
    String? searchQuery,
    String? locationSearchQuery,
    List<DiscoveryLocation>? autocompleteSuggestions,
    bool? isSearchAreaMode,
    bool? isLoading,
    bool? isLocating,
    bool? isDebouncing,
    bool? isLifecyclePaused,
    int? activeSubscriptions,
    int? cacheHitsCount,
    int? deduplicatedCount,
    LocationMode? locationMode,
    List<PublicPerformer>? performers,
    List<PublicVenue>? venues,
    List<DiscoveryCampaign>? campaigns,
    PublicPerformer? selectedPerformer,
    bool clearSelectedPerformer = false,
    PublicVenue? selectedVenue,
    bool clearSelectedVenue = false,
    int? viewModeIndex,
  }) {
    return DiscoveryState(
      deviceLocation: deviceLocation ?? this.deviceLocation,
      discoveryLocation: discoveryLocation ?? this.discoveryLocation,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedGenre: selectedGenre ?? this.selectedGenre,
      filterState: filterState ?? this.filterState,
      searchQuery: searchQuery ?? this.searchQuery,
      locationSearchQuery: locationSearchQuery ?? this.locationSearchQuery,
      autocompleteSuggestions: autocompleteSuggestions ?? this.autocompleteSuggestions,
      isSearchAreaMode: isSearchAreaMode ?? this.isSearchAreaMode,
      isLoading: isLoading ?? this.isLoading,
      isLocating: isLocating ?? this.isLocating,
      isDebouncing: isDebouncing ?? this.isDebouncing,
      isLifecyclePaused: isLifecyclePaused ?? this.isLifecyclePaused,
      activeSubscriptions: activeSubscriptions ?? this.activeSubscriptions,
      cacheHitsCount: cacheHitsCount ?? this.cacheHitsCount,
      deduplicatedCount: deduplicatedCount ?? this.deduplicatedCount,
      locationMode: locationMode ?? this.locationMode,
      performers: performers ?? this.performers,
      venues: venues ?? this.venues,
      campaigns: campaigns ?? this.campaigns,
      selectedPerformer: clearSelectedPerformer ? null : (selectedPerformer ?? this.selectedPerformer),
      selectedVenue: clearSelectedVenue ? null : (selectedVenue ?? this.selectedVenue),
      viewModeIndex: viewModeIndex ?? this.viewModeIndex,
    );
  }
}

class DiscoveryNotifier extends StateNotifier<DiscoveryState> {
  DiscoveryNotifier(this._locationProvider, [this._tracker])
      : super(const DiscoveryState()) {
    _loadInitialData();
  }

  final LocationProvider _locationProvider;
  final ActiveSubscriptionTracker? _tracker;

  final Map<String, _CachedBatch> _cache = {};
  Timer? _debounceTimer;

  static const double maxDiscoveryRadiusMiles = 50.0;
  static const int maxGeohashCells = 9;
  static const int maxResultsLimit = 50;

  void _loadInitialData() {
    _attachSubscription();
    _refreshData(state.discoveryLocation);
  }

  void _attachSubscription() {
    if (state.activeSubscriptions == 0 && !state.isLifecyclePaused) {
      state = state.copyWith(activeSubscriptions: 1);
      _tracker?.trackSubscriptionAttached();
    }
  }

  void _detachSubscription() {
    if (state.activeSubscriptions > 0) {
      state = state.copyWith(activeSubscriptions: 0);
      _tracker?.trackSubscriptionDetached();
    }
  }

  void pauseForBackground() {
    _debounceTimer?.cancel();
    _detachSubscription();
    state = state.copyWith(isLifecyclePaused: true);
  }

  void resumeFromBackground() {
    state = state.copyWith(isLifecyclePaused: false);
    _attachSubscription();
    _refreshData(state.discoveryLocation);
  }

  void detachAllSubscriptions() {
    _debounceTimer?.cancel();
    _detachSubscription();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _detachSubscription();
    super.dispose();
  }

  void setViewMode(int index) {
    state = state.copyWith(viewModeIndex: index);
  }

  /// Debounced pan/zoom viewport update (300ms) with geohash bounds enforcement.
  void onViewportChanged({
    required double minLat,
    required double maxLat,
    required double minLng,
    required double maxLng,
  }) {
    _debounceTimer?.cancel();
    state = state.copyWith(isDebouncing: true);

    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      state = state.copyWith(isDebouncing: false);

      final centerLat = (minLat + maxLat) / 2.0;
      final centerLng = (minLng + maxLng) / 2.0;

      // Approximate viewport diagonal distance in miles
      final dLat = (maxLat - minLat).abs() * 69.0;
      final dLng = (maxLng - minLng).abs() * 69.0 * math.cos(centerLat * math.pi / 180);
      final spanMiles = math.sqrt(dLat * dLat + dLng * dLng) / 2.0;
      final cappedRadius = math.min(spanMiles, maxDiscoveryRadiusMiles);

      final viewportLoc = DiscoveryLocation(
        placeId: 'viewport_${centerLat.toStringAsFixed(3)}_${centerLng.toStringAsFixed(3)}',
        displayName: 'Viewport Area',
        city: state.discoveryLocation.city,
        latitude: centerLat,
        longitude: centerLng,
      );

      _refreshData(viewportLoc, queryRadiusMiles: cappedRadius);
    });
  }

  Future<void> requestNearMeLocation() async {
    if (state.isLocating) return;

    state = state.copyWith(isLocating: true);

    final LocationFix? fix = await _locationProvider.requestOneShot(
      targetMode: LocationMode.discovery,
    );

    // Explicitly guarantee sensor release
    _locationProvider.cancelCurrentOperation();

    if (fix == null) {
      state = state.copyWith(isLocating: false);
      return;
    }

    final deviceLoc = DiscoveryLocation(
      placeId: 'device_gps',
      displayName: 'Current Location',
      city: 'Local Area',
      latitude: fix.latitude,
      longitude: fix.longitude,
    );

    if (!state.isSearchAreaMode) {
      state = state.copyWith(
        deviceLocation: deviceLoc,
        discoveryLocation: deviceLoc,
        isLocating: false,
        locationMode: LocationMode.discovery,
      );
      _refreshData(deviceLoc);
    } else {
      state = state.copyWith(
        deviceLocation: deviceLoc,
        isLocating: false,
        locationMode: LocationMode.discovery,
      );
    }
  }

  Future<void> useMyLocation() async {
    state = state.copyWith(
      isSearchAreaMode: false,
      locationSearchQuery: '',
      autocompleteSuggestions: [],
    );

    final cached = state.deviceLocation;
    if (cached != null) {
      state = state.copyWith(discoveryLocation: cached);
      _refreshData(cached);
    } else {
      await requestNearMeLocation();
    }
  }

  void onLocationSearchInput(String query) {
    state = state.copyWith(locationSearchQuery: query);

    if (query.trim().length < 3) {
      state = state.copyWith(autocompleteSuggestions: []);
      return;
    }

    final matches = DiscoveryLocation.searchLocations(query);
    state = state.copyWith(autocompleteSuggestions: matches);
  }

  void selectSearchedLocation(DiscoveryLocation location) {
    state = state.copyWith(
      discoveryLocation: location,
      isSearchAreaMode: true,
      locationSearchQuery: location.displayName,
      autocompleteSuggestions: [],
      clearSelectedPerformer: true,
      clearSelectedVenue: true,
    );
    _refreshData(location);
  }

  void setCategory(DiscoveryCategory category) {
    state = state.copyWith(selectedCategory: category);
    _refreshData(state.discoveryLocation);
  }

  void setGenre(String genre) {
    state = state.copyWith(
      selectedGenre: genre,
      filterState: state.filterState.copyWith(selectedGenre: genre),
    );
    _refreshData(state.discoveryLocation);
  }

  void setFilterState(DiscoveryFilterState filterState) {
    state = state.copyWith(
      filterState: filterState,
      selectedGenre: filterState.selectedGenre,
    );
    _refreshData(state.discoveryLocation);
  }

  void updateFilters({
    bool? liveNow,
    bool? startingSoon,
    String? performerType,
    String? selectedGenre,
    double? maxDistanceMiles,
    String? setting,
    bool? accessibilityOnly,
    bool? verifiedOnly,
    bool? savedOnly,
  }) {
    final updated = state.filterState.copyWith(
      liveNow: liveNow,
      startingSoon: startingSoon,
      performerType: performerType,
      selectedGenre: selectedGenre,
      maxDistanceMiles: maxDistanceMiles,
      setting: setting,
      accessibilityOnly: accessibilityOnly,
      verifiedOnly: verifiedOnly,
      savedOnly: savedOnly,
    );
    setFilterState(updated);
  }

  void selectPerformer(PublicPerformer? performer) {
    state = state.copyWith(
      selectedPerformer: performer,
      clearSelectedPerformer: performer == null,
      clearSelectedVenue: true,
    );
  }

  void selectVenue(PublicVenue? venue) {
    state = state.copyWith(
      selectedVenue: venue,
      clearSelectedVenue: venue == null,
      clearSelectedPerformer: true,
    );
  }

  void _refreshData(
    DiscoveryLocation loc, {
    double queryRadiusMiles = 50.0,
  }) {
    final effectiveRadius = math.min(queryRadiusMiles, maxDiscoveryRadiusMiles);
    final lat = loc.latitude;
    final lng = loc.longitude;
    final isTorrance = loc.city.toLowerCase().contains('torrance');
    final isNashville = loc.city.toLowerCase().contains('nashville');

    // 2-minute memory cache key
    final cellKey = '${lat.toStringAsFixed(2)}_${lng.toStringAsFixed(2)}_${state.filterState.computeFilterHash()}_${effectiveRadius.toInt()}';
    final cached = _cache[cellKey];
    if (cached != null && !cached.isExpired) {
      _tracker?.recordCacheHit();
      state = state.copyWith(
        performers: cached.performers,
        campaigns: cached.campaigns,
        cacheHitsCount: state.cacheHitsCount + 1,
        selectedPerformer: cached.performers.isNotEmpty ? cached.performers.first : null,
      );
      return;
    }

    _tracker?.recordQueryExecution(cellsQueried: math.min(9, maxGeohashCells));

    // Seed candidate items from the geographic region
    final List<PublicPerformer> candidatePerformers = [
      PublicPerformer(
        id: isTorrance ? 'jake_rios_torrance' : 'jake_rios_1',
        slug: 'jake-rios',
        name: 'Jake Rios',
        type: 'artist',
        bio: 'Acoustic indie singer-songwriter performing originals and covers.',
        aiCardSummary: 'Indie-folk storyteller blending warm acoustic guitar with late-night California energy.',
        genres: const ['Indie Pop', 'Acoustic'],
        isVerified: true,
        isLive: true,
        currentVenueName: isTorrance ? 'Torrance Cultural Arts Center' : 'The Main Stage',
        distanceMiles: 0.3,
        latitude: lat + 0.003,
        longitude: lng + 0.002,
        liveFansCount: isTorrance ? 168 : 142,
        timeRemaining: '45 min left',
        photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
      ),
      // Duplicate entry to test deduplication across overlapping geohash cells
      PublicPerformer(
        id: isTorrance ? 'jake_rios_torrance' : 'jake_rios_1',
        slug: 'jake-rios',
        name: 'Jake Rios',
        type: 'artist',
        bio: 'Acoustic indie singer-songwriter performing originals and covers.',
        aiCardSummary: 'Indie-folk storyteller blending warm acoustic guitar with late-night California energy.',
        genres: const ['Indie Pop', 'Acoustic'],
        isVerified: true,
        isLive: true,
        currentVenueName: isTorrance ? 'Torrance Cultural Arts Center' : 'The Main Stage',
        distanceMiles: 0.3,
        latitude: lat + 0.003,
        longitude: lng + 0.002,
        liveFansCount: isTorrance ? 168 : 142,
        timeRemaining: '45 min left',
        photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
      ),
      PublicPerformer(
        id: isNashville ? 'velvet_nashville' : 'velvet_horizon_2',
        slug: 'velvet-horizon',
        name: 'Velvet Horizon',
        type: 'band',
        bio: 'High-energy alternative rock four-piece.',
        aiCardSummary: 'Four-piece rock band mixing country grit, blues swagger and crowd-driven live sets.',
        genres: const ['Rock', 'Alternative'],
        isVerified: true,
        isLive: true,
        memberCount: 4,
        currentVenueName: isNashville ? 'Ryman Stage' : 'Soda Bar',
        distanceMiles: 0.8,
        latitude: lat - 0.004,
        longitude: lng + 0.005,
        liveFansCount: 89,
        timeRemaining: '1h 15m left',
        photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
      ),
      PublicPerformer(
        id: 'neon_solstice_3',
        slug: 'neon-solstice',
        name: 'Neon Solstice',
        type: 'artist',
        bio: 'Analog synthwave and dynamic electronic soundscapes.',
        aiCardSummary: 'Electronic ambient producer performing live synthesizer arrangements and dynamic vocal loops.',
        genres: const ['Electronic', 'Synthwave'],
        isVerified: false,
        isLive: false,
        currentVenueName: 'Music Box Rooftop',
        distanceMiles: 1.2,
        latitude: lat + 0.006,
        longitude: lng - 0.004,
        liveFansCount: 215,
        timeRemaining: 'Starts in 20 min',
        photoUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
      ),
      PublicPerformer(
        id: 'luna_causey_4',
        slug: 'luna-causey',
        name: 'Luna Causey',
        type: 'artist',
        bio: 'Soulful R&B vocalist with stripped-back acoustics.',
        aiCardSummary: 'Soulful R&B vocals, stripped-back acoustics and a stage presence built for intimate rooms.',
        genres: const ['R&B', 'Soul'],
        isVerified: true,
        isLive: false,
        currentVenueName: 'The Holding Company',
        distanceMiles: 1.7,
        latitude: lat - 0.006,
        longitude: lng - 0.003,
        timeRemaining: 'Ended',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      ),
      PublicPerformer(
        id: 'the_strays_5',
        slug: 'the-strays',
        name: 'The Strays',
        type: 'band',
        bio: 'Garage punk and gritty blues.',
        aiCardSummary: 'Independent band performing original garage rock and connecting with fans through live shows.',
        genres: const ['Rock', 'Punk'],
        isVerified: false,
        isLive: false,
        memberCount: 3,
        distanceMiles: 2.1,
        latitude: lat - 0.008,
        longitude: lng - 0.007,
        photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
      ),
      PublicPerformer(
        id: 'maya_lin_6',
        slug: 'maya-lin',
        name: 'Maya Lin',
        type: 'artist',
        bio: 'Neo-soul pianist and vocalist with jazzy grooves.',
        aiCardSummary: 'Neo-soul keyboardist and vocalist performing jazz-infused originals and intimate acoustic sets.',
        genres: const ['R&B', 'Soul', 'Jazz'],
        isVerified: true,
        isLive: true,
        currentVenueName: 'The Loft Lounge',
        distanceMiles: 1.1,
        latitude: lat + 0.005,
        longitude: lng + 0.003,
        liveFansCount: 94,
        timeRemaining: '55 min left',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      ),
      PublicPerformer(
        id: 'sol_patrol_7',
        slug: 'sol-patrol',
        name: 'Sol Patrol',
        type: 'band',
        bio: 'Reggae-dub collective spreading positive coastal vibrations.',
        aiCardSummary: 'Five-piece reggae and dub ensemble delivering horn-driven basslines and high-vibe summer shows.',
        genres: const ['Reggae', 'Alternative'],
        isVerified: true,
        isLive: true,
        memberCount: 5,
        currentVenueName: 'Beachside Amphitheatre',
        distanceMiles: 1.5,
        latitude: lat - 0.005,
        longitude: lng - 0.005,
        liveFansCount: 172,
        timeRemaining: '1h 40m left',
        photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
      ),
      PublicPerformer(
        id: 'rio_trio_8',
        slug: 'rio-trio',
        name: 'Rio Trio',
        type: 'band',
        bio: 'Latin jazz and bossa nova trio.',
        aiCardSummary: 'Instrumental Latin jazz trio blending classical Spanish guitar with Brazilian samba rhythms.',
        genres: const ['Jazz', 'Acoustic'],
        isVerified: false,
        isLive: true,
        memberCount: 3,
        currentVenueName: 'Plaza Courtyard',
        distanceMiles: 2.3,
        latitude: lat + 0.007,
        longitude: lng + 0.006,
        liveFansCount: 65,
        timeRemaining: '35 min left',
        photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      ),
    ];

    final List<PublicVenue> sampleVenues = [
      PublicVenue(
        id: 'venue_casbah',
        name: isTorrance ? 'Torrance Cultural Arts Center' : 'The Casbah',
        description: 'Legendary live music venue with intimate stage acoustics.',
        city: loc.city,
        state: loc.administrativeArea,
        country: loc.country,
        latitude: lat + 0.003,
        longitude: lng + 0.002,
        capacity: 250,
        activeMusicianCount: 2,
        genres: const ['Indie Pop', 'Rock', 'Alternative'],
        distanceMiles: 0.3,
        eventTimes: 'Tonight 8:00 PM',
        photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      ),
      PublicVenue(
        id: 'venue_soda',
        name: isNashville ? 'Ryman Auditorium' : 'Soda Bar',
        description: 'Cozy indie venue hosting eclectic national and local acts.',
        city: loc.city,
        state: loc.administrativeArea,
        country: loc.country,
        latitude: lat - 0.004,
        longitude: lng + 0.005,
        capacity: 150,
        activeMusicianCount: 1,
        genres: const ['Rock', 'Punk', 'Electronic'],
        distanceMiles: 0.8,
        eventTimes: 'Tonight 9:30 PM',
        photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
      ),
    ];

    // Deduplication across overlapping geohash queries
    final Map<String, PublicPerformer> deduplicatedMap = {};
    int rawCount = 0;
    for (final p in candidatePerformers) {
      rawCount++;
      deduplicatedMap[p.id] = p;
    }
    final deduplicatedDiff = rawCount - deduplicatedMap.length;
    if (deduplicatedDiff > 0) {
      _tracker?.recordDeduplicatedDocs(deduplicatedDiff);
    }

    final filters = state.filterState;

    // Apply exact distance, expiry/freshness, category and custom filters
    final filteredPerformers = deduplicatedMap.values.where((p) {
      // Expiry / freshness handling: ended sessions disappear immediately
      if (p.timeRemaining == 'Ended') return false;

      // Distance cap
      if (p.distanceMiles != null && p.distanceMiles! > filters.maxDistanceMiles) {
        return false;
      }
      if (p.distanceMiles != null && p.distanceMiles! > effectiveRadius) {
        return false;
      }

      // Live now filter
      if (filters.liveNow && !p.isLive) {
        // If startingSoon is enabled, allow non-live items that are starting soon
        if (!filters.startingSoon || !(p.timeRemaining?.contains('Starts in') ?? false)) {
          return false;
        }
      }

      // Performer type filter
      if (filters.performerType == 'artist' && p.type != 'artist') return false;
      if (filters.performerType == 'band' && p.type != 'band') return false;

      // Category filter
      if (state.selectedCategory == DiscoveryCategory.liveNow && !p.isLive) return false;
      if (state.selectedCategory == DiscoveryCategory.soloMusicians && p.type != 'artist') return false;
      if (state.selectedCategory == DiscoveryCategory.bands && p.type != 'band') return false;

      // Genre filter
      final activeGenre = filters.selectedGenre != 'All' ? filters.selectedGenre : state.selectedGenre;
      if (activeGenre != 'All' && !p.genres.contains(activeGenre)) {
        return false;
      }

      // Verified check-in filter
      if (filters.verifiedOnly && !p.isVerified) return false;

      return true;
    }).take(maxResultsLimit).toList();

    // Sort performers: Live performers first, then sorted by distance ascending
    filteredPerformers.sort((a, b) {
      if (a.isLive != b.isLive) {
        return a.isLive ? -1 : 1;
      }
      final distA = a.distanceMiles ?? 999.0;
      final distB = b.distanceMiles ?? 999.0;
      return distA.compareTo(distB);
    });

    final List<DiscoveryCampaign> sampleCampaigns = [
      DiscoveryCampaign(
        id: 'camp_jake_ep',
        creatorId: isTorrance ? 'jake_rios_torrance' : 'jake_rios_1',
        creatorName: 'Jake Rios',
        creatorType: 'Solo Musician',
        creatorPhotoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        title: 'Debut Studio EP — "Pacific Dusk"',
        description: 'Funding production, mixing, and vinyl pressings for my 5-track acoustic indie folk EP.',
        goalCents: 500000,
        pledgedCents: 415000,
        backerCount: 78,
        daysRemaining: 12,
      ),
      DiscoveryCampaign(
        id: 'camp_velvet_tour',
        creatorId: isNashville ? 'velvet_nashville' : 'velvet_horizon_2',
        creatorName: 'Velvet Horizon',
        creatorType: 'Band',
        creatorPhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
        title: 'West Coast Summer Tour Van Fund',
        description: 'Help us repair our touring van and finance fuel/lodging for our 12-city club run.',
        goalCents: 850000,
        pledgedCents: 520000,
        backerCount: 114,
        daysRemaining: 18,
      ),
    ];

    _tracker?.recordDocumentReads(filteredPerformers.length);

    // Save to 2-minute memory cache
    _cache[cellKey] = _CachedBatch(filteredPerformers, DateTime.now(), sampleCampaigns);

    state = state.copyWith(
      performers: filteredPerformers,
      venues: sampleVenues,
      campaigns: sampleCampaigns,
      deduplicatedCount: state.deduplicatedCount + deduplicatedDiff,
      selectedPerformer: filteredPerformers.isNotEmpty ? filteredPerformers.first : null,
    );
  }
}

final discoveryProvider = StateNotifierProvider<DiscoveryNotifier, DiscoveryState>((ref) {
  final locationProvider = ref.read(locationProviderProvider);
  final tracker = ref.read(activeSubscriptionTrackerProvider);
  return DiscoveryNotifier(locationProvider, tracker);
});
