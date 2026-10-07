'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MillionDollarLanding } from '@/components/landing/MillionDollarLanding';
import { LandingV3 } from '@/components/landing/v3/LandingV3';
import { Variation1ProMinimal } from '@/components/landing/variations/Variation1ProMinimal';
import { Variation2ResonanceKeynote } from '@/components/landing/variations/Variation2ResonanceKeynote';
import { Variation3StudioConsole } from '@/components/landing/variations/Variation3StudioConsole';
import { Variation4DynamicHub } from '@/components/landing/variations/Variation4DynamicHub';
import type { LandingVariation } from '@/components/landing/VariationSelector';

function LandingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [variation, setVariation] = useState<LandingVariation>('authoritative');

  useEffect(() => {
    const vParam = searchParams.get('v') || searchParams.get('variation');
    if (
      vParam === 'pro-minimal' ||
      vParam === 'resonance-keynote' ||
      vParam === 'studio-console' ||
      vParam === 'dynamic-hub' ||
      vParam === 'authoritative'
    ) {
      setVariation(vParam as LandingVariation);
    }
  }, [searchParams]);

  const handleSelectVariation = (selected: LandingVariation) => {
    setVariation(selected);
    const params = new URLSearchParams(window.location.search);
    if (selected === 'authoritative') {
      params.delete('v');
      params.delete('variation');
    } else {
      params.set('v', selected);
    }
    const newSearch = params.toString();
    const newUrl = newSearch ? `?${newSearch}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  };

  const renderActiveVariation = () => {
    const vParam = searchParams.get('v') || searchParams.get('variation');
    if (vParam === 'classic') {
      // Previous authoritative landing, kept for side-by-side review / rollback.
      return <MillionDollarLanding />;
    }
    switch (variation) {
      case 'pro-minimal':
        return <Variation1ProMinimal />;
      case 'resonance-keynote':
        return <Variation2ResonanceKeynote />;
      case 'studio-console':
        return <Variation3StudioConsole />;
      case 'dynamic-hub':
        return <Variation4DynamicHub />;
      case 'authoritative':
      default:
        return <LandingV3 />;
    }
  };

  return (
    <>
      {renderActiveVariation()}
    </>
  );
}

export function LandingOrchestrator() {
  return (
    <Suspense fallback={<LandingV3 />}>
      <LandingContent />
    </Suspense>
  );
}
