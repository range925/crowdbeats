/**
 * Crowdbeats V2 — Payouts & Stripe Connect (Phase 7)
 *
 * Sections:
 * 1. Stripe Connect Express — KYC onboarding for artists to receive payouts
 * 2. Demo Tip Payment — Stripe Elements card form for Stripe review demos
 * 3. Payout Request — transfer earnings to bank
 */

'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { calculateNetTipPayout } from '@/lib/financial/stripeDailyFeeService';
import { callCallableFunction } from '@/lib/firebase/functions';

export interface ConnectAccountStatus {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
  disabledReason?: string | null;
  requirementsDue?: string[];
  eventuallyDue?: string[];
  pastDue?: string[];
  capabilities?: { cardPayments: string; transfers: string };
  bankPayoutReadiness?: 'ready' | 'pending_verification' | 'action_required' | 'restricted' | 'not_created' | string;
  creatorVerificationState?: 'unverified' | 'pending' | 'verified' | 'restricted' | 'rejected' | string;
  requiresAction?: boolean;
  actionType?: 'create_account' | 'complete_kyc' | 'update_information' | null | string;
}

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      '::placeholder': { color: '#9CA3AF' },
      iconColor: '#00F076',
    },
    invalid: { color: '#EF4444' },
  },
};

function DemoTipForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('5');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents < 100) { setMessage('Minimum tip is $1.00'); return; }
    setLoading(true); setMessage(''); setSuccess(false);
    try {
      const cardEl = elements.getElement(CardElement);
      if (!cardEl) { setMessage('Card element not loaded.'); return; }
      const { paymentMethod, error } = await stripe.createPaymentMethod({ element: cardEl });
      if (error) { setMessage(error.message ?? 'Card error'); return; }
      setSuccess(true);
      setMessage(`Test tip of $${parseFloat(amount).toFixed(2)} created! Payment Method: ${paymentMethod?.id}`);
      cardEl.clear();
    } catch { setMessage('Unexpected error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Tip Amount (USD)</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {['1', '5', '10', '20', '50'].map((a) => {
            const isSelected = amount === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid #00F076' : '1px solid #D1D5DB',
                  background: isSelected ? '#00F076' : '#FFFFFF',
                  color: isSelected ? '#000000' : '#374151',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                ${a}
              </button>
            );
          })}
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: 90,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #D1D5DB',
              background: '#FFFFFF',
              color: '#374151',
              fontSize: 13,
            }}
            placeholder="Custom"
          />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Card Details</label>
        <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}>
          <CardElement options={CARD_STYLE} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
          Encrypted and secured by Stripe. All major credit cards, debit cards, and digital wallets accepted.
        </p>
      </div>
      {message && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: success ? '#10B981' : '#EF4444', fontSize: 13, marginBottom: 16, wordBreak: 'break-all' }}>
          {success ? 'SUCCESS: ' : ''}{message}
        </div>
      )}
      <button type="submit" disabled={loading || !stripe} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: loading ? 'var(--border-subtle)' : 'var(--accent-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Processing...' : `Send $${parseFloat(amount || '0').toFixed(2)} Tip`}
      </button>
    </form>
  );
}

