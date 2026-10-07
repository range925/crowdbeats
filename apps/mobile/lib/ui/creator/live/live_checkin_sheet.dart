// Crowdbeats V2 — Production Mobile Live Check-In Sheet (Phase B)
// Supports Venue Check-In (with verified venue list & distance check) and Street/Permit Mode.
//
// Phase B: Calls real startSession callable via SessionService.
// GPS is used exactly once (street mode only), passed to server, then discarded.
// Venue mode: server reads venue GeoPoint from Firestore — no client GPS needed.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/data/services/session_service.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/state/session_heartbeat_notifier.dart';
import 'package:crowdbeats_mobile/data/services/location_analytics_service.dart';
import 'package:crowdbeats_mobile/ui/location/location_pre_permission_dialog.dart';
import 'package:crowdbeats_mobile/ui/location/mobile_session_disclosure_dialog.dart';
import 'package:crowdbeats_mobile/ui/location/accuracy_upgrade_dialog.dart';
import 'package:crowdbeats_mobile/ui/location/what_fans_will_see_card.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class VerifiedVenue {
  const VerifiedVenue({
    required this.id,
    required this.name,
    required this.address,
    required this.cityState,
    required this.distanceMiles,
  });

  final String id;
  final String name;
  final String address;
  final String cityState;
  final double distanceMiles;
}

const kMockVerifiedVenues = [
  VerifiedVenue(id: 'v_sunset', name: 'Sunset Lounge', address: '420 Ocean Blvd', cityState: 'San Diego, CA', distanceMiles: 0.1),
  VerifiedVenue(id: 'v_casbah', name: 'The Casbah', address: '2501 Kettner Blvd', cityState: 'San Diego, CA', distanceMiles: 1.4),
  VerifiedVenue(id: 'v_bellyup', name: 'Belly Up Tavern', address: '143 S Cedros Ave', cityState: 'Solana Beach, CA', distanceMiles: 12),
  VerifiedVenue(id: 'v_hob', name: 'House of Blues', address: '1055 5th Ave', cityState: 'San Diego, CA', distanceMiles: 2.1),
  VerifiedVenue(id: 'v_sodabar', name: 'Soda Bar', address: '3615 El Cajon Blvd', cityState: 'San Diego, CA', distanceMiles: 3.5),
];

class LiveCheckinSheet extends ConsumerStatefulWidget {
  const LiveCheckinSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const LiveCheckinSheet(),
    );
  }

  @override
  ConsumerState<LiveCheckinSheet> createState() => _LiveCheckinSheetState();
}

class _LiveCheckinSheetState extends ConsumerState<LiveCheckinSheet> {
  int _modeIndex = 0; // 0 = Verified Venue, 1 = Street / Permit
  VerifiedVenue? _selectedVenue;
  final _searchController = TextEditingController();
  final _streetDescController = TextEditingController(text: 'Gaslamp Quarter (5th & Market St)');
  bool _hasPermit = true;
  bool _isVerifying = false;

  @override
  void dispose() {
    _searchController.dispose();
    _streetDescController.dispose();
    super.dispose();
  }

  String? _startError; // Error message shown below the button.

