// Crowdbeats V2 — Stage Overview Card (Stitch Screen 11)
// Displays active stage details, set times, live listener headcount, and action triggers.

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_live_badge.dart';

class StageOverviewCard extends StatelessWidget {
  const StageOverviewCard({
    super.key,
    required this.stageName,
    required this.venueName,
    required this.performerName,
    required this.genre,
    required this.liveCount,
    required this.timeRemaining,
    required this.imageUrl,
    required this.onTip,
    required this.onDirections,
  });

  final String stageName;
  final String venueName;
  final String performerName;
  final String genre;
  final int liveCount;
  final String timeRemaining;
  final String imageUrl;
  final VoidCallback onTip;
  final VoidCallback onDirections;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: CbColors.borderSubtle),
        boxShadow: const [
          BoxShadow(
            color: Color(0x66000000),
            blurRadius: 16,
            spreadRadius: 2,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stage Hero Image Banner
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusLg)),
                child: Image.network(
                  imageUrl,
                  height: 120,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              Container(
                height: 120,
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusLg)),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xCC151722)],
                  ),
                ),
              ),
              const Positioned(
                top: 10,
                left: 10,
                child: CbLiveBadge(label: 'STAGE LIVE'),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xCC0B0C10),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.people, size: 12, color: CbColors.purpleLight),
                      const SizedBox(width: 4),
                      Text(
                        '$liveCount fans tuned in',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            performerName,
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$venueName • $stageName',
                            style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: CbColors.surface3,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      ),
                      child: Text(
                        timeRemaining,
                        style: const TextStyle(color: CbColors.heartOrange, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onDirections,
                        icon: const Icon(Icons.navigation_outlined, size: 14, color: Colors.white),
                        label: const Text('Directions', style: TextStyle(color: Colors.white, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: CbColors.borderSubtle),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        onPressed: onTip,
                        icon: const Icon(Icons.favorite, size: 14, color: Colors.white),
                        label: const Text('Tip Performer', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: CbColors.purpleMain,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
