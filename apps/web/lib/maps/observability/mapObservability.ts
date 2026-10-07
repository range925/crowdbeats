/**
 * Crowdbeats Map Engine — Observability, Anomaly Detection & Telemetry (Phase 12)
 *
 * Provides structured telemetry for the Crowdbeats Map ecosystem:
 * - Map initialization failures (WebGL context loss, DOM container issues)
 * - Vector tile load failures (HTTP 4xx/5xx, network timeouts)
 * - Geocoding and autocomplete errors (rate limits, upstream outages)
 * - Routing engine failures (unreachable engines, fallback invocations)
 * - Malformed coordinates (NaN, out-of-range lat/lng)
 * - Firebase real-time subscription errors
 * - Abnormal request/failure spikes (sliding-window anomaly detection)
 *
 * PRIVACY INVARIANT:
 * Precise user coordinates are NEVER included in error logs or telemetry payloads.
 * All coordinates are scrubbed or coarsened to neighborhood level (2 decimal places ~ 1.1km)
 * to comply with Crowdbeats privacy principles and GDPR/CCPA requirements.
 */

export type MapTelemetryEventType =
  | 'map_init_error'
  | 'tile_load_error'
  | 'geocoder_error'
  | 'routing_error'
  | 'malformed_coords'
  | 'firebase_live_error'
  | 'request_spike';

export interface MapTelemetryEvent {
  id: string;
  type: MapTelemetryEventType;
  timestamp: string; // ISO string
  provider?: string;
  message: string;
  details?: Record<string, unknown>;
  coarseLocation?: { lat: number; lng: number }; // Max 2 decimal precision, never precise
}

export interface MapMetricsSnapshot {
  totalEvents: number;
  countsByType: Record<MapTelemetryEventType, number>;
  recentEvents: MapTelemetryEvent[];
  errorRateLastMinute: number;
  hasActiveAnomaly: boolean;
}

export type TelemetryListener = (event: MapTelemetryEvent) => void;

class CrowdbeatsMapObservability {
  private static instance: CrowdbeatsMapObservability;
  private readonly maxBufferSize = 50;
  private eventBuffer: MapTelemetryEvent[] = [];
  private listeners: Set<TelemetryListener> = new Set();
  private counts: Record<MapTelemetryEventType, number> = {
    map_init_error: 0,
    tile_load_error: 0,
    geocoder_error: 0,
    routing_error: 0,
    malformed_coords: 0,
    firebase_live_error: 0,
    request_spike: 0,
  };

  // Sliding window for anomaly / spike detection (timestamps in ms)
  private errorTimestamps: number[] = [];
  private readonly anomalyThreshold = 8; // >8 errors in 60s triggers anomaly spike
  private readonly anomalyWindowMs = 60 * 1000;

  private constructor() {}

  public static getInstance(): CrowdbeatsMapObservability {
    if (!CrowdbeatsMapObservability.instance) {
      CrowdbeatsMapObservability.instance = new CrowdbeatsMapObservability();
    }
    return CrowdbeatsMapObservability.instance;
  }

  /**
   * Coarsens coordinates to 2 decimal places (~1.1 km) for privacy-safe telemetry.
   * Strips all sub-kilometer precision.
   */
  public sanitizeCoordinates(lat?: number, lng?: number): { lat: number; lng: number } | undefined {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return undefined;
    }
    return {
      lat: Math.round(lat * 100) / 100,
      lng: Math.round(lng * 100) / 100,
    };
  }

  /**
   * Records a map telemetry event, checks for error rate spikes,
   * and notifies registered listeners.
   */
  public recordEvent(
    type: MapTelemetryEventType,
    message: string,
    options?: {
      provider?: string;
      details?: Record<string, unknown>;
      rawCoordinates?: { lat?: number; lng?: number };
    }
  ): MapTelemetryEvent {
    const now = Date.now();
    const isoTime = new Date(now).toISOString();

    // Sanitize any coordinate data
    const coarseLocation = options?.rawCoordinates
      ? this.sanitizeCoordinates(options.rawCoordinates.lat, options.rawCoordinates.lng)
      : undefined;

    // Filter out any potential sensitive keys from details
    const sanitizedDetails: Record<string, unknown> = {};
    if (options?.details) {
      for (const [key, value] of Object.entries(options.details)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('key') || lowerKey.includes('secret')) {
          sanitizedDetails[key] = '[REDACTED]';
        } else if (lowerKey.includes('coordinate') || key === 'lat' || key === 'lng') {
          sanitizedDetails[key] = '[COARSE_FILTERED]';
        } else {
          sanitizedDetails[key] = value;
        }
      }
    }

    const event: MapTelemetryEvent = {
      id: 'evt_' + now + '_' + Math.random().toString(36).slice(2, 7),
      type,
      timestamp: isoTime,
      provider: options?.provider,
      message,
      details: Object.keys(sanitizedDetails).length > 0 ? sanitizedDetails : undefined,
      coarseLocation,
    };

    // Increment counter
    this.counts[type] = (this.counts[type] || 0) + 1;

    // Push into ring buffer
    this.eventBuffer.unshift(event);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.pop();
    }

    // Sliding window check
    this.errorTimestamps.push(now);
    this.pruneErrorTimestamps(now);

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Prevent telemetry listener failures from propagating
      }
    });

    // Anomaly spike check (avoid recursive loop if already recording request_spike)
    if (type !== 'request_spike' && this.errorTimestamps.length >= this.anomalyThreshold) {
      this.recordEvent(
        'request_spike',
        'Abnormal map error spike detected: ' + this.errorTimestamps.length + ' failures in the last 60 seconds.',
        {
          provider: options?.provider,
          details: { errorCount: this.errorTimestamps.length, windowSeconds: 60 },
        }
      );
    }

    // In development, log non-sensitive warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CrowdbeatsMapTelemetry] [' + type.toUpperCase() + ']', message, event.details || '');
    }

    return event;
  }

  /**
   * Subscribe to live map telemetry events.
   * Returns an unsubscribe function.
   */
  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns a snapshot of current telemetry metrics and event history.
   */
  public getSnapshot(): MapMetricsSnapshot {
    const now = Date.now();
    this.pruneErrorTimestamps(now);

    const totalEvents = Object.values(this.counts).reduce((acc, c) => acc + c, 0);

    return {
      totalEvents,
      countsByType: { ...this.counts },
      recentEvents: [...this.eventBuffer],
      errorRateLastMinute: this.errorTimestamps.length,
      hasActiveAnomaly: this.errorTimestamps.length >= this.anomalyThreshold,
    };
  }

  /**
   * Resets telemetry metrics (useful for testing or session clears).
   */
  public reset(): void {
    this.eventBuffer = [];
    this.errorTimestamps = [];
    for (const key of Object.keys(this.counts) as MapTelemetryEventType[]) {
      this.counts[key] = 0;
    }
  }

  private pruneErrorTimestamps(now: number): void {
    const cutoff = now - this.anomalyWindowMs;
    this.errorTimestamps = this.errorTimestamps.filter((t) => t >= cutoff);
  }
}

export const mapObservability = CrowdbeatsMapObservability.getInstance();
