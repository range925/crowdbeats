// Crowdbeats V2 — Location & Session State Machine Tests (ADR-LOC-001)
//
// Validates that:
//   1. All legal performer session state transitions are accepted.
//   2. All illegal transitions are rejected (no wild-card path).
//   3. Fan audience visibility state machine transitions are independently correct.
//   4. No OFF or ENDED state has an outbound transition to a live state without
//      re-entering via the proper trigger chain (re-check-in required).
//
// These tests are pure Dart — no Flutter framework, no Firebase.

import 'package:flutter_test/flutter_test.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// Performer Session State Machine
// ═══════════════════════════════════════════════════════════════════════════════

/// All states in the performer live-session state machine.
enum PerformerSessionState {
  /// No active session. GPS is off. Default.
  OFF,

  /// Fan Near Me one-shot fix in progress or returned; sensor stopped.
  DISCOVERY,

  /// Check-in GPS one-shot is in flight.
  CHECK_IN_ACQUIRING,

  /// GPS fix obtained; server verifying venue proximity and issuing session doc.
  CHECK_IN_VERIFYING,

  /// Session is live at a fixed location. GPS is OFF. Server lease active.
  LIVE_STATIONARY,

  /// Session is live with continuous GPS foreground stream. Explicit opt-in only.
  LIVE_MOBILE_FOREGROUND,

  /// Session is live; app backgrounded while in LIVE_MOBILE. GPS paused or reduced.
  LIVE_MOBILE_BACKGROUND,

  /// Session temporarily suspended (app backgrounded from LIVE_STATIONARY or
  /// transitional lifecycle event). Lease still valid.
  PAUSED,

  /// User or admin initiated end; server callable in flight.
  ENDING,

  /// Session cleanly ended by performer or admin. Terminal.
  ENDED,

  /// Session TTL elapsed with no heartbeat. Terminal.
  EXPIRED,

  /// Transient error; session may be recoverable without re-check-in.
  ERROR_RECOVERABLE,

  /// Unrecoverable error (suspension, duplicate session, ban). Terminal.
  ERROR_TERMINAL,
}

/// Trigger events that drive state transitions.
enum SessionTrigger {
  // User actions
  userRequestsNearMe,
  userSelectsVenue,
  userRequestsStreetMode,
  userCancelsCheckIn,
  userConfirmsMobileLive,    // explicit opt-in to LIVE_MOBILE
  userRevokeMobileLive,      // explicit revoke; drops back to LIVE_STATIONARY
  userEndsSession,

  // Lifecycle
  appGoesToBackground,
  appReturnsToForeground,
  appTerminates,
  userLogsOut,

  // Permission
  permissionRevoked,

  // Network
  networkLost,
  networkRestored,

  // Server events
  gpsFixObtained,            // one-shot fix returned
  gpsFixFailed,              // one-shot timed out
  serverVerificationSuccess,
  serverVerificationFailure,
  serverLeaseFailed,         // heartbeat or session creation failed
  heartbeatSuccess,
  sessionExpired,            // server signals TTL elapsed
  adminForceEnd,             // support tool
  accountSuspended,

  // Geofence / location
  geofenceExitDetected,      // performer moved far from registered location

  // Recovery
  userDismissesError,
  serverRecovers,
}

// ─────────────────────────────────────────────────────────────────────────────
// Transition table
// Key: (fromState, trigger) → toState
// Any pair NOT in this table is ILLEGAL.
// ─────────────────────────────────────────────────────────────────────────────

typedef _Key = (PerformerSessionState, SessionTrigger);

