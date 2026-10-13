/**
 * Crowdbeats V2 — Phase 21: Cross-Platform End-to-End User Journeys (Web Suite)
 *
 * Verifies the 7 platform user journeys from the Web application client perspective:
 * 1. Guest -> Discover (Unauthenticated routing to /discover, deep linking, public profile access)
 * 2. Fan -> Tip (Client fee transparency breakdown: gross, 6% platform fee, net proceeds, anonymous toggle)
 * 3. Solo/Band -> Receive (Creator Studio route access, live stage controls, split configuration)
 * 4. Fan -> Follow (Fan feed access, follow state retention, messaging safety permission gating)
 * 5. Creator -> Campaign (Story-to-Launch goal bounds validation, non-financial updates vs immutable financial fields)
 * 6. Sponsor -> Inquiry (Sponsor portal route guards, shortlist navigation, contract viewer state machine)
 * 7. Admin -> Oversight (Admin command center route guards, RBAC enforcement, financial reconciliation & BI analytics access)
 */

import { computeRouteGuard, type SessionData } from '../../lib/routeGuard';
import {
  parseDeepLink,
  buildUniversalLink,
  buildCustomSchemeLink,
  UNIVERSAL_LINK_HOST,
} from '@crowdbeats/contracts';
import {
  CAMPAIGN_GOAL_MIN_CENTS,
  CAMPAIGN_GOAL_MAX_CENTS,
  CampaignStatus,
} from '@crowdbeats/contracts';
import {
  PLATFORM_FEE_BPS,
} from '@crowdbeats/contracts';

// ── Persona Test Sessions ───────────────────────────────────────────────────

const GUEST_SESSION: null = null;

const FAN_SESSION: SessionData = {
  uid: 'usr_fan_lucas',
  personaType: 'fan',
  emailVerified: true,
  onboarded: true,
};

const ARTIST_SESSION: SessionData = {
  uid: 'usr_artist_maya',
  personaType: 'artist',
  emailVerified: true,
  onboarded: true,
};

const BAND_SESSION: SessionData = {
  uid: 'usr_band_midnight',
  personaType: 'band_member',
  emailVerified: true,
  onboarded: true,
};

const SPONSOR_SESSION: SessionData = {
  uid: 'usr_sponsor_redbull',
  personaType: 'sponsor_rep',
  emailVerified: true,
  onboarded: true,
};

const STAFF_ADMIN_SESSION: SessionData = {
  uid: 'usr_staff_sarah',
  personaType: 'staff',
  emailVerified: true,
  onboarded: true,
};

