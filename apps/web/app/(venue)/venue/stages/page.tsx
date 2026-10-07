/**
 * Crowdbeats V2 — Venue Stage Management (Phase 9)
 * Configure physical stages, capacity limits, and QR presets.
 */

'use client';

import React, { useState } from 'react';

interface Stage {
  id: string;
  name: string;
  description: string;
  capacity: number;
  isActive: boolean;
}

export default function VenueStagesPage() {
  const [stages, setStages] = useState<Stage[]>([
    {
      id: 'stg_1',
      name: 'Main Stage',
      description: 'Primary performance space with 32-channel PA and lighting grid.',
      capacity: 1150,
      isActive: true,
    },
    {
      id: 'stg_2',
      name: 'The Poster Room (Lounge)',
      description: 'Intimate acoustic lounge for opener sets and VIP check-ins.',
      capacity: 150,
      isActive: true,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [stageName, setStageName] = useState('');
  const [stageCapacity, setStageCapacity] = useState('200');
  const [stageDesc, setStageDesc] = useState('');
  const [created, setCreated] = useState(false);

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName) return;

    setStages([
      ...stages,
      {
        id: `stg_${Date.now()}`,
        name: stageName,
        description: stageDesc,
        capacity: parseInt(stageCapacity) || 100,
        isActive: true,
      },
    ]);

    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      setShowModal(false);
      setStageName('');
      setStageDesc('');
    }, 1500);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Stage Configuration
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Manage stages within your venue. Each stage supports independent live sessions and QR tip streams.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add New Stage
        </button>
      </div>

      {/* Stages Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {stages.map((s) => (
          <div key={s.id} style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</h3>
                <span style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  Active
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.4 }}>
                {s.description}
              </p>
            </div>

            <div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-raised)', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>
                Capacity: <strong style={{ color: 'var(--text-primary)' }}>{s.capacity} persons</strong> • 1 Active Session Limit
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ flex: 1, background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Stage QR Preset
                </button>
                <button style={{ flex: 1, background: 'var(--accent-primary)', border: 'none', color: '#FFFFFF', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Launch Session
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Stage Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface-card)', width: 440, padding: 28, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>
              Add Venue Stage
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Configure a physical or virtual stage zone within your venue.
            </p>

            {created ? (
              <div style={{ padding: 14, background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ✓ Stage added successfully!
              </div>
            ) : (
              <form onSubmit={handleCreateStage} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Stage Name
                  </label>
                  <input
                    type="text"
                    required
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g. Patio Acoustic Stage"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Stage Capacity
                  </label>
                  <input
                    type="number"
                    value={stageCapacity}
                    onChange={(e) => setStageCapacity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={stageDesc}
                    onChange={(e) => setStageDesc(e.target.value)}
                    placeholder="Sound specs or area notes..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: 'var(--accent-primary)', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Save Stage
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
