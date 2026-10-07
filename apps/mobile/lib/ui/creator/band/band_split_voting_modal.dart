// Crowdbeats V2 — Band Split Voting & Governance Modal (Phase 7)
// Member vote tracking, unanimous threshold & governance modification alerts.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class MemberVoteStatus {
  const MemberVoteStatus({
    required this.name,
    required this.role,
    required this.proposedSplit,
    required this.hasApproved,
  });

  final String name;
  final String role;
  final int proposedSplit;
  final bool hasApproved;
}

class BandSplitVotingModal extends StatefulWidget {
  const BandSplitVotingModal({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const BandSplitVotingModal(),
    );
  }

  @override
  State<BandSplitVotingModal> createState() => _BandSplitVotingModalState();
}

class _BandSplitVotingModalState extends State<BandSplitVotingModal> {
  final List<MemberVoteStatus> _votes = const [
    MemberVoteStatus(name: 'David Naufahu', role: 'BAND_FOUNDER', proposedSplit: 40, hasApproved: true),
    MemberVoteStatus(name: 'Marcus Turner', role: 'BAND_MEMBER', proposedSplit: 30, hasApproved: true),
    MemberVoteStatus(name: 'Alicia Vance', role: 'BAND_MEMBER', proposedSplit: 30, hasApproved: false),
  ];

  void _handleVote(bool approve) {
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(approve ? 'You approved the proposed split contract!' : 'You requested changes to the proposed split.'),
        backgroundColor: approve ? CbColors.statusLive : CbColors.purpleLight,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag Handle
          Center(
            child: Container(width: 36, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Split Contract Governance Vote', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const Text('All performing band members must approve modifications before activation.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 16),

          // Proposal Summary Card
          const CbGlassCard(
            padding: EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('PROPOSED SPLIT CONTRACT (v2.1)', style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold)),
                SizedBox(height: 6),
                Text('40% David · 30% Marcus · 30% Alicia', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Member Voting Records
          const Text('MEMBER APPROVAL STATUS', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          ..._votes.map((v) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: CbGlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    children: [
                      Icon(
                        v.hasApproved ? Icons.check_circle : Icons.hourglass_top,
                        color: v.hasApproved ? CbColors.statusLive : CbColors.purpleLight,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(v.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                      Text('${v.proposedSplit}%', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: v.hasApproved ? const Color(0x3310B981) : const Color(0x338B5CF6),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          v.hasApproved ? 'APPROVED' : 'AWAITING VOTE',
                          style: TextStyle(
                            color: v.hasApproved ? CbColors.statusLive : CbColors.purpleLight,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 20),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                  ),
                  onPressed: () => _handleVote(false),
                  child: const Text('Decline / Request Edits', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.statusLive,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                  ),
                  onPressed: () => _handleVote(true),
                  child: const Text('Approve Contract', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
