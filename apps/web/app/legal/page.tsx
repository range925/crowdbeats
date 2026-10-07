import React from 'react';
import type { Metadata } from 'next';
import { PLATFORM_POLICIES_REGISTRY } from '@crowdbeats/contracts';
import { LegalIndexClient } from '@/components/legal/LegalIndexClient';

export const metadata: Metadata = {
  title: 'Legal, Compliance & Support Portal — Crowdbeats LLC',
  description: 'Our Why, Terms of Service, Privacy Policy, DMCA Copyright procedures, and Help & Support Center for Crowdbeats LLC.',
};

export default function LegalIndexPage() {
  const policies = Object.values(PLATFORM_POLICIES_REGISTRY);
  return <LegalIndexClient policies={policies} />;
}
