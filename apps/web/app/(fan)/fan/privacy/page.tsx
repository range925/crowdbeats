'use client';

/**
 * Crowdbeats V2 — Fan Privacy & Data Page
 * Route: /fan/privacy
 * 
 * Instant self-service PDF statement export and statutory CCPA / GDPR request hub.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { DataExportModal } from '@/components/compliance/DataExportModal';
import { useAuth } from '@/lib/hooks/useAuth';

export default function PrivacyPage() {
  const auth = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  async function requestExport() {
    setStatus('loading');
    try {
      const res = await fetch('/api/fan/request-privacy-export', { method: 'POST' });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus('error');
        setMessage(json.error ?? 'Request failed. Please try again.');
      } else {
        setStatus('done');
        setMessage(json.message ?? 'Export queued. You will receive an email within 48 hours.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Privacy, Data Export & Tax Records
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>
            Manage your personal data, exercise statutory rights (CCPA § 1798.100 & GDPR Art. 15), and download official statements.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Instant PDF Export Section */}
        <div
          style={{
            borderRadius: 16,
            border: '1px solid rgba(124, 58, 237, 0.3)',
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Instant Official Statement & Tax Export (PDF)
            </h2>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            Generate a certified, human-readable PDF document containing your complete account identity, tip receipts, platform fee disclosures, and IRS tax records with a cryptographic SHA-256 seal.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsExportModalOpen(true)}
              style={{
                borderRadius: 10,
                backgroundColor: '#7C3AED',
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              }}
            >
              <span>📥</span>
              <span>Download Statement (PDF)</span>
            </button>

            <a
              href={`/statement/pdf?uid=${auth.user?.uid ?? 'usr_self'}&role=fan&year=2026`}
              target="_blank"
              style={{
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '12px 18px',
                fontSize: 13,
                fontWeight: 600,
                color: '#38BDF8',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🖨️ Direct Printable PDF Tab ↗</span>
            </a>
          </div>
        </div>

        {/* Queued Archive Export Section */}
        <div style={{ borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#151722', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Full Database Zip Archive Request</h2>
          <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Request a zipped batch copy of all raw database records, follow logs, and device tokens. You will receive an encrypted download link via email within 48 hours.
          </p>

          {status === 'done' ? (
            <div style={{ borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: 14, fontSize: 13, color: '#10B981' }}>
              ✅ {message}
            </div>
          ) : status === 'error' ? (
            <div style={{ borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: 14, fontSize: 13, color: '#EF4444' }}>
              ❌ {message}
            </div>
          ) : (
            <button
              onClick={requestExport}
              disabled={status === 'loading'}
              style={{
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {status === 'loading' ? 'Requesting…' : 'Queue Full Database Export'}
            </button>
          )}
        </div>

        {/* Account Deletion & Retention Info */}
        <div style={{ borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#151722', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Account Deletion & 7-Year IRS Retention</h2>
          <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            To permanently delete your account, visit <Link href="/account" style={{ color: '#EF4444', fontWeight: 600 }}>Account Settings → Danger Zone</Link>. Note that pursuant to Internal Revenue Code (IRC) § 6001 and statutory anti-money-laundering regulations, financial transaction logs are preserved in our compliance ledger for 7 years.
          </p>
        </div>
      </div>

      {/* ── MODAL ────────────────────────────────────────────────────── */}
      <DataExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultRole="fan"
        userName={auth.displayName ?? 'Crowdbeats Fan'}
        userEmail={auth.email ?? ''}
        userUid={auth.user?.uid ?? 'usr_self'}
      />
    </div>
  );
}
