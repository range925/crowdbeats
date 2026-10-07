'use client';

/**
 * Crowdbeats V2 — Data Export & Tax Statement Modal Component
 * 
 * Embeddable modal for self-service user downloads & admin statement reviews.
 */

import React, { useState } from 'react';
import { getUserStatementData, type UserStatementData } from '@/lib/compliance/userDataExport';
import { StatementDocumentView } from './StatementDocumentView';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'fan' | 'artist' | 'band_member' | 'sponsor' | 'venue' | 'admin';
  userName?: string;
  userEmail?: string;
  userUid?: string;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'artist',
  userName,
  userEmail,
  userUid,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [statementData, setStatementData] = useState<UserStatementData | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const data = getUserStatementData({
      uid: userUid || 'usr_self',
      role: defaultRole,
      taxYear: selectedYear,
      fullName: userName,
      email: userEmail,
    });
    setStatementData(data);
    setIsPreviewMode(true);
  };

  const handleDirectDownloadPDF = () => {
    const targetUrl = `/statement/pdf?uid=${encodeURIComponent(userUid || 'usr_self')}&role=${encodeURIComponent(defaultRole)}&year=${selectedYear}&name=${encodeURIComponent(userName || '')}&email=${encodeURIComponent(userEmail || '')}`;
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: isPreviewMode ? '#0F172A' : '#151722',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 18,
          width: '100%',
          maxWidth: isPreviewMode ? 940 : 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          color: '#FFFFFF',
          transition: 'all 0.2s ease',
        }}
      >
        {isPreviewMode && statementData ? (
          <div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setIsPreviewMode(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Change Year / Settings
              </button>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <StatementDocumentView data={statementData} onClose={onClose} showActions={true} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '32px 28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>📥</span>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    Download Data & Tax Statement
                  </h3>
                </div>
                <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
                  Official CCPA / GDPR Data Archive, tip receipts, creator earnings, and IRS tax records.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Select Tax Year */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 8 }}>
                Select Tax & Reporting Year
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[2026, 2025, 2024].map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 10,
                      border: selectedYear === year ? '1.5px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: selectedYear === year ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedYear === year ? '#FFFFFF' : '#94A3B8',
                      fontWeight: selectedYear === year ? 700 : 500,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Tax Year {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Details Box */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 24,
                fontSize: 12,
                lineHeight: 1.6,
                color: '#94A3B8',
              }}
            >
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                What will be generated in your statement:
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>• <strong>Personal & Account Profile:</strong> Identity records and verified status.</li>
                <li>• <strong>IRS Tax Summary:</strong> Form 1099-K status, gross tips, 6% platform fees, and Stripe processing fees.</li>
                <li>• <strong>Itemized Ledger:</strong> Timestamped receipt history with Stripe transaction IDs.</li>
                <li>• <strong>Statutory Disclosures:</strong> California CCPA § 1798.100 & GDPR Article 15 compliance.</li>
                <li>• <strong>SHA-256 Cryptographic Hash:</strong> Official tamper-proof verification seal.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={handleGenerate}
                style={{
                  padding: '14px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>📄</span>
                <span>Preview Official PDF Statement</span>
              </button>

              <button
                type="button"
                onClick={handleDirectDownloadPDF}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>🖨️</span>
                <span>Open Direct Printable PDF Tab ↗</span>
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#64748B', marginTop: 16, marginBottom: 0 }}>
              Preserved in the Crowdbeats Compliance Vault under IRS 7-year record retention guidelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
