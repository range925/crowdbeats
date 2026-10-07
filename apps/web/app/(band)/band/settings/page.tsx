'use client';

/**
 * Crowdbeats V2 — Band Studio Settings & Governance
 *
 * Full operational settings suite for Bands:
 *   - Band Governance & Splits (Split transparency, Admin invitations, Distribution notices)
 *   - Stage & Collective Performance (Tip goal tracker, 90s dynamic QR rotation, Radar style)
 *   - Public Bio & Roster Display (Show full roster, instrument tags, audio snippet)
 *   - Operational Alerts & Notifications
 *   - Appearance Themes
 */

import React, { useState, useEffect } from 'react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';

export default function BandSettingsPage() {
  // Governance & Splits
  const [splitTransparency, setSplitTransparency] = useState(true);
  const [adminInviteDelegation, setAdminInviteDelegation] = useState(true);
  const [notifyOnDistribution, setNotifyOnDistribution] = useState(true);

  // Live Stage & Tipping
  const [enableGigTipGoal, setEnableGigTipGoal] = useState(true);
  const [gigTipGoalDollars, setGigTipGoalDollars] = useState(250);
  const [autoRotateQr, setAutoRotateQr] = useState(true);

  // Public Bio & Roster
  const [showRosterOnBio, setShowRosterOnBio] = useState(true);
  const [showInstrumentTags, setShowInstrumentTags] = useState(true);
  const [audioPreviewEnabled, setAudioPreviewEnabled] = useState(true);

  // Notifications
  const [notifyTips, setNotifyTips] = useState(true);
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [notifySplits, setNotifySplits] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('cb_band_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.splitTransparency !== undefined) setSplitTransparency(parsed.splitTransparency);
          if (parsed.adminInviteDelegation !== undefined) setAdminInviteDelegation(parsed.adminInviteDelegation);
          if (parsed.notifyOnDistribution !== undefined) setNotifyOnDistribution(parsed.notifyOnDistribution);
          if (parsed.enableGigTipGoal !== undefined) setEnableGigTipGoal(parsed.enableGigTipGoal);
          if (parsed.gigTipGoalDollars !== undefined) setGigTipGoalDollars(parsed.gigTipGoalDollars);
          if (parsed.autoRotateQr !== undefined) setAutoRotateQr(parsed.autoRotateQr);
          if (parsed.showRosterOnBio !== undefined) setShowRosterOnBio(parsed.showRosterOnBio);
          if (parsed.showInstrumentTags !== undefined) setShowInstrumentTags(parsed.showInstrumentTags);
          if (parsed.audioPreviewEnabled !== undefined) setAudioPreviewEnabled(parsed.audioPreviewEnabled);
          if (parsed.notifyTips !== undefined) setNotifyTips(parsed.notifyTips);
          if (parsed.notifyInvites !== undefined) setNotifyInvites(parsed.notifyInvites);
          if (parsed.notifySplits !== undefined) setNotifySplits(parsed.notifySplits);
        } catch (_) {}
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'cb_band_settings',
        JSON.stringify({
          splitTransparency,
          adminInviteDelegation,
          notifyOnDistribution,
          enableGigTipGoal,
          gigTipGoalDollars,
          autoRotateQr,
          showRosterOnBio,
          showInstrumentTags,
          audioPreviewEnabled,
          notifyTips,
          notifyInvites,
          notifySplits,
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
          Band Studio Settings
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, var(--text-secondary))', fontSize: 14, margin: 0 }}>
          Manage band revenue split transparency, collective live stage tip targets, roster public display, and member notifications.
        </p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(0, 240, 118, 0.15)', border: '1px solid rgba(0, 240, 118, 0.4)', color: '#00F076', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          ✓ Band studio settings updated successfully!
        </div>
      )}

      {/* Appearance & Theme Section */}
      <div style={{ background: 'var(--cb-surface-1, var(--surface-card))', padding: 24, borderRadius: 16, border: '1px solid var(--cb-border-subtle, var(--border-subtle))' }}>
        <AppearanceSettings />
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* Section 1: Band Governance & Revenue Splits */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚖️</span> Band Governance &amp; Revenue Splits
          </h3>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={splitTransparency}
              onChange={(e) => setSplitTransparency(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Member Split Ledger Transparency</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Allow all active band members to view real-time incoming live tips and exact calculated split payouts.
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={adminInviteDelegation}
              onChange={(e) => setAdminInviteDelegation(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Delegate Member Invitations to Band Admins</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Enable members with the BAND_ADMIN role to send invites to musicians without requiring manual Founder sign-off.
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={notifyOnDistribution}
              onChange={(e) => setNotifyOnDistribution(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Automatic Split Distribution Alerts</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Send instant push &amp; email notices to each member when a performance tip batch is finalized to their Stripe account.
              </div>
            </div>
          </label>
        </div>

        {/* Section 2: Live Stage & Collective Tip Goal */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🥁</span> Stage Performance &amp; Live Goals
          </h3>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={enableGigTipGoal}
              onChange={(e) => setEnableGigTipGoal(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Enable Live Gig Tip Goal Tracker</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Display a collective tip milestone progress bar on your public stage QR code sheet (e.g. Tour Van Gas / Album Fund).
              </div>
            </div>
          </label>

          {enableGigTipGoal && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Default Gig Target Amount ($ USD)
              </label>
              <input
                type="number"
                min={25}
                step={25}
                value={gigTipGoalDollars}
                onChange={(e) => setGigTipGoalDollars(Number(e.target.value))}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-base)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  width: 160,
                }}
              />
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={autoRotateQr}
              onChange={(e) => setAutoRotateQr(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Enforce Dynamic 90-Second Anti-Replay QR Rotation</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Prevents screenshot abuse by rotating cryptographic tokens on live screen stage tip sheets.
              </div>
            </div>
          </label>
        </div>

        {/* Section 3: Public Bio & Roster Showcase */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎸</span> Public Bio &amp; Band Showcase
          </h3>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={showRosterOnBio}
              onChange={(e) => setShowRosterOnBio(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Display Full Member Lineup on Public Band Bio</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Shows interactive cards for each band member with their photo, role, and instruments.
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={showInstrumentTags}
              onChange={(e) => setShowInstrumentTags(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Showcase Stage Gear &amp; Musical Influences</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Highlight your collective sonic identity and instrument setups on discovery cards.
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={audioPreviewEnabled}
              onChange={(e) => setAudioPreviewEnabled(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Enable Audio Demo Snippets on Public Profile</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Embed the interactive Audio Preview Player on your band page.
              </div>
            </div>
          </label>
        </div>

        {/* Section 4: Operational Notifications */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔔</span> Notifications &amp; Alerts
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyTips} onChange={(e) => setNotifyTips(e.target.checked)} />
            Email all members when a live band tip is received
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyInvites} onChange={(e) => setNotifyInvites(e.target.checked)} />
            Email admins when a member accepts or declines an invitation
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifySplits} onChange={(e) => setNotifySplits(e.target.checked)} />
            Email members when a new split configuration version is published
          </label>
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--accent-primary, #A855F7)',
            color: '#000000',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
            alignSelf: 'flex-start',
            boxShadow: '0 6px 20px rgba(168, 85, 247, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          Save Band Settings
        </button>
      </form>
    </div>
  );
}
