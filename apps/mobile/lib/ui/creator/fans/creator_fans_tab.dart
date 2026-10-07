// Crowdbeats V2 — Production Creator Fan & Backer Directory (Phase 5)
// Wrapper for CreatorFansScreen embedded within CreatorShell tabs.

import 'package:flutter/material.dart';
import 'creator_fans_screen.dart';
export 'creator_fans_screen.dart';

class CreatorFansTab extends StatelessWidget {
  const CreatorFansTab({
    super.key,
    this.isBand = false,
    this.entityId = 'solo_default',
    this.entityName = 'Elena Cruz',
  });

  final bool isBand;
  final String entityId;
  final String entityName;

  @override
  Widget build(BuildContext context) {
    return CreatorFansScreen(
      isBand: isBand,
      entityId: entityId,
      entityName: entityName,
      showAppBar: false,
    );
  }
}
