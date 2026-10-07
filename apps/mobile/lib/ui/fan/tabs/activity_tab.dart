// Crowdbeats V2 — Fan Activity & Notifications Feed
// Complete interactive activity stream with filter chips, item action menus,
// receipt viewer, notification preferences modal, and live stage alerts.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_live_badge.dart';
import '../activity/receipt_screen.dart';
import '../../../state/auth_state.dart';

enum ActivityType { tip, live, follow, campaign, system }

class ActivityModel {
  ActivityModel({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.timeAgo,
    required this.dateGroup,
    this.amount,
    this.avatarUrl,
    this.venue,
    this.artistName,
    this.fanName,
    this.handle,
    this.progressPercent,
    this.isRead = false,
    this.isSilenced = false,
    this.tipDetails,
  });

  final String id;
  final ActivityType type;
  final String title;
  final String subtitle;
  final String timeAgo;
  final String dateGroup;
  final String? amount;
  final String? avatarUrl;
  final String? venue;
  final String? artistName;
  final String? fanName;
  final String? handle;
  final int? progressPercent;
  bool isRead;
  bool isSilenced;
  final Map<String, dynamic>? tipDetails;
}

class ActivityTab extends ConsumerStatefulWidget {
  const ActivityTab({super.key});

  @override
  ConsumerState<ActivityTab> createState() => _ActivityTabState();
}

class _ActivityTabState extends ConsumerState<ActivityTab> {
  String _selectedFilter = 'All';

  bool _alertLiveSets = true;
  bool _alertTipReceipts = true;
  bool _alertCampaigns = true;
  bool _alertFollowers = true;

  late List<ActivityModel> _activities;

  @override
  void initState() {
    super.initState();
    _activities = [
      ActivityModel(
        id: 'act_1',
        type: ActivityType.tip,
        title: 'Tipped Luna & The Waves',
        subtitle: 'The Casbah • Main Stage — Verified on ledger',
        timeAgo: '2h ago',
        dateGroup: 'TODAY',
        amount: r'+$10.00',
        artistName: 'Luna & The Waves',
        venue: 'The Casbah • Main Stage',
        avatarUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80',
        tipDetails: {
          'id': 'tip_demo_1',
          'recipientName': 'Luna & The Waves',
          'amountCents': 1000,
          'status': 'succeeded',
          'feeCovered': true,
          'createdAt': null,
        },
      ),
      ActivityModel(
        id: 'act_2',
        type: ActivityType.live,
        title: 'Velvet Horizon went live',
        subtitle: 'Soda Bar • Stage A',
        timeAgo: '4h ago',
        dateGroup: 'TODAY',
        artistName: 'Velvet Horizon',
        venue: 'Soda Bar • Stage A',
        avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
      ),
      ActivityModel(
        id: 'act_3',
        type: ActivityType.follow,
        title: 'Marcus Cole followed you',
        subtitle: '@mcolemusic • 1d ago',
        timeAgo: '1d ago',
        dateGroup: 'YESTERDAY',
        fanName: 'Marcus Cole',
        handle: '@mcolemusic',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      ),
      ActivityModel(
        id: 'act_4',
        type: ActivityType.campaign,
        title: 'Luna & The Waves • New Album Pressing',
        subtitle: 'Reached 80% funding milestone',
        timeAgo: '1d ago',
        dateGroup: 'YESTERDAY',
        artistName: 'Luna & The Waves',
        progressPercent: 80,
      ),
      ActivityModel(
        id: 'act_5',
        type: ActivityType.tip,
        title: 'Tipped Neon Solstice',
        subtitle: 'Music Box • Rooftop — Verified on ledger',
        timeAgo: '3d ago',
        dateGroup: 'THIS WEEK',
        amount: r'+$20.00',
        artistName: 'Neon Solstice',
        venue: 'Music Box • Rooftop',
        avatarUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=150&auto=format&fit=crop&q=80',
        tipDetails: {
          'id': 'tip_demo_2',
          'recipientName': 'Neon Solstice',
          'amountCents': 2000,
          'status': 'succeeded',
          'feeCovered': true,
          'createdAt': null,
        },
      ),
      ActivityModel(
        id: 'act_6',
        type: ActivityType.system,
        title: 'System Security Update',
        subtitle: 'Stripe 256-bit encryption verified for your wallet.',
        timeAgo: '4d ago',
        dateGroup: 'THIS WEEK',
      ),
    ];
  }

  List<ActivityModel> get _filteredActivities {
    switch (_selectedFilter) {
      case 'Tips':
        return _activities.where((a) => a.type == ActivityType.tip).toList();
      case 'Follows':
        return _activities.where((a) => a.type == ActivityType.follow).toList();
      case 'Campaigns':
        return _activities.where((a) => a.type == ActivityType.campaign).toList();
      case 'Alerts':
        return _activities.where((a) => a.type == ActivityType.live || a.type == ActivityType.system).toList();
      default:
        return _activities;
    }
  }

