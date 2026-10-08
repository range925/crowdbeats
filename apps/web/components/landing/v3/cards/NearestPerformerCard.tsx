'use client';

/**
 * Crowdbeats Landing V3 — NearestPerformerCard
 *
 * Card component for top nearby performers matching map pin order.
 * Accessible with keyboard navigation, live status pulsing indicator,
 * and responsive tokens.
 */
import React, { useState } from 'react';
import Link from 'next/link';
import type { NearestPerformerCardProps } from './types';
import styles from './cards.module.css';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '♪';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDistance(mi?: number): string | null {
  if (typeof mi !== 'number' || isNaN(mi)) return null;
  if (mi < 0.1) return 'Under 0.1 mi away';
  return `${mi.toFixed(1)} mi away`;
}

function getProfileHref(type: string, slug?: string, id?: string): string {
  const identifier = slug || id || '';
  if (!identifier) return '/discover';
  return type === 'band' ? `/band/${encodeURIComponent(identifier)}` : `/artist/${encodeURIComponent(identifier)}`;
}

export function NearestPerformerCard({
  performer,
  rank,
  isSelected = false,
  onSelect,
  onPreview,
  className = '',
}: NearestPerformerCardProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  const isBand = performer.type === 'band';
  const typeLabel = isBand ? 'Band' : 'Solo Musician';
  const profileHref = getProfileHref(performer.type, performer.slug, performer.id);
  const distanceStr = formatDistance(performer.distanceMiles);
  const tipIdentifier = performer.tipId || performer.id;
  const tipHref = performer.tipLink || (tipIdentifier ? `/tip/${encodeURIComponent(tipIdentifier)}` : null);

  const displayName = performer.performerName || performer.name || 'Performer';
  const hasValidPhoto = Boolean(performer.photoUrl && failedPhotoUrl !== performer.photoUrl);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(performer);
    }
    if (onPreview) {
      onPreview(performer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${displayName}, ${typeLabel}${performer.isLive ? ', currently live' : ''}${performer.venueName ? ` at ${performer.venueName}` : ''}${distanceStr ? `, ${distanceStr}` : ''}`}
      className={`${styles.nearestCard} ${isSelected ? styles.nearestCardSelected : ''} ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.cardTopBar}>
        <div className={styles.avatarWrapper}>
          {rank !== undefined && rank > 0 && (
            <span
              className={`${styles.rankBadge} ${isSelected ? styles.rankBadgeSelected : ''}`}
              aria-label={`Rank ${rank} on map`}
            >
              {rank}
            </span>
          )}

          {hasValidPhoto && performer.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={performer.photoUrl}
              alt=""
              width={52}
              height={52}
              className={styles.avatar}
              loading="lazy"
              decoding="async"
              onError={() => setFailedPhotoUrl(performer.photoUrl || '')}
            />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {getInitials(displayName)}
            </span>
          )}
        </div>

        <div className={styles.cardHeadInfo}>
          <div className={styles.nameRow}>
            <h3 className={styles.performerName} title={displayName}>
              {displayName}
            </h3>
            {performer.isLive === true && (
              <span className={styles.liveBadge} aria-label="Currently live now">
                <span className={styles.liveDot} aria-hidden="true" />
                Live Now
              </span>
            )}
          </div>

          <div className={styles.badgeRow}>
            <span className={styles.typeBadge}>
              {isBand ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
              {typeLabel}
            </span>
          </div>

          {(performer.venueName || distanceStr) && (
            <div className={styles.locationVenueRow}>
              <svg className={styles.locationIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {performer.venueName && (
                <span className={styles.venueText} title={performer.venueName}>
                  {performer.venueName}
                </span>
              )}
              {performer.venueName && distanceStr && (
                <span className={styles.distanceBullet} aria-hidden="true">•</span>
              )}
              {distanceStr && (
                <span className={styles.distanceText}>{distanceStr}</span>
              )}
            </div>
          )}
        </div>
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

        {tipHref && (
          <Link
            href={tipHref}
            className={styles.tipButton}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Tip ${performer.performerName}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Tip
          </Link>
        )}
      </div>
    </article>
  );
}

export default NearestPerformerCard;
