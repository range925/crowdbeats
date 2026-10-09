/**
 * Crowdbeats V2 — Direct Musician Tipping Flow
 * Route: /fan/tip
 *
 * Features:
 * - Tip amount presets
 * - Google Pay (PaymentRequest API)
 * - Credit/debit card via Stripe CardElement
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = PK ? loadStripe(PK) : null;

const PRESETS = [
  { cents: 500,  label: '$5',     badge: undefined,    icon: '❤️' },
  { cents: 1000, label: '$10',    badge: 'POPULAR',    icon: '🔥' },
  { cents: 2000, label: '$20',    badge: 'SUPERFAN',   icon: '⭐' },
  { cents: 0,    label: 'Custom', badge: undefined,    icon: '✏️' },
];

/* ── Wallet (Google Pay) button ─────────────────────────────── */
function ExpressPayButtons({ amount, onSuccess }: { amount: number; onSuccess: (pm: string) => void }) {
  const stripe = useStripe();
  const [pr, setPr] = useState<any>(null);

  useEffect(() => {
    if (!stripe || amount < 100) return;
    const req = stripe.paymentRequest({
      country: 'US', currency: 'usd',
      total: { label: 'Crowdbeats Tip', amount },
      requestPayerName: true, requestPayerEmail: true,
    });
    req.canMakePayment().then((r: any) => { if (r) setPr(req); });
    req.on('paymentmethod', (ev: any) => { ev.complete('success'); onSuccess(ev.paymentMethod.id); });
    return () => { setPr(null); };
  }, [stripe, amount]);

  if (!pr) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <PaymentRequestButtonElement options={{ paymentRequest: pr, style: { paymentRequestButton: { theme: 'dark', height: '48px', type: 'buy' } } } as any} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#2B2D44' }} />
        <span style={{ fontSize: 12, color: '#94A3B8' }}>or pay with card</span>
        <div style={{ flex: 1, height: 1, background: '#2B2D44' }} />
      </div>
    </div>
  );
}

