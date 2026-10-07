'use client';

/**
 * Crowdbeats V2 — Creator Studio Settings & Preferences
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

export default function CreatorSettingsPage() {
  const { user } = useAuth();
  const uid = user?.uid || 'guest';

  const [searchQuery, setSearchQuery] = useState('');

  const [autoBroadcastLive, setAutoBroadcastLive] = useState(true);
  const [defaultSetDurationMinutes, setDefaultSetDurationMinutes] = useState(60);
  const [showLiveTipTicker, setShowLiveTipTicker] = useState(true);
  const [allowAnonymousTips, setAllowAnonymousTips] = useState(true);

  const [customThankYouNote, setCustomThankYouNote] = useState(
    'Thank you so much for supporting live music and keeping the stage alive! 🎸'
  );
  const [minTipAlertCents, setMinTipAlertCents] = useState(500);

  const [radarDiscoverable, setRadarDiscoverable] = useState(true);
  const [audioPreviewOnCards, setAudioPreviewOnCards] = useState(true);
  const [showBookingContact, setShowBookingContact] = useState(true);

  const [notifyTips, setNotifyTips] = useState(true);
  const [notifyFollows, setNotifyFollows] = useState(true);
  const [notifyCampaigns, setNotifyCampaigns] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(`cb_creator_settings_${uid}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.autoBroadcastLive !== undefined) setAutoBroadcastLive(parsed.autoBroadcastLive);
          if (parsed.defaultSetDurationMinutes !== undefined) setDefaultSetDurationMinutes(parsed.defaultSetDurationMinutes);
          if (parsed.showLiveTipTicker !== undefined) setShowLiveTipTicker(parsed.showLiveTipTicker);
          if (parsed.allowAnonymousTips !== undefined) setAllowAnonymousTips(parsed.allowAnonymousTips);
          if (parsed.customThankYouNote !== undefined) setCustomThankYouNote(parsed.customThankYouNote);
          if (parsed.minTipAlertCents !== undefined) setMinTipAlertCents(parsed.minTipAlertCents);
          if (parsed.radarDiscoverable !== undefined) setRadarDiscoverable(parsed.radarDiscoverable);
          if (parsed.audioPreviewOnCards !== undefined) setAudioPreviewOnCards(parsed.audioPreviewOnCards);
          if (parsed.showBookingContact !== undefined) setShowBookingContact(parsed.showBookingContact);
          if (parsed.notifyTips !== undefined) setNotifyTips(parsed.notifyTips);
          if (parsed.notifyFollows !== undefined) setNotifyFollows(parsed.notifyFollows);
          if (parsed.notifyCampaigns !== undefined) setNotifyCampaigns(parsed.notifyCampaigns);
          if (parsed.notifyDailySummary !== undefined) setNotifyDailySummary(parsed.notifyDailySummary);
        } catch (_) {}
      }
    }
  }, [uid]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `cb_creator_settings_${uid}`,
        JSON.stringify({
          autoBroadcastLive, defaultSetDurationMinutes, showLiveTipTicker, allowAnonymousTips,
          customThankYouNote, minTipAlertCents, radarDiscoverable, audioPreviewOnCards,
          showBookingContact, notifyTips, notifyFollows, notifyCampaigns, notifyDailySummary,
        })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const q = searchQuery.toLowerCase();
  const showStage = !q || 'stage performance live set broadcast ticker anonymous duration'.includes(q);
  const showMonetization = !q || 'monetization tip thank you note alert threshold chime'.includes(q);
  const showDiscovery = !q || 'discoverability radar visibility audio booking'.includes(q);
  const showNotifications = !q || 'notification alert push email digest campaign follower'.includes(q);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--cb-text-primary, #FFFFFF)' }}>
          Creator Studio Settings
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 14, margin: 0 }}>
          Manage your stage performance defaults, automated fan appreciation, live radar presence, and notification alerts.
        </p>
      </div>

      <SettingsSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search settings…" />

      {saved && (
        <div style={{ background: 'rgba(0, 240, 118, 0.15)', border: '1px solid rgba(0, 240, 118, 0.4)', color: '#00F076', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          ✓ Creator settings saved and synced across your stage gear!
        </div>
      )}

      <div style={CARD_STYLE}>
        <AppearanceSettings />
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {showStage && (
          <div style={CARD_STYLE}>
            <SettingsSection title="Stage Performance & Live Set Defaults" icon={<span>🎙️</span>}>
              <SettingsRow label="Auto-Broadcast Live on GPS Check-In" description="Instantly illuminate your radar beacon when you enter a verified venue stage geofence." htmlFor="toggle-auto-broadcast">
                <SettingsToggle id="toggle-auto-broadcast" checked={autoBroadcastLive} onChange={setAutoBroadcastLive} />
              </SettingsRow>
              <SettingsRow label="Display Live Stage Tip Ticker" description="Show incoming tips and fan messages on your stage monitor or connected stage QR screen in real time." htmlFor="toggle-ticker">
                <SettingsToggle id="toggle-ticker" checked={showLiveTipTicker} onChange={setShowLiveTipTicker} />
              </SettingsRow>
              <SettingsRow label="Allow Anonymous Fan Tips" description="Permit audience members to send tips without displaying their username on public screens." htmlFor="toggle-anon-tips">
                <SettingsToggle id="toggle-anon-tips" checked={allowAnonymousTips} onChange={setAllowAnonymousTips} />
              </SettingsRow>
              <SettingsRow label="Default Stage Set Duration" description="The expected length of your live performance." htmlFor="duration-picker">
                <SettingsPicker
                  id="duration-picker"
                  value={String(defaultSetDurationMinutes)}
                  onChange={(v) => setDefaultSetDurationMinutes(Number(v))}
                  options={[
                    { value: '45', label: '45 min (Acoustic Showcase)' },
                    { value: '60', label: '60 min (Standard Live Set)' },
                    { value: '90', label: '90 min (Feature Headline)' },
                    { value: '120', label: '120 min (Extended Club Session)' },
                  ]}
                />
              </SettingsRow>
            </SettingsSection>
          </div>
        )}

        {showMonetization && (
          <div style={CARD_STYLE}>
            <SettingsSection title="Monetization & Fan Appreciation" icon={<span>💜</span>}>
              <SettingsRow label="Automated Fan Thank-You Note" description="Shown immediately upon tipping.">
                <div />
              </SettingsRow>
              <div style={{ padding: '0 0 14px' }}>
                <textarea
                  rows={3}
                  value={customThankYouNote}
                  onChange={(e) => setCustomThankYouNote(e.target.value)}
                  placeholder="Write a warm note to your tippers..."
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
                    background: 'var(--cb-surface-2, #161822)', color: 'var(--cb-text-primary, #FFFFFF)',
                    fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>
              <SettingsRow label="Stage Audio Alert Threshold" description="Minimum tip amount that triggers a chime during your live set." htmlFor="alert-threshold-picker">
                <SettingsPicker
                  id="alert-threshold-picker"
                  value={String(minTipAlertCents)}
                  onChange={(v) => setMinTipAlertCents(Number(v))}
                  options={[
                    { value: '100', label: 'Chime on every tip ($1+)' },
                    { value: '500', label: 'Chime on tips $5+' },
                    { value: '1000', label: 'Chime on tips $10+' },
                    { value: '2000', label: 'Chime on tips $20+' },
                    { value: '0', label: 'Silent mode' },
                  ]}
                />
              </SettingsRow>
            </SettingsSection>
          </div>
        )}

        {showDiscovery && (
          <div style={CARD_STYLE}>
            <SettingsSection title="Discoverability & Public Presence" icon={<span>🗺️</span>}>
              <SettingsRow label="Public Live Radar Visibility" description="Allow fans in your metro area to find your stage pins in the Nearby Discovery feed." htmlFor="toggle-radar">
                <SettingsToggle id="toggle-radar" checked={radarDiscoverable} onChange={setRadarDiscoverable} />
              </SettingsRow>
              <SettingsRow label="Enable Audio Demo Snippets on Public Profile" description="Display the interactive Audio Preview Player on your artist bio." htmlFor="toggle-audio">
                <SettingsToggle id="toggle-audio" checked={audioPreviewOnCards} onChange={setAudioPreviewOnCards} />
              </SettingsRow>
              <SettingsRow label="Display Booking & Collaboration Inquiries" description="Allow verified venues and festival curators to send performance invitations directly to your studio inbox." htmlFor="toggle-booking">
                <SettingsToggle id="toggle-booking" checked={showBookingContact} onChange={setShowBookingContact} />
              </SettingsRow>
            </SettingsSection>
          </div>
        )}

        {showNotifications && (
          <div style={CARD_STYLE}>
            <SettingsSection title="Notifications & Alerts" icon={<span>🔔</span>}>
              <SettingsRow label="Instant Tip Notifications" description="Push & email notification on live tips received." htmlFor="toggle-notify-tips">
                <SettingsToggle id="toggle-notify-tips" checked={notifyTips} onChange={setNotifyTips} />
              </SettingsRow>
              <SettingsRow label="New Follower Alerts" description="Email notification when a fan follows your stage profile." htmlFor="toggle-notify-follows">
                <SettingsToggle id="toggle-notify-follows" checked={notifyFollows} onChange={setNotifyFollows} />
              </SettingsRow>
              <SettingsRow label="Campaign & Sponsor Notifications" description="Campaign pledges, backer milestones & sponsor matches." htmlFor="toggle-notify-campaigns">
                <SettingsToggle id="toggle-notify-campaigns" checked={notifyCampaigns} onChange={setNotifyCampaigns} />
              </SettingsRow>
              <SettingsRow label="Post-Gig Revenue Digest" description="Nightly revenue and payout transfer ledger digest." htmlFor="toggle-notify-digest">
                <SettingsToggle id="toggle-notify-digest" checked={notifyDailySummary} onChange={setNotifyDailySummary} />
              </SettingsRow>
            </SettingsSection>
          </div>
        )}

        <button
          type="submit"
          style={{
            background: 'var(--accent-primary, #7C3AED)', color: '#FFFFFF', border: 'none',
            padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            alignSelf: 'flex-start', boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)', transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          Save Creator Settings
        </button>
      </form>
    </div>
  );
}
