'use client';

import React from 'react';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 14,
      }}
      role="status"
      aria-label={label ?? 'Loading'}
      aria-live="polite"
    >
      {/* CSS spinner */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
          borderTopColor: 'var(--cb-purple-main, #7C3AED)',
          animation: 'cb-spin 0.7s linear infinite',
        }}
      />
      <style>{`
        @keyframes cb-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      {label && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--cb-text-secondary, #94A3B8)',
            margin: 0,
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
