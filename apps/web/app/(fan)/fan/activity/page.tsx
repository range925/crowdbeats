'use client';

/**
 * Crowdbeats V2 — Fan Activity & Notifications Feed (Stitch Screen 9)
 * Route: /fan/activity
 */

import React, { useState } from 'react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'tip' | 'live' | 'follow' | 'campaign' | 'system';
  title: string;
  subtitle: string;
  timeAgo: string;
  amount?: string;
  avatarUrl?: string;
  progress?: number;
  artistName?: string;
  venue?: string;
  isRead?: boolean;
  isSilenced?: boolean;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act_1',
    type: 'tip',
    title: 'Tipped Luna & The Waves',
    subtitle: 'The Casbah • Main Stage — Verified on ledger',
    timeAgo: '2h ago',
    amount: '+$10.00',
    artistName: 'Luna & The Waves',
    venue: 'The Casbah • Main Stage',
    avatarUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80',
    isRead: false,
  },
  {
    id: 'act_2',
    type: 'live',
    title: 'Velvet Horizon went live',
    subtitle: 'Soda Bar • Stage A',
    timeAgo: '4h ago',
    artistName: 'Velvet Horizon',
    venue: 'Soda Bar • Stage A',
    avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
    isRead: false,
  },
  {
    id: 'act_3',
    type: 'follow',
    title: 'Marcus Cole followed you',
    subtitle: '@mcolemusic • 1d ago',
    timeAgo: '1d ago',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    isRead: true,
  },
  {
    id: 'act_4',
    type: 'campaign',
    title: 'Luna & The Waves • New Album Pressing',
    subtitle: 'Reached 80% funding milestone',
    timeAgo: '1d ago',
    progress: 80,
    isRead: false,
  },
  {
    id: 'act_5',
    type: 'tip',
    title: 'Tipped Neon Solstice',
    subtitle: 'Music Box • Rooftop — Verified on ledger',
    timeAgo: '3d ago',
    amount: '+$20.00',
    artistName: 'Neon Solstice',
    venue: 'Music Box • Rooftop',
    avatarUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=150&auto=format&fit=crop&q=80',
    isRead: true,
  },
  {
    id: 'act_6',
    type: 'system',
    title: 'System Security Update',
    subtitle: 'Stripe 256-bit encryption verified for your wallet.',
    timeAgo: '4d ago',
    isRead: true,
  },
];

