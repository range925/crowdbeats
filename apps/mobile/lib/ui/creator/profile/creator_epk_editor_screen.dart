// Crowdbeats V2 — Production Mobile EPK Profile Editor (Phase 5)
// Bio, genres, streaming URLs, social media links & public preview modal.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class CreatorEpkEditorScreen extends ConsumerStatefulWidget {
  const CreatorEpkEditorScreen({super.key});

  @override
  ConsumerState<CreatorEpkEditorScreen> createState() => _CreatorEpkEditorScreenState();
}

class _CreatorEpkEditorScreenState extends ConsumerState<CreatorEpkEditorScreen> {
  final _nameController = TextEditingController(text: 'Elena Cruz');
  final _taglineController = TextEditingController(text: 'Indie Soul & Acoustic Groove from San Diego');
  final _bioController = TextEditingController(
    text: 'Elena Cruz is an award-winning indie acoustic songwriter blending heartfelt vocal harmonies with energetic street rhythm. Performing across California music halls and coastal venues.',
  );
  final _spotifyController = TextEditingController(text: 'https://open.spotify.com/artist/elenacruz');
  final _instagramController = TextEditingController(text: '@elenacruzmusic');
  final _youtubeController = TextEditingController(text: 'https://youtube.com/@elenacruzlive');

  final List<String> _allGenres = ['Indie', 'Acoustic', 'Soul', 'R&B', 'Folk', 'Rock', 'Pop', 'Jazz', 'Electronic'];
  final Set<String> _selectedGenres = {'Indie', 'Acoustic', 'Soul'};

  @override
  void dispose() {
    _nameController.dispose();
    _taglineController.dispose();
    _bioController.dispose();
    _spotifyController.dispose();
    _instagramController.dispose();
    _youtubeController.dispose();
    super.dispose();
  }

  void _handleSaveProfile() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('EPK Profile saved & published!'), backgroundColor: CbColors.statusLive),
    );
    Navigator.of(context).pop();
  }

  void _showPublicPreview() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: CbColors.surfaceCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(color: CbColors.purpleDim, shape: BoxShape.circle),
                child: const Center(child: Text('EC', style: TextStyle(color: CbColors.purpleLight, fontSize: 24, fontWeight: FontWeight.bold))),
              ),
            ),
            const SizedBox(height: 12),
            Center(child: Text(_nameController.text, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
            Center(child: Text(_taglineController.text, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12), textAlign: TextAlign.center)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 6,
              children: _selectedGenres.map((g) => Chip(
                label: Text(g, style: const TextStyle(fontSize: 11, color: Colors.white)),
                backgroundColor: CbColors.purpleMain,
              )).toList(),
            ),
            const SizedBox(height: 16),
            const Text('BIO', style: TextStyle(color: CbColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(_bioController.text, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4)),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Close Preview', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Public EPK Profile Editor', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.visibility, size: 16, color: CbColors.tealGas),
            label: const Text('Preview', style: TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 13)),
            onPressed: _showPublicPreview,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header / Stage Name
          const Text('STAGE / BAND NAME', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          TextField(
            controller: _nameController,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              filled: true,
              fillColor: CbColors.surfaceBase,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),

          // Short Tagline
          const Text('SHORT TAGLINE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          TextField(
            controller: _taglineController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              filled: true,
              fillColor: CbColors.surfaceBase,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),

          // Genres Chip Selector
          const Text('GENRES (SELECT UP TO 3)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: _allGenres.map((g) {
              final isSel = _selectedGenres.contains(g);
              return FilterChip(
                label: Text(g, style: TextStyle(color: isSel ? Colors.white : Colors.white70, fontSize: 12)),
                selected: isSel,
                selectedColor: CbColors.purpleMain,
                backgroundColor: CbColors.surfaceBase,
                onSelected: (val) {
                  setState(() {
                    if (val) {
                      _selectedGenres.add(g);
                    } else {
                      _selectedGenres.remove(g);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Full Bio Editor
          const Text('FULL BIOGRAPHY (MAX 1,000 CHARS)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          TextField(
            controller: _bioController,
            maxLines: 5,
            maxLength: 1000,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              filled: true,
              fillColor: CbColors.surfaceBase,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),

          // Streaming & Social Links
          const Text('STREAMING & SOCIAL LINKS', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _spotifyController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.music_note, color: CbColors.tealGas, size: 18),
              hintText: 'Spotify Artist URL',
              filled: true,
              fillColor: CbColors.surfaceBase,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _instagramController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.camera_alt, color: CbColors.heartOrange, size: 18),
              hintText: 'Instagram Handle',
              filled: true,
              fillColor: CbColors.surfaceBase,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _youtubeController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.play_circle_fill, color: CbColors.statusError, size: 18),
              hintText: 'YouTube Channel URL',
              filled: true,
              fillColor: CbColors.surfaceBase,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),

          // Save CTA
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: CbColors.purpleMain,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
              ),
              onPressed: _handleSaveProfile,
              child: const Text('Save & Publish EPK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }
}
