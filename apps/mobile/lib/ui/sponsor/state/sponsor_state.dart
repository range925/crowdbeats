// Crowdbeats V2 — Sponsor Mobile State & Riverpod Notifier
// Manages sponsor organization profile, pipeline applications, talent discovery,
// active performances, messaging threads, and context switching.

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sponsor_models.dart';

@immutable
class SponsorContextItem {
  const SponsorContextItem({
    required this.id,
    required this.name,
    required this.tier,
    required this.industry,
    this.logoInitials = 'AP',
    this.isDefault = false,
  });

  final String id;
  final String name;
  final String tier;
  final String industry;
  final String logoInitials;
  final bool isDefault;
}

@immutable
class SponsorState {
  const SponsorState({
    required this.activeContext,
    required this.availableContexts,
    required this.organization,
    required this.applications,
    required this.talentList,
    required this.performances,
    required this.messageThreads,
    required this.teamMembers,
    required this.contracts,
    required this.invoices,
    this.searchQuery = '',
    this.selectedCategory = 'All',
    this.cityFilter,
    this.minDrawFilter,
  });

  final SponsorContextItem activeContext;
  final List<SponsorContextItem> availableContexts;
  final SponsorOrganization organization;
  final List<SponsorshipApplication> applications;
  final List<TalentProfile> talentList;
  final List<ActivePerformance> performances;
  final List<SponsorMessageThread> messageThreads;
  final List<TeamMember> teamMembers;
  final List<SponsorContractDocument> contracts;
  final List<SponsorInvoiceReceipt> invoices;
  final String searchQuery;
  final String selectedCategory;
  final String? cityFilter;
  final int? minDrawFilter;

  List<SponsorshipApplication> get underReviewApplications =>
      applications.where((a) => a.status == ApplicationStatus.underReview).toList();

  List<SponsorshipApplication> get activeApplications =>
      applications.where((a) => a.status == ApplicationStatus.active).toList();

  List<SponsorshipApplication> get completedApplications =>
      applications.where((a) => a.status == ApplicationStatus.completed).toList();

  int get totalUnreadMessages =>
      messageThreads.fold<int>(0, (sum, t) => sum + t.unreadCount);

  SponsorState copyWith({
    SponsorContextItem? activeContext,
    List<SponsorContextItem>? availableContexts,
    SponsorOrganization? organization,
    List<SponsorshipApplication>? applications,
    List<TalentProfile>? talentList,
    List<ActivePerformance>? performances,
    List<SponsorMessageThread>? messageThreads,
    List<TeamMember>? teamMembers,
    List<SponsorContractDocument>? contracts,
    List<SponsorInvoiceReceipt>? invoices,
    String? searchQuery,
    String? selectedCategory,
    String? cityFilter,
    int? minDrawFilter,
    bool clearCityFilter = false,
    bool clearMinDrawFilter = false,
  }) {
    return SponsorState(
      activeContext: activeContext ?? this.activeContext,
      availableContexts: availableContexts ?? this.availableContexts,
      organization: organization ?? this.organization,
      applications: applications ?? this.applications,
      talentList: talentList ?? this.talentList,
      performances: performances ?? this.performances,
      messageThreads: messageThreads ?? this.messageThreads,
      teamMembers: teamMembers ?? this.teamMembers,
      contracts: contracts ?? this.contracts,
      invoices: invoices ?? this.invoices,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      cityFilter: clearCityFilter ? null : (cityFilter ?? this.cityFilter),
      minDrawFilter: clearMinDrawFilter ? null : (minDrawFilter ?? this.minDrawFilter),
    );
  }
}

class SponsorNotifier extends StateNotifier<SponsorState> {
  SponsorNotifier()
      : super(
          SponsorState(
            activeContext: const SponsorContextItem(
              id: 'sponsor_org_apex',
              name: 'Apex Audio & Gear',
              tier: 'Headline Brand Partner',
              industry: 'Music & Audio Technology',
              logoInitials: 'AA',
              isDefault: true,
            ),
            availableContexts: const [
              SponsorContextItem(
                id: 'sponsor_org_apex',
                name: 'Apex Audio & Gear',
                tier: 'Headline Brand Partner',
                industry: 'Music & Audio Technology',
                logoInitials: 'AA',
                isDefault: true,
              ),
              SponsorContextItem(
                id: 'sponsor_org_apex_live',
                name: 'Apex Live Studios & Tours',
                tier: 'Tour Presenter Partner',
                industry: 'Live Production',
                logoInitials: 'AL',
              ),
              SponsorContextItem(
                id: 'sponsor_org_apex_energy',
                name: 'Apex Pulse Refreshments',
                tier: 'Beverage Stage Sponsor',
                industry: 'Beverages & Lifestyle',
                logoInitials: 'AP',
              ),
            ],
            organization: SponsorMockData.defaultOrg,
            applications: List.from(SponsorMockData.initialApplications),
            talentList: List.from(SponsorMockData.talentPool),
            performances: List.from(SponsorMockData.activePerformances),
            messageThreads: List.from(SponsorMockData.messageThreads),
            teamMembers: List.from(SponsorMockData.teamMembers),
            contracts: List.from(SponsorMockData.contracts),
            invoices: List.from(SponsorMockData.invoices),
          ),
        );

