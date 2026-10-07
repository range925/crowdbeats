/**
 * Crowdbeats V2 — Universal Onboarding Schemas & State Machine Contracts
 *
 * Enforces single Firebase UID multi-persona onboarding, resumable state machine,
 * zero fake autofill invariants, and progressive disclosure data models.
 */

export type OnboardingStatus =
  | 'notStarted'
  | 'accountCreated'
  | 'identityVerified'
  | 'legalAccepted'
  | 'personaSelected'
  | 'profileInProgress'
  | 'review'
  | 'completed';

export type UniversalPersonaType = 'fan' | 'artist' | 'band' | 'sponsor';

export type OnboardingStepState =
  | 'idle'
  | 'editing'
  | 'validating'
  | 'saving'
  | 'saved'
  | 'recoverableError'
  | 'blockingError';

export interface FanOnboardingProfile {
  readonly favoriteGenres: readonly string[];
  readonly city?: string;
  readonly locationPermissionStatus?: 'not_requested' | 'granted' | 'denied' | 'skipped';
  readonly notificationOptIn?: boolean;
}

export interface MusicianOnboardingProfile {
  readonly stageName: string;
  readonly primaryGenre: string;
  readonly secondaryGenres: readonly string[];
  readonly serviceCity?: string;
  readonly bio?: string;
  readonly websiteUrl?: string;
  readonly instagramHandle?: string;
  readonly spotifyUrl?: string;
  readonly firstGoal?: 'BUILD_PROFILE' | 'RECEIVE_SUPPORT' | 'CAMPAIGN' | 'FIND_VENUES';
}

export interface BandOnboardingProfile {
  readonly bandName: string;
  readonly primaryGenre: string;
  readonly secondaryGenres: readonly string[];
  readonly baseCity?: string;
  readonly userRoleInBand: 'FOUNDER_OWNER' | 'MANAGER' | 'MEMBER' | 'REPRESENTATIVE';
  readonly authorizationAttested: boolean;
  readonly memberInvites: readonly { readonly email: string; readonly role: string }[];
}

export interface SponsorOnboardingProfile {
  readonly organizationName: string;
  readonly sponsorType: 'LOCAL_BUSINESS' | 'CORPORATE_BRAND' | 'VENUE_PARTNER' | 'MUSIC_PROMOTER' | 'OTHER';
  readonly userJobTitle: string;
  readonly authorizationAttested: boolean;
  readonly targetGenres: readonly string[];
  readonly targetGeographies: readonly string[];
  readonly firstObjective?: 'DISCOVER_CAMPAIGNS' | 'SPONSOR_EVENT' | 'SUPPORT_COMMUNITY' | 'BUILD_PROFILE';
}

export interface OnboardingDraft {
  readonly uid: string;
  readonly schemaVersion: string;
  readonly status: OnboardingStatus;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly primaryPersona?: UniversalPersonaType;
  readonly displayName?: string;
  readonly photoUrl?: string;
  readonly handle?: string;
  readonly termsAcceptedVersion?: string;
  readonly privacyAcceptedVersion?: string;
  readonly legalAcceptedAt?: string;
  readonly marketingConsent: boolean;
  readonly marketingConsentAt?: string;
  readonly fanProfile?: FanOnboardingProfile;
  readonly musicianProfile?: MusicianOnboardingProfile;
  readonly bandProfile?: BandOnboardingProfile;
  readonly sponsorProfile?: SponsorOnboardingProfile;
  readonly completedSteps: readonly string[];
  readonly skippedSteps: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CompleteOnboardingRequest {
  readonly primaryPersona: UniversalPersonaType;
  readonly displayName: string;
  readonly photoUrl?: string;
  readonly handle?: string;
  readonly termsAcceptedVersion: string;
  readonly privacyAcceptedVersion: string;
  readonly marketingConsent: boolean;
  readonly profileData: Record<string, unknown>;
}

export interface CompleteOnboardingResponse {
  readonly ok: boolean;
  readonly uid: string;
  readonly primaryPersona: UniversalPersonaType;
  readonly completedAt: string;
  readonly nextRoute: string;
}
