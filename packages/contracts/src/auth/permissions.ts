/**
 * Crowdbeats V2 — 14-Role Granular RBAC Permissions & Separation of Duties Matrix
 *
 * Implements deny-by-default authorization architecture.
 * Roles:
 * 1. FAN
 * 2. SOLO_MUSICIAN
 * 3. BAND_MEMBER
 * 4. BAND_MANAGER
 * 5. BAND_OWNER
 * 6. SPONSOR_MEMBER
 * 7. SPONSOR_MANAGER
 * 8. SUPPORT_AGENT
 * 9. MODERATOR
 * 10. FINANCE_ADMIN
 * 11. COMPLIANCE_ADMIN
 * 12. SECURITY_ADMIN
 * 13. SUPER_ADMIN
 * 14. READ_ONLY_AUDITOR
 */

export type RbacRole =
  | 'FAN'
  | 'SOLO_MUSICIAN'
  | 'BAND_MEMBER'
  | 'BAND_MANAGER'
  | 'BAND_OWNER'
  | 'SPONSOR_MEMBER'
  | 'SPONSOR_MANAGER'
  | 'SUPPORT_AGENT'
  | 'MODERATOR'
  | 'FINANCE_ADMIN'
  | 'COMPLIANCE_ADMIN'
  | 'SECURITY_ADMIN'
  | 'SUPER_ADMIN'
  | 'READ_ONLY_AUDITOR';

export type PermissionAction =
  // User & Profile
  | 'user:read_own'
  | 'user:update_own'
  | 'user:delete_own'
  | 'user:read_any'
  | 'user:suspend'
  | 'user:reinstate'
  | 'user:permanent_delete'
  // Musician & EPK
  | 'musician:create_stage'
  | 'musician:manage_epk'
  | 'musician:generate_qr'
  | 'musician:view_payouts'
  | 'musician:request_payout'
  // Band Governance
  | 'band:create'
  | 'band:manage_roster'
  | 'band:configure_splits'
  | 'band:transfer_ownership'
  | 'band:delete'
  // Sponsor
  | 'sponsor:manage_org'
  | 'sponsor:deposit_escrow'
  | 'sponsor:create_match_pool'
  // Finance & Ledger
  | 'finance:view_transactions'
  | 'finance:issue_standard_refund'
  | 'finance:issue_large_refund' // Separation of duty: > $100 requires 2 approvals
  | 'finance:release_payout_hold'
  | 'finance:update_payout_destination'
  | 'finance:reconcile_ledger'
  | 'finance:view_tax_records'
  | 'finance:append_ledger_adjustment'
  // Content & Moderation
  | 'moderation:view_reports'
  | 'moderation:review_content'
  | 'moderation:issue_strike'
  | 'moderation:dmca_takedown'
  | 'moderation:dmca_restore'
  | 'moderation:ban_user'
  // Privacy & Compliance
  | 'compliance:view_register'
  | 'compliance:update_evidence'
  | 'compliance:mark_counsel_reviewed' // Compliance officer / attorney only
  | 'compliance:process_dsar_export'
  | 'compliance:process_dsar_deletion'
  | 'compliance:apply_legal_hold'
  | 'compliance:release_legal_hold'
  // Security & System
  | 'security:view_audit_logs'
  | 'security:export_audit_logs'
  | 'security:manage_api_keys'
  | 'security:view_incidents'
  | 'security:declare_incident'
  | 'security:revoke_all_sessions'
  // Admin & Staff Management
  | 'admin:view_staff'
  | 'admin:invite_staff'
  | 'admin:modify_staff_role'
  | 'admin:deactivate_staff';

