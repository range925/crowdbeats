'use client';

/**
 * Crowdbeats Landing V3 — PopularPerformerCard
 *
 * Card component for top popular / trending performers.
 * Highlights high-resolution visual, verified badge, follower count,
 * origin city / stage, and primary profile action.
 */
import React, { useState } from 'react';
import Link from 'next/link';
import type { PopularPerformerCardProps } from './types';
import styles from './cards.module.css';

function formatFollowers(count?: number): string {
  if (typeof count !== 'number' || count <= 0) return '0 followers';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M followers`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k followers`;
  return `${count} followers`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '♪';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getProfileHref(type: string, slug?: string, id?: string): string {
  const identifier = slug || id || '';
  if (!identifier) return '/discover';
  return type === 'band' ? `/band/${encodeURIComponent(identifier)}` : `/artist/${encodeURIComponent(identifier)}`;
}

export function PopularPerformerCard({
  performer,
  onSelect,
  className = '',
  compact = false,
}: PopularPerformerCardProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  const isBand = performer.type === 'band';
  const typeLabel = isBand ? 'Band' : 'Solo Musician';
  const profileHref = getProfileHref(performer.type, performer.slug, performer.id);
  const locationText = performer.originCity || performer.stageName || null;
  const followersStr = formatFollowers(performer.followersCount);
  const displayName = performer.performerName || performer.name || 'Musician';
  const hasValidPhoto = Boolean(performer.photoUrl && failedPhotoUrl !== performer.photoUrl);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(performer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  if (compact) {
    return (
      <article
        tabIndex={0}
        role="button"
        aria-label={`${displayName}, ${typeLabel}${performer.isVerified ? ', verified artist' : ''}${locationText ? ` from ${locationText}` : ''}, ${followersStr}`}
        className={`${styles.popularCardCompact} ${className}`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.popularCompactAvatarWrapper}>
          {hasValidPhoto && performer.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={performer.photoUrl}
              alt=""
              width={48}
              height={48}
              className={styles.popularCompactAvatar}
              loading="lazy"
              decoding="async"
              onError={() => setFailedPhotoUrl(performer.photoUrl || '')}
            />
          ) : (
            <div className={styles.popularCompactAvatarFallback} aria-hidden="true">
              {getInitials(displayName)}
            </div>
          )}
          {performer.rank !== undefined && performer.rank > 0 && (
            <span className={styles.popularCompactRank}>#{performer.rank}</span>
          )}
        </div>

        <div className={styles.popularCompactInfo}>
          <div className={styles.popularNameRow}>
            <span className={styles.popularCompactName}>{displayName}</span>
            {performer.isVerified && (
              <span className={styles.verifiedBadge} title="Verified Performer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </span>
            )}
            <span className={styles.compactTypeBadge}>{typeLabel}</span>
          </div>

          <div className={styles.popularCompactMeta}>
            {locationText && <span className={styles.popularCompactCity}>{locationText}</span>}
            {locationText && followersStr && <span className={styles.distanceBullet}>•</span>}
            <span className={styles.popularCompactFollowers}>{followersStr}</span>
          </div>

          {performer.genres && performer.genres.length > 0 && (
            <div className={styles.popularCompactGenres}>
              {performer.genres.slice(0, 2).map((g, idx) => (
                <span key={`${g}-${idx}`} className={styles.genreChip}>
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.popularCompactAction}>
          <Link
            href={profileHref}
            className={styles.viewProfileBtn}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View profile for ${displayName}`}
          >
            <span>View</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`${displayName}, ${typeLabel}${performer.isVerified ? ', verified artist' : ''}${locationText ? ` from ${locationText}` : ''}, ${followersStr}`}
      className={`${styles.popularCard} ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.popularMediaContainer}>
        {hasValidPhoto && performer.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={performer.photoUrl}
            alt=""
            width={400}
            height={250}
            className={styles.popularImage}
            loading="lazy"
            decoding="async"
            onError={() => setFailedPhotoUrl(performer.photoUrl || '')}
          />
        ) : (
          <div className={styles.popularMediaFallback} aria-hidden="true">
            {getInitials(displayName)}
          </div>
        )}

        {performer.rank !== undefined && performer.rank > 0 && (
          <div className={styles.popularRankBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            #{performer.rank} Popular
          </div>
        )}

        {performer.followersCount !== undefined && (
          <div className={styles.popularFollowerPill}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {followersStr}
          </div>
        )}
      </div>

      <div className={styles.popularBody}>
        <div className={styles.popularNameRow}>
          <h3 className={styles.performerName} title={displayName}>
            {displayName}
          </h3>
          {performer.isVerified && (
            <span className={styles.verifiedBadge} title="Verified Performer" aria-label="Verified performer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.6l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
              </svg>
            </span>
          )}
        </div>

        <div className={styles.popularMetaRow}>
          <span className={styles.typeBadge}>{typeLabel}</span>
          {locationText && (
            <span className={styles.popularCityRow}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {locationText}
            </span>
          )}
        </div>

        {performer.genres && performer.genres.length > 0 && (
          <ul className={styles.genreChipsList} aria-label="Genres">
            {performer.genres.slice(0, 3).map((genre, idx) => (
              <li key={`${genre}-${idx}`} className={styles.genreChip}>
                {genre}
              </li>
            ))}
          </ul>
        )}

        <div className={styles.cardFooter}>
          <Link
            href={profileHref}
            className={styles.viewProfileLink}
            onClick={(e) => e.stopPropagation()}
          >
            View profile
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PopularPerformerCard;
