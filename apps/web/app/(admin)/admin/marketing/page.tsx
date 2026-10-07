'use client';

import React, { useState } from 'react';
import { usePlatformMetrics, db } from '@/lib/admin/adminFirestore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function EnterpriseMarketingPage() {
  const { metrics, loading } = usePlatformMetrics();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await addDoc(collection(db(), 'announcements'), {
        title,
        body,
        createdAt: serverTimestamp(),
        author: 'admin',
        active: true
      });
      setMessage('Announcement published successfully.');
      setTitle('');
      setBody('');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Growth & Marketing Telemetry
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Track fan onboarding conversion, viral stage QR scans, and marketing referral attribution.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1, background: 'var(--surface-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Platform Users</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>
            {loading ? '...' : metrics.totalUsers}
          </div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Artists</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-secondary)' }}>
            {loading ? '...' : metrics.totalArtists}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Publish Platform Announcement</h3>
        {message && <div style={{ marginBottom: 12, color: message.startsWith('Error') ? 'var(--status-error)' : 'var(--status-success)', fontSize: 13 }}>{message}</div>}
        <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Announcement Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
          />
          <textarea
            placeholder="Announcement Body"
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            rows={4}
            style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px',
              borderRadius: 8,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start'
            }}
          >
            {submitting ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
}