  void _markAllAsRead() {
    setState(() {
      for (final a in _activities) {
        a.isRead = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read.'),
        backgroundColor: CbColors.liveGreen,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _clearReadActivities() {
    final removed = _activities.where((a) => a.isRead).toList();
    setState(() {
      _activities.removeWhere((a) => a.isRead);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${removed.length} read notifications cleared.'),
        action: SnackBarAction(
          label: 'Undo',
          textColor: CbColors.purpleLight,
          onPressed: () {
            setState(() {
              _activities.addAll(removed);
            });
          },
        ),
      ),
    );
  }

  void _deleteActivity(ActivityModel item) {
    setState(() {
      _activities.removeWhere((a) => a.id == item.id);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Item removed from activity feed.'),
        action: SnackBarAction(
          label: 'Undo',
          textColor: CbColors.purpleLight,
          onPressed: () {
            setState(() {
              _activities.add(item);
            });
          },
        ),
      ),
    );
  }

  void _toggleSilence(ActivityModel item) {
    setState(() {
      item.isSilenced = !item.isSilenced;
    });
    final name = item.artistName ?? item.title;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          item.isSilenced
              ? 'Alerts silenced for $name.'
              : 'Alerts enabled for $name.',
        ),
      ),
    );
  }

  void _openItemMenu(ActivityModel item) {
    final artist = item.artistName;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF151722),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children:
                [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: Colors.white12),
                  if (item.type == ActivityType.tip && item.tipDetails != null)
                    ListTile(
                      leading: const Icon(Icons.receipt_long, color: CbColors.liveGreen),
                      title: const Text('View Official Receipt', style: TextStyle(color: Colors.white)),
                      onTap: () {
                        Navigator.pop(ctx);
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => ReceiptScreen(tip: item.tipDetails!),
                          ),
                        );
                      },
                    ),
                  if (item.type == ActivityType.live)
                    ListTile(
                      leading: const Icon(Icons.play_circle_fill, color: CbColors.purpleLight),
                      title: const Text('Tune In to Live Stage', style: TextStyle(color: Colors.white)),
                      onTap: () {
                        Navigator.pop(ctx);
                        final aName = item.artistName ?? 'Artist';
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Joining live stage for $aName...')),
                        );
                      },
                    ),
                  if (artist != null)
                    ListTile(
                      leading: Icon(
                        item.isSilenced ? Icons.notifications_active : Icons.notifications_off,
                        color: item.isSilenced ? CbColors.liveGreen : CbColors.textMuted,
                      ),
                      title: Text(
                        item.isSilenced ? 'Unmute alerts from $artist' : 'Silence alerts from $artist',
                        style: const TextStyle(color: Colors.white),
                      ),
                      onTap: () {
                        Navigator.pop(ctx);
                        _toggleSilence(item);
                      },
                    ),
                  ListTile(
                    leading: Icon(item.isRead ? Icons.mark_email_unread : Icons.done, color: Colors.white70),
                    title: Text(item.isRead ? 'Mark as unread' : 'Mark as read', style: const TextStyle(color: Colors.white)),
                    onTap: () {
                      Navigator.pop(ctx);
                      setState(() => item.isRead = !item.isRead);
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.delete_outline, color: Colors.redAccent),
                    title: const Text('Delete from activity', style: TextStyle(color: Colors.redAccent)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _deleteActivity(item);
                    },
                  ),
                ],
            ),
          ),
        );
      },
    );
  }

  void _showNotificationSettings() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF151722),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const Text(
                    'Alerts & Notification Preferences',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Control which events generate push alerts and activity feed items.',
                    style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  _buildToggleTile(
                    title: 'Live Stage Alerts',
                    subtitle: 'Notify me when artists I follow start performing live.',
                    value: _alertLiveSets,
                    onChanged: (val) {
                      setModalState(() => _alertLiveSets = val);
                      setState(() => _alertLiveSets = val);
                    },
                  ),
                  _buildToggleTile(
                    title: 'Tip & Payment Receipts',
                    subtitle: 'Receive instant confirmation receipts for tips sent.',
                    value: _alertTipReceipts,
                    onChanged: (val) {
                      setModalState(() => _alertTipReceipts = val);
                      setState(() => _alertTipReceipts = val);
                    },
                  ),
                  _buildToggleTile(
                    title: 'Campaign Milestone Updates',
                    subtitle: 'Progress updates on backed album pressings and tours.',
                    value: _alertCampaigns,
                    onChanged: (val) {
                      setModalState(() => _alertCampaigns = val);
                      setState(() => _alertCampaigns = val);
                    },
                  ),
                  _buildToggleTile(
                    title: 'New Followers & Social',
                    subtitle: 'Alerts when other fans follow your profile or setlist.',
                    value: _alertFollowers,
                    onChanged: (val) {
                      setModalState(() => _alertFollowers = val);
                      setState(() => _alertFollowers = val);
                    },
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CbColors.purpleMain,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Notification preferences saved.'),
                          backgroundColor: CbColors.liveGreen,
                        ),
                      );
                    },
                    child: const Text('Save Preferences', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildToggleTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E2032),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: CbColors.purpleLight,
            activeTrackColor: CbColors.purpleMain,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final isAuthenticated = auth.status == CbAuthStatus.authenticated;

    if (!isAuthenticated) {
      return Scaffold(
        backgroundColor: CbColors.bgApp,
        appBar: AppBar(
          backgroundColor: CbColors.bgApp,
          elevation: 0,
          title: const Text(
            'Activity & Alerts',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: CbColors.surfaceCard,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0x338B5CF6)),
                  ),
                  child: const Icon(Icons.notifications_none, size: 36, color: CbColors.purpleLight),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Sign in to view your activity',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  'Keep track of your tip receipts, creator stage alerts, live notifications, and favorite artists.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.of(context).pushNamed('/auth'),
                  child: const Text('Sign In / Register', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final tipsCount = _activities.where((a) => a.type == ActivityType.tip).length;
    final followsCount = _activities.where((a) => a.type == ActivityType.follow).length;
    final campaignsCount = _activities.where((a) => a.type == ActivityType.campaign).length;
    final alertsCount = _activities.where((a) => a.type == ActivityType.live || a.type == ActivityType.system).length;

    final filterOptions = [
      {'key': 'All', 'label': 'All (${_activities.length})'},
      {'key': 'Tips', 'label': 'Tips ($tipsCount)'},
      {'key': 'Follows', 'label': 'Follows ($followsCount)'},
      {'key': 'Campaigns', 'label': 'Campaigns ($campaignsCount)'},
      {'key': 'Alerts', 'label': 'Alerts ($alertsCount)'},
    ];

    final filtered = _filteredActivities;

    final groups = <String, List<ActivityModel>>{};
    for (final item in filtered) {
      groups.putIfAbsent(item.dateGroup, () => []).add(item);
    }

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.bgApp,
        elevation: 0,
        title: const Text(
          'Activity & Alerts',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune, color: CbColors.purpleLight, size: 20),
            tooltip: 'Alert Preferences',
            onPressed: _showNotificationSettings,
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.white70, size: 22),
            color: const Color(0xFF1E2032),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            onSelected: (val) {
              if (val == 'mark_all_read') _markAllAsRead();
              if (val == 'clear_read') _clearReadActivities();
              if (val == 'settings') _showNotificationSettings();
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(
                value: 'mark_all_read',
                child: Row(
                  children: [
                    Icon(Icons.done_all, color: CbColors.liveGreen, size: 18),
                    SizedBox(width: 10),
                    Text('Mark all as read', style: TextStyle(color: Colors.white, fontSize: 13)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'clear_read',
                child: Row(
                  children: [
                    Icon(Icons.cleaning_services, color: CbColors.purpleLight, size: 18),
                    SizedBox(width: 10),
                    Text('Clear read items', style: TextStyle(color: Colors.white, fontSize: 13)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings, color: Colors.white70, size: 18),
                    SizedBox(width: 10),
                    Text('Alert Settings', style: TextStyle(color: Colors.white, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: filterOptions.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (ctx, i) {
                  final opt = filterOptions[i];
                  final bool isSelected = _selectedFilter == opt['key'];
                  return GestureDetector(
                    onTap: () => setState(() => _selectedFilter = opt['key']!),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? CbColors.purpleMain : CbColors.surface2,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        border: Border.all(
                          color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          opt['label']!,
                          style: TextStyle(
                            color: isSelected ? Colors.white : CbColors.textSecondary,
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_off_outlined, size: 48, color: Colors.white.withValues(alpha: 0.3)),
                          const SizedBox(height: 12),
                          Text(
                            'No $_selectedFilter activity yet',
                            style: const TextStyle(color: Colors.white70, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'New updates, tips, and live alerts will appear here.',
                            style: TextStyle(color: CbColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                      children: [
                        for (final groupEntry in groups.entries) ...[
                          _buildDateHeader(groupEntry.key),
                          const SizedBox(height: 8),
                          for (final item in groupEntry.value) ...[
                            _buildActivityCard(item),
                            const SizedBox(height: 8),
                          ],
                          const SizedBox(height: 16),
                        ],
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: CbColors.textMuted,
        fontSize: 11,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.8,
      ),
    );
  }

  Widget _buildActivityCard(ActivityModel item) {
    switch (item.type) {
      case ActivityType.tip:
        return _buildTipCard(item);
      case ActivityType.live:
        return _buildLiveCard(item);
      case ActivityType.follow:
        return _buildFollowCard(item);
      case ActivityType.campaign:
        return _buildCampaignCard(item);
      case ActivityType.system:
        return _buildSystemCard(item);
    }
  }

  Widget _buildTipCard(ActivityModel item) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: item.isRead ? const Color(0xFF131520) : CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: item.isRead ? Colors.transparent : CbColors.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: CbColors.purpleMain),
              image: item.avatarUrl != null
                  ? DecorationImage(image: NetworkImage(item.avatarUrl!), fit: BoxFit.cover)
                  : null,
            ),
            child: item.avatarUrl == null ? const Icon(Icons.volunteer_activism, color: Colors.white70) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: InkWell(
              onTap: () {
                if (item.tipDetails != null) {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => ReceiptScreen(tip: item.tipDetails!),
                    ),
                  );
                }
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: item.isRead ? FontWeight.w500 : FontWeight.bold,
                    ),
                  ),
                  if (item.venue != null) ...[
                    const SizedBox(height: 2),
                    Text(item.venue!, style: const TextStyle(color: CbColors.purpleLight, fontSize: 11)),
                  ],
                  Text('Verified on ledger • ${item.timeAgo}', style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                ],
              ),
            ),
          ),
          if (item.amount != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0x1F10B981),
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
              ),
              child: Text(
                item.amount!,
                style: const TextStyle(color: CbColors.liveGreen, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white54, size: 18),
            onPressed: () => _openItemMenu(item),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveCard(ActivityModel item) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: item.isRead ? const Color(0xFF131520) : CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: item.isRead ? Colors.transparent : CbColors.purpleMain.withAlpha(100)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              image: item.avatarUrl != null
                  ? DecorationImage(image: NetworkImage(item.avatarUrl!), fit: BoxFit.cover)
                  : null,
            ),
            child: item.avatarUrl == null ? const Icon(Icons.radio, color: Colors.white70) : null,
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
                        item.artistName ?? item.title,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const CbLiveBadge(),
                  ],
                ),
                const SizedBox(height: 2),
                Text('Went live at ${item.venue ?? "Stage"} • ${item.timeAgo}', style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {
              final aName = item.artistName ?? 'Artist';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Opening live stage for $aName...')),
              );
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: CbColors.purpleMain),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              minimumSize: const Size(0, 30),
            ),
            child: const Text('Listen', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white54, size: 18),
            onPressed: () => _openItemMenu(item),
          ),
        ],
      ),
    );
  }

  Widget _buildFollowCard(ActivityModel item) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: item.isRead ? const Color(0xFF131520) : CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: item.isRead ? Colors.transparent : CbColors.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              image: item.avatarUrl != null
                  ? DecorationImage(image: NetworkImage(item.avatarUrl!), fit: BoxFit.cover)
                  : null,
            ),
            child: item.avatarUrl == null ? const Icon(Icons.person, color: Colors.white70) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text('${item.handle ?? "@fan"} • ${item.timeAgo}', style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white54, size: 18),
            onPressed: () => _openItemMenu(item),
          ),
        ],
      ),
    );
  }

  Widget _buildCampaignCard(ActivityModel item) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: item.isRead ? const Color(0xFF131520) : CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: item.isRead ? Colors.transparent : CbColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.campaign, color: CbColors.heartOrange, size: 16),
                  SizedBox(width: 6),
                  Text('Campaign Milestone', style: TextStyle(color: CbColors.heartOrange, fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
              Row(
                children: [
                  Text(item.timeAgo, style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                  IconButton(
                    icon: const Icon(Icons.more_vert, color: Colors.white54, size: 18),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () => _openItemMenu(item),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(item.title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (item.progressPercent ?? 0) / 100.0,
              backgroundColor: CbColors.surface3,
              color: CbColors.purpleMain,
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 6),
          Text('${item.progressPercent ?? 0}% funded of goal', style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildSystemCard(ActivityModel item) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: item.isRead ? const Color(0xFF131520) : CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: item.isRead ? Colors.transparent : CbColors.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0x1F8B5CF6),
            ),
            child: const Icon(Icons.shield_outlined, color: CbColors.purpleLight),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(item.subtitle, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white54, size: 18),
            onPressed: () => _openItemMenu(item),
          ),
        ],
      ),
    );
  }
}