'use client';

/**
 * Crowdbeats V2 — DiscoveryActionCard Web Component
 * 
 * High-contrast, tactile 3-option card component for the first screen:
 * 1. Nearby ("Artists and bands around you")
 * 2. Popular ("Trending in this area")
 * 3. Live Now ("Performing right now")
 */

import React from 'react';

interface DiscoveryActionCardProps {
  title: string;
  supportingText: string;
  icon: string;
  accentColor: string;
  badgeText?: string;
  onClick: () => void;
}

export const DiscoveryActionCard: React.FC<DiscoveryActionCardProps> = ({
  title,
  supportingText,
  icon,
  accentColor,
  badgeText,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        backgroundColor: '#151722',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderRadius: 20,
        padding: '20px 22px',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = accentColor;
        e.currentTarget.style.boxShadow = `0 14px 34px ${accentColor}25`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
      }}
    >
      {/* Icon with illuminated gradient backdrop */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}10 100%)`,
          border: `1px solid ${accentColor}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Text Hierarchy */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            {title}
          </span>
          {badgeText && (
            <span
              style={{
                backgroundColor: `${accentColor}25`,
                border: `1px solid ${accentColor}66`,
                color: accentColor,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#94A3B8',
            fontWeight: 400,
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {supportingText}
        </div>
      </div>

      {/* Chevron indicator */}
      <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 20, fontWeight: 700 }}>
        ➔
      </div>
    </div>
  );
};
