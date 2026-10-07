'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchIcon,
  XIcon,
  UsersIcon,
  ArtistsIcon,
  CampaignsIcon,
  FinanceIcon,
  SupportIcon,
  ChevronRightIcon,
} from './AdminIcons';

export interface SearchResultItem {
  id: string;
  type: 'USER' | 'BAND' | 'CAMPAIGN' | 'TRANSACTION' | 'CASE';
  title: string;
  subtitle: string;
  status: string;
  statusVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  href: string;
}

const SAMPLE_ENTITIES: SearchResultItem[] = [
  {
    id: 'usr_maya_lin',
    type: 'USER',
    title: 'Maya Lin',
    subtitle: 'maya.lin@music.io • Solo Musician (Verified)',
    status: 'ACTIVE',
    statusVariant: 'success',
    href: '/admin/crm/usr_maya_lin',
  },
  {
    id: 'usr_marcus_vance',
    type: 'USER',
    title: 'Marcus Vance',
    subtitle: 'marcus@vancebrass.com • Band Owner',
    status: 'ACTIVE',
    statusVariant: 'success',
    href: '/admin/crm/usr_marcus_vance',
  },
  {
    id: 'usr_fan_alex',
    type: 'USER',
    title: 'Alex Rivera',
    subtitle: 'alex.r@gmail.com • Fan ($420 Total Tipped)',
    status: 'ACTIVE',
    statusVariant: 'success',
    href: '/admin/crm/usr_fan_alex',
  },
  {
    id: 'band_neon_drift',
    type: 'BAND',
    title: 'Neon Drift',
    subtitle: 'Synthesizer Indie Band • 4 Active Members',
    status: 'VERIFIED',
    statusVariant: 'success',
    href: '/admin/creators?tab=bands&id=band_neon_drift',
  },
  {
    id: 'band_brass_roots',
    type: 'BAND',
    title: 'Brass Roots Collective',
    subtitle: '9-Piece Jazz Brass • Pending Split Update v2',
    status: 'PENDING_SPLIT',
    statusVariant: 'warning',
    href: '/admin/creators?tab=split-agreements&id=band_brass_roots',
  },
  {
    id: 'cmp_album_2026',
    type: 'CAMPAIGN',
    title: 'Neon Horizon Debut Vinyl',
    subtitle: 'Goal: $12,000 • Raised: $8,450 (70%)',
    status: 'ACTIVE',
    statusVariant: 'success',
    href: '/admin/campaigns?id=cmp_album_2026',
  },
  {
    id: 'cmp_japan_tour',
    type: 'CAMPAIGN',
    title: 'Tokyo Busking Showcase Tour',
    subtitle: 'Awaiting Compliance Review & Escrow Validation',
    status: 'PENDING_REVIEW',
    statusVariant: 'warning',
    href: '/admin/campaigns?tab=pending-review&id=cmp_japan_tour',
  },
  {
    id: 'tip_9941a8',
    type: 'TRANSACTION',
    title: 'Tip $50.00 — Maya Lin',
    subtitle: 'Stripe PI: pi_3P8qW2LZUnAXe5WT • Platform Fee: $3.00',
    status: 'SUCCEEDED',
    statusVariant: 'success',
    href: '/admin/finance?query=tip_9941a8',
  },
  {
    id: 'tip_failed_882',
    type: 'TRANSACTION',
    title: 'Tip $120.00 — Brass Roots',
    subtitle: 'Declined: Insufficient Funds • Fan notified',
    status: 'FAILED',
    statusVariant: 'danger',
    href: '/admin/finance?tab=disputes&query=tip_failed_882',
  },
  {
    id: 'tkt_8021',
    type: 'CASE',
    title: 'Ticket #8021: Refund Request ($25)',
    subtitle: 'Fan duplicate tap at Sunset Stage • Age: 2h',
    status: 'OPEN',
    statusVariant: 'warning',
    href: '/admin/support?ticket=tkt_8021',
  },
  {
    id: 'rep_1092',
    type: 'CASE',
    title: 'Abuse Report #1092: Unauthorized QR sticker',
    subtitle: 'Reported venue: Washington Sq Park • High Severity',
    status: 'INVESTIGATING',
    statusVariant: 'danger',
    href: '/admin/trust-safety?report=rep_1092',
  },
];

export const GlobalEntitySearch: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items based on query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SAMPLE_ENTITIES.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [query]);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) {
        setIsOpen(false);
        router.push(item.href);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    router.push(item.href);
  };

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'USER':
        return <UsersIcon size={14} />;
      case 'BAND':
        return <ArtistsIcon size={14} />;
      case 'CAMPAIGN':
        return <CampaignsIcon size={14} />;
      case 'TRANSACTION':
        return <FinanceIcon size={14} />;
      case 'CASE':
        return <SupportIcon size={14} />;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 380,
      }}
    >
      {/* Search Input Box */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <SearchIcon
          size={14}
          color="var(--admin-text-tertiary, #94A3B8)"
          style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Global entity search (users, bands, tx, cases)…"
          style={{
            width: '100%',
            padding: '6px 28px 6px 30px',
            borderRadius: 8,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            background: 'var(--admin-surface-card, #FFFFFF)',
            color: 'var(--admin-text-primary, #0F172A)',
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'all 0.15s ease',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              right: 8,
              background: 'none',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              color: 'var(--admin-text-tertiary, #94A3B8)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <XIcon size={12} />
          </button>
        )}
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && query.trim().length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 10,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            maxHeight: 380,
            overflowY: 'auto',
            zIndex: 100,
            padding: '6px 0',
          }}
          role="listbox"
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '16px 20px',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--admin-text-tertiary, #94A3B8)',
              }}
            >
              No authorized entities matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--admin-surface-raised, #F1F5F9)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid var(--admin-accent-primary, #7C3AED)'
                      : '3px solid transparent',
                    transition: 'background 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'var(--admin-surface-raised, #F1F5F9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--admin-accent-primary, #7C3AED)',
                        flexShrink: 0,
                      }}
                    >
                      {getTypeIcon(item.type)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--admin-text-primary, #0F172A)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--admin-text-tertiary, #94A3B8)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        background:
                          item.statusVariant === 'success'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : item.statusVariant === 'warning'
                            ? 'rgba(245, 158, 11, 0.1)'
                            : item.statusVariant === 'danger'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(0, 0, 0, 0.05)',
                        color:
                          item.statusVariant === 'success'
                            ? '#059669'
                            : item.statusVariant === 'warning'
                            ? '#D97706'
                            : item.statusVariant === 'danger'
                            ? '#DC2626'
                            : 'var(--admin-text-secondary, #64748B)',
                      }}
                    >
                      {item.status}
                    </span>
                    <ChevronRightIcon size={12} color="var(--admin-text-tertiary, #94A3B8)" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
