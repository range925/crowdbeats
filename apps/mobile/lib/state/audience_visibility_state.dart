// Crowdbeats V2 — Fan Audience Visibility State & Notifier (Phase 3)
//
// Manages the fan's "Let this performer know I'm nearby" lifecycle:
// - Two distinct tiers: Aggregate Crowd Radar vs. Individual Approximate Visibility.
// - Neither option is preselected; neither is activated by Near Me, tipping, or following.
// - Master stealth switch ("Hide me from performers").
// - Blocked profile enforcement.
// - Immediate revocation confirmation ("Stop sharing").
// - History of consent receipts for GDPR/CCPA auditing.

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/live_location.dart';
import '../data/services/location_analytics_service.dart';
import 'user_settings_state.dart';

@immutable
class ActiveAudienceGrant {
  const ActiveAudienceGrant({
    required this.grantId,
    required this.sessionId,
    required this.performerId,
    required this.performerName,
    required this.tier,
    required this.grantedAt,
    required this.expiresAt,
  });

  final String grantId;
  final String sessionId;
  final String performerId;
  final String performerName;
  final AudienceConsentTier tier;
  final DateTime grantedAt;
  final DateTime expiresAt;

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isActive => !isExpired;

  ActiveAudienceGrant copyWith({
    String? grantId,
    String? sessionId,
    String? performerId,
    String? performerName,
    AudienceConsentTier? tier,
    DateTime? grantedAt,
    DateTime? expiresAt,
  }) =>
      ActiveAudienceGrant(
        grantId: grantId ?? this.grantId,
        sessionId: sessionId ?? this.sessionId,
        performerId: performerId ?? this.performerId,
        performerName: performerName ?? this.performerName,
        tier: tier ?? this.tier,
        grantedAt: grantedAt ?? this.grantedAt,
        expiresAt: expiresAt ?? this.expiresAt,
      );
}

@immutable
class AudienceVisibilityState {
  const AudienceVisibilityState({
    this.activeGrant,
    this.hideMeFromPerformers = false,
    this.consentHistory = const [],
    this.isRevoking = false,
    this.lastRevocationMessage,
  });

  final ActiveAudienceGrant? activeGrant;
  final bool hideMeFromPerformers;
  final List<ConsentReceipt> consentHistory;
  final bool isRevoking;
  final String? lastRevocationMessage;

  bool get hasActiveVisibility =>
      !hideMeFromPerformers && activeGrant != null && activeGrant!.isActive;

  AudienceVisibilityState copyWith({
    Object? activeGrant = _sentinel,
    bool? hideMeFromPerformers,
    List<ConsentReceipt>? consentHistory,
    bool? isRevoking,
    String? lastRevocationMessage,
  }) {
    return AudienceVisibilityState(
      activeGrant: activeGrant == _sentinel
          ? this.activeGrant
          : activeGrant as ActiveAudienceGrant?,
      hideMeFromPerformers: hideMeFromPerformers ?? this.hideMeFromPerformers,
      consentHistory: consentHistory ?? this.consentHistory,
      isRevoking: isRevoking ?? this.isRevoking,
      lastRevocationMessage:
          lastRevocationMessage ?? this.lastRevocationMessage,
    );
  }
}

const _sentinel = Object();

class AudienceVisibilityNotifier extends StateNotifier<AudienceVisibilityState> {
  AudienceVisibilityNotifier(this._ref)
      : super(const AudienceVisibilityState()) {
    _initFromSettings();
  }

  final Ref _ref;

  void _initFromSettings() {
    final privacy = _ref.read(userSettingsProvider).privacy;
    state = state.copyWith(hideMeFromPerformers: privacy.hideMeFromPerformers);
  }

  /// Verifies if a performer is currently blocked by the fan.
  bool isPerformerBlocked(String performerId) {
    final blocked = _ref.read(userSettingsProvider).blockedUsers;
    return blocked.any((u) => u['id'] == performerId || u['userId'] == performerId);
  }

  /// Activates visibility for a specific active performance session.
  /// Neither option is preselected by default.
  /// Throws [StateError] if stealth mode is enabled or performer is blocked.
  Future<bool> optIn({
    required String sessionId,
    required String performerId,
    required String performerName,
    required AudienceConsentTier tier,
    required DateTime expiresAt,
  }) async {
    if (state.hideMeFromPerformers) {
      throw StateError('Cannot share location: Stealth mode is active.');
    }
    if (isPerformerBlocked(performerId)) {
      throw StateError('Cannot share location: Performer is blocked.');
    }

    final grantId = 'grant_${DateTime.now().millisecondsSinceEpoch}';
    final grant = ActiveAudienceGrant(
      grantId: grantId,
      sessionId: sessionId,
      performerId: performerId,
      performerName: performerName,
      tier: tier,
      grantedAt: DateTime.now(),
      expiresAt: expiresAt,
    );

    final receipt = ConsentReceipt(
      receiptId: 'rcpt_${DateTime.now().millisecondsSinceEpoch}',
      fanUid: 'current_user',
      sessionId: sessionId,
      performerId: performerId,
      tier: tier,
      action: 'granted',
      grantId: grantId,
      createdAt: DateTime.now().toIso8601String(),
      expiresAt: expiresAt.toIso8601String(),
    );

    state = state.copyWith(
      activeGrant: grant,
      consentHistory: [receipt, ...state.consentHistory],
      lastRevocationMessage: null,
    );

    _ref.read(locationAnalyticsServiceProvider).trackAudienceVisibilityOptIn(
          tier: tier.wire,
        );

    return true;
  }

  /// Immediately revokes the current audience visibility grant.
  Future<void> stopSharing() async {
    final current = state.activeGrant;
    if (current == null) return;

    state = state.copyWith(isRevoking: true);

    final receipt = ConsentReceipt(
      receiptId: 'rcpt_${DateTime.now().millisecondsSinceEpoch}',
      fanUid: 'current_user',
      sessionId: current.sessionId,
      performerId: current.performerId,
      tier: current.tier,
      action: 'revoked',
      grantId: current.grantId,
      createdAt: DateTime.now().toIso8601String(),
      expiresAt: DateTime.now().toIso8601String(),
    );

    state = state.copyWith(
      activeGrant: null,
      isRevoking: false,
      consentHistory: [receipt, ...state.consentHistory],
      lastRevocationMessage:
          'Your location sharing with ${current.performerName} has stopped. Performer access was promptly removed.',
    );

    _ref.read(locationAnalyticsServiceProvider).trackAudienceVisibilityRevoked(
          reason: 'user_action_stop_sharing',
        );
  }

  /// Toggles master stealth mode ("Hide me from all performers").
  void setStealthMode(bool enabled) {
    if (enabled && state.activeGrant != null) {
      // Auto-revoke active session if entering stealth mode.
      stopSharing();
    }
    state = state.copyWith(hideMeFromPerformers: enabled);
    final userSettings = _ref.read(userSettingsProvider);
    _ref.read(userSettingsProvider.notifier).updatePrivacy(
          userSettings.privacy.copyWith(hideMeFromPerformers: enabled),
        );
  }

  /// Clears any transient status message.
  void clearMessage() {
    state = state.copyWith(lastRevocationMessage: null);
  }
}

/// Riverpod provider for [AudienceVisibilityState].
final audienceVisibilityProvider =
    StateNotifierProvider<AudienceVisibilityNotifier, AudienceVisibilityState>(
        (ref) {
  return AudienceVisibilityNotifier(ref);
});
