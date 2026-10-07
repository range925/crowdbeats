'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme, type ThemePreference } from './ThemeProvider';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'menu' | 'segmented' | 'pill' | 'icon';
  align?: 'left' | 'right';
}

export function ThemeToggle({
  className = '',
  variant = 'menu',
  align = 'right',
}: ThemeToggleProps) {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation for menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitemradio"]');
      if (!buttons || buttons.length === 0) return;
      const focusedIndex = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex = 0;
      if (e.key === 'ArrowDown') {
        nextIndex = focusedIndex >= 0 ? (focusedIndex + 1) % buttons.length : 0;
      } else {
        nextIndex = focusedIndex > 0 ? focusedIndex - 1 : buttons.length - 1;
      }
      buttons[nextIndex]?.focus();
    }
  };

  const options: { id: ThemePreference; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Light',
      description: 'Clean Apple Pro gray/white',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.15" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ),
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Deep obsidian pro canvas',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    {
      id: 'system',
      label: 'System',
      description: 'Follows device preference',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ];

  // ── 1. SEGMENTED VARIANT ──────────────────────────────────────────────────
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme preference selector"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: 3,
          borderRadius: 12,
          backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.06))',
          border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
          gap: 2,
        }}
        className={className}
      >
        {options.map((opt) => {
          const isSelected = themePreference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setThemePreference(opt.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 9,
                border: 'none',
                backgroundColor: isSelected
                  ? 'var(--cb-surface-1, #151722)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--cb-text-primary, #FFFFFF)'
                  : 'var(--cb-text-secondary, #94A3B8)',
                boxShadow: isSelected
                  ? '0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px var(--cb-border-subtle, rgba(255,255,255,0.1))'
                  : 'none',
                fontWeight: isSelected ? 600 : 500,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Current active icon to display on the button
  const currentIcon =
    themePreference === 'system' ? (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ) : resolvedTheme === 'light' ? (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ) : (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );

  // ── 2. SIMPLE ICON QUICK-TOGGLE VARIANT ──────────────────────────────────
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => {
          const cycle: ThemePreference[] = ['dark', 'light', 'system'];
          const next = cycle[(cycle.indexOf(themePreference) + 1) % cycle.length];
          setThemePreference(next);
        }}
        aria-label={`Theme: ${themePreference}. Click to toggle.`}
        title={`Theme: ${themePreference} (resolved: ${resolvedTheme})`}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--cb-toggle-bg, rgba(255, 255, 255, 0.08))',
          border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
          color: 'var(--cb-text-primary, #FFFFFF)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={className}
      >
        {currentIcon}
      </button>
    );
  }

  // ── 3. MENU DROPDOWN VARIANT (Default & Recommended for Headers) ─────────
  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ position: 'relative', display: 'inline-block' }}
      className={className}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Theme options. Current preference: ${themePreference} (${resolvedTheme})`}
        title={`Appearance: ${themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}`}
        style={{
          height: 38,
          padding: '0 12px',
          borderRadius: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          backgroundColor: isOpen
            ? 'var(--cb-surface-3, rgba(255, 255, 255, 0.14))'
            : 'var(--cb-toggle-bg, rgba(255, 255, 255, 0.07))',
          border: isOpen
            ? '1px solid var(--cb-border-focus, #7C3AED)'
            : '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.12))',
          color: 'var(--cb-text-primary, #FFFFFF)',
          cursor: 'pointer',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--cb-purple-light, #A855F7)' }}>
          {currentIcon}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.01em',
            textTransform: 'capitalize',
            color: 'var(--cb-text-primary, #FFFFFF)',
          }}
        >
          {themePreference}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
            color: 'var(--cb-text-secondary, #94A3B8)',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            width: 220,
            borderRadius: 14,
            padding: 6,
            backgroundColor: 'var(--cb-surface-1, #0F1017)',
            border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.12))',
            boxShadow: 'var(--cb-card-shadow, 0 16px 36px -4px rgba(0, 0, 0, 0.5))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            animation: 'fadeInMenu 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              padding: '6px 10px 4px 10px',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--cb-text-muted, #64748B)',
            }}
          >
            Appearance
          </div>

          {options.map((opt) => {
            const isSelected = themePreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setThemePreference(opt.id);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: isSelected
                    ? 'var(--cb-surface-2, rgba(124, 58, 237, 0.12))'
                    : 'transparent',
                  color: isSelected
                    ? 'var(--cb-text-primary, #FFFFFF)'
                    : 'var(--cb-text-secondary, #94A3B8)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--cb-surface-2, rgba(255, 255, 255, 0.05))';
                    e.currentTarget.style.color = 'var(--cb-text-primary, #FFFFFF)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--cb-text-secondary, #94A3B8)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: isSelected ? 'var(--cb-purple-light, #A855F7)' : 'currentColor',
                    }}
                  >
                    {opt.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--cb-text-muted, #64748B)' }}>
                      {opt.description}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cb-purple-light, #A855F7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

