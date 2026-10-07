// Crowdbeats V2 — User Settings & Preferences State (Riverpod)
//
// Manages notification preferences, privacy preferences, tipping defaults,
// security locks, and blocked accounts in Firestore.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../firebase/auth_service.dart';

class CbNotificationPreferences {
  const CbNotificationPreferences({
    this.tipsReceived = true,
    this.payoutsAndTransfers = true,
    this.campaignMilestones = true,
    this.followedArtistsLive = true,
    this.nearbyStageAlerts = true,
    this.newReleases = true,
    this.newFollowers = true,
    this.fanMessages = true,
    this.bandInvitations = true,
    this.pushEnabled = true,
    this.emailDigests = true,
    this.smsAlerts = false,
  });

  final bool tipsReceived;
  final bool payoutsAndTransfers;
  final bool campaignMilestones;
  final bool followedArtistsLive;
  final bool nearbyStageAlerts;
  final bool newReleases;
  final bool newFollowers;
  final bool fanMessages;
  final bool bandInvitations;
  final bool pushEnabled;
  final bool emailDigests;
  final bool smsAlerts;

  CbNotificationPreferences copyWith({
    bool? tipsReceived,
    bool? payoutsAndTransfers,
    bool? campaignMilestones,
    bool? followedArtistsLive,
    bool? nearbyStageAlerts,
    bool? newReleases,
    bool? newFollowers,
    bool? fanMessages,
    bool? bandInvitations,
    bool? pushEnabled,
    bool? emailDigests,
    bool? smsAlerts,
  }) => CbNotificationPreferences(
    tipsReceived:        tipsReceived        ?? this.tipsReceived,
    payoutsAndTransfers: payoutsAndTransfers ?? this.payoutsAndTransfers,
    campaignMilestones:  campaignMilestones  ?? this.campaignMilestones,
    followedArtistsLive: followedArtistsLive ?? this.followedArtistsLive,
    nearbyStageAlerts:   nearbyStageAlerts   ?? this.nearbyStageAlerts,
    newReleases:         newReleases         ?? this.newReleases,
    newFollowers:        newFollowers        ?? this.newFollowers,
    fanMessages:         fanMessages         ?? this.fanMessages,
    bandInvitations:     bandInvitations     ?? this.bandInvitations,
    pushEnabled:         pushEnabled         ?? this.pushEnabled,
    emailDigests:        emailDigests        ?? this.emailDigests,
    smsAlerts:           smsAlerts           ?? this.smsAlerts,
  );

  Map<String, dynamic> toMap() => {
    'tipsReceived':        tipsReceived,
    'payoutsAndTransfers': payoutsAndTransfers,
    'campaignMilestones':  campaignMilestones,
    'followedArtistsLive': followedArtistsLive,
    'nearbyStageAlerts':   nearbyStageAlerts,
    'newReleases':         newReleases,
    'newFollowers':        newFollowers,
    'fanMessages':         fanMessages,
    'bandInvitations':     bandInvitations,
    'pushEnabled':         pushEnabled,
    'emailDigests':        emailDigests,
    'smsAlerts':           smsAlerts,
  };

  factory CbNotificationPreferences.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const CbNotificationPreferences();
    return CbNotificationPreferences(
      tipsReceived:        map['tipsReceived'] as bool? ?? true,
      payoutsAndTransfers: map['payoutsAndTransfers'] as bool? ?? true,
      campaignMilestones:  map['campaignMilestones'] as bool? ?? true,
      followedArtistsLive: map['followedArtistsLive'] as bool? ?? true,
      nearbyStageAlerts:   map['nearbyStageAlerts'] as bool? ?? true,
      newReleases:         map['newReleases'] as bool? ?? true,
      newFollowers:        map['newFollowers'] as bool? ?? true,
      fanMessages:         map['fanMessages'] as bool? ?? true,
      bandInvitations:     map['bandInvitations'] as bool? ?? true,
      pushEnabled:         map['pushEnabled'] as bool? ?? true,
      emailDigests:        map['emailDigests'] as bool? ?? true,
      smsAlerts:           map['smsAlerts'] as bool? ?? false,
    );
  }
}

class CbPrivacyPreferences {
  const CbPrivacyPreferences({
    this.locationPrecision = 'precise',
    this.profileDiscoverableInRadar = true,
    this.defaultAnonymousTipping = false,
    this.shareListeningActivity = true,
    this.telemetryConsent = true,
    this.hideMeFromPerformers = false,
    this.lastLocationAccessExplanation =
        'One-shot fix captured for venue proximity check (<= 200m). GPS stopped immediately after verification.',
    this.themeMode = 'system',
  });

