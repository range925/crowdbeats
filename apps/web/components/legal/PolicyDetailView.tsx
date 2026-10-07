'use client';

/**
 * Crowdbeats V2 — Policy Detail Client View
 *
 * Implements the Sonic Precision design system for individual legal policies:
 * - Breadcrumbs and metadata pill badges (Version, Effective Date, Jurisdiction, Ledger Hash)
 * - Elevated bento container for the rendered markdown policy
 * - Responsive light and dark mode parity
 * - Quick legal navigation strip
 */

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import { PolicyMarkdownRenderer } from '@/components/legal/PolicyMarkdownRenderer';
import type { PolicyMetadata } from '@crowdbeats/contracts';

interface PolicyDetailViewProps {
  meta: PolicyMetadata;
  content: string;
}

export const PolicyDetailView: React.FC<PolicyDetailViewProps> = ({ meta, content }) => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const cardBg = isLight ? '#FFFFFF' : '#161617';
  const innerBoxBg = isLight ? '#F5F5F7' : '#1D1D1F';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#1D1D1F' : '#F5F5F7';
  const textSecondary = isLight ? '#6E6E73' : '#86868B';
  const textMuted = isLight ? '#86868B' : '#6E6E73';

  return (
    <article style={{ color: textSecondary, lineHeight: '1.6', fontFamily: 'var(--cb-font-body)' }}>
      {/* ── BREADCRUMB & METADATA HEADER ─────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Link
            href="/legal"
            style={{
              color: isLight ? '#000000' : '#F5F5F7',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <span>←</span>
            <span>Back to Legal & Compliance Portal</span>
          </Link>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href="/legal/support"
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#FFFFFF',
                backgroundColor: '#000000',
                padding: '6px 16px',
                borderRadius: 9999,
                textDecoration: 'none',
                boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(255, 255, 255, 0.1)',
                transition: 'all 0.15s ease',
              }}
            >
              Need Help? Open Ticket →
            </Link>
          </div>
        </div>

        {/* Metadata Badges */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isLight ? '#0F766E' : '#2DD4BF',
              backgroundColor: isLight ? 'rgba(45, 212, 191, 0.12)' : 'rgba(45, 212, 191, 0.1)',
              border: `1px solid ${isLight ? 'rgba(45, 212, 191, 0.25)' : 'rgba(45, 212, 191, 0.2)'}`,
              padding: '3px 10px',
              borderRadius: 9999,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Active & Enforced
          </span>
          <span style={{ fontSize: '0.85rem', color: textSecondary, fontWeight: 500 }}>
            Version: <strong style={{ color: textPrimary }}>{meta.version}</strong>
          </span>
          <span style={{ color: borderColor }}>•</span>
          <span style={{ fontSize: '0.85rem', color: textSecondary, fontWeight: 500 }}>
            Effective: <strong style={{ color: textPrimary }}>{meta.effectiveDate}</strong>
          </span>
          <span style={{ color: borderColor }}>•</span>
          <span style={{ fontSize: '0.85rem', color: textSecondary }}>
            Jurisdiction: <strong style={{ color: textPrimary }}>California, USA</strong>
          </span>
        </div>

        {/* SHA-256 Ledger Hash Pill */}
        <div
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--cb-font-mono, SF Mono, Menlo, monospace)',
            color: textMuted,
            backgroundColor: innerBoxBg,
            padding: '10px 16px',
            borderRadius: 14,
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span>
            SHA-256 Ledger Hash: <code style={{ color: isLight ? '#000000' : '#F5F5F7', fontWeight: 600 }}>{meta.sha256Hash}</code>
          </span>
          <span style={{ color: textMuted }}>Governed by California Law</span>
        </div>
      </div>

      {/* ── PARSED POLICY CONTENT BENTO CONTAINER ────────────────────── */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 24,
          padding: 'clamp(28px, 4vw, 44px) clamp(24px, 4vw, 40px)',
          boxShadow: isLight
            ? '0 2px 14px rgba(0, 0, 0, 0.04)'
            : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
          transition: 'all 0.25s ease',
        }}
      >
        <PolicyMarkdownRenderer content={content} />
      </div>

      {/* ── FOOTER ACTIONS ───────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Link
          href="/legal"
          style={{
            color: isLight ? '#000000' : '#F5F5F7',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          ← All Policies & Agreements
        </Link>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/legal/copyright-report"
            style={{
              color: '#EC4899',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            DMCA Notice Form
          </Link>
          <span style={{ color: borderColor }}>•</span>
          <Link
            href="/legal/report-abuse"
            style={{
              color: '#EF4444',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Report Abuse
          </Link>
          <span style={{ color: borderColor }}>•</span>
          <Link
            href="/legal/support"
            style={{
              color: isLight ? '#000000' : '#F5F5F7',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Customer Support
          </Link>
        </div>
      </div>
    </article>
  );
};
