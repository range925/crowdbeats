/**
 * Crowdbeats V2 — Sponsor Inbound Applications (Phase 13)
 *
 * Review pipeline for incoming pitches and tour sponsorship requests:
 * - Real-time synchronized applications feed
 * - Status workflow: submitted → under_review → accepted / declined
 * - Private reviewer notes isolation
 * - Direct conversion to Sponsorship Contract on acceptance
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOptionalAuth } from '@/lib/hooks/useAuth';
import { useSponsorApplications } from '@/lib/sponsor/sponsorCrm';
import type { SponsorApplication } from '@crowdbeats/contracts';

export default function SponsorApplicationsPage() {
  const auth = useOptionalAuth();
  const orgId = (auth?.user as any)?.orgId || (auth?.user as any)?.sponsorOrgId || 'org_redbull';
  const { applications, loading, review } = useSponsorApplications({ orgId });

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<SponsorApplication | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [acceptAmount, setAcceptAmount] = useState('2500');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredApps = applications.filter((app) => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const handleReviewAction = async (action: 'ACCEPT' | 'DECLINE' | 'UNDER_REVIEW') => {
    if (!selectedApp) return;

    setProcessing(true);
    setFeedback(null);
    try {
      const amountCents = action === 'ACCEPT' ? Math.round(parseFloat(acceptAmount || '0') * 100) : undefined;
      const res = await review(
        selectedApp.applicationId,
        action,
        reviewerNotes || undefined
      );

      setFeedback({
        type: 'success',
        message:
          action === 'ACCEPT'
            ? `Application accepted! Formal sponsorship contract ${res.sponsorshipId || ''} created and dispatched.`
            : `Application marked as ${action.toLowerCase().replace('_', ' ')}.`,
      });
      setSelectedApp(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update application status.',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Inbound Sponsorship Applications
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Review incoming artist pitches, tour support requests, and EPK submissions.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, background: 'var(--surface-raised)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          {['all', 'submitted', 'under_review', 'accepted', 'declined'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px',
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
              {s.replace('_', ' ')}
            </button>
          ))}
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
          Loading sponsorship applications...
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📥</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
            No Applications Found
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20 }}>
            {filterStatus === 'all'
              ? 'Publish open brand opportunities to receive inbound pitches from performers.'
              : `No applications currently have status "${filterStatus.replace('_', ' ')}".`}
          </div>
          <Link
            href="/sponsor/opportunities"
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
            Manage Brand Opportunities
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Performer</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Pitch Summary</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Requested</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.applicationId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <div>{app.applicantName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'capitalize' }}>
                      {app.applicantType}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', maxWidth: 300 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.pitch}
                    </div>
                    {app.mediaLinks && app.mediaLinks.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--accent-secondary)', marginTop: 4 }}>
                        🔗 {app.mediaLinks.length} media links attached
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    ${(app.requestedAmountCents / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          app.status === 'accepted'
                            ? 'rgba(0, 240, 118, 0.15)'
                            : app.status === 'declined'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : app.status === 'under_review'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(139, 92, 246, 0.15)',
                        color:
                          app.status === 'accepted'
                            ? 'var(--status-success)'
                            : app.status === 'declined'
                              ? 'var(--status-error)'
                              : app.status === 'under_review'
                                ? '#F59E0B'
                                : 'var(--accent-secondary)',
                      }}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setReviewerNotes(app.reviewerNotes || '');
                        setAcceptAmount((app.requestedAmountCents / 100).toString());
                      }}
                      style={{
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Review Pitch ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Review Drawer / Modal ───────────────────────────────────────────── */}
      {selectedApp && (
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
              maxWidth: 580,
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedApp.applicantName}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                  {selectedApp.applicantType} · Submitted {new Date(selectedApp.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Pitch Content */}
            <div style={{ background: 'var(--surface-card)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                Pitch Submission
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {selectedApp.pitch}
              </p>
              {selectedApp.mediaLinks && selectedApp.mediaLinks.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Media References:</div>
                  {selectedApp.mediaLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', fontSize: 12, color: 'var(--accent-secondary)', textDecoration: 'none', marginBottom: 2 }}
                    >
                      🔗 {link}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Requested Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-card)', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Requested Sponsorship:</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-secondary)' }}>
                ${(selectedApp.requestedAmountCents / 100).toFixed(2)}
              </span>
            </div>

            {/* Confidential Internal Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Confidential Reviewer Notes (Internal to Sponsor)
              </label>
              <textarea
                rows={2}
                placeholder="Private evaluation notes — never shared with applicant..."
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleReviewAction('DECLINE')}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--status-error)',
                  background: 'transparent',
                  color: 'var(--status-error)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: processing ? 'not-allowed' : 'pointer',
                }}
              >
                Decline
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleReviewAction('UNDER_REVIEW')}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: processing ? 'not-allowed' : 'pointer',
                }}
              >
                Mark Under Review
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleReviewAction('ACCEPT')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent-secondary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.7 : 1,
                }}
              >
                {processing ? 'Processing…' : 'Accept & Propose Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
