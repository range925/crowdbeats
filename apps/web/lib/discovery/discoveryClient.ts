/**
 * Crowdbeats V2 — Web Discovery Client & State Service
 * 
 * Provides client-side and SSR discovery querying, Places search,
 * location hierarchy management, and tip auth gate persistence.
 */

import {
  DiscoveryLocation,
  DiscoveryCategory,
  PendingTipAction,
  DiscoveryFilterOptions,
  DiscoveryQueryBounds,
} from '@crowdbeats/contracts';
import { webReadVolumeTracker } from './readVolumeInstrumentation';

export interface WebDiscoveryState {
  deviceLocation: DiscoveryLocation | null;
  discoveryLocation: DiscoveryLocation;
  isSearchAreaMode: boolean;
  selectedCategory: DiscoveryCategory;
  selectedGenre: string;
  searchQuery: string;
  autocompleteSuggestions: DiscoveryLocation[];
  performers: PublicPerformerItem[];
  venues: PublicVenueItem[];
  selectedPerformerId: string | null;
  selectedVenueId: string | null;
  isLoading: boolean;
}

export interface FanLoveItem {
  id: string;
  fanName: string;
  amountFormatted: string;
  message?: string;
  timeAgo: string;
  avatarUrl?: string;
}

export interface PublicPerformerItem {
  id: string;
  slug: string;
  name: string;
  type: 'artist' | 'band';
  photoUrl?: string;
  coverUrl?: string;
  bio?: string;
  tagline?: string;
  originCity?: string;
  instruments?: string[];
  influences?: string[];
  accolades?: string[];
  audioPreviewUrl?: string;
  featuredTrackTitle?: string;
  rosterPreview?: { name: string; role: string; instrument: string; photoUrl?: string }[];
  recentTippers?: FanLoveItem[];
  genres: string[];
  isVerified: boolean;
  isLive: boolean;
  startingSoon?: boolean;
  endsAt?: number;
  isAccessible?: boolean;
  setting?: 'venue' | 'street';
  isSaved?: boolean;
  currentVenueName?: string;
  distanceMiles?: number;
  latitude: number;
  longitude: number;
  popularityScore: number;
  followersCount: number;
  /** AI-generated 8–18 word summary — no awards, no hallucinated credentials */
  aiCardSummary?: string;
  /** Server-authoritative nearby score for Top 5 Nearby ranking */
  nearbyScore?: number;
  /** Rank position in Top 3 Popular (1, 2, or 3) */
  popularRank?: number;
}


export interface PublicVenueItem {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  latitude: number;
  longitude: number;
  activeMusicianCount: number;
  distanceMiles?: number;
  description?: string;
  imageUrl?: string;
  amenities?: string[];
  capacity?: number;
  stages?: { name: string; performer?: string; status: string }[];
}

export const DEFAULT_DISCOVERY_LOCATION: DiscoveryLocation = {
  placeId: 'loc_san_diego',
  city: 'San Diego',
  administrativeArea: 'California',
  country: 'United States',
  latitude: 32.7157,
  longitude: -117.1611,
  displayName: 'San Diego, California',
};

export const TORRANCE_LOCATION: DiscoveryLocation = {
  placeId: 'loc_torrance',
  city: 'Torrance',
  administrativeArea: 'California',
  country: 'United States',
  latitude: 33.8358,
  longitude: -118.3406,
  displayName: 'Torrance, California',
};

