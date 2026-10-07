'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface VenueItem {
  name: string;
  city: string;
  showsCount: number;
  revenue: number;
  avgAttendance: number;
  tippingIndex: number;
}

interface GigItem {
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
}

export default function CreatorAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'all' | '30d' | '7d'>('all');
  const [copied, setCopied] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState(5);

  // Timeframe-adapted telemetry data for Elena Cruz (Solo)
  const totalRevenue = timeframe === '7d' ? 385.0 : timeframe === '30d' ? 1420.0 : 4820.0;
  const showsCount = timeframe === '7d' ? 2 : timeframe === '30d' ? 8 : 28;
  const attendance = timeframe === '7d' ? 240 : timeframe === '30d' ? 980 : 3450;
  const avgShow = totalRevenue / showsCount;

  const topVenues: VenueItem[] = [
    { name: 'The Casbah', city: 'San Diego, CA', showsCount: 6, revenue: 1250.0, avgAttendance: 120, tippingIndex: 94 },
    { name: 'Sunset Lounge', city: 'San Diego, CA', showsCount: 5, revenue: 980.0, avgAttendance: 85, tippingIndex: 92 },
    { name: 'Soda Bar', city: 'San Diego, CA', showsCount: 5, revenue: 840.0, avgAttendance: 95, tippingIndex: 89 },
    { name: 'Hotel Cafe', city: 'Los Angeles, CA', showsCount: 4, revenue: 890.0, avgAttendance: 110, tippingIndex: 95 },
    { name: "Lestat's Coffee House", city: 'San Diego, CA', showsCount: 8, revenue: 860.0, avgAttendance: 70, tippingIndex: 86 },
  ];

  const recentGigs: GigItem[] = [
    {
      id: 'gig_s1',
      venueName: 'The Casbah',
      city: 'San Diego, CA',
      date: 'Today, 9:15 PM',
      duration: '1h 30m',
      attendance: 95,
      gross: 150.0,
      platformFee: 9.0,
      stripeFee: 4.65,
      net: 136.35,
    },
    {
      id: 'gig_s2',
      venueName: 'Sunset Lounge',
      city: 'San Diego, CA',
      date: 'Yesterday, 8:40 PM',
      duration: '1h 15m',
      attendance: 75,
      gross: 100.0,
      platformFee: 6.0,
      stripeFee: 3.20,
      net: 90.80,
    },
    {
      id: 'gig_s3',
      venueName: 'Hotel Cafe',
      city: 'Los Angeles, CA',
      date: 'Sep 14, 2026',
      duration: '1h 45m',
      attendance: 120,
      gross: 225.0,
      platformFee: 13.50,
      stripeFee: 6.83,
      net: 204.67,
    },
  ];

  const revenueHistory = [
    { label: 'Aug 29', venue: 'Sunset Lounge', gross: 160.0, net: 145.46 },
    { label: 'Sep 04', venue: "Lestat's", gross: 120.0, net: 108.92 },
    { label: 'Sep 09', venue: 'Soda Bar', gross: 140.0, net: 127.14 },
    { label: 'Sep 14', venue: 'Hotel Cafe', gross: 225.0, net: 204.67 },
    { label: 'Sep 17', venue: 'Sunset Lounge', gross: 100.0, net: 90.80 },
    { label: 'Today', venue: 'The Casbah', gross: 150.0, net: 136.35 },
  ];

  const maxGross = Math.max(...revenueHistory.map((h) => h.gross), 250);
  const selectedGig = revenueHistory[selectedBarIndex] ?? revenueHistory[revenueHistory.length - 1];

  const handleExport = () => {
    const summary = `Crowdbeats Solo Analytics for Elena Cruz:
• Tip Revenue: $${totalRevenue.toFixed(2)}
• Shows: ${showsCount}
• Total Fans: ${attendance.toLocaleString()}
• Timeframe: ${timeframe.toUpperCase()}
• Crowdbeats 6% Platform Fee & Daily Stripe Rate Deducted`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1080, margin: '0 auto', color: '#fff' }}>
      {/* Header with Persona Pill & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#A78BFA',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: 0.5
            }}>
              SOLO ARTIST
            </span>
            <span style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13 }}>Elena Cruz</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              Live Metric Engine
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            Performance & Venue Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, margin: '4px 0 0' }}>
            Live audience telemetry, venue tipping index, and net gig payout settlements.
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
                  background: timeframe === t ? '#7C3AED' : 'transparent',
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
              background: 'rgba(20, 184, 166, 0.15)',
              color: '#2DD4BF',
              border: '1px solid rgba(20, 184, 166, 0.35)',
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
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(18, 20, 32, 0.6))',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: 12,
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ color: '#E5E7EB', fontSize: 13, fontWeight: 500 }}>
          <strong>Venue Intelligence:</strong> The Casbah delivers your highest tip volume ($1,250 total). Peak tipping surges 42% at 9:30 PM during acoustic encores.
        </span>
      </div>

      {/* 4-Card Hero Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>TOTAL TIP REVENUE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#2DD4BF' }}>${totalRevenue.toFixed(2)}</div>
          <div style={{ color: '#10B981', fontSize: 11, marginTop: 4, fontWeight: 600 }}>6% Fee + Stripe deducted</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>AVG REVENUE / SHOW</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#A78BFA' }}>${avgShow.toFixed(2)}</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, marginTop: 4 }}>Across {showsCount} stage sets</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>SHOWS PERFORMED</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary, #1D1D1F)' }}>{showsCount} gigs</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, marginTop: 4 }}>Live check-ins verified</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>FANS REACHED</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#60A5FA' }}>{attendance.toLocaleString()}</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11, marginTop: 4 }}>Audience stage footprint</div>
        </div>
      </div>

      {/* Interactive Gig Revenue Trajectory Bar Chart */}
      <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#A78BFA' }}>
              GIG REVENUE TRAJECTORY (LAST 6 SHOWS)
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>Interactive tip yield per gig — click any bar to inspect</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2DD4BF' }} /> Gross Tips
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
                <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? '#2DD4BF' : '#9CA3AF', marginBottom: 4 }}>
                  ${h.gross.toFixed(0)}
                </span>
                <div style={{
                  width: 38,
                  height: barHeight,
                  borderRadius: '6px 6px 0 0',
                  background: isSelected
                    ? 'linear-gradient(180deg, #2DD4BF 0%, #10B981 100%)'
                    : 'linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)',
                  boxShadow: isSelected ? '0 0 12px rgba(45, 212, 191, 0.4)' : 'none',
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
          <span style={{ fontSize: 12, fontWeight: 800, color: '#2DD4BF' }}>
            Gross Tips: ${selectedGig.gross.toFixed(2)}  •  Net Musician Payout: ${selectedGig.net.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 2x2 Performance Efficiency & Conversion Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>TIP CONVERSION RATE</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981', margin: '4px 0 2px' }}>46.8%</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Checked-in fans who tipped</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>AVG TIP / ATTENDEE</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#2DD4BF', margin: '4px 0 2px' }}>$1.40</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Yield per total attendee</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>STAGE VELOCITY</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#A78BFA', margin: '4px 0 2px' }}>$114.76/hr</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Earnings per hour on stage</div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 12, padding: 14 }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>QR STAGE CONVERSION</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#60A5FA', margin: '4px 0 2px' }}>78.2%</div>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 11 }}>Scans converted into tips</div>
        </div>
      </div>

      {/* Secondary Telemetry Strip */}
      <div style={{
        background: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
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
          <div style={{ color: '#10B981', fontSize: 14, fontWeight: 800, marginTop: 2 }}>28.4%</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>AVG TIP SIZE</div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, marginTop: 2 }}>$18.50</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>PEAK TIPPING HOUR</div>
          <div style={{ color: '#A78BFA', fontSize: 14, fontWeight: 800, marginTop: 2 }}>9:30 PM (Acoustic Encore)</div>
        </div>
      </div>

      {/* Fee Pipeline & Daily Rate Deduction Card */}
      <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#A78BFA' }}>
            NET PAYOUT & FEE DEDUCTION PIPELINE
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
          Every tip is processed through an automated formula guaranteeing accurate musician compensation:
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
            <div style={{ fontSize: 10, color: 'var(--text-secondary, #6E6E73)', fontWeight: 700 }}>NET PROCEEDS</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#2DD4BF', marginTop: 2 }}>Net Musician Yield</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Venues & Recent Gigs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Venue Leaderboard */}
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#A78BFA' }}>
              VENUE PERFORMANCE & LEADERBOARD
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>Ranked by Tip Volume</span>
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
                    background: i === 0 ? 'rgba(245, 158, 11, 0.2)' : i === 1 ? 'rgba(148, 163, 184, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                    color: i === 0 ? '#F59E0B' : i === 1 ? '#CBD5E1' : '#A78BFA',
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
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#2DD4BF' }}>${v.revenue.toFixed(2)}</div>
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
              <div style={{ width: '26%', background: '#10B981' }} title="The Casbah (26%)" />
              <div style={{ width: '20%', background: '#8B5CF6' }} title="Sunset Lounge (20%)" />
              <div style={{ width: '18%', background: '#60A5FA' }} title="Hotel Cafe (18%)" />
              <div style={{ width: '18%', background: '#F59E0B' }} title="Lestat's (18%)" />
              <div style={{ width: '18%', background: '#EC4899' }} title="Soda Bar (18%)" />
            </div>
          </div>
        </div>

        {/* Recent Performance Gigs */}
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: 0, color: '#A78BFA' }}>
              RECENT PERFORMANCE GIGS & PAYOUTS
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>Net Proceeds</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
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

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary, #6E6E73)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                  <span>Gross Tips: ${gig.gross.toFixed(2)}</span>
                  <span>6% Fee: -${gig.platformFee.toFixed(2)}</span>
                  <span>Stripe: -${gig.stripeFee.toFixed(2)}</span>
                  <span style={{ color: '#A78BFA' }}>{gig.attendance} fans</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Set Time Tipping Velocity */}
      <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.6, margin: '0 0 14px', color: '#A78BFA' }}>
          LIVE SET TIPPING VELOCITY DISTRIBUTION
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Opening Tracks (First 20m)</span>
              <span style={{ color: '#2DD4BF', fontWeight: 700 }}>12%</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '12%', height: '100%', background: '#A78BFA' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Mid-Set Audience Banter</span>
              <span style={{ color: '#2DD4BF', fontWeight: 700 }}>28%</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '28%', height: '100%', background: '#A78BFA' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Peak Hit Singles & Climax</span>
              <span style={{ color: '#2DD4BF', fontWeight: 700 }}>42% (Highest Influx)</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '42%', height: '100%', background: '#2DD4BF' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#E5E7EB' }}>Stage Encore & Post-Show</span>
              <span style={{ color: '#2DD4BF', fontWeight: 700 }}>18%</span>
            </div>
            <div style={{ height: 6, background: '#161928', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '18%', height: '100%', background: '#A78BFA' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

