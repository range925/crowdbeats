// Crowdbeats V2 — Role-Aware Creator Home Tab (Phase 3)
// Dynamically switches between SoloMusicianDashboard and BandMobileDashboard based on active context.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/creator_context_state.dart';
import 'solo_musician_dashboard.dart';
import 'band_mobile_dashboard.dart';

class CreatorHomeTab extends ConsumerWidget {
  const CreatorHomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contextState = ref.watch(creatorContextProvider);

    if (contextState.isBand) {
      return const BandMobileDashboard();
    }
    return const SoloMusicianDashboard();
  }
}
