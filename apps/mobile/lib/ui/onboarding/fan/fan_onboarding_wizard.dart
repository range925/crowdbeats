// Crowdbeats V2 — Fan Onboarding Master Wizard Coordinator (Stitch Authority 5326179813018056505)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../onboarding_helpers.dart';
import 'fan_onboarding_model.dart';
import 'fan_onboarding_step1_screen.dart';
import 'fan_onboarding_step2_screen.dart';
import 'fan_onboarding_step3_screen.dart';
import 'fan_onboarding_step4_review_screen.dart';
import 'fan_onboarding_complete_screen.dart';

class FanOnboardingWizard extends ConsumerStatefulWidget {
  const FanOnboardingWizard({super.key});

  @override
  ConsumerState<FanOnboardingWizard> createState() => _FanOnboardingWizardState();
}

class _FanOnboardingWizardState extends ConsumerState<FanOnboardingWizard> {
  int _currentStep = 1;
  final FanOnboardingData _data = FanOnboardingData();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _submitProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    await completeOnboarding(
      ref: ref,
      context: context,
      personaType: 'fan',
      displayName: '${_data.firstName} ${_data.lastName}'.trim(),
      profileData: _data.toProfileData(),
      onError: (err) {
        if (mounted) {
          setState(() {
            _errorMessage = err;
            _isLoading = false;
          });
        }
      },
    );

    if (mounted && _errorMessage == null) {
      setState(() {
        _isLoading = false;
        _currentStep = 5; // Step 4 Complete
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (_currentStep) {
      case 1:
        return FanOnboardingStep1Screen(
          data: _data,
          onNext: () => setState(() => _currentStep = 2),
          onBack: () => Navigator.of(context).maybePop(),
        );
      case 2:
        return FanOnboardingStep2Screen(
          data: _data,
          onNext: () => setState(() => _currentStep = 3),
          onBack: () => setState(() => _currentStep = 1),
        );
      case 3:
        return FanOnboardingStep3Screen(
          data: _data,
          onNext: () => setState(() => _currentStep = 4),
          onBack: () => setState(() => _currentStep = 2),
        );
      case 4:
        return FanOnboardingStep4ReviewScreen(
          data: _data,
          isLoading: _isLoading,
          errorMessage: _errorMessage,
          onSubmit: _submitProfile,
          onEditStep: (step) => setState(() => _currentStep = step),
          onBack: () => setState(() => _currentStep = 3),
        );
      case 5:
      default:
        return FanOnboardingCompleteScreen(
          data: _data,
          onExplore: () {
            if (context.mounted) {
              context.go('/fan');
            }
          },
        );
    }
  }
}