export const CURATED_LOCATIONS: DiscoveryLocation[] = [
  TORRANCE_LOCATION,
  {
    placeId: 'loc_san_diego',
    city: 'San Diego',
    administrativeArea: 'California',
    country: 'United States',
    latitude: 32.7157,
    longitude: -117.1611,
    displayName: 'San Diego, California',
  },
  {
    placeId: 'loc_los_angeles',
    city: 'Los Angeles',
    administrativeArea: 'California',
    country: 'United States',
    latitude: 34.0522,
    longitude: -118.2437,
    displayName: 'Los Angeles, California',
  },
  {
    placeId: 'loc_san_francisco',
    city: 'San Francisco',
    administrativeArea: 'California',
    country: 'United States',
    latitude: 37.7749,
    longitude: -122.4194,
    displayName: 'San Francisco, California',
  },
  {
    placeId: 'loc_palm_springs',
    city: 'Palm Springs',
    administrativeArea: 'California',
    country: 'United States',
    latitude: 33.8303,
    longitude: -116.5453,
    displayName: 'Palm Springs, California',
  },
  {
    placeId: 'loc_austin',
    city: 'Austin',
    administrativeArea: 'Texas',
    country: 'United States',
    latitude: 30.2672,
    longitude: -97.7431,
    displayName: 'Austin, Texas',
  },
  {
    placeId: 'loc_nashville',
    city: 'Nashville',
    administrativeArea: 'Tennessee',
    country: 'United States',
    latitude: 36.1627,
    longitude: -86.7816,
    displayName: 'Nashville, Tennessee',
  },
  {
    placeId: 'loc_new_york',
    city: 'New York',
    administrativeArea: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.006,
    displayName: 'New York, New York',
  },
  {
    placeId: 'loc_chicago',
    city: 'Chicago',
    administrativeArea: 'Illinois',
    country: 'United States',
    latitude: 41.8781,
    longitude: -87.6298,
    displayName: 'Chicago, Illinois',
  },
  {
    placeId: 'loc_seattle',
    city: 'Seattle',
    administrativeArea: 'Washington',
    country: 'United States',
    latitude: 47.6062,
    longitude: -122.3321,
    displayName: 'Seattle, Washington',
  },
  {
    placeId: 'loc_miami',
    city: 'Miami',
    administrativeArea: 'Florida',
    country: 'United States',
    latitude: 25.7617,
    longitude: -80.1918,
    displayName: 'Miami, Florida',
  },
  {
    placeId: 'loc_denver',
    city: 'Denver',
    administrativeArea: 'Colorado',
    country: 'United States',
    latitude: 39.7392,
    longitude: -104.9903,
    displayName: 'Denver, Colorado',
  },
  {
    placeId: 'loc_new_orleans',
    city: 'New Orleans',
    administrativeArea: 'Louisiana',
    country: 'United States',
    latitude: 29.9511,
    longitude: -90.0715,
    displayName: 'New Orleans, Louisiana',
  },
  {
    placeId: 'loc_toronto',
    city: 'Toronto',
    administrativeArea: 'Ontario',
    country: 'Canada',
    latitude: 43.6532,
    longitude: -79.3832,
    displayName: 'Toronto, Canada',
  },
  {
    placeId: 'loc_vancouver',
    city: 'Vancouver',
    administrativeArea: 'British Columbia',
    country: 'Canada',
    latitude: 49.2827,
    longitude: -123.1207,
    displayName: 'Vancouver, Canada',
  },
  {
    placeId: 'loc_london',
    city: 'London',
    administrativeArea: 'Greater London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    displayName: 'London, United Kingdom',
  },
  {
    placeId: 'loc_paris',
    city: 'Paris',
    administrativeArea: 'Île-de-France',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    displayName: 'Paris, France',
  },
  {
    placeId: 'loc_berlin',
    city: 'Berlin',
    administrativeArea: 'Berlin',
    country: 'Germany',
    latitude: 52.52,
    longitude: 13.405,
    displayName: 'Berlin, Germany',
  },
  {
    placeId: 'loc_tokyo',
    city: 'Tokyo',
    administrativeArea: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    displayName: 'Tokyo, Japan',
  },
  {
    placeId: 'loc_sydney',
    city: 'Sydney',
    administrativeArea: 'New South Wales',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    displayName: 'Sydney, Australia',
  },
  {
    placeId: 'loc_auckland',
    city: 'Auckland',
    administrativeArea: 'Auckland',
    country: 'New Zealand',
    latitude: -36.8485,
    longitude: 174.7633,
    displayName: 'Auckland, New Zealand',
  },
];

/**
 * Popular live music venue check-in locations for solo musicians and bands.
 * Shown as quick-select suggestions in the musician check-in flow.
 */
export interface PopularVenue {
  placeId: string;
  name: string;
  city: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  venueType: 'bar' | 'cafe' | 'club' | 'theater' | 'outdoor' | 'restaurant';
  emoji: string;
}

