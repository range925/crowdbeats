/**
 * Crowdbeats V2 — Creator Media Library
 * Photo and video assets library for Solo Creators.
 */

import React from 'react';
import { MediaLibraryManager } from '@/components/media/MediaLibraryManager';

export const metadata = {
  title: 'Media Library & Assets | Crowdbeats Creator Studio',
  description: 'Manage high-resolution press photography, video reels, and EPK assets.',
};

export default function CreatorMediaPage() {
  return <MediaLibraryManager isBand={false} entityName="Elena Cruz" />;
}
