'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/admin/adminFirestore';
import { collection, query, getDocs } from 'firebase/firestore';

export default function EnterpriseVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVenues() {
      try {
        const snap = await getDocs(query(collection(db(), 'venueProfiles')));
        setVenues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadVenues();
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Venues & Physical Stage Oversight
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Supervise partner venues, verify physical geofence boundaries, and audit stage capacity limits.
      </p>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Venue</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Location</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Stages</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Geofence Radius</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading venues...</td></tr>
            ) : venues.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏟️</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No Partner Venues Configured</div>
                  <div style={{ fontSize: 12 }}>Live venues will populate here once verified.</div>
                </td>
              </tr>
            ) : (
              venues.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{v.name || 'Unknown Venue'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{v.location || 'Unknown'}</td>
                  <td style={{ padding: '14px 20px' }}>{v.stageCount || 1}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{v.radius || '50m'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
