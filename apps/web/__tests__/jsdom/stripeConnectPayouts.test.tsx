/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import CreatorPayoutsPage from '../../app/(creator)/creator/payouts/page';
import BandPayoutsPage from '../../app/(band)/band/payouts/page';
import * as functionsModule from '../../lib/firebase/functions';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Stripe libraries
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue(null),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardElement: () => <div data-testid="mock-card-element" />,
  PaymentRequestButtonElement: () => <div data-testid="mock-payment-request" />,
  useStripe: () => null,
  useElements: () => null,
}));

describe('Stripe Connect Onboarding & Payouts Client Workflows', () => {
  let container: HTMLDivElement;
  let root: Root;
  let callCallableSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    callCallableSpy = jest.spyOn(functionsModule, 'callCallableFunction');
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  describe('Creator Payouts Page (/creator/payouts)', () => {
    it('queries getConnectStatus on mount and displays Active & Verified badge when account is ready', async () => {
      callCallableSpy.mockImplementation((name: string) => {
        if (name === 'getConnectStatus') {
          return Promise.resolve({
            accountId: 'acct_active_123',
            chargesEnabled: true,
            payoutsEnabled: true,
            detailsSubmitted: true,
            disabledReason: null,
            requirementsDue: [],
            bankPayoutReadiness: 'ready',
            creatorVerificationState: 'verified',
            requiresAction: false,
            actionType: null,
          });
        }
        return Promise.reject(new Error(`Unexpected function ${name}`));
      });

      await act(async () => {
        root.render(<CreatorPayoutsPage />);
      });

      expect(callCallableSpy).toHaveBeenCalledWith('getConnectStatus', {});
      expect(container.textContent).toContain('Active & Verified');
      expect(container.textContent).toContain('acct_active_123');
      expect(container.textContent).toContain('Update Payout Account');
    });

    it('displays Requirements Due badge when account has missing verification items', async () => {
      callCallableSpy.mockImplementation((name: string) => {
        if (name === 'getConnectStatus') {
          return Promise.resolve({
            accountId: 'acct_pending_456',
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: true,
            disabledReason: 'requirements.past_due',
            requirementsDue: ['individual.verification.document'],
            bankPayoutReadiness: 'action_required',
            creatorVerificationState: 'pending',
            requiresAction: true,
            actionType: 'update_information',
          });
        }
        return Promise.reject(new Error(`Unexpected function ${name}`));
      });

      await act(async () => {
        root.render(<CreatorPayoutsPage />);
      });

      expect(container.textContent).toContain('Requirements Due');
      expect(container.textContent).toContain('individual.verification.document');
      expect(container.textContent).toContain('Complete Requirements');
    });

    it('displays Onboarding Required badge when creator has not connected an account', async () => {
      callCallableSpy.mockImplementation((name: string) => {
        if (name === 'getConnectStatus') {
          return Promise.resolve({
            accountId: null,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            disabledReason: null,
            requirementsDue: [],
            bankPayoutReadiness: 'not_created',
            creatorVerificationState: 'unverified',
            requiresAction: true,
            actionType: 'create_account',
          });
        }
        return Promise.reject(new Error(`Unexpected function ${name}`));
      });

      await act(async () => {
        root.render(<CreatorPayoutsPage />);
      });

      expect(container.textContent).toContain('Onboarding Required');
      expect(container.textContent).toContain('Set Up Payout Account');
    });

    it('calls createConnectLink callable and surfaces Stripe hosted onboarding link', async () => {
      callCallableSpy.mockImplementation((name: string, data: any) => {
        if (name === 'getConnectStatus') {
          return Promise.resolve({
            accountId: null,
            chargesEnabled: false,
            payoutsEnabled: false,
            requiresAction: true,
          });
        }
        if (name === 'createConnectLink') {
          return Promise.resolve({
            accountId: 'acct_new_789',
            accountLinkUrl: 'https://connect.stripe.com/setup/s/mock_link_token',
          });
        }
        return Promise.reject(new Error(`Unexpected function ${name}`));
      });

      await act(async () => {
        root.render(<CreatorPayoutsPage />);
      });

      const setupButton = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Set Up Payout Account')
      );
      expect(setupButton).toBeDefined();

      await act(async () => {
        setupButton!.click();
      });

      expect(callCallableSpy).toHaveBeenCalledWith(
        'createConnectLink',
        expect.objectContaining({
          creatorType: 'artist',
        })
      );

      const onboardingLink = container.querySelector('a[href*="connect.stripe.com"]');
      expect(onboardingLink).not.toBeNull();
      expect(onboardingLink?.getAttribute('href')).toBe('https://connect.stripe.com/setup/s/mock_link_token');
    });

    it('calls requestPayout callable with minor integer cents and USD currency', async () => {
      callCallableSpy.mockImplementation((name: string, data: any) => {
        if (name === 'getConnectStatus') {
          return Promise.resolve({
            accountId: 'acct_ready_999',
            chargesEnabled: true,
            payoutsEnabled: true,
            requiresAction: false,
          });
        }
        if (name === 'requestPayout') {
          return Promise.resolve({
            payoutId: 'payout_abc_123',
            amountCents: data.amountCents,
            stripeTransferId: 'tr_mock_transfer_999',
          });
        }
        return Promise.reject(new Error(`Unexpected function ${name}`));
      });

      await act(async () => {
        root.render(<CreatorPayoutsPage />);
      });

      const transferButton = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Transfer to Bank')
      );
      expect(transferButton).toBeDefined();

      await act(async () => {
        transferButton!.click();
      });

      // Default amount is $50 -> 5000 cents
      expect(callCallableSpy).toHaveBeenCalledWith('requestPayout', {
        amountCents: 5000,
        currency: 'USD',
      });

      expect(container.textContent).toContain('payout_abc_123');
      expect(container.textContent).toContain('tr_mock_transfer_999');
    });

    it('enforces minimum $10.00 payout amount before executing requestPayout', async () => {
      callCallableSpy.mockImplementation((name: string) => {
        if (name === 'getConnectStatus') {
          return Promise.resolve({
            accountId: 'acct_ready_999',
            chargesEnabled: true,
            payoutsEnabled: true,
          });
        }
        return Promise.resolve({});
      });

      await act(async () => {
        root.render(<CreatorPayoutsPage />);
      });

      const input = container.querySelector('input[type="number"][min="10"]') as HTMLInputElement;
      expect(input).toBeDefined();

      await act(async () => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        nativeSetter?.call(input, '5');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      const payoutForm = input.closest('form');
      expect(payoutForm).not.toBeNull();

      await act(async () => {
        payoutForm!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      });

      expect(container.textContent).toContain('Minimum payout request is $10.00.');
      expect(callCallableSpy).not.toHaveBeenCalledWith('requestPayout', expect.anything());
    });
  });

  describe('Band Payouts Page (/band/payouts)', () => {
    it('queries getConnectStatus on mount and calls createConnectLink with creatorType: band', async () => {
      callCallableSpy.mockImplementation((name: string, data: any) => {
        if (name === 'getConnectStatus') {
          return Promise.resolve({
            accountId: null,
            chargesEnabled: false,
            payoutsEnabled: false,
            requiresAction: true,
            actionType: 'create_account',
          });
        }
        if (name === 'createConnectLink') {
          return Promise.resolve({
            accountId: 'acct_band_111',
            accountLinkUrl: 'https://connect.stripe.com/setup/s/band_onboarding_token',
          });
        }
        return Promise.reject(new Error(`Unexpected function ${name}`));
      });

      await act(async () => {
        root.render(<BandPayoutsPage />);
      });

      expect(callCallableSpy).toHaveBeenCalledWith('getConnectStatus', {});
      expect(container.textContent).toContain('Onboarding Required');

      const setupButton = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Set Up Band Payout Account')
      );
      expect(setupButton).toBeDefined();

      await act(async () => {
        setupButton!.click();
      });

      expect(callCallableSpy).toHaveBeenCalledWith(
        'createConnectLink',
        expect.objectContaining({
          creatorType: 'band',
        })
      );

      const onboardingLink = container.querySelector('a[href*="connect.stripe.com"]');
      expect(onboardingLink).not.toBeNull();
      expect(onboardingLink?.getAttribute('href')).toBe('https://connect.stripe.com/setup/s/band_onboarding_token');
    });
  });
});
