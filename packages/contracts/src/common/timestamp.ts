/**
 * Crowdbeats V2 — Timestamp Contract (Phase 3)
 *
 * Firestore timestamps are Timestamp objects server-side but ISO 8601 strings
 * when serialized to JSON (e.g., for callable responses).
 * This contract provides a platform-neutral timestamp type.
 */

/** ISO 8601 string timestamp. Used in callable request/response contracts. */
export type IsoTimestamp = string;

/** Unix epoch milliseconds. Used for quick comparisons and TTL calculations. */
export type EpochMs = number;

/** Server sentinel for server-set timestamps (used in Firestore write requests). */
export const SERVER_TIMESTAMP = '__SERVER_TIMESTAMP__' as const;
export type ServerTimestamp = typeof SERVER_TIMESTAMP;

export function nowIso(): IsoTimestamp {
  return new Date().toISOString();
}

export function nowEpochMs(): EpochMs {
  return Date.now();
}

export function isoToEpochMs(iso: IsoTimestamp): EpochMs {
  return new Date(iso).getTime();
}

export function epochMsToIso(ms: EpochMs): IsoTimestamp {
  return new Date(ms).toISOString();
}

/** QR token TTL in seconds. OD per architecture docs. */
export const QR_TOKEN_TTL_SECONDS = 300 as const;