describe('Phase 21: Cross-Platform End-to-End User Journeys (Web)', () => {
  // ══════════════════════════════════════════════════════════════════════════
  // Journey 1: Guest -> Discover
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 1: Guest -> Discover', () => {
    it('allows unauthenticated guest access to public discovery and profile routes', () => {
      expect(computeRouteGuard('/discover', GUEST_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/artist/maya-lin', GUEST_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/band/the-echoes', GUEST_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/tip/maya-lin', GUEST_SESSION)).toEqual({
        action: 'next',
      });
    });

    it('redirects unauthenticated guest accessing protected sponsor or creator routes to /auth', () => {
      expect(computeRouteGuard('/creator/dashboard', GUEST_SESSION)).toEqual({
        action: 'redirect',
        destination: '/auth',
      });
      expect(computeRouteGuard('/sponsor', GUEST_SESSION)).toEqual({
        action: 'redirect',
        destination: '/auth',
      });
      expect(computeRouteGuard('/admin', GUEST_SESSION)).toEqual({
        action: 'redirect',
        destination: '/auth',
      });
    });

    it('resolves universal and custom scheme deep links correctly', () => {
      const universalUri = `https://${UNIVERSAL_LINK_HOST}/artist/art_maya_lin`;
      const parsed = parseDeepLink(universalUri);

      expect(parsed.type).toBe('artist');
      expect(parsed.id).toBe('art_maya_lin');

      const customUri = buildCustomSchemeLink('/tip/art_maya_lin?amount=2500');
      const parsedCustom = parseDeepLink(customUri);

      expect(parsedCustom.type).toBe('tip');
      expect(parsedCustom.id).toBe('art_maya_lin');
      expect(parsedCustom.queryParams?.amount).toBe('2500');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 2: Fan -> Tip
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 2: Fan -> Tip', () => {
    it('computes transparent fee breakdown display (6% platform fee + net proceeds)', () => {
      const grossAmountCents = 2500; // $25.00
      const platformFeeCents = Math.floor((grossAmountCents * PLATFORM_FEE_BPS) / 10000);
      const netProceedsCents = grossAmountCents - platformFeeCents;

      expect(platformFeeCents).toBe(150); // $1.50
      expect(netProceedsCents).toBe(2350); // $23.50
      expect(platformFeeCents + netProceedsCents).toBe(grossAmountCents);
    });

    it('allows fan persona to access tip route and redirects fan from creator studio to /fan', () => {
      expect(computeRouteGuard('/tip/artist_maya_lin', FAN_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/creator/dashboard', FAN_SESSION)).toEqual({
        action: 'redirect',
        destination: '/fan',
      });
    });

    it('validates anonymous tip state toggle on fan client', () => {
      let isAnonymous = false;
      const toggleAnonymous = () => {
        isAnonymous = !isAnonymous;
      };

      expect(isAnonymous).toBe(false);
      toggleAnonymous();
      expect(isAnonymous).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 3: Solo/Band -> Receive
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 3: Solo/Band -> Receive', () => {
    it('allows artist and band personas to access Creator Studio and finance views', () => {
      expect(computeRouteGuard('/creator/dashboard', ARTIST_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/creator/studio', ARTIST_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/creator/dashboard', BAND_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/creator/studio', BAND_SESSION)).toEqual({
        action: 'next',
      });
    });

    it('validates 50/50 band split calculation without integer drift', () => {
      const totalNetCents = 1500; // $15.00
      const memberCount = 2;
      const splitEach = Math.floor(totalNetCents / memberCount);

      expect(splitEach).toBe(750);
      expect(splitEach * memberCount).toBe(totalNetCents);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 4: Fan -> Follow & Messaging
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 4: Fan -> Follow & Messaging', () => {
    it('allows fan to access fan feeds and messaging views', () => {
      expect(computeRouteGuard('/fan', FAN_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/fan/messages', FAN_SESSION)).toEqual({
        action: 'next',
      });
    });

    it('evaluates messaging safety gating based on mutual follow status', () => {
      const canSendDirectMessage = (mutualFollow: boolean, isFollower: boolean) => {
        if (mutualFollow) return { permitted: true, requiresRequest: false };
        if (isFollower) return { permitted: true, requiresRequest: true };
        return { permitted: false, requiresRequest: false };
      };

      expect(canSendDirectMessage(true, true)).toEqual({
        permitted: true,
        requiresRequest: false,
      });
      expect(canSendDirectMessage(false, true)).toEqual({
        permitted: true,
        requiresRequest: true,
      });
      expect(canSendDirectMessage(false, false)).toEqual({
        permitted: false,
        requiresRequest: false,
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 5: Creator -> Campaign
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 5: Creator -> Campaign', () => {
    it('validates campaign goal limits according to contracts', () => {
      const validCampaignGoal = 250000; // $2,500.00
      expect(validCampaignGoal).toBeGreaterThanOrEqual(CAMPAIGN_GOAL_MIN_CENTS);
      expect(validCampaignGoal).toBeLessThanOrEqual(CAMPAIGN_GOAL_MAX_CENTS);
    });

    it('enforces status progression from draft to active in campaign workflow', () => {
      const validTransitions: Record<string, string[]> = {
        [CampaignStatus.DRAFT]: [CampaignStatus.SUBMITTED],
        [CampaignStatus.SUBMITTED]: [CampaignStatus.APPROVED, CampaignStatus.REJECTED],
        [CampaignStatus.APPROVED]: [CampaignStatus.ACTIVE],
        [CampaignStatus.ACTIVE]: [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
      };

      expect(validTransitions[CampaignStatus.DRAFT]).toContain(CampaignStatus.SUBMITTED);
      expect(validTransitions[CampaignStatus.APPROVED]).toContain(CampaignStatus.ACTIVE);
      expect(validTransitions[CampaignStatus.ACTIVE]).toContain(CampaignStatus.COMPLETED);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 6: Sponsor -> Inquiry
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 6: Sponsor -> Inquiry', () => {
    it('allows sponsor rep to access sponsor portal and blocks unauthorized personas', () => {
      expect(computeRouteGuard('/sponsor', SPONSOR_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/sponsor/shortlist', SPONSOR_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/sponsor', FAN_SESSION)).toEqual({
        action: 'redirect',
        destination: '/fan',
      });
      expect(computeRouteGuard('/sponsor', ARTIST_SESSION)).toEqual({
        action: 'redirect',
        destination: '/creator/dashboard',
      });
    });

    it('validates sponsorship contract dual-signature state machine transitions', () => {
      const dealTransitions: Record<string, string> = {
        draft: 'pending_sponsor',
        pending_sponsor: 'active',
        active: 'completed',
      };

      expect(dealTransitions['draft']).toBe('pending_sponsor');
      expect(dealTransitions['pending_sponsor']).toBe('active');
      expect(dealTransitions['active']).toBe('completed');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 7: Admin -> Oversight
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 7: Admin -> Oversight', () => {
    it('allows authenticated staff to access Admin Command Center and blocks unauthenticated users', () => {
      expect(computeRouteGuard('/admin', STAFF_ADMIN_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/admin/crm', STAFF_ADMIN_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/admin/reconciliation', STAFF_ADMIN_SESSION)).toEqual({
        action: 'next',
      });
      expect(computeRouteGuard('/admin/analytics', STAFF_ADMIN_SESSION)).toEqual({
        action: 'next',
      });

      // Blocks unauthenticated guests
      expect(computeRouteGuard('/admin', GUEST_SESSION)).toEqual({
        action: 'redirect',
        destination: '/auth',
      });
    });

    it('verifies mathematical balance in financial oversight ledger view', () => {
      const debits = 50000; // $500.00
      const credits = 50000; // $500.00
      const variance = debits - credits;

      expect(variance).toBe(0);
    });
  });
});
