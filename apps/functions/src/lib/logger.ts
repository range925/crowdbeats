/**
 * Crowdbeats V2 — Structured Redacted Logger (Phase 11)
 *
 * Logging invariants:
 * - NEVER log PAN, CVV, raw card numbers
 * - NEVER log Stripe secrets, webhook secrets, HMAC keys, or bearer tokens
 * - NEVER log raw sensitive messages or full PII
 * - Always attach correlationId, service, level, and ISO timestamp
 * - 90-day active retention; audit events preserved in Firestore for 7 years
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogPayload {
  message: string;
  level?: LogLevel;
  correlationId?: string;
  service?: string;
  context?: Record<string, unknown>;
  error?: Error | unknown;
}

// Regex patterns to detect and mask sensitive data
const PAN_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const STRIPE_SECRET_REGEX = /(?:sk|whsec|rk)_(?:test|live)_[0-9a-zA-Z]{16,}/g;
const AUTH_BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-_.]+/gi;

/**
 * Recursively redacts sensitive values from any object or string before logging.
 */
export function redactSensitiveData(input: unknown): unknown {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return input
      .replace(STRIPE_SECRET_REGEX, '[REDACTED_STRIPE_SECRET]')
      .replace(AUTH_BEARER_REGEX, 'Bearer [REDACTED_TOKEN]')
      .replace(PAN_REGEX, (match) => {
        const clean = match.replace(/[\s-]/g, '');
        if (clean.length >= 13 && clean.length <= 19) {
          return `[REDACTED_CARD_...${clean.slice(-4)}]`;
        }
        return match;
      });
  }

  if (Array.isArray(input)) {
    return input.map(redactSensitiveData);
  }

  if (typeof input === 'object') {
    const redactedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('cvv') ||
        lowerKey.includes('pan') ||
        lowerKey.includes('cardnumber') ||
        lowerKey.includes('token')
      ) {
        redactedObj[key] = '[REDACTED_FIELD]';
      } else if (lowerKey === 'message' && typeof value === 'string' && value.length > 200) {
        redactedObj[key] = `${value.substring(0, 30)}... [TRUNCATED]`;
      } else {
        redactedObj[key] = redactSensitiveData(value);
      }
    }
    return redactedObj;
  }

  return input;
}

export class RedactedLogger {
  private service: string;

  constructor(service = 'crowdbeats-functions') {
    this.service = service;
  }

  private log(level: LogLevel, payload: LogPayload) {
    const correlationId = payload.correlationId || `corr_${Date.now()}`;
    const cleanContext = payload.context ? (redactSensitiveData(payload.context) as Record<string, unknown>) : undefined;
    const cleanMessage = redactSensitiveData(payload.message) as string;

    const logEntry = {
      timestamp: new Date().toISOString(),
      service: payload.service || this.service,
      level,
      correlationId,
      message: cleanMessage,
      ...(cleanContext ? { context: cleanContext } : {}),
      ...(payload.error instanceof Error
        ? { error: { name: payload.error.name, message: payload.error.message } }
        : {}),
    };

    const json = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(json);
        break;
      case 'warn':
        console.warn(json);
        break;
      case 'info':
      default:
        console.info(json);
        break;
    }

    return logEntry;
  }

  info(message: string, context?: Record<string, unknown>, correlationId?: string) {
    return this.log('info', { message, context, correlationId });
  }

  warn(message: string, context?: Record<string, unknown>, correlationId?: string) {
    return this.log('warn', { message, context, correlationId });
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>, correlationId?: string) {
    return this.log('error', { message, error, context, correlationId });
  }
}

export const logger = new RedactedLogger();
