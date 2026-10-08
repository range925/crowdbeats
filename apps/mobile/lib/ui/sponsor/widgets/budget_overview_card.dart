// Crowdbeats V2 — Sponsor Budget Overview Card
// Displays Allocated vs. Spent budget with progress bar, financial breakdown,
// and quick budget actions. All amounts handled in integer minor units (cents).

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';

class BudgetOverviewCard extends StatelessWidget {
  const BudgetOverviewCard({
    super.key,
    required this.organization,
    this.onManageBudget,
  });

  final SponsorOrganization organization;
  final VoidCallback? onManageBudget;

  @override
  Widget build(BuildContext context) {
    final progress = organization.spentProgress;
    final progressPercent = (progress * 100).toInt();

    return Container(
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        border: Border.all(
          color: const Color(0x2BFFFFFF),
          width: 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(CbSpacing.s5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: CbColors.purpleDim,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      border: Border.all(color: const Color(0x338B5CF6)),
                    ),
                    child: const Icon(
                      Icons.account_balance_wallet_outlined,
                      color: CbColors.purpleLight,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total Campaign Budget',
                        style: TextStyle(
                          color: CbColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        formatCurrencyCents(organization.totalBudgetCents),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              // Manage Button (Min 48x48 touch target)
              Semantics(
                button: true,
                label: 'Manage Budget',
                child: SizedBox(
                  height: 48,
                  child: TextButton.icon(
                    onPressed: onManageBudget ?? () => _showManageBudgetSheet(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      backgroundColor: CbColors.surface2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        side: const BorderSide(color: Color(0x1FFFFFFF)),
                      ),
                    ),
                    icon: const Icon(Icons.tune, color: CbColors.purpleLight, size: 16),
                    label: const Text(
                      'Manage',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: CbSpacing.s4),

          // Visual Progress Bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: CbColors.purpleLight,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Spent: $progressPercent%',
                        style: const TextStyle(
                          color: CbColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Flexible(
                    child: Text(
                      '${formatCurrencyCents(organization.spentBudgetCents)} of ${formatCurrencyCents(organization.totalBudgetCents)}',
                      style: const TextStyle(
                        color: CbColors.textMuted,
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s2),
              ClipRRect(
                borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                child: Stack(
                  children: [
                    // Background track
                    Container(
                      height: 10,
                      width: double.infinity,
                      color: CbColors.surface2,
                    ),
                    // Allocated portion (faint indicator)
                    FractionallySizedBox(
                      widthFactor: organization.totalBudgetCents > 0
                          ? (organization.allocatedBudgetCents / organization.totalBudgetCents)
                              .clamp(0.0, 1.0)
                          : 0.0,
                      child: Container(
                        height: 10,
                        decoration: BoxDecoration(
                          color: CbColors.purpleLight.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        ),
                      ),
                    ),
                    // Spent portion (solid gradient)
                    FractionallySizedBox(
                      widthFactor: progress,
                      child: Container(
                        height: 10,
                        decoration: BoxDecoration(
                          gradient: CbColors.primaryGradient,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          boxShadow: const [
                            BoxShadow(
                              color: CbColors.purpleGlow,
                              blurRadius: 8,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: CbSpacing.s4),

          // Breakdown Metrics Grid
          Container(
            padding: const EdgeInsets.all(CbSpacing.s3),
            decoration: BoxDecoration(
              color: CbColors.surface2,
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: const Color(0x14FFFFFF)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildMetricItem(
                    label: 'Remaining',
                    value: formatCurrencyCents(organization.remainingBudgetCents),
                    valueColor: CbColors.liveGreen,
                  ),
                ),
                Container(
                  width: 1,
                  height: 36,
                  color: const Color(0x1FFFFFFF),
                ),
                Expanded(
                  child: _buildMetricItem(
                    label: 'Allocated',
                    value: formatCurrencyCents(organization.allocatedBudgetCents),
                    valueColor: Colors.white,
                  ),
                ),
                Container(
                  width: 1,
                  height: 36,
                  color: const Color(0x1FFFFFFF),
                ),
                Expanded(
                  child: _buildMetricItem(
                    label: 'Active Deals',
                    value: organization.activeCampaignsCount.toString(),
                    valueColor: CbColors.purpleLight,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem({
    required String label,
    required String value,
    required Color valueColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: CbColors.textMuted,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  void _showManageBudgetSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: const BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
          border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Budget Management',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s2),
              const Text(
                'Adjust your quarterly sponsorship allocations and corporate payment sources.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: CbSpacing.s4),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: CbColors.surface2,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  ),
                  child: const Icon(Icons.add_card, color: CbColors.purpleLight),
                ),
                title: const Text('Deposit Budget Funds', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                subtitle: const Text('Add funds via Stripe Corporate ACH or Wire', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                onTap: () {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      backgroundColor: CbColors.surface2,
                      content: Text('Stripe Corporate ACH portal opened in secure session.'),
                    ),
                  );
                },
              ),
              const Divider(color: Color(0x1AFFFFFF)),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: CbColors.surface2,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  ),
                  child: const Icon(Icons.receipt_long, color: CbColors.liveGreen),
                ),
                title: const Text('Quarterly Financial Statements', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                subtitle: const Text('Download certified tax and audit summaries', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                onTap: () {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      backgroundColor: CbColors.surface2,
                      content: Text('Exporting Q3/Q4 sponsorship receipt statement.'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
