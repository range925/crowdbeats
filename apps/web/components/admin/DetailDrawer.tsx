'use client';

import React, { useEffect, useRef } from 'react';
import { XIcon } from './AdminIcons';

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  width?: string | number;
  headerActions?: React.ReactNode;
  footerActions?: React.ReactNode;
  children: React.ReactNode;
  tabs?: Array<{ id: string; label: string; count?: number }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  width = 540,
  headerActions,
  footerActions,
  children,
  tabs,
  activeTab,
  onTabChange,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-drawer-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          transition: 'opacity 0.2s ease',
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        style={{
          position: 'relative',
          width: typeof width === 'number' ? `${width}px` : width,
          maxWidth: '100vw',
          height: '100vh',
          background: 'var(--admin-surface-card, #FFFFFF)',
          borderLeft: '1px solid var(--admin-border-subtle, #E2E8F0)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            background: 'var(--admin-surface-raised, #F8FAFC)',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2
                id="admin-drawer-title"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--admin-text-primary, #0F172A)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--admin-text-secondary, #64748B)',
                  margin: '4px 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px',
                borderRadius: 6,
                color: 'var(--admin-text-tertiary, #94A3B8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close detail drawer"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Optional Tabs Bar */}
        {tabs && tabs.length > 0 && (
          <div
            style={{
              display: 'flex',
              padding: '0 24px',
              borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
              background: 'var(--admin-surface-card, #FFFFFF)',
              gap: 20,
              overflowX: 'auto',
              flexShrink: 0,
            }}
            role="tablist"
          >
            {tabs.map((tab) => {
              const isSelected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  style={{
                    padding: '12px 2px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: isSelected
                      ? '2px solid var(--admin-accent-primary, #7C3AED)'
                      : '2px solid transparent',
                    color: isSelected
                      ? 'var(--admin-accent-primary, #7C3AED)'
                      : 'var(--admin-text-secondary, #64748B)',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 9999,
                        background: isSelected
                          ? 'rgba(124, 58, 237, 0.12)'
                          : 'var(--admin-surface-raised, #F1F5F9)',
                        color: isSelected
                          ? 'var(--admin-accent-primary, #7C3AED)'
                          : 'var(--admin-text-tertiary, #94A3B8)',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Drawer Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {children}
        </div>

        {/* Drawer Footer Actions */}
        {footerActions && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--admin-border-subtle, #E2E8F0)',
              background: 'var(--admin-surface-raised, #F8FAFC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              flexShrink: 0,
            }}
          >
            {footerActions}
          </div>
        )}
      </aside>
    </div>
  );
};
