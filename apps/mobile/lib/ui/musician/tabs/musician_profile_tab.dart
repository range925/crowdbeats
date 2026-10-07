// Crowdbeats V2 — Musician Profile Tab (Phase 7)
//
// EPK preview, payout/KYC status badge, Connect onboarding CTA,
// link to Creator Studio, share profile / QR.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../state/auth_state.dart';
import '../../../firebase/musician_service.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/persistent_qr_modal.dart';

class MusicianProfileTab extends ConsumerStatefulWidget {
  const MusicianProfileTab({super.key});

  @override
  ConsumerState<MusicianProfileTab> createState() => _MusicianProfileTabState();
}

class _MusicianProfileTabState extends ConsumerState<MusicianProfileTab> {
  ConnectStatus? _connectStatus;
  bool _isLoadingKyc = true;
  bool _isRequestingLink = false;

  @override
  void initState() {
    super.initState();
    _fetchConnectStatus();
  }

  Future<void> _fetchConnectStatus() async {
    try {
      final s = await MusicianService.instance.getConnectStatus();
      if (mounted) setState(() { _connectStatus = s; _isLoadingKyc = false; });
    } on Exception {
      if (mounted) setState(() => _isLoadingKyc = false);
    }
  }

  Future<void> _openConnectOnboarding() async {
    setState(() => _isRequestingLink = true);
    try {
      final url = await MusicianService.instance.createConnectLink();
      if (mounted) {
        // Open the Connect onboarding URL in browser
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Opening Stripe onboarding…'),
            backgroundColor: CbColors.surfaceCard,
          ),
        );
        // Use URL launcher if available — otherwise show dialog with URL
        await showDialog<void>(
          context: context,
          builder: (_) => AlertDialog(
            backgroundColor: CbColors.surfaceCard,
            title: const Text('Stripe Onboarding'),
            content: Column(mainAxisSize: MainAxisSize.min, children: [
              const Text('Copy this URL and open it in your browser to complete identity verification:'),
              const SizedBox(height: 12),
              SelectableText(url, style: const TextStyle(fontSize: 12)),
            ]),
            actions: [
              TextButton(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: url));
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('URL copied to clipboard')),
                  );
                },
                child: const Text('Copy URL'),
              ),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Done')),
            ],
          ),
        );
      }
    } on Exception catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: CbColors.statusError),
        );
      }
    } finally {
      if (mounted) setState(() => _isRequestingLink = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final name = auth.displayName ?? 'Musician';
    final email = auth.email ?? '';

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => _fetchConnectStatus(),
          child: ListView(
            padding: const EdgeInsets.all(CbSpacing.s5),
            children: [
              // EPK preview header
              Container(
                padding: const EdgeInsets.all(CbSpacing.s5),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [CbColors.accentPrimary.withAlpha(30), CbColors.accentSecondary.withAlpha(15)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                  border: Border.all(color: CbColors.accentPrimary.withAlpha(50)),
                ),
                child: Row(children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: CbColors.accentPrimary.withAlpha(30),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'M',
                      style: const TextStyle(fontSize: 28, color: CbColors.accentPrimary, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: CbSpacing.s4),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    if (email.isNotEmpty) Text(email, style: const TextStyle(color: CbColors.textSecondary, fontSize: 13)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: CbColors.accentPrimary.withAlpha(25),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('Artist', style: TextStyle(color: CbColors.accentPrimary, fontSize: 11, fontWeight: FontWeight.w700)),
                    ),
                  ])),
                ]),
              ),
              const SizedBox(height: CbSpacing.s5),

              // KYC / Payout status card
              _buildPayoutCard(),
              // Direct Tipping & Marketing
              _SectionCard(title: 'Direct Tipping & Marketing', items: [
                _ActionItem(
                  icon: Icons.qr_code,
                  label: 'Direct Tipping QR Code',
                  subtitle: 'Permanent QR pointing to crowdbeats.app/tip/${auth.uid ?? 'musician'}',
                  onTap: () {
                    PersistentQrModal.show(
                      context,
                      performerId: auth.uid ?? 'musician',
                      performerName: auth.displayName ?? 'Musician',
                    );
                  },
                ),
                _ActionItem(
                  icon: Icons.link,
                  label: 'Copy Direct Tip Link',
                  subtitle: 'https://crowdbeats.app/tip/${auth.uid ?? 'musician'}',
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: 'https://crowdbeats.app/tip/${auth.uid ?? 'musician'}'));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Copied persistent tip link to clipboard!'),
                        backgroundColor: CbColors.surfaceCard,
                      ),
                    );
                  },
                ),
              ]),
              const SizedBox(height: CbSpacing.s5),

              // Links section
              _SectionCard(title: 'Creator Studio', items: [
                _ActionItem(
                  icon: Icons.dashboard,
                  label: 'Open Creator Studio',
                  subtitle: 'Full dashboard on crowdbeats.app',
                  onTap: () {
                    // Would open in-app browser or external link
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Opening crowdbeats.app/creator…')),
                    );
                  },
                ),
              ]),
              const SizedBox(height: CbSpacing.s3),
              _SectionCard(title: 'Account', items: [
                _ActionItem(
                  icon: Icons.shield_outlined,
                  label: 'Security',
                  onTap: () {},
                ),
                _ActionItem(
                  icon: Icons.lock_outlined,
                  label: 'Privacy & Data',
                  onTap: () {},
                ),
                _ActionItem(
                  icon: Icons.swap_horiz,
                  label: 'Switch persona',
                  onTap: () {},
                ),
              ]),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPayoutCard() {
    if (_isLoadingKyc) {
      return Container(
        height: 80,
        decoration: BoxDecoration(color: CbColors.surfaceCard, borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    final status = _connectStatus;
    if (status == null || !status.isFullyEnabled) {
      // Not connected or KYC incomplete
      return Container(
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: CbColors.statusWarning.withAlpha(15),
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(color: CbColors.statusWarning.withAlpha(80)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            const Icon(Icons.account_balance_wallet, color: CbColors.statusWarning),
            const SizedBox(width: CbSpacing.s3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Payout Account', style: TextStyle(fontWeight: FontWeight.w700)),
              Text(
                status?.accountId == null ? 'Not connected' : 'Identity verification required',
                style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
              ),
            ])),
          ]),
          const SizedBox(height: CbSpacing.s3),
          FilledButton(
            onPressed: _isRequestingLink ? null : _openConnectOnboarding,
            style: FilledButton.styleFrom(backgroundColor: CbColors.statusWarning, foregroundColor: Colors.black),
            child: _isRequestingLink
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                : const Text('Set up payouts', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ]),
      );
    }

    // Fully enabled
    return Container(
      padding: const EdgeInsets.all(CbSpacing.s4),
      decoration: BoxDecoration(
        color: CbColors.statusSuccess.withAlpha(15),
        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
        border: Border.all(color: CbColors.statusSuccess.withAlpha(80)),
      ),
      child: const Row(children: [
        Icon(Icons.check_circle, color: CbColors.statusSuccess),
        SizedBox(width: CbSpacing.s3),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Payout Account Active', style: TextStyle(fontWeight: FontWeight.w700)),
          Text('Tips will be transferred to your account.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
        ])),
      ]),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.items});

  final String title;
  final List<_ActionItem> items;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: CbSpacing.s2),
            child: Text(title, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
          ),
          Container(
            decoration: BoxDecoration(
              color: CbColors.surfaceCard,
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: CbColors.borderSubtle),
            ),
            child: Column(
              children: items.asMap().entries.map((e) => Column(children: [
                e.value,
                if (e.key < items.length - 1) const Divider(height: 1, color: CbColors.borderSubtle, indent: 56),
              ])).toList(),
            ),
          ),
        ],
      );
}

class _ActionItem extends StatelessWidget {
  const _ActionItem({required this.icon, required this.label, this.subtitle, required this.onTap});

  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Icon(icon, color: CbColors.textSecondary, size: 20),
        title: Text(label),
        subtitle: subtitle != null ? Text(subtitle!, style: const TextStyle(color: CbColors.textTertiary, fontSize: 12)) : null,
        trailing: const Icon(Icons.chevron_right, color: CbColors.textTertiary, size: 18),
        onTap: onTap,
      );
}
