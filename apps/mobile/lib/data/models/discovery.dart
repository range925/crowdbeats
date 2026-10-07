// Crowdbeats V2 — Discovery Models (Dart Parity for Public Discovery)
//
// Matches TypeScript contracts in @crowdbeats/contracts.

enum DiscoveryCategory {
  liveNow,
  nearYou,
  popular,
  trending,
  soloMusicians,
  bands,
  venues,
  upcoming,
  genres,
}

extension DiscoveryCategoryExtension on DiscoveryCategory {
  String get label {
    switch (this) {
      case DiscoveryCategory.liveNow:
        return 'Live Now';
      case DiscoveryCategory.nearYou:
        return 'Near You';
      case DiscoveryCategory.popular:
        return 'Popular';
      case DiscoveryCategory.trending:
        return 'Trending';
      case DiscoveryCategory.soloMusicians:
        return 'Solo Artists';
      case DiscoveryCategory.bands:
        return 'Bands';
      case DiscoveryCategory.venues:
        return 'Venues';
      case DiscoveryCategory.upcoming:
        return 'Upcoming';
      case DiscoveryCategory.genres:
        return 'Genres';
    }
  }

  String get id {
    switch (this) {
      case DiscoveryCategory.liveNow:
        return 'LIVE_NOW';
      case DiscoveryCategory.nearYou:
        return 'NEAR_YOU';
      case DiscoveryCategory.popular:
        return 'POPULAR';
      case DiscoveryCategory.trending:
        return 'TRENDING';
      case DiscoveryCategory.soloMusicians:
        return 'SOLO_MUSICIANS';
      case DiscoveryCategory.bands:
        return 'BANDS';
      case DiscoveryCategory.venues:
        return 'VENUES';
      case DiscoveryCategory.upcoming:
        return 'UPCOMING';
      case DiscoveryCategory.genres:
        return 'GENRES';
    }
  }
}

class DiscoveryLocation {
  const DiscoveryLocation({
    required this.placeId,
    required this.displayName,
    required this.city,
    this.administrativeArea = 'CA',
    this.country = 'USA',
    required this.latitude,
    required this.longitude,
  });

  final String placeId;
  final String displayName;
  final String city;
  final String administrativeArea;
  final String country;
  final double latitude;
  final double longitude;

  static const sanDiego = DiscoveryLocation(
    placeId: 'ChIJSVRZgQ162YARi_so8qD5620',
    displayName: 'San Diego, CA',
    city: 'San Diego',
    administrativeArea: 'CA',
    country: 'USA',
    latitude: 32.7157,
    longitude: -117.1611,
  );

  static const torrance = DiscoveryLocation(
    placeId: 'ChIJz3s2sV7EwoARx3Z92y-x_k4',
    displayName: 'Torrance, CA',
    city: 'Torrance',
    administrativeArea: 'CA',
    country: 'USA',
    latitude: 33.8358,
    longitude: -118.3406,
  );

  static const nashville = DiscoveryLocation(
    placeId: 'ChIJPZDrEzLsZIgRoNrpodq5P30',
    displayName: 'Nashville, TN',
    city: 'Nashville',
    administrativeArea: 'TN',
    country: 'USA',
    latitude: 36.1627,
    longitude: -86.7816,
  );

  static const palmSprings = DiscoveryLocation(
    placeId: 'ChIJJ_Q68U7m2oARjWbK_u1Gv0s',
    displayName: 'Palm Springs, CA',
    city: 'Palm Springs',
    administrativeArea: 'CA',
    country: 'USA',
    latitude: 33.8303,
    longitude: -116.5453,
  );

  static const losAngeles = DiscoveryLocation(
    placeId: 'ChIJE9on3F3HwoAR9AhGJW_fL-I',
    displayName: 'Los Angeles, CA',
    city: 'Los Angeles',
    administrativeArea: 'CA',
    country: 'USA',
    latitude: 34.0522,
    longitude: -118.2437,
  );

  static const austin = DiscoveryLocation(
    placeId: 'ChIJLwRrcBm1RIYRFZTALtxqioo',
    displayName: 'Austin, TX',
    city: 'Austin',
    administrativeArea: 'TX',
    country: 'USA',
    latitude: 30.2672,
    longitude: -97.7431,
  );

