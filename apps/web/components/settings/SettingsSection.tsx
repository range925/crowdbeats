'use client';

import React from 'react';

interface SettingsSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsSection({ title, subtitle, badge, icon, children }: SettingsSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'var(--cb-toggle-bg, rgba(255,255,255,0.06))',
              border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--cb-purple-light, #A855F7)',
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: 0,
                color: 'var(--cb-text-primary, #FFFFFF)',
                fontFamily: 'Montserrat, sans-serif',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            {badge && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  color: 'var(--cb-purple-light, #A855F7)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  flexShrink: 0,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--cb-text-secondary, #94A3B8)',
                margin: '4px 0 0 0',
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Children Slot */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
