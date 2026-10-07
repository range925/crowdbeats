// Crowdbeats V2 — Stitch Authoritative Linear Step Indicator (Project 5326179813018056505)
// 4-step progress header displaying completed checkmarks, current active step, and pending steps.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';

class CbLinearStepIndicator extends StatelessWidget {
  const CbLinearStepIndicator({
    super.key,
    required this.currentStep,
    this.totalSteps = 4,
    this.stepLabels = const ['Basic Info', 'Your Preferences', 'Profile Details', 'Review'],
  });

  final int currentStep; // 1-indexed (1 to totalSteps)
  final int totalSteps;
  final List<String> stepLabels;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Circles and connecting bars
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(totalSteps, (index) {
            final int stepNumber = index + 1;
            final bool isCompleted = stepNumber < currentStep;
            final bool isActive = stepNumber == currentStep;

            return Expanded(
              child: Row(
                children: [
                  // Step Indicator Circle
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: isCompleted || isActive
                          ? CbColors.purpleMain
                          : CbColors.surface3,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isCompleted || isActive
                            ? CbColors.purpleLight
                            : CbColors.borderSubtle,
                        width: 1.5,
                      ),
                      boxShadow: isActive
                          ? const [
                              BoxShadow(
                                color: CbColors.purpleGlow,
                                blurRadius: 10,
                                spreadRadius: 1,
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: isCompleted
                          ? const Icon(Icons.check, size: 14, color: Colors.white)
                          : Text(
                              '$stepNumber',
                              style: TextStyle(
                                color: isActive ? Colors.white : CbColors.textMuted,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                  // Connector Line (if not last step)
                  if (index < totalSteps - 1)
                    Expanded(
                      child: Container(
                        height: 2,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        color: isCompleted
                            ? CbColors.purpleMain
                            : CbColors.borderSubtle,
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
        const SizedBox(height: 8),
        // Active Step Label
        if (currentStep <= stepLabels.length)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                stepLabels[currentStep - 1],
                style: const TextStyle(
                  color: CbColors.purpleLight,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                'Step $currentStep of $totalSteps',
                style: const TextStyle(
                  color: CbColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
      ],
    );
  }
}
