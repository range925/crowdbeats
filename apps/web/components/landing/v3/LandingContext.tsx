'use client';

/**
 * Landing v3 shared context (lead-owned).
 * Lets any section open the header's role chooser without prop drilling.
 */
import React, { createContext, useContext } from 'react';

export type RoleChooserFilter = 'all' | 'musician' | 'fan';

export interface LandingContextValue {
  /** Opens the Join Crowdbeats role chooser. `musician` shows Solo/Band, `fan` shows Fan only. */
  openRoleChooser: (filter?: RoleChooserFilter, returnFocusTo?: HTMLElement | null) => void;
}

export const LandingContext = createContext<LandingContextValue>({
  openRoleChooser: () => {},
});

export function useLanding(): LandingContextValue {
  return useContext(LandingContext);
}
