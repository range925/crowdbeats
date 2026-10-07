// Crowdbeats V2 — Band Management & Member Roster Screen (Phase 7)
// Member roster, roles (BAND_FOUNDER, BAND_MANAGER, BAND_MEMBER) & invite workflow.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class BandMember {
  const BandMember({
    required this.uid,
    required this.name,
    required this.instrument,
    required this.role, // 'BAND_FOUNDER' | 'BAND_MANAGER' | 'BAND_MEMBER'
    required this.splitPercent,
  });

  final String uid;
  final String name;
  final String instrument;
  final String role;
  final int splitPercent;
}

class BandManagementScreen extends StatefulWidget {
  const BandManagementScreen({super.key});

  @override
  State<BandManagementScreen> createState() => _BandManagementScreenState();
}

class _BandManagementScreenState extends State<BandManagementScreen> {
  final List<BandMember> _members = const [
    BandMember(uid: 'u1', name: 'David Naufahu', instrument: 'Lead Vocals & Guitar', role: 'BAND_FOUNDER', splitPercent: 40),
    BandMember(uid: 'u2', name: 'Marcus Turner', instrument: 'Bass & Backing Vocals', role: 'BAND_MEMBER', splitPercent: 30),
    BandMember(uid: 'u3', name: 'Alicia Vance', instrument: 'Drums & Percussion', role: 'BAND_MEMBER', splitPercent: 30),
    BandMember(uid: 'u4', name: 'Sarah Jenkins', instrument: 'Tour & Stage Manager', role: 'BAND_MANAGER', splitPercent: 0),
  ];

  void _showInviteModal() {
    final emailController = TextEditingController();
    String selectedRole = 'BAND_MEMBER';

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            decoration: const BoxDecoration(
              color: CbColors.surfaceCard,
              borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Invite Band Member', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Send an official invite to join The Midnight Echoes.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 16),
                const Text('EMAIL ADDRESS OR PHONE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: emailController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'musician@example.com',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: CbColors.surfaceBase,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('BAND ROLE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: selectedRole,
                  dropdownColor: CbColors.surfaceBase,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: CbColors.surfaceBase,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'BAND_MEMBER', child: Text('Band Member (Performer)')),
                    DropdownMenuItem(value: 'BAND_MANAGER', child: Text('Band Manager (Admin)')),
                    DropdownMenuItem(value: 'BAND_FOUNDER', child: Text('Co-Founder')),
                  ],
                  onChanged: (val) {
                    if (val != null) setSheetState(() => selectedRole = val);
                  },
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CbColors.tealGas,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Band invite sent successfully!'), backgroundColor: CbColors.statusLive),
                      );
                    },
                    child: const Text('Send Band Invitation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Band Roster & Governance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add, color: CbColors.tealGas),
            onPressed: _showInviteModal,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Band Identity Header Card
          CbGlassCard(
            padding: const EdgeInsets.all(16),
            backgroundColor: const Color(0x2203DAC6),
            borderColor: const Color(0x6603DAC6),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(color: Color(0x3303DAC6), shape: BoxShape.circle),
                  child: const Center(child: Icon(Icons.groups, color: CbColors.tealGas, size: 26)),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('The Midnight Echoes', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                      SizedBox(height: 2),
                      Text('4 Active Members · 100% Split Active', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Members Roster
          const Text('BAND MEMBERS & ROLES', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          ..._members.map((m) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: CbGlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: CbColors.purpleDim,
                        child: Text(m.name[0], style: const TextStyle(color: CbColors.purpleLight, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(m.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            Text(m.instrument, style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: m.role == 'BAND_FOUNDER'
                                  ? const Color(0x3310B981)
                                  : m.role == 'BAND_MANAGER'
                                      ? const Color(0x338B5CF6)
                                      : Colors.white10,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              m.role == 'BAND_FOUNDER'
                                  ? 'FOUNDER'
                                  : m.role == 'BAND_MANAGER'
                                      ? 'MANAGER'
                                      : 'MEMBER',
                              style: TextStyle(
                                color: m.role == 'BAND_FOUNDER'
                                    ? CbColors.statusLive
                                    : m.role == 'BAND_MANAGER'
                                        ? CbColors.purpleLight
                                        : Colors.white70,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text('${m.splitPercent}% Split', style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }
}
