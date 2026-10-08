// Crowdbeats V2 — Sponsor Mobile Shell & Tabs Widget Tests
// Verifies 5-tab persistent glassmorphic navigation, contextual header,
// BudgetOverviewCard, Discover filters, Sponsorships pipeline, and Messages.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/sponsor/sponsor_shell.dart';
import 'package:crowdbeats_mobile/ui/sponsor/widgets/budget_overview_card.dart';
import 'package:crowdbeats_mobile/ui/sponsor/widgets/active_performances_carousel.dart';
import 'package:crowdbeats_mobile/ui/sponsor/widgets/recent_requests_list.dart';
import 'package:crowdbeats_mobile/ui/sponsor/widgets/performer_spotlight_card.dart';
import 'package:crowdbeats_mobile/ui/sponsor/widgets/sponsorship_list_item.dart';

void main() {
  testWidgets('SponsorShell mounts with 5 navigation destinations and header', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: SponsorShell(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify header components
    expect(find.text('Apex Audio & Gear'), findsOneWidget);
    expect(find.text('HEADLINE BRAND PARTNER'), findsOneWidget);

    // Verify 5 bottom navigation tabs
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Discover'), findsOneWidget);
    expect(find.text('Deals'), findsOneWidget);
    expect(find.text('Messages'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // Verify Home tab widgets are rendered
    expect(find.byType(BudgetOverviewCard), findsOneWidget);
    expect(find.byType(ActivePerformancesCarousel), findsOneWidget);
    await tester.drag(find.byType(ListView).first, const Offset(0, -350));
    await tester.pumpAndSettle();
    expect(find.byType(RecentRequestsList), findsOneWidget);
  });

  testWidgets('Switching tabs in SponsorShell reveals Discover and Deals pipeline', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: SponsorShell(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Tap Discover tab
    await tester.tap(find.text('Discover'));
    await tester.pumpAndSettle();

    expect(find.text('Talent & Venue Discovery'), findsOneWidget);
    expect(find.byType(PerformerSpotlightCard), findsWidgets);

    // Tap Deals (Sponsorships) tab
    await tester.tap(find.text('Deals'));
    await tester.pumpAndSettle();

    expect(find.text('Sponsorship Pipeline'), findsOneWidget);
    expect(find.text('Under Review'), findsWidgets);
    expect(find.text('Active'), findsOneWidget);
    expect(find.text('Completed'), findsOneWidget);
    expect(find.byType(SponsorshipListItem), findsWidgets);

    // Tap Messages tab
    await tester.tap(find.text('Messages'));
    await tester.pumpAndSettle();

    expect(find.text('Sponsor Communications'), findsOneWidget);

    // Tap Profile tab
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Authorized Team Members'), findsOneWidget);
    expect(find.text('Billing & Corporate Payments'), findsOneWidget);
  });
}
