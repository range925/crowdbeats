// Crowdbeats V2 — Role and Persona Definitions (Dart Parity, Phase 3)
//
// Dart parity for: packages/contracts/src/identity/roles.ts
// OD-07: EXECUTIVE included (16 platform roles)
// OD-08: Option A (SPONSOR_REP / SPONSOR_ADMIN)

// ─── Platform Roles (OD-07: 16 roles) ────────────────────────────────────────

enum PlatformRole {
  superAdmin,
  executive,
  financeAnalyst,
  dataAnalyst,
  contentModerator,
  trustSafety,
  complianceOfficer,
  customerSupport,
  growthManager,
  partnerships,
  artistRelations,
  venueRelations,
  developer,
  qaTester,
  legal,
  marketing;

  static PlatformRole? fromString(String? s) {
    if (s == null) return null;
    return PlatformRole.values.firstWhere(
      (e) => e.name == _snakeToCamel(s),
      orElse: () => throw ArgumentError('Unknown platform role: $s'),
    );
  }

  String toJsonValue() => _camelToUpperSnake(name);
}

// ─── Persona Types ────────────────────────────────────────────────────────────

enum PersonaType {
  fan,
  artist,
  bandMember,
  venueManager,
  sponsorRep,
  staff;

  static PersonaType fromString(String s) => PersonaType.values.firstWhere(
        (e) => e.name == s,
        orElse: () => throw ArgumentError('Unknown persona type: $s'),
      );
}

// ─── Band Roles ───────────────────────────────────────────────────────────────

enum BandRole {
  bandFounder,
  bandAdmin,
  bandMember;

  static BandRole fromString(String s) => BandRole.values.firstWhere(
        (e) => e.name == s,
        orElse: () => throw ArgumentError('Unknown band role: $s'),
      );

  bool atLeast(BandRole minimum) =>
      BandRole.values.indexOf(this) <= BandRole.values.indexOf(minimum);
}

// ─── Venue Roles ──────────────────────────────────────────────────────────────

enum VenueRole {
  venueOwner,
  venueManager,
  venueStaff;

  static VenueRole fromString(String s) => VenueRole.values.firstWhere(
        (e) => e.name == s,
        orElse: () => throw ArgumentError('Unknown venue role: $s'),
      );

  bool atLeast(VenueRole minimum) =>
      VenueRole.values.indexOf(this) <= VenueRole.values.indexOf(minimum);
}

// ─── Sponsor Roles (OD-08: Option A) ─────────────────────────────────────────

enum SponsorRole {
  sponsorAdmin,
  sponsorRep;

  static SponsorRole fromString(String s) => SponsorRole.values.firstWhere(
        (e) => e.name == s,
        orElse: () => throw ArgumentError('Unknown sponsor role: $s'),
      );

  bool atLeast(SponsorRole minimum) =>
      SponsorRole.values.indexOf(this) <= SponsorRole.values.indexOf(minimum);
}

// ─── Privacy Classification ───────────────────────────────────────────────────

enum PrivacyClass {
  public,
  authenticated,
  memberOnly,
  ownerOnly,
  serverOnly;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

String _camelToUpperSnake(String s) => s
    .replaceAllMapped(RegExp(r'[A-Z]'), (m) => '_${m.group(0)!}')
    .toUpperCase()
    .replaceFirst(RegExp(r'^_'), '');

String _snakeToCamel(String s) {
  final parts = s.toLowerCase().split('_');
  return parts.first +
      parts.skip(1).map((p) => p.isEmpty ? '' : '${p[0].toUpperCase()}${p.substring(1)}').join();
}
