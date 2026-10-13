// Crowdbeats V2 — Fan Receipts Page (Phase 6)
// Route: /fan/receipts
// Server Component: lists the fan's tip receipts with status filters.

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';
import { initAdmin } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

interface TipReceipt {
  tipId: string;
  recipientName: string | null;
  amountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  currency: string;
  status: string;
  createdAt: { _seconds: number } | null;
  isAnonymous: boolean;
}

function formatCents(cents: number): string {
  const d = Math.floor(cents / 100);
  const c = cents % 100;
  return `$${d}.${c.toString().padStart(2, '0')}`;
}

function formatDate(ts: { _seconds: number } | null): string {
  if (!ts) return 'Unknown';
  const d = new Date(ts._seconds * 1000);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'succeeded': return { label: 'Confirmed', bg: 'rgba(5,150,105,0.08)', text: '#047857', border: 'rgba(5,150,105,0.2)' };
    case 'refunded':  return { label: 'Refunded', bg: 'rgba(37,99,235,0.08)', text: '#1D4ED8', border: 'rgba(37,99,235,0.2)' };
    case 'failed':    return { label: 'Failed', bg: 'rgba(220,38,38,0.08)', text: '#B91C1C', border: 'rgba(220,38,38,0.2)' };
    default:          return { label: 'Pending', bg: 'rgba(217,119,6,0.08)', text: '#92400E', border: 'rgba(217,119,6,0.2)' };
  }
}

async function getSession(): Promise<SessionData | null> {
  try {
    const raw = (await cookies()).get('__cb_session')?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as SessionData;
  } catch {
    return null;
  }
}

async function getFanReceipts(uid: string): Promise<TipReceipt[]> {
  try {
    initAdmin();
    const db = getFirestore();
    const snap = await db
      .collection('tips')
      .where('fanUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        tipId: doc.id,
        recipientName: (d['recipientName'] as string | null) ?? null,
        amountCents: (d['amountCents'] as number) ?? 0,
        platformFeeCents: (d['platformFeeCents'] as number) ?? 0,
        netAmountCents: (d['netAmountCents'] as number) ?? 0,
        currency: (d['currency'] as string) ?? 'USD',
        status: (d['status'] as string) ?? 'pending',
        createdAt: (d['createdAt'] as { _seconds: number } | null) ?? null,
        isAnonymous: Boolean(d['isAnonymous']),
      };
    });
  } catch {
    return [];
  }
}

export default async function ReceiptsPage() {
  const session = await getSession();
  if (!session?.uid) redirect('/auth?next=/fan/receipts');

  const receipts = await getFanReceipts(session.uid);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ margin: 0, color: 'var(--cb-text-primary, #1D1D1F)' }}>Tip Receipts & Ledger</h1>
          <p style={{ color: 'var(--cb-text-secondary, #6E6E73)', fontSize: 13, margin: '4px 0 0 0' }}>
            Verified live tipping receipts and California-governed payment records.
          </p>
        </div>

        <a
          href="/statement/pdf?uid=usr_fan_self&role=fan&year=2026"
          target="_blank"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: 'var(--cb-brand-primary, #7C3AED)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
          }}
        >
          <span>📥</span>
          <span>Download Statement (PDF)</span>
        </a>
      </div>

      {receipts.length === 0 ? (
        <div style={{
          borderRadius: 16,
          border: '1px solid var(--cb-border-subtle, rgba(0,0,0,0.08))',
          backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
          padding: '64px 24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <p style={{ fontSize: 36, margin: 0 }}>🧾</p>
          <p style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: 'var(--cb-text-primary, #1D1D1F)' }}>No tips yet.</p>
          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--cb-text-secondary, #6E6E73)' }}>
            Open the Crowdbeats app and scan a performer&apos;s QR code.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {receipts.map((r) => {
            const badge = statusBadge(r.status);
            return (
              <div
                key={r.tipId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 12,
                  border: '1px solid var(--cb-border-subtle, rgba(0,0,0,0.08))',
                  backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                  padding: '16px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--cb-text-primary, #1D1D1F)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.recipientName ?? 'Artist'}
                  </p>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #636366)' }}>
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>
                <div style={{ marginLeft: 16, flexShrink: 0, textAlign: 'right' }}>
                  <p className="cb-tabular-nums" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--cb-text-primary, #1D1D1F)' }}>
                    {formatCents(r.amountCents)}
                  </p>
                  <p className="cb-tabular-nums" style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--cb-text-secondary, #6E6E73)' }}>
                    Creator got {formatCents(r.netAmountCents)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--cb-text-muted, #636366)' }}>
        Showing up to 50 most recent receipts.
        Full history available in the Crowdbeats app.
      </p>
    </div>
  );
}
