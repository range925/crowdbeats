/**
 * Crowdbeats V2 — Component Gallery Page (Phase 4)
 * Route: /gallery
 * Responsive: 375px → 768px → 1280px → 1440px
 */

'use client';

import React, { useState } from 'react';
import {
  CbButton,
  CbInput,
  CbCard,
  CbAvatar,
  CbStatusBadge,
  CbSkeleton,
  CbToastProvider,
  useToast,
  CbBanner,
  CbModal,
  CbDrawer,
  CbEmptyState,
  CbErrorState,
  CbTable,
  CbConfirmationModal,
  CbAmountSelector,
  CbProgressBar,
  CbMiniChart,
  CbLiveStageChip,
  CbBottomNav,
} from '@/components/ui';
import type { CbStatusType } from '@/components/ui';

// Separate component so useToast can access provider context
function GalleryContent() {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();
  const [activeNav, setActiveNav] = useState('home');

  const navItems = [
    { id: 'home',    label: 'Home',    icon: '🏠' },
    { id: 'shows',   label: 'Shows',   icon: '🎵' },
    { id: 'tip',     label: 'Tip',     icon: '💝' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <header style={{
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        <div className="cb-container" style={{ maxWidth: 1200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎶</span>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>
              Crowdbeats Design System
            </h1>
            <span style={{ marginLeft: 'auto' }}>
              <CbLiveStageChip stageName="Main Stage" isLive />
            </span>
          </div>
        </div>
      </header>

      <main className="cb-container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 900 }}>

        {/* BANNER */}
        <CbBanner
          message="Phase 4 component gallery — WCAG 2.2 AA validated design system"
          status="info"
          onDismiss={() => {}}
        />
        <div style={{ height: 32 }} />

        {/* BUTTONS */}
        <Section title="Buttons">
          <div style={row}>
            <CbButton variant="primary" size="lg">Primary Large</CbButton>
            <CbButton variant="secondary" size="lg">Secondary</CbButton>
            <CbButton variant="ghost" size="lg">Ghost</CbButton>
            <CbButton variant="destructive" size="lg">Destructive</CbButton>
          </div>
          <div style={row}>
            <CbButton variant="primary" size="md">Medium</CbButton>
            <CbButton variant="primary" size="sm">Small</CbButton>
            <CbButton variant="primary" isLoading>Loading</CbButton>
            <CbButton variant="primary" disabled>Disabled</CbButton>
          </div>
          <CbButton variant="primary" fullWidth size="lg">Full Width Button</CbButton>
        </Section>

        {/* INPUTS */}
        <Section title="Inputs">
          <div style={grid2}>
            <CbInput label="Username" placeholder="Enter your username" fullWidth />
            <CbInput label="Email" placeholder="you@example.com" prefixIcon={<span>@</span>} fullWidth />
          </div>
          <div style={grid2}>
            <CbInput
              label="Amount"
              placeholder="0.00"
              hint="Minimum $1.00"
              fullWidth
            />
            <CbInput
              label="Card number"
              placeholder="•••• •••• •••• ••••"
              errorText="Invalid card number"
              fullWidth
            />
          </div>
        </Section>

        {/* CARDS */}
        <Section title="Cards">
          <div style={grid3}>
            <CbCard>
              <p style={{ margin: 0, color: 'var(--text-primary)' }}>Default card with body content</p>
            </CbCard>
            <CbCard onClick={() => addToast('Card tapped', 'success')}>
              <p style={{ margin: 0, color: 'var(--text-primary)' }}>Interactive card (click me)</p>
            </CbCard>
            <CbCard isLive>
              <p style={{ margin: 0, color: 'var(--live-text)' }}>🔴 Live stage card</p>
            </CbCard>
          </div>
        </Section>

        {/* AVATARS */}
        <Section title="Avatars">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
              <CbAvatar key={size} size={size} initials="CB" alt={`Avatar ${size}`} />
            ))}
            <CbAvatar size="lg" initials="LA" isLive alt="Live artist" />
            <CbAvatar size="xl" src="https://i.pravatar.cc/150?img=8" alt="User photo" />
          </div>
        </Section>

        {/* STATUS BADGES */}
        <Section title="Status Badges">
          <div style={row}>
            {(['success','warning','error','info','live','neutral'] as CbStatusType[]).map((s) => (
              <CbStatusBadge key={s} status={s} />
            ))}
          </div>
          <div style={row}>
            <CbStatusBadge status="success" label="Payment confirmed" />
            <CbStatusBadge status="error" label="Connection failed" />
            <CbStatusBadge status="live" label="On stage now" />
          </div>
        </Section>

        {/* SKELETON */}
        <Section title="Skeleton (loading)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <CbSkeleton height={20} />
            <CbSkeleton height={20} width={240} />
            <CbSkeleton height={80} radius="var(--radius-md)" />
          </div>
        </Section>

        {/* TOAST / MODAL / DRAWER */}
        <Section title="Overlays">
          <div style={row}>
            <CbButton onClick={() => addToast('Tip sent! 🎵', 'success')}>
              Success Toast
            </CbButton>
            <CbButton variant="secondary" onClick={() => addToast('Connection issue', 'error')}>
              Error Toast
            </CbButton>
            <CbButton variant="ghost" onClick={() => setModalOpen(true)}>
              Open Modal
            </CbButton>
            <CbButton variant="ghost" onClick={() => setDrawerOpen(true)}>
              Open Drawer
            </CbButton>
            <CbButton variant="destructive" onClick={() => setConfirmOpen(true)}>
              Confirm Destructive
            </CbButton>
          </div>
        </Section>

        {/* EMPTY / ERROR STATES */}
        <Section title="Empty & Error States">
          <div style={grid2}>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <CbEmptyState
                icon="🎵"
                title="No shows yet"
                subtitle="Book your first performance to get started."
                action={<CbButton size="sm">Book Now</CbButton>}
              />
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <CbErrorState
                title="Failed to load"
                subtitle="Check your connection and try again."
                onRetry={() => addToast('Retrying…', 'info')}
              />
            </div>
          </div>
        </Section>

        {/* TABLE */}
        <Section title="Table">
          <CbTable<{ id: string; artist: string; amount: string; status: string }>
            caption="Recent tips"
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'artist', header: 'Artist' },
              { key: 'amount', header: 'Amount', align: 'right' },
              { key: 'status', header: 'Status', render: (r) => (
                <CbStatusBadge status={r.status as CbStatusType} />
              )},
            ]}
            rows={[
              { id: '1', artist: 'The Midnight', amount: '$5.00',  status: 'success' },
              { id: '2', artist: 'Sylvan Esso',  amount: '$2.00',  status: 'info' },
              { id: '3', artist: 'Benson Boone', amount: '$10.00', status: 'success' },
            ]}
            onRowClick={(r) => addToast(`Selected: ${r.artist}`, 'info')}
          />
        </Section>

        {/* AMOUNT SELECTOR */}
        <Section title="Amount Selector">
          <CbAmountSelector
            presets={[100, 200, 500, 1000]}
            value={selectedAmount}
            onChange={setSelectedAmount}
            currency="USD"
          />
          {selectedAmount && (
            <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
              Selected: ${(selectedAmount / 100).toFixed(2)}
            </p>
          )}
        </Section>

        {/* PROGRESS BARS + CHART */}
        <Section title="Progress & Charts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CbProgressBar value={0}   label="0% funded" />
            <CbProgressBar value={35}  label="35% funded" />
            <CbProgressBar value={75}  label="75% funded" color="var(--status-success)" />
            <CbProgressBar value={100} label="Goal reached!" />
          </div>
          <div style={{ height: 24 }} />
          <CbMiniChart
            values={[40, 80, 60, 95, 70]}
            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
            caption="Weekly tip totals"
          />
        </Section>

        {/* LIVE STAGE CHIPS */}
        <Section title="Live Stage Chips">
          <div style={row}>
            <CbLiveStageChip stageName="Main Stage" isLive />
            <CbLiveStageChip stageName="Side Stage" />
            <CbLiveStageChip
              stageName="Acoustic Stage"
              isLive
              onTap={() => addToast('Navigating to Acoustic Stage', 'live')}
            />
          </div>
        </Section>

        {/* BOTTOM NAV PREVIEW */}
        <Section title="Bottom Navigation">
          <div style={{
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}>
            <CbBottomNav
              items={navItems}
              activeId={activeNav}
            />
          </div>
        </Section>

      </main>

      {/* MODAL */}
      <CbModal open={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>
          This is a sample modal with keyboard trap (Escape to close) and focus management.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <CbButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</CbButton>
          <CbButton onClick={() => { setModalOpen(false); addToast('Action confirmed', 'success'); }}>
            Confirm
          </CbButton>
        </div>
      </CbModal>

      {/* DRAWER */}
      <CbDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filter Options">
        <p style={{ color: 'var(--text-secondary)' }}>Drawer content slides in from the right on desktop.</p>
      </CbDrawer>

      {/* CONFIRMATION */}
      <CbConfirmationModal
        open={confirmOpen}
        title="Delete Performance?"
        message="This will permanently remove the performance and cannot be undone."
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => { setConfirmOpen(false); addToast('Performance deleted', 'error'); }}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* FIXED BOTTOM NAV (simulated) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface-raised)',
        borderTop: '1px solid var(--border-subtle)',
        zIndex: 200,
        display: 'flex',
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '8px 4px',
              minHeight: 56,
              border: 'none',
              background: 'none',
              color: activeNav === item.id ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'color var(--duration-fast) var(--ease-out)',
            }}
            onClick={() => setActiveNav(item.id)}
            aria-current={activeNav === item.id ? 'page' : undefined}
            aria-label={item.label}
          >
            <span style={{ fontSize: 22 }} aria-hidden="true">{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Section wrapper
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color:         'var(--text-tertiary)',
        margin:        '0 0 16px',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </section>
  );
}

const row: React.CSSProperties = {
  display:   'flex',
  flexWrap:  'wrap',
  gap:       8,
  alignItems:'center',
};

const grid2: React.CSSProperties = {
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap:                 16,
};

const grid3: React.CSSProperties = {
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap:                 16,
};

// Gallery page with provider wrapping
export default function GalleryPage() {
  return (
    <CbToastProvider>
      <GalleryContent />
    </CbToastProvider>
  );
}
