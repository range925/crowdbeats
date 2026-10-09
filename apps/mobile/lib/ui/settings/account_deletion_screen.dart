// Crowdbeats V2 — Account Deletion & Deactivation Screen (Phase 12)
//
// Compliant with GDPR/CCPA and AML 7-year financial record retention requirements.
// Authoritative Design: Stitch Screen 4de5638089064198a27077855f34afc0
//
// Features:
// 1. Temporary Account Deactivation:
//    - Hides public stage presence and radar discoverability
//    - Preserves ledger balance, patron pledges, and transaction history
//    - Seamless reactivation upon next sign-in
// 2. Permanent Account Deletion:
//    - 30-Day Statutory Cooling-Off period
//    - AML 7-year financial ledger retention notice
//    - Band founder ownership transfer validation
//    - Explicit confirmation phrase: "delete my account" (case-insensitive)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/auth_state.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_button.dart';

class AccountDeletionScreen extends ConsumerStatefulWidget {
  const AccountDeletionScreen({super.key});

  @override
  ConsumerState<AccountDeletionScreen> createState() =>
      _AccountDeletionScreenState();
}

class _AccountDeletionScreenState extends ConsumerState<AccountDeletionScreen> {
  final _confirmCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  bool _deleting = false;
  bool _deactivating = false;
  String? _error;
  static const _confirmPhrase = 'delete my account';

  @override
  void dispose() {
    _confirmCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleDeactivate() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E2032),
        title: const Text(
          'Deactivate Crowdbeats Account?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Your profile will be hidden from live stages and nearby radar. All your earnings, balances, and patron badges will remain safely stored. You can reactivate at any time by signing back in.',
          style: TextStyle(color: CbColors.textSecondary, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: CbColors.heartOrange),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Deactivate'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _deactivating = true);
    ref.read(userSettingsProvider.notifier).deactivateAccount();
    await ref.read(authNotifierProvider.notifier).signOut();
    if (mounted) {
      setState(() => _deactivating = false);
      context.go('/auth');
    }
  }

  Future<void> _executeDeletion() async {
    if (_confirmCtrl.text.trim().toLowerCase() != _confirmPhrase) return;

    setState(() {
      _deleting = true;
      _error = null;
    });

    try {
      await ref.read(authNotifierProvider.notifier).requestAccountDeletion();
      if (!mounted) return;
      context.go('/deleted');
    } catch (e) {
      setState(() {
        _deleting = false;
        _error = 'Account deletion failed: $e. Please contact support@crowdbeats.com.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit =
        _confirmCtrl.text.trim().toLowerCase() == _confirmPhrase && !_deleting;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account Lifecycle & Deletion'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── 1. TEMPORARY DEACTIVATION ─────────────────────────────────
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E2032),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: CbColors.heartOrange.withValues(alpha: 0.4),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.pause_circle_outline,
                            color: CbColors.heartOrange, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Deactivate Account (Temporary)',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Take a break without losing your data. Your profile and live stages are hidden, but your saved tips, balances, and patron links are safely preserved.',
                      style: TextStyle(
                        color: CbColors.textSecondary,
                        fontSize: 12.5,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: CbColors.heartOrange,
                        side: const BorderSide(color: CbColors.heartOrange),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: _deactivating ? null : _handleDeactivate,
                      child: _deactivating
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Deactivate My Account'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // ── 2. PERMANENT ACCOUNT DELETION ─────────────────────────────
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0x22EF4444),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0x66EF4444)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded,
                            color: CbColors.errorRed, size: 24),
                        SizedBox(width: 10),
                        Text(
                          'Permanent Account Deletion',
                          style: TextStyle(
                            color: CbColors.errorRed,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Account deletion is irreversible after the cooling-off period. Please review the following disclosures:\n\n'
                      '• 30-Day Statutory Cooling-Off Period: Your deletion request will be queued for 30 days. Signing back in during this period immediately cancels deletion.\n'
                      '• Band Founders: If you lead an active band, you must transfer band governance and treasury rights to a co-member before deleting.\n'
                      '• Statutory 7-Year Financial Retention: Double-entry tipping receipts, Stripe transfers, and ledger debits are retained pursuant to statutory AML regulations.',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12.5,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Reason feedback
              const Text(
                'Why are you leaving? (Optional)',
                style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _reasonCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Share feedback with our product team',
                  hintStyle: const TextStyle(color: Colors.white30),
                  filled: true,
                  fillColor: const Color(0xFF1E2032),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: CbColors.borderSubtle),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Confirmation Phrase Input
              const Text(
                'Type "delete my account" to confirm:',
                style: TextStyle(
                    color: CbColors.errorRed,
                    fontSize: 13,
                    fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _confirmCtrl,
                onChanged: (_) => setState(() {}),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: _confirmPhrase,
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF1E2032),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: CbColors.borderSubtle),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide:
                        const BorderSide(color: CbColors.errorRed, width: 1.5),
                  ),
                ),
              ),

              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: const TextStyle(color: CbColors.errorRed, fontSize: 13),
                ),
              ],

              const SizedBox(height: 28),

              CbButton(
                label: 'Permanently Delete My Account',
                variant: CbButtonVariant.destructive,
                isLoading: _deleting,
                onPressed: canSubmit ? _executeDeletion : null,
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: _deleting ? null : () => context.pop(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: CbColors.borderSubtle),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Cancel and Keep Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
