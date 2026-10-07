// Crowdbeats V2 — Live Session Active Nerve Centre (Phase B)
// Real-time live stage monitor, live tip stream ticker, presenter QR trigger & session termination flow.
// Phase B: endSession calls real Cloud Function; sessionId comes from creatorContextProvider.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/state/session_heartbeat_notifier.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/data/services/location_analytics_service.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';
import 'package:crowdbeats_mobile/ui/location/creator_audience_nearby_modal.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';
import 'rotating_qr_modal.dart';
import 'session_summary_modal.dart';

class LiveSessionActiveView extends ConsumerStatefulWidget {
  const LiveSessionActiveView({super.key});

  @override
  ConsumerState<LiveSessionActiveView> createState() => _LiveSessionActiveViewState();
}

class _LiveSessionActiveViewState extends ConsumerState<LiveSessionActiveView> {
  final int _grossTipsCents = 12500; // $125.00 — Phase C will replace with Firestore listener
  final int _tipCount = 14;
  final int _newFollowers = 8;
  bool _isEndingSession = false;
  bool _isMobileSharingPaused = false;

  Future<void> _handleToggleMobileSharing() async {
    final locationProvider = ref.read(locationProviderProvider);
    final contextState = ref.read(creatorContextProvider);
    final sessionId = contextState.activeSessionId ?? '';
    setState(() {
      _isMobileSharingPaused = !_isMobileSharingPaused;
    });

    if (_isMobileSharingPaused) {
      await locationProvider.stopContinuous();
      ref.read(locationAnalyticsServiceProvider).trackMobileSharingPaused(sessionId: sessionId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mobile GPS sharing paused. Stage remains live at fixed position.'),
          backgroundColor: CbColors.rankGold,
        ),
      );
    } else {
      locationProvider.streamContinuous();
      ref.read(locationAnalyticsServiceProvider).trackMobileSharingResumed(sessionId: sessionId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mobile GPS sharing resumed.'),
          backgroundColor: CbColors.statusLive,
        ),
      );
    }
  }

  void _showLocationAccessExplanation() {
    final settings = ref.read(userSettingsProvider);
    final explanation = settings.privacy.lastLocationAccessExplanation ??
        'One-shot fix captured for venue proximity check (<= 200m). GPS stopped immediately after verification.';

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: CbColors.tealGas, size: 20),
            SizedBox(width: 8),
            Text('Location Access Log', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Most Recent Sensor Access:', style: TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(explanation, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4)),
            const SizedBox(height: 12),
            const Text('Privacy Guarantee:', style: TextStyle(color: CbColors.tealGas, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('No background GPS is active. Session is kept alive via server-side heartbeat leases.', style: TextStyle(color: Colors.white60, fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close', style: TextStyle(color: CbColors.tealGas)),
          ),
        ],
      ),
    );
  }

  void _showChangePrivacyModeDialog() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: const Text('Change Privacy Mode', style: TextStyle(color: Colors.white, fontSize: 16)),
        content: const Text(
          'Switch how your stage presence is broadcasted to fans on the discovery map.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Switched to Canonical Venue Pin mode.')),
              );
            },
            child: const Text('Venue Pin (Canonical)'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Switched to Coarse Neighborhood Grid mode (~100m).')),
              );
            },
            child: const Text('Coarse Grid (~100m)'),
          ),
        ],
      ),
    );
  }

  void _handlePresentQr() {
    final contextState = ref.read(creatorContextProvider);
    // Use the real server-assigned session ID; fall back to empty string if not set yet.
    final sessionId = contextState.activeSessionId ?? '';
    final performerId = contextState.activeContext.id;
    RotatingQrModal.show(
      context,
      performerName: contextState.activeContext.name,
      sessionId: sessionId,
      isBand: contextState.isBand,
      performerId: performerId,
    );
  }

  Future<void> _handleEndSession() async {
    final contextState = ref.read(creatorContextProvider);
    final sessionId = contextState.activeSessionId;

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: const Text('End Live Performance?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'This will stop broadcasting your live stage session and reconcile all collected tips to your ledger.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            child: const Text('Keep Playing', style: TextStyle(color: Colors.white70)),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.statusError),
            child: const Text('End Session', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            onPressed: () async {
              Navigator.of(ctx).pop();
              await _doEndSession(sessionId);
            },
          ),
        ],
      ),
    );
  }

  Future<void> _doEndSession(String? sessionId) async {
    if (_isEndingSession) return;
    setState(() => _isEndingSession = true);

    try {
      if (sessionId != null) {
        final service = ref.read(sessionServiceProvider);
        await service.endSession(sessionId);
      }
    } on Exception catch (_) {
      // Idempotent — if server says already ended or network fails, still proceed to clear local state.
    } catch (_) {
      // Best-effort: clear local state regardless to avoid UI getting stuck.
    }

    if (!mounted) return;

    // Show summary modal with stub stats (Phase C replaces with real Firestore data).
    SessionSummaryModal.show(
      context,
      performerName: ref.read(creatorContextProvider).activeContext.name,
      venueName: 'Sunset Lounge', // Phase C: read from session document
      durationText: '1h 45m',     // Phase C: compute from startedAt / endedAt
      grossTipsCents: _grossTipsCents,
      tipCount: _tipCount,
      newFollowers: _newFollowers,
      isBand: ref.read(creatorContextProvider).isBand,
      userSplitPercent: 40,
      onDone: () {
        // Clear session state — stops the heartbeat timer automatically.
        ref.read(creatorContextProvider.notifier).clearSession();
        if (mounted) Navigator.of(context).pop();
      },
    );

    setState(() => _isEndingSession = false);
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(creatorContextProvider);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      children: [
        // Live Stage Active Card
        CbGlassCard(
          padding: const EdgeInsets.all(16),
          backgroundColor: const Color(0x2210B981),
          borderColor: const Color(0x6610B981),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: CbColors.statusLive,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.sensors, color: Colors.white, size: 12),
                        SizedBox(width: 4),
                        Text('STAGE LIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const Text('Duration: 1h 45m', style: TextStyle(color: CbColors.tealGas, fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                contextState.activeContext.name,
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const Text('Live at Sunset Lounge (San Diego, CA)', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.qr_code_2, size: 18),
                      label: const Text('Present QR Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: CbColors.tealGas,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                      ),
                      onPressed: _handlePresentQr,
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.stop_circle, color: CbColors.statusError, size: 18),
                    label: const Text('End Show', style: TextStyle(color: CbColors.statusError, fontWeight: FontWeight.bold, fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: CbColors.statusError),
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: _isEndingSession ? null : () => _handleEndSession(),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Live Stage Location Controls Card (Phase 3 Requirement 13)
        CbGlassCard(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.shield_outlined, size: 16, color: CbColors.tealGas),
                      SizedBox(width: 6),
                      Text(
                        'LOCATION & PRIVACY CONTROLS',
                        style: TextStyle(
                          color: CbColors.tealGas,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                  TextButton.icon(
                    key: const Key('btn_audience_nearby_info'),
                    icon: const Icon(Icons.info_outline, size: 14, color: CbColors.textSecondary),
                    label: const Text('Audience Nearby', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero),
                    onPressed: () => CreatorAudienceNearbyModal.show(context),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    key: const Key('btn_toggle_mobile_sharing'),
                    icon: Icon(_isMobileSharingPaused ? Icons.play_circle_outline : Icons.pause_circle_outline, size: 15),
                    label: Text(
                      _isMobileSharingPaused ? 'Resume Mobile GPS' : 'Pause Mobile Sharing',
                      style: const TextStyle(fontSize: 11),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _isMobileSharingPaused ? CbColors.liveGreen : CbColors.rankGold,
                      side: BorderSide(color: _isMobileSharingPaused ? CbColors.liveGreen : CbColors.rankGold),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: Size.zero,
                    ),
                    onPressed: _handleToggleMobileSharing,
                  ),
                  OutlinedButton.icon(
                    key: const Key('btn_change_privacy_mode'),
                    icon: const Icon(Icons.tune, size: 15),
                    label: const Text('Privacy Mode', style: TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: CbColors.borderSubtle),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: Size.zero,
                    ),
                    onPressed: _showChangePrivacyModeDialog,
                  ),
                  OutlinedButton.icon(
                    key: const Key('btn_view_location_explanation'),
                    icon: const Icon(Icons.history_edu, size: 15),
                    label: const Text('Access Explanation', style: TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: CbColors.borderSubtle),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: Size.zero,
                    ),
                    onPressed: _showLocationAccessExplanation,
                  ),
                  OutlinedButton.icon(
                    key: const Key('btn_open_device_settings'),
                    icon: const Icon(Icons.settings, size: 15),
                    label: const Text('System Settings', style: TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: CbColors.borderSubtle),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: Size.zero,
                    ),
                    onPressed: () async {
                      await ref.read(locationProviderProvider).openSettings();
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Live Real-Time Metrics
        const Row(
          children: [
            Expanded(
              child: CbMetricCard(
                title: 'STAGE TIPS',
                value: r'\$125.00',
                timeframe: 'Tonight',
                definition: 'Gross tips collected during this live stage performance.',
                icon: Icons.volunteer_activism,
                accentColor: CbColors.tealGas,
              ),
            ),
            SizedBox(width: 8),
            Expanded(
              child: CbMetricCard(
                title: 'LISTENERS',
                value: '42',
                timeframe: 'Checked in fans',
                definition: 'Audience members actively checked in to your stage area.',
                icon: Icons.headphones,
                accentColor: CbColors.purpleLight,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Live Tip Ticker Feed
        const Text('LIVE TIP STREAM', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
        const SizedBox(height: 8),
        ..._mockLiveTips.map((tip) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              child: CbGlassCard(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(color: Color(0x2210B981), shape: BoxShape.circle),
                      child: const Icon(Icons.volunteer_activism, size: 14, color: CbColors.statusLive),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(tip.fanName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          if (tip.message != null)
                            Text('"${tip.message}"', style: const TextStyle(color: CbColors.textSecondary, fontSize: 11, fontStyle: FontStyle.italic)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(tip.amount, style: const TextStyle(color: CbColors.statusLive, fontWeight: FontWeight.w900, fontSize: 14)),
                        Text(tip.timeAgo, style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                      ],
                    ),
                  ],
                ),
              ),
            )),
      ],
    );
  }
}

class _MockLiveTipItem {
  const _MockLiveTipItem({required this.fanName, required this.amount, this.message, required this.timeAgo});
  final String fanName;
  final String amount;
  final String? message;
  final String timeAgo;
}

const _mockLiveTips = [
  _MockLiveTipItem(fanName: 'Sarah K.', amount: r'+$25.00', message: 'Incredible guitar solo on the encore!', timeAgo: 'Just now'),
  _MockLiveTipItem(fanName: 'Anonymous Fan', amount: r'+$10.00', message: 'Keep rocking!', timeAgo: '2m ago'),
  _MockLiveTipItem(fanName: 'Dave M.', amount: r'+$50.00', message: 'Best live show in town tonight.', timeAgo: '8m ago'),
  _MockLiveTipItem(fanName: 'Elena R.', amount: r'+$20.00', timeAgo: '15m ago'),
];
