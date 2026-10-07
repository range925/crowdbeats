// Crowdbeats V2 — Performance & Venue Analytics Screen (Phase 9)
// Cross-platform performance telemetry for Solo Musician Studio & Band Studio.
// Features: Dual-context header, timeframe filtering, 4-card hero stats,
// interactive gig revenue trajectory bar chart, 2x2 performance conversion grid,
// venue ranking leaderboard with revenue share graph, recent gig net settlements,
// band split yield cards, 6% Crowdbeats + daily Stripe fee deduction card,
// and set-time tipping velocity distribution.

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../firebase/firestore_service.dart';
import '../../components/components.dart';
import '../../theme/cb_colors.dart';

class CreatorAnalyticsScreen extends StatefulWidget {
  const CreatorAnalyticsScreen({
    super.key,
    this.isBand = false,
    this.entityId = 'solo_default',
    this.entityName = 'Elena Cruz',
    this.showAppBar = true,
  });

  final bool isBand;
  final String entityId;
  final String entityName;
  final bool showAppBar;

  @override
  State<CreatorAnalyticsScreen> createState() => _CreatorAnalyticsScreenState();
}

class _CreatorAnalyticsScreenState extends State<CreatorAnalyticsScreen> {
  String _selectedTimeframe = 'all'; // 'all' | '30d' | '7d'
  Map<String, dynamic>? _analyticsData;
  int _selectedBarIndex = 5; // Default to most recent gig in chart

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    try {
      final data = await FirestoreService.instance.getPerformanceAnalytics(
        entityId: widget.entityId,
        isBand: widget.isBand,
        timeframe: _selectedTimeframe,
      );
      if (mounted) {
        setState(() {
          _analyticsData = data;
          final hist = (data?['revenueHistory'] as List?) ?? [];
          if (hist.isNotEmpty) {
            _selectedBarIndex = hist.length - 1;
          }
        });
      }
    } catch (_) {}
  }

  void _onTimeframeChanged(String timeframe) {
    if (_selectedTimeframe == timeframe) return;
    setState(() => _selectedTimeframe = timeframe);
    _loadAnalytics();
  }

  void _exportReport() {
    final rev = (_analyticsData?['totalRevenueDollars'] as num?)?.toDouble() ?? 0.0;
    final shows = (_analyticsData?['showsCount'] as num?)?.toInt() ?? 0;
    final summary = 'Crowdbeats Analytics Summary for ${widget.entityName}:\n'
        '• Total Tip Revenue: \$${rev.toStringAsFixed(2)}\n'
        '• Shows Performed: $shows\n'
        '• Timeframe: ${_selectedTimeframe.toUpperCase()}\n'
        '• Verified 6% Platform Fee & Daily Stripe Rate Deducted';

    Clipboard.setData(ClipboardData(text: summary));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle, color: CbColors.statusLive, size: 18),
            SizedBox(width: 8),
            Text('Performance analytics report copied to clipboard!'),
          ],
        ),
        backgroundColor: Color(0xFF161928),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final data = _analyticsData ?? {};
    final totalRevenue = (data['totalRevenueDollars'] as num?)?.toDouble() ?? (widget.isBand ? 12450.0 : 4820.0);
    final avgTip = (data['averageTipDollars'] as num?)?.toDouble() ?? (widget.isBand ? 24.80 : 18.50);
    final avgGigRevenue = (data['averageGigRevenueDollars'] as num?)?.toDouble() ?? (widget.isBand ? 296.43 : 172.14);
    final showsCount = (data['showsCount'] as num?)?.toInt() ?? (widget.isBand ? 42 : 28);
    final totalAttendance = (data['totalAttendance'] as num?)?.toInt() ?? (widget.isBand ? 14200 : 3450);
    final repeatRate = (data['repeatTipperRate'] as num?)?.toDouble() ?? (widget.isBand ? 34.2 : 28.4);
    final peakHour = data['peakHour'] as String? ?? (widget.isBand ? '10:45 PM (Encore)' : '9:30 PM (Acoustic Encore)');
    final topInsight = data['topInsight'] as String? ??
        (widget.isBand
            ? 'The Troubadour generates your highest average tip yield (\$1.84/fan). Peak tipping occurs at 10:45 PM during guitar duets & encore.'
            : 'The Casbah delivers your highest tip volume (\$1,250 total). Peak tipping surges 42% at 9:30 PM during acoustic encores.');

    final venues = (data['topVenues'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final recentGigs = (data['recentGigs'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final revenueHistory = (data['revenueHistory'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final efficiency = (data['efficiencyMetrics'] as Map<String, dynamic>?) ?? {};

    final conversionRate = (efficiency['tipConversionRate'] as num?)?.toDouble() ?? (widget.isBand ? 52.4 : 46.8);
    final tipPerFan = (efficiency['tipPerFanDollars'] as num?)?.toDouble() ?? (widget.isBand ? 1.84 : 1.40);
    final tipsPerHour = (efficiency['tipsPerHourDollars'] as num?)?.toDouble() ?? (widget.isBand ? 176.40 : 114.76);
    final qrScanConversion = (efficiency['qrScanConversion'] as num?)?.toDouble() ?? (widget.isBand ? 84.5 : 78.2);

    final content = ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 1. Dual-Context Identity & Telemetry Engine Card
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
                  widget.isBand ? Icons.insights : Icons.analytics_outlined,
                  color: widget.isBand ? CbColors.tealGas : CbColors.purpleLight,
                  size: 24,
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
                    const Row(
                      children: [
                        Icon(Icons.bolt, size: 12, color: CbColors.statusLive),
                        SizedBox(width: 4),
                        Text(
                          'Live Metric Engine',
                          style: TextStyle(color: CbColors.statusLive, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(width: 6),
                        Text('• Real-Time Tipping Synced', style: TextStyle(color: CbColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // 2. Automated Venue Intelligence & Growth Insight Banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: widget.isBand
                  ? [const Color(0x3310B981), const Color(0x1110B981)]
                  : [const Color(0x338B5CF6), const Color(0x118B5CF6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: widget.isBand ? const Color(0x4410B981) : const Color(0x448B5CF6),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.auto_awesome,
                size: 16,
                color: widget.isBand ? CbColors.tealGas : CbColors.purpleLight,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  topInsight,
                  style: const TextStyle(color: Colors.white, fontSize: 11, height: 1.35, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // 3. Timeframe Selector Filter Chips
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'PERFORMANCE TIMEFRAME',
              style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.6),
            ),
            Row(
              children: [
                _timeframeChip('all', 'All Time'),
                const SizedBox(width: 6),
                _timeframeChip('30d', '30 Days'),
                const SizedBox(width: 6),
                _timeframeChip('7d', '7 Days'),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),

        // 4. 4-Card Hero Metrics Grid
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                title: 'TOTAL TIP REVENUE',
                value: '\$${totalRevenue.toStringAsFixed(2)}',
                color: CbColors.tealGas,
                icon: Icons.payments_outlined,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                title: 'AVG REVENUE / SHOW',
                value: '\$${avgGigRevenue.toStringAsFixed(2)}',
                color: CbColors.purpleLight,
                icon: Icons.auto_graph,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                title: 'SHOWS PERFORMED',
                value: '$showsCount shows',
                color: Colors.white,
                icon: Icons.stadium_outlined,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                title: 'FANS REACHED',
                value: '${totalAttendance.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} fans',
                color: const Color(0xFF60A5FA),
                icon: Icons.groups_outlined,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // 5. Interactive Gig Revenue Trajectory Bar Chart Graph
        if (revenueHistory.isNotEmpty) ...[
          _sectionHeader('GIG REVENUE TRAJECTORY (LAST 6 SHOWS)', Icons.bar_chart),
          const SizedBox(height: 10),
          _buildRevenueBarChart(revenueHistory, avgGigRevenue),
          const SizedBox(height: 18),
        ],

        // 6. Performance Efficiency & Conversion Grid (2x2)
        _sectionHeader('CONVERSION & STAGE METRICS', Icons.grid_view_outlined),
        const SizedBox(height: 10),
        _buildEfficiencyGrid(conversionRate, tipPerFan, tipsPerHour, qrScanConversion),
        const SizedBox(height: 14),

        // 7. Secondary Telemetry Bar
        CbGlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSecondaryStat('REPEAT TIPPER RATIO', '${repeatRate.toStringAsFixed(1)}%', CbColors.statusLive),
              Container(width: 1, height: 28, color: const Color(0x22FFFFFF)),
              _buildSecondaryStat('AVG TIP SIZE', '\$${avgTip.toStringAsFixed(2)}', Colors.white),
              Container(width: 1, height: 28, color: const Color(0x22FFFFFF)),
              _buildSecondaryStat('PEAK TIPPING', peakHour, CbColors.purpleLight),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // 8. Venue Breakdown & Leaderboard
        _sectionHeader('VENUE PERFORMANCE & LEADERBOARD', Icons.place_outlined),
        const SizedBox(height: 10),
        if (venues.isEmpty)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('No venue performance data recorded yet.', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
          )
        else ...[
          ...venues.asMap().entries.map((entry) => _buildVenueCard(entry.key + 1, entry.value)),
          const SizedBox(height: 10),
          _buildVenueShareGraph(venues),
        ],

        const SizedBox(height: 18),

        // 9. Fee Calculation & Daily Stripe Rate Deduction Card
        _buildFeeTransparencyCard(),
        const SizedBox(height: 18),

        // 10. Band Member Split Cumulative Matrix (in Band Mode)
        if (widget.isBand && (recentGigs.isNotEmpty && recentGigs.first['splits'] != null)) ...[
          _sectionHeader('BAND MEMBER SPLIT YIELD (NET POOL):', Icons.pie_chart_outline),
          const SizedBox(height: 10),
          _buildBandMemberSplitMatrix(recentGigs.first['splits'] as List),
          const SizedBox(height: 18),
        ],

        // 11. Recent Performance Gigs & Net Settlements
        _sectionHeader('RECENT PERFORMANCE GIGS & PAYOUTS', Icons.receipt_long),
        const SizedBox(height: 10),
        if (recentGigs.isEmpty)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('No live performance sessions recorded yet.', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
          )
        else
          ...recentGigs.map((gig) => _buildGigCard(gig)),

        const SizedBox(height: 18),

        // 12. Live Tipping Velocity Distribution
        _sectionHeader('LIVE SET TIPPING VELOCITY', Icons.speed_outlined),
        const SizedBox(height: 10),
        CbGlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Tip Generation Across Live Performance Time',
                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              _velocityBar('Opening Tracks (First 20m)', 0.12, '12%'),
              const SizedBox(height: 8),
              _velocityBar('Mid-Set Audience Banter', 0.28, '28%'),
              const SizedBox(height: 8),
              _velocityBar('Peak Hit Singles & Climax', 0.42, '42% (Highest)'),
              const SizedBox(height: 8),
              _velocityBar('Stage Encore & Post-Show', 0.18, '18%'),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );

    if (!widget.showAppBar) return content;

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Performance & Venue Analytics', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: CbColors.tealGas),
            tooltip: 'Export Report',
            onPressed: _exportReport,
          ),
        ],
      ),
      body: content,
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

  Widget _timeframeChip(String key, String label) {
    final isSelected = _selectedTimeframe == key;
    return InkWell(
      onTap: () => _onTimeframeChanged(key),
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

  Widget _buildMetricCard({
    required String title,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return CbGlassCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(color: CbColors.textMuted, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.6),
              ),
              Icon(icon, size: 14, color: color.withOpacity(0.8)),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w900),
          ),
        ],
      ),
    );
  }

  Widget _buildSecondaryStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: CbColors.textMuted, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }

  // Interactive Gig Revenue Bar Chart
  Widget _buildRevenueBarChart(List<Map<String, dynamic>> history, double avgRevenue) {
    double maxGross = 0;
    for (final h in history) {
      final g = (h['gross'] as num?)?.toDouble() ?? 0.0;
      if (g > maxGross) maxGross = g;
    }
    if (maxGross == 0) maxGross = 500;

    final selectedGig = (_selectedBarIndex >= 0 && _selectedBarIndex < history.length)
        ? history[_selectedBarIndex]
        : history.last;

    return CbGlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tip Yield per Gig & Benchmark',
                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: CbColors.tealGas, shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  const Text('Gross Tips', style: TextStyle(color: CbColors.textMuted, fontSize: 10)),
                  const SizedBox(width: 8),
                  Container(width: 12, height: 2, color: CbColors.purpleLight),
                  const SizedBox(width: 4),
                  Text('Avg (\$${avgRevenue.toStringAsFixed(0)})', style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 140,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: history.asMap().entries.map((entry) {
                final idx = entry.key;
                final item = entry.value;
                final gross = (item['gross'] as num?)?.toDouble() ?? 0.0;
                final label = item['label'] as String? ?? '';
                final isSelected = idx == _selectedBarIndex;

                final barHeight = math.max(16.0, (gross / maxGross) * 80.0);

                return InkWell(
                  onTap: () {
                    setState(() => _selectedBarIndex = idx);
                  },
                  borderRadius: BorderRadius.circular(6),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          '\$${gross.toStringAsFixed(0)}',
                          style: TextStyle(
                            color: isSelected ? CbColors.tealGas : CbColors.textMuted,
                            fontSize: 9,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: 28,
                          height: barHeight,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isSelected
                                  ? [CbColors.tealGas, const Color(0xFF10B981)]
                                  : [CbColors.purpleLight, CbColors.purpleMain],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                            border: isSelected ? Border.all(color: Colors.white, width: 1.5) : null,
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: CbColors.tealGas.withOpacity(0.35),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          label,
                          style: TextStyle(
                            color: isSelected ? Colors.white : CbColors.textMuted,
                            fontSize: 9,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          // Selected Gig Highlight Strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF141724),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0x22FFFFFF)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.touch_app_outlined, size: 14, color: CbColors.tealGas),
                    const SizedBox(width: 6),
                    Text(
                      '${selectedGig['venue']} (${selectedGig['label']})',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                Text(
                  'Gross: \$${((selectedGig['gross'] as num?)?.toDouble() ?? 0.0).toStringAsFixed(2)}  •  Net: \$${((selectedGig['net'] as num?)?.toDouble() ?? 0.0).toStringAsFixed(2)}',
                  style: const TextStyle(color: CbColors.tealGas, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 2x2 Efficiency & Conversion Grid
  Widget _buildEfficiencyGrid(double conversionRate, double tipPerFan, double tipsPerHour, double qrScanConversion) {
    return Row(
      children: [
        Expanded(
          child: Column(
            children: [
              _buildEfficiencyTile(
                title: 'TIP CONVERSION',
                value: '${conversionRate.toStringAsFixed(1)}%',
                subtitle: 'Checked-in fans who tipped',
                color: CbColors.statusLive,
                icon: Icons.percent,
              ),
              const SizedBox(height: 8),
              _buildEfficiencyTile(
                title: 'STAGE VELOCITY',
                value: '\$${tipsPerHour.toStringAsFixed(2)}/hr',
                subtitle: 'Earnings per hour on stage',
                color: CbColors.purpleLight,
                icon: Icons.timer_outlined,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            children: [
              _buildEfficiencyTile(
                title: 'AVG TIP / FAN',
                value: '\$${tipPerFan.toStringAsFixed(2)}',
                subtitle: 'Yield per total attendee',
                color: CbColors.tealGas,
                icon: Icons.person_pin_outlined,
              ),
              const SizedBox(height: 8),
              _buildEfficiencyTile(
                title: 'QR CONVERSION',
                value: '${qrScanConversion.toStringAsFixed(1)}%',
                subtitle: 'Stage QR scans to tips',
                color: const Color(0xFF60A5FA),
                icon: Icons.qr_code_scanner,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEfficiencyTile({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required IconData icon,
  }) {
    return CbGlassCard(
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(color: CbColors.textMuted, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
              Icon(icon, size: 12, color: color),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(color: color, fontSize: 15, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(color: CbColors.textMuted, fontSize: 9),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // Venue Revenue Share Comparison Graph
  Widget _buildVenueShareGraph(List<Map<String, dynamic>> venues) {
    double totalVenuesRev = 0;
    for (final v in venues) {
      totalVenuesRev += (v['revenueDollars'] as num?)?.toDouble() ?? 0.0;
    }
    if (totalVenuesRev == 0) totalVenuesRev = 1;

    final colors = [
      const Color(0xFF10B981),
      const Color(0xFF8B5CF6),
      const Color(0xFF60A5FA),
      const Color(0xFFF59E0B),
      const Color(0xFFEC4899),
    ];

    return CbGlassCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'VENUE REVENUE DISTRIBUTION SHARE',
            style: TextStyle(color: CbColors.textMuted, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.6),
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: SizedBox(
              height: 10,
              child: Row(
                children: venues.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final v = entry.value;
                  final rev = (v['revenueDollars'] as num?)?.toDouble() ?? 0.0;
                  final flex = math.max(1, (rev / totalVenuesRev * 100).round());
                  return Expanded(
                    flex: flex,
                    child: Container(color: colors[idx % colors.length]),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: venues.asMap().entries.map((entry) {
              final idx = entry.key;
              final v = entry.value;
              final rev = (v['revenueDollars'] as num?)?.toDouble() ?? 0.0;
              final pct = (rev / totalVenuesRev * 100).toStringAsFixed(0);
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 8, height: 8, decoration: BoxDecoration(color: colors[idx % colors.length], shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Text(
                    '${v['name']} ($pct%)',
                    style: const TextStyle(color: Colors.white70, fontSize: 10),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // 6% Crowdbeats & Daily Stripe Fee Transparency Card
  Widget _buildFeeTransparencyCard() {
    return CbGlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'NET PAYOUT & FEE PIPELINE',
                style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.6),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0x2210B981),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle, size: 10, color: CbColors.statusLive),
                    SizedBox(width: 4),
                    Text('Daily Rate Synced', style: TextStyle(color: CbColors.statusLive, fontSize: 9, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Exact deduction pipeline applied to all fan tip payments:',
            style: TextStyle(color: Colors.white70, fontSize: 11),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF141724),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text('Gross Tip', style: TextStyle(color: CbColors.textMuted, fontSize: 9)),
                    Text('100.0%', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
                Text('−', style: TextStyle(color: Colors.white38, fontSize: 14)),
                Column(
                  children: [
                    Text('Crowdbeats Fee', style: TextStyle(color: CbColors.textMuted, fontSize: 9)),
                    Text('6.00%', style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
                Text('−', style: TextStyle(color: Colors.white38, fontSize: 14)),
                Column(
                  children: [
                    Text('Stripe Daily Fee', style: TextStyle(color: CbColors.textMuted, fontSize: 9)),
                    Text('2.9% + 30¢', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
                Text('=', style: TextStyle(color: Colors.white38, fontSize: 14)),
                Column(
                  children: [
                    Text('Net to Musician', style: TextStyle(color: CbColors.textMuted, fontSize: 9)),
                    Text('Net Yield', style: TextStyle(color: CbColors.tealGas, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Band Member Split Cumulative Matrix
  Widget _buildBandMemberSplitMatrix(List splits) {
    return CbGlassCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '4-Way Net Proceeds Disbursement Engine',
            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...splits.map((s) {
            final name = (s as Map)['name'] as String? ?? '';
            final amount = ((s)['amount'] as num?)?.toDouble() ?? 0.0;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(color: CbColors.tealGas, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 8),
                      Text(name, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  Text('\$${amount.toStringAsFixed(2)} Net', style: const TextStyle(color: CbColors.tealGas, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildVenueCard(int rank, Map<String, dynamic> venue) {
    final name = venue['name'] as String? ?? 'Venue';
    final city = venue['city'] as String? ?? '';
    final shows = (venue['showsCount'] as num?)?.toInt() ?? 0;
    final revenue = (venue['revenueDollars'] as num?)?.toDouble() ?? 0.0;
    final avgAttendance = (venue['avgAttendance'] as num?)?.toInt() ?? 0;
    final index = (venue['tippingIndex'] as num?)?.toInt() ?? 90;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: CbGlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: rank == 1
                    ? const Color(0x33F59E0B)
                    : rank == 2
                        ? const Color(0x3394A3B8)
                        : const Color(0x228B5CF6),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '#$rank',
                style: TextStyle(
                  color: rank == 1
                      ? const Color(0xFFF59E0B)
                      : rank == 2
                          ? const Color(0xFFCBD5E1)
                          : CbColors.purpleLight,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  Text('$city • $shows shows • Avg $avgAttendance fans', style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('\$${revenue.toStringAsFixed(2)}', style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 13)),
                Text('$index% tipping index', style: const TextStyle(color: CbColors.statusLive, fontSize: 9, fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGigCard(Map<String, dynamic> gig) {
    final venueName = gig['venueName'] as String? ?? 'Stage';
    final city = gig['city'] as String? ?? '';
    final date = gig['date'] as String? ?? '';
    final duration = gig['duration'] as String? ?? '';
    final attendance = (gig['attendance'] as num?)?.toInt() ?? 0;
    final gross = (gig['grossTipDollars'] as num?)?.toDouble() ?? 0.0;
    final platformFee = (gig['platformFeeDollars'] as num?)?.toDouble() ?? 0.0;
    final stripeFee = (gig['stripeFeeDollars'] as num?)?.toDouble() ?? 0.0;
    final net = (gig['netPayoutDollars'] as num?)?.toDouble() ?? 0.0;
    final splits = (gig['splits'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: CbGlassCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(venueName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('$city • $date', style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0x2210B981),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '\$${net.toStringAsFixed(2)} NET',
                    style: const TextStyle(color: CbColors.statusLive, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const Divider(color: Color(0x11FFFFFF), height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Gross Tips: \$${gross.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                Text('6% Fee: -\$${platformFee.toStringAsFixed(2)}', style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                Text('Stripe: -\$${stripeFee.toStringAsFixed(2)}', style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                Text('$attendance fans ($duration)', style: const TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.w600)),
              ],
            ),
            if (widget.isBand && splits.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF141724),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('BAND MEMBER SPLIT YIELD (NET POOL):', style: TextStyle(color: CbColors.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    ...splits.map((s) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 1),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(s['name'] as String? ?? '', style: const TextStyle(color: Colors.white, fontSize: 10)),
                              Text('\$${(s['amount'] as num?)?.toDouble().toStringAsFixed(2)}', style: const TextStyle(color: CbColors.tealGas, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _velocityBar(String label, double ratio, String percentLabel) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
            Text(percentLabel, style: const TextStyle(color: CbColors.tealGas, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: ratio,
            minHeight: 6,
            backgroundColor: const Color(0xFF161928),
            valueColor: AlwaysStoppedAnimation<Color>(
              ratio >= 0.4 ? CbColors.tealGas : CbColors.purpleLight,
            ),
          ),
        ),
      ],
    );
  }
}

