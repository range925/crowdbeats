'use client';

import React from 'react';
import { AlertCircleIcon, RefreshIcon } from './AdminIcons';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  correlationId?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load operational data',
  message = 'An unexpected server error occurred while retrieving real-time records. Please retry or check backend telemetry.',
  correlationId,
  onRetry,
  isRetrying = false,
  className = '',
  style,
}) => {
  return (
    <div
      className={`admin-error-state ${className}`.trim()}
      style={{
        padding: '36px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'rgba(239, 68, 68, 0.04)',
        borderRadius: 12,
        border: '1px solid rgba(239, 68, 68, 0.2)',
        ...style,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#DC2626',
          marginBottom: 14,
        }}
        aria-hidden="true"
      >
        <AlertCircleIcon size={22} />
      </div>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#DC2626',
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 13,
          color: 'var(--admin-text-secondary, #64748B)',
          maxWidth: 460,
          margin: '0 0 16px',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      {correlationId && (
        <div
          style={{
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--admin-text-tertiary, #94A3B8)',
            marginBottom: 16,
          }}
        >
          Correlation ID: {correlationId}
        </div>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 8,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            background: 'var(--admin-surface-card, #FFFFFF)',
            color: 'var(--admin-text-primary, #0F172A)',
            fontSize: 13,
            fontWeight: 600,
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            opacity: isRetrying ? 0.6 : 1,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <RefreshIcon size={14} className={isRetrying ? 'admin-spin' : ''} />
          <span>{isRetrying ? 'Retrying…' : 'Retry Request'}</span>
        </button>
      )}

      <style>{`
        @keyframes adminSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .admin-spin {
          animation: adminSpin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
