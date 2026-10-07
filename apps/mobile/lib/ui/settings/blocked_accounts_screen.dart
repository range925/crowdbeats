// Crowdbeats V2 — Blocked Accounts Screen
//
// Lists blocked creators and users with 1-tap unblock action.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';

class BlockedAccountsScreen extends ConsumerWidget {
  const BlockedAccountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(userSettingsProvider);
    final blocked = settings.blockedUsers;
    final notifier = ref.read(userSettingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Blocked Accounts'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: blocked.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E2032),
                          shape: BoxShape.circle,
                          border: Border.all(color: CbColors.borderSubtle),
                        ),
                        child: const Icon(Icons.block, color: Colors.white54, size: 36),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No Blocked Accounts',
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Accounts you block will not be able to interact with you, tip your stages, or send messages.',
                        style: TextStyle(color: CbColors.textSecondary, fontSize: 13, height: 1.4),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: blocked.length,
                separatorBuilder: (_, __) => const Divider(color: CbColors.borderSubtle, height: 1),
                itemBuilder: (ctx, idx) {
                  final user = blocked[idx];
                  final name = user['displayName'] as String? ?? 'User';
                  final targetUid = user['id'] as String? ?? user['blockedUid'] as String? ?? '';

                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFF1E2032),
                      child: Icon(Icons.person, color: Colors.white54, size: 20),
                    ),
                    title: Text(name, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                    subtitle: const Text('Blocked', style: TextStyle(color: CbColors.errorRed, fontSize: 12)),
                    trailing: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: CbColors.borderSubtle),
                      ),
                      onPressed: () => notifier.unblockUser(targetUid),
                      child: const Text('Unblock'),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
