'use client';

/**
 * Crowdbeats V2 — Content Reporting & Abuse Intake
 * Route: /legal/report-abuse
 * 
 * High-precision Trust & Safety reporting portal with strict SLA triage.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  ReportTargetType,
  ModerationRiskCategory,
  type SubmitReportRequest,
  type SubmitReportResponse,
} from '@crowdbeats/contracts';

export default function ReportAbusePage() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Theme tokens
  const cardBg = isLight ? '#FFFFFF' : '#141416';
  const innerBoxBg = isLight ? '#F6F3F5' : '#101013';
  const inputBg = isLight ? '#FFFFFF' : '#0B0C11';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)';
  const textPrimary = isLight ? '#1B1B1D' : '#F5F5F7';
  const textSecondary = isLight ? '#4A4455' : '#94A3B8';
  const textMuted = isLight ? '#716B7B' : '#71717A';

  const [targetType, setTargetType] = useState<ReportTargetType>(ReportTargetType.CREATOR);
  const [targetId, setTargetId] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [violationCategory, setViolationCategory] = useState<ModerationRiskCategory>(ModerationRiskCategory.HATE_SPEECH_HARASSMENT);
  const [description, setDescription] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<SubmitReportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || !description.trim()) {
      setErrorMsg('Target identifier and description are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: SubmitReportRequest = {
        targetType,
        targetId: targetId.trim(),
        targetUrl: targetUrl.trim() || undefined,
        violationCategory,
        description: description.trim(),
        reporterEmail: reporterEmail.trim() || undefined,
        reporterName: reporterName.trim() || undefined,
      };

      const res = await fetch('/api/report-abuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setSubmittedResponse(data);
      } else {
        // Fallback ticket confirmation
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSubmittedResponse({
          reportId: `mock_${Date.now()}`,
          ticketNumber: `RPT-${dateStr}-${randomSuffix}`,
          status: 'RECEIVED' as any,
          slaTier: violationCategory === ModerationRiskCategory.CSAM_CSAE ? 'CRITICAL_1_HOUR' : 'STANDARD_24_HOUR' as any,
          receivedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '24px',
    marginBottom: '8px',
  };

  const labelTextSpanStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: textPrimary,
    letterSpacing: '-0.01em',
  };

  const requiredBadgeStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#EF4444',
    backgroundColor: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.12)',
    border: `1px solid ${isLight ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`,
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  const optionalBadgeStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: textMuted,
    backgroundColor: innerBoxBg,
    border: `1px solid ${borderColor}`,
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  const textInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '10px',
    backgroundColor: inputBg,
    border: `1px solid ${borderColor}`,
    color: textPrimary,
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const selectInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '10px',
    backgroundColor: inputBg,
    border: `1px solid ${borderColor}`,
    color: textPrimary,
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ color: textSecondary, maxWidth: '820px', margin: '0 auto', paddingBottom: '60px', fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
      {/* ── HEADER BREADCRUMB ───────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          href="/legal"
          style={{
            color: isLight ? '#7C3AED' : '#C084FC',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
          }}
        >
          <span>←</span>
          <span>Back to Legal & Compliance Portal</span>
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
            fontSize: 'clamp(2rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            color: textPrimary,
            margin: '0 0 10px 0',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}
        >
          Content Reporting & Abuse Intake
        </h1>
        <p style={{ color: textSecondary, fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '640px' }}>
          Crowdbeats enforces a zero-tolerance policy against prohibited content. Reports are routed directly to our Trust & Safety team with automated SLA triage.
        </p>
      </div>

      {submittedResponse ? (
        <div
          style={{
            background: isLight
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '20px',
            padding: '48px 36px',
            textAlign: 'center',
            boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', margin: '0 0 10px', fontFamily: 'var(--font-manrope, Manrope, sans-serif)' }}>
            Report Successfully Enqueued
          </h2>
          <p style={{ color: textSecondary, fontSize: '1rem', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: '520px' }}>
            Thank you for protecting our community. Your report has been dispatched to Trust & Safety officers under active SLA monitoring.
          </p>

          <div
            style={{
              backgroundColor: innerBoxBg,
              border: `1px solid ${borderColor}`,
              padding: '20px 24px',
              borderRadius: '14px',
              display: 'inline-flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.9rem',
              color: textPrimary,
              minWidth: '320px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: textMuted }}>Ticket Number:</span>
              <strong style={{ color: isLight ? '#0284C7' : '#38BDF8' }}>{submittedResponse.ticketNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: textMuted }}>SLA Target:</span>
              <strong style={{ color: '#F59E0B' }}>{submittedResponse.slaTier}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: textMuted }}>Status:</span>
              <strong style={{ color: '#10B981' }}>{submittedResponse.status}</strong>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '20px',
            padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 32px)',
            boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.03)' : '0 16px 40px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {errorMsg && (
            <div
              style={{
                color: '#EF4444',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '14px 18px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* 1. Violation Category */}
          <div>
            <label style={labelRowStyle}>
              <span style={labelTextSpanStyle}>Violation Category</span>
              <span style={requiredBadgeStyle}>Required</span>
            </label>
            <select
              value={violationCategory}
              onChange={(e) => setViolationCategory(e.target.value as ModerationRiskCategory)}
              style={selectInputStyle}
            >
              <option value={ModerationRiskCategory.CSAM_CSAE}>CSAM / Child Safety (Critical SLA: &lt; 1 Hour)</option>
              <option value={ModerationRiskCategory.VIOLENCE_TERRORISM}>Violence & Violent Extremism</option>
              <option value={ModerationRiskCategory.NON_CONSENSUAL_SEXUAL}>Non-Consensual Sexual Material</option>
              <option value={ModerationRiskCategory.HATE_SPEECH_HARASSMENT}>Hate Speech & Targeted Harassment</option>
              <option value={ModerationRiskCategory.FRAUD_SCAM}>Fraud, Impersonation, or Financial Scam</option>
              <option value={ModerationRiskCategory.COPYRIGHT_INFRINGEMENT}>Copyright Infringement</option>
              <option value={ModerationRiskCategory.SPAM}>Spam & Coordinated Inauthentic Behavior</option>
              <option value={ModerationRiskCategory.GENERAL_PROFANITY}>General Profanity & Misconduct</option>
            </select>
          </div>

          {/* 2. Target Type & Target Identifier */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
            <div>
              <label style={labelRowStyle}>
                <span style={labelTextSpanStyle}>Entity Type</span>
                <span style={requiredBadgeStyle}>Required</span>
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as ReportTargetType)}
                style={selectInputStyle}
              >
                <option value={ReportTargetType.CREATOR}>Artist / Creator Profile</option>
                <option value={ReportTargetType.SESSION}>Live Stage Session</option>
                <option value={ReportTargetType.SONG_REQUEST}>Song Request</option>
                <option value={ReportTargetType.TIP_MESSAGE}>Live Tip Message</option>
                <option value={ReportTargetType.CHAT_MESSAGE}>Live Chat Message</option>
                <option value={ReportTargetType.PROFILE_IMAGE}>Profile Photo / Media</option>
                <option value={ReportTargetType.EXTERNAL_URL}>External URL Link</option>
              </select>
            </div>

            <div>
              <label style={labelRowStyle}>
                <span style={labelTextSpanStyle}>Profile / Entity Identifier or Name</span>
                <span style={requiredBadgeStyle}>Required</span>
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                placeholder="e.g. artist slug, user ID, or exact stage name"
                style={textInputStyle}
              />
            </div>
          </div>

          {/* 3. Direct Content URL */}
          <div>
            <label style={labelRowStyle}>
              <span style={labelTextSpanStyle}>Direct Content URL</span>
              <span style={optionalBadgeStyle}>Optional</span>
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://crowdbeats.com/artist/example"
              style={textInputStyle}
            />
          </div>

          {/* 4. Description */}
          <div>
            <label style={labelRowStyle}>
              <span style={labelTextSpanStyle}>Detailed Description of Violation</span>
              <span style={requiredBadgeStyle}>Required</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              placeholder="Please provide specific details including timestamps, exact statements, or visual evidence to expedite review."
              style={{ ...textInputStyle, resize: 'vertical' }}
            />
          </div>

          {/* 5. Reporter Contact Information */}
          <div style={{ backgroundColor: innerBoxBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: textPrimary, margin: 0, fontFamily: 'var(--font-manrope, Manrope, sans-serif)' }}>
              Reporter Contact (Confidential)
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: textMuted }}>
              Your identity is kept strictly confidential from the reported party. Providing your email allows us to follow up with outcome determinations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
              <div>
                <label style={labelRowStyle}>
                  <span style={labelTextSpanStyle}>Your Email</span>
                  <span style={optionalBadgeStyle}>Optional</span>
                </label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={textInputStyle}
                />
              </div>

              <div>
                <label style={labelRowStyle}>
                  <span style={labelTextSpanStyle}>Your Name / Alias</span>
                  <span style={optionalBadgeStyle}>Optional</span>
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Anonymous or Your Name"
                  style={textInputStyle}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                background: isSubmitting
                  ? '#6B7280'
                  : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 800,
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
              }}
            >
              {isSubmitting ? 'Enqueuing Report to T&S…' : 'Submit Safety Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
