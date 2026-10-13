/**
 * Crowdbeats V2 — Phase 20: Google Stitch UX Refinement Unit Tests
 *
 * Validates:
 * 1. FreshnessBadge component rendering across REAL_TIME, DELAYED, and ESTIMATED states
 * 2. Stitch semantic design token integrity (Obsidian Dark, Apple Light, High Contrast, Font Stacks)
 * 3. Responsive table layouts, touch target ergonomics, and tabular numeral alignment
 * 4. Dual-theme compatibility across Admin CRM, Creator CRM, and Sponsor CRM
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { FreshnessBadge } from '../../components/shared/FreshnessBadge';

describe('Google Stitch UX Refinement Suite (Phase 20)', () => {
  describe('1. FreshnessBadge Component', () => {
    test('renders REAL_TIME badge with live indicator and accessibility attributes', () => {
      const html = renderToStaticMarkup(
        React.createElement(FreshnessBadge, {
          freshness: 'REAL_TIME',
          calculatedAt: '2026-10-13T12:00:00.000Z',
        })
      );
      expect(html).toContain('REAL-TIME');
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-label="Metric freshness: REAL-TIME"');
      expect(html).toContain('rgba(16, 185, 129, 0.12)'); // Emerald tint
    });

    test('renders DELAYED badge with latency in minutes', () => {
      const html = renderToStaticMarkup(
        React.createElement(FreshnessBadge, {
          freshness: 'DELAYED',
          delaySeconds: 900, // 15 mins
        })
      );
      expect(html).toContain('DELAYED (~15m)');
      expect(html).toContain('#D97706'); // Amber text
      expect(html).toContain('rgba(245, 158, 11, 0.12)'); // Amber tint
    });

    test('renders ESTIMATED badge with margin-of-error and confidence tooltip', () => {
      const html = renderToStaticMarkup(
        React.createElement(FreshnessBadge, {
          freshness: 'ESTIMATED',
          sampling: {
            isSampled: true,
            sampleRate: 0.1,
            confidenceLevel: 0.95,
            marginOfErrorPct: 3.5,
          },
        })
      );
      expect(html).toContain('ESTIMATED (±3.5%)');
      expect(html).toContain('95% confidence');
      expect(html).toContain('±3.5% margin of error');
      expect(html).toContain('#0284C7'); // Sky blue text
    });
  });

  describe('2. Authoritative Stitch Design Tokens Integrity', () => {
    const tokensCssPath = path.resolve(__dirname, '../../app/tokens.css');
    const designMdPath = path.resolve(__dirname, '../../../../.stitch/DESIGN.md');

    test('tokens.css contains authoritative Stitch dual-mode palette', () => {
      const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');

      // Light mode tokens
      expect(tokensCss).toContain('--cb-bg-app:            #FBFBFD');
      expect(tokensCss).toContain('--cb-surface-1:         #FFFFFF');
      expect(tokensCss).toContain('--cb-purple-main:       #7C3AED');
      expect(tokensCss).toContain('--cb-text-primary:      #1D1D1F');

      // Dark mode tokens
      expect(tokensCss).toContain('--cb-bg-app:            #000000');
      expect(tokensCss).toContain('--cb-surface-1:         #161617');
      expect(tokensCss).toContain('--cb-text-primary:      #F5F5F7');
      expect(tokensCss).toContain('--cb-live-green:        #30D158');

      // Admin console tokens
      expect(tokensCss).toContain('--admin-surface-card:      #FFFFFF');
      expect(tokensCss).toContain('--admin-surface-card:      #162032');
    });

    test('.stitch/DESIGN.md specifies Stitch loop visual standards', () => {
      const designMd = fs.readFileSync(designMdPath, 'utf8');
      expect(designMd).toContain('Obsidian');
      expect(designMd).toContain('JetBrains Mono');
      expect(designMd).toContain('DM Sans');
      expect(designMd).toContain('NO hard-coded single-theme colors');
    });
  });

  describe('3. Admin CRM Stitch UX Inspection', () => {
    const adminCrmPagePath = path.resolve(__dirname, '../../app/(admin)/admin/crm/page.tsx');

    test('Admin CRM consumes semantic CSS variables and avoids hardcoded themes', () => {
      const pageCode = fs.readFileSync(adminCrmPagePath, 'utf8');

      // Verified semantic variables
      expect(pageCode).toContain('var(--admin-surface-card, #FFFFFF)');
      expect(pageCode).toContain('var(--admin-border-subtle, #E2E8F0)');
      expect(pageCode).toContain('var(--admin-text-primary, #0F172A)');
      expect(pageCode).toContain('var(--admin-text-secondary, #64748B)');

      // Tabular numerals for financial subledgers
      expect(pageCode).toContain('fontFamily: \'var(--cb-font-mono, monospace)\'');
      expect(pageCode).toContain('fontVariantNumeric: \'tabular-nums\'');
    });
  });

  describe('4. Creator CRM Stitch UX Inspection', () => {
    const creatorFansPagePath = path.resolve(__dirname, '../../app/(creator)/creator/fans/page.tsx');

    test('Creator CRM has responsive table wrapper and dual-theme modal styling', () => {
      const pageCode = fs.readFileSync(creatorFansPagePath, 'utf8');

      // Overflow horizontal scroll wrapper for responsive mobile parity
      expect(pageCode).toContain('overflowX: \'auto\'');
      expect(pageCode).toContain('WebkitOverflowScrolling: \'touch\'');

      // Tabular numbers in bento cards and supporter list
      expect(pageCode).toContain('fontFamily: \'var(--cb-font-mono, monospace)\'');
      expect(pageCode).toContain('fontVariantNumeric: \'tabular-nums\'');

      // Dual-theme tokens on compose modal
      expect(pageCode).toContain('var(--cb-surface-1, #FFFFFF)');
      expect(pageCode).toContain('var(--cb-surface-2, #F4F4F6)');
      expect(pageCode).toContain('var(--cb-text-primary, #1D1D1F)');
      expect(pageCode).toContain('var(--cb-purple-main, #7C3AED)');
    });
  });

  describe('5. Sponsor CRM Stitch UX Inspection', () => {
    const sponsorAnalyticsPagePath = path.resolve(__dirname, '../../app/(sponsor)/sponsor/analytics/page.tsx');
    const sponsorOpportunitiesPath = path.resolve(__dirname, '../../app/(sponsor)/sponsor/opportunities/page.tsx');
    const sponsorShortlistPath = path.resolve(__dirname, '../../app/(sponsor)/sponsor/shortlist/page.tsx');
    const sponsorSponsorshipsPath = path.resolve(__dirname, '../../app/(sponsor)/sponsor/sponsorships/page.tsx');

    test('Sponsor Analytics Dashboard features FreshnessBadge integration and dual-mode layout', () => {
      const pageCode = fs.readFileSync(sponsorAnalyticsPagePath, 'utf8');

      expect(pageCode).toContain('FreshnessBadge');
      expect(pageCode).toContain('freshness="ESTIMATED"');
      expect(pageCode).toContain('freshness="REAL_TIME"');
      expect(pageCode).toContain('fontFamily: \'var(--cb-font-mono, monospace)\'');
      expect(pageCode).toContain('overflowX: \'auto\'');
      expect(pageCode).toContain('WebkitOverflowScrolling: \'touch\'');
    });

    test('Sponsor Opportunities, Shortlist, and Sponsorships include responsive scroll and backdrop blur', () => {
      const oppsCode = fs.readFileSync(sponsorOpportunitiesPath, 'utf8');
      const shortlistCode = fs.readFileSync(sponsorShortlistPath, 'utf8');
      const dealsCode = fs.readFileSync(sponsorSponsorshipsPath, 'utf8');

      expect(oppsCode).toContain('overflowX: \'auto\'');
      expect(oppsCode).toContain('backdropFilter: \'blur(8px)\'');

      expect(shortlistCode).toContain('overflowX: \'auto\'');
      expect(shortlistCode).toContain('backdropFilter: \'blur(8px)\'');

      expect(dealsCode).toContain('overflowX: \'auto\'');
      expect(dealsCode).toContain('backdropFilter: \'blur(8px)\'');
    });
  });
});
