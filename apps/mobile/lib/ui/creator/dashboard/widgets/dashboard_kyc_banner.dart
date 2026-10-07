// Crowdbeats V2 — Dashboard Stripe Connect KYC Banner (Phase 3)
// Alerts creators when direct deposit verification is pending or required.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class DashboardKycBanner extends StatelessWidget {
  const DashboardKycBanner({
    super.key,
    required this.kycStatus,
    required this.onSetupPayouts,
  });

  final String kycStatus;
  final VoidCallback onSetupPayouts;

  @override
  Widget build(BuildContext context) {
    if (kycStatus == 'verified') return const SizedBox.shrink();

    final isRestricted = kycStatus == 'restricted';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: CbGlassCard(
        borderColor: isRestricted ? const Color(0x66EF4444) : const Color(0x66F59E0B),
        backgroundColor: isRestricted ? const Color(0x22EF4444) : const Color(0x22F59E0B),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isRestricted ? const Color(0x33EF4444) : const Color(0x33F59E0B),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isRestricted ? Icons.warning_amber_rounded : Icons.account_balance,
                color: isRestricted ? CbColors.statusError : CbColors.rankGold,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isRestricted ? 'Payouts Restricted' : 'Complete Stripe KYC Verification',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isRestricted
                        ? 'Verification documents required to enable instant bank transfers.'
                        : 'Connect your bank account to receive direct deposit earnings.',
                    style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: isRestricted ? CbColors.statusError : CbColors.purpleMain,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
              ),
              onPressed: onSetupPayouts,
              child: const Text('Verify', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
