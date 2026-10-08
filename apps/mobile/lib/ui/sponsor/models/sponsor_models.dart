// Crowdbeats V2 — Sponsor Mobile Models & Mock Repository
// Adheres to SPONSOR_MOBILE_SPEC.md and DESIGN_SYSTEM_SPEC.md
// Currency is represented in integer minor units (cents).

import 'package:flutter/material.dart';

// ── Currency & Numeric Utilities ─────────────────────────────────────────────

String formatCurrencyCents(int amountCents) {
  final isNegative = amountCents < 0;
  final absCents = amountCents.abs();
  final dollars = absCents ~/ 100;
  final cents = absCents % 100;

  final buffer = StringBuffer();
  final dollarStr = dollars.toString();
  final len = dollarStr.length;
  for (var i = 0; i < len; i++) {
    if (i > 0 && (len - i) % 3 == 0) {
      buffer.write(',');
    }
    buffer.write(dollarStr[i]);
  }

  final prefix = isNegative ? '-\$' : '\$';
  return '$prefix$buffer.${cents.toString().padLeft(2, '0')}';
}

String formatCompactNumber(int count) {
  if (count >= 1000000) {
    final value = (count / 1000000).toStringAsFixed(1);
    return '${value.endsWith(".0") ? value.substring(0, value.length - 2) : value}M';
  } else if (count >= 1000) {
    final value = (count / 1000).toStringAsFixed(1);
    return '${value.endsWith(".0") ? value.substring(0, value.length - 2) : value}K';
  }
  return count.toString();
}

// ── Models ───────────────────────────────────────────────────────────────────

enum ApplicationStatus {
  underReview,
  active,
  completed,
  declined,
}

extension ApplicationStatusX on ApplicationStatus {
  String get label => switch (this) {
        ApplicationStatus.underReview => 'Under Review',
        ApplicationStatus.active => 'Active',
        ApplicationStatus.completed => 'Completed',
        ApplicationStatus.declined => 'Declined',
      };
}

class SponsorOrganization {
  const SponsorOrganization({
    required this.id,
    required this.name,
    required this.logoUrl,
    required this.industry,
    required this.tier,
    required this.isVerified,
    required this.totalBudgetCents,
    required this.spentBudgetCents,
    required this.allocatedBudgetCents,
    required this.activeCampaignsCount,
    required this.totalImpressions,
    required this.avgEngagementRate,
  });

  final String id;
  final String name;
  final String logoUrl;
  final String industry;
  final String tier; // e.g., 'Headline Partner', 'Gold Sponsor'
  final bool isVerified;
  final int totalBudgetCents;
  final int spentBudgetCents;
  final int allocatedBudgetCents;
  final int activeCampaignsCount;
  final int totalImpressions;
  final double avgEngagementRate;

  int get remainingBudgetCents => totalBudgetCents - spentBudgetCents;

  double get spentProgress =>
      totalBudgetCents > 0 ? (spentBudgetCents / totalBudgetCents).clamp(0.0, 1.0) : 0.0;

  SponsorOrganization copyWith({
    String? id,
    String? name,
    String? logoUrl,
    String? industry,
    String? tier,
    bool? isVerified,
    int? totalBudgetCents,
    int? spentBudgetCents,
    int? allocatedBudgetCents,
    int? activeCampaignsCount,
    int? totalImpressions,
    double? avgEngagementRate,
  }) {
    return SponsorOrganization(
      id: id ?? this.id,
      name: name ?? this.name,
      logoUrl: logoUrl ?? this.logoUrl,
      industry: industry ?? this.industry,
      tier: tier ?? this.tier,
      isVerified: isVerified ?? this.isVerified,
      totalBudgetCents: totalBudgetCents ?? this.totalBudgetCents,
      spentBudgetCents: spentBudgetCents ?? this.spentBudgetCents,
      allocatedBudgetCents: allocatedBudgetCents ?? this.allocatedBudgetCents,
      activeCampaignsCount: activeCampaignsCount ?? this.activeCampaignsCount,
      totalImpressions: totalImpressions ?? this.totalImpressions,
      avgEngagementRate: avgEngagementRate ?? this.avgEngagementRate,
    );
  }
}

class TalentProfile {
  const TalentProfile({
    required this.id,
    required this.name,
    required this.type, // 'Solo', 'Band', 'Venue'
    required this.isVerified,
    required this.followerCount,
    required this.primaryGenre,
    required this.location,
    required this.city,
    required this.averageDraw,
    required this.engagementRate,
    required this.bio,
    this.imageUrl,
    this.isBookmarked = false,
    this.recentVenues = const [],
    this.monthlyStreams = 0,
  });

