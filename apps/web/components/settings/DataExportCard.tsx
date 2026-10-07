'use client';

import React, { useState } from 'react';
import { DataExportModal } from '@/components/compliance/DataExportModal';

interface DataExportCardProps {
  userName: string;
  userEmail: string;
  userUid: string;
  defaultRole?: 'fan' | 'artist' | 'band_member' | 'sponsor' | 'venue' | 'admin';
}

export function DataExportCard({
  userName,
  userEmail,
  userUid,
  defaultRole = 'artist',
}: DataExportCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '16px 18px',
          backgroundColor: 'var(--cb-surface-1, #0F1017)',
          border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
          borderRadius: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 16 }} role="img" aria-label="Download">📦</span>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 700,
                margin: 0,
                color: 'var(--cb-text-primary, #FFFFFF)',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              Download Your Data
            </h4>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--cb-text-secondary, #94A3B8)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            You have the right to a copy of your personal data under GDPR Art. 20 and CCPA §1798.100.
            This includes your profile, activity, transactions, and settings in a portable format.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: 'var(--cb-purple-dim, rgba(124,58,237,0.16))',
            color: 'var(--cb-purple-light, #A855F7)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(124, 58, 237, 0.24)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--cb-purple-dim, rgba(124,58,237,0.16))';
          }}
        >
          Download My Data
        </button>
      </div>

      <DataExportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userName={userName}
        userEmail={userEmail}
        userUid={userUid}
        defaultRole={defaultRole}
      />
    </>
  );
}
