'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProfileImageManager } from '@/components/media/ProfileImageManager';
import { FanProfileEditor } from './FanProfileEditor';
import { SoloProfileEditor } from './SoloProfileEditor';
import { BandProfileEditor } from './BandProfileEditor';
import { SponsorProfileEditor } from './SponsorProfileEditor';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 22,
  marginBottom: 20,
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
};

export function ProfileSettingsManager() {
  const auth = useAuth();
  const [profileData, setProfileData] = useState<{ user?: any; persona?: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(auth.photoUrl || undefined);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        if (res.status === 401) {
          // Use auth object as fallback
          setProfileData({
            user: {
              displayName: auth.displayName,
              photoUrl: auth.photoUrl,
            },
            persona: {},
          });
          return;
        }
        throw new Error('Failed to load profile details.');
      }
      const data = await res.json();
      setProfileData(data);
      if (data.user?.photoUrl) {
        setCurrentAvatar(data.user.photoUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [auth.uid]);

  const handleAvatarChange = (newUrl: string | null) => {
    setCurrentAvatar(newUrl || undefined);
    // Dispatched event so AccountCenterHeader or sidebars can reactively update without a full reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cb_profile_updated', { detail: { photoUrl: newUrl || null } }));
    }
  };

  const personaType = (auth.personaType as string) || 'fan';
  const mergedData = {
    displayName: auth.displayName,
    ...(profileData?.user || {}),
    ...(profileData?.persona || {}),
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Profile Photo & Visual Identity */}
      <div style={CARD}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
            Profile Visuals & Avatar
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
            Upload, reposition, crop, and optimize your public high-resolution avatar
          </p>
        </div>

        <ProfileImageManager
          currentPhotoUrl={currentAvatar}
          displayName={mergedData.displayName || auth.displayName || 'Crowdbeats User'}
          onPhotoUpdated={handleAvatarChange}
        />
      </div>

      {/* 2. Loading / Error States for Persona Data */}
      {loading && !profileData && (
        <div
          style={{
            ...CARD,
            padding: 32,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '3px solid rgba(168, 85, 247, 0.2)',
              borderTopColor: '#A855F7',
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Loading your persona settings...
        </div>
      )}

      {error && (
        <div
          style={{
            ...CARD,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
          <button
            type="button"
            onClick={fetchProfile}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Persona Specific Profile Editor */}
      {!loading && (
        <>
          {personaType === 'artist' && (
            <SoloProfileEditor initialData={mergedData} onSaveSuccess={fetchProfile} />
          )}

          {personaType === 'band_member' && (
            <BandProfileEditor initialData={mergedData} onSaveSuccess={fetchProfile} />
          )}

          {(personaType === 'sponsor' || personaType === 'sponsor_rep') && (
            <SponsorProfileEditor initialData={mergedData} onSaveSuccess={fetchProfile} />
          )}

          {(personaType === 'fan' || personaType === 'admin' || personaType === 'staff' || personaType === 'venue' || personaType === 'venue_manager') && (
            <FanProfileEditor initialData={mergedData} onSaveSuccess={fetchProfile} />
          )}
        </>
      )}
    </div>
  );
}
