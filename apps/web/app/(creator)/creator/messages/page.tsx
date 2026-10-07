'use client';

/**
 * Crowdbeats V2 — Creator Studio Direct Messages
 * Full recipient control, inbox, requests, restricted threads, and moderation.
 */

import React from 'react';
import { MessagingDashboard } from '@/components/social/MessagingDashboard';

export default function CreatorMessagesPage() {
  return (
    <div className="w-full">
      <MessagingDashboard currentPersona="artist" />
    </div>
  );
}
