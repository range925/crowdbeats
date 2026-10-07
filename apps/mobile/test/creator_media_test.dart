// Crowdbeats V2 — Creator Media Library & Photos Test Suite
// Verifies Solo Musician and Band Studio Media Library features:
// Dual context header, filters, upload dialog, primary EPK selector,
// stage banner selector, deletion, and studio tab navigation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/media/creator_media_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/studio/creator_studio_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/creator_shell.dart';

void main() {
  group('Creator Media Library & Photos Tests', () {
    testWidgets('Renders in Solo Musician mode with Elena Cruz context and default assets', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorMediaScreen(
              isBand: false,
              entityId: 'artist_elena_cruz',
              entityName: 'Elena Cruz',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header & Context
      expect(find.text('Media Library & Press Kit'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz'), findsOneWidget);
      expect(find.text('High-Resolution Press Assets'), findsOneWidget);

      // Default solo media assets
      expect(find.text('Studio EPK Headshot'), findsOneWidget);
      expect(find.text('Sunset Lounge Stage Shot'), findsOneWidget);
      expect(find.text('Acoustic Encore Video Clip'), findsOneWidget);
      expect(find.text('Casbah Band Promo Photo'), findsOneWidget);
      expect(find.text('Elena Cruz Live Cover Banner'), findsOneWidget);

      // Badges
      expect(find.text('PRIMARY HEADSHOT'), findsOneWidget);
      expect(find.text('STAGE BANNER'), findsOneWidget);
    });

    testWidgets('Renders in Band Studio mode with Midnight Echoes context and band assets', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorMediaScreen(
              isBand: true,
              entityId: 'band_midnight_echoes',
              entityName: 'The Midnight Echoes',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header & Context
      expect(find.text('Media Library & Press Kit'), findsOneWidget);
      expect(find.text('BAND STUDIO'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);

      // Band-specific banner
      expect(find.text('Midnight Echoes Stage Banner'), findsOneWidget);
      expect(find.text('STAGE BANNER'), findsOneWidget);
    });

    testWidgets('Filter chips filter gallery items by type', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorMediaScreen(
              isBand: false,
              entityId: 'artist_test',
              entityName: 'Test Artist',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Videos filter
      final videoFilter = find.text('Videos (1)');
      expect(videoFilter, findsOneWidget);
      await tester.tap(videoFilter);
      await tester.pumpAndSettle();

      // Should show video clip but hide photos
      expect(find.text('Acoustic Encore Video Clip'), findsOneWidget);
      expect(find.text('Studio EPK Headshot'), findsNothing);

      // Tap Photos filter
      final photosFilter = find.text('Photos (3)');
      expect(photosFilter, findsOneWidget);
      await tester.tap(photosFilter);
      await tester.pumpAndSettle();

      expect(find.text('Studio EPK Headshot'), findsOneWidget);
      expect(find.text('Acoustic Encore Video Clip'), findsNothing);
    });

    testWidgets('Asset options sheet allows setting as Primary EPK Headshot with SnackBar', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorMediaScreen(
              isBand: false,
              entityId: 'artist_elena_cruz',
              entityName: 'Elena Cruz',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap on second photo "Sunset Lounge Stage Shot"
      await tester.tap(find.text('Sunset Lounge Stage Shot'));
      await tester.pumpAndSettle();

      // Tap "Set as Primary EPK Headshot"
      final setPrimaryOption = find.text('Set as Primary EPK Headshot');
      expect(setPrimaryOption, findsOneWidget);
      await tester.tap(setPrimaryOption);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Check SnackBar confirmation
      expect(find.text('Sunset Lounge Stage Shot set as Primary EPK Headshot!'), findsOneWidget);
    });

    testWidgets('Upload dialog opens and publishes new asset to media library', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorMediaScreen(
              isBand: false,
              entityId: 'artist_elena_cruz',
              entityName: 'Elena Cruz',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap "Add Media"
      final addMediaBtn = find.text('Add Media');
      expect(addMediaBtn, findsOneWidget);
      await tester.tap(addMediaBtn);
      await tester.pumpAndSettle();

      // Verify modal opened
      expect(find.text('Upload Media Asset'), findsOneWidget);
      expect(find.text('Publishing to Elena Cruz Press Kit'), findsOneWidget);

      // Enter asset title
      await tester.enterText(find.byType(TextField), 'Red Rocks Amphitheater Gig');
      await tester.pumpAndSettle();

      // Tap Publish button
      final publishBtn = find.text('Publish Asset to Cloud');
      expect(publishBtn, findsOneWidget);
      await tester.tap(publishBtn);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Verify new asset appears in gallery and SnackBar is shown
      expect(find.text('Published "Red Rocks Amphitheater Gig" to Elena Cruz Media Library!'), findsOneWidget);
      expect(find.text('Red Rocks Amphitheater Gig'), findsOneWidget);
    });

    testWidgets('CreatorStudioTab navigates to CreatorMediaScreen when Media Library & Photos is tapped', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorShell(initialTab: 4),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final mediaTile = find.text('Media Library & Photos');
      expect(mediaTile, findsOneWidget);

      await tester.tap(mediaTile);
      await tester.pumpAndSettle();

      // Verify on CreatorMediaScreen with Solo context
      expect(find.text('Media Library & Press Kit'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz (Solo)'), findsOneWidget);
    });
  });
}
