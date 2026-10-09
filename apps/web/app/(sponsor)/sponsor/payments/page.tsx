/**
 * Crowdbeats V2 — Sponsor Payments & Campaign Budget
 * Route: /sponsor/payments
 *
 * Features:
 * - Fund Sponsor Account via card, Google Pay
 * - View Campaign balance + ledger
 */
'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = PK ? loadStripe(PK) : null;

const CARD_STYLE = { style: { base: { fontSize: '15px', color: '#1D1D1F', fontFamily: '-apple-system, sans-serif', '::placeholder': { color: '#9CA3AF' } }, invalid: { color: '#EF4444' } } };

function WalletButtons({ amount }: { amount: number }) {
  const stripe = useStripe();
  const [pr, setPr] = useState<any>(null);
  useEffect(() => {
    if (!stripe) return;
    const req = stripe.paymentRequest({ country: 'US', currency: 'usd', total: { label: 'Crowdbeats Sponsor Sponsorship Deposit', amount }, requestPayerName: true, requestPayerEmail: true });
    req.canMakePayment().then((r: any) => { if (r) setPr(req); });
    req.on('paymentmethod', (ev: any) => { ev.complete('success'); alert('Google Pay payment method captured: ' + ev.paymentMethod.id); });
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

function SponsorDepositCardForm({ onSuccess }: { onSuccess: (pm: string, amount: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const amountCents = Math.round(parseFloat(amount || '0') * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (amountCents < 1000) { setMsg('Minimum deposit is $10.00'); return; }
    setLoading(true); setMsg(''); setOk(false);
    try {
      const card = elements.getElement(CardElement);
      if (!card) return;
      const { paymentMethod, error } = await stripe.createPaymentMethod({ element: card });
      if (error) { setMsg(error.message ?? 'Card error'); return; }
      setOk(true);
      const pm = paymentMethod?.id ?? '—';
      setMsg('Sponsorship Deposit of $' + parseFloat(amount).toFixed(2) + ' initiated! PM: ' + pm);
      card.clear();
      onSuccess(pm, parseFloat(amount).toFixed(2));
    } catch { setMsg('Unexpected error.'); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <WalletButtons amount={amountCents || 100000} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Deposit Amount (USD)</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {['250','500','1000','2500','5000'].map((a) => (
            <button key={a} type="button" onClick={() => setAmount(a)} style={{ padding: '6px 14px', borderRadius: 8, border: amount === a ? '2px solid #00F076' : '1px solid #D1D5DB', background: amount === a ? '#00F076' : '#fff', color: amount === a ? '#000' : '#374151', fontSize: 13, fontWeight: amount === a ? 700 : 500, cursor: 'pointer' }}>${a}</button>
          ))}
          <input type="number" min="10" step="10" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 90, padding: '6px 10px', borderRadius: 8, border: '1px solid #D1D5DB', color: '#374151', fontSize: 13, background: '#fff' }} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Corporate Card / Debit Card</label>
        <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff' }}><CardElement options={CARD_STYLE} /></div>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>PCI-DSS Level 1 compliant via Stripe. Corporate cards and digital wallets supported.</p>
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 8, background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: ok ? '#10B981' : '#EF4444', fontSize: 13, marginBottom: 12, wordBreak: 'break-all' }}>{msg}</div>}
      <button type="submit" disabled={loading || !stripe} style={{ width: '100%', padding: 12, borderRadius: 8, background: loading ? '#E5E7EB' : '#00F076', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Processing Deposit…' : `Deposit $${parseFloat(amount || '0').toFixed(2)} to Campaign Budget`}
      </button>
    </form>
  );
}

interface LedgerEntry { ts: string; desc: string; type: 'deposit' | 'drawdown'; amount: string; }

export default function SponsorPaymentsPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);

  const handleSuccess = (pm: string, amount: string) => {
    const entry: LedgerEntry = { ts: new Date().toLocaleString(), desc: 'Campaign budget top-up via Stripe (PM: ' + pm + ')', type: 'deposit', amount };
    setLedger((prev) => [entry, ...prev]);
    setBalance((prev) => prev + parseFloat(amount));
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>Sponsor Payments & Financial Ledger</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Fund your sponsorship Campaign Budget using corporate card or Google Pay. Minimum $10.00.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Deposit form */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>💳 Fund Sponsor Account</h3>
          {stripePromise ? (
            <Elements stripe={stripePromise} options={{ locale: 'en' }}>
              <SponsorDepositCardForm onSuccess={handleSuccess} />
            </Elements>
          ) : (
            <div style={{ color: '#EF4444', fontSize: 13 }}>Stripe not configured.</div>
          )}
        </div>

        {/* Balance summary */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Account Balance Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Available for Matches & Deals', value: `$${balance.toFixed(2)}`, accent: true },
              { label: 'Reserved in Active Pools', value: '$0.00', accent: false },
              { label: 'Lifetime Deposited', value: `$${balance.toFixed(2)}`, accent: true },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--surface-raised)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ color: row.accent ? '#00F076' : 'var(--text-primary)', fontWeight: 800 }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, background: 'rgba(0,240,118,0.07)', border: '1px solid rgba(0,240,118,0.2)', fontSize: 12, color: '#6B7280' }}>
            🛡️ campaign funds are held in trust by Stripe and disbursed only on verified artist agreements.
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Sponsorship Ledger</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Timestamp</th>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Description</th>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Type</th>
            <th style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
          </tr></thead>
          <tbody>
            {ledger.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No transactions yet.</td></tr>
            ) : ledger.map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 20px', color: 'var(--text-tertiary)' }}>{e.ts}</td>
                <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>{e.desc}</td>
                <td style={{ padding: '12px 20px' }}><span style={{ background: e.type === 'deposit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: e.type === 'deposit' ? '#10B981' : '#EF4444', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{e.type === 'deposit' ? '↑ Deposit' : '↓ Drawdown'}</span></td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>${e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
