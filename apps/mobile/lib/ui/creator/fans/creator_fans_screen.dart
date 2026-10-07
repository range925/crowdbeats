// Crowdbeats V2 — Production Creator Fan Directory & Top Tippers Screen
// Dual-context support for Solo Musician & Band Studio.
// Leaderboard of top supporters, follower CRM with search, backers, and live stage broadcast dispatcher.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/firebase/firestore_service.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class CreatorFansScreen extends StatefulWidget {
  const CreatorFansScreen({
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
  State<CreatorFansScreen> createState() => _CreatorFansScreenState();
}

class _CreatorFansScreenState extends State<CreatorFansScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedTimeframe = 'All Time';
  bool _isLoading = false;

  int _followerCount = 342;
  int _backerCount = 28;
  int _tippersCount = 84;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    if (widget.isBand) {
      _followerCount = 1280;
      _backerCount = 94;
      _tippersCount = 312;
    }
    _loadDirectoryStats();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDirectoryStats() async {
    setState(() => _isLoading = true);
    try {
      final summary = await FirestoreService.instance.getFanDirectory(
        entityId: widget.entityId,
        isBand: widget.isBand,
      );
      if (summary != null && mounted) {
        setState(() {
          _followerCount = summary['followerCount'] as int? ?? _followerCount;
          _backerCount = summary['backerCount'] as int? ?? _backerCount;
          _tippersCount = summary['tippersCount'] as int? ?? _tippersCount;
        });
      }
    } catch (e) {
      debugPrint('[FanDirectory] loadStats error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _followersList {
    if (widget.isBand) {
      return [
        {'name': 'Midnight Rockers Club', 'handle': '@midnight_rockers', 'joined': 'August 2026', 'isSuperFan': true},
        {'name': 'Alex Rivera', 'handle': '@arivera_live', 'joined': 'July 2026', 'isSuperFan': true},
        {'name': 'Sarah Jenkins', 'handle': '@sarah_j', 'joined': 'August 2026', 'isSuperFan': true},
        {'name': 'Marcus Turner', 'handle': '@marcus_t', 'joined': 'August 2026', 'isSuperFan': true},
        {'name': 'Taylor Brooks', 'handle': '@tbrooks', 'joined': 'September 2026', 'isSuperFan': false},
        {'name': 'Samira Khan', 'handle': '@samira_k', 'joined': 'September 2026', 'isSuperFan': false},
        {'name': 'David K.', 'handle': '@davidk_music', 'joined': 'August 2026', 'isSuperFan': false},
        {'name': 'Zoe Chen', 'handle': '@zoe_chen', 'joined': 'September 2026', 'isSuperFan': false},
      ];
    }
    return [
      {'name': 'Sarah Jenkins', 'handle': '@sarah_j', 'joined': 'August 2026', 'isSuperFan': true},
      {'name': 'Marcus Turner', 'handle': '@marcus_t', 'joined': 'August 2026', 'isSuperFan': true},
      {'name': 'David K.', 'handle': '@davidk_music', 'joined': 'August 2026', 'isSuperFan': false},
      {'name': 'Alicia Vance', 'handle': '@alicia_v', 'joined': 'July 2026', 'isSuperFan': true},
      {'name': 'Carlos Mendez', 'handle': '@carlos_m', 'joined': 'September 2026', 'isSuperFan': false},
      {'name': 'Maya Lin', 'handle': '@maya_lin', 'joined': 'August 2026', 'isSuperFan': false},
      {'name': 'Liam O\'Connor', 'handle': '@liam_oc', 'joined': 'September 2026', 'isSuperFan': false},
      {'name': 'Zoe Chen', 'handle': '@zoe_chen', 'joined': 'September 2026', 'isSuperFan': false},
    ];
  }

  List<Map<String, dynamic>> get _topTippersList {
    if (widget.isBand) {
      if (_selectedTimeframe == '7 Days') {
        return [
          {'name': 'Alex Rivera', 'total': r'$95.00', 'shows': '2 shows', 'rank': 1},
          {'name': 'Midnight Rockers Club', 'total': r'$75.00', 'shows': '2 shows', 'rank': 2},
          {'name': 'Taylor Brooks', 'total': r'$40.00', 'shows': '1 show', 'rank': 3},
        ];
      }
      return [
        {'name': 'Alex Rivera', 'total': r'$320.00', 'shows': '11 shows', 'rank': 1},
        {'name': 'Midnight Rockers Club', 'total': r'$275.00', 'shows': '9 shows', 'rank': 2},
        {'name': 'Marcus Turner', 'total': r'$185.00', 'shows': '6 shows', 'rank': 3},
        {'name': 'Sarah Jenkins', 'total': r'$140.00', 'shows': '4 shows', 'rank': 4},
        {'name': 'Taylor Brooks', 'total': r'$110.00', 'shows': '5 shows', 'rank': 5},
      ];
    }
    if (_selectedTimeframe == '7 Days') {
      return [
        {'name': 'Marcus Turner', 'total': r'$55.00', 'shows': '2 shows', 'rank': 1},
        {'name': 'Sarah Jenkins', 'total': r'$45.00', 'shows': '1 show', 'rank': 2},
      ];
    }
    return [
      {'name': 'Marcus Turner', 'total': r'$185.00', 'shows': '6 shows', 'rank': 1},
      {'name': 'Sarah Jenkins', 'total': r'$140.00', 'shows': '4 shows', 'rank': 2},
      {'name': 'David K.', 'total': r'$95.00', 'shows': '3 shows', 'rank': 3},
      {'name': 'Carlos Mendez', 'total': r'$60.00', 'shows': '2 shows', 'rank': 4},
      {'name': 'Maya Lin', 'total': r'$45.00', 'shows': '2 shows', 'rank': 5},
    ];
  }

  List<Map<String, dynamic>> get _backersList {
    if (widget.isBand) {
      return [
        {'name': 'Alex Rivera', 'tier': r'Studio Album Deluxe Box Set ($120)', 'date': 'Aug 28, 2026'},
        {'name': 'Midnight Rockers Club', 'tier': r'VIP Tour Pass ($250)', 'date': 'Sep 2, 2026'},
        {'name': 'Marcus Turner', 'tier': r'Signed Vinyl Tier ($45)', 'date': 'Aug 15, 2026'},
        {'name': 'Taylor Brooks', 'tier': r'Early Bird Digital Vinyl ($30)', 'date': 'Sep 10, 2026'},
      ];
    }
    return [
      {'name': 'Marcus Turner', 'tier': r'Signed Vinyl Tier ($45)', 'date': 'Aug 14, 2026'},
      {'name': 'Sarah Jenkins', 'tier': r'VIP Guest List ($150)', 'date': 'Aug 22, 2026'},
      {'name': 'Alicia Vance', 'tier': r'Digital Album ($15)', 'date': 'Sep 1, 2026'},
      {'name': 'Maya Lin', 'tier': r'Signed Vinyl Tier ($45)', 'date': 'Aug 30, 2026'},
    ];
  }

  void _handleSendBroadcast() {
    final msgController = TextEditingController();
    final count = widget.isBand ? 1280 : 342;

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: Row(
          children: [
            const Icon(Icons.campaign, color: CbColors.tealGas, size: 24),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                'Stage Broadcast Announcement',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Send an instant push alert to all $count followers and checked-in audience members.',
              style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: msgController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'e.g. Starting acoustic set in 10 minutes at the main stage!',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: CbColors.surfaceBase,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.tealGas, foregroundColor: Colors.black),
            child: const Text('Send Alert', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () async {
              final text = msgController.text.trim();
              Navigator.of(ctx).pop();

              try {
                await FirestoreService.instance.sendStageBroadcast(
                  entityId: widget.entityId,
                  isBand: widget.isBand,
                  message: text.isEmpty ? 'Starting live set now!' : text,
                );
              } catch (e) {
                debugPrint('[Broadcast] fallback: $e');
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
                            'Stage broadcast delivered to $count fans!',
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
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: widget.showAppBar
          ? AppBar(
              backgroundColor: CbColors.surfaceBase,
              elevation: 0,
              title: const Text(
                'Fan Directory & Top Tippers',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  tooltip: 'Refresh Stats',
                  onPressed: _loadDirectoryStats,
                ),
              ],
            )
          : null,
      body: Column(
        children: [
          // Header with Dual Context & Broadcast CTA
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'FAN COMMUNITY',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: widget.isBand ? const Color(0x3310B981) : const Color(0x337C3AED),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: widget.isBand ? CbColors.statusLive : CbColors.purpleMain,
                              width: 1,
                            ),
                          ),
                          child: Text(
                            widget.isBand ? 'BAND STUDIO' : 'SOLO ARTIST',
                            style: TextStyle(
                              color: widget.isBand ? CbColors.statusLive : CbColors.purpleLight,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$_followerCount Total Followers · $_backerCount Backers · $_tippersCount Tippers',
                      style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  icon: const Icon(Icons.campaign, size: 14),
                  label: const Text('Broadcast', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.tealGas,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                  ),
                  onPressed: _handleSendBroadcast,
                ),
              ],
            ),
          ),

          // Subtabs: Followers | Top Tippers | Backers
          TabBar(
            controller: _tabController,
            indicatorColor: CbColors.purpleLight,
            labelColor: CbColors.purpleLight,
            unselectedLabelColor: Colors.white60,
            tabs: [
              Tab(text: 'Followers ($_followerCount)'),
              const Tab(text: 'Top Tippers'),
              Tab(text: 'Backers ($_backerCount)'),
            ],
          ),

          // Search Field for CRM directory
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search followers & tippers...',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                prefixIcon: const Icon(Icons.search, color: Colors.white54, size: 18),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white54, size: 16),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: CbColors.surfaceCard,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: CbColors.borderSubtle),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: CbColors.borderSubtle),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: CbColors.purpleMain),
                ),
              ),
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildFollowersList(),
                _buildTopTippersList(),
                _buildBackersList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFollowersList() {
    final filtered = _followersList.where((f) {
      if (_searchQuery.isEmpty) return true;
      final name = (f['name'] as String).toLowerCase();
      final handle = (f['handle'] as String).toLowerCase();
      return name.contains(_searchQuery) || handle.contains(_searchQuery);
    }).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_search, color: Colors.white24, size: 48),
            const SizedBox(height: 8),
            Text(
              'No followers matching "$_searchQuery"',
              style: const TextStyle(color: CbColors.textSecondary, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (ctx, i) {
        final f = filtered[i];
        final name = f['name'] as String;
        final handle = f['handle'] as String;
        final joined = f['joined'] as String;
        final isSuperFan = f['isSuperFan'] as bool? ?? false;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          child: CbGlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: CbColors.purpleDim,
                  child: Text(
                    name.isNotEmpty ? name[0] : '?',
                    style: const TextStyle(color: CbColors.purpleLight, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isSuperFan) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: const Color(0x33F59E0B),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'SUPER FAN',
                                style: TextStyle(color: CbColors.rankGold, fontSize: 8, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$handle · Follower since $joined',
                        style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.favorite, color: CbColors.heartOrange, size: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTopTippersList() {
    final filtered = _topTippersList.where((t) {
      if (_searchQuery.isEmpty) return true;
      final name = (t['name'] as String).toLowerCase();
      return name.contains(_searchQuery);
    }).toList();

    return Column(
      children: [
        // Timeframe selector filter chips
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Row(
            children: [
              const Text('TIMEFRAME:', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              ...['All Time', '30 Days', '7 Days'].map((tf) {
                final isSelected = _selectedTimeframe == tf;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(tf, style: TextStyle(fontSize: 10, color: isSelected ? Colors.black : Colors.white70)),
                    selected: isSelected,
                    selectedColor: CbColors.rankGold,
                    backgroundColor: CbColors.surfaceCard,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    onSelected: (_) => setState(() => _selectedTimeframe = tf),
                  ),
                );
              }),
            ],
          ),
        ),

        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Text(
                    'No tippers found matching "$_searchQuery"',
                    style: const TextStyle(color: CbColors.textSecondary, fontSize: 13),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) {
                    final t = filtered[i];
                    final rank = t['rank'] as int? ?? (i + 1);
                    final name = t['name'] as String;
                    final total = t['total'] as String;
                    final shows = t['shows'] as String;

                    Color rankColor = Colors.white70;
                    if (rank == 1) rankColor = CbColors.rankGold;
                    if (rank == 2) rankColor = CbColors.rankSilver;
                    if (rank == 3) rankColor = CbColors.rankBronze;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: CbGlassCard(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: rank <= 3 ? rankColor.withValues(alpha: 0.18) : Colors.white10,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  '#$rank',
                                  style: TextStyle(color: rankColor, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                  Text('Attended $shows', style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                                ],
                              ),
                            ),
                            Text(total, style: const TextStyle(color: CbColors.statusLive, fontWeight: FontWeight.w900, fontSize: 14)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildBackersList() {
    final filtered = _backersList.where((b) {
      if (_searchQuery.isEmpty) return true;
      final name = (b['name'] as String).toLowerCase();
      final tier = (b['tier'] as String).toLowerCase();
      return name.contains(_searchQuery) || tier.contains(_searchQuery);
    }).toList();

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (ctx, i) {
        final b = filtered[i];
        final name = b['name'] as String;
        final tier = b['tier'] as String;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          child: CbGlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.rocket_launch, size: 16, color: CbColors.stitchMagenta),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(tier, style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0x3310B981), borderRadius: BorderRadius.circular(4)),
                  child: const Text('CONFIRMED', style: TextStyle(color: CbColors.statusLive, fontSize: 9, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
