import React from 'react';

export type StatusType =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'PENDING'
  | 'VERIFIED'
  | 'RESOLVED'
  | 'FLAGGED'
  | 'INACTIVE'
  | 'RECONCILED'
  | 'UNMATCHED';

export interface AdminStatusBadgeProps {
  status: StatusType | string;
  label?: string;
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface BadgeStyle {
  color: string;
  bg: string;
  borderColor: string;
  dotColor: string;
}

export function AdminStatusBadge({
  status,
  label,
  dot = true,
  className = '',
  style,
}: AdminStatusBadgeProps) {
  const normalized = (status || '').toUpperCase().trim();

  const getBadgeStyle = (s: string): BadgeStyle => {
    switch (s) {
      case 'ACTIVE':
      case 'VERIFIED':
      case 'RESOLVED':
      case 'RECONCILED':
        return {
          color: 'var(--admin-status-success, #10B981)',
          bg: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
          borderColor: 'rgba(16, 185, 129, 0.25)',
          dotColor: 'var(--admin-status-success, #10B981)',
        };
      case 'PENDING':
        return {
          color: 'var(--admin-status-warning, #F59E0B)',
          bg: 'var(--admin-status-warning-bg, rgba(245, 158, 11, 0.10))',
          borderColor: 'rgba(245, 158, 11, 0.25)',
          dotColor: 'var(--admin-status-warning, #F59E0B)',
        };
      case 'SUSPENDED':
      case 'FLAGGED':
      case 'UNMATCHED':
        return {
          color: 'var(--admin-status-error, #EF4444)',
          bg: 'var(--admin-status-error-bg, rgba(239, 68, 68, 0.10))',
          borderColor: 'rgba(239, 68, 68, 0.25)',
          dotColor: 'var(--admin-status-error, #EF4444)',
        };
      case 'INACTIVE':
      default:
        return {
          color: 'var(--admin-text-secondary, #64748B)',
          bg: 'var(--admin-surface-raised, rgba(100, 116, 139, 0.10))',
          borderColor: 'var(--admin-border-subtle, rgba(100, 116, 139, 0.20))',
          dotColor: 'var(--admin-text-tertiary, #64748B)',
        };
    }
  };

  const badgeStyle = getBadgeStyle(normalized);
  const displayText = label || status;

  return (
    <span
      className={`admin-status-badge ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 9px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0.02em',
        backgroundColor: badgeStyle.bg,
        color: badgeStyle.color,
        border: `1px solid ${badgeStyle.borderColor}`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style,
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: badgeStyle.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      <span>{displayText}</span>
    </span>
  );
}
