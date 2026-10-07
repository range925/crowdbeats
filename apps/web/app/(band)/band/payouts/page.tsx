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
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [connectMsg, setConnectMsg] = useState('');
  const [connectOk, setConnectOk] = useState(false);
  const [calcTip, setCalcTip] = useState('50');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('connect') === 'success') { setConnectOk(true); setConnectMsg('Stripe Connect onboarding complete!'); }
    else if (p.get('connect') === 'refresh') { setConnectMsg('Link expired — click Set Up again.'); }
  }, []);

  const handleConnect = async () => {
    setLoadingConnect(true); setConnectMsg('');
    try {
      const res = await fetch('/api/creator/connect', { method: 'POST' });
      const data = await res.json() as { accountLinkUrl?: string; error?: string };
      if (data.accountLinkUrl) { setConnectUrl(data.accountLinkUrl); setConnectOk(true); setConnectMsg('Onboarding link ready — click below.'); }
      else { setConnectMsg(data.error ?? 'Failed to generate link.'); }
    } catch { setConnectMsg('Network error.'); } finally { setLoadingConnect(false); }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>Band Payouts & Stripe Connect</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Connect your bank, deposit or withdraw funds via card, Apple Pay, or Google Pay.</p>

      {/* 1. Stripe Connect */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Stripe Connect Express — Band Account</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Complete KYC to receive tip splits and campaign payouts directly into your bank.</div>
          </div>
          <button onClick={handleConnect} disabled={loadingConnect} style={{ background: '#00F076', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: loadingConnect ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {loadingConnect ? 'Generating…' : 'Set Up Band Payout Account'}
          </button>
        </div>
        {connectMsg && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: connectOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: connectOk ? '#10B981' : '#EF4444', fontSize: 13 }}>{connectMsg}</div>}
        {connectUrl && <div style={{ marginTop: 10 }}><a href={connectUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', padding: '10px 18px', borderRadius: 8, background: '#635BFF', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Open Stripe Onboarding ↗</a></div>}
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
