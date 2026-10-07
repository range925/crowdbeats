'use client';

import React, { useRef } from 'react';

interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

interface ActivityFilterProps {
  tabs: FilterTab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function ActivityFilter({ tabs, activeTab, onChange }: ActivityFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label="Activity filters"
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 2,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .cb-activity-filter-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: isActive
                ? '1px solid var(--cb-purple-main, #7C3AED)'
                : '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
              backgroundColor: isActive
                ? 'var(--cb-purple-main, #7C3AED)'
                : 'transparent',
              color: isActive
                ? '#FFFFFF'
                : 'var(--cb-text-secondary, #94A3B8)',
              outline: 'none',
            }}
            onFocus={(e) => {
              if (!isActive) {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124, 58, 237, 0.4)';
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.25)'
                    : 'var(--cb-toggle-bg, rgba(255,255,255,0.08))',
                  color: isActive ? '#FFFFFF' : 'var(--cb-text-secondary, #94A3B8)',
                }}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
