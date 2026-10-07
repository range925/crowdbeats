/**
 * Crowdbeats V2 — Creator Lifecycle Enforcement Contracts (Phase 8)
 *
 * Defines actions and response shapes for demonetization, suspension,
 * termination, and reinstatement of platform creators.
 */

export const CreatorLifecycleAction = {
  DEMONETIZE: 'DEMONETIZE',
  SUSPEND: 'SUSPEND',
  TERMINATE: 'TERMINATE',
  REINSTATE: 'REINSTATE',
} as const;

export type CreatorLifecycleAction =
  (typeof CreatorLifecycleAction)[keyof typeof CreatorLifecycleAction];

export interface EnforceCreatorLifecycleRequest {
  readonly creatorId: string;
  readonly creatorType?: 'artist' | 'band';
  readonly action: CreatorLifecycleAction;
  readonly reason: string;
  readonly durationDays?: number;
}

export interface EnforceCreatorLifecycleResponse {
  readonly success: boolean;
  readonly creatorId: string;
  readonly creatorType: 'artist' | 'band';
  readonly action: CreatorLifecycleAction;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly complianceHold: boolean;
  readonly slugStatus: string;
  readonly revokedSessionsCount: number;
  readonly timestamp: string;
}
