'use client';
/**
 * Crowdbeats V2 — Universal Accessible Tooltip Component
 *
 * Implements mouse hover, keyboard focus, tap/mobile, and screen-reader accessibility.
 * Invariant: Never covers active control, does not leak PII/secrets.
 */

import React, { useState } from 'react';

export interface CbTooltipProps {
  id: string;
  title: string;
  content: string;
  source?: string;
  permission?: string;
  children: React.ReactNode;
}

export function CbTooltip({ id, title, content, source, permission, children }: CbTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      aria-describedby={`tt-${id}`}
      role="button"
    >
      {children}

      {isVisible && (
        <span
          id={`tt-${id}`}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1E2032',
            border: '1px solid #2B2D44',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            minWidth: 220,
            maxWidth: 320,
            zIndex: 1000,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'block', fontWeight: 700, color: '#A855F7', marginBottom: 4 }}>
            {title}
          </span>
          <span style={{ display: 'block', color: '#CBD5E1', lineHeight: 1.4, marginBottom: 6 }}>
            {content}
          </span>
          {(source || permission) && (
            <span style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2B2D44', paddingTop: 6, fontSize: 10, color: '#94A3B8' }}>
              {source && <span>Src: {source}</span>}
              {permission && <span style={{ color: '#10B981' }}>{permission}</span>}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
