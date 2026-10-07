/**
 * Crowdbeats V2 — Stripe Compliance Submodule Types & Master State Matrix
 *
 * Covers 15 specialized compliance areas ensuring full alignment with Stripe Services Agreement,
 * Connected Account Agreement, and marketplace regulatory obligations.
 */

export type StripeComplianceSubmenu =
  | 'AGREEMENT_REGISTER'
  | 'CONNECTED_ACCOUNTS'
  | 'MERCHANT_OF_RECORD'
  | 'PLATFORM_FEES'
  | 'PAYMENT_DISCLOSURES'
  | 'REFUNDS_AND_DISPUTES'
  | 'RESTRICTED_BUSINESSES'
  | 'IDENTITY_AND_VERIFICATION'
  | 'PAYOUTS_AND_NEGATIVE_BALANCES'
  | 'TAX_REPORTING'
  | 'WEBHOOKS'
  | 'API_CREDENTIALS'
  | 'DATA_SHARING_AND_PRIVACY'
  | 'STRIPE_POLICY_CHANGES'
  | 'STRIPE_COMPLIANCE_EXCEPTIONS';

export interface StripeAgreementEntry {
  readonly id: string;
  readonly agreementName: string;
  readonly stripeUrl: string;
  readonly country: string;
  readonly applicableProduct: string;
  readonly sourceEffectiveDate: string;
  readonly crowdbeatsReviewDate: string;
  readonly crowdbeatsDocumentsAffected: readonly string[];
  readonly implementationControlsAffected: readonly string[];
  readonly counselReviewStatus: 'APPROVED' | 'IN_REVIEW' | 'CHANGES_REQUIRED';
  readonly nextReviewDate: string;
  readonly changeDetected: boolean;
  readonly owner: string;
}

export interface MerchantOfRecordMapping {
  readonly transactionType: string;
  readonly payer: string;
  readonly recipient: string;
  readonly chargeType: 'DESTINATION_CHARGE' | 'DIRECT_CHARGE' | 'SEPARATE_CHARGE_TRANSFER';
  readonly merchantOfRecord: 'PERFORMER_CREATOR' | 'CAMPAIGN_OWNER' | 'CROWDBEATS_LLC';
  readonly statementDescriptor: string;
  readonly platformFeeBps: number;
  readonly refundOwner: string;
  readonly disputeOwner: string;
  readonly receiptIssuer: string;
  readonly taxReportingOwner: string;
  readonly supportOwner: string;
  readonly governingTermsSection: string;
}

export interface RestrictedBusinessRule {
  readonly id: string;
  readonly stripeCategory: string;
  readonly crowdbeatsCategory: string;
  readonly restrictionType: 'PROHIBITED' | 'RESTRICTED_APPROVAL_REQUIRED';
  readonly affectedPersona: string;
  readonly onboardingQuestion: string;
  readonly automatedFlagRule: string;
  readonly manualReviewRequired: boolean;
  readonly counselApprovalStatus: 'APPROVED' | 'PENDING';
}