const Map<_Key, PerformerSessionState> _legalTransitions = {
  // OFF → DISCOVERY (Near Me one-shot)
  (PerformerSessionState.OFF, SessionTrigger.userRequestsNearMe): PerformerSessionState.DISCOVERY,
  // OFF → CHECK_IN_ACQUIRING (venue or street check-in start)
  (PerformerSessionState.OFF, SessionTrigger.userSelectsVenue): PerformerSessionState.CHECK_IN_ACQUIRING,
  (PerformerSessionState.OFF, SessionTrigger.userRequestsStreetMode): PerformerSessionState.CHECK_IN_ACQUIRING,
  // OFF terminal exits
  (PerformerSessionState.OFF, SessionTrigger.appTerminates): PerformerSessionState.OFF,
  (PerformerSessionState.OFF, SessionTrigger.userLogsOut): PerformerSessionState.OFF,

  // DISCOVERY → check-in or back to OFF
  (PerformerSessionState.DISCOVERY, SessionTrigger.userSelectsVenue): PerformerSessionState.CHECK_IN_ACQUIRING,
  (PerformerSessionState.DISCOVERY, SessionTrigger.userRequestsStreetMode): PerformerSessionState.CHECK_IN_ACQUIRING,
  (PerformerSessionState.DISCOVERY, SessionTrigger.userCancelsCheckIn): PerformerSessionState.OFF,
  (PerformerSessionState.DISCOVERY, SessionTrigger.permissionRevoked): PerformerSessionState.OFF,
  (PerformerSessionState.DISCOVERY, SessionTrigger.userLogsOut): PerformerSessionState.OFF,
  (PerformerSessionState.DISCOVERY, SessionTrigger.appTerminates): PerformerSessionState.OFF,

  // CHECK_IN_ACQUIRING → fix obtained or failed
  (PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.gpsFixObtained): PerformerSessionState.CHECK_IN_VERIFYING,
  (PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.gpsFixFailed): PerformerSessionState.ERROR_RECOVERABLE,
  (PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.userCancelsCheckIn): PerformerSessionState.OFF,
  (PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.permissionRevoked): PerformerSessionState.ERROR_RECOVERABLE,
  (PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.appTerminates): PerformerSessionState.OFF,
  (PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.userLogsOut): PerformerSessionState.OFF,

  // CHECK_IN_VERIFYING → session live or failed
  (PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.serverVerificationSuccess): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.serverVerificationFailure): PerformerSessionState.ERROR_RECOVERABLE,
  (PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.networkLost): PerformerSessionState.ERROR_RECOVERABLE,
  (PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.userCancelsCheckIn): PerformerSessionState.OFF,
  (PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.appTerminates): PerformerSessionState.OFF,
  (PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.userLogsOut): PerformerSessionState.OFF,
  (PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.accountSuspended): PerformerSessionState.ERROR_TERMINAL,

  // LIVE_STATIONARY — normal live state; GPS is OFF
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.userConfirmsMobileLive): PerformerSessionState.LIVE_MOBILE_FOREGROUND,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.userEndsSession): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.adminForceEnd): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.sessionExpired): PerformerSessionState.EXPIRED,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.accountSuspended): PerformerSessionState.ERROR_TERMINAL,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.appGoesToBackground): PerformerSessionState.PAUSED,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.appTerminates): PerformerSessionState.ENDED,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.userLogsOut): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.networkLost): PerformerSessionState.PAUSED,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.heartbeatSuccess): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.serverLeaseFailed): PerformerSessionState.ERROR_RECOVERABLE,
  (PerformerSessionState.LIVE_STATIONARY, SessionTrigger.geofenceExitDetected): PerformerSessionState.LIVE_MOBILE_FOREGROUND,

  // LIVE_MOBILE_FOREGROUND — explicit GPS streaming
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.userRevokeMobileLive): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.userEndsSession): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.adminForceEnd): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.sessionExpired): PerformerSessionState.EXPIRED,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.accountSuspended): PerformerSessionState.ERROR_TERMINAL,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.appGoesToBackground): PerformerSessionState.LIVE_MOBILE_BACKGROUND,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.appTerminates): PerformerSessionState.ENDED,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.userLogsOut): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.permissionRevoked): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.networkLost): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.heartbeatSuccess): PerformerSessionState.LIVE_MOBILE_FOREGROUND,

  // LIVE_MOBILE_BACKGROUND — GPS paused or at low rate
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.appReturnsToForeground): PerformerSessionState.LIVE_MOBILE_FOREGROUND,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.userEndsSession): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.adminForceEnd): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.sessionExpired): PerformerSessionState.EXPIRED,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.accountSuspended): PerformerSessionState.ERROR_TERMINAL,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.appTerminates): PerformerSessionState.ENDED,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.userLogsOut): PerformerSessionState.ENDING,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.heartbeatSuccess): PerformerSessionState.LIVE_MOBILE_BACKGROUND,
  (PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.serverLeaseFailed): PerformerSessionState.ERROR_RECOVERABLE,

  // PAUSED — session lease active; GPS off; transient lifecycle state
  (PerformerSessionState.PAUSED, SessionTrigger.appReturnsToForeground): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.PAUSED, SessionTrigger.networkRestored): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.PAUSED, SessionTrigger.userEndsSession): PerformerSessionState.ENDING,
  (PerformerSessionState.PAUSED, SessionTrigger.adminForceEnd): PerformerSessionState.ENDING,
  (PerformerSessionState.PAUSED, SessionTrigger.sessionExpired): PerformerSessionState.EXPIRED,
  (PerformerSessionState.PAUSED, SessionTrigger.accountSuspended): PerformerSessionState.ERROR_TERMINAL,
  (PerformerSessionState.PAUSED, SessionTrigger.appTerminates): PerformerSessionState.ENDED,
  (PerformerSessionState.PAUSED, SessionTrigger.userLogsOut): PerformerSessionState.ENDING,
  (PerformerSessionState.PAUSED, SessionTrigger.heartbeatSuccess): PerformerSessionState.PAUSED,

  // ENDING — server call in flight
  (PerformerSessionState.ENDING, SessionTrigger.serverVerificationSuccess): PerformerSessionState.ENDED,
  (PerformerSessionState.ENDING, SessionTrigger.networkLost): PerformerSessionState.ENDED,
  (PerformerSessionState.ENDING, SessionTrigger.appTerminates): PerformerSessionState.ENDED,

  // ERROR_RECOVERABLE → retry or give up
  (PerformerSessionState.ERROR_RECOVERABLE, SessionTrigger.userDismissesError): PerformerSessionState.OFF,
  (PerformerSessionState.ERROR_RECOVERABLE, SessionTrigger.serverRecovers): PerformerSessionState.LIVE_STATIONARY,
  (PerformerSessionState.ERROR_RECOVERABLE, SessionTrigger.userLogsOut): PerformerSessionState.OFF,
  (PerformerSessionState.ERROR_RECOVERABLE, SessionTrigger.appTerminates): PerformerSessionState.OFF,
  (PerformerSessionState.ERROR_RECOVERABLE, SessionTrigger.accountSuspended): PerformerSessionState.ERROR_TERMINAL,

  // Terminal states: ENDED, EXPIRED, ERROR_TERMINAL — no outbound live transitions
  (PerformerSessionState.ENDED, SessionTrigger.userLogsOut): PerformerSessionState.OFF,
  (PerformerSessionState.ENDED, SessionTrigger.appTerminates): PerformerSessionState.OFF,
  (PerformerSessionState.EXPIRED, SessionTrigger.userDismissesError): PerformerSessionState.OFF,
  (PerformerSessionState.EXPIRED, SessionTrigger.userLogsOut): PerformerSessionState.OFF,
  (PerformerSessionState.EXPIRED, SessionTrigger.appTerminates): PerformerSessionState.OFF,
  (PerformerSessionState.ERROR_TERMINAL, SessionTrigger.userLogsOut): PerformerSessionState.OFF,
  (PerformerSessionState.ERROR_TERMINAL, SessionTrigger.appTerminates): PerformerSessionState.OFF,
};

