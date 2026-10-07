// Crowdbeats V2 — User Record Model (Dart Parity, Phase 3)
//
// Dart parity for: packages/contracts/src/identity/user.ts

import 'roles.dart';

class UserRecord {
  const UserRecord({
    required this.uid,
    required this.email,
    required this.emailVerified,
    required this.displayName,
    required this.personaType,
    required this.createdAt,
    required this.updatedAt,
    required this.v,
    this.photoUrl,
    this.deletedAt,
    this.suspendedAt,
  });

  final String uid;
  final String email;
  final bool emailVerified;
  final String displayName;
  final String? photoUrl;
  final PersonaType personaType;
  final String createdAt;
  final String updatedAt;
  final int v;
  final String? deletedAt;
  final String? suspendedAt;

  factory UserRecord.fromJson(Map<String, dynamic> json) => UserRecord(
        uid: json['uid'] as String,
        email: json['email'] as String,
        emailVerified: json['emailVerified'] as bool,
        displayName: json['displayName'] as String,
        personaType: PersonaType.fromString(json['personaType'] as String),
        createdAt: json['createdAt'] as String,
        updatedAt: json['updatedAt'] as String,
        v: json['v'] as int,
        photoUrl: json['photoUrl'] as String?,
        deletedAt: json['deletedAt'] as String?,
        suspendedAt: json['suspendedAt'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'email': email,
        'emailVerified': emailVerified,
        'displayName': displayName,
        'personaType': personaType.name,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'v': v,
        if (photoUrl != null) 'photoUrl': photoUrl,
        if (deletedAt != null) 'deletedAt': deletedAt,
        if (suspendedAt != null) 'suspendedAt': suspendedAt,
      };
}

// ─── Consent Record ───────────────────────────────────────────────────────────

enum ConsentType {
  termsOfService,
  privacyPolicy,
  marketingEmails,
  pushNotifications,
  analytics;

  static ConsentType fromString(String s) => ConsentType.values.firstWhere(
        (e) => e.name == s,
        orElse: () => throw ArgumentError('Unknown consent type: $s'),
      );
}

class ConsentRecord {
  const ConsentRecord({
    required this.uid,
    required this.consentType,
    required this.version,
    required this.granted,
    required this.grantedAt,
    required this.platform,
  });

  final String uid;
  final ConsentType consentType;
  final String version;
  final bool granted;
  final String grantedAt;
  final String platform;

  factory ConsentRecord.fromJson(Map<String, dynamic> json) => ConsentRecord(
        uid: json['uid'] as String,
        consentType: ConsentType.fromString(json['consentType'] as String),
        version: json['version'] as String,
        granted: json['granted'] as bool,
        grantedAt: json['grantedAt'] as String,
        platform: json['platform'] as String,
      );
}
