'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DiscoveryCampaign } from '@/lib/discovery/discoveryDataService';

interface BackCampaignModalProps {
  campaign: DiscoveryCampaign;
  onClose: () => void;
}

const PLEDGE_PRESETS = [10, 25, 50, 100, 250];

function formatCurrency(dollars: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars);
}

export function BackCampaignModal({ campaign, onClose }: BackCampaignModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const activeDollars = customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0
    ? Number(customAmount)
    : selectedAmount;

  // Dynamic reward tier description based on active pledge amount
  let tierTitle = 'Digital Supporter';
  let tierPerk = 'Digital album download + Name included in project album liner notes.';
  if (activeDollars >= 250) {
    tierTitle = 'Executive Producer Tier';
    tierPerk = 'Executive Producer credit on vinyl & digital release, 2 VIP all-access backstage passes to any tour date, signed marbled vinyl LP, and a personal video acoustic song performance.';
  } else if (activeDollars >= 100) {
    tierTitle = 'VIP Tour & Soundcheck Tier';
    tierPerk = 'VIP soundcheck access at your local show, signed 180g marbled vinyl LP, Associate Producer credit in liner notes, and official tour merchandise bundle.';
  } else if (activeDollars >= 50) {
    tierTitle = 'Limited Edition Vinyl Tier';
    tierPerk = 'Limited-edition 180g marbled violet vinyl LP (first pressing of 500), exclusive enamel tour pin, and high-res digital audio master download.';
  } else if (activeDollars >= 25) {
    tierTitle = 'Signed Physical CD Tier';
    tierPerk = 'Signed physical compact disc or cassette, early digital streaming access 14 days before global release, and digital album art booklet.';
  }

  const handlePledgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2400);
    }, 800);
  };

  const isBand = campaign.creatorType === 'band';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pledge-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          maxWidth: 560,
          backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
          borderRadius: 24,
          border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.1))',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(124, 58, 237, 0.12)',
                  color: '#7C3AED',
                }}
              >
                Backing Campaign
              </span>
              <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #86868B)' }}>
                {campaign.category || 'Music Project'}
              </span>
            </div>
            <h2
              id="pledge-modal-title"
              style={{
                fontSize: 'clamp(18px, 3vw, 22px)',
                fontWeight: 800,
                color: 'var(--cb-text-primary, #1D1D1F)',
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {campaign.title}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--cb-text-secondary, #6E6E73)',
                margin: '4px 0 0',
              }}
            >
              by <strong>{campaign.creatorName}</strong> ({isBand ? 'Band' : 'Solo Musician'})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close pledge modal"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
              color: 'var(--cb-text-secondary, #6E6E73)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isSuccess ? (
            <div
              style={{
                padding: '32px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--cb-text-primary, #1D1D1F)', margin: 0 }}>
                Pledge Confirmed!
              </h3>
              <p style={{ fontSize: 14, color: 'var(--cb-text-secondary, #6E6E73)', maxWidth: 360, margin: 0 }}>
                You backed <strong>{campaign.title}</strong> with {formatCurrency(activeDollars)}. A confirmation receipt and backer perks have been delivered to your account.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePledgeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Campaign Progress Pill */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                  border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.06))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#7C3AED' }}>{campaign.percentFunded}% funded</span>
                  <span style={{ color: 'var(--cb-text-secondary, #6E6E73)' }}>
                    {formatCurrency(Math.round(campaign.pledgedCents / 100))} of {formatCurrency(Math.round(campaign.goalCents / 100))} goal
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(campaign.percentFunded, 100)}%`,
                      height: '100%',
                      borderRadius: 9999,
                      background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
                    }}
                  />
                </div>
              </div>

              {/* Select Pledge Amount */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--cb-text-primary, #1D1D1F)',
                    marginBottom: 10,
                  }}
                >
                  Select Pledge Amount
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLEDGE_PRESETS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount('');
                        }}
                        style={{
                          flex: '1 1 70px',
                          padding: '10px 14px',
                          borderRadius: 12,
                          border: isSelected ? '2px solid #7C3AED' : '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                          backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'var(--cb-surface-1, #FFFFFF)',
                          color: isSelected ? '#7C3AED' : 'var(--cb-text-primary, #1D1D1F)',
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Field */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--cb-text-secondary, #6E6E73)', fontWeight: 600 }}>
                    Custom amount: $
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="10000"
                    placeholder="Other"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    style={{
                      width: 120,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.15))',
                      backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                      color: 'var(--cb-text-primary, #1D1D1F)',
                      fontSize: 14,
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Reward Tier Preview Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(124, 58, 237, 0.06)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎁</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>
                    {tierTitle} (for {formatCurrency(activeDollars)})
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--cb-text-primary, #1D1D1F)',
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {tierPerk}
                </p>
              </div>

              {/* Optional Fan Encouragement Note */}
              <div>
                <label
                  htmlFor="fan-support-note"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--cb-text-primary, #1D1D1F)',
                    marginBottom: 6,
                  }}
                >
                  Note of Encouragement (Optional)
                </label>
                <textarea
                  id="fan-support-note"
                  rows={2}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Leave a note for the artist or band..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                    backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                    color: 'var(--cb-text-primary, #1D1D1F)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={isSubmitting || activeDollars <= 0}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    borderRadius: 9999,
                    border: 'none',
                    backgroundColor: '#7C3AED',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
                    transition: 'all 0.15s ease',
                    opacity: isSubmitting || activeDollars <= 0 ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Processing...' : `Pledge ${formatCurrency(activeDollars)} with Google Pay / Card`}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '14px 20px',
                    borderRadius: 9999,
                    border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                    backgroundColor: 'transparent',
                    color: 'var(--cb-text-secondary, #6E6E73)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
