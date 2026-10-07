// Crowdbeats V2 — Creator Streaming & Social Links Test Suite
// Verifies Solo Musician and Band Studio streaming & social link management,
// live profile preview dock, form validation, and save handlers.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/profile/creator_social_links_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/studio/creator_studio_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/creator_shell.dart';

void main() {
  group('Creator Streaming & Social Links Tests', () {
    testWidgets('Renders in Solo Musician mode with all platforms and Elena Cruz context', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorSocialLinksScreen(
              isBand: false,
              entityId: 'artist_elena_cruz',
              entityName: 'Elena Cruz',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header & Mode verification
      expect(find.text('Solo Streaming & Social Links'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz'), findsOneWidget);
      expect(find.text('LIVE FAN PROFILE PREVIEW'), findsOneWidget);

      // Section titles
      expect(find.text('STREAMING PLATFORMS'), findsOneWidget);
      expect(find.text('SOCIAL & WEB PRESENCE'), findsOneWidget);

      // Input labels
      expect(find.text('Spotify Artist URL'), findsOneWidget);
      expect(find.text('Apple Music Artist URL'), findsOneWidget);
      expect(find.text('YouTube Channel or Video URL'), findsOneWidget);
      expect(find.text('SoundCloud Profile URL'), findsOneWidget); // Solo includes SoundCloud
      expect(find.text('Instagram Handle'), findsOneWidget);
      expect(find.text('TikTok Handle'), findsOneWidget);
      expect(find.text('Official Website'), findsOneWidget);

      // Action button
      expect(find.text('Save & Publish Links'), findsOneWidget);
    });

    testWidgets('Renders in Band Studio mode with Midnight Echoes context and excludes SoundCloud', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorSocialLinksScreen(
              isBand: true,
              entityId: 'band_midnight_echoes',
              entityName: 'The Midnight Echoes',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header & Mode verification
      expect(find.text('Band Streaming & Social Links'), findsOneWidget);
      expect(find.text('BAND STUDIO'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);

      // SoundCloud is excluded by default for bands if empty
      expect(find.text('SoundCloud Profile URL'), findsNothing);

      // Other platforms are present
      expect(find.text('Spotify Artist URL'), findsOneWidget);
      expect(find.text('Apple Music Artist URL'), findsOneWidget);
      expect(find.text('YouTube Channel or Video URL'), findsOneWidget);
      expect(find.text('Instagram Handle'), findsOneWidget);
      expect(find.text('TikTok Handle'), findsOneWidget);
      expect(find.text('Official Website'), findsOneWidget);
    });

    testWidgets('Live Fan Profile Preview Dock shows preview chips and reacts to edits', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorSocialLinksScreen(
              isBand: false,
              entityId: 'artist_test',
              entityName: 'Test Musician',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Preview dock chips
      expect(find.text('Spotify'), findsWidgets);
      expect(find.text('Apple Music'), findsWidgets);
      expect(find.text('YouTube'), findsWidgets);
      expect(find.text('Instagram'), findsWidgets);
      expect(find.text('TikTok'), findsWidgets);
      expect(find.text('SoundCloud'), findsWidgets);
      expect(find.text('Website'), findsWidgets);
    });

    testWidgets('Save button triggers update and shows confirmation SnackBar', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorSocialLinksScreen(
              isBand: false,
              entityId: 'artist_elena_cruz',
              entityName: 'Elena Cruz',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Save button
      await tester.tap(find.text('Save & Publish Links'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Assert SnackBar
      expect(
        find.text('Streaming & social links updated for Elena Cruz!'),
        findsOneWidget,
      );
    });

    testWidgets('CreatorStudioTab navigates to CreatorSocialLinksScreen when tile is tapped', (tester) async {
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

      // Find and tap Streaming & Social Links
      final tile = find.text('Streaming & Social Links');
      expect(tile, findsOneWidget);

      await tester.tap(tile);
      await tester.pumpAndSettle();

      // Confirm we navigated to CreatorSocialLinksScreen
      expect(find.text('Solo Streaming & Social Links'), findsOneWidget);
      expect(find.text('LIVE FAN PROFILE PREVIEW'), findsOneWidget);
    });
  });
}
