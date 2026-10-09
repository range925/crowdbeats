// Crowdbeats V2 — User Settings & Preferences State (Riverpod)
//
// Manages notification preferences, privacy preferences, tipping defaults,
// security locks, and blocked accounts in Firestore.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
    this.twoFactorEnabled = true,
  });

  final bool biometricLockEnabled;
  final bool requireReauthForFinancials;
  final bool twoFactorEnabled;

  CbSecurityPreferences copyWith({
    bool? biometricLockEnabled,
    bool? requireReauthForFinancials,
    bool? twoFactorEnabled,
  }) => CbSecurityPreferences(
    biometricLockEnabled:       biometricLockEnabled       ?? this.biometricLockEnabled,
    requireReauthForFinancials: requireReauthForFinancials ?? this.requireReauthForFinancials,
    twoFactorEnabled:           twoFactorEnabled           ?? this.twoFactorEnabled,
  );

  Map<String, dynamic> toMap() => {
    'biometricLockEnabled':       biometricLockEnabled,
    'requireReauthForFinancials': requireReauthForFinancials,
    'twoFactorEnabled':           twoFactorEnabled,
  };

  factory CbSecurityPreferences.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const CbSecurityPreferences();
    return CbSecurityPreferences(
      biometricLockEnabled:       map['biometricLockEnabled'] as bool? ?? false,
      requireReauthForFinancials: map['requireReauthForFinancials'] as bool? ?? true,
      twoFactorEnabled:           map['twoFactorEnabled'] as bool? ?? true,
    );
  }
}

class CbAccessibilityPreferences {
  const CbAccessibilityPreferences({
    this.highContrastMode = false,
    this.reduceMotion = false,
    this.fontScale = 1.0,
    this.screenReaderOptimized = false,
    this.oledBlack = false,
    this.language = 'en',
    this.currency = 'USD',
  });

  final bool highContrastMode;
  final bool reduceMotion;
  final double fontScale;
  final bool screenReaderOptimized;
  final bool oledBlack;
  final String language;
  final String currency;

  CbAccessibilityPreferences copyWith({
    bool? highContrastMode,
    bool? reduceMotion,
    double? fontScale,
    bool? screenReaderOptimized,
    bool? oledBlack,
    String? language,
    String? currency,
  }) => CbAccessibilityPreferences(
    highContrastMode:      highContrastMode      ?? this.highContrastMode,
    reduceMotion:          reduceMotion          ?? this.reduceMotion,
    fontScale:             fontScale             ?? this.fontScale,
    screenReaderOptimized: screenReaderOptimized ?? this.screenReaderOptimized,
    oledBlack:             oledBlack             ?? this.oledBlack,
    language:              language              ?? this.language,
    currency:              currency              ?? this.currency,
  );

  Map<String, dynamic> toMap() => {
    'highContrastMode':      highContrastMode,
    'reduceMotion':          reduceMotion,
    'fontScale':             fontScale,
    'screenReaderOptimized': screenReaderOptimized,
    'oledBlack':             oledBlack,
    'language':              language,
    'currency':              currency,
  };

  factory CbAccessibilityPreferences.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const CbAccessibilityPreferences();
    return CbAccessibilityPreferences(
      highContrastMode:      map['highContrastMode'] as bool? ?? false,
      reduceMotion:          map['reduceMotion'] as bool? ?? false,
      fontScale:             (map['fontScale'] as num?)?.toDouble() ?? 1.0,
      screenReaderOptimized: map['screenReaderOptimized'] as bool? ?? false,
      oledBlack:             map['oledBlack'] as bool? ?? false,
      language:              map['language'] as String? ?? 'en',
      currency:              map['currency'] as String? ?? 'USD',
    );
  }
}

