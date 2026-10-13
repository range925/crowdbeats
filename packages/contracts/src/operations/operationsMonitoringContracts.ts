/**
 * Crowdbeats V2 — Real-Time Operations Monitoring Contracts (Phase 10)
 *
 * Defines the schemas, health telemetry metrics, incident alert models,
 * cost evaluation metrics, and callables contracts for real-time
 * platform operations monitoring and incident triage.
 */

import { IsoTimestamp } from '../common/timestamp.js';

// ─── Health Domain Telemetry Models ──────────────────────────────────────────

export interface LivePerformanceHealth {
  readonly activeLiveSessionsCount: number;
  readonly checkInAttemptsLastHour: number;
  readonly checkInSuccessRatePct: number;
  readonly flaggedLocationAnomaliesCount: number;
  readonly activeAudienceNearbyCount: number;
  readonly activeVenuesCount: number;
}

export interface PaymentWebhookHealth {
  readonly stripeWebhookStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  readonly webhooksReceivedLastHour: number;
  readonly webhookSuccessRatePct: number;
  readonly failedWebhooksCount: number;
  readonly averageProcessingLatencyMs: number;
  readonly reconciliationStatus: 'BALANCED' | 'PENDING' | 'DISCREPANCY';
  readonly activePayoutHoldsCount: number;
}

export interface ComputeAndAuthHealth {
  readonly cloudFunctionsStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  readonly functionExecutionErrorsLastHour: number;
  readonly functionErrorRatePct: number;
  readonly authSuccessRatePct: number;
  readonly authErrorsLastHour: number;
  readonly failedLoginsLastHour: number;
  readonly activeSessionCount: number;
}

export interface ModerationQueueHealth {
  readonly pendingAbuseReportsCount: number;
  readonly criticalSlaReportsCount: number;
  readonly pendingFlaggedContentCount: number;
  readonly pendingAppealsCount: number;
  readonly activeCreatorStrikesCount: number;
}

export interface SupportBacklogHealth {
  readonly openTicketsCount: number;
  readonly unassignedTicketsCount: number;
  readonly urgentP1TicketsCount: number;
  readonly overdueSlaTicketsCount: number;
  readonly medianFirstResponseMins: number;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AlertCategory =
  | 'LIVE_CHECKIN'
  | 'PAYMENT_WEBHOOK'
  | 'COMPUTE_FUNCTION'
  | 'AUTH_SECURITY'
  | 'MODERATION'
  | 'SUPPORT_SLA'
  | 'DATABASE';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface OperationalSystemAlert {
  readonly alertId: string;
  readonly category: AlertCategory;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly status: AlertStatus;
  readonly isSimulated: boolean;
  readonly source: string;
  readonly createdAt: IsoTimestamp;
  readonly acknowledgedAt?: IsoTimestamp | null;
  readonly acknowledgedBy?: string | null;
  readonly resolvedAt?: IsoTimestamp | null;
  readonly resolvedBy?: string | null;
  readonly resolutionReason?: string | null;
  readonly metadata?: Record<string, unknown>;
}

export interface TelemetryCostEvaluation {
  readonly estimatedReadsPerScan: number;
  readonly listenersAvoidedCount: number;
  readonly pollingIntervalSeconds: number;
  readonly costSavingsMultiplier: string;
  readonly monthlyProjectedSavingsUsd: number;
}

export interface OperationsMonitoringSnapshot {
  readonly timestamp: IsoTimestamp;
  readonly metricFreshnessSeconds: number;
  readonly overallSystemHealth: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  readonly livePerformance: LivePerformanceHealth;
  readonly paymentWebhook: PaymentWebhookHealth;
  readonly computeAndAuth: ComputeAndAuthHealth;
  readonly moderationQueue: ModerationQueueHealth;
  readonly supportBacklog: SupportBacklogHealth;
  readonly activeAlerts: OperationalSystemAlert[];
  readonly costEvaluation: TelemetryCostEvaluation;
}

// ─── Callables Contracts ─────────────────────────────────────────────────────

export interface GetOperationsMonitoringSnapshotRequest {
  readonly forceRefresh?: boolean;
}

export interface GetOperationsMonitoringSnapshotResponse {
  readonly ok: boolean;
  readonly snapshot: OperationsMonitoringSnapshot;
}

export interface SimulateIncidentAlertRequest {
  readonly category: AlertCategory;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SimulateIncidentAlertResponse {
  readonly ok: boolean;
  readonly alert: OperationalSystemAlert;
  readonly message: string;
}

export interface ResolveIncidentAlertRequest {
  readonly alertId: string;
  readonly resolutionReason: string;
}

export interface ResolveIncidentAlertResponse {
  readonly ok: boolean;
  readonly alertId: string;
  readonly status: 'RESOLVED';
  readonly resolvedAt: IsoTimestamp;
  readonly message: string;
}

export interface AcknowledgeIncidentAlertRequest {
  readonly alertId: string;
}

export interface AcknowledgeIncidentAlertResponse {
  readonly ok: boolean;
  readonly alertId: string;
  readonly status: 'ACKNOWLEDGED';
  readonly acknowledgedAt: IsoTimestamp;
}
