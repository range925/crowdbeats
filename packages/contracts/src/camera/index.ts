/**
 * Crowdbeats V2 — Camera-Triggered Nearby Performer Tipping Contracts
 *
 * ARCHITECTURAL & PRIVACY INVARIANTS:
 * 1. ZERO BIOMETRIC DATA (OD-12 COMPLIANCE):
 *    Camera-triggered performer detection operates strictly via geospatial proximity
 *    and optical QR resolution. NO facial recognition, computer vision biometrics,
 *    or raw video streams are transmitted to or processed by backend servers.
 *
 * 2. FAN LOCATION EPHEMERALITY:
 *    The fan's GPS coordinates (`lat`, `lng`, `accuracyMeters`) in `NearbyLivePerformerQuery`
 *    are strictly ephemeral. They are evaluated in-memory for proximity calculations and
 *    are NEVER persisted to Firestore, logs, or analytics databases.
 *
 * 3. PERFORMER COARSENING & SAFETY:
 *    Performer locations returned originate from active sessions (`PublicLivePresence`).
 *    Street and mobile performances use server-coarsened geohash centroids (~152m²),
 *    never raw performer device telemetry.
 *
 * 4. DISAMBIGUATION & CHOOSER SAFETY:
 *    When multiple performers are detected within proximity (`candidates.length > 1`)
 *    or when GPS accuracy is degraded (`accuracyMeters > 50`), `requiresChooser: true`
 *    is enforced to prevent misdirected tips.
 *
 * 5. SAFE PUBLIC PROFILE DISCLOSURE:
 *    Performer candidates contain only public-safe presentation attributes.
 *    No PII (phone, email, residential address, Stripe account details) is exposed.
 */

export type PerformerType = 'artist' | 'band';

export type CandidateMatchConfidence = 'exact_qr' | 'high' | 'medium' | 'low';

export type DisambiguationReason =
  | 'none'
  | 'multiple_performers'
  | 'poor_gps_accuracy'
  | 'no_performers_in_range';

export interface NearbyLivePerformerQuery {
  /** Latitude in decimal degrees (WGS84, [-90, 90]) */
  lat: number;
  /** Longitude in decimal degrees (WGS84, [-180, 180]) */
  lng: number;
  /** Horizontal GPS accuracy radius in meters (>= 0) */
  accuracyMeters: number;
  /** Client timestamp of fix (ISO 8601) */
  timestamp: string;
  /** Ephemeral client session/trace identifier */
  clientSessionId?: string;
  /** Optional custom search radius in meters (defaults to 150m, server-capped at 500m) */
  radiusMeters?: number;
  /** Optional scanned QR code payload if detected in camera view for 100% deterministic lock */
  qrPayload?: string;
}

export interface NearbyLivePerformerCandidate {
  /** Performer or band identifier */
  performerId: string;
  /** Performer category */
  performerType: PerformerType;
  /** Display/stage name */
  performerName: string;
  /** Verified public avatar URL */
  performerAvatarUrl?: string;
  /** Active live session identifier */
  activeSessionId: string;
  /** Venue-anchored stage or street/mobile busking */
  locationType: 'venue' | 'street';
  /** Associated venue name if at a registered venue */
  venueName?: string;
  /** Associated venue identifier if applicable */
  venueId?: string;
  /** Calculated straight-line distance in meters from fan to performer */
  distanceMeters: number;
  /** Music genre tags */
  genres: string[];
  /** Short bio excerpt (safe public text) */
  bio?: string;
  /** Suggested default tip amount in integer cents (e.g. 500 = $5.00) */
  defaultTipAmountCents: number;
  /** Quick-tip preset options in cents (e.g. [300, 500, 1000, 2000]) */
  tipOptionsCents?: number[];
  /** Recommended emoji reaction chips (e.g. ['🔥', '❤️', '⚡', '👏', '🙌']) */
  suggestedEmojis?: string[];
  /** Match confidence level for AR reticle visualization */
  matchConfidence?: CandidateMatchConfidence;
}

export interface GetNearbyLivePerformersRequest {
  query: NearbyLivePerformerQuery;
}

export interface GetNearbyLivePerformersResponse {
  /** List of eligible live performers within search radius, sorted by distance */
  candidates: NearbyLivePerformerCandidate[];
  /**
   * True if user disambiguation is required before tipping:
   * - candidates.length > 1
   * - query.accuracyMeters > 50
   * - no candidate meets high-confidence threshold
   */
  requiresChooser: boolean;
  /** The single locked candidate when requiresChooser is false and exactly 1 candidate matches */
  selectedCandidate?: NearbyLivePerformerCandidate;
  /** Reason why chooser was triggered (or 'none' if unambiguous lock) */
  disambiguationReason?: DisambiguationReason;
  /** Server timestamp of query evaluation (ISO 8601) */
  queriedAt: string;
  /** Effective search radius used in meters */
  radiusMeters: number;
}
