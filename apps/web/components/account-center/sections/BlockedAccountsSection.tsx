'use client';

import React, { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

export function BlockedAccountsSection() {
  const [search, setSearch] = useState('');

  return (
    <div>
      <div style={CARD}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search blocked users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#FFFFFF',
              fontSize: 13,
              minHeight: 44,
            }}
          />
        </div>

        <EmptyState
          icon="🚫"
          title="No Blocked Accounts"
          description="When you block someone, they appear here. Blocked users cannot view your profile, tip your stages, or send direct messages."
        />
      </div>

      <div style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>
        Tip: To block someone, visit their artist bio or tap the menu (•••) on any tip message in your activity feed.
      </div>
    </div>
  );
}
