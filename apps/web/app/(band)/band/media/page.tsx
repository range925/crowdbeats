/**
 * Crowdbeats V2 — Band Media Library
 * Press photography, stage backdrops, and promotional assets for Bands.
 */

import React from 'react';
import { MediaLibraryManager } from '@/components/media/MediaLibraryManager';

export const metadata = {
  title: 'Band Media Library | Crowdbeats Band Studio',
  description: 'Manage high-resolution band photography, promotional video reels, and stage banners.',
};

export default function BandMediaPage() {
  return <MediaLibraryManager isBand={true} entityName="The Midnight Echoes" />;
}
