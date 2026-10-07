'use client';

import React from 'react';
import type { DeviceType } from '@crowdbeats/contracts';

interface SessionCardProps {
  device: string;
  deviceType?: DeviceType;
  browser?: string;
  location: string;
  lastActive: string;
  isCurrentDevice?: boolean;
  onRevoke?: () => void;
  onFlagSuspicious?: () => void;
}

export function SecuritySessionCard({
  device,
  deviceType = 'desktop',
  browser,
  location,
  lastActive,
  isCurrentDevice = false,
  onRevoke,
  onFlagSuspicious,
}: SessionCardProps) {
  const isActive = lastActive.toLowerCase().includes('active now');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 18px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: isCurrentDevice
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        transition: 'all 0.15s ease',
        flexWrap: 'wrap',
      }}
    >
      {/* Device icon + details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 220 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isCurrentDevice ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: isCurrentDevice ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isCurrentDevice ? '#10B981' : 'rgba(255, 255, 255, 0.7)',
          }}
        >
          {deviceType === 'mobile' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          ) : deviceType === 'tablet' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              {device}
            </span>
            {isCurrentDevice && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                This Device
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {browser && <span>{browser}</span>}
            {browser && <span style={{ opacity: 0.4 }}>&bull;</span>}
            <span>{location}</span>
            <span style={{ opacity: 0.4 }}>&bull;</span>
            <span
              style={{
                color: isActive ? '#10B981' : 'rgba(255, 255, 255, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isActive && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    display: 'inline-block',
                  }}
                />
              )}
              {lastActive}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isCurrentDevice && onFlagSuspicious && (
          <button
            type="button"
            onClick={onFlagSuspicious}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              backgroundColor: 'transparent',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
              minHeight: 36,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            This wasn't me
          </button>
        )}

        {!isCurrentDevice && onRevoke && (
          <button
            type="button"
            onClick={onRevoke}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s ease',
              fontFamily: 'inherit',
              minHeight: 36,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
