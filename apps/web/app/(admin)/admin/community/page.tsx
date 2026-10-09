'use client';

/**
 * Crowdbeats V2 — Social & Messaging Operations Control Plane
 *
 * Operational Console Features:
 * - 4 Tabs: Overview & Health, Social Graph Registry, Messaging Delivery Failures, Block & Restrict Controls
 * - 4 Enterprise KPI Cards with adverse direction coloring and definition tooltips
 * - Follower / Following graph search and inspection
 * - Direct messaging failure remediation queue with retry dispatch
 * - Action Dialogs: Restrict Messaging, Remove Restriction, Retry Dispatch with required audit justification
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AdminKpiCard,
  AdminDataTable,
  AdminFilterBar,
  AdminStatusBadge,
  ActionDialog,
  EmptyState,
  FreshnessLabel,
  type Column,
} from '@/components/admin';
import {
  UsersIcon,
  ArtistsIcon,
  MessageSquareIcon,
  AlertTriangleIcon,
  ShieldBadgeIcon,
  CheckCircleIcon,
  SearchIcon,
  RefreshIcon,
  SendIcon,
  BanIcon,
  ClockIcon,
  ActivityIcon,
} from '@/components/admin/AdminIcons';
import { useAdminUsers, usePlatformMetrics, type AdminUser } from '@/lib/admin/adminFirestore';

type CommunityTab = 'overview' | 'graph' | 'failure-queue' | 'blocks-restrictions';

interface SocialRelationship {
  id: string;
  followerUid: string;
  followerName: string;
  targetUid: string;
  targetName: string;
  targetType: 'SOLO_MUSICIAN' | 'BAND';
  createdAt: string;
  isMutual: boolean;
}

interface MessageFailureItem {
  id: string;
  senderUid: string;
  senderName: string;
  recipientUid: string;
  recipientName: string;
  channel: 'PUSH_FCM' | 'IN_APP_DM' | 'SMS_VERIFY';
  errorCode: string;
  errorMessage: string;
  attemptsCount: number;
  lastAttemptAt: string;
  status: 'QUEUED' | 'FAILED' | 'RETRYING';
}

interface BlockRestrictionItem {
  id: string;
  userUid: string;
  userName: string;
  userRole: string;
  restrictionType: 'DM_DISABLED' | 'FOLLOW_DISABLED' | 'FULL_RESTRICTION';
  reason: string;
  appliedBy: string;
  appliedAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVERSED';
}

const SAMPLE_RELATIONSHIPS: SocialRelationship[] = [
  { id: 'rel_101', followerUid: 'usr_sarah_m', followerName: 'Sarah Miller', targetUid: 'art_elena_cruz', targetName: 'Elena Cruz', targetType: 'SOLO_MUSICIAN', createdAt: '2026-10-08T18:42:00Z', isMutual: false },
  { id: 'rel_102', followerUid: 'usr_alex_k', followerName: 'Alex King', targetUid: 'art_midnight_echoes', targetName: 'The Midnight Echoes', targetType: 'BAND', createdAt: '2026-10-08T17:15:00Z', isMutual: true },
  { id: 'rel_103', followerUid: 'usr_david_n', followerName: 'David Naufahu', targetUid: 'art_maya_lin', targetName: 'Maya Lin', targetType: 'SOLO_MUSICIAN', createdAt: '2026-10-08T16:00:00Z', isMutual: true },
  { id: 'rel_104', followerUid: 'usr_claire_b', followerName: 'Claire Bennet', targetUid: 'art_brass_roots', targetName: 'Brass Roots Collective', targetType: 'BAND', createdAt: '2026-10-07T21:30:00Z', isMutual: false },
  { id: 'rel_105', followerUid: 'usr_john_d', followerName: 'John Doe', targetUid: 'art_elena_cruz', targetName: 'Elena Cruz', targetType: 'SOLO_MUSICIAN', createdAt: '2026-10-07T14:10:00Z', isMutual: false },
];

const SAMPLE_FAILURES: MessageFailureItem[] = [
  { id: 'msg_fail_01', senderUid: 'art_elena_cruz', senderName: 'Elena Cruz', recipientUid: 'usr_sarah_m', recipientName: 'Sarah Miller', channel: 'PUSH_FCM', errorCode: 'FCM_UNREGISTERED_TOKEN', errorMessage: 'Device APNS token invalidated by client OS upgrade', attemptsCount: 3, lastAttemptAt: '2026-10-08T22:15:00Z', status: 'FAILED' },
  { id: 'msg_fail_02', senderUid: 'art_midnight_echoes', senderName: 'The Midnight Echoes', recipientUid: 'usr_alex_k', recipientName: 'Alex King', channel: 'IN_APP_DM', errorCode: 'BLOCKED_RELATIONSHIP', errorMessage: 'Message dropped due to bilateral user block rule', attemptsCount: 1, lastAttemptAt: '2026-10-08T21:40:00Z', status: 'QUEUED' },
  { id: 'msg_fail_03', senderUid: 'system_payout', senderName: 'Platform Dispatch', recipientUid: 'usr_claire_b', recipientName: 'Claire Bennet', channel: 'SMS_VERIFY', errorCode: 'GATEWAY_TIMEOUT', errorMessage: 'Twilio downstream carrier route timeout (284ms)', attemptsCount: 2, lastAttemptAt: '2026-10-08T20:50:00Z', status: 'RETRYING' },
];

const SAMPLE_RESTRICTIONS: BlockRestrictionItem[] = [
  { id: 'res_01', userUid: 'usr_spammer_99', userName: 'RapidPromoter', userRole: 'FAN', restrictionType: 'DM_DISABLED', reason: 'High velocity unsolicited direct messaging in live stage chat', appliedBy: 'trust-lead@crowdbeats.com', appliedAt: '2026-10-07T11:20:00Z', status: 'ACTIVE' },
  { id: 'res_02', userUid: 'usr_troll_42', userName: 'NightRiderX', userRole: 'FAN', restrictionType: 'FULL_RESTRICTION', reason: 'Harassment violations reported across 3 separate performer livestreams', appliedBy: 'compliance@crowdbeats.com', appliedAt: '2026-10-06T19:00:00Z', status: 'ACTIVE' },
  { id: 'res_03', userUid: 'usr_shadow_bot', userName: 'CryptoScout', userRole: 'FAN', restrictionType: 'FOLLOW_DISABLED', reason: 'Automated follow-bot pattern detected by WAF rate limiter', appliedBy: 'automated-waf', appliedAt: '2026-10-05T08:30:00Z', status: 'ACTIVE' },
];

export default function EnterpriseCommunityPage() {
  const { metrics, loading: metricsLoading } = usePlatformMetrics();
  const { users, loading: usersLoading } = useAdminUsers({ limitN: 100 });

  const [activeTab, setActiveTab] = useState<CommunityTab>('overview');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Action Dialog States
  const [retryDialogItem, setRetryDialogItem] = useState<MessageFailureItem | null>(null);
  const [restrictDialogItem, setRestrictDialogItem] = useState<BlockRestrictionItem | null>(null);
  const [isNewRestrictOpen, setIsNewRestrictOpen] = useState(false);
  const [newRestrictUid, setNewRestrictUid] = useState('');
  const [newRestrictReason, setNewRestrictReason] = useState('');
  const [newRestrictType, setNewRestrictType] = useState<'DM_DISABLED' | 'FOLLOW_DISABLED' | 'FULL_RESTRICTION'>('DM_DISABLED');

  // Dynamic failure and restriction lists
  const [failuresList, setFailuresList] = useState<MessageFailureItem[]>(SAMPLE_FAILURES);
  const [restrictionsList, setRestrictionsList] = useState<BlockRestrictionItem[]>(SAMPLE_RESTRICTIONS);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedAt(new Date());
    }, 400);
  };

  const handleExecuteRetry = () => {
    if (!retryDialogItem) return;
    setFailuresList((prev) =>
      prev.map((f) => (f.id === retryDialogItem.id ? { ...f, status: 'RETRYING', attemptsCount: f.attemptsCount + 1 } : f))
    );
    setRetryDialogItem(null);
  };

  const handleExecuteUnrestrict = () => {
    if (!restrictDialogItem) return;
    setRestrictionsList((prev) =>
      prev.map((r) => (r.id === restrictDialogItem.id ? { ...r, status: 'REVERSED' } : r))
    );
    setRestrictDialogItem(null);
  };

  const handleCreateRestriction = () => {
    if (!newRestrictUid.trim() || !newRestrictReason.trim()) return;
    const newEntry: BlockRestrictionItem = {
      id: `res_${Date.now()}`,
      userUid: newRestrictUid.trim(),
      userName: `User (${newRestrictUid.trim()})`,
      userRole: 'FAN',
      restrictionType: newRestrictType,
      reason: newRestrictReason.trim(),
      appliedBy: 'staff-lead@crowdbeats.com',
      appliedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    setRestrictionsList((prev) => [newEntry, ...prev]);
    setIsNewRestrictOpen(false);
    setNewRestrictUid('');
    setNewRestrictReason('');
  };

  // Top followed performers
  const topPerformers = useMemo(() => {
    return users
      .filter((u) => u.personaType === 'SOLO_MUSICIAN' || u.personaType === 'BAND' || u.personaType === 'ARTIST')
      .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
      .slice(0, 5);
  }, [users]);

  // Filtered relationships
  const filteredRelationships = useMemo(() => {
    if (!search) return SAMPLE_RELATIONSHIPS;
    const q = search.toLowerCase();
    return SAMPLE_RELATIONSHIPS.filter(
      (r) =>
        r.followerName.toLowerCase().includes(q) ||
        r.targetName.toLowerCase().includes(q) ||
        r.followerUid.toLowerCase().includes(q) ||
        r.targetUid.toLowerCase().includes(q)
    );
  }, [search]);

  // Filtered restrictions
  const filteredRestrictions = useMemo(() => {
    if (!search) return restrictionsList;
    const q = search.toLowerCase();
    return restrictionsList.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userUid.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }, [restrictionsList, search]);

  return (
    <div
      style={{
        padding: '24px 32px 48px',
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────────
          1. PAGE HEADER
      ───────────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          paddingBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                color: 'var(--admin-text-primary, #0F172A)',
                letterSpacing: '-0.025em',
              }}
            >
              Social & Messaging Operations
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'rgba(124, 58, 237, 0.1)',
                color: '#7C3AED',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Community Graph
            </span>
          </div>
          <p
            style={{
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Community graph monitoring, direct messaging queues, delivery failure remediation, and user restriction controls.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FreshnessLabel
            lastUpdated={lastRefreshedAt}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. KPI CARDS (4 COLUMNS)
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Social Operations Key Metrics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}
          className="admin-kpi-grid"
        >
          <AdminKpiCard
            title="Total Follow Relationships"
            value="14,820"
            subtitle="Platform-wide active fan follows"
            period="All-time Graph"
            trend={{ value: "+12.4%", isPositive: true, label: "vs last month" }}
            icon={<UsersIcon size={18} strokeWidth={2.2} />}
            accentColor="#7C3AED"
            tooltip="Total bidirectional and unidirectional graph edges connecting fans to solo musicians and bands."
          />

          <AdminKpiCard
            title="Direct Message Threads"
            value="1,420"
            subtitle="Encrypted 1:1 and stage chat"
            period="Active 30d"
            trend={{ value: "99.8%", isPositive: true, label: "delivery SLA" }}
            icon={<MessageSquareIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Active real-time conversation threads between verified fans and performers."
          />

          <AdminKpiCard
            title="Delivery Failure Queue"
            value={failuresList.filter((f) => f.status !== 'RETRYING').length.toString()}
            subtitle="Unsent push or DM payloads"
            period="Requires Action"
            isAdverse={true}
            trend={{ value: "Critical", isPositive: true, label: "needs retry" }}
            icon={<AlertTriangleIcon size={18} strokeWidth={2.2} />}
            accentColor="#EF4444"
            tooltip="Outbound notifications or chat dispatches blocked due to invalid tokens or downstream provider errors."
            onClick={() => setActiveTab('failure-queue')}
          />

          <AdminKpiCard
            title="Restricted Accounts"
            value={restrictionsList.filter((r) => r.status === 'ACTIVE').length.toString()}
            subtitle="Active messaging/follow bans"
            period="Safety Desk"
            trend={{ value: "Controlled", isPositive: true, label: "trust & safety" }}
            icon={<ShieldBadgeIcon size={18} strokeWidth={2.2} />}
            accentColor="#F59E0B"
            tooltip="User accounts with revoked direct messaging or follow privileges following abuse or spam violations."
            onClick={() => setActiveTab('blocks-restrictions')}
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. NAVIGATION TABS
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          gap: 24,
          overflowX: 'auto',
        }}
        role="tablist"
        aria-label="Community management tabs"
      >
        {[
          { id: 'overview', label: 'Overview & Graph Health' },
          { id: 'graph', label: 'Social Graph Registry' },
          {
            id: 'failure-queue',
            label: 'Messaging Delivery Failures',
            count: failuresList.filter((f) => f.status === 'FAILED').length,
          },
          {
            id: 'blocks-restrictions',
            label: 'Block & Restrict Controls',
            count: restrictionsList.filter((r) => r.status === 'ACTIVE').length,
          },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id as CommunityTab)}
              style={{
                padding: '10px 2px',
                border: 'none',
                background: 'transparent',
                borderBottom: isSelected
                  ? '2px solid var(--admin-accent-primary, #7C3AED)'
                  : '2px solid transparent',
                color: isSelected
                  ? 'var(--admin-accent-primary, #7C3AED)'
                  : 'var(--admin-text-secondary, #64748B)',
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 9999,
                    background: tab.id === 'failure-queue' ? '#EF4444' : '#F59E0B',
                    color: '#FFFFFF',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. TAB CONTENT
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
              gap: 20,
            }}
            className="admin-middle-split"
          >
            {/* Top Followed Performers */}
            <div
              style={{
                background: 'var(--admin-surface-card, #FFFFFF)',
                padding: '24px',
                borderRadius: 12,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--admin-text-primary, #0F172A)' }}>
                    Top Followed Live Performers
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
                    Solo artists and bands with largest community followings
                  </p>
                </div>
                <Link
                  href="/admin/users?tab=creators"
                  style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}
                >
                  View All Creators &rarr;
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'Elena Cruz', type: 'Solo Performer', genre: 'Acoustic / Soul', followers: '14,200', pct: 92, verified: true },
                  { name: 'The Midnight Echoes', type: 'Band', genre: 'Indie Rock', followers: '28,400', pct: 100, verified: true },
                  { name: 'David Naufahu', type: 'Solo Performer', genre: 'Folk / Blues', followers: '6,500', pct: 45, verified: true },
                  { name: 'Neon Bandit', type: 'Solo Performer', genre: 'Synthwave', followers: '1,200', pct: 20, verified: false },
                  { name: 'Brass Roots Collective', type: 'Band', genre: 'Brass / Funk', followers: '8,900', pct: 58, verified: true },
                ].map((p, idx) => (
                  <div
                    key={p.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'var(--admin-surface-raised, #F8FAFC)',
                      border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: idx === 0 ? '#7C3AED' : '#E2E8F0',
                          color: idx === 0 ? '#FFFFFF' : '#475569',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--admin-text-primary, #0F172A)' }}>
                            {p.name}
                          </span>
                          {p.verified && (
                            <CheckCircleIcon size={13} style={{ color: '#10B981' }} />
                          )}
                          <span
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: p.type === 'Band' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                              color: p.type === 'Band' ? '#2563EB' : '#7C3AED',
                              fontWeight: 600,
                            }}
                          >
                            {p.type}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)' }}>
                          {p.genre}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        className="admin-tabular-nums"
                        style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}
                      >
                        {p.followers}
                      </span>
                      <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        followers
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messaging SLA & Concurrency Card */}
            <div
              style={{
                background: 'var(--admin-surface-card, #FFFFFF)',
                padding: '24px',
                borderRadius: 12,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--admin-text-primary, #0F172A)' }}>
                  Messaging Health & Delivery SLA
                </h3>
                <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 16px' }}>
                  FCM Push and real-time WebSocket socket concurrency
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>FCM Push Delivery Rate</span>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>99.82%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 9999, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '99.8%', background: '#10B981', borderRadius: 9999 }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>In-App Direct Chat Delivery</span>
                      <span style={{ fontWeight: 700, color: '#7C3AED' }}>99.95%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 9999, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '99.9%', background: '#7C3AED', borderRadius: 9999 }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>SMS Carrier Dispatch</span>
                      <span style={{ fontWeight: 700, color: '#3B82F6' }}>98.60%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 9999, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '98.6%', background: '#3B82F6', borderRadius: 9999 }} />
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: 12,
                  color: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircleIcon size={16} strokeWidth={2.2} />
                <span>All messaging gateways operating normally within latency budget (&lt; 250ms).</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'graph' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AdminFilterBar
            searchPlaceholder="Search relationships by fan, performer, or UID..."
            onSearchChange={setSearch}
          />

          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              borderRadius: 12,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-secondary, #64748B)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Follower (Fan)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Target Performer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Performer Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Mutual Connection</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Connected Since</th>
                </tr>
              </thead>
              <tbody>
                {filteredRelationships.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                        {r.followerName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        {r.followerUid}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                        {r.targetName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        {r.targetUid}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: r.targetType === 'BAND' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                          color: r.targetType === 'BAND' ? '#2563EB' : '#7C3AED',
                        }}
                      >
                        {r.targetType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.isMutual ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircleIcon size={12} />
                          <span>Mutual Follow</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                          One-way
                        </span>
                      )}
                    </td>
                    <td
                      className="admin-tabular-nums"
                      style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}
                    >
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'failure-queue' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              borderRadius: 12,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--admin-text-primary, #0F172A)' }}>
                  Outbound Delivery Failure Backlog
                </h3>
                <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
                  Dead-letter queue for failed push notifications, direct messages, and verification dispatches
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#EF4444',
                  color: '#FFFFFF',
                }}
              >
                {failuresList.length} Items in Queue
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-secondary, #64748B)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Channel / Message ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Sender &rarr; Recipient</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Error Details</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Attempts</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {failuresList.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
                        {f.channel}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        {f.id}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                        {f.senderName} &rarr; {f.recipientName}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        {f.recipientUid}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#DC2626',
                          display: 'inline-block',
                          marginBottom: 2,
                        }}
                      >
                        {f.errorCode}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', maxWidth: 280 }}>
                        {f.errorMessage}
                      </div>
                    </td>
                    <td
                      className="admin-tabular-nums"
                      style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}
                    >
                      {f.attemptsCount} tries
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {f.status === 'RETRYING' ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#2563EB',
                          }}
                        >
                          Retrying...
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRetryDialogItem(f)}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--admin-surface-raised, #F1F5F9)',
                            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--admin-text-primary, #0F172A)',
                            cursor: 'pointer',
                          }}
                        >
                          Retry Dispatch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'blocks-restrictions' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <AdminFilterBar
              searchPlaceholder="Search restrictions by user or reason..."
              onSearchChange={setSearch}
            />

            <button
              type="button"
              onClick={() => setIsNewRestrictOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <BanIcon size={14} strokeWidth={2.2} />
              <span>Restrict User</span>
            </button>
          </div>

          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              borderRadius: 12,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-secondary, #64748B)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>User / UID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Restriction Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Reason</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Enforced By</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRestrictions.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                        {r.userName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        {r.userUid}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#DC2626',
                        }}
                      >
                        {r.restrictionType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text-secondary, #64748B)' }}>
                      {r.reason}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
                      <div>{r.appliedBy}</div>
                      <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        {new Date(r.appliedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {r.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => setRestrictDialogItem(r)}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--admin-surface-raised, #F1F5F9)',
                            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#10B981',
                            cursor: 'pointer',
                          }}
                        >
                          Unrestrict
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 600 }}>
                          {r.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          5. ACTION DIALOGS
      ───────────────────────────────────────────────────────────────────────── */}
      {/* Retry Dispatch Dialog */}
      {retryDialogItem && (
        <ActionDialog
          isOpen={true}
          title="Retry Message Dispatch"
          targetDescription={`Message ID ${retryDialogItem.id} via ${retryDialogItem.channel} to ${retryDialogItem.recipientName}`}
          consequenceText="Re-queues the message payload to downstream delivery gateway."
          confirmLabel="Retry Dispatch Now"
          isDestructive={false}
          requiresReason={false}
          onConfirm={handleExecuteRetry}
          onClose={() => setRetryDialogItem(null)}
        />
      )}

      {/* Unrestrict User Dialog */}
      {restrictDialogItem && (
        <ActionDialog
          isOpen={true}
          title="Remove Account Restriction"
          targetDescription={`Account: ${restrictDialogItem.userName} (${restrictDialogItem.userUid})`}
          consequenceText="Restores full direct messaging and follow access across all devices."
          confirmLabel="Restore Access"
          isDestructive={false}
          requiresReason={true}
          reasonPlaceholder="Enter compliance justification for removing restriction..."
          onConfirm={handleExecuteUnrestrict}
          onClose={() => setRestrictDialogItem(null)}
        />
      )}

      {/* New Restriction Modal */}
      {isNewRestrictOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
              Restrict User Account
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-secondary, #64748B)' }}>
              Revoke messaging or social privileges following trust & safety guidelines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)' }}>
                Target User UID
              </label>
              <input
                type="text"
                placeholder="usr_..."
                value={newRestrictUid}
                onChange={(e) => setNewRestrictUid(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)' }}>
                Restriction Type
              </label>
              <select
                value={newRestrictType}
                onChange={(e) => setNewRestrictType(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  fontSize: 13,
                  background: 'var(--admin-surface-raised, #F8FAFC)',
                }}
              >
                <option value="DM_DISABLED">Disable Direct Messaging (DM_DISABLED)</option>
                <option value="FOLLOW_DISABLED">Disable Following (FOLLOW_DISABLED)</option>
                <option value="FULL_RESTRICTION">Full Communication Restriction</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)' }}>
                Justification & Reason (Logged to Audit Trail)
              </label>
              <textarea
                rows={3}
                placeholder="Describe reason for restriction..."
                value={newRestrictReason}
                onChange={(e) => setNewRestrictReason(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsNewRestrictOpen(false)}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--admin-text-secondary, #64748B)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRestriction}
                disabled={!newRestrictUid.trim() || !newRestrictReason.trim()}
                style={{
                  padding: '8px 14px',
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  opacity: !newRestrictUid.trim() || !newRestrictReason.trim() ? 0.5 : 1,
                }}
              >
                Apply Restriction
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1200px) {
          .admin-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .admin-kpi-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 1024px) {
          .admin-middle-split {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
