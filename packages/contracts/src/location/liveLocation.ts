/**
 * Crowdbeats V2 — Server-Authoritative Live Location Contracts (Phase 2)
 *
 * PRIVACY INVARIANTS (permanent, enforced by type system):
 *
 *  1. PublicLivePresence NEVER contains: lastRawPoint, rawHistory, deviceId,
 *     spoofDetection internals, or any field that could identify the device.
 *  2. PrivateLocationSession is SERVER_ONLY — written and read exclusively by
 *     Admin SDK. The Firestore deny-all rule on private/ subcollections enforces this.
 *  3. PrivateAudienceSignal stores a one-way fanUidHash (SHA-256 + session salt),
 *     not the raw fan UID. Creators NEVER receive this collection.
 *  4. AudienceVisibilityGrant approxGeohash is coarsened on the server before storage.
 *     Raw fan coordinates never appear in any grant document.
 *  5. Transaction/tip references are stored in separate financial collections.
 *     Joining audience grants to tips requires an explicit authorized product use;
 *     this schema provides no FK that enables that join.
 *
 * Collection paths:
 *  sessions/{sessionId}                          — PublicLivePresence (any signed-in user)
 *  sessions/{sessionId}/private/location         — PrivateLocationSession (Admin SDK only)
 *  sessions/{sessionId}/private/locationSamples  — LocationSample subcollection (Admin SDK only)
 *  sessions/{sessionId}/audienceGrants/{grantId} — AudienceVisibilityGrant (creator read, fan write via callable)
 *  audienceZones/{zoneId}                        — CreatorAudienceZone (creator read via callable projection)
 *  locationAuditEvents/{eventId}                 — LocationAuditEvent (Admin SDK only)
 *  consentReceipts/{receiptId}                   — ConsentReceipt (fan-scoped read)
 *
 * Geohash note: Firestore does not support native 2D geospatial queries.
 * We encode geohashes as indexed string fields and use prefix-range queries
 * (.where('geohash', '>=', rangeMin).where('geohash', '<', rangeMax)) plus a
 * bounding-box false-positive filter in trusted code after fetch.
 */

import type { IsoTimestamp } from '../common/timestamp';

// ─── 1. Venue (location-enriched for geospatial queries) ────────────────────

/**
 * Venue document stored in Firestore /venues/{venueId}.
 * lat, lng, and geohash5 are indexed for geospatial proximity queries.
 */
