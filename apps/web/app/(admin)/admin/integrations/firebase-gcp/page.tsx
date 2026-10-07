'use client';
/**
 * Crowdbeats V2 — Firebase & Google Cloud Infrastructure Center
 *
 * Displays non-secret project metadata, service statuses, Workload Identity strategy,
 * and Secret Manager health.
 */

import React from 'react';
import Link from 'next/link';

export default function FirebaseGcpConfigPage() {
  const services = [
    { name: 'Firebase Authentication', status: 'OPERATIONAL', icon: '🔑', detail: 'Google & Apple OAuth enabled' },
    { name: 'Cloud Firestore Multi-Tenant', status: 'OPERATIONAL', icon: '🗄️', detail: 'Strict security rules enforced' },
    { name: 'Firebase Cloud Storage', status: 'OPERATIONAL', icon: '📦', detail: 'Encrypted creator media buckets' },
    { name: 'Cloud Functions v2 (Node 20)', status: 'OPERATIONAL', icon: '⚡', detail: 'us-central1 region, minInstances=0' },
    { name: 'Firebase App Check', status: 'ACTIVE', icon: '🛡️', detail: 'Play Integrity & DeviceCheck enforced' },
    { name: 'Firebase Crashlytics', status: 'ACTIVE', icon: '📉', detail: 'Zero PII crash diagnostics' },
    { name: 'Google Cloud Secret Manager', status: 'ACTIVE', icon: '🔒', detail: '100% server secrets isolated' },
    { name: 'Cloud Logging & Telemetry', status: 'ACTIVE', icon: '📋', detail: 'Redacted structured JSON logs' },
  ];

  return (
    <div style={{ padding: '32px 36px', color: 'var(--text-primary)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
        <Link href="/admin/integrations" style={{ color: '#A855F7', textDecoration: 'none' }}>
          Integrations
        </Link>
        <span>/</span>
        <span style={{ color: '#FFFFFF' }}>Firebase & Google Cloud</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32 }}>🔥</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Montserrat, sans-serif' }}>
              Firebase & Google Cloud Platform
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0 0' }}>
              Core cloud resources, identity federation, attached service accounts, and managed infrastructure status.
            </p>
          </div>
        </div>

        <a
          href="https://console.firebase.google.com"
          target="_blank"
          rel="noreferrer"
          style={{
            backgroundColor: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Firebase Console ↗</span>
        </a>
      </div>

      {/* Project Metadata Card */}
      <div style={{ backgroundColor: '#151722', border: '1px solid #2B2D44', borderRadius: 12, padding: '22px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#FFFFFF' }}>
          Project Identification & Strategy
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ backgroundColor: '#1E2032', padding: '14px', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Project ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', fontFamily: 'monospace', marginTop: 4 }}>crowdbeats-v2-dev</div>
          </div>
          <div style={{ backgroundColor: '#1E2032', padding: '14px', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Primary Region</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#38BDF8', marginTop: 4 }}>us-central1 (Iowa)</div>
          </div>
          <div style={{ backgroundColor: '#1E2032', padding: '14px', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Identity Strategy</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981', marginTop: 4 }}>Application Default Credentials</div>
          </div>
          <div style={{ backgroundColor: '#1E2032', padding: '14px', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Deployed Version</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#A855F7', fontFamily: 'monospace', marginTop: 4 }}>v0.13.0-integrations</div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {services.map((svc) => (
          <div key={svc.name} style={{ backgroundColor: '#151722', border: '1px solid #2B2D44', borderRadius: 10, padding: '16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{svc.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>{svc.name}</span>
                <span style={{ fontSize: 10, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  {svc.status}
                </span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: 12, margin: '4px 0 0 0' }}>{svc.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
