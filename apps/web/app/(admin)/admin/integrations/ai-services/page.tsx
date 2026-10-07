'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AiServicesConfigPage() {
  const [model, setModel] = useState('gemini-2.5-flash');
  const [safetyLevel, setSafetyLevel] = useState('BLOCK_MEDIUM_AND_ABOVE');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ padding: '32px 36px', color: 'var(--text-primary)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
        <Link href="/admin/integrations" style={{ color: '#A855F7', textDecoration: 'none' }}>
          Integrations
        </Link>
        <span>/</span>
        <span style={{ color: '#FFFFFF' }}>AI Services & Gemini</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32 }}>✨</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Montserrat, sans-serif' }}>
              Gemini & Vertex AI Services
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0 0' }}>
              Multimodal music profile generation, content moderation screening, and human-in-the-loop assistance.
            </p>
          </div>
        </div>

        <span
          style={{
            backgroundColor: hasGeminiKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: hasGeminiKey ? '#10B981' : '#EF4444',
            border: hasGeminiKey ? '1px solid #10B981' : '1px solid #EF4444',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {hasGeminiKey ? 'API CONFIGURED' : 'API KEY MISSING'}
        </span>
      </div>

      {/* Safety & Prohibited Use Banner */}
      <div
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          gap: 14,
        }}
      >
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>
            Mandatory AI Governance Invariants
          </div>
          <div style={{ color: '#FCA5A5', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            AI tools operate in an advisory capacity only. <strong>Autonomous user bans, payout denials, legal certifications, facial recognition, and biometric identification are strictly prohibited</strong> without qualified human review.
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#10B981', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          ✓ AI service configuration updated successfully.
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ backgroundColor: '#151722', border: '1px solid #2B2D44', borderRadius: 12, padding: '22px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#FFFFFF' }}>
            Model Selection & Execution Parameters
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 6 }}>
              Primary AI Model:
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2032', border: '1px solid #2B2D44', borderRadius: 6, color: '#FFFFFF', fontSize: 13, outline: 'none' }}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Low Latency, Profile Summaries)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning, Moderation Audits)</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 6 }}>
              Safety Threshold Filter:
            </label>
            <select
              value={safetyLevel}
              onChange={(e) => setSafetyLevel(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2032', border: '1px solid #2B2D44', borderRadius: 6, color: '#FFFFFF', fontSize: 13, outline: 'none' }}
            >
              <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium & Above (Standard Production)</option>
              <option value="BLOCK_LOW_AND_ABOVE">Block Low & Above (Strict Moderation)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 13, borderTop: '1px solid #1E2032', paddingTop: 14 }}>
            <span>Maximum Output Tokens:</span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>1,024 Tokens</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#151722', border: '1px solid #2B2D44', borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#FFFFFF' }}>
              Approved Operational Use Cases
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ backgroundColor: '#1E2032', padding: '10px 12px', borderRadius: 6 }}>
                <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Allowed:</span> Creator profile bio formatting & genre tags
              </div>
              <div style={{ backgroundColor: '#1E2032', padding: '10px 12px', borderRadius: 6 }}>
                <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Allowed:</span> Automated content toxicity pre-screening
              </div>
              <div style={{ backgroundColor: '#1E2032', padding: '10px 12px', borderRadius: 6 }}>
                <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Allowed:</span> Customer support suggested response drafts
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 16,
            }}
          >
            Save AI Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
