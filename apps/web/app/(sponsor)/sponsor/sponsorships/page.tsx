/**
 * Crowdbeats V2 — Sponsor Deals & Active Sponsorships (Phase 13)
 *
 * Deal pipeline: Proposed, Negotiating, Active, Completed, Cancelled.
 * - Dual-signed contract state machine
 * - Deliverables milestone tracking & proof sign-offs
 * - Escrow commitment and release monitoring
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOptionalAuth } from '@/lib/hooks/useAuth';
import { useSponsorshipDeals } from '@/lib/sponsor/sponsorCrm';
import type { SponsorshipDeal, SponsorshipDeliverable } from '@crowdbeats/contracts';

export default function SponsorSponsorshipsPage() {
  const auth = useOptionalAuth();
  const orgId = (auth?.user as any)?.orgId || (auth?.user as any)?.sponsorOrgId || 'org_redbull';
  const { deals, loading, sign, updateDeliverable } = useSponsorshipDeals({ orgId });

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDeal, setSelectedDeal] = useState<SponsorshipDeal | null>(null);
  const [signatureName, setSignatureName] = useState(auth?.displayName || 'Marcus Vance');
  const [signing, setSigning] = useState(false);
  const [verifyingDel, setVerifyingDel] = useState<SponsorshipDeliverable | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredDeals = deals.filter((d) => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  const handleSignDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    setSigning(true);
    setFeedback(null);
    try {
      const res = await sign(selectedDeal.sponsorshipId, signatureName, true);
      setFeedback({
        type: 'success',
        message:
          res.status === 'active'
            ? `Agreement executed! Both parties have signed and $${(res.escrowAllocatedCents / 100).toFixed(2)} escrow is locked.`
            : 'Agreement signed on behalf of organization. Awaiting artist signature.',
      });
      setSelectedDeal(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to sign contract.',
      });
    } finally {
      setSigning(false);
    }
  };

  const handleDeliverableAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedDeal || !verifyingDel) return;

    try {
      await updateDeliverable(
        selectedDeal.sponsorshipId,
        verifyingDel.deliverableId,
        action,
        undefined,
        action === 'APPROVE' ? 'Approved by sponsor representative.' : 'Changes requested.'
      );
      setFeedback({
        type: 'success',
        message: `Milestone deliverable ${verifyingDel.title} ${action.toLowerCase()}d.`,
      });
      setVerifyingDel(null);
      setSelectedDeal(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update deliverable.',
      });
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Sponsorship Deals & Contracts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Manage legally-binding dual-signed sponsorship agreements, milestone proofs, and escrow disbursements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, background: 'var(--surface-raised)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            {['all', 'proposed', 'negotiating', 'active', 'completed'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: filterStatus === s ? 'var(--accent-secondary)' : 'transparent',
                  color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <Link
            href="/sponsor/shortlist"
            style={{
              background: 'var(--accent-secondary)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            + Propose New Deal
          </Link>
        </div>
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
          Loading sponsorship agreements...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📜</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
            No Deals Found
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20 }}>
            {filterStatus === 'all'
              ? 'Propose deals to shortlisted musicians or accept incoming applications.'
              : `No sponsorship deals currently in status "${filterStatus}".`}
          </div>
          <Link
            href="/sponsor/shortlist"
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
            Go to Saved Shortlist
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Agreement Title</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Performer</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Value</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Signatures</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredDeals.map((d) => {
                const isOrgSigned = Boolean(d.signedByOrgAt);
                const isArtistSigned = Boolean(d.signedByArtistAt);
                const hasPendingDeliverable = d.deliverables?.some((del) => del.status === 'submitted');

                return (
                  <tr key={d.sponsorshipId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div>{d.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                        ID: {d.sponsorshipId}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {d.recipientName} ({d.recipientType})
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--accent-secondary)', fontWeight: 800 }}>
                      ${(d.valueAmountCents / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: isOrgSigned ? 'rgba(0,240,118,0.15)' : 'rgba(239,68,68,0.15)', color: isOrgSigned ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 700 }}>
                          {isOrgSigned ? '✓ Sponsor' : '✕ Sponsor'}
                        </span>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: isArtistSigned ? 'rgba(0,240,118,0.15)' : 'rgba(239,68,68,0.15)', color: isArtistSigned ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 700 }}>
                          {isArtistSigned ? '✓ Artist' : '✕ Artist'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          background:
                            d.status === 'active'
                              ? 'rgba(0, 240, 118, 0.15)'
                              : d.status === 'completed'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : d.status === 'negotiating'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(156, 163, 175, 0.15)',
                          color:
                            d.status === 'active'
                              ? 'var(--status-success)'
                              : d.status === 'completed'
                                ? '#3B82F6'
                                : d.status === 'negotiating'
                                  ? '#F59E0B'
                                  : 'var(--text-secondary)',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {!isOrgSigned ? (
                          <button
                            onClick={() => setSelectedDeal(d)}
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
                            Sign Agreement
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedDeal(d)}
                            style={{
                              background: hasPendingDeliverable ? 'rgba(245,158,11,0.2)' : 'var(--surface-raised)',
                              border: `1px solid ${hasPendingDeliverable ? '#F59E0B' : 'var(--border-subtle)'}`,
                              color: hasPendingDeliverable ? '#F59E0B' : 'var(--text-primary)',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            {hasPendingDeliverable ? 'Deliverables (!)' : 'View Contract ↗'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── Deal Details & Sign Modal ───────────────────────────────────────── */}
      {selectedDeal && (
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
              maxWidth: 640,
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedDeal.title}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Performer: {selectedDeal.recipientName} · Total Value: ${(selectedDeal.valueAmountCents / 100).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Contract Dual Signature Status */}
            <div style={{ background: 'var(--surface-card)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
                Dual-Signature Verification
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-raised)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Sponsor Signature:</div>
                  <div style={{ color: selectedDeal.signedByOrgAt ? 'var(--status-success)' : '#EF4444', marginTop: 2 }}>
                    {selectedDeal.signedByOrgAt
                      ? `Signed by ${selectedDeal.signedByOrgName || 'Org Rep'} on ${new Date(selectedDeal.signedByOrgAt).toLocaleDateString()}`
                      : 'Pending Signature'}
                  </div>
                </div>
                <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-raised)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Artist / Band Signature:</div>
                  <div style={{ color: selectedDeal.signedByArtistAt ? 'var(--status-success)' : '#EF4444', marginTop: 2 }}>
                    {selectedDeal.signedByArtistAt
                      ? `Signed by ${selectedDeal.signedByArtistName || 'Performer'} on ${new Date(selectedDeal.signedByArtistAt).toLocaleDateString()}`
                      : 'Pending Signature'}
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverables Checklist */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Contract Deliverables & Proofs
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedDeal.deliverables?.map((del) => (
                  <div
                    key={del.deliverableId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--surface-card)',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{del.title}</div>
                      {del.proofUrl && (
                        <a
                          href={del.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: 'var(--accent-secondary)', textDecoration: 'none' }}
                        >
                          🔗 View submitted proof
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
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
                      {del.status === 'submitted' && (
                        <button
                          onClick={() => setVerifyingDel(del)}
                          style={{
                            background: 'var(--accent-secondary)',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Sign-Off
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign Agreement Form (if not signed by org) */}
            {!selectedDeal.signedByOrgAt ? (
              <form onSubmit={handleSignDeal} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Authorized Organization Representative Signature
                  </label>
                  <input
                    type="text"
                    required
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Type full legal name..."
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
                    onClick={() => setSelectedDeal(null)}
                    style={{
                      padding: '8px 14px',
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
                    disabled={signing}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--accent-secondary)',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: signing ? 'not-allowed' : 'pointer',
                      opacity: signing ? 0.7 : 1,
                    }}
                  >
                    {signing ? 'Signing Agreement…' : 'Sign & Commit Escrow'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDeal(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deliverable Sign-Off Modal ───────────────────────────────────────── */}
      {verifyingDel && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 480,
              padding: 24,
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              Verify Milestone: {verifyingDel.title}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              {verifyingDel.notes || 'Proof submitted for brand review.'}
            </p>
            {verifyingDel.proofUrl && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'var(--surface-card)' }}>
                <a href={verifyingDel.proofUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)', fontSize: 13 }}>
                  🔗 Open Submitted Proof URL ↗
                </a>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleDeliverableAction('REJECT')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--status-error)',
                  background: 'transparent',
                  color: 'var(--status-error)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Request Revisions
              </button>
              <button
                type="button"
                onClick={() => handleDeliverableAction('APPROVE')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--status-success)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Approve Deliverable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
