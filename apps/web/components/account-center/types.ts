'use client';

export type SectionId =
  | 'profile' | 'security' | 'privacy' | 'safety'
  | 'payments' | 'payouts' | 'notifications' | 'location'
  | 'appearance' | 'accessibility' | 'language' | 'content'
  | 'blocked' | 'connected' | 'devices' | 'data'
  | 'support' | 'legal' | 'about' | 'danger';

export interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
  warning?: boolean;
  payoutGated?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface SearchEntry {
  label: string;
  description: string;
  section: SectionId;
  keywords: string[];
}
