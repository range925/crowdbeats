'use client';

import React from 'react';

/**
 * AppearanceSettings — Crowdbeats Web Light-Mode Standardization (Phase 4)
 *
 * Web experiences are permanently standardized to the approved default light-mode
 * theme. Web dark-mode/auto options are removed while preserving native mobile app
 * appearance settings.
 */
export function AppearanceSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              color: 'var(--cb-text-primary, #1D1D1F)',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Appearance &amp; Theme
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: 'rgba(124, 58, 237, 0.12)',
              color: 'var(--cb-purple-main, #7C3AED)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
            }}
          >
            Light Mode Standard
          </span>
        </div>
        <p style={{ color: 'var(--cb-text-secondary, #6E6E73)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          Crowdbeats web experiences are standardized to the approved default light-mode theme for crisp contrast, daylight clarity, and accessibility. Native iOS and Android app appearance settings can be configured inside the mobile app.
        </p>
      </div>

      {/* Standardized Light Mode Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            position: 'relative',
            borderRadius: 16,
            padding: '20px',
            backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
            border: '2px solid var(--cb-purple-main, #7C3AED)',
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Top Row: Icon + Active Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" fill="#F59E0B" fillOpacity="0.25" stroke="#D97706" />
                  <line x1="12" y1="1" x2="12" y2="3" stroke="#D97706" />
                  <line x1="12" y1="21" x2="12" y2="23" stroke="#D97706" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#D97706" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#D97706" />
                  <line x1="1" y1="12" x2="3" y2="12" stroke="#D97706" />
                  <line x1="21" y1="12" x2="23" y2="12" stroke="#D97706" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#D97706" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#D97706" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cb-text-primary, #1D1D1F)' }}>
                  Light Mode (Active Standard)
                </div>
                <div style={{ fontSize: 11, color: 'var(--cb-purple-main, #7C3AED)', fontWeight: 600 }}>
                  Apple Pro Minimal
                </div>
              </div>
            </div>

            {/* Active Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 9999,
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Default</span>
            </div>
          </div>

          {/* Visual Mockup Preview */}
          <div
            style={{
              height: 84,
              borderRadius: 10,
              background: '#FBFBFD',
              border: '1px solid #E5E5EA',
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: 6,
                background: '#FFFFFF',
                border: '1px solid #E5E5EA',
              }}
            >
              <div style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: '#7C3AED' }} />
              <div style={{ width: 14, height: 6, borderRadius: 3, backgroundColor: '#E5E5EA' }} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 6,
                background: '#FFFFFF',
                border: '1px solid #E5E5EA',
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#7C3AED' }} />
              <div style={{ flex: 1, height: 5, borderRadius: 2, backgroundColor: '#E5E5EA' }} />
              <div style={{ width: 24, height: 12, borderRadius: 4, backgroundColor: '#7C3AED' }} />
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 12,
              color: 'var(--cb-text-secondary, #6E6E73)',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            Clean Apple-style soft canvas with crisp contrast, daylight readability, and optimal typography.
          </p>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 12,
          backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
          border: '1px solid var(--cb-border-subtle, #E5E5EA)',
          color: 'var(--cb-text-secondary, #6E6E73)',
          fontSize: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'rgba(5, 150, 105, 0.12)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            flexShrink: 0,
            fontWeight: 700,
          }}
        >
          ✓
        </div>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--cb-text-primary, #1D1D1F)' }}>
            Standardized Web Appearance:
          </span>{' '}
          All web sessions operate in light mode. User profile preferences for iOS and Android native apps remain saved and isolated.
        </div>
      </div>
    </div>
  );
}
