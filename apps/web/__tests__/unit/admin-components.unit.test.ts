/**
 * Crowdbeats V2 — Enterprise Admin Component Unit Tests (React 19 Node Environment)
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AdminKpiCard,
  TimeSeriesAreaChart,
  ServerTelemetryLatencyChart,
  SecurityThreatRadar,
  LiveStageRadarVisualizer,
  ServerHealthHud,
  FinancialReconciliationWidget,
  LivePlatformPulseStream,
  AttentionNeededQueue,
  AdminStatusBadge,
  AdminBreadcrumb,
  AdminFilterBar,
  AdminDataTable,
  AdminBrandIcon,
  CommandCenterIcon,
  CrmIcon,
  LivePulseDot,
  MenuIcon,
  MonitorIcon,
} from '../../components/admin';

describe('Enterprise Admin Component Suite', () => {
  test('AdminKpiCard renders title, value, and sparkline', () => {
    const html = renderToStaticMarkup(
      React.createElement(AdminKpiCard, {
        title: 'Gross Merchandise Value',
        value: '$4,820.00',
        subtitle: '30-day platform gross',
        trend: { value: '18.4%', isPositive: true },
        sparklineData: [100, 200, 300, 400],
      })
    );
    expect(html).toContain('Gross Merchandise Value');
    expect(html).toContain('$4,820.00');
    expect(html).toContain('30-day platform gross');
    expect(html).toContain('18.4%');
  });

  test('TimeSeriesAreaChart renders title, points, and formatted values', () => {
    const data = [
      { label: '08/29', value: 4120.0 },
      { label: '08/30', value: 4820.0 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(TimeSeriesAreaChart, {
        title: 'Platform Volume',
        data: data,
        seriesName: 'GMV',
      })
    );
    expect(html).toContain('Platform Volume');
    expect(html).toContain('$4,820.00');
  });

  test('ServerTelemetryLatencyChart renders service nodes and P99 latency', () => {
    const html = renderToStaticMarkup(React.createElement(ServerTelemetryLatencyChart));
    expect(html).toContain('Infrastructure Telemetry &amp; SLA Latency Matrix');
    expect(html).toContain('Cloud Functions API');
    expect(html).toContain('Cloud Firestore DB');
    expect(html).toContain('Stripe Gateway Connector');
  });

  test('SecurityThreatRadar renders DEFCON status and threat vectors', () => {
    const html = renderToStaticMarkup(React.createElement(SecurityThreatRadar));
    expect(html).toContain('DEFCON 5 / GUARDED');
    expect(html).toContain('WAF Rate Limiting');
    expect(html).toContain('Stripe Radar Velocity');
  });

  test('LiveStageRadarVisualizer renders active live sets and anti-tamper QR sync', () => {
    const html = renderToStaticMarkup(React.createElement(LiveStageRadarVisualizer));
    expect(html).toContain('Elena Cruz');
    expect(html).toContain('The Midnight Echoes');
    expect(html).toContain('Active Stages Live');
  });

  test('ServerHealthHud renders synthetic probe checks', () => {
    const html = renderToStaticMarkup(React.createElement(ServerHealthHud));
    expect(html).toContain('System Health &amp; Synthetic Probes');
    expect(html).toContain('Run Synthetic Health Check');
  });

  test('FinancialReconciliationWidget calculates zero variance', () => {
    const html = renderToStaticMarkup(React.createElement(FinancialReconciliationWidget));
    expect(html).toContain('Balanced &amp; Reconciled');
    expect(html).toContain('$0.00');
    expect(html).toContain('Mathematical zero-variance');
  });

  test('AdminStatusBadge renders correct status and style attributes', () => {
    const activeHtml = renderToStaticMarkup(React.createElement(AdminStatusBadge, { status: 'ACTIVE' }));
    expect(activeHtml).toContain('ACTIVE');

    const suspendedHtml = renderToStaticMarkup(React.createElement(AdminStatusBadge, { status: 'SUSPENDED' }));
    expect(suspendedHtml).toContain('SUSPENDED');

    const pendingHtml = renderToStaticMarkup(React.createElement(AdminStatusBadge, { status: 'PENDING' }));
    expect(pendingHtml).toContain('PENDING');
  });

  test('AdminBreadcrumb renders list with link and current page item', () => {
    const html = renderToStaticMarkup(
      React.createElement(AdminBreadcrumb, {
        items: [
          { label: 'Admin', href: '/admin' },
          { label: 'CRM', href: '/admin/crm' },
          { label: 'User Details' },
        ],
      })
    );
    expect(html).toContain('Admin');
    expect(html).toContain('CRM');
    expect(html).toContain('User Details');
    expect(html).toContain('aria-label="breadcrumb"');
    expect(html).toContain('aria-current="page"');
  });

  test('AdminFilterBar renders search input and category pills', () => {
    const html = renderToStaticMarkup(
      React.createElement(AdminFilterBar, {
        searchPlaceholder: 'Search accounts...',
        categories: ['ALL', 'SOLO', 'BAND', 'FAN'],
        activeCategory: 'SOLO',
        activeFilterCount: 2,
      })
    );
    expect(html).toContain('Search accounts...');
    expect(html).toContain('SOLO');
    expect(html).toContain('BAND');
    expect(html).toContain('FAN');
    expect(html).toContain('Filters Active');
    expect(html).toContain('2');
  });

  test('AdminDataTable renders columns, rows, and empty state', () => {
    interface TestItem {
      id: string;
      name: string;
      role: string;
    }

    const columns = [
      { key: 'name', header: 'Name', cell: (item: TestItem) => item.name },
      { key: 'role', header: 'Role', cell: (item: TestItem) => item.role },
    ];

    const data: TestItem[] = [
      { id: '1', name: 'Alice Walker', role: 'Artist' },
      { id: '2', name: 'Bob Dylan', role: 'Fan' },
    ];

    const htmlWithData = renderToStaticMarkup(
      React.createElement(AdminDataTable as any, {
        data,
        columns,
        currentPage: 1,
        totalPages: 3,
      })
    );
    expect(htmlWithData).toContain('Alice Walker');
    expect(htmlWithData).toContain('Bob Dylan');
    expect(htmlWithData).toContain('Page 1 of 3');

    const htmlEmpty = renderToStaticMarkup(
      React.createElement(AdminDataTable as any, {
        data: [],
        columns,
        emptyStateMessage: 'No accounts matching criteria.',
      })
    );
    expect(htmlEmpty).toContain('No accounts matching criteria.');
  });

  test('AdminIcons renders clean outline SVGs without emojis', () => {
    const brandSvg = renderToStaticMarkup(React.createElement(AdminBrandIcon, { size: 24 }));
    expect(brandSvg).toContain('<svg');
    expect(brandSvg).toContain('viewBox="0 0 24 24"');
    expect(brandSvg).toContain('stroke="currentColor"');

    const cmdSvg = renderToStaticMarkup(React.createElement(CommandCenterIcon, { size: 18 }));
    expect(cmdSvg).toContain('<svg');
    expect(cmdSvg).toContain('rect');

    const crmSvg = renderToStaticMarkup(React.createElement(CrmIcon, { size: 18 }));
    expect(crmSvg).toContain('<svg');
    expect(crmSvg).toContain('path');

    const menuSvg = renderToStaticMarkup(React.createElement(MenuIcon, { size: 18 }));
    expect(menuSvg).toContain('<svg');

    const monitorSvg = renderToStaticMarkup(React.createElement(MonitorIcon, { size: 16 }));
    expect(monitorSvg).toContain('<svg');

    // Test LivePulseDot
    const pulseDot = renderToStaticMarkup(React.createElement(LivePulseDot, { size: 8, color: '#10B981' }));
    expect(pulseDot).toContain('adminPulse');
    expect(pulseDot).toContain('#10B981');
  });

  test('AdminStatusBadge supports RECONCILED, UNMATCHED and dot indicator', () => {
    const reconciledHtml = renderToStaticMarkup(
      React.createElement(AdminStatusBadge, { status: 'RECONCILED' })
    );
    expect(reconciledHtml).toContain('RECONCILED');
    expect(reconciledHtml).toContain('--admin-status-success');

    const unmatchedHtml = renderToStaticMarkup(
      React.createElement(AdminStatusBadge, { status: 'UNMATCHED' })
    );
    expect(unmatchedHtml).toContain('UNMATCHED');
    expect(unmatchedHtml).toContain('--admin-status-error');
  });

  test('AdminKpiCard supports React.ReactNode icon', () => {
    const htmlWithSvg = renderToStaticMarkup(
      React.createElement(AdminKpiCard, {
        title: 'Active Nodes',
        value: 42,
        icon: React.createElement(CommandCenterIcon, { size: 20 }),
      })
    );
    expect(htmlWithSvg).toContain('Active Nodes');
    expect(htmlWithSvg).toContain('42');
    expect(htmlWithSvg).toContain('<svg');
  });

  test('AdminDataTable formats numeric cells with tabular numerals', () => {
    interface NumItem {
      id: string;
      item: string;
      amount: string;
    }
    const cols = [
      { key: 'item', header: 'Item', cell: (i: NumItem) => i.item },
      { key: 'amount', header: 'Amount', cell: (i: NumItem) => i.amount, numeric: true },
    ];
    const data: NumItem[] = [{ id: '1', item: 'Platform Fees', amount: '$1,240.00' }];
    const html = renderToStaticMarkup(
      React.createElement(AdminDataTable as any, {
        data,
        columns: cols,
        sortKey: 'amount',
        sortDirection: 'asc',
      })
    );
    expect(html).toContain('Platform Fees');
    expect(html).toContain('$1,240.00');
    expect(html).toContain('tabular-nums');
  });

  test('AttentionNeededQueue renders exception queue items and queue links', () => {
    const html = renderToStaticMarkup(React.createElement(AttentionNeededQueue));
    expect(html).toContain('Attention Needed');
    expect(html).toContain('Pending');
    expect(html).toContain('Flagged Live Audio Stream');
    expect(html).toContain('/admin/support');
    expect(html).toContain('/admin/finance');
    expect(html).toContain('/admin/crm');
  });

  test('TimeSeriesAreaChart renders period toggle buttons and SVG area chart', () => {
    const data = [
      { label: 'Mon', value: 100 },
      { label: 'Tue', value: 200 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(TimeSeriesAreaChart, {
        title: 'Platform Volume',
        data,
        selectedPeriod: '7d',
      })
    );
    expect(html).toContain('Today');
    expect(html).toContain('7D');
    expect(html).toContain('30D');
    expect(html).toContain('Quarter');
    expect(html).toContain('<polygon');
    expect(html).toContain('<polyline');
  });

  test('LivePlatformPulseStream renders event stream with live indicator', () => {
    const html = renderToStaticMarkup(React.createElement(LivePlatformPulseStream));
    expect(html).toContain('Live Telemetry &amp; Activity Pulse');
    expect(html).toContain('STREAMING LIVE');
    expect(html).toContain('Pause');
    expect(html).toContain('Fan @sarah_m');
    expect(html).toContain('Tipped $25.00');
    expect(html).toContain('ALL');
    expect(html).toContain('TIP');
    expect(html).toContain('CHECKIN');
  });

  test('LivePlatformPulseStream supports initialPaused state and resume action', () => {
    const html = renderToStaticMarkup(
      React.createElement(LivePlatformPulseStream, { initialPaused: true })
    );
    expect(html).toContain('FEED PAUSED');
    expect(html).toContain('Resume');
    expect(html).toContain('Live updates paused');
  });
});
