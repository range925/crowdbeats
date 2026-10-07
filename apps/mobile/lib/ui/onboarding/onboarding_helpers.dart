// Crowdbeats V2 — Onboarding Form Helper (Phase 5)
// Shared widget + callable helper used by all persona onboarding screens.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../state/auth_state.dart';
import '../../firebase/auth_service.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';

/// Calls the onCompleteOnboarding Cloud Function and navigates to the persona dashboard.
Future<void> completeOnboarding({
  required WidgetRef ref,
  required BuildContext context,
  required String personaType,
  required String displayName,
  Map<String, dynamic>? profileData,
  required void Function(String) onError,
}) async {
  final functions = FirebaseFunctions.instanceFor(region: 'us-central1');
  // Connect to emulator
  functions.useFunctionsEmulator('127.0.0.1', 5001);

  try {
    final callable = functions.httpsCallable('onCompleteOnboarding');
    final payload = <String, dynamic>{
      'personaType':    personaType,
      'displayName':    displayName.trim(),
      'consentVersion': '2026-08-25',
    };
    if (profileData != null) payload['profileData'] = profileData;
    await callable.call<Map<String, dynamic>>(payload);

    // Force token refresh to pick up new custom claim
    await AuthService.instance.getIdTokenResult(forceRefresh: true);
    await ref.read(authNotifierProvider.notifier).reloadUser();

    if (context.mounted) context.go('/$personaType');
  } on FirebaseFunctionsException catch (e) {
    onError(e.message ?? 'Setup failed. Please try again.');
  } catch (_) {
    onError('Setup failed. Please try again.');
  }
}

/// Shared scaffold for all onboarding profile forms.
class OnboardingFormShell extends StatelessWidget {
  final String title;
  final String icon;
  final String subtitle;
  final Widget child;

  const OnboardingFormShell({
    super.key,
    required this.title,
    required this.icon,
    required this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(CbSpacing.s6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(icon, style: const TextStyle(fontSize: 56), textAlign: TextAlign.center),
              const SizedBox(height: CbSpacing.s3),
              Text(title, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700), textAlign: TextAlign.center),
              const SizedBox(height: CbSpacing.s2),
              Text(subtitle, style: theme.textTheme.bodyMedium?.copyWith(color: CbColors.textSecondary), textAlign: TextAlign.center),
              const SizedBox(height: CbSpacing.s8),
              child,
            ],
          ),
        ),
      ),
    );
  }
}