  final String locationPrecision; // 'precise' | 'approximate' | 'disabled'
  final bool profileDiscoverableInRadar;
  final bool defaultAnonymousTipping;
  final bool shareListeningActivity;
  final bool telemetryConsent;
  final bool hideMeFromPerformers;
  final String? lastLocationAccessExplanation;
  final String themeMode; // 'system' | 'dark' | 'light'

  CbPrivacyPreferences copyWith({
    String? locationPrecision,
    bool? profileDiscoverableInRadar,
    bool? defaultAnonymousTipping,
    bool? shareListeningActivity,
    bool? telemetryConsent,
    bool? hideMeFromPerformers,
    String? lastLocationAccessExplanation,
    String? themeMode,
  }) => CbPrivacyPreferences(
    locationPrecision:          locationPrecision          ?? this.locationPrecision,
    profileDiscoverableInRadar: profileDiscoverableInRadar ?? this.profileDiscoverableInRadar,
    defaultAnonymousTipping:    defaultAnonymousTipping    ?? this.defaultAnonymousTipping,
    shareListeningActivity:     shareListeningActivity     ?? this.shareListeningActivity,
    telemetryConsent:           telemetryConsent           ?? this.telemetryConsent,
    hideMeFromPerformers:       hideMeFromPerformers       ?? this.hideMeFromPerformers,
    lastLocationAccessExplanation: lastLocationAccessExplanation ?? this.lastLocationAccessExplanation,
    themeMode:                  themeMode                  ?? this.themeMode,
  );

  Map<String, dynamic> toMap() => {
    'locationPrecision':          locationPrecision,
    'profileDiscoverableInRadar': profileDiscoverableInRadar,
    'defaultAnonymousTipping':    defaultAnonymousTipping,
    'shareListeningActivity':     shareListeningActivity,
    'telemetryConsent':           telemetryConsent,
    'hideMeFromPerformers':       hideMeFromPerformers,
    'lastLocationAccessExplanation': lastLocationAccessExplanation,
    'themeMode':                  themeMode,
  };

  factory CbPrivacyPreferences.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const CbPrivacyPreferences();
    return CbPrivacyPreferences(
      locationPrecision:          map['locationPrecision'] as String? ?? 'precise',
      profileDiscoverableInRadar: map['profileDiscoverableInRadar'] as bool? ?? true,
      defaultAnonymousTipping:    map['defaultAnonymousTipping'] as bool? ?? false,
      shareListeningActivity:     map['shareListeningActivity'] as bool? ?? true,
      telemetryConsent:           map['telemetryConsent'] as bool? ?? true,
      hideMeFromPerformers:       map['hideMeFromPerformers'] as bool? ?? false,
      lastLocationAccessExplanation: map['lastLocationAccessExplanation'] as String? ??
          'One-shot fix captured for venue proximity check (<= 200m). GPS stopped immediately after verification.',
      themeMode:                  map['themeMode'] as String? ?? 'system',
    );
  }
}

class CbTippingPreferences {
  const CbTippingPreferences({
    this.defaultCurrency = 'USD',
    this.presetAmounts = const [2, 5, 10, 20],
    this.quickOneTap = true,
  });

  final String defaultCurrency;
  final List<int> presetAmounts;
  final bool quickOneTap;

  CbTippingPreferences copyWith({
    String? defaultCurrency,
    List<int>? presetAmounts,
    bool? quickOneTap,
  }) => CbTippingPreferences(
    defaultCurrency: defaultCurrency ?? this.defaultCurrency,
    presetAmounts:   presetAmounts   ?? this.presetAmounts,
    quickOneTap:     quickOneTap     ?? this.quickOneTap,
  );

  Map<String, dynamic> toMap() => {
    'defaultCurrency': defaultCurrency,
    'presetAmounts':   presetAmounts,
    'quickOneTap':     quickOneTap,
  };

  factory CbTippingPreferences.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const CbTippingPreferences();
    final list = (map['presetAmounts'] as List<dynamic>?)?.map((e) => (e as num).toInt()).toList();
    return CbTippingPreferences(
      defaultCurrency: map['defaultCurrency'] as String? ?? 'USD',
      presetAmounts:   list ?? const [2, 5, 10, 20],
      quickOneTap:     map['quickOneTap'] as bool? ?? true,
    );
  }
}

class CbSecurityPreferences {
  const CbSecurityPreferences({
    this.biometricLockEnabled = false,
    this.requireReauthForFinancials = true,
  });

  final bool biometricLockEnabled;
  final bool requireReauthForFinancials;

