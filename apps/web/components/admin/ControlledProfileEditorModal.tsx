'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  EditIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  ShieldIcon,
} from './AdminIcons';
import type { AdminUser, AdminArtist } from '@/lib/admin/adminFirestore';

export interface ControlledProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
  artist?: AdminArtist | null;
  onSave: (updates: Record<string, string>, reason: string) => Promise<void>;
}

export function ControlledProfileEditorModal({
  isOpen,
  onClose,
  user,
  artist,
  onSave,
}: ControlledProfileEditorModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [city, setCity] = useState('');
  const [publicLocation, setPublicLocation] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when user or modal opens
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || artist?.bio || '');
      setPhotoUrl(user.photoUrl || '');
      setGenre(user.genre || artist?.genre || '');
      setCity(user.city || '');
      setPublicLocation(user.publicLocation || '');
      setInternalNotes('');
      setReason('');
      setError(null);
    }
  }, [isOpen, user, artist]);

  // Compute live current vs proposed diff
  const diffs = useMemo(() => {
    if (!user) return [];
    const list: Array<{ field: string; current: string; proposed: string }> = [];

    const origDisplayName = user.displayName || '';
    if (displayName.trim() !== origDisplayName) {
      list.push({ field: 'Display Name', current: origDisplayName || '—', proposed: displayName.trim() || '—' });
    }

    const origBio = user.bio || artist?.bio || '';
    if (bio.trim() !== origBio) {
      list.push({ field: 'Bio', current: origBio || '—', proposed: bio.trim() || '—' });
    }

    const origPhoto = user.photoUrl || '';
    if (photoUrl.trim() !== origPhoto) {
      list.push({ field: 'Photo URL', current: origPhoto || '—', proposed: photoUrl.trim() || '—' });
    }

    const origGenre = user.genre || artist?.genre || '';
    if (genre.trim() !== origGenre) {
      list.push({ field: 'Genre', current: origGenre || '—', proposed: genre.trim() || '—' });
    }

    const origCity = user.city || '';
    if (city.trim() !== origCity) {
      list.push({ field: 'City', current: origCity || '—', proposed: city.trim() || '—' });
    }

    const origLocation = user.publicLocation || '';
    if (publicLocation.trim() !== origLocation) {
      list.push({ field: 'Public Location', current: origLocation || '—', proposed: publicLocation.trim() || '—' });
    }

    if (internalNotes.trim()) {
      list.push({ field: 'Append Internal Note', current: '—', proposed: internalNotes.trim() });
    }

    return list;
  }, [user, artist, displayName, bio, photoUrl, genre, city, publicLocation, internalNotes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory operational justification reason is required for compliance audit logs.');
      return;
    }

    const updates: Record<string, string> = {};
    if (displayName.trim() !== (user.displayName || '')) updates.displayName = displayName.trim();
    if (bio.trim() !== (user.bio || artist?.bio || '')) updates.bio = bio.trim();
    if (photoUrl.trim() !== (user.photoUrl || '')) updates.photoUrl = photoUrl.trim();
    if (genre.trim() !== (user.genre || artist?.genre || '')) updates.genre = genre.trim();
    if (city.trim() !== (user.city || '')) updates.city = city.trim();
    if (publicLocation.trim() !== (user.publicLocation || '')) updates.publicLocation = publicLocation.trim();
    if (internalNotes.trim()) updates.internalNotes = internalNotes.trim();

    if (Object.keys(updates).length === 0) {
      setError('No profile modifications detected. Please adjust at least one field or cancel.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(updates, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save controlled profile edits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isArtistPersona = user.personaType === 'SOLO' || user.personaType === 'BAND' || !!artist;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '20px',
      }}
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        style={{
          backgroundColor: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
          borderRadius: 14,
          border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                color: 'var(--admin-accent-primary, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EditIcon size={18} strokeWidth={2} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                  letterSpacing: '-0.02em',
                }}
              >
                Controlled Profile Editor
              </h2>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
                  marginTop: 2,
                }}
              >
                Audited modification for UID:{' '}
                <code
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    background: 'var(--admin-bg-base, var(--surface-base, #F1F5F9))',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {user.uid}
                </code>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 6,
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--admin-text-tertiary, #94A3B8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Role Safeguard Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              marginBottom: 20,
            }}
          >
            <div style={{ color: '#2563EB', marginTop: 2 }}>
              <ShieldIcon size={16} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--admin-text-primary, #0F172A)' }}>
              <strong>Operational Safeguard & Audit Policy:</strong> Direct admin overrides are restricted and logged to
              the immutable compliance trail with your authenticated Staff credentials. All modifications require an
              explicit operational reason.
            </div>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--admin-status-error, #EF4444)',
                fontSize: 13,
                marginBottom: 20,
                fontWeight: 600,
              }}
            >
              <AlertCircleIcon size={16} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <form id="controlled-profile-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Display Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--admin-text-secondary, #475569)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                    background: 'var(--admin-bg-base, #F8FAFC)',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Photo URL */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--admin-text-secondary, #475569)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Photo / Avatar URL
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                    background: 'var(--admin-bg-base, #F8FAFC)',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Genre (if creator/artist) */}
              {isArtistPersona && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--admin-text-secondary, #475569)',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Primary Musical Genre
                  </label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Cyberpunk Synthwave"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                      background: 'var(--admin-bg-base, #F8FAFC)',
                      color: 'var(--admin-text-primary, #0F172A)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* City */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--admin-text-secondary, #475569)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  City / Region
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                    background: 'var(--admin-bg-base, #F8FAFC)',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Public Location */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--admin-text-secondary, #475569)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Public Location Label
                </label>
                <input
                  type="text"
                  value={publicLocation}
                  onChange={(e) => setPublicLocation(e.target.value)}
                  placeholder="e.g. United States"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                    background: 'var(--admin-bg-base, #F8FAFC)',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Bio Field */}
            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--admin-text-secondary, #475569)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Biography / Public Description
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="User self-description or artist profile bio..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'var(--admin-bg-base, #F8FAFC)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Append Internal Staff Notes */}
            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--admin-text-secondary, #475569)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Append Internal Staff Note (Optional)
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Operational notes visible only to Crowdbeats administrators..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'var(--admin-bg-base, #F8FAFC)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Live Diff Preview Section */}
            {diffs.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  padding: '16px',
                  borderRadius: 10,
                  backgroundColor: 'var(--admin-surface-raised, #F1F5F9)',
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--admin-text-primary, #0F172A)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangleIcon size={14} strokeWidth={2} style={{ color: '#D97706' }} />
                  Proposed Field Modifications Diff ({diffs.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {diffs.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 1fr 1fr',
                        gap: 12,
                        alignItems: 'center',
                        fontSize: 12,
                        padding: '6px 10px',
                        borderRadius: 6,
                        backgroundColor: 'var(--admin-surface-card, #FFFFFF)',
                        border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--admin-text-secondary, #475569)' }}>{d.field}</span>
                      <span
                        style={{
                          color: '#DC2626',
                          textDecoration: 'line-through',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={d.current}
                      >
                        {d.current}
                      </span>
                      <span
                        style={{
                          color: '#16A34A',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={d.proposed}
                      >
                        {d.proposed}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mandatory Operational Reason */}
            <div
              style={{
                marginTop: 20,
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid rgba(124, 58, 237, 0.3)',
                backgroundColor: 'rgba(124, 58, 237, 0.04)',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--admin-accent-primary, #7C3AED)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Mandatory Operational Reason *
              </label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide detailed compliance or support ticket rationale (e.g. Customer support ticket #129 requested name typo correction)..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'var(--admin-surface-card, #FFFFFF)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-tertiary, #64748B)',
                  marginTop: 4,
                }}
              >
                This reason is permanently stamped onto the Cloud Firestore audit event log for compliance reviews.
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
            background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
          }}
        >
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: '1px solid var(--admin-border-subtle, #CBD5E1)',
              background: 'transparent',
              color: 'var(--admin-text-secondary, #475569)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="controlled-profile-form"
            disabled={isSubmitting || diffs.length === 0 || !reason.trim()}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--admin-accent-primary, #7C3AED)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: isSubmitting || diffs.length === 0 || !reason.trim() ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || diffs.length === 0 || !reason.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckIcon size={16} strokeWidth={2.4} />
            <span>{isSubmitting ? 'Saving Edits…' : 'Apply & Audit Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
