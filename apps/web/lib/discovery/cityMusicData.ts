/**
 * Crowdbeats V2 — City Music Data & Random Pin Generator
 * 
 * Provides localized, realistic performer (bear pins 🐻) and venue (🎪) pools
 * for Trending Cities (Torrance, San Diego, Los Angeles, San Francisco) and
 * universal fallback generation for any searched city.
 */

import type { DiscoveryLocation } from '@crowdbeats/contracts';
import type { PublicPerformerItem, PublicVenueItem } from './discoveryClient';

interface CityTemplate {
  venues: Array<Omit<PublicVenueItem, 'latitude' | 'longitude' | 'distanceMiles'>>;
  performers: Array<Omit<PublicPerformerItem, 'latitude' | 'longitude' | 'distanceMiles' | 'currentVenueName' | 'isLive'>>;
}

const CITY_TEMPLATES: Record<string, CityTemplate> = {
  Torrance: {
    venues: [
      {
        id: 'ven_torr_crest',
        name: 'The Crest Lounge & Stage',
        city: 'Torrance',
        state: 'CA',
        address: '1625 Cabrillo Ave, Old Town Torrance, CA',
        activeMusicianCount: 2,
        description: 'Historic Old Town Torrance listening room with craft brews and warm acoustic acoustics.',
      },
      {
        id: 'ven_torr_craft',
        name: 'South Bay Craft Brewery & Stage',
        city: 'Torrance',
        state: 'CA',
        address: '2085 220th St, Torrance, CA',
        activeMusicianCount: 3,
        description: 'Vibrant indoor-outdoor brewery stage showcasing South Bay surf rock, indie, and blues.',
      },
      {
        id: 'ven_torr_del_amo',
        name: 'Del Amo Acoustic Plaza',
        city: 'Torrance',
        state: 'CA',
        address: '3525 Carson St, Torrance, CA',
        activeMusicianCount: 1,
        description: 'Open-air palm-lined plaza featuring intimate acoustic busking and vocal loopers.',
      },
      {
        id: 'ven_torr_cultural',
        name: 'Torrance Cultural Arts Pavilion',
        city: 'Torrance',
        state: 'CA',
        address: '3330 Civic Center Dr, Torrance, CA',
        activeMusicianCount: 2,
        description: 'Stunning outdoor amphitheater and community arts stage hosting folk and jazz collectives.',
      },
      {
        id: 'ven_torr_madrona',
        name: 'Madrona Acoustic Den',
        city: 'Torrance',
        state: 'CA',
        address: '2440 Sepulveda Blvd, Torrance, CA',
        activeMusicianCount: 1,
        description: 'Intimate velvet speakeasy stage famous for late-night jazz upright bass and fingerstyle guitar.',
      },
      {
        id: 'ven_torr_redondo_border',
        name: 'Redondo Border Stage',
        city: 'Torrance',
        state: 'CA',
        address: 'Torrance Blvd & Prospect Ave, Torrance, CA',
        activeMusicianCount: 2,
        description: 'Coastal breeze live room connecting Torrance and South Bay beach soundscapes.',
      },
    ],
    performers: [
      {
        id: 'art_torr_chloe',
        slug: 'chloe-vance',
        name: 'Chloe Vance',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'Torrance local singer-songwriter combining warm fingerstyle acoustic guitar with evocative dream-pop vocals.',
        genres: ['Acoustic', 'Indie Pop', 'Folk'],
        isVerified: true,
        popularityScore: 92,
        followersCount: 1840,
        aiCardSummary: 'Torrance acoustic indie artist performing heartfelt original ballads across South Bay venues.',
      },
      {
        id: 'art_torr_shakers',
        slug: 'the-south-bay-shakers',
        name: 'The South Bay Shakers',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
        bio: '4-piece high-voltage surf rock and alternative outfit known for reverb-drenched guitar hooks and dynamic crowd energy.',
        genres: ['Rock', 'Indie Rock', 'Surf Rock'],
        isVerified: true,
        popularityScore: 95,
        followersCount: 2890,
        aiCardSummary: 'High-energy South Bay surf rock quartet filling Torrance craft rooms with explosive live sets.',
      },
      {
        id: 'art_torr_marcus',
        slug: 'marcus-cole',
        name: 'Marcus Cole',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        bio: 'Americana and roots singer-songwriter weaving harmonica, slide resonator guitar, and gritty storytelling.',
        genres: ['Folk', 'Americana', 'Blues'],
        isVerified: true,
        popularityScore: 89,
        followersCount: 1420,
        aiCardSummary: 'Roots and Americana troubadour sharing soulful storytelling across Old Town Torrance.',
      },
      {
        id: 'art_torr_jazz',
        slug: 'torrance-jazz-quartet',
        name: 'Torrance Jazz Quartet',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
        bio: 'Contemporary West Coast jazz ensemble blending hard bop brass arrangements with sleek modal improvisation.',
        genres: ['Jazz & Soul', 'Jazz', 'Bebop'],
        isVerified: false,
        popularityScore: 86,
        followersCount: 1150,
        aiCardSummary: 'Smooth West Coast jazz ensemble delivering brass improvisation and late-night lounge sets.',
      },
      {
        id: 'art_torr_kendra',
        slug: 'kendra-cruz',
        name: 'Kendra Cruz',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
        bio: 'Neo-soul vocalist and keyboardist performing soulful reinterpretations of R&B classics alongside original grooves.',
        genres: ['Jazz & Soul', 'R&B', 'Soul'],
        isVerified: true,
        popularityScore: 91,
        followersCount: 2210,
        aiCardSummary: 'Neo-soul vocalist and keyboardist captivating live listeners with silky smooth acoustic melodies.',
      },
      {
        id: 'art_torr_redondo_waves',
        slug: 'redondo-waves',
        name: 'Redondo Waves',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
        bio: 'Alternative indie rock trio fusing coastal drive rhythms with catchy hooks and lush synth leads.',
        genres: ['Indie Rock', 'Alternative', 'Pop'],
        isVerified: false,
        popularityScore: 84,
        followersCount: 970,
        aiCardSummary: 'Indie rock trio bringing breezy coastal melodies and driving rhythms to live Torrance stages.',
      },
      {
        id: 'art_torr_leo',
        slug: 'leo-sterling',
        name: 'Leo Sterling',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
        bio: 'Solo acoustic percussionist and fingerstyle guitarist generating full-band soundscapes on a single dreadnought.',
        genres: ['Acoustic', 'Folk', 'Instrumental'],
        isVerified: true,
        popularityScore: 93,
        followersCount: 1780,
        aiCardSummary: 'Virtuoso acoustic fingerstyle guitarist performing dynamic percussive sets in South Bay plazas.',
      },
      {
        id: 'art_torr_coastal',
        slug: 'coastal-resonance',
        name: 'Coastal Resonance',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        bio: 'Ambient electronic dream-pop collective crafting lush synthesizer textures, live guitars, and vocal atmospheres.',
        genres: ['Electronic', 'Ambient', 'Indie Pop'],
        isVerified: false,
        popularityScore: 87,
        followersCount: 1330,
        aiCardSummary: 'Dream-pop and ambient electronic collective performing immersive synthesizer soundscapes.',
      },
    ],
  },

  'San Diego': {
    venues: [
      {
        id: 'ven_sd_main',
        name: 'The Main Stage (Gaslamp)',
        city: 'San Diego',
        state: 'CA',
        address: '450 Harbor Drive, Gaslamp Quarter, San Diego, CA',
        activeMusicianCount: 3,
        description: 'Premier downtown live room featuring multi-tier sound and intimate stage views.',
      },
      {
        id: 'ven_sd_ocean',
        name: 'Ocean Acoustic Club',
        city: 'San Diego',
        state: 'CA',
        address: '120 Ocean View Ave, Pacific Beach, San Diego, CA',
        activeMusicianCount: 2,
        description: 'Open-air coastal listening room with acoustic clarity and sunset performances.',
      },
      {
        id: 'ven_sd_velvet',
        name: 'Velvet Lounge (North Park)',
        city: 'San Diego',
        state: 'CA',
        address: '880 5th Avenue, North Park, San Diego, CA',
        activeMusicianCount: 2,
        description: 'Historic speakeasy jazz club with craft cocktails and live upright bass sets.',
      },
      {
        id: 'ven_sd_belly_up',
        name: 'Belly Up Live Stage',
        city: 'San Diego',
        state: 'CA',
        address: '143 S Cedros Ave, Solana Beach, CA',
        activeMusicianCount: 3,
        description: 'Legendary coastal venue hosting world-class touring and local indie artists.',
      },
      {
        id: 'ven_sd_casbah',
        name: 'The Casbah Live Den',
        city: 'San Diego',
        state: 'CA',
        address: '2501 Kettner Blvd, Downtown San Diego, CA',
        activeMusicianCount: 1,
        description: 'Iconic intimate rock room delivering gritty underground sets for over 30 years.',
      },
      {
        id: 'ven_sd_little_italy',
        name: 'Little Italy Acoustic Piazza',
        city: 'San Diego',
        state: 'CA',
        address: 'Piazza della Famiglia, San Diego, CA',
        activeMusicianCount: 1,
        description: 'Romantic open-air cobblestone piazza filled with acoustic guitars and violin duos.',
      },
    ],
    performers: [
      {
        id: 'art_sd_jake',
        slug: 'jake-rios',
        name: 'Jake Rios',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        bio: 'Acoustic indie folk songwriter touring coastal venues. Combining soulful vocals with rhythmic fingerstyle guitar.',
        genres: ['Acoustic', 'Indie Folk', 'Pop'],
        isVerified: true,
        popularityScore: 94,
        followersCount: 1420,
        aiCardSummary: 'Acoustic indie folk artist performing live original songs at San Diego coastal venues.',
      },
      {
        id: 'art_sd_maya',
        slug: 'maya-lin',
        name: 'Maya Lin',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'Electronic ambient producer performing live synthesizer arrangements and dynamic vocal loops.',
        genres: ['Electronic', 'Ambient', 'Indie Pop'],
        isVerified: true,
        popularityScore: 88,
        followersCount: 980,
        aiCardSummary: 'Electronic ambient artist blending synthesizers and vocal loops for immersive live shows.',
      },
      {
        id: 'art_sd_sunsets',
        slug: 'the-sunsets',
        name: 'The Sunsets',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
        bio: '4-piece high-energy indie rock collective known for explosive brass hooks and anthemic choruses.',
        genres: ['Rock', 'Indie Rock', 'Alternative'],
        isVerified: true,
        popularityScore: 96,
        followersCount: 2350,
        aiCardSummary: 'High-energy indie rock band with explosive brass hooks performing original anthems live.',
      },
      {
        id: 'art_sd_elena',
        slug: 'elena-vance',
        name: 'Elena Vance',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
        bio: 'Modern jazz vocalist and keyboardist performing soulful reinterpretations of contemporary classics.',
        genres: ['Jazz & Soul', 'Jazz', 'Soul'],
        isVerified: false,
        popularityScore: 78,
        followersCount: 640,
        aiCardSummary: 'Jazz vocalist and keyboardist connecting fans through soulful original music in San Diego.',
      },
      {
        id: 'art_sd_carlos',
        slug: 'carlos-reyes',
        name: 'Carlos Reyes',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
        bio: 'Latin guitar virtuoso and singer-songwriter weaving flamenco and blues into original live performances.',
        genres: ['Acoustic', 'Latin', 'Blues'],
        isVerified: true,
        popularityScore: 82,
        followersCount: 870,
        aiCardSummary: 'Independent musician bringing original live flamenco and blues to the Crowdbeats community.',
      },
      {
        id: 'art_sd_pacific_echoes',
        slug: 'pacific-echoes',
        name: 'Pacific Echoes',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
        bio: 'Coastal alternative trio featuring soaring harmonies, melodic basslines, and ocean-sunset vibes.',
        genres: ['Indie Rock', 'Alternative', 'Acoustic'],
        isVerified: true,
        popularityScore: 90,
        followersCount: 1620,
        aiCardSummary: 'Coastal alternative rock band harmonizing original sunset anthems across Pacific Beach.',
      },
      {
        id: 'art_sd_talia',
        slug: 'talia-ray',
        name: 'Talia Ray',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'R&B and neo-soul vocalist combining electric piano grooves with intimate vocal storytelling.',
        genres: ['Jazz & Soul', 'R&B', 'Soul'],
        isVerified: false,
        popularityScore: 85,
        followersCount: 1190,
        aiCardSummary: 'San Diego R&B artist delivering rich keyboard chords and heartfelt vocals at Gaslamp venues.',
      },
      {
        id: 'art_sd_gaslamp_groove',
        slug: 'gaslamp-groove-collective',
        name: 'Gaslamp Groove Collective',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
        bio: '7-piece brass, percussion, and funk ensemble igniting downtown San Diego sidewalks and stage rooms.',
        genres: ['Jazz & Soul', 'Funk', 'Soul'],
        isVerified: true,
        popularityScore: 97,
        followersCount: 3120,
        aiCardSummary: 'Funk and brass powerhouse collective transforming Gaslamp streets into an energetic dance party.',
      },
    ],
  },

  'Los Angeles': {
    venues: [
      {
        id: 'ven_la_troubadour',
        name: 'The Troubadour Stage',
        city: 'Los Angeles',
        state: 'CA',
        address: '9081 Santa Monica Blvd, West Hollywood, CA',
        activeMusicianCount: 3,
        description: 'World-renowned acoustic and rock cradle where legendary careers ignite under intimate lights.',
      },
      {
        id: 'ven_la_sunset_sound',
        name: 'Sunset Sound Lounge',
        city: 'Los Angeles',
        state: 'CA',
        address: '6650 Sunset Blvd, Hollywood, CA',
        activeMusicianCount: 2,
        description: 'Historic Hollywood music haven blending vintage analog warmth with live performance intimacy.',
      },
      {
        id: 'ven_la_silverlake',
        name: 'Silverlake Acoustic Den',
        city: 'Los Angeles',
        state: 'CA',
        address: 'Sunset Junction, Silverlake, Los Angeles, CA',
        activeMusicianCount: 2,
        description: 'Bohemian listening den showcasing avant-garde indie rock, folk, and synthesizer pioneers.',
      },
      {
        id: 'ven_la_dtla_arts',
        name: 'DTLA Arts District Pavilion',
        city: 'Los Angeles',
        state: 'CA',
        address: 'Traction Ave, Downtown Los Angeles, CA',
        activeMusicianCount: 3,
        description: 'Industrial brick warehouse venue with soaring ceilings and cutting-edge live sound.',
      },
      {
        id: 'ven_la_echo_park',
        name: 'Echo Park Live Room',
        city: 'Los Angeles',
        state: 'CA',
        address: '1822 Sunset Blvd, Echo Park, CA',
        activeMusicianCount: 1,
        description: 'Neighborhood staple with craft drinks and raw underground indie bands playing every night.',
      },
      {
        id: 'ven_la_roxy',
        name: 'The Roxy Stage (Sunset Strip)',
        city: 'Los Angeles',
        state: 'CA',
        address: '9009 Sunset Blvd, West Hollywood, CA',
        activeMusicianCount: 2,
        description: 'Legendary Sunset Strip live stage known for electrifying rock and genre-bending artists.',
      },
    ],
    performers: [
      {
        id: 'art_la_vera',
        slug: 'vera-and-the-midnight',
        name: 'Vera & The Midnight',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        bio: 'Indie rock and dark synthpop 4-piece from Silverlake crafting pulsing basslines and soaring female lead vocals.',
        genres: ['Indie Rock', 'Electronic', 'Alternative'],
        isVerified: true,
        popularityScore: 97,
        followersCount: 3840,
        aiCardSummary: 'Silverlake indie rock and synthpop group headlining iconic West Hollywood rooms.',
      },
      {
        id: 'art_la_jaxson',
        slug: 'jaxson-blake',
        name: 'Jaxson Blake',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        bio: 'Raw alt-rock and grunge singer-songwriter with razor-sharp electric guitar riffs and gravelly emotional vocals.',
        genres: ['Rock', 'Indie Rock', 'Alternative'],
        isVerified: true,
        popularityScore: 93,
        followersCount: 2450,
        aiCardSummary: 'Alt-rock singer-songwriter delivering gritty emotional anthems on Sunset Strip stages.',
      },
      {
        id: 'art_la_neon',
        slug: 'neon-boulevard',
        name: 'Neon Boulevard',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
        bio: 'Electronic dance and funk ensemble incorporating live brass, slap bass, and analog vocoders.',
        genres: ['Electronic', 'Jazz & Soul', 'Pop'],
        isVerified: true,
        popularityScore: 95,
        followersCount: 3180,
        aiCardSummary: 'Electrifying LA funk and synth collective transforming DTLA warehouses into vibrant dance floors.',
      },
      {
        id: 'art_la_sienna',
        slug: 'sienna-west',
        name: 'Sienna West',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
        bio: 'Dream-pop vocalist and multi-instrumentalist crafting ethereal loop pedal soundscapes and heartfelt lyrics.',
        genres: ['Indie Rock', 'Acoustic', 'Indie Pop'],
        isVerified: false,
        popularityScore: 89,
        followersCount: 1670,
        aiCardSummary: 'Dream-pop artist weaving shimmering acoustic loops and ethereal vocals across Echo Park.',
      },
      {
        id: 'art_la_miles',
        slug: 'miles-navarro',
        name: 'Miles Navarro',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
        bio: 'Neo-soul guitarist and songwriter renowned for silky chord progressions and effortless R&B vocal runs.',
        genres: ['Jazz & Soul', 'R&B', 'Soul'],
        isVerified: true,
        popularityScore: 92,
        followersCount: 2120,
        aiCardSummary: 'Neo-soul guitarist bringing masterclass R&B chord melodies to intimate Los Angeles listening rooms.',
      },
      {
        id: 'art_la_silverlake_trio',
        slug: 'the-silverlake-trio',
        name: 'The Silverlake Trio',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
        bio: 'Folk-rock and acoustic trio featuring upright bass, banjo, and three-part vocal harmonies.',
        genres: ['Folk', 'Acoustic', 'Americana'],
        isVerified: false,
        popularityScore: 85,
        followersCount: 1240,
        aiCardSummary: 'Folk-rock harmony trio captivating outdoor crowds with acoustic strings and Americana warmth.',
      },
      {
        id: 'art_la_luna',
        slug: 'luna-eclipse',
        name: 'Luna Eclipse',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'Modular synthesizer composer blending cinematic ambient drones with live electronic percussion.',
        genres: ['Electronic', 'Ambient'],
        isVerified: true,
        popularityScore: 88,
        followersCount: 1530,
        aiCardSummary: 'Modular synth composer building deep immersive electronic sonic journeys across Downtown LA.',
      },
      {
        id: 'art_la_echo_brass',
        slug: 'echo-park-brass-band',
        name: 'Echo Park Brass Band',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
        bio: '6-piece street brass ensemble fusing New Orleans second line with modern hip-hop and funk breaks.',
        genres: ['Jazz & Soul', 'Funk', 'Jazz'],
        isVerified: true,
        popularityScore: 98,
        followersCount: 4210,
        aiCardSummary: 'Explosive 6-piece brass outfit commanding street stages and festival venues throughout Los Angeles.',
      },
    ],
  },

  'San Francisco': {
    venues: [
      {
        id: 'ven_sf_fillmore',
        name: 'The Fillmore Live Room',
        city: 'San Francisco',
        state: 'CA',
        address: '1805 Geary Blvd, San Francisco, CA',
        activeMusicianCount: 3,
        description: 'Legendary rock ballroom with historic psychedelic posters and crystal chandeliers.',
      },
      {
        id: 'ven_sf_mission',
        name: 'Mission Acoustic Collective',
        city: 'San Francisco',
        state: 'CA',
        address: 'Valencia St & 19th St, Mission District, SF, CA',
        activeMusicianCount: 2,
        description: 'Vibrant Latin and indie acoustic hub with courtyard murals and organic coffee stage.',
      },
      {
        id: 'ven_sf_north_beach',
        name: 'North Beach Jazz Cellar',
        city: 'San Francisco',
        state: 'CA',
        address: '500 Columbus Ave, North Beach, SF, CA',
        activeMusicianCount: 2,
        description: 'Subterranean Beat-era jazz room where upright bass and bebop trumpets ring nightly.',
      },
      {
        id: 'ven_sf_haight',
        name: 'Haight Street Underground',
        city: 'San Francisco',
        state: 'CA',
        address: '1550 Haight St, San Francisco, CA',
        activeMusicianCount: 2,
        description: 'Historic counterculture stage showcasing psychedelic rock, folk, and experimental jam sessions.',
      },
      {
        id: 'ven_sf_soma',
        name: 'SoMa Sound Stage',
        city: 'San Francisco',
        state: 'CA',
        address: '4th St & Howard St, SoMa, SF, CA',
        activeMusicianCount: 1,
        description: 'Modern urban loft venue hosting indie synth-pop, loopers, and electronic producers.',
      },
      {
        id: 'ven_sf_independent',
        name: 'The Independent Stage',
        city: 'San Francisco',
        state: 'CA',
        address: '628 Divisadero St, San Francisco, CA',
        activeMusicianCount: 3,
        description: 'Top-tier boutique music hall known for pristine sound engineering and diverse live lineups.',
      },
    ],
    performers: [
      {
        id: 'art_sf_fog_city',
        slug: 'fog-city-rhythm',
        name: 'Fog City Rhythm',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
        bio: 'Psychedelic blues-rock 4-piece continuing San Francisco’s rich lineage of mind-expanding live guitar jams.',
        genres: ['Rock', 'Indie Rock', 'Blues'],
        isVerified: true,
        popularityScore: 96,
        followersCount: 3340,
        aiCardSummary: 'Psychedelic blues-rock ensemble carrying forward the storied San Francisco sound tradition.',
      },
      {
        id: 'art_sf_aria',
        slug: 'aria-thorne',
        name: 'Aria Thorne',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'Indie pop and classical crossover pianist singing soaring melodies over intricate acoustic piano chords.',
        genres: ['Acoustic', 'Indie Pop', 'Pop'],
        isVerified: true,
        popularityScore: 91,
        followersCount: 1980,
        aiCardSummary: 'Classical crossover pianist and songwriter mesmerizing live audiences across the Bay Area.',
      },
      {
        id: 'art_sf_mission_street',
        slug: 'the-mission-street-band',
        name: 'The Mission Street Band',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
        bio: 'Latin rock and salsa brass collective blending congas, timbales, electric guitars, and high-energy horns.',
        genres: ['Rock', 'Jazz & Soul', 'Latin'],
        isVerified: true,
        popularityScore: 97,
        followersCount: 3670,
        aiCardSummary: 'Latin rock and salsa powerhouse packing Mission District dance stages with scorching horns.',
      },
      {
        id: 'art_sf_julian',
        slug: 'julian-mercer',
        name: 'Julian Mercer',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        bio: 'Foggy coastal acoustic folk troubadour with poetic lyrics, clawhammer banjo, and vintage 6-string guitar.',
        genres: ['Folk', 'Acoustic', 'Americana'],
        isVerified: false,
        popularityScore: 84,
        followersCount: 1120,
        aiCardSummary: 'Acoustic folk troubadour sharing reflective melodies and clawhammer banjo in North Beach.',
      },
      {
        id: 'art_sf_golden_gate',
        slug: 'golden-gate-groove',
        name: 'Golden Gate Groove',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
        bio: 'Acid jazz, soul, and funk outfit featuring Rhodes piano, walking bass, and tight pocket drumming.',
        genres: ['Jazz & Soul', 'Funk', 'Jazz'],
        isVerified: true,
        popularityScore: 93,
        followersCount: 2540,
        aiCardSummary: 'Acid jazz and soul sextet laying down irresistible vintage grooves in SoMa and Haight venues.',
      },
      {
        id: 'art_sf_sora',
        slug: 'sora-takahashi',
        name: 'Sora Takahashi',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
        bio: 'Synthwave and ambient electronic producer sculpting lush cybernetic melodies with analog hardware.',
        genres: ['Electronic', 'Ambient'],
        isVerified: true,
        popularityScore: 88,
        followersCount: 1460,
        aiCardSummary: 'Analog synthwave artist creating futuristic neon soundscapes for San Francisco night owls.',
      },
      {
        id: 'art_sf_callum',
        slug: 'callum-scott',
        name: 'Callum Scott',
        type: 'artist',
        photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
        bio: 'Indie singer-songwriter weaving acoustic rhythm guitar with uplifting anthemic choruses.',
        genres: ['Acoustic', 'Indie Rock', 'Folk'],
        isVerified: false,
        popularityScore: 82,
        followersCount: 890,
        aiCardSummary: 'Singer-songwriter bringing uplifting acoustic singalongs to Marina and Divisadero rooms.',
      },
      {
        id: 'art_sf_bay_brass',
        slug: 'bay-area-brass-project',
        name: 'Bay Area Brass Project',
        type: 'band',
        photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        bio: 'High-octane 8-member brass ensemble delivering funk, hip-hop horns, and joyful crowd participation.',
        genres: ['Jazz & Soul', 'Funk', 'Jazz'],
        isVerified: true,
        popularityScore: 98,
        followersCount: 4520,
        aiCardSummary: 'Dynamite 8-piece brass ensemble filling San Francisco parks and concert halls with explosive joy.',
      },
    ],
  },

  Austin: {
    venues: [
      { id: 'ven_atx_stubb', name: "Stubb's Waller Creek Amphitheater", city: 'Austin', state: 'TX', address: '801 Red River St, Austin, TX', activeMusicianCount: 3, description: 'Legendary outdoor amphitheater on Red River Street where careers ignite under Texas stars.' },
      { id: 'ven_atx_emo', name: "Emo's Austin", city: 'Austin', state: 'TX', address: '2015 E Riverside Dr, Austin, TX', activeMusicianCount: 2, description: 'Gritty beloved indie rock room with decades of underground Austin music history.' },
      { id: 'ven_atx_white_horse', name: 'White Horse', city: 'Austin', state: 'TX', address: '500 Comal St, Austin, TX', activeMusicianCount: 2, description: 'East Austin honky-tonk bar with nightly live country, folk, and Texas swing acts.' },
      { id: 'ven_atx_continental', name: 'Continental Club', city: 'Austin', state: 'TX', address: '1315 S Congress Ave, Austin, TX', activeMusicianCount: 2, description: 'Iconic South Congress vintage rock room with red velvet walls and nightly live sets.' },
      { id: 'ven_atx_hole_wall', name: "The Hole in the Wall", city: 'Austin', state: 'TX', address: '2538 Guadalupe St, Austin, TX', activeMusicianCount: 1, description: 'Legendary UT-adjacent dive bar showcasing local singer-songwriters and indie folk acts.' },
    ],
    performers: [
      { id: 'art_atx_sierra', slug: 'sierra-del-rio', name: 'Sierra Del Rio', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', bio: 'Austin country-folk singer-songwriter with a honey-warm voice and story-driven original songs.', genres: ['Folk', 'Country', 'Americana'], isVerified: true, popularityScore: 93, followersCount: 2140, aiCardSummary: 'Country-folk singer-songwriter sharing heartfelt original songs across Austin honky-tonks.' },
      { id: 'art_atx_lone_star', slug: 'lone-star-collective', name: 'Lone Star Collective', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80', bio: '5-piece Texas rock collective blending outlaw country energy with modern indie guitar riffs.', genres: ['Rock', 'Country', 'Americana'], isVerified: true, popularityScore: 96, followersCount: 3280, aiCardSummary: 'Texas rock collective delivering outlaw country energy across Austin Red River stages.' },
      { id: 'art_atx_diego', slug: 'diego-vega', name: 'Diego Vega', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80', bio: 'Tejano-acoustic guitarist weaving Latin folk rhythms and bilingual original poetry.', genres: ['Latin', 'Folk', 'Acoustic'], isVerified: false, popularityScore: 84, followersCount: 1190, aiCardSummary: 'Bilingual Tejano-folk guitarist enchanting Austin crowds with original acoustic storytelling.' },
      { id: 'art_atx_rainn', slug: 'rainn-holloway', name: 'Rainn Holloway', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80', bio: 'Indie pop vocalist and loop pedal artist known for building rich sonic layers from one voice.', genres: ['Indie Pop', 'Acoustic', 'Electronic'], isVerified: true, popularityScore: 90, followersCount: 1870, aiCardSummary: 'Loop pedal vocalist layering ethereal indie pop harmonies live on Austin stages.' },
      { id: 'art_atx_bayou_blues', slug: 'bayou-blues-brothers', name: 'Bayou Blues Brothers', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80', bio: '4-piece electric blues and soul ensemble bringing swampy southern grooves to downtown Austin.', genres: ['Blues', 'Jazz & Soul', 'Funk'], isVerified: true, popularityScore: 94, followersCount: 2560, aiCardSummary: 'Electric blues and soul quartet setting Congress Avenue stages on fire nightly.' },
      { id: 'art_atx_cosmic', slug: 'cosmic-cowboy', name: 'Cosmic Cowboy', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80', bio: 'Psychedelic country singer-songwriter channeling Willie Nelson spirit through modern indie lens.', genres: ['Country', 'Rock', 'Americana'], isVerified: false, popularityScore: 87, followersCount: 1340, aiCardSummary: 'Psychedelic country troubadour weaving Willie Nelson spirit through modern indie songwriting.' },
    ],
  },

  Nashville: {
    venues: [
      { id: 'ven_nash_bluebird', name: 'Bluebird Cafe', city: 'Nashville', state: 'TN', address: '4104 Hillsboro Pike, Nashville, TN', activeMusicianCount: 1, description: 'Intimate listening room where Taylor Swift was discovered — the holy grail of Nashville songwriting stages.' },
      { id: 'ven_nash_ryman', name: 'Ryman Auditorium', city: 'Nashville', state: 'TN', address: '116 5th Ave N, Nashville, TN', activeMusicianCount: 2, description: 'The Mother Church of Country Music — a stunning Victorian brick cathedral for world-class live performances.' },
      { id: 'ven_nash_station_inn', name: 'Station Inn', city: 'Nashville', state: 'TN', address: '402 12th Ave S, Nashville, TN', activeMusicianCount: 2, description: 'Legendary Gulch bluegrass and roots bar running nightly acoustic sessions since 1974.' },
      { id: 'ven_nash_cannery', name: 'The Cannery Row', city: 'Nashville', state: 'TN', address: '1 Cannery Row, Nashville, TN', activeMusicianCount: 3, description: 'Multi-room historic venue complex hosting Americana, rock, and alt-country touring acts.' },
      { id: 'ven_nash_mercy', name: 'Mercy Lounge', city: 'Nashville', state: 'TN', address: '1 Cannery Row, Nashville, TN', activeMusicianCount: 2, description: 'Intimate industrial-chic stage for breakout Nashville indie and country artists.' },
    ],
    performers: [
      { id: 'art_nash_cassidy', slug: 'cassidy-anne', name: 'Cassidy Anne', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', bio: 'Nashville country-pop singer-songwriter with crystalline vocals and cinematic storytelling.', genres: ['Country', 'Pop', 'Acoustic'], isVerified: true, popularityScore: 95, followersCount: 3140, aiCardSummary: 'Nashville country-pop artist delivering crystalline vocals and heartfelt original stories.' },
      { id: 'art_nash_highwaymen', slug: 'the-new-highwaymen', name: 'The New Highwaymen', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80', bio: '4-piece outlaw country band echoing Waylon, Cash, and Kristofferson with modern grit.', genres: ['Country', 'Americana', 'Folk'], isVerified: true, popularityScore: 97, followersCount: 4120, aiCardSummary: 'Outlaw country quartet channeling Waylon and Cash with authentic original songwriting.' },
      { id: 'art_nash_tyler', slug: 'tyler-mace', name: 'Tyler Mace', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80', bio: 'Introspective acoustic folk troubadour performing stripped-down original confessional songs.', genres: ['Folk', 'Acoustic', 'Indie'], isVerified: false, popularityScore: 86, followersCount: 1560, aiCardSummary: 'Acoustic folk troubadour sharing raw confessional songwriting on intimate Nashville stages.' },
      { id: 'art_nash_scarlett', slug: 'scarlett-rose', name: 'Scarlett Rose', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80', bio: 'R&B and country-crossover vocalist delivering powerful gospel-tinged performances.', genres: ['Country', 'Jazz & Soul', 'R&B'], isVerified: true, popularityScore: 92, followersCount: 2380, aiCardSummary: 'Country-soul vocalist blending gospel warmth and R&B passion in Nashville listening rooms.' },
      { id: 'art_nash_pedal_steel', slug: 'pedal-steel-dreams', name: 'Pedal Steel Dreams', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80', bio: '3-piece cosmic country trio with pedal steel guitar, stand-up bass, and lush vocal harmonies.', genres: ['Country', 'Americana', 'Folk'], isVerified: true, popularityScore: 91, followersCount: 1950, aiCardSummary: 'Cosmic country trio weaving pedal steel melodies and lush harmonies through Nashville nights.' },
      { id: 'art_nash_jackson', slug: 'jackson-creek-band', name: 'Jackson Creek Band', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80', bio: 'Bluegrass and old-time string band performing spirited traditional and original compositions.', genres: ['Folk', 'Americana', 'Acoustic'], isVerified: false, popularityScore: 88, followersCount: 1680, aiCardSummary: 'Spirited bluegrass string band celebrating Americana tradition with original compositions.' },
    ],
  },

  'New York': {
    venues: [
      { id: 'ven_nyc_blue_note', name: 'Blue Note Jazz Club', city: 'New York', state: 'NY', address: '131 W 3rd St, New York, NY', activeMusicianCount: 2, description: "World's most celebrated jazz club — a Greenwich Village institution where legends play nightly." },
      { id: 'ven_nyc_bowery', name: 'Bowery Ballroom', city: 'New York', state: 'NY', address: '6 Delancey St, New York, NY', activeMusicianCount: 3, description: 'Art Deco Lower East Side ballroom with impeccable sound and diverse indie booking.' },
      { id: 'ven_nyc_village_vanguard', name: 'Village Vanguard', city: 'New York', state: 'NY', address: '178 7th Ave S, New York, NY', activeMusicianCount: 1, description: 'The definitive NYC jazz basement — Miles Davis, Coltrane, and Bill Evans all recorded live here.' },
      { id: 'ven_nyc_mercury', name: 'Mercury Lounge', city: 'New York', state: 'NY', address: '217 E Houston St, New York, NY', activeMusicianCount: 2, description: 'Intimate Lower East Side indie rock room that launched countless careers since 1993.' },
      { id: 'ven_nyc_rockwood', name: 'Rockwood Music Hall', city: 'New York', state: 'NY', address: '196 Allen St, New York, NY', activeMusicianCount: 2, description: 'Three-stage LES listening room with free shows and nightly songwriter showcases.' },
    ],
    performers: [
      { id: 'art_nyc_harlem_jazz', slug: 'harlem-jazz-project', name: 'Harlem Jazz Project', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80', bio: '7-piece NYC jazz ensemble breathing new life into hard bop with modern improvisational language.', genres: ['Jazz & Soul', 'Jazz', 'Bebop'], isVerified: true, popularityScore: 98, followersCount: 5120, aiCardSummary: 'NYC jazz septet delivering electrifying hard bop and modern improvisation in landmark venues.' },
      { id: 'art_nyc_mia', slug: 'mia-rhodes', name: 'Mia Rhodes', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', bio: 'Indie folk-pop songwriter and fingerstyle guitarist performing intimate original confessionals.', genres: ['Indie Pop', 'Folk', 'Acoustic'], isVerified: true, popularityScore: 90, followersCount: 2140, aiCardSummary: 'Indie folk-pop artist performing intimate acoustic confessionals in NYC listening rooms.' },
      { id: 'art_nyc_brooklyn_brass', slug: 'brooklyn-brass-collective', name: 'Brooklyn Brass Collective', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', bio: '8-piece street and stage brass band fusing New Orleans second line with Brooklyn hip-hop and funk.', genres: ['Jazz & Soul', 'Funk', 'Jazz'], isVerified: true, popularityScore: 97, followersCount: 4870, aiCardSummary: 'Explosive 8-piece Brooklyn brass outfit blending New Orleans second line with NYC hip-hop funk.' },
      { id: 'art_nyc_samuel', slug: 'samuel-cross', name: 'Samuel Cross', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80', bio: 'Neo-soul and R&B singer-songwriter backed by electric piano and soul-jazz rhythm section.', genres: ['Jazz & Soul', 'R&B', 'Soul'], isVerified: false, popularityScore: 85, followersCount: 1780, aiCardSummary: 'Neo-soul vocalist weaving electric piano harmonies and soulful originals across NYC stages.' },
      { id: 'art_nyc_lower_east', slug: 'lower-east-side-trio', name: 'Lower East Side Trio', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80', bio: 'Indie rock guitar-bass-drums power trio known for precise arrangements and dynamic live sets.', genres: ['Rock', 'Indie Rock', 'Alternative'], isVerified: true, popularityScore: 88, followersCount: 1920, aiCardSummary: 'Indie rock power trio delivering precise, dynamic live sets on Lower East Side stages.' },
      { id: 'art_nyc_elena', slug: 'elena-marchetti', name: 'Elena Marchetti', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80', bio: 'Classical crossover cellist and vocalist performing haunting cinematic original compositions.', genres: ['Acoustic', 'Indie Pop', 'Folk'], isVerified: true, popularityScore: 93, followersCount: 2560, aiCardSummary: 'Classical crossover cellist captivating NYC audiences with haunting cinematic original compositions.' },
    ],
  },

  Chicago: {
    venues: [
      { id: 'ven_chi_andy', name: "Andy's Jazz Club", city: 'Chicago', state: 'IL', address: '11 E Hubbard St, Chicago, IL', activeMusicianCount: 2, description: 'River North jazz institution with nightly all-star jam sessions and world-class bebop.' },
      { id: 'ven_chi_green_mill', name: 'Green Mill Jazz Club', city: 'Chicago', state: 'IL', address: '4802 N Broadway, Chicago, IL', activeMusicianCount: 2, description: 'Historic Uptown jazz speakeasy where Al Capone once held court — nightly jazz since 1907.' },
      { id: 'ven_chi_empty_bottle', name: 'Empty Bottle', city: 'Chicago', state: 'IL', address: '1035 N Western Ave, Chicago, IL', activeMusicianCount: 2, description: 'Ukrainian Village indie rock stronghold for cutting-edge experimental and underground acts.' },
      { id: 'ven_chi_schubas', name: "Schubas Tavern", city: 'Chicago', state: 'IL', address: '3159 N Southport Ave, Chicago, IL', activeMusicianCount: 1, description: 'Lakewood Balmoral listening room beloved for intimate acoustic and singer-songwriter shows.' },
      { id: 'ven_chi_kingston', name: 'Kingston Mines', city: 'Chicago', state: 'IL', address: '2548 N Halsted St, Chicago, IL', activeMusicianCount: 3, description: 'Two-stage Lincoln Park blues club running nonstop live blues every night since 1968.' },
    ],
    performers: [
      { id: 'art_chi_south_side_blues', slug: 'south-side-blues-kings', name: 'South Side Blues Kings', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80', bio: '5-piece Chicago electric blues powerhouse carrying forward the Muddy Waters South Side tradition.', genres: ['Blues', 'Jazz & Soul', 'Rock'], isVerified: true, popularityScore: 97, followersCount: 4230, aiCardSummary: 'Chicago electric blues quintet carrying the Muddy Waters South Side tradition into the future.' },
      { id: 'art_chi_delia', slug: 'delia-banks', name: 'Delia Banks', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', bio: 'Soul and gospel-rooted vocalist performing powerful original R&B with backing jazz trio.', genres: ['Jazz & Soul', 'R&B', 'Soul'], isVerified: true, popularityScore: 94, followersCount: 2790, aiCardSummary: 'Gospel-rooted soul vocalist delivering powerful R&B originals with a tight Chicago jazz trio.' },
      { id: 'art_chi_wicker_park', slug: 'wicker-park-collective', name: 'Wicker Park Collective', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', bio: 'Indie rock and art-punk 4-piece from Wicker Park delivering angular guitars and urgent vocals.', genres: ['Rock', 'Indie Rock', 'Alternative'], isVerified: true, popularityScore: 90, followersCount: 2120, aiCardSummary: 'Wicker Park indie rock quartet delivering angular guitars and art-punk urgency live.' },
      { id: 'art_chi_marcus', slug: 'marcus-bell', name: 'Marcus Bell', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80', bio: 'Jazz guitarist and composer performing intricate chord melody arrangements and original standards.', genres: ['Jazz & Soul', 'Jazz', 'Acoustic'], isVerified: false, popularityScore: 86, followersCount: 1450, aiCardSummary: 'Jazz guitarist performing intricate original chord melodies in Chicago listening rooms.' },
      { id: 'art_chi_loop_jazz', slug: 'loop-jazz-quartet', name: 'Loop Jazz Quartet', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80', bio: 'Downtown Chicago post-bop quartet blending hard bop discipline with free jazz exploration.', genres: ['Jazz & Soul', 'Jazz', 'Bebop'], isVerified: true, popularityScore: 92, followersCount: 2340, aiCardSummary: 'Downtown Chicago post-bop quartet blending hard bop discipline with free jazz exploration.' },
      { id: 'art_chi_nia', slug: 'nia-simone', name: 'Nia Simone', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80', bio: 'Folk and indie pop singer-songwriter with a warm alto voice and politically charged storytelling.', genres: ['Folk', 'Indie Pop', 'Acoustic'], isVerified: false, popularityScore: 83, followersCount: 1280, aiCardSummary: 'Folk singer-songwriter sharing warm politically charged storytelling across Chicago stages.' },
    ],
  },

  'New Orleans': {
    venues: [
      { id: 'ven_nola_tipitinas', name: "Tipitina's", city: 'New Orleans', state: 'LA', address: '501 Napoleon Ave, New Orleans, LA', activeMusicianCount: 3, description: 'Legendary Uptown NOLA music hall where Professor Longhair played his final shows — pure magic.' },
      { id: 'ven_nola_maple_leaf', name: 'Maple Leaf Bar', city: 'New Orleans', state: 'LA', address: '8316 Oak St, New Orleans, LA', activeMusicianCount: 2, description: 'Oak Street institution running nightly second line and brass band parades since 1974.' },
      { id: 'ven_nola_frenchmen', name: 'Spotted Cat Music Club', city: 'New Orleans', state: 'LA', address: '623 Frenchmen St, New Orleans, LA', activeMusicianCount: 2, description: 'Frenchmen Street jazz club with Django-style gypsy jazz, swing, and nightly no-cover shows.' },
      { id: 'ven_nola_preservation', name: 'Preservation Hall', city: 'New Orleans', state: 'LA', address: '726 St Peter St, New Orleans, LA', activeMusicianCount: 2, description: 'Timeless French Quarter hall preserving and celebrating traditional New Orleans jazz nightly.' },
      { id: 'ven_nola_house_blues', name: 'House of Blues', city: 'New Orleans', state: 'LA', address: '225 Decatur St, New Orleans, LA', activeMusicianCount: 3, description: 'Multi-room French Quarter venue showcasing blues, R&B, and roots music acts nightly.' },
    ],
    performers: [
      { id: 'art_nola_jackson_square', slug: 'jackson-square-brass', name: 'Jackson Square Brass Band', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', bio: '9-piece second line brass band exploding through French Quarter streets with joyful New Orleans tradition.', genres: ['Jazz & Soul', 'Funk', 'Jazz'], isVerified: true, popularityScore: 99, followersCount: 6200, aiCardSummary: 'Explosive 9-piece NOLA brass band bringing second line joy to streets and stages.' },
      { id: 'art_nola_celeste', slug: 'celeste-treme', name: 'Celeste Tremé', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', bio: 'New Orleans jazz and blues vocalist performing heartfelt originals with old-soul warmth.', genres: ['Jazz & Soul', 'Blues', 'Soul'], isVerified: true, popularityScore: 96, followersCount: 3870, aiCardSummary: 'NOLA jazz and blues vocalist captivating audiences with old-soul warmth and original songs.' },
      { id: 'art_nola_zydeco_king', slug: 'zydeco-king', name: 'Zydeco King', type: 'artist', photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80', bio: 'Louisiana zydeco accordion virtuoso blending Creole rhythms and blues into irresistible dance music.', genres: ['Folk', 'Blues', 'Jazz & Soul'], isVerified: true, popularityScore: 93, followersCount: 2540, aiCardSummary: 'Zydeco accordion master blending Creole rhythms and Louisiana blues into pure dance joy.' },
      { id: 'art_nola_frenchmen_five', slug: 'frenchmen-street-five', name: 'Frenchmen Street Five', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80', bio: 'Gypsy jazz and hot swing quintet channeling Django Reinhardt on the storied Frenchmen Street corridor.', genres: ['Jazz & Soul', 'Jazz', 'Acoustic'], isVerified: true, popularityScore: 94, followersCount: 2980, aiCardSummary: 'Gypsy jazz quintet channeling Django spirit through electrifying Frenchmen Street performances.' },
      { id: 'art_nola_treme_soul', slug: 'treme-soul-revue', name: 'Tremé Soul Revue', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80', bio: '6-piece soul and funk ensemble from the historic Tremé neighborhood with deep R&B grooves.', genres: ['Jazz & Soul', 'Funk', 'R&B'], isVerified: true, popularityScore: 95, followersCount: 3340, aiCardSummary: 'Tremé neighborhood soul revue delivering deep funk and R&B grooves with joyful New Orleans energy.' },
      { id: 'art_nola_mardi', slug: 'mardi-gras-collective', name: 'Mardi Gras Collective', type: 'band', photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80', bio: 'Festive 7-piece NOLA roots and funk ensemble celebrating year-round Mardi Gras spirit.', genres: ['Funk', 'Jazz & Soul', 'Rock'], isVerified: false, popularityScore: 89, followersCount: 2140, aiCardSummary: 'Festive NOLA roots and funk collective celebrating year-round Mardi Gras spirit on any stage.' },
    ],
  },
};


/**
 * Generates a shuffled, randomized selection of bear pins (artists) and venues (🎪)
 * spread naturally across the selected city's map bounds.
 */
export function getRandomCityPins(
  location: DiscoveryLocation,
  deterministic: boolean = false
): {
  performers: PublicPerformerItem[];
  venues: PublicVenueItem[];
} {
  const cityKey = Object.keys(CITY_TEMPLATES).find(
    (k) => k.toLowerCase() === location.city.toLowerCase()
  ) ?? 'Torrance';

  const template = CITY_TEMPLATES[cityKey];

  // Fixed static quadrant offsets
  const staticVenueOffsets = [
    { dLat: 0.0055, dLng: 0.0065 },  // NE
    { dLat: -0.0060, dLng: 0.0070 }, // SE
    { dLat: 0.0065, dLng: -0.0075 }, // NW
    { dLat: -0.0050, dLng: -0.0060 },// SW
    { dLat: 0.0010, dLng: -0.0020 }, // Center
  ];

  const staticArtistOffsets = [
    { dLat: 0.0040, dLng: 0.0035 },
    { dLat: -0.0045, dLng: 0.0050 },
    { dLat: 0.0060, dLng: -0.0040 },
    { dLat: -0.0065, dLng: -0.0045 },
    { dLat: 0.0020, dLng: 0.0080 },
    { dLat: -0.0025, dLng: -0.0085 },
    { dLat: 0.0075, dLng: 0.0020 },
    { dLat: -0.0080, dLng: 0.0015 },
  ];

  if (deterministic) {
    // Deterministic selection for initial SSR load to avoid React hydration mismatches
    const pickedVenuesRaw = template.venues.slice(0, 4);
    const venues: PublicVenueItem[] = pickedVenuesRaw.map((v, idx) => {
      const offset = staticVenueOffsets[idx % staticVenueOffsets.length];
      return {
        ...v,
        latitude: location.latitude + offset.dLat,
        longitude: location.longitude + offset.dLng,
        activeMusicianCount: 2,
        distanceMiles: +(0.3 + (idx * 0.3)).toFixed(1),
      };
    });

    const pickedArtistsRaw = template.performers.slice(0, 7);
    const performers: PublicPerformerItem[] = pickedArtistsRaw.map((artist, idx) => {
      const assignedVenue = venues[idx % venues.length];
      const offset = staticArtistOffsets[idx % staticArtistOffsets.length];
      const shouldBeLive = idx < 3;
      const dist = +(0.3 + (idx * 0.25)).toFixed(1);

      return {
        ...artist,
        latitude: location.latitude + offset.dLat,
        longitude: location.longitude + offset.dLng,
        isLive: shouldBeLive,
        currentVenueName: assignedVenue.name,
        distanceMiles: dist,
        popularityScore: 90 - idx,
        followersCount: 1500 + (idx * 120),
        popularRank: idx < 3 ? idx + 1 : undefined,
        nearbyScore: Math.floor(300 - (dist * 50)),
      };
    });

    return { performers, venues };
  }

  // 1. Shuffle & select 3 to 5 venues
  const shuffledVenues = [...template.venues].sort(() => 0.5 - Math.random());
  const selectedVenueCount = Math.min(shuffledVenues.length, Math.floor(Math.random() * 2) + 3); // 3 to 4
  const pickedVenuesRaw = shuffledVenues.slice(0, selectedVenueCount);

  // Diverse quadrant angle offsets for venues so they spread cleanly around town
  const venueOffsets = [
    { dLat: 0.0055 + (Math.random() * 0.002), dLng: 0.0065 + (Math.random() * 0.002) },  // NE
    { dLat: -0.0060 - (Math.random() * 0.002), dLng: 0.0070 + (Math.random() * 0.002) }, // SE
    { dLat: 0.0065 + (Math.random() * 0.002), dLng: -0.0075 - (Math.random() * 0.002) }, // NW
    { dLat: -0.0050 - (Math.random() * 0.002), dLng: -0.0060 - (Math.random() * 0.002) },// SW
    { dLat: 0.0010, dLng: -0.0020 },                                                     // Center
  ].sort(() => 0.5 - Math.random());

  const venues: PublicVenueItem[] = pickedVenuesRaw.map((v, idx) => {
    const offset = venueOffsets[idx % venueOffsets.length];
    return {
      ...v,
      latitude: location.latitude + offset.dLat,
      longitude: location.longitude + offset.dLng,
      activeMusicianCount: Math.floor(Math.random() * 3) + 1,
      distanceMiles: +(0.2 + (idx * 0.3) + (Math.random() * 0.2)).toFixed(1),
    };
  });

  // 2. Shuffle & select 6 to 8 artists (Bear Pins 🐻)
  const shuffledArtists = [...template.performers].sort(() => 0.5 - Math.random());
  const selectedArtistCount = Math.min(shuffledArtists.length, Math.floor(Math.random() * 3) + 6); // 6 to 8
  const pickedArtistsRaw = shuffledArtists.slice(0, selectedArtistCount);

  // Dispersed coordinate offsets across the city so bear pins spread naturally
  const artistAngleOffsets = [
    { dLat: 0.0040, dLng: 0.0035 },
    { dLat: -0.0045, dLng: 0.0050 },
    { dLat: 0.0060, dLng: -0.0040 },
    { dLat: -0.0065, dLng: -0.0045 },
    { dLat: 0.0020, dLng: 0.0080 },
    { dLat: -0.0025, dLng: -0.0085 },
    { dLat: 0.0075, dLng: 0.0020 },
    { dLat: -0.0080, dLng: 0.0015 },
  ].sort(() => 0.5 - Math.random());

  // Ensure at least 3-4 are LIVE now
  let liveCount = 0;
  const targetLiveCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 live

  const performers: PublicPerformerItem[] = pickedArtistsRaw.map((artist, idx) => {
    const assignedVenue = venues[idx % venues.length];
    const offset = artistAngleOffsets[idx % artistAngleOffsets.length];
    
    // Add micro jitter to coordinates (±0.001)
    const jitterLat = (Math.random() - 0.5) * 0.0018;
    const jitterLng = (Math.random() - 0.5) * 0.0024;

    const shouldBeLive = liveCount < targetLiveCount;
    if (shouldBeLive) liveCount++;

    const dist = +(0.2 + (idx * 0.22) + (Math.random() * 0.15)).toFixed(1);

    return {
      ...artist,
      latitude: location.latitude + offset.dLat + jitterLat,
      longitude: location.longitude + offset.dLng + jitterLng,
      isLive: shouldBeLive,
      currentVenueName: assignedVenue.name,
      distanceMiles: dist,
      popularityScore: Math.floor(Math.random() * 15) + 84, // 84 to 98
      followersCount: Math.floor(Math.random() * 2400) + 850,
      popularRank: idx < 3 ? idx + 1 : undefined,
      nearbyScore: Math.floor(300 - (dist * 50) + (Math.random() * 40)),
    };
  });

  return { performers, venues };
}
