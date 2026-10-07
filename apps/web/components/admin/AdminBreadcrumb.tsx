import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from './AdminIcons';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  style?: React.CSSProperties;
  separator?: React.ReactNode;
}

export function AdminBreadcrumb({
  items,
  className = '',
  style,
  separator,
}: AdminBreadcrumbProps) {
  const defaultSeparator = (
    <ChevronRightIcon
      size={12}
      strokeWidth={2}
      style={{
        color: 'var(--admin-text-tertiary, #64748B)',
        flexShrink: 0,
        opacity: 0.7,
      }}
    />
  );

  return (
    <nav
      aria-label="breadcrumb"
      className={`admin-breadcrumb-nav ${className}`.trim()}
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: 0,
        padding: 0,
        ...style,
      }}
    >
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                lineHeight: '1.4',
              }}
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="admin-breadcrumb-link"
                  style={{
                    color: 'var(--admin-text-secondary, #475569)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'color 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  style={{
                    color: isLast
                      ? 'var(--admin-text-primary, #0F172A)'
                      : 'var(--admin-text-secondary, #475569)',
                    fontWeight: isLast ? 600 : 500,
                  }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: 'var(--admin-text-tertiary, #64748B)',
                  }}
                >
                  {separator ?? defaultSeparator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <style>{`
        .admin-breadcrumb-link:hover {
          color: var(--admin-accent-primary, #7C3AED) !important;
          text-decoration: underline !important;
        }
      `}</style>
    </nav>
  );
}