export const POPULAR_CHECKIN_VENUES: PopularVenue[] = [
  // San Diego
  { placeId: 'ven_casbah_sd', name: 'The Casbah', city: 'San Diego', state: 'CA', address: '2501 Kettner Blvd, San Diego, CA', latitude: 32.7318, longitude: -117.1945, venueType: 'club', emoji: '🎸' },
  { placeId: 'ven_belly_up', name: 'Belly Up Tavern', city: 'Solana Beach', state: 'CA', address: '143 S Cedros Ave, Solana Beach, CA', latitude: 32.9898, longitude: -117.2710, venueType: 'bar', emoji: '🍺' },
  { placeId: 'ven_music_box_sd', name: 'Music Box', city: 'San Diego', state: 'CA', address: '1337 India St, San Diego, CA', latitude: 32.7275, longitude: -117.1700, venueType: 'club', emoji: '🎵' },
  { placeId: 'ven_soda_bar_sd', name: 'Soda Bar', city: 'San Diego', state: 'CA', address: '3615 El Cajon Blvd, San Diego, CA', latitude: 32.7518, longitude: -117.1095, venueType: 'bar', emoji: '🎶' },
  // Los Angeles
  { placeId: 'ven_troubadour_la', name: 'The Troubadour', city: 'West Hollywood', state: 'CA', address: '9081 Santa Monica Blvd, West Hollywood, CA', latitude: 34.0804, longitude: -118.3869, venueType: 'club', emoji: '🎸' },
  { placeId: 'ven_roxy_la', name: 'The Roxy Theatre', city: 'West Hollywood', state: 'CA', address: '9009 Sunset Blvd, West Hollywood, CA', latitude: 34.0909, longitude: -118.3876, venueType: 'theater', emoji: '🎭' },
  { placeId: 'ven_echo_la', name: 'The Echo', city: 'Los Angeles', state: 'CA', address: '1822 Sunset Blvd, Los Angeles, CA', latitude: 34.0780, longitude: -118.2609, venueType: 'club', emoji: '🎶' },
  { placeId: 'ven_blue_whale_la', name: 'Blue Whale Jazz Club', city: 'Los Angeles', state: 'CA', address: '123 Astronaut E S Onizuka St, Los Angeles, CA', latitude: 34.0491, longitude: -118.2407, venueType: 'club', emoji: '🎷' },
  // San Francisco
  { placeId: 'ven_fillmore_sf', name: 'The Fillmore', city: 'San Francisco', state: 'CA', address: '1805 Geary Blvd, San Francisco, CA', latitude: 37.7845, longitude: -122.4331, venueType: 'theater', emoji: '🎭' },
  { placeId: 'ven_independent_sf', name: 'The Independent', city: 'San Francisco', state: 'CA', address: '628 Divisadero St, San Francisco, CA', latitude: 37.7746, longitude: -122.4375, venueType: 'club', emoji: '🎵' },
  { placeId: 'ven_bimbos_sf', name: "Bimbo's 365 Club", city: 'San Francisco', state: 'CA', address: '1025 Columbus Ave, San Francisco, CA', latitude: 37.8031, longitude: -122.4117, venueType: 'club', emoji: '🎶' },
  // Austin
  { placeId: 'ven_stubb_atx', name: "Stubb's Waller Creek Amphitheater", city: 'Austin', state: 'TX', address: '801 Red River St, Austin, TX', latitude: 30.2678, longitude: -97.7348, venueType: 'outdoor', emoji: '🌟' },
  { placeId: 'ven_emo_atx', name: "Emo's Austin", city: 'Austin', state: 'TX', address: '2015 E Riverside Dr, Austin, TX', latitude: 30.2383, longitude: -97.7315, venueType: 'club', emoji: '🎸' },
  { placeId: 'ven_white_horse_atx', name: 'White Horse', city: 'Austin', state: 'TX', address: '500 Comal St, Austin, TX', latitude: 30.2617, longitude: -97.7227, venueType: 'bar', emoji: '🤠' },
  // Nashville
  { placeId: 'ven_bluebird_nash', name: 'Bluebird Cafe', city: 'Nashville', state: 'TN', address: '4104 Hillsboro Pike, Nashville, TN', latitude: 36.1075, longitude: -86.8274, venueType: 'cafe', emoji: '🎵' },
  { placeId: 'ven_ryman_nash', name: 'Ryman Auditorium', city: 'Nashville', state: 'TN', address: '116 5th Ave N, Nashville, TN', latitude: 36.1612, longitude: -86.7784, venueType: 'theater', emoji: '🎭' },
  { placeId: 'ven_station_inn_nash', name: 'Station Inn', city: 'Nashville', state: 'TN', address: '402 12th Ave S, Nashville, TN', latitude: 36.1501, longitude: -86.7916, venueType: 'bar', emoji: '🪕' },
  // New York
  { placeId: 'ven_blue_note_nyc', name: 'Blue Note Jazz Club', city: 'New York', state: 'NY', address: '131 W 3rd St, New York, NY', latitude: 40.7305, longitude: -74.0003, venueType: 'club', emoji: '🎷' },
  { placeId: 'ven_bowery_nyc', name: 'Bowery Ballroom', city: 'New York', state: 'NY', address: '6 Delancey St, New York, NY', latitude: 40.7196, longitude: -73.9942, venueType: 'club', emoji: '🎸' },
  { placeId: 'ven_village_vanguard_nyc', name: 'Village Vanguard', city: 'New York', state: 'NY', address: '178 7th Ave S, New York, NY', latitude: 40.7354, longitude: -74.0006, venueType: 'club', emoji: '🎺' },
  // Chicago
  { placeId: 'ven_andy_chi', name: "Andy's Jazz Club", city: 'Chicago', state: 'IL', address: '11 E Hubbard St, Chicago, IL', latitude: 41.8905, longitude: -87.6279, venueType: 'club', emoji: '🎷' },
  { placeId: 'ven_green_mill_chi', name: 'Green Mill Cocktail Lounge', city: 'Chicago', state: 'IL', address: '4802 N Broadway, Chicago, IL', latitude: 41.9656, longitude: -87.6598, venueType: 'bar', emoji: '🎵' },
  // New Orleans
  { placeId: 'ven_tipitinas_nola', name: "Tipitina's", city: 'New Orleans', state: 'LA', address: '501 Napoleon Ave, New Orleans, LA', latitude: 29.9328, longitude: -90.0892, venueType: 'club', emoji: '🎶' },
  { placeId: 'ven_maple_leaf_nola', name: 'Maple Leaf Bar', city: 'New Orleans', state: 'LA', address: '8316 Oak St, New Orleans, LA', latitude: 29.9379, longitude: -90.1221, venueType: 'bar', emoji: '🎺' },
];


