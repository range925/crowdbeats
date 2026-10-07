'use client';

/**
 * Client component wrapper for MapTestPanel.
 * Uses next/dynamic with ssr:false inside a Client Component, which is allowed.
 */

import dynamic from 'next/dynamic';

const MapTestPanel = dynamic(
  () => import('./MapTestPanel').then((m) => m.MapTestPanel),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: '100vh', background: '#0b0c10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#4b5563', fontFamily: 'system-ui, sans-serif', fontSize: 14,
      }}>
        Loading map test panel...
      </div>
    ),
  }
);

export function MapTestPanelLoader() {
  return <MapTestPanel />;
}