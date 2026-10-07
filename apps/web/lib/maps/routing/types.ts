/**
 * Crowdbeats Map Engine — Routing Types (Phase 11)
 */

import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '../types';

export type RouteMode = 'walking' | 'driving' | 'cycling';

export interface RouteRequestOptions {
  mode?: RouteMode;
  signal?: AbortSignal;
}

export interface ExternalNavigationOptions {
  destination: CrowdbeatsCoordinate;
  destinationName?: string;
  origin?: CrowdbeatsCoordinate;
  mode?: RouteMode;
}