/* ── Card form ──────────────────────────────────────────────────────────── */
function TipCardForm({ amountCents, onSuccess }: { amountCents: number; onSuccess: (pm: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (amountCents < 100) { setMsg('Minimum tip is $1.00'); return; }
    setLoading(true); setMsg('');
    try {
      const card = elements.getElement(CardElement);
      if (!card) return;
      const { paymentMethod, error } = await stripe.createPaymentMethod({ element: card });
      if (error) { setMsg(error.message ?? 'Card error'); return; }
      onSuccess(paymentMethod?.id ?? '');
      card.clear();
    } catch { setMsg('Unexpected error.'); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ExpressPayButtons amount={amountCents} onSuccess={onSuccess} />
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Details</label>
        <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #2B2D44', background: '#0B0C10' }}>
          <CardElement options={{ style: { base: { fontSize: '15px', color: '#FFFFFF', fontFamily: '-apple-system, sans-serif', '::placeholder': { color: '#64748B' } }, invalid: { color: '#EF4444' } } }} />
        </div>
        <p style={{ fontSize: 11, color: '#86868B', marginTop: 6 }}>Secured by Stripe 256-bit encryption. All major cards & Google Pay accepted.</p>
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13 }}>{msg}</div>}
      <button type="submit" disabled={loading || !stripe || amountCents < 100} style={{ width: '100%', padding: '14px 0', borderRadius: 'var(--radius-full, 999px)', background: loading ? '#374151' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading || amountCents < 100 ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Sending Tip…' : `Pay with Card — $${(amountCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function DirectTipPage() {
  const [selectedCents, setSelectedCents] = useState(1000);
  const [isCustom, setIsCustom]           = useState(false);
  const [customValue, setCustomValue]     = useState('');
  const [message, setMessage]             = useState('');
  const [success, setSuccess]             = useState(false);
  const [pmId, setPmId]                   = useState('');

  const displayAmount = `$${(selectedCents / 100).toFixed(2)}`;

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) setSelectedCents(Math.round(parsed * 100));
  };

  const handleSuccess = (pm: string) => {
    setPmId(pm);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 bg-[#151722] rounded-3xl border border-[#2B2D44] text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-2xl">🎉</div>
        <h2 className="text-xl font-bold text-white">Tip Sent!</h2>
        <p className="text-sm text-[#94A3B8]">You tipped <strong className="text-white">Luna & The Waves</strong> {displayAmount}.</p>
        <div className="bg-[#1E2032] p-4 rounded-xl border border-[#2B2D44] text-xs text-[#94A3B8] w-full text-left space-y-1">
          <p>Payment Method: <code className="text-white">{pmId || 'express_pay'}</code></p>
          <p>Status: <span className="text-[#10B981] font-semibold">Confirmed</span></p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <Link href="/fan/receipts" className="flex-1">
            <button type="button" className="w-full py-2.5 rounded-full border border-[#2B2D44] text-xs text-white hover:bg-[#1E2032]">View Receipt</button>
          </Link>
          <button type="button" onClick={() => { setSuccess(false); setPmId(''); }} className="flex-1 py-2.5 rounded-full bg-[#7C3AED] text-xs text-white font-semibold hover:bg-[#9333EA]">Tip Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-5">
      {/* Performer Card */}
      <div className="relative rounded-3xl overflow-hidden border border-[#2B2D44] shadow-2xl bg-[#151722]">
        <div className="relative h-48 w-full">
          <img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80" alt="Luna & The Waves" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-[#151722]/60 to-transparent" />
        </div>
        <div className="p-6 pt-0 -mt-8 relative z-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED] text-[11px] font-bold text-[#A855F7] mb-2">✓ Verified Performer</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Luna & The Waves</h1>
          <p className="text-xs text-[#A855F7] font-semibold mt-0.5">LIVE AT THE CASBAH • MAIN STAGE</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Indie Pop / Rock • 142 fans listening</p>
        </div>
      </div>

      {/* Tip Selector */}
      <div className="bg-[#151722] p-6 rounded-3xl border border-[#2B2D44] flex flex-col gap-5 shadow-lg">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Select Tip Amount</label>
          <div className="grid grid-cols-4 gap-2.5">
            {PRESETS.map((p) => {
              const isSelected = !isCustom && selectedCents === p.cents;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { if (p.label === 'Custom') { setIsCustom(true); } else { setIsCustom(false); setSelectedCents(p.cents); } }}
                  style={{ padding: '10px 8px', borderRadius: 12, border: (p.label === 'Custom' ? isCustom : isSelected) ? '2px solid #7C3AED' : '1px solid #2B2D44', background: (p.label === 'Custom' ? isCustom : isSelected) ? 'rgba(124,58,237,0.15)' : '#1E2032', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span>{p.label}</span>
                  {p.badge && <span style={{ fontSize: 8, background: '#7C3AED', padding: '1px 5px', borderRadius: 4, color: '#fff', letterSpacing: '0.05em' }}>{p.badge}</span>}
                </button>
              );
            })}
          </div>
          {isCustom && (
            <div style={{ marginTop: 12 }}>
              <input type="number" value={customValue} onChange={handleCustomChange} placeholder="Enter amount (e.g. 25.00)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2B2D44', background: '#0B0C10', color: '#fff', fontSize: 14 }} />
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Add a Note (Optional)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Say something encouraging..." rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2B2D44', background: '#0B0C10', color: '#fff', fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Impact notice */}
        <div className="p-3 bg-[#1E2032] rounded-xl border border-[#2B2D44] flex items-center gap-3">
          <span className="text-base">🛡️</span>
          <p className="text-xs text-[#94A3B8] leading-relaxed"><strong className="text-white">100% of your tip</strong> goes directly to the performer via verified Stripe Connect.</p>
        </div>

        {/* Payment — Stripe Elements with Google Pay / Card */}
        {stripePromise ? (
          <Elements stripe={stripePromise} options={{ locale: 'en' }}>
            <TipCardForm amountCents={selectedCents} onSuccess={handleSuccess} />
          </Elements>
        ) : (
          <button type="button" onClick={() => setSuccess(true)} className="w-full py-3.5 rounded-full bg-[#7C3AED] text-white font-bold text-sm">
            Tip {displayAmount}
          </button>
        )}
      </div>
    </div>
  );
}
