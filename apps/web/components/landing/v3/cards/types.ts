/**
 * Crowdbeats Landing V3 — Discovery Cards & Modals Domain Types
 */

export interface NearestPerformer {
  id: string;
  performerName?: string;
  name?: string;
  photoUrl?: string | null;
  type: 'artist' | 'band' | 'solo';
  genres?: readonly string[] | string[];
  slug?: string;
  venueName?: string;
  venueId?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  isLive?: boolean;
  tipLink?: string;
  tipId?: string;
  rank?: number;
}

export interface NearestPerformerCardProps {
  performer: NearestPerformer;
  rank?: number; // 1 to 5 matching map pin order
  isSelected?: boolean;
  onSelect?: (performer: NearestPerformer) => void;
  onPreview?: (performer: NearestPerformer) => void;
  className?: string;
}

export interface PopularPerformer {
  id: string;
  performerName?: string;
  name?: string;
  photoUrl?: string | null;
  type: 'artist' | 'band' | 'solo';
  genres?: readonly string[] | string[];
  slug?: string;
  followersCount?: number;
  originCity?: string;
  stageName?: string;
  venueName?: string;
  venueId?: string;
  isVerified?: boolean;
  rank?: number;
  popularityScore?: number;
  isLive?: boolean;
  distanceMiles?: number;
  tipLink?: string;
  tipId?: string;
}

export interface PopularPerformerCardProps {
  performer: PopularPerformer;
  onSelect?: (performer: PopularPerformer) => void;
  onPreview?: (performer: PopularPerformer) => void;
  className?: string;
  compact?: boolean;
}

export interface Campaign {
  id: string;
  campaignId?: string;
  title: string;
  creatorName: string;
  creatorType: 'artist' | 'band' | 'solo';
  creatorAvatarUrl?: string | null;
  creatorSlug?: string;
  pledgedDollars?: number;
  goalDollars?: number;
  pledgedCents?: number;
  goalCents?: number;
  percentFunded?: number;
  backersCount?: number;
  backerCount?: number;
  daysRemaining?: number;
  isActive?: boolean;
  status?: string;
  imageUrl?: string | null;
  photoUrl?: string | null;
  campaignUrl?: string;
  category?: string;
  description?: string;
}

export interface CampaignCardProps {
  campaign: Campaign;
  onBack?: (campaign: Campaign) => void;
  className?: string;
  compact?: boolean;
}

export type PreviewPerformer = NearestPerformer | PopularPerformer;

export interface PerformerPreviewModalProps {
  isOpen: boolean;
  performer: PreviewPerformer | null;
  onClose: () => void;
}

export interface PerformerPreviewDrawerProps {
  isOpen: boolean;
  performer: PreviewPerformer | null;
  onClose: () => void;
}
