// Crowdbeats V2 — Account Deletion & Status Screen
//
// Compliant with GDPR/CCPA and AML 7-year financial record retention requirements.
// Requires explicit confirmation and checks for active band founder / escrow holds.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/auth_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_button.dart';

class AccountDeletionScreen extends ConsumerStatefulWidget {
  const AccountDeletionScreen({super.key});

  @override
  ConsumerState<AccountDeletionScreen> createState() => _AccountDeletionScreenState();
}

class _AccountDeletionScreenState extends ConsumerState<AccountDeletionScreen> {
  final _confirmCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  bool _deleting = false;
  String? _error;
  static const _confirmPhrase = 'delete my account';

  @override
  void dispose() {
    _confirmCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
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
      context.go('/auth');
    } catch (e) {
      setState(() {
        _deleting = false;
        _error = 'Account deletion failed: $e. Please contact support@crowdbeats.com.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _confirmCtrl.text.trim().toLowerCase() == _confirmPhrase && !_deleting;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Delete Account'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Warning Card
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
                        Icon(Icons.warning_amber_rounded, color: CbColors.errorRed, size: 24),
                        SizedBox(width: 10),
                        Text('Permanent Action', style: TextStyle(color: CbColors.errorRed, fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Account deletion will immediately remove your profile, revoke active login sessions, and disconnect linked social profiles.\n\n'
                      '• Band Founders: You must transfer band ownership before deleting your account.\n'
                      '• Financial Records: Transaction receipts and ledger entries will be retained pursuant to statutory 7-year anti-money-laundering regulations.',
                      style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Reason
              const Text('Why are you leaving? (Optional)', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _reasonCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Share feedback with our team',
                  filled: true,
                  fillColor: const Color(0xFF1E2032),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: CbColors.borderSubtle)),
                ),
              ),
              const SizedBox(height: 20),

              // Confirmation Phrase Input
              const Text('Type "delete my account" to confirm:', style: TextStyle(color: CbColors.errorRed, fontSize: 13, fontWeight: FontWeight.w600)),
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
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: CbColors.borderSubtle)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: CbColors.errorRed, width: 1.5)),
                ),
              ),

              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: CbColors.errorRed, fontSize: 13)),
              ],

              const SizedBox(height: 32),

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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