export const MOCK_PERFORMERS: PublicPerformerItem[] = [
  {
    id: 'art_jake_rios',
    slug: 'jake-rios',
    name: 'Jake Rios',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    bio: 'Acoustic indie folk songwriter touring coastal venues. Combining soulful vocals with rhythmic fingerstyle guitar and intimate storytelling that connects audiences.',
    tagline: 'Coastal Indie Folk Songwriter & Rhythmic Fingerstyle Acoustic',
    originCity: 'San Diego, CA',
    instruments: ['Acoustic Guitar', 'Vocals', 'Harmonica', 'Stomp Box'],
    influences: ['Bon Iver', 'Iron & Wine', 'Ben Howard', 'The Tallest Man on Earth'],
    accolades: ['Verified Resident Performer', 'Top 5 Live Musician 2026', 'Casbah Showcase Winner'],
    featuredTrackTitle: 'Pacific Twilight (Acoustic Demo)',
    audioPreviewUrl: 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg',
    genres: ['Acoustic', 'Indie Folk', 'Pop'],
    isVerified: true,
    isLive: true,
    currentVenueName: 'The Main Stage',
    distanceMiles: 0.3,
    latitude: 32.7157 + 0.003,
    longitude: -117.1611 + 0.002,
    popularityScore: 94,
    followersCount: 1420,
    aiCardSummary: 'Acoustic indie folk artist performing live original songs at San Diego coastal venues.',
    nearbyScore: 385,
    popularRank: 2,
    recentTippers: [
      { id: 'tip_1', fanName: 'Sarah M.', amountFormatted: '$25.00', message: 'That fingerstyle picking on the second track gave me chills!', timeAgo: '22m ago' },
      { id: 'tip_2', fanName: 'Devon K.', amountFormatted: '$15.00', message: 'Best acoustic set at The Main Stage this year!', timeAgo: '1h ago' },
      { id: 'tip_3', fanName: 'Alex River', amountFormatted: '$50.00', message: 'Keep inspiring us man!', timeAgo: '3h ago' },
    ],
  },
  {
    id: 'art_maya_lin',
    slug: 'maya-lin',
    name: 'Maya Lin',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Electronic ambient producer performing live synthesizer arrangements and dynamic vocal loops. Creating meditative, danceable sonic journeys for sunset gatherings.',
    tagline: 'Analog Modular Synthesizers, Dreamy Ambient Vocals & Live Loops',
    originCity: 'Encinitas, CA',
    instruments: ['Moog Subsequent 37', 'Vocal Processor', 'Polyend Tracker', 'Pedalboard'],
    influences: ['Tycho', 'Kaitlyn Aurelia Smith', 'Jon Hopkins', 'Maribou State'],
    accolades: ['Resident Sound Architect @ Ocean Acoustic', 'Ambient Artist of the Month'],
    featuredTrackTitle: 'Subterranean Waves (Live Modular Jam)',
    genres: ['Electronic', 'Ambient', 'Indie Pop'],
    isVerified: true,
    isLive: true,
    currentVenueName: 'Ocean Acoustic Club',
    distanceMiles: 0.7,
    latitude: 32.7157 - 0.004,
    longitude: -117.1611 + 0.005,
    popularityScore: 88,
    followersCount: 980,
    aiCardSummary: 'Electronic ambient artist blending synthesizers and vocal loops for immersive live shows.',
    nearbyScore: 362,
    popularRank: 3,
    recentTippers: [
      { id: 'mtip_1', fanName: 'Elena V.', amountFormatted: '$20.00', message: 'Such an immersive soundscape!', timeAgo: '35m ago' },
      { id: 'mtip_2', fanName: 'Sam T.', amountFormatted: '$10.00', message: 'Floating away on this synthesizer set.', timeAgo: '2h ago' },
    ],
  },
  {
    id: 'band_the_sunsets',
    slug: 'the-sunsets',
    name: 'The Sunsets',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    bio: '4-piece high-energy indie rock collective known for explosive brass hooks, soaring vocal harmonies, and anthemic choruses that turn crowds into family.',
    tagline: '4-Piece Indie Rock & Brass Collective from Ocean Beach',
    originCity: 'San Diego, CA',
    instruments: ['Fender Telecaster', 'Trumpet / Flugelhorn', 'Bass Synth', 'Ludwig Drum Kit'],
    influences: ['The Black Keys', 'Foals', 'Young the Giant', 'St. Paul & The Broken Bones'],
    accolades: ['Best Indie Band — SD Music Awards', 'Over 2,300 Community Followers', 'Headline Act'],
    featuredTrackTitle: 'Midnight Horizon (Live Studio Cut)',
    rosterPreview: [
      { name: 'Liam Vance', role: 'Founder & Lead Vocals', instrument: 'Electric Guitar / Vocals' },
      { name: 'Chloe Ray', role: 'Brass & Horns', instrument: 'Trumpet / Flugelhorn' },
      { name: 'Julian Cruz', role: 'Bass & Sub-Synth', instrument: 'Bass Guitar / Synth' },
      { name: 'Marcus Sterling', role: 'Percussion & Rhythm', instrument: 'Drum Kit' },
    ],
    genres: ['Rock', 'Indie Rock', 'Alternative'],
    isVerified: true,
    isLive: true,
    currentVenueName: 'The Main Stage',
    distanceMiles: 0.3,
    latitude: 32.7157 + 0.001,
    longitude: -117.1611 - 0.003,
    popularityScore: 96,
    followersCount: 2350,
    aiCardSummary: 'High-energy indie rock band with explosive brass hooks performing original anthems live.',
    nearbyScore: 396,
    popularRank: 1,
    recentTippers: [
      { id: 'btip_1', fanName: 'Jordan P.', amountFormatted: '$40.00', message: 'The brass drop was insane tonight!', timeAgo: '15m ago' },
      { id: 'btip_2', fanName: 'Taylor W.', amountFormatted: '$20.00', message: 'Loving the energy! Happy touring guys!', timeAgo: '45m ago' },
      { id: 'btip_3', fanName: 'Chris B.', amountFormatted: '$100.00', message: 'Proud to back your next record!', timeAgo: '2h ago' },
    ],
  },
  {
    id: 'art_elena_vance',
    slug: 'elena-vance',
    name: 'Elena Vance',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    bio: 'Modern jazz vocalist and keyboardist performing soulful reinterpretations of contemporary classics and heartfelt original compositions.',
    tagline: 'Contemporary Soul, Late-Night Jazz & Rhodes Electric Piano',
    originCity: 'Los Angeles, CA',
    instruments: ['Rhodes Mark I', 'Vocals', 'Nord Stage 3'],
    influences: ['Norah Jones', 'Robert Glasper', 'Erykah Badu', 'Bill Evans'],
    accolades: ['Velvet Lounge Resident', 'Featured on KCRW Live'],
    featuredTrackTitle: 'Velvet Autumn (Live Trio Session)',
    genres: ['Jazz', 'Soul', 'R&B'],
    isVerified: false,
    isLive: false,
    currentVenueName: 'Velvet Lounge',
    distanceMiles: 1.4,
    latitude: 32.7157 + 0.010,
    longitude: -117.1611 - 0.008,
    popularityScore: 78,
    followersCount: 640,
    aiCardSummary: 'Jazz vocalist and keyboardist connecting fans through soulful original music in San Diego.',
    nearbyScore: 178,
  },
  {
    id: 'art_carlos_reyes',
    slug: 'carlos-reyes',
    name: 'Carlos Reyes',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    bio: 'Latin guitar virtuoso and singer-songwriter weaving flamenco rhythms, fiery rasgueados, and soulful blues into original live performances.',
    tagline: 'Virtuosic Flamenco Guitar, Spanish Nylon & Blues Fusion',
    originCity: 'Tijuana / San Diego',
    instruments: ['Conde Hermanos Flamenco Guitar', 'Foot Percussion', 'Cajón'],
    influences: ['Paco de Lucía', 'Rodrigo y Gabriela', 'Stevie Ray Vaughan'],
    accolades: ['International Guitar Invitational Award', 'Master of Nylon Strings'],
    featuredTrackTitle: 'Fuego de San Diego',
    genres: ['Latin', 'Flamenco', 'Blues'],
    isVerified: true,
    isLive: false,
    distanceMiles: 1.1,
    latitude: 32.7157 - 0.006,
    longitude: -117.1611 - 0.005,
    popularityScore: 82,
    followersCount: 870,
    aiCardSummary: 'Independent musician bringing original live music to the Crowdbeats community.',
    nearbyScore: 192,
  },
];


