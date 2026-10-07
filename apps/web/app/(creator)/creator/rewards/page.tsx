/**
 * Crowdbeats V2 — Reward Tiers Catalog (Phase 7)
 * Catalog of configured reward tiers across all campaigns.
 */

import React from 'react';

export default function CreatorRewardsPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
        Reward Tiers Catalog
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Overview of reward tiers, physical goods, digital downloads, and VIP experience perks.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 40, borderRadius: 12, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎁</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>No Reward Tiers Defined</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          Configure custom reward tiers when creating a new crowdfunding campaign.
        </div>
      </div>
    </div>
  );
}
