'use client';

import React, { useState } from 'react';
import { SettingsPicker } from '@/components/settings/SettingsPicker';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  gap: 16,
};

export function LanguageRegionSection() {
  const [lang, setLang] = useState('en-US');
  const [tz, setTz] = useState('America/Los_Angeles');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [currency, setCurrency] = useState('USD');
  const [toast, setToast] = useState(false);

  const handleSave = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#10B981', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
          Region preferences saved ✓ (App refresh may be required for full language change)
        </div>
      )}

      <div style={CARD}>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Display Language</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Crowdbeats UI, currency labels, and system prompt locale.</div>
          </div>
          <div style={{ width: 180 }}>
            <SettingsPicker
              value={lang}
              onChange={setLang}
              options={[
                { value: 'en-US', label: 'English (US)' },
                { value: 'es-ES', label: 'Español' },
                { value: 'fr-FR', label: 'Français' },
                { value: 'de-DE', label: 'Deutsch' },
                { value: 'ja-JP', label: '日本語' },
                { value: 'pt-BR', label: 'Português' },
              ]}
            />
          </div>
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Local Timezone</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Stage schedules and set times adjust to this timezone.</div>
          </div>
          <div style={{ width: 180 }}>
            <SettingsPicker
              value={tz}
              onChange={setTz}
              options={[
                { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                { value: 'America/Denver', label: 'Mountain Time (MT)' },
                { value: 'America/Chicago', label: 'Central Time (CT)' },
                { value: 'America/New_York', label: 'Eastern Time (ET)' },
                { value: 'UTC', label: 'Universal (UTC)' },
                { value: 'Europe/London', label: 'London (GMT/BST)' },
              ]}
            />
          </div>
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Date Format</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Format for tip receipts and gig calendar events.</div>
          </div>
          <div style={{ width: 180 }}>
            <SettingsPicker
              value={dateFormat}
              onChange={setDateFormat}
              options={[
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              ]}
            />
          </div>
        </div>

        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Display Currency</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Default currency symbol for tip presets and wallet view.</div>
          </div>
          <div style={{ width: 180 }}>
            <SettingsPicker
              value={currency}
              onChange={setCurrency}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'CAD', label: 'CAD (CA$)' },
                { value: 'AUD', label: 'AUD (AU$)' },
              ]}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: 'var(--accent-primary, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Save Region Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
