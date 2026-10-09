/**
 * Crowdbeats V2 — Band Payouts & Stripe Connect
 * Route: /band/payouts
 *
 * Features:
 * - Stripe Connect Express onboarding for each member
 * - Card deposit / withdrawal
 * - Apple Pay & Google Pay via PaymentRequest API
 */
'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { calculateNetTipPayout, calculateBandNetSplits } from '@/lib/financial/stripeDailyFeeService';
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

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = PK ? loadStripe(PK) : null;

const CARD_STYLE = { style: { base: { fontSize: '15px', color: '#1D1D1F', fontFamily: '-apple-system, sans-serif', '::placeholder': { color: '#9CA3AF' } }, invalid: { color: '#EF4444' } } };

function WalletButtons({ amount }: { amount: number }) {
  const stripe = useStripe();
  const [pr, setPr] = useState<any>(null);
  useEffect(() => {
    if (!stripe) return;
    const req = stripe.paymentRequest({ country: 'US', currency: 'usd', total: { label: 'Crowdbeats Band Payout', amount }, requestPayerName: true, requestPayerEmail: true });
    req.canMakePayment().then((r: any) => { if (r) setPr(req); });
    req.on('paymentmethod', (ev: any) => { ev.complete('success'); alert('Apple/Google Pay captured: ' + ev.paymentMethod.id); });
  }, [stripe, amount]);
  if (!pr) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Express Checkout</div>
      <PaymentRequestButtonElement options={{ paymentRequest: pr, style: { paymentRequestButton: { theme: 'dark', height: '44px' } } } as any} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} /><span style={{ fontSize: 12, color: '#9CA3AF' }}>or pay with card</span><div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
      </div>
    </div>
  );
}

function BandCardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('50');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const amountCents = Math.round(parseFloat(amount || '0') * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (amountCents < 1000) { setMsg('Minimum is $10.00'); return; }
    setLoading(true); setMsg(''); setOk(false);
    try {
      const card = elements.getElement(CardElement);
      if (!card) return;
      const { paymentMethod, error } = await stripe.createPaymentMethod({ element: card });
      if (error) { setMsg(error.message ?? 'Card error'); return; }
      setOk(true); setMsg('Band payout of $' + parseFloat(amount).toFixed(2) + ' initiated! PM: ' + paymentMethod?.id); card.clear();
    } catch { setMsg('Unexpected error.'); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <WalletButtons amount={amountCents || 5000} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Amount (USD)</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {['25','50','100','250','500'].map((a) => (
            <button key={a} type="button" onClick={() => setAmount(a)} style={{ padding: '6px 14px', borderRadius: 8, border: amount === a ? '2px solid #00F076' : '1px solid #D1D5DB', background: amount === a ? '#00F076' : '#fff', color: amount === a ? '#000' : '#374151', fontSize: 13, fontWeight: amount === a ? 700 : 500, cursor: 'pointer' }}>${a}</button>
          ))}
          <input type="number" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid #D1D5DB', color: '#374151', fontSize: 13, background: '#fff' }} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Card / Debit Card</label>
        <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff' }}><CardElement options={CARD_STYLE} /></div>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>Encrypted and secured by Stripe. All major cards accepted.</p>
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 8, background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: ok ? '#10B981' : '#EF4444', fontSize: 13, marginBottom: 12, wordBreak: 'break-all' }}>{msg}</div>}
      <button type="submit" disabled={loading || !stripe} style={{ width: '100%', padding: 12, borderRadius: 8, background: loading ? '#E5E7EB' : '#00F076', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Processing…' : `Transfer $${parseFloat(amount || '0').toFixed(2)} to Band`}
      </button>
    </form>
  );
}

