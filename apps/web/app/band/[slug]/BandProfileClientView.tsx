'use client';

/**
 * Crowdbeats V2 — Band Profile Interactive View (Client)
 *
 * Rich viewer experience featuring:
 *   - Interactive Audio Demo Preview Player
 *   - Tagline, origin city, verified band credentials
 *   - Interactive Band Member Roster with roles and instruments
 *   - Multi-section bio: Story, Musical DNA, Instruments, Accolades
 *   - Live stage status with map directions integration
 *   - Recent Fan Love / Tippers wall with automated split transparency
 *   - Branded streaming & social dock
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DiscoveryClient, type PublicPerformerItem } from '@/lib/discovery/discoveryClient';
import { TipAuthGateModal } from '@/components/discovery/TipAuthGateModal';
import { AudioPreviewPlayer } from '@/components/discovery/AudioPreviewPlayer';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProfileSocialHeaderActions } from '@/components/social/ProfileSocialHeaderActions';

interface BandProfileClientViewProps {
  performer: PublicPerformerItem;
}

export const BandProfileClientView: React.FC<BandProfileClientViewProps> = ({
  performer,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [selectedTipCents, setSelectedTipCents] = useState(2000);
  const [followersCount, setFollowersCount] = useState(performer.followersCount);

  // Auto-continuation: if returning from auth with pending tip intent, continue directly to /fan/tip
  useEffect(() => {
    if (!isAuthenticated) return;
    const action = searchParams.get('action');
    const tipCentsParam = searchParams.get('tipCents');
    const pendingTip = DiscoveryClient.getPendingTip();

    if (
      action === 'tip' ||
      (pendingTip && (pendingTip.creatorSlug === performer.slug || pendingTip.creatorId === performer.id))
    ) {
      const amount = tipCentsParam
        ? parseInt(tipCentsParam, 10)
        : (pendingTip?.selectedTipAmountCents ?? 2000);
      DiscoveryClient.clearPendingTip();
      router.push(`/fan/tip?artist=${performer.slug}&amount=${amount}`);
    }
  }, [isAuthenticated, searchParams, performer.slug, performer.id, router]);

  const handleTipClick = (amountCents: number) => {
    if (isAuthenticated) {
      router.push(`/fan/tip?artist=${performer.slug}&amount=${amountCents}`);
    } else {
      setSelectedTipCents(amountCents);
      setIsTipModalOpen(true);
    }
  };

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Banner / Cover Header */}
      <div
        style={{
          minHeight: 240,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.45) 0%, rgba(15, 17, 26, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 28,
          position: 'relative',
          marginBottom: 32,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: '#1E2032',
              border: '3px solid #A855F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {performer.photoUrl ? (
              <img src={performer.photoUrl} alt={performer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '🎸'
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {performer.name}
              </h1>
              {performer.isVerified && (
                <span
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid #A855F7',
                    color: '#A855F7',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  title="Verified Band"
                >
                  ✓ VERIFIED BAND
                </span>
              )}
            </div>

            {/* Tagline */}
            {performer.tagline && (
              <div style={{ color: '#E879F9', fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                {performer.tagline}
              </div>
            )}

            {/* Location & Status Line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              {performer.isLive && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(0, 240, 118, 0.2)',
                    border: '1px solid rgba(0, 240, 118, 0.5)',
                    color: '#00F076',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00F076', animation: 'pulse 1.5s infinite' }} />
                  LIVE NOW
                </span>
              )}
              {performer.currentVenueName && (
                <span style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 14 }}>
                  📍 @ {performer.currentVenueName} · {performer.distanceMiles ?? 0.3} mi away
                </span>
              )}
              {performer.originCity && (
                <span style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 14 }}>
                  🏡 {performer.originCity}
                </span>
              )}
              <span style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 14 }}>
                👥 {followersCount.toLocaleString()} followers
              </span>
            </div>
          </div>
        </div>

        {/* Social Actions (Follow / Message / Block / Restrict / Report) */}
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <ProfileSocialHeaderActions
            targetId={performer.id}
            targetType="band"
            targetName={performer.name}
            currentFollowersCount={followersCount}
            onFollowersCountChange={setFollowersCount}
            accentColor="#A855F7"
          />
        </div>
      </div>

      {/* Grid: Details & Tipping */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32 }}>
        {/* Left Column: Bio, Audio Player, Roster, DNA, Sets, Fan Love */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Audio Demo Preview Player */}
          <AudioPreviewPlayer
            title={performer.featuredTrackTitle ?? 'Featured Live Cut'}
            artistName={performer.name}
            audioUrl={performer.audioPreviewUrl}
            durationText="0:45 Demo"
          />

          {/* Genre Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {performer.genres.map((g) => (
              <span
                key={g}
                style={{
                  padding: '6px 14px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#E879F9',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {g}
              </span>
            ))}
          </div>

          {/* Story & Biography */}
          <section
            style={{
              backgroundColor: 'var(--cb-surface-1, #151722)',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--cb-border-subtle, #2B2D44)',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 14px', color: '#FFFFFF' }}>
              About the Band
            </h2>
            <p style={{ color: 'var(--cb-text-secondary, #94A3B8)', lineHeight: 1.7, fontSize: 15, margin: '0 0 20px' }}>
              {performer.bio}
            </p>

            {/* Accolades & Badges */}
            {performer.accolades && performer.accolades.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#00F076', marginBottom: 10 }}>
                  ★ Band Honors &amp; Milestones
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {performer.accolades.map((acc) => (
                    <span
                      key={acc}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        backgroundColor: 'rgba(0, 240, 118, 0.1)',
                        border: '1px solid rgba(0, 240, 118, 0.25)',
                        color: '#00F076',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      ✓ {acc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Band Member Roster Showcase */}
          {performer.rosterPreview && performer.rosterPreview.length > 0 && (
            <section
              style={{
                backgroundColor: 'var(--cb-surface-1, #151722)',
                borderRadius: 20,
                padding: 24,
                border: '1px solid var(--cb-border-subtle, #2B2D44)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🤝</span> Band Lineup &amp; Musicians
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {performer.rosterPreview.map((member) => (
                  <div
                    key={member.name}
                    style={{
                      backgroundColor: '#1E2032',
                      padding: '16px',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: '#2B2D44',
                        border: '2px solid #A855F7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      🎵
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#A855F7', fontWeight: 600 }}>
                        {member.role}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        {member.instrument}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Musical DNA: Instruments & Influences */}
          {((performer.instruments && performer.instruments.length > 0) || (performer.influences && performer.influences.length > 0)) && (
            <section
              style={{
                backgroundColor: 'var(--cb-surface-1, #151722)',
                borderRadius: 20,
                padding: 24,
                border: '1px solid var(--cb-border-subtle, #2B2D44)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
              }}
            >
              {performer.instruments && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', margin: '0 0 10px', letterSpacing: '0.05em' }}>
                    🥁 Instruments &amp; Gear
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {performer.instruments.map((inst) => (
                      <div key={inst} style={{ fontSize: 13, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#A855F7' }}>•</span> {inst}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performer.influences && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', margin: '0 0 10px', letterSpacing: '0.05em' }}>
                    🎧 Sonic Influences
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {performer.influences.map((inf) => (
                      <span
                        key={inf}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: 12,
                          color: '#CBD5E1',
                        }}
                      >
                        {inf}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Upcoming Live Sets */}
          <section
            style={{
              backgroundColor: 'var(--cb-surface-1, #151722)',
              borderRadius: 20,
              padding: 22,
              border: '1px solid var(--cb-border-subtle, #2B2D44)',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 14px', color: '#FFFFFF' }}>
              Upcoming Live Gig
            </h2>
            <div
              style={{
                backgroundColor: '#1E2032',
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(0, 240, 118, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 32 }}>🏟️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>
                    {performer.currentVenueName ?? 'Main Stage'}
                  </div>
                  <div style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, marginTop: 2 }}>
                    Saturday · 9:00 PM - 11:30 PM PST
                  </div>
                </div>
              </div>
              <Link
                href="/fan/nearby"
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(0, 240, 118, 0.15)',
                  border: '1px solid rgba(0, 240, 118, 0.4)',
                  color: '#00F076',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🗺️</span> View on Live Map
              </Link>
            </div>
          </section>

          {/* Recent Fan Love / Tippers Wall */}
          {performer.recentTippers && performer.recentTippers.length > 0 && (
            <section
              style={{
                backgroundColor: 'var(--cb-surface-1, #151722)',
                borderRadius: 20,
                padding: 24,
                border: '1px solid var(--cb-border-subtle, #2B2D44)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>💜</span> Recent Band Support
                </h2>
                <span style={{ fontSize: 12, color: '#00F076', fontWeight: 600 }}>
                  ⚖️ Split automatically across all 4 members
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {performer.recentTippers.map((tip) => (
                  <div
                    key={tip.id}
                    style={{
                      backgroundColor: '#1E2032',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>{tip.fanName}</span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>• {tip.timeAgo}</span>
                      </div>
                      {tip.message && (
                        <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 4, fontStyle: 'italic' }}>
                          "{tip.message}"
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#00F076', flexShrink: 0 }}>
                      +{tip.amountFormatted}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Real-Time Tip Box */}
        <div>
          <div
            style={{
              backgroundColor: 'var(--cb-surface-1, #151722)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: 24,
              padding: 26,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              position: 'sticky',
              top: 24,
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Tip {performer.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', margin: 0, lineHeight: 1.5 }}>
              100% goes directly to the band and is automatically distributed to each member according to verified splits.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: '$10', cents: 1000 },
                { label: '$20', cents: 2000 },
                { label: '$50', cents: 5000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleTipClick(preset.cents)}
                  style={{
                    padding: '14px 0',
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
                    e.currentTarget.style.borderColor = '#A855F7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleTipClick(2000)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(168, 85, 247, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(168, 85, 247, 0.4)';
              }}
            >
              Tip the Band Now
            </button>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>⚖️</span> Verified Largest-Remainder Split Engine
            </div>
          </div>
        </div>
      </div>

      {/* Tip Auth Gate Modal */}
      {isTipModalOpen && (
        <TipAuthGateModal
          isOpen={isTipModalOpen}
          performerId={performer.id}
          performerSlug={performer.slug}
          performerName={performer.name}
          performerType={performer.type}
          initialAmountCents={selectedTipCents}
          onClose={() => setIsTipModalOpen(false)}
        />
      )}
    </main>
  );
};
