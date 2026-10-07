'use client';

import React from 'react';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

const TITLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--text-primary, #FFFFFF)',
  margin: '0 0 4px',
};

const DESC: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary, #94A3B8)',
  lineHeight: 1.5,
  marginBottom: 14,
};

export function SupportSection() {
  return (
    <div>
      {/* Help Center */}
      <div style={CARD}>
        <h3 style={TITLE}>Help Center & FAQ</h3>
        <p style={DESC}>Step-by-step guides for stage setup, QR code rotation, band splits, and tipping troubleshooting.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="https://help.crowdbeats.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--accent-primary, #7C3AED)',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Visit Knowledge Base ↗
          </a>
          <button
            type="button"
            onClick={() => alert('Bug reporter modal opening...')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Report an Issue
          </button>
        </div>
      </div>

      {/* Contact Concierge */}
      <div style={CARD}>
        <h3 style={TITLE}>Direct Concierge Support</h3>
        <p style={DESC}>Have urgent billing, escrow dispute, or stage access inquiries? Contact our specialist team.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="mailto:support@crowdbeats.com"
            style={{
              color: 'var(--accent-primary, #A78BFA)',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            ✉️ support@crowdbeats.com
          </a>
          <span style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>• Typical response within 2-4 hours</span>
        </div>
      </div>

      {/* Community Guidelines */}
      <div style={{ ...CARD, background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.2)' }}>
        <h3 style={{ ...TITLE, color: 'var(--accent-primary, #A78BFA)' }}>Crowdbeats Community Charter</h3>
        <p style={{ ...DESC, marginBottom: 0 }}>
          Every artist, busker, fan, and venue agrees to respectful collaboration, prompt band split payouts, and safe performances. Review our Community Guidelines for complete standards.
        </p>
      </div>
    </div>
  );
}
