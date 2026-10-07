'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CreatorDashboardPage() {
  const { displayName } = useAuth();
  const name = displayName || 'Musician';

  return (
    <div style={{
      padding: '36px 40px',
      maxWidth: 1200,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif",
      letterSpacing: '-0.015em',
      color: 'var(--text-primary, #1D1D1F)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.024em' }}>
            Welcome, {name} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 14, margin: 0 }}>
            Here is your live overview and solo performance studio.
          </p>
        </div>
        <Link href="/creator/campaigns/new" style={{ textDecoration: 'none' }}>
          <button style={{
            background: '#000000',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.15s ease'
          }}>
            + New Campaign
          </button>
        </Link>
      </div>

      {/* GO LIVE HERO BENTO */}
      <div style={{
        background: 'var(--surface-1, #FFFFFF)',
        border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🎙️</span>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.015em' }}>Stage Check-in & Live Radar</span>
            <span style={{
              background: 'rgba(48, 209, 88, 0.15)',
              color: '#30D158',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 9999,
              border: '1px solid rgba(48, 209, 88, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#30D158', animation: 'pulse 1.5s infinite' }} />
              READY FOR STAGE
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Check in at your venue or street pitch — fans within 5 miles will see you on the discovery map and can send instant Apple Pay tips.
          </p>
        </div>
        <a href="/creator/performances" style={{ textDecoration: 'none' }}>
          <button style={{
            background: '#30D158',
            color: '#000000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 9999,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(48, 209, 88, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>⚡</span>
            <span>Start Performance</span>
          </button>
        </a>
      </div>

      {/* Metrics Bento Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Available Balance</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#30D158', letterSpacing: '-0.024em' }}>$1,248.50</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 6 }}>Instant Stripe payout ready</div>
        </div>

        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Total Tips Received</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.024em' }}>$4,890.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 6 }}>148 fan tips verified</div>
        </div>

        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Followers</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.024em' }}>3,420</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 6 }}>+58 new this week</div>
        </div>

        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Payout Account</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#000000', marginTop: 8 }}>Stripe Connected</div>
          <Link href="/creator/payouts" style={{ fontSize: 12, color: '#000000', textDecoration: 'none', display: 'inline-block', marginTop: 6, fontWeight: 600 }}>
            Manage Payouts →
          </Link>
        </div>
      </div>

      {/* Quick Action Bento Grid */}
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary, #6E6E73)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Studio Quick Actions
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Link href="/creator/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--surface-1, #FFFFFF)',
            padding: 24,
            borderRadius: 18,
            border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s'
          }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🎤</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', marginBottom: 6, fontSize: 15 }}>Update EPK Profile</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.4 }}>Bio, photography, genre chips, Spotify & Apple Music links</div>
          </div>
        </Link>

        <Link href="/creator/campaigns" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--surface-1, #FFFFFF)',
            padding: 24,
            borderRadius: 18,
            border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s'
          }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🚀</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', marginBottom: 6, fontSize: 15 }}>Manage Campaigns</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.4 }}>Crowdfunding goals, backer rewards, and milestone updates</div>
          </div>
        </Link>

        <Link href="/creator/marketing" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--surface-1, #FFFFFF)',
            padding: 24,
            borderRadius: 18,
            border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s'
          }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>📣</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', marginBottom: 6, fontSize: 15 }}>Marketing & Tip Links</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.4 }}>Shareable tip links, dynamic stage QR codes, embed widgets</div>
          </div>
        </Link>
      </div>

      {/* Mobile Companion Promo Bento Banner */}
      <div style={{
        background: 'var(--surface-1, #FFFFFF)',
        border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        borderRadius: 20,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ maxWidth: 650 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary, #1D1D1F)', marginBottom: 4 }}>
            📱 Go Live on the Crowdbeats Companion App
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.4 }}>
            Start a live street or venue session, generate expiring QR codes, and receive real-time push alerts on iOS and Android.
          </div>
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary, #1D1D1F)',
          background: 'rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '10px 20px',
          borderRadius: 9999,
          cursor: 'pointer'
        }}>
          Download Companion
        </div>
      </div>
    </div>
  );
}
