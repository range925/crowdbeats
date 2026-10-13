'use client';

/**
 * Crowdbeats V2 — Discovery Navigation Bar
 * 
 * Glassmorphic top navigation with branding, active location indicator,
 * responsive mobile menu, and smart auth action gates.
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMobileDrawer } from '@/lib/hooks/useMobileDrawer';
import { ResponsiveMobileDrawer } from '@/components/navigation/ResponsiveMobileDrawer';
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
  const {
    isOpen: isMobileMenuOpen,
    close: closeMobileMenu,
    triggerProps,
    drawerRef,
    closeButtonRef,
  } = useMobileDrawer({ drawerId: 'cb-discovery-mobile-drawer' });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        borderBottom: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
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
            <CrowdbeatsLogo variant="horizontal" height={28} surface="light" priority />
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
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                fontSize: 'clamp(11px, 2vw, 13px)',
                color: '#7C3AED',
                fontWeight: 600,
                maxWidth: 'clamp(100px, 22vw, 240px)',
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
                    backgroundColor: 'rgba(124, 58, 237, 0.12)',
                    border: 'none',
                    color: '#7C3AED',
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
            className="hidden lg:inline-flex"
            style={{
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              color: '#7C3AED',
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
            className="hidden lg:inline-block"
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
              className="hidden sm:inline-flex"
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
            <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
              <Link
                href="/auth"
                style={{
                  color: 'var(--cb-text-primary, #1D1D1F)',
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
            {...triggerProps}
            className="lg:hidden cb-touch-target"
            style={{
              background: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              borderRadius: 8,
              color: 'var(--cb-text-primary, #1D1D1F)',
              width: 44,
              height: 44,
              minWidth: 44,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Accessible Responsive Mobile Navigation Drawer */}
      <ResponsiveMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        drawerRef={drawerRef}
        closeButtonRef={closeButtonRef}
        drawerId="cb-discovery-mobile-drawer"
        title="Discovery Navigation"
        personaLabel="Live Map & Stages"
        footer={
          isAuthenticated ? (
            <Link
              href="/fan/dashboard"
              onClick={() => closeMobileMenu(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              My Dashboard →
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                href="/auth"
                onClick={() => closeMobileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Sign In / Register →
              </Link>
            </div>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link
            href="/preview"
            onClick={() => closeMobileMenu(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(124, 58, 237, 0.08)',
              color: '#7C3AED',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              marginBottom: 4,
            }}
          >
            <span>🎭</span>
            <span>Persona Previews (5 Roles)</span>
          </Link>
          <Link
            href="/#nearby"
            onClick={() => closeMobileMenu(false)}
            style={{
              color: 'var(--cb-text-primary, #1D1D1F)',
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            Live Nearby Stages
          </Link>
          <Link
            href="/#artists"
            onClick={() => closeMobileMenu(false)}
            style={{
              color: 'var(--cb-text-primary, #1D1D1F)',
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            Featured Solo Artists &amp; Bands
          </Link>
          <Link
            href="/#venues"
            onClick={() => closeMobileMenu(false)}
            style={{
              color: 'var(--cb-text-primary, #1D1D1F)',
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            Live Stages &amp; Venues
          </Link>
          <Link
            href="/legal/support"
            onClick={() => closeMobileMenu(false)}
            style={{
              color: 'var(--cb-text-primary, #1D1D1F)',
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            Help &amp; Support
          </Link>
        </div>
      </ResponsiveMobileDrawer>
    </header>
  );
};
