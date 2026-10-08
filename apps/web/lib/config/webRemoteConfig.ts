/**
 * Crowdbeats V2 — Web Location Remote Config Service (Phase 11)
 *
 * Provides validated runtime bounds and emergency kill switches for
 * browser-side live location features.
 */

import {
  DEFAULT_LOCATION_REMOTE_CONFIG,
  type LocationRemoteConfigPolicy,
  validateRemoteConfigPolicy,
} from '@crowdbeats/contracts';

export class WebRemoteConfigService {
  private currentPolicy: LocationRemoteConfigPolicy = DEFAULT_LOCATION_REMOTE_CONFIG;
  private listeners: Set<(policy: LocationRemoteConfigPolicy) => void> = new Set();

  constructor(initialPolicy?: Partial<LocationRemoteConfigPolicy>) {
    if (initialPolicy) {
      this.currentPolicy = validateRemoteConfigPolicy(initialPolicy);
    }
  }

  get policy(): LocationRemoteConfigPolicy {
    return this.currentPolicy;
  }

  get isMobileTrackingAllowed(): boolean {
    return this.currentPolicy.mobileTrackingEnabled;
  }

  get isPublicPresenceAllowed(): boolean {
    return this.currentPolicy.publicPresenceEnabled;
  }

  get isCrowdRadarAllowed(): boolean {
    return this.currentPolicy.aggregateCrowdRadarEnabled;
  }

  get isAudienceVisibilityAllowed(): boolean {
    return this.currentPolicy.individualAudienceVisibilityEnabled;
  }

  updatePolicy(incoming?: Partial<LocationRemoteConfigPolicy> | null): void {
    this.currentPolicy = validateRemoteConfigPolicy({
      ...this.currentPolicy,
      ...incoming,
    });
    this.notifyListeners();
  }

  setKillSwitch(switches: {
    mobileTracking?: boolean;
    publicPresence?: boolean;
    crowdRadar?: boolean;
    audienceVisibility?: boolean;
  }): void {
    this.updatePolicy({
      ...(switches.mobileTracking !== undefined && {
        mobileTrackingEnabled: switches.mobileTracking,
      }),
      ...(switches.publicPresence !== undefined && {
        publicPresenceEnabled: switches.publicPresence,
      }),
      ...(switches.crowdRadar !== undefined && {
        aggregateCrowdRadarEnabled: switches.crowdRadar,
      }),
      ...(switches.audienceVisibility !== undefined && {
        individualAudienceVisibilityEnabled: switches.audienceVisibility,
      }),
    });
  }

  subscribe(listener: (policy: LocationRemoteConfigPolicy) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentPolicy);
      } catch (e) {
        console.error('[WebRemoteConfigService] Error notifying listener:', e);
      }
    }
  }

  reset(): void {
    this.currentPolicy = DEFAULT_LOCATION_REMOTE_CONFIG;
    this.notifyListeners();
  }
}

export const webRemoteConfig = new WebRemoteConfigService();
