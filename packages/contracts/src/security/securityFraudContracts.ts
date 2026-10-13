/**
 * Crowdbeats V2 — Security, Fraud, and Compliance Contracts (Phase 17)
 *
 * Platform security audit types, fraud risk assessments, rate limiting
 * boundaries, and compliance verification models.
 */

import type { IsoTimestamp } from '../common/timestamp';

// ─── Security Audit Categories ───────────────────────────────────────────────

export const SecurityAuditCategory = {
  RBAC_AND_PRIVILEGE: 'RBAC_AND_PRIVILEGE',
  STRIPE_WEBHOOK_INTEGRITY: 'STRIPE_WEBHOOK_INTEGRITY',
  APP_CHECK_ATTESTATION: 'APP_CHECK_ATTESTATION',
  RATE_LIMIT_AND_VELOCITY: 'RATE_LIMIT_AND_VELOCITY',
  STORAGE_PERMISSIONS: 'STORAGE_PERMISSIONS',
  COMPLIANCE_AND_AUDIT: 'COMPLIANCE_AND_AUDIT',
} as const;

export type SecurityAuditCategory =
  (typeof SecurityAuditCategory)[keyof typeof SecurityAuditCategory];

// ─── Fraud Risk Levels & Scoring ─────────────────────────────────────────────

export const FraudRiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type FraudRiskLevel = (typeof FraudRiskLevel)[keyof typeof FraudRiskLevel];

export const FraudSignalCode = {
  RAPID_VELOCITY_TIPPING: 'RAPID_VELOCITY_TIPPING',
  MULTIPLE_CARD_DECLINES: 'MULTIPLE_CARD_DECLINES',
  SUSPICIOUS_GEO_MISMATCH: 'SUSPICIOUS_GEO_MISMATCH',
  APP_CHECK_TOKEN_MISSING: 'APP_CHECK_TOKEN_MISSING',
  APP_CHECK_REPLAY_DETECTED: 'APP_CHECK_REPLAY_DETECTED',
  PRIVILEGE_ESCALATION_ATTEMPT: 'PRIVILEGE_ESCALATION_ATTEMPT',
  WEBHOOK_SIGNATURE_MISMATCH: 'WEBHOOK_SIGNATURE_MISMATCH',
  TAMPERED_REQUEST_PAYLOAD: 'TAMPERED_REQUEST_PAYLOAD',
  UNAUTHORIZED_STAFF_RESOURCE_ACCESS: 'UNAUTHORIZED_STAFF_RESOURCE_ACCESS',
} as const;

export type FraudSignalCode =
  (typeof FraudSignalCode)[keyof typeof FraudSignalCode];

export interface FraudRiskAssessment {
  readonly assessmentId: string;
  readonly targetUid?: string;
  readonly riskScore: number; // 0 to 100
  readonly riskLevel: FraudRiskLevel;
  readonly triggeredSignals: readonly FraudSignalCode[];
  readonly recommendedAction: 'allow' | 'challenge' | 'flag_for_review' | 'block_and_hold';
  readonly assessedAt: IsoTimestamp;
  readonly correlationId: string;
}

// ─── Security Check & Verification Results ───────────────────────────────────

export interface SecurityControlCheck {
  readonly checkId: string;
  readonly category: SecurityAuditCategory;
  readonly title: string;
  readonly description: string;
  readonly passed: boolean;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly details?: Record<string, unknown>;
  readonly evaluatedAt: IsoTimestamp;
}

export interface SecurityAuditReport {
  readonly reportId: string;
  readonly auditVersion: string;
  readonly completedAt: IsoTimestamp;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedChecks: number;
  readonly overallStatus: 'COMPLIANT' | 'NEEDS_REVIEW' | 'CRITICAL_FAILURE';
  readonly checks: readonly SecurityControlCheck[];
}

// ─── Storage Upload Security Policy ─────────────────────────────────────────

export const StorageAllowedMimeTypes = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

export const StorageMaxSizeBytes = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
} as const;

export interface SignedUploadUrlRequest {
  readonly destinationPath: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly organizationId?: string;
  readonly campaignId?: string;
}

export interface SignedUploadUrlResponse {
  readonly uploadUrl: string;
  readonly expiresAt: IsoTimestamp;
  readonly maxSizeBytes: number;
  readonly requiredContentType: string;
}
