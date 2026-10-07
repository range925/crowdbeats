// Crowdbeats V2 — NearbySecondaryView
//
// Dedicated secondary screen opened upon tapping "Nearby" or expanding the compact map.
// Seamlessly delegates to NearbyTab with isSecondaryView: true to render a unified,
// non-duplicated header with back navigation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../tabs/nearby_tab.dart';

class NearbySecondaryView extends ConsumerWidget {
  const NearbySecondaryView({super.key});

  static Route<void> route() {
    return MaterialPageRoute<void>(
      builder: (_) => const NearbySecondaryView(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const NearbyTab(isSecondaryView: true);
  }
}
