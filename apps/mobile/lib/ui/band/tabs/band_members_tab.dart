import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../firebase/band_service.dart';
import '../../../state/band_state.dart';
import '../../theme/cb_colors.dart';

class BandMembersTab extends ConsumerWidget {
  const BandMembersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final band = ref.watch(bandProvider);
    final isFounderOrAdmin = ['BAND_FOUNDER', 'BAND_ADMIN'].contains(band.role);

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        elevation: 0,
        title: const Text(
          'Members & Governance',
          style: TextStyle(
            color: CbColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (isFounderOrAdmin && band.activeBandId != null)
            IconButton(
              icon: const Icon(Icons.person_add_alt_1, color: CbColors.accentPrimary),
              onPressed: () => _showInviteModal(context, band.activeBandId!),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Active Members (${band.members.length})',
                style: const TextStyle(
                  color: CbColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (band.role == 'BAND_FOUNDER')
                TextButton(
                  onPressed: () => _showSplitsModal(context, band),
                  child: const Text('Edit Splits', style: TextStyle(color: CbColors.accentPrimary)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ...band.members.map((m) {
            final pct = (m.splitBps / 100).toStringAsFixed(1);
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: CbColors.surfaceCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: CbColors.borderSubtle),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: CbColors.surfaceRaised,
                    child: Text(
                      m.displayName.isNotEmpty ? m.displayName[0].toUpperCase() : 'M',
                      style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          m.displayName,
                          style: const TextStyle(
                            color: CbColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          m.role.replaceAll('BAND_', ''),
                          style: TextStyle(
                            color: m.role == 'BAND_FOUNDER' ? const Color(0xFFFBBF24) : CbColors.textTertiary,
                            fontSize: 12,
                            fontWeight: m.role == 'BAND_FOUNDER' ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: CbColors.surfaceRaised,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '$pct%',
                      style: const TextStyle(
                        color: CbColors.accentPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  void _showInviteModal(BuildContext context, String bandId) {
    final emailCtrl = TextEditingController();
    String selectedRole = 'BAND_MEMBER';

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: CbColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            top: 24,
            left: 20,
            right: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Invite Band Member',
                style: TextStyle(
                  color: CbColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: emailCtrl,
                style: const TextStyle(color: CbColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Member Email',
                  labelStyle: const TextStyle(color: CbColors.textSecondary),
                  filled: true,
                  fillColor: CbColors.surfaceRaised,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: selectedRole,
                dropdownColor: CbColors.surfaceCard,
                style: const TextStyle(color: CbColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Band Role',
                  labelStyle: const TextStyle(color: CbColors.textSecondary),
                  filled: true,
                  fillColor: CbColors.surfaceRaised,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                items: const [
                  DropdownMenuItem(value: 'BAND_MEMBER', child: Text('Member')),
                  DropdownMenuItem(value: 'BAND_ADMIN', child: Text('Admin')),
                ],
                onChanged: (val) => setModalState(() => selectedRole = val ?? 'BAND_MEMBER'),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.accentPrimary,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () async {
                    final email = emailCtrl.text.trim();
                    if (email.isNotEmpty && email.contains('@')) {
                      Navigator.pop(ctx);
                      try {
                        await BandService.instance.inviteBandMember(
                          bandId: bandId,
                          email: email,
                          role: selectedRole,
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('7-day invitation sent!')),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        }
                      }
                    }
                  },
                  child: const Text('Send Invitation', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSplitsModal(BuildContext context, BandState band) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Configure exact split formulas in the Web Band Studio.'),
      ),
    );
  }
}
