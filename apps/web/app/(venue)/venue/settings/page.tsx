'use client';

/**
 * Crowdbeats V2 — Venue Settings & Defaults
 *
 * Full operational settings suite for Venues:
 *   - Geofence & Check-In Operations (Radius, Auto-checkout, Dynamic QR rotation)
 *   - Public Stage Discovery & Amenities (Schedule visibility, Staff tip jar, Amenities)
 *   - Operational Alerts & Audit Reports (Door staff notifications, Daily summaries)
 *   - Appearance Themes
 */

import React, { useState, useEffect } from 'react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';

const ALL_AMENITIES = [
  'Full Craft Bar',
  'Multi-Tier Sound System',
  'Outdoor Smoking Patio',
  'All-Ages Section',
  'Sound Engineer On-Site',
  'Wheelchair Accessible',
  'Steinway Grand Piano',
  'Food Truck Patio',
];

export default function VenueSettingsPage() {
  // Geofence & Operations
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState(100);
  const [autoCheckoutHours, setAutoCheckoutHours] = useState(3);
  const [autoRotateQr, setAutoRotateQr] = useState(true);
  const [qrRotationIntervalSeconds, setQrRotationIntervalSeconds] = useState(60);

  // Public Stage & Amenities
  const [publicScheduleVisible, setPublicScheduleVisible] = useState(true);
  const [enableStaffTipJar, setEnableStaffTipJar] = useState(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Full Craft Bar',
    'Multi-Tier Sound System',
    'Outdoor Smoking Patio',
    'Sound Engineer On-Site',
  ]);

  // Notifications
  const [notifyCheckIns, setNotifyCheckIns] = useState(true);
  const [notifySessionEnded, setNotifySessionEnded] = useState(true);
  const [notifyDailyAudit, setNotifyDailyAudit] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('cb_venue_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.geofenceRadiusMeters !== undefined) setGeofenceRadiusMeters(parsed.geofenceRadiusMeters);
          if (parsed.autoCheckoutHours !== undefined) setAutoCheckoutHours(parsed.autoCheckoutHours);
          if (parsed.autoRotateQr !== undefined) setAutoRotateQr(parsed.autoRotateQr);
          if (parsed.qrRotationIntervalSeconds !== undefined) setQrRotationIntervalSeconds(parsed.qrRotationIntervalSeconds);
          if (parsed.publicScheduleVisible !== undefined) setPublicScheduleVisible(parsed.publicScheduleVisible);
          if (parsed.enableStaffTipJar !== undefined) setEnableStaffTipJar(parsed.enableStaffTipJar);
          if (parsed.selectedAmenities !== undefined) setSelectedAmenities(parsed.selectedAmenities);
          if (parsed.notifyCheckIns !== undefined) setNotifyCheckIns(parsed.notifyCheckIns);
          if (parsed.notifySessionEnded !== undefined) setNotifySessionEnded(parsed.notifySessionEnded);
          if (parsed.notifyDailyAudit !== undefined) setNotifyDailyAudit(parsed.notifyDailyAudit);
        } catch (_) {}
      }
    }
  }, []);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'cb_venue_settings',
        JSON.stringify({
          geofenceRadiusMeters,
          autoCheckoutHours,
          autoRotateQr,
          qrRotationIntervalSeconds,
          publicScheduleVisible,
          enableStaffTipJar,
          selectedAmenities,
          notifyCheckIns,
          notifySessionEnded,
          notifyDailyAudit,
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
          Venue Settings &amp; Defaults
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, var(--text-secondary))', fontSize: 14, margin: 0 }}>
          Configure performer GPS geofence radiuses, dynamic QR rotation behaviors, public amenity tags, and door staff arrival alerts.
        </p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(0, 240, 118, 0.15)', border: '1px solid rgba(0, 240, 118, 0.4)', color: '#00F076', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          ✓ Venue settings updated successfully!
        </div>
      )}

      {/* Appearance & Theme Section */}
      <div style={{ background: 'var(--cb-surface-1, var(--surface-card))', padding: 24, borderRadius: 16, border: '1px solid var(--cb-border-subtle, var(--border-subtle))' }}>
        <AppearanceSettings />
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* Section 1: Geofence & Check-In Operations */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📍</span> Geofence &amp; Stage Operations
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                GPS Check-In Geofence Radius
              </label>
              <select
                value={geofenceRadiusMeters}
                onChange={(e) => setGeofenceRadiusMeters(Number(e.target.value))}
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
                <option value={50}>50 Meters (Intimate Room / Speakeasy)</option>
                <option value={100}>100 Meters (Standard Club &amp; Patio)</option>
                <option value={250}>250 Meters (Multi-Stage Festival Grounds)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Auto-Checkout Window After Set
              </label>
              <select
                value={autoCheckoutHours}
                onChange={(e) => setAutoCheckoutHours(Number(e.target.value))}
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
                <option value={2}>2 Hours (Fast Rotation)</option>
                <option value={3}>3 Hours (Standard Evening Window)</option>
                <option value={4}>4 Hours (Extended Festival Slot)</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={autoRotateQr}
              onChange={(e) => setAutoRotateQr(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Enforce Dynamic Anti-Replay QR Rotation on Stage Displays</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Rotates verification tokens on TV screens and door stands every {qrRotationIntervalSeconds} seconds.
              </div>
            </div>
          </label>
        </div>

        {/* Section 2: Public Stage & Amenities */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏟️</span> Public Stage Discovery &amp; Amenities
          </h3>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={publicScheduleVisible}
              onChange={(e) => setPublicScheduleVisible(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Show Tonight's Stage Lineup on Public Venue Profile</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Allows audience members discovering the venue on the map to see who is performing live.
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={enableStaffTipJar}
              onChange={(e) => setEnableStaffTipJar(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Enable Optional Venue Staff Tip Jar Support</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Allows fans to send digital gratuity to sound engineers and bartenders alongside the performer.
              </div>
            </div>
          </label>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Active Venue Amenities &amp; Badges
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: isSelected ? '1px solid #60A5FA' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-base)',
                      color: isSelected ? '#60A5FA' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Operational Notifications */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔔</span> Staff Alerts &amp; Reports
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyCheckIns} onChange={(e) => setNotifyCheckIns(e.target.checked)} />
            Notify door staff &amp; sound engineer when an artist completes GPS check-in
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifySessionEnded} onChange={(e) => setNotifySessionEnded(e.target.checked)} />
            Send stage set completion summary to manager upon performance wrap
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={notifyDailyAudit} onChange={(e) => setNotifyDailyAudit(e.target.checked)} />
            Deliver nightly door traffic and total stage tip volume audit report
          </label>
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--accent-primary, #3B82F6)',
            color: '#FFFFFF',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            alignSelf: 'flex-start',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          Save Venue Settings
        </button>
      </form>
    </div>
  );
}
