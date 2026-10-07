'use client';

import React from 'react';
import Link from 'next/link';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
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
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
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
      <div style={CARD}>
        {documents.map((doc, idx) => (
          <Link
            key={doc.title}
            href={doc.href}
            style={{
              ...ROW,
              borderBottom: idx === documents.length - 1 ? 'none' : '1px solid rgba(43,45,68,0.4)',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>{doc.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)', marginTop: 2 }}>{doc.desc}</div>
            </div>
            <span style={{ color: 'var(--accent-primary, #A78BFA)', fontSize: 14 }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
