'use client';

import React, { useRef } from 'react';

interface SettingsSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SettingsSearch({
  value,
  onChange,
  placeholder = 'Search…',
}: SettingsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {/* Magnifying glass icon */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--cb-text-muted, #64748B)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 40,
          paddingLeft: 36,
          paddingRight: value ? 36 : 12,
          backgroundColor: 'var(--cb-surface-2, #161822)',
          color: 'var(--cb-text-primary, #FFFFFF)',
          border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
          borderRadius: 10,
          fontSize: 13,
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--cb-purple-main, #7C3AED)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.18)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--cb-border-subtle, rgba(255,255,255,0.08))';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--cb-text-muted, #64748B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            borderRadius: 4,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--cb-text-primary, #FFFFFF)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--cb-text-muted, #64748B)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
