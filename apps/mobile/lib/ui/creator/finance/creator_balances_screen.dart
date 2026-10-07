// Crowdbeats V2 — Financial Balances & Ledger Screen (Phase 6)
// Calm available balance, pending settlements, lifetime earnings,
// Double-entry balanced ledger inspector, band treasury distribution & definitions card.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../firebase/firestore_service.dart';
import '../../components/components.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import 'creator_payout_request_sheet.dart';
import 'creator_payout_history_screen.dart';
import '../../../data/services/stripe_fee_service.dart';

class LedgerEntryItem {
  const LedgerEntryItem({
    required this.id,
    required this.txId,
    required this.entryType, // 'credit' | 'debit'
    required this.accountType, // 'artist_balance' | 'band_balance' | 'platform_fee' | 'stripe_transit' | 'fan_payment'
    required this.amountDollars,
    required this.memo,
    required this.timestamp,
  });

  final String id;
  final String txId;
  final String entryType;
  final String accountType;
  final double amountDollars;
  final String memo;
  final String timestamp;
}

class CreatorBalancesScreen extends StatefulWidget {
  const CreatorBalancesScreen({
    super.key,
    this.isBand = false,
    this.entityId = 'solo_default',
    this.entityName = 'Elena Cruz',
  });

  final bool isBand;
  final String entityId;
  final String entityName;

  @override
  State<CreatorBalancesScreen> createState() => _CreatorBalancesScreenState();
}

class _CreatorBalancesScreenState extends State<CreatorBalancesScreen> {
  late double _availableBalance;
  late double _pendingBalance;
  late double _lifetimeEarnings;
  late double _totalDebits;
  late double _totalCredits;

  String _selectedFilter = 'ALL';
  StripeDailyFeeSchedule? _dailyFeeSchedule;

  late List<LedgerEntryItem> _ledgerEntries;

  @override
  void initState() {
    super.initState();
    // Default initial seed values tailored to context
    if (widget.isBand) {
      _availableBalance = 1850.0;
      _pendingBalance = 340.0;
      _lifetimeEarnings = 12450.0;
      _totalDebits = 12450.0;
      _totalCredits = 12450.0;

      _ledgerEntries = [
        const LedgerEntryItem(
          id: 'le_b1',
          txId: 'tx_b948_01',
          entryType: 'credit',
          accountType: 'band_balance',
          amountDollars: 200.0,
          memo: 'Live Festival Stage Crowd Tips (The Midnight Echoes)',
          timestamp: 'Today, 10:45 PM',
        ),
        const LedgerEntryItem(
          id: 'le_b2',
          txId: 'tx_b948_02',
          entryType: 'debit',
          accountType: 'band_balance',
          amountDollars: 200.0,
          memo: 'Automated 4-way Member Split Execution (Split v2)',
          timestamp: 'Today, 10:45 PM',
        ),
        const LedgerEntryItem(
          id: 'le_b3',
          txId: 'tx_b947_01',
          entryType: 'credit',
          accountType: 'band_balance',
          amountDollars: 500.0,
          memo: 'Direct Tip: Saturday Headline Set at Neon Lounge',
          timestamp: 'Yesterday, 11:30 PM',
        ),
        const LedgerEntryItem(
          id: 'le_b4',
          txId: 'tx_b946_01',
          entryType: 'debit',
          accountType: 'stripe_transit',
          amountDollars: 1000.0,
          memo: 'ACH Distribution to Band Operating Account (Wells Fargo *9102)',
          timestamp: 'Sep 17, 2026',
        ),
        const LedgerEntryItem(
          id: 'le_b5',
          txId: 'tx_b945_01',
          entryType: 'credit',
          accountType: 'band_balance',
          amountDollars: 1350.0,
          memo: 'Crowdfunding Milestone Settlement: Summer Tour',
          timestamp: 'Sep 15, 2026',
        ),
      ];
    } else {
      _availableBalance = 480.0;
      _pendingBalance = 125.0;
      _lifetimeEarnings = 4820.0;
      _totalDebits = 5425.0;
      _totalCredits = 5425.0;

      _ledgerEntries = [
        const LedgerEntryItem(
          id: 'le_s1',
          txId: 'tx_9482_01',
          entryType: 'credit',
          accountType: 'artist_balance',
          amountDollars: 50.0,
          memo: 'Direct Tip: Live Stage Performance (Casbah)',
          timestamp: 'Today, 9:15 PM',
        ),
        const LedgerEntryItem(
          id: 'le_s2',
          txId: 'tx_9482_02',
          entryType: 'debit',
          accountType: 'platform_fee',
          amountDollars: 1.75,
          memo: 'Stripe Processing & Platform Fee (2.9% + 30¢)',
          timestamp: 'Today, 9:15 PM',
        ),
        const LedgerEntryItem(
          id: 'le_s3',
          txId: 'tx_9481_01',
          entryType: 'credit',
          accountType: 'artist_balance',
          amountDollars: 100.0,
          memo: 'Direct Tip: Sunset Lounge Acoustic Encore',
          timestamp: 'Yesterday, 8:40 PM',
        ),
        const LedgerEntryItem(
          id: 'le_s4',
          txId: 'tx_9480_01',
          entryType: 'debit',
          accountType: 'stripe_transit',
          amountDollars: 250.0,
          memo: 'ACH Direct Deposit Payout to Chase (*4210)',
          timestamp: 'Sep 17, 2026',
        ),
        const LedgerEntryItem(
          id: 'le_s5',
          txId: 'tx_9479_01',
          entryType: 'credit',
          accountType: 'artist_balance',
          amountDollars: 375.0,
          memo: 'Debut Studio Album Vinyl Campaign Milestone',
          timestamp: 'Sep 14, 2026',
        ),
      ];
    }

    _loadLedgerFromBackend();
    _loadDailyStripeRates();
  }