  /// Starts a live session via the real [startSession] Cloud Function callable.
  ///
  /// Venue mode: passes venueId — server resolves the canonical GeoPoint.
  Future<void> _handleStartPerformance() async {
    final contextState = ref.read(creatorContextProvider);
    final performerName = contextState.activeContext.name;
    final performerType = contextState.isSolo ? 'artist' : 'band_member';
    final isBand = contextState.isBand;
    final userRole = contextState.activeContext.role;

    // Invariant: Non-admin band members cannot initiate live sessions
    final isUnauthorizedBandMember = isBand && (userRole == 'BAND_MEMBER' || userRole == 'GUEST_MUSICIAN');
    if (isUnauthorizedBandMember) {
      setState(() {
        _startError = 'Only the Band Founder or Band Admin can start a live stage session.';
      });
      return;
    }

    // Invariant 3: Show pre-permission disclosure before triggering OS permission
    final proceed = await LocationPrePermissionDialog.show(
      context,
      isVenue: _modeIndex == 0,
      performerName: performerName,
      venueName: _modeIndex == 0 ? _selectedVenue?.name : 'Street Location',
      venueCityState: _modeIndex == 0 ? _selectedVenue?.cityState : null,
    );
    if (!proceed) {
      return;
    }

    ref.read(locationAnalyticsServiceProvider).trackPermissionDisclosureViewed(
      role: performerType,
      mode: _modeIndex == 0 ? 'venue' : (_modeIndex == 1 ? 'street' : 'mobile'),
    );

    // Invariant 5: If Mobile Live Session is selected, show secondary disclosure
    if (_modeIndex == 2) {
      if (!mounted) return;
      final allowMobile = await MobileSessionDisclosureDialog.show(context);
      if (allowMobile == null) {
        return;
      } else if (allowMobile == false) {
        setState(() => _modeIndex = 0);
        return;
      }
    }

    setState(() {
      _isVerifying = true;
      _startError = null;
    });

    final service = ref.read(sessionServiceProvider);
    final locationProvider = ref.read(locationProviderProvider);

    try {
      SessionStartResult result;

      if (_modeIndex == 0) {
        // ── Venue mode ─────────────────────────────────────────────────────
        final venue = _selectedVenue;
        if (venue == null) {
          if (!mounted) return;
          setState(() {
            _isVerifying = false;
            _startError = 'Please select a venue before going live.';
          });
          return;
        }

        // Invariant 7: Approximate permission check with temporary precision upgrade
        final permState = await locationProvider.getPermissionState();
        if (permState.isApproximate) {
          if (!mounted) return;
          final upgradeChoice = await AccuracyUpgradeDialog.show(
            context,
            venueName: venue.name,
          );
          if (upgradeChoice == true) {
            await locationProvider.requestTemporaryFullAccuracy(
              purposeKey: 'venue_verification',
            );
          } else if (upgradeChoice == false) {
            // Fall back to street mode
            setState(() {
              _modeIndex = 1;
              _isVerifying = false;
            });
            return;
          } else {
            setState(() => _isVerifying = false);
            return;
          }
        }

        result = await service.startVenueSession(VenueSessionParams(
          performerName: performerName,
          performerType: performerType,
          venueId: venue.id,
          venueName: venue.name,
        ));
      } else {
        // ── Street / Mobile mode — one-shot GPS ────────────────────────────
        final fix = await locationProvider.requestOneShot(
          targetMode: _modeIndex == 2 ? LocationMode.liveMobile : LocationMode.checkIn,
        );

        if (!mounted) return;

        if (fix == null) {
          setState(() {
            _isVerifying = false;
            _startError = 'Location unavailable. Check permissions in Settings and try again.';
          });
          return;
        }

        result = await service.startStreetSession(StreetSessionParams(
          performerName: performerName,
          performerType: performerType,
          lat: fix.latitude,
          lng: fix.longitude,
          spotDescription: _streetDescController.text.trim().isNotEmpty
              ? _streetDescController.text.trim()
              : null,
          hasPermit: _hasPermit,
        ));
      }

      if (!mounted) return;

      // ── Success: store session, start heartbeat, dismiss sheet ─────────────
      ref.read(creatorContextProvider.notifier).setSessionActive(
        sessionId: result.sessionId,
        endsAt: result.endsAt,
      );

      // Wake the heartbeat notifier so it picks up the new session.
      // The notifier listens to creatorContextProvider automatically,
      // but we read it here to ensure it's been initialized.
      ref.read(sessionHeartbeatProvider);

      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _modeIndex == 0
                ? 'Checked in to ${_selectedVenue?.name}! Live session broadcasted.'
                : 'Checked in at ${_streetDescController.text}! Street session broadcasted.',
          ),
          backgroundColor: CbColors.statusLive,
        ),
      );
    } on FirebaseFunctionsException catch (e) {
      if (!mounted) return;
      setState(() {
        _isVerifying = false;
        _startError = switch (e.code) {
          'already-exists' => 'You already have an active session. End it first.',
          'unauthenticated' => 'You must be signed in to go live.',
          'not-found' => 'Venue not found. Please re-select.',
          'failed-precondition' => 'Venue has no location set. Contact the venue.',
          _ => 'Could not start session: ${e.message ?? e.code}',
        };
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isVerifying = false;
        _startError = 'Unexpected error. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(creatorContextProvider);

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      child: Column(
        children: [
          // Drag Handle & Title
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Live Stage Check-In', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    Text(
                      'Broadcasting as: ${contextState.activeContext.name}',
                      style: const TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white12, height: 1),

          // Mode Selector: Venue vs Street
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: CbColors.surfaceBase,
                borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _modeIndex = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _modeIndex == 0 ? CbColors.purpleMain : Colors.transparent,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                        ),
                        child: const Center(
                          child: Text(
                            '🏢 Verified Venue',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _modeIndex = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _modeIndex == 1 ? CbColors.tealGas : Colors.transparent,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                        ),
                        child: Center(
                          child: Text(
                            '🎸 Street / Permit',
                            style: TextStyle(
                              color: _modeIndex == 1 ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _modeIndex = 2),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _modeIndex == 2 ? CbColors.rankGold : Colors.transparent,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                        ),
                        child: Center(
                          child: Text(
                            '🚶 Mobile',
                            style: TextStyle(
                              color: _modeIndex == 2 ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (contextState.isBand && (contextState.activeContext.role == 'BAND_MEMBER' || contextState.activeContext.role == 'GUEST_MUSICIAN'))
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0x22EF4444),
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                border: Border.all(color: CbColors.statusError.withAlpha(80)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.lock_outline, color: CbColors.statusError, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Only the Band Founder or Admin can start live sessions for this band.',
                      style: TextStyle(color: CbColors.statusError, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),

          // Content based on Mode
          Expanded(
            child: _modeIndex == 0
                ? _buildVenueSelector()
                : _buildStreetPermitSelector(),
          ),

          // What Fans Will See Preview & Action Button
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                WhatFansWillSeeCard(
                  isVenue: _modeIndex == 0,
                  venueName: _modeIndex == 0 ? _selectedVenue?.name : null,
                  venueCityState: _modeIndex == 0 ? _selectedVenue?.cityState : null,
                  neighborhoodArea: _streetDescController.text.trim().isNotEmpty
                      ? _streetDescController.text.trim()
                      : 'Neighborhood Area',
                  freshnessText: _modeIndex == 2 ? 'Live Mobile Session' : 'Verified One-Shot Pin',
                ),
                const SizedBox(height: 10),
                if (_startError != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      _startError!,
                      style: const TextStyle(color: CbColors.statusError, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _modeIndex == 0
                          ? CbColors.purpleMain
                          : (_modeIndex == 1 ? CbColors.tealGas : CbColors.rankGold),
                      foregroundColor: _modeIndex == 0 ? Colors.white : Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    icon: _isVerifying
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.sensors, size: 20),
                    label: Text(
                      _isVerifying ? 'Verifying GPS & Stage...' : 'Go Live & Broadcast',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    onPressed: (_isVerifying || (contextState.isBand && (contextState.activeContext.role == 'BAND_MEMBER' || contextState.activeContext.role == 'GUEST_MUSICIAN')))
                        ? null
                        : () => _handleStartPerformance(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildVenueSelector() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        TextField(
          controller: _searchController,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Search nearby verified venues...',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
            prefixIcon: const Icon(Icons.search, color: Colors.white38, size: 18),
            filled: true,
            fillColor: CbColors.surfaceBase,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 12),
        const Text('NEARBY VERIFIED VENUES', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
        const SizedBox(height: 8),
        ...kMockVerifiedVenues.map((v) {
          final isSelected = _selectedVenue?.id == v.id;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            child: CbGlassCard(
              borderColor: isSelected ? CbColors.purpleLight : Colors.white12,
              backgroundColor: isSelected ? const Color(0x228B5CF6) : const Color(0x11FFFFFF),
              padding: const EdgeInsets.all(12),
              onTap: () => setState(() => _selectedVenue = v),
              child: Row(
                children: [
                  Icon(Icons.storefront, color: isSelected ? CbColors.purpleLight : Colors.white60, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(v.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('${v.address}, ${v.cityState}', style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isSelected ? CbColors.purpleMain : Colors.white10,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${v.distanceMiles} mi',
                      style: TextStyle(color: isSelected ? Colors.white : Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildStreetPermitSelector() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        const CbGlassCard(
          padding: EdgeInsets.all(14),
          backgroundColor: Color(0x2203DAC6),
          borderColor: Color(0x6603DAC6),
          child: Row(
            children: [
              Icon(Icons.gps_fixed, color: CbColors.tealGas, size: 20),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('GPS Freshness Verified', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('32.7157° N, 117.1611° W (Accuracy: ±4m)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('SPOT / CORNER DESCRIPTION', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
        const SizedBox(height: 6),
        TextField(
          controller: _streetDescController,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'e.g. Balboa Park Plaza by Botanical Garden',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
            filled: true,
            fillColor: CbColors.surfaceBase,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 16),
        Material(
          color: Colors.transparent,
          child: SwitchListTile(
            value: _hasPermit,
            activeTrackColor: CbColors.tealGas,
            contentPadding: EdgeInsets.zero,
            title: const Text('City Busking / Street Permit Active', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            subtitle: const Text('Compliant with local municipal sound and space regulations', style: TextStyle(color: CbColors.textMuted, fontSize: 11)),
            onChanged: (val) => setState(() => _hasPermit = val),
          ),
        ),
      ],
    );
  }
}
