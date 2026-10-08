/**
 * Crowdbeats V2 — Map Animation & Feedback Contracts (Phase 9)
 *
 * Uber/Lyft-quality perceived smoothness contracts and utilities.
 * Defines marker freshness states, teleportation bounds, and aggregate radar types.
 */

export type MarkerFreshnessState =
  | 'live'
  | 'updated_just_now'
  | 'updated_ago'
  | 'approximate'
  | 'reconnecting'
  | 'ended';

export interface MarkerFreshnessInfo {
  state: MarkerFreshnessState;
  label: string;
  color: string;
  isLive: boolean;
  isApproximate: boolean;
}

export interface ComputeFreshnessParams {
  lastUpdatedMs: number;
  isLive: boolean;
  isStationary: boolean;
  isConnected?: boolean;
  endsAtMs?: number;
  nowMs?: number;
}

export const TELEPORT_THRESHOLDS = {
  maxInterpolationDistanceMeters: 500,
  maxVelocityMps: 45,
  defaultAnimationDurationMs: 800,
  fadeTransitionDurationMs: 300,
} as const;

/**
 * Computes marker freshness state and badge labels from timestamps and session state.
 */
export function computeMarkerFreshness(params: ComputeFreshnessParams): MarkerFreshnessInfo {
  const {
    lastUpdatedMs,
    isLive,
    isStationary,
    isConnected = true,
    endsAtMs,
    nowMs = Date.now(),
  } = params;

  // 1. Ended state
  if (!isLive || (endsAtMs && endsAtMs <= nowMs)) {
    return {
      state: 'ended',
      label: 'Ended',
      color: '#64748B', // slate-500
      isLive: false,
      isApproximate: false,
    };
  }

  // 2. Reconnecting state (network loss or heartbeat overdue > 90s)
  if (!isConnected || (nowMs - lastUpdatedMs > 90_000 && !isStationary)) {
    return {
      state: 'reconnecting',
      label: 'Reconnecting',
      color: '#F59E0B', // amber-500
      isLive: true,
      isApproximate: !isStationary,
    };
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - lastUpdatedMs) / 1000));

  // 3. Mobile Approximate area marker
  if (!isStationary) {
    if (elapsedSeconds < 60) {
      return {
        state: 'approximate',
        label: 'Approximate area (100m)',
        color: '#8B5CF6', // purpleMain
        isLive: true,
        isApproximate: true,
      };
    }
  }

  // 4. Live / Updated states
  if (elapsedSeconds < 60) {
    return {
      state: 'live',
      label: 'Live',
      color: '#00F076', // CbColors.tealGas / green
      isLive: true,
      isApproximate: !isStationary,
    };
  }

  if (elapsedSeconds < 120) {
    return {
      state: 'updated_just_now',
      label: 'Updated just now',
      color: '#10B981', // emerald-500
      isLive: true,
      isApproximate: !isStationary,
    };
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  return {
    state: 'updated_ago',
    label: `Updated ${elapsedMinutes}m ago`,
    color: '#94A3B8', // slate-400
    isLive: true,
    isApproximate: !isStationary,
  };
}

/**
 * Radar aggregate heat zone model meeting k >= 5 anonymity
 */
export interface AggregateHeatZone {
  zoneId: string;
  geohash5: string;
  countBand: '[5-14]' | '[15+]';
  rawCount?: number;
  relativeDirection: string;
  approxDistance: string;
  heatLevel: 'medium' | 'high';
  lastUpdatedMs: number;
}