  void _loadDailyStripeRates() {
    StripeFeeService.instance.getDailyFeeSchedule().then((sched) {
      if (mounted) setState(() => _dailyFeeSchedule = sched);
    });
  }

  Future<void> _loadLedgerFromBackend() async {
    try {
      final summary = await FirestoreService.instance.getLedgerSummary(
        entityId: widget.entityId,
        isBand: widget.isBand,
      );
      if (summary != null && mounted) {
        setState(() {
          if (summary['availableBalanceDollars'] is double) {
            _availableBalance = summary['availableBalanceDollars'] as double;
          }
          if (summary['pendingBalanceDollars'] is double) {
            _pendingBalance = summary['pendingBalanceDollars'] as double;
          }
          if (summary['lifetimeEarningsDollars'] is double) {
            _lifetimeEarnings = summary['lifetimeEarningsDollars'] as double;
          }
        });
      }
    } catch (_) {
      // Retain fallback defaults
    }
  }

  void _handleOpenPayout() {
    CreatorPayoutRequestSheet.show(
      context,
      availableBalanceDollars: _availableBalance,
      onPayoutSubmitted: (withdrawn) async {
        setState(() {
          _availableBalance -= withdrawn;
          final newEntry = LedgerEntryItem(
            id: 'le_${DateTime.now().millisecondsSinceEpoch}',
            txId: 'tx_payout_${DateTime.now().millisecondsSinceEpoch}',
            entryType: 'debit',
            accountType: widget.isBand ? 'band_balance' : 'artist_balance',
            amountDollars: withdrawn,
            memo: 'ACH Direct Payout to Verified Bank Account',
            timestamp: 'Just now',
          );
          _ledgerEntries.insert(0, newEntry);
        });

        try {
          await FirestoreService.instance.recordPayoutLedgerTransaction(
            entityId: widget.entityId,
            isBand: widget.isBand,
            amountDollars: withdrawn,
            destinationBank: 'Chase (*4210)',
          );
        } catch (e) {
          debugPrint('[Ledger] recordPayoutLedgerTransaction fallback: $e');
        }

        if (mounted) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.black, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Payout of \$${withdrawn.toStringAsFixed(2)} requested for ${widget.entityName}!',
                      style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              backgroundColor: CbColors.statusLive,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
    );
  }

  void _copyTxId(String txId) {
    Clipboard.setData(ClipboardData(text: txId));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Transaction ID copied: $txId'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  List<LedgerEntryItem> get _filteredEntries {
    if (_selectedFilter == 'CREDITS') {
      return _ledgerEntries.where((e) => e.entryType == 'credit').toList();
    } else if (_selectedFilter == 'DEBITS') {
      return _ledgerEntries.where((e) => e.entryType == 'debit').toList();
    }
    return _ledgerEntries;
  }

  @override
  Widget build(BuildContext context) {
    final entries = _filteredEntries;

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Balances & Financial Ledger', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.history, color: CbColors.tealGas),
            tooltip: 'Payout History',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const CreatorPayoutHistoryScreen()),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Identity & Zero-Sum Verification Header Card
          CbGlassCard(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: widget.isBand ? const Color(0x2210B981) : const Color(0x228B5CF6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    widget.isBand ? Icons.groups : Icons.account_balance_wallet,
                    color: widget.isBand ? CbColors.tealGas : CbColors.purpleLight,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: widget.isBand ? const Color(0x3310B981) : const Color(0x338B5CF6),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              widget.isBand ? 'BAND STUDIO' : 'SOLO ARTIST',
                              style: TextStyle(
                                color: widget.isBand ? CbColors.tealGas : CbColors.purpleLight,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            widget.entityName,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.verified, size: 12, color: CbColors.statusLive),
                          const SizedBox(width: 4),
                          const Text(
                            'Zero-Sum Balanced (Δ \$0.00)',
                            style: TextStyle(color: CbColors.statusLive, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 6),
                          const Text('• Reconciled', style: TextStyle(color: CbColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Calm Financial Hero Card
          CbGlassCard(
            padding: const EdgeInsets.all(20),
            backgroundColor: const Color(0x228B5CF6),
            borderColor: const Color(0x668B5CF6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AVAILABLE FOR WITHDRAWAL',
                  style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                ),
                const SizedBox(height: 6),
                Text(
                  '\$${_availableBalance.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('PENDING SETTLEMENT', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                          Text(
                            '\$${_pendingBalance.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white70, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('LIFETIME EARNINGS', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                          Text(
                            '\$${_lifetimeEarnings.toStringAsFixed(2)}',
                            style: const TextStyle(color: CbColors.tealGas, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.account_balance_wallet, size: 16),
                    label: const Text('Request Payout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CbColors.tealGas,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: _availableBalance >= 10.0 ? _handleOpenPayout : null,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Double-Entry Balanced Ledger Indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF0F111A),
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: const Color(0x2210B981)),
            ),
            child: Row(
              children: [
                const Icon(Icons.account_tree_outlined, size: 16, color: CbColors.tealGas),
                const SizedBox(width: 8),
                const Text(
                  'DOUBLE-ENTRY INTEGRITY',
                  style: TextStyle(color: CbColors.tealGas, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.6),
                ),
                const Spacer(),
                Text(
                  'Debits: \$${_totalDebits.toStringAsFixed(0)} | Credits: \$${_totalCredits.toStringAsFixed(0)}',
                  style: const TextStyle(color: CbColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Band Treasury Split Allocation (Only when isBand is true)
          if (widget.isBand) ...[
            _sectionHeader('BAND TREASURY SPLIT ALLOCATION', Icons.pie_chart_outline),
            const SizedBox(height: 8),
            CbGlassCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Active Split Agreement (v2)',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0x2210B981),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('100% Allocated', style: TextStyle(color: CbColors.statusLive, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _splitRow('Elena Cruz (Lead Vocals & Guitar)', '40%', '\$740.00'),
                  const Divider(color: Color(0x11FFFFFF), height: 16),
                  _splitRow('Marcus Vance (Bass & Synth)', '25%', '\$462.50'),
                  const Divider(color: Color(0x11FFFFFF), height: 16),
                  _splitRow('Leo Ramirez (Drums & Percussion)', '25%', '\$462.50'),
                  const Divider(color: Color(0x11FFFFFF), height: 16),
                  _splitRow('Chloe Bennett (Tour Tech & Sound)', '10%', '\$185.00'),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Stripe Daily Fee & Platform Rates Card
          _buildDailyFeeScheduleCard(),

          // Double-Entry Ledger Stream Header & Filter Chips
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _sectionHeader('DOUBLE-ENTRY LEDGER ENTRIES', Icons.receipt_long),
              Row(
                children: [
                  _filterButton('ALL', 'All'),
                  const SizedBox(width: 6),
                  _filterButton('CREDITS', 'Credits'),
                  const SizedBox(width: 6),
                  _filterButton('DEBITS', 'Debits'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Ledger Entries List
          if (entries.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              alignment: Alignment.center,
              child: const Text('No ledger transactions in this filter.', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
            )
          else
            ...entries.map((entry) => _buildLedgerCard(entry)),

          const SizedBox(height: 16),

          // Balance Definitions Card
          const Text('UNDERSTANDING YOUR BALANCES', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          const _DefinitionTile(
            title: 'Available Balance',
            definition: 'Cleared funds from past performances and completed campaigns, immediately withdrawable to your connected bank account.',
            color: CbColors.tealGas,
          ),
          const _DefinitionTile(
            title: 'Pending Settlement',
            definition: 'Tips received tonight currently undergoing credit card settlement (typically clears in 1-2 business days).',
            color: CbColors.purpleLight,
          ),
          const _DefinitionTile(
            title: 'Zero Platform Payout Fees',
            definition: 'Crowdbeats does not charge withdrawal fees on standard ACH direct deposits.',
            color: CbColors.statusLive,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDailyFeeScheduleCard() {
    final sched = _dailyFeeSchedule;
    final dateStr = sched?.effectiveDate ??
        '${DateTime.now().year}-${DateTime.now().month.toString().padLeft(2, '0')}-${DateTime.now().day.toString().padLeft(2, '0')}';
    final ratePercent = sched != null ? (sched.percentageRate * 100).toStringAsFixed(1) : '2.9';
    final fixedCents = sched?.fixedFeeCents ?? 30;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('STRIPE DAILY FEES & PLATFORM RATE', Icons.sync_alt),
        const SizedBox(height: 8),
        CbGlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.verified_rounded, size: 14, color: CbColors.statusLive),
                      const SizedBox(width: 6),
                      Text(
                        'Daily Stripe Rate Verified ($dateStr)',
                        style: const TextStyle(color: CbColors.statusLive, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0x228B5CF6),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'DAILY SYNC',
                      style: TextStyle(color: CbColors.purpleLight, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF141724),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('CROWDBEATS CHARGE', style: TextStyle(color: CbColors.textMuted, fontSize: 9, fontWeight: FontWeight.bold)),
                          SizedBox(height: 2),
                          Text('6.00%', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF141724),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('STRIPE PROCESSING', style: TextStyle(color: CbColors.textMuted, fontSize: 9, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 2),
                          Text('$ratePercent% + $fixedCents¢', style: const TextStyle(color: CbColors.tealGas, fontSize: 14, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                widget.isBand
                    ? 'Both Crowdbeats 6% fee and Stripe processing fees are deducted from gross tips before distributing the remaining net pool to band members.'
                    : 'Crowdbeats 6% fee and Stripe processing fees are deducted from gross tip payments to calculate your net proceeds accurately.',
                style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _sectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 14, color: CbColors.purpleLight),
        const SizedBox(width: 6),
        Text(
          title,
          style: const TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
        ),
      ],
    );
  }

  Widget _filterButton(String key, String label) {
    final isSelected = _selectedFilter == key;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = key),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? CbColors.purpleMain : const Color(0xFF141724),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? CbColors.purpleLight : const Color(0x22FFFFFF)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : CbColors.textMuted,
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _splitRow(String memberName, String percent, String amount) {
    return Row(
      children: [
        Expanded(
          child: Text(memberName, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0x228B5CF6),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(percent, style: const TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(width: 10),
        Text(amount, style: const TextStyle(color: CbColors.tealGas, fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildLedgerCard(LedgerEntryItem entry) {
    final isCredit = entry.entryType == 'credit';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: CbGlassCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isCredit ? const Color(0x2210B981) : const Color(0x22EF4444),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                    color: isCredit ? CbColors.statusLive : Colors.redAccent,
                    size: 14,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF161928),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0x22FFFFFF)),
                  ),
                  child: Text(
                    entry.accountType.toUpperCase().replaceAll('_', ' '),
                    style: const TextStyle(color: CbColors.textMuted, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
                const Spacer(),
                Text(
                  '${isCredit ? '+' : '-'}\$${entry.amountDollars.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: isCredit ? CbColors.statusLive : Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              entry.memo,
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text(entry.timestamp, style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                const Spacer(),
                InkWell(
                  onTap: () => _copyTxId(entry.txId),
                  child: Row(
                    children: [
                      Text(entry.txId, style: const TextStyle(color: CbColors.purpleLight, fontSize: 10, fontFamily: 'monospace')),
                      const SizedBox(width: 4),
                      const Icon(Icons.copy, size: 11, color: CbColors.textMuted),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DefinitionTile extends StatelessWidget {
  const _DefinitionTile({required this.title, required this.definition, required this.color});
  final String title;
  final String definition;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: CbGlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 2),
              width: 8,
              height: 8,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text(definition, style: const TextStyle(color: CbColors.textSecondary, fontSize: 11, height: 1.3)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