class CbUserSettingsState {
  const CbUserSettingsState({
    this.notifications = const CbNotificationPreferences(),
    this.privacy = const CbPrivacyPreferences(),
    this.tipping = const CbTippingPreferences(),
    this.security = const CbSecurityPreferences(),
    this.accessibility = const CbAccessibilityPreferences(),
    this.activeSessions = const [
      {
        'id': 'sess_current',
        'device': 'iPhone 15 Pro',
        'location': 'Austin, TX',
        'lastActive': 'Active Now',
        'isCurrent': true,
        'client': 'Crowdbeats iOS 3.8.2',
      },
      {
        'id': 'sess_macbook',
        'device': 'MacBook Pro M3',
        'location': 'Austin, TX',
        'lastActive': '2 hours ago',
        'isCurrent': false,
        'client': 'Chrome on macOS',
      },
    ],
    this.blockedUsers = const [],
    this.isLoading = false,
    this.isDeactivated = false,
  });

  final CbNotificationPreferences notifications;
  final CbPrivacyPreferences privacy;
  final CbTippingPreferences tipping;
  final CbSecurityPreferences security;
  final CbAccessibilityPreferences accessibility;
  final List<Map<String, dynamic>> activeSessions;
  final List<Map<String, dynamic>> blockedUsers;
  final bool isLoading;
  final bool isDeactivated;

  CbUserSettingsState copyWith({
    CbNotificationPreferences? notifications,
    CbPrivacyPreferences? privacy,
    CbTippingPreferences? tipping,
    CbSecurityPreferences? security,
    CbAccessibilityPreferences? accessibility,
    List<Map<String, dynamic>>? activeSessions,
    List<Map<String, dynamic>>? blockedUsers,
    bool? isLoading,
    bool? isDeactivated,
  }) => CbUserSettingsState(
    notifications:  notifications  ?? this.notifications,
    privacy:        privacy        ?? this.privacy,
    tipping:        tipping        ?? this.tipping,
    security:       security       ?? this.security,
    accessibility:  accessibility  ?? this.accessibility,
    activeSessions: activeSessions ?? this.activeSessions,
    blockedUsers:   blockedUsers   ?? this.blockedUsers,
    isLoading:      isLoading      ?? this.isLoading,
    isDeactivated:  isDeactivated  ?? this.isDeactivated,
  );
}

class UserSettingsNotifier extends StateNotifier<CbUserSettingsState> {
  UserSettingsNotifier({String initialThemeMode = 'system'})
      : super(CbUserSettingsState(
          privacy: CbPrivacyPreferences(themeMode: initialThemeMode),
        )) {
    _initLocalPreferences();
    loadSettings();
  }

  static const String themePrefKey = 'cb_theme_mode';
  static const String highContrastPrefKey = 'cb_high_contrast';
  static const String reduceMotionPrefKey = 'cb_reduce_motion';
  static const String fontScalePrefKey = 'cb_font_scale';
  static const String languagePrefKey = 'cb_language';

  FirebaseFirestore get _db => FirebaseFirestore.instance;

  Future<void> _initLocalPreferences() async {
    try {
      final sp = await SharedPreferences.getInstance();
      final savedTheme = sp.getString(themePrefKey);
      final savedHighContrast = sp.getBool(highContrastPrefKey);
      final savedReduceMotion = sp.getBool(reduceMotionPrefKey);
      final savedFontScale = sp.getDouble(fontScalePrefKey);
      final savedLanguage = sp.getString(languagePrefKey);

      var updatedPrivacy = state.privacy;
      var updatedA11y = state.accessibility;

      if (savedTheme != null && savedTheme != state.privacy.themeMode) {
        updatedPrivacy = updatedPrivacy.copyWith(themeMode: savedTheme);
      }
      if (savedHighContrast != null) {
        updatedA11y = updatedA11y.copyWith(highContrastMode: savedHighContrast);
      }
      if (savedReduceMotion != null) {
        updatedA11y = updatedA11y.copyWith(reduceMotion: savedReduceMotion);
      }
      if (savedFontScale != null) {
        updatedA11y = updatedA11y.copyWith(fontScale: savedFontScale);
      }
      if (savedLanguage != null) {
        updatedA11y = updatedA11y.copyWith(language: savedLanguage);
      }

      state = state.copyWith(
        privacy: updatedPrivacy,
        accessibility: updatedA11y,
      );
    } catch (_) {}
  }

