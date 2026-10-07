/**
 * Crowdbeats V2 — Integrations & Provider Schemas
 *
 * Defines typed configuration metadata, provider health, and environment contexts.
 * INVARIANT: Secret credentials are NEVER stored or returned in client-accessible schemas.
 */

export type IntegrationProviderType =
  | 'STRIPE'
  | 'GOOGLE_MAPS'
  | 'FIREBASE_GCP'
  | 'AI_SERVICES'
  | 'EMAIL'
  | 'SMS'
  | 'PUSH_NOTIFICATIONS'
  | 'ANALYTICS'
  | 'ERROR_MONITORING'
  | 'CUSTOMER_SUPPORT'
  | 'STORAGE'
  | 'CUSTOM_SERVER_API';

export type IntegrationHealthStatus =
  | 'not_configured'
  | 'draft'
  | 'configured_untested'
  | 'testing'
  | 'healthy'
  | 'degraded'
  | 'failing'
  | 'disabled'
  | 'rotation_required'
  | 'permission_error'
  | 'quota_exceeded';

export type DeploymentEnvironment = 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export interface IntegrationSummaryCard {
  readonly id: string;
  readonly providerType: IntegrationProviderType;
  readonly name: string;
  readonly icon: string;
  readonly purpose: string;
  readonly environment: DeploymentEnvironment;
  readonly healthStatus: IntegrationHealthStatus;
  readonly configurationStatus: 'CONFIGURED' | 'PARTIAL' | 'UNCONFIGURED';
  readonly lastSuccessfulRequest?: string;
  readonly lastFailedRequest?: string;
  readonly lastWebhookDelivery?: string;
  readonly configOwner: string;
  readonly lastChangedAt: string;
  readonly rotationStatus: 'CURRENT' | 'DUE_SOON' | 'EXPIRED' | 'ROTATING';
  readonly isEnabled: boolean;
  readonly configRoute: string;
  readonly docsUrl: string;
}

export const INITIAL_INTEGRATION_SUMMARIES: readonly IntegrationSummaryCard[] = [
  {
    id: 'int-stripe',
    providerType: 'STRIPE',
    name: 'Stripe Payments & Connect',
    icon: '💳',
    purpose: 'Marketplace payments, live stage tipping, Connect custom accounts, automated splits, and 1099-K tax reporting.',
    environment: 'DEVELOPMENT',
    healthStatus: 'healthy',
    configurationStatus: 'CONFIGURED',
    lastSuccessfulRequest: '2 mins ago',
    lastWebhookDelivery: '5 mins ago (payment_intent.succeeded)',
    configOwner: 'Finance Team',
    lastChangedAt: '2026-08-25',
    rotationStatus: 'CURRENT',
    isEnabled: true,
    configRoute: '/admin/integrations/stripe',
    docsUrl: 'https://stripe.com/docs/connect',
  },
  {
    id: 'int-google-maps',
    providerType: 'GOOGLE_MAPS',
    name: 'Google Maps Platform',
    icon: '🗺️',
    purpose: 'Live Stage Radar, venue geofencing, street map rendering, place search, and server-side geocoding.',
    environment: 'DEVELOPMENT',
    healthStatus: 'healthy',
    configurationStatus: 'CONFIGURED',
    lastSuccessfulRequest: '1 min ago',
    configOwner: 'Mobile & Discovery Lead',
    lastChangedAt: '2026-08-26',
    rotationStatus: 'CURRENT',
    isEnabled: true,
    configRoute: '/admin/integrations/google-maps',
    docsUrl: 'https://developers.google.com/maps',
  },
  {
    id: 'int-firebase-gcp',
    providerType: 'FIREBASE_GCP',
    name: 'Firebase & Google Cloud',
    icon: '🔥',
    purpose: 'Authentication, Firestore Multi-Tenant Database, Cloud Storage for media, Cloud Functions v2, and App Check.',
    environment: 'DEVELOPMENT',
    healthStatus: 'healthy',
    configurationStatus: 'CONFIGURED',
    lastSuccessfulRequest: 'Just now',
    configOwner: 'Infrastructure Lead',
    lastChangedAt: '2026-08-28',
    rotationStatus: 'CURRENT',
    isEnabled: true,
    configRoute: '/admin/integrations/firebase-gcp',
    docsUrl: 'https://firebase.google.com/docs',
  },
  {
    id: 'int-ai-services',
    providerType: 'AI_SERVICES',
    name: 'Gemini / Vertex AI',
    icon: '✨',
    purpose: 'Creator profile summaries, automated content toxicity screening, and administrative support drafts.',
    environment: 'DEVELOPMENT',
    healthStatus: 'healthy',
    configurationStatus: 'CONFIGURED',
    lastSuccessfulRequest: '12 mins ago',
    configOwner: 'AI & Trust Lead',
    lastChangedAt: '2026-08-27',
    rotationStatus: 'CURRENT',
    isEnabled: true,
    configRoute: '/admin/integrations/ai-services',
    docsUrl: 'https://ai.google.dev',
  },
  {
    id: 'int-notifications',
    providerType: 'EMAIL',
    name: 'Email, SMS & Push Notifications',
    icon: '📬',
    purpose: 'Transactional emails (SendGrid/Resend), 10DLC compliant SMS (Twilio), and multi-platform FCM/APNs push.',
    environment: 'DEVELOPMENT',
    healthStatus: 'healthy',
    configurationStatus: 'CONFIGURED',
    lastSuccessfulRequest: '18 mins ago',
    configOwner: 'Product Team',
    lastChangedAt: '2026-08-24',
    rotationStatus: 'CURRENT',
    isEnabled: true,
    configRoute: '/admin/integrations/notifications',
    docsUrl: 'https://firebase.google.com/docs/cloud-messaging',
  },
  {
    id: 'int-monitoring',
    providerType: 'ANALYTICS',
    name: 'Analytics & Error Monitoring',
    icon: '📊',
    purpose: 'Privacy-preserving behavioral analytics, Crashlytics mobile crash reporting, and Cloud Monitoring probes.',
    environment: 'DEVELOPMENT',
    healthStatus: 'healthy',
    configurationStatus: 'CONFIGURED',
    lastSuccessfulRequest: '3 mins ago',
    configOwner: 'Security & QA Lead',
    lastChangedAt: '2026-08-25',
    rotationStatus: 'CURRENT',
    isEnabled: true,
    configRoute: '/admin/integrations/monitoring',
    docsUrl: 'https://cloud.google.com/monitoring',
  },
];