PerformerSessionState? _transition(PerformerSessionState from, SessionTrigger trigger) =>
    _legalTransitions[(from, trigger)];

// ═══════════════════════════════════════════════════════════════════════════════
// Fan Audience Visibility State Machine
// ═══════════════════════════════════════════════════════════════════════════════

enum FanAudienceState {
  HIDDEN,
  CONSENT_PREVIEW,
  AGGREGATE_OPT_IN,
  INDIVIDUAL_SESSION_OPT_IN,
  ACTIVE,
  REVOKING,
  REVOKED,
  EXPIRED,
}

enum AudienceTrigger {
  fanOpensConsentDisclosure,
  fanDismissesDisclosure,
  fanChoosesAggregate,
  fanChoosesIndividual,
  fanConfirmsConsent,
  fanRevokesConsent,
  serverAcknowledgesRevoke,
  sessionEnded,
  sessionExpired,
  accountDeleted,
}

const Map<(FanAudienceState, AudienceTrigger), FanAudienceState> _audienceTransitions = {
  (FanAudienceState.HIDDEN, AudienceTrigger.fanOpensConsentDisclosure): FanAudienceState.CONSENT_PREVIEW,

  (FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.fanDismissesDisclosure): FanAudienceState.HIDDEN,
  (FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.fanChoosesAggregate): FanAudienceState.AGGREGATE_OPT_IN,
  (FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.fanChoosesIndividual): FanAudienceState.INDIVIDUAL_SESSION_OPT_IN,
  (FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.sessionEnded): FanAudienceState.HIDDEN,
  (FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.sessionExpired): FanAudienceState.HIDDEN,
  (FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.accountDeleted): FanAudienceState.REVOKED,

  (FanAudienceState.AGGREGATE_OPT_IN, AudienceTrigger.fanConfirmsConsent): FanAudienceState.ACTIVE,
  (FanAudienceState.AGGREGATE_OPT_IN, AudienceTrigger.fanDismissesDisclosure): FanAudienceState.HIDDEN,
  (FanAudienceState.AGGREGATE_OPT_IN, AudienceTrigger.sessionEnded): FanAudienceState.HIDDEN,
  (FanAudienceState.AGGREGATE_OPT_IN, AudienceTrigger.sessionExpired): FanAudienceState.HIDDEN,
  (FanAudienceState.AGGREGATE_OPT_IN, AudienceTrigger.accountDeleted): FanAudienceState.REVOKED,

  (FanAudienceState.INDIVIDUAL_SESSION_OPT_IN, AudienceTrigger.fanConfirmsConsent): FanAudienceState.ACTIVE,
  (FanAudienceState.INDIVIDUAL_SESSION_OPT_IN, AudienceTrigger.fanDismissesDisclosure): FanAudienceState.HIDDEN,
  (FanAudienceState.INDIVIDUAL_SESSION_OPT_IN, AudienceTrigger.sessionEnded): FanAudienceState.HIDDEN,
  (FanAudienceState.INDIVIDUAL_SESSION_OPT_IN, AudienceTrigger.sessionExpired): FanAudienceState.HIDDEN,
  (FanAudienceState.INDIVIDUAL_SESSION_OPT_IN, AudienceTrigger.accountDeleted): FanAudienceState.REVOKED,

  (FanAudienceState.ACTIVE, AudienceTrigger.fanRevokesConsent): FanAudienceState.REVOKING,
  (FanAudienceState.ACTIVE, AudienceTrigger.sessionEnded): FanAudienceState.EXPIRED,
  (FanAudienceState.ACTIVE, AudienceTrigger.sessionExpired): FanAudienceState.EXPIRED,
  (FanAudienceState.ACTIVE, AudienceTrigger.accountDeleted): FanAudienceState.REVOKED,

  (FanAudienceState.REVOKING, AudienceTrigger.serverAcknowledgesRevoke): FanAudienceState.REVOKED,
  (FanAudienceState.REVOKING, AudienceTrigger.sessionEnded): FanAudienceState.REVOKED,
  (FanAudienceState.REVOKING, AudienceTrigger.accountDeleted): FanAudienceState.REVOKED,
};

