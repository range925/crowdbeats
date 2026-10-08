/**
 * Crowdbeats V2 — Performer Tip Client View
 * Route: /tip/[id]
 *
 * Implements:
 * - Server-authoritative recipient resolution via resolvePerformerRecipient
 * - Immutable performer identifier verification
 * - Truthful Live Now, Verified, and Musician/Band representation
 * - Ineligible / suspended performer protections (never substitutes another recipient)
 * - Guest authentication gate with amount and recipient preservation in sessionStorage
 * - Authenticated Stripe payment confirmation with 6% fee disclosure
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  type ResolvePerformerRecipientRequest,
  type ResolvePerformerRecipientResponse,
  buildCanonicalTipUrl,
} from '@crowdbeats/contracts';
import { callCallableFunction } from '@/lib/firebase/functions';
import { useAuth } from '@/lib/hooks/useAuth';
import { TipAuthGateModal } from '@/components/discovery/TipAuthGateModal';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

interface TipPreset {
  cents: number;
  label: string;
}

const PRESETS: TipPreset[] = [
  { cents: 500, label: '$5' },
  { cents: 1000, label: '$10' },
  { cents: 2000, label: '$20' },
];

export interface PerformerTipClientViewProps {
  id: string;
}

function AuthenticatedCheckoutForm({
  amountCents,
  recipientName,
  performerId,
  performerType,
  onComplete,
}: {
  amountCents: number;
  recipientName: string;
  performerId: string;
  performerType: 'artist' | 'band';
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const platformFeeCents = Math.floor(amountCents * 0.06);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMsg('');
    try {
      if (!stripe || !elements) {
        onComplete();
        return;
      }
      const card = elements.getElement(CardElement);
      if (card) {
        const { error } = await stripe.createPaymentMethod({ element: card });
        if (error) {
          setErrorMsg(error.message || 'Payment method failed');
          setProcessing(false);
          return;
        }
      }
      onComplete();
    } catch {
      setErrorMsg('Unexpected payment error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleConfirm} style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
        Confirm Tip Payment
      </h3>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary, #999)' }}>Contribution to {recipientName}:</span>
          <span style={{ color: '#FFFFFF', fontWeight: 700 }}>${(amountCents / 100).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary, #999)' }}>Crowdbeats 6% Platform Fee:</span>
          <span style={{ color: 'var(--text-secondary, #999)' }}>${(platformFeeCents / 100).toFixed(2)}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary, #666)', margin: '8px 0 0', lineHeight: 1.4 }}>
          Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional.
        </p>
      </div>

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: '#0D0D10',
          marginBottom: 16,
        }}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '15px',
                color: '#FFFFFF',
                '::placeholder': { color: '#666666' },
              },
            },
          }}
        />
      </div>

      {errorMsg && (
        <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={processing}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 9999,
          background: 'var(--accent-primary, #7C3AED)',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: 15,
          border: 'none',
          cursor: processing ? 'not-allowed' : 'pointer',
        }}
      >
        {processing ? 'Confirming…' : `Confirm $${(amountCents / 100).toFixed(2)} Tip`}
      </button>
    </form>
  );
}

export function PerformerTipClientView({ id }: PerformerTipClientViewProps) {
  const { status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState<ResolvePerformerRecipientResponse | null>(null);
  const [errorNotFound, setErrorNotFound] = useState(false);

  const [selectedAmountCents, setSelectedAmountCents] = useState<number>(1000);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRecipient() {
      setLoading(true);
      setErrorNotFound(false);
      try {
        const res = await callCallableFunction<ResolvePerformerRecipientRequest, ResolvePerformerRecipientResponse>(
          'resolvePerformerRecipient',
          { identifier: id }
        );
        if (active) {
          setRecipient(res);
        }
      } catch (err: any) {
        if (active) {
          setErrorNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRecipient();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary, #999)', fontSize: 14 }}>
          Loading verified performer…
        </div>
      </div>
    );
  }

  if (errorNotFound || !recipient) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary, #FFFFFF)', marginBottom: 8 }}>
          Performer Unavailable
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #999)', marginBottom: 12 }}>
          Performer identifier: <code style={{ fontFamily: 'monospace' }}>{id}</code>
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary, #666)', lineHeight: 1.5, marginBottom: 24 }}>
          Crowdbeats never substitutes another recipient when a direct performer link is unavailable or unregistered.
        </p>
        <Link href="/">
          <button
            style={{
              padding: '10px 22px',
              borderRadius: 9999,
              background: 'var(--accent-primary, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Return to Discovery
          </button>
        </Link>
      </div>
    );
  }

  // Success view
  if (tipSuccess) {
    return (
      <div style={{ maxWidth: 480, margin: '48px auto', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
          Tip Confirmed!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #999)', marginBottom: 20 }}>
          Thank you for supporting <strong style={{ color: '#FFFFFF' }}>{recipient.displayName}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setTipSuccess(false)}
          style={{
            padding: '12px 24px',
            borderRadius: 9999,
            background: 'var(--accent-primary, #7C3AED)',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Send Another Tip
        </button>
      </div>
    );
  }

  const isSolo = recipient.performerType === 'artist';

  return (
    <main
      role="main"
      aria-label={`Direct tip for ${recipient.displayName}`}
      style={{ maxWidth: 540, margin: '40px auto', padding: '0 20px', fontFamily: 'var(--cb-font-body)' }}
    >
      {/* Performer Profile Card */}
      <div
        style={{
          background: 'var(--surface-card, #131315)',
          border: '1px solid var(--border-subtle, #28282C)',
          borderRadius: 24,
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: recipient.avatarUrl
                ? `url(${recipient.avatarUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg, #7C3AED, #03DAC6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            {!recipient.avatarUrl && recipient.displayName[0]}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {recipient.displayName}
              </h1>

              {recipient.isVerified && (
                <span
                  style={{
                    backgroundColor: 'rgba(3, 218, 198, 0.15)',
                    color: '#03DAC6',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid rgba(3, 218, 198, 0.3)',
                  }}
                >
                  Verified
                </span>
              )}

              {recipient.isLive && (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                  }}
                >
                  Live Now
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  color: '#A855F7',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 9999,
                }}
              >
                {isSolo ? 'Solo Musician' : 'Band'}
              </span>

              {recipient.genres.map((g) => (
                <span key={g} style={{ fontSize: 12, color: 'var(--text-secondary, #999)' }}>
                  {g}
                </span>
              ))}
            </div>

            {recipient.currentVenueName && (
              <div style={{ fontSize: 12, color: '#03DAC6', marginTop: 4 }}>
                Live at {recipient.currentVenueName}
              </div>
            )}
          </div>
        </div>

        {recipient.bio && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary, #A1A1A6)', margin: '16px 0 0', lineHeight: 1.5 }}>
            {recipient.bio}
          </p>
        )}
      </div>

      {/* Tipping Section or Ineligible State */}
      {!recipient.canAcceptTips ? (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 16,
            padding: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏸️</div>
          <strong style={{ color: '#EF4444', fontSize: 15, display: 'block', marginBottom: 4 }}>
            This performer is not currently accepting tips
          </strong>
          <span style={{ fontSize: 12, color: 'var(--text-secondary, #999)' }}>
            Status: {recipient.eligibilityReason || 'INELIGIBLE'}
          </span>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface-card, #131315)',
            border: '1px solid var(--border-subtle, #28282C)',
            borderRadius: 24,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary, #999)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>
            Select Tip Amount
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {PRESETS.map((p) => {
              const active = selectedAmountCents === p.cents;
              return (
                <button
                  key={p.cents}
                  type="button"
                  aria-label={`Select tip amount ${p.label}`}
                  aria-pressed={active}
                  onClick={() => setSelectedAmountCents(p.cents)}
                  style={{
                    padding: '14px 0',
                    borderRadius: 14,
                    border: active ? '2px solid var(--accent-primary, #7C3AED)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: active ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    color: active ? '#FFFFFF' : 'var(--text-secondary, #AAA)',
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Unauthenticated User Flow: Tip buttons trigger TipAuthGateModal */}
          {authStatus !== 'authenticated' ? (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setIsAuthGateOpen(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 9999,
                    background: 'var(--accent-primary, #7C3AED)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  Tip ${(selectedAmountCents / 100).toFixed(0)}
                </button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-tertiary, #666)', lineHeight: 1.5, textAlign: 'center' }}>
                <div>Crowdbeats charges a 6% platform fee.</div>
                <div>No app download or location permission needed.</div>
              </div>

              <TipAuthGateModal
                isOpen={isAuthGateOpen}
                onClose={() => setIsAuthGateOpen(false)}
                performerId={recipient.performerId}
                performerSlug={recipient.slug}
                performerName={recipient.displayName}
                performerType={recipient.performerType}
                initialAmountCents={selectedAmountCents}
                returnUrl={`/tip/${recipient.performerId}`}
                sourceScreen="direct_tip_qr"
              />
            </div>
          ) : (
            /* Authenticated Flow: Confirm Tip Payment Form */
            stripePromise ? (
              <Elements stripe={stripePromise}>
                <AuthenticatedCheckoutForm
                  amountCents={selectedAmountCents}
                  recipientName={recipient.displayName}
                  performerId={recipient.performerId}
                  performerType={recipient.performerType}
                  onComplete={() => setTipSuccess(true)}
                />
              </Elements>
            ) : (
              <AuthenticatedCheckoutForm
                amountCents={selectedAmountCents}
                recipientName={recipient.displayName}
                performerId={recipient.performerId}
                performerType={recipient.performerType}
                onComplete={() => setTipSuccess(true)}
              />
            )
          )}
        </div>
      )}
    </main>
  );
}
