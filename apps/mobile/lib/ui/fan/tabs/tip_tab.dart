// Crowdbeats V2 — Tip Tab (Phase 6)
//
// Entry point for tipping. Two discovery paths:
// 1. Scan QR code → QrScannerScreen → TipFlowScreen (primary path)
// 2. Search artists → TipFlowScreen (fallback)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/cb_colors.dart';
import '../tip/tip_flow_screen.dart';
import '../../camera/camera_capture_screen.dart';

class TipTab extends ConsumerStatefulWidget {
  const TipTab({super.key});

  @override
  ConsumerState<TipTab> createState() => _TipTabState();
}

class _TipTabState extends ConsumerState<TipTab> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tip'),
        centerTitle: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Primary: QR scan CTA
              _QrScanCard(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const CameraCaptureScreen(),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),
              Text(
                'Or search for an artist',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              // Search field (Phase 6: mock results)
              TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Artist name…',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),
              if (_searchCtrl.text.isNotEmpty)
                // Demo artist for testing (real search in Phase 7)
                _ArtistSearchResult(
                  name: 'Demo Artist',
                  genre: 'Indie Rock',
                  onTip: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const TipFlowScreen(
                        recipientId: 'demo_artist_id',
                        recipientName: 'Demo Artist',
                        recipientType: 'artist',
                      ),
                    ),
                  ),
                )
              else
                const _EmptySearchHint(),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _QrScanCard extends StatelessWidget {
  const _QrScanCard({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Scan QR code to tip a performer',
      button: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                CbColors.accentPrimary.withAlpha(60),
                CbColors.accentSecondary.withAlpha(60),
              ],
            ),
            border: Border.all(color: CbColors.accentPrimary.withAlpha(80)),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Column(
            children: [
              Icon(Icons.qr_code_scanner,
                  size: 64, color: CbColors.accentPrimary),
              SizedBox(height: 16),
              Text(
                'Scan Performer QR',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              Text(
                'Scan the QR code at the venue to tip instantly',
                textAlign: TextAlign.center,
                style:
                    TextStyle(fontSize: 13, color: Colors.white54),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ArtistSearchResult extends StatelessWidget {
  const _ArtistSearchResult({
    required this.name,
    required this.genre,
    required this.onTip,
  });

  final String name;
  final String genre;
  final VoidCallback onTip;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: CbColors.accentPrimary.withAlpha(40),
          child: Text(
            name[0],
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(name),
        subtitle: Text(genre),
        trailing: FilledButton(
          onPressed: onTip,
          style: FilledButton.styleFrom(
            minimumSize: const Size(60, 36),
            padding: const EdgeInsets.symmetric(horizontal: 12),
          ),
          child: const Text('Tip'),
        ),
      ),
    );
  }
}

class _EmptySearchHint extends StatelessWidget {
  const _EmptySearchHint();

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Icon(Icons.person_search_outlined,
            size: 48, color: Colors.white24),
        SizedBox(height: 12),
        Text(
          'Search for an artist by name',
          style: TextStyle(color: Colors.white38),
        ),
      ],
    );
  }
}
