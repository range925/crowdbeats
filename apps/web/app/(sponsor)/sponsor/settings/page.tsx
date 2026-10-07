'use client';

/**
 * Crowdbeats V2 — Sponsor Workspace Settings
 *
 * Full settings suite for Corporate Sponsors:
 *   - Match Pools & Escrow Triggers (Low balance alerts, Daily match cap, Multipliers)
 *   - Campaign Targeting & Criteria (Target genres, Metro geo-targeting, Pitches inbox)
 *   - Team Notifications & Tax Invoices
 *   - Appearance Themes
 */

import React, { useState, useEffect } from 'react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';

const SPONSOR_GENRES = ['Indie Rock', 'Acoustic Folk', 'Electronic', 'Jazz', 'Latin', 'Pop'];

export default function SponsorSettingsPage() {
  // Escrow & Match Triggers
  const [lowBalanceAlertDollars, setLowBalanceAlertDollars] = useState(100);
  const [dailyMatchCapDollars, setDailyMatchCapDollars] = useState(250);
  const [matchMultiplier, setMatchMultiplier] = useState('1.0');

  // Targeting & Pitches
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Indie Rock', 'Acoustic Folk']);
  const [targetMetro, setTargetMetro] = useState('San Diego, CA');
  const [allowInboundPitches, setAllowInboundPitches] = useState(true);

  // Notifications
  const [notifyLowBalance, setNotifyLowBalance] = useState(true);
  const [notifyMatchDepleted, setNotifyMatchDepleted] = useState(true);
  const [notifyApplications, setNotifyApplications] = useState(true);
  const [notifyMonthlyStatement, setNotifyMonthlyStatement] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('cb_sponsor_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.lowBalanceAlertDollars !== undefined) setLowBalanceAlertDollars(parsed.lowBalanceAlertDollars);
          if (parsed.dailyMatchCapDollars !== undefined) setDailyMatchCapDollars(parsed.dailyMatchCapDollars);
          if (parsed.matchMultiplier !== undefined) setMatchMultiplier(parsed.matchMultiplier);
          if (parsed.selectedGenres !== undefined) setSelectedGenres(parsed.selectedGenres);
          if (parsed.targetMetro !== undefined) setTargetMetro(parsed.targetMetro);
          if (parsed.allowInboundPitches !== undefined) setAllowInboundPitches(parsed.allowInboundPitches);
          if (parsed.notifyLowBalance !== undefined) setNotifyLowBalance(parsed.notifyLowBalance);
          if (parsed.notifyMatchDepleted !== undefined) setNotifyMatchDepleted(parsed.notifyMatchDepleted);
          if (parsed.notifyApplications !== undefined) setNotifyApplications(parsed.notifyApplications);
          if (parsed.notifyMonthlyStatement !== undefined) setNotifyMonthlyStatement(parsed.notifyMonthlyStatement);
        } catch (_) {}
      }
    }
  }, []);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'cb_sponsor_settings',
        JSON.stringify({
          lowBalanceAlertDollars,
          dailyMatchCapDollars,
          matchMultiplier,
          selectedGenres,
          targetMetro,
          allowInboundPitches,
          notifyLowBalance,
          notifyMatchDepleted,
          notifyApplications,
          notifyMonthlyStatement,
        })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--cb-text-primary, var(--text-primary))' }}>
          Sponsor Workspace Settings
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, var(--text-secondary))', fontSize: 14, margin: 0 }}>
          Manage campaign escrow thresholds, real-time match multipliers, genre &amp; metro targeting, and corporate tax billing delivery.
        </p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(0, 240, 118, 0.15)', border: '1px solid rgba(0, 240, 118, 0.4)', color: '#00F076', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          ✓ Sponsor settings updated successfully!
        </div>
      )}

      {/* Appearance & Theme Section */}
      <div style={{ background: 'var(--cb-surface-1, var(--surface-card))', padding: 24, borderRadius: 16, border: '1px solid var(--cb-border-subtle, var(--border-subtle))' }}>
        <AppearanceSettings />
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* Section 1: Match Pools & Escrow Triggers */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💰</span> Match Pools &amp; Escrow Triggers
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Low Escrow Alert
              </label>
              <select
                value={lowBalanceAlertDollars}
                onChange={(e) => setLowBalanceAlertDollars(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-base)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                }}
              >
                <option value={50}>Below $50</option>
                <option value={100}>Below $100</option>
                <option value={250}>Below $250</option>
                <option value={500}>Below $500</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Daily Match Cap
              </label>
              <select
                value={dailyMatchCapDollars}
                onChange={(e) => setDailyMatchCapDollars(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-base)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                }}
              >
                <option value={100}>$100 / Day</option>
                <option value={250}>$250 / Day</option>
                <option value={500}>$500 / Day</option>
                <option value={1000}>$1,000 / Day</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Match Multiplier
              </label>
              <select
                value={matchMultiplier}
                onChange={(e) => setMatchMultiplier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-base)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                }}
              >
                <option value="1.0">1.0x (100% Match)</option>
                <option value="1.5">1.5x (150% Match)</option>
                <option value="2.0">2.0x (Double Match)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Campaign Targeting */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎯</span> Sponsorship Targeting &amp; Pitches
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Target Metro Market
            </label>
            <input
              type="text"
              value={targetMetro}
              onChange={(e) => setTargetMetro(e.target.value)}
              placeholder="e.g. San Diego, CA"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-base)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Eligible Music Genres for Matching
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SPONSOR_GENRES.map((g) => {
                const active = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: active ? '1px solid var(--accent-secondary, #EC4899)' : '1px solid var(--border-subtle)',
                      backgroundColor: active ? 'rgba(236, 72, 153, 0.15)' : 'var(--surface-base)',
                      color: active ? '#F472B6' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {active ? '✓ ' : '+ '}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={allowInboundPitches}
              onChange={(e) => setAllowInboundPitches(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Enable Inbound Musician Sponsorship Pitches</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Allow verified performers in your target metro to submit campaign partnership proposals.
              </div>
            </div>
          </label>
        </div>

        {/* Section 3: Team Notifications */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔔</span> Corporate Notifications &amp; Invoicing
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyLowBalance} onChange={(e) => setNotifyLowBalance(e.target.checked)} />
            Email finance team when available Campaign Escrow falls below ${lowBalanceAlertDollars}
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyMatchDepleted} onChange={(e) => setNotifyMatchDepleted(e.target.checked)} />
            Alert team when an active live match pool reaches 100% allocation
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyApplications} onChange={(e) => setNotifyApplications(e.target.checked)} />
            Notify reps on new inbound sponsorship applications
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyMonthlyStatement} onChange={(e) => setNotifyMonthlyStatement(e.target.checked)} />
            Deliver monthly IRS-compliant corporate tax invoice &amp; ledger export PDF
          </label>
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--accent-secondary, #EC4899)',
            color: '#FFFFFF',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            alignSelf: 'flex-start',
            boxShadow: '0 6px 20px rgba(236, 72, 153, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          Save Sponsor Settings
        </button>
      </form>
    </div>
  );
}
