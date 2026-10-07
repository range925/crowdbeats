'use client';

import React from 'react';
import { useTheme, type ThemePreference } from '@/components/theme/ThemeProvider';

export function AppearanceSettings() {
  const { themePreference, resolvedTheme, systemTheme, setThemePreference } = useTheme();

  const options: {
    id: ThemePreference;
    title: string;
    subtitle: string;
    description: string;
    previewBg: string;
    previewCard: string;
    previewBorder: string;
    previewText: string;
    previewAccent: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'light',
      title: 'Light Mode',
      subtitle: 'Apple Pro Minimal',
      description: 'Clean Apple-style soft canvas with crisp contrast and daylight clarity.',
      previewBg: '#FBFBFD',
      previewCard: '#FFFFFF',
      previewBorder: '#E5E5EA',
      previewText: '#1D1D1F',
      previewAccent: '#7C3AED',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      ),
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      subtitle: 'Deep Obsidian Pro',
      description: 'High-fidelity obsidian canvas with luminous purple glows and reduced eye strain.',
      previewBg: '#050507',
      previewCard: '#0F1017',
      previewBorder: 'rgba(255, 255, 255, 0.12)',
      previewText: '#FFFFFF',
      previewAccent: '#A855F7',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(168, 85, 247, 0.2)" />
        </svg>
      ),
    },
    {
      id: 'system',
      title: 'System Default',
      subtitle: 'Adaptive OS Sync',
      description: 'Automatically synchronizes with your device or browser appearance settings in real time.',
      previewBg: 'linear-gradient(135deg, #050507 50%, #FBFBFD 50%)',
      previewCard: 'linear-gradient(135deg, #0F1017 50%, #FFFFFF 50%)',
      previewBorder: 'rgba(124, 58, 237, 0.3)',
      previewText: resolvedTheme === 'dark' ? '#FFFFFF' : '#1D1D1F',
      previewAccent: '#38BDF8',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="rgba(56, 189, 248, 0.15)" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              color: 'var(--cb-text-primary, #FFFFFF)',
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
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              color: 'var(--cb-purple-light, #A855F7)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
            }}
          >
            Production Ready
          </span>
        </div>
        <p style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          Choose how Crowdbeats appears on this device. System Default follows your device or browser preference automatically.
        </p>
      </div>

      {/* 3 Appearance Cards Grid */}
      <div
        role="radiogroup"
        aria-label="Appearance selection"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {options.map((opt) => {
          const isSelected = themePreference === opt.id;
          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => setThemePreference(opt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setThemePreference(opt.id);
                }
              }}
              style={{
                position: 'relative',
                borderRadius: 16,
                padding: '18px 18px 20px 18px',
                backgroundColor: isSelected
                  ? 'var(--cb-surface-2, rgba(124, 58, 237, 0.08))'
                  : 'var(--cb-surface-1, #151722)',
                border: isSelected
                  ? '2px solid var(--cb-purple-main, #7C3AED)'
                  : '1px solid var(--cb-border-subtle, #2B2D44)',
                boxShadow: isSelected
                  ? '0 0 20px rgba(124, 58, 237, 0.25), 0 8px 24px rgba(0,0,0,0.3)'
                  : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                outline: 'none',
              }}
            >
              {/* Top Row: Icon + Radio Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'var(--cb-toggle-bg, rgba(255, 255, 255, 0.06))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                    }}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cb-text-primary, #FFFFFF)' }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cb-purple-light, #A855F7)', fontWeight: 600 }}>
                      {opt.subtitle}
                    </div>
                  </div>
                </div>

                {/* Custom Accessible Radio Circle */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: isSelected
                      ? '2px solid var(--cb-purple-main, #7C3AED)'
                      : '2px solid var(--cb-border-medium, rgba(255, 255, 255, 0.25))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? 'var(--cb-purple-main, #7C3AED)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Visual Mockup Preview */}
              <div
                style={{
                  height: 84,
                  borderRadius: 10,
                  background: opt.previewBg,
                  border: `1px solid ${opt.previewBorder}`,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
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
                    background: opt.previewCard,
                    border: `1px solid ${opt.previewBorder}`,
                  }}
                >
                  <div style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: opt.previewAccent }} />
                  <div style={{ width: 14, height: 6, borderRadius: 3, backgroundColor: opt.previewBorder }} />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: opt.previewCard,
                    border: `1px solid ${opt.previewBorder}`,
                  }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: opt.previewAccent }} />
                  <div style={{ flex: 1, height: 5, borderRadius: 2, backgroundColor: opt.previewBorder }} />
                  <div style={{ width: 24, height: 12, borderRadius: 4, backgroundColor: opt.previewAccent }} />
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--cb-text-secondary, #94A3B8)',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {opt.description}
              </p>

              {/* Dynamic Status for System Default */}
              {opt.id === 'system' && (
                <div
                  style={{
                    marginTop: 'auto',
                    padding: '6px 10px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: 11,
                    color: '#38BDF8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#38BDF8',
                    }}
                  />
                  <span>
                    OS is {systemTheme === 'dark' ? 'Dark' : 'Light'} (matches {resolvedTheme})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sync Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 12,
          backgroundColor: 'var(--cb-surface-1, #151722)',
          border: '1px solid var(--cb-border-subtle, #2B2D44)',
          color: 'var(--cb-text-secondary, #94A3B8)',
          fontSize: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--cb-text-primary, #FFFFFF)' }}>
            Cloud Synchronized:
          </span>{' '}
          Your appearance preference is stored locally and securely synced to your Crowdbeats account profile across all web and mobile sessions.
        </div>
      </div>
    </div>
  );
}
