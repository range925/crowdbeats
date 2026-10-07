// Crowdbeats V2 — Artist Profile Model (Dart Parity, Phase 3)

enum MusicGenre {
  pop, rock, hipHop, jazz, classical, electronic, country, rnb, folk, latin, reggae, blues, other;

  static MusicGenre fromString(String s) => MusicGenre.values.firstWhere(
      (e) => e.name == s, orElse: () => MusicGenre.other);
}

class ArtistProfile {
  const ArtistProfile({
    required this.artistId,
    required this.ownerUid,
    required this.stageName,
    required this.genres,
    required this.socialLinks,
    required this.bankLinked,
    required this.isActive,
    required this.totalTipsReceivedCents,
    required this.createdAt,
    required this.updatedAt,
    required this.v,
    this.bio,
    this.photoUrl,
    this.coverUrl,
    this.verifiedAt,
    this.stripeAccountId,
  });

  final String artistId;
  final String ownerUid;
  final String stageName;
  final String? bio;
  final String? photoUrl;
  final String? coverUrl;
  final List<MusicGenre> genres;
  final ArtistSocialLinks socialLinks;
  final String? verifiedAt;
  final int totalTipsReceivedCents;
  final String? stripeAccountId;
  final bool bankLinked;
  final bool isActive;
  final String createdAt;
  final String updatedAt;
  final int v;

  factory ArtistProfile.fromJson(Map<String, dynamic> json) => ArtistProfile(
        artistId: json['artistId'] as String,
        ownerUid: json['ownerUid'] as String,
        stageName: json['stageName'] as String,
        genres: (json['genres'] as List<dynamic>)
            .map((g) => MusicGenre.fromString(g as String))
            .toList(),
        socialLinks: ArtistSocialLinks.fromJson(
            json['socialLinks'] as Map<String, dynamic>),
        bankLinked: json['bankLinked'] as bool,
        isActive: json['isActive'] as bool,
        totalTipsReceivedCents: json['totalTipsReceivedCents'] as int,
        createdAt: json['createdAt'] as String,
        updatedAt: json['updatedAt'] as String,
        v: json['v'] as int,
        bio: json['bio'] as String?,
        photoUrl: json['photoUrl'] as String?,
        coverUrl: json['coverUrl'] as String?,
        verifiedAt: json['verifiedAt'] as String?,
        stripeAccountId: json['stripeAccountId'] as String?,
      );
}

class ArtistSocialLinks {
  const ArtistSocialLinks({this.instagram, this.tiktok, this.spotify, this.appleMusic, this.website});

  final String? instagram;
  final String? tiktok;
  final String? spotify;
  final String? appleMusic;
  final String? website;

  factory ArtistSocialLinks.fromJson(Map<String, dynamic> json) => ArtistSocialLinks(
        instagram: json['instagram'] as String?,
        tiktok: json['tiktok'] as String?,
        spotify: json['spotify'] as String?,
        appleMusic: json['appleMusic'] as String?,
        website: json['website'] as String?,
      );
}
