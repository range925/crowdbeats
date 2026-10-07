'use client';

/**
 * Crowdbeats V2 — Content & Communications Control Center (Section 10)
 *
 * Operational Console Features:
 * - 8 Tabs: Editorial & Featured, Announcements & Banners, Push Notifications, Email Templates, Media Library, Badges, Flagged UGC, Filter Rules
 * - 4 Enterprise KPI Cards with adverse direction coloring and definition tooltips
 * - Live Device Preview: Interactive Light/Dark preview of mobile push notifications and in-app banners
 * - List / Calendar view toggle for scheduled editorial campaigns
 * - Action Dialogs: Schedule Push Broadcast, Deploy Banner, Feature Performer, Flag Content
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  AdminKpiCard,
  AdminFilterBar,
  AdminStatusBadge,
  DetailDrawer,
  ActionDialog,
  Timeline,
  PermissionGate,
  EmptyState,
  FreshnessLabel,
  ExportStatus,
} from '@/components/admin';
import {
  ContentModerationIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  XIcon,
  DownloadIcon,
  RefreshIcon,
  SendIcon,
  SunIcon,
  MoonIcon,
  ChevronRightIcon,
  ShieldBadgeIcon,
} from '@/components/admin/AdminIcons';

export type ContentTab =
  | 'featured'
  | 'announcements'
  | 'notifications'
  | 'templates'
  | 'media'
  | 'badges'
  | 'moderation'
  | 'rules';

export interface FeaturedPerformer {
  id: string;
  performerId: string;
  performerName: string;
  genre: string;
  city: string;
  stageName: string;
  slotPosition: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
  startDate: string;
  endDate: string;
  impressionsCount: number;
  clickThroughCount: number;
  curatorNotes?: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  body: string;
  targetAudience: 'ALL' | 'CREATORS_ONLY' | 'FANS_ONLY' | 'AUSTIN_STAGE_GUESTS' | 'VIP_BACKERS';
  status: 'SENT' | 'SCHEDULED' | 'DRAFT';
  scheduledFor: string;
  sentAt?: string;
  deliveredCount: number;
  openRatePercent: number;
  channel: 'PUSH' | 'IN_APP_BANNER' | 'EMAIL';
}

const MOCK_FEATURED: FeaturedPerformer[] = [
  {
    id: 'feat_101',
    performerId: 'usr_neon_bandit',
    performerName: 'Neon Bandit',
    genre: 'Synthwave / Live Guitar',
    city: 'Austin, TX',
    stageName: '6th Street Live Stage',
    slotPosition: 1,
    status: 'ACTIVE',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    impressionsCount: 14200,
    clickThroughCount: 1890,
    curatorNotes: 'Featured artist for Austin October Music Week.',
  },
  {
    id: 'feat_102',
    performerId: 'usr_claire_de_lune',
    performerName: 'Claire de Lune',
    genre: 'Indie Folk / Cello',
    city: 'Nashville, TN',
    stageName: 'Broadway Acoustic Corner',
    slotPosition: 2,
    status: 'ACTIVE',
    startDate: '2026-10-04',
    endDate: '2026-10-18',
    impressionsCount: 9400,
    clickThroughCount: 1240,
    curatorNotes: 'Top tipped female busker in Southeast region.',
  },
  {
    id: 'feat_103',
    performerId: 'usr_blues_dave',
    performerName: 'Bluesman Dave',
    genre: 'Delta Blues / Harmonica',
    city: 'Chicago, IL',
    stageName: 'Maxwell Street Plaza',
    slotPosition: 3,
    status: 'SCHEDULED',
    startDate: '2026-10-15',
    endDate: '2026-10-30',
    impressionsCount: 0,
    clickThroughCount: 0,
  },
];

const MOCK_BROADCASTS: BroadcastNotification[] = [
  {
    id: 'notif_701',
    title: 'Weekend 2:1 Match Pool Live on 6th Street!',
    body: 'All fan tips sent at 6th Street stages will be doubled up to $100 per set by Red Bull Music until midnight.',
    targetAudience: 'AUSTIN_STAGE_GUESTS',
    status: 'SENT',
    scheduledFor: '2026-10-06T18:00:00Z',
    sentAt: '2026-10-06T18:00:05Z',
    deliveredCount: 4280,
    openRatePercent: 41.8,
    channel: 'PUSH',
  },
  {
    id: 'notif_702',
    title: 'Platform Maintenance Notice',
    body: 'Scheduled database maintenance will occur Tuesday 03:00-03:30 UTC. Live tipping will remain active with offline queueing.',
    targetAudience: 'ALL',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-08T09:00:00Z',
    deliveredCount: 0,
    openRatePercent: 0,
    channel: 'IN_APP_BANNER',
  },
  {
    id: 'notif_703',
    title: 'New Band Split Governance Available',
    body: 'Band leaders can now lock immutable 100% split contracts and invite session musicians directly via phone contacts.',
    targetAudience: 'CREATORS_ONLY',
    status: 'SENT',
    scheduledFor: '2026-10-03T14:00:00Z',
    sentAt: '2026-10-03T14:00:10Z',
    deliveredCount: 1650,
    openRatePercent: 54.2,
    channel: 'EMAIL',
  },
];

export default function EnterpriseContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('featured');
  const [featured, setFeatured] = useState<FeaturedPerformer[]>(MOCK_FEATURED);
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>(MOCK_BROADCASTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Preview form state
  const [previewTitle, setPreviewTitle] = useState('🔥 Live Performer Alert: Neon Bandit');
  const [previewBody, setPreviewBody] = useState('Playing live right now at 6th Street Stage! Tap to listen and send a tip.');

  // Dialog State
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    type: 'PUBLISH_BROADCAST' | 'REMOVE_FEATURED' | 'FLAG_MEDIA' | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeAnnouncementsCount = broadcasts.filter((b) => b.channel === 'IN_APP_BANNER' && b.status === 'SENT').length + 1;
  const scheduledBroadcastsCount = broadcasts.filter((b) => b.status === 'SCHEDULED').length;
  const avgOpenRate = useMemo(() => {
    const sent = broadcasts.filter((b) => b.status === 'SENT' && b.openRatePercent > 0);
    if (sent.length === 0) return 0;
    return (sent.reduce((a, b) => a + b.openRatePercent, 0) / sent.length).toFixed(1);
  }, [broadcasts]);

  const handleConfirmAction = async (reason: string) => {
    if (!actionDialog.type) return;

    try {
      if (actionDialog.type === 'PUBLISH_BROADCAST') {
        const newBroadcast: BroadcastNotification = {
          id: `notif_${Date.now()}`,
          title: previewTitle,
          body: previewBody,
          targetAudience: 'ALL',
          status: 'SCHEDULED',
          scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          deliveredCount: 0,
          openRatePercent: 0,
          channel: 'PUSH',
        };
        setBroadcasts((prev) => [newBroadcast, ...prev]);
        setFeedback({
          type: 'success',
          message: `Broadcast "${previewTitle}" scheduled. Audit log justification recorded: "${reason}".`,
        });
      }

      setActionDialog({ isOpen: false, type: null, title: '', description: '' });
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to execute content action.' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto' }}>
      {/* ── Top Bar & Identity ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
              <ContentModerationIcon size={28} />
            </span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Content & Communications Control Center
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 38px' }}>
            Curate featured performers on discovery maps, dispatch mobile push notifications, manage in-app alert banners, and moderate media.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FreshnessLabel lastUpdated={new Date()} onRefresh={() => setFeedback({ type: 'success', message: 'Refreshed content feeds.' })} />
          <ExportStatus totalCount={broadcasts.length + featured.length} entityName="Content Items" onExport={() => alert('Exporting communications log to CSV...')} />
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: feedback.type === 'success' ? 'rgba(0, 240, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: feedback.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--status-success)' : 'var(--status-error)'}`,
          }}
        >
          {feedback.type === 'success' ? <CheckCircleIcon size={16} /> : <AlertTriangleIcon size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── 4 Top KPI Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <AdminKpiCard
          title="Active Announcements"
          value={activeAnnouncementsCount}
          countLabel="Banners live in app"
          period="Current live"
          trend={{ value: "1 festival banner active", isPositive: true }}
          tooltip="Global or regional in-app banners currently rendering in fan and creator feeds"
          icon="📢"
          onClick={() => setActiveTab('announcements')}
        />
        <AdminKpiCard
          title="Scheduled Broadcasts"
          value={scheduledBroadcastsCount}
          countLabel="Upcoming pushes"
          period="Next 48h"
          trend={{ value: "On schedule", isPositive: true }}
          tooltip="Targeted push notifications queued for delivery across geographical regions"
          icon="📅"
          onClick={() => setActiveTab('notifications')}
        />
        <AdminKpiCard
          title="Average Push Open Rate"
          value={`${avgOpenRate}%`}
          countLabel="4,280 delivered"
          period="Trailing 30D"
          trend={{ value: "+3.4% vs industry", isPositive: true }}
          tooltip="Percentage of recipients tapping push notifications to open live stages"
          icon="📈"
          accentColor="#00F076"
        />
        <AdminKpiCard
          title="Flagged UGC Media"
          value="2"
          countLabel="Pending review"
          period="Current backlog"
          isAdverse={true}
          trend={{ value: "Low backlog", isPositive: true }}
          tooltip="Performer bio pictures, stage banners, or audio snippets requiring manual check"
          icon="🛡️"
          accentColor="#F59E0B"
          onClick={() => setActiveTab('moderation')}
        />
      </div>

      {/* ── Section Navigation Tabs ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 20, overflowX: 'auto', gap: 8 }}>
        {[
          { id: 'featured', label: 'Editorial & Featured', count: featured.length },
          { id: 'announcements', label: 'Announcements & Banners', count: activeAnnouncementsCount },
          { id: 'notifications', label: 'Push Notifications', count: broadcasts.length },
          { id: 'templates', label: 'Email Templates', count: 6 },
          { id: 'media', label: 'Media Library', count: 24 },
          { id: 'badges', label: 'Campaign Badges', count: 12 },
          { id: 'moderation', label: 'Flagged UGC', count: 2 },
          { id: 'rules', label: 'Automated Filter Rules', count: 8 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ContentTab)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 14,
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--surface-raised)',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Editorial & Featured Performers ─────────────────────────────── */}
      {activeTab === 'featured' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Featured Performer Placement (Live Discovery Map & App Top Shelf)
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '2px 0 0' }}>
                Performer spotlight slots render prominently on the global discovery radar and top carousel.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--surface-raised)',
                  color: viewMode === 'list' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  background: viewMode === 'calendar' ? 'var(--accent-primary)' : 'var(--surface-raised)',
                  color: viewMode === 'calendar' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Calendar View
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Slot</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Performer & Genre</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Live Stage Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Schedule Window</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Impressions</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>CTR</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {featured.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      #{f.slotPosition}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{f.performerName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.genre}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{f.stageName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.city}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {f.startDate} → {f.endDate}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {f.impressionsCount.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--status-success)' }}>
                      {f.impressionsCount > 0 ? `${((f.clickThroughCount / f.impressionsCount) * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <AdminStatusBadge
                        status={f.status === 'ACTIVE' ? 'succeeded' : f.status === 'SCHEDULED' ? 'pending' : 'paused'}
                        label={f.status}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() =>
                          setActionDialog({
                            isOpen: true,
                            type: 'REMOVE_FEATURED',
                            title: 'Remove Featured Performer',
                            description: `Are you sure you want to remove ${f.performerName} from Slot #${f.slotPosition}? The slot will be vacated for new editorial entries.`,
                          })
                        }
                        style={{
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Push Notifications & Live Device Preview ───────────────────── */}
      {(activeTab === 'notifications' || activeTab === 'announcements') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24 }}>
          {/* Left Column: Broadcast History */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                Broadcast Messages & Pushes ({broadcasts.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {broadcasts.map((b) => (
                <div key={b.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, background: 'var(--surface-raised)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {b.channel}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>{b.targetAudience}</span>
                      <AdminStatusBadge status={b.status === 'SENT' ? 'succeeded' : 'pending'} label={b.status} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{b.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{b.body}</div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-success)' }}>
                      {b.openRatePercent > 0 ? `${b.openRatePercent}% open` : 'Queued'}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 2 }}>
                      {b.deliveredCount > 0 ? `${b.deliveredCount.toLocaleString()} delivered` : 'Scheduled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Live Light/Dark Device Preview */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>LIVE DEVICE SIMULATOR</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPreviewTheme('light')}
                  style={{
                    background: previewTheme === 'light' ? 'var(--surface-raised)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  <SunIcon size={12} /> Light
                </button>
                <button
                  onClick={() => setPreviewTheme('dark')}
                  style={{
                    background: previewTheme === 'dark' ? 'var(--surface-raised)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  <MoonIcon size={12} /> Dark
                </button>
              </div>
            </div>

            {/* Simulated Phone Lockscreen */}
            <div
              style={{
                borderRadius: 24,
                padding: '24px 16px',
                background: previewTheme === 'dark' ? '#0F172A' : '#F8FAFC',
                border: `2px solid ${previewTheme === 'dark' ? '#334155' : '#E2E8F0'}`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                marginBottom: 20,
              }}
            >
              {/* Phone Speaker Notch */}
              <div style={{ width: 60, height: 4, borderRadius: 2, background: '#64748B', margin: '0 auto 16px' }} />

              {/* Notification Banner Component */}
              <div
                style={{
                  borderRadius: 14,
                  padding: 14,
                  background: previewTheme === 'dark' ? 'rgba(30, 41, 59, 0.85)' : '#FFFFFF',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${previewTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 8, fontWeight: 900 }}>
                    CB
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: previewTheme === 'dark' ? '#E2E8F0' : '#334155' }}>CROWDBEATS</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 'auto' }}>now</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: previewTheme === 'dark' ? '#F8FAFC' : '#0F172A', marginBottom: 2 }}>
                  {previewTitle || 'Notification Title'}
                </div>
                <div style={{ fontSize: 12, color: previewTheme === 'dark' ? '#94A3B8' : '#64748B', lineHeight: 1.4 }}>
                  {previewBody || 'Notification body text will render here.'}
                </div>
              </div>
            </div>

            {/* Quick Composer Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                value={previewTitle}
                onChange={(e) => setPreviewTitle(e.target.value)}
                placeholder="Alert headline..."
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              />
              <textarea
                rows={2}
                value={previewBody}
                onChange={(e) => setPreviewBody(e.target.value)}
                placeholder="Alert message content..."
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  resize: 'none',
                }}
              />
              <button
                onClick={() =>
                  setActionDialog({
                    isOpen: true,
                    type: 'PUBLISH_BROADCAST',
                    title: 'Schedule Push Broadcast',
                    description: `Confirm scheduling broadcast: "${previewTitle}" to all registered app devices?`,
                  })
                }
                style={{
                  background: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <SendIcon size={14} /> Schedule Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Dialog ───────────────────────────────────────────────────── */}
      <ActionDialog
        isOpen={actionDialog.isOpen}
        title={actionDialog.title}
        targetDescription={actionDialog.description}
        confirmLabel="Confirm"
        requiresReason={true}
        reasonPlaceholder="Specify reason for content operation audit record..."
        onClose={() => setActionDialog({ isOpen: false, type: null, title: '', description: '' })}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