  final String id;
  final String name;
  final String type;
  final bool isVerified;
  final int followerCount;
  final String primaryGenre;
  final String location;
  final String city;
  final int averageDraw;
  final double engagementRate;
  final String bio;
  final String? imageUrl;
  final bool isBookmarked;
  final List<String> recentVenues;
  final int monthlyStreams;

  TalentProfile copyWith({
    String? id,
    String? name,
    String? type,
    bool? isVerified,
    int? followerCount,
    String? primaryGenre,
    String? location,
    String? city,
    int? averageDraw,
    double? engagementRate,
    String? bio,
    String? imageUrl,
    bool? isBookmarked,
    List<String>? recentVenues,
    int? monthlyStreams,
  }) {
    return TalentProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      isVerified: isVerified ?? this.isVerified,
      followerCount: followerCount ?? this.followerCount,
      primaryGenre: primaryGenre ?? this.primaryGenre,
      location: location ?? this.location,
      city: city ?? this.city,
      averageDraw: averageDraw ?? this.averageDraw,
      engagementRate: engagementRate ?? this.engagementRate,
      bio: bio ?? this.bio,
      imageUrl: imageUrl ?? this.imageUrl,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      recentVenues: recentVenues ?? this.recentVenues,
      monthlyStreams: monthlyStreams ?? this.monthlyStreams,
    );
  }
}

class PaymentMilestone {
  const PaymentMilestone({
    required this.id,
    required this.title,
    required this.percentage,
    required this.amountCents,
    required this.isPaid,
    required this.dueDate,
  });

  final String id;
  final String title;
  final int percentage;
  final int amountCents;
  final bool isPaid;
  final DateTime dueDate;
}

class SponsorshipApplication {
  const SponsorshipApplication({
    required this.id,
    required this.talent,
    required this.sponsorId,
    required this.eventName,
    required this.venueName,
    required this.city,
    required this.eventDate,
    required this.proposalText,
    required this.proposedCompensationCents,
    required this.deliverables,
    required this.status,
    required this.milestones,
    this.counterOfferCents,
    this.counterOfferNote,
  });

  final String id;
  final TalentProfile talent;
  final String sponsorId;
  final String eventName;
  final String venueName;
  final String city;
  final DateTime eventDate;
  final String proposalText;
  final int proposedCompensationCents;
  final List<String> deliverables;
  final ApplicationStatus status;
  final List<PaymentMilestone> milestones;
  final int? counterOfferCents;
  final String? counterOfferNote;

  SponsorshipApplication copyWith({
    String? id,
    TalentProfile? talent,
    String? sponsorId,
    String? eventName,
    String? venueName,
    String? city,
    DateTime? eventDate,
    String? proposalText,
    int? proposedCompensationCents,
    List<String>? deliverables,
    ApplicationStatus? status,
    List<PaymentMilestone>? milestones,
    int? counterOfferCents,
    String? counterOfferNote,
  }) {
    return SponsorshipApplication(
      id: id ?? this.id,
      talent: talent ?? this.talent,
      sponsorId: sponsorId ?? this.sponsorId,
      eventName: eventName ?? this.eventName,
      venueName: venueName ?? this.venueName,
      city: city ?? this.city,
      eventDate: eventDate ?? this.eventDate,
      proposalText: proposalText ?? this.proposalText,
      proposedCompensationCents: proposedCompensationCents ?? this.proposedCompensationCents,
      deliverables: deliverables ?? this.deliverables,
      status: status ?? this.status,
      milestones: milestones ?? this.milestones,
      counterOfferCents: counterOfferCents ?? this.counterOfferCents,
      counterOfferNote: counterOfferNote ?? this.counterOfferNote,
    );
  }
}

class ActivePerformance {
  const ActivePerformance({
    required this.id,
    required this.performerName,
    required this.performerType,
    required this.venueName,
    required this.city,
    required this.stage,
    required this.performanceDate,
    required this.status,
    required this.audienceDraw,
    required this.sponsorshipTier,
    required this.deliverableProgress,
    this.performerImageUrl,
  });

