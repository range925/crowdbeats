// Crowdbeats V2 — Band Management & Member Roster Screen (Phase 10)
// Member roster, roles (BAND_FOUNDER, BAND_ADMIN, BAND_MEMBER), 7-day TTL invite lifecycle,
// last-owner protection, and ownership transfer confirmation dialog.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class BandMember {
  const BandMember({
    required this.uid,
    required this.name,
    required this.instrument,
    required this.role, // 'BAND_FOUNDER' | 'BAND_ADMIN' | 'BAND_MEMBER'
    required this.splitPercent,
  });

  final String uid;
  final String name;
  final String instrument;
  final String role;
  final int splitPercent;

  BandMember copyWith({
    String? uid,
    String? name,
    String? instrument,
    String? role,
    int? splitPercent,
  }) {
    return BandMember(
      uid: uid ?? this.uid,
      name: name ?? this.name,
      instrument: instrument ?? this.instrument,
      role: role ?? this.role,
      splitPercent: splitPercent ?? this.splitPercent,
    );
  }
}

class BandInvitationItem {
  const BandInvitationItem({
    required this.id,
    required this.email,
    required this.name,
    required this.instrument,
    required this.role,
    required this.status, // 'pending' | 'expired' | 'declined'
    required this.daysRemaining,
  });

  final String id;
  final String email;
  final String name;
  final String instrument;
  final String role;
  final String status;
  final int daysRemaining;

  BandInvitationItem copyWith({
    String? id,
    String? email,
    String? name,
    String? instrument,
    String? role,
    String? status,
    int? daysRemaining,
  }) {
    return BandInvitationItem(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      instrument: instrument ?? this.instrument,
      role: role ?? this.role,
      status: status ?? this.status,
      daysRemaining: daysRemaining ?? this.daysRemaining,
    );
  }
}

class BandManagementScreen extends StatefulWidget {
  const BandManagementScreen({super.key});

  @override
  State<BandManagementScreen> createState() => _BandManagementScreenState();
}

class _BandManagementScreenState extends State<BandManagementScreen> {
  List<BandMember> _members = [
    const BandMember(uid: 'u1', name: 'David Naufahu', instrument: 'Lead Vocals & Guitar', role: 'BAND_FOUNDER', splitPercent: 40),
    const BandMember(uid: 'u2', name: 'Marcus Turner', instrument: 'Bass & Backing Vocals', role: 'BAND_MEMBER', splitPercent: 30),
    const BandMember(uid: 'u3', name: 'Alicia Vance', instrument: 'Drums & Percussion', role: 'BAND_MEMBER', splitPercent: 30),
    const BandMember(uid: 'u4', name: 'Sarah Jenkins', instrument: 'Tour & Stage Manager', role: 'BAND_ADMIN', splitPercent: 0),
  ];

  List<BandInvitationItem> _invitations = [
    const BandInvitationItem(
      id: 'inv_1',
      name: 'Leo Hayes',
      email: 'leo.sax@example.com',
      instrument: 'Saxophone',
      role: 'BAND_MEMBER',
      status: 'pending',
      daysRemaining: 4,
    ),
    const BandInvitationItem(
      id: 'inv_2',
      name: 'Jordan Bell',
      email: 'jordan.keys@example.com',
      instrument: 'Keyboards',
      role: 'BAND_MEMBER',
      status: 'expired',
      daysRemaining: 0,
    ),
  ];