export const MOCK_VENUES: PublicVenueItem[] = [
  {
    id: 'ven_main_stage',
    name: 'The Main Stage',
    city: 'San Diego',
    state: 'CA',
    address: '450 Harbor Drive, San Diego, CA',
    latitude: 32.7157 + 0.002,
    longitude: -117.1611 + 0.001,
    activeMusicianCount: 3,
    distanceMiles: 0.3,
    description: 'Premier downtown live music room featuring multi-tier sound and intimate stage views.',
    capacity: 350,
    amenities: ['Full Craft Bar', 'Multi-Tier Sound System', 'Outdoor Smoking Patio', 'All-Ages Section', 'Sound Engineer On-Site', 'Wheelchair Accessible'],
    stages: [
      { name: 'Main Acoustic Stage', performer: 'Jake Rios', status: 'LIVE NOW' },
      { name: 'Balcony Lounge Stage', performer: 'The Sunsets', status: 'STARTS 9:30 PM' },
    ],
  },
  {
    id: 'ven_ocean_acoustic',
    name: 'Ocean Acoustic Club',
    city: 'San Diego',
    state: 'CA',
    address: '120 Ocean View Ave, San Diego, CA',
    latitude: 32.7157 - 0.005,
    longitude: -117.1611 + 0.004,
    activeMusicianCount: 2,
    distanceMiles: 0.7,
    description: 'Open-air coastal listening room with acoustic clarity and sunset performances.',
    capacity: 180,
    amenities: ['Oceanfront Sunset Views', 'Acoustic Soundstage', 'Craft Beer & Wine', 'Food Trucks On-Site'],
    stages: [
      { name: 'Sunset Deck Stage', performer: 'Maya Lin', status: 'LIVE NOW' },
    ],
  },
  {
    id: 'ven_velvet_lounge',
    name: 'Velvet Lounge',
    city: 'San Diego',
    state: 'CA',
    address: '880 5th Avenue, San Diego, CA',
    latitude: 32.7157 + 0.009,
    longitude: -117.1611 - 0.007,
    activeMusicianCount: 1,
    distanceMiles: 1.4,
    description: 'Historic speakeasy lounge spotlighting acoustic soul, jazz trios, and craft mixology.',
    capacity: 120,
    amenities: ['Craft Cocktails', 'Intimate Seating', 'Steinway Grand Piano', '21+ Listening Room'],
    stages: [
      { name: 'Jazz Parlor Stage', performer: 'Elena Vance', status: 'STARTS 10:00 PM' },
    ],
  },
];

