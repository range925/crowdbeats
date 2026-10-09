/**
 * Crowdbeats V2 — StripeAdapter Unit Tests
 *
 * Verifies that StripeAdapter initializes properly with STRIPE_SECRET_KEY
 * and handles fallback cleanly in emulator/mock mode.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StripeAdapter } from '../stripe';

describe('StripeAdapter', () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalEnv;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
  });

  describe('Emulator / Mock Mode (STRIPE_SECRET_KEY absent)', () => {
    it('initializes in mock mode when STRIPE_SECRET_KEY is absent', () => {
      const adapter = new StripeAdapter();
      expect(adapter.isMockMode).toBe(true);
    });

    it('createPaymentIntent returns deterministic mock with pi_ prefix', async () => {
      const adapter = new StripeAdapter();
      const res = await adapter.createPaymentIntent({
        amountCents: 1000,
        currency: 'USD',
        customerId: 'cus_test',
        metadata: { tipId: 'tip_1' },
      });
      expect(res.id).toMatch(/^pi_mock_/);
      expect(res.client_secret).toBe(`${res.id}_secret_mock`);
    });

    it('createSetupIntent returns mock seti', async () => {
      const adapter = new StripeAdapter();
      const res = await adapter.createSetupIntent('cus_test');
      expect(res.id).toMatch(/^seti_mock_/);
      expect(res.client_secret).toBe(`${res.id}_secret_mock`);
    });

    it('createOrGetCustomer returns mock customer id', async () => {
      const adapter = new StripeAdapter();
      const res = await adapter.createOrGetCustomer('user_123', 'fan@example.com');
      expect(res.id).toMatch(/^cus_mock_/);
    });

    it('listPaymentMethods returns empty array in mock mode', async () => {
      const adapter = new StripeAdapter();
      const pms = await adapter.listPaymentMethods('cus_test');
      expect(pms).toEqual([]);
    });

    it('constructWebhookEvent parses JSON payload directly without signature', () => {
      const adapter = new StripeAdapter();
      const event = adapter.constructWebhookEvent(
        JSON.stringify({ id: 'evt_123', type: 'payout.paid' }),
        'sig_mock',
        'whsec_mock',
      );
      expect(event.id).toBe('evt_123');
      expect(event.type).toBe('payout.paid');
    });

    it('createRefund returns mock refund id', async () => {
      const adapter = new StripeAdapter();
      const res = await adapter.createRefund('pi_123', 500);
      expect(res.id).toMatch(/^re_mock_/);
    });

    it('createConnectAccount returns acct_mock_ id', async () => {
      const adapter = new StripeAdapter();
      const res = await adapter.createConnectAccount('creator_456', 'creator@example.com');
      expect(res.id).toMatch(/^acct_mock_/);
    });

    it('createConnectAccountLink returns mock onboarding link', async () => {
      const adapter = new StripeAdapter();
      const url = await adapter.createConnectAccountLink(
        'acct_123',
        'https://crowdbeats.ai/refresh',
        'https://crowdbeats.ai/return',
      );
      expect(url).toBe('https://connect.stripe.com/mock-onboarding/acct_123');
    });

    it('getConnectAccountStatus returns fully enabled mock status', async () => {
      const adapter = new StripeAdapter();
      const status = await adapter.getConnectAccountStatus('acct_123');
      expect(status.chargesEnabled).toBe(true);
      expect(status.payoutsEnabled).toBe(true);
      expect(status.bankPayoutReadiness).toBe('ready');
      expect(status.creatorVerificationState).toBe('verified');
      expect(status.requiresAction).toBe(false);
    });

    it('createTransfer returns mock transfer id with tr_ prefix', async () => {
      const adapter = new StripeAdapter();
      const res = await adapter.createTransfer({
        amountCents: 2000,
        currency: 'USD',
        destinationAccountId: 'acct_123',
        metadata: { payoutId: 'p_1' },
      });
      expect(res.id).toMatch(/^tr_mock_/);
    });

    it('checkConnectivity returns true in mock mode', async () => {
      const adapter = new StripeAdapter();
      const ok = await adapter.checkConnectivity();
      expect(ok).toBe(true);
    });
  });

  describe('Live Mode (STRIPE_SECRET_KEY configured)', () => {
    it('initializes real Stripe instance when STRIPE_SECRET_KEY is present', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_mock_key_for_unit_tests';
      const adapter = new StripeAdapter();
      expect(adapter.isMockMode).toBe(false);
    });

    it('cleans up and falls back to mock mode if STRIPE_SECRET_KEY is removed', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_mock_key_for_unit_tests';
      const adapter = new StripeAdapter();
      expect(adapter.isMockMode).toBe(false);

      // Dynamically unset
      delete process.env.STRIPE_SECRET_KEY;
      expect(adapter.isMockMode).toBe(true);
    });
  });
});
