'use client';

/**
 * Crowdbeats V2 — Official User Statement & IRS Tax PDF Document View
 * 
 * High-fidelity, print-optimized document view designed for:
 * 1. User self-service downloads (Save as PDF / Print)
 * 2. Admin business compliance & IRS tax audit archival
 * 
 * Styled specifically with @media print CSS for crisp, letter-formatted PDF generation.
 */

import React from 'react';
import type { UserStatementData } from '@/lib/compliance/userDataExport';

interface StatementDocumentViewProps {
  data: UserStatementData;
  onClose?: () => void;
  showActions?: boolean;
}

function formatCents(cents: number): string {
  const d = Math.floor(cents / 100);
  const c = Math.abs(cents % 100);
  return `$${d.toLocaleString()}.${c.toString().padStart(2, '0')}`;
}

export const StatementDocumentView: React.FC<StatementDocumentViewProps> = ({
  data,
  onClose,
  showActions = true,
}) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.documentId}-data-archive.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const headers = [
      'Transaction ID',
      'Date (UTC)',
      'Type',
      'Counterparty',
      'Gross (USD)',
      'Crowdbeats 6% Fee (USD)',
      'Stripe Fee (USD)',
      'Net (USD)',
      'Status',
      'Stripe Reference',
    ];
    const rows = data.transactions.map((tx) => [
      tx.id,
      tx.timestamp,
      tx.type,
      `"${tx.counterparty.replace(/"/g, '""')}"`,
      (tx.grossAmountCents / 100).toFixed(2),
      (tx.platformFeeCents / 100).toFixed(2),
      (tx.stripeFeeCents / 100).toFixed(2),
      (tx.netAmountCents / 100).toFixed(2),
      tx.status,
      tx.referenceNumber,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.documentId}-ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cb-statement-container" style={{ color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── CSS FOR PRINTING TO PDF ─────────────────────────────────── */}
      <style>{`
        @media print {
          body {
            background-color: #FFFFFF !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .cb-statement-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          @page {
            size: letter;
            margin: 15mm;
          }
        }
      `}</style>

      {/* ── TOP ACTION BAR (Hidden during print) ─────────────────────── */}
      {showActions && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '12px 12px 0 0',
            marginBottom: 0,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Official Statement & IRS Compliance Export
            </span>
            <span
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                color: '#38BDF8',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
              }}
            >
              Tax Year {data.taxYear}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
              }}
            >
              <span>🖨️</span>
              <span>Save as PDF / Print</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              style={{
                backgroundColor: '#334155',
                color: '#E2E8F0',
                border: '1px solid #475569',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>

            <button
              onClick={handleDownloadJSON}
              style={{
                backgroundColor: '#334155',
                color: '#E2E8F0',
                border: '1px solid #475569',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              JSON Archive
            </button>

            {onClose && (
              <button
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── PRINTABLE STATEMENT SHEET ───────────────────────────────── */}
      <div
        className="cb-statement-sheet"
        style={{
          backgroundColor: '#FFFFFF',
          padding: '40px',
          borderRadius: showActions ? '0 0 12px 12px' : 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          border: '1px solid #E2E8F0',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {/* 1. OFFICIAL CORPORATE LETTERHEAD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                CB
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#0F172A' }}>
                CROWDBEATS LLC
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
              100 Montgomery St, Suite 1500 • San Francisco, CA 94104, USA<br />
              California LLC Entity • IRS Compliance & Tax Reporting Desk<br />
              Email: compliance@crowdbeats.ai • support@crowdbeats.ai
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              OFFICIAL ACCOUNT & TAX STATEMENT
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
              DOC REF: {data.documentId}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              Period: {data.statementPeriod}
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              Generated: {new Date(data.generatedAt).toLocaleString('en-US', { timeZone: 'UTC' })} UTC
            </div>
          </div>
        </div>

        {/* 2. USER PROFILE & IDENTITY GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Account Holder Details
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              {data.user.fullName}
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
              Email: <strong style={{ color: '#0F172A' }}>{data.user.email}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              User ID: <code style={{ color: '#7C3AED', fontSize: 11 }}>{data.user.uid}</code>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Account Role: <strong style={{ textTransform: 'capitalize', color: '#0F172A' }}>{data.user.role.replace('_', ' ')}</strong>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Compliance & Verification
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>● Identity Verified</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>• Member since {data.user.memberSince}</span>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Tax ID (TIN/SSN): <strong style={{ color: '#0F172A' }}>•••-••-{data.taxReporting.tinLast4}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Classification: {data.taxReporting.taxClassification}
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Statutory Basis: California CCPA / CPRA & IRS IRC § 6050W
            </div>
          </div>
        </div>

        {/* 3. FINANCIAL SUMMARY TILES */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Financial & Payment Summary ({data.financialSummary.currency})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Gross Volume</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
                {formatCents(data.financialSummary.totalGrossCents)}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                {data.financialSummary.transactionCount} transactions
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Crowdbeats 6% Fee</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED', marginTop: 4 }}>
                {formatCents(data.financialSummary.totalPlatformFeeCents)}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                Technology & sync fee
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Stripe Processing Fees</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#64748B', marginTop: 4 }}>
                {formatCents(data.financialSummary.totalStripeFeeCents)}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                PCI card processor
              </div>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#1E40AF', fontWeight: 700 }}>
                {data.user.role === 'fan' ? 'Net Artist Impact' : 'Net Creator Proceeds'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1E40AF', marginTop: 4 }}>
                {formatCents(data.financialSummary.totalNetCents)}
              </div>
              <div style={{ fontSize: 10, color: '#3B82F6', marginTop: 2 }}>
                Disbursed via Stripe
              </div>
            </div>
          </div>
        </div>

        {/* 4. IRS FORM 1099-K & TAX COMPLIANCE NOTICE */}
        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🏛️</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
              IRS & Business Tax Compliance Notice (Tax Year {data.taxYear})
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: '#78350F', lineHeight: 1.55, margin: 0 }}>
            <strong>IRS Form:</strong> {data.taxReporting.formType} • <strong>Reporting Status:</strong> {data.taxReporting.irsStatusText}
            <br />
            Crowdbeats LLC operates as a Third-Party Settlement Organization (TPSO) under IRC § 6050W. For performing creators whose gross payments exceed the applicable IRS or State reporting threshold, Form 1099-K is furnished electronically and filed with the Internal Revenue Service and California Franchise Tax Board.
          </p>
        </div>

        {/* 5. ITEMIZED TRANSACTION LEDGER */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Itemized Transaction & Tip Ledger
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Date & Time (UTC)</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Description / Counterparty</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Gross</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>6% Fee</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Stripe</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Net</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  style={{
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  }}
                >
                  <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {tx.timestamp}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>
                    {tx.counterparty}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                    {formatCents(tx.grossAmountCents)}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#7C3AED' }}>
                    {formatCents(tx.platformFeeCents)}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748B' }}>
                    {formatCents(tx.stripeFeeCents)}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#16A34A' }}>
                    {formatCents(tx.netAmountCents)}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                      }}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748B', fontFamily: 'monospace', fontSize: 10 }}>
                    {tx.referenceNumber}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 6. BAND SPLITS (IF APPLICABLE) */}
        {data.bandSplits && data.bandSplits.length > 0 && (
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: 8 }}>
              Automated Band Splits & Allocation Schedule
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {data.bandSplits.map((split, sIdx) => (
                <div key={sIdx} style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{split.bandName} — {split.role}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>
                    {split.splitPercentage}% Split Allocation
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Allocated Gross: {formatCents(split.allocatedGrossCents)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. STATUTORY DISCLOSURES & PRIVACY NOTICE */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, marginBottom: 20, fontSize: 10.5, color: '#64748B', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
            Statutory Legal & Privacy Compliance Disclosures:
          </div>
          <p style={{ margin: '0 0 6px' }}>
            <strong>CCPA / CPRA § 1798.100 (Right to Know):</strong> {data.statutoryDisclosures.ccpaNotice}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>GDPR Article 15 (Right of Access):</strong> {data.statutoryDisclosures.gdprNotice}
          </p>
          <p style={{ margin: 0 }}>
            <strong>IRS Record Retention Requirement:</strong> {data.statutoryDisclosures.retentionPolicy}
          </p>
        </div>

        {/* 8. TAMPER-PROOF INTEGRITY SEAL */}
        <div style={{ borderTop: '2px solid #0F172A', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#475569' }}>
          <div>
            <div><strong>Issuer:</strong> {data.integrityLedger.issuer}</div>
            <div><strong>Jurisdiction:</strong> {data.integrityLedger.jurisdiction}</div>
            <div><strong>Cryptographic Hash (SHA-256):</strong> <code style={{ color: '#7C3AED', fontSize: 9.5 }}>{data.integrityLedger.sha256Hash}</code></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>CROWDBEATS AUDIT VERIFIED ✓</div>
            <div style={{ color: '#64748B' }}>Official Legal Copy for IRS & Business Records</div>
          </div>
        </div>
      </div>
    </div>
  );
};
