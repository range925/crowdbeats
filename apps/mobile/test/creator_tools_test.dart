// Crowdbeats V2 — Phase 5 Creator Tools & Modules Test Suite
// Tests Crowdfunding wizard & tiers, EPK profile editor, Media library, and Fan directory.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/campaigns/creator_campaigns_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/profile/creator_epk_editor_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/media/creator_media_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/fans/creator_fans_tab.dart';

void main() {
  group('Phase 5 — Creator Crowdfunding, EPK, Media & Fans Tests', () {
    testWidgets('CreatorCampaignsTab renders active campaign, progress, and reward tiers', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorCampaignsTab(),
        ),
      );

      expect(find.text('CROWDFUNDING'), findsOneWidget);
      expect(find.text('New Campaign'), findsOneWidget);
      expect(find.text('Debut Studio Album & Vinyl Pressing'), findsOneWidget);
      expect(find.text('REWARD TIERS (ACTIVE)'), findsOneWidget);
      expect(find.text('Signed Limited Edition Vinyl'), findsOneWidget);
      expect(find.text(r'$45'), findsOneWidget);
    });

    testWidgets('CreatorEpkEditorScreen allows editing bio, selecting genres, and saving', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorEpkEditorScreen(),
          ),
        ),
      );

      expect(find.text('Public EPK Profile Editor'), findsOneWidget);
      expect(find.text('STAGE / BAND NAME'), findsOneWidget);
      expect(find.text('GENRES (SELECT UP TO 3)'), findsOneWidget);
      expect(find.text('Indie'), findsOneWidget);
      expect(find.text('Acoustic'), findsOneWidget);
      expect(find.text('Save & Publish EPK'), findsOneWidget);
    });

    testWidgets('CreatorMediaScreen displays press photos, video assets and upload action', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorMediaScreen(),
        ),
      );

      expect(find.text('Media Library & Press Kit'), findsOneWidget);
      expect(find.text('High-Resolution Press Assets'), findsOneWidget);
      expect(find.text('Studio EPK Headshot'), findsOneWidget);
      expect(find.text('PRIMARY HEADSHOT'), findsOneWidget);
      expect(find.text('Sunset Lounge Stage Shot'), findsOneWidget);
    });

    testWidgets('CreatorFansTab displays followers, top tippers, and broadcast action', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorFansTab(),
        ),
      );

      expect(find.text('FAN COMMUNITY'), findsOneWidget);
      expect(find.text('Broadcast'), findsOneWidget);
      expect(find.text('Followers (342)'), findsOneWidget);
      expect(find.text('Top Tippers'), findsOneWidget);
      expect(find.text('Backers (28)'), findsOneWidget);
      expect(find.text('Sarah Jenkins'), findsOneWidget);
    });
  });
}
