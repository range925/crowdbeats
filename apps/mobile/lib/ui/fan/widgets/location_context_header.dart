// Crowdbeats V2 — LocationContextHeader Widget
//
// Displays active location context:
// "You are here" (default/GPS) or "Exploring Torrance, CA" (Search Area Mode)
// with a prominent "Use My Location" reset action.

import 'package:flutter/material.dart';

class LocationContextHeader extends StatelessWidget {
  const LocationContextHeader({
    super.key,
    required this.currentLocationName,
    required this.isSearchAreaMode,
    required this.onUseMyLocation,
  });

  final String currentLocationName;
  final bool isSearchAreaMode;
  final VoidCallback onUseMyLocation;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSearchAreaMode ? const Color(0xFFA855F7) : const Color(0xFF10B981),
                boxShadow: [
                  BoxShadow(
                    color: (isSearchAreaMode ? const Color(0xFFA855F7) : const Color(0xFF10B981))
                        .withOpacity(0.5),
                    blurRadius: 6,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              isSearchAreaMode ? 'Exploring $currentLocationName' : 'You are here · $currentLocationName',
              style: const TextStyle(
                color: Color(0xFFE2E8F0),
                fontSize: 13,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.2,
              ),
            ),
          ],
        ),
        if (isSearchAreaMode)
          TextButton.icon(
            onPressed: onUseMyLocation,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            icon: const Icon(Icons.my_location_rounded, color: Color(0xFFA855F7), size: 14),
            label: const Text(
              'Reset',
              style: TextStyle(
                color: Color(0xFFA855F7),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
      ],
    );
  }
}