  CbSecurityPreferences copyWith({
    bool? biometricLockEnabled,
    bool? requireReauthForFinancials,
  }) => CbSecurityPreferences(
    biometricLockEnabled:       biometricLockEnabled       ?? this.biometricLockEnabled,
    requireReauthForFinancials: requireReauthForFinancials ?? this.requireReauthForFinancials,
  );

  Map<String, dynamic> toMap() => {
    'biometricLockEnabled':       biometricLockEnabled,
    'requireReauthForFinancials': requireReauthForFinancials,
  };

  factory CbSecurityPreferences.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const CbSecurityPreferences();
    return CbSecurityPreferences(
      biometricLockEnabled:       map['biometricLockEnabled'] as bool? ?? false,
      requireReauthForFinancials: map['requireReauthForFinancials'] as bool? ?? true,
    );
  }
}

class CbUserSettingsState {
  const CbUserSettingsState({
    this.notifications = const CbNotificationPreferences(),
    this.privacy = const CbPrivacyPreferences(),
    this.tipping = const CbTippingPreferences(),
    this.security = const CbSecurityPreferences(),
    this.blockedUsers = const [],
    this.isLoading = false,
  });

  final CbNotificationPreferences notifications;
  final CbPrivacyPreferences privacy;
  final CbTippingPreferences tipping;
  final CbSecurityPreferences security;
  final List<Map<String, dynamic>> blockedUsers;
  final bool isLoading;

  CbUserSettingsState copyWith({
    CbNotificationPreferences? notifications,
    CbPrivacyPreferences? privacy,
    CbTippingPreferences? tipping,
    CbSecurityPreferences? security,
    List<Map<String, dynamic>>? blockedUsers,
    bool? isLoading,
  }) => CbUserSettingsState(
    notifications: notifications ?? this.notifications,
    privacy:       privacy       ?? this.privacy,
    tipping:       tipping       ?? this.tipping,
    security:      security      ?? this.security,
    blockedUsers:  blockedUsers  ?? this.blockedUsers,
    isLoading:     isLoading     ?? this.isLoading,
  );
}

class UserSettingsNotifier extends StateNotifier<CbUserSettingsState> {
  UserSettingsNotifier() : super(const CbUserSettingsState()) {
    loadSettings();
  }

  FirebaseFirestore get _db => FirebaseFirestore.instance;

  Future<void> loadSettings() async {
    try {
      final user = AuthService.instance.currentUser;
      if (user == null) return;

      state = state.copyWith(isLoading: true);
      final notifDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('notifications').get();
      final privDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('privacy').get();
      final tipDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('tipping').get();
      final secDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('security').get();
      final blockedSnap = await _db.collection('users').doc(user.uid).collection('blockedUsers').get();

      final blockedList = blockedSnap.docs.map((d) => {'id': d.id, ...d.data()}).toList();

      state = CbUserSettingsState(
        notifications: CbNotificationPreferences.fromMap(notifDoc.data()),
        privacy:       CbPrivacyPreferences.fromMap(privDoc.data()),
        tipping:       CbTippingPreferences.fromMap(tipDoc.data()),
        security:      CbSecurityPreferences.fromMap(secDoc.data()),
        blockedUsers:  blockedList,
        isLoading:     false,
      );
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> updateNotifications(CbNotificationPreferences prefs) async {
    state = state.copyWith(notifications: prefs);
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('notifications').set(
        {...prefs.toMap(), 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  Future<void> updatePrivacy(CbPrivacyPreferences prefs) async {
    state = state.copyWith(privacy: prefs);
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('privacy').set(
        {...prefs.toMap(), 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  Future<void> updateTipping(CbTippingPreferences prefs) async {
    state = state.copyWith(tipping: prefs);
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('tipping').set(
        {...prefs.toMap(), 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  Future<void> updateSecurity(CbSecurityPreferences prefs) async {
    state = state.copyWith(security: prefs);
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('security').set(
        {...prefs.toMap(), 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  Future<void> blockUser(String targetUid, {String? displayName}) async {
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('blockedUsers').doc(targetUid).set({
        'blockedUid': targetUid,
        'displayName': displayName ?? 'Blocked User',
        'blockedAt': FieldValue.serverTimestamp(),
      });
      await loadSettings();
    } catch (_) {}
  }

  Future<void> unblockUser(String targetUid) async {
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('blockedUsers').doc(targetUid).delete();
      state = state.copyWith(
        blockedUsers: state.blockedUsers.where((u) => u['id'] != targetUid && u['blockedUid'] != targetUid).toList(),
      );
    } catch (_) {}
  }
}

final userSettingsProvider = StateNotifierProvider<UserSettingsNotifier, CbUserSettingsState>((ref) {
  return UserSettingsNotifier();
});