export const ROLE_PERMISSIONS: Record<RbacRole, readonly PermissionAction[]> = {
  FAN: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
  ],
  SOLO_MUSICIAN: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
    'musician:create_stage',
    'musician:manage_epk',
    'musician:generate_qr',
    'musician:view_payouts',
    'musician:request_payout',
  ],
  BAND_MEMBER: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
    'musician:create_stage',
    'musician:manage_epk',
    'musician:generate_qr',
  ],
  BAND_MANAGER: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
    'musician:create_stage',
    'musician:manage_epk',
    'musician:generate_qr',
    'band:manage_roster',
  ],
  BAND_OWNER: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
    'musician:create_stage',
    'musician:manage_epk',
    'musician:generate_qr',
    'musician:view_payouts',
    'musician:request_payout',
    'band:create',
    'band:manage_roster',
    'band:configure_splits',
    'band:transfer_ownership',
    'band:delete',
  ],
  SPONSOR_MEMBER: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
    'sponsor:create_match_pool',
  ],
  SPONSOR_MANAGER: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
    'sponsor:manage_org',
    'sponsor:deposit_escrow',
    'sponsor:create_match_pool',
  ],
  SUPPORT_AGENT: [
    'user:read_own',
    'user:update_own',
    'user:read_any',
    'finance:view_transactions',
    'finance:issue_standard_refund',
    'moderation:view_reports',
    'security:view_incidents',
  ],
  MODERATOR: [
    'user:read_own',
    'user:update_own',
    'user:read_any',
    'user:suspend',
    'moderation:view_reports',
    'moderation:review_content',
    'moderation:issue_strike',
    'moderation:dmca_takedown',
    'moderation:dmca_restore',
    'moderation:ban_user',
  ],
  FINANCE_ADMIN: [
    'user:read_own',
    'user:update_own',
    'user:read_any',
    'finance:view_transactions',
    'finance:issue_standard_refund',
    'finance:issue_large_refund',
    'finance:release_payout_hold',
    'finance:update_payout_destination',
    'finance:reconcile_ledger',
    'finance:view_tax_records',
    'finance:append_ledger_adjustment',
    'security:view_audit_logs',
  ],
  COMPLIANCE_ADMIN: [
    'user:read_own',
    'user:update_own',
    'user:read_any',
    'finance:view_transactions',
    'finance:view_tax_records',
    'compliance:view_register',
    'compliance:update_evidence',
    'compliance:mark_counsel_reviewed',
    'compliance:process_dsar_export',
    'compliance:process_dsar_deletion',
    'compliance:apply_legal_hold',
    'compliance:release_legal_hold',
    'security:view_audit_logs',
  ],
  SECURITY_ADMIN: [
    'user:read_own',
    'user:update_own',
    'user:read_any',
    'user:suspend',
    'user:reinstate',
    'security:view_audit_logs',
    'security:export_audit_logs',
    'security:manage_api_keys',
    'security:view_incidents',
    'security:declare_incident',
    'security:revoke_all_sessions',
    'admin:view_staff',
  ],
  SUPER_ADMIN: [
    'user:read_own',
    'user:update_own',
    'user:delete_own',
    'user:read_any',
    'user:suspend',
    'user:reinstate',
    'user:permanent_delete',
    'musician:create_stage',
    'musician:manage_epk',
    'musician:generate_qr',
    'musician:view_payouts',
    'musician:request_payout',
    'band:create',
    'band:manage_roster',
    'band:configure_splits',
    'band:transfer_ownership',
    'band:delete',
    'sponsor:manage_org',
    'sponsor:deposit_escrow',
    'sponsor:create_match_pool',
    'finance:view_transactions',
    'finance:issue_standard_refund',
    'finance:issue_large_refund',
    'finance:release_payout_hold',
    'finance:update_payout_destination',
    'finance:reconcile_ledger',
    'finance:view_tax_records',
    'finance:append_ledger_adjustment',
    'moderation:view_reports',
    'moderation:review_content',
    'moderation:issue_strike',
    'moderation:dmca_takedown',
    'moderation:dmca_restore',
    'moderation:ban_user',
    'compliance:view_register',
    'compliance:update_evidence',
    'compliance:mark_counsel_reviewed',
    'compliance:process_dsar_export',
    'compliance:process_dsar_deletion',
    'compliance:apply_legal_hold',
    'compliance:release_legal_hold',
    'security:view_audit_logs',
    'security:export_audit_logs',
    'security:manage_api_keys',
    'security:view_incidents',
    'security:declare_incident',
    'security:revoke_all_sessions',
    'admin:view_staff',
    'admin:invite_staff',
    'admin:modify_staff_role',
    'admin:deactivate_staff',
  ],
  READ_ONLY_AUDITOR: [
    'user:read_any',
    'finance:view_transactions',
    'finance:view_tax_records',
    'compliance:view_register',
    'security:view_audit_logs',
    'security:view_incidents',
    'admin:view_staff',
  ],
};

/**
 * High-Risk Operations requiring Dual-Approval (Separation of Duties)
 */
export interface HighRiskOperationRule {
  readonly action: PermissionAction;
  readonly description: string;
  readonly requiresDualApproval: boolean;
  readonly thresholdCents?: number;
  readonly requiredSecondRole?: RbacRole;
}

export const HIGH_RISK_OPERATIONS: readonly HighRiskOperationRule[] = [
  {
    action: 'finance:issue_large_refund',
    description: 'Refunds exceeding $100.00 (10,000 cents) require dual approval by a secondary administrator.',
    requiresDualApproval: true,
    thresholdCents: 10000,
    requiredSecondRole: 'SUPER_ADMIN',
  },
  {
    action: 'finance:release_payout_hold',
    description: 'Releasing compliance payout hold requires confirmation from Compliance Administrator.',
    requiresDualApproval: true,
    requiredSecondRole: 'COMPLIANCE_ADMIN',
  },
  {
    action: 'finance:update_payout_destination',
    description: 'Manual update to creator bank routing destination requires re-authentication & second approval.',
    requiresDualApproval: true,
    requiredSecondRole: 'SECURITY_ADMIN',
  },
  {
    action: 'admin:modify_staff_role',
    description: 'Elevating any user to Administrator role requires Super Administrator dual-signoff.',
    requiresDualApproval: true,
    requiredSecondRole: 'SUPER_ADMIN',
  },
  {
    action: 'user:permanent_delete',
    description: 'Destructive deletion of user records outside statutory retention requires Compliance signoff.',
    requiresDualApproval: true,
    requiredSecondRole: 'COMPLIANCE_ADMIN',
  },
];

export function hasPermission(role: RbacRole, action: PermissionAction): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(action);
}

