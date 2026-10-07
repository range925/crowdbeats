'use client';

/**
 * Crowdbeats V2 — LocationContextHeader Web Component
 * 
 * Displays active location status: "You are here" (default/GPS) or "Exploring Torrance, CA" (Search Area Mode)
 * with a quick "Reset to My Location" action.
 */

import React from 'react';

interface LocationContextHeaderProps {
  currentLocationName: string;
  isSearchAreaMode: boolean;
  onUseMyLocation: () => void;
}

export const LocationContextHeader: React.FC<LocationContextHeaderProps> = ({
  currentLocationName,
  isSearchAreaMode,
  onUseMyLocation,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 4px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isSearchAreaMode ? '#A855F7' : '#10B981',
            boxShadow: `0 0 10px ${isSearchAreaMode ? '#A855F7' : '#10B981'}`,
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', letterSpacing: '-0.01em' }}>
          {isSearchAreaMode ? `Exploring ${currentLocationName}` : `You are here · ${currentLocationName}`}
        </span>
      </div>

      {isSearchAreaMode && (
        <button
          type="button"
          onClick={onUseMyLocation}
          style={{
            background: 'none',
            border: 'none',
            color: '#A855F7',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>🎯</span>
          <span>Use My Location</span>
        </button>
      )}
    </div>
  );
};
