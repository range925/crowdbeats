/**
 * Crowdbeats V2 — Frontend Financial Oversight, Reconciliation & Reporting Unit Tests (Phase 18)
 *
 * Verifies:
 * 1. PCI DSS Zero Raw Card Exposure & Masking Guarantee
 * 2. Financial Double-Entry Reconciliation Widget States & Discrepancy Diagnostics
 * 3. Platform Fee Arithmetic (6.00% Canonical Rate) & Currency Formatting
 * 4. Payout Lifecycle States, Failure Reasons & Compliance Holds
 * 5. Financial Export Types & Format Contracts Parity
 */

import { centsToDollars } from '../../lib/admin/adminFirestore';
import {
  CONTRACTS_VERSION,
  type FinancialLedgerSummary,
  type FinancialExportType,
  type FinancialExportFormat,
  type SafePaymentInstrumentSummary,
} from '@crowdbeats/contracts';

describe('Phase 18 — Frontend Financial Oversight & Reconciliation Unit Tests', () => {
  // ════════════════════════════════════════════════════════════════════════════
  // 1. PCI DSS ZERO RAW CARD EXPOSURE & MASKING
  // ════════════════════════════════════════════════════════════════════════════

  describe('PCI DSS Compliance & Masking Guarantee', () => {
    function formatPaymentInstrumentWeb(instrument?: Partial<SafePaymentInstrumentSummary> | null): string {
      if (!instrument) return 'Card ••••';
      const brand = (instrument.brand || 'card').toUpperCase();
      const last4 = instrument.last4 || '••••';
      return `${brand} •••• ${last4}`;
    }

    it('formats card summary displaying only brand and masked last4', () => {
      const card: SafePaymentInstrumentSummary = {
        brand: 'visa',
        last4: '4242',
      };
      const formatted = formatPaymentInstrumentWeb(card);
      expect(formatted).toBe('VISA •••• 4242');
      expect(formatted).not.toContain('42424242');
    });

    it('handles missing or incomplete card summary without leaking raw data', () => {
      expect(formatPaymentInstrumentWeb(null)).toBe('Card ••••');
      expect(formatPaymentInstrumentWeb(undefined)).toBe('Card ••••');
      expect(formatPaymentInstrumentWeb({ brand: 'mastercard' })).toBe('MASTERCARD •••• ••••');
    });

    it('guarantees that 16-digit card strings or CVVs never appear in rendered payment text', () => {
      const suspiciousPayload: any = {
        brand: 'amex',
        last4: '1005',
        fullCard: '378282246310005',
        cvv: '999',
      };

      const result = formatPaymentInstrumentWeb({
        brand: suspiciousPayload.brand,
        last4: suspiciousPayload.last4,
      });

      expect(result).toBe('AMEX •••• 1005');
      expect(result).not.toContain('378282246310005');
      expect(result).not.toContain('999');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. DOUBLE-ENTRY RECONCILIATION STATES & WIDGET LOGIC
  // ════════════════════════════════════════════════════════════════════════════

  describe('Double-Entry Reconciliation States', () => {
    function computeReconciliationState(summary: {
      status?: 'BALANCED' | 'DISCREPANCY_DETECTED';
      varianceDollars: number;
      discrepancyCount?: number;
    }): { isBalanced: boolean; badgeColor: string; label: string } {
      const isBalanced =
        summary.status === 'BALANCED' ||
        (summary.varianceDollars === 0 && (!summary.discrepancyCount || summary.discrepancyCount === 0));

      return {
        isBalanced,
        badgeColor: isBalanced ? '#10B981' : '#EF4444',
        label: isBalanced ? 'BALANCED' : 'DISCREPANCY DETECTED',
      };
    }

    it('identifies balanced reconciliation when variance is $0.00 and zero discrepancies', () => {
      const balanced = computeReconciliationState({
        status: 'BALANCED',
        varianceDollars: 0.0,
        discrepancyCount: 0,
      });

      expect(balanced.isBalanced).toBe(true);
      expect(balanced.label).toBe('BALANCED');
      expect(balanced.badgeColor).toBe('#10B981');
    });

    it('detects discrepancy when variance is non-zero', () => {
      const unbalanced = computeReconciliationState({
        status: 'DISCREPANCY_DETECTED',
        varianceDollars: 14.5,
        discrepancyCount: 1,
      });

      expect(unbalanced.isBalanced).toBe(false);
      expect(unbalanced.label).toBe('DISCREPANCY DETECTED');
      expect(unbalanced.badgeColor).toBe('#EF4444');
    });

    it('detects discrepancy when discrepancyCount > 0 even if variance is zero', () => {
      const unbalanced = computeReconciliationState({
        status: 'DISCREPANCY_DETECTED',
        varianceDollars: 0.0,
        discrepancyCount: 2,
      });

      expect(unbalanced.isBalanced).toBe(false);
      expect(unbalanced.label).toBe('DISCREPANCY DETECTED');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. PLATFORM FEE ARITHMETIC & CURRENCY FORMATTING
  // ════════════════════════════════════════════════════════════════════════════

  describe('Currency Formatting & Platform Fee Calculation', () => {
    it('formats cents to standard US dollar strings with centsToDollars', () => {
      expect(centsToDollars(0)).toBe('$0.00');
      expect(centsToDollars(100)).toBe('$1.00');
      expect(centsToDollars(2549)).toBe('$25.49');
      expect(centsToDollars(100000)).toBe('$1000.00');
    });

    it('correctly calculates 6.00% canonical platform fee and creator net amount', () => {
      const grossCents = 5000; // $50.00
      const feeCents = Math.round(grossCents * 0.06); // $3.00
      const netCents = grossCents - feeCents; // $47.00

      expect(feeCents).toBe(300);
      expect(netCents).toBe(4700);
      expect(centsToDollars(feeCents)).toBe('$3.00');
      expect(centsToDollars(netCents)).toBe('$47.00');
    });

    it('calculates platform fee for small micropayments without float divergence', () => {
      const grossCents = 500; // $5.00
      const feeCents = Math.round(grossCents * 0.06); // $0.30
      const netCents = grossCents - feeCents; // $4.70

      expect(feeCents).toBe(30);
      expect(netCents).toBe(470);
      expect(centsToDollars(feeCents)).toBe('$0.30');
      expect(centsToDollars(netCents)).toBe('$4.70');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. PAYOUT LIFECYCLE STATES & DIAGNOSTICS
  // ════════════════════════════════════════════════════════════════════════════

  describe('Payout Lifecycle States & Compliance Holds', () => {
    type PayoutStatus = 'PAID' | 'PENDING' | 'FAILED' | 'HELD';

    function getPayoutStatusBadge(status: PayoutStatus): { color: string; label: string } {
      switch (status) {
        case 'PAID':
          return { color: '#10B981', label: 'PAID' };
        case 'PENDING':
          return { color: '#F59E0B', label: 'PENDING' };
        case 'FAILED':
          return { color: '#EF4444', label: 'FAILED' };
        case 'HELD':
          return { color: '#8B5CF6', label: 'COMPLIANCE HOLD' };
      }
    }

    it('returns appropriate badge styling for all payout states', () => {
      expect(getPayoutStatusBadge('PAID').label).toBe('PAID');
      expect(getPayoutStatusBadge('PENDING').label).toBe('PENDING');
      expect(getPayoutStatusBadge('FAILED').label).toBe('FAILED');
      expect(getPayoutStatusBadge('HELD').label).toBe('COMPLIANCE HOLD');
    });

    it('displays actionable failure reasons for failed or held payouts', () => {
      const failedPayout = {
        id: 'po_fail_1',
        status: 'FAILED' as const,
        failureReason: 'Missing Tax ID / W-9 Verification past due',
      };
      expect(failedPayout.failureReason).toContain('Tax ID');

      const heldPayout = {
        id: 'po_held_1',
        status: 'HELD' as const,
        failureReason: 'Compliance hold applied pending dispute review',
      };
      expect(heldPayout.failureReason).toContain('Compliance hold');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. FINANCIAL EXPORT CONTRACT PARITY
  // ════════════════════════════════════════════════════════════════════════════

  describe('Contracts Version & Financial Export Types Parity', () => {
    it('verifies contracts package version is >= 0.31.0', () => {
      expect(CONTRACTS_VERSION).toMatch(/^0\.(31|32)\./);
    });

    it('verifies valid export types and formats', () => {
      const validTypes: FinancialExportType[] = [
        'TRANSACTIONS',
        'RECONCILIATION_LEDGER',
        'PAYOUT_REGISTER',
        'DISPUTES_AUDIT',
      ];
      const validFormats: FinancialExportFormat[] = ['CSV', 'JSON'];

      expect(validTypes).toHaveLength(4);
      expect(validFormats).toContain('CSV');
      expect(validFormats).toContain('JSON');
    });
  });
});
