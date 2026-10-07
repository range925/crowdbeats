'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface BandVenueItem {
  name: string;
  city: string;
  showsCount: number;
  revenue: number;
  avgAttendance: number;
  tippingIndex: number;
}

interface BandMemberSplit {
  name: string;
  role: string;
  percentage: number;
  amount: number;
}

interface BandGigItem {
  id: string;
  venueName: string;
  city: string;
  date: string;
  duration: string;
  attendance: number;
  gross: number;
  platformFee: number;
  stripeFee: number;
  net: number;
  splits: BandMemberSplit[];
}

export default function BandAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'all' | '30d' | '7d'>('all');
  const [copied, setCopied] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState(5);

  // Timeframe-adapted telemetry data for The Midnight Echoes (Band Studio)
  const totalRevenue = timeframe === '7d' ? 980.0 : timeframe === '30d' ? 3640.0 : 12450.0;
  const showsCount = timeframe === '7d' ? 3 : timeframe === '30d' ? 11 : 42;
  const attendance = timeframe === '7d' ? 640 : timeframe === '30d' ? 2450 : 8920;
  const avgShow = totalRevenue / showsCount;

  const topVenues: BandVenueItem[] = [
    { name: 'The Casbah', city: 'San Diego, CA', showsCount: 12, revenue: 3850.0, avgAttendance: 240, tippingIndex: 96 },
    { name: 'Belly Up Tavern', city: 'Solana Beach, CA', showsCount: 10, revenue: 3200.0, avgAttendance: 310, tippingIndex: 94 },
    { name: 'Neon Lounge', city: 'Los Angeles, CA', showsCount: 8, revenue: 2450.0, avgAttendance: 280, tippingIndex: 91 },
    { name: 'The Troubadour', city: 'West Hollywood, CA', showsCount: 6, revenue: 1850.0, avgAttendance: 350, tippingIndex: 97 },
    { name: 'Music Box', city: 'San Diego, CA', showsCount: 6, revenue: 1100.0, avgAttendance: 290, tippingIndex: 88 },
  ];

  const recentGigs: BandGigItem[] = [
    {
      id: 'gig_b1',
      venueName: 'Belly Up Tavern',
      city: 'Solana Beach, CA',
      date: 'Yesterday, 10:15 PM',
      duration: '2h 00m',
      attendance: 310,
      gross: 450.0,
      platformFee: 27.0,
      stripeFee: 13.35,
      net: 409.65,
      splits: [
        { name: 'Elena Cruz', role: 'Lead Vocals', percentage: 40, amount: 163.86 },
        { name: 'Marcus Vance', role: 'Bass', percentage: 25, amount: 102.41 },
        { name: 'Leo Sterling', role: 'Drums', percentage: 25, amount: 102.41 },
        { name: 'Chloe Bennett', role: 'Keyboards', percentage: 10, amount: 40.97 },
      ],
    },
    {
      id: 'gig_b2',
      venueName: 'The Casbah',
      city: 'San Diego, CA',
      date: 'Sep 16, 2026, 9:30 PM',
      duration: '1h 45m',
      attendance: 240,
      gross: 320.0,
      platformFee: 19.2,
      stripeFee: 9.58,
      net: 291.22,
      splits: [
        { name: 'Elena Cruz', role: 'Lead Vocals', percentage: 40, amount: 116.49 },
        { name: 'Marcus Vance', role: 'Bass', percentage: 25, amount: 72.80 },
        { name: 'Leo Sterling', role: 'Drums', percentage: 25, amount: 72.80 },
        { name: 'Chloe Bennett', role: 'Keyboards', percentage: 10, amount: 29.13 },
      ],
    },
    {
      id: 'gig_b3',
      venueName: 'The Troubadour',
      city: 'West Hollywood, CA',
      date: 'Sep 12, 2026, 10:00 PM',
      duration: '2h 15m',
      attendance: 350,
      gross: 600.0,
      platformFee: 36.0,
      stripeFee: 17.70,
      net: 546.30,
      splits: [
        { name: 'Elena Cruz', role: 'Lead Vocals', percentage: 40, amount: 218.52 },
        { name: 'Marcus Vance', role: 'Bass', percentage: 25, amount: 136.58 },
        { name: 'Leo Sterling', role: 'Drums', percentage: 25, amount: 136.58 },
        { name: 'Chloe Bennett', role: 'Keyboards', percentage: 10, amount: 54.62 },
      ],
    },
  ];

  const revenueHistory = [
    { label: 'Aug 28', venue: 'The Casbah', gross: 450.0, net: 409.65 },
    { label: 'Sep 05', venue: 'Music Box', gross: 350.0, net: 318.65 },
    { label: 'Sep 10', venue: 'Belly Up Tavern', gross: 620.0, net: 564.52 },
    { label: 'Sep 12', venue: 'The Troubadour', gross: 600.0, net: 546.30 },
    { label: 'Sep 15', venue: 'Neon Lounge', gross: 380.0, net: 345.88 },
    { label: 'Yesterday', venue: 'Belly Up Tavern', gross: 450.0, net: 409.65 },
  ];

  const maxGross = Math.max(...revenueHistory.map((h) => h.gross), 650);
  const selectedGig = revenueHistory[selectedBarIndex] ?? revenueHistory[revenueHistory.length - 1];

  const handleExport = () => {
    const summary = `Crowdbeats Band Analytics for The Midnight Echoes:
• Band Tip Revenue: $${totalRevenue.toFixed(2)}
• Shows: ${showsCount}
• Total Fans: ${attendance.toLocaleString()}
• Timeframe: ${timeframe.toUpperCase()}
• Crowdbeats 6% Platform Fee & Daily Stripe Rate Deducted
• Split Yields Distributed: Elena (40%), Marcus (25%), Leo (25%), Chloe (10%)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1080, margin: '0 auto', color: '#fff' }}>
      {/* Header with Band Studio Pill & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: 0.5
            }}>
              BAND STUDIO
            </span>
            <span style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13 }}>The Midnight Echoes</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              Live Multi-Venue Engine
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            Band Analytics & Growth
          </h1>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, margin: '4px 0 0' }}>
            Multi-venue tipping velocity, audience retention, and automated 4-way split yield telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Timeframe selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['all', '30d', '7d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  background: timeframe === t ? '#10B981' : 'transparent',
                  color: timeframe === t ? '#fff' : '#9CA3AF',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: timeframe === t ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t === 'all' ? 'All Time' : t === '30d' ? '30 Days' : '7 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Automated Venue Intelligence & Growth Insight Banner */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(18, 20, 32, 0.6))',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 12,
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ color: '#E5E7EB', fontSize: 13, fontWeight: 500 }}>
          <strong>Band Intelligence:</strong> The Troubadour generates your highest average tip yield ($1.84/fan). Peak tipping occurs at 10:45 PM during guitar duets & encore.
        </span>
      </div>

      {/* 4-Card Hero Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>TOTAL BAND TIPS</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#34D399' }}>${totalRevenue.toFixed(2)}</div>
          <div style={{ color: '#10B981', fontSize: 11, marginTop: 4, fontWeight: 600 }}>6% Fee + Stripe deducted</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>AVG REVENUE / GIG</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#A78BFA' }}>${avgShow.toFixed(2)}</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, marginTop: 4 }}>Across {showsCount} band sets</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>GIGS COMPLETED</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary, #1D1D1F)' }}>{showsCount} gigs</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, marginTop: 4 }}>Multi-venue stages</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>AUDIENCE ENGAGEMENT</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#60A5FA' }}>{attendance.toLocaleString()}</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, marginTop: 4 }}>Total live attendance</div>
        </div>
      </div>

      {/* Interactive Gig Revenue Trajectory Bar Chart */}
      <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#34D399' }}>
              BAND GIG REVENUE TRAJECTORY (LAST 6 SHOWS)
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>Interactive gross tip yield per gig — click any bar to inspect</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} /> Gross Tips
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 2, background: '#A78BFA' }} /> Avg Benchmark (${avgShow.toFixed(0)})
            </span>
          </div>
        </div>

        {/* Visual Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 140, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {revenueHistory.map((h, idx) => {
            const isSelected = idx === selectedBarIndex;
            const barHeight = Math.max(22, (h.gross / maxGross) * 95);
            return (
              <div
                key={h.label}
                onClick={() => setSelectedBarIndex(idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? '#34D399' : '#9CA3AF', marginBottom: 4 }}>
                  ${h.gross.toFixed(0)}
                </span>
                <div style={{
                  width: 38,
                  height: barHeight,
                  borderRadius: '6px 6px 0 0',
                  background: isSelected
                    ? 'linear-gradient(180deg, #34D399 0%, #10B981 100%)'
                    : 'linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)',
                  boxShadow: isSelected ? '0 0 12px rgba(52, 211, 153, 0.4)' : 'none',
                  border: isSelected ? '1.5px solid #fff' : 'none',
                }} />
                <span style={{ fontSize: 11, fontWeight: isSelected ? 800 : 500, color: isSelected ? '#fff' : '#9CA3AF', marginTop: 6 }}>
                  {h.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Gig Highlight Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          padding: '8px 14px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            📍 {selectedGig.venue} ({selectedGig.label})
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#34D399' }}>
            Gross Tips: ${selectedGig.gross.toFixed(2)}  •  Net Band Pool: ${selectedGig.net.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 2x2 Performance Efficiency & Conversion Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>TIP CONVERSION RATE</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981', margin: '4px 0 2px' }}>52.4%</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Checked-in fans who tipped</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>AVG TIP / ATTENDEE</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#34D399', margin: '4px 0 2px' }}>$1.84</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Yield per total attendee</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>STAGE VELOCITY</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#A78BFA', margin: '4px 0 2px' }}>$176.40/hr</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Earnings per hour on stage</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>QR STAGE CONVERSION</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#60A5FA', margin: '4px 0 2px' }}>84.5%</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Scans converted into tips</div>
        </div>
      </div>

      {/* Secondary Telemetry Strip */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 12,
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>REPEAT TIPPER RATIO</div>
          <div style={{ color: '#10B981', fontSize: 14, fontWeight: 800, marginTop: 2 }}>34.2%</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>AVG TIP SIZE</div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, marginTop: 2 }}>$24.50</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>PEAK TIPPING VELOCITY</div>
          <div style={{ color: '#34D399', fontSize: 14, fontWeight: 800, marginTop: 2 }}>10:45 PM (Guitar Duet & Finale)</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>ACTIVE MEMBERS</div>
          <div style={{ color: '#A78BFA', fontSize: 14, fontWeight: 800, marginTop: 2 }}>4 Auto-Splits Active</div>
        </div>
      </div>

      {/* Fee Pipeline & Daily Rate Deduction Card */}
      <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#34D399' }}>
            BAND NET PAYOUT & SPLIT PIPELINE
          </h2>
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6
          }}>
            ✓ Daily Rate Synced (2.9% + 30¢)
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 12, margin: '0 0 12px' }}>
          Exact deductions applied to gross tips before automated member split disbursements:
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          background: 'rgba(0,0,0,0.25)',
          padding: 12,
          borderRadius: 10,
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary, #6E6E73)', fontWeight: 700 }}>GROSS TIPS</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 2 }}>100.0%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary, #6E6E73)', fontWeight: 700 }}>CROWDBEATS FEE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#A78BFA', marginTop: 2 }}>-6.00%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary, #6E6E73)', fontWeight: 700 }}>STRIPE DAILY FEE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#60A5FA', marginTop: 2 }}>-2.9% + 30¢</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary, #6E6E73)', fontWeight: 700 }}>NET SPLIT POOL</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#34D399', marginTop: 2 }}>Distributed 4-Way</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Multi-Venue Leaderboard & Recent Gig Payouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Multi-Venue Leaderboard */}
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#34D399' }}>
              VENUE PERFORMANCE & LEADERBOARD
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>Ranked by Tip Revenue</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topVenues.map((v, i) => (
              <div
                key={v.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: i === 0 ? 'rgba(245, 158, 11, 0.2)' : i === 1 ? 'rgba(148, 163, 184, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    color: i === 0 ? '#F59E0B' : i === 1 ? '#CBD5E1' : '#34D399',
                    fontSize: 11,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    #{i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>{v.city} • {v.showsCount} shows • Avg {v.avgAttendance} fans</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#34D399' }}>${v.revenue.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>{v.tippingIndex}% velocity index</div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Distribution Share bar */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary, #6E6E73)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
              VENUE REVENUE DISTRIBUTION SHARE
            </div>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: '31%', background: '#10B981' }} title="The Casbah (31%)" />
              <div style={{ width: '26%', background: '#8B5CF6' }} title="Belly Up Tavern (26%)" />
              <div style={{ width: '20%', background: '#60A5FA' }} title="Neon Lounge (20%)" />
              <div style={{ width: '15%', background: '#F59E0B' }} title="The Troubadour (15%)" />
              <div style={{ width: '8%', background: '#EC4899' }} title="Music Box (8%)" />
            </div>
          </div>
        </div>

        {/* Recent Band Gigs & Itemized Member Split Payouts */}
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#34D399' }}>
              RECENT GIG SETTLEMENTS & MEMBER SPLITS
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>4-Way Yield</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {recentGigs.map((gig) => (
              <div
                key={gig.id}
                style={{
                  padding: 12,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{gig.venueName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>{gig.city} • {gig.date} ({gig.duration})</div>
                  </div>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}>
                    ${gig.net.toFixed(2)} NET
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary, #6E6E73)', marginBottom: 8 }}>
                  <span>Gross Tips: ${gig.gross.toFixed(2)}</span>
                  <span>6% Fee: -${gig.platformFee.toFixed(2)}</span>
                  <span>Stripe: -${gig.stripeFee.toFixed(2)}</span>
                  <span style={{ color: '#A78BFA' }}>{gig.attendance} fans</span>
                </div>

                {/* Member Split Yield Breakdown */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', letterSpacing: 0.5, marginBottom: 4 }}>
                    AUTOMATED SPLIT DISBURSEMENTS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {gig.splits.map((s) => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#E5E7EB' }}>
                          {s.name} <span style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10 }}>({s.percentage}%)</span>
                        </span>
                        <span style={{ color: '#34D399', fontWeight: 700 }}>
                          ${s.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Set Time Tipping Velocity */}
      <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: '0 0 14px', color: '#34D399' }}>
          BAND LIVE SET TIPPING VELOCITY DISTRIBUTION
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Opening Set & Intro Tracks (First 25m)</span>
              <span style={{ color: '#34D399', fontWeight: 700 }}>10%</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '10%', height: '100%', background: '#A78BFA' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Mid-Set Jam & Fan Interactions</span>
              <span style={{ color: '#34D399', fontWeight: 700 }}>25%</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', background: '#A78BFA' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Peak Energy, Solos & Main Anthems</span>
              <span style={{ color: '#34D399', fontWeight: 700 }}>45% (Highest Velocity)</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '45%', height: '100%', background: '#34D399' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Encore, Drum Solos & Stage Bow</span>
              <span style={{ color: '#34D399', fontWeight: 700 }}>20%</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '20%', height: '100%', background: '#A78BFA' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


