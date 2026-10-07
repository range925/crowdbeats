/**
 * Crowdbeats V2 — Compliance Policies & Consent Contracts (Phase 4)
 *
 * Defines metadata, version registry, and consent schemas for all 8 mandatory
 * content platform policies required for Stripe compliance.
 *
 * Core Philosophy (Simon Sinek "Start With Why"):
 * 100% Free to Join & Explore · Transparent 6% Technology Fee + Stripe Direct Processing Costs
 */

export const PolicyType = {
  TERMS_OF_SERVICE: 'TERMS_OF_SERVICE',
  ACCEPTABLE_USE_POLICY: 'ACCEPTABLE_USE_POLICY',
  CREATOR_MONETIZATION_POLICY: 'CREATOR_MONETIZATION_POLICY',
  DMCA_COPYRIGHT_POLICY: 'DMCA_COPYRIGHT_POLICY',
  REPORTING_AND_COMPLAINTS_POLICY: 'REPORTING_AND_COMPLAINTS_POLICY',
  LAW_ENFORCEMENT_GUIDELINES: 'LAW_ENFORCEMENT_GUIDELINES',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  REFUND_DISPUTE_POLICY: 'REFUND_DISPUTE_POLICY',
} as const;

export type PolicyType = (typeof PolicyType)[keyof typeof PolicyType];

export interface PolicyMetadata {
  readonly policyType: PolicyType;
  readonly title: string;
  readonly version: string;
  readonly effectiveDate: string;
  readonly canonicalPath: string;
  readonly canonicalUrl: string;
  readonly sha256Hash: string;
  readonly summary: string;
}

export const PLATFORM_POLICIES_REGISTRY: Record<PolicyType, PolicyMetadata> = {
  [PolicyType.TERMS_OF_SERVICE]: {
    policyType: PolicyType.TERMS_OF_SERVICE,
    title: 'Terms of Service',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/terms',
    canonicalUrl: 'https://crowdbeats.ai/legal/terms',
    sha256Hash: '9c16f09cb9cb101796a1f8d0bd3f0e44f7aee09114e8217aaa5513bfdf657f98',
    summary: 'Our covenant with you: 100% free to join and explore with zero subscriptions. When money moves, Crowdbeats takes a transparent 6% platform technology fee plus direct Stripe processing costs. Governed by California law in San Francisco.',
  },
  [PolicyType.ACCEPTABLE_USE_POLICY]: {
    policyType: PolicyType.ACCEPTABLE_USE_POLICY,
    title: 'Acceptable Use & Prohibited Content Policy',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/aup',
    canonicalUrl: 'https://crowdbeats.ai/legal/aup',
    sha256Hash: 'b7306db23ed3aaa0ac9554429e839598f8540980eeb823f2700e462e91121654',
    summary: 'Protecting the sanctuary of live performance: Zero-tolerance prohibition of CSAM/CSAE, violence, hate speech, harassment, non-consensual content, and dangerous materials.',
  },
  [PolicyType.CREATOR_MONETIZATION_POLICY]: {
    policyType: PolicyType.CREATOR_MONETIZATION_POLICY,
    title: 'Creator Monetization & Tip Agreement',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/creator-monetization',
    canonicalUrl: 'https://crowdbeats.ai/legal/creator-monetization',
    sha256Hash: '281c7f063717074d436b145e147a408a5785000d25e6d4f1658b741ccb2f1d30',
    summary: 'Our creator alignment promise: 100% free profiles, transparent 6% platform technology fee plus separate Stripe processing fees, automated 100% band split matrix, and direct Stripe Connect payouts.',
  },
  [PolicyType.DMCA_COPYRIGHT_POLICY]: {
    policyType: PolicyType.DMCA_COPYRIGHT_POLICY,
    title: 'DMCA & Copyright Policy',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/dmca',
    canonicalUrl: 'https://crowdbeats.ai/legal/dmca',
    sha256Hash: 'a7c7a9a323bf410954cda8836dee89355514acc777104179d97e02f682813f74',
    summary: 'Honoring original musicianship: Notice and takedown procedures under 17 U.S.C. § 512(c), designated copyright agent, counter-notice protocols, and 3-strike repeat infringer protection.',
  },
  [PolicyType.REPORTING_AND_COMPLAINTS_POLICY]: {
    policyType: PolicyType.REPORTING_AND_COMPLAINTS_POLICY,
    title: 'Content Reporting & Abuse Handling Policy',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/report-abuse',
    canonicalUrl: 'https://crowdbeats.ai/legal/report-abuse',
    sha256Hash: 'a898ecb37f952ce710c1d4293b011f5f63c49ee2688a9f3e2edaec668d6b04e3',
    summary: 'Community safety and fair moderation: Transparent intake workflows for reporting safety violations, strict SLAs for moderator triage, and human appeals processes.',
  },
  [PolicyType.LAW_ENFORCEMENT_GUIDELINES]: {
    policyType: PolicyType.LAW_ENFORCEMENT_GUIDELINES,
    title: 'Law Enforcement & Emergency Request Guidelines',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/law-enforcement',
    canonicalUrl: 'https://crowdbeats.ai/legal/law-enforcement',
    sha256Hash: 'cd0a54ead6d05a48b4cc2e1d8d49e9c4b841225bde4379bede97b84d4e56d52a',
    summary: 'Statutory compliance protocols for legal authorities, subpoenas, court orders, preservation letters, and imminent life-safety emergency disclosures.',
  },
  [PolicyType.PRIVACY_POLICY]: {
    policyType: PolicyType.PRIVACY_POLICY,
    title: 'Privacy Policy',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/privacy',
    canonicalUrl: 'https://crowdbeats.ai/legal/privacy',
    sha256Hash: '83f63f2cecdbc0261198394fe0ca5a6cdc84414c8dd756dbcd3ee3235f1cf36b',
    summary: 'The foundation of trust: 100% free access, zero data sales, local ephemeral geolocation, tokenized Stripe tipping, and instant self-service PDF/JSON statement downloads.',
  },
  [PolicyType.REFUND_DISPUTE_POLICY]: {
    policyType: PolicyType.REFUND_DISPUTE_POLICY,
    title: 'Refund & Tip Dispute Policy',
    version: '2026-08-21',
    effectiveDate: 'August 21, 2026',
    canonicalPath: '/legal/refunds',
    canonicalUrl: 'https://crowdbeats.ai/legal/refunds',
    sha256Hash: '383b91338cefb19ae6d53e47648e75782d980dc51eb24bcd97c8abcbe1cd5952',
    summary: 'Protecting creator income: Real-time tip finality, 14-day technical billing dispute windows, transparent fee disclosures, and Stripe dispute remediation.',
  },
};

export interface ComplianceConsentRecord {
  readonly consentId: string;
  readonly uid: string;
  readonly policyType: PolicyType;
  readonly version: string;
  readonly sha256Hash: string;
  readonly granted: boolean;
  readonly grantedAt: string;
  readonly platform: 'web' | 'mobile' | 'api';
  readonly userAgent?: string;
  readonly ipAddress?: string;
}

export interface RecordConsentRequest {
  readonly policyType: PolicyType;
  readonly version: string;
  readonly platform?: 'web' | 'mobile' | 'api';
  readonly userAgent?: string;
}
