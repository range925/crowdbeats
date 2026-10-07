'use client';

/**
 * Crowdbeats V2 — Fan Portal Settings & Preferences
 * Route: /fan/settings
 */

import React, { useState, useEffect } from 'react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsToggle } from '@/components/settings/SettingsToggle';
import { SettingsPicker } from '@/components/settings/SettingsPicker';
import { SettingsSearch } from '@/components/settings/SettingsSearch';
import { useAuth } from '@/lib/hooks/useAuth';

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--cb-surface-1, #151722)',
  padding: 24,
  borderRadius: 16,
  border: '1px solid var(--cb-border-subtle, #2B2D44)',
};

export default function FanSettingsPage() {
  const { user } = useAuth();
  const uid = user?.uid || 'guest';

  const [searchQuery, setSearchQuery] = useState('');

  // Tipping Defaults
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [allowQuickOneTapTipping, setAllowQuickOneTapTipping] = useState(true);
  const [defaultAnonymousTipping, setDefaultAnonymousTipping] = useState(false);
  const [tipPresets] = useState<[number, number, number, number]>([2, 5, 10, 20]);

  // Privacy & Location
  const [locationPrecision, setLocationPrecision] = useState<'precise' | 'approximate'>('precise');
  const [radarDiscoverable, setRadarDiscoverable] = useState(true);
  const [shareListeningActivity, setShareListeningActivity] = useState(true);

  // Notifications
  const [alertLive, setAlertLive] = useState(true);
  const [alertNearbyStages, setAlertNearbyStages] = useState(true);
  const [alertReceipts, setAlertReceipts] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifs = localStorage.getItem(`cb_notifs_${uid}`);
      if (savedNotifs) {
        try {
          const parsed = JSON.parse(savedNotifs);
          if (parsed.followedArtistsLive !== undefined) setAlertLive(parsed.followedArtistsLive);
          if (parsed.nearbyStageAlerts !== undefined) setAlertNearbyStages(parsed.nearbyStageAlerts);
          if (parsed.tipsReceived !== undefined) setAlertReceipts(parsed.tipsReceived);
        } catch (_) {}
      }

      const savedPriv = localStorage.getItem(`cb_priv_${uid}`);
      if (savedPriv) {
        try {
          const parsed = JSON.parse(savedPriv);
          if (parsed.locationPrecision !== undefined) setLocationPrecision(parsed.locationPrecision);
          if (parsed.profileDiscoverableInRadar !== undefined) setRadarDiscoverable(parsed.profileDiscoverableInRadar);
          if (parsed.defaultAnonymousTipping !== undefined) setDefaultAnonymousTipping(parsed.defaultAnonymousTipping);
          if (parsed.shareListeningActivity !== undefined) setShareListeningActivity(parsed.shareListeningActivity);
        } catch (_) {}
      }
    }
  }, [uid]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `cb_notifs_${uid}`,
        JSON.stringify({
          followedArtistsLive: alertLive,
          nearbyStageAlerts: alertNearbyStages,
          tipsReceived: alertReceipts,
        })
      );

      localStorage.setItem(
        `cb_priv_${uid}`,
        JSON.stringify({
          locationPrecision,
          profileDiscoverableInRadar: radarDiscoverable,
          defaultAnonymousTipping,
          shareListeningActivity,
        })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const q = searchQuery.toLowerCase();
  const showTipping = !q || 'tipping wallet currency preset one-tap anonymous'.includes(q);
  const showPrivacy = !q || 'privacy location precision radar gps stealth'.includes(q);
  const showAlerts = !q || 'alerts notifications live nearby receipts'.includes(q);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '16px 8px 80px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--cb-text-primary, #FFFFFF)' }}>
          Fan Account Settings
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 14, margin: 0 }}>
          Manage your fast 1-tap tipping defaults, live GPS discovery precision, privacy controls, and stage notifications.
        </p>
      </div>

      <SettingsSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search settings…" />

      {saved && (
        <div style={{ background: 'rgba(0, 240, 118, 0.15)', border: '1px solid rgba(0, 240, 118, 0.4)', color: '#00F076', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          ✓ Fan settings updated successfully!
        </div>
      )}

      <div style={CARD_STYLE}>
        <AppearanceSettings />
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {showTipping && (
          <div style={CARD_STYLE}>
            <SettingsSection title="Tipping & Wallet Defaults" icon={<span>💜</span>}>
              <SettingsRow label="Preferred Currency" description="Sets your default display and tipping currency." htmlFor="currency-picker">
                <SettingsPicker
                  id="currency-picker"
                  value={currency}
                  onChange={(v) => setCurrency(v as 'USD' | 'EUR' | 'GBP')}
                  options={[
                    { value: 'USD', label: 'USD ($) — United States' },
                    { value: 'EUR', label: 'EUR (€) — Eurozone' },
                    { value: 'GBP', label: 'GBP (£) — United Kingdom' },
                  ]}
                />
              </SettingsRow>

              <SettingsRow label="Default Tip Presets" description="Your quick-tip amounts shown during a live set.">
                <div style={{ display: 'flex', gap: 8 }}>
                  {tipPresets.map((preset) => (
                    <span
                      key={preset}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: 'rgba(124, 58, 237, 0.2)',
                        border: '1px solid rgba(124, 58, 237, 0.4)',
                        color: '#C084FC',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      ${preset}
                    </span>
                  ))}
                </div>
              </SettingsRow>

              <SettingsRow label="Enable Quick 1-Tap Tipping" description="Skip payment confirmation for tips under $25 when using your saved payment method." htmlFor="toggle-onetap">
                <SettingsToggle id="toggle-onetap" checked={allowQuickOneTapTipping} onChange={setAllowQuickOneTapTipping} />
              </SettingsRow>

              <SettingsRow label="Default to Anonymous Tipping" description="Hide your real name from public live stage tip tickers and artist tip walls." htmlFor="toggle-anon">
                <SettingsToggle id="toggle-anon" checked={defaultAnonymousTipping} onChange={setDefaultAnonymousTipping} />
              </SettingsRow>
            </SettingsSection>
          </div>
        )}

        {showPrivacy && (
          <div style={CARD_STYLE}>
            <SettingsSection title="Privacy & Location Precision" icon={<span>🗺️</span>}>
              <SettingsRow label="Nearby Map Location Precision" description="Controls how accurately the app uses your GPS for live music discovery." htmlFor="location-picker">
                <SettingsPicker
                  id="location-picker"
                  value={locationPrecision}
                  onChange={(v) => setLocationPrecision(v as 'precise' | 'approximate')}
                  options={[
                    { value: 'precise', label: 'Precise GPS (Real-Time)' },
                    { value: 'approximate', label: 'Approximate (~1.1 km)' },
                  ]}
                />
              </SettingsRow>

              <SettingsRow label="Discoverable by Performing Artists" description="Allows artists to see anonymous fan count tallies at their stage without sharing your identity." htmlFor="toggle-radar">
                <SettingsToggle id="toggle-radar" checked={radarDiscoverable} onChange={setRadarDiscoverable} />
              </SettingsRow>

              <SettingsRow label="Share Listening Activity" description="Lets followed artists see you in their audience counts while you are nearby." htmlFor="toggle-listening">
                <SettingsToggle id="toggle-listening" checked={shareListeningActivity} onChange={setShareListeningActivity} />
              </SettingsRow>
            </SettingsSection>
          </div>
        )}

        {showAlerts && (
          <div style={CARD_STYLE}>
            <SettingsSection title="Live Alerts & Notifications" icon={<span>🔔</span>}>
              <SettingsRow label="Followed Artist Goes Live" description="Notify me immediately when an artist I follow starts a live stage set." htmlFor="toggle-alert-live">
                <SettingsToggle id="toggle-alert-live" checked={alertLive} onChange={setAlertLive} />
              </SettingsRow>

              <SettingsRow label="Nearby Stage Alerts" description="Alert me to live music happening within walking distance (0.5 mi)." htmlFor="toggle-alert-stages">
                <SettingsToggle id="toggle-alert-stages" checked={alertNearbyStages} onChange={setAlertNearbyStages} />
              </SettingsRow>

              <SettingsRow label="Tip Receipts via Email" description="Send digital tip receipts and tax-deductible contribution summaries to email." htmlFor="toggle-alert-receipts">
                <SettingsToggle id="toggle-alert-receipts" checked={alertReceipts} onChange={setAlertReceipts} />
              </SettingsRow>
            </SettingsSection>
          </div>
        )}

        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            color: '#FFFFFF',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            alignSelf: 'flex-start',
            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          Save Fan Settings
        </button>
      </form>
    </div>
  );
}
