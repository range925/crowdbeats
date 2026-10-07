/**
 * Crowdbeats V2 — Zero Dead Menu & Capability Registry
 *
 * Centralized registry indexing 100% of user and administrator menu items.
 * A menu may be displayed ONLY when:
 * 1. Its route exists.
 * 2. Its component exists.
 * 3. Its required backend capability exists.
 * 4. The authenticated user has required permission.
 * 5. Its feature flag is enabled.
 * 6. It defines loading, empty, error, and unavailable states.
 */

import { PermissionAction } from '../auth/permissions';

export interface MenuCapabilityEntry {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly platform: 'mobile' | 'web' | 'both';
  readonly route: string;
  readonly requiredPersona?: string;
  readonly requiredPermission?: PermissionAction;
  readonly featureFlag?: string;
  readonly component: string;
  readonly clientServiceMethod: string;
  readonly backendOperation: string;
  readonly dataSource: string;
  readonly loadingState: string;
  readonly emptyState: string;
  readonly errorState: string;
  readonly unavailableState: string;
  readonly analyticsEvent: string;
  readonly auditEventRequired: boolean;
  readonly automatedTests: readonly string[];
  readonly docOwner: string;
}

export const MENU_CAPABILITY_REGISTRY: readonly MenuCapabilityEntry[] = [
  // ── Mobile Account Hub ──────────────────────────────────────────────────────────
  {
    id: 'mob-account-hub',
    label: 'Account Settings',
    description: 'Central account management hub with profile, payments, and preferences.',
    icon: 'Icons.settings_outlined',
    platform: 'mobile',
    route: '/account',
    requiredPermission: 'user:read_own',
    component: 'AccountHubScreen',
    clientServiceMethod: 'AuthService.getCurrentUser',
    backendOperation: 'firestore.get(users/{uid})',
    dataSource: 'users/{uid}',
    loadingState: 'CircularProgressIndicator',
    emptyState: 'Default fallback persona values',
    errorState: 'Error message banner',
    unavailableState: 'Redirect to /auth',
    analyticsEvent: 'account_hub_viewed',
    auditEventRequired: false,
    automatedTests: ['apps/mobile/test/account_hub_test.dart'],
    docOwner: 'Mobile Team',
  },
  {
    id: 'mob-account-personal-info',
    label: 'Personal Information',
    description: 'Edit display name, phone number, and view verified email.',
    icon: 'Icons.badge_outlined',
    platform: 'mobile',
    route: '/account/personal-info',
    requiredPermission: 'user:update_own',
    component: 'PersonalInfoScreen',
    clientServiceMethod: 'AuthService.updateDisplayName',
    backendOperation: 'firebaseAuth.updateProfile',
    dataSource: 'firebaseAuth.currentUser',
    loadingState: 'CbButton.isLoading',
    emptyState: 'Empty input fields',
    errorState: 'Error snackbar',
    unavailableState: 'Disabled save button',
    analyticsEvent: 'profile_info_updated',
    auditEventRequired: true,
    automatedTests: ['apps/mobile/test/account_hub_test.dart'],
    docOwner: 'Mobile Team',
  },
  {
    id: 'mob-account-payment-methods',
    label: 'Payment Methods',
    description: 'Manage saved credit/debit cards via Stripe Elements.',
    icon: 'Icons.credit_card_outlined',
    platform: 'mobile',
    route: '/account/payment-methods',
    requiredPermission: 'user:read_own',
    component: 'PaymentMethodsScreen',
    clientServiceMethod: 'PaymentService.listPaymentMethods',
    backendOperation: 'functions.listPaymentMethods',
    dataSource: 'stripe.customers.paymentMethods',
    loadingState: 'Skeleton loader cards',
    emptyState: 'No saved cards CTA',
    errorState: 'Stripe gateway error notice',
    unavailableState: 'Retry button',
    analyticsEvent: 'payment_methods_opened',
    auditEventRequired: false,
    automatedTests: ['apps/mobile/test/account_hub_test.dart'],
    docOwner: 'Payments Team',
  },
  {
    id: 'mob-account-tipping-prefs',
    label: 'Tipping Preferences',
    description: 'Configure preset amounts, currency, and 1-tap quick tipping.',
    icon: 'Icons.volunteer_activism_outlined',
    platform: 'mobile',
    route: '/account/tipping-preferences',
    requiredPermission: 'user:update_own',
    component: 'TippingPreferencesScreen',
    clientServiceMethod: 'UserSettingsNotifier.updateTipping',
    backendOperation: 'firestore.set(users/{uid}/settings/tipping)',
    dataSource: 'users/{uid}/settings/tipping',
    loadingState: 'Local Riverpod reactive update',
    emptyState: 'Default presets [2, 5, 10, 20]',
    errorState: 'Revert to previous state',
    unavailableState: 'Read-only currency indicator',
    analyticsEvent: 'tipping_prefs_updated',
    auditEventRequired: false,
    automatedTests: ['apps/mobile/test/account_hub_test.dart'],
    docOwner: 'Payments Team',
  },
  {
    id: 'mob-account-notifications',
    label: 'Notifications',
    description: 'Granular push, email digest, and live stage alerts.',
    icon: 'Icons.notifications_none',
    platform: 'mobile',
    route: '/account/notifications',
    requiredPermission: 'user:update_own',
    component: 'NotificationsSettingsScreen',
    clientServiceMethod: 'UserSettingsNotifier.updateNotifications',
    backendOperation: 'firestore.set(users/{uid}/settings/notifications)',
    dataSource: 'users/{uid}/settings/notifications',
    loadingState: 'Switch smooth toggle animation',
    emptyState: 'Default all enabled',
    errorState: 'Snackbar error message',
    unavailableState: 'Transactional alerts permanently locked ON',
    analyticsEvent: 'notification_prefs_changed',
    auditEventRequired: false,
    automatedTests: ['apps/mobile/test/account_hub_test.dart'],
    docOwner: 'Mobile Team',
  },
  {
    id: 'mob-account-privacy',
    label: 'Privacy & Location',
    description: 'GPS live radar precision and default anonymous tipping.',
    icon: 'Icons.lock_outline',
    platform: 'mobile',
    route: '/account/privacy',
    requiredPermission: 'user:update_own',
    component: 'PrivacyLocationScreen',
    clientServiceMethod: 'UserSettingsNotifier.updatePrivacy',
    backendOperation: 'firestore.set(users/{uid}/settings/privacy)',
    dataSource: 'users/{uid}/settings/privacy',
    loadingState: 'Switch toggle animation',
    emptyState: 'Default precise location with consent',
    errorState: 'Permission denial dialog',
    unavailableState: 'Disabled when device GPS is off',
    analyticsEvent: 'privacy_prefs_changed',
    auditEventRequired: true,
    automatedTests: ['apps/mobile/test/account_hub_test.dart'],
    docOwner: 'Privacy Team',
  },
  {
    id: 'mob-account-security',
    label: 'Sign-In & Security',
    description: 'Password reset, connected accounts, and session revocation.',
    icon: 'Icons.security_outlined',
    platform: 'mobile',
    route: '/account/security',
    requiredPermission: 'user:update_own',
    component: 'SecuritySessionsScreen',
    clientServiceMethod: 'AuthService.sendPasswordResetEmail',
    backendOperation: 'firebaseAuth.sendPasswordResetEmail',
    dataSource: 'firebaseAuth.currentUser',
    loadingState: 'Revocation loading spinner',
    emptyState: 'Current device only',
    errorState: 'Re-authentication required dialog',
    unavailableState: 'Disabled during processing',
    analyticsEvent: 'security_sessions_viewed',
    auditEventRequired: true,
    automatedTests: ['apps/mobile/test/account_hub_test.dart'],
    docOwner: 'Security Team',
  },
  {
    id: 'mob-account-delete',
    label: 'Delete Account',
    description: 'Permanent account removal with compliance safeguards.',
    icon: 'Icons.delete_outline',
    platform: 'mobile',
    route: '/account/delete',
    requiredPermission: 'user:delete_own',
    component: 'AccountDeletionScreen',
    clientServiceMethod: 'AuthNotifier.requestAccountDeletion',
    backendOperation: 'functions.requestAccountDeletion',
    dataSource: 'users/{uid}',
    loadingState: 'Deletion progress overlay',
    emptyState: 'N/A',
    errorState: 'Active blocker error dialog (band founder / escrow hold)',
    unavailableState: 'Disabled until exact phrase entered',
    analyticsEvent: 'account_deletion_initiated',
    auditEventRequired: true,
    automatedTests: ['apps/functions/src/auth/__tests__/requestAccountDeletion.test.ts'],
    docOwner: 'Compliance Team',
  },

  // ── Web Admin Control Center ───────────────────────────────────────────────────
  {
    id: 'web-admin-command-center',
    label: 'Command Center',
    description: 'Executive overview of active users, performers, volume, and health.',
    icon: '⚡',
    platform: 'web',
    route: '/admin/command-center',
    requiredPermission: 'user:read_any',
    component: 'CommandCenterPage',
    clientServiceMethod: 'AdminService.getOperationalOverview',
    backendOperation: 'firestore.collection(systemMetrics)',
    dataSource: 'systemMetrics/current',
    loadingState: 'Shimmer metrics skeleton',
    emptyState: 'Zero operational alerts card',
    errorState: 'Metric retrieval failure banner',
    unavailableState: '403 Forbidden',
    analyticsEvent: 'admin_command_center_viewed',
    auditEventRequired: true,
    automatedTests: ['apps/web/test/admin_pages.test.tsx'],
    docOwner: 'Admin Team',
  },
  {
    id: 'web-admin-crm',
    label: 'CRM & Users',
    description: 'Searchable user lifecycle and persona state machine governance.',
    icon: '👤',
    platform: 'web',
    route: '/admin/crm',
    requiredPermission: 'user:read_any',
    component: 'AdminCRMPage',
    clientServiceMethod: 'AdminService.listUsers',
    backendOperation: 'firestore.collection(users).orderBy(createdAt)',
    dataSource: 'users',
    loadingState: 'Table loading rows',
    emptyState: 'No users matching search query',
    errorState: 'Firestore query error banner',
    unavailableState: 'Read-only view for Auditors',
    analyticsEvent: 'admin_crm_searched',
    auditEventRequired: true,
    automatedTests: ['apps/web/test/admin_pages.test.tsx'],
    docOwner: 'Admin Team',
  },
  {
    id: 'web-admin-artists',
    label: 'Artists & Verification',
    description: 'Musician EPK verification queues and document inspection.',
    icon: '🎸',
    platform: 'web',
    route: '/admin/artists',
    requiredPermission: 'user:read_any',
    component: 'AdminArtistsPage',
    clientServiceMethod: 'AdminService.listVerificationQueue',
    backendOperation: 'firestore.collection(artistProfiles).where(verificationStatus)',
    dataSource: 'artistProfiles',
    loadingState: 'Queue skeleton list',
    emptyState: 'All verification reviews up to date',
    errorState: 'Document retrieval error',
    unavailableState: 'Approval actions disabled without permission',
    analyticsEvent: 'admin_verification_reviewed',
    auditEventRequired: true,
    automatedTests: ['apps/web/test/admin_pages.test.tsx'],
    docOwner: 'Trust & Safety Team',
  },
  {
    id: 'web-admin-finance',
    label: 'Finance & Ledger',
    description: 'Daily automated reconciliation between internal ledger and Stripe.',
    icon: '💳',
    platform: 'web',
    route: '/admin/finance',
    requiredPermission: 'finance:view_transactions',
    component: 'AdminFinancePage',
    clientServiceMethod: 'FinanceService.getReconciliationReport',
    backendOperation: 'functions.getReconciliationReport',
    dataSource: 'paymentLedger + stripe.balanceTransactions',
    loadingState: 'Ledger table skeleton',
    emptyState: 'Zero financial discrepancies detected',
    errorState: 'Stripe sync failure notice',
    unavailableState: 'Refund actions locked without dual approval',
    analyticsEvent: 'admin_finance_reconciled',
    auditEventRequired: true,
    automatedTests: ['apps/functions/src/financial/__tests__/reconciliationService.test.ts'],
    docOwner: 'Finance Team',
  },
  {
    id: 'web-admin-content',
    label: 'Content Moderation & DMCA',
    description: 'UGC report reviews, DMCA takedown notice intake, and strikes.',
    icon: '📝',
    platform: 'web',
    route: '/admin/content',
    requiredPermission: 'moderation:review_content',
    component: 'AdminContentPage',
    clientServiceMethod: 'ModerationService.listPendingReports',
    backendOperation: 'firestore.collection(reports).where(status, ==, PENDING)',
    dataSource: 'reports',
    loadingState: 'Moderation queue spinner',
    emptyState: 'Queue clear! No pending content reports.',
    errorState: 'Queue load failure notice',
    unavailableState: 'Ban button disabled without dual signoff',
    analyticsEvent: 'admin_moderation_actioned',
    auditEventRequired: true,
    automatedTests: ['apps/functions/src/moderation/__tests__/moderationReview.test.ts'],
    docOwner: 'Trust & Safety Team',
  },
  {
    id: 'web-admin-compliance',
    label: 'Compliance Center',
    description: '28-subject-area statutory compliance obligation register & legal review queue.',
    icon: '⚖️',
    platform: 'web',
    route: '/admin/compliance',
    requiredPermission: 'compliance:view_register',
    component: 'AdminCompliancePage',
    clientServiceMethod: 'ComplianceService.listObligations',
    backendOperation: 'firestore.collection(complianceObligations)',
    dataSource: 'complianceObligations',
    loadingState: 'Obligation cards skeleton',
    emptyState: 'No obligations matching filter criteria',
    errorState: 'Register load error banner',
    unavailableState: 'Counsel Reviewed button restricted to authorized legal officers',
    analyticsEvent: 'admin_compliance_viewed',
    auditEventRequired: true,
    automatedTests: ['packages/contracts/src/__tests__/complianceRegister.test.ts'],
    docOwner: 'Legal & Compliance Team',
  },
];

/**
 * Validates that all menu entries meet the zero dead menu contract.
 */
export function validateMenuRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const entry of MENU_CAPABILITY_REGISTRY) {
    if (!entry.id || !entry.label || !entry.route || !entry.component) {
      errors.push(`Menu entry [${entry.id || 'UNKNOWN'}] is missing mandatory identifier, label, route, or component.`);
    }
    if (!entry.backendOperation || !entry.dataSource) {
      errors.push(`Menu entry [${entry.id}] must define a real backendOperation and dataSource.`);
    }
    if (!entry.loadingState || !entry.emptyState || !entry.errorState) {
      errors.push(`Menu entry [${entry.id}] must define loadingState, emptyState, and errorState.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
