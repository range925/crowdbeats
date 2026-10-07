'use client';

import React, { useState } from 'react';

type ActivityType =
  | 'tip' | 'live' | 'follow' | 'campaign' | 'system' | 'split' | 'escrow'
  | 'milestone' | 'payout' | 'set' | 'sponsor' | 'member' | 'checkin'
  | 'stage' | 'match' | 'pitch';

interface ActivityCardProps {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timeAgo: string;
  amount?: string;
  avatarUrl?: string;
  progress?: number;
  isRead?: boolean;
  isSilenced?: boolean;
  onMarkRead?: () => void;
  onDelete?: () => void;
  onMute?: () => void;
}

const TYPE_COLORS: Record<ActivityType, string> = {
  tip:       '#10B981',
  live:      '#EF4444',
  follow:    '#38BDF8',
  campaign:  '#F59E0B',
  milestone: '#F59E0B',
  system:    '#94A3B8',
  split:     '#A855F7',
  payout:    '#A855F7',
  escrow:    '#7C3AED',
  match:     '#7C3AED',
  set:       '#06B6D4',
  checkin:   '#06B6D4',
  stage:     '#06B6D4',
  sponsor:   '#F97316',
  pitch:     '#F97316',
  member:    '#EC4899',
};

const TYPE_ICONS: Record<ActivityType, string> = {
  tip:       '💸',
  live:      '🔴',
  follow:    '👤',
  campaign:  '🎯',
  milestone: '🏆',
  system:    '⚙️',
  split:     '✂️',
  payout:    '💰',
  escrow:    '🔐',
  match:     '🎵',
  set:       '🎶',
  checkin:   '📍',
  stage:     '🎤',
  sponsor:   '🤝',
  pitch:     '📣',
  member:    '👥',
};

export function ActivityCard({
  type,
  title,
  subtitle,
  timeAgo,
  amount,
  avatarUrl,
  progress,
  isRead = false,
  isSilenced = false,
  onMarkRead,
  onDelete,
  onMute,
}: ActivityCardProps) {
  const [hovered, setHovered] = useState(false);
  const color = TYPE_COLORS[type];
  const isPositiveAmount = amount?.startsWith('+');
  const isNegativeAmount = amount?.startsWith('-');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: '12px 14px',
        backgroundColor: isRead
          ? 'var(--cb-surface-1, #0F1017)'
          : 'var(--cb-surface-2, #161822)',
        border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
        borderLeft: isRead
          ? '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))'
          : `3px solid ${color}`,
        borderRadius: 12,
        transition: 'background-color 0.15s ease',
        opacity: isSilenced ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar or icon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: `${color}22`,
              border: `1px solid ${color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span role="img" aria-label={type}>{TYPE_ICONS[type]}</span>
            )}
          </div>
          {/* Type color dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 11,
              height: 11,
              borderRadius: '50%',
              backgroundColor: color,
              border: '2px solid var(--cb-surface-1, #0F1017)',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--cb-text-primary, #FFFFFF)',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--cb-text-secondary, #94A3B8)',
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--cb-text-muted, #64748B)',
              marginTop: 4,
            }}
          >
            {timeAgo}
          </div>
        </div>

        {/* Right: amount or progress */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {amount && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: isPositiveAmount
                  ? '#10B981'
                  : isNegativeAmount
                    ? 'var(--cb-error-red, #EF4444)'
                    : 'var(--cb-text-primary, #FFFFFF)',
                backgroundColor: isPositiveAmount
                  ? 'rgba(16, 185, 129, 0.12)'
                  : isNegativeAmount
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'transparent',
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {amount}
            </span>
          )}
          {type === 'campaign' && progress !== undefined && (
            <div style={{ width: 72 }}>
              <div style={{ fontSize: 10, color: color, marginBottom: 3, textAlign: 'right' }}>
                {progress}%
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                    backgroundColor: color,
                    borderRadius: 9999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action row — shown on hover (desktop) or always (mobile via media query workaround) */}
      {(hovered || isSilenced) && (onMarkRead || onDelete || onMute) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.06))',
          }}
        >
          {onMarkRead && !isRead && (
            <ActionBtn onClick={onMarkRead} label="Mark read" icon="✓" />
          )}
          {onMute && (
            <ActionBtn
              onClick={onMute}
              label={isSilenced ? 'Unmute' : 'Mute'}
              icon={isSilenced ? '🔔' : '🔕'}
            />
          )}
          {onDelete && (
            <ActionBtn onClick={onDelete} label="Delete" icon="🗑" danger />
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  label,
  icon,
  danger = false,
}: {
  onClick: () => void;
  label: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 6,
        backgroundColor: danger
          ? 'rgba(239, 68, 68, 0.08)'
          : 'var(--cb-toggle-bg, rgba(255,255,255,0.06))',
        color: danger
          ? 'var(--cb-error-red, #EF4444)'
          : 'var(--cb-text-secondary, #94A3B8)',
        border: danger
          ? '1px solid rgba(239, 68, 68, 0.2)'
          : '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 0.15s ease',
      }}
    >
      <span role="img" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}
