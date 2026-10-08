/**
 * Crowdbeats V2 — Public Direct Tip Page Route
 * Route: /tip/[id]
 *
 * Resolves performer recipient by canonical ID or slug, verifies eligibility,
 * and renders interactive direct tipping client interface.
 */

import React from 'react';
import { PerformerTipClientView } from './PerformerTipClientView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DirectTipPage({ params }: PageProps) {
  const { id } = await params;
  return <PerformerTipClientView id={id} />;
}
