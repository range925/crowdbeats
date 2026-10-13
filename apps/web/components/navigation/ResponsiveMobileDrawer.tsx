'use client';

/**
 * Crowdbeats V2 — Responsive Mobile Navigation Drawer Component
 *
 * Implements accessible navigation drawer container conforming to WAI-ARIA Dialog (Modal) pattern:
 * - Backdrop with blur filter and dismissal on tap
 * - Slide-in drawer container with approved light-mode styling
 * - Crowdbeats brand logo and persona context label
 * - Accessible close button
 * - Keyboard navigation support (focus trap, Escape key)
 */

import React from 'react';
import Link from 'next/link';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

export interface ResponsiveMobileDrawerProps {
  isOpen: boolean;
  onClose: (restoreFocus?: boolean) => void;
  drawerRef: React.RefObject<HTMLDivElement | null>;
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
  drawerId?: string;
  title?: string;
  personaLabel?: string;
  logoVariant?: 'horizontal' | 'emblem';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const ResponsiveMobileDrawer: React.FC<ResponsiveMobileDrawerProps> = ({
  isOpen,
  onClose,
  drawerRef,
  closeButtonRef,
  drawerId = 'cb-mobile-drawer',
  title = 'Site navigation',
  personaLabel,
  logoVariant = 'horizontal',
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-start',
        animation: 'cbFadeIn 0.2s ease-out',
      }}
      onClick={() => onClose(true)}
      aria-hidden="true"
    >
      <div
        ref={drawerRef}
        id={drawerId}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: 'min(300px, 86vw)',
          height: '100%',
          backgroundColor: '#FFFFFF',
          color: '#1D1D1F',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'cbSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          zIndex: 201,
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: '#FBFBFD',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link
              href="/"
              onClick={() => onClose(false)}
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              aria-label="Crowdbeats home"
            >
              <CrowdbeatsLogo
                variant={logoVariant}
                height={logoVariant === 'emblem' ? 24 : 22}
                surface="light"
                ariaHidden
              />
            </Link>
            {personaLabel && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#7C3AED',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                }}
              >
                {personaLabel}
              </span>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => onClose(true)}
            aria-label="Close navigation menu"
            className="cb-touch-target"
            style={{
              background: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 8,
              width: 44,
              height: 44,
              minWidth: 44,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1D1D1F',
              fontSize: 18,
              transition: 'background-color 0.15s ease',
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Nav Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 10px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>

        {/* Drawer Footer if present */}
        {footer && (
          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: '#FBFBFD',
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cbSlideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
