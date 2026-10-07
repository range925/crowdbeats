'use client';

import React, { useState } from 'react';
import { SettingsToggle } from '@/components/settings/SettingsToggle';
import { SettingsPicker } from '@/components/settings/SettingsPicker';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  marginBottom: 20,
  overflow: 'hidden',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  minHeight: 48,
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  gap: 16,
};

export function AccessibilitySection() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState('default');
  const [screenReader, setScreenReader] = useState(true);
  const [focusOutlines, setFocusOutlines] = useState(true);

  return (
    <div>
      <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 20, fontSize: 13, color: '#38BDF8' }}>
        Accessibility preferences are stored locally on this device.
      </div>

      <div style={CARD}>
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Reduce Motion</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Minimizes interface transitions and equalizer animations.</div>
          </div>
          <SettingsToggle checked={reduceMotion} onChange={setReduceMotion} label="Reduce Motion" />
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>High Contrast Mode</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Enhances text borders and icon visibility for high-glare environments.</div>
          </div>
          <SettingsToggle checked={highContrast} onChange={setHighContrast} label="High Contrast" />
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Screen Reader Optimizations</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Provide descriptive ARIA live announcements for tips and stage events.</div>
          </div>
          <SettingsToggle checked={screenReader} onChange={setScreenReader} label="Screen Reader" />
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Visible Keyboard Focus Outlines</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Show high-visibility purple rings when navigating via tab/arrow keys.</div>
          </div>
          <SettingsToggle checked={focusOutlines} onChange={setFocusOutlines} label="Focus Outlines" />
        </div>

        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Interface Font Scale</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Adjust text size across dashboard tables and mobile tip cards.</div>
          </div>
          <div style={{ width: 140 }}>
            <SettingsPicker
              value={fontScale}
              onChange={setFontScale}
              options={[
                { value: 'small', label: 'Small (90%)' },
                { value: 'default', label: 'Default (100%)' },
                { value: 'large', label: 'Large (115%)' },
                { value: 'xlarge', label: 'Extra Large (130%)' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
