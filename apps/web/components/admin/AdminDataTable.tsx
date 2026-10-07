'use client';

import React from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './AdminIcons';

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
  width?: string | number;
}

export interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyStateMessage?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function AdminDataTable<T extends { id?: string | number } = any>({
  data,
  columns,
  loading = false,
  onRowClick,
  emptyStateMessage = 'No results found.',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  sortKey,
  sortDirection,
  onSort,
  className = '',
  style,
}: AdminDataTableProps<T>) {
  if (loading) {
    return (
      <div
        className="admin-table-loading"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
          borderRadius: '10px',
          border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
          boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: '42px',
              background: 'var(--admin-surface-raised, var(--surface-raised, #F1F5F9))',
              borderRadius: '6px',
              animation: 'adminPulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes adminPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.25; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`admin-table-container ${className}`.trim()}
      style={{
        width: '100%',
        overflowX: 'auto',
        background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
        borderRadius: '10px',
        border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
        boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
        ...style,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
        }}
        role="grid"
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
              background: 'var(--admin-surface-raised, var(--surface-raised, #F1F5F9))',
            }}
          >
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const align = col.align || (col.numeric ? 'right' : 'left');

              return (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isSorted
                      ? 'var(--admin-text-primary, #0F172A)'
                      : 'var(--admin-text-secondary, #64748B)',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    textAlign: align,
                    width: col.width,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    transition: 'color 0.15s ease',
                  }}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                  tabIndex={col.sortable ? 0 : undefined}
                  role="columnheader"
                  aria-sort={
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      justifyContent:
                        align === 'right'
                          ? 'flex-end'
                          : align === 'center'
                          ? 'center'
                          : 'flex-start',
                    }}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: isSorted
                            ? 'var(--admin-accent-primary, #7C3AED)'
                            : 'var(--admin-text-tertiary, #94A3B8)',
                          opacity: isSorted ? 1 : 0.4,
                        }}
                        aria-hidden="true"
                      >
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUpIcon size={12} strokeWidth={2.4} />
                          ) : (
                            <ArrowDownIcon size={12} strokeWidth={2.4} />
                          )
                        ) : (
                          <span style={{ fontSize: '10px' }}>↕</span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '52px 16px',
                  textAlign: 'center',
                  color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
                  fontSize: '14px',
                }}
              >
                {emptyStateMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => {
              const isLast = idx === data.length - 1;
              return (
                <tr
                  key={item.id ?? idx}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{
                    borderBottom: isLast
                      ? 'none'
                      : '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.12s ease',
                  }}
                  className={onRowClick ? 'admin-table-row-clickable' : 'admin-table-row'}
                  role="row"
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((col) => {
                    const align = col.align || (col.numeric ? 'right' : 'left');
                    return (
                      <td
                        key={col.key}
                        style={{
                          padding: '13px 16px',
                          fontSize: '13px',
                          color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                          textAlign: align,
                          fontVariantNumeric: col.numeric ? 'tabular-nums' : undefined,
                        }}
                        role="cell"
                      >
                        {col.cell(item)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderTop: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
            background: 'var(--admin-surface-card, #FFFFFF)',
          }}
        >
          <span
            className="admin-tabular-nums"
            style={{
              fontSize: '12px',
              color: 'var(--admin-text-secondary, #64748B)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                background:
                  currentPage <= 1
                    ? 'transparent'
                    : 'var(--admin-surface-raised, #F1F5F9)',
                color:
                  currentPage <= 1
                    ? 'var(--admin-text-tertiary, #94A3B8)'
                    : 'var(--admin-text-primary, #0F172A)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.45 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeftIcon size={14} strokeWidth={2} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                background:
                  currentPage >= totalPages
                    ? 'transparent'
                    : 'var(--admin-surface-raised, #F1F5F9)',
                color:
                  currentPage >= totalPages
                    ? 'var(--admin-text-tertiary, #94A3B8)'
                    : 'var(--admin-text-primary, #0F172A)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.45 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Next</span>
              <ChevronRightIcon size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .admin-table-row:hover {
          background-color: var(--admin-surface-hover, rgba(0, 0, 0, 0.02)) !important;
        }
        .admin-table-row-clickable:hover {
          background-color: var(--admin-surface-hover, rgba(124, 58, 237, 0.05)) !important;
        }
      `}</style>
    </div>
  );
}
