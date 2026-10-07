'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

export interface InstagramRepostPost {
  id: string;
  originalCreator: string;
  creatorName?: string;
  creatorAvatar?: string;
  postUrl: string;
  imageUrl: string;
  videoUrl?: string;
  caption: string;
  type: 'reel' | 'carousel' | 'image';
  timestamp: string;
  location?: string;
  repostTag: string;
  repostCount?: number;
  isDirectPost?: boolean;
}

export const OFFICIAL_REPOSTS_URL = 'https://www.instagram.com/crowdbeatsllc/reposts/';
export const OFFICIAL_PROFILE_URL = 'https://www.instagram.com/crowdbeatsllc/';

export const INITIAL_INSTAGRAM_REPOSTS: InstagramRepostPost[] = [
  {
    id: 'cb_ig_live_18097250942540526',
    originalCreator: '@thefunctionband',
    creatorName: 'The Function Band',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/reel/DdJ5rtwhG6X/',
    imageUrl: '/instagram/ig_live_18097250942540526.jpg',
    videoUrl: '/instagram/ig_live_video_18097250942540526.mp4',
    caption: 'Live horn section & vocals cover of "As It Was" by @thefunctionband',
    type: 'reel',
    timestamp: 'Sep 11',
    location: 'Live Event Ballroom',
    repostTag: 'Original: @thefunctionband',
    repostCount: 0,
    isDirectPost: false,
  },
  {
    id: 'cb_ig_live_17934341001366168',
    originalCreator: '@brooke_colleen',
    creatorName: 'Brooke Colleen',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/reel/DdJ4tWnh_Jz/',
    imageUrl: '/instagram/ig_live_17934341001366168.jpg',
    videoUrl: '/instagram/ig_live_video_17934341001366168.mp4',
    caption: 'Live house percussion and drums session under the palms by @brooke_colleen',
    type: 'reel',
    timestamp: 'Sep 11',
    location: 'Sunset Tiki Lounge',
    repostTag: 'Original: @brooke_colleen',
    repostCount: 0,
    isDirectPost: false,
  },
  {
    id: 'cb_ig_live_18131518582669005',
    originalCreator: '@hannahgraceuk',
    creatorName: 'Hannah Grace',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/reel/DdJ3W8mhZjb/',
    imageUrl: '/instagram/ig_live_18131518582669005.jpg',
    videoUrl: '/instagram/ig_live_video_18131518582669005.mp4',
    caption: 'Wdym I sold out my first UK tour without a record label or management? Live performance of "All I Ask" by @hannahgraceuk',
    type: 'reel',
    timestamp: 'Sep 11',
    location: 'UK Tour Headline Stage',
    repostTag: 'Original: @hannahgraceuk',
    repostCount: 0,
    isDirectPost: false,
  },
  {
    id: 'cb_ig_live_18239965903315130',
    originalCreator: '@rumpusmachinenz',
    creatorName: 'Rumpus Machine',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/reel/DdJ2mebByRf/',
    imageUrl: '/instagram/ig_live_18239965903315130.jpg',
    videoUrl: '/instagram/ig_live_video_18239965903315130.mp4',
    caption: "Sweet Child O' Mine rock rehearsal session by @rumpusmachinenz",
    type: 'reel',
    timestamp: 'Sep 11',
    location: 'Auckland, New Zealand',
    repostTag: 'Original: @rumpusmachinenz',
    repostCount: 0,
    isDirectPost: false,
  },
  {
    id: 'cb_ig_live_18121341004919785',
    originalCreator: '@demidovru',
    creatorName: 'Alexander Demidov',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/reel/DdJ2BwOB5c-/',
    imageUrl: '/instagram/ig_live_18121341004919785.jpg',
    videoUrl: '/instagram/ig_live_video_18121341004919785.mp4',
    caption: "Can't Help Falling in Love violin performance on the metro escalator by @demidovru",
    type: 'reel',
    timestamp: 'Sep 11',
    location: 'Metro Escalator Performance',
    repostTag: 'Original: @demidovru',
    repostCount: 0,
    isDirectPost: false,
  },
  {
    id: 'cb_ig_live_17891316453418533',
    originalCreator: '@crowdbeatsllc',
    creatorName: 'CrowdBeats',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/p/DcR_7JwHc8I/',
    imageUrl: '/instagram/ig_live_17891316453418533.jpg',
    videoUrl: undefined,
    caption: 'THE STAGE IS SET. Today, we are proud to introduce Crowdbeats. Built for the artists who keep creating, the bands who keep performing, the fans who believe in them.',
    type: 'image',
    timestamp: 'Aug 20',
    location: 'crowdbeats.ai',
    repostTag: 'From @crowdbeatsllc',
    repostCount: 0,
    isDirectPost: true,
  },
  {
    id: 'cb_ig_live_17944641108271242',
    originalCreator: '@crowdbeatsllc',
    creatorName: 'CrowdBeats',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/p/Db-BqH7BBik/',
    imageUrl: '/instagram/ig_live_17944641108271242.jpg',
    videoUrl: undefined,
    caption: 'Crowdbeats is designed to connect fans, solo musicians, bands, and sponsors through live tipping, crowdfunding, artist discovery, and direct support.',
    type: 'image',
    timestamp: 'Aug 12',
    location: 'crowdbeats.ai',
    repostTag: 'From @crowdbeatsllc',
    repostCount: 0,
    isDirectPost: true,
  },
  {
    id: 'cb_ig_slot_8',
    originalCreator: '@crowdbeatsllc',
    creatorName: 'The Origin Story',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/crowdbeatsllc/reposts/',
    imageUrl: '/instagram/repost_10_harbor_cafe.jpg',
    videoUrl: undefined,
    caption: 'The next Taylor Swift is playing a quiet cafe tonight. Every icon started in front of a handful of people who believed before anyone else did. Crowdbeats lets you back them from their very first chord.',
    type: 'image',
    timestamp: 'The Origin',
    location: 'Corner Cafe Stage',
    repostTag: '☕ The Origin',
    repostCount: 0,
    isDirectPost: true,
  },
  {
    id: 'cb_ig_slot_9',
    originalCreator: '@crowdbeatsllc',
    creatorName: 'The Journey',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/crowdbeatsllc/reposts/',
    imageUrl: '/instagram/repost_5_gaslamp_solo.jpg',
    videoUrl: undefined,
    caption: 'The next John Mayer is playing an open mic at a dive bar tonight. From small coffeehouse tip jars to sold-out arenas — Crowdbeats lets you follow and support their journey every step of the way.',
    type: 'image',
    timestamp: 'The Journey',
    location: 'Local Open Mic',
    repostTag: '🎸 The Journey',
    repostCount: 0,
    isDirectPost: true,
  },
  {
    id: 'cb_ig_slot_10',
    originalCreator: '@crowdbeatsllc',
    creatorName: 'The Mission',
    creatorAvatar: '/instagram/crowdbeats_avatar.png',
    postUrl: 'https://www.instagram.com/crowdbeatsllc/reposts/',
    imageUrl: '/instagram/repost_3_acoustic_boardwalk.jpg',
    videoUrl: undefined,
    caption: 'No cash in your pocket? Never walk away from raw talent again. Crowdbeats lets you tip live solo musicians and bands in 3 seconds directly from your phone. 94% straight to the artist instantly via Stripe.',
    type: 'image',
    timestamp: 'The Mission',
    location: 'Street & Live Stages',
    repostTag: '⚡ The Mission',
    repostCount: 0,
    isDirectPost: true,
  },
];

