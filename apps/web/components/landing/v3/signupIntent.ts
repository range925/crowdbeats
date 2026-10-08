/**
 * Signup intent helpers (lead-owned contract, see FOUNDATION.md §4).
 * The intent rides on the URL (?intent=) and in localStorage so it survives
 * register → verify-email → onboarding → persona picker.
 */

export type SignupRole = 'fan' | 'solo' | 'band' | 'sponsor' | 'venue';

export const SIGNUP_INTENT_KEY = 'cb_signup_intent';

/** Persona ids used by /onboarding/persona. */
export const ROLE_TO_PERSONA: Record<SignupRole, string> = {
  fan: 'fan',
  solo: 'artist',
  band: 'band_member',
  sponsor: 'sponsor_rep',
  venue: 'venue_manager',
};

export function signupHref(role: SignupRole): string {
  return `/auth?mode=register&intent=${role}`;
}

export function rememberSignupIntent(role: SignupRole): void {
  try {
    window.localStorage.setItem(SIGNUP_INTENT_KEY, role);
  } catch {
    /* storage unavailable — URL param still carries intent */
  }
}

export function isSignupRole(value: unknown): value is SignupRole {
  return value === 'fan' || value === 'solo' || value === 'band' || value === 'sponsor' || value === 'venue';
}
