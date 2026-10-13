'use client';

/**
 * Crowdbeats V2 — Responsive Mobile Drawer Hook
 *
 * Implements accessible navigation drawer ergonomics:
 * - Controlled open/closed state
 * - Automatic route-change dismissal via Next.js usePathname
 * - Body scroll locking during presentation
 * - Escape key dismissal with focus restoration to the trigger button
 * - Focus trapping within the active drawer dialog
 * - Screen-reader ARIA property binding helpers
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface UseMobileDrawerOptions {
  drawerId?: string;
  defaultOpen?: boolean;
}

function useSafePathname(): string | null {
  try {
    return typeof usePathname === 'function' ? usePathname() : null;
  } catch {
    return null;
  }
}

export function useMobileDrawer(options: UseMobileDrawerOptions = {}) {
  const { drawerId = 'cb-mobile-drawer', defaultOpen = false } = options;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const pathname = useSafePathname();

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        requestAnimationFrame(() => {
          triggerRef.current?.focus();
        });
      }
      return !prev;
    });
  }, []);

  // Dismiss on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle focus trapping, Escape key, and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Lock background page scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move initial focus to close button or first interactive element
    const raf = requestAnimationFrame(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (drawerRef.current) {
        const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    });

    // Escape listener and focus trapping
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
      } else if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('hidden') && el.offsetParent !== null);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  const triggerProps = {
    ref: triggerRef,
    'aria-expanded': isOpen,
    'aria-controls': drawerId,
    'aria-label': isOpen ? 'Close navigation menu' : 'Open navigation menu',
    onClick: toggle,
  };

  const drawerProps = {
    ref: drawerRef,
    id: drawerId,
    role: 'dialog' as const,
    'aria-modal': true as const,
    hidden: !isOpen,
  };

  const closeButtonProps = {
    ref: closeButtonRef,
    type: 'button' as const,
    'aria-label': 'Close navigation menu',
    onClick: () => close(true),
  };

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
    triggerRef,
    drawerRef,
    closeButtonRef,
    triggerProps,
    drawerProps,
    closeButtonProps,
  };
}