export class DiscoveryClient {
  /**
   * Autocomplete location query
   */
  static searchLocations(query: string): DiscoveryLocation[] {
    if (!query || query.trim().length < 1) return CURATED_LOCATIONS;
    const q = query.toLowerCase().trim();
    const matches = CURATED_LOCATIONS.filter((loc) => {
      if (q.length === 1) {
        return loc.city.toLowerCase().startsWith(q) || loc.displayName.toLowerCase().startsWith(q);
      }
      return (
        loc.displayName.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        (loc.administrativeArea && loc.administrativeArea.toLowerCase().includes(q)) ||
        loc.country.toLowerCase().includes(q)
      );
    });

    // If query typed isn't an exact city match, inject dynamic matching place option
    const exactMatch = matches.some((m) => m.city.toLowerCase() === q);
    if (!exactMatch && q.length >= 2) {
      const formatted = q.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      matches.unshift({
        placeId: `loc_custom_${q.replace(/\s+/g, '_')}`,
        city: formatted,
        administrativeArea: 'Search Area',
        country: 'Global',
        latitude: 33.8358,
        longitude: -118.3406,
        displayName: `${formatted} (Explore Region)`,
      });
    }

    return matches;
  }

  /**
   * Pending Tip Context Session Storage Key
   */
  private static readonly TIP_STORAGE_KEY = 'cb_pending_tip_context';

