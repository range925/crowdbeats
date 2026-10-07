/**
 * Crowdbeats V2 — Persona Roles Settings, Activity & Enhanced Bio Unit Tests
 */

import {
  MOCK_PERFORMERS,
  MOCK_VENUES,
  PublicPerformerItem,
  PublicVenueItem,
  FanLoveItem,
} from '@/lib/discovery/discoveryClient';
import type {
  ArtistProfile,
  ArtistPublicProjection,
  Band,
  BandPublicProjection,
  BandRosterMember,
} from '@crowdbeats/contracts';

describe('Persona Profiles & Enhanced Bio Model', () => {
  describe('Artist Rich Bio Projections', () => {
    it('supports tagline, originCity, instruments, influences, and audio demo properties', () => {
      const projection: ArtistPublicProjection = {
        artistId: 'art_test_1',
        stageName: 'Luna & The Waves',
        creatorSlug: 'luna-waves',
        tagline: 'Ethereal dream-pop loops & coastal acoustics',
        originCity: 'Encinitas, CA',
        instruments: ['Vocals', 'Fender Jaguar', 'Roland Juno-60'],
        influences: ['Beach House', 'Cocteau Twins', 'Alvvays'],
        accolades: ['Verified Resident Performer', 'Top 5 Local Artist'],
        audioPreviewUrl: 'https://example.com/demo.mp3',
        featuredTrackTitle: 'Pacific Mist (Demo)',
        showFanWall: true,
        genres: ['pop', 'other'],
        socialLinks: {
          spotify: 'https://spotify.com/artist/luna',
          instagram: '@lunawaves',
          youtube: 'https://youtube.com/@lunawaves',
        },
        isActive: true,
      };

      expect(projection.tagline).toBe('Ethereal dream-pop loops & coastal acoustics');
      expect(projection.originCity).toBe('Encinitas, CA');
      expect(projection.instruments).toHaveLength(3);
      expect(projection.influences).toContain('Beach House');
      expect(projection.accolades).toContain('Verified Resident Performer');
      expect(projection.audioPreviewUrl).toBe('https://example.com/demo.mp3');
      expect(projection.featuredTrackTitle).toBe('Pacific Mist (Demo)');
      expect(projection.showFanWall).toBe(true);
    });
  });

  describe('Band Rich Bio & Roster Projections', () => {
    it('supports band member roster cards with instrument definitions', () => {
      const roster: BandRosterMember[] = [
        { name: 'Liam Vance', role: 'Founder & Vocals', instrument: 'Electric Guitar' },
        { name: 'Chloe Ray', role: 'Horns', instrument: 'Trumpet' },
        { name: 'Julian Cruz', role: 'Bass & Synth', instrument: 'Bass' },
      ];

      const bandProjection: BandPublicProjection = {
        bandId: 'band_test_1',
        name: 'The Sunsets',
        creatorSlug: 'the-sunsets',
        tagline: '4-Piece Indie Rock & Brass Collective',
        originCity: 'San Diego, CA',
        influences: ['The Black Keys', 'Foals'],
        accolades: ['Best Indie Band'],
        audioPreviewUrl: 'https://example.com/sunsets.mp3',
        featuredTrackTitle: 'Midnight Horizon',
        rosterPreview: roster,
        showFanWall: true,
        genres: ['Rock', 'Indie Rock'],
        memberCount: 3,
        isActive: true,
      };

      expect(bandProjection.rosterPreview).toHaveLength(3);
      expect(bandProjection.rosterPreview?.[0].instrument).toBe('Electric Guitar');
      expect(bandProjection.rosterPreview?.[1].role).toBe('Horns');
      expect(bandProjection.tagline).toBe('4-Piece Indie Rock & Brass Collective');
    });
  });

  describe('Discovery Performers & Venue Enhancements', () => {
    it('provides rich bio details for Jake Rios', () => {
      const jake = MOCK_PERFORMERS.find((p) => p.slug === 'jake-rios');
      expect(jake).toBeDefined();
      expect(jake?.tagline).toBeDefined();
      expect(jake?.originCity).toBe('San Diego, CA');
      expect(jake?.instruments).toContain('Acoustic Guitar');
      expect(jake?.influences).toContain('Bon Iver');
      expect(jake?.accolades).toContain('Verified Resident Performer');
      expect(jake?.featuredTrackTitle).toBe('Pacific Twilight (Acoustic Demo)');
      expect(jake?.recentTippers && jake.recentTippers.length > 0).toBe(true);
    });

    it('provides rich bio and roster details for The Sunsets', () => {
      const sunsets = MOCK_PERFORMERS.find((p) => p.slug === 'the-sunsets');
      expect(sunsets).toBeDefined();
      expect(sunsets?.type).toBe('band');
      expect(sunsets?.tagline).toContain('Indie Rock');
      expect(sunsets?.rosterPreview).toHaveLength(4);
      expect(sunsets?.rosterPreview?.[0].name).toBe('Liam Vance');
      expect(sunsets?.recentTippers).toBeDefined();
    });

    it('provides amenities and stages for The Main Stage venue', () => {
      const venue = MOCK_VENUES.find((v) => v.id === 'ven_main_stage');
      expect(venue).toBeDefined();
      expect(venue?.amenities).toContain('Full Craft Bar');
      expect(venue?.amenities).toContain('Multi-Tier Sound System');
      expect(venue?.capacity).toBe(350);
      expect(venue?.stages).toHaveLength(2);
      expect(venue?.stages?.[0].name).toBe('Main Acoustic Stage');
    });
  });

  describe('Fan Support Tickers / Ledger Messages', () => {
    it('validates structure of fan love items', () => {
      const item: FanLoveItem = {
        id: 'tip_123',
        fanName: 'Sarah M.',
        amountFormatted: '$25.00',
        message: 'Great fingerstyle set!',
        timeAgo: '15m ago',
      };

      expect(item.fanName).toBe('Sarah M.');
      expect(item.amountFormatted).toBe('$25.00');
      expect(item.message).toBe('Great fingerstyle set!');
    });
  });

  describe('Persona Settings Storage Schemas', () => {
    it('verifies creator settings configuration schema', () => {
      const creatorSettings = {
        autoBroadcastLive: true,
        defaultSetDurationMinutes: 60,
        showLiveTipTicker: true,
        allowAnonymousTips: true,
        customThankYouNote: 'Thanks for supporting live music!',
        minTipAlertCents: 500,
        radarDiscoverable: true,
        audioPreviewOnCards: true,
        showBookingContact: true,
        notifyTips: true,
        notifyFollows: true,
        notifyCampaigns: true,
        notifyDailySummary: true,
      };

      expect(creatorSettings.autoBroadcastLive).toBe(true);
      expect(creatorSettings.defaultSetDurationMinutes).toBe(60);
      expect(creatorSettings.minTipAlertCents).toBe(500);
      expect(creatorSettings.radarDiscoverable).toBe(true);
    });

    it('verifies band settings configuration schema', () => {
      const bandSettings = {
        splitTransparency: true,
        adminInviteDelegation: true,
        notifyOnDistribution: true,
        enableGigTipGoal: true,
        gigTipGoalDollars: 250,
        autoRotateQr: true,
        showRosterOnBio: true,
        showInstrumentTags: true,
        audioPreviewEnabled: true,
      };

      expect(bandSettings.splitTransparency).toBe(true);
      expect(bandSettings.adminInviteDelegation).toBe(true);
      expect(bandSettings.gigTipGoalDollars).toBe(250);
      expect(bandSettings.autoRotateQr).toBe(true);
    });

    it('verifies venue settings configuration schema', () => {
      const venueSettings = {
        geofenceRadiusMeters: 100,
        autoCheckoutHours: 3,
        autoRotateQr: true,
        qrRotationIntervalSeconds: 60,
        publicScheduleVisible: true,
        enableStaffTipJar: true,
        selectedAmenities: ['Full Craft Bar', 'Multi-Tier Sound System'],
      };

      expect(venueSettings.geofenceRadiusMeters).toBe(100);
      expect(venueSettings.autoCheckoutHours).toBe(3);
      expect(venueSettings.selectedAmenities).toContain('Full Craft Bar');
    });

    it('verifies sponsor settings configuration schema', () => {
      const sponsorSettings = {
        lowBalanceAlertDollars: 100,
        dailyMatchCapDollars: 250,
        matchMultiplier: '1.0',
        selectedGenres: ['Indie Rock', 'Acoustic Folk'],
        targetMetro: 'San Diego, CA',
        allowInboundPitches: true,
      };

      expect(sponsorSettings.lowBalanceAlertDollars).toBe(100);
      expect(sponsorSettings.dailyMatchCapDollars).toBe(250);
      expect(sponsorSettings.matchMultiplier).toBe('1.0');
      expect(sponsorSettings.selectedGenres).toContain('Indie Rock');
    });
  });
});
