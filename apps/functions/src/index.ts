/**
 * Crowdbeats V2 — Cloud Functions Gen 2 (Phase 2 Bootstrap)
 *
 * Project: crowdbeats-v2-dev
 * Runtime: Node.js 20
 * Region: us-central1
 *
 * Architecture invariants (enforced across all future functions):
 * - Server-authoritative: clients CANNOT write ledger, balances, payouts, or audit records
 * - All money in integer minor units (amountCents: number) + ISO 4217 currency code
 * - Every privileged operation validates Firebase Auth ID token and App Check token
 * - Every financial event has an idempotency key
 * - Stripe webhook secret verified via official SDK (Phase 3)
 * - No raw PAN/CVC/Stripe secret key appears in code, logs, or environment vars
 *
 * Phase 2: hello-world callable to verify Functions Gen 2 is reachable from emulator.
 * Phase 3 adds: tip, campaign, band-split, Stripe webhook, auth triggers.
 */

import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase Admin SDK
// In production: uses Application Default Credentials (injected by Cloud Functions runtime)
// In emulator: uses FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST env vars
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Set global defaults for all Gen 2 functions
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  memory: '256MiB',
  // App Check enforcement is added in Phase 5
  // enforceAppCheck: true,
});

// ─── Phase 2 Bootstrap Callable ───────────────────────────────────────────────
// `hello` bootstrap ping was pruned (2026-10-05) to reduce Cloud Run CPU quota
// usage in us-central1. It had no client callers.

// ─── Phase 5 Auth Functions ────────────────────────────────────────────────────

export { onCreateUser }        from './auth/onCreateUser';
export { onCompleteOnboarding } from './auth/onCompleteOnboarding';

// ─── Phase 6 Tip Functions ─────────────────────────────────────────────────────

export { createTipIntent }            from './tip/createTipIntent.js';
export { stripeWebhook }              from './tip/webhookHandler.js';
export { requestRefund }              from './tip/requestRefund.js';
export { verifyQrToken }              from './tip/verifyQrToken.js';
export { resolvePerformerRecipient }  from './tip/resolvePerformerRecipient.js';


// ─── Phase 6 Payment Functions ────────────────────────────────────────────────

export { createSetupIntent }       from './payment/setupPaymentMethod.js';
export { listPaymentMethods }      from './payment/listPaymentMethods.js';
export { setDefaultPaymentMethod } from './payment/setDefaultPaymentMethod.js';
export { deletePaymentMethod }     from './payment/deletePaymentMethod.js';

// ─── Phase 6 Social Functions ─────────────────────────────────────────────────

export { followArtist }   from './follow/followArtist.js';
export { unfollowArtist } from './follow/unfollowArtist.js';

// ─── Phase 6 Privacy Functions ────────────────────────────────────────────────

export { requestPrivacyExport } from './privacy/requestDataExport.js';

// ─── Phase 6b Session Functions ───────────────────────────────────────────────

export { startSession }          from './session/startSession.js';
export { endSession }            from './session/endSession.js';
export { heartbeatSession }      from './session/heartbeatSession.js';
export { expireSessionsTrigger } from './scheduled/expireSessionsTrigger.js';

// ─── Phase 6 Trusted Verification & Session Endpoints ─────────────────────────

export {
  startCheckIn,
  submitCheckInSample,
  startStationaryLiveSession,
} from './session/checkInCallables.js';

export {
  startMobileLiveSession,
  submitMobileLocationSample,
  pauseMobileLocation,
} from './session/mobileLiveCallables.js';

export {
  renewSessionLease,
  endLiveSession,
  adminForceEnd,
} from './session/sessionLeaseCallables.js';

export {
  optIntoAggregateAudienceSignal,
  grantAudienceVisibility,
  revokeAudienceVisibility,
  getCreatorAudienceRadar,
} from './session/audienceRadarCallables.js';

// ─── Phase 10 Session Reconciliation & Terminal Cleanup ───────────────────────

export {
  reconcileSessionState,
  // reportTerminalCleanup — pruned 2026-10-05 (no client callers; quota relief)
} from './session/reconcileSession.js';

// ─── Phase 11 Location Observability & Admin Health ───────────────────────────

