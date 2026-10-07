'use client';

import React, { useState, useMemo } from 'react';
import {
  AdminKpiCard,
  AdminStatusBadge,
  LiveStageRadarVisualizer,
  LiveSessionHealthView,
  ActionDialog,
  DetailDrawer,
  FreshnessLabel,
  LiveRadarIcon,
  ArtistsIcon,
  AlertTriangleIcon,
  SearchIcon,
  CheckCircleIcon,
  ClockIcon,
  FilterIcon,
  UsersIcon,
  DollarSignIcon,
  XIcon,
} from '@/components/admin';

type DiscoveryTab = 'live-map' | 'check-ins' | 'search-quality' | 'regional-coverage' | 'location-health' | 'qr-analytics';

interface PerformerStage {
  id: string;
  name: string;
  type: 'SOLO' | 'BAND';
  metro: string;
  venueName: string;
  coordinates: { lat: number; lng: number };
  activeSince: string;
  lastHeartbeatAgeSec: number;
  audienceBand: '< 5' | '5-14' | '15+';
  tipsCents: number;
  status: 'ACTIVE' | 'STALE' | 'OFFLINE';
  qrValid: boolean;
}

const LIVE_STAGES: PerformerStage[] = [
  { id: 'stg_01', name: 'Maya Lin', type: 'SOLO', metro: 'New York', venueName: 'Washington Square Park (Arch)', coordinates: { lat: 40.7308, lng: -73.9973 }, activeSince: '45m ago', lastHeartbeatAgeSec: 18, audienceBand: '15+', tipsCents: 14200, status: 'ACTIVE', qrValid: true },
  { id: 'stg_02', name: 'The Brass Roots', type: 'BAND', metro: 'Nashville', venueName: 'Broadway & 4th Ave', coordinates: { lat: 36.1627, lng: -86.7816 }, activeSince: '1h 20m ago', lastHeartbeatAgeSec: 24, audienceBand: '15+', tipsCents: 38900, status: 'ACTIVE', qrValid: true },
  { id: 'stg_03', name: 'Austin Synth Wave', type: 'BAND', metro: 'Austin', venueName: 'Red River Cultural District', coordinates: { lat: 30.2672, lng: -97.7431 }, activeSince: '2h 10m ago', lastHeartbeatAgeSec: 42, audienceBand: '5-14', tipsCents: 18400, status: 'ACTIVE', qrValid: true },
  { id: 'stg_04', name: 'Devon Miles', type: 'SOLO', metro: 'New Orleans', venueName: 'Frenchmen St & Chartres', coordinates: { lat: 29.9634, lng: -90.0583 }, activeSince: '3h 40m ago', lastHeartbeatAgeSec: 280, audienceBand: '5-14', tipsCents: 9200, status: 'STALE', qrValid: false },
  { id: 'stg_05', name: 'Luna Keys', type: 'SOLO', metro: 'London', venueName: 'Camden Lock Market', coordinates: { lat: 51.5413, lng: -0.1463 }, activeSince: '35m ago', lastHeartbeatAgeSec: 12, audienceBand: '15+', tipsCents: 21500, status: 'ACTIVE', qrValid: true },
];

