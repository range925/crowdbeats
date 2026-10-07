'use client';

import React from 'react';

interface PickerOption {
  value: string;
  label: string;
}

interface SettingsPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  disabled?: boolean;
  id?: string;
}

export function SettingsPicker({
  value,
  onChange,
  options,
  disabled = false,
  id,
}: SettingsPickerProps) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundColor: 'var(--cb-surface-2, #161822)',
          color: 'var(--cb-text-primary, #FFFFFF)',
          border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'inherit',
          height: 36,
          paddingLeft: 12,
          paddingRight: 36,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          minWidth: 120,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--cb-purple-main, #7C3AED)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--cb-border-subtle, rgba(255,255,255,0.08))';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--cb-text-secondary, #94A3B8)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
