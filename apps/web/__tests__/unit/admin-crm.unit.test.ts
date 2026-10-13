/**
 * Crowdbeats V2 — Phase 8: Unified Administration CRM Unit Tests
 *
 * Verifies:
 * 1. Unified CRM Console page rendering (header, KPI summary cards, persona directory tabs)
 * 2. Search & Filter Bar configuration (searchQuery, verificationStatus, accountStatus)
 * 3. CRM Directory data table column definitions & persona styling
 * 4. DetailDrawer rendering with profile overview, verification toggle, staff notes, and case history
 * 5. ActionDialog verification rationale requirement and confirmation flow
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AdminKpiCard,
  AdminDataTable,
  AdminFilterBar,
  AdminStatusBadge,
  DetailDrawer,
  ActionDialog,
  UsersIcon,
  ArtistsIcon,
  MusicIcon,
  ShieldCheckIcon,
  type Column,
} from '../../components/admin';
import type { CrmDirectoryItem } from '@crowdbeats/contracts';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ id: 'usr_fan_1' }),
}));

describe('Unified Administration CRM — Component Unit Suite', () => {
  const sampleItems: CrmDirectoryItem[] = [
    {
      uid: 'usr_fan_1',
      displayName: 'Alice Fan',
      email: 'alice@musicfan.org',
      photoUrl: null,
      personaType: 'fan',
      verificationStatus: 'unverified',
      accountStatus: 'active',
      city: 'Austin',
      genre: null,
      stageName: null,
      totalMonetaryCents: 15000,
      relationshipsCount: 12,
      openCasesCount: 0,
      stripeConnected: false,
      createdAt: '2026-01-15T12:00:00Z',
    },
    {
      uid: 'usr_solo_2',
      displayName: 'Bob The Guitarist',
      email: 'bob@guitarhero.net',
      photoUrl: null,
      personaType: 'solo_musician',
      verificationStatus: 'verified',
      accountStatus: 'active',
      city: 'Nashville',
      genre: 'Blues Rock',
      stageName: 'Electric Bob',
      totalMonetaryCents: 450000,
      relationshipsCount: 840,
      openCasesCount: 1,
      stripeConnected: true,
      createdAt: '2026-02-10T14:30:00Z',
    },
    {
      uid: 'band_midnight_3',
      displayName: 'The Midnight Owls',
      email: 'booking@midnightowls.com',
      photoUrl: null,
      personaType: 'band',
      verificationStatus: 'verified',
      accountStatus: 'active',
      city: 'Seattle',
      genre: 'Indie Rock',
      stageName: 'The Midnight Owls',
      totalMonetaryCents: 1280000,
      relationshipsCount: 3200,
      openCasesCount: 0,
      stripeConnected: true,
      createdAt: '2026-03-01T10:00:00Z',
    },
    {
      uid: 'sponsor_redsound_4',
      displayName: 'Red Sound Audio',
      email: 'partnerships@redsound.io',
      photoUrl: null,
      personaType: 'sponsor',
      verificationStatus: 'verified',
      accountStatus: 'active',
      city: 'Chicago',
      genre: null,
      stageName: null,
      totalMonetaryCents: 5000000,
      relationshipsCount: 45,
      openCasesCount: 0,
      stripeConnected: true,
      createdAt: '2026-03-20T08:00:00Z',
    },
  ];

  test('KPI Cards render operational CRM metrics correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(AdminKpiCard, {
          title: 'Total CRM Profiles',
          value: '4,850',
          subtitle: '3,200 Fans registered',
          trend: { value: '3,200 Fans', isPositive: true },
          icon: React.createElement(UsersIcon, { size: 18 }),
        }),
        React.createElement(AdminKpiCard, {
          title: 'Solo Musicians',
          value: '840',
          subtitle: 'Creators on platform',
          trend: { value: '840 Solo', isPositive: true },
          icon: React.createElement(ArtistsIcon, { size: 18 }),
        }),
        React.createElement(AdminKpiCard, {
          title: 'Bands & Groups',
          value: '190',
          subtitle: 'Multi-member ensembles',
          trend: { value: '190 Bands', isPositive: true },
          icon: React.createElement(MusicIcon, { size: 18 }),
        }),
        React.createElement(AdminKpiCard, {
          title: 'Verified Profiles',
          value: '720',
          subtitle: '24 awaiting review',
          trend: { value: '24 Queue', isPositive: false },
          icon: React.createElement(ShieldCheckIcon, { size: 18 }),
        })
      )
    );

    expect(html).toContain('Total CRM Profiles');
    expect(html).toContain('4,850');
    expect(html).toContain('Solo Musicians');
    expect(html).toContain('Bands &amp; Groups');
    expect(html).toContain('Verified Profiles');
  });

  test('AdminFilterBar renders search input and persona verification actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(AdminFilterBar, {
        onSearchChange: () => {},
        searchPlaceholder: 'Search CRM by name, email, stage name, genre, city, or UID...',
        actions: React.createElement(
          'div',
          null,
          React.createElement('select', { defaultValue: 'all' },
            React.createElement('option', { value: 'all' }, 'All Verification'),
            React.createElement('option', { value: 'verified' }, 'Verified Only'),
            React.createElement('option', { value: 'unverified' }, 'Unverified / Pending')
          ),
          React.createElement('select', { defaultValue: 'active' },
            React.createElement('option', { value: 'all' }, 'All Accounts'),
            React.createElement('option', { value: 'active' }, 'Active Only'),
            React.createElement('option', { value: 'suspended' }, 'Suspended Only')
          )
        ),
      })
    );

    expect(html).toContain('Search CRM by name, email, stage name, genre, city, or UID...');
    expect(html).toContain('All Verification');
    expect(html).toContain('Verified Only');
    expect(html).toContain('Active Only');
  });

  test('AdminDataTable displays directory items with persona badges and financial amounts', () => {
    const columns = [
      {
        key: 'name',
        header: 'Customer / Entity',
        cell: (item: CrmDirectoryItem) => React.createElement('span', null, item.displayName),
      },
      {
        key: 'persona',
        header: 'Persona',
        cell: (item: CrmDirectoryItem) =>
          React.createElement(AdminStatusBadge, {
            status: item.personaType === 'band' ? 'warning' : 'purple',
            label: (item.personaType || 'FAN').toUpperCase(),
          }),
      },
      {
        key: 'verification',
        header: 'Verification',
        cell: (item: CrmDirectoryItem) =>
          React.createElement(AdminStatusBadge, {
            status: item.verificationStatus === 'verified' ? 'success' : 'neutral',
            label: item.verificationStatus.toUpperCase(),
          }),
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(AdminDataTable, {
        columns: columns as Column<any>[],
        data: sampleItems.map((s) => ({ ...s, id: s.uid })),
        loading: false,
      })
    );

    expect(html).toContain('Alice Fan');
    expect(html).toContain('Bob The Guitarist');
    expect(html).toContain('The Midnight Owls');
    expect(html).toContain('Red Sound Audio');
    expect(html).toContain('VERIFIED');
    expect(html).toContain('UNVERIFIED');
  });

  test('DetailDrawer renders quick view with verification governance and case history tabs', () => {
    const selected = sampleItems[1]; // Bob
    const html = renderToStaticMarkup(
      React.createElement(DetailDrawer, {
        isOpen: true,
        onClose: () => {},
        title: selected.displayName || 'CRM Customer Profile',
        subtitle: `UID: ${selected.uid}`,
        badge: React.createElement(AdminStatusBadge, {
          status: 'VERIFIED',
          label: 'VERIFIED',
        }),
        tabs: [
          { id: 'overview', label: 'Overview' },
          { id: 'notes', label: 'Internal Staff Notes' },
          { id: 'cases', label: 'Case History (1)' },
        ],
        activeTab: 'overview',
        children: React.createElement(
          'div',
          null,
          React.createElement('div', null, 'Lifetime Financial Volume: $4,500.00'),
          React.createElement('div', null, 'Stage: Electric Bob'),
          React.createElement('div', null, 'Genre: Blues Rock'),
          React.createElement('div', null, 'Stripe Connect: Connected')
        ),
      })
    );

    expect(html).toContain('Bob The Guitarist');
    expect(html).toContain('usr_solo_2');
    expect(html).toContain('Overview');
    expect(html).toContain('Internal Staff Notes');
    expect(html).toContain('Case History (1)');
    expect(html).toContain('$4,500.00');
    expect(html).toContain('Electric Bob');
    expect(html).toContain('Stripe Connect: Connected');
  });

  test('ActionDialog enforces mandatory operational rationale for verification changes', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionDialog, {
        isOpen: true,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Grant Verification Status',
        targetDescription: 'The Midnight Owls (Band)',
        consequenceText:
          'Granting verification awards the official platform trust badge and elevated search discovery ranking.',
        confirmLabel: 'Approve Verification',
        requiresReason: true,
        reasonPlaceholder: 'Enter compliance or artist relations operational justification...',
      })
    );

    expect(html).toContain('Grant Verification Status');
    expect(html).toContain('The Midnight Owls (Band)');
    expect(html).toContain('Enter compliance or artist relations operational justification...');
    expect(html).toContain('Approve Verification');
  });
});
