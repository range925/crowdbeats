'use client';

import React from 'react';
import Link from 'next/link';

const CARD: React.CSSProperties = {
  backgroundColor: 'var(--cb-surface-card, #FFFFFF)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  border: '1px solid var(--cb-border-subtle, #E5E5EA)',
  borderRadius: 16,
  marginBottom: 20,
  overflow: 'hidden',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  minHeight: 52,
  borderBottom: '1px solid var(--cb-border-subtle, #E5E5EA)',
  textDecoration: 'none',
  color: 'inherit',
};

export function LegalSection() {
  const documents = [
    { title: 'Privacy Policy', desc: 'How we collect, encrypt, and handle personal data.', href: '/legal/privacy' },
    { title: 'Terms of Service', desc: 'Terms of use, platform rights, and tipping ledger rules.', href: '/legal/terms' },
    { title: 'Cookie Policy', desc: 'Session storage, analytics cookies, and local caching.', href: '/legal/cookies' },
    { title: 'End User License Agreement (EULA)', desc: 'Mobile software licensing and intellectual property terms.', href: '/legal/eula' },
    { title: 'DMCA & Copyright Policy', desc: 'Artist intellectual property protections and takedown procedures.', href: '/legal/dmca' },
  ];

  return (
    <div>
      <div className="cb-account-card" style={CARD}>
        {documents.map((doc, idx) => (
          <Link
            key={doc.title}
            href={doc.href}
            style={{
              ...ROW,
              borderBottom: idx === documents.length - 1 ? 'none' : '1px solid var(--cb-border-subtle, #E5E5EA)',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cb-text-primary, #1D1D1F)' }}>{doc.title}</div>
              <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #6E6E73)', marginTop: 2 }}>{doc.desc}</div>
            </div>
            <span style={{ color: 'var(--cb-brand-primary, #7C3AED)', fontSize: 14 }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