  final String id;
  final String performerName;
  final String performerType;
  final String venueName;
  final String city;
  final String stage;
  final DateTime performanceDate;
  final String status; // 'Tonight', 'Soundcheck', 'Confirmed', 'Live'
  final int audienceDraw;
  final String sponsorshipTier;
  final double deliverableProgress; // 0.0 - 1.0
  final String? performerImageUrl;
}

class SponsorChatMessage {
  const SponsorChatMessage({
    required this.id,
    required this.senderName,
    required this.text,
    required this.timestamp,
    required this.isFromMe,
    this.attachmentName,
    this.attachmentType,
  });

  final String id;
  final String senderName;
  final String text;
  final DateTime timestamp;
  final bool isFromMe;
  final String? attachmentName;
  final String? attachmentType;
}

class SponsorMessageThread {
  const SponsorMessageThread({
    required this.id,
    required this.participantName,
    required this.participantRole,
    required this.category, // 'talent' | 'venue' | 'support'
    required this.lastMessage,
    required this.lastMessageTime,
    required this.unreadCount,
    required this.isOnline,
    required this.messages,
    this.avatarUrl,
  });

  final String id;
  final String participantName;
  final String participantRole;
  final String category;
  final String lastMessage;
  final DateTime lastMessageTime;
  final int unreadCount;
  final bool isOnline;
  final List<SponsorChatMessage> messages;
  final String? avatarUrl;