export default function CreatorPayoutsPage() {
  const [accountStatus, setAccountStatus] = useState<ConnectAccountStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [loadingConnect, setLoadingConnect] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [connectStatus, setConnectStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectMsg, setConnectMsg] = useState('');

  const [payoutAmount, setPayoutAmount] = useState('50');
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [payoutMsg, setPayoutMsg] = useState('');

  const [calcGross, setCalcGross] = useState('25');

  const fetchLiveStatus = async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      const res = await callCallableFunction<Record<string, never>, ConnectAccountStatus>('getConnectStatus', {});
      setAccountStatus(res);
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusError(message || 'Failed to load Stripe Connect account status.');
      return null;
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('connect') === 'success' || p.get('connect') === 'return') {
      setConnectStatus('success');
      setConnectMsg('Stripe Connect onboarding return received! Verifying live status…');
    } else if (p.get('connect') === 'refresh') {
      setConnectStatus('error');
      setConnectMsg('Onboarding session expired or was refreshed — please click Set Up / Update Payout Account again.');
    }

    fetchLiveStatus().then((res) => {
      if (res && (p.get('connect') === 'success' || p.get('connect') === 'return')) {
        if (res.chargesEnabled && res.payoutsEnabled) {
          setConnectMsg('Stripe Connect onboarding complete! Your payout account is active and verified.');
        } else {
          setConnectMsg('Stripe Connect onboarding details received. Identity verification is in review.');
        }
      }
    });
  }, []);

  const handleSetupConnect = async () => {
    setLoadingConnect(true);
    setConnectStatus('idle');
    setConnectMsg('');
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://crowdbeats.ai';
      const data = await callCallableFunction<
        { creatorType?: string; refreshUrl?: string; returnUrl?: string },
        { accountLinkUrl: string; accountId: string }
      >('createConnectLink', {
        creatorType: 'artist',
        refreshUrl: `${origin}/creator/payouts?connect=refresh`,
        returnUrl: `${origin}/creator/payouts?connect=success`,
      });

      if (data.accountLinkUrl) {
        setConnectUrl(data.accountLinkUrl);
        setConnectStatus('success');
        setConnectMsg('Onboarding link ready — click below to complete identity verification in Stripe.');
      } else {
        setConnectStatus('error');
        setConnectMsg('Failed to generate onboarding link. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setConnectStatus('error');
      setConnectMsg(message || 'Network error generating onboarding link. Please try again.');
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const dollars = parseFloat(payoutAmount);
    const cents = Math.round(dollars * 100);
    if (isNaN(cents) || cents < 1000) {
      setPayoutStatus('error');
      setPayoutMsg('Minimum payout request is $10.00.');
      return;
    }
    setLoadingPayout(true);
    setPayoutMsg('');
    setPayoutStatus('idle');
    try {
      const data = await callCallableFunction<
        { amountCents: number; currency?: string },
        { payoutId: string; amountCents: number; stripeTransferId: string }
      >('requestPayout', { amountCents: cents, currency: 'USD' });
      setPayoutStatus('success');
      setPayoutMsg(
        `Payout of $${(data.amountCents / 100).toFixed(2)} submitted successfully! Payout ID: ${data.payoutId} · Transfer ID: ${data.stripeTransferId}. Processing in 1-2 business days.`
      );
      fetchLiveStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setPayoutStatus('error');
      setPayoutMsg(message || 'Failed to request payout.');
    } finally {
      setLoadingPayout(false);
    }
  };

  const isAccountActive = Boolean(accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled);
  const hasRequirementsDue = Boolean(
    (accountStatus?.requirementsDue && accountStatus.requirementsDue.length > 0) ||
      accountStatus?.disabledReason ||
      accountStatus?.actionType === 'update_information' ||
      accountStatus?.bankPayoutReadiness === 'action_required'
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>Payouts & Financial Settings</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Stripe Connect onboarding, demo card payments, and earnings transfers.</p>

      {/* 1. Connect KYC */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Stripe Connect Express Account</span>
              {loadingStatus ? (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-raised)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  Checking status…
                </span>
              ) : isAccountActive ? (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}>
                  Active & Verified
                </span>
              ) : hasRequirementsDue ? (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>
                  Requirements Due
                </span>
              ) : (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 700 }}>
                  Onboarding Required
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {loadingStatus ? (
                'Connecting to Stripe to verify your payout account status…'
              ) : isAccountActive ? (
                `Your Stripe Express account (${accountStatus?.accountId ?? 'connected'}) is active. Payouts and direct tips will be transferred to your bank.`
              ) : hasRequirementsDue ? (
                `Action required: Stripe needs additional verification details (${
                  accountStatus?.requirementsDue && accountStatus.requirementsDue.length > 0
                    ? accountStatus.requirementsDue.join(', ')
                    : 'identity documentation'
                }). Complete requirements to enable payouts.`
              ) : (
                'Required to receive direct tip deposits and campaign payouts into your bank account.'
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSetupConnect}
            disabled={loadingConnect}
            aria-busy={loadingConnect}
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: loadingConnect ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: loadingConnect ? 0.7 : 1,
            }}
          >
            {loadingConnect
              ? 'Generating…'
              : isAccountActive
                ? 'Update Payout Account'
                : hasRequirementsDue
                  ? 'Complete Requirements'
                  : 'Set Up Payout Account'}
          </button>
        </div>

        {statusError && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              color: '#EF4444',
              fontSize: 13,
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{statusError}</span>
            <button
              type="button"
              onClick={fetchLiveStatus}
              style={{
                background: 'transparent',
                border: '1px solid #EF4444',
                color: '#EF4444',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {connectMsg && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: connectStatus === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: connectStatus === 'error' ? '#EF4444' : '#10B981',
              fontSize: 13,
              border: `1px solid ${connectStatus === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            }}
          >
            {connectMsg}
          </div>
        )}
        {connectUrl && (
          <div style={{ marginTop: 12 }}>
            <a
              href={connectUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 8,
                background: '#635BFF',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              Open Stripe Onboarding ↗
            </a>
          </div>
        )}
      </div>

      {/* 2. Direct Tip Card Input */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Direct Card & Wallet Tip Processing</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Accept tips instantly via credit card, debit card, or Google Pay.</p>
        {stripePromise ? (
          <Elements stripe={stripePromise} options={{ locale: 'en' }}>
            <DemoTipForm />
          </Elements>
        ) : (
          <div style={{ padding: 16, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13 }}>
            Stripe publishable key not configured.
          </div>
        )}
      </div>

      {/* 2.5 Fee Schedule & Net Payout Calculator */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Fee Schedule & Musician Net Proceeds</h3>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Daily Stripe Rate Synced: 2.9% + 30¢ • Active</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Crowdbeats assesses a standard 6% technology fee. Stripe processing fees are updated daily to ensure musicians and bands receive exact, transparent net proceeds.
        </p>

        {/* Live Net Earnings Calculator */}
        {(() => {
          const parsedDollars = parseFloat(calcGross || '0') || 0;
          const grossCents = Math.round(parsedDollars * 100);
          const breakdown = calculateNetTipPayout(grossCents);

          return (
            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: 16, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Simulate Tip Net Payout:</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['10', '25', '50', '100'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCalcGross(val)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: calcGross === val ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: calcGross === val ? 'var(--accent-primary-subtle)' : 'transparent',
                        color: calcGross === val ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Gross Tip</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>${(breakdown.grossAmountCents / 100).toFixed(2)}</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: '#F87171' }}>Crowdbeats Fee (6%)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F87171' }}>−${(breakdown.platformFeeCents / 100).toFixed(2)}</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: '#F87171' }}>Stripe Fee (2.9% + 30¢)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F87171' }}>−${(breakdown.stripeProcessingFeeCents / 100).toFixed(2)}</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(16,185,129,0.05)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Musician Net Take-Home</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>${(breakdown.netProceedsCents / 100).toFixed(2)}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Payout Request */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Request Payout to Bank</h3>
        {payoutMsg && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: payoutStatus === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: payoutStatus === 'error' ? '#EF4444' : '#10B981',
              fontSize: 13,
              marginBottom: 12,
              border: `1px solid ${payoutStatus === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            }}
          >
            {payoutMsg}
          </div>
        )}
        <form onSubmit={handleRequestPayout} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-tertiary)', fontSize: 14 }}>$</span>
            <input
              type="number"
              min="10"
              step="0.01"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              aria-label="Payout amount in USD"
              style={{ width: 140, padding: '10px 12px 10px 24px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>
          <button
            type="submit"
            disabled={loadingPayout}
            aria-busy={loadingPayout}
            style={{
              background: loadingPayout ? 'var(--border-subtle)' : 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: loadingPayout ? 'not-allowed' : 'pointer',
              opacity: loadingPayout ? 0.7 : 1,
            }}
          >
            {loadingPayout ? 'Transferring…' : 'Transfer to Bank'}
          </button>
        </form>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>Minimum payout: $10.00 - Processing time: 1-2 business days via Stripe Express</div>
      </div>

      {/* 4. History */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Payout History</h3>
      <div style={{ background: 'var(--surface-card)', padding: 32, borderRadius: 12, border: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
        No payouts completed yet.
      </div>
    </div>
  );
}

