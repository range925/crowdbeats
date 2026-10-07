/**
 * Crowdbeats V2 — Sponsor Organization Brand Profile (Phase 9)
 * 'use client' page for editing brand profile, industry, logo, and website.
 */

'use client';

import React, { useState } from 'react';

export default function SponsorOrganizationPage() {
  const [name, setName] = useState('Gibson Guitars');
  const [description, setDescription] = useState('World-leading musical instrument manufacturer supporting grassroots live music.');
  const [industry, setIndustry] = useState('Musical Instruments & Audio Gear');
  const [website, setWebsite] = useState('https://gibson.com');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Brand Profile & Organization
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Configure your brand assets, official industry designation, and verified sponsor credentials.
      </p>

      {saved && (
        <div style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', padding: 14, borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 600 }}>
          ✓ Organization profile saved!
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Company Information</h3>
            <span style={{ background: 'rgba(96,165,250,0.15)', color: 'var(--status-info)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              Official Brand Partner
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Organization / Brand Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Industry Category
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Brand Overview & Bio
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Corporate Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--accent-secondary)',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          Save Brand Profile
        </button>
      </form>
    </div>
  );
}