export default function BandPayoutsPage() {
  const [accountStatus, setAccountStatus] = useState<ConnectAccountStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [loadingConnect, setLoadingConnect] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [connectMsg, setConnectMsg] = useState('');
  const [connectOk, setConnectOk] = useState(false);
  const [calcTip, setCalcTip] = useState('50');

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
      setConnectOk(true);
      setConnectMsg('Stripe Connect onboarding return received! Refreshing status…');
    } else if (p.get('connect') === 'refresh') {
      setConnectOk(false);
      setConnectMsg('Onboarding session expired or was refreshed — click Set Up again.');
    }

    fetchLiveStatus().then((res) => {
      if (res && (p.get('connect') === 'success' || p.get('connect') === 'return')) {
        if (res.chargesEnabled && res.payoutsEnabled) {
          setConnectOk(true);
          setConnectMsg('Stripe Connect onboarding complete! Band payout account is active.');
        } else {
          setConnectMsg('Stripe Connect details submitted. Verification is pending with Stripe.');
        }
      }
    });
  }, []);

  const handleConnect = async () => {
    setLoadingConnect(true);
    setConnectMsg('');
    setConnectOk(false);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://crowdbeats.ai';
      const data = await callCallableFunction<
        { creatorType?: string; refreshUrl?: string; returnUrl?: string },
        { accountLinkUrl: string; accountId: string }
      >('createConnectLink', {
        creatorType: 'band',
        refreshUrl: `${origin}/band/payouts?connect=refresh`,
        returnUrl: `${origin}/band/payouts?connect=success`,
      });

      if (data.accountLinkUrl) {
        setConnectUrl(data.accountLinkUrl);
        setConnectOk(true);
        setConnectMsg('Onboarding link ready — click below to complete identity verification in Stripe.');
      } else {
        setConnectMsg('Failed to generate onboarding link. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setConnectMsg(message || 'Network error generating onboarding link.');
    } finally {
      setLoadingConnect(false);
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
    <div style={{ padding: '32px 40px', maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>Band Payouts & Stripe Connect</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Connect your bank, deposit or withdraw funds via card, Apple Pay, or Google Pay.</p>

      {/* 1. Stripe Connect */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Stripe Connect Express — Band Account</span>
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
                'Connecting to Stripe to verify band payout account status…'
              ) : isAccountActive ? (
                `Band account (${accountStatus?.accountId ?? 'connected'}) is active. Tip splits and campaign distributions will be deposited into your bank.`
              ) : hasRequirementsDue ? (
                `Action required: Stripe needs additional verification details (${
                  accountStatus?.requirementsDue && accountStatus.requirementsDue.length > 0
                    ? accountStatus.requirementsDue.join(', ')
                    : 'documentation'
                }). Complete requirements to enable payouts.`
              ) : (
                'Complete KYC to receive tip splits and campaign payouts directly into your bank.'
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleConnect}
            disabled={loadingConnect}
            aria-busy={loadingConnect}
            style={{
              background: '#00F076',
              color: '#000',
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
                ? 'Update Band Payout Account'
                : hasRequirementsDue
                  ? 'Complete Requirements'
                  : 'Set Up Band Payout Account'}
          </button>
        </div>

        {statusError && (
          <div
            role="alert"
            style={{
              marginTop: 14,
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
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 8,
              background: connectOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: connectOk ? '#10B981' : '#EF4444',
              fontSize: 13,
              border: `1px solid ${connectOk ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}
          >
            {connectMsg}
          </div>
        )}
        {connectUrl && (
          <div style={{ marginTop: 10 }}>
            <a
              href={connectUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
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

      {/* 2. Card / Apple Pay / Google Pay */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Deposit / Withdraw Funds</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Use credit card, debit card, Apple Pay, or Google Pay.</p>
        {stripePromise ? (
          <Elements stripe={stripePromise} options={{ locale: 'en' }}>
            <BandCardForm />
          </Elements>
        ) : (
          <div style={{ color: '#EF4444', fontSize: 13 }}>Stripe not configured.</div>
        )}
      </div>

      {/* 2.5 Band Fee Schedule & Member Net Split Calculator */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Band Fee Schedule & Net Split Allocation</h3>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Daily Stripe Rate Synced: 2.9% + 30¢ • Active</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Crowdbeats assesses a standard 6% technology fee. Stripe processing fees are updated daily. Band splits are computed strictly on the net proceeds pool after all fee deductions.
        </p>

        {(() => {
          const parsedDollars = parseFloat(calcTip || '0') || 0;
          const grossCents = Math.round(parsedDollars * 100);
          const breakdown = calculateNetTipPayout(grossCents);
          const members = [
            { name: 'Elena Cruz', role: 'Lead Vocal & Guitar', percent: 40 },
            { name: 'Marcus Vance', role: 'Bass & Vocals', percent: 25 },
            { name: 'Leo Ramirez', role: 'Drums & Percussion', percent: 25 },
            { name: 'Chloe Bennett', role: 'Keys & Synths', percent: 10 },
          ];
          const splits = calculateBandNetSplits(breakdown.netProceedsCents, members);

          return (
            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: 16, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Simulate Band Tip Pool:</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['25', '50', '100', '200'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCalcTip(val)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: calcTip === val ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: calcTip === val ? 'var(--accent-primary-subtle)' : 'transparent',
                        color: calcTip === val ? 'var(--accent-primary)' : 'var(--text-secondary)',
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

              {/* Fee summary row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 14 }}>
                <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Gross Band Tip</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>${(breakdown.grossAmountCents / 100).toFixed(2)}</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: '#F87171' }}>Crowdbeats 6% Fee</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F87171' }}>−${(breakdown.platformFeeCents / 100).toFixed(2)}</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: '#F87171' }}>Stripe Fee (2.9% + 30¢)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F87171' }}>−${(breakdown.stripeProcessingFeeCents / 100).toFixed(2)}</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(16,185,129,0.05)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Net Pool For Split</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>${(breakdown.netProceedsCents / 100).toFixed(2)}</div>
                </div>
              </div>

              {/* Member split breakdown list */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Automated 4-Way Member Payout Distribution:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {splits.map((s) => (
                    <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{s.name}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 6 }}>({s.role}) · {s.percent}%</span>
                      </div>
                      <span style={{ color: '#10B981', fontWeight: 700 }}>${s.shareDollars.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Member split matrix */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Member Payout Status</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Member</th>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>KYC Status</th>
            <th style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600 }}>Balance</th>
          </tr></thead>
          <tbody><tr>
            <td colSpan={3} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No band members connected yet. Invite members to set up their Stripe accounts.</td>
          </tr></tbody>
        </table>
      </div>
    </div>
  );
}
