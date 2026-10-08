'use client';

/**
 * Crowdbeats V2 — Fan Messages Portal
 * Direct messaging dashboard for fans with recipient control, message requests, and safety controls.
 */

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessagingDashboard } from '@/components/social/MessagingDashboard';
import type { SocialEntityType } from '@crowdbeats/contracts';

function FanMessagesContent() {
  const searchParams = useSearchParams();
  const recipientId = searchParams?.get('recipientId') || undefined;
  const recipientType = (searchParams?.get('recipientType') as SocialEntityType) || undefined;
  const recipientName = searchParams?.get('recipientName') || undefined;

  return (
    <div className="w-full">
      <MessagingDashboard
        currentPersona="fan"
        initialRecipientId={recipientId}
        initialRecipientType={recipientType}
        initialRecipientName={recipientName}
      />
    </div>
  );
}

export default function FanMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading Messages...</div>}>
      <FanMessagesContent />
    </Suspense>
  );
}
