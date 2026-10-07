'use client';

import React, { useState } from 'react';
import { DownloadIcon, RefreshIcon } from './AdminIcons';

export interface ExportStatusProps {
  entityName: string;
  totalCount: number;
  onExport: (format: 'csv' | 'json') => Promise<void> | void;
  disabled?: boolean;
  disabledTooltip?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ExportStatus: React.FC<ExportStatusProps> = ({
  entityName,
  totalCount,
  onExport,
  disabled = false,
  disabledTooltip,
  className = '',
  style,
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    if (disabled || exporting) return;
    setExporting(true);
    try {
      await onExport(format);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className={`admin-export-status ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled || exporting}
        title={disabled ? disabledTooltip : `Export ${totalCount} ${entityName} records`}
        onClick={() => handleExport('csv')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid var(--admin-border-subtle, #E2E8F0)',
          background: 'var(--admin-surface-card, #FFFFFF)',
          color: disabled ? 'var(--admin-text-tertiary, #94A3B8)' : 'var(--admin-text-secondary, #64748B)',
          fontSize: 12,
          fontWeight: 600,
          cursor: disabled || exporting ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {exporting ? (
          <RefreshIcon size={12} className="admin-spin" />
        ) : (
          <DownloadIcon size={12} />
        )}
        <span>{exporting ? 'Generating…' : 'Export CSV'}</span>
      </button>

      <button
        type="button"
        disabled={disabled || exporting}
        title={disabled ? disabledTooltip : `Export ${totalCount} ${entityName} records as JSON`}
        onClick={() => handleExport('json')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid var(--admin-border-subtle, #E2E8F0)',
          background: 'var(--admin-surface-card, #FFFFFF)',
          color: disabled ? 'var(--admin-text-tertiary, #94A3B8)' : 'var(--admin-text-secondary, #64748B)',
          fontSize: 12,
          fontWeight: 600,
          cursor: disabled || exporting ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span>JSON</span>
      </button>

      <style>{`
        @keyframes adminSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .admin-spin {
          animation: adminSpin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
