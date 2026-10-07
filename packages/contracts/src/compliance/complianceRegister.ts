/**
 * Crowdbeats V2 — 28-Subject Statutory Compliance Obligation Register
 *
 * This represents the compliance workflow data structure and evidence tracker.
 * It is NOT an automated legal advisor.
 *
 * Allowed statuses:
 * - not_assessed
 * - potentially_applicable
 * - legal_review_required
 * - not_applicable_with_reason
 * - control_planned
 * - implementation_in_progress
 * - implemented_unverified
 * - evidence_collected
 * - counsel_reviewed (Requires qualified attorney / compliance officer sign-off)
 * - remediation_required
 * - superseded
 */

export type ComplianceObligationStatus =
  | 'not_assessed'
  | 'potentially_applicable'
  | 'legal_review_required'
  | 'not_applicable_with_reason'
  | 'control_planned'
  | 'implementation_in_progress'
  | 'implemented_unverified'
  | 'evidence_collected'
  | 'counsel_reviewed'
  | 'remediation_required'
  | 'superseded';

export type ComplianceSubjectArea =
  | 'CONSUMER_PROTECTION'
  | 'STATE_PRIVACY_RIGHTS'
  | 'GEOLOCATION_AND_SENSITIVE_DATA'
  | 'CHILDREN_AND_TEENS'
  | 'DATA_SECURITY'
  | 'BREACH_NOTIFICATION'
  | 'PAYMENT_PROCESSING'
  | 'MONEY_TRANSMISSION'
  | 'STRIPE_CONNECT_RESPONSIBILITY'
  | 'TAX_REPORTING_1099K'
  | 'SANCTIONS_AND_AML'
  | 'COPYRIGHT_AND_DMCA'
  | 'UGC_AND_MODERATION'
  | 'ELECTRONIC_COMMUNICATIONS'
  | 'COMMERCIAL_EMAIL_CANSPAM'
  | 'SMS_AND_TCPA'
  | 'ACCESSIBILITY_WCAG'
  | 'AUTO_RENEWAL'
  | 'GIFT_CARDS'
  | 'UNCLAIMED_PROPERTY'
  | 'CHARITABLE_SOLICITATION'
  | 'EMPLOYMENT_STANDARDS'
  | 'INDEPENDENT_CONTRACTOR'
  | 'RECORDS_RETENTION'
  | 'TERMS_AND_CONSENT_VERSIONING'
  | 'ADVERTISING_AND_ENDORSEMENTS'
  | 'AI_AND_AUTOMATED_DECISIONS'
  | 'BIOMETRIC_PRIVACY';

export interface ComplianceObligation {
  readonly id: string;
  readonly subjectArea: ComplianceSubjectArea;
  readonly title: string;
  readonly jurisdiction: 'US_FEDERAL' | 'US_STATE_CA' | 'US_STATE_NY' | 'US_STATE_MULTI';
  readonly statutoryCitation: string;
  readonly authoritativeUrl: string;
  readonly operationalControlRequired: string;
  readonly status: ComplianceObligationStatus;
  readonly evidenceLocation?: string;
  readonly responsibleOwner: string;
  readonly counselReviewedDate?: string;
  readonly reviewerNotes?: string;
  readonly nextReviewDate: string;
}

