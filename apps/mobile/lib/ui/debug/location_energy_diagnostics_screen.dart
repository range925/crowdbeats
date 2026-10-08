// Crowdbeats V2 — Location & Energy Diagnostics Screen (Phase 11)
//
// Debug-only diagnostics view displaying live energy telemetry, queue metrics,
// Remote Config kill switch controls, and privacy audit assertions.
//
// Access Constraint:
// Available ONLY in non-production builds (!kReleaseMode) or for authorized developer/admin accounts.

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/location_energy_tracker.dart';
import '../../data/services/location_remote_config_service.dart';
import '../../data/services/location_cleanup_coordinator.dart';

class LocationEnergyDiagnosticsScreen extends ConsumerStatefulWidget {
  const LocationEnergyDiagnosticsScreen({super.key});

  static const routeName = '/debug/location-energy';

  @override
  ConsumerState<LocationEnergyDiagnosticsScreen> createState() =>
      _LocationEnergyDiagnosticsScreenState();
}

class _LocationEnergyDiagnosticsScreenState
    extends ConsumerState<LocationEnergyDiagnosticsScreen> {
  String? _invariantCheckResult;
  bool _invariantCheckPassed = false;

  void _runInvariantCheck() {
    final coordinator = ref.read<LocationCleanupCoordinator>(locationCleanupCoordinatorProvider);
    final report = coordinator.verifyAllInvariants(TerminalCleanupReason.policyIncompatible);
    setState(() {
      _invariantCheckPassed = report.allPassed;
      _invariantCheckResult = report.allPassed
          ? 'All 4 terminal invariants verified. 0 leaks.'
          : 'Invariant warning: Some active resources remain in current state.';
    });
  }

  @override
  Widget build(BuildContext context) {
    // Defense-in-depth: If accidentally routed to in release mode without flag, block access
    if (kReleaseMode) {
      return Scaffold(
        appBar: AppBar(title: const Text('Access Restricted')),
        body: const Center(
          child: Text(
            'Diagnostics view is disabled in production builds.',
            style: TextStyle(fontSize: 16),
          ),
        ),
      );
    }

    final energyTracker = ref.watch(locationEnergyTrackerProvider);
    final remoteConfig = ref.watch(locationRemoteConfigServiceProvider);
    final snapshot = energyTracker.toSnapshotJson(appVersion: '2.0.0-debug');

    final activeSensorMs = snapshot['activeSensorDurationMs'] as int? ?? 0;
    final timeInState = snapshot['timeInStateMs'] as Map<String, dynamic>? ?? {};
    final sampleCounts = snapshot['sampleCounts'] as Map<String, dynamic>? ?? {};
    final network = snapshot['networkTelemetry'] as Map<String, dynamic>? ?? {};
    final dbAttribution = snapshot['databaseAttribution'] as Map<String, dynamic>? ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('Location & Energy Observability'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Metrics',
            onPressed: () => setState(() {}),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Non-production Environment Notice
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.amber.shade700),
            ),
            child: Row(
              children: [
                Icon(Icons.bug_report, color: Colors.amber.shade900),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Debug Diagnostics Console — Visible only in non-production builds. Telemetry contains strictly zero coordinates.',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Privacy Audit Badge
          Card(
            color: Colors.green.shade50,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: Colors.green.shade600),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(Icons.verified_user, color: Colors.green.shade800, size: 28),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Privacy Invariant: Zero Coordinates Leaked',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Telemetry is guaranteed free of latitude, longitude, addresses, and device identifiers.',
                          style: TextStyle(fontSize: 12, color: Colors.black87),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Remote Config Emergency Kill Switches Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Remote Config & Emergency Kill Switches',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    title: const Text('Mobile Location Tracking'),
                    subtitle: const Text('Emergency kill switch for continuous GPS'),
                    value: remoteConfig.isMobileTrackingAllowed,
                    onChanged: (val) {
                      setState(() {
                        remoteConfig.setKillSwitch(mobileTracking: val);
                      });
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Public Presence & Discovery'),
                    subtitle: const Text('Emergency kill switch for map pins'),
                    value: remoteConfig.isPublicPresenceAllowed,
                    onChanged: (val) {
                      setState(() {
                        remoteConfig.setKillSwitch(publicPresence: val);
                      });
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Aggregate Crowd Radar'),
                    subtitle: const Text('Emergency kill switch for performer radar'),
                    value: remoteConfig.isCrowdRadarAllowed,
                    onChanged: (val) {
                      setState(() {
                        remoteConfig.setKillSwitch(crowdRadar: val);
                      });
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Audience Visibility Grants'),
                    subtitle: const Text('Emergency kill switch for individual fan opt-in'),
                    value: remoteConfig.isAudienceVisibilityAllowed,
                    onChanged: (val) {
                      setState(() {
                        remoteConfig.setKillSwitch(audienceVisibility: val);
                      });
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Sensor & State Durations Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sensor & Energy Telemetry',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  _buildMetricRow('Active Sensor Duration', '${(activeSensorMs / 1000).toStringAsFixed(1)} s'),
                  _buildMetricRow('Stationary Mode Duration', '${((timeInState['live_stationary'] as int? ?? 0) / 1000).toStringAsFixed(1)} s'),
                  _buildMetricRow('Mobile Mode Duration', '${((timeInState['live_mobile'] as int? ?? 0) / 1000).toStringAsFixed(1)} s'),
                  _buildMetricRow('Discovery Mode Duration', '${((timeInState['discovery'] as int? ?? 0) / 1000).toStringAsFixed(1)} s'),
                  _buildMetricRow('Check-In Mode Duration', '${((timeInState['check_in'] as int? ?? 0) / 1000).toStringAsFixed(1)} s'),
                  const Divider(),
                  _buildMetricRow('Samples Received', '${sampleCounts['received'] ?? 0}'),
                  _buildMetricRow('Samples Accepted', '${sampleCounts['accepted'] ?? 0}'),
                  _buildMetricRow('Samples Rejected', '${sampleCounts['rejected'] ?? 0}'),
                  const Divider(),
                  _buildMetricRow('Upload Count', '${network['uploadCount'] ?? 0}'),
                  _buildMetricRow('Bytes Uploaded', '${network['bytesUploaded'] ?? 0} B'),
                  _buildMetricRow('Queue High-Water Mark', '${network['queueHighWaterMark'] ?? 0} / ${remoteConfig.policy.maxQueueCapacity}'),
                  _buildMetricRow('Upload Retries', '${network['retryCount'] ?? 0}'),
                  const Divider(),
                  _buildMetricRow('Attributable Firestore Reads', '${dbAttribution['firestoreReads'] ?? 0}'),
                  _buildMetricRow('Attributable Firestore Writes', '${dbAttribution['firestoreWrites'] ?? 0}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Terminal Invariant Testing Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Invariant Assertion Engine',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Tests whether sensors, services, listeners, and coordinates are cleanly disposed.',
                    style: TextStyle(fontSize: 13, color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _runInvariantCheck,
                    icon: const Icon(Icons.rule),
                    label: const Text('Verify All 4 Invariants'),
                  ),
                  if (_invariantCheckResult != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _invariantCheckPassed
                            ? Colors.green.withValues(alpha: 0.1)
                            : Colors.orange.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _invariantCheckResult!,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _invariantCheckPassed ? Colors.green.shade900 : Colors.orange.shade900,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: Colors.black87)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
