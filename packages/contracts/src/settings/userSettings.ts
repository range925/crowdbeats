/**
 * Crowdbeats V2 — User Settings & Preferences Contracts
 *
 * Defines typed interfaces for user settings, notification preferences,
 * privacy preferences, security options, and account lifecycle.
 */

export interface NotificationPreferences {
  // Financial & Transactional (Security / Transactional notices are permanently enabled)
  readonly tipsReceived: boolean;
  readonly payoutsAndTransfers: boolean;
  readonly campaignMilestones: boolean;
  
  // Live Events & Music Discovery
  readonly followedArtistsLive: boolean;
  readonly nearbyStageAlerts: boolean;
  readonly newReleases: boolean;
  
  // Social & Community
  readonly newFollowers: boolean;
  readonly fanMessages: boolean;
  readonly bandInvitations: boolean;

  // Channels
  readonly pushNotificationsEnabled: boolean;
  readonly emailDigestsEnabled: boolean;
  readonly smsAlertsEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  tipsReceived: true,
  payoutsAndTransfers: true,
  campaignMilestones: true,
  followedArtistsLive: true,
  nearbyStageAlerts: true,
  newReleases: true,
  newFollowers: true,
  fanMessages: true,
  bandInvitations: true,
  pushNotificationsEnabled: true,
  emailDigestsEnabled: true,
  smsAlertsEnabled: false,
};

export interface PrivacyPreferences {
  // Location precision: 'precise' for GPS live radar, 'approximate' for city-level discovery
  readonly locationPrecision: 'precise' | 'approximate' | 'disabled';
  readonly profileDiscoverableInRadar: boolean;
  readonly defaultAnonymousTipping: boolean;
  readonly shareListeningActivity: boolean;
  readonly telemetryAndAnalyticsConsent: boolean;
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  locationPrecision: 'precise',
  profileDiscoverableInRadar: true,
  defaultAnonymousTipping: false,
  shareListeningActivity: true,
  telemetryAndAnalyticsConsent: true,
};

export interface TippingPreferences {
  readonly defaultCurrency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  readonly presetAmountsCents: [number, number, number, number]; // e.g. [200, 500, 1000, 2000]
  readonly allowQuickOneTapTipping: boolean;
  readonly requireBiometricConfirmationOverCents: number; // e.g. 5000 ($50)
}

export const DEFAULT_TIPPING_PREFERENCES: TippingPreferences = {
  defaultCurrency: 'USD',
  presetAmountsCents: [200, 500, 1000, 2000],
  allowQuickOneTapTipping: true,
  requireBiometricConfirmationOverCents: 5000,
};

export interface SecurityPreferences {
  readonly biometricLockEnabled: boolean;
  readonly requireReauthForFinancials: boolean;
  readonly sessionTimeoutMinutes: number;
}

export const DEFAULT_SECURITY_PREFERENCES: SecurityPreferences = {
  biometricLockEnabled: false,
  requireReauthForFinancials: true,
  sessionTimeoutMinutes: 1440, // 24 hours
};

export interface UserSettings {
  readonly uid: string;
  readonly notifications: NotificationPreferences;
  readonly privacy: PrivacyPreferences;
  readonly tipping: TippingPreferences;
  readonly security: SecurityPreferences;
  readonly blockedUserIds: string[];
  readonly updatedAt: string;
}

export interface AccountDeletionRequest {
  readonly confirmPhrase: string; // Must match "delete my account"
  readonly feedbackReason?: string;
  readonly timestamp: number;
}

export interface AccountDeletionResponse {
  readonly ok: boolean;
  readonly status: 'SCHEDULED' | 'BLOCKED_BY_ACTIVE_RESPONSIBILITIES';
  readonly message: string;
  readonly retainedRecordsNotice: string;
  readonly activeBlockers?: string[];
}
