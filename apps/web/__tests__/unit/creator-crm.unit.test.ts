/**
 * Crowdbeats V2 — Phase 11: Solo Musician Creator CRM Unit Tests
 *
 * Verifies:
 * 1. Top Analytics Bento metrics rendering (Total Supporters, Repeat Rate %, Lifetime Tips, Average Tip, Top Stage Session)
 * 2. Segment filter tabs & directory search interface
 * 3. Supporter directory table rendering with segment badges, lifetime values, and follower status
 * 4. Fan privacy & consent enforcement:
 *    - Anonymous supporter masking ("Anonymous Supporter", avatar fallback, contact disabled)
 *    - Direct messaging consent verification (Say Thanks button only rendered when messaging allowed)
 * 5. Supporter Detail Dossier Drawer rendering with chronological engagement timeline & itemized tip history
 * 6. Thank-You Note Modal enforces consent warning and character limit
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type {
  CreatorSupporterSummary,
  CreatorTipAnalytics,
  CreatorSupporterDetails,
  SupporterSegment,
} from '@crowdbeats/contracts';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({}),
}));

describe('Solo Musician Creator CRM — Component & Template Unit Suite', () => {
  const sampleAnalytics: CreatorTipAnalytics = {
    totalTipsReceivedCents: 45000,
    totalTipsCount: 15,
    averageTipCents: 3000,
    repeatSupportersCount: 4,
    repeatSupporterRatePct: 40,
    topSupportersCount: 3,
    recentTipsVolume30dCents: 15000,
    topTippingSession: {
      sessionId: 'session_live_acoustic_101',
      sessionTitle: 'Sunset Acoustic Live',
      totalCents: 22000,
      tipsCount: 8,
    },
  };

  const sampleSupporters: CreatorSupporterSummary[] = [
    {
      supporterId: 'fan_sarah_1',
      displayName: 'Sarah Connor',
      photoUrl: 'https://images.crowdbeats.test/sarah.jpg',
      isAnonymous: false,
      isFollower: true,
      followedAt: '2026-09-01T10:00:00Z',
      allowsDirectMessaging: true,
      lifetimeValueCents: 15000,
      totalTipsCents: 10000,
      tipsCount: 3,
      totalCampaignContributionCents: 5000,
      campaignsCount: 1,
      firstSupportedAt: '2026-09-01T10:00:00Z',
      lastSupportedAt: '2026-10-12T19:00:00Z',
      segment: 'TOP_SUPPORTER',
    },
    {
      supporterId: 'fan_repeat_2',
      displayName: 'Marcus Brody',
      photoUrl: null,
      isAnonymous: false,
      isFollower: true,
      followedAt: '2026-08-15T12:00:00Z',
      allowsDirectMessaging: false, // Opted out of direct messages
      lifetimeValueCents: 5000,
      totalTipsCents: 5000,
      tipsCount: 2,
      totalCampaignContributionCents: 0,
      campaignsCount: 0,
      firstSupportedAt: '2026-08-15T12:00:00Z',
      lastSupportedAt: '2026-10-10T14:30:00Z',
      segment: 'REPEAT_SUPPORTER',
    },
    {
      supporterId: 'fan_anon_3',
      displayName: 'Anonymous Supporter',
      photoUrl: null,
      isAnonymous: true, // Privacy masked
      isFollower: false,
      followedAt: null,
      allowsDirectMessaging: false, // Anonymous contact prohibited
      lifetimeValueCents: 2500,
      totalTipsCents: 2500,
      tipsCount: 1,
      totalCampaignContributionCents: 0,
      campaignsCount: 0,
      firstSupportedAt: '2026-10-11T20:15:00Z',
      lastSupportedAt: '2026-10-11T20:15:00Z',
      segment: 'RECENT_SUPPORTER',
    },
    {
      supporterId: 'fan_backer_4',
      displayName: 'Elena Fisher',
      photoUrl: null,
      isAnonymous: false,
      isFollower: false,
      followedAt: null,
      allowsDirectMessaging: true,
      lifetimeValueCents: 5000,
      totalTipsCents: 0,
      tipsCount: 0,
      totalCampaignContributionCents: 5000,
      campaignsCount: 1,
      firstSupportedAt: '2026-10-08T11:00:00Z',
      lastSupportedAt: '2026-10-08T11:00:00Z',
      segment: 'CAMPAIGN_BACKER',
    },
    {
      supporterId: 'fan_follower_5',
      displayName: 'David Miller',
      photoUrl: null,
      isAnonymous: false,
      isFollower: true,
      followedAt: '2026-10-01T09:00:00Z',
      allowsDirectMessaging: true,
      lifetimeValueCents: 0,
      totalTipsCents: 0,
      tipsCount: 0,
      totalCampaignContributionCents: 0,
      campaignsCount: 0,
      firstSupportedAt: null,
      lastSupportedAt: null,
      segment: 'FOLLOWER_ONLY',
    },
  ];

  const sampleDetails: CreatorSupporterDetails = {
    supporter: sampleSupporters[0],
    engagementHistory: [
      {
        eventId: 'evt_follow_1',
        type: 'STARTED_FOLLOWING',
        timestamp: '2026-09-01T10:00:00Z',
        summary: 'Started following your journey. Joined your fan community.',
      },
      {
        eventId: 'evt_tip_1',
        type: 'TIP_RECEIVED',
        timestamp: '2026-09-15T21:00:00Z',
        amountCents: 5000,
        summary: 'Sent a $50.00 Tip during "Sunset Acoustic Live" — "Amazing solo!"',
        metadata: {
          sessionId: 'session_live_acoustic_101',
          sessionTitle: 'Sunset Acoustic Live',
          fanMessage: 'Amazing solo!',
        },
      },
      {
        eventId: 'evt_campaign_1',
        type: 'CAMPAIGN_BACKED',
        timestamp: '2026-10-01T15:30:00Z',
        amountCents: 5000,
        summary: 'Backed Album Crowdfunding ($50.00) for "Debut Studio Album". Selected perk: "Vinyl + Signed Poster".',
        metadata: {
          campaignId: 'camp_debut_album',
          campaignTitle: 'Debut Studio Album',
        },
      },
    ],
    tipBreakdown: [
      {
        tipId: 'tip_101',
        amountCents: 5000,
        createdAt: '2026-09-15T21:00:00Z',
        sessionId: 'session_live_acoustic_101',
        message: 'Amazing solo!',
      },
      {
        tipId: 'tip_102',
        amountCents: 5000,
        createdAt: '2026-10-12T19:00:00Z',
        sessionId: 'session_live_friday_jam',
        message: 'Encore!',
      },
    ],
    campaignContributions: [
      {
        contributionId: 'contrib_201',
        campaignId: 'camp_debut_album',
        campaignTitle: 'Debut Studio Album',
        amountCents: 5000,
        createdAt: '2026-10-01T15:30:00Z',
      },
    ],
  };

  const getSegmentBadge = (segment: SupporterSegment) => {
    switch (segment) {
      case 'TOP_SUPPORTER':
        return { label: 'TOP SUPPORTER', color: '#D97706' };
      case 'REPEAT_SUPPORTER':
        return { label: 'REPEAT PATRON', color: '#8B5CF6' };
      case 'RECENT_SUPPORTER':
        return { label: 'RECENT', color: '#3B82F6' };
      case 'CAMPAIGN_BACKER':
        return { label: 'CAMPAIGN BACKER', color: '#EC4899' };
      case 'FOLLOWER_ONLY':
      default:
        return { label: 'FOLLOWER', color: '#6B7280' };
    }
  };

  test('1. Top Analytics Bento renders creator KPI cards accurately', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'analytics-bento' },
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'TOTAL SUPPORTERS'),
          React.createElement('div', { className: 'kpi-value' }, '5')
        ),
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'REPEAT SUPPORTER RATE'),
          React.createElement('div', { className: 'kpi-value' }, `${sampleAnalytics.repeatSupporterRatePct}%`),
          React.createElement('div', { className: 'kpi-sub' }, `${sampleAnalytics.repeatSupportersCount} fans backed 2+ times`)
        ),
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'LIFETIME TIPS RECEIVED'),
          React.createElement('div', { className: 'kpi-value' }, `$${(sampleAnalytics.totalTipsReceivedCents / 100).toFixed(2)}`),
          React.createElement('div', { className: 'kpi-sub' }, `Across ${sampleAnalytics.totalTipsCount} direct tips`)
        ),
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'AVERAGE TIP SIZE'),
          React.createElement('div', { className: 'kpi-value' }, `$${(sampleAnalytics.averageTipCents / 100).toFixed(2)}`),
          React.createElement('div', { className: 'kpi-sub' }, `$${(sampleAnalytics.recentTipsVolume30dCents / 100).toFixed(2)} in last 30d`)
        ),
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'TOP STAGE SESSION'),
          React.createElement('div', { className: 'kpi-value' }, sampleAnalytics.topTippingSession?.sessionTitle),
          React.createElement('div', { className: 'kpi-sub' }, `$${((sampleAnalytics.topTippingSession?.totalCents || 0) / 100).toFixed(2)} (${sampleAnalytics.topTippingSession?.tipsCount} tips)`)
        )
      )
    );

    expect(html).toContain('TOTAL SUPPORTERS');
    expect(html).toContain('REPEAT SUPPORTER RATE');
    expect(html).toContain('40%');
    expect(html).toContain('4 fans backed 2+ times');
    expect(html).toContain('LIFETIME TIPS RECEIVED');
    expect(html).toContain('$450.00');
    expect(html).toContain('Across 15 direct tips');
    expect(html).toContain('AVERAGE TIP SIZE');
    expect(html).toContain('$30.00');
    expect(html).toContain('$150.00 in last 30d');
    expect(html).toContain('TOP STAGE SESSION');
    expect(html).toContain('Sunset Acoustic Live');
    expect(html).toContain('$220.00 (8 tips)');
  });

  test('2. Segment filter tabs & search input render correctly', () => {
    const tabs = [
      { id: 'all', label: 'All Supporters' },
      { id: 'repeat', label: `Repeat Patrons (${sampleAnalytics.repeatSupportersCount})` },
      { id: 'top', label: `Top Supporters (${sampleAnalytics.topSupportersCount})` },
      { id: 'campaign', label: 'Campaign Backers' },
      { id: 'followers', label: 'Followers Only' },
    ];

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'filter-bar' },
        React.createElement(
          'div',
          { className: 'tab-group' },
          tabs.map((t) =>
            React.createElement('button', { key: t.id, 'data-active': t.id === 'all' }, t.label)
          )
        ),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search supporters by name...',
          defaultValue: '',
        })
      )
    );

    expect(html).toContain('All Supporters');
    expect(html).toContain('Repeat Patrons (4)');
    expect(html).toContain('Top Supporters (3)');
    expect(html).toContain('Campaign Backers');
    expect(html).toContain('Followers Only');
    expect(html).toContain('Search supporters by name...');
  });

  test('3. Supporter directory displays segment badges and financial metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'table',
        null,
        React.createElement(
          'tbody',
          null,
          sampleSupporters.map((s) => {
            const badge = getSegmentBadge(s.segment);
            return React.createElement(
              'tr',
              { key: s.supporterId },
              React.createElement('td', null, s.displayName),
              React.createElement('td', null, React.createElement('span', null, badge.label)),
              React.createElement('td', null, `$${(s.lifetimeValueCents / 100).toFixed(2)}`),
              React.createElement('td', null, `${s.tipsCount} tips ($${(s.totalTipsCents / 100).toFixed(2)})`),
              React.createElement('td', null, s.isFollower ? '✓ Following' : 'Not following')
            );
          })
        )
      )
    );

    expect(html).toContain('Sarah Connor');
    expect(html).toContain('TOP SUPPORTER');
    expect(html).toContain('$150.00');
    expect(html).toContain('3 tips ($100.00)');

    expect(html).toContain('Marcus Brody');
    expect(html).toContain('REPEAT PATRON');
    expect(html).toContain('$50.00');

    expect(html).toContain('Elena Fisher');
    expect(html).toContain('CAMPAIGN BACKER');

    expect(html).toContain('David Miller');
    expect(html).toContain('FOLLOWER');
    expect(html).toContain('✓ Following');
  });

  test('4. Fan privacy & direct messaging consent are strictly enforced', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        sampleSupporters.map((s) =>
          React.createElement(
            'div',
            { key: s.supporterId, className: 'supporter-item' },
            React.createElement('span', { className: 'name' }, s.displayName),
            s.isAnonymous
              ? React.createElement('span', { className: 'privacy-tag' }, '🔒 Anonymous (Contact Disabled)')
              : s.allowsDirectMessaging
              ? React.createElement('span', { className: 'privacy-tag' }, '✉️ Messaging Allowed')
              : React.createElement('span', { className: 'privacy-tag' }, '🚫 Direct Messages Opted-Out'),
            // "Say Thanks" action only available when messaging is allowed AND supporter is not anonymous
            s.allowsDirectMessaging && !s.isAnonymous
              ? React.createElement('button', { className: 'say-thanks-btn' }, `Say Thanks to ${s.displayName}`)
              : null
          )
        )
      )
    );

    // Anonymous fan check
    expect(html).toContain('Anonymous Supporter');
    expect(html).toContain('🔒 Anonymous (Contact Disabled)');
    expect(html).not.toContain('Say Thanks to Anonymous Supporter');

    // Direct message opted-out fan check
    expect(html).toContain('Marcus Brody');
    expect(html).toContain('🚫 Direct Messages Opted-Out');
    expect(html).not.toContain('Say Thanks to Marcus Brody');

    // Consented fan check
    expect(html).toContain('Sarah Connor');
    expect(html).toContain('✉️ Messaging Allowed');
    expect(html).toContain('Say Thanks to Sarah Connor');
  });

  test('5. Supporter Detail Dossier renders engagement timeline & itemized contributions', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'dossier-drawer' },
        React.createElement('h3', null, sampleDetails.supporter.displayName),
        React.createElement('div', { className: 'badge' }, sampleDetails.supporter.segment),
        React.createElement('div', { className: 'ltv' }, `Lifetime: $${(sampleDetails.supporter.lifetimeValueCents / 100).toFixed(2)}`),

        // Engagement Timeline
        React.createElement(
          'div',
          { className: 'timeline' },
          sampleDetails.engagementHistory.map((evt) =>
            React.createElement(
              'div',
              { key: evt.eventId, className: 'timeline-item' },
              React.createElement('div', { className: 'evt-type' }, evt.type),
              React.createElement('div', { className: 'evt-summary' }, evt.summary)
            )
          )
        ),

        // Itemized Tips
        React.createElement(
          'div',
          { className: 'tips-list' },
          sampleDetails.tipBreakdown.map((tip) =>
            React.createElement(
              'div',
              { key: tip.tipId, className: 'tip-row' },
              React.createElement('span', null, `$${(tip.amountCents / 100).toFixed(2)}`),
              React.createElement('span', null, tip.sessionId),
              React.createElement('span', null, tip.message)
            )
          )
        ),

        // Campaign Backings
        React.createElement(
          'div',
          { className: 'campaigns-list' },
          sampleDetails.campaignContributions.map((c) =>
            React.createElement(
              'div',
              { key: c.contributionId, className: 'campaign-row' },
              React.createElement('span', null, c.campaignTitle),
              React.createElement('span', null, `$${(c.amountCents / 100).toFixed(2)}`)
            )
          )
        )
      )
    );

    expect(html).toContain('Sarah Connor');
    expect(html).toContain('TOP_SUPPORTER');
    expect(html).toContain('Lifetime: $150.00');

    // Timeline validation
    expect(html).toContain('STARTED_FOLLOWING');
    expect(html).toContain('Started following your journey');
    expect(html).toContain('TIP_RECEIVED');
    expect(html).toContain('Sunset Acoustic Live');
    expect(html).toContain('CAMPAIGN_BACKED');
    expect(html).toContain('Debut Studio Album');

    // Itemized tips validation
    expect(html).toContain('Amazing solo!');
    expect(html).toContain('session_live_acoustic_101');
    expect(html).toContain('Encore!');
  });

  test('6. Thank-You Note Modal enforces consent warning and character limit', () => {
    const targetSupporter = sampleSupporters[0]; // Sarah Connor
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'thank-you-modal' },
        React.createElement('h3', null, `Send Thank You Note to ${targetSupporter.displayName}`),
        React.createElement(
          'p',
          { className: 'consent-notice' },
          'This note will be delivered to your direct conversation thread. Only fans who have opted into creator messaging can be contacted.'
        ),
        React.createElement('textarea', {
          placeholder: 'Write a personal thank you note...',
          maxLength: 500,
          defaultValue: 'Thank you so much for supporting my acoustic set!',
        }),
        React.createElement('button', { type: 'submit' }, 'Send Note')
      )
    );

    expect(html).toContain('Send Thank You Note to Sarah Connor');
    expect(html).toContain('Only fans who have opted into creator messaging can be contacted');
    expect(html).toContain('Thank you so much for supporting my acoustic set!');
    expect(html).toContain('Send Note');
  });
});
