/**
 * Crowdbeats V2 — Legal Document Lifecycle & Management Schemas
 *
 * Covers all 18 canonical platform agreements, consent policies, and 9 lifecycle states.
 */

export type LegalDocumentType =
  | 'TERMS_OF_SERVICE'
  | 'PRIVACY_POLICY'
  | 'COOKIE_POLICY'
  | 'PAYMENT_TERMS'
  | 'REFUND_POLICY'
  | 'CONNECTED_ACCOUNT_AGREEMENT'
  | 'ARTIST_AGREEMENT'
  | 'BAND_AGREEMENT'
  | 'SPONSOR_AGREEMENT'
  | 'COMMUNITY_GUIDELINES'
  | 'ACCEPTABLE_USE_POLICY'
  | 'DMCA_POLICY'
  | 'DATA_RETENTION_POLICY'
  | 'ACCESSIBILITY_STATEMENT'
  | 'ELECTRONIC_COMMUNICATIONS_CONSENT'
  | 'MARKETING_CONSENT'
  | 'SMS_CONSENT'
  | 'SUBPROCESSOR_REGISTER';

export type LegalDocumentState =
  | 'draft'
  | 'internal_review'
  | 'legal_review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'superseded'
  | 'withdrawn';

export interface DocumentSection {
  readonly sectionId: string;
  readonly heading: string;
  readonly content: string;
  readonly order: number;
  readonly isModified: boolean;
  readonly counselComments?: string;
}

export interface LegalDocumentRecord {
  readonly id: string;
  readonly documentType: LegalDocumentType;
  readonly title: string;
  readonly jurisdiction: 'US_FEDERAL' | 'US_STATE_CA' | 'US_STATE_MULTI';
  readonly language: 'en-US' | 'es-US';
  readonly version: string;
  readonly state: LegalDocumentState;
  readonly effectiveDate: string;
  readonly publicationDate?: string;
  readonly summaryOfChanges: string;
  readonly sections: readonly DocumentSection[];
  readonly sourceReferences: readonly string[];
  readonly affectedPersonas: readonly string[];
  readonly reacceptanceRequired: boolean;
  readonly authorUid: string;
  readonly lastEditorUid: string;
  readonly primaryReviewerUid?: string;
  readonly secondaryApproverUid?: string; // Dual approval for publication
  readonly sha256Hash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UserReconsentRecord {
  readonly id: string;
  readonly uid: string;
  readonly personaType: string;
  readonly documentId: string;
  readonly documentVersion: string;
  readonly acceptedAt: string;
  readonly clientIpHash: string;
  readonly userAgent: string;
  readonly acceptanceSurface: 'MOBILE_ONBOARDING' | 'WEB_SETTINGS' | 'STRIPE_CONNECT_GATE';
}

export const INITIAL_LEGAL_DOCUMENTS: readonly LegalDocumentRecord[] = [
  {
    id: 'doc-terms',
    documentType: 'TERMS_OF_SERVICE',
    title: 'Terms of Service',
    jurisdiction: 'US_FEDERAL',
    language: 'en-US',
    version: '2026-08-25',
    state: 'published',
    effectiveDate: '2026-08-25',
    publicationDate: '2026-08-25',
    summaryOfChanges: 'Initial published version establishing platform agreements, 18+ eligibility, and 5% fee disclosures.',
    sections: [
      { sectionId: 'sec-1', heading: '1. Introduction & Acceptance', content: 'Welcome to Crowdbeats. By accessing our platform, you agree to these Terms.', order: 1, isModified: false },
      { sectionId: 'sec-2', heading: '2. Eligibility & Account Security', content: 'You must be at least 18 years of age to send tips or monetize performances.', order: 2, isModified: false },
      { sectionId: 'sec-3', heading: '3. Financial Services & Stripe Processing', content: 'Crowdbeats is a non-custodial marketplace. Payments process directly via Stripe Connect.', order: 3, isModified: false },
      { sectionId: 'sec-4', heading: '4. Platform Fees & Tipping Rules', content: 'Crowdbeats assesses a 5% platform fee on voluntary tips. Tips become final after 24 hours.', order: 4, isModified: false },
    ],
    sourceReferences: ['15 U.S.C. § 45', 'Stripe Services Agreement'],
    affectedPersonas: ['FAN', 'ARTIST', 'BAND', 'SPONSOR'],
    reacceptanceRequired: false,
    authorUid: 'legal_lead_1',
    lastEditorUid: 'legal_lead_1',
    sha256Hash: '9c16f09cb9cb101796a1f8d0bd3f0e44f7aee09114e8217aaa5513bfdf657f98',
    createdAt: '2026-08-25T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
  },
  {
    id: 'doc-privacy',
    documentType: 'PRIVACY_POLICY',
    title: 'Privacy Policy',
    jurisdiction: 'US_STATE_CA',
    language: 'en-US',
    version: '2026-08-25',
    state: 'published',
    effectiveDate: '2026-08-25',
    publicationDate: '2026-08-25',
    summaryOfChanges: 'Initial published privacy policy with CPRA, precise location consent, and Stripe data sharing.',
    sections: [
      { sectionId: 'sec-1', heading: '1. Information We Collect', content: 'We collect name, email, and optional location with active runtime consent.', order: 1, isModified: false },
      { sectionId: 'sec-2', heading: '2. Payment Data & Stripe Sharing', content: 'Card numbers are tokenized by Stripe. Crowdbeats never receives complete PAN/CVC.', order: 2, isModified: false },
      { sectionId: 'sec-3', heading: '3. Data Subject Rights', content: 'You may request data access, export, correction, or deletion in Account Settings.', order: 3, isModified: false },
    ],
    sourceReferences: ['Cal. Civ. Code § 1798.100', 'Stripe Privacy Policy'],
    affectedPersonas: ['FAN', 'ARTIST', 'BAND', 'SPONSOR'],
    reacceptanceRequired: false,
    authorUid: 'privacy_lead_1',
    lastEditorUid: 'privacy_lead_1',
    sha256Hash: '83f63f2cecdbc0261198394fe0ca5a6cdc84414c8dd756dbcd3ee3235f1cf36b',
    createdAt: '2026-08-25T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
  },
];