export const INITIAL_COMPLIANCE_OBLIGATIONS: readonly ComplianceObligation[] = [
  {
    id: 'COMP-01-FTC-ACT',
    subjectArea: 'CONSUMER_PROTECTION',
    title: 'FTC Act Section 5 — Unfair or Deceptive Practices',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '15 U.S.C. § 45',
    authoritativeUrl: 'https://www.ftc.gov/legal-library/browse/statutes/federal-trade-commission-act',
    operationalControlRequired: 'Transparent 5% platform fee disclosure before tip confirmation; clear non-refundable tipping terms.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#comp-01',
    responsibleOwner: 'Compliance Officer',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-02-CCPA-CPRA',
    subjectArea: 'STATE_PRIVACY_RIGHTS',
    title: 'California Consumer Privacy Act / CPRA',
    jurisdiction: 'US_STATE_CA',
    statutoryCitation: 'Cal. Civ. Code § 1798.100 et seq.',
    authoritativeUrl: 'https://cppa.ca.gov/regulations/',
    operationalControlRequired: 'DSAR portal for Access, Portability, Deletion; Global Privacy Control (GPC) signal detection on web.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/CALIFORNIA_COMPLIANCE_MATRIX.md#cpra',
    responsibleOwner: 'Privacy Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-03-GEOLOCATION',
    subjectArea: 'GEOLOCATION_AND_SENSITIVE_DATA',
    title: 'Precise Geolocation Consent & Limitation',
    jurisdiction: 'US_STATE_MULTI',
    statutoryCitation: 'CPRA § 1798.121; VCDPA § 59.1-577',
    authoritativeUrl: 'https://cppa.ca.gov/',
    operationalControlRequired: 'Explicit runtime location permission prompt with approximate fallback and zero passive tracking.',
    status: 'evidence_collected',
    evidenceLocation: 'apps/mobile/lib/ui/settings/privacy_location_screen.dart',
    responsibleOwner: 'Mobile Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-04-COPPA-AGE',
    subjectArea: 'CHILDREN_AND_TEENS',
    title: 'Children’s Online Privacy Protection Act (COPPA)',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '15 U.S.C. §§ 6501–6506; 16 C.F.R. Part 312',
    authoritativeUrl: 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa',
    operationalControlRequired: 'Eligible adult requirement for monetization/tipping; zero data collection from children under 13.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/CHILDREN_AND_AGE_POLICY.md',
    responsibleOwner: 'Legal Counsel',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-05-DATA-SECURITY',
    subjectArea: 'DATA_SECURITY',
    title: 'Reasonable Administrative & Technical Safeguards',
    jurisdiction: 'US_STATE_MULTI',
    statutoryCitation: 'Cal. Civ. Code § 1798.81.5; NY SHIELD Act § 899-bb',
    authoritativeUrl: 'https://ag.ny.gov/business/data-security',
    operationalControlRequired: 'End-to-end HTTPS/TLS 1.3, App Check, Firestore deny-by-default rules, zero raw card storage.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/design/ACCOUNT_SETTINGS_SECURITY_REVIEW.md',
    responsibleOwner: 'Security Admin',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-06-BREACH-NOTIF',
    subjectArea: 'BREACH_NOTIFICATION',
    title: 'State Security Breach Notification Laws (50 States)',
    jurisdiction: 'US_STATE_MULTI',
    statutoryCitation: 'Cal. Civ. Code § 1798.82; NY Gen. Bus. Law § 899-aa',
    authoritativeUrl: 'https://oag.ca.gov/privacy/databreach/reporting',
    operationalControlRequired: 'Incident response protocol with 72-hour regulatory and affected consumer notification SLA tracking.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/BREACH_NOTIFICATION_RESPONSE_PLAN.md',
    responsibleOwner: 'Incident Commander',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-07-PCI-DSS',
    subjectArea: 'PAYMENT_PROCESSING',
    title: 'Payment Card Industry Data Security Standards (PCI-DSS v4.0)',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: 'PCI-DSS SAQ-A v4.0',
    authoritativeUrl: 'https://www.pcisecuritystandards.org/',
    operationalControlRequired: 'Stripe Elements / PaymentSheet iframe redirection. Zero PAN/CVV ingestion or storage in Crowdbeats systems.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/PAYMENTS_AND_MONEY_TRANSMISSION_REVIEW.md',
    responsibleOwner: 'Finance Admin',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-08-MONEY-TRANS',
    subjectArea: 'MONEY_TRANSMISSION',
    title: 'Bank Secrecy Act / FinCEN & State Money Transmission Licensing',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '31 U.S.C. § 5330; 31 C.F.R. § 1010.100(ff)(5)',
    authoritativeUrl: 'https://www.fincen.gov/money-services-business-msb-registration',
    operationalControlRequired: 'Platform relies strictly on Stripe Custom/Express marketplace architecture with agent-of-the-payee exemption.',
    status: 'legal_review_required',
    evidenceLocation: 'docs/compliance/PAYMENTS_AND_MONEY_TRANSMISSION_REVIEW.md',
    responsibleOwner: 'Legal Counsel',
    nextReviewDate: '2026-10-15',
  },
  {
    id: 'COMP-09-STRIPE-CONNECT',
    subjectArea: 'STRIPE_CONNECT_RESPONSIBILITY',
    title: 'Stripe Connected Account Services Agreement',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: 'Stripe Connected Account Agreement',
    authoritativeUrl: 'https://stripe.com/legal/connect-account',
    operationalControlRequired: 'Creators complete Stripe hosted KYC/KYB onboarding prior to payout activation.',
    status: 'evidence_collected',
    evidenceLocation: 'apps/functions/src/connect/createConnectLink.ts',
    responsibleOwner: 'Finance Admin',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-10-1099K-TAX',
    subjectArea: 'TAX_REPORTING_1099K',
    title: 'IRC Section 6050W — 1099-K Form Information Reporting',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '26 U.S.C. § 6050W',
    authoritativeUrl: 'https://www.irs.gov/businesses/understanding-your-form-1099-k',
    operationalControlRequired: 'Stripe Express tax reporting integration; platform masked TIN viewing for tax administrators.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/TAX_REPORTING_RESPONSIBILITY_MATRIX.md',
    responsibleOwner: 'Finance Admin',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-11-OFAC-SANCTIONS',
    subjectArea: 'SANCTIONS_AND_AML',
    title: 'OFAC Sanctions & Anti-Money Laundering Screening',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '31 C.F.R. Part 500',
    authoritativeUrl: 'https://home.treasury.gov/policy-issues/financial-sanctions/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists',
    operationalControlRequired: 'Stripe radar automated screening for Specially Designated Nationals on connected accounts and cards.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#ofac',
    responsibleOwner: 'Compliance Officer',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-12-DMCA',
    subjectArea: 'COPYRIGHT_AND_DMCA',
    title: 'Digital Millennium Copyright Act (DMCA) Safe Harbor § 512',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '17 U.S.C. § 512(c)',
    authoritativeUrl: 'https://www.copyright.gov/dmca-directory/',
    operationalControlRequired: 'Designated copyright agent registry with US Copyright Office; structured notice and counter-notice intake workflow.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/DMCA_OPERATIONS_PLAN.md',
    responsibleOwner: 'Legal Counsel',
    nextReviewDate: '2026-10-15',
  },
  {
    id: 'COMP-13-UGC-MODERATION',
    subjectArea: 'UGC_AND_MODERATION',
    title: 'User-Generated Content & Community Protection Rules',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '47 U.S.C. § 230(c)(2)',
    authoritativeUrl: 'https://www.law.cornell.edu/uscode/text/47/230',
    operationalControlRequired: 'In-app report-abuse workflow, automated profanity scanner, creator strike management system.',
    status: 'evidence_collected',
    evidenceLocation: 'apps/functions/src/moderation/moderationReview.ts',
    responsibleOwner: 'Moderation Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-14-E-SIGN-ACT',
    subjectArea: 'ELECTRONIC_COMMUNICATIONS',
    title: 'Electronic Signatures in Global and National Commerce Act (E-SIGN)',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '15 U.S.C. § 7001 et seq.',
    authoritativeUrl: 'https://www.ftc.gov/legal-library/browse/statutes/electronic-signatures-global-national-commerce-act',
    operationalControlRequired: 'Immutable electronic consent records with timestamp, IP hash, UID, and document version ID.',
    status: 'evidence_collected',
    evidenceLocation: 'packages/contracts/src/compliance/policies.ts',
    responsibleOwner: 'Legal Counsel',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-15-CAN-SPAM',
    subjectArea: 'COMMERCIAL_EMAIL_CANSPAM',
    title: 'CAN-SPAM Act of 2003',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '15 U.S.C. §§ 7701–7713; 16 C.F.R. Part 316',
    authoritativeUrl: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business',
    operationalControlRequired: '1-click unsubscribe headers, valid physical postal address in footer, preference center toggle.',
    status: 'evidence_collected',
    evidenceLocation: 'apps/mobile/lib/ui/settings/notifications_settings_screen.dart',
    responsibleOwner: 'Marketing Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-16-TCPA-SMS',
    subjectArea: 'SMS_AND_TCPA',
    title: 'Telephone Consumer Protection Act (TCPA)',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '47 U.S.C. § 227; 47 C.F.R. § 64.1200',
    authoritativeUrl: 'https://www.fcc.gov/general/telemarketing-and-robocalls',
    operationalControlRequired: 'Separate explicit opt-in checkbox for transactional/promotional SMS; default is FALSE.',
    status: 'evidence_collected',
    evidenceLocation: 'packages/contracts/src/settings/userSettings.ts',
    responsibleOwner: 'Product Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-17-WCAG-A11Y',
    subjectArea: 'ACCESSIBILITY_WCAG',
    title: 'ADA Title III & Web Content Accessibility Guidelines (WCAG 2.2 AA)',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '42 U.S.C. § 12181 et seq.; WCAG 2.2 AA',
    authoritativeUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    operationalControlRequired: '>=56px touch targets, >=4.5:1 text contrast, screen reader semantics, keyboard accessibility.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/ACCESSIBILITY_VALIDATION.md',
    responsibleOwner: 'Mobile & Web Leads',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-18-AUTO-RENEWAL',
    subjectArea: 'AUTO_RENEWAL',
    title: 'California Automatic Renewal Law (ARL)',
    jurisdiction: 'US_STATE_CA',
    statutoryCitation: 'Cal. Bus. & Prof. Code § 17600 et seq.',
    authoritativeUrl: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=17602.&lawCode=BPC',
    operationalControlRequired: 'Crowdbeats V2 offers one-time tips & campaign backing only. No auto-renewing subscriptions are active.',
    status: 'not_applicable_with_reason',
    evidenceLocation: 'docs/compliance/CALIFORNIA_COMPLIANCE_MATRIX.md#arl',
    responsibleOwner: 'Product Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-19-GIFT-CARDS',
    subjectArea: 'GIFT_CARDS',
    title: 'Credit CARD Act of 2009 & State Gift Certificate Laws',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '15 U.S.C. § 1693l-1; Cal. Civ. Code § 1749.5',
    authoritativeUrl: 'https://www.consumerfinance.gov/rules-policy/regulations/1005/20/',
    operationalControlRequired: 'No gift cards or closed-loop stored balance certificates are issued in Crowdbeats V2.',
    status: 'not_applicable_with_reason',
    evidenceLocation: 'docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#gift-cards',
    responsibleOwner: 'Finance Admin',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-20-UNCLAIMED-PROP',
    subjectArea: 'UNCLAIMED_PROPERTY',
    title: 'Uniform Unclaimed Property Act & State Escheatment',
    jurisdiction: 'US_STATE_MULTI',
    statutoryCitation: 'Cal. Civ. Proc. Code § 1500 et seq.; Del. Code Ann. tit. 12, § 1130 et seq.',
    authoritativeUrl: 'https://www.sco.ca.gov/upd_rptg.html',
    operationalControlRequired: 'All payouts route directly to creator bank accounts via Stripe Express without long-term escrow custody.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/PAYMENTS_AND_MONEY_TRANSMISSION_REVIEW.md',
    responsibleOwner: 'Finance Admin',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-21-CHARITY-SOLICIT',
    subjectArea: 'CHARITABLE_SOLICITATION',
    title: 'State Charitable Solicitation Regulations',
    jurisdiction: 'US_STATE_MULTI',
    statutoryCitation: 'Cal. Gov. Code § 12580 et seq.',
    authoritativeUrl: 'https://oag.ca.gov/charities',
    operationalControlRequired: 'All fan tips are classified as non-tax-deductible creator gifts/honorariums. No 501(c)(3) solicitation.',
    status: 'evidence_collected',
    evidenceLocation: 'packages/contracts/src/compliance/policies.ts',
    responsibleOwner: 'Legal Counsel',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-22-EMPLOYMENT-STDS',
    subjectArea: 'EMPLOYMENT_STANDARDS',
    title: 'Fair Labor Standards Act & State Labor Codes',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '29 U.S.C. § 201 et seq.',
    authoritativeUrl: 'https://www.dol.gov/agencies/whd/flsa',
    operationalControlRequired: 'Crowdbeats staff employment records maintained in accordance with FLSA and state wage-and-hour guidelines.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#employment',
    responsibleOwner: 'HR / Compliance',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-23-INDEPENDENT-CONTR',
    subjectArea: 'INDEPENDENT_CONTRACTOR',
    title: 'Independent Contractor Classification (AB 5 / ABC Test)',
    jurisdiction: 'US_STATE_CA',
    statutoryCitation: 'Cal. Lab. Code § 2775 et seq.',
    authoritativeUrl: 'https://www.dir.ca.gov/dlse/faq_independentcontractor.htm',
    operationalControlRequired: 'Performing musicians and bands operate as independent creators using Crowdbeats marketplace tools.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/CALIFORNIA_COMPLIANCE_MATRIX.md#abc-test',
    responsibleOwner: 'Legal Counsel',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-24-RECORDS-RETENTION',
    subjectArea: 'RECORDS_RETENTION',
    title: 'Statutory 7-Year Financial & AML Record Retention',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '31 C.F.R. § 1010.410; 26 U.S.C. § 6001',
    authoritativeUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records',
    operationalControlRequired: 'Account deletion performs soft-delete while preserving financial ledger entries for 7 years.',
    status: 'evidence_collected',
    evidenceLocation: 'apps/functions/src/auth/requestAccountDeletion.ts',
    responsibleOwner: 'Compliance Admin',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-25-TERMS-VERSIONING',
    subjectArea: 'TERMS_AND_CONSENT_VERSIONING',
    title: 'Contract Formation & Terms of Service Versioning',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: 'Restatement (Second) of Contracts § 19',
    authoritativeUrl: 'https://www.law.cornell.edu/wex/contract',
    operationalControlRequired: 'Terms accepted with version identifiers, effective dates, and clickwrap acceptance records in Firestore.',
    status: 'evidence_collected',
    evidenceLocation: 'packages/contracts/src/compliance/policies.ts',
    responsibleOwner: 'Legal Counsel',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-26-ENDORSEMENTS',
    subjectArea: 'ADVERTISING_AND_ENDORSEMENTS',
    title: 'FTC Endorsement & Testimonial Guides',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: '16 C.F.R. Part 255',
    authoritativeUrl: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
    operationalControlRequired: 'Sponsor match pools and branded live stages must feature visible "#Sponsored" disclosure badges.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#endorsements',
    responsibleOwner: 'Product Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-27-AI-GOVERNANCE',
    subjectArea: 'AI_AND_AUTOMATED_DECISIONS',
    title: 'NIST AI Risk Management Framework & Automated Decision Disclosures',
    jurisdiction: 'US_FEDERAL',
    statutoryCitation: 'NIST AI 100-1; Cal. Civ. Code § 1798.185(a)(16)',
    authoritativeUrl: 'https://www.nist.gov/itl/ai-risk-management-framework',
    operationalControlRequired: 'AI discovery summaries and content scans maintain human-in-the-loop review. Zero automated legal certifications.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/FEDERAL_COMPLIANCE_MATRIX.md#ai-governance',
    responsibleOwner: 'AI Lead',
    nextReviewDate: '2026-11-01',
  },
  {
    id: 'COMP-28-BIOMETRIC-BIPA',
    subjectArea: 'BIOMETRIC_PRIVACY',
    title: 'Biometric Information Privacy Act (BIPA)',
    jurisdiction: 'US_STATE_MULTI',
    statutoryCitation: '740 ILCS 14/1 et seq.; Tex. Bus. & Com. Code § 503.001',
    authoritativeUrl: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004',
    operationalControlRequired: 'Crowdbeats does NOT collect, store, or process facial recognition or biometric templates. Mobile biometric app lock uses on-device OS APIs exclusively.',
    status: 'evidence_collected',
    evidenceLocation: 'docs/compliance/STATE_COMPLIANCE_RESEARCH_PLAN.md#bipa',
    responsibleOwner: 'Security Admin',
    nextReviewDate: '2026-11-01',
  },
];
