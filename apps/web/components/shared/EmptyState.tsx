'use client';

import React from 'react';

interface ActionProps {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ActionProps;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: 12,
      }}
    >
      {icon && (
        <span
          role="img"
          aria-label={title}
          style={{ fontSize: 48, lineHeight: 1, marginBottom: 4 }}
        >
          {icon}
        </span>
      )}
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--cb-text-primary, #FFFFFF)',
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: 'var(--cb-text-secondary, #94A3B8)',
            margin: 0,
            lineHeight: 1.55,
            maxWidth: 340,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 22px',
            borderRadius: 10,
            backgroundColor: 'var(--cb-purple-main, #7C3AED)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
