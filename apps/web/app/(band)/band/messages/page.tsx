'use client';

/**
 * Crowdbeats V2 — Band Messages Portal
 * Direct messaging dashboard for band communication with recipient control and acting-as-band identity.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessagingDashboard } from '@/components/social/MessagingDashboard';

function BandMessagesContent() {
  const searchParams = useSearchParams();
  const [bandId, setBandId] = useState<string>('');

  useEffect(() => {
    const qBandId = searchParams?.get('bandId');
    if (qBandId) {
      setBandId(qBandId);
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cb_active_band_id');
      if (stored) setBandId(stored);
    }
  }, [searchParams]);

  return (
    <div className="w-full">
      <MessagingDashboard currentPersona="band" actingAsBandId={bandId || undefined} />
    </div>
  );
}

export default function BandMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading Band Messaging...</div>}>
      <BandMessagesContent />
    </Suspense>
  );
}
