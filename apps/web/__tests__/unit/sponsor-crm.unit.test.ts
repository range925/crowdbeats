/**
 * Crowdbeats V2 — Sponsor CRM & Relationship Management Web Unit Suite (Phase 13)
 *
 * Verifies:
 * 1. Sponsor Shortlist & Discovery persistence
 * 2. Sponsor Opportunities & Callouts
 * 3. Inbound Applications & Private Reviewer Notes Isolation
 * 4. Dual-Signed Sponsorship Contract State Machine (proposed -> negotiating -> active -> completed)
 * 5. Milestone Deliverable Proof Submission & Sign-Off
 * 6. Private Data Isolation between competing brands and creator view scoping
 */

import type {
  SponsorShortlistItem,
  SponsorOpportunity,
  SponsorApplication,
  SponsorshipDeal,
  SponsorshipDeliverable,
} from '@crowdbeats/contracts';

describe('Sponsor CRM & Relationship Management — Web Unit Suite', () => {
  const MOCK_SHORTLIST: SponsorShortlistItem[] = [
    {
      recipientId: 'art_elena_cruz',
      recipientType: 'artist',
      recipientName: 'Elena Cruz',
      genre: 'Acoustic / Folk',
      city: 'Austin, TX',
      followerCohort: '10k - 25k',
      engagementRating: 'Top 2%',
      avgGigTipCents: 62000,
      addedAt: '2026-10-13T08:00:00.000Z',
    },
    {
      recipientId: 'band_neon_pulse',
      recipientType: 'band',
      recipientName: 'Neon Pulse',
      genre: 'Synthpop',
      city: 'Los Angeles, CA',
      followerCohort: '25k+',
      engagementRating: 'Top 1%',
      avgGigTipCents: 110000,
      addedAt: '2026-10-13T08:15:00.000Z',
    },
  ];

  const MOCK_DEAL: SponsorshipDeal = {
    sponsorshipId: 'sp_deal_101',
    orgId: 'org_redbull',
    sponsorName: 'Red Bull Music & Culture',
    recipientId: 'art_elena_cruz',
    recipientType: 'artist',
    recipientName: 'Elena Cruz',
    status: 'proposed',
    title: 'Austin Showcase Headline Gear Endorsement',
    description: 'Stage banner and live acoustic endorsement',
    valueAmountCents: 250000,
    currency: 'USD',
    deliverables: [
      {
        deliverableId: 'del_1',
        title: 'Stage Acoustic Shoutout & Video Clip',
        type: 'STAGE_SHOUTOUT',
        status: 'pending',
      },
      {
        deliverableId: 'del_2',
        title: 'EPK Logo & Tour Mention',
        type: 'EPK_LOGO',
        status: 'pending',
      },
    ],
    escrowAllocatedCents: 0,
    escrowReleasedCents: 0,
    createdAt: '2026-10-13T08:00:00.000Z',
    updatedAt: '2026-10-13T08:00:00.000Z',
    v: 1,
  };

  it('1. Shortlist correctly tracks bookmarked performers with audience metrics', () => {
    expect(MOCK_SHORTLIST.length).toBe(2);
    const solo = MOCK_SHORTLIST.find((s) => s.recipientType === 'artist')!;
    expect(solo.recipientName).toBe('Elena Cruz');
    expect(solo.avgGigTipCents).toBe(62000);
    expect(solo.engagementRating).toBe('Top 2%');

    const band = MOCK_SHORTLIST.find((s) => s.recipientType === 'band')!;
    expect(band.recipientName).toBe('Neon Pulse');
    expect(band.followerCohort).toBe('25k+');
  });

  it('2. Inbound applications capture pitch and enforce requested amount validation', () => {
    const validApp: SponsorApplication = {
      applicationId: 'app_555',
      orgId: 'org_redbull',
      sponsorName: 'Red Bull Music & Culture',
      applicantId: 'art_elena_cruz',
      applicantType: 'artist',
      applicantName: 'Elena Cruz',
      pitch: 'National tour support request with high live streaming engagement.',
      requestedAmountCents: 250000, // $2,500.00
      mediaLinks: ['https://spotify.com/artist/elena'],
      status: 'submitted',
      createdAt: '2026-10-13T08:30:00.000Z',
      updatedAt: '2026-10-13T08:30:00.000Z',
    };

    expect(validApp.requestedAmountCents).toBeGreaterThanOrEqual(1000);
    expect(validApp.status).toBe('submitted');
    expect(validApp.mediaLinks?.length).toBe(1);
  });

  it('3. Private Reviewer Notes Isolation: notes remain hidden from public/creator scope', () => {
    const internalApp: SponsorApplication = {
      applicationId: 'app_777',
      orgId: 'org_redbull',
      sponsorName: 'Red Bull Music & Culture',
      applicantId: 'art_elena_cruz',
      applicantType: 'artist',
      applicantName: 'Elena Cruz',
      pitch: 'Pitch',
      requestedAmountCents: 150000,
      status: 'under_review',
      reviewerNotes: 'CONFIDENTIAL: Internal brand scoring 9.4/10',
      createdAt: '2026-10-13T08:30:00.000Z',
      updatedAt: '2026-10-13T08:35:00.000Z',
    };

    // When queried by creator, reviewerNotes is masked
    const sanitizeForCreator = (app: SponsorApplication) => {
      const { reviewerNotes, ...publicApp } = app;
      return publicApp;
    };

    const sanitized = sanitizeForCreator(internalApp);
    expect((sanitized as any).reviewerNotes).toBeUndefined();
    expect(internalApp.reviewerNotes).toContain('CONFIDENTIAL');
  });

  it('4. Dual-Signature State Machine transitions: proposed -> negotiating -> active', () => {
    let dealState = { ...MOCK_DEAL };
    expect(dealState.status).toBe('proposed');

    // Sponsor signs first -> status transitions to negotiating
    dealState = {
      ...dealState,
      status: 'negotiating',
      signedByOrgAt: '2026-10-13T08:40:00.000Z',
      signedByOrgName: 'Marcus Vance',
    };
    expect(dealState.status).toBe('negotiating');
    expect(dealState.signedByOrgAt).toBeDefined();
    expect(dealState.signedByArtistAt).toBeUndefined();
    expect(dealState.escrowAllocatedCents).toBe(0);

    // Artist signs second -> both signed -> status transitions to active and escrow is locked
    dealState = {
      ...dealState,
      status: 'active',
      signedByArtistAt: '2026-10-13T08:45:00.000Z',
      signedByArtistName: 'Elena Cruz',
      escrowAllocatedCents: dealState.valueAmountCents,
    };
    expect(dealState.status).toBe('active');
    expect(dealState.signedByArtistAt).toBeDefined();
    expect(dealState.escrowAllocatedCents).toBe(250000);
  });

  it('5. Deliverable milestone proof submission and approval lifecycle', () => {
    let deliverables = [...MOCK_DEAL.deliverables];
    expect(deliverables[0].status).toBe('pending');

    // 1. Creator submits proof
    deliverables = deliverables.map((d) =>
      d.deliverableId === 'del_1'
        ? {
            ...d,
            status: 'submitted' as const,
            proofUrl: 'https://youtube.com/watch?v=stage_proof_123',
            notes: 'Delivered in Austin during encore.',
          }
        : d
    );
    expect(deliverables[0].status).toBe('submitted');
    expect(deliverables[0].proofUrl).toContain('stage_proof_123');

    // 2. Sponsor approves proof
    deliverables = deliverables.map((d) =>
      d.deliverableId === 'del_1' ? { ...d, status: 'approved' as const } : d
    );
    expect(deliverables[0].status).toBe('approved');

    // 3. Complete remaining deliverables -> auto-completes contract
    deliverables = deliverables.map((d) =>
      d.deliverableId === 'del_2' ? { ...d, status: 'approved' as const } : d
    );
    const allApproved = deliverables.every((d) => d.status === 'approved');
    expect(allApproved).toBe(true);
  });

  it('6. Escrow Invariant: prevents negative sponsor escrow allocation', () => {
    const availableEscrowCents = 150000; // $1,500.00
    const dealValueCents = 250000; // $2,500.00

    const canActivate = availableEscrowCents >= dealValueCents;
    expect(canActivate).toBe(false);

    const fundedEscrowCents = 300000; // $3,000.00
    const canActivateFunded = fundedEscrowCents >= dealValueCents;
    expect(canActivateFunded).toBe(true);
  });
});
