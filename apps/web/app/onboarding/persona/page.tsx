/**
 * Crowdbeats V2 — Persona Picker (Phase 5)
 * Route: /onboarding/persona
 *
 * Step 2 of onboarding. User selects: Fan | Artist | Band | Venue | Sponsor.
 * STAFF is NOT available here — staff accounts are server-only.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ROLE_TO_PERSONA, SIGNUP_INTENT_KEY, isSignupRole } from '@/components/landing/v3/signupIntent';

const PERSONAS = [
  {
    id:          'fan',
    icon:        '❤️',
    title:       'Fan',
    description: 'Discover live music, tip your favourite artists, and follow their journeys.',
    color:       'var(--accent-primary)',
  },
  {
    id:          'artist',
    icon:        '🎤',
    title:       'Artist (Solo)',
    description: 'Receive tips, manage your profile, and connect with fans at your shows.',
    color:       'var(--accent-secondary)',
  },
  {
    id:          'band_member',
    icon:        '🎸',
    title:       'Band / Group',
    description: 'Create a band, manage members, and split tips automatically.',
    color:       'var(--dataviz-3)',
  },
  {
    id:          'venue_manager',
    icon:        '🏟️',
    title:       'Venue',
    description: 'Host shows, manage stages, and support the artists performing at your space.',
    color:       'var(--dataviz-4)',
  },
  {
    id:          'sponsor_rep',
    icon:        '💼',
    title:       'Sponsor / Brand',
    description: 'Discover talent, sponsor shows, and measure audience engagement.',
    color:       'var(--dataviz-5)',
  },
] as const;

type PersonaId = typeof PERSONAS[number]['id'];

export default function PersonaPickerPage() {
  const { status, personaType } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<PersonaId | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.replace('/auth');
    if (status === 'unverified')      router.replace('/auth/verify-email');
  }, [status, router]);

  // Preselect from landing signup intent (?intent= or localStorage). User still confirms.
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('intent');
      const intent = isSignupRole(fromUrl) ? fromUrl : window.localStorage.getItem(SIGNUP_INTENT_KEY);
      if (!isSignupRole(intent)) return;
      const personaId = ROLE_TO_PERSONA[intent];
      const match = PERSONAS.find((p) => p.id === personaId);
      if (match) setSelected((prev) => prev ?? match.id);
    } catch {
      /* storage unavailable — no preselect */
    }
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cb_pending_persona', selected);
      } catch {}
    }
    const slug = selected.replace('_manager', '').replace('_member', '').replace('_rep', '');
    router.push(`/onboarding/${slug}`);
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'flex-start',
      justifyContent: 'center',
      padding:        '56px 16px 80px',
      background:     '#000000',
    }}>
      <div style={{ width: '100%', maxWidth: 580 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(124, 58, 237, 0.35)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2" fill="#2DD4BF"/>
                <path d="M12 14V18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span
              style={{
                fontFamily: 'var(--cb-font-display)',
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: '-0.024em',
                color: '#F5F5F7',
              }}
            >
              Crowdbeats
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F7', margin: '0 0 8px', letterSpacing: '-0.024em' }}>
            How will you use Crowdbeats?
          </h1>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 15, color: '#86868B', margin: 0, lineHeight: 1.5, letterSpacing: '-0.012em' }}>
            Choose your primary experience. You can always configure additional roles later from your settings.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Choose your persona"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {PERSONAS.map((p) => {
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(p.id)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          16,
                  padding:      '18px 22px',
                  borderRadius: 18,
                  border:       `1px solid ${isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)'}`,
                  background:   isSelected ? 'rgba(255, 255, 255, 0.08)' : '#161617',
                  boxShadow:    isSelected
                    ? '0 0 0 1px #FFFFFF, 0 8px 24px rgba(0, 0, 0, 0.4)'
                    : '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
                  cursor:       'pointer',
                  textAlign:    'left',
                  width:        '100%',
                  transition:   'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline:      'none',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#161617';
                }}
              >
                <span
                  style={{
                    fontSize:     26,
                    width:        48,
                    height:       48,
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    background:   'rgba(255, 255, 255, 0.06)',
                    borderRadius: 14,
                    flexShrink:   0,
                  }}
                  aria-hidden="true"
                >
                  {p.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--cb-font-display)', fontSize: 16, fontWeight: 600, color: '#F5F5F7', marginBottom: 3, letterSpacing: '-0.016em' }}>
                    {p.title}
                  </div>
                  <div style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: '#86868B', lineHeight: 1.45, letterSpacing: '-0.012em' }}>
                    {p.description}
                  </div>
                </div>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `1.5px solid ${isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)'}`,
                    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13L9 17L19 7" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            onClick={handleContinue}
            disabled={!selected}
            style={{
              width:        '100%',
              minHeight:    48,
              borderRadius: 9999,
              border:       selected ? '1px solid #333333' : 'none',
              background:   selected ? '#000000' : 'rgba(255, 255, 255, 0.08)',
              color:        selected ? '#FFFFFF' : '#6E6E73',
              fontSize:     15,
              fontWeight:   600,
              fontFamily:   'var(--cb-font-display)',
              cursor:       selected ? 'pointer' : 'not-allowed',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              gap:          8,
              transition:   'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              if (selected) e.currentTarget.style.backgroundColor = '#1D1D1F';
            }}
            onMouseLeave={(e) => {
              if (selected) e.currentTarget.style.backgroundColor = '#000000';
            }}
            aria-disabled={!selected}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
