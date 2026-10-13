'use client';

/**
 * Crowdbeats V2 — Band CRM & Supporter Community (Phase 12)
 *
 * Full-featured Band CRM interface inside Band Studio:
 * - Band Supporter Segmentation (Top Supporters, Repeat Patrons, Campaign Backers, Followers Only)
 * - Authorized Tip Analytics & Top Live Stage Session for Band
 * - Interactive Supporter Dossier with Chronological Engagement Timeline
 * - Privacy-respecting Thank-You Notes & Direct Messaging acting as the Band
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  useBandSupporters,
  useBandSupporterDetails,
  callSendBandThankYouNote,
} from '@/lib/band/bandCrm';
import type {
  BandSupporterSummary,
  SupporterSegment,
} from '@crowdbeats/contracts';

export default function BandFansPage() {
  const { user } = useAuth();
  // Default band ID or from user profile
  const bandId = (user as any)?.bandId || (user as any)?.activeBandId || 'band_neon_pulse';

  const [segmentFilter, setSegmentFilter] = useState<'all' | 'repeat' | 'top' | 'followers' | 'campaign'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupporterId, setSelectedSupporterId] = useState<string | null>(null);

  // Quick message modal state
  const [messagingSupporter, setMessagingSupporter] = useState<BandSupporterSummary | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hook for supporters list & analytics
  const {
    supporters,
    analytics,
    totalCount,
    bandName,
    loading,
    error,
    refresh,
  } = useBandSupporters(bandId, {
    segmentFilter,
    searchQuery,
  });

  // Hook for selected supporter details
  const {
    details,
    loading: detailsLoading,
    refresh: refreshDetails,
  } = useBandSupporterDetails(bandId, selectedSupporterId || undefined);

  const handleSendThankYouSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingSupporter || !thankYouMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      await callSendBandThankYouNote({
        bandId,
        supporterId: messagingSupporter.supporterId,
        message: thankYouMessage.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Thank you note sent on behalf of ${bandName || 'the band'} to ${messagingSupporter.displayName}!`,
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
            <span style={{ fontSize: 28 }}>🎸</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Band Audience & Supporter CRM
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 14, margin: '6px 0 0 38px' }}>
            Segment fans across all band gigs and campaigns, inspect verified tip analytics, and engage consenting patrons.
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
          <Link href="/band/messages" style={{ textDecoration: 'none' }}>
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
              💬 Band Inbox
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
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>TOTAL BAND SUPPORTERS</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{totalCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 4 }}>
            Followers, live tippers & backers
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>REPEAT PATRON RATE</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#8B5CF6' }}>
            {analytics?.repeatSupporterRatePct ?? 0}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 4 }}>
            {analytics?.repeatSupportersCount ?? 0} fans backed 2+ times
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>LIFETIME BAND TIPS</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981' }}>
            ${((analytics?.totalTipsReceivedCents ?? 0) / 100).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 4 }}>
            Across {analytics?.totalTipsCount ?? 0} tips (distributed by split)
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>AVERAGE BAND TIP</div>
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
            {analytics?.topTippingSession ? `$${(analytics.topTippingSession.totalCents / 100).toFixed(2)} (${analytics.topTippingSession.tipsCount} tips)` : 'Check into stage to see stats'}
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
            placeholder="Search band fans by name..."
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
              Loading band supporters and tip analytics...
            </div>
          ) : supporters.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎸</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No supporters found in this segment</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)' }}>
                {searchQuery ? 'Try adjusting your search query.' : 'Perform live as a band or launch a crowdfunding project to grow your collective audience.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-raised, #F5F5F7)', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', color: 'var(--text-secondary, #6E6E73)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Supporter & Identity</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Segment</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Lifetime Value</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Band Support</th>
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
                            {s.campaignsCount} campaigns backed (${(s.totalCampaignContributionCents / 100).toFixed(2)})
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
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>
                  {details?.supporter.displayName || 'Supporter Dossier'}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  ID: {selectedSupporterId}
                </div>
              </div>
              <button
                onClick={() => setSelectedSupporterId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading engagement history...
              </div>
            ) : details ? (
              <div>
                {/* Supporter Badge & Financial Metric */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: getSegmentBadge(details.supporter.segment).bg,
                      color: getSegmentBadge(details.supporter.segment).color,
                      border: getSegmentBadge(details.supporter.segment).border,
                    }}
                  >
                    {getSegmentBadge(details.supporter.segment).label}
                  </span>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#10B981' }}>
                    ${(details.supporter.lifetimeValueCents / 100).toFixed(2)} LTV
                  </div>
                </div>

                {/* Chronological Engagement Timeline */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.04em' }}>
                    ENGAGEMENT TIMELINE
                  </div>
                  {details.engagementHistory.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No recorded interactions yet.</div>
                  ) : (
                    <div style={{ borderLeft: '2px solid var(--border-subtle, rgba(0,0,0,0.1))', paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {details.engagementHistory.map((evt) => (
                        <div key={evt.eventId} style={{ position: 'relative' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: -19,
                              top: 2,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: evt.type === 'TIP_RECEIVED' ? '#10B981' : evt.type === 'CAMPAIGN_BACKED' ? '#EC4899' : '#3B82F6',
                            }}
                          />
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                            {new Date(evt.timestamp).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {evt.summary}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Itemized Tip History */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.04em' }}>
                    ITEMIZED BAND TIPS ({details.tipBreakdown.length})
                  </div>
                  {details.tipBreakdown.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No direct tips received.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {details.tipBreakdown.map((tip) => (
                        <div
                          key={tip.tipId}
                          style={{
                            background: 'var(--surface-raised, #F5F5F7)',
                            padding: 10,
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span style={{ color: '#10B981' }}>${(tip.amountCents / 100).toFixed(2)}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                              {new Date(tip.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {tip.message && (
                            <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-primary)' }}>
                              "{tip.message}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campaign Contributions */}
                {details.campaignContributions.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.04em' }}>
                      CAMPAIGN BACKINGS ({details.campaignContributions.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {details.campaignContributions.map((c) => (
                        <div
                          key={c.contributionId}
                          style={{
                            background: 'var(--surface-raised, #F5F5F7)',
                            padding: 10,
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span>{c.campaignTitle}</span>
                            <span style={{ color: '#EC4899' }}>${(c.amountCents / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Thank-You Note Compose Modal ────────────────────────────────────── */}
      {messagingSupporter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 500,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>
              Say Thanks to {messagingSupporter.displayName}
            </h3>
            <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
              Deliver a thank you note directly from <strong>{bandName || 'the band'}</strong> to this fan's conversation thread. Only fans who have opted into band messaging can be contacted.
            </p>

            <form onSubmit={handleSendThankYouSubmit}>
              <textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                placeholder={`Hey ${messagingSupporter.displayName.split(' ')[0]}, thank you so much for rocking out with us and supporting our music!`}
                maxLength={500}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  marginBottom: 12,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 18 }}>
                <span>🔒 Fan messaging consent verified</span>
                <span>{thankYouMessage.length}/500</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setMessagingSupporter(null)}
                  disabled={isSendingMessage}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'var(--surface-raised, #F5F5F7)',
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage || !thankYouMessage.trim()}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSendingMessage || !thankYouMessage.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSendingMessage || !thankYouMessage.trim() ? 0.6 : 1,
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
