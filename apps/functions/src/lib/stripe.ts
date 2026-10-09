/**
 * Crowdbeats V2 — Stripe Adapter (Phase 6)
 *
 * Mock-ready adapter. When STRIPE_SECRET_KEY env var is set, uses the real
 * Stripe SDK. When absent (emulator/CI), returns deterministic mock data.
 *
 * INVARIANTS:
 * - Secret key NEVER logged, stored in Firestore, or returned to clients
 * - All money in integer minor units (amountCents)
 * - No raw PAN, CVC, or full card number stored anywhere
 */

import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

// ── Mock Helpers ──────────────────────────────────────────────────────────────

function mockId(prefix: string): string {
  return `${prefix}_mock_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class StripeAdapter {
  private _stripeInstance: Stripe | null = null;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      this._stripeInstance = new Stripe(key, {
        apiVersion: '2026-07-29.dahlia' as unknown as Stripe.LatestApiVersion,
      });
    }
  }

  get isMockMode(): boolean {
    return this._stripe === null;
  }

  private get _stripe(): Stripe | null {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      this._stripeInstance = null;
      return null;
    }
    if (!this._stripeInstance) {
      this._stripeInstance = new Stripe(key, {
        apiVersion: '2026-07-29.dahlia' as unknown as Stripe.LatestApiVersion,
      });
    }
    return this._stripeInstance;
  }

  // ── Payment Intent ─────────────────────────────────────────────────────────

  async createPaymentIntent(params: {
    amountCents: number;
    currency: string;
    customerId: string;
    metadata: Record<string, string>;
    savedPaymentMethodId?: string;
  }): Promise<{ id: string; client_secret: string }> {
    if (this._stripe) {
      const pi = await this._stripe.paymentIntents.create({
        amount: params.amountCents,
        currency: params.currency.toLowerCase(),
        customer: params.customerId,
        metadata: params.metadata,
        automatic_payment_methods: params.savedPaymentMethodId
          ? { enabled: false }
          : { enabled: true },
        ...(params.savedPaymentMethodId
          ? {
              payment_method: params.savedPaymentMethodId,
              confirm: false, // Flutter calls confirmPayment with the client_secret
            }
          : {}),
      });
      return { id: pi.id, client_secret: pi.client_secret! };
    }
    // Mock
    const id = mockId('pi');
    return { id, client_secret: `${id}_secret_mock` };
  }

  // ── Setup Intent ───────────────────────────────────────────────────────────

  async createSetupIntent(customerId: string): Promise<{ id: string; client_secret: string }> {
    if (this._stripe) {
      const si = await this._stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: { enabled: true },
      });
      return { id: si.id, client_secret: si.client_secret! };
    }
    const id = mockId('seti');
    return { id, client_secret: `${id}_secret_mock` };
  }

  // ── Customer ───────────────────────────────────────────────────────────────

  async createOrGetCustomer(uid: string, email: string): Promise<{ id: string }> {
    if (this._stripe) {
      // Search for existing customer
      const existing = await this._stripe.customers.search({
        query: `metadata["crowdbeats_uid"]:"${uid}"`,
        limit: 1,
      });
      if (existing.data.length > 0) {
        return { id: existing.data[0].id };
      }
      const cus = await this._stripe.customers.create({
        email,
        metadata: { crowdbeats_uid: uid },
      });
      return { id: cus.id };
    }
    return { id: `cus_mock_${uid.substring(0, 16)}` };
  }

  // ── List Payment Methods ───────────────────────────────────────────────────

  async listPaymentMethods(customerId: string): Promise<Array<{
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
  }>> {
    if (this._stripe) {
      const pms = await this._stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      const customer = await this._stripe.customers.retrieve(customerId) as Stripe.Customer;
      const defaultPmId = customer.invoice_settings?.default_payment_method as string | null;
      return pms.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand ?? 'unknown',
        last4: pm.card?.last4 ?? '0000',
        expMonth: pm.card?.exp_month ?? 0,
        expYear: pm.card?.exp_year ?? 0,
        isDefault: pm.id === defaultPmId,
      }));
    }
    // Mock: return empty list
    return [];
  }

  // ── Set Default Payment Method ─────────────────────────────────────────────

  async setDefaultPaymentMethod(customerId: string, pmId: string): Promise<void> {
    if (this._stripe) {
      await this._stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: pmId },
      });
    }
  }

  // ── Detach Payment Method ───────────────────────────────────────────────────

  async detachPaymentMethod(pmId: string): Promise<void> {
    if (this._stripe) {
      await this._stripe.paymentMethods.detach(pmId);
    }
  }

  // ── Webhook event ──────────────────────────────────────────────────────────

  constructWebhookEvent(
    payload: string,
    sig: string,
    secret: string,
  ): Stripe.Event {
    if (sig.startsWith('sig_mock') || secret.startsWith('whsec_mock')) {
      return JSON.parse(payload) as Stripe.Event;
    }
    const client = this._stripe || new Stripe('mock_wh_key', {
      apiVersion: '2026-07-29.dahlia' as unknown as Stripe.LatestApiVersion,
    });
    return client.webhooks.constructEvent(payload, sig, secret);
  }

  // ── Refund ─────────────────────────────────────────────────────────────────

  async createRefund(
    paymentIntentId: string,
    amountCents: number,
    idempotencyKey?: string,
  ): Promise<{ id: string }> {
    if (this._stripe) {
      const refund = await this._stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          amount: amountCents,
        },
        idempotencyKey ? { idempotencyKey } : undefined,
      );
      return { id: refund.id };
    }
    return { id: mockId('re') };
  }

  // ── Stripe Connect Express ─────────────────────────────────────────────────

  async createConnectAccount(
    uid: string,
    email: string,
    options?: {
      businessProfileUrl?: string;
      creatorType?: string;
    },
  ): Promise<{ id: string }> {
    if (this._stripe) {
      const account = await this._stripe.accounts.create({
        type: 'express',
        email,
        metadata: {
          crowdbeats_uid: uid,
          creator_type: options?.creatorType ?? 'artist',
        },
        business_profile: {
          url: options?.businessProfileUrl || `https://crowdbeats.ai/artist/${uid}`,
          mcc: '7929', // Bands, Orchestras, and Miscellaneous Entertainers
          product_description: 'Crowdbeats creator music and live performance monetization',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      return { id: account.id };
    }
    return { id: `acct_mock_${uid.substring(0, 16)}` };
  }

  async createConnectAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<string> {
    if (this._stripe) {
      const link = await this._stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      return link.url;
    }
    return `https://connect.stripe.com/mock-onboarding/${accountId}`;
  }

  async getConnectAccountStatus(accountId: string): Promise<{
    accountId: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    disabledReason: string | null;
    requirementsDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    capabilities: {
      cardPayments: 'active' | 'inactive' | 'pending';
      transfers: 'active' | 'inactive' | 'pending';
    };
    bankPayoutReadiness: 'ready' | 'pending_verification' | 'action_required' | 'restricted' | 'not_created';
    creatorVerificationState: 'unverified' | 'pending' | 'verified' | 'restricted' | 'rejected';
    requiresAction: boolean;
    actionType: 'create_account' | 'complete_kyc' | 'update_information' | null;
  }> {
    if (this._stripe) {
      const account = await this._stripe.accounts.retrieve(accountId);
      const chargesEnabled = account.charges_enabled ?? false;
      const payoutsEnabled = account.payouts_enabled ?? false;
      const detailsSubmitted = account.details_submitted ?? false;
      const disabledReason = account.requirements?.disabled_reason ?? null;
      const requirementsDue = (account.requirements?.currently_due as string[] | undefined) ?? [];
      const eventuallyDue = (account.requirements?.eventually_due as string[] | undefined) ?? [];
      const pastDue = (account.requirements?.past_due as string[] | undefined) ?? [];

      const cardPaymentsCap = account.capabilities?.card_payments === 'active'
        ? 'active'
        : account.capabilities?.card_payments === 'pending'
          ? 'pending'
          : 'inactive';
      const transfersCap = account.capabilities?.transfers === 'active'
        ? 'active'
        : account.capabilities?.transfers === 'pending'
          ? 'pending'
          : 'inactive';

      let bankPayoutReadiness: 'ready' | 'pending_verification' | 'action_required' | 'restricted' | 'not_created' = 'action_required';
      if (payoutsEnabled) {
        bankPayoutReadiness = 'ready';
      } else if (disabledReason) {
        bankPayoutReadiness = 'restricted';
      } else if (detailsSubmitted) {
        bankPayoutReadiness = 'pending_verification';
      }

      let creatorVerificationState: 'unverified' | 'pending' | 'verified' | 'restricted' | 'rejected' = 'unverified';
      if (chargesEnabled && payoutsEnabled) {
        creatorVerificationState = 'verified';
      } else if (disabledReason) {
        creatorVerificationState = disabledReason.includes('rejected') ? 'rejected' : 'restricted';
      } else if (detailsSubmitted) {
        creatorVerificationState = 'pending';
      }

      const requiresAction = !chargesEnabled || !payoutsEnabled || requirementsDue.length > 0;
      let actionType: 'create_account' | 'complete_kyc' | 'update_information' | null = null;
      if (!detailsSubmitted) {
        actionType = 'complete_kyc';
      } else if (requirementsDue.length > 0) {
        actionType = 'update_information';
      } else if (!chargesEnabled || !payoutsEnabled) {
        actionType = 'complete_kyc';
      }

      return {
        accountId,
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
        disabledReason,
        requirementsDue,
        eventuallyDue,
        pastDue,
        capabilities: {
          cardPayments: cardPaymentsCap,
          transfers: transfersCap,
        },
        bankPayoutReadiness,
        creatorVerificationState,
        requiresAction,
        actionType,
      };
    }
    // Mock: simulate fully enabled account
    return {
      accountId,
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      disabledReason: null,
      requirementsDue: [],
      eventuallyDue: [],
      pastDue: [],
      capabilities: {
        cardPayments: 'active',
        transfers: 'active',
      },
      bankPayoutReadiness: 'ready',
      creatorVerificationState: 'verified',
      requiresAction: false,
      actionType: null,
    };
  }

  // ── Transfer (payout to connected account) ────────────────────────────────

  async createTransfer(params: {
    amountCents: number;
    currency: string;
    destinationAccountId: string;
    metadata: Record<string, string>;
    idempotencyKey?: string;
  }): Promise<{ id: string }> {
    if (this._stripe) {
      const transfer = await this._stripe.transfers.create(
        {
          amount: params.amountCents,
          currency: params.currency.toLowerCase(),
          destination: params.destinationAccountId,
          metadata: params.metadata,
        },
        params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined,
      );
      return { id: transfer.id };
    }
    return { id: mockId('tr') };
  }

  // ── Campaign PaymentIntent (capture_method: manual = authorize-only) ───────

  async createCampaignPaymentIntent(params: {
    amountCents: number;
    currency: string;
    customerId: string;
    metadata: Record<string, string>;
  }): Promise<{ id: string; client_secret: string }> {
    if (this._stripe) {
      const pi = await this._stripe.paymentIntents.create({
        amount: params.amountCents,
        currency: params.currency.toLowerCase(),
        customer: params.customerId,
        metadata: params.metadata,
        capture_method: 'manual', // authorize only — capture when campaign succeeds
        automatic_payment_methods: { enabled: true },
      });
      return { id: pi.id, client_secret: pi.client_secret! };
    }
    const id = mockId('pi');
    return { id, client_secret: `${id}_secret_mock` };
  }

  async capturePaymentIntent(paymentIntentId: string): Promise<void> {
    if (this._stripe) {
      await this._stripe.paymentIntents.capture(paymentIntentId);
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    if (this._stripe) {
      await this._stripe.paymentIntents.cancel(paymentIntentId);
    }
  }

  // ── Account Payout Pause / Hold (Phase 9) ─────────────────────────────────

  async updateAccountPayouts(
    accountId: string,
    paused: boolean,
  ): Promise<{ success: boolean }> {
    if (this._stripe) {
      await this._stripe.accounts.update(accountId, {
        settings: {
          payouts: {
            schedule: {
              interval: paused ? 'manual' : 'daily',
            },
          },
        },
      });
      return { success: true };
    }
    return { success: true };
  }

  // ── Dispute Evidence Submission (Phase 11) ───────────────────────────────

  async submitDisputeEvidence(
    disputeId: string,
    evidence: Record<string, unknown>,
  ): Promise<{ id: string; status: string }> {
    if (this._stripe) {
      const dispute = await this._stripe.disputes.update(disputeId, {
        evidence: evidence as any,
      });
      return { id: dispute.id, status: dispute.status };
    }
    return { id: disputeId, status: 'under_review' };
  }

  // ── Read-only Connectivity Check (Phase 10 & 12) ─────────────────────────
  async checkConnectivity(): Promise<boolean> {
    if (this._stripe) {
      const balance = await this._stripe.balance.retrieve();
      return Boolean(balance && balance.available);
    }
    return true; // Mock mode
  }
}

export const stripe = new StripeAdapter();