  void switchContext(SponsorContextItem newContext) {
    state = state.copyWith(activeContext: newContext);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setSelectedCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void setFilterCriteria({String? city, int? minDraw}) {
    state = state.copyWith(
      cityFilter: city,
      minDrawFilter: minDraw,
      clearCityFilter: city == null,
      clearMinDrawFilter: minDraw == null,
    );
  }

  void toggleTalentBookmark(String talentId) {
    final updatedTalent = state.talentList.map((t) {
      if (t.id == talentId) {
        return t.copyWith(isBookmarked: !t.isBookmarked);
      }
      return t;
    }).toList();
    state = state.copyWith(talentList: updatedTalent);
  }

  void acceptApplication(String applicationId) {
    final updatedApps = state.applications.map((app) {
      if (app.id == applicationId) {
        return app.copyWith(status: ApplicationStatus.active);
      }
      return app;
    }).toList();

    final targetApp = state.applications.firstWhere((a) => a.id == applicationId);
    final updatedOrg = state.organization.copyWith(
      activeCampaignsCount: state.organization.activeCampaignsCount + 1,
      allocatedBudgetCents:
          state.organization.allocatedBudgetCents + targetApp.proposedCompensationCents,
    );

    state = state.copyWith(
      applications: updatedApps,
      organization: updatedOrg,
    );
  }

  void counterOfferApplication(String applicationId, int counterCents, String note) {
    final updatedApps = state.applications.map((app) {
      if (app.id == applicationId) {
        return app.copyWith(
          counterOfferCents: counterCents,
          counterOfferNote: note,
          status: ApplicationStatus.underReview,
        );
      }
      return app;
    }).toList();

    state = state.copyWith(applications: updatedApps);
  }

  void declineApplication(String applicationId) {
    final updatedApps = state.applications.map((app) {
      if (app.id == applicationId) {
        return app.copyWith(status: ApplicationStatus.declined);
      }
      return app;
    }).toList();

    state = state.copyWith(applications: updatedApps);
  }

  void sendMessage(String threadId, String text) {
    if (text.trim().isEmpty) return;

    final newMsg = SponsorChatMessage(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      senderName: state.activeContext.name,
      text: text.trim(),
      timestamp: DateTime.now(),
      isFromMe: true,
    );

    final updatedThreads = state.messageThreads.map((thread) {
      if (thread.id == threadId) {
        final messages = List<SponsorChatMessage>.from(thread.messages)..add(newMsg);
        return thread.copyWith(
          lastMessage: text.trim(),
          lastMessageTime: DateTime.now(),
          messages: messages,
          unreadCount: 0,
        );
      }
      return thread;
    }).toList();

    state = state.copyWith(messageThreads: updatedThreads);
  }

  void markThreadRead(String threadId) {
    final updatedThreads = state.messageThreads.map((t) {
      if (t.id == threadId) {
        return t.copyWith(unreadCount: 0);
      }
      return t;
    }).toList();
    state = state.copyWith(messageThreads: updatedThreads);
  }

  void offerSponsorship({
    required TalentProfile talent,
    required int amountCents,
    required String eventName,
    required String pitch,
    required List<String> deliverables,
  }) {
    final newApp = SponsorshipApplication(
      id: 'app_${DateTime.now().millisecondsSinceEpoch}',
      talent: talent,
      sponsorId: state.organization.id,
      eventName: eventName,
      venueName: talent.recentVenues.isNotEmpty ? talent.recentVenues.first : 'Featured Arena Stage',
      city: talent.city,
      eventDate: DateTime.now().add(const Duration(days: 14)),
      proposalText: pitch,
      proposedCompensationCents: amountCents,
      deliverables: deliverables,
      status: ApplicationStatus.active,
      milestones: [
        PaymentMilestone(
          id: 'ms_new_1',
          title: 'Initial Contract Execution (50%)',
          percentage: 50,
          amountCents: amountCents ~/ 2,
          isPaid: true,
          dueDate: DateTime.now(),
        ),
        PaymentMilestone(
          id: 'ms_new_2',
          title: 'Show Completion Verification (50%)',
          percentage: 50,
          amountCents: amountCents - (amountCents ~/ 2),
          isPaid: false,
          dueDate: DateTime.now().add(const Duration(days: 15)),
        ),
      ],
    );

    final updatedApps = List<SponsorshipApplication>.from(state.applications)..insert(0, newApp);
    final updatedOrg = state.organization.copyWith(
      activeCampaignsCount: state.organization.activeCampaignsCount + 1,
      spentBudgetCents: state.organization.spentBudgetCents + (amountCents ~/ 2),
      allocatedBudgetCents: state.organization.allocatedBudgetCents + amountCents,
    );

    state = state.copyWith(
      applications: updatedApps,
      organization: updatedOrg,
    );
  }
}

final sponsorProvider = StateNotifierProvider<SponsorNotifier, SponsorState>((ref) {
  return SponsorNotifier();
});