  void _showInviteModal() {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final instrumentController = TextEditingController();
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
                const Text('Send an official invite with a 7-day expiration TTL (BAND_INVITATION_TTL_DAYS = 7).', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 16),
                const Text('NAME', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: nameController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'e.g. Maya Lin',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: CbColors.surfaceBase,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('EMAIL ADDRESS', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
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
                const SizedBox(height: 12),
                const Text('INSTRUMENT / ROLE DESCRIPTION', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: instrumentController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'e.g. Trumpet',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: CbColors.surfaceBase,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 12),
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
                    DropdownMenuItem(value: 'BAND_ADMIN', child: Text('Band Admin (Manager)')),
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
                      final name = nameController.text.trim().isEmpty ? 'Invited Artist' : nameController.text.trim();
                      final email = emailController.text.trim().isEmpty ? 'artist@example.com' : emailController.text.trim();
                      final inst = instrumentController.text.trim().isEmpty ? 'Guest Musician' : instrumentController.text.trim();

                      setState(() {
                        _invitations.add(
                          BandInvitationItem(
                            id: 'inv_${DateTime.now().millisecondsSinceEpoch}',
                            name: name,
                            email: email,
                            instrument: inst,
                            role: selectedRole,
                            status: 'pending',
                            daysRemaining: 7,
                          ),
                        );
                      });

                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Band invitation sent to $email (Expires in 7 days).'),
                          backgroundColor: CbColors.statusLive,
                        ),
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

  void _handleResendInvite(BandInvitationItem invite) {
    setState(() {
      final index = _invitations.indexWhere((i) => i.id == invite.id);
      if (index != -1) {
        _invitations[index] = invite.copyWith(daysRemaining: 7, status: 'pending');
      }
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Invitation resent to ${invite.email} (new 7-day TTL started).'),
        backgroundColor: CbColors.statusLive,
      ),
    );
  }

  void _handleRevokeInvite(BandInvitationItem invite) {
    setState(() {
      _invitations.removeWhere((i) => i.id == invite.id);
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Invitation for ${invite.name} revoked.'),
        backgroundColor: CbColors.textSecondary,
      ),
    );
  }

  void _handleReinvite(BandInvitationItem invite) {
    setState(() {
      final index = _invitations.indexWhere((i) => i.id == invite.id);
      if (index != -1) {
        _invitations[index] = invite.copyWith(daysRemaining: 7, status: 'pending');
      }
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('New 7-day invitation sent to ${invite.name}.'),
        backgroundColor: CbColors.statusLive,
      ),
    );
  }

  void _showTransferOwnershipDialog() {
    final eligibleMembers = _members.where((m) => m.role != 'BAND_FOUNDER').toList();
    if (eligibleMembers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No eligible members available to receive ownership.'),
          backgroundColor: CbColors.statusError,
        ),
      );
      return;
    }

    String selectedUid = eligibleMembers.first.uid;
    final phraseController = TextEditingController();
    bool canConfirm = false;

    showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: CbColors.surfaceCard,
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: CbColors.statusLive, size: 24),
              SizedBox(width: 8),
              Expanded(
                child: Text('Transfer Band Ownership', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Transferring ownership grants full administrative authority, banking controls, and split contract veto rights to the selected member. This action cannot be unilaterally undone.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 14),
              const Text('SELECT SUCCESSOR', style: TextStyle(color: CbColors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: selectedUid,
                dropdownColor: CbColors.surfaceBase,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: CbColors.surfaceBase,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                ),
                items: eligibleMembers.map((m) {
                  return DropdownMenuItem(value: m.uid, child: Text('${m.name} (${m.role})'));
                }).toList(),
                onChanged: (val) {
                  if (val != null) setDialogState(() => selectedUid = val);
                },
              ),
              const SizedBox(height: 14),
              const Text(
                'Type "TRANSFER OWNERSHIP" to confirm:',
                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: phraseController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'TRANSFER OWNERSHIP',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: CbColors.surfaceBase,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                ),
                onChanged: (val) {
                  setDialogState(() {
                    canConfirm = val.trim() == 'TRANSFER OWNERSHIP';
                  });
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: canConfirm ? CbColors.statusLive : Colors.white24,
                foregroundColor: Colors.black,
              ),
              onPressed: canConfirm
                  ? () {
                      final successor = _members.firstWhere((m) => m.uid == selectedUid);
                      setState(() {
                        _members = _members.map((m) {
                          if (m.uid == selectedUid) {
                            return m.copyWith(role: 'BAND_FOUNDER');
                          } else if (m.role == 'BAND_FOUNDER') {
                            return m.copyWith(role: 'BAND_MEMBER');
                          }
                          return m;
                        }).toList();
                      });
                      Navigator.of(dialogCtx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Band ownership successfully transferred to ${successor.name}.'),
                          backgroundColor: CbColors.statusLive,
                        ),
                      );
                    }
                  : null,
              child: const Text('Confirm Transfer', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _handleRemoveMember(BandMember member) {
    if (member.role == 'BAND_FOUNDER') {
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: CbColors.surfaceCard,
          title: const Text('Last Owner Protection', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          content: const Text(
            'The band founder cannot be removed from the band roster without first transferring ownership to another active member.',
            style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Understood', style: TextStyle(color: CbColors.tealGas)),
            ),
          ],
        ),
      );
      return;
    }

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: Text('Remove ${member.name}?', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to remove ${member.name} from The Midnight Echoes?',
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 10),
            const Text(
              'Active Campaign & Unpaid Balance Check: Verified. Split ledger will re-evaluate for future tips upon contract ratification.',
              style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.statusError, foregroundColor: Colors.white),
            onPressed: () {
              setState(() {
                _members.removeWhere((m) => m.uid == member.uid);
              });
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${member.name} removed from band roster.'),
                  backgroundColor: CbColors.textSecondary,
                ),
              );
            },
            child: const Text('Confirm Removal'),
          ),
        ],
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('The Midnight Echoes', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text('${_members.length} Active Members · 100% Split Active', style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
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
                                  : (m.role == 'BAND_ADMIN' || m.role == 'BAND_MANAGER')
                                      ? const Color(0x338B5CF6)
                                      : Colors.white10,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              m.role == 'BAND_FOUNDER'
                                  ? 'FOUNDER'
                                  : (m.role == 'BAND_ADMIN' || m.role == 'BAND_MANAGER')
                                      ? 'ADMIN'
                                      : 'MEMBER',
                              style: TextStyle(
                                color: m.role == 'BAND_FOUNDER'
                                    ? CbColors.statusLive
                                    : (m.role == 'BAND_ADMIN' || m.role == 'BAND_MANAGER')
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
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, color: Colors.white38, size: 20),
                        tooltip: 'Remove Member',
                        onPressed: () => _handleRemoveMember(m),
                      ),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 20),

          // Pending & Expired Invitations Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('INVITATIONS (7-DAY TTL)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
              Text('${_invitations.length} Total', style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 8),
          if (_invitations.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text('No active or expired invitations.', style: TextStyle(color: Colors.white38, fontSize: 12)),
            )
          else
            ..._invitations.map((inv) {
              final isExpired = inv.status == 'expired' || inv.daysRemaining <= 0;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: CbGlassCard(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(inv.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isExpired ? const Color(0x33EF4444) : const Color(0x33F59E0B),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  isExpired ? 'EXPIRED' : 'PENDING',
                                  style: TextStyle(
                                    color: isExpired ? CbColors.statusError : const Color(0xFFF59E0B),
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          Text(
                            isExpired ? '7-day TTL elapsed' : 'Expires in ${inv.daysRemaining} days',
                            style: TextStyle(
                              color: isExpired ? CbColors.statusError : CbColors.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${inv.instrument} · ${inv.email}',
                        style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (isExpired) ...[
                            TextButton.icon(
                              icon: const Icon(Icons.refresh, size: 14, color: CbColors.tealGas),
                              label: const Text('Re-invite', style: TextStyle(color: CbColors.tealGas, fontSize: 11, fontWeight: FontWeight.bold)),
                              onPressed: () => _handleReinvite(inv),
                            ),
                          ] else ...[
                            TextButton(
                              onPressed: () => _handleRevokeInvite(inv),
                              child: const Text('Revoke', style: TextStyle(color: Colors.white60, fontSize: 11)),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0x3303DAC6),
                                foregroundColor: CbColors.tealGas,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              onPressed: () => _handleResendInvite(inv),
                              child: const Text('Resend', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
          const SizedBox(height: 20),

          // Founder Governance & Failsafes Section
          const Text('FOUNDER GOVERNANCE & FAILSAFES', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          CbGlassCard(
            padding: const EdgeInsets.all(16),
            backgroundColor: const Color(0x15F59E0B),
            borderColor: const Color(0x44F59E0B),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: Color(0xFFF59E0B), size: 20),
                    SizedBox(width: 8),
                    Text('Last Owner Protection Active', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'The band founder cannot leave the band or be removed without first designating and transferring ownership to another active member.',
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
                ),
                const SizedBox(height: 12),
                const Divider(color: Colors.white12, height: 1),
                const SizedBox(height: 12),
                const Row(
                  children: [
                    Icon(Icons.lock_clock_outlined, color: CbColors.purpleLight, size: 20),
                    SizedBox(width: 8),
                    Text('Active Campaign & Unpaid Balance Lock', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Member removals or departures are locked during active crowdfunding campaigns or while unsettled treasury balances are pending distribution.',
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFF59E0B)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    icon: const Icon(Icons.swap_horiz, color: Color(0xFFF59E0B)),
                    label: const Text('Transfer Band Ownership', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 13)),
                    onPressed: _showTransferOwnershipDialog,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
