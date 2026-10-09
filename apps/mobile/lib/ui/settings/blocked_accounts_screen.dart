// Crowdbeats V2 — Blocked Accounts Screen
//
// Lists blocked creators and users with 1-tap unblock action.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/social_service.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class BlockedAccountsScreen extends ConsumerWidget {
  const BlockedAccountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(userSettingsProvider);
    final blocked = settings.blockedUsers;
    final notifier = ref.read(userSettingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Blocked Accounts', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        backgroundColor: const Color(0xFF0A0E17),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFF0A0E17),
      body: SafeArea(
        child: blocked.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(CbSpacing.s8),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: const Color(0xFF151C2C),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0x33EF4444)),
                        ),
                        child: const Icon(Icons.block, color: Color(0xFFEF4444), size: 36),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No Blocked Accounts',
                        style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Accounts you block will not be able to interact with you, tip your stages, or send messages.',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13, height: 1.4),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(CbSpacing.s4),
                itemCount: blocked.length,
                separatorBuilder: (_, __) => const Divider(color: Color(0x1AFFFFFF), height: 1),
                itemBuilder: (ctx, idx) {
                  final user = blocked[idx];
                  final name = user['displayName'] as String? ?? 'User';
                  final targetUid = user['id'] as String? ?? user['blockedUid'] as String? ?? '';

                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFF151C2C),
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                    title: Text(name, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                    subtitle: const Text('Blocked', style: TextStyle(color: CbColors.statusError, fontSize: 12)),
                    trailing: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Color(0x33FFFFFF)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                      ),
                      onPressed: () async {
                        try {
                          await ref.read(socialServiceProvider).unblockEntity(
                            targetId: targetUid,
                            targetType: 'user',
                          );
                        } catch (_) {}
                        await notifier.unblockUser(targetUid);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('$name unblocked.')),
                          );
                        }
                      },
                      child: const Text('Unblock'),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
