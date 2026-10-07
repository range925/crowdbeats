/**
 * Crowdbeats V2 — Sponsor Opportunities & Match Pools (Phase 9)
 * Create and manage open tip match pools and RFPs.
 */

'use client';

import React, { useState } from 'react';

export default function SponsorOpportunitiesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poolAmountDollars, setPoolAmountDollars] = useState('500');
  const [matchRatio, setMatchRatio] = useState('100'); // 100% = 1:1
  const [targetType, setTargetType] = useState('artist');
  const [created, setCreated] = useState(false);

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault();
    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      setShowCreateModal(false);
    }, 2000);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Opportunities & Match Pools
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Set up automatic tip matching pools or publish open sponsorship calls for upcoming events.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'var(--accent-secondary)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Create Match Pool
        </button>
      </div>

      {/* Match Pools List */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Pool Target</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Match Multiplier</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Total Pool</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Remaining</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No Active Match Pools</div>
                <div style={{ fontSize: 12 }}>Create a 1:1 tip matching pool to boost live audience support for performers.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Create Match Pool Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface-card)', width: 460, padding: 28, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>
              Create Tip Match Pool
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Funds are reserved from your available Campaign balance and credited on live tips.
            </p>

            {created ? (
              <div style={{ padding: 14, background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ✓ Match pool created and activated!
              </div>
            ) : (
              <form onSubmit={handleCreatePool} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Pool Funding Amount ($)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={poolAmountDollars}
                    onChange={(e) => setPoolAmountDollars(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Match Ratio (100% = 1:1 match)
                  </label>
                  <select
                    value={matchRatio}
                    onChange={(e) => setMatchRatio(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value="50">50% Match (0.5x)</option>
                    <option value="100">100% Match (1:1 Match)</option>
                    <option value="200">200% Match (2:1 Match)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Eligible Performer Type
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value="artist">Solo Artists</option>
                    <option value="band">Bands</option>
                    <option value="all">All Verified Performers</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: 'var(--accent-secondary)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Activate Pool
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