export interface Venue {
  readonly venueId: string;
  readonly name: string;
  readonly address: {
    readonly street?: string;
    readonly city: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country: string; // ISO 3166-1 alpha-2
  };
  /** Canonical WGS84 latitude. Indexed for bounding-box queries. */
  readonly lat: number;
  /** Canonical WGS84 longitude. Indexed for bounding-box queries. */
  readonly lng: number;
  /**
   * Geohash at precision 5 (~4.9 km²). Indexed for geohash-prefix range queries.
   * After fetching all docs matching the prefix range, callers MUST apply a
   * Haversine bounding-box filter to discard false positives from geohash cell
   * overlap at rectangle corners.
   */
  readonly geohash5: string;
  readonly geofenceRadiusMeters: number;
  readonly isActive: boolean;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

// ─── 2. PrivateLocationSession — SERVER_ONLY ─────────────────────────────────

/**
 * Stored in sessions/{sessionId}/private/location.
 * Firestore rule: allow read: if false; allow write: if false.
 * Written exclusively by Admin SDK during startSession.
 * Deleted by Admin SDK (or Cloud Function trigger) when session ends/expires.
 */
export interface PrivateLocationSession {
  readonly sessionId: string;
  readonly performerId: string;
  /** Raw WGS84 latitude from check-in GPS fix or venue record. SERVER_ONLY. */
  readonly lat: number;
  /** Raw WGS84 longitude from check-in GPS fix or venue record. SERVER_ONLY. */
  readonly lng: number;
  /** Geohash at precision 9 (~4.8 m²) for internal distance queries. SERVER_ONLY. */
  readonly geohash9: string;
  /** Geohash at precision 7 (~152 m²) for coarsened mobile projection. SERVER_ONLY. */
  readonly geohash7: string;
  /** Geohash at precision 5 (~4.9 km²) for zone aggregation. SERVER_ONLY. */
  readonly geohash5: string;
  /** True when the device's GPS subsystem reported isMock=true. SERVER_ONLY. */
  readonly isMockRejected: boolean;
  /** GPS accuracy in meters at time of fix. SERVER_ONLY. */
  readonly accuracyMeters: number;
  /** Idempotency key from the startSession callable request. */
  readonly idempotencyKey: string;
  readonly capturedAt: IsoTimestamp;
  readonly deletedAt?: IsoTimestamp; // set when session ends; record deleted shortly after
}

// ─── 3. PublicLivePresence — what any signed-in user can read ────────────────

/**
 * Nominal brand prevents accidentally assigning PrivateLocationSession fields.
 * Use `toPublicLivePresence()` factory (trusted code only) to construct.
 */
declare const _publicBrand: unique symbol;

/**
 * Stored in sessions/{sessionId}. Readable by any signed-in user.
 *
 * MUST NOT contain: raw lat/lng derived from performer device GPS,
 * lastRawPoint, rawHistory, deviceId, isMock, accuracyMeters,
 * spoofDetection internals, or any AudienceSignal data.
 *
 * The lat/lng here are the VENUE's canonical coordinates (from /venues/{venueId})
 * or, for LIVE_MOBILE sessions, a server-coarsened geohash-7 centroid (~152m²).
 * They are NEVER the exact performer device coordinates.
 */
export interface PublicLivePresence {
  readonly [_publicBrand]: true;
  readonly sessionId: string;
  readonly performerId: string;
  readonly performerName: string;
  readonly performerType: 'artist' | 'band';
  /** Status visible to public. Expired/ended sessions filtered in queries. */
  readonly status: LiveSessionStatus;
  /**
   * 'venue' → lat/lng is the venue's canonical pin.
   * 'street' → lat/lng is a geohash-7 centroid (~152 m²) — NOT device GPS.
   * 'mobile' → lat/lng is a server-coarsened geohash-7 centroid, updated on heartbeat.
   */
  readonly locationType: 'venue' | 'street' | 'mobile';
  /** Venue canonical lat — OR geohash-7 centroid for non-venue sessions. NEVER device GPS. */
  readonly lat: number;
  /** Venue canonical lng — OR geohash-7 centroid for non-venue sessions. NEVER device GPS. */
  readonly lng: number;
  /**
   * Geohash at precision 5 (~4.9 km²). Indexed for geospatial prefix-range queries.
   * False positives after geohash bounds query must be filtered by Haversine in trusted code.
   */
  readonly geohash5: string;
  readonly venueId?: string;
  readonly venueName?: string;
  /** Human-readable genre(s). Not used for filtering; use genreTags for that. */
  readonly genre?: string;
  readonly genreTags?: readonly string[];
  /** Server-set. Authoritative for expiry. Never set by client. */
  readonly startedAt: IsoTimestamp;
  /** Server-set. Authoritative TTL. Never set by client. */
  readonly endsAt: IsoTimestamp;
  /** Set by expiry trigger or endSession callable. */
  readonly endedAt?: IsoTimestamp;
  /** Schema version for forward-compatibility. */
  readonly v: number;
}

// ─── 4. LocationSample — SERVER_ONLY ephemeral telemetry ─────────────────────

/**
 * One entry in sessions/{sessionId}/private/locationSamples subcollection.
 * Written by server only during LIVE_MOBILE sessions.
 * Retains at most the last N samples (rolling buffer, TTL = 15 min).
 * Never readable by client or creator.
 *
 * The monotonically increasing seq prevents replay and duplicate injection.
 * Server rejects any sample with seq ≤ max(seq) already stored for this session.
 */
export interface LocationSample {
  readonly sampleId: string;
  readonly sessionId: string;
  /** Monotonically increasing sequence number. Server-assigned. */
  readonly seq: number;
  /** Idempotency key for the telemetry push request. Prevents duplicates. */
  readonly idempotencyKey: string;
  readonly lat: number;
  readonly lng: number;
  readonly geohash9: string;
  readonly accuracyMeters: number;
  readonly capturedAt: IsoTimestamp;
  readonly receivedAt: IsoTimestamp;
  /** TTL field for Firestore native TTL deletion (15-min rolling window). */
  readonly expiresAt: IsoTimestamp;
}

// ─── 5. VerificationResult — proximity check output ──────────────────────────

/**
 * Returned by the proximity validation step inside startSession.
 * Never stored in Firestore directly; embedded in LocationAuditEvent if rejection.
 */
export interface VerificationResult {
  readonly ok: boolean;
  readonly distanceMeters: number;
  readonly allowedRadiusMeters: number;
  readonly venueGeohash5?: string;
  readonly rejectionReason?: 'too_far' | 'mock_rejected' | 'accuracy_too_low' | 'coords_invalid';
}

// ─── 6. SessionLease — heartbeat contract ────────────────────────────────────

/**
 * Request/response shape for the heartbeatSession callable.
 */
export interface HeartbeatRequest {
  readonly sessionId: string;
  /** Client monotonic sequence. Server rejects if seq ≤ lastHeartbeatSeq. */
  readonly seq: number;
  /** Idempotency key prevents duplicate lease extensions from retry storms. */
  readonly idempotencyKey: string;
}

export interface HeartbeatResponse {
  readonly sessionId: string;
  readonly status: LiveSessionStatus;
  readonly endsAt: IsoTimestamp;
  readonly extended: boolean;
  /** Echo of seq for client confirmation. */
  readonly seq: number;
}

/**
 * Stored inside sessions/{sessionId} — tracks last-seen heartbeat state.
 * Fields are merged into the public presence document (no private subcollection needed).
 */
export interface SessionLease {
  readonly lastHeartbeatAt: IsoTimestamp;
  /** Last accepted heartbeat sequence number. Monotonically increasing. */
  readonly lastHeartbeatSeq: number;
  readonly heartbeatCount: number;
}

// ─── 7. LocationAuditEvent — SERVER_ONLY immutable log ───────────────────────

/**
 * Stored in locationAuditEvents/{eventId}. Admin SDK only.
 * Immutable — no client writes. Retained 7 years (legal evidence class).
 * TTL MUST NOT be applied without explicit legal team sign-off.
 */
export interface LocationAuditEvent {
  readonly eventId: string;
  readonly sessionId?: string;
  readonly performerId: string;
  readonly action: LocationAuditAction;
  readonly outcome: 'success' | 'rejected' | 'error';
  readonly rejectionReason?: string;
  /**
   * Coarsened location for audit — geohash-5 only. NEVER exact coordinates.
   * Allows incident reconstruction without storing precise device position.
   */
  readonly coarseGeohash5?: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly createdAt: IsoTimestamp;
  readonly platform: 'ios' | 'android' | 'web' | 'server';
  readonly v: number;
}

export type LocationAuditAction =
  | 'session_started'
  | 'session_ended'
  | 'session_expired'
  | 'session_admin_ended'
  | 'heartbeat_accepted'
  | 'heartbeat_rejected_seq'
  | 'heartbeat_rejected_status'
  | 'proximity_check_failed'
  | 'mock_gps_rejected'
  | 'audience_grant_created'
  | 'audience_grant_revoked'
  | 'audience_grant_expired'
  | 'checkin_attempt_created'
  | 'checkin_sample_verified'
  | 'checkin_sample_rejected'
  | 'mobile_sample_accepted'
  | 'mobile_sample_rejected'
  | 'mobile_location_paused'
  | 'terminal_cleanup_verified';

// ─── 8. PrivateAudienceSignal — SERVER_ONLY raw fan signal ───────────────────

/**
 * Input to the audience aggregation pipeline.
 * Written by the grantAudienceVisibility callable (Admin SDK write).
 * Never readable by creator or fan clients.
 *
 * fanUidHash = SHA-256(fanUid + sessionId + serverSalt) — one-way; non-reversible.
 * Stored geohash is already coarsened to precision 7 BEFORE storage.
 */
export interface PrivateAudienceSignal {
  readonly signalId: string;
  readonly sessionId: string;
  /** One-way hash: SHA-256(fanUid + sessionId + serverSalt). Not the raw UID. */
  readonly fanUidHash: string;
  readonly tier: AudienceConsentTier;
  /** Geohash precision 7 (~152 m²) — coarsened SERVER_SIDE before storage. */
  readonly geohash7: string;
  /**
   * Geohash precision 5 (~4.9 km²) — used for zone aggregation bucketing.
   * Derived from geohash7 on server; never from raw client coordinates.
   */
  readonly geohash5: string;
  readonly grantedAt: IsoTimestamp;
  /** Firestore TTL: set to sessionId.endsAt + 1h. Auto-deleted by Firestore. */
  readonly expiresAt: IsoTimestamp;
}

// ─── 9. CreatorAudienceZone — creator-visible aggregate ──────────────────────

/**
 * Stored in audienceZones/{zoneId}. Read by session's performerId only.
 * Written by the aggregateAudienceZones scheduled function (Admin SDK).
 * Refreshed every 5 minutes. Firestore TTL: 10 minutes.
 *
 * NEVER contains: fan UIDs, fanUidHashes, individual coordinates, grant IDs,
 * raw geohashes at precision > 5, or any field that could re-identify a fan.
 */
export interface CreatorAudienceZone {
  readonly zoneId: string;
  readonly sessionId: string;
  /** Creator's performerId — used in Firestore rule: performerId == auth.uid. */
  readonly performerId: string;
  /** Geohash-5 cell (~4.9 km²). Represents a zone polygon on the Crowd Radar. */
  readonly geohash5: string;
  /**
   * Discretised count band — never the exact fan count.
   * Bands: '[1-4]' | '[5-14]' | '[15+]'
   * Zone is only published when rawCount >= audienceAggregationThreshold (default 5).
   * If rawCount < threshold the zone doc is NOT written (suppression).
   */
  readonly countBand: AudienceCountBand;
  /** Unix epoch ms of most recent aggregation pass that produced this zone. */
  readonly aggregatedAtMs: number;
  /** Firestore TTL: 10-min rolling window. */
  readonly expiresAt: IsoTimestamp;
}

export type AudienceCountBand = '[1-4]' | '[5-14]' | '[15+]';

// ─── 10. AudienceVisibilityGrant — per-fan per-session consent ───────────────

/**
 * Stored in sessions/{sessionId}/audienceGrants/{grantId}.
 * Written by grantAudienceVisibility callable (Admin SDK).
 * Readable by creator (performerId) via Firestore rule.
 * Fan client cannot read; creator cannot see raw coordinates or fan UID.
 *
 * For INDIVIDUAL_SESSION tier: approxGeohash7 is snapped to a 100-m grid
 * by the server before storage. Creator reads a centroid lat/lng derived
 * from approxGeohash7 — never the device coordinates.
 */
export interface AudienceVisibilityGrant {
  readonly grantId: string;
  readonly sessionId: string;
  /** Creator's performerId — used in Firestore rule. */
  readonly performerId: string;
  /** Opaque identifier; creator cannot map this to a fan. */
  readonly grantRef: string; // e.g. truncated hash; not the fan UID
  readonly tier: AudienceConsentTier;
  /**
   * Only present for INDIVIDUAL_SESSION tier.
   * Server-coarsened to geohash precision 7, then snapped to 100-m grid.
   * Creator receives centroid coords derived from this — not raw device position.
   */
  readonly approxGeohash7?: string;
  /** Only present for AGGREGATE tier — links to the zone this grant contributes to. */
  readonly zoneGeohash5?: string;
  readonly grantedAt: IsoTimestamp;
  /** Firestore TTL: sessionId.endsAt + 1h. */
  readonly expiresAt: IsoTimestamp;
  readonly revokedAt?: IsoTimestamp; // set by revokeAudienceVisibility; doc deleted shortly after
}

export type AudienceConsentTier = 'aggregate' | 'individual_session';

// ─── 11. ConsentReceipt — fan-owned record of their consent decision ──────────

/**
 * Stored in users/{fanUid}/consentReceipts/{receiptId}.
 * Readable only by the fan (own UID). Never by creator or server aggregation.
 * Provides auditable trail for GDPR/CCPA requests.
 *
 * NOTE: This collection is NOT joined to audienceGrants for any creator use.
 * The only legitimate join is a Fan's own data export (privacy/requestDataExport).
 */
export interface ConsentReceipt {
  readonly receiptId: string;
  readonly fanUid: string;
  readonly sessionId: string;
  readonly performerId: string; // for UX (fan can see "you shared with [performer name]")
  readonly tier: AudienceConsentTier;
  readonly action: 'granted' | 'revoked';
  readonly grantId: string;
  readonly consentVersion?: string;
  readonly createdAt: IsoTimestamp;
  /** Firestore TTL: 90 days post session end. */
  readonly expiresAt: IsoTimestamp;
  readonly revokedAt?: IsoTimestamp;
}

// ─── 12. AudienceSafetyPolicy — remote-configurable thresholds ───────────────

/**
 * Read from Firebase Remote Config by trusted functions on startup.
 * Client apps may read a redacted subset (intervals, count bands) but
 * MUST NOT receive threshold values that would let a fan engineer isolation attacks.
 *
 * All numeric bounds are enforced server-side. Clients that send values outside
 * bounds receive failed-precondition.
 */
export interface AudienceSafetyPolicy {
  // Aggregation thresholds
  /** Minimum fan count before a zone is published. Default 5, range [3, 20]. */
  readonly aggregationThreshold: number;
  /** Geohash precision for zone cells. Default 5 (~4.9 km²), range [4, 7]. */
  readonly zoneCellGeohashLength: number;
  /** Geohash precision for individual grants. Default 7 (~152 m²), range [6, 8]. */
  readonly individualGeohashLength: number;
  /** Snap grid for individual grants in meters. Default 100, range [50, 500]. */
  readonly individualSnapMeters: number;
  /** Count bands expressed as [lowerInclusive, upperInclusive] pairs. */
  readonly countBandBounds: readonly [number, number][];
  /** Publish delay in seconds (jitter). Default 30, range [0, 120]. */
  readonly publishDelaySeconds: number;
  /** Zone freshness TTL in seconds. Default 300, range [60, 900]. */
  readonly zoneFreshnessSeconds: number;

