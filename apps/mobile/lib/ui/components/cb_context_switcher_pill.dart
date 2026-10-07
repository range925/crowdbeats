// Crowdbeats V2 — Creator Context Switcher Pill (Phase 1)
// Stitch Project 5326179813018056505
// Single-UID creator context selector in header: Solo Musician vs Band Alpha / Beta.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CreatorContextItem {
  const CreatorContextItem({
    required this.id,
    required this.name,
    required this.type, // 'solo' | 'band'
    required this.role, // 'SOLO_ARTIST' | 'BAND_FOUNDER' | 'BAND_ADMIN' | 'BAND_MEMBER'
    this.photoUrl,
    this.hasActiveLiveSession = false,
  });

  final String id;
  final String name;
  final String type;
  final String role;
  final String? photoUrl;
  final bool hasActiveLiveSession;

  bool get isSolo => type == 'solo';
}

class CbContextSwitcherPill extends StatelessWidget {
  const CbContextSwitcherPill({
    super.key,
    required this.activeContext,
    required this.availableContexts,
    required this.onSelectContext,
  });

  final CreatorContextItem activeContext;
  final List<CreatorContextItem> availableContexts;
  final ValueChanged<CreatorContextItem> onSelectContext;

  void _openContextModal(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: CbColors.surfaceCard,
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
                    'Switch Creator Context',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Switch between your solo profile and authorized band memberships under your single account.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 16),
              ...availableContexts.map((item) {
                final isSelected = item.id == activeContext.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0x228B5CF6) : CbColors.surfaceBase,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(
                      color: isSelected ? CbColors.purpleLight : const Color(0x1AFFFFFF),
                    ),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    child: ListTile(
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: CbColors.surfaceCard,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                        ),
                        child: Icon(
                          item.isSolo ? Icons.mic_external_on : Icons.groups,
                          color: item.isSolo ? CbColors.purpleLight : CbColors.tealGas,
                          size: 20,
                        ),
                      ),
                      title: Row(
                        children: [
                          Text(item.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                          if (item.hasActiveLiveSession) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: CbColors.statusLive,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text('LIVE', style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.w800)),
                            ),
                          ],
                        ],
                      ),
                      subtitle: Text(
                        item.isSolo ? 'Solo Musician' : 'Band · ${item.role}',
                        style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle, color: CbColors.purpleLight, size: 20)
                          : null,
                      onTap: () {
                        Navigator.of(ctx).pop();
                        if (!isSelected) {
                          onSelectContext(item);
                        }
                      },
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openContextModal(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0x331C1B1B),
          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
          border: Border.all(color: const Color(0x338B5CF6)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              activeContext.isSolo ? Icons.mic_external_on : Icons.groups,
              size: 14,
              color: activeContext.isSolo ? CbColors.purpleLight : CbColors.tealGas,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                activeContext.name,
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down, size: 14, color: Colors.white70),
          ],
        ),
      ),
    );
  }
}
