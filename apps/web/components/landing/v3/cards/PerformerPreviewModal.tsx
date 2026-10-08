'use client';

/**
 * Crowdbeats Landing V3 — PerformerPreviewModal
 *
 * Compact modal dialog preview when a performer card or map pin is tapped.
 * Displays photo, name, solo/band badge, live status, distance, venue,
 * "View profile" action, and optional quick tip button.
 * Accessible with Escape dismiss, Tab trapping, backdrop dismiss, and focus restore.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import type { PerformerPreviewModalProps } from './types';
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

export function PerformerPreviewModal({
  isOpen,
  performer,
  onClose,
}: PerformerPreviewModalProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Lock body scroll and capture previous focus
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on mount
    const frame = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !performer) return null;

  const displayName = performer.performerName || performer.name || 'Performer';
  const isBand = performer.type === 'band';
  const typeLabel = isBand ? 'Band' : 'Solo Musician';
  const profileHref = getProfileHref(performer.type, performer.slug, performer.id);
  const distanceStr = formatDistance(performer.distanceMiles);
  const tipIdentifier = performer.tipId || performer.id;
  const tipHref = performer.tipLink || (tipIdentifier ? `/tip/${encodeURIComponent(tipIdentifier)}` : null);
  const locationText = performer.venueName || ('stageName' in performer ? performer.stageName : undefined) || ('originCity' in performer ? performer.originCity : undefined) || null;
  const hasValidPhoto = Boolean(performer.photoUrl && failedPhotoUrl !== performer.photoUrl);

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close performer preview"
        >
          ✕
        </button>

        <div className={styles.previewHeader}>
          {hasValidPhoto && performer.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={performer.photoUrl}
              alt=""
              width={72}
              height={72}
              className={styles.previewAvatar}
              onError={() => setFailedPhotoUrl(performer.photoUrl || '')}
            />
          ) : (
            <div className={styles.previewAvatarFallback} aria-hidden="true">
              {getInitials(displayName)}
            </div>
          )}

          <div className={styles.previewInfo}>
            <h2 id={titleId} className={styles.previewName}>
              {displayName}
            </h2>

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

              {performer.isLive === true && (
                <span className={styles.liveBadge} aria-label="Currently live now">
                  <span className={styles.liveDot} aria-hidden="true" />
                  Live Now
                </span>
              )}
            </div>

            {(locationText || distanceStr) && (
              <div className={styles.previewLocation}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {locationText && <span>{locationText}</span>}
                {locationText && distanceStr && <span aria-hidden="true">•</span>}
                {distanceStr && <span className={styles.distanceText}>{distanceStr}</span>}
              </div>
            )}
          </div>
        </div>

        {performer.genres && performer.genres.length > 0 && (
          <ul className={styles.genreChipsList} aria-label="Genres">
            {performer.genres.map((genre, idx) => (
              <li key={`${genre}-${idx}`} className={styles.genreChip}>
                {genre}
              </li>
            ))}
          </ul>
        )}

        <div className={styles.previewActions}>
          <Link
            href={profileHref}
            className={styles.previewProfileBtn}
            onClick={onClose}
          >
            View profile
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {tipHref && (
            <Link
              href={tipHref}
              className={styles.previewTipBtn}
              onClick={onClose}
              aria-label={`Tip ${performer.performerName}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Tip
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerformerPreviewModal;