  // Session and GPS
  /** Heartbeat interval in seconds. Default 90, range [30, 300]. */
  readonly heartbeatIntervalSeconds: number;
  /** Max heartbeat extension per call in hours. Default 2, range [0.5, 6]. */
  readonly heartbeatExtensionHours: number;
  /** Session hard cap in hours. Default 12, range [2, 24]. */
  readonly maxSessionTtlHours: number;
  /** Proximity radius for venue check-in in meters. Default 200, range [50, 500]. */
  readonly venueProximityRadiusMeters: number;
  /** Max accepted GPS accuracy for street check-in. Default 100 m, range [20, 300]. */
  readonly streetModeMaxAccuracyMeters: number;
  /** Pin freshness displayed to fans. Default 10 min. */
  readonly pinFreshnessMaxAgeMinutes: number;
}

// ─── Supporting enums / union types ──────────────────────────────────────────

export type LiveSessionStatus =
  | 'live'
  | 'paused'
  | 'ending'
  | 'ended'
  | 'expired'
  | 'admin_ended'
  | 'error';

// ─── Callable request/response shapes ────────────────────────────────────────

export interface StartSessionRequest {
  readonly performerName: string;
  readonly performerType: 'artist' | 'band_member' | 'venue_manager';
  readonly locationType: 'venue' | 'street';
  readonly venueId?: string;
  readonly lat?: number;
  readonly lng?: number;
  readonly accuracyMeters?: number;
  readonly isMock?: boolean;
  /** Client-generated idempotency key (UUID v4). */
  readonly idempotencyKey: string;
}

export interface StartSessionResponse {
  readonly sessionId: string;
  readonly locationType: 'venue' | 'street';
  /** Public pin coordinates (venue canonical OR geohash-7 centroid). NEVER device GPS. */
  readonly publicLat: number;
  readonly publicLng: number;
  readonly endsAt: IsoTimestamp;
}

export interface EndSessionRequest {
  readonly sessionId: string;
}

export interface EndSessionResponse {
  readonly sessionId: string;
  readonly status: LiveSessionStatus;
}

export interface GrantAudienceVisibilityRequest {
  readonly sessionId: string;
  readonly creatorProfileId?: string;
  readonly consentVersion?: string;
  readonly allowedProfileFields?: readonly ('displayName' | 'avatarUrl')[];
  readonly requestedDurationMinutes?: number;
  readonly tier?: AudienceConsentTier;
  readonly lat?: number;
  readonly lng?: number;
  readonly idempotencyKey?: string;
}

export interface GrantAudienceVisibilityResponse {
  readonly grantId: string;
  readonly tier: AudienceConsentTier;
  readonly expiresAt: IsoTimestamp;
}

export interface RevokeAudienceVisibilityRequest {
  readonly grantId: string;
  readonly sessionId?: string;
}

export interface RevokeAudienceVisibilityResponse {
  readonly grantId: string;
  readonly status: 'revoked';
}

// ─── Phase 6 Trusted Verification & Session Endpoints ───────────────────────

export interface CheckInAttempt {
  readonly checkInAttemptId: string;
  readonly performerId: string;
  readonly role: 'artist' | 'band';
  readonly selectedVenueId: string;
  readonly status: 'acquiring' | 'verified' | 'rejected' | 'consumed' | 'expired';
  readonly idempotencyKey: string;
  readonly createdAt: IsoTimestamp;
  readonly expiresAt: IsoTimestamp;
  readonly verifiedAt?: IsoTimestamp;
  readonly rejectionReason?: string;
  readonly sessionId?: string;
}

export interface StartCheckInRequest {
  readonly profileId: string;
  readonly role: 'artist' | 'band';
  readonly selectedVenueId: string;
  readonly idempotencyKey: string;
}

export interface StartCheckInResponse {
  readonly checkInAttemptId: string;
  readonly venueId: string;
  readonly venueName: string;
  readonly allowedRadiusMeters: number;
  readonly expiresAt: IsoTimestamp;
}

export interface CheckInSamplePayload {
  readonly lat: number;
  readonly lng: number;
  readonly accuracyMeters: number;
  readonly timestamp: IsoTimestamp;
  readonly isMock?: boolean;
}

export interface DeviceAttestationContext {
  readonly appCheckToken?: string;
  readonly platform?: 'ios' | 'android' | 'web';
  readonly deviceIntegrityRisk?: 'none' | 'low' | 'medium' | 'high';
}

export interface SubmitCheckInSampleRequest {
  readonly checkInAttemptId: string;
  readonly sample: CheckInSamplePayload;
  readonly attestationContext?: DeviceAttestationContext;
}

export interface SubmitCheckInSampleResponse {
  readonly checkInAttemptId: string;
  readonly verified: boolean;
  readonly venueName: string;
  readonly verifiedAt: IsoTimestamp;
}

export interface StartStationaryLiveSessionRequest {
  readonly verifiedAttemptId: string;
  readonly requestedDurationMinutes?: number;
  readonly idempotencyKey: string;
}

export interface StartStationaryLiveSessionResponse {
  readonly sessionId: string;
  readonly status: LiveSessionStatus;
  readonly locationType: 'venue';
  readonly publicLat: number;
  readonly publicLng: number;
  readonly venueId: string;
  readonly venueName: string;
  readonly endsAt: IsoTimestamp;
}

export interface StartMobileLiveSessionRequest {
  readonly profileId: string;
  readonly role: 'artist' | 'band';
  readonly consentVersion: string;
  readonly policyVersion: string;
  readonly initialSample: CheckInSamplePayload;
  readonly idempotencyKey: string;
  readonly requestedDurationMinutes?: number;
}

export interface StartMobileLiveSessionResponse {
  readonly sessionId: string;
  readonly status: LiveSessionStatus;
  readonly locationType: 'mobile';
  readonly publicLat: number;
  readonly publicLng: number;
  readonly endsAt: IsoTimestamp;
}

export interface RenewSessionLeaseRequest {
  readonly sessionId: string;
  readonly seq: number;
  readonly idempotencyKey: string;
}

export interface RenewSessionLeaseResponse {
  readonly sessionId: string;
  readonly status: LiveSessionStatus;
  readonly seq: number;
  readonly extended: boolean;
  readonly endsAt: IsoTimestamp;
}

export interface SubmitMobileLocationSampleRequest {
  readonly sessionId: string;
  readonly seq: number;
  readonly sample: CheckInSamplePayload;
  readonly idempotencyKey: string;
}

export interface SubmitMobileLocationSampleResponse {
  readonly sessionId: string;
  readonly seq: number;
  readonly accepted: boolean;
  readonly publicLat: number;
  readonly publicLng: number;
  readonly updatedAt: IsoTimestamp;
}

export interface PauseMobileLocationRequest {
  readonly sessionId: string;
  readonly reason?: string;
}

export interface PauseMobileLocationResponse {
  readonly sessionId: string;
  readonly status: 'paused';
}

export interface EndLiveSessionRequest {
  readonly sessionId: string;
  readonly reason?: string;
}

export interface EndLiveSessionResponse {
  readonly sessionId: string;
  readonly status: 'ended';
  readonly endedAt: IsoTimestamp;
}

export interface AdminForceEndRequest {
  readonly sessionId: string;
  readonly reason: string;
}

export interface AdminForceEndResponse {
  readonly sessionId: string;
  readonly status: 'admin_ended';
  readonly endedAt: IsoTimestamp;
}

export interface OptIntoAggregateAudienceSignalRequest {
  readonly sessionId: string;
  readonly consentVersion: string;
  readonly approximateSample: {
    readonly lat: number;
    readonly lng: number;
    readonly approxMeters?: number;
  };
  readonly idempotencyKey: string;
}

export interface OptIntoAggregateAudienceSignalResponse {
  readonly signalId: string;
  readonly status: 'accepted';
  readonly expiresAt: IsoTimestamp;
}

export interface CreatorAudienceZoneView {
  readonly zoneId: string;
  readonly geohash5: string;
  readonly countBand: AudienceCountBand;
  readonly expiresAt: IsoTimestamp;
}

export interface ConsentedFanProfileView {
  readonly grantRef: string;
  readonly displayName?: string;
  readonly avatarUrl?: string;
  readonly approxLat: number;
  readonly approxLng: number;
  readonly grantedAt: IsoTimestamp;
}

export interface GetCreatorAudienceRadarRequest {
  readonly sessionId: string;
  readonly boundedViewport?: {
    readonly minLat: number;
    readonly maxLat: number;
    readonly minLng: number;
    readonly maxLng: number;
  };
}

export interface GetCreatorAudienceRadarResponse {
  readonly sessionId: string;
  readonly zones: readonly CreatorAudienceZoneView[];
  readonly visibleFans: readonly ConsentedFanProfileView[];
  readonly totalActiveSignalsBucket: AudienceCountBand | 'below_threshold';
}

