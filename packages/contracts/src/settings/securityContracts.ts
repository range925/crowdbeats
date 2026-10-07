/**
 * Crowdbeats V2 — Security, Sessions, and Credentials Contracts
 *
 * Defines typed interfaces for user sessions, authentication methods,
 * security alerts, recent authentication state, and suspicious login reports.
 */

import type { IsoTimestamp } from '../common/timestamp';

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

export interface AuthSession {
  readonly sessionId: string;
  readonly device: string;
  readonly deviceType: DeviceType;
  readonly browser: string;
  readonly os: string;
  /**
   * Coarse, approximate regional location only.
   * INVARIANT: Never expose precise GPS, latitude/longitude, or street level.
   */
  readonly approxLocation: string;
  readonly lastActive: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly isCurrentDevice: boolean;
  readonly isRevoked: boolean;
  readonly ipMasked?: string;
}

export type SecurityAlertType =
  | 'new_device_login'
  | 'password_changed'
  | 'suspicious_login'
  | 'email_changed'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'passkey_added'
  | 'session_revoked';

export type SecurityAlertSeverity = 'info' | 'warning' | 'critical';

export interface SecurityAlert {
  readonly id: string;
  readonly type: SecurityAlertType;
  readonly severity: SecurityAlertSeverity;
  readonly title: string;
  readonly description: string;
  readonly approxLocation?: string;
  readonly device?: string;
  readonly timestamp: IsoTimestamp;
  readonly resolved: boolean;
}

export interface SecurityOverview {
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly phone: string | null;
  readonly phoneVerified: boolean;
  readonly hasPassword: boolean;
  readonly passwordLastChanged?: IsoTimestamp;
  readonly connectedProviders: readonly ('password' | 'google.com' | 'apple.com')[];
  readonly twoFactorEnabled: boolean;
  readonly twoFactorMethod: 'sms' | 'totp' | 'none';
  readonly passkeysCount: number;
  readonly biometricUnlockEnabled: boolean;
  readonly sessions: readonly AuthSession[];
  readonly recentAlerts: readonly SecurityAlert[];
}

export interface SuspiciousReportPayload {
  readonly sessionId: string;
  readonly userNotes?: string;
  readonly shouldRevokeAllOthers?: boolean;
}

export interface SuspiciousReportResponse {
  readonly success: boolean;
  readonly incidentId: string;
  readonly revokedSessionId: string;
  readonly recommendedActions: readonly string[];
  readonly timestamp: IsoTimestamp;
}