  Future<void> loadSettings() async {
    try {
      final user = AuthService.instance.currentUser;
      if (user == null) return;

      state = state.copyWith(isLoading: true);
      final notifDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('notifications').get();
      final privDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('privacy').get();
      final tipDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('tipping').get();
      final secDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('security').get();
      final a11yDoc = await _db.collection('users').doc(user.uid).collection('settings').doc('accessibility').get();
      final blockedSnap = await _db.collection('users').doc(user.uid).collection('blockedUsers').get();

      final blockedList = blockedSnap.docs.map((d) => {'id': d.id, ...d.data()}).toList();

      final privacyPrefs = CbPrivacyPreferences.fromMap(privDoc.data());
      // If remote has theme, sync locally
      if (privDoc.data() != null && privDoc.data()!['themeMode'] != null) {
        try {
          final sp = await SharedPreferences.getInstance();
          await sp.setString(themePrefKey, privacyPrefs.themeMode);
        } catch (_) {}
      }

      state = CbUserSettingsState(
        notifications: CbNotificationPreferences.fromMap(notifDoc.data()),
        privacy:       privacyPrefs,
        tipping:       CbTippingPreferences.fromMap(tipDoc.data()),
        security:      CbSecurityPreferences.fromMap(secDoc.data()),
        accessibility: CbAccessibilityPreferences.fromMap(a11yDoc.data()),
        blockedUsers:  blockedList,
        activeSessions: state.activeSessions,
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
    try {
      final sp = await SharedPreferences.getInstance();
      await sp.setString(themePrefKey, prefs.themeMode);
    } catch (_) {}
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('privacy').set(
        {...prefs.toMap(), 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  Future<void> setThemeMode(String mode) async {
    final updated = state.privacy.copyWith(themeMode: mode);
    await updatePrivacy(updated);
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

  Future<void> updateAccessibility(CbAccessibilityPreferences prefs) async {
    state = state.copyWith(accessibility: prefs);
    try {
      final sp = await SharedPreferences.getInstance();
      await sp.setBool(highContrastPrefKey, prefs.highContrastMode);
      await sp.setBool(reduceMotionPrefKey, prefs.reduceMotion);
      await sp.setDouble(fontScalePrefKey, prefs.fontScale);
      await sp.setString(languagePrefKey, prefs.language);
    } catch (_) {}
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('accessibility').set(
        {...prefs.toMap(), 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  Future<void> setHighContrast(bool val) async {
    final updated = state.accessibility.copyWith(highContrastMode: val);
    await updateAccessibility(updated);
  }

  Future<void> setReduceMotion(bool val) async {
    final updated = state.accessibility.copyWith(reduceMotion: val);
    await updateAccessibility(updated);
  }

  Future<void> setFontScale(double scale) async {
    final updated = state.accessibility.copyWith(fontScale: scale);
    await updateAccessibility(updated);
  }

  Future<void> setLanguage(String lang) async {
    final updated = state.accessibility.copyWith(language: lang);
    await updateAccessibility(updated);
  }

  Future<void> setOledBlack(bool val) async {
    final updated = state.accessibility.copyWith(oledBlack: val);
    await updateAccessibility(updated);
  }

  Future<void> setTwoFactor(bool val) async {
    final updated = state.security.copyWith(twoFactorEnabled: val);
    await updateSecurity(updated);
  }

  Future<void> revokeSession(String sessionId) async {
    final updated = state.activeSessions.where((s) => s['id'] != sessionId).toList();
    state = state.copyWith(activeSessions: updated);
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('security').set(
        {'activeSessions': updated, 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  Future<void> revokeAllOtherSessions() async {
    final updated = state.activeSessions.where((s) => s['isCurrent'] == true).toList();
    state = state.copyWith(activeSessions: updated);
    final user = AuthService.instance.currentUser;
    if (user == null) return;
    try {
      await _db.collection('users').doc(user.uid).collection('settings').doc('security').set(
        {'activeSessions': updated, 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  void deactivateAccount() {
    state = state.copyWith(isDeactivated: true);
  }

  void reactivateAccount() {
    state = state.copyWith(isDeactivated: false);
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
