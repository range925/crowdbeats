'use client';

import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  style,
}) => {
  return (
    <div
      className={`admin-empty-state ${className}`.trim()}
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--admin-surface-card, #FFFFFF)',
        borderRadius: 12,
        border: '1px solid var(--admin-border-subtle, #E2E8F0)',
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--admin-surface-raised, #F1F5F9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--admin-text-tertiary, #94A3B8)',
            marginBottom: 16,
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--admin-text-primary, #0F172A)',
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 13,
          color: 'var(--admin-text-secondary, #64748B)',
          maxWidth: 420,
          margin: '0 0 18px',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--admin-accent-primary, #7C3AED)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
