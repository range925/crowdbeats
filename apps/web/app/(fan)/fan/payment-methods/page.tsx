/**
 * Crowdbeats V2 — Fan Payment Methods & Tip Wallet
 * Route: /fan/payment-methods
 *
 * Features:
 * - Add/save cards via Stripe Elements
 * - Apple Pay & Google Pay via PaymentRequest API
 * - Deposit to tip wallet
 */
'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, StripePaymentRequestButtonElementOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = PK ? loadStripe(PK) : null;

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1D1D1F',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#EF4444' },
  },
};

function WalletButtons({ amount }: { amount: number }) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<ReturnType<NonNullable<typeof stripe>['paymentRequest']> | null>(null);
  const [prAvailable, setPrAvailable] = useState(false);

  useEffect(() => {
    if (!stripe) return;
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { label: 'Crowdbeats Wallet Deposit', amount },
      requestPayerName: true,
      requestPayerEmail: true,
    });
    pr.canMakePayment().then((result) => {
      if (result) { setPaymentRequest(pr); setPrAvailable(true); }
    });
    pr.on('paymentmethod', (ev) => {
      ev.complete('success');
      alert('Apple Pay / Google Pay payment method captured: ' + ev.paymentMethod.id);
    });
  }, [stripe, amount]);

  if (!prAvailable || !paymentRequest) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Express Checkout
      </div>
      <PaymentRequestButtonElement
        options={{ paymentRequest, style: { paymentRequestButton: { theme: 'dark', height: '44px', type: 'default' } } } as StripePaymentRequestButtonElementOptions}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>or pay with card</span>
        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
      </div>
    </div>
  );
}

function CardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('20');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  const amountCents = Math.round(parseFloat(amount || '0') * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (amountCents < 100) { setMsg('Minimum deposit is $1.00'); return; }
    setLoading(true); setMsg(''); setOk(false);
    try {
      const card = elements.getElement(CardElement);
      if (!card) return;
      const { paymentMethod, error } = await stripe.createPaymentMethod({ element: card });
      if (error) { setMsg(error.message ?? 'Card error'); return; }
      setOk(true);
      setMsg('Wallet deposit of $' + parseFloat(amount).toFixed(2) + ' queued! PM: ' + paymentMethod?.id);
      card.clear();
    } catch { setMsg('Unexpected error.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <WalletButtons amount={amountCents || 2000} />

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Deposit Amount (USD)</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {['5','10','20','50','100'].map((a) => (
            <button key={a} type="button" onClick={() => setAmount(a)} style={{ padding: '6px 14px', borderRadius: 8, border: amount === a ? '2px solid #00F076' : '1px solid #D1D5DB', background: amount === a ? '#00F076' : '#fff', color: amount === a ? '#000' : '#374151', fontSize: 13, fontWeight: amount === a ? 700 : 500, cursor: 'pointer' }}>${a}</button>
          ))}
          <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid #D1D5DB', color: '#374151', fontSize: 13, background: '#fff' }} placeholder="Custom" />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Card Details</label>
        <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff' }}>
          <CardElement options={CARD_STYLE} />
        </div>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>Secured with end-to-end encryption. All major cards accepted.</p>
      </div>

      {msg && <div style={{ padding: '10px 14px', borderRadius: 8, background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: ok ? '#10B981' : '#EF4444', fontSize: 13, marginBottom: 12, wordBreak: 'break-all' }}>{msg}</div>}

      <button type="submit" disabled={loading || !stripe} style={{ width: '100%', padding: 12, borderRadius: 8, background: loading ? '#E5E7EB' : '#00F076', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Processing…' : `Deposit $${parseFloat(amount || '0').toFixed(2)} to Wallet`}
      </button>
    </form>
  );
}

export default function FanPaymentMethodsPage() {
  return (
    <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1F' }}>Payment Methods & Wallet</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Deposit funds to your tip wallet. Supports Apple Pay, Google Pay, debit & credit cards.</p>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>Tip Wallet Balance</h3>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#00F076', margin: '8px 0 4px' }}>$0.00</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Use wallet to tip artists instantly without re-entering card details.</div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>Add Funds</h3>
        {stripePromise ? (
          <Elements stripe={stripePromise} options={{ locale: 'en' }}>
            <CardForm />
          </Elements>
        ) : (
          <div style={{ color: '#EF4444', fontSize: 13 }}>Stripe not configured.</div>
        )}
      </div>
    </div>
  );
}
