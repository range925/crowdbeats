'use client';

import React, { useState, useEffect } from 'react';
import { AdminKpiCard } from '@/components/admin';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase/app';

const db = getFirestore(firebaseApp);

interface FeatureFlagsData {
  enableTipping: boolean;
  enableSponsorship: boolean;
  enableBandAccounts: boolean;
  enableVenueOnboarding: boolean;
  maintenanceMode: boolean;
  [key: string]: boolean;
}

const DEFAULT_FLAGS: FeatureFlagsData = {
  enableTipping: true,
  enableSponsorship: false,
  enableBandAccounts: true,
  enableVenueOnboarding: true,
  maintenanceMode: false,
};

const FLAG_METADATA: Record<string, { name: string; description: string; category: string }> = {
  enableTipping: { name: 'Enable Tipping', description: 'Allow fans to send tips to artists.', category: 'MONETIZATION' },
  enableSponsorship: { name: 'Corporate Sponsorships', description: 'Enable corporate sponsorship matching pools.', category: 'EXPERIMENT' },
  enableBandAccounts: { name: 'Band Accounts', description: 'Allow creation of shared band accounts.', category: 'CORE' },
  enableVenueOnboarding: { name: 'Venue Onboarding', description: 'Allow venues to sign up.', category: 'CORE' },
  maintenanceMode: { name: 'Maintenance Mode', description: 'Put platform into maintenance mode.', category: 'SECURITY' },
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlags() {
      try {
        const snap = await getDoc(doc(db, 'platformConfig', 'featureFlags'));
        if (snap.exists()) {
          setFlags({ ...DEFAULT_FLAGS, ...snap.data() } as FeatureFlagsData);
        } else {
          await setDoc(doc(db, 'platformConfig', 'featureFlags'), DEFAULT_FLAGS);
          setFlags(DEFAULT_FLAGS);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadFlags();
  }, []);

  const toggleFlag = async (key: string) => {
    if (!flags) return;
    const newValue = !flags[key];
    const newFlags = { ...flags, [key]: newValue };
    setFlags(newFlags);
    try {
      await setDoc(doc(db, 'platformConfig', 'featureFlags'), { [key]: newValue }, { merge: true });
    } catch (e: any) {
      alert('Failed to update flag: ' + e.message);
      setFlags(flags); // revert
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading feature flags...</div>;
  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;
  if (!flags) return <div style={{ padding: 40 }}>No feature flags found.</div>;

  const flagKeys = Object.keys(flags);
  const activeCount = Object.values(flags).filter(Boolean).length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🚩</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Feature Flags & Remote Configuration
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0 38px' }}>
            Instant platform kill-switches, gradual percentage rollouts, and remote capabilities without redeployment.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <AdminKpiCard
          title="Active Feature Flags"
          value={activeCount}
          subtitle="Total platform toggles enabled"
          trend={{ value: `${activeCount} Active`, isPositive: true }}
          icon="🚩"
          accentColor="#8B5CF6"
        />
        <AdminKpiCard
          title="Total Flags"
          value={flagKeys.length}
          subtitle="Available configuration toggles"
          trend={{ value: "Sync", isPositive: true }}
          icon="⚡"
          accentColor="#03DAC6"
        />
      </div>

      {/* Flags List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {flagKeys.map((key) => {
          const isEnabled = flags[key];
          const meta = FLAG_METADATA[key] || { name: key, description: '', category: 'UNKNOWN' };
          return (
            <div
              key={key}
              style={{
                background: 'var(--surface-card)',
                borderRadius: 12,
                padding: '20px 24px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ maxWidth: 650 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{meta.name}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: meta.category === 'SECURITY' ? '#EF4444' : meta.category === 'MONETIZATION' ? '#10B981' : 'var(--accent-primary)',
                      background: 'var(--surface-raised)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {meta.category}
                  </span>
                  <code style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--surface-raised)', padding: '2px 6px', borderRadius: 4 }}>
                    {key}
                  </code>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '6px 0 0' }}>
                  {meta.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isEnabled ? 'var(--status-success)' : 'var(--text-tertiary)' }}>
                  {isEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <button
                  onClick={() => toggleFlag(key)}
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 14,
                    background: isEnabled ? 'var(--status-success)' : 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    padding: 2,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      transform: isEnabled ? 'translateX(24px)' : 'translateX(0px)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

