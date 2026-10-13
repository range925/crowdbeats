/**
 * Crowdbeats V2 — Admin Command Center Contracts (Phase 7)
 *
 * Provides platform-neutral contracts for:
 * - Operational overview (live solo, bands, fans nearby, active stages)
 * - Verified KPIs (succeeded tip volume, payment completion rates, 6% fee revenue, take rate)
 * - Account health (total users, artists, suspended accounts, verification backlog)
 * - Pending actions & exceptions queue (failed payouts, overdue support cases, disputes, flags)
 * - Crowdfunding campaign activity (active campaigns, pledged funds, completion rates)
 * - Financial health (daily fee variance, payouts on hold, reconciliation state)
 * - System alerts & health probes (services status, rate limits, probe latencies)
 */

import type { IsoTimestamp } from '../common/timestamp';

export interface OperationalOverview {
  readonly liveSoloPerformers: number;
  readonly liveBands: number;
  readonly activeFansNearby: number;
  readonly activeStagesCount: number;
}

export interface VerifiedKpis {
  readonly totalTipsSucceededCount: number;
  readonly totalTipAttemptsCount: number;
  readonly totalGmvCents: number;
  readonly paymentCompletionRatePct: number;
  readonly platformFeeCents: number;
  readonly effectiveTakeRatePct: number;
}

export interface AccountHealth {
  readonly totalUsersCount: number;
  readonly totalArtistsCount: number;
  readonly suspendedUsersCount: number;
  readonly unverifiedArtistsCount: number;
  readonly activeStaffCount: number;
}

export interface PendingActionException {
  readonly id: string;
  readonly category: 'MODERATION' | 'PAYOUT' | 'DISPUTE' | 'WEBHOOK' | 'SUPPORT';
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  readonly title: string;
  readonly description: string;
  readonly timestamp: IsoTimestamp;
  readonly actionLabel: string;
  readonly actionHref: string;
}

export interface PendingActions {
  readonly pendingRefundsCount: number;
  readonly overdueSupportTicketsCount: number;
  readonly flaggedContentReportsCount: number;
  readonly failedPayoutsCount: number;
  readonly items: PendingActionException[];
}

export interface CampaignActivity {
  readonly activeCampaignsCount: number;
  readonly totalPledgedCents: number;
  readonly fundedCampaignsCount: number;
  readonly averageBackersPerCampaign: number;
}

export interface FinanceHealth {
  readonly payoutsOnHoldCount: number;
  readonly failedPayoutsCount: number;
  readonly activeDisputesCount: number;
  readonly dailyFeeVarianceCents: number;
  readonly reconciliationStatus: 'BALANCED' | 'PENDING' | 'DISCREPANCY';
}

export interface SystemAlertItem {
  readonly id: string;
  readonly level: 'info' | 'warn' | 'error';
  readonly service: string;
  readonly message: string;
  readonly timestamp: IsoTimestamp;
}

export interface SystemAlerts {
  readonly systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  readonly activeSecurityAlertsCount: number;
  readonly rateLimitMitigationsCount: number;
  readonly lastProbeLatencyMs: number;
  readonly alerts: SystemAlertItem[];
}

export interface AdminCommandCenterData {
  readonly operationalOverview: OperationalOverview;
  readonly verifiedKpis: VerifiedKpis;
  readonly accountHealth: AccountHealth;
  readonly pendingActions: PendingActions;
  readonly campaignActivity: CampaignActivity;
  readonly financeHealth: FinanceHealth;
  readonly systemAlerts: SystemAlerts;
  readonly metadata: {
    readonly timestamp: IsoTimestamp;
    readonly dataSources: readonly string[];
    readonly latencyMs: number;
  };
}

export interface GetAdminCommandCenterDataRequest {
  readonly forceRefresh?: boolean;
}

export interface GetAdminCommandCenterDataResponse {
  readonly ok: boolean;
  readonly data: AdminCommandCenterData;
}
