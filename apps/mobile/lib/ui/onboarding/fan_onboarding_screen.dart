// Crowdbeats V2 — Fan Onboarding Entry Screen (Stitch Authority 5326179813018056505)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'fan/fan_onboarding_wizard.dart';

class FanOnboardingScreen extends ConsumerWidget {
  const FanOnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const FanOnboardingWizard();
  }
}
