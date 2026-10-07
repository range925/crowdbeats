'use client';

/**
 * Crowdbeats V2 — Discovery Category & Genre Filter Bar
 * 
 * Category chips: Live Now, Near You, Popular, Trending, Solo, Bands, Venues, Upcoming, Genres
 * Segmented view mode switcher: Map | List | Venues
 */

import React from 'react';
import { DiscoveryCategory } from '@crowdbeats/contracts';

export const DISCOVERY_CATEGORIES: { id: DiscoveryCategory; label: string; icon: string }[] = [
  { id: DiscoveryCategory.LIVE_NOW, label: 'Live Now', icon: '🔴' },
  { id: DiscoveryCategory.NEAR_YOU, label: 'Near You', icon: '📍' },
  { id: DiscoveryCategory.POPULAR, label: 'Popular', icon: '🔥' },
  { id: DiscoveryCategory.TRENDING, label: 'Trending', icon: '📈' },
  { id: DiscoveryCategory.SOLO_MUSICIANS, label: 'Solo Artists', icon: '🎤' },
  { id: DiscoveryCategory.BANDS, label: 'Bands', icon: '🎸' },
  { id: DiscoveryCategory.VENUES, label: 'Venues', icon: '🏟️' },
  { id: DiscoveryCategory.UPCOMING, label: 'Upcoming', icon: '🗓️' },
];

export const GENRE_LIST = [
  'All',
  'Indie Pop',
  'Rock',
  'Electronic',
  'Jazz',
  'Acoustic',
  'Alternative',
  'Hip-Hop',
  'Country',
];

interface CategoryFilterBarProps {
  selectedCategory: DiscoveryCategory;
  selectedGenre: string;
  onSelectCategory: (cat: DiscoveryCategory) => void;
  onSelectGenre: (genre: string) => void;
  viewMode: 'map' | 'list' | 'venues';
  onChangeViewMode: (mode: 'map' | 'list' | 'venues') => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  selectedGenre,
  onSelectCategory,
  onSelectGenre,
  viewMode,
  onChangeViewMode,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Top row: Categories + View Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {DISCOVERY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  backgroundColor: isSelected
                    ? 'var(--cb-purple-main)'
                    : 'rgba(21, 23, 34, 0.8)',
                  border: isSelected
                    ? '1px solid var(--cb-purple-light)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#FFFFFF' : 'var(--cb-text-secondary)',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Switcher: Map | List | Venues */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#151722',
            padding: 3,
            borderRadius: 9999,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            type="button"
            onClick={() => onChangeViewMode('map')}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: viewMode === 'map' ? 'var(--cb-purple-main)' : 'transparent',
              color: viewMode === 'map' ? '#FFFFFF' : 'var(--cb-text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🗺️ Map
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('list')}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'var(--cb-purple-main)' : 'transparent',
              color: viewMode === 'list' ? '#FFFFFF' : 'var(--cb-text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📋 List
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('venues')}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: viewMode === 'venues' ? 'var(--cb-purple-main)' : 'transparent',
              color: viewMode === 'venues' ? '#FFFFFF' : 'var(--cb-text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🏟️ Venues
          </button>
        </div>
      </div>

      {/* Second row: Genre Filter Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
        <span style={{ fontSize: 12, color: 'var(--cb-text-muted)', fontWeight: 600, marginRight: 4 }}>
          Genres:
        </span>
        {GENRE_LIST.map((genre) => {
          const isSelected = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onSelectGenre(genre)}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                border: isSelected ? '1px solid #A855F7' : '1px solid transparent',
                color: isSelected ? '#A855F7' : 'var(--cb-text-muted)',
                fontSize: 12,
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
};
