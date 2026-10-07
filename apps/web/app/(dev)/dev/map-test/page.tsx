/**
 * /dev/map-test -- MapLibre Development Test Route
 *
 * Protected: only accessible in development or when NEXT_PUBLIC_ENABLE_MAP_TEST=true.
 * Returns 404 in production unless the flag is set.
 */

import { notFound } from 'next/navigation';
import { MapTestPanelLoader } from './MapTestPanelLoader';

// Route segment config -- 'force-dynamic' so env vars are checked at request time.
// Exported as 'dynamic' per Next.js convention (separate from the next/dynamic fn).
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Map Test | Crowdbeats Dev' };

// Protect in production
const isMapTestEnabled =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_MAP_TEST === 'true';

export default function MapTestPage() {
  if (!isMapTestEnabled) notFound();

  return (
    <main style={{ minHeight: '100vh', background: '#0b0c10' }}>
      <MapTestPanelLoader />
    </main>
  );
}