export default function FanActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ActivityItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Notification Preferences State
  const [alertLive, setAlertLive] = useState(true);
  const [alertTips, setAlertTips] = useState(true);
  const [alertCampaigns, setAlertCampaigns] = useState(true);
  const [alertFollows, setAlertFollows] = useState(true);

  const tipsCount = activities.filter((a) => a.type === 'tip').length;
  const followsCount = activities.filter((a) => a.type === 'follow').length;
  const campaignsCount = activities.filter((a) => a.type === 'campaign').length;
  const alertsCount = activities.filter((a) => a.type === 'live' || a.type === 'system').length;

  const filters = [
    { key: 'All', label: `All (${activities.length})` },
    { key: 'Tips', label: `Tips (${tipsCount})` },
    { key: 'Follows', label: `Follows (${followsCount})` },
    { key: 'Campaigns', label: `Campaigns (${campaignsCount})` },
    { key: 'Alerts', label: `Alerts (${alertsCount})` },
  ];

  const filtered = activities.filter((a) => {
    if (selectedFilter === 'Tips') return a.type === 'tip';
    if (selectedFilter === 'Follows') return a.type === 'follow';
    if (selectedFilter === 'Campaigns') return a.type === 'campaign';
    if (selectedFilter === 'Alerts') return a.type === 'live' || a.type === 'system';
    return true;
  });

  const markAllRead = () => {
    setActivities((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const clearRead = () => {
    setActivities((prev) => prev.filter((a) => !a.isRead));
  };

  const toggleItemRead = (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: !a.isRead } : a))
    );
    setActiveMenuId(null);
  };

  const deleteItem = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setActiveMenuId(null);
  };

  const toggleSilence = (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isSilenced: !a.isSilenced } : a))
    );
    setActiveMenuId(null);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', color: 'var(--text-primary)', padding: '24px 16px' }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Activity & Alerts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
            Track your tip receipts, live show alerts, and artist updates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '6px 12px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚙️ Preferences
          </button>
          <button
            type="button"
            onClick={markAllRead}
            style={{
              padding: '6px 12px',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Mark all read ✓
          </button>
        </div>
      </div>

      {/* ── Filter Chips ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setSelectedFilter(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: selectedFilter === f.key ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: selectedFilter === f.key ? 'var(--accent-primary)' : 'var(--surface-card)',
              color: selectedFilter === f.key ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Feed List ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔕</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No {selectedFilter.toLowerCase()} activity</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>New notifications and alerts will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                position: 'relative',
                background: item.isRead ? 'var(--surface-base)' : 'var(--surface-card)',
                border: item.isRead ? '1px solid var(--border-subtle)' : '1px solid var(--accent-primary)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {/* Avatar / Icon */}
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={item.title}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--surface-raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {item.type === 'system' ? '🛡️' : '📢'}
                </div>
              )}

              {/* Text Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: item.isRead ? 600 : 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  {item.type === 'live' && (
                    <span style={{ background: 'var(--status-error)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>
                      LIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  {item.subtitle}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.timeAgo}</div>
              </div>

              {/* Amount badge */}
              {item.amount && (
                <div
                  style={{
                    background: 'rgba(74,222,128,0.15)',
                    color: 'var(--status-success)',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {item.amount}
                </div>
              )}

              {/* Options Menu Button */}
              <button
                type="button"
                onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ⋮
              </button>

              {/* Context Dropdown Menu */}
              {activeMenuId === item.id && (
                <div
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 50,
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 20,
                    minWidth: 180,
                    overflow: 'hidden',
                  }}
                >
                  {item.type === 'tip' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReceipt(item);
                        setActiveMenuId(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      🧾 View Receipt
                    </button>
                  )}
                  {item.artistName && (
                    <button
                      type="button"
                      onClick={() => toggleSilence(item.id)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {item.isSilenced ? '🔔 Unmute Artist' : '🔕 Mute Artist'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleItemRead(item.id)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {item.isRead ? '📩 Mark unread' : '✓ Mark read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      color: 'var(--status-error)',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Preferences Modal ─────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface-card)',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              maxWidth: 480,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Alert Preferences</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Customize push notifications and activity feed entries.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span>Live Stage Performance Alerts</span>
                <input
                  type="checkbox"
                  checked={alertLive}
                  onChange={(e) => setAlertLive(e.target.checked)}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span>Tip & Payment Receipts</span>
                <input
                  type="checkbox"
                  checked={alertTips}
                  onChange={(e) => setAlertTips(e.target.checked)}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span>Campaign Milestone Updates</span>
                <input
                  type="checkbox"
                  checked={alertCampaigns}
                  onChange={(e) => setAlertCampaigns(e.target.checked)}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span>New Followers & Social</span>
                <input
                  type="checkbox"
                  checked={alertFollows}
                  onChange={(e) => setAlertFollows(e.target.checked)}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSettingsModal(false);
                alert('Preferences saved.');
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ─────────────────────────────────────────────────── */}
      {activeReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface-card)',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              maxWidth: 440,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Official Tip Receipt</h3>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-success)' }}>{activeReceipt.amount}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Paid to {activeReceipt.artistName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{activeReceipt.venue}</div>
            </div>
            <div style={{ padding: '16px 0', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>SUCCEEDED (Settled)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Processor:</span>
                <span>Stripe 256-bit Encrypted</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ledger Verification:</span>
                <span style={{ fontFamily: 'monospace' }}>cb_ledger_{activeReceipt.id}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveReceipt(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
