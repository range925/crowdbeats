'use client';

import React from 'react';

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
  danger?: boolean;
}

export function SettingsRow({ label, description, children, htmlFor, danger }: SettingsRowProps) {
  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: danger
      ? 'var(--cb-error-red, #EF4444)'
      : 'var(--cb-text-primary, #FFFFFF)',
    margin: 0,
    lineHeight: 1.4,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 0',
        borderBottom: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
      }}
      className="cb-settings-row"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {htmlFor ? (
          <label htmlFor={htmlFor} style={{ ...labelStyle, cursor: 'pointer' }}>
            {label}
          </label>
        ) : (
          <p style={labelStyle}>{label}</p>
        )}
        {description && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--cb-text-secondary, #94A3B8)',
              margin: '3px 0 0 0',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>

      {/* Remove border from last child via global style trick */}
      <style>{`
        .cb-settings-row:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