  static savePendingTip(action: PendingTipAction): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(this.TIP_STORAGE_KEY, JSON.stringify(action));
    } catch {
      // Ignore storage quota errors
    }
  }

  static getPendingTip(): PendingTipAction | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = sessionStorage.getItem(this.TIP_STORAGE_KEY);
      return data ? (JSON.parse(data) as PendingTipAction) : null;
    } catch {
      return null;
    }
  }

  static clearPendingTip(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(this.TIP_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  // ─── Phase 8 Memory Cache & Bounds ──────────────────────────────────────────

  private static readonly performerCache = new Map<string, { data: PublicPerformerItem[]; timestamp: number }>();

  static getCachedPerformers(key: string): PublicPerformerItem[] | null {
    const entry = this.performerCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.performerCache.delete(key);
      return null;
    }
    webReadVolumeTracker.recordCacheHit();
    return entry.data;
  }

  static setCachedPerformers(key: string, data: PublicPerformerItem[]): void {
    this.performerCache.set(key, { data, timestamp: Date.now() });
  }

  static clearCache(): void {
    this.performerCache.clear();
  }

  static async queryPerformersWithCache(
    geohashPrefix: string,
    filters: DiscoveryFilterOptions = {},
    fetcher: () => Promise<PublicPerformerItem[]> | PublicPerformerItem[]
  ): Promise<PublicPerformerItem[]> {
    const filterHash = computeFilterHash(filters);
    const cacheKey = `${geohashPrefix}_${filterHash}`;

    const cached = this.getCachedPerformers(cacheKey);
    if (cached) {
      return cached;
    }

    webReadVolumeTracker.recordQuery();
    const raw = await fetcher();
    webReadVolumeTracker.recordReads(raw.length);

    const processed = filterAndDeduplicatePerformers(raw, filters);
    this.setCachedPerformers(cacheKey, processed);
    return processed;
  }
}

export const MAX_DISCOVERY_RADIUS_MILES = 50;
export const MAX_GEOHASH_CELLS = 9;
export const MAX_DISCOVERY_DOCS = 50;
export const CACHE_TTL_MS = 120_000; // 2 minutes

/**
 * Computes a deterministic filter hash for caching discovery query results.
 */
export function computeFilterHash(filters: DiscoveryFilterOptions = {}): string {
  const parts: string[] = [
    `live:${filters.liveNow ? 1 : 0}`,
    `soon:${filters.startingSoon ? 1 : 0}`,
    `type:${filters.performerType || 'all'}`,
    `genres:${(filters.genres || []).slice().sort().join(',')}`,
    `dist:${filters.maxDistanceMiles ?? MAX_DISCOVERY_RADIUS_MILES}`,
    `setting:${filters.setting || 'all'}`,
    `a11y:${filters.accessibilityOnly ? 1 : 0}`,
    `verif:${filters.verifiedOnly ? 1 : 0}`,
    `saved:${filters.savedOnly ? 1 : 0}`,
  ];
  return parts.join(';');
}

