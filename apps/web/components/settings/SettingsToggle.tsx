'use client';

import React, { useCallback } from 'react';

interface SettingsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function SettingsToggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: SettingsToggleProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange(!checked);
      }
    },
    [checked, disabled, onChange]
  );

  const toggleId = id ?? 'cb-toggle';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {label && (
        <label
          htmlFor={toggleId}
          style={{
            fontSize: 13,
            color: 'var(--cb-text-secondary, #94A3B8)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
          }}
        >
          {label}
        </label>
      )}
      <div
        id={toggleId}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => { if (!disabled) onChange(!checked); }}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          width: 48,
          height: 28,
          borderRadius: 9999,
          backgroundColor: checked
            ? 'var(--cb-purple-main, #7C3AED)'
            : 'var(--cb-toggle-bg, rgba(255,255,255,0.08))',
          border: checked
            ? '1px solid var(--cb-purple-main, #7C3AED)'
            : '1px solid var(--cb-border-medium, rgba(255,255,255,0.14))',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          flexShrink: 0,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.35)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Inner circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: checked ? 'calc(100% - 25px)' : 3,
            transform: 'translateY(-50%)',
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            transition: 'left 0.2s ease',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
