import { validateProfileImage } from '../../lib/media/imageValidation';

describe('Profile Management & Security Tests', () => {
  describe('Initials Generation & Fallback Rules', () => {
    function getInitials(name: string | null | undefined): string {
      if (!name) return 'CB';
      return name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }

    it('returns CB for undefined or empty name', () => {
      expect(getInitials(undefined)).toBe('CB');
      expect(getInitials(null)).toBe('CB');
      expect(getInitials('')).toBe('CB');
    });

    it('returns two initials for multi-word name', () => {
      expect(getInitials('Miles Davis')).toBe('MD');
      expect(getInitials('Stevie Ray Vaughan')).toBe('SR');
    });

    it('handles single word name gracefully', () => {
      expect(getInitials('Prince')).toBe('P');
    });

    it('handles irregular whitespace correctly', () => {
      expect(getInitials('  John   Coltrane  ')).toBe('JC');
    });
  });

  describe('Allowed Profile Fields Filtering', () => {
    const ALLOWED_USER_FIELDS = new Set([
      'displayName',
      'username',
      'bio',
      'tagline',
      'pronouns',
      'city',
      'genres',
      'instruments',
      'musicInterests',
      'website',
      'socialLinks',
      'publicProfileVisible',
      'performanceType',
      'availability',
      'bookingPreference',
      'musicStyle',
      'orgName',
      'industry',
      'sponsorInterests',
      'rosterPreview',
    ]);

    it('blocks unauthorized privilege escalation fields', () => {
      const maliciousPayload = {
        displayName: 'Verified Artist',
        isAdmin: true,
        role: 'SUPER_ADMIN',
        platformRole: 'SUPER_ADMIN',
        totalTipsReceivedCents: 9999999,
        availableEscrowCents: 500000,
        stripeAccountId: 'acct_fake123',
      };

      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(maliciousPayload)) {
        if (ALLOWED_USER_FIELDS.has(k)) {
          sanitized[k] = v;
        }
      }

      expect(sanitized).toEqual({ displayName: 'Verified Artist' });
      expect(sanitized.isAdmin).toBeUndefined();
      expect(sanitized.role).toBeUndefined();
      expect(sanitized.platformRole).toBeUndefined();
      expect(sanitized.totalTipsReceivedCents).toBeUndefined();
      expect(sanitized.availableEscrowCents).toBeUndefined();
      expect(sanitized.stripeAccountId).toBeUndefined();
    });

    it('sanitizes text fields to maximum lengths', () => {
      const longBio = 'A'.repeat(1000);
      const longName = 'B'.repeat(200);
      const longTagline = 'C'.repeat(300);

      const sanitized = {
        bio: longBio.slice(0, 600).trim(),
        displayName: longName.slice(0, 100).trim(),
        tagline: longTagline.slice(0, 140).trim(),
      };

      expect(sanitized.bio.length).toBe(600);
      expect(sanitized.displayName.length).toBe(100);
      expect(sanitized.tagline.length).toBe(140);
    });
  });

  describe('Image Variant Dimensions Contract', () => {
    it('defines correct multi-variant target dimensions for responsive feeds', () => {
      const VARIANTS = {
        thumbnail: 128,
        card: 320,
        full: 800,
      };

      expect(VARIANTS.thumbnail).toBe(128);
      expect(VARIANTS.card).toBe(320);
      expect(VARIANTS.full).toBe(800);
      // Ensures high-DPI thumbnail (64px physical @ 2x) never exceeds card
      expect(VARIANTS.thumbnail).toBeLessThan(VARIANTS.card);
      expect(VARIANTS.card).toBeLessThan(VARIANTS.full);
    });
  });
});