  static const auckland = DiscoveryLocation(
    placeId: 'ChIJ--acWvtHDW0RF5miQ2HoAAU',
    displayName: 'Auckland, New Zealand',
    city: 'Auckland',
    administrativeArea: 'Auckland',
    country: 'New Zealand',
    latitude: -36.8485,
    longitude: 174.7633,
  );

  static const london = DiscoveryLocation(
    placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
    displayName: 'London, UK',
    city: 'London',
    administrativeArea: 'England',
    country: 'UK',
    latitude: 51.5074,
    longitude: -0.1278,
  );

  static const newYork = DiscoveryLocation(
    placeId: 'loc_new_york',
    displayName: 'New York, NY',
    city: 'New York',
    administrativeArea: 'NY',
    country: 'USA',
    latitude: 40.7128,
    longitude: -74.0060,
  );

  static const chicago = DiscoveryLocation(
    placeId: 'loc_chicago',
    displayName: 'Chicago, IL',
    city: 'Chicago',
    administrativeArea: 'IL',
    country: 'USA',
    latitude: 41.8781,
    longitude: -87.6298,
  );

  static const seattle = DiscoveryLocation(
    placeId: 'loc_seattle',
    displayName: 'Seattle, WA',
    city: 'Seattle',
    administrativeArea: 'WA',
    country: 'USA',
    latitude: 47.6062,
    longitude: -122.3321,
  );

  static const miami = DiscoveryLocation(
    placeId: 'loc_miami',
    displayName: 'Miami, FL',
    city: 'Miami',
    administrativeArea: 'FL',
    country: 'USA',
    latitude: 25.7617,
    longitude: -80.1918,
  );

  static const denver = DiscoveryLocation(
    placeId: 'loc_denver',
    displayName: 'Denver, CO',
    city: 'Denver',
    administrativeArea: 'CO',
    country: 'USA',
    latitude: 39.7392,
    longitude: -104.9903,
  );

  static const toronto = DiscoveryLocation(
    placeId: 'loc_toronto',
    displayName: 'Toronto, Canada',
    city: 'Toronto',
    administrativeArea: 'ON',
    country: 'Canada',
    latitude: 43.6532,
    longitude: -79.3832,
  );

  static const vancouver = DiscoveryLocation(
    placeId: 'loc_vancouver',
    displayName: 'Vancouver, Canada',
    city: 'Vancouver',
    administrativeArea: 'BC',
    country: 'Canada',
    latitude: 49.2827,
    longitude: -123.1207,
  );

  static const paris = DiscoveryLocation(
    placeId: 'loc_paris',
    displayName: 'Paris, France',
    city: 'Paris',
    administrativeArea: 'Île-de-France',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
  );

  static const berlin = DiscoveryLocation(
    placeId: 'loc_berlin',
    displayName: 'Berlin, Germany',
    city: 'Berlin',
    administrativeArea: 'Berlin',
    country: 'Germany',
    latitude: 52.5200,
    longitude: 13.4050,
  );

  static const tokyo = DiscoveryLocation(
    placeId: 'loc_tokyo',
    displayName: 'Tokyo, Japan',
    city: 'Tokyo',
    administrativeArea: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
  );

  static const sydney = DiscoveryLocation(
    placeId: 'loc_sydney',
    displayName: 'Sydney, Australia',
    city: 'Sydney',
    administrativeArea: 'NSW',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
  );

  static const sanFrancisco = DiscoveryLocation(
    placeId: 'loc_san_francisco',
    displayName: 'San Francisco, CA',
    city: 'San Francisco',
    administrativeArea: 'CA',
    country: 'USA',
    latitude: 37.7749,
    longitude: -122.4194,
  );

  static const List<DiscoveryLocation> curatedLocations = [
    torrance,
    sanDiego,
    losAngeles,
    sanFrancisco,
    palmSprings,
    austin,
    nashville,
    newYork,
    chicago,
    seattle,
    miami,
    denver,
    toronto,
    vancouver,
    london,
    paris,
    berlin,
    tokyo,
    sydney,
    auckland,
  ];