export const OFFICIAL_STRIPE_AGREEMENTS: readonly StripeAgreementEntry[] = [
  {
    id: 'agr-ssa',
    agreementName: 'Stripe Services Agreement (US)',
    stripeUrl: 'https://stripe.com/legal/ssa',
    country: 'United States',
    applicableProduct: 'Core Payment Processing & Tokenization',
    sourceEffectiveDate: '2024-06-20',
    crowdbeatsReviewDate: '2026-08-29',
    crowdbeatsDocumentsAffected: ['Terms of Service § 4', 'Privacy Policy § 2'],
    implementationControlsAffected: ['StripeAdapter', 'createTipIntent'],
    counselReviewStatus: 'APPROVED',
    nextReviewDate: '2026-11-29',
    changeDetected: false,
    owner: 'Legal & Payments Operations',
  },
  {
    id: 'agr-connect',
    agreementName: 'Stripe Connected Account Agreement',
    stripeUrl: 'https://stripe.com/legal/connect-account',
    country: 'United States',
    applicableProduct: 'Stripe Connect Custom & Express Marketplace',
    sourceEffectiveDate: '2024-06-20',
    crowdbeatsReviewDate: '2026-08-29',
    crowdbeatsDocumentsAffected: ['Creator Monetization Agreement', 'Band Governance Policy'],
    implementationControlsAffected: ['createConnectLink', 'bandRevenueSplits'],
    counselReviewStatus: 'APPROVED',
    nextReviewDate: '2026-11-29',
    changeDetected: false,
    owner: 'Legal & Payments Operations',
  },
  {
    id: 'agr-privacy',
    agreementName: 'Stripe Privacy Policy',
    stripeUrl: 'https://stripe.com/privacy',
    country: 'Global / US',
    applicableProduct: 'Fraud Detection, Identity (KYC), and Direct Processing',
    sourceEffectiveDate: '2024-06-20',
    crowdbeatsReviewDate: '2026-08-29',
    crowdbeatsDocumentsAffected: ['Privacy Policy § 4 (Data Sharing)'],
    implementationControlsAffected: ['RedactedLogger', 'SubprocessorRegister'],
    counselReviewStatus: 'APPROVED',
    nextReviewDate: '2026-11-29',
    changeDetected: false,
    owner: 'Privacy Officer',
  },
  {
    id: 'agr-restricted',
    agreementName: 'Stripe Restricted Businesses List',
    stripeUrl: 'https://stripe.com/legal/restricted-businesses',
    country: 'United States',
    applicableProduct: 'Risk Engine & Onboarding Gates',
    sourceEffectiveDate: '2024-06-20',
    crowdbeatsReviewDate: '2026-08-29',
    crowdbeatsDocumentsAffected: ['Acceptable Use Policy § 2'],
    implementationControlsAffected: ['ModerationScanner', 'KYCOnboarding'],
    counselReviewStatus: 'APPROVED',
    nextReviewDate: '2026-11-29',
    changeDetected: false,
    owner: 'Trust & Safety Lead',
  },
];

export const CANONICAL_MERCHANT_OF_RECORD_MATRIX: readonly MerchantOfRecordMapping[] = [
  {
    transactionType: 'Live Stage Fan Tip',
    payer: 'Fan (User)',
    recipient: 'Solo Musician or Band Account',
    chargeType: 'DESTINATION_CHARGE',
    merchantOfRecord: 'PERFORMER_CREATOR',
    statementDescriptor: 'CRWDBTS* ARTIST NAME',
    platformFeeBps: 600, // 6%
    refundOwner: 'Crowdbeats Platform (24h fan refund window)',
    disputeOwner: 'Performing Musician / Band (via Connected Account balance)',
    receiptIssuer: 'Crowdbeats on behalf of Artist',
    taxReportingOwner: 'Stripe (1099-K issued directly to Creator)',
    supportOwner: 'Crowdbeats User Support',
    governingTermsSection: 'Terms of Service § 2 (Payment Processing & Tips)',
  },
  {
    transactionType: 'Band Campaign Contribution',
    payer: 'Fan / Supporter',
    recipient: 'Band Managed Stripe Account',
    chargeType: 'DESTINATION_CHARGE',
    merchantOfRecord: 'CAMPAIGN_OWNER',
    statementDescriptor: 'CRWDBTS* CAMPAIGN TITLE',
    platformFeeBps: 600, // 6%
    refundOwner: 'Band Manager / Crowdbeats Review',
    disputeOwner: 'Band Ownership Entity',
    receiptIssuer: 'Crowdbeats on behalf of Campaign Owner',
    taxReportingOwner: 'Stripe (1099-K issued directly to Band Owner)',
    supportOwner: 'Crowdbeats Support + Band Representative',
    governingTermsSection: 'Terms of Service § 2 (Payment Processing & Tips)',
  },
];
