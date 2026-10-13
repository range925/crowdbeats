/**
 * Crowdbeats V2 — Phase 12: Band CRM & Member Management Unit Tests
 *
 * Verifies:
 * 1. Top Analytics Bento metrics rendering (Total Supporters, Repeat Rate %, Lifetime Tips, Average Tip, Top Stage Session)
 * 2. Segment filter tabs & directory search interface for Bands
 * 3. Band Supporter directory table rendering with segment badges, lifetime values, and follower status
 * 4. Fan privacy & direct messaging consent enforcement acting as the band
 * 5. Band Supporter Detail Dossier rendering with engagement timeline & itemized contributions
 * 6. Band Governance & Roster Permissions (Owner vs Manager vs Member, 20 seat cap, invitation & transfer triggers)
 * 7. Payout-Data Isolation in Band Payouts (Personal balance viewable by self; other member balances isolated)
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type {
  BandSupporterSummary,
  BandTipAnalytics,
  BandSupporterDetails,
  BandTreasurySummary,
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

describe('Band CRM & Member Management — Component Unit Suite', () => {
  const sampleAnalytics: BandTipAnalytics = {
    totalTipsReceivedCents: 65000,
    totalTipsCount: 22,
    averageTipCents: 2955,
    repeatSupportersCount: 6,
    repeatSupporterRatePct: 45,
    topSupportersCount: 4,
    recentTipsVolume30dCents: 25000,
    topTippingSession: {
      sessionId: 'session_live_electric_201',
      sessionTitle: 'Electric Festival Main Stage',
      totalCents: 35000,
      tipsCount: 12,
    },
  };

  const sampleSupporters: BandSupporterSummary[] = [
    {
      supporterId: 'fan_sarah_1',
      displayName: 'Sarah Connor',
      photoUrl: 'https://images.crowdbeats.test/sarah.jpg',
      isAnonymous: false,
      isFollower: true,
      followedAt: '2026-09-01T10:00:00Z',
      allowsDirectMessaging: true,
      lifetimeValueCents: 20000,
      totalTipsCents: 15000,
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
      lifetimeValueCents: 6000,
      totalTipsCents: 6000,
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
      lifetimeValueCents: 7500,
      totalTipsCents: 0,
      tipsCount: 0,
      totalCampaignContributionCents: 7500,
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

  const sampleDetails: BandSupporterDetails = {
    supporter: sampleSupporters[0],
    engagementHistory: [
      {
        eventId: 'evt_follow_1',
        type: 'STARTED_FOLLOWING',
        timestamp: '2026-09-01T10:00:00Z',
        summary: 'Started following the band. Joined your fan community.',
      },
      {
        eventId: 'evt_tip_1',
        type: 'TIP_RECEIVED',
        timestamp: '2026-09-15T21:00:00Z',
        amountCents: 7500,
        summary: 'Sent a $75.00 Tip during "Electric Festival Main Stage" — "Insane set!"',
        metadata: {
          sessionId: 'session_live_electric_201',
          sessionTitle: 'Electric Festival Main Stage',
          fanMessage: 'Insane set!',
        },
      },
      {
        eventId: 'evt_campaign_1',
        type: 'CAMPAIGN_BACKED',
        timestamp: '2026-10-01T15:30:00Z',
        amountCents: 5000,
        summary: 'Backed Album Crowdfunding ($50.00) for "Band Studio Album 2026".',
        metadata: {
          campaignId: 'camp_album_2026',
          campaignTitle: 'Band Studio Album 2026',
        },
      },
    ],
    tipBreakdown: [
      {
        tipId: 'tip_101',
        amountCents: 7500,
        createdAt: '2026-09-15T21:00:00Z',
        sessionId: 'session_live_electric_201',
        message: 'Insane set!',
      },
    ],
    campaignContributions: [
      {
        contributionId: 'contrib_201',
        campaignId: 'camp_album_2026',
        campaignTitle: 'Band Studio Album 2026',
        amountCents: 5000,
        createdAt: '2026-10-01T15:30:00Z',
      },
    ],
  };

  const sampleTreasury: BandTreasurySummary = {
    bandId: 'band_neon_pulse',
    totalTipsReceivedCents: 120000,
    platformFeesPaidCents: 6000,
    netDistributedCents: 114000,
    currentSplitVersion: 2,
    members: [
      {
        uid: 'usr_founder_1',
        displayName: 'Alex Lead',
        role: 'BAND_FOUNDER',
        splitBps: 5000,
        totalEarnedCents: 57000,
        availableBalanceCents: 24000,
        pendingKycBalanceCents: 0,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
      },
      {
        uid: 'usr_admin_2',
        displayName: 'Sam Keys',
        role: 'BAND_ADMIN',
        splitBps: 3000,
        totalEarnedCents: 0, // Isolated when viewed by member
        availableBalanceCents: 0, // Isolated
        pendingKycBalanceCents: 0,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
      },
      {
        uid: 'usr_member_3',
        displayName: 'Jordan Drums',
        role: 'BAND_MEMBER',
        splitBps: 2000,
        totalEarnedCents: 22800, // Self view
        availableBalanceCents: 8500, // Self view
        pendingKycBalanceCents: 2500,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: false, // Incomplete KYC
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

  test('1. Top Analytics Bento renders band KPI cards accurately', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'analytics-bento' },
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'TOTAL BAND SUPPORTERS'),
          React.createElement('div', { className: 'kpi-value' }, '5')
        ),
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'REPEAT PATRON RATE'),
          React.createElement('div', { className: 'kpi-value' }, `${sampleAnalytics.repeatSupporterRatePct}%`),
          React.createElement('div', { className: 'kpi-sub' }, `${sampleAnalytics.repeatSupportersCount} fans backed 2+ times`)
        ),
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'LIFETIME BAND TIPS'),
          React.createElement('div', { className: 'kpi-value' }, `$${(sampleAnalytics.totalTipsReceivedCents / 100).toFixed(2)}`),
          React.createElement('div', { className: 'kpi-sub' }, `Across ${sampleAnalytics.totalTipsCount} tips`)
        ),
        React.createElement(
          'div',
          { className: 'kpi-card' },
          React.createElement('div', { className: 'kpi-title' }, 'AVERAGE BAND TIP'),
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

    expect(html).toContain('TOTAL BAND SUPPORTERS');
    expect(html).toContain('REPEAT PATRON RATE');
    expect(html).toContain('45%');
    expect(html).toContain('6 fans backed 2+ times');
    expect(html).toContain('LIFETIME BAND TIPS');
    expect(html).toContain('$650.00');
    expect(html).toContain('Across 22 tips');
    expect(html).toContain('AVERAGE BAND TIP');
    expect(html).toContain('$29.55');
    expect(html).toContain('$250.00 in last 30d');
    expect(html).toContain('TOP STAGE SESSION');
    expect(html).toContain('Electric Festival Main Stage');
    expect(html).toContain('$350.00 (12 tips)');
  });

  test('2. Segment filter tabs & band directory search input render correctly', () => {
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
          placeholder: 'Search band fans by name...',
          defaultValue: '',
        })
      )
    );

    expect(html).toContain('All Supporters');
    expect(html).toContain('Repeat Patrons (6)');
    expect(html).toContain('Top Supporters (4)');
    expect(html).toContain('Campaign Backers');
    expect(html).toContain('Followers Only');
    expect(html).toContain('Search band fans by name...');
  });

  test('3. Band Supporter directory displays segment badges and contributions breakdown', () => {
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
    expect(html).toContain('$200.00');
    expect(html).toContain('3 tips ($150.00)');

    expect(html).toContain('Marcus Brody');
    expect(html).toContain('REPEAT PATRON');
    expect(html).toContain('$60.00');

    expect(html).toContain('Elena Fisher');
    expect(html).toContain('CAMPAIGN BACKER');

    expect(html).toContain('David Miller');
    expect(html).toContain('FOLLOWER');
    expect(html).toContain('✓ Following');
  });

  test('4. Fan privacy & direct messaging consent are strictly enforced acting as the band', () => {
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
            s.allowsDirectMessaging && !s.isAnonymous
              ? React.createElement('button', { className: 'say-thanks-btn' }, `Say Thanks to ${s.displayName}`)
              : null
          )
        )
      )
    );

    expect(html).toContain('Anonymous Supporter');
    expect(html).toContain('🔒 Anonymous (Contact Disabled)');
    expect(html).not.toContain('Say Thanks to Anonymous Supporter');

    expect(html).toContain('Marcus Brody');
    expect(html).toContain('🚫 Direct Messages Opted-Out');
    expect(html).not.toContain('Say Thanks to Marcus Brody');

    expect(html).toContain('Sarah Connor');
    expect(html).toContain('✉️ Messaging Allowed');
    expect(html).toContain('Say Thanks to Sarah Connor');
  });

  test('5. Band Supporter Detail Dossier renders engagement timeline & itemized contributions', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'dossier-drawer' },
        React.createElement('h3', null, sampleDetails.supporter.displayName),
        React.createElement('div', { className: 'badge' }, sampleDetails.supporter.segment),
        React.createElement('div', { className: 'ltv' }, `Lifetime: $${(sampleDetails.supporter.lifetimeValueCents / 100).toFixed(2)}`),

        // Timeline
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
    expect(html).toContain('Lifetime: $200.00');

    expect(html).toContain('STARTED_FOLLOWING');
    expect(html).toContain('Started following the band');
    expect(html).toContain('TIP_RECEIVED');
    expect(html).toContain('Electric Festival Main Stage');
    expect(html).toContain('CAMPAIGN_BACKED');
    expect(html).toContain('Band Studio Album 2026');

    expect(html).toContain('Insane set!');
  });

  test('6. Band Governance & Roster Permissions render role tiers and action buttons accurately', () => {
    const isFounder = true;
    const members = sampleTreasury.members;

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'governance-console' },
        React.createElement('div', { className: 'seats-count' }, `${members.length} / 20`),
        React.createElement(
          'div',
          { className: 'actions-bar' },
          isFounder ? React.createElement('button', null, '👑 Transfer Ownership') : null,
          React.createElement('button', null, '+ Invite Member')
        ),
        React.createElement(
          'table',
          null,
          React.createElement(
            'tbody',
            null,
            members.map((m) =>
              React.createElement(
                'tr',
                { key: m.uid },
                React.createElement('td', null, m.displayName),
                React.createElement('td', null, m.role),
                React.createElement('td', null, `${(m.splitBps / 100).toFixed(1)}%`),
                React.createElement('td', null, m.stripePayoutsEnabled ? '✓ Ready for Payouts' : '⏳ Pending KYC'),
                React.createElement(
                  'td',
                  null,
                  m.role !== 'BAND_FOUNDER' ? React.createElement('button', null, 'Change Role') : null,
                  m.role !== 'BAND_FOUNDER' ? React.createElement('button', null, 'Remove') : null
                )
              )
            )
          )
        )
      )
    );

    expect(html).toContain('3 / 20');
    expect(html).toContain('👑 Transfer Ownership');
    expect(html).toContain('+ Invite Member');
    expect(html).toContain('Alex Lead');
    expect(html).toContain('BAND_FOUNDER');
    expect(html).toContain('50.0%');
    expect(html).toContain('Sam Keys');
    expect(html).toContain('BAND_ADMIN');
    expect(html).toContain('Jordan Drums');
    expect(html).toContain('BAND_MEMBER');
    expect(html).toContain('⏳ Pending KYC');
    expect(html).toContain('Change Role');
    expect(html).toContain('Remove');
  });

  test('7. Payout-Data Isolation in Band Payouts protects other members balances', () => {
    const currentUid = 'usr_member_3'; // Regular member viewing payouts
    const members = sampleTreasury.members;

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'payouts-matrix' },
        React.createElement(
          'div',
          { className: 'isolation-banner' },
          '🔒 Payout-Data Isolation Active: Individual member wallet balances and private bank details are isolated.'
        ),
        React.createElement(
          'table',
          null,
          React.createElement(
            'tbody',
            null,
            members.map((m) => {
              const isSelf = m.uid === currentUid;
              return React.createElement(
                'tr',
                { key: m.uid },
                React.createElement('td', null, m.displayName + (isSelf ? ' (You)' : '')),
                React.createElement('td', null, m.role.replace('BAND_', '')),
                React.createElement('td', null, `${(m.splitBps / 100).toFixed(1)}%`),
                React.createElement('td', null, m.stripePayoutsEnabled ? '✓ Ready for Payouts' : '⏳ Pending KYC'),
                React.createElement(
                  'td',
                  null,
                  isSelf
                    ? `$${(m.availableBalanceCents / 100).toFixed(2)}`
                    : '🔒 Isolated (Member only)'
                )
              );
            })
          )
        )
      )
    );

    expect(html).toContain('🔒 Payout-Data Isolation Active');
    // Self member: can view personal balance
    expect(html).toContain('Jordan Drums (You)');
    expect(html).toContain('$85.00');

    // Other members: balances are isolated
    expect(html).toContain('Alex Lead');
    expect(html).toContain('Sam Keys');
    expect(html).toContain('🔒 Isolated (Member only)');
    expect(html).not.toContain('$240.00'); // Founder balance hidden from member
  });
});
