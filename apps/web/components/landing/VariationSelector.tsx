'use client';

import React, { useState } from 'react';

export type LandingVariation = 'authoritative' | 'pro-minimal' | 'resonance-keynote' | 'studio-console' | 'dynamic-hub';

interface VariationSelectorProps {
  currentVariation: LandingVariation;
  onSelectVariation: (variation: LandingVariation) => void;
}

const VARIATIONS: { id: LandingVariation; name: string; tag: string; icon: string }[] = [
  { id: 'authoritative', name: 'Authority', tag: 'Vivid Resonance', icon: '🔥' },
  { id: 'pro-minimal', name: 'Pro Minimal', tag: 'Cupertino Dark', icon: '' },
  { id: 'resonance-keynote', name: 'Resonance', tag: 'Keynote Editorial', icon: '✨' },
  { id: 'studio-console', name: 'Studio Console', tag: 'Logic Pro Audio', icon: '🎛️' },
  { id: 'dynamic-hub', name: 'Dynamic Hub', tag: 'Ambient Cards', icon: '⚡' },
];

export function VariationSelector({ currentVariation, onSelectVariation }: VariationSelectorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const isDark = false;

  return (
    <aside
      aria-label="Design Variation & Theme Switcher"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          borderRadius: 9999,
          backgroundColor: isDark ? 'rgba(15, 16, 23, 0.88)' : 'rgba(255, 255, 255, 0.90)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)'}`,
          boxShadow: isDark
            ? '0 16px 40px -8px rgba(0, 0, 0, 0.75), 0 0 24px rgba(124, 58, 237, 0.25)'
            : '0 16px 40px -8px rgba(0, 0, 0, 0.18), 0 0 16px rgba(109, 40, 217, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {!isMinimized && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 8px 0 6px',
                borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#A855F7' : '#6D28D9',
                  whiteSpace: 'nowrap',
                }}
              >
                Crowdbeats
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
              {VARIATIONS.map((v) => {
                const isActive = currentVariation === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVariation(v.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 9999,
                      border: 'none',
                      backgroundColor: isActive
                        ? (isDark ? '#7C3AED' : '#6D28D9')
                        : 'transparent',
                      color: isActive
                        ? '#FFFFFF'
                        : (isDark ? '#94A3B8' : '#6E6E73'),
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isActive
                        ? (isDark ? '0 2px 10px rgba(124, 58, 237, 0.4)' : '0 2px 8px rgba(109, 40, 217, 0.3)')
                        : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{v.icon}</span>
                    <span>{v.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div
              style={{
                width: 1,
                height: 18,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                margin: '0 2px',
              }}
            />
          </>
        )}

        

        {/* Minimize / Expand Toggle */}
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          aria-label={isMinimized ? 'Expand variation switcher' : 'Minimize variation switcher'}
          title={isMinimized ? 'Expand variation switcher' : 'Minimize variation switcher'}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            color: isDark ? '#94A3B8' : '#6E6E73',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 12,
            transition: 'all 0.2s ease',
          }}
        >
          {isMinimized ? '⤢' : '✕'}
        </button>
      </div>
    </aside>
  );
}
