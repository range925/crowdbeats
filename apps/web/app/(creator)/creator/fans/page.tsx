'use client';

/**
 * Crowdbeats V2 — Solo Musician Creator CRM Studio (Phase 11)
 *
 * Full-featured Creator CRM interface inside Creator Studio:
 * - Supporter Segmentation (Top Supporters, Repeat Supporters, Campaign Backers, Followers Only)
 * - Authorized Tip Analytics & Top Live Stage Session
 * - Interactive Supporter Dossier with Chronological Engagement Timeline
 * - Privacy-respecting Thank-You Notes & Direct Messaging
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useCreatorSupporters,
  useCreatorSupporterDetails,
  callSendCreatorThankYouNote,
} from '@/lib/creator/creatorCrm';
import type {
  CreatorSupporterSummary,
  SupporterSegment,
} from '@crowdbeats/contracts';

export default function CreatorFansPage() {
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'repeat' | 'top' | 'followers' | 'campaign'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupporterId, setSelectedSupporterId] = useState<string | null>(null);

  // Quick message modal state
  const [messagingSupporter, setMessagingSupporter] = useState<CreatorSupporterSummary | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hook for supporters list & analytics
  const {
    supporters,
    analytics,
    totalCount,
    loading,
    error,
    refresh,
  } = useCreatorSupporters({
    segmentFilter,
    searchQuery,
  });

  // Hook for selected supporter details
  const {
    details,
    loading: detailsLoading,
    refresh: refreshDetails,
  } = useCreatorSupporterDetails(selectedSupporterId || undefined);

  const handleSendThankYouSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingSupporter || !thankYouMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      await callSendCreatorThankYouNote({
        supporterId: messagingSupporter.supporterId,
        message: thankYouMessage.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Thank you note sent to ${messagingSupporter.displayName}!`,
      });
      setMessagingSupporter(null);
      setThankYouMessage('');
      refresh();
      if (selectedSupporterId) refreshDetails();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to send thank you note.',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getSegmentBadge = (segment: SupporterSegment) => {
    switch (segment) {
      case 'TOP_SUPPORTER':
        return {
          label: 'TOP SUPPORTER',
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#D97706',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        };
      case 'REPEAT_SUPPORTER':
        return {
          label: 'REPEAT PATRON',
          bg: 'rgba(139, 92, 246, 0.15)',
          color: '#8B5CF6',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        };
      case 'RECENT_SUPPORTER':
        return {
          label: 'RECENT',
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#3B82F6',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        };
      case 'CAMPAIGN_BACKER':
        return {
          label: 'CAMPAIGN BACKER',
          bg: 'rgba(236, 72, 153, 0.15)',
          color: '#EC4899',
          border: '1px solid rgba(236, 72, 153, 0.3)',
        };
      case 'FOLLOWER_ONLY':
      default:
        return {
          label: 'FOLLOWER',
          bg: 'rgba(107, 114, 128, 0.15)',
          color: '#6B7280',
          border: '1px solid rgba(107, 114, 128, 0.3)',
        };
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto', color: 'var(--text-primary, #1D1D1F)' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>❤️</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              My Supporters & Fan Community
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 14, margin: '6px 0 0 38px' }}>
            Segment your patrons, view authorized tip analytics, explore engagement history, and send consent-verified messages.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={refresh}
            style={{
              background: 'var(--surface-raised, #F5F5F7)',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
              color: 'var(--text-primary, #1D1D1F)',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🔄 Refresh</span>
          </button>
          <Link href="/creator/messages" style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: '#000000',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💬 Open Creator Inbox
            </button>
          </Link>
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
            background: feedback.type === 'success' ? 'rgba(48, 209, 88, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: feedback.type === 'success' ? '#248A3D' : '#DC2626',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(48, 209, 88, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* ── Top Analytics Bento ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>TOTAL SUPPORTERS</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{totalCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 4 }}>
            Followers & financial patrons
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>REPEAT SUPPORTER RATE</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#8B5CF6' }}>
            {analytics?.repeatSupporterRatePct ?? 0}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 4 }}>
            {analytics?.repeatSupportersCount ?? 0} fans backed 2+ times
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>LIFETIME TIPS RECEIVED</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981' }}>
            ${((analytics?.totalTipsReceivedCents ?? 0) / 100).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 4 }}>
            Across {analytics?.totalTipsCount ?? 0} direct tips
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>AVERAGE TIP SIZE</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#3B82F6' }}>
            ${((analytics?.averageTipCents ?? 0) / 100).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 4 }}>
            ${((analytics?.recentTipsVolume30dCents ?? 0) / 100).toFixed(2)} in last 30d
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>TOP STAGE SESSION</div>
          <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {analytics?.topTippingSession?.sessionTitle || 'No stage session yet'}
          </div>
          <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 6 }}>
            {analytics?.topTippingSession ? `$${(analytics.topTippingSession.totalCents / 100).toFixed(2)} (${analytics.topTippingSession.tipsCount} tips)` : 'Go live to see stats'}
          </div>
        </div>
      </div>

      {/* ── Segment Tabs & Search Bar ───────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'all', label: 'All Supporters' },
            { id: 'repeat', label: `Repeat Patrons (${analytics?.repeatSupportersCount ?? 0})` },
            { id: 'top', label: `Top Supporters (${analytics?.topSupportersCount ?? 0})` },
            { id: 'campaign', label: 'Campaign Backers' },
            { id: 'followers', label: 'Followers Only' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSegmentFilter(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: segmentFilter === tab.id ? '#000000' : 'var(--surface-raised, #F5F5F7)',
                color: segmentFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary, #6E6E73)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          <input
            type="text"
            placeholder="Search supporters by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.12))',
              background: 'var(--surface-card, #FFFFFF)',
              fontSize: 13,
              width: 260,
              color: 'var(--text-primary, #1D1D1F)',
            }}
          />
        </div>
      </div>

      {/* ── Main Layout: Table and Dossier Drawer ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedSupporterId ? '1fr 440px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Supporters Table */}
        <div style={{ background: 'var(--surface-card, #FFFFFF)', borderRadius: 14, border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading supporters and tip analytics...
            </div>
          ) : supporters.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>❤️</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No supporters found in this segment</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)' }}>
                {searchQuery ? 'Try adjusting your search query.' : 'Go live or launch a crowdfunding campaign to start growing your supporter community.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-raised, #F5F5F7)', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', color: 'var(--text-secondary, #6E6E73)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Supporter & Identity</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Segment</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Lifetime Value</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Contributions</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Follower Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Consent & Privacy</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supporters.map((s) => {
                  const badge = getSegmentBadge(s.segment);
                  const isSelected = selectedSupporterId === s.supporterId;

                  return (
                    <tr
                      key={s.supporterId}
                      onClick={() => setSelectedSupporterId(isSelected ? null : s.supporterId)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: s.isAnonymous ? '#9CA3AF' : '#1D1D1F',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 13,
                              overflow: 'hidden',
                            }}
                          >
                            {s.isAnonymous ? '👤' : s.photoUrl ? (
                              <img src={s.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              s.displayName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: s.isAnonymous ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                              {s.displayName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary, #86868B)' }}>
                              {s.lastSupportedAt ? `Last active ${new Date(s.lastSupportedAt).toLocaleDateString()}` : 'Follower'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: badge.bg,
                            color: badge.color,
                            border: badge.border,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 800, color: s.lifetimeValueCents > 0 ? '#10B981' : 'var(--text-secondary)' }}>
                        ${(s.lifetimeValueCents / 100).toFixed(2)}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div>{s.tipsCount} tips (${(s.totalTipsCents / 100).toFixed(2)})</div>
                        {s.campaignsCount > 0 && (
                          <div style={{ fontSize: 11, color: '#EC4899', fontWeight: 600 }}>
                            {s.campaignsCount} campaigns backed
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {s.isFollower ? (
                          <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Following</span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>Not following</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {s.isAnonymous ? (
                          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>🔒 Anonymous (Contact Disabled)</span>
                        ) : s.allowsDirectMessaging ? (
                          <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✉️ Messaging Allowed</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>🚫 Direct Messages Opted-Out</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {s.allowsDirectMessaging && !s.isAnonymous && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessagingSupporter(s);
                              }}
                              style={{
                                background: '#000000',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Say Thanks
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupporterId(isSelected ? null : s.supporterId);
                            }}
                            style={{
                              background: 'var(--surface-raised, #F5F5F7)',
                              border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
                              color: 'var(--text-primary)',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {isSelected ? 'Close' : 'Dossier'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Supporter Detail Dossier Drawer */}
        {selectedSupporterId && (
          <div
            style={{
              background: 'var(--surface-card, #FFFFFF)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            {detailsLoading || !details ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                Loading supporter dossier...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Dossier Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', paddingBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>SUPPORTER DOSSIER</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 2px' }}>
                      {details.supporter.displayName}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      ID: {details.supporter.supporterId}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSupporterId(null)}
                    style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Lifetime Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--surface-raised, #F5F5F7)', padding: 14, borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Lifetime Contributed</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                      ${(details.supporter.lifetimeValueCents / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Segment</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>
                      {details.supporter.segment}
                    </div>
                  </div>
                </div>

                {/* Privacy & Consent Status */}
                <div style={{ fontSize: 12, background: details.supporter.allowsDirectMessaging ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', padding: 12, borderRadius: 8, border: `1px solid ${details.supporter.allowsDirectMessaging ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                  <div style={{ fontWeight: 700, color: details.supporter.allowsDirectMessaging ? '#059669' : '#DC2626' }}>
                    {details.supporter.allowsDirectMessaging ? '✓ Fan Consent Granted' : '🔒 Direct Contact Restricted'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {details.supporter.allowsDirectMessaging
                      ? 'Fan permits direct messages from creators they support.'
                      : 'Fan has opted out of direct messages or requested anonymous tipping.'}
                  </div>
                </div>

                {/* Chronological Engagement Timeline */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    Chronological Engagement Timeline ({details.engagementHistory.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                    {details.engagementHistory.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No events recorded yet.</div>
                    ) : (
                      details.engagementHistory.map((evt) => (
                        <div key={evt.eventId} style={{ borderLeft: '2px solid #000000', paddingLeft: 10, fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{evt.summary}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                            {new Date(evt.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Message Button */}
                {details.supporter.allowsDirectMessaging && !details.supporter.isAnonymous && (
                  <button
                    onClick={() => setMessagingSupporter(details.supporter)}
                    style={{
                      width: '100%',
                      background: '#000000',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: 10,
                    }}
                  >
                    💌 Send Personalized Thank You Note
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Thank You Note Compose Modal ────────────────────────────────────── */}
      {messagingSupporter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.1)',
              width: '100%',
              maxWidth: 500,
              padding: 24,
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  Send Note to {messagingSupporter.displayName}
                </h3>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  Direct artist note delivered into the fan's inbox with notification.
                </div>
              </div>
              <button
                onClick={() => setMessagingSupporter(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6B7280' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendThankYouSubmit}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Your Message
              </label>
              <textarea
                rows={4}
                placeholder="Thank you so much for supporting my music! Your tip means the world to me..."
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  fontSize: 13,
                  resize: 'vertical',
                  marginBottom: 16,
                  fontFamily: 'inherit',
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setMessagingSupporter(null)}
                  style={{
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                    borderRadius: 6,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage}
                  style={{
                    background: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSendingMessage ? 'Sending...' : 'Send Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
