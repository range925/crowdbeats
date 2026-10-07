'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@/components/account-center/AccountCenterIcons';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 22,
  marginBottom: 20,
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
};

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#FFFFFF',
  marginBottom: 6,
};

const INPUT: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#FFFFFF',
  fontSize: 14,
  minHeight: 44,
  fontFamily: 'inherit',
  outline: 'none',
};

const INDUSTRIES = [
  'Audio Tech & Musical Gear',
  'Beverages & Craft Brews',
  'Apparel & Streetwear',
  'Lifestyle & Gaming',
  'Live Events & Hospitality',
  'Financial Services & Fintech',
  'Media, Streaming & Entertainment',
  'Local Small Business',
];

const SPONSORSHIP_MODELS = [
  'Direct Live Tip Matching (1.5x - 2x)',
  'Venue Stage Co-Sponsorship',
  'Festival & Tour Activation',
  'Hardware & Gear Endorsements',
  'Creator Residency Grants',
];

interface SponsorProfileEditorProps {
  initialData?: any;
  onSaveSuccess?: () => void;
}

export function SponsorProfileEditor({ initialData, onSaveSuccess }: SponsorProfileEditorProps) {
  const [orgName, setOrgName] = useState(initialData?.name || initialData?.orgName || initialData?.displayName || '');
  const [industry, setIndustry] = useState(initialData?.industry || 'Audio Tech & Musical Gear');
  const [description, setDescription] = useState(initialData?.description || initialData?.bio || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || initialData?.email || '');
  const [hqCity, setHqCity] = useState(initialData?.city || initialData?.originCity || '');

  // Interests
  const [selectedModels, setSelectedModels] = useState<string[]>(
    initialData?.sponsorInterests || ['Direct Live Tip Matching (1.5x - 2x)', 'Creator Residency Grants']
  );

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: orgName,
          orgName,
          industry,
          bio: description,
          website,
          city: hqCity,
          sponsorInterests: selectedModels,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save sponsor organization profile.');
      }

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3500);
      onSaveSuccess?.();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      {/* 1. Organization Identity */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FACC15',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M3 7h18" />
              <path d="M5 21V7" />
              <path d="M19 21V7" />
              <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
              <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Organization Profile</h3>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
              Your brand name, industry segment, and public sponsor footprint
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={LABEL}>Organization / Brand Name</label>
            <input
              type="text"
              style={INPUT}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Audio Labs"
              required
            />
          </div>

          <div>
            <label style={LABEL}>Industry Segment</label>
            <select
              style={{ ...INPUT, cursor: 'pointer' }}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} style={{ backgroundColor: '#1A1C26' }}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={LABEL}>Official Website</label>
            <input
              type="url"
              style={INPUT}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acmeaudio.com"
            />
          </div>

          <div>
            <label style={LABEL}>Headquarters City</label>
            <input
              type="text"
              style={INPUT}
              value={hqCity}
              onChange={(e) => setHqCity(e.target.value)}
              placeholder="e.g. San Francisco, CA"
            />
          </div>
        </div>

        <div>
          <label style={LABEL}>Brand Mission & Creator Support Philosophy</label>
          <textarea
            style={{ ...INPUT, minHeight: 100, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell musicians and fans about your company's support for live music and independent artists..."
            maxLength={600}
          />
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'right', marginTop: 4 }}>
            {description.length}/600
          </div>
        </div>
      </div>

      {/* 2. Sponsorship Interests & Models */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34D399',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Sponsorship Alignment</h3>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
              Select the activation campaigns your brand actively seeks to fund
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SPONSORSHIP_MODELS.map((model) => {
            const selected = selectedModels.includes(model);
            return (
              <div
                key={model}
                onClick={() => toggleModel(model)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: selected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: selected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: selected ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: selected ? '#10B981' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000000',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {selected && '✓'}
                </div>
                <span style={{ fontSize: 14, color: selected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)', fontWeight: selected ? 600 : 400 }}>
                  {model}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status feedback */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {savedMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ADE80',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <CheckIcon size={16} color="#4ADE80" />
          <span>Sponsor profile saved successfully!</span>
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            backgroundColor: '#10B981',
            color: '#000000',
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          {saving ? 'Saving...' : 'Save Organization Profile'}
        </button>
      </div>
    </form>
  );
}
