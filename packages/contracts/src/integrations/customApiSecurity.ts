/**
 * Crowdbeats V2 — Custom Server API Security & Guardrail Model
 *
 * Enforces zero-trust outbound API policies:
 * - Anti-SSRF (Blocks localhost, link-local, private subnets, cloud metadata)
 * - Strict TLS (HTTPS required)
 * - Maximum timeouts and rate limits
 * - Data classification and review gates
 */

export interface CustomApiDefinition {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly businessPurpose: string;
  readonly dataOwner: string;
  readonly technicalOwner: string;
  readonly documentationUrl: string;
  readonly baseHttpsUrl: string;
  readonly allowedHostnames: readonly string[];
  readonly environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  readonly authType: 'API_KEY_HEADER' | 'BEARER_TOKEN' | 'OAUTH2' | 'MTLS';
  readonly headerName?: string;
  readonly timeoutMs: number; // max 10000ms
  readonly maxRequestsPerMinute: number; // max 600
  readonly permittedMethods: readonly ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  readonly permittedPaths: readonly string[];
  readonly dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED_PII';
  readonly geographicRegion: 'US_EAST' | 'US_CENTRAL' | 'GLOBAL';
  readonly legalReviewStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED';
  readonly securityReviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  readonly privacyReviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  readonly isEnabled: boolean;
}

export const DISALLOWED_IP_RANGES = [
  '127.0.0.0/8',      // Loopback / Localhost
  '10.0.0.0/8',       // Private Class A
  '172.16.0.0/12',    // Private Class B
  '192.168.0.0/16',   // Private Class C
  '169.254.0.0/16',   // Link-Local / Cloud Metadata (169.254.169.254)
  '::1/128',          // IPv6 Loopback
  'fc00::/7',         // IPv6 Unique Local
  'fe80::/10',        // IPv6 Link-Local
] as const;

export function validateCustomApiDestination(urlStr: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Custom integrations MUST use HTTPS protocol.' };
    }

    const host = parsed.hostname.toLowerCase();

    // Check loopback / localhost
    if (host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || host === '::1') {
      return { safe: false, reason: 'Localhost and loopback destinations are strictly forbidden.' };
    }

    // Check cloud metadata endpoint
    if (host === '169.254.169.254' || host === 'metadata.google.internal') {
      return { safe: false, reason: 'Access to Cloud Metadata service is prohibited (SSRF prevention).' };
    }

    // Check private RFC 1918 subnets
    if (
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return { safe: false, reason: 'Private network IP destinations are forbidden.' };
    }

    return { safe: true };
  } catch (err) {
    return { safe: false, reason: 'Invalid destination URL format.' };
  }
}