  static List<DiscoveryLocation> searchLocations(String query) {
    if (query.trim().isEmpty) return curatedLocations;
    final q = query.toLowerCase().trim();
    final matches = curatedLocations.where((loc) {
      return loc.displayName.toLowerCase().contains(q) ||
          loc.city.toLowerCase().contains(q) ||
          loc.administrativeArea.toLowerCase().contains(q) ||
          loc.country.toLowerCase().contains(q);
    }).toList();

    final exactMatch = matches.any((m) => m.city.toLowerCase() == q);
    if (!exactMatch && q.length >= 2) {
      final formatted = q.split(' ').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' ');
      matches.insert(
        0,
        DiscoveryLocation(
          placeId: 'loc_custom_${q.replaceAll(RegExp(r'\s+'), '_')}',
          displayName: '$formatted (Explore Region)',
          city: formatted,
          administrativeArea: 'Search Area',
          country: 'Global',
          latitude: 33.8358,
          longitude: -118.3406,
        ),
      );
    }
    return matches;
  }
}

class PublicPerformer {
  const PublicPerformer({
    required this.id,
    required this.slug,
    required this.name,
    required this.type,
    this.bio,
    this.aiCardSummary,
    this.photoUrl,
    this.coverUrl,
    required this.genres,
    this.isVerified = false,
    this.isLive = false,
    this.currentVenueId,
    this.currentVenueName,
    this.distanceMiles,
    this.memberCount = 1,
    required this.latitude,
    required this.longitude,
    this.liveFansCount = 0,
    this.timeRemaining,
    bool? isStationary,
    this.lastUpdated,
    this.endsAt,
  }) : isStationary = isStationary ?? (currentVenueId != null);

  final String id;
  final String slug;
  final String name;
  final String type; // 'artist' or 'band'
  final String? bio;
  final String? aiCardSummary;
  final String? photoUrl;
  final String? coverUrl;
  final List<String> genres;
  final bool isVerified;
  final bool isLive;
  final String? currentVenueId;
  final String? currentVenueName;
  final double? distanceMiles;
  final int memberCount;
  final double latitude;
  final double longitude;
  final int liveFansCount;
  final String? timeRemaining;
  final bool isStationary;
  final DateTime? lastUpdated;
  final DateTime? endsAt;
}

enum MarkerFreshnessState {
  live,
  updatedJustNow,
  updatedAgo,
  approximate,
  reconnecting,
  ended,
}

class MarkerFreshnessInfo {
  const MarkerFreshnessInfo({
    required this.state,
    required this.label,
    required this.colorHex,
    required this.isLive,
    required this.isApproximate,
  });

  final MarkerFreshnessState state;
  final String label;
  final int colorHex;
  final bool isLive;
  final bool isApproximate;
}

MarkerFreshnessInfo computeMarkerFreshness({
  required DateTime? lastUpdated,
  required bool isLive,
  required bool isStationary,
  bool isConnected = true,
  DateTime? endsAt,
  DateTime? now,
}) {
  final current = now ?? DateTime.now();

  if (!isLive || (endsAt != null && endsAt.isBefore(current))) {
    return const MarkerFreshnessInfo(
      state: MarkerFreshnessState.ended,
      label: 'Ended',
      colorHex: 0xFF64748B,
      isLive: false,
      isApproximate: false,
    );
  }

  final last = lastUpdated ?? current;
  final diffSeconds = current.difference(last).inSeconds;

  if (!isConnected || (diffSeconds > 90 && !isStationary)) {
    return MarkerFreshnessInfo(
      state: MarkerFreshnessState.reconnecting,
      label: 'Reconnecting',
      colorHex: 0xFFF59E0B,
      isLive: true,
      isApproximate: !isStationary,
    );
  }

  if (!isStationary && diffSeconds < 60) {
    return const MarkerFreshnessInfo(
      state: MarkerFreshnessState.approximate,
      label: 'Approximate area (100m)',
      colorHex: 0xFF8B5CF6,
      isLive: true,
      isApproximate: true,
    );
  }

  if (diffSeconds < 60) {
    return MarkerFreshnessInfo(
      state: MarkerFreshnessState.live,
      label: 'Live',
      colorHex: 0xFF00F076,
      isLive: true,
      isApproximate: !isStationary,
    );
  }

  if (diffSeconds < 120) {
    return MarkerFreshnessInfo(
      state: MarkerFreshnessState.updatedJustNow,
      label: 'Updated just now',
      colorHex: 0xFF10B981,
      isLive: true,
      isApproximate: !isStationary,
    );
  }

  final diffMinutes = diffSeconds ~/ 60;
  return MarkerFreshnessInfo(
    state: MarkerFreshnessState.updatedAgo,
    label: 'Updated ${diffMinutes}m ago',
    colorHex: 0xFF94A3B8,
    isLive: true,
    isApproximate: !isStationary,
  );
}

