'use client';

import React from 'react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';

export function AppearanceSection() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <AppearanceSettings />
      </div>
    </div>
  );
}