FanAudienceState? _audienceTransition(FanAudienceState from, AudienceTrigger trigger) =>
    _audienceTransitions[(from, trigger)];

// ─────────────────────────────────────────────────────────────────────────────

void main() {
  group('PerformerSessionStateMachine — legal transitions', () {
    test('OFF → DISCOVERY on nearMeRequest', () {
      expect(_transition(PerformerSessionState.OFF, SessionTrigger.userRequestsNearMe),
          PerformerSessionState.DISCOVERY);
    });

    test('OFF → CHECK_IN_ACQUIRING on venue select', () {
      expect(_transition(PerformerSessionState.OFF, SessionTrigger.userSelectsVenue),
          PerformerSessionState.CHECK_IN_ACQUIRING);
    });

    test('CHECK_IN_ACQUIRING → CHECK_IN_VERIFYING on gpsFixObtained', () {
      expect(_transition(PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.gpsFixObtained),
          PerformerSessionState.CHECK_IN_VERIFYING);
    });

    test('CHECK_IN_VERIFYING → LIVE_STATIONARY on serverVerificationSuccess', () {
      expect(_transition(PerformerSessionState.CHECK_IN_VERIFYING, SessionTrigger.serverVerificationSuccess),
          PerformerSessionState.LIVE_STATIONARY);
    });

    test('LIVE_STATIONARY → LIVE_MOBILE_FOREGROUND on explicit userConfirmsMobileLive', () {
      expect(_transition(PerformerSessionState.LIVE_STATIONARY, SessionTrigger.userConfirmsMobileLive),
          PerformerSessionState.LIVE_MOBILE_FOREGROUND);
    });

    test('LIVE_MOBILE_FOREGROUND → LIVE_STATIONARY on userRevokeMobileLive', () {
      expect(_transition(PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.userRevokeMobileLive),
          PerformerSessionState.LIVE_STATIONARY);
    });

    test('LIVE_MOBILE_FOREGROUND → LIVE_MOBILE_BACKGROUND on appGoesToBackground', () {
      expect(_transition(PerformerSessionState.LIVE_MOBILE_FOREGROUND, SessionTrigger.appGoesToBackground),
          PerformerSessionState.LIVE_MOBILE_BACKGROUND);
    });

    test('LIVE_MOBILE_BACKGROUND → LIVE_MOBILE_FOREGROUND on appReturnsToForeground', () {
      expect(_transition(PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.appReturnsToForeground),
          PerformerSessionState.LIVE_MOBILE_FOREGROUND);
    });

    test('LIVE_STATIONARY → PAUSED on appGoesToBackground', () {
      expect(_transition(PerformerSessionState.LIVE_STATIONARY, SessionTrigger.appGoesToBackground),
          PerformerSessionState.PAUSED);
    });

    test('PAUSED → LIVE_STATIONARY on appReturnsToForeground', () {
      expect(_transition(PerformerSessionState.PAUSED, SessionTrigger.appReturnsToForeground),
          PerformerSessionState.LIVE_STATIONARY);
    });

    test('LIVE_STATIONARY → ENDING on userEndsSession', () {
      expect(_transition(PerformerSessionState.LIVE_STATIONARY, SessionTrigger.userEndsSession),
          PerformerSessionState.ENDING);
    });

    test('ENDING → ENDED on serverVerificationSuccess (end ACK)', () {
      expect(_transition(PerformerSessionState.ENDING, SessionTrigger.serverVerificationSuccess),
          PerformerSessionState.ENDED);
    });

    test('LIVE_STATIONARY → EXPIRED on sessionExpired', () {
      expect(_transition(PerformerSessionState.LIVE_STATIONARY, SessionTrigger.sessionExpired),
          PerformerSessionState.EXPIRED);
    });

    test('LIVE_STATIONARY → ERROR_TERMINAL on accountSuspended', () {
      expect(_transition(PerformerSessionState.LIVE_STATIONARY, SessionTrigger.accountSuspended),
          PerformerSessionState.ERROR_TERMINAL);
    });

    test('ERROR_RECOVERABLE → LIVE_STATIONARY on serverRecovers', () {
      expect(_transition(PerformerSessionState.ERROR_RECOVERABLE, SessionTrigger.serverRecovers),
          PerformerSessionState.LIVE_STATIONARY);
    });

    test('ERROR_RECOVERABLE → OFF on userDismissesError', () {
      expect(_transition(PerformerSessionState.ERROR_RECOVERABLE, SessionTrigger.userDismissesError),
          PerformerSessionState.OFF);
    });

    test('LIVE_STATIONARY heartbeatSuccess self-loop', () {
      expect(_transition(PerformerSessionState.LIVE_STATIONARY, SessionTrigger.heartbeatSuccess),
          PerformerSessionState.LIVE_STATIONARY);
    });

    test('adminForceEnd from any live state goes to ENDING', () {
      for (final state in [
        PerformerSessionState.LIVE_STATIONARY,
        PerformerSessionState.LIVE_MOBILE_FOREGROUND,
        PerformerSessionState.LIVE_MOBILE_BACKGROUND,
        PerformerSessionState.PAUSED,
      ]) {
        expect(_transition(state, SessionTrigger.adminForceEnd), PerformerSessionState.ENDING,
            reason: '$state should go to ENDING on adminForceEnd');
      }
    });
  });

  group('PerformerSessionStateMachine — ILLEGAL transitions return null', () {
    test('OFF → LIVE_STATIONARY is illegal (cannot skip check-in)', () {
      expect(_transition(PerformerSessionState.OFF, SessionTrigger.serverVerificationSuccess), isNull);
    });

    test('LIVE_STATIONARY → LIVE_MOBILE_BACKGROUND is illegal directly', () {
      expect(_transition(PerformerSessionState.LIVE_STATIONARY, SessionTrigger.appReturnsToForeground), isNull);
    });

    test('LIVE_MOBILE_BACKGROUND → LIVE_STATIONARY directly is illegal', () {
      expect(_transition(PerformerSessionState.LIVE_MOBILE_BACKGROUND, SessionTrigger.userRevokeMobileLive), isNull);
    });

    test('ENDED → LIVE_STATIONARY is illegal', () {
      expect(_transition(PerformerSessionState.ENDED, SessionTrigger.serverVerificationSuccess), isNull);
    });

    test('EXPIRED → LIVE_STATIONARY is illegal', () {
      expect(_transition(PerformerSessionState.EXPIRED, SessionTrigger.serverRecovers), isNull);
    });

    test('ERROR_TERMINAL → LIVE_STATIONARY is illegal', () {
      expect(_transition(PerformerSessionState.ERROR_TERMINAL, SessionTrigger.serverRecovers), isNull);
    });

    test('OFF → LIVE_MOBILE_FOREGROUND is illegal', () {
      expect(_transition(PerformerSessionState.OFF, SessionTrigger.userConfirmsMobileLive), isNull);
    });

    test('CHECK_IN_ACQUIRING → LIVE_STATIONARY is illegal', () {
      expect(_transition(PerformerSessionState.CHECK_IN_ACQUIRING, SessionTrigger.serverVerificationSuccess), isNull);
    });

    test('DISCOVERY → LIVE_STATIONARY is illegal', () {
      expect(_transition(PerformerSessionState.DISCOVERY, SessionTrigger.serverVerificationSuccess), isNull);
    });

    test('PAUSED → LIVE_MOBILE_FOREGROUND is illegal', () {
      expect(_transition(PerformerSessionState.PAUSED, SessionTrigger.userConfirmsMobileLive), isNull);
    });
  });

  group('PerformerSessionStateMachine — terminal-state invariants', () {
    const terminalStates = [
      PerformerSessionState.ENDED,
      PerformerSessionState.EXPIRED,
      PerformerSessionState.ERROR_TERMINAL,
    ];
    const liveStates = [
      PerformerSessionState.LIVE_STATIONARY,
      PerformerSessionState.LIVE_MOBILE_FOREGROUND,
      PerformerSessionState.LIVE_MOBILE_BACKGROUND,
    ];

    for (final terminal in terminalStates) {
      for (final live in liveStates) {
        test('$terminal → $live is always illegal', () {
          for (final trigger in SessionTrigger.values) {
            final result = _transition(terminal, trigger);
            expect(result != live, isTrue,
                reason: '$terminal --[$trigger]--> $live must not exist');
          }
        });
      }
    }
  });

  group('PerformerSessionStateMachine — every active state has an exit', () {
    const activeStates = [
      PerformerSessionState.LIVE_STATIONARY,
      PerformerSessionState.LIVE_MOBILE_FOREGROUND,
      PerformerSessionState.LIVE_MOBILE_BACKGROUND,
      PerformerSessionState.PAUSED,
      PerformerSessionState.CHECK_IN_ACQUIRING,
      PerformerSessionState.CHECK_IN_VERIFYING,
    ];

    for (final state in activeStates) {
      test('$state has at least one outbound transition', () {
        final exits = SessionTrigger.values
            .map((t) => _transition(state, t))
            .where((s) => s != null)
            .toList();
        expect(exits.isNotEmpty, isTrue,
            reason: '$state must have at least one exit transition');
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FAN AUDIENCE VISIBILITY STATE MACHINE
  // ═══════════════════════════════════════════════════════════════════════════

  group('FanAudienceStateMachine — legal transitions', () {
    test('HIDDEN → CONSENT_PREVIEW on fanOpensConsentDisclosure', () {
      expect(_audienceTransition(FanAudienceState.HIDDEN, AudienceTrigger.fanOpensConsentDisclosure),
          FanAudienceState.CONSENT_PREVIEW);
    });

    test('CONSENT_PREVIEW → AGGREGATE_OPT_IN on fanChoosesAggregate', () {
      expect(_audienceTransition(FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.fanChoosesAggregate),
          FanAudienceState.AGGREGATE_OPT_IN);
    });

    test('CONSENT_PREVIEW → INDIVIDUAL_SESSION_OPT_IN on fanChoosesIndividual', () {
      expect(_audienceTransition(FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.fanChoosesIndividual),
          FanAudienceState.INDIVIDUAL_SESSION_OPT_IN);
    });

    test('AGGREGATE_OPT_IN → ACTIVE on fanConfirmsConsent', () {
      expect(_audienceTransition(FanAudienceState.AGGREGATE_OPT_IN, AudienceTrigger.fanConfirmsConsent),
          FanAudienceState.ACTIVE);
    });

    test('INDIVIDUAL_SESSION_OPT_IN → ACTIVE on fanConfirmsConsent', () {
      expect(_audienceTransition(FanAudienceState.INDIVIDUAL_SESSION_OPT_IN, AudienceTrigger.fanConfirmsConsent),
          FanAudienceState.ACTIVE);
    });

    test('ACTIVE → REVOKING on fanRevokesConsent', () {
      expect(_audienceTransition(FanAudienceState.ACTIVE, AudienceTrigger.fanRevokesConsent),
          FanAudienceState.REVOKING);
    });

    test('REVOKING → REVOKED on serverAcknowledgesRevoke', () {
      expect(_audienceTransition(FanAudienceState.REVOKING, AudienceTrigger.serverAcknowledgesRevoke),
          FanAudienceState.REVOKED);
    });

    test('ACTIVE → EXPIRED on sessionEnded', () {
      expect(_audienceTransition(FanAudienceState.ACTIVE, AudienceTrigger.sessionEnded),
          FanAudienceState.EXPIRED);
    });

    test('CONSENT_PREVIEW → HIDDEN on fanDismissesDisclosure', () {
      expect(_audienceTransition(FanAudienceState.CONSENT_PREVIEW, AudienceTrigger.fanDismissesDisclosure),
          FanAudienceState.HIDDEN);
    });
  });

  group('FanAudienceStateMachine — ILLEGAL transitions', () {
    test('HIDDEN → ACTIVE is illegal (must pass through consent flow)', () {
      expect(_audienceTransition(FanAudienceState.HIDDEN, AudienceTrigger.fanConfirmsConsent), isNull);
    });

    test('Near Me and tip actions are not in AudienceTrigger enum', () {
      final triggers = AudienceTrigger.values.map((t) => t.name).toList();
      expect(triggers.any((t) => t.contains('nearMe')), isFalse);
      expect(triggers.any((t) => t.toLowerCase().contains('tip')), isFalse);
    });

    test('REVOKED → ACTIVE is illegal', () {
      expect(_audienceTransition(FanAudienceState.REVOKED, AudienceTrigger.fanConfirmsConsent), isNull);
    });

    test('EXPIRED → ACTIVE is illegal', () {
      expect(_audienceTransition(FanAudienceState.EXPIRED, AudienceTrigger.fanConfirmsConsent), isNull);
    });

    test('ACTIVE → AGGREGATE_OPT_IN is illegal (cannot change tier without re-consent)', () {
      expect(_audienceTransition(FanAudienceState.ACTIVE, AudienceTrigger.fanChoosesAggregate), isNull);
    });

    test('HIDDEN → REVOKING is illegal', () {
      expect(_audienceTransition(FanAudienceState.HIDDEN, AudienceTrigger.fanRevokesConsent), isNull);
    });
  });

  group('FanAudienceStateMachine — session-end collapses all states to safe default', () {
    const statesWithSessionEndExit = [
      FanAudienceState.CONSENT_PREVIEW,
      FanAudienceState.AGGREGATE_OPT_IN,
      FanAudienceState.INDIVIDUAL_SESSION_OPT_IN,
      FanAudienceState.ACTIVE,
      FanAudienceState.REVOKING,
    ];

    for (final s in statesWithSessionEndExit) {
      test('$s becomes safe on sessionEnded (never stays ACTIVE)', () {
        final result = _audienceTransition(s, AudienceTrigger.sessionEnded);
        expect(result != FanAudienceState.ACTIVE, isTrue,
            reason: '$s must not stay ACTIVE after session end');
        expect(result != null, isTrue,
            reason: '$s must have defined behaviour on sessionEnded');
      });
    }
  });
}
