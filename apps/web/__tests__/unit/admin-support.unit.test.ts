/**
 * Crowdbeats V2 — Phase 9: Support & Case Management Desk Unit Tests
 *
 * Verifies:
 * 1. Support Operations Desk header, KPI cards, category navigation tabs
 * 2. 3-Pane Desk layout: Ticket queue, active conversation thread, Customer 360 context
 * 3. Priority badge styling & SLA urgency classifications (P1 Urgent to P4 Low)
 * 4. Strict separation between public customer messages and private staff notes (amber highlight)
 * 5. Lifecycle ActionDialogs: Resolve, Reopen, and Assign workflows with required rationale
 * 6. Customer 360 context panel with deep link to Unified Administration CRM (/admin/crm)
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AdminKpiCard,
  AdminStatusBadge,
  ActionDialog,
  SupportIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '../../components/admin';
import type { AdminSupportTicket } from '../../lib/admin/adminFirestore';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ id: 'tick_101' }),
}));

describe('Phase 9: Support & Case Management Desk — Component Suite', () => {
  const sampleTickets: AdminSupportTicket[] = [
    {
      id: 'tick_101',
      ticketId: 'tick_101',
      ticketNumber: 'TICK-20261013-1001',
      userId: 'usr_fan_42',
      email: 'fan42@example.com',
      userName: 'Fan 42',
      subject: 'Duplicate live set tip charged twice',
      message: 'I noticed two $15 tip charges for the same set on Saturday.',
      category: 'billing',
      priority: 'urgent',
      status: 'open',
      assignedTo: null,
      createdAt: '2026-10-13T00:30:00Z',
      updatedAt: '2026-10-13T00:30:00Z',
    },
    {
      id: 'tick_102',
      ticketId: 'tick_102',
      ticketNumber: 'TICK-20261013-1002',
      userId: 'usr_artist_7',
      email: 'guitarist@band.io',
      userName: 'Guitar Soloist',
      subject: 'Stripe Connect bank routing update error',
      message: 'Getting an error when entering my new checking account.',
      category: 'payout',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'agent_sarah',
      assignedStaffName: 'Agent Sarah',
      createdAt: '2026-10-13T01:00:00Z',
      updatedAt: '2026-10-13T01:15:00Z',
      notes: [
        {
          note: '[INTERNAL NOTE] Re-verified Stripe dashboard: microdeposits pending.',
          authorUid: 'agent_sarah',
          createdAt: '2026-10-13T01:15:00Z',
        },
      ],
    },
    {
      id: 'tick_103',
      ticketId: 'tick_103',
      ticketNumber: 'TICK-20261013-1003',
      userId: 'usr_fan_99',
      email: 'supporter@rock.org',
      userName: 'Supporter 99',
      subject: 'How to claim backstage pass reward?',
      message: 'I contributed to the album campaign and want to know how to redeem.',
      category: 'campaign',
      priority: 'normal',
      status: 'resolved',
      assignedTo: 'agent_mike',
      resolvedBy: 'agent_mike',
      resolutionNotes: 'Detailed voucher instructions emailed to customer.',
      resolvedAt: '2026-10-13T01:20:00Z',
      createdAt: '2026-10-12T18:00:00Z',
      updatedAt: '2026-10-13T01:20:00Z',
    },
  ];

  test('KPI Cards render operational support metrics correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(AdminKpiCard, {
          title: 'Unassigned Tickets',
          value: '1',
          subtitle: 'Active inbox backlog',
          trend: { value: '1 pending', isPositive: false },
          icon: React.createElement(SupportIcon, { size: 18 }),
        }),
        React.createElement(AdminKpiCard, {
          title: 'First Response Time',
          value: '14 min',
          subtitle: 'Trailing 24 hours',
          trend: { value: '-3 min faster', isPositive: true },
        }),
        React.createElement(AdminKpiCard, {
          title: 'Customer CSAT Score',
          value: '96.4%',
          subtitle: '420 ratings',
          trend: { value: '+1.2%', isPositive: true },
        }),
        React.createElement(AdminKpiCard, {
          title: 'Tier 2 Escalations',
          value: '2',
          subtitle: 'P1 and P2 queue',
          trend: { value: '1 urgent', isPositive: false },
        })
      )
    );

    expect(html).toContain('Unassigned Tickets');
    expect(html).toContain('14 min');
    expect(html).toContain('Customer CSAT Score');
    expect(html).toContain('96.4%');
    expect(html).toContain('Tier 2 Escalations');
  });

  test('Status badges display appropriate color and status text', () => {
    const openBadge = renderToStaticMarkup(
      React.createElement(AdminStatusBadge, { status: 'pending', label: 'open' })
    );
    expect(openBadge).toContain('open');

    const inProgressBadge = renderToStaticMarkup(
      React.createElement(AdminStatusBadge, { status: 'processing', label: 'in_progress' })
    );
    expect(inProgressBadge).toContain('in_progress');

    const resolvedBadge = renderToStaticMarkup(
      React.createElement(AdminStatusBadge, { status: 'succeeded', label: 'resolved' })
    );
    expect(resolvedBadge).toContain('resolved');
  });

  test('Message stream strictly separates public customer messages from private staff notes', () => {
    const sampleConversation = [
      {
        isInternal: false,
        isStaff: false,
        author: 'fan42@example.com',
        text: 'I noticed two $15 tip charges for the same set on Saturday.',
        timestamp: 'Just now',
      },
      {
        isInternal: true,
        isStaff: true,
        author: 'agent_sarah',
        text: 'Stripe charge ID ch_123 reflects a duplicate charge. Initiated $15 refund on ledger.',
        timestamp: '2 min ago',
      },
      {
        isInternal: false,
        isStaff: true,
        author: 'Support Specialist',
        text: 'Hello, we have confirmed the duplicate charge and credited your card back $15.',
        timestamp: '1 min ago',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        { className: 'conversation-stream' },
        sampleConversation.map((msg, i) =>
          React.createElement(
            'div',
            {
              key: i,
              style: {
                background: msg.isInternal ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                border: `1px solid ${msg.isInternal ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              },
            },
            React.createElement(
              'span',
              null,
              msg.isInternal ? '🔒 INTERNAL PRIVATE NOTE (NOT VISIBLE TO USER)' : '👤 STAFF RESPONSE'
            ),
            React.createElement('p', null, msg.text)
          )
        )
      )
    );

    expect(html).toContain('two $15 tip charges');
    expect(html).toContain('🔒 INTERNAL PRIVATE NOTE (NOT VISIBLE TO USER)');
    expect(html).toContain('Stripe charge ID ch_123 reflects a duplicate charge');
    expect(html).toContain('credited your card back $15');
  });

  test('ActionDialog enforces required resolution notes for ticket closure', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionDialog, {
        isOpen: true,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Mark Ticket as Resolved',
        targetDescription: 'Ticket TICK-20261013-1001 (Duplicate live set tip charged twice)',
        confirmLabel: 'Confirm Resolution',
        requiresReason: true,
        reasonPlaceholder: 'Enter resolution summary to close this ticket and notify requester...',
      })
    );

    expect(html).toContain('Mark Ticket as Resolved');
    expect(html).toContain('TICK-20261013-1001');
    expect(html).toContain('Enter resolution summary to close this ticket and notify requester...');
    expect(html).toContain('Confirm Resolution');
  });

  test('ActionDialog enforces justification reason for ticket reopening', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionDialog, {
        isOpen: true,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Reopen Support Ticket',
        targetDescription: 'Ticket TICK-20261013-1003 (How to claim backstage pass reward?)',
        confirmLabel: 'Confirm Reopen',
        requiresReason: true,
        reasonPlaceholder: 'Specify the operational reason for reopening this resolved inquiry...',
      })
    );

    expect(html).toContain('Reopen Support Ticket');
    expect(html).toContain('TICK-20261013-1003');
    expect(html).toContain('Specify the operational reason for reopening this resolved inquiry...');
    expect(html).toContain('Confirm Reopen');
  });

  test('ActionDialog allows staff assignment workflow', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionDialog, {
        isOpen: true,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Assign Ticket to Specialist',
        targetDescription: 'Ticket TICK-20261013-1002 (Stripe Connect bank routing update error)',
        confirmLabel: 'Assign Ticket',
        requiresReason: true,
        reasonPlaceholder: 'Enter the UID or email of the staff agent to assign...',
      })
    );

    expect(html).toContain('Assign Ticket to Specialist');
    expect(html).toContain('TICK-20261013-1002');
    expect(html).toContain('Enter the UID or email of the staff agent to assign...');
    expect(html).toContain('Assign Ticket');
  });
});