export {
  getAdminLiveSessionHealth,
  // evaluateLocationAnomalies, reportLocationEnergyMetrics — pruned 2026-10-05
  // (no client callers; quota relief)
} from './session/locationObservabilityCallables.js';

// ─── Phase 7 QR Functions ─────────────────────────────────────────────────────

export { generateQrToken } from './qr/generateQrToken.js';

// ─── Phase 7 Stripe Connect & Creator Slug & Monetization Functions ─────────

export { createConnectLink } from './connect/createConnectLink.js';
export { getConnectStatus }  from './connect/getConnectStatus.js';
export { resolveCreatorBySlug } from './profiles/resolveCreatorBySlug.js';
export { checkMonetizationEligibility } from './monetization/checkMonetizationEligibility.js';
export { recordConsent } from './compliance/recordConsentCallable.js';
export { reviewFlaggedContent } from './moderation/moderationReview.js';
export { submitReport } from './moderation/submitReportCallable.js';
export { issueCreatorStrike, resolveCreatorStrike, getRepeatOffenderStatus } from './moderation/strikeCallables.js';
export { enforceCreatorLifecycleAction } from './moderation/lifecycleCallables.js';
export { applyCreatorPayoutHold, releaseCreatorPayoutHold, getCreatorPayoutHoldStatus } from './financial/payoutHoldCallables.js';
export { compileEvidenceForDispute, submitEvidenceForDispute, getDisputeDetails } from './financial/disputeCallables.js';
// runComplianceAuditProbes — pruned 2026-10-05 (dev probe, no client callers)

// ─── Phase 7 Campaign Functions ───────────────────────────────────────────────

export { createCampaign }      from './campaign/createCampaign.js';
export { submitCampaign }      from './campaign/submitCampaign.js';
export { publishCampaign }     from './campaign/publishCampaign.js';
export { cancelCampaign }      from './campaign/cancelCampaign.js';
export { updateCampaign }      from './campaign/updateCampaign.js';
export { postCampaignUpdate }  from './campaign/postCampaignUpdate.js';

// ─── Phase 7 Payout Functions ─────────────────────────────────────────────────

export { requestPayout } from './payout/requestPayout.js';

// ─── Phase 8 Band Functions ───────────────────────────────────────────────────

export { createBand }               from './band/createBand.js';
export { inviteBandMember }         from './band/inviteBandMember.js';
export { respondToBandInvitation }  from './band/respondToBandInvitation.js';
export { updateBandMemberRole }     from './band/updateBandMemberRole.js';
export { removeBandMember }         from './band/removeBandMember.js';
export { transferBandOwnership }    from './band/transferBandOwnership.js';
export { setBandSplitConfig }       from './band/setBandSplitConfig.js';
export { getBandTreasury }          from './band/getBandTreasury.js';

// ─── Phase 9 Sponsor Functions ────────────────────────────────────────────────

export { createSponsorOrg }           from './sponsor/createSponsorOrg.js';
export { inviteSponsorMember }        from './sponsor/inviteSponsorMember.js';
export { respondToSponsorInvitation } from './sponsor/respondToSponsorInvitation.js';
export { depositEscrow }              from './sponsor/depositEscrow.js';
export { createMatchPool }            from './sponsor/createMatchPool.js';

// ─── Phase 9 Venue Functions ──────────────────────────────────────────────────

export { createVenue }                from './venue/createVenue.js';
export { inviteVenueStaff }           from './venue/inviteVenueStaff.js';
export { respondToVenueInvitation }   from './venue/respondToVenueInvitation.js';
export { createVenueStage }           from './venue/createVenueStage.js';
export { startVenueSession }          from './venue/startVenueSession.js';
export { endVenueSession }            from './venue/endVenueSession.js';

// ─── Phase 10 Enterprise Admin Functions ──────────────────────────────────────

export { grantStaffRole }      from './admin/grantStaffRole.js';
export { revokeStaffRole }     from './admin/revokeStaffRole.js';
export { suspendAccount }      from './admin/suspendAccount.js';
export { reinstateAccount }    from './admin/reinstateAccount.js';
export { approveStaffRefund }  from './admin/approveStaffRefund.js';
export { adminUpdateUserProfile } from './admin/adminUpdateUserProfile.js';
export { updateSupportTicket, addSupportTicketNote } from './admin/adminSupportWorkflow.js';

