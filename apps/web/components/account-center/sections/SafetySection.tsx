'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SettingsPicker } from '@/components/settings/SettingsPicker';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  marginBottom: 20,
  padding: 20,
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

export function SafetySection() {
  const [msgPerm, setMsgPerm] = useState('following');
  const [filterWords, setFilterWords] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveWords = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      {/* Direct Messaging Permissions */}
      <div style={CARD}>
        <h3 style={TITLE}>Direct Message Controls</h3>
        <p style={DESC}>Choose who can send you messages, backstage invitations, or performance feedback.</p>
        <div style={{ maxWidth: 320 }}>
          <SettingsPicker
            value={msgPerm}
            onChange={setMsgPerm}
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'following', label: 'People You Follow Only' },
              { value: 'nobody', label: 'Nobody (DMs Closed)' },
            ]}
          />
        </div>
      </div>

      {/* Filter Keywords */}
      <div style={CARD}>
        <h3 style={TITLE}>Block Sensitive Words & Phrases</h3>
        <p style={DESC}>Comments or live stream chat messages containing these comma-separated keywords will be automatically filtered from your view.</p>
        <textarea
          value={filterWords}
          onChange={(e) => setFilterWords(e.target.value)}
          placeholder="e.g. spam, crypto, discount..."
          rows={3}
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: 12,
            color: '#FFFFFF',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: 12,
          }}
        />
        <button
          type="button"
          onClick={handleSaveWords}
          style={{
            background: 'var(--accent-primary, #7C3AED)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          {saved ? 'Keywords Saved ✓' : 'Save Keyword Filters'}
        </button>
      </div>

      {/* Blocked Accounts Shortcut */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ ...TITLE, margin: 0 }}>Blocked Accounts</h3>
          <p style={{ ...DESC, margin: '4px 0 0' }}>Review and manage accounts you have blocked from contacting you.</p>
        </div>
        <Link
          href="/account?section=blocked"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'var(--text-primary, #FFFFFF)',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Manage Blocked →
        </Link>
      </div>

      {/* Creator & Fan Wellbeing */}
      <div style={{ ...CARD, background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
        <h3 style={{ ...TITLE, color: '#10B981' }}>24/7 Creator & Performer Wellbeing</h3>
        <p style={{ ...DESC, marginBottom: 0 }}>
          Crowdbeats stands for artist safety, fair venues, and a harassment-free community. If you ever feel unsafe at a gig or online, access our confidential Community Safety Resources or report abusive actors immediately.
        </p>
      </div>
    </div>
  );
}
