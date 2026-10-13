/**
 * Crowdbeats V2 — Sponsor Saved Talent Shortlist (Phase 13)
 *
 * Curation console for bookmarked artists and bands:
 * - Real-time synchronized shortlist backed by Firestore
 * - Performer stage metrics and audience cohorts
 * - 1-Click "Propose Sponsorship Deal" with deliverables and contract value
 * - Removal and tag management
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOptionalAuth } from '@/lib/hooks/useAuth';
import { useSponsorShortlist, proposeDealApi } from '@/lib/sponsor/sponsorCrm';
import type { SponsorShortlistItem } from '@crowdbeats/contracts';

export default function SponsorShortlistPage() {
  const auth = useOptionalAuth();
  const orgId = (auth?.user as any)?.orgId || (auth?.user as any)?.sponsorOrgId || 'org_redbull';
  const { items, loading, remove } = useSponsorShortlist(orgId);

  const [selectedPerformer, setSelectedPerformer] = useState<SponsorShortlistItem | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealAmount, setDealAmount] = useState('2500');
  const [dealDescription, setDealDescription] = useState('');
  const [proposing, setProposing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenProposal = (item: SponsorShortlistItem) => {
    setSelectedPerformer(item);
    setDealTitle(`Stage Endorsement & Tour Support — ${item.recipientName}`);
    setDealAmount('2500');
    setDealDescription(`Exclusive beverage and gear sponsorship for upcoming seasonal tour dates with ${item.recipientName}.`);
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerformer) return;

    setProposing(true);
    setFeedback(null);
    try {
      const amountCents = Math.round(parseFloat(dealAmount || '0') * 100);
      if (amountCents < 1000) {
        throw new Error('Minimum proposal value is $10.00');
      }

      await proposeDealApi({
        orgId,
        recipientId: selectedPerformer.recipientId,
        recipientType: selectedPerformer.recipientType,
        recipientName: selectedPerformer.recipientName,
        title: dealTitle,
        description: dealDescription,
        valueAmountCents: amountCents,
        deliverables: [
          {
            deliverableId: 'del_1',
            title: 'Live Stage Acoustic Shoutout & Video Clip',
            type: 'STAGE_SHOUTOUT',
          },
          {
            deliverableId: 'del_2',
            title: 'EPK Logo & Social Media Tour Poster Mention',
            type: 'EPK_LOGO',
          },
        ],
      });

      setFeedback({
        type: 'success',
        message: `Proposal successfully sent to ${selectedPerformer.recipientName}! View it in Active Deals.`,
      });
      setSelectedPerformer(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to submit proposal.',
      });
    } finally {
      setProposing(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Saved Talent Shortlist
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Curated roster of prospective musicians and bands for brand sponsorship and live tour endorsements.
          </p>
        </div>

        <Link
          href="/sponsor/discovery"
          style={{
            background: 'var(--accent-secondary)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          + Browse Talent Directory
        </Link>
      </div>

      {feedback && (
        <div
          role="alert"
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 24,
            fontSize: 13,
            fontWeight: 600,
            background: feedback.type === 'success' ? 'rgba(0, 240, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: feedback.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--status-success)' : 'var(--status-error)'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading shortlisted performers...
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
            Your Shortlist is Empty
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20 }}>
            Bookmark high-engagement artists and bands while browsing the Talent Discovery directory.
          </div>
          <Link
            href="/sponsor/discovery"
            style={{
              background: 'var(--accent-secondary)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Explore Talent Directory
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: 680 }}>
              <thead>
                <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Performer</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Genre & City</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Audience Cohort</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Tip Engagement</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Added</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
              {items.map((item) => (
                <tr key={item.recipientId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {item.recipientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{item.recipientName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'capitalize' }}>
                          {item.recipientType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    {item.genre || 'Independent'} · {item.city || 'National'}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    {item.followerCohort || '5k - 10k fans'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        background: 'rgba(0, 240, 118, 0.15)',
                        color: 'var(--status-success)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {item.engagementRating || 'Top 5%'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                    {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Recently'}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenProposal(item)}
                        style={{
                          background: 'var(--accent-secondary)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Propose Deal
                      </button>
                      <button
                        onClick={() => remove(item.recipientId)}
                        title="Remove from shortlist"
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-tertiary)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── Proposal Modal ─────────────────────────────────────────────────── */}
      {selectedPerformer && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 540,
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                Propose Sponsorship Deal
              </h3>
              <button
                onClick={() => setSelectedPerformer(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Initiate a formal sponsorship agreement for <strong>{selectedPerformer.recipientName}</strong>. Terms will be sent to the creator for dual-signature.
            </p>

            <form onSubmit={handleSendProposal}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Agreement Title
                </label>
                <input
                  type="text"
                  required
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Sponsorship Value ($ USD)
                </label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  required
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                  Funds will be reserved from your available escrow upon mutual dual-signature.
                </span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Campaign Scope & Terms
                </label>
                <textarea
                  rows={3}
                  value={dealDescription}
                  onChange={(e) => setDealDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPerformer(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={proposing}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent-secondary)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: proposing ? 'not-allowed' : 'pointer',
                    opacity: proposing ? 0.7 : 1,
                  }}
                >
                  {proposing ? 'Sending Proposal…' : 'Send Formal Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
