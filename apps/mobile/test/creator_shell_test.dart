// Crowdbeats V2 — Shared Creator Shell Test Suite (Phase 2)
// Tests 5-tab navigation, tab state preservation, context switching, conflict protection, and studio capability rendering.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/creator/creator_shell.dart';

void main() {
  group('Phase 2 — Shared Creator Shell Navigation & Context Tests', () {
    testWidgets('CreatorShell renders persistent 5-tab navigation bar', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorShell(),
          ),
        ),
      );

      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Live'), findsOneWidget);
      expect(find.text('Campaigns'), findsOneWidget);
      expect(find.text('Inbox'), findsOneWidget);
      expect(find.text('Studio'), findsOneWidget);
      expect(find.text('Go Live'), findsOneWidget);
    });

    testWidgets('Switching tabs preserves state and switches active view', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorShell(),
          ),
        ),
      );

      await tester.tap(find.text('Studio'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('1. PROFILE & BRANDING'), findsOneWidget);
      expect(find.text('Public EPK Profile Editor'), findsOneWidget);
      expect(find.text('2. MONETIZATION & FINANCE'), findsOneWidget);

      await tester.tap(find.text('Live'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Ready to take the stage?'), findsOneWidget);
      expect(find.text('Check In & Go Live'), findsOneWidget);
    });

    testWidgets('Context Switcher toggles between Solo and Band and updates Studio capabilities', (tester) async {
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

      expect(find.text('Solo Creator Studio'), findsOneWidget);
      expect(find.text('4. COLLABORATION & GOVERNANCE'), findsNothing);

      await tester.tap(find.text('Elena Cruz (Solo)'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Switch Creator Context'), findsOneWidget);

      await tester.tap(find.text('The Midnight Echoes').last);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Band Studio Configuration'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsWidgets);
      expect(find.text('4. COLLABORATION & GOVERNANCE'), findsOneWidget);
      expect(find.text('Band Members & Roles'), findsOneWidget);
      expect(find.text('Band Split Governance'), findsOneWidget);
    });

    testWidgets('Live session conflict protection prevents switching when live', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      container.read(creatorContextProvider.notifier).setLiveStatus(true);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: CreatorShell(),
          ),
        ),
      );

      expect(find.text('LIVE'), findsWidgets);

      final success = container.read(creatorContextProvider.notifier).switchContext(
            const CreatorContextItem(
              id: 'band_midnight',
              name: 'The Midnight Echoes',
              type: 'band',
              role: 'BAND_FOUNDER',
            ),
          );

      expect(success, isFalse);
      expect(container.read(creatorContextProvider).activeContext.id, equals('solo_default'));
      expect(container.read(creatorContextProvider).conflictError, isNotNull);
    });

    testWidgets('Studio capability item opens Phase modal sheet', (tester) async {
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

      await tester.tap(find.text('Verification & Trust Badges'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Scheduled for Phase 5 Implementation'), findsOneWidget);
      expect(find.text('Close Preview'), findsOneWidget);

      await tester.tap(find.text('Close Preview'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Scheduled for Phase 5 Implementation'), findsNothing);
    });
  });
}