interface InstagramCardMediaProps {
  post: InstagramRepostPost;
  isFailed: boolean;
  onImageError: (id: string) => void;
}

function InstagramCardMedia({ post, isFailed, onImageError }: InstagramCardMediaProps) {
  const cardVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (post.videoUrl && cardVideoRef.current) {
      const p = cardVideoRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleMouseLeave = () => {
    if (post.videoUrl && cardVideoRef.current) {
      cardVideoRef.current.pause();
      cardVideoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (isFailed) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', marginTop: 8 }}>
          {post.originalCreator}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {post.videoUrl ? (
        <>
          <video
            ref={cardVideoRef}
            src={post.videoUrl}
            poster={post.imageUrl}
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="cb-ig-card-img"
          />

          {/* Centered Play Indicator (shown when paused to indicate playable video) */}
          {!isPlaying && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                pointerEvents: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 16px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.25s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none" style={{ marginLeft: 3 }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}

          {/* Reel Indicator Badge on top-right of the card */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 4,
              backgroundColor: isPlaying ? 'rgba(147, 51, 234, 0.95)' : 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '4px 9px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
            }}
          >
            {isPlaying ? (
              <>
                <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <span style={{ width: 2, height: 8, backgroundColor: '#FFFFFF', borderRadius: 1, animation: 'soundWave 0.6s infinite ease-in-out alternate' }} />
                  <span style={{ width: 2, height: 12, backgroundColor: '#FFFFFF', borderRadius: 1, animation: 'soundWave 0.8s infinite ease-in-out alternate 0.2s' }} />
                  <span style={{ width: 2, height: 6, backgroundColor: '#FFFFFF', borderRadius: 1, animation: 'soundWave 0.5s infinite ease-in-out alternate 0.4s' }} />
                </span>
                <span>PLAYING</span>
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>REEL</span>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={`${post.originalCreator} on Instagram`}
            loading="lazy"
            onError={() => onImageError(post.id)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="cb-ig-card-img"
          />
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '4px 8px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
            }}
          >
            <span>📷 Post</span>
          </div>
        </>
      )}
    </div>
  );
}

export function InstagramShowcase() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // ── Theme-aware palette ──────────────────────────────────────────────────
  const ig = {
    sectionBg:       isLight ? '#F1F5F9' : '#0A0A0F',
    heading:         isLight ? '#0F172A' : '#FFFFFF',
    subText:         isLight ? '#475569' : '#94A3B8',
    eyebrow:         isLight ? '#7C3AED' : '#A855F7',
    badgeBg:         isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.05)',
    badgeBorder:     isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)',
    badgeText:       isLight ? '#0F172A' : '#FFFFFF',
    repostBadgeBg:   isLight ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.35)',
    repostBadgeText: isLight ? '#6D28D9' : '#D8B4FE',
    repostBadgeBorder: isLight ? 'rgba(109,40,217,0.35)' : 'rgba(168,85,247,0.5)',
    syncPillBg:      isLight ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)',
    syncPillBorder:  isLight ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)',
    syncPillText:    isLight ? '#059669' : '#34D399',
    syncDotGlow:     isLight ? 'rgba(5,150,105,0.5)' : 'rgba(52,211,153,0.9)',
    syncMeta:        isLight ? '#374151' : '#E2E8F0',
    cardBg:          isLight ? '#FFFFFF' : '#111118',
    cardBorder:      isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.06)',
    cardShadow:      isLight ? '0 2px 12px rgba(15,23,42,0.1)' : '0 4px 24px rgba(0,0,0,0.4)',
    cardHoverShadow: isLight ? '0 8px 32px rgba(15,23,42,0.16)' : '0 8px 40px rgba(0,0,0,0.6)',
    overlayBg:       isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.75)',
    overlayText:     isLight ? '#0F172A' : '#F1F5F9',
    overlaySubText:  isLight ? '#64748B' : '#94A3B8',
    chipBg:          isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
    chipText:        isLight ? '#374151' : '#E2E8F0',
    modalOverlay:    isLight ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.85)',
    modalBg:         isLight ? '#FFFFFF' : '#12121A',
    modalBorder:     isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.08)',
    modalText:       isLight ? '#0F172A' : '#F1F5F9',
    modalSubText:    isLight ? '#475569' : '#94A3B8',
    modalCloseBg:    isLight ? '#F1F5F9' : 'rgba(255,255,255,0.08)',
    modalCloseText:  isLight ? '#374151' : '#E2E8F0',
    modalNavBg:      isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)',
    modalNavText:    isLight ? '#0F172A' : '#FFFFFF',
    modalDivider:    isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.08)',
    igCtaBg:         isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)',
    igCtaBorder:     isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)',
    igCtaText:       isLight ? '#0F172A' : '#FFFFFF',
  };

  const [posts, setPosts] = useState<InstagramRepostPost[]>(INITIAL_INSTAGRAM_REPOSTS);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [lastCheckedAt, setLastCheckedAt] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('Checked just now');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const updateTimeAgo = useCallback((timestampMs: number) => {
    const elapsedMinutes = Math.floor((Date.now() - timestampMs) / 60000);
    if (elapsedMinutes < 1) {
      setSyncStatusText('Checked just now');
    } else if (elapsedMinutes < 60) {
      setSyncStatusText(`Checked ${elapsedMinutes}m ago`);
    } else {
      const hours = Math.floor(elapsedMinutes / 60);
      setSyncStatusText(`Checked ${hours}h ago`);
    }
  }, []);

  const fetchReposts = useCallback(async (force = false) => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/instagram/sync${force ? '?force=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.posts && Array.isArray(json.data.posts) && json.data.posts.length > 0) {
          setPosts(json.data.posts);
        }
        if (json.data?.lastRepostCheckAt || json.data?.lastCheckedAt) {
          const checkTime = json.data?.lastRepostCheckAt || json.data?.lastCheckedAt;
          setLastCheckedAt(checkTime);
          updateTimeAgo(checkTime);
        }
      }
    } catch (e) {
      console.warn('Instagram sync fetch error, using cached posts:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [updateTimeAgo]);

  // Initial fetch and 10-minute interval for reposts
  useEffect(() => {
    fetchReposts(false);

    const TEN_MINS_MS = 10 * 60 * 1000;
    const interval = setInterval(() => {
      fetchReposts(true);
    }, TEN_MINS_MS);

    const timeLabelInterval = setInterval(() => {
      updateTimeAgo(lastCheckedAt);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(timeLabelInterval);
    };
  }, [fetchReposts, lastCheckedAt, updateTimeAgo]);

  // Lock body scroll when inline modal is open
  useEffect(() => {
    if (selectedIndex !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (videoRef.current) videoRef.current.pause();
          setIsVideoPlaying(false);
          setSelectedIndex(null);
        } else if (e.key === 'ArrowRight') {
          if (videoRef.current) videoRef.current.pause();
          setIsVideoPlaying(false);
          setSelectedIndex((prev) => (prev !== null ? (prev + 1) % posts.length : null));
        } else if (e.key === 'ArrowLeft') {
          if (videoRef.current) videoRef.current.pause();
          setIsVideoPlaying(false);
          setSelectedIndex((prev) => (prev !== null ? (prev - 1 + posts.length) % posts.length : null));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedIndex, posts.length]);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleOpenModal = (index: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    setIsVideoLoading(Boolean(posts[index]?.videoUrl));
    setSelectedIndex(index);
  };

  const handleCloseModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    setIsVideoLoading(false);
    setSelectedIndex(null);
  };

  const handleNextPost = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    if (selectedIndex !== null) {
      const nextIdx = (selectedIndex + 1) % posts.length;
      setIsVideoLoading(Boolean(posts[nextIdx]?.videoUrl));
      setSelectedIndex(nextIdx);
    }
  };

  const handlePrevPost = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    if (selectedIndex !== null) {
      const prevIdx = (selectedIndex - 1 + posts.length) % posts.length;
      setIsVideoLoading(Boolean(posts[prevIdx]?.videoUrl));
      setSelectedIndex(prevIdx);
    }
  };

  const handleToggleVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch((err) => {
        console.warn('Video play error:', err);
      });
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const activePost = selectedIndex !== null ? posts[selectedIndex] : null;

  return (
    <section
      id="instagram-showcase"
      aria-labelledby="instagram-heading"
      className="cb-ig-section"
      style={{
        width: '100%',
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(40px, 6vw, 64px) clamp(16px, 4vw, 48px) clamp(32px, 5vw, 48px)',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* ── Section Header (Horizontally Centered) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 36,
          maxWidth: 760,
          margin: '0 auto 36px',
        }}
      >
        {/* Eyebrow with Repost & Daily Sync Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: ig.eyebrow,
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'inline-block',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
              animation: 'pulse 2s infinite',
            }}
          />
          BEFORE THE STADIUMS • WHY WE CREATED CROWDBEATS
        </div>

        {/* Heading */}
        <h2
          id="instagram-heading"
          style={{
            fontSize: 'clamp(28px, 4.2vw, 42px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: ig.heading,
            lineHeight: 1.2,
          }}
        >
          Every Legend Started in a Cafe, Bar, or on the Street.
        </h2>

        {/* Supporting Text */}
        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 17px)',
            color: ig.subText,
            margin: '0 0 12px',
            lineHeight: 1.65,
            maxWidth: 740,
          }}
        >
          Before 70,000-seat stadiums, a 14-year-old Taylor Swift was playing acoustic sets in Nashville cafes like the Bluebird. Before multi-platinum records, John Mayer was passing around an open-mic tip jar in local Atlanta coffeehouses. Neither of them started with record deals—they started with everyday people who stopped, listened, dropped a few dollars in the jar, and believed in their sound.
        </p>
        <p
          style={{
            fontSize: 'clamp(14.5px, 1.8vw, 15.5px)',
            color: ig.subText,
            margin: '0 0 12px',
            lineHeight: 1.6,
            maxWidth: 720,
            opacity: 0.95,
          }}
        >
          Today, we walk past world-class talent on street corners, in subway stations, and at corner bars. But almost nobody carries cash anymore. The moment passes, the connection is lost, and an artist goes home wondering if they can afford to keep playing.
        </p>
        <p
          style={{
            fontSize: 'clamp(14.5px, 1.8vw, 15.5px)',
            color: ig.subText,
            margin: '0 0 24px',
            lineHeight: 1.6,
            maxWidth: 720,
          }}
        >
          <strong style={{ color: ig.heading, fontWeight: 800 }}>That’s why we created Crowdbeats.</strong> Our live web platform and mobile app make it effortless to tip solo musicians and bands in three seconds right from your phone—no app download needed. We repost and spotlight these artists because this is where music is truly born. Back the talent you love today, follow their journey tomorrow, and be the fan who was there from the start.
        </p>

        {/* Sync Controls & Profile Badges Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          {/* @crowdbeatsllc /reposts Identity Row */}
          <a
            href={OFFICIAL_REPOSTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View official reposts at instagram.com/crowdbeatsllc/reposts/ (opens in a new tab)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 18px',
              borderRadius: 9999,
              backgroundColor: ig.badgeBg,
              border: `1px solid ${ig.badgeBorder}`,
              textDecoration: 'none',
              color: ig.badgeText,
              transition: 'all 0.2s ease',
            }}
            className="cb-ig-identity-badge"
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/instagram/crowdbeats_avatar.png"
                alt="@crowdbeatsllc avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>@crowdbeatsllc/reposts</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: ig.repostBadgeBg,
                color: ig.repostBadgeText,
                padding: '2px 8px',
                borderRadius: 9999,
                border: `1px solid ${ig.repostBadgeBorder}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>🔁</span>
              <span>10 Recent Reposts</span>
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ig.subText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          {/* 10-Min Auto-Sync Live Status Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 9999,
              backgroundColor: ig.syncPillBg,
              border: `1px solid ${ig.syncPillBorder}`,
              fontSize: 11,
              fontWeight: 700,
              color: ig.syncPillText,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: ig.syncPillText,
                display: 'inline-block',
                boxShadow: `0 0 6px ${ig.syncDotGlow}`,
              }}
            />
            <span>Live Sync • Reposts every 10m</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span style={{ color: ig.syncMeta }}>{syncStatusText}</span>

            {/* Quick manual sync button for testing */}
            <button
              onClick={() => fetchReposts(true)}
              disabled={isSyncing}
              aria-label="Refresh Instagram reposts now"
              title="Click to check Instagram now"
              style={{
                marginLeft: 4,
                background: 'transparent',
                border: 'none',
                cursor: isSyncing ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                color: ig.syncPillText,
                padding: '2px 4px',
                borderRadius: 4,
                fontSize: 10,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Ten-Post Grid (Clicking Opens Interactive Inline Lightbox on Landing Page) ── */}
      <div className="cb-ig-grid-container">
        <div className="cb-ig-grid" role="list" aria-label="Crowdbeats 10 Recent Reposts from instagram.com/crowdbeatsllc/reposts/">
          {posts.map((post, idx) => {
            const isFailed = failedImages[post.id];
            return (
              <div
                key={post.id || `post_${idx}`}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenModal(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenModal(idx);
                  }
                }}
                aria-label={`View repost from ${post.originalCreator}: ${post.caption} (stays on page)`}
                className="cb-ig-card"
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 5',
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: ig.cardBg,
                  border: post.isDirectPost
                    ? '1.5px solid rgba(168, 85, 247, 0.4)'
                    : `1px solid ${ig.cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: ig.heading,
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: ig.cardShadow,
                }}
              >
                <InstagramCardMedia post={post} isFailed={Boolean(isFailed)} onImageError={handleImageError} />

                {/* Top-Left: Repost Badge */}
                <div
                  className="cb-ig-repost-pill"
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 9999,
                    backgroundColor: post.isDirectPost
                      ? 'rgba(124, 58, 237, 0.85)'
                      : 'rgba(7, 8, 13, 0.75)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: post.isDirectPost
                      ? '1px solid rgba(168, 85, 247, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  <span style={{ color: post.isDirectPost ? '#FDE047' : '#38BDF8', fontSize: 11 }}>
                    {post.isDirectPost ? '⭐' : '🔁'}
                  </span>
                  <span>{post.isDirectPost ? 'Official' : 'Repost'}</span>
                </div>

                {/* Persistent Bottom Creator Attribution Strip */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '24px 10px 8px',
                    background: isLight
                      ? 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.92) 100%)'
                      : 'linear-gradient(180deg, transparent 0%, rgba(7, 8, 13, 0.95) 100%)',
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    className="cb-ig-creator-handle"
                    style={{
                      fontSize: 'clamp(9px, 2.4vw, 11px)',
                      fontWeight: 800,
                      color: ig.overlayText,
                      letterSpacing: '-0.01em',
                      textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '65%',
                    }}
                  >
                    {post.originalCreator}
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(8.5px, 2.2vw, 10px)',
                      color: ig.overlaySubText,
                      fontWeight: 600,
                      textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {post.timestamp}
                  </span>
                </div>

                {/* Hover Details Overlay */}
                <div className="cb-ig-overlay">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#C084FC',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 4,
                    }}
                  >
                    <span>{post.isDirectPost ? '⭐ Official Post' : `🔁 Repost • ${post.originalCreator}`}</span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: ig.overlayText,
                      marginBottom: 2,
                    }}
                  >
                    {post.creatorName ? `${post.creatorName} (${post.originalCreator})` : post.originalCreator}
                  </div>

                  {post.location && (
                    <div
                      style={{
                        fontSize: 10,
                        color: ig.overlaySubText,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>📍</span>
                      <span>{post.location}</span>
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: 11,
                      lineHeight: 1.4,
                      color: ig.overlayText,
                      margin: '0 0 10px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {post.caption}
                  </p>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#38BDF8',
                    }}
                  >
                    <span>⚡ Click to View on Landing Page</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Follow / See Reposts Button (Horizontally Centered) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 36,
        }}
      >
        <a
          href={OFFICIAL_REPOSTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cb-ig-follow-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: 48,
            minWidth: 44,
            padding: '12px 30px',
            borderRadius: 9999,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #38BDF8 100%)',
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            outline: 'none',
          }}
          aria-label="View all reposts on https://www.instagram.com/crowdbeatsllc/reposts/ (opens in a new tab)"
        >
          <span style={{ fontSize: 16 }}>🔁</span>
          <span>See All Reposts @crowdbeatsllc/reposts</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {/* ── Interactive Inline Repost Modal (Keeps Users on Landing Page at crowdbeats.ai) ── */}
      {activePost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cb-repost-modal-title"
          className="cb-ig-modal-backdrop"
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: ig.modalOverlay,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Modal Card */}
          <div
            className="cb-ig-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 880,
              maxHeight: '90vh',
              backgroundColor: ig.modalBg,
              border: `1px solid ${ig.modalBorder}`,
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: isLight
                ? '0 24px 64px rgba(0,0,0,0.18), 0 0 32px rgba(124,58,237,0.12)'
                : '0 24px 64px rgba(0,0,0,0.7), 0 0 32px rgba(124,58,237,0.2)',
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            {/* Left/Top: High-Res Interactive Video / Image Display */}
            <div
              className="cb-ig-modal-media-col"
              style={{
                flex: '1 1 50%',
                position: 'relative',
                backgroundColor: isLight ? '#E2E8F0' : '#07080D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                minHeight: 320,
              }}
            >
              {activePost.videoUrl ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000000',
                    overflow: 'hidden',
                  }}
                >
                  {/* Skeleton loading overlay while video is preparing */}
                  {isVideoLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #0A0A14 0%, #1A0B2E 50%, #0A0A14 100%)',
                      }}
                    >
                      {activePost.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activePost.imageUrl}
                          alt=""
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.18,
                            filter: 'blur(16px)',
                          }}
                        />
                      )}
                      <div style={{ position: 'relative', width: 68, height: 68, zIndex: 2 }}>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            border: '3px solid rgba(168, 85, 247, 0.25)',
                            borderTopColor: '#A855F7',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 8,
                            borderRadius: '50%',
                            border: '2px solid rgba(168, 85, 247, 0.15)',
                            borderTopColor: 'rgba(216, 180, 254, 0.7)',
                            animation: 'spin 1.2s linear infinite reverse',
                          }}
                        />
                        <svg
                          style={{ position: 'absolute', inset: 0, margin: 'auto', display: 'block' }}
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="#A855F7"
                        >
                          <polygon points="7 4 19 12 7 20 7 4" />
                        </svg>
                      </div>
                      <div style={{ marginTop: 16, textAlign: 'center', zIndex: 2 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>
                          Loading video...
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>
                          Auto-playing when ready
                        </p>
                      </div>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    key={activePost.id || activePost.videoUrl}
                    src={activePost.videoUrl}
                    poster={activePost.imageUrl}
                    playsInline
                    controls
                    preload="auto"
                    onCanPlay={() => {
                      setIsVideoLoading(false);
                      if (videoRef.current) {
                        const p = videoRef.current.play();
                        if (p !== undefined) {
                          p.then(() => {
                            setIsVideoPlaying(true);
                          }).catch(() => {
                            if (videoRef.current) {
                              videoRef.current.muted = true;
                              setIsMuted(true);
                              videoRef.current.play().then(() => {
                                setIsVideoPlaying(true);
                              }).catch(() => {});
                            }
                          });
                        }
                      }
                    }}
                    onLoadedData={() => {
                      setIsVideoLoading(false);
                      if (videoRef.current) {
                        const p = videoRef.current.play();
                        if (p !== undefined) {
                          p.then(() => {
                            setIsVideoPlaying(true);
                          }).catch(() => {
                            if (videoRef.current) {
                              videoRef.current.muted = true;
                              setIsMuted(true);
                              videoRef.current.play().then(() => {
                                setIsVideoPlaying(true);
                              }).catch(() => {});
                            }
                          });
                        }
                      }
                    }}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => setIsVideoPlaying(false)}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '80vh',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />

                  {/* Centered Play Button Overlay (shown when paused and ready) */}
                  {!isVideoPlaying && !isVideoLoading && (
                    <button
                      type="button"
                      aria-label="Play video"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVideo();
                      }}
                      className="cb-ig-modal-play-btn"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 76,
                        height: 76,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(124, 58, 237, 0.88)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 32px rgba(124, 58, 237, 0.6), 0 0 24px rgba(168, 85, 247, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        zIndex: 10,
                        outline: 'none',
                        padding: 0,
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="#FFFFFF"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginLeft: 4 }}
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                  )}

                  {/* Muted indicator & unmute button */}
                  {isMuted && !isVideoLoading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                          setIsMuted(false);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        zIndex: 10,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#FFFFFF',
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                      }}
                    >
                      <span>🔇 Click to Unmute</span>
                    </button>
                  )}
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activePost.imageUrl}
                  alt={`${activePost.originalCreator} on Instagram`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxHeight: '80vh',
                    display: 'block',
                  }}
                />
              )}

              {/* Repost Badge Overlay on Image/Video */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(7, 8, 13, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  zIndex: 11,
                  pointerEvents: 'none',
                }}
              >
                <span style={{ color: activePost.isDirectPost ? '#FDE047' : '#38BDF8' }}>
                  {activePost.isDirectPost ? '⭐' : '🔁'}
                </span>
                <span>{activePost.isDirectPost ? 'Official Post' : `Video by ${activePost.originalCreator}`}</span>
              </div>

              {/* Media Type Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  padding: '6px 12px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(7, 8, 13, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  zIndex: 11,
                  pointerEvents: 'none',
                }}
              >
                <span>{activePost.type === 'reel' ? '🎬 Reel' : activePost.type === 'carousel' ? '📑 Carousel' : '📷 Photo'}</span>
              </div>
            </div>

            {/* Right/Bottom: Repost Details & In-App Actions */}
            <div
              className="cb-ig-modal-info-col"
              style={{
                flex: '1 1 50%',
                padding: 'clamp(20px, 3vw, 32px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflowY: 'auto',
                maxHeight: '85vh',
                boxSizing: 'border-box',
              }}
            >
              {/* Header with Creator Identity & Close */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: `1px solid ${ig.modalDivider}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: activePost.isDirectPost ? '2px solid #A855F7' : '2px solid #38BDF8',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: activePost.isDirectPost
                          ? '#7C3AED'
                          : 'linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: 15,
                      }}
                    >
                      {activePost.isDirectPost ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src="/instagram/crowdbeats_avatar.png"
                          alt="@crowdbeatsllc profile"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>
                          {activePost.creatorName
                            ? activePost.creatorName.charAt(0).toUpperCase()
                            : activePost.originalCreator.replace('@', '').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span id="cb-repost-modal-title" style={{ fontSize: 15, fontWeight: 800, color: ig.modalText }}>
                          {activePost.creatorName || activePost.originalCreator}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 7px',
                            borderRadius: 9999,
                            backgroundColor: activePost.isDirectPost ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: activePost.isDirectPost ? '#C084FC' : '#38BDF8',
                            fontWeight: 800,
                          }}
                        >
                          {activePost.isDirectPost ? '⭐ OFFICIAL' : '🔁 REPOST'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: ig.modalSubText, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {!activePost.isDirectPost && (
                          <span style={{ color: '#A855F7', fontWeight: 700 }}>{activePost.originalCreator}</span>
                        )}
                        {!activePost.isDirectPost && <span>•</span>}
                        <span>{activePost.location ? `${activePost.location} • ` : ''}{activePost.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Close Modal Button */}
                  <button
                    onClick={handleCloseModal}
                    aria-label="Close repost details"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: ig.modalCloseBg,
                      border: `1px solid ${ig.modalDivider}`,
                      color: ig.modalCloseText,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 16,
                      transition: 'all 0.2s ease',
                    }}
                    className="cb-ig-modal-close-btn"
                  >
                    ✕
                  </button>
                </div>

                {/* Full Caption */}
                <div style={{ marginBottom: 20 }}>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: ig.modalText,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {activePost.caption}
                  </p>
                </div>

                {/* Crowdbeats In-App Platform Integration Pill */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 14,
                    backgroundColor: isLight ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.12)',
                    border: `1px solid ${ig.repostBadgeBorder}`,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>☕ ➔ 🏟️</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: ig.repostBadgeText }}>
                      From the Corner Cafe to the World Stage
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: ig.modalSubText, margin: 0, lineHeight: 1.5 }}>
                    Every superstar was once playing for tips in a small room. Crowdbeats lets you tip solo musicians and bands in seconds with zero app required. 94% goes directly to the performer instantly via Stripe—so they can keep making music and chasing their dream.
                  </p>
                </div>
              </div>

              {/* In-App Actions & Navigation (Remains on Landing Page) */}
              <div>
                {/* Primary CTA: Jump to Live Radar right on Landing Page */}
                <button
                  onClick={() => {
                    handleCloseModal();
                    const radar = document.getElementById('live-stage-radar') || document.querySelector('.live-stage-radar') || document.querySelector('[aria-label*="radar" i]');
                    if (radar) {
                      radar.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
                    marginBottom: 10,
                    transition: 'all 0.2s ease',
                  }}
                  className="cb-ig-modal-primary-btn"
                >
                  <span>⚡ Tip & Support on Live Stage Radar</span>
                  <span>↓</span>
                </button>

                {/* Secondary: Discreet External Link to Repost on Instagram */}
                <a
                  href={
                    activePost.isDirectPost
                      ? OFFICIAL_PROFILE_URL
                      : (activePost.postUrl || `https://www.instagram.com/${activePost.originalCreator.replace('@', '')}/`)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    color: ig.modalSubText,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    marginBottom: 16,
                    transition: 'color 0.2s ease',
                  }}
                  className="cb-ig-modal-link"
                >
                  <span>
                    {activePost.isDirectPost
                      ? 'View @crowdbeatsllc on Instagram'
                      : `View ${activePost.originalCreator} on Instagram`}
                  </span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>

                {/* Repost Navigator (Next / Prev within the 10 Reposts) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <button
                    onClick={handlePrevPost}
                    aria-label="Previous repost"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>←</span>
                    <span>Previous</span>
                  </button>

                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>
                    {(selectedIndex ?? 0) + 1} of {posts.length}
                  </span>

                  <button
                    onClick={handleNextPost}
                    aria-label="Next repost"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Responsive CSS Grid & Hover States ── */}
      <style>{`
        .cb-ig-grid-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .cb-ig-grid {
          display: grid;
          width: 100%;
          gap: 16px;
          margin: 0 auto;
        }

        /* Large Desktop (>= 1200px): Exactly 5 equal columns, exactly 2 rows of 5 (10 posts) */
        @media (min-width: 1200px) {
          .cb-ig-grid {
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 18px;
          }
        }

        /* Smaller Desktop (900px to 1199px): 4 columns centered */
        @media (min-width: 900px) and (max-width: 1199px) {
          .cb-ig-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
        }

        /* Tablet (640px to 899px): 2 columns centered */
        @media (min-width: 640px) and (max-width: 899px) {
          .cb-ig-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        /* Mobile (< 640px): 2 columns, portrait 4:5, min 16px padding */
        @media (max-width: 639px) {
          .cb-ig-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }

        /* Ultra narrow (< 360px): 1 column */
        @media (max-width: 359px) {
          .cb-ig-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        /* Card overlay default hidden, reveals on hover or focus */
        .cb-ig-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(7, 8, 13, 0.4) 0%, rgba(7, 8, 13, 0.95) 75%);
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.25s ease;
          transform: translateY(6px);
          z-index: 4;
          pointer-events: none;
        }

        .cb-ig-card:hover .cb-ig-overlay,
        .cb-ig-card:focus-visible .cb-ig-overlay {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .cb-ig-card:hover {
          transform: translateY(-4px);
          border-color: rgba(168, 85, 247, 0.6) !important;
          box-shadow: 0 16px 36px rgba(124, 58, 237, 0.35) !important;
        }

        .cb-ig-card:hover .cb-ig-card-img {
          transform: scale(1.06);
        }

        .cb-ig-identity-badge:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(168, 85, 247, 0.5) !important;
          transform: translateY(-2px);
        }

        .cb-ig-follow-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.6) !important;
        }

        .cb-ig-follow-btn:focus-visible {
          box-shadow: 0 0 0 3px #FFFFFF, 0 0 0 6px rgba(168, 85, 247, 0.8) !important;
        }

        .cb-ig-modal-close-btn:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
          transform: rotate(90deg);
        }

        .cb-ig-modal-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.5) !important;
        }

        .cb-ig-modal-link:hover {
          color: #38BDF8 !important;
        }

        .cb-ig-modal-play-btn:hover {
          transform: translate(-50%, -50%) scale(1.08) !important;
          background-color: rgba(147, 51, 234, 0.96) !important;
          box-shadow: 0 12px 40px rgba(124, 58, 237, 0.8), 0 0 32px rgba(168, 85, 247, 0.6) !important;
        }

        .cb-ig-modal-play-btn:active {
          transform: translate(-50%, -50%) scale(0.95) !important;
        }

        /* Modal Mobile Responsiveness: Stack vertically on screens < 768px */
        @media (max-width: 767px) {
          .cb-ig-modal-content {
            flex-direction: column !important;
            max-height: 92vh !important;
          }
          .cb-ig-modal-media-col {
            min-height: 220px !important;
            max-height: 280px !important;
          }
        }

        @keyframes soundWave {
          0% {
            height: 4px;
          }
          100% {
            height: 14px;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.9);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* WCAG 2.2 AA Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .cb-ig-card,
          .cb-ig-card-img,
          .cb-ig-overlay,
          .cb-ig-identity-badge,
          .cb-ig-follow-btn,
          .cb-ig-modal-backdrop,
          .cb-ig-modal-content {
            transition: none !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
