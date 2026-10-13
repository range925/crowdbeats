/**
 * Crowdbeats V2 — Creator Brand Sponsorships Hub (Phase 13)
 *
 * Full-lifecycle sponsorship management for Solo Artists and Bands:
 * - Review and execute incoming brand contracts with legal typed signatures
 * - Submit deliverable proofs (stage shoutouts, banners, EPK logos)
 * - Browse brand opportunities and submit tour pitches
 * - Track brand earnings and escrow releases
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOptionalAuth } from '@/lib/hooks/useAuth';
import {
  useSponsorshipDeals,
  useSponsorOpportunities,
  useSponsorApplications,
} from '@/lib/sponsor/sponsorCrm';
import type {
  SponsorshipDeal,
  SponsorshipDeliverable,
  SponsorOpportunity,
} from '@crowdbeats/contracts';

type CreatorSponsorTab = 'proposals' | 'active' | 'opportunities' | 'completed';

export default function CreatorSponsorshipsPage() {
  const auth = useOptionalAuth();
  const user = auth?.user;
  const currentUid = user?.uid || 'uid_artist_solo';
  const recipientType = (user as any)?.bandId ? 'band' : 'artist';
  const recipientId = (user as any)?.bandId || currentUid;
  const creatorDisplayName = auth?.displayName || (recipientType === 'band' ? 'Band Performer' : 'Solo Musician');

  const { deals, loading: loadingDeals, sign, updateDeliverable } = useSponsorshipDeals({
    recipientId,
  });
  const { opportunities, loading: loadingOpps } = useSponsorOpportunities();
  const { submit: submitApp } = useSponsorApplications({ applicantId: recipientId });

  const [activeTab, setActiveTab] = useState<CreatorSponsorTab>('proposals');

  // Sign Modal
  const [signingDeal, setSigningDeal] = useState<SponsorshipDeal | null>(null);
  const [legalName, setLegalName] = useState(creatorDisplayName);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signing, setSigning] = useState(false);

  // Deliverable Proof Modal
  const [submittingDel, setSubmittingDel] = useState<{ deal: SponsorshipDeal; deliverable: SponsorshipDeliverable } | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [delNotes, setDelNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  // Apply to Opportunity Modal
  const [applyingOpp, setApplyingOpp] = useState<SponsorOpportunity | null>(null);
  const [pitchText, setPitchText] = useState('');
  const [reqAmount, setReqAmount] = useState('1500');
  const [mediaLink, setMediaLink] = useState('');
  const [applying, setApplying] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Computed Bento Metrics
  const activeDeals = deals.filter((d) => d.status === 'active');
  const pendingProposals = deals.filter((d) => d.status === 'proposed' || d.status === 'negotiating');
  const completedDeals = deals.filter((d) => d.status === 'completed');
  const totalEarnedCents = deals
    .filter((d) => d.status === 'active' || d.status === 'completed')
    .reduce((acc, d) => acc + d.valueAmountCents, 0);

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingDeal) return;

    setSigning(true);
    setFeedback(null);
    try {
      const res = await sign(signingDeal.sponsorshipId, legalName, agreeTerms);
      setFeedback({
        type: 'success',
        message:
          res.status === 'active'
            ? `Agreement executed! Sponsor escrow ($${(res.escrowAllocatedCents / 100).toFixed(2)}) is locked. Deal is now ACTIVE!`
            : 'Agreement signed. Awaiting sponsor signature and escrow funding.',
      });
      setSigningDeal(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to sign contract.',
      });
    } finally {
      setSigning(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingDel) return;

    setSubmittingProof(true);
    setFeedback(null);
    try {
      await updateDeliverable(
        submittingDel.deal.sponsorshipId,
        submittingDel.deliverable.deliverableId,
        'SUBMIT_PROOF',
        proofUrl,
        delNotes
      );
      setFeedback({
        type: 'success',
        message: `Proof for "${submittingDel.deliverable.title}" submitted to ${submittingDel.deal.sponsorName} for review.`,
      });
      setSubmittingDel(null);
      setProofUrl('');
      setDelNotes('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to submit deliverable proof.',
      });
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleApplyOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingOpp) return;

    setApplying(true);
    setFeedback(null);
    try {
      const amountCents = Math.round(parseFloat(reqAmount || '0') * 100);
      await submitApp({
        orgId: applyingOpp.orgId,
        opportunityId: applyingOpp.opportunityId,
        applicantId: recipientId,
        applicantType: recipientType,
        applicantName: creatorDisplayName,
        pitch: pitchText,
        requestedAmountCents: amountCents,
        mediaLinks: mediaLink ? [mediaLink] : [],
      });
      setFeedback({
        type: 'success',
        message: `Pitch submitted to ${applyingOpp.sponsorName}! Check back for brand review.`,
      });
      setApplyingOpp(null);
      setPitchText('');
      setMediaLink('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to submit application.',
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Brand Sponsorships & Endorsements
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Connect with corporate partners, sign verified tour contracts, and submit proof for escrow releases.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('opportunities')}
          style={{
            background: 'var(--accent-secondary)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🔍 Browse Open Brand Calls
        </button>
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

      {/* ── Top Bento Metrics ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
            Active Brand Deals
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
            {activeDeals.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--status-success)', marginTop: 4 }}>
            ● In contract & stage delivery
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
            Brand Value Committed
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-secondary)' }}>
            ${(totalEarnedCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Backed by Stripe platform escrow
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
            Pending Proposals
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: pendingProposals.length > 0 ? '#F59E0B' : 'var(--text-primary)' }}>
            {pendingProposals.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Awaiting creator or brand signature
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
            Open Brand Opportunities
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
            {opportunities.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Brands accepting tour pitches
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 24, gap: 12, overflowX: 'auto' }}>
        {[
          { id: 'proposals', label: 'Proposals & Contracts', count: pendingProposals.length },
          { id: 'active', label: 'Active Deals & Deliverables', count: activeDeals.length },
          { id: 'opportunities', label: 'Browse Brand Calls', count: opportunities.length },
          { id: 'completed', label: 'Completed Archive', count: completedDeals.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CreatorSponsorTab)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                style={{
                  background: activeTab === tab.id ? 'var(--accent-secondary)' : 'var(--surface-raised)',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Proposals & Contracts ────────────────────────────────────── */}
      {activeTab === 'proposals' && (
        <div>
          {loadingDeals ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading proposals...</div>
          ) : pendingProposals.length === 0 ? (
            <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                No Pending Proposals
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20 }}>
                When corporate sponsors or festival brands offer deals, they will appear here for your review and signature.
              </div>
              <button
                onClick={() => setActiveTab('opportunities')}
                style={{
                  background: 'var(--accent-secondary)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Browse Open Brand Opportunities
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingProposals.map((deal) => {
                const isOrgSigned = Boolean(deal.signedByOrgAt);
                const isArtistSigned = Boolean(deal.signedByArtistAt);

                return (
                  <div
                    key={deal.sponsorshipId}
                    style={{
                      background: 'var(--surface-card)',
                      borderRadius: 14,
                      border: '1px solid var(--border-subtle)',
                      padding: 24,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                          {deal.sponsorName}
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {deal.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 640 }}>
                          {deal.description || 'Stage sponsorship and brand endorsement agreement.'}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-secondary)' }}>
                          ${(deal.valueAmountCents / 100).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total Deal Value</div>
                      </div>
                    </div>

                    {/* Dual-Signature Checklist */}
                    <div style={{ display: 'flex', gap: 16, background: 'var(--surface-raised)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
                      <div>
                        <strong>Sponsor Signed:</strong>{' '}
                        <span style={{ color: isOrgSigned ? 'var(--status-success)' : '#EF4444', fontWeight: 600 }}>
                          {isOrgSigned ? `✓ ${deal.signedByOrgName || 'Yes'}` : 'Pending Sponsor Signature'}
                        </span>
                      </div>
                      <div>
                        <strong>Your Signature:</strong>{' '}
                        <span style={{ color: isArtistSigned ? 'var(--status-success)' : '#EF4444', fontWeight: 600 }}>
                          {isArtistSigned ? `✓ Signed (${deal.signedByArtistName})` : 'Signature Required'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      {!isArtistSigned ? (
                        <button
                          onClick={() => {
                            setSigningDeal(deal);
                            setLegalName(creatorDisplayName);
                            setAgreeTerms(false);
                          }}
                          style={{
                            background: 'var(--accent-secondary)',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Review & Sign Agreement
                        </button>
                      ) : (
                        <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, padding: '8px 12px' }}>
                          ✓ You have signed. Awaiting sponsor finalization.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Active Deals & Deliverables ───────────────────────────────── */}
      {activeTab === 'active' && (
        <div>
          {activeDeals.length === 0 ? (
            <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎸</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                No Active Brand Deals
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                Agreements become active once both you and the sponsor have executed dual-signatures and escrow is locked.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {activeDeals.map((deal) => (
                <div
                  key={deal.sponsorshipId}
                  style={{
                    background: 'var(--surface-card)',
                    borderRadius: 14,
                    border: '1px solid var(--border-subtle)',
                    padding: 24,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--status-success)', fontWeight: 700, textTransform: 'uppercase' }}>
                        ● Active Agreement
                      </div>
                      <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {deal.title}
                      </h3>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Partner: {deal.sponsorName} · Escrow Committed: ${(deal.valueAmountCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Deliverables List */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      Stage Milestones & Deliverables:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {deal.deliverables?.map((del) => (
                        <div
                          key={del.deliverableId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: 'var(--surface-raised)',
                            borderRadius: 8,
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{del.title}</div>
                            {del.proofUrl && (
                              <a
                                href={del.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 11, color: 'var(--accent-secondary)', textDecoration: 'none' }}
                              >
                                🔗 Proof: {del.proofUrl}
                              </a>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 4,
                                textTransform: 'uppercase',
                                background:
                                  del.status === 'approved'
                                    ? 'rgba(0,240,118,0.15)'
                                    : del.status === 'submitted'
                                      ? 'rgba(245,158,11,0.15)'
                                      : 'rgba(156,163,175,0.15)',
                                color:
                                  del.status === 'approved'
                                    ? 'var(--status-success)'
                                    : del.status === 'submitted'
                                      ? '#F59E0B'
                                      : 'var(--text-secondary)',
                              }}
                            >
                              {del.status}
                            </span>

                            {del.status === 'pending' || del.status === 'rejected' ? (
                              <button
                                onClick={() => setSubmittingDel({ deal, deliverable: del })}
                                style={{
                                  background: 'var(--accent-secondary)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Submit Proof ↗
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Browse Open Brand Calls ─────────────────────────────────── */}
      {activeTab === 'opportunities' && (
        <div>
          {loadingOpps ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading brand calls...</div>
          ) : opportunities.length === 0 ? (
            <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                No Open Brand Calls Currently
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                Check back regularly as corporate sponsors launch new seasonal tour match pools and festival sponsorships.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              {opportunities.map((opp) => (
                <div
                  key={opp.opportunityId}
                  style={{
                    background: 'var(--surface-card)',
                    borderRadius: 14,
                    border: '1px solid var(--border-subtle)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                      {opp.sponsorName}
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {opp.title}
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {opp.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-raised)', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Budget Per Act:</span>
                      <strong style={{ color: 'var(--accent-secondary)' }}>
                        ${(opp.budgetPerPerformerCents / 100).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setApplyingOpp(opp);
                      setReqAmount((opp.budgetPerPerformerCents / 100).toString());
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--accent-secondary)',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Apply for Sponsorship
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Completed Deals ─────────────────────────────────────────── */}
      {activeTab === 'completed' && (
        <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Agreement Title</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Sponsor</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Amount Disbursed</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Completion Date</th>
              </tr>
            </thead>
            <tbody>
              {completedDeals.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 36, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No completed sponsorship deals in archive.
                  </td>
                </tr>
              ) : (
                completedDeals.map((d) => (
                  <tr key={d.sponsorshipId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.title}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{d.sponsorName}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--status-success)', fontWeight: 800 }}>
                      ${(d.valueAmountCents / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-tertiary)' }}>
                      {new Date(d.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sign Agreement Modal ────────────────────────────────────────────── */}
      {signingDeal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
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
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Sign Sponsorship Agreement
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
              You are executing a binding contract with <strong>{signingDeal.sponsorName}</strong> for{' '}
              <strong>${(signingDeal.valueAmountCents / 100).toFixed(2)} USD</strong>.
            </p>

            <form onSubmit={handleSignContract}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Full Legal Name (Electronic Signature)
                </label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <span>I agree to deliver the agreed stage milestones and adhere to sponsor brand guidelines.</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSigningDeal(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signing || !agreeTerms}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent-secondary)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: signing || !agreeTerms ? 'not-allowed' : 'pointer',
                    opacity: signing || !agreeTerms ? 0.6 : 1,
                  }}
                >
                  {signing ? 'Signing Contract…' : 'Sign & Execute Agreement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submit Deliverable Proof Modal ──────────────────────────────────── */}
      {submittingDel && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
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
              maxWidth: 520,
              padding: 28,
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Submit Milestone Proof
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
              Milestone: <strong>{submittingDel.deliverable.title}</strong> for {submittingDel.deal.sponsorName}
            </p>

            <form onSubmit={handleSubmitProof}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Proof Evidence URL (Video clip, Photo link, or Social post)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://instagram.com/p/... or https://youtube.com/..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Delivery Notes & Crowd Impression Details
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Delivered during headline set in Austin, TX to approx. 450 fans..."
                  value={delNotes}
                  onChange={(e) => setDelNotes(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSubmittingDel(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProof}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent-secondary)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: submittingProof ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingProof ? 'Submitting…' : 'Submit for Sign-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Apply to Opportunity Modal ──────────────────────────────────────── */}
      {applyingOpp && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
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
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Apply to {applyingOpp.sponsorName}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
              Opportunity: <strong>{applyingOpp.title}</strong>
            </p>

            <form onSubmit={handleApplyOpp}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Tour & Performance Pitch
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Introduce yourself or your band, upcoming tour schedule, expected audience size, and how you will highlight the brand on stage..."
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
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
                  Requested Sponsorship Amount ($ USD)
                </label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  required
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  EPK or Streaming Music Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/artist/..."
                  value={mediaLink}
                  onChange={(e) => setMediaLink(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setApplyingOpp(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent-secondary)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: applying ? 'not-allowed' : 'pointer',
                  }}
                >
                  {applying ? 'Submitting Pitch…' : 'Submit Pitch to Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
