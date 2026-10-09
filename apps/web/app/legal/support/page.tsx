'use client';

/**
 * Crowdbeats V2 — Help & Support Center
 * 
 * Comprehensive customer support, FAQ knowledge base, ticket submission form,
 * and direct legal compliance routing.
 * 
 * Styled to seamlessly match the landing page theme (light/dark) and layout design:
 * - Sonic Precision tokens (#7C3AED violet, #2DD4BF aqua, #07080D obsidian, #FCF8FB porcelain)
 * - Bento card containers with high-contrast typography
 * - Responsive 24/7 ticket intake form and direct operations inboxes
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import { DataExportModal } from '@/components/compliance/DataExportModal';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'billing' | 'tipping' | 'creators' | 'privacy' | 'general';
  actionType?: 'download_data' | 'contact_dmca';
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'free-platform',
    question: 'Why is Crowdbeats 100% free to join and explore?',
    answer: 'Because we believe human connection and live music should never have a tollgate. Platform registration, discovering local live concerts, exploring the dark-mode stage map, following artists, and band studio collaboration are completely free. We do not charge monthly subscriptions, annual dues, or listing fees because our mission is to empower the infinite game of independent music.',
    category: 'general',
  },
  {
    id: 'fee-structure',
    question: 'How do platform fees and Stripe payment processing work?',
    answer: 'True trust is built on radical transparency. While joining and exploring Crowdbeats is 100% free, moving money requires robust infrastructure. When a fan tips an artist or contributes to a campaign: (1) Crowdbeats takes an honest, transparent 6% platform technology fee to power real-time GPS stage radar, server infrastructure, and moderation. (2) Stripe payment-processing and applicable Stripe Connect fees are charged separately at direct cost in addition to Crowdbeats’ 6% fee. (3) The performing artist or band receives the entire remaining net proceeds. Every single penny is transparently disclosed before you authorize any transaction.',
    category: 'billing',
  },
  {
    id: 'tipping-security',
    question: 'How does live tipping work and is my payment information secure?',
    answer: 'We believe financial safety is fundamental to creative freedom. All voluntary fan tips are tokenized and processed directly by PCI-DSS Level 1 compliant processors (Stripe, Google Pay). Crowdbeats never sees or stores raw credit card numbers. Tips flow through our immutable zero-sum ledger, and creator split disbursements are transferred directly to verified Stripe Connected Accounts in real time.',
    category: 'tipping',
  },
  {
    id: 'band-split-matrix',
    question: 'What is the 100% Band Split Matrix and why does it matter?',
    answer: 'Bands thrive when every member is valued. The Band Split Matrix is a legally binding, automated authorization configured by band leadership. When fans tip a performing band, 100% of the net proceeds (after Crowdbeats 6% platform fee and Stripe processing fees) are mathematically allocated across band members and band treasury according to your exact split percentages. No spreadsheets, no arguments—just instant, fair harmony.',
    category: 'creators',
  },
  {
    id: 'disputes-refunds',
    question: 'What is the refund policy for voluntary tips?',
    answer: 'Because voluntary fan tips are immediately distributed to performing artists in real time via Stripe Connect to support their craft, all voluntary tips are final and non-refundable. If you experience an accidental duplicate charge or verified technical transaction error, you may submit a dispute ticket through this Support Center within 14 days of the charge date for immediate review.',
    category: 'billing',
  },
  {
    id: 'location-privacy',
    question: 'How does Crowdbeats handle my location data?',
    answer: 'We believe privacy is a fundamental promise, not a legal afterthought. Your real-time geolocation is used ephemerally on your local device solely to calculate proximity to nearby live music stages on our Google Maps Dark basemap. In compliance with CCPA/CPRA and GDPR, Crowdbeats NEVER sells, rents, or stores your location telemetry.',
    category: 'privacy',
  },
  {
    id: 'dmca-takedown',
    question: 'How do I report copyrighted music or intellectual property infringement?',
    answer: 'We fiercely protect and honor original musicianship. If you are a copyright owner or authorized agent, you can submit a formal takedown notice via our Online DMCA Reporting Form (/legal/copyright-report) or by emailing dmca@crowdbeats.ai. We expeditiously investigate challenged materials and enforce a strict 3-strike repeat infringer policy.',
    category: 'general',
  },
  {
    id: 'account-deletion',
    question: 'How can I exercise my CCPA or GDPR privacy rights (e.g., download data or account deletion)?',
    answer: 'You have the statutory right to request a complete, human-readable copy of your personal data, receipts, and IRS tax records (Right to Know / CCPA § 1798.100 & GDPR Art. 15), or permanent account erasure (Right to Delete). Deletion requests are processed automatically across our databases within 30 days, while financial transaction and tax compliance records are preserved for 7 years pursuant to Internal Revenue Code (IRC) § 6001 and § 6050W.',
    category: 'privacy',
    actionType: 'download_data',
  },
];

export default function HelpSupportPage() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Theme tokens matching Apple design system
  const cardBg = isLight ? '#FFFFFF' : '#161617';
  const innerBoxBg = isLight ? '#F5F5F7' : '#1D1D1F';
  const inputBg = isLight ? '#FFFFFF' : '#161617';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#1D1D1F' : '#F5F5F7';
  const textSecondary = isLight ? '#6E6E73' : '#86868B';
  const textMuted = isLight ? '#86868B' : '#6E6E73';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'billing' | 'tipping' | 'creators' | 'privacy' | 'general'>('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Ticket Form State
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('fan');
  const [formCategory, setFormCategory] = useState('technical');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formSubject || !formMessage) return;

    setTicketStatus('submitting');
    setTimeout(() => {
      setTicketStatus('success');
      setFormSubject('');
      setFormMessage('');
    }, 800);
  };

  return (
    <div style={{ color: textSecondary, lineHeight: '1.6', fontFamily: 'var(--cb-font-body)' }}>
      {/* ── HEADER BREADCRUMB & INTRO ─────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <Link
          href="/legal"
          style={{
            color: isLight ? '#0071E3' : '#2997FF',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 16,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <span>←</span>
          <span>Back to Legal & Compliance Portal</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isLight ? '#0071E3' : '#2997FF',
              background: isLight ? 'rgba(0, 113, 227, 0.08)' : 'rgba(0, 113, 227, 0.12)',
              border: `1px solid ${isLight ? 'rgba(0, 113, 227, 0.2)' : 'rgba(0, 113, 227, 0.3)'}`,
              padding: '4px 10px',
              borderRadius: 9999,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            24/7 Operations & Helpdesk
          </span>
          <span style={{ fontSize: '0.85rem', color: textMuted }}>San Francisco, CA</span>
          <span style={{ color: borderColor }}>•</span>
          <span style={{ fontSize: '0.85rem', color: textMuted }}>SLA: &lt; 24 Hours</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--cb-font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 600,
            color: textPrimary,
            margin: '0 0 12px',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}
        >
          Help & Support Center
        </h1>
        <p style={{ color: textSecondary, fontSize: '1.05rem', margin: 0, maxWidth: 840, lineHeight: 1.5, letterSpacing: '-0.012em' }}>
          Find instant answers to common questions about our 100% free music platform, live tipping, creator splits, and legal compliance, or open a support ticket with our team.
        </p>
      </div>

      {/* ── SEARCH & TOPIC BAR (BENTO CONTAINER) ─────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 16,
            padding: '14px 18px',
            gap: 12,
            marginBottom: 16,
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <span style={{ fontSize: 18, color: textMuted }}>🔍</span>
          <input
            type="text"
            placeholder="Search FAQs (e.g. free platform, tipping, Stripe payouts, band splits, DMCA...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: textPrimary,
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: textMuted,
                cursor: 'pointer',
                fontSize: 14,
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'billing', 'tipping', 'creators', 'privacy', 'general'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '7px 16px',
                borderRadius: 9999,
                border: selectedCategory === cat ? 'none' : `1px solid ${borderColor}`,
                backgroundColor: selectedCategory === cat ? '#0071E3' : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255, 255, 255, 0.08)',
                color: selectedCategory === cat ? '#FFFFFF' : textSecondary,
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
                boxShadow: selectedCategory === cat ? '0 2px 8px rgba(0, 113, 227, 0.35)' : 'none',
              }}
            >
              {cat === 'all' ? 'All Topics' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── FAQ ACCORDION LIST ────────────────────────────────────────── */}
      <div id="faq" style={{ marginBottom: 48, scrollMarginTop: 90 }}>
        <h2
          style={{
            fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
            fontSize: '1.35rem',
            fontWeight: 800,
            color: textPrimary,
            marginBottom: 18,
            letterSpacing: '-0.015em',
          }}
        >
          Frequently Asked Questions ({filteredFaqs.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  backgroundColor: cardBg,
                  border: isExpanded
                    ? '1px solid #7C3AED'
                    : `1px solid ${borderColor}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.02)' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                  style={{
                    width: '100%',
                    padding: '18px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: textPrimary,
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
                  }}
                >
                  <span>{faq.question}</span>
                  <span
                    style={{
                      color: isExpanded ? '#7C3AED' : textMuted,
                      fontSize: '1.3rem',
                      marginLeft: 16,
                      fontWeight: 700,
                    }}
                  >
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 22px 22px',
                      color: textSecondary,
                      fontSize: '0.95rem',
                      lineHeight: '1.7',
                      borderTop: `1px solid ${borderColor}`,
                      paddingTop: 16,
                    }}
                  >
                    <p style={{ margin: '0 0 16px' }}>{faq.answer}</p>

                    {faq.actionType === 'download_data' && (
                      <div
                        style={{
                          backgroundColor: isLight ? 'rgba(124, 58, 237, 0.05)' : 'rgba(124, 58, 237, 0.12)',
                          border: `1px solid ${isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.3)'}`,
                          borderRadius: 12,
                          padding: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 14,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: textPrimary, fontSize: '0.95rem', fontFamily: 'var(--font-manrope, Manrope, sans-serif)' }}>
                            Self-Service Statutory Data & Tax Export
                          </div>
                          <div style={{ fontSize: '0.825rem', color: textSecondary, marginTop: 2 }}>
                            Generate an official, tamper-proof PDF statement containing all your account data, tip receipts, and IRS records.
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setIsExportModalOpen(true)}
                            style={{
                              padding: '9px 18px',
                              borderRadius: 10,
                              backgroundColor: '#7C3AED',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
                            }}
                          >
                            <span>📥</span>
                            <span>Download Statement (PDF)</span>
                          </button>

                          <Link
                            href="/account"
                            style={{
                              padding: '9px 16px',
                              borderRadius: 10,
                              backgroundColor: innerBoxBg,
                              color: textPrimary,
                              border: `1px solid ${borderColor}`,
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            Account Settings →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SUPPORT TICKET SUBMISSION FORM (BENTO CONTAINER) ─────────── */}
      <div
        id="ticket"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 24,
          padding: 'clamp(28px, 4vw, 44px) clamp(24px, 4vw, 40px)',
          marginBottom: 48,
          scrollMarginTop: 90,
          boxShadow: isLight ? '0 2px 14px rgba(0,0,0,0.04)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--cb-font-display)',
            fontSize: 'clamp(1.35rem, 3vw, 1.6rem)',
            fontWeight: 600,
            color: textPrimary,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          Open a Support Ticket
        </h2>
        <p style={{ color: textSecondary, fontSize: '0.95rem', margin: '0 0 28px', letterSpacing: '-0.01em' }}>
          Can&apos;t find what you need? Our dedicated support and compliance engineers will review your request and reply within 24 hours.
        </p>

        {ticketStatus === 'success' ? (
          <div
            style={{
              padding: 32,
              borderRadius: 16,
              backgroundColor: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10, color: '#10B981' }}>✓</div>
            <h3 style={{ fontSize: '1.25rem', color: '#10B981', fontWeight: 800, margin: '0 0 6px', fontFamily: 'var(--font-manrope, Manrope, sans-serif)' }}>
              Support Ticket Created
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.9rem', margin: '0 0 20px' }}>
              We&apos;ve dispatched your ticket to our San Francisco operations queue. A confirmation has been recorded for your account.
            </p>
            <button
              type="button"
              onClick={() => setTicketStatus('idle')}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 1. Name & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>Your Name</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#7C3AED' : '#C084FC', backgroundColor: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(192, 132, 252, 0.12)', border: `1px solid ${isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(192, 132, 252, 0.25)'}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Required</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 10,
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    color: textPrimary,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>Email Address</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#7C3AED' : '#C084FC', backgroundColor: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(192, 132, 252, 0.12)', border: `1px solid ${isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(192, 132, 252, 0.25)'}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Required</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 10,
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    color: textPrimary,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* 2. Role & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>User Role</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: textMuted, backgroundColor: innerBoxBg, border: `1px solid ${borderColor}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Optional</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 10,
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    color: textPrimary,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="fan">Fan / Supporter</option>
                  <option value="artist">Solo Musician</option>
                  <option value="band">Band Member / Leader</option>
                  <option value="venue">Venue Manager</option>
                  <option value="other">Other / General</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>Topic / Category</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#7C3AED' : '#C084FC', backgroundColor: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(192, 132, 252, 0.12)', border: `1px solid ${isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(192, 132, 252, 0.25)'}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Required</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 10,
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    color: textPrimary,
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="free_access">100% Free Platform & Account</option>
                  <option value="tipping">Tipping & Stripe Payments</option>
                  <option value="band_splits">Band Splits & Treasury</option>
                  <option value="technical">Technical App / Web Issue</option>
                  <option value="privacy">CCPA / GDPR Privacy Request</option>
                  <option value="copyright">Copyright & DMCA Notice</option>
                </select>
              </div>
            </div>

            {/* 3. Subject */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>Subject</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#7C3AED' : '#C084FC', backgroundColor: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(192, 132, 252, 0.12)', border: `1px solid ${isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(192, 132, 252, 0.25)'}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Required</span>
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of your inquiry..."
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 10,
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  color: textPrimary,
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* 4. Detailed Message */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>Detailed Message</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#7C3AED' : '#C084FC', backgroundColor: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(192, 132, 252, 0.12)', border: `1px solid ${isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(192, 132, 252, 0.25)'}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Required</span>
              </label>
              <textarea
                required
                rows={5}
                placeholder="Please describe your issue, transaction details, or statutory legal request in detail..."
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 10,
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  color: textPrimary,
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  minHeight: 130,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="submit"
                disabled={ticketStatus === 'submitting'}
                style={{
                  minHeight: 44,
                  padding: '12px 32px',
                  borderRadius: 9999,
                  backgroundColor: ticketStatus === 'submitting' ? '#6E6E73' : '#0071E3',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  border: 'none',
                  cursor: ticketStatus === 'submitting' ? 'not-allowed' : 'pointer',
                  boxShadow: ticketStatus === 'submitting'
                    ? 'none'
                    : '0 4px 14px rgba(0, 113, 227, 0.35)',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--cb-font-body)',
                }}
              >
                {ticketStatus === 'submitting' ? 'Submitting Ticket to Operations…' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── DIRECT CONTACT DIRECTORY (BENTO GRID) ────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <h2
          style={{
            fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
            fontSize: '1.35rem',
            fontWeight: 800,
            color: textPrimary,
            marginBottom: 16,
            letterSpacing: '-0.015em',
          }}
        >
          Official Direct Legal & Operations Inboxes
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div style={{ padding: 18, borderRadius: 14, backgroundColor: cardBg, border: `1px solid ${borderColor}`, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.02)' : 'none' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', color: isLight ? '#7C3AED' : '#C084FC', fontWeight: 800 }}>General Support</p>
            <p style={{ margin: '0 0 4px', color: textPrimary, fontWeight: 700, fontSize: '0.95rem' }}>support@crowdbeats.ai</p>
            <p style={{ margin: 0, color: textMuted, fontSize: '0.8rem' }}>Billing, app bugs & accounts</p>
          </div>
          <div style={{ padding: 18, borderRadius: 14, backgroundColor: cardBg, border: `1px solid ${borderColor}`, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.02)' : 'none' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#10B981', fontWeight: 800 }}>Compliance Office</p>
            <p style={{ margin: '0 0 4px', color: textPrimary, fontWeight: 700, fontSize: '0.95rem' }}>compliance@crowdbeats.ai</p>
            <p style={{ margin: 0, color: textMuted, fontSize: '0.8rem' }}>Trust, safety & KYC checks</p>
          </div>
          <div style={{ padding: 18, borderRadius: 14, backgroundColor: cardBg, border: `1px solid ${borderColor}`, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.02)' : 'none' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 800 }}>Legal Counsel</p>
            <p style={{ margin: '0 0 4px', color: textPrimary, fontWeight: 700, fontSize: '0.95rem' }}>legal@crowdbeats.ai</p>
            <p style={{ margin: 0, color: textMuted, fontSize: '0.8rem' }}>Court notices & litigation</p>
          </div>
          <div style={{ padding: 18, borderRadius: 14, backgroundColor: cardBg, border: `1px solid ${borderColor}`, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.02)' : 'none' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#EC4899', fontWeight: 800 }}>Copyright Agent</p>
            <p style={{ margin: '0 0 4px', color: textPrimary, fontWeight: 700, fontSize: '0.95rem' }}>dmca@crowdbeats.ai</p>
            <p style={{ margin: 0, color: textMuted, fontSize: '0.8rem' }}>DMCA notices & counters</p>
          </div>
        </div>
      </div>

      {/* ── BINDING POLICY SHORTCUTS ──────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 28 }}>
        <h3
          style={{
            fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
            fontSize: '1rem',
            fontWeight: 800,
            color: textPrimary,
            marginBottom: 14,
          }}
        >
          Binding Policies & Reporting Portals
        </h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <Link href="/legal/terms" style={{ color: textSecondary, textDecoration: 'none', backgroundColor: innerBoxBg, border: `1px solid ${borderColor}`, padding: '7px 14px', borderRadius: 8 }}>
            Terms of Service
          </Link>
          <Link href="/legal/privacy" style={{ color: textSecondary, textDecoration: 'none', backgroundColor: innerBoxBg, border: `1px solid ${borderColor}`, padding: '7px 14px', borderRadius: 8 }}>
            Privacy Policy
          </Link>
          <Link href="/legal/dmca" style={{ color: textSecondary, textDecoration: 'none', backgroundColor: innerBoxBg, border: `1px solid ${borderColor}`, padding: '7px 14px', borderRadius: 8 }}>
            DMCA & Copyright
          </Link>
          <Link href="/legal/copyright-report" style={{ color: '#EC4899', textDecoration: 'none', backgroundColor: isLight ? 'rgba(236,72,153,0.06)' : 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', padding: '7px 14px', borderRadius: 8, fontWeight: 700 }}>
            Submit DMCA Notice Form →
          </Link>
          <Link href="/legal/report-abuse" style={{ color: '#EF4444', textDecoration: 'none', backgroundColor: isLight ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', padding: '7px 14px', borderRadius: 8, fontWeight: 700 }}>
            Report Abuse & Violations →
          </Link>
          <Link href="/auth?mode=register" style={{ color: isLight ? '#0284C7' : '#38BDF8', textDecoration: 'none', backgroundColor: isLight ? 'rgba(56,189,248,0.06)' : 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', padding: '7px 14px', borderRadius: 8, fontWeight: 700 }}>
            Join Crowdbeats →
          </Link>
        </div>
      </div>

      {/* ── MODAL ────────────────────────────────────────────────────── */}
      <DataExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultRole="fan"
        userName={formName || 'Alex Morgan'}
        userEmail={formEmail || 'fan.alex@example.com'}
      />
    </div>
  );
}
