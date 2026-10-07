'use client';

/**
 * Crowdbeats V2 — Web CrowdbeatsLocationSearch Component
 * 
 * Prominent geographic search bar with Places autocomplete dropdown and quick city chips.
 * Supports searches across global music hubs (Torrance, Palm Springs, LA, San Diego, Austin, Nashville, London, Auckland).
 */

import React, { useState, useRef, useEffect } from 'react';
import type { DiscoveryLocation } from '@crowdbeats/contracts';
import { DiscoveryClient, CURATED_LOCATIONS } from '@/lib/discovery/discoveryClient';

interface CrowdbeatsLocationSearchProps {
  placeholder?: string;
  currentLocationName: string;
  isSearchAreaMode: boolean;
  onSelectLocation: (loc: DiscoveryLocation) => void;
  onUseMyLocation: () => void;
}

export const CrowdbeatsLocationSearch: React.FC<CrowdbeatsLocationSearchProps> = ({
  placeholder = 'Search city, town, state or country',
  currentLocationName,
  isSearchAreaMode,
  onSelectLocation,
  onUseMyLocation,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<DiscoveryLocation[]>(CURATED_LOCATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSuggestions(DiscoveryClient.searchLocations(val));
    setIsOpen(true);
  };

  const handleSelect = (loc: DiscoveryLocation) => {
    setQuery('');
    setIsOpen(false);
    onSelectLocation(loc);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 640 }}>
      {/* Main Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#151722',
          border: isSearchAreaMode ? '1.5px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 16,
          padding: '8px 16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: 20, marginRight: 12, color: '#A855F7' }}>🔍</span>
        <input
          type="text"
          value={query}
          placeholder={isSearchAreaMode ? `Exploring ${currentLocationName}` : placeholder}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        />

        {isSearchAreaMode && (
          <button
            type="button"
            onClick={onUseMyLocation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              borderRadius: 8,
              padding: '6px 10px',
              color: '#A855F7',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span>📍</span>
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#131315',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 16,
            padding: 12,
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {/* Use My Location Option */}
          <div
            onClick={() => {
              setIsOpen(false);
              onUseMyLocation();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              cursor: 'pointer',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 18, color: '#A855F7' }}>🎯</span>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 14 }}>Use My Current Location</div>
              <div style={{ color: '#94A3B8', fontSize: 12 }}>Explore live music near you right now</div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: 0.5, padding: '4px 12px 6px' }}>
            POPULAR MUSIC CITIES
          </div>

          {suggestions.map((loc) => (
            <div
              key={loc.placeId}
              onClick={() => handleSelect(loc)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: 16, color: '#94A3B8' }}>📍</span>
              <div>
                <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 14 }}>{loc.city}</div>
                <div style={{ color: '#94A3B8', fontSize: 12 }}>{loc.administrativeArea}, {loc.country}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
