'use client';

/**
 * Crowdbeats V2 — Location Search Bar with Places Autocomplete
 * 
 * Input with "Search city, town, state or country" placeholder.
 * Shows dropdown suggestions (Torrance, San Diego, Austin, Nashville, etc.)
 */

import React, { useState, useRef, useEffect } from 'react';
import type { DiscoveryLocation } from '@crowdbeats/contracts';
import { DiscoveryClient, TORRANCE_LOCATION } from '@/lib/discovery/discoveryClient';

interface LocationSearchBarProps {
  onSelectLocation: (loc: DiscoveryLocation) => void;
  onUseMyLocation?: () => void;
  currentLocationName?: string;
  isSearchAreaMode?: boolean;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onSelectLocation,
  onUseMyLocation,
  currentLocationName,
  isSearchAreaMode,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DiscoveryLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 2) {
      const results = DiscoveryClient.searchLocations(val);
      setSuggestions(results);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (loc: DiscoveryLocation) => {
    setQuery(loc.displayName);
    setSuggestions([]);
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
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 540 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(21, 23, 34, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 9999,
          padding: '6px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span style={{ fontSize: 18, marginRight: 10, color: '#A855F7' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search city, town, state or country"
          aria-label="Search city, town, state or country"
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cb-text-muted)',
              cursor: 'pointer',
              fontSize: 14,
              padding: 4,
            }}
          >
            ✕
          </button>
        )}

        {isSearchAreaMode && onUseMyLocation && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onUseMyLocation();
            }}
            style={{
              marginLeft: 8,
              padding: '6px 12px',
              borderRadius: 9999,
              backgroundColor: 'rgba(124, 58, 237, 0.2)',
              border: '1px solid rgba(124, 58, 237, 0.4)',
              color: '#A855F7',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Use My Location
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Overlay */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#181926',
            borderRadius: 16,
            border: '1px solid rgba(124, 58, 237, 0.35)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
          }}
        >
          {suggestions.map((loc) => (
            <div
              key={loc.displayName}
              onClick={() => handleSelect(loc)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: 16, color: '#A855F7' }}>🏙️</span>
              <div>
                <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600 }}>{loc.displayName}</div>
                <div style={{ color: 'var(--cb-text-muted)', fontSize: 12 }}>
                  {loc.city}, {loc.administrativeArea} · {loc.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick City Fallback Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--cb-text-muted)', fontWeight: 600 }}>Popular:</span>
        <button
          type="button"
          onClick={() => handleSelect(TORRANCE_LOCATION)}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 9999,
            padding: '2px 10px',
            color: '#A855F7',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Torrance, CA
        </button>
        <button
          type="button"
          onClick={() => handleSelect(DiscoveryClient.searchLocations('San Diego')[0])}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 9999,
            padding: '2px 10px',
            color: 'var(--cb-text-secondary)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          San Diego
        </button>
        <button
          type="button"
          onClick={() => handleSelect(DiscoveryClient.searchLocations('Austin')[0])}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 9999,
            padding: '2px 10px',
            color: 'var(--cb-text-secondary)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Austin
        </button>
        <button
          type="button"
          onClick={() => handleSelect(DiscoveryClient.searchLocations('Nashville')[0])}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 9999,
            padding: '2px 10px',
            color: 'var(--cb-text-secondary)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Nashville
        </button>
      </div>
    </div>
  );
};
