'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SectionId, SearchEntry } from './types';
import { SearchIcon, ChevronRightIcon } from './AccountCenterIcons';

const SEARCH_INDEX: SearchEntry[] = [
  // Profile
  { label: 'Display Name & Bio', description: 'Update your public persona and identity', section: 'profile', keywords: ['name', 'display name', 'username', 'profile', 'bio', 'avatar'] },
  { label: 'Email & Contact', description: 'View or update login credentials', section: 'profile', keywords: ['email', 'address', 'profile', 'contact', 'phone'] },
  
  // Security
  { label: 'Password Reset', description: 'Send a verified password reset email link', section: 'security', keywords: ['password', 'change password', 'reset', 'credentials', 'sign in'] },
  { label: 'Two-Factor Authentication', description: 'Biometric and authenticator security keys', section: 'security', keywords: ['2fa', 'two factor', 'mfa', 'authenticator', 'security code'] },
  { label: 'Active Sessions & Devices', description: 'Inspect signed-in web browsers and phones', section: 'security', keywords: ['sessions', 'devices', 'signed in', 'login', 'logout'] },

  // Privacy
  { label: 'Location Precision (GPS)', description: 'Set live radar accuracy (Precise, Approximate, Disabled)', section: 'privacy', keywords: ['location', 'gps', 'precise', 'privacy', 'radar', 'map'] },
  { label: 'Radar Discoverability', description: 'Toggle live performer beacon visibility', section: 'privacy', keywords: ['discoverable', 'radar', 'discover', 'privacy', 'visible', 'beacon'] },
  { label: 'Anonymous Tipping', description: 'Conceal supporter identity on live performer walls', section: 'privacy', keywords: ['anonymous', 'tipping', 'privacy', 'hide name', 'secret'] },
  { label: 'Telemetry & Diagnostics', description: 'Manage performance telemetry consent', section: 'privacy', keywords: ['telemetry', 'analytics', 'tracking', 'data', 'privacy'] },

  // Safety
  { label: 'Direct Message Controls', description: 'Control who can send direct gig inquiries or DMs', section: 'safety', keywords: ['messages', 'dms', 'who can', 'safety', 'messaging'] },
  { label: 'Keyword Blocklist', description: 'Filter abusive words from live stage chat', section: 'safety', keywords: ['block words', 'filter', 'safety', 'content', 'profanity'] },

  // Payments & Payouts
  { label: 'Tipping Wallet Balance', description: 'Inspect stored balance for 1-tap street tips', section: 'payments', keywords: ['wallet', 'balance', 'top up', 'payment', 'card'] },
  { label: 'Quick-Tip Presets', description: 'Customize $2, $5, $10, $20 preset buttons', section: 'payments', keywords: ['tip', 'preset', 'quick tip', 'tipping', 'amounts'] },
  { label: 'Stripe Connect Payouts', description: 'Direct deposit bank accounts for artists & venues', section: 'payouts', keywords: ['stripe', 'connect', 'payout', 'bank', 'direct deposit', 'earnings'] },

  // Notifications
  { label: 'Live Show Push Alerts', description: 'Alerts when followed artists take the stage', section: 'notifications', keywords: ['live', 'artist', 'alerts', 'notifications', 'following', 'stage'] },
  { label: 'Tip Receipt Chimes', description: 'Audible and push notifications when fans tip', section: 'notifications', keywords: ['tips received', 'tip', 'notification', 'chime'] },

  // Appearance & Accessibility
  { label: 'Theme & Dark Mode', description: 'Switch between Obsidian Dark, Light, or System', section: 'appearance', keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'color scheme'] },
  { label: 'Reduce Motion', description: 'Disable spring physics animations', section: 'accessibility', keywords: ['reduce motion', 'animation', 'accessibility', 'motion'] },
  { label: 'High Contrast Mode', description: 'Maximize visual contrast for high-glare stages', section: 'accessibility', keywords: ['high contrast', 'contrast', 'accessibility', 'vision'] },

  // Connections & Data
  { label: 'Spotify & Music Services', description: 'Sync Spotify listening and EPK preview tracks', section: 'connected', keywords: ['spotify', 'connect', 'linked accounts', 'music', 'apple music'] },
  { label: 'GDPR / CCPA Data Export', description: 'Download complete account ledger archives', section: 'data', keywords: ['download data', 'export', 'gdpr', 'ccpa', 'data', 'archive'] },
  
  // Danger
  { label: 'Deactivate Account', description: 'Temporarily pause public stage visibility', section: 'danger', keywords: ['deactivate', 'suspend', 'pause', 'account', 'disable'] },
  { label: 'Delete Account', description: 'Permanently remove account and data', section: 'danger', keywords: ['delete', 'delete account', 'remove', 'permanent', 'close account'] },
];

const POPULAR_PILLS = [
  { label: 'Password', section: 'security' as SectionId },
  { label: 'Location', section: 'privacy' as SectionId },
  { label: 'Tips', section: 'payments' as SectionId },
  { label: 'Payouts', section: 'payouts' as SectionId },
  { label: 'Notifications', section: 'notifications' as SectionId },
];

interface AccountCenterSearchProps {
  onResultClick: (section: SectionId) => void;
}

export function AccountCenterSearch({ onResultClick }: AccountCenterSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length < 2
    ? []
    : SEARCH_INDEX.filter(entry =>
        entry.keywords.some(kw => kw.toLowerCase().includes(query.toLowerCase())) ||
        entry.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);

  const handleSelect = useCallback((entry: SearchEntry) => {
    onResultClick(entry.section);
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [onResultClick]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[focusedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ padding: '12px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
      {/* Search Field */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOpen && results.length > 0 ? 'var(--cb-purple-light, #A855F7)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12,
          padding: '8px 12px',
          transition: 'all 0.15s ease',
          boxShadow: isOpen && results.length > 0 ? '0 0 0 2px rgba(168,85,247,0.2)' : 'none',
        }}
      >
        <SearchIcon size={16} color="var(--cb-text-secondary, #94A3B8)" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search settings..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: '#FFFFFF',
            fontFamily: 'inherit',
          }}
          aria-label="Search settings"
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); inputRef.current?.focus(); }}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, fontSize: 13 }}
            aria-label="Clear"
          >
            ✕
          </button>
        ) : (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 5px',
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'var(--cb-text-muted, #64748B)',
              fontFamily: 'monospace',
            }}
          >
            ⌘K
          </span>
        )}
      </div>

      {/* Quick Search Chips */}
      {!query && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {POPULAR_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => onResultClick(pill.section)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--cb-text-secondary, #94A3B8)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: '3px 8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 16,
            right: 16,
            backgroundColor: '#12141C',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.7)',
            zIndex: 100,
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
          }}
        >
          {results.map((entry, idx) => (
            <button
              key={`${entry.section}-${entry.label}`}
              type="button"
              role="option"
              aria-selected={idx === focusedIndex}
              onClick={() => handleSelect(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                backgroundColor: idx === focusedIndex ? 'rgba(124,58,237,0.18)' : 'transparent',
                border: 'none',
                borderBottom: idx < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{entry.label}</div>
                <div style={{ fontSize: 11, color: 'var(--cb-text-secondary, #94A3B8)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.description}
                </div>
              </div>
              <ChevronRightIcon size={14} color="var(--cb-text-muted, #64748B)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