/**
 * Generates bounded geohash prefixes (max 9 cells) covering the viewport or radius.
 */
export function generateGeohashPrefixBounds(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): string[] {
  // Simple coarse cell prefix generator capped at MAX_GEOHASH_CELLS (9)
  const latSteps = 3;
  const lngSteps = 3;
  const latDelta = (bounds.maxLat - bounds.minLat) / latSteps;
  const lngDelta = (bounds.maxLng - bounds.minLng) / lngSteps;

  const cells = new Set<string>();
  for (let i = 0; i < latSteps; i++) {
    for (let j = 0; j < lngSteps; j++) {
      const lat = bounds.minLat + i * latDelta + latDelta / 2;
      const lng = bounds.minLng + j * lngDelta + lngDelta / 2;
      // Encode approximate 4-char geohash bucket
      const bucket = `gh_${Math.floor((lat + 90) * 10).toString(36)}_${Math.floor((lng + 180) * 10).toString(36)}`;
      cells.add(bucket);
      if (cells.size >= MAX_GEOHASH_CELLS) break;
    }
    if (cells.size >= MAX_GEOHASH_CELLS) break;
  }

  return Array.from(cells).slice(0, MAX_GEOHASH_CELLS);
}

/**
 * Deduplicates documents returned across overlapping geohash cells and applies client-side filters.
 * Caps output to MAX_DISCOVERY_DOCS (50) and filters out expired live sessions.
 */
export function filterAndDeduplicatePerformers(
  performers: PublicPerformerItem[],
  filters: DiscoveryFilterOptions = {},
  nowMs: number = Date.now()
): PublicPerformerItem[] {
  const seen = new Set<string>();
  const deduplicated: PublicPerformerItem[] = [];
  let dupCount = 0;

  for (const p of performers) {
    if (seen.has(p.id)) {
      dupCount++;
      continue;
    }
    seen.add(p.id);

    // 1. Expired session check: ended sessions disappear immediately
    if (p.isLive && p.endsAt && p.endsAt <= nowMs) {
      continue;
    }

    // 2. Live Now filter
    if (filters.liveNow && !p.isLive) {
      continue;
    }

    // 3. Starting Soon filter
    if (filters.startingSoon && !p.startingSoon) {
      continue;
    }

    // 4. Performer Type (Solo vs Band)
    if (filters.performerType && filters.performerType !== 'all') {
      if (filters.performerType === 'artist' && p.type !== 'artist') continue;
      if (filters.performerType === 'band' && p.type !== 'band') continue;
    }

    // 5. Genre filter
    if (filters.genres && filters.genres.length > 0) {
      const hasGenre = filters.genres.some((g) =>
        p.genres.some((pg) => pg.toLowerCase() === g.toLowerCase())
      );
      if (!hasGenre) continue;
    }

    // 6. Max Distance filter (capped at MAX_DISCOVERY_RADIUS_MILES = 50)
    const effectiveMaxDist = Math.min(
      filters.maxDistanceMiles ?? MAX_DISCOVERY_RADIUS_MILES,
      MAX_DISCOVERY_RADIUS_MILES
    );
    if (p.distanceMiles !== undefined && p.distanceMiles > effectiveMaxDist) {
      continue;
    }

    // 7. Verified check-in only
    if (filters.verifiedOnly && !p.isVerified) {
      continue;
    }

    // 8. Accessibility only
    if (filters.accessibilityOnly && !p.isAccessible) {
      continue;
    }

    // 9. Venue vs Street setting
    if (filters.setting && filters.setting !== 'all') {
      if (p.setting && p.setting !== filters.setting) continue;
    }

    // 10. Saved only
    if (filters.savedOnly && !p.isSaved) {
      continue;
    }

    deduplicated.push(p);
    if (deduplicated.length >= MAX_DISCOVERY_DOCS) {
      break;
    }
  }

  if (dupCount > 0) {
    webReadVolumeTracker.recordDeduplicated(dupCount);
  }

  return deduplicated;
}