// ─── Phase 11 Integration & Notification Functions ────────────────────────────

export { registerDeviceToken }   from './notifications/registerDeviceToken.js';
export { unregisterDeviceToken } from './notifications/unregisterDeviceToken.js';
export { getSignedUploadUrl }    from './storage/getSignedUploadUrl.js';
export { uploadProfileImage }    from './storage/uploadProfileImage.js';

// ─── Phase 12 Monitoring & Operational Functions ──────────────────────────────

// runSyntheticHealthCheck — pruned 2026-10-05 (dev probe, no client callers)
export { bootstrapSuperAdmin }     from './admin/bootstrapSuperAdmin.js';

// ─── Public Discovery & Location Search Functions ──────────────────────────────
export { getPublicDiscoveryFeed } from './discovery/getPublicDiscoveryFeed.js';
export { assertCreatorPubliclyDiscoverable } from './discovery/eligibilityService.js';
export { calculatePopularityScore, calculateTrendingScore } from './discovery/rankingService.js';
export { calculateDistanceMiles, calculateDistanceKm, computeBoundingBox } from './discovery/geoService.js';

// ─── User Settings & Account Lifecycle Functions ──────────────────────────────
export { requestAccountDeletion } from './auth/requestAccountDeletion.js';
export {
  updateNotificationPreferences,
  updatePrivacyPreferences,
  // blockUser, unblockUser — pruned 2026-10-05. Superseded by blockEntity /
  // unblockEntity; mobile writes users/{uid}/blockedUsers directly.
} from './settings/userSettingsCallables.js';

// ─── Compliance & Financial Reconciliation Functions ─────────────────────────
export {
  listComplianceObligations,
  updateComplianceObligation,
} from './admin/complianceCallables.js';
export { runDailyReconciliation } from './financial/reconciliationService.js';

// ─── Integrations, Provider Probes & Secret Storage Callables ────────────────
export {
  listIntegrations,
  saveIntegrationSecret,
  // testIntegrationConnection, validateCustomApiEndpoint — pruned 2026-10-05
  // (no client callers; quota relief)
} from './integrations/integrationCallables.js';

// ─── Platform Fee Engine & Administration Callables ──────────────────────────
export {
  listPlatformFeeRules,
  createFeeRuleDraft,
  approveFeeRule,
  // getFeeCalculationQuote — pruned 2026-10-05 (no client callers)
} from './financial/platformFeeCallables.js';

// ─── Universal Onboarding & Resumable State Machine Callables ────────────────
export {
  checkHandleAvailability,
  saveOnboardingDraft,
  completeUniversalOnboarding,
} from './onboarding/onboardingCallables.js';

// ─── Public Copyright / Rights-Holder Complaints Callable ────────────────────
export { submitCopyrightReport } from './moderation/submitCopyrightReportCallable.js';

export {
  submitModerationAppeal,
  resolveModerationAppeal,
} from './moderation/appealCallables.js';

// ─── Legal Document Lifecycle Callables ───────────────────────────────────────
export {
  createDocumentDraft,
  updateDraftSection,
  approveLegalDocument,
  publishLegalDocument,
} from './compliance/legalDocumentCallables.js';

// ─── Social Graph, Relationships & Follow Callables ──────────────────────────
export {
  followEntity,
  unfollowEntity,
  removeFollower,
  getRelationshipState,
  listFollowers,
  listFollowing,
} from './social/followCallables.js';

// ─── Social Safety, Block & Restriction Callables ────────────────────────────
export {
  blockEntity,
  unblockEntity,
  restrictEntity,
  unrestrictEntity,
  listBlockedEntities,
  listRestrictedEntities,
} from './social/safetyCallables.js';

// ─── Messaging, Direct Chat & Recipient Controls Callables ───────────────────
export {
  sendMessage,
  getConversations,
  getMessages,
  respondToMessageRequest,
  updateMessageSettings,
} from './social/messagingCallables.js';

// ─── Camera-Triggered Nearby Performer Tipping Callables ────────────────────
export {
  getNearbyLivePerformers,
} from './session/nearbyPerformerCallables.js';
