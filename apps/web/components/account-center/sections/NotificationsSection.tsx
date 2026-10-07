'use client';

import React, { useState } from 'react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { SettingsToggle } from '@/components/settings/SettingsToggle';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  marginBottom: 20,
  overflow: 'hidden',
};

const HEADER: React.CSSProperties = {
  padding: '14px 20px',
  background: 'rgba(255,255,255,0.02)',
  borderBottom: '1px solid var(--border-subtle, #2B2D44)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-secondary, #94A3B8)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  minHeight: 48,
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  gap: 16,
};

export function NotificationsSection() {
  const { notifications, updateNotifications } = useUserSettings();
  const [toast, setToast] = useState(false);

  const handleToggle = (key: keyof typeof notifications, val: boolean) => {
    updateNotifications({ [key]: val });
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#10B981', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
          Notification preferences saved ✓
        </div>
      )}

      {/* Financial & Transactional */}
      <div style={CARD}>
        <div style={HEADER}>Financial & Transactions</div>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Tips Received Alerts</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Real-time push chimes when a fan tips your performance.</div>
          </div>
          <SettingsToggle checked={notifications.tipsReceived} onChange={(v) => handleToggle('tipsReceived', v)} label="Tips Received" />
        </div>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Payout Transfers</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Updates when funds clear Stripe to your verified bank account.</div>
          </div>
          <SettingsToggle checked={notifications.payoutsAndTransfers} onChange={(v) => handleToggle('payoutsAndTransfers', v)} label="Payouts" />
        </div>
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Campaign Milestones</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Alerts for album pressings, venue matches, and crowdfunding goals.</div>
          </div>
          <SettingsToggle checked={notifications.campaignMilestones} onChange={(v) => handleToggle('campaignMilestones', v)} label="Campaigns" />
        </div>
      </div>

      {/* Live Events & Music Discovery */}
      <div style={CARD}>
        <div style={HEADER}>Live Shows & Discovery</div>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Followed Artists Live</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Instant push when an artist you support starts busking or goes live.</div>
          </div>
          <SettingsToggle checked={notifications.followedArtistsLive} onChange={(v) => handleToggle('followedArtistsLive', v)} label="Artists Live" />
        </div>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Nearby Stage Geofence Alerts</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Notifications when you walk within 500m of an active street performance.</div>
          </div>
          <SettingsToggle checked={notifications.nearbyStageAlerts} onChange={(v) => handleToggle('nearbyStageAlerts', v)} label="Nearby Stages" />
        </div>
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>New Song Releases & EPKs</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Hear new audio previews from followed creators.</div>
          </div>
          <SettingsToggle checked={notifications.newReleases} onChange={(v) => handleToggle('newReleases', v)} label="New Releases" />
        </div>
      </div>

      {/* Delivery Channels */}
      <div style={CARD}>
        <div style={HEADER}>Delivery Channels</div>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Mobile Push Notifications</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Deliver instant alerts to this browser or native mobile device.</div>
          </div>
          <SettingsToggle checked={notifications.pushNotificationsEnabled} onChange={(v) => handleToggle('pushNotificationsEnabled', v)} label="Push" />
        </div>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Weekly Email Digest</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Weekly summary of tips, discovery highlights, and artist sets.</div>
          </div>
          <SettingsToggle checked={notifications.emailDigestsEnabled} onChange={(v) => handleToggle('emailDigestsEnabled', v)} label="Email Digest" />
        </div>
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>SMS Stage Alerts</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Critical performer stage callouts delivered via text message.</div>
          </div>
          <SettingsToggle checked={notifications.smsAlertsEnabled} onChange={(v) => handleToggle('smsAlertsEnabled', v)} label="SMS Alerts" />
        </div>
      </div>
    </div>
  );
}
