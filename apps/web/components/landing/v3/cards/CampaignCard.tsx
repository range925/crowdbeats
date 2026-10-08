'use client';

/**
 * Crowdbeats Landing V3 — CampaignCard
 *
 * Card component for artist and band crowdfunding campaigns.
 * Displays title, creator info, progress bar (% funded with violet gradient),
 * pledged/goal/backers metrics, active/days remaining status chip,
 * and "Back campaign" action.
 */
import React, { useState } from 'react';
import Link from 'next/link';
import type { CampaignCardProps } from './types';
import styles from './cards.module.css';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '♪';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CampaignCard({
  campaign,
  onBack,
  className = '',
  compact = false,
}: CampaignCardProps) {
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const isBand = campaign.creatorType === 'band';
  const typeLabel = isBand ? 'Band' : 'Solo';

  const pledged = campaign.pledgedDollars ?? (campaign.pledgedCents ? Math.round(campaign.pledgedCents / 100) : 0);
  const goal = campaign.goalDollars ?? (campaign.goalCents ? Math.round(campaign.goalCents / 100) : 0);
  const percent =
    typeof campaign.percentFunded === 'number'
      ? campaign.percentFunded
      : goal > 0
        ? Math.round((pledged / goal) * 100)
        : 0;
  const clampedWidth = Math.min(Math.max(percent, 0), 100);
  const backers = campaign.backersCount ?? campaign.backerCount ?? 0;

  const backUrl = campaign.campaignUrl || '/creator/campaigns';

  // Status chip label
  let statusText = 'Active';
  let isPositiveStatus = true;
  if (typeof campaign.daysRemaining === 'number') {
    if (campaign.daysRemaining > 1) {
      statusText = `${campaign.daysRemaining} days left`;
    } else if (campaign.daysRemaining === 1) {
      statusText = '1 day left';
    } else if (campaign.daysRemaining === 0) {
      statusText = 'Last day';
    } else {
      statusText = 'Ended';
      isPositiveStatus = false;
    }
  } else if (campaign.isActive === false) {
    statusText = 'Completed';
    isPositiveStatus = false;
  }

  const handleBackClick = () => {
    if (onBack) {
      onBack(campaign);
    }
  };

  if (compact) {
    return (
      <article
        tabIndex={0}
        role="article"
        aria-label={`Campaign: ${campaign.title} by ${campaign.creatorName}. ${percent}% funded, ${formatCurrency(pledged)} pledged of ${formatCurrency(goal)} goal.`}
        className={`${styles.campaignCardCompact} ${className}`}
      >
        <div className={styles.campaignCompactHeader}>
          {campaign.imageUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.imageUrl}
              alt=""
              width={56}
              height={56}
              className={styles.campaignCompactThumb}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.campaignCompactThumbFallback} aria-hidden="true">
              {getInitials(campaign.title)}
            </div>
          )}

          <div className={styles.campaignCompactTitleCol}>
            <div className={styles.campaignCompactTopRow}>
              <h4 className={styles.campaignCompactTitle} title={campaign.title}>
                {campaign.title}
              </h4>
              <span className={`${styles.statusChip} ${isPositiveStatus ? styles.activeChip : ''}`}>
                {statusText}
              </span>
            </div>
            <div className={styles.creatorRowCompact}>
              <span className={styles.creatorName}>{campaign.creatorName}</span>
              <span className={styles.compactTypeBadge}>{typeLabel}</span>
              {campaign.category && (
                <>
                  <span className={styles.distanceBullet} aria-hidden="true">•</span>
                  <span className={styles.compactCategory}>{campaign.category}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className={styles.progressSectionCompact}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percent}% of funding goal reached`}
          >
            <div className={styles.progressBar} style={{ width: `${clampedWidth}%` }} />
          </div>
          <div className={styles.campaignCompactMetrics}>
            <span className={styles.campaignPercentBold}>{percent}% funded</span>
            <span className={styles.campaignStats}>
              {formatCurrency(pledged)} of {formatCurrency(goal)} · {formatNumber(backers)} backers
            </span>
          </div>
        </div>

        <div className={styles.campaignCompactFooter}>
          <Link
            href={backUrl}
            className={styles.backCampaignBtnCompact}
            onClick={handleBackClick}
          >
            Back campaign
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      tabIndex={0}
      role="article"
      aria-label={`Campaign: ${campaign.title} by ${campaign.creatorName}. ${percent}% funded, ${formatCurrency(pledged)} pledged of ${formatCurrency(goal)} goal.`}
      className={`${styles.campaignCard} ${className}`}
    >
      {campaign.imageUrl && !imageError && (
        <div className={styles.campaignMediaContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={campaign.imageUrl}
            alt=""
            width={480}
            height={270}
            className={styles.campaignImage}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className={styles.campaignBody}>
        <div className={styles.campaignHeader}>
          <h3 className={styles.campaignTitle} title={campaign.title}>
            {campaign.title}
          </h3>
          <span
            className={`${styles.statusChip} ${isPositiveStatus ? styles.activeChip : ''}`}
            aria-label={`Campaign status: ${statusText}`}
          >
            {statusText}
          </span>
        </div>

        <div className={styles.creatorRow}>
          {campaign.creatorAvatarUrl && !avatarError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.creatorAvatarUrl}
              alt=""
              width={28}
              height={28}
              className={styles.creatorAvatar}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span className={styles.creatorAvatarFallback} aria-hidden="true">
              {getInitials(campaign.creatorName)}
            </span>
          )}
          <span className={styles.creatorName}>{campaign.creatorName}</span>
          <span className={styles.typeBadge}>{typeLabel}</span>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.percentRow}>
            <span className={styles.percentText}>{percent}% funded</span>
            {campaign.category && (
              <span className={styles.genreChip}>{campaign.category}</span>
            )}
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percent}% of funding goal reached`}
          >
            <div
              className={styles.progressBar}
              style={{ width: `${clampedWidth}%` }}
            />
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCol}>
            <span className={styles.metricValue}>
              {formatCurrency(pledged)}
            </span>
            <span className={styles.metricLabel}>pledged</span>
          </div>
          <div className={styles.metricCol}>
            <span className={styles.metricValue}>
              {formatCurrency(goal)}
            </span>
            <span className={styles.metricLabel}>goal</span>
          </div>
          <div className={styles.metricCol}>
            <span className={styles.metricValue}>
              {formatNumber(backers)}
            </span>
            <span className={styles.metricLabel}>backers</span>
          </div>
        </div>

        <div className={styles.campaignFooter}>
          <span className={styles.distanceText}>Zero monthly subscription</span>
          <Link
            href={backUrl}
            className={styles.backCampaignButton}
            onClick={handleBackClick}
          >
            Back campaign
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default CampaignCard;
