'use client';

import React from 'react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
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
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          marginBottom: 4,
        }}
        role="img"
        aria-label="Error"
      >
        ⚠️
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--cb-error-red, #EF4444)',
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--cb-text-secondary, #94A3B8)',
            margin: 0,
            lineHeight: 1.55,
            maxWidth: 320,
          }}
        >
          {description}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 8,
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 20px',
            borderRadius: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--cb-error-red, #EF4444)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.18)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
