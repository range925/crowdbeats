'use client';

import React from 'react';

interface DangerZoneProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function DangerZone({
  title = 'Danger Zone',
  description,
  children,
}: DangerZoneProps) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #7F1D1D',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(127, 29, 29, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1 }} role="img" aria-label="Warning">⚠️</span>
        <div>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              margin: 0,
              color: 'var(--cb-error-red, #EF4444)',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                fontSize: 12,
                color: 'rgba(239, 68, 68, 0.75)',
                margin: '4px 0 0 0',
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}