export default function DiscoveryAndLiveMapPage() {
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('live-map');
  const [selectedMetro, setSelectedMetro] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'SOLO' | 'BAND'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<PerformerStage | null>(null);
  const [forceEndStage, setForceEndStage] = useState<PerformerStage | null>(null);
  const [stages, setStages] = useState<PerformerStage[]>(LIVE_STAGES);

  // Filtered performers
  const filteredStages = useMemo(() => {
    return stages.filter((stg) => {
      const matchMetro = selectedMetro === 'ALL' || stg.metro.toLowerCase().includes(selectedMetro.toLowerCase());
      const matchType = selectedType === 'ALL' || stg.type === selectedType;
      const matchQuery = !searchQuery.trim() || stg.name.toLowerCase().includes(searchQuery.toLowerCase()) || stg.venueName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMetro && matchType && matchQuery;
    });
  }, [stages, selectedMetro, selectedType, searchQuery]);

  const handleForceEnd = async (reason: string) => {
    if (!forceEndStage) return;
    setStages((prev) => prev.map((s) => s.id === forceEndStage.id ? { ...s, status: 'OFFLINE' } : s));
    setForceEndStage(null);
    if (selectedStage?.id === forceEndStage.id) {
      setSelectedStage(null);
    }
  };

  return (
    <div
      style={{
        padding: '24px 32px 48px',
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────────
          1. PAGE HEADER
      ───────────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          paddingBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                color: 'var(--admin-text-primary, #0F172A)',
                letterSpacing: '-0.025em',
              }}
            >
              Discovery & Live Map
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                textTransform: 'uppercase',
              }}
            >
              Privacy Protected (Coarse)
            </span>
          </div>
          <p
            style={{
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Real-time stage discovery, GPS geofences, anti-replay QR verification, and search quality metrics. Fan locations are strictly aggregated.
          </p>
        </div>

        <FreshnessLabel lastUpdated="Updated just now" />
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. TOP FOUR CARDS
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Discovery Operational Telemetry">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          <AdminKpiCard
            title="Live Verified Performers"
            value="25 Active"
            subtitle="Broadcasting on map"
            trend={{ value: "+4 tonight", isPositive: true, label: "vs yesterday" }}
            icon={<ArtistsIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Performers currently holding an active, heartbeat-verified discovery lease."
          />

          <AdminKpiCard
            title="Covered Metro Regions"
            value="6 Metros"
            subtitle="US & UK active areas"
            trend={{ value: "100%", isPositive: true, label: "healthy coverage" }}
            icon={<LiveRadarIcon size={18} strokeWidth={2.2} />}
            accentColor="#7C3AED"
            tooltip="Designated metro clusters with verified active performer stages."
          />

          <AdminKpiCard
            title="Zero-Result Searches"
            value="12 (2.4%)"
            subtitle="Fan discovery drop-offs"
            isAdverse={true}
            trend={{ value: "-0.8%", isPositive: false, label: "improving" }}
            icon={<SearchIcon size={18} strokeWidth={2.2} />}
            accentColor="#F59E0B"
            tooltip="Search queries where fan location or keyword returned zero live stages."
          />

          <AdminKpiCard
            title="Stale Check-ins Needing Action"
            value="1 Action Req"
            subtitle="Missing heartbeats > 3m"
            isAdverse={true}
            trend={{ value: "1 Stale", isPositive: true, label: "requires force-end" }}
            icon={<AlertTriangleIcon size={18} strokeWidth={2.2} />}
            accentColor="#EF4444"
            tooltip="Performers whose devices ceased sending heartbeats without an explicit check-out."
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. TABS
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          gap: 20,
          overflowX: 'auto',
        }}
        role="tablist"
      >
        {[
          { id: 'live-map', label: 'Live Map' },
          { id: 'check-ins', label: 'Check-ins' },
          { id: 'search-quality', label: 'Search Quality' },
          { id: 'regional-coverage', label: 'Regional Coverage' },
          { id: 'location-health', label: 'Location Health' },
          { id: 'qr-analytics', label: 'QR Entry Analytics' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id as DiscoveryTab)}
              style={{
                padding: '10px 2px',
                border: 'none',
                background: 'transparent',
                borderBottom: isSelected
                  ? '2px solid var(--admin-accent-primary, #7C3AED)'
                  : '2px solid transparent',
                color: isSelected
                  ? 'var(--admin-accent-primary, #7C3AED)'
                  : 'var(--admin-text-secondary, #64748B)',
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. TAB CONTENT
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'live-map' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: 'var(--admin-surface-card, #FFFFFF)',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-secondary, #64748B)' }}>
                Filter Metro:
              </span>
              {['ALL', 'New York', 'Nashville', 'Austin', 'New Orleans', 'London'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMetro(m)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    background: selectedMetro === m ? 'var(--admin-text-primary, #0F172A)' : 'transparent',
                    color: selectedMetro === m ? '#FFFFFF' : 'var(--admin-text-secondary, #64748B)',
                    cursor: 'pointer',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {(['ALL', 'SOLO', 'BAND'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    background: selectedType === t ? 'var(--admin-accent-primary, #7C3AED)' : 'transparent',
                    color: selectedType === t ? '#FFFFFF' : 'var(--admin-text-secondary, #64748B)',
                    cursor: 'pointer',
                  }}
                >
                  {t === 'ALL' ? 'All Formats' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Map-first 2/3 Map + 1/3 List Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'stretch',
            }}
            className="admin-map-split"
          >
            {/* 2/3 Width: Live Stage Radar Map */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <LiveStageRadarVisualizer />
            </div>

            {/* 1/3 Width: Synchronized Performer & Check-in List */}
            <div
              style={{
                background: 'var(--admin-surface-card, #FFFFFF)',
                borderRadius: 12,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                <input
                  type="text"
                  placeholder="Filter performers in view..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {filteredStages.map((stg) => {
                  const isSelected = selectedStage?.id === stg.id;
                  return (
                    <div
                      key={stg.id}
                      onClick={() => setSelectedStage(stg)}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                        border: isSelected ? '1px solid var(--admin-accent-primary, #7C3AED)' : '1px solid transparent',
                        cursor: 'pointer',
                        marginBottom: 6,
                        transition: 'all 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--admin-text-primary, #0F172A)' }}>
                          {stg.name}
                        </div>
                        <AdminStatusBadge
                          status={stg.status}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)' }}>
                        {stg.venueName} • {stg.metro}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        <span>Heartbeat: {stg.lastHeartbeatAgeSec}s ago</span>
                        <span>Audience: <strong>{stg.audienceBand}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'check-ins' && (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Active Stage Check-ins & GPS Leases</h3>
            <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
              Enforces 5-minute lease renewal intervals and anti-ghosting safeguards
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Stage / Performer</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Metro & Location</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Session Started</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Last Heartbeat</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>QR Anti-Replay</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stg) => (
                <tr key={stg.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{stg.name} ({stg.type})</td>
                  <td style={{ padding: '14px 16px' }}>{stg.venueName}, {stg.metro}</td>
                  <td style={{ padding: '14px 16px' }}>{stg.activeSince}</td>
                  <td style={{ padding: '14px 16px', color: stg.lastHeartbeatAgeSec > 180 ? '#DC2626' : 'inherit' }}>
                    {stg.lastHeartbeatAgeSec}s ago {stg.lastHeartbeatAgeSec > 180 && '(STALE)'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {stg.qrValid ? (
                      <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Verified Sync</span>
                    ) : (
                      <span style={{ color: '#DC2626', fontWeight: 600 }}>⚠ Expired / Disconnected</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {stg.status !== 'OFFLINE' && (
                      <button
                        type="button"
                        onClick={() => setForceEndStage(stg)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.05)',
                          color: '#DC2626',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Force End Session
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'search-quality' && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: '20px', borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Zero-Result Queries (Last 24h)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Query Term</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Fan Location</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { q: 'Jazz trio tonight', loc: 'Chicago (Wicker Park)', c: 8 },
                  { q: 'Acoustic guitar', loc: 'Seattle (Capitol Hill)', c: 6 },
                  { q: 'Bluegrass band', loc: 'Denver (LoDo)', c: 4 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>&ldquo;{row.q}&rdquo;</td>
                    <td style={{ padding: '10px 8px' }}>{row.loc}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: '20px', borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Location Accuracy & GPS Drift</h3>
            <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 16px' }}>
              Mean GPS accuracy reported by performer devices: <strong>4.8 meters</strong> (99.2% inside geofences).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>High Accuracy (&lt; 10m)</span>
                  <span style={{ fontWeight: 700 }}>94.2%</span>
                </div>
                <div style={{ height: 6, background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 9999 }}>
                  <div style={{ width: '94.2%', height: '100%', background: '#10B981', borderRadius: 9999 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Medium Accuracy (10 - 25m)</span>
                  <span style={{ fontWeight: 700 }}>5.0%</span>
                </div>
                <div style={{ height: 6, background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 9999 }}>
                  <div style={{ width: '5.0%', height: '100%', background: '#F59E0B', borderRadius: 9999 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Low / Degraded (&gt; 25m)</span>
                  <span style={{ fontWeight: 700 }}>0.8%</span>
                </div>
                <div style={{ height: 6, background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 9999 }}>
                  <div style={{ width: '0.8%', height: '100%', background: '#EF4444', borderRadius: 9999 }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'regional-coverage' && (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            padding: '24px',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Metro Supply vs Demand Imbalance</h3>
          <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 20px' }}>
            Identifies metros with high fan search density but low active busker supply.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Metro Region</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Active Performers</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Nearby Active Fans</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Supply/Demand Ratio</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metro: 'New York (Washington Sq)', perf: 9, fans: 184, ratio: '1 : 20.4', rec: 'Optimal density' },
                { metro: 'Nashville (Broadway)', perf: 7, fans: 112, ratio: '1 : 16.0', rec: 'Optimal density' },
                { metro: 'Austin (Red River)', perf: 5, fans: 89, ratio: '1 : 17.8', rec: 'Balanced' },
                { metro: 'Chicago (Wicker Park)', perf: 2, fans: 74, ratio: '1 : 37.0', rec: 'Undersupplied — promote artist incentives' },
                { metro: 'London (Camden)', perf: 3, fans: 51, ratio: '1 : 17.0', rec: 'Balanced' },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{r.metro}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.perf}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.fans}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{r.ratio}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', color: r.rec.includes('Undersupplied') ? '#D97706' : '#059669', fontWeight: 600 }}>
                    {r.rec}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'location-health' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <LiveSessionHealthView />
        </section>
      )}

      {activeTab === 'qr-analytics' && (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            padding: '24px',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>QR Code Dynamic Entry & Anti-Replay Analytics</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '4px 0 0' }}>
                Distinguishes creator profile QR entries from 30s rotating tip session tokens.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              Anti-Tamper Active (SHA-256)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: '16px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 700 }}>VALID QR SCANS (24H)</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>1,842</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 700 }}>EXPIRED SESSIONS BLOCKED</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#DC2626' }}>14</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 700 }}>QR-TO-TIP CONVERSION</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#10B981' }}>28.4%</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 700 }}>TOKEN ROTATION CADENCE</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>30.0s</div>
            </div>
          </div>
        </section>
      )}

      {/* Force End Session Confirmation Dialog */}
      {forceEndStage && (
        <ActionDialog
          isOpen={Boolean(forceEndStage)}
          onClose={() => setForceEndStage(null)}
          onConfirm={handleForceEnd}
          title="Force End Live Stage Session"
          targetDescription={`${forceEndStage.name} (${forceEndStage.venueName})`}
          consequenceText="Terminates the live broadcasting lease immediately. The performer stage will disappear from the fan discovery map and any active tipping sessions will be rejected."
          isDestructive={true}
          confirmLabel="Force End Stage"
          requiresReason={true}
          reasonPlaceholder="Specify reason (e.g. Heartbeat timeout, venue closing, location abuse report)..."
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .admin-map-split {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