  SponsorMessageThread copyWith({
    String? id,
    String? participantName,
    String? participantRole,
    String? category,
    String? lastMessage,
    DateTime? lastMessageTime,
    int? unreadCount,
    bool? isOnline,
    List<SponsorChatMessage>? messages,
    String? avatarUrl,
  }) {
    return SponsorMessageThread(
      id: id ?? this.id,
      participantName: participantName ?? this.participantName,
      participantRole: participantRole ?? this.participantRole,
      category: category ?? this.category,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageTime: lastMessageTime ?? this.lastMessageTime,
      unreadCount: unreadCount ?? this.unreadCount,
      isOnline: isOnline ?? this.isOnline,
      messages: messages ?? this.messages,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }
}

class TeamMember {
  const TeamMember({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.avatarInitials,
    this.avatarColor = const Color(0xFF7C3AED),
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String avatarInitials;
  final Color avatarColor;
}

class SponsorContractDocument {
  const SponsorContractDocument({
    required this.id,
    required this.title,
    required this.talentOrVenue,
    required this.date,
    required this.status, // 'Signed', 'Pending Signature', 'Archived'
    required this.fileSize,
    required this.documentType, // 'Sponsorship Agreement', 'Rider Addendum', 'NDA'
  });

  final String id;
  final String title;
  final String talentOrVenue;
  final DateTime date;
  final String status;
  final String fileSize;
  final String documentType;
}

class SponsorInvoiceReceipt {
  const SponsorInvoiceReceipt({
    required this.id,
    required this.invoiceNumber,
    required this.description,
    required this.amountCents,
    required this.date,
    required this.status,
    required this.paymentMethod,
  });

  final String id;
  final String invoiceNumber;
  final String description;
  final int amountCents;
  final DateTime date;
  final String status;
  final String paymentMethod;
}

// ── Mock Data Repository ─────────────────────────────────────────────────────

class SponsorMockData {
  SponsorMockData._();

  static const defaultOrg = SponsorOrganization(
    id: 'sponsor_org_apex',
    name: 'Apex Audio & Gear',
    logoUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150',
    industry: 'Music & Audio Technology',
    tier: 'Headline Brand Partner',
    isVerified: true,
    totalBudgetCents: 7500000,     // $75,000.00
    spentBudgetCents: 4235000,     // $42,350.00
    allocatedBudgetCents: 6200000, // $62,000.00
    activeCampaignsCount: 6,
    totalImpressions: 148500,
    avgEngagementRate: 8.4,
  );

  static final List<TalentProfile> talentPool = [
    const TalentProfile(
      id: 'talent_1',
      name: 'Luna & The Echoes',
      type: 'Band',
      isVerified: true,
      followerCount: 42500,
      primaryGenre: 'Indie',
      location: 'Austin, TX',
      city: 'Austin',
      averageDraw: 1450,
      engagementRate: 9.2,
      bio: '4-piece atmospheric indie rock ensemble headlining Austin and PNW venues.',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
      isBookmarked: true,
      recentVenues: ['Empire Control Room', 'Mohawk Austin', 'Stubbs BBQ'],
      monthlyStreams: 185000,
    ),
    const TalentProfile(
      id: 'talent_2',
      name: 'Kai Rivera',
      type: 'Solo',
      isVerified: true,
      followerCount: 28900,
      primaryGenre: 'Electronic',
      location: 'Los Angeles, CA',
      city: 'Los Angeles',
      averageDraw: 850,
      engagementRate: 11.4,
      bio: 'Synthesist and ambient beatmaker blending live analog gear with vocal chops.',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
      isBookmarked: false,
      recentVenues: ['1720 LA', 'El Rey Theatre', 'The Echo'],
      monthlyStreams: 92000,
    ),
    const TalentProfile(
      id: 'talent_3',
      name: 'Velvet Horizon',
      type: 'Band',
      isVerified: true,
      followerCount: 64200,
      primaryGenre: 'R&B',
      location: 'New York, NY',
      city: 'New York',
      averageDraw: 2100,
      engagementRate: 7.8,
      bio: 'Soulful modern neo-R&B collective delivering high-energy 6-piece live sets.',
      imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
      isBookmarked: true,
      recentVenues: ['Brooklyn Steel', 'Bowery Ballroom', 'Elsewhere'],
      monthlyStreams: 340000,
    ),
    const TalentProfile(
      id: 'talent_4',
      name: 'The Midnight Static',
      type: 'Band',
      isVerified: false,
      followerCount: 19800,
      primaryGenre: 'Rock',
      location: 'Nashville, TN',
      city: 'Nashville',
      averageDraw: 650,
      engagementRate: 8.9,
      bio: 'Gritty garage rock trio with soaring guitar hooks and raw live energy.',
      imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400',
      isBookmarked: false,
      recentVenues: ['Exit/In', 'Basement East', 'The End'],
      monthlyStreams: 48000,
    ),
    const TalentProfile(
      id: 'talent_5',
      name: 'Maya Chen Quintet',
      type: 'Solo',
      isVerified: true,
      followerCount: 15400,
      primaryGenre: 'Jazz',
      location: 'Chicago, IL',
      city: 'Chicago',
      averageDraw: 520,
      engagementRate: 12.1,
      bio: 'Modern modal jazz trumpeter and bandleader reinterpreting contemporary classics.',
      imageUrl: 'https://images.unsplash.com/photo-1520523839898-50712825e317?w=400',
      isBookmarked: false,
      recentVenues: ['Green Mill', 'Constellation', 'Jazz Showcase'],
      monthlyStreams: 62000,
    ),
    const TalentProfile(
      id: 'talent_6',
      name: 'The Echo Lounge & Stage',
      type: 'Venue',
      isVerified: true,
      followerCount: 51200,
      primaryGenre: 'All',
      location: 'Dallas, TX',
      city: 'Dallas',
      averageDraw: 1200,
      engagementRate: 9.8,
      bio: 'Premier 1,000-capacity mid-sized independent concert hall and club.',
      imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400',
      isBookmarked: false,
      recentVenues: ['Main Stage Room', 'The Patio Stage'],
      monthlyStreams: 0,
    ),
  ];

  static final List<ActivePerformance> activePerformances = [
    ActivePerformance(
      id: 'perf_1',
      performerName: 'Luna & The Echoes',
      performerType: 'Band',
      venueName: 'Empire Control Room',
      city: 'Austin, TX',
      stage: 'Main Garage Stage',
      performanceDate: DateTime.now().add(const Duration(hours: 3)),
      status: 'Tonight',
      audienceDraw: 1250,
      sponsorshipTier: 'Headline Stage Sponsor',
      deliverableProgress: 0.85,
      performerImageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    ),
    ActivePerformance(
      id: 'perf_2',
      performerName: 'Velvet Horizon',
      performerType: 'Band',
      venueName: 'Brooklyn Steel',
      city: 'New York, NY',
      stage: 'Grand Ballroom',
      performanceDate: DateTime.now().add(const Duration(days: 2, hours: 4)),
      status: 'Soundcheck Confirmed',
      audienceDraw: 1800,
      sponsorshipTier: 'Official Audio Partner',
      deliverableProgress: 0.60,
      performerImageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
    ),
    ActivePerformance(
      id: 'perf_3',
      performerName: 'Kai Rivera',
      performerType: 'Solo',
      venueName: 'The Echo LA',
      city: 'Los Angeles, CA',
      stage: 'Sunset Stage',
      performanceDate: DateTime.now().add(const Duration(days: 5, hours: 2)),
      status: 'Confirmed',
      audienceDraw: 750,
      sponsorshipTier: 'Gear Demonstration Sponsor',
      deliverableProgress: 0.40,
      performerImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    ),
  ];

  static final List<SponsorshipApplication> initialApplications = [
    SponsorshipApplication(
      id: 'app_1',
      talent: talentPool[0], // Luna & The Echoes
      sponsorId: 'sponsor_org_apex',
      eventName: 'Neon Dusk Album Release Tour',
      venueName: 'Empire Control Room',
      city: 'Austin, TX',
      eventDate: DateTime.now().add(const Duration(days: 12)),
      proposalText:
          'We are kicking off our 10-city Southwest tour celebrating our sophomore LP. We want Apex Audio as our official monitoring sponsor to showcase your wireless in-ear monitors on stage and to our 42K active followers.',
      proposedCompensationCents: 350000, // $3,500.00
      deliverables: const [
        'Custom 6ft stage banner behind drum riser',
        '3x Dedicated Instagram reels featuring Apex gear during rehearsal',
        'Verbal shoutout & DJ intro endorsement before final encore',
        'VIP meet-and-greet passes for 6 sponsor guests',
        'Logo placement on digital tickets and tour poster flyers',
      ],
      status: ApplicationStatus.underReview,
      milestones: [
        PaymentMilestone(
          id: 'ms_1_1',
          title: 'Contract Execution & Upfront Deposit',
          percentage: 50,
          amountCents: 175000,
          isPaid: false,
          dueDate: DateTime.now().add(const Duration(days: 3)),
        ),
        PaymentMilestone(
          id: 'ms_1_2',
          title: 'Post-Show Recap & Deliverables Verification',
          percentage: 50,
          amountCents: 175000,
          isPaid: false,
          dueDate: DateTime.now().add(const Duration(days: 14)),
        ),
      ],
    ),
    SponsorshipApplication(
      id: 'app_2',
      talent: talentPool[1], // Kai Rivera
      sponsorId: 'sponsor_org_apex',
      eventName: 'Modular Synth Sunset Session',
      venueName: '1720 Warehouse Stage',
      city: 'Los Angeles, CA',
      eventDate: DateTime.now().add(const Duration(days: 8)),
      proposalText:
          'A three-hour live electronic modular performance broadcasted to 28K subscribers. Looking for gear sponsorship and promotional backing.',
      proposedCompensationCents: 180000, // $1,800.00
      deliverables: const [
        'Dedicated live-stream lower-third sponsor branding',
        'On-table hardware display featuring Apex pedalboard',
        '2x TikTok video breakdown of audio setup',
      ],
      status: ApplicationStatus.underReview,
      milestones: [
        PaymentMilestone(
          id: 'ms_2_1',
          title: 'Advance Payment',
          percentage: 60,
          amountCents: 108000,
          isPaid: false,
          dueDate: DateTime.now().add(const Duration(days: 2)),
        ),
        PaymentMilestone(
          id: 'ms_2_2',
          title: 'Delivery of Stream Analytics',
          percentage: 40,
          amountCents: 72000,
          isPaid: false,
          dueDate: DateTime.now().add(const Duration(days: 10)),
        ),
      ],
    ),
    SponsorshipApplication(
      id: 'app_3',
      talent: talentPool[2], // Velvet Horizon
      sponsorId: 'sponsor_org_apex',
      eventName: 'East Coast Fall Residency',
      venueName: 'Brooklyn Steel',
      city: 'New York, NY',
      eventDate: DateTime.now().add(const Duration(days: 20)),
      proposalText:
          'Sold-out two-night residency in Williamsburg. We would love to feature Apex as the exclusive headphone and studio gear sponsor for our VIP lounge and live show.',
      proposedCompensationCents: 520000, // $5,200.00
      deliverables: const [
        'Branded listening station in Brooklyn Steel mezzanine',
        'Exclusive backstage rehearsal video with Apex endorsement',
        '4x Social media stories with direct purchase tracking links',
        'Sponsor logo projected on stage backdrop during intermissions',
      ],
      status: ApplicationStatus.active,
      milestones: [
        PaymentMilestone(
          id: 'ms_3_1',
          title: 'Initial Deposit (Paid)',
          percentage: 50,
          amountCents: 260000,
          isPaid: true,
          dueDate: DateTime.now().subtract(const Duration(days: 5)),
        ),
        PaymentMilestone(
          id: 'ms_3_2',
          title: 'Show Completion Payout',
          percentage: 50,
          amountCents: 260000,
          isPaid: false,
          dueDate: DateTime.now().add(const Duration(days: 22)),
        ),
      ],
    ),
    SponsorshipApplication(
      id: 'app_4',
      talent: talentPool[3], // The Midnight Static
      sponsorId: 'sponsor_org_apex',
      eventName: 'Summer Heat Showcase',
      venueName: 'Exit/In',
      city: 'Nashville, TN',
      eventDate: DateTime.now().subtract(const Duration(days: 15)),
      proposalText:
          'High voltage rock showcase for local festival showcase series.',
      proposedCompensationCents: 120000, // $1,200.00
      deliverables: const [
        'Flyer sponsor logo imprint',
        '1x Instagram reel with artist playing gear',
      ],
      status: ApplicationStatus.completed,
      milestones: [
        PaymentMilestone(
          id: 'ms_4_1',
          title: 'Full Payout (Completed)',
          percentage: 100,
          amountCents: 120000,
          isPaid: true,
          dueDate: DateTime.now().subtract(const Duration(days: 14)),
        ),
      ],
    ),
  ];

  static final List<SponsorMessageThread> messageThreads = [
    SponsorMessageThread(
      id: 'thread_1',
      participantName: 'Luna Valente (Luna & The Echoes)',
      participantRole: 'Lead Vocalist / Band Manager',
      category: 'talent',
      lastMessage:
          'We uploaded the updated stage plot and banner dimensions for Empire Control Room!',
      lastMessageTime: DateTime.now().subtract(const Duration(minutes: 18)),
      unreadCount: 2,
      isOnline: true,
      avatarUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150',
      messages: [
        SponsorChatMessage(
          id: 'm1_1',
          senderName: 'Luna Valente',
          text: 'Hi Apex team! Thanks for considering our proposal for the Austin show.',
          timestamp: DateTime.now().subtract(const Duration(hours: 3)),
          isFromMe: false,
        ),
        SponsorChatMessage(
          id: 'm1_2',
          senderName: 'Apex Audio',
          text: 'Excited about the tour! Can you send over the specific banner specs?',
          timestamp: DateTime.now().subtract(const Duration(hours: 2)),
          isFromMe: true,
        ),
        SponsorChatMessage(
          id: 'm1_3',
          senderName: 'Luna Valente',
          text:
              'We uploaded the updated stage plot and banner dimensions for Empire Control Room!',
          timestamp: DateTime.now().subtract(const Duration(minutes: 18)),
          isFromMe: false,
          attachmentName: 'Empire_Stage_Specs_2026.pdf',
          attachmentType: 'pdf',
        ),
      ],
    ),
    SponsorMessageThread(
      id: 'thread_2',
      participantName: 'Marcus Cole (Velvet Horizon)',
      participantRole: 'Tour Director',
      category: 'talent',
      lastMessage: 'The listening station in Brooklyn Steel looks incredible! First rehearsal starts at 4 PM.',
      lastMessageTime: DateTime.now().subtract(const Duration(hours: 2)),
      unreadCount: 0,
      isOnline: true,
      avatarUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=150',
      messages: [
        SponsorChatMessage(
          id: 'm2_1',
          senderName: 'Apex Audio',
          text: 'Marcus, how are the headphones performing in the VIP lounge?',
          timestamp: DateTime.now().subtract(const Duration(hours: 4)),
          isFromMe: true,
        ),
        SponsorChatMessage(
          id: 'm2_2',
          senderName: 'Marcus Cole',
          text: 'The listening station in Brooklyn Steel looks incredible! First rehearsal starts at 4 PM.',
          timestamp: DateTime.now().subtract(const Duration(hours: 2)),
          isFromMe: false,
        ),
      ],
    ),
    SponsorMessageThread(
      id: 'thread_3',
      participantName: 'Empire Control Room Box Office',
      participantRole: 'Venue Operations Manager',
      category: 'venue',
      lastMessage: 'Confirmed sponsor guest list: 6 VIP wristbands are ready at Will Call under Apex Audio.',
      lastMessageTime: DateTime.now().subtract(const Duration(hours: 5)),
      unreadCount: 0,
      isOnline: false,
      avatarUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150',
      messages: [
        SponsorChatMessage(
          id: 'm3_1',
          senderName: 'Empire Ops',
          text: 'Confirmed sponsor guest list: 6 VIP wristbands are ready at Will Call under Apex Audio.',
          timestamp: DateTime.now().subtract(const Duration(hours: 5)),
          isFromMe: false,
        ),
      ],
    ),
    SponsorMessageThread(
      id: 'thread_4',
      participantName: 'Crowdbeats Sponsor Concierge',
      participantRole: 'Platform Specialist',
      category: 'support',
      lastMessage: 'Your Stripe Corporate ACH auto-deposit has been verified for Q4 campaigns.',
      lastMessageTime: DateTime.now().subtract(const Duration(days: 1)),
      unreadCount: 0,
      isOnline: true,
      avatarUrl: null,
      messages: [
        SponsorChatMessage(
          id: 'm4_1',
          senderName: 'Crowdbeats Concierge',
          text: 'Your Stripe Corporate ACH auto-deposit has been verified for Q4 campaigns. Let us know if you need assistance generating custom contract templates.',
          timestamp: DateTime.now().subtract(const Duration(days: 1)),
          isFromMe: false,
        ),
      ],
    ),
  ];

  static const List<TeamMember> teamMembers = [
    TeamMember(
      id: 'tm_1',
      name: 'Elena Rostova',
      email: 'elena@apexsound.io',
      role: 'Sponsor Admin / Marketing VP',
      avatarInitials: 'ER',
      avatarColor: Color(0xFF7C3AED),
    ),
    TeamMember(
      id: 'tm_2',
      name: 'Derek Chen',
      email: 'derek@apexsound.io',
      role: 'Brand Partnerships Manager',
      avatarInitials: 'DC',
      avatarColor: Color(0xFF38BDF8),
    ),
    TeamMember(
      id: 'tm_3',
      name: 'Sonia Patel',
      email: 'sonia@apexsound.io',
      role: 'Finance & Payments Controller',
      avatarInitials: 'SP',
      avatarColor: Color(0xFF10B981),
    ),
  ];

  static final List<SponsorContractDocument> contracts = [
    SponsorContractDocument(
      id: 'doc_1',
      title: 'Headline Stage Sponsorship Agreement — Empire Control Room',
      talentOrVenue: 'Luna & The Echoes',
      date: DateTime.now().subtract(const Duration(days: 2)),
      status: 'Signed',
      fileSize: '2.4 MB',
      documentType: 'Sponsorship Agreement',
    ),
    SponsorContractDocument(
      id: 'doc_2',
      title: 'VIP Lounge Exclusive Brand Rider & Technical Spec',
      talentOrVenue: 'Velvet Horizon',
      date: DateTime.now().subtract(const Duration(days: 14)),
      status: 'Signed',
      fileSize: '1.8 MB',
      documentType: 'Rider Addendum',
    ),
    SponsorContractDocument(
      id: 'doc_3',
      title: 'Mutual Non-Disclosure Agreement for Unreleased Hardware',
      talentOrVenue: 'Kai Rivera',
      date: DateTime.now().subtract(const Duration(days: 30)),
      status: 'Signed',
      fileSize: '410 KB',
      documentType: 'NDA',
    ),
  ];

  static final List<SponsorInvoiceReceipt> invoices = [
    SponsorInvoiceReceipt(
      id: 'inv_101',
      invoiceNumber: 'INV-2026-0891',
      description: 'Velvet Horizon — Milestone 1 Upfront Deposit',
      amountCents: 260000,
      date: DateTime.now().subtract(const Duration(days: 5)),
      status: 'Paid',
      paymentMethod: 'Stripe ACH · Chase Bank (•••• 8921)',
    ),
    SponsorInvoiceReceipt(
      id: 'inv_102',
      invoiceNumber: 'INV-2026-0854',
      description: 'The Midnight Static — Full Sponsorship Execution',
      amountCents: 120000,
      date: DateTime.now().subtract(const Duration(days: 14)),
      status: 'Paid',
      paymentMethod: 'Corporate Visa (•••• 4242)',
    ),
    SponsorInvoiceReceipt(
      id: 'inv_103',
      invoiceNumber: 'INV-2026-0792',
      description: 'Crowdbeats Platform Placement & Analytics Fee — Q3',
      amountCents: 45000,
      date: DateTime.now().subtract(const Duration(days: 28)),
      status: 'Paid',
      paymentMethod: 'Stripe ACH · Chase Bank (•••• 8921)',
    ),
  ];
}