class PublicVenue {
  const PublicVenue({
    required this.id,
    required this.name,
    this.description,
    this.photoUrl,
    this.coverUrl,
    required this.city,
    this.state = 'CA',
    this.country = 'USA',
    required this.latitude,
    required this.longitude,
    this.capacity,
    this.activeMusicianCount = 0,
    this.genres = const [],
    this.distanceMiles,
    this.eventTimes = 'Tonight 8:00 PM',
  });

  final String id;
  final String name;
  final String? description;
  final String? photoUrl;
  final String? coverUrl;
  final String city;
  final String state;
  final String country;
  final double latitude;
  final double longitude;
  final int? capacity;
  final int activeMusicianCount;
  final List<String> genres;
  final double? distanceMiles;
  final String eventTimes;
}

class PendingTipContext {
  const PendingTipContext({
    required this.creatorId,
    this.creatorSlug,
    required this.creatorName,
    required this.creatorType,
    this.creatorPhotoUrl,
    required this.selectedTipAmountCents,
    this.currency = 'USD',
    this.sourceScreen = 'discovery',
    this.performanceId,
    this.venueId,
    this.message,
  });

  final String creatorId;
  final String? creatorSlug;
  final String creatorName;
  final String creatorType;
  final String? creatorPhotoUrl;
  final int selectedTipAmountCents;
  final String currency;
  final String sourceScreen;
  final String? performanceId;
  final String? venueId;
  final String? message;
}

// ─── Phase 8 Two-Way Discovery Filter & Supporter Models ─────────────────────

class DiscoveryFilterState {
  const DiscoveryFilterState({
    this.liveNow = true,
    this.startingSoon = false,
    this.performerType = 'all', // 'all', 'artist', 'band'
    this.selectedGenre = 'All',
    this.maxDistanceMiles = 50.0,
    this.setting = 'all', // 'all', 'venue', 'street'
    this.accessibilityOnly = false,
    this.verifiedOnly = false,
    this.savedOnly = false,
  });

  final bool liveNow;
  final bool startingSoon;
  final String performerType;
  final String selectedGenre;
  final double maxDistanceMiles;
  final String setting;
  final bool accessibilityOnly;
  final bool verifiedOnly;
  final bool savedOnly;

  DiscoveryFilterState copyWith({
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
    return DiscoveryFilterState(
      liveNow: liveNow ?? this.liveNow,
      startingSoon: startingSoon ?? this.startingSoon,
      performerType: performerType ?? this.performerType,
      selectedGenre: selectedGenre ?? this.selectedGenre,
      maxDistanceMiles: maxDistanceMiles ?? this.maxDistanceMiles,
      setting: setting ?? this.setting,
      accessibilityOnly: accessibilityOnly ?? this.accessibilityOnly,
      verifiedOnly: verifiedOnly ?? this.verifiedOnly,
      savedOnly: savedOnly ?? this.savedOnly,
    );
  }

  String computeFilterHash() =>
      '${liveNow}_${startingSoon}_${performerType}_${selectedGenre}_${maxDistanceMiles.toInt()}_${setting}_${accessibilityOnly}_${verifiedOnly}_$savedOnly';
}

class AudienceSupporterItem {
  const AudienceSupporterItem({
    required this.fanId,
    required this.displayName,
    this.photoUrl,
    required this.approxDistanceBand,
    required this.grantedAt,
    required this.expiresAt,
    this.isBlocked = false,
  });

  final String fanId;
  final String displayName;
  final String? photoUrl;
  final String approxDistanceBand; // e.g., "~100m away", "< 0.2 mi"
  final DateTime grantedAt;
  final DateTime expiresAt;
  final bool isBlocked;

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

