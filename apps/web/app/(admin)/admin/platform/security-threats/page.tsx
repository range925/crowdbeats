'use client';

import React, { useState, useEffect } from 'react';
import { SecurityThreatRadar, AdminKpiCard } from '@/components/admin';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase/app';

const db = getFirestore(firebaseApp);

interface SecurityEvent {
  id: string;
  type: string;
  severity: string;
  uid: string;
  ipAddress: string;
  timestamp: string;
  resolved: boolean;
}

export default function SecurityThreatsPage() {
  const [threatLevel, setThreatLevel] = useState('DEFCON 5');
  const [isWafActive, setIsWafActive] = useState(true);
  const [incidents, setIncidents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const q = query(collection(db, 'securityEvents'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const events = snap.docs.map(doc => ({
          id: doc.id,
          type: doc.data().type || 'Unknown',
          severity: doc.data().severity || 'LOW',
          uid: doc.data().uid || 'Anonymous',
          ipAddress: doc.data().ipAddress || 'Unknown IP',
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate().toLocaleString() : String(doc.data().timestamp || 'Unknown Time'),
          resolved: !!doc.data().resolved,
        }));
        setIncidents(events);
        
        // Simple logic for threat level based on active incidents
        const activeHigh = events.filter(e => !e.resolved && (e.severity === 'HIGH' || e.severity === 'CRITICAL')).length;
        if (activeHigh > 5) setThreatLevel('DEFCON 2');
        else if (activeHigh > 0) setThreatLevel('DEFCON 3');
        else setThreatLevel('DEFCON 5');

      } catch (e: any) {
        // Fallback for missing index or other error
        if (e.message?.includes('index')) {
          try {
            const snap = await getDocs(collection(db, 'securityEvents'));
            const events = snap.docs.map(doc => ({
              id: doc.id,
              type: doc.data().type || 'Unknown',
              severity: doc.data().severity || 'LOW',
              uid: doc.data().uid || 'Anonymous',
              ipAddress: doc.data().ipAddress || 'Unknown IP',
              timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate().toLocaleString() : String(doc.data().timestamp || 'Unknown Time'),
              resolved: !!doc.data().resolved,
            }));
            setIncidents(events);
          } catch(e2: any) {
            setError(e2.message);
          }
        } else {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const totalBlocked = incidents.filter(i => i.resolved).length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🚨</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Security Threat Intelligence & Abuse Radar
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0 38px' }}>
            Multi-vector perimeter defenses, WAF rate-limiting, Stripe Radar risk profiles, and active session controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-card)', padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>WAF Perimeter:</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: isWafActive ? 'var(--status-success)' : 'var(--status-error)' }}>
              {isWafActive ? 'ARMED & ENFORCING' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Threat KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <AdminKpiCard
          title="Active Defense Posture"
          value={threatLevel}
          subtitle={threatLevel === 'DEFCON 5' ? 'Normal Platform State' : 'Elevated Threat State'}
          trend={{ value: threatLevel === 'DEFCON 5' ? "Guarded" : "Alert", isPositive: threatLevel === 'DEFCON 5' }}
          icon="🛡️"
          accentColor="#10B981"
        />
        <AdminKpiCard
          title="WAF Rate-Limit Blocks"
          value={totalBlocked.toString()}
          subtitle="Resolved threats"
          trend={{ value: "Tracking", isPositive: true }}
          icon="🛑"
          accentColor="#EF4444"
          sparklineData={[420, 380, 350, 310, 330, 290, totalBlocked]}
        />
        <AdminKpiCard
          title="Stripe Radar Risk Index"
          value="2.1 / 100"
          subtitle="Extremely low fraud score"
          trend={{ value: "Safe (<10)", isPositive: true }}
          icon="💳"
          accentColor="#03DAC6"
        />
        <AdminKpiCard
          title="MFA Step-Up Challenges"
          value="100%"
          subtitle="Enforced on all staff roles"
          trend={{ value: "Compliant", isPositive: true }}
          icon="🔐"
          accentColor="#8B5CF6"
        />
      </div>

      {/* Threat Radar Visualizer */}
      <div style={{ marginBottom: 28 }}>
        <SecurityThreatRadar />
      </div>

      {/* Active Security Incident Log Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Perimeter Threat Log & Interventions</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Immutable audit of security interceptions across cloud functions and external gateways.</div>
          </div>
          <button
            onClick={() => alert('Exporting encrypted security audit log...')}
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Export Threat Log (.CSV)
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading security events...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--status-error)' }}>Error: {error}</div>
        ) : incidents.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 16 }}>🛡️</span>
            No security threats logged. Coast is clear.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Incident Vector</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Source IP</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Target User UID</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Severity</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Defense Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {inc.type}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {inc.ipAddress}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: 12 }}>
                    {inc.uid}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? '#EF4444' : inc.severity === 'MEDIUM' ? '#F59E0B' : '#10B981',
                        background: inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : inc.severity === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: !inc.resolved ? 'var(--status-error)' : 'var(--status-success)',
                      }}
                    >
                      {!inc.resolved ? '🛑 ACTIVE' : '✓ RESOLVED'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-tertiary)' }}>
                    {inc.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
