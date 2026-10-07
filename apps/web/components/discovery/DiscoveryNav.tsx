'use client';

/**
 * Crowdbeats V2 — Discovery Navigation Bar
 * 
 * Glassmorphic top navigation with branding, active location indicator,
 * responsive mobile menu, and smart auth action gates.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import type { DiscoveryLocation } from '@crowdbeats/contracts';

interface DiscoveryNavProps {
  currentLocation?: DiscoveryLocation;
  onUseMyLocation?: () => void;
  isSearchAreaMode?: boolean;
}

export const DiscoveryNav: React.FC<DiscoveryNavProps> = ({
  currentLocation,
  onUseMyLocation,
  isSearchAreaMode,
}) => {
  const { user, status } = useAuth();
  const isAuthenticated = status === 'authenticated' && !!user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(11, 12, 16, 0.90)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px clamp(16px, 3vw, 28px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        {/* Brand & Explore */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 24px)' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            aria-label="Crowdbeats home"
          >
            <CrowdbeatsLogo variant="horizontal" height={28} surface="dark" priority />
          </Link>

          {/* Location Badge */}
          {currentLocation && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 9999,
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                fontSize: 'clamp(11px, 2vw, 13px)',
                color: '#A855F7',
                fontWeight: 600,
                maxWidth: 'clamp(140px, 30vw, 280px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentLocation.displayName || `${currentLocation.city}, ${currentLocation.administrativeArea}`}
              </span>
              {isSearchAreaMode && onUseMyLocation && (
                <button
                  type="button"
                  onClick={onUseMyLocation}
                  style={{
                    marginLeft: 4,
                    padding: '2px 6px',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  GPS
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Nav Links & Auth CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 16px)',
          }}
        >
          <Link
            href="/preview"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              color: '#C084FC',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🎭</span>
            <span>Persona Previews</span>
          </Link>
          <Link
            href="/#nearby"
            className="hidden md:inline-block"
            style={{
              color: 'var(--cb-text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 8px',
            }}
          >
            Live Nearby
          </Link>
          <Link
            href="/#artists"
            className="hidden lg:inline-block"
            style={{
              color: 'var(--cb-text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 8px',
            }}
          >
            Artists
          </Link>
          <Link
            href="/#venues"
            className="hidden lg:inline-block"
            style={{
              color: 'var(--cb-text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 8px',
            }}
          >
            Venues
          </Link>
          <Link
            href="/legal/support"
            className="hidden sm:inline-block"
            style={{
              color: 'var(--cb-text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 8px',
            }}
          >
            Support
          </Link>

          {isAuthenticated ? (
            <Link
              href="/fan/dashboard"
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              My Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                href="/auth"
                className="hidden sm:inline-block"
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                style={{
                  padding: '7px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle Navigation Menu"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              color: '#FFFFFF',
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <Link
            href="/preview"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              color: '#C084FC',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <span>🎭</span>
            <span>Persona Previews (5 Roles)</span>
          </Link>
          <Link
            href="/#nearby"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              color: '#E2E8F0',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 14px',
              textDecoration: 'none',
            }}
          >
            Live Nearby Stages
          </Link>
          <Link
            href="/#artists"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              color: '#E2E8F0',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 14px',
              textDecoration: 'none',
            }}
          >
            Featured Solo Artists &amp; Bands
          </Link>
          <Link
            href="/#venues"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              color: '#E2E8F0',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 14px',
              textDecoration: 'none',
            }}
          >
            Live Stages &amp; Venues
          </Link>
          <Link
            href="/legal/support"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              color: '#E2E8F0',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 14px',
              textDecoration: 'none',
            }}
          >
            Help &amp; Support
          </Link>
          <Link
            href="/auth"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              color: '#A855F7',
              fontSize: 14,
              fontWeight: 700,
              padding: '8px 14px',
              textDecoration: 'none',
            }}
          >
            Sign In / Register →
          </Link>
        </div>
      )}
    </header>
  );
};
