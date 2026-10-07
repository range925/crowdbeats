'use client';

/**
 * Crowdbeats V2 — Web Tip Auth Gate Modal
 * 
 * Displayed when an unauthenticated visitor attempts to tip an artist/band.
 * Preserves the selected amount & recipient in sessionStorage and provides
 * clear guidance that no auto-charge will occur.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PendingTipAction } from '@crowdbeats/contracts';
import { DiscoveryClient } from '@/lib/discovery/discoveryClient';
import { calculateNetTipPayout } from '@/lib/financial/stripeDailyFeeService';

interface TipAuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  performerId: string;
  performerSlug: string;
  performerName: string;
  performerType: 'artist' | 'band';
  initialAmountCents?: number;
  returnUrl?: string;
  sourceScreen?: string;
}

export const TipAuthGateModal: React.FC<TipAuthGateModalProps> = ({
  isOpen,
  onClose,
  performerId,
  performerSlug,
  performerName,
  performerType,
  initialAmountCents = 2000,
  returnUrl,
  sourceScreen = 'web_discovery',
}) => {
  const router = useRouter();
  const [selectedCents, setSelectedCents] = useState<number>(initialAmountCents);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAmountCents = isCustom && customAmount
    ? Math.round(parseFloat(customAmount) * 100)
    : selectedCents;

  const amountDollars = (currentAmountCents / 100).toFixed(0);

  const handleProceedToAuth = () => {
    const pendingAction: PendingTipAction = {
      creatorId: performerId,
      creatorSlug: performerSlug,
      creatorName: performerName,
      creatorType: performerType,
      selectedTipAmountCents: currentAmountCents,
      currency: 'USD',
      sourceScreen: (sourceScreen as any) || 'web_discovery',
      timestamp: Date.now(),
    };

    DiscoveryClient.savePendingTip(pendingAction);
    onClose();
    const dest = returnUrl
      ? `/auth?returnUrl=${returnUrl}&tipCents=${currentAmountCents}`
      : `/auth?returnUrl=/${performerType}/${performerSlug}&tipCents=${currentAmountCents}`;
    router.push(dest);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#131315',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--cb-text-muted)',
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* Recipient & Amount Badge */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 9999,
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              color: '#A855F7',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <span>🎶</span>
            <span>{performerName} · ${amountDollars}</span>
          </div>
        </div>

        {/* Modal Title */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#FFFFFF',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
          }}
        >
          Sign in to tip {performerName}
        </h2>

        {/* Clear Policy Notice */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--cb-text-secondary)',
            textAlign: 'center',
            lineHeight: 1.5,
            margin: '0 0 20px',
          }}
        >
          You will return directly to confirm your ${amountDollars} tip after signing in. Your card will not be charged automatically.
        </p>

        {/* Preset Amount Selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--cb-text-muted)', fontWeight: 600, marginBottom: 8 }}>
            Select Tip Amount:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
            {[
              { label: '$5', cents: 500 },
              { label: '$10', cents: 1000 },
              { label: '$20', cents: 2000 },
            ].map((preset) => {
              const isSelected = !isCustom && selectedCents === preset.cents;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedCents(preset.cents);
                  }}
                  style={{
                    padding: '10px 0',
                    borderRadius: 12,
                    backgroundColor: isSelected ? 'var(--cb-purple-main)' : 'rgba(255, 255, 255, 0.06)',
                    border: isSelected ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isSelected ? '#FFFFFF' : 'var(--cb-text-secondary)',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Transparent Fee Breakdown & Disclosure ── */}
        {(() => {
          const breakdown = calculateNetTipPayout(currentAmountCents);
          const grossDollars = (breakdown.grossAmountCents / 100).toFixed(2);
          const platformDollars = (breakdown.platformFeeCents / 100).toFixed(2);
          const stripeDollars = (breakdown.stripeProcessingFeeCents / 100).toFixed(2);
          const netDollars = (breakdown.netProceedsCents / 100).toFixed(2);

          return (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 20,
                fontSize: 12,
                color: '#94A3B8',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gross Contribution:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>${grossDollars}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Crowdbeats Platform Fee (6%):</span>
                <span style={{ color: '#F87171' }}>−${platformDollars}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stripe Processing & Connect Fees (Daily Rate: 2.9% + 30¢):</span>
                <span style={{ color: '#F87171' }}>−${stripeDollars}</span>
              </div>
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  color: '#34D399',
                }}
              >
                <span>Est. {performerName} Net Proceeds:</span>
                <span>${netDollars}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>
                  Daily Stripe Rate Verified ({breakdown.effectiveDate}) • 6% Platform Fee Deducted
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>
                “Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional.”
              </div>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={handleProceedToAuth}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.45)',
            }}
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleProceedToAuth}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Continue with Apple
          </button>

          <button
            type="button"
            onClick={handleProceedToAuth}
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              border: 'none',
              color: '#A855F7',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in with email
          </button>
        </div>
      </div>
    </div>
  );
};
