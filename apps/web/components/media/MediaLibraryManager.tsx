'use client';

import React, { useState } from 'react';

export interface WebMediaAsset {
  id: string;
  title: string;
  type: 'photo' | 'video' | 'stage_backdrop';
  url: string;
  isPrimaryEpk: boolean;
  isCover: boolean;
  fileSize: string;
  dimensions: string;
}

interface MediaLibraryManagerProps {
  isBand?: boolean;
  entityName: string;
  entityId?: string;
}

export function MediaLibraryManager({
  isBand = false,
  entityName,
}: MediaLibraryManagerProps) {
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'stage_backdrop'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Initial seed assets
  const [assets, setAssets] = useState<WebMediaAsset[]>(
    isBand
      ? [
          {
            id: 'm1',
            title: 'Band EPK Press Photo',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
            isPrimaryEpk: true,
            isCover: false,
            fileSize: '4.8 MB',
            dimensions: '3000x2000',
          },
          {
            id: 'm2',
            title: 'Casbah Stage Headline',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
            isPrimaryEpk: false,
            isCover: false,
            fileSize: '3.9 MB',
            dimensions: '1920x1080',
          },
          {
            id: 'm3',
            title: 'Live Festival Anthem Reel',
            type: 'video',
            url: 'https://assets.crowdbeats.com/video/midnight_echoes_encore.mp4',
            isPrimaryEpk: false,
            isCover: false,
            fileSize: '24.2 MB',
            dimensions: '4K · 1:12',
          },
          {
            id: 'm4',
            title: 'Midnight Echoes Stage Banner',
            type: 'stage_backdrop',
            url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
            isPrimaryEpk: false,
            isCover: true,
            fileSize: '6.4 MB',
            dimensions: '2560x1440',
          },
        ]
      : [
          {
            id: 'm1',
            title: 'Studio EPK Headshot',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
            isPrimaryEpk: true,
            isCover: false,
            fileSize: '4.2 MB',
            dimensions: '2400x2400',
          },
          {
            id: 'm2',
            title: 'Sunset Lounge Stage Shot',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
            isPrimaryEpk: false,
            isCover: false,
            fileSize: '3.8 MB',
            dimensions: '1920x1080',
          },
          {
            id: 'm3',
            title: 'Acoustic Encore Video Clip',
            type: 'video',
            url: 'https://assets.crowdbeats.com/video/elena_cruz_encore.mp4',
            isPrimaryEpk: false,
            isCover: false,
            fileSize: '18.4 MB',
            dimensions: '1080p · 0:45',
          },
          {
            id: 'm4',
            title: 'Elena Cruz Live Cover Banner',
            type: 'stage_backdrop',
            url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200',
            isPrimaryEpk: false,
            isCover: true,
            fileSize: '5.1 MB',
            dimensions: '2560x1440',
          },
        ]
  );

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'photo' | 'video' | 'stage_backdrop'>('photo');
  const [newUrl, setNewUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isCover, setIsCover] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSetPrimary = (asset: WebMediaAsset) => {
    setAssets((prev) =>
      prev.map((a) => ({
        ...a,
        isPrimaryEpk: a.id === asset.id,
      }))
    );
    showToast(`"${asset.title}" set as Primary EPK Headshot!`);
  };

  const handleSetCover = (asset: WebMediaAsset) => {
    setAssets((prev) =>
      prev.map((a) => ({
        ...a,
        isCover: a.id === asset.id,
      }))
    );
    showToast(`"${asset.title}" set as Stage Banner!`);
  };

  const handleDelete = (asset: WebMediaAsset) => {
    if (!confirm(`Delete "${asset.title}" from media library?`)) return;
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    showToast(`Deleted "${asset.title}"`);
  };

  const handlePublishNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: WebMediaAsset = {
      id: `m_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      url: newUrl.trim() || (newType === 'video' ? 'https://assets.crowdbeats.com/video/sample.mp4' : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'),
      isPrimaryEpk: isPrimary,
      isCover: isCover,
      fileSize: newType === 'video' ? '18.5 MB' : '3.6 MB',
      dimensions: newType === 'video' ? '1080p · 1:00' : '2400x1600',
    };

    setAssets((prev) => {
      let next = [...prev];
      if (isPrimary) next = next.map((a) => ({ ...a, isPrimaryEpk: false }));
      if (isCover) next = next.map((a) => ({ ...a, isCover: false }));
      return [created, ...next];
    });

    setIsUploadOpen(false);
    setNewTitle('');
    setNewUrl('');
    setIsPrimary(false);
    setIsCover(false);
    showToast(`Published "${created.title}" to ${entityName} Media Library!`);
  };

  const filteredAssets = filter === 'all' ? assets : assets.filter((a) => a.type === filter);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--cb-status-live, #10B981)',
            color: '#000',
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Context Header Card */}
      <div
        style={{
          background: 'rgba(21, 23, 34, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--cb-border-subtle, #2B2D44)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: isBand ? 'rgba(16, 185, 129, 0.15)' : 'rgba(124, 58, 237, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            {isBand ? '👥' : '📸'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  background: isBand ? 'rgba(16, 185, 129, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                  color: isBand ? '#10B981' : '#A855F7',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                }}
              >
                {isBand ? 'BAND STUDIO' : 'SOLO ARTIST'}
              </span>
              <span style={{ color: 'var(--cb-text-muted, #64748B)', fontSize: 12 }}>
                {entityName}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--cb-text-primary, #FFF)' }}>
              Media Library & Press Kit
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)' }}>
              Manage high-res photography, promotional tracks, video reels & EPK assets.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          style={{
            background: 'var(--cb-purple-main, #7C3AED)',
            color: '#FFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
          }}
        >
          <span>+</span>
          <span>Upload Media</span>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'all', label: `All Media (${assets.length})` },
          { key: 'photo', label: `Photos (${assets.filter((a) => a.type === 'photo').length})` },
          { key: 'video', label: `Videos (${assets.filter((a) => a.type === 'video').length})` },
          { key: 'stage_backdrop', label: `Banners (${assets.filter((a) => a.type === 'stage_backdrop').length})` },
        ].map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              style={{
                background: active ? 'var(--cb-purple-main, #7C3AED)' : 'rgba(21, 23, 34, 0.6)',
                color: active ? '#FFF' : 'var(--cb-text-secondary, #94A3B8)',
                border: active ? '1px solid var(--cb-purple-light, #A855F7)' : '1px solid var(--cb-border-subtle, #2B2D44)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Media Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            style={{
              background: 'rgba(21, 23, 34, 0.75)',
              border: '1px solid var(--cb-border-subtle, #2B2D44)',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.15s ease',
            }}
          >
            {/* Visual Thumbnail Area */}
            <div
              style={{
                height: 140,
                background: '#0D0F17',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: asset.type !== 'video' ? `url(${asset.url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {asset.type === 'video' && (
                <div style={{ fontSize: 36, opacity: 0.85 }}>▶️</div>
              )}

              {/* Badges */}
              <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
                {asset.isPrimaryEpk && (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.95)',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    PRIMARY HEADSHOT
                  </span>
                )}
                {asset.isCover && (
                  <span
                    style={{
                      background: 'rgba(124, 58, 237, 0.95)',
                      color: '#FFF',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    STAGE BANNER
                  </span>
                )}
              </div>
            </div>

            {/* Asset Details */}
            <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'var(--cb-text-primary, #FFF)',
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={asset.title}
              >
                {asset.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)', marginBottom: 12 }}>
                {asset.type.toUpperCase().replace('_', ' ')} • {asset.dimensions}
              </div>

              {/* Actions Row */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {asset.type === 'photo' && !asset.isPrimaryEpk && (
                  <button
                    onClick={() => handleSetPrimary(asset)}
                    style={{
                      flex: 1,
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Set Primary
                  </button>
                )}
                {!asset.isCover && (
                  <button
                    onClick={() => handleSetCover(asset)}
                    style={{
                      flex: 1,
                      background: 'rgba(124, 58, 237, 0.12)',
                      color: '#A855F7',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Set Banner
                  </button>
                )}
                <button
                  onClick={() => handleDelete(asset)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                  title="Delete Asset"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#151722',
              border: '1px solid var(--cb-border-subtle, #2B2D44)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFF' }}>
                Upload Media to {entityName}
              </h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishNew}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>
                  ASSET TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Live Tour Stage Shot"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0D0F17',
                    border: '1px solid #2B2D44',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#FFF',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>
                  MEDIA TYPE
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: '#0D0F17',
                    border: '1px solid #2B2D44',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#FFF',
                    fontSize: 13,
                  }}
                >
                  <option value="photo">Photo / Press Shot</option>
                  <option value="video">Video Clip / Reel</option>
                  <option value="stage_backdrop">Stage Backdrop Banner</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>
                  IMAGE / MEDIA URL (OPTIONAL)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0D0F17',
                    border: '1px solid #2B2D44',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#FFF',
                    fontSize: 13,
                  }}
                />
              </div>

              {newType === 'photo' && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF', fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    <span>Set as Primary EPK Headshot</span>
                  </label>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF', fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isCover}
                    onChange={(e) => setIsCover(e.target.checked)}
                  />
                  <span>Set as Stage Cover Banner</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  style={{
                    background: 'transparent',
                    color: '#94A3B8',
                    border: '1px solid #2B2D44',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--cb-purple-main, #7C3AED)',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Publish to Media Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
