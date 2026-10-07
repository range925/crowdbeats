'use client';

import React, { useState, useEffect } from 'react';
import { SearchIcon, XIcon } from './AdminIcons';

export interface AdminFilterBarProps {
  categories?: string[];
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  activeFilterCount?: number;
  className?: string;
  style?: React.CSSProperties;
  actions?: React.ReactNode;
}

export function AdminFilterBar({
  categories = [],
  activeCategory,
  onCategoryChange,
  onSearchChange,
  searchPlaceholder = 'Search...',
  activeFilterCount = 0,
  className = '',
  style,
  actions,
}: AdminFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearchChange) onSearchChange(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, onSearchChange]);

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearchChange) onSearchChange('');
  };

  return (
    <div
      className={`admin-filter-bar ${className}`.trim()}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
        boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
        ...style,
      }}
    >
      {/* Search Input Box */}
      <div
        style={{
          position: 'relative',
          flex: '1 1 240px',
          minWidth: '200px',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: isFocused
              ? 'var(--admin-accent-primary, #7C3AED)'
              : 'var(--admin-text-tertiary, #64748B)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            transition: 'color 0.15s ease',
          }}
          aria-hidden="true"
        >
          <SearchIcon size={16} strokeWidth={2} />
        </span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="admin-search-input"
          style={{
            width: '100%',
            padding: '8px 34px 8px 36px',
            borderRadius: '8px',
            border: `1px solid ${
              isFocused
                ? 'var(--admin-border-focus, #7C3AED)'
                : 'var(--admin-border-subtle, #E2E8F0)'
            }`,
            boxShadow: isFocused
              ? '0 0 0 2px var(--admin-accent-subtle, rgba(124, 58, 237, 0.12))'
              : 'none',
            background: 'var(--admin-bg-base, var(--surface-base, #F8FAFC))',
            color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              color: 'var(--admin-text-tertiary, #64748B)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <XIcon size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            alignItems: 'center',
            paddingBottom: '2px',
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange && onCategoryChange(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: isActive
                    ? 'var(--admin-accent-primary, #7C3AED)'
                    : 'var(--admin-border-subtle, #E2E8F0)',
                  background: isActive
                    ? 'var(--admin-accent-subtle, rgba(124, 58, 237, 0.10))'
                    : 'transparent',
                  color: isActive
                    ? 'var(--admin-accent-primary, #7C3AED)'
                    : 'var(--admin-text-secondary, #475569)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filter Count Badge */}
      {activeFilterCount > 0 && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--admin-accent-primary, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: 'auto',
          }}
        >
          <span
            className="admin-tabular-nums"
            style={{
              background: 'var(--admin-accent-primary, #7C3AED)',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '2px 7px',
              fontSize: '11px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {activeFilterCount}
          </span>
          <span>Filters Active</span>
        </div>
      )}

      {/* Optional Extra Actions Slot */}
      {actions && (
        <div style={{ marginLeft: activeFilterCount > 0 ? 0 : 'auto', display: 'flex', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
