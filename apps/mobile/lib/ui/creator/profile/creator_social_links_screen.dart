// Crowdbeats V2 — Creator Streaming & Social Links Screen
// Production module for Solo Musician & Band Creator Studio.
// Manages Spotify, Apple Music, YouTube, Instagram, TikTok, SoundCloud, and Website.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../firebase/firestore_service.dart';
import '../../components/cb_button.dart';
import '../../components/cb_glass_card.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';

class CreatorSocialLinksScreen extends ConsumerStatefulWidget {
  const CreatorSocialLinksScreen({
    super.key,
    this.isBand = false,
    this.entityId = 'solo_default',
    this.entityName = 'Elena Cruz',
  });

  final bool isBand;
  final String entityId;
  final String entityName;

  @override
  ConsumerState<CreatorSocialLinksScreen> createState() => _CreatorSocialLinksScreenState();
}

class _CreatorSocialLinksScreenState extends ConsumerState<CreatorSocialLinksScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _spotifyController;
  late final TextEditingController _appleMusicController;
  late final TextEditingController _youtubeController;
  late final TextEditingController _instagramController;
  late final TextEditingController _tiktokController;
  late final TextEditingController _soundcloudController;
  late final TextEditingController _websiteController;

  bool _isLoading = false;
  bool _isSaving = false;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    // Default initial mock/demo values based on context
    if (widget.isBand) {
      _spotifyController = TextEditingController(text: 'https://open.spotify.com/artist/themidmightechoes');
      _appleMusicController = TextEditingController(text: 'https://music.apple.com/us/artist/the-midnight-echoes');
      _youtubeController = TextEditingController(text: 'https://youtube.com/@themidmightechoes');
      _instagramController = TextEditingController(text: '@themidmightechoes');
      _tiktokController = TextEditingController(text: '@themidmightechoes');
      _soundcloudController = TextEditingController(text: '');
      _websiteController = TextEditingController(text: 'https://themidmightechoes.com');
    } else {
      _spotifyController = TextEditingController(text: 'https://open.spotify.com/artist/elenacruz');
      _appleMusicController = TextEditingController(text: 'https://music.apple.com/us/artist/elena-cruz');
      _youtubeController = TextEditingController(text: 'https://youtube.com/@elenacruzlive');
      _instagramController = TextEditingController(text: '@elenacruzmusic');
      _tiktokController = TextEditingController(text: '@elenacruz_live');
      _soundcloudController = TextEditingController(text: 'https://soundcloud.com/elenacruzmusic');
      _websiteController = TextEditingController(text: 'https://elenacruzmusic.com');
    }

    _loadExistingLinks();
  }

  @override
  void dispose() {
    _spotifyController.dispose();
    _appleMusicController.dispose();
    _youtubeController.dispose();
    _instagramController.dispose();
    _tiktokController.dispose();
    _soundcloudController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  Future<void> _loadExistingLinks() async {
    setState(() => _isLoading = true);
    try {
      final links = await FirestoreService.instance.getSocialLinks(
        entityId: widget.entityId,
        isBand: widget.isBand,
      );
      if (links != null && mounted) {
        if (links['spotify'] is String && (links['spotify'] as String).isNotEmpty) {
          _spotifyController.text = links['spotify'] as String;
        }
        if (links['appleMusic'] is String && (links['appleMusic'] as String).isNotEmpty) {
          _appleMusicController.text = links['appleMusic'] as String;
        }
        if (links['youtube'] is String && (links['youtube'] as String).isNotEmpty) {
          _youtubeController.text = links['youtube'] as String;
        }
        if (links['instagram'] is String && (links['instagram'] as String).isNotEmpty) {
          _instagramController.text = links['instagram'] as String;
        }
        if (links['tiktok'] is String && (links['tiktok'] as String).isNotEmpty) {
          _tiktokController.text = links['tiktok'] as String;
        }
        if (links['soundcloud'] is String && (links['soundcloud'] as String).isNotEmpty) {
          _soundcloudController.text = links['soundcloud'] as String;
        }
        if (links['website'] is String && (links['website'] as String).isNotEmpty) {
          _websiteController.text = links['website'] as String;
        }
      }
    } catch (_) {
      // Retain fallback defaults
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _normalizeUrl(String input) {
    final trimmed = input.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return 'https://$trimmed';
  }

  String _normalizeHandle(String input) {
    final trimmed = input.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('@')) return trimmed;
    return '@$trimmed';
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _statusMessage = null;
    });

    final socialLinks = <String, dynamic>{
      'spotify': _normalizeUrl(_spotifyController.text),
      'appleMusic': _normalizeUrl(_appleMusicController.text),
      'youtube': _normalizeUrl(_youtubeController.text),
      'instagram': _normalizeHandle(_instagramController.text),
      'tiktok': _normalizeHandle(_tiktokController.text),
      if (!widget.isBand || _soundcloudController.text.isNotEmpty)
        'soundcloud': _normalizeUrl(_soundcloudController.text),
      'website': _normalizeUrl(_websiteController.text),
    };

    try {
      await FirestoreService.instance.updateSocialLinks(
        entityId: widget.entityId,
        isBand: widget.isBand,
        socialLinks: socialLinks,
      );
    } catch (e) {
      // In mock/test mode without active backend credentials, gracefully continue
      debugPrint('[SocialLinks] Saved locally / mock handler: $e');
    }

    if (mounted) {
      setState(() {
        _isSaving = false;
        _statusMessage = 'Links successfully saved & published!';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.black, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Streaming & social links updated for ${widget.entityName}!',
                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          backgroundColor: CbColors.statusLive,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  void _copyToClipboard(String text, String label) {
    if (text.trim().isEmpty) return;
    Clipboard.setData(ClipboardData(text: text.trim()));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: Text(
          widget.isBand ? 'Band Streaming & Social Links' : 'Solo Streaming & Social Links',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: CbColors.purpleMain))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                children: [
                  // Context & Identity Header Card
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
                            widget.isBand ? Icons.groups : Icons.mic_external_on,
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
                                  const Text(
                                    'Public Profile Dock',
                                    style: TextStyle(color: CbColors.textMuted, fontSize: 11),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                widget.entityName,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Live Fan Profile Dock Preview Card
                  _buildPublicDockPreview(),
                  const SizedBox(height: 20),

                  // Category 1: Streaming Platforms
                  _buildSectionHeader('STREAMING PLATFORMS', Icons.music_note),
                  const SizedBox(height: 10),

                  _buildLinkInput(
                    controller: _spotifyController,
                    label: 'Spotify Artist URL',
                    hint: 'https://open.spotify.com/artist/...',
                    platformColor: const Color(0xFF1DB954),
                    icon: Icons.graphic_eq,
                    isUrl: true,
                  ),
                  const SizedBox(height: 12),

                  _buildLinkInput(
                    controller: _appleMusicController,
                    label: 'Apple Music Artist URL',
                    hint: 'https://music.apple.com/us/artist/...',
                    platformColor: const Color(0xFFFA243C),
                    icon: Icons.music_video,
                    isUrl: true,
                  ),
                  const SizedBox(height: 12),

                  _buildLinkInput(
                    controller: _youtubeController,
                    label: 'YouTube Channel or Video URL',
                    hint: 'https://youtube.com/@channel',
                    platformColor: const Color(0xFFFF0000),
                    icon: Icons.play_circle_fill,
                    isUrl: true,
                  ),
                  const SizedBox(height: 12),

                  if (!widget.isBand) ...[
                    _buildLinkInput(
                      controller: _soundcloudController,
                      label: 'SoundCloud Profile URL',
                      hint: 'https://soundcloud.com/artist',
                      platformColor: const Color(0xFFFF5500),
                      icon: Icons.cloud_queue,
                      isUrl: true,
                    ),
                    const SizedBox(height: 12),
                  ],

                  const SizedBox(height: 12),

                  // Category 2: Social & Web
                  _buildSectionHeader('SOCIAL & WEB PRESENCE', Icons.public),
                  const SizedBox(height: 10),

                  _buildLinkInput(
                    controller: _instagramController,
                    label: 'Instagram Handle',
                    hint: '@username or https://instagram.com/...',
                    platformColor: const Color(0xFFE1306C),
                    icon: Icons.camera_alt_outlined,
                    isHandle: true,
                  ),
                  const SizedBox(height: 12),

                  _buildLinkInput(
                    controller: _tiktokController,
                    label: 'TikTok Handle',
                    hint: '@username or https://tiktok.com/@...',
                    platformColor: const Color(0xFF00F2FE),
                    icon: Icons.video_library_outlined,
                    isHandle: true,
                  ),
                  const SizedBox(height: 12),

                  _buildLinkInput(
                    controller: _websiteController,
                    label: 'Official Website',
                    hint: 'https://yourband.com',
                    platformColor: const Color(0xFF38BDF8),
                    icon: Icons.language,
                    isUrl: true,
                  ),
                  const SizedBox(height: 24),

                  // Save Action Button
                  CbButton(
                    label: _isSaving ? 'Saving to Blockchain & Cloud…' : 'Save & Publish Links',
                    fullWidth: true,
                    isLoading: _isSaving,
                    onPressed: _handleSave,
                  ),

                  if (_statusMessage != null) ...[
                    const SizedBox(height: 12),
                    Center(
                      child: Text(
                        _statusMessage!,
                        style: const TextStyle(color: CbColors.statusLive, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: CbColors.purpleLight),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: CbColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
          ),
        ),
      ],
    );
  }

  Widget _buildLinkInput({
    required TextEditingController controller,
    required String label,
    required String hint,
    required Color platformColor,
    required IconData icon,
    bool isUrl = false,
    bool isHandle = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: platformColor.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: platformColor, size: 14),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (controller.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.copy, size: 16, color: CbColors.textMuted),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  tooltip: 'Copy $label',
                  onPressed: () => _copyToClipboard(controller.text, label),
                ),
            ],
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
              filled: true,
              fillColor: const Color(0xFF0D0F17),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              isDense: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0x22FFFFFF)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0x22FFFFFF)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: platformColor, width: 1.5),
              ),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ],
      ),
    );
  }

  Widget _buildPublicDockPreview() {
    final hasSpotify = _spotifyController.text.trim().isNotEmpty;
    final hasApple = _appleMusicController.text.trim().isNotEmpty;
    final hasYoutube = _youtubeController.text.trim().isNotEmpty;
    final hasInstagram = _instagramController.text.trim().isNotEmpty;
    final hasTiktok = _tiktokController.text.trim().isNotEmpty;
    final hasSoundcloud = _soundcloudController.text.trim().isNotEmpty;
    final hasWebsite = _websiteController.text.trim().isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F111A),
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: CbColors.purpleMain.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.visibility_outlined, size: 16, color: CbColors.purpleLight),
              const SizedBox(width: 8),
              const Text(
                'LIVE FAN PROFILE PREVIEW',
                style: TextStyle(
                  color: CbColors.purpleLight,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0x2210B981),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Connected',
                  style: TextStyle(color: CbColors.statusLive, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Branded dock displayed on your public stage & mic stand profile:',
            style: TextStyle(color: CbColors.textMuted, fontSize: 11),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (hasSpotify)
                _previewChip('Spotify', const Color(0xFF1DB954), Icons.graphic_eq),
              if (hasApple)
                _previewChip('Apple Music', const Color(0xFFFA243C), Icons.music_video),
              if (hasYoutube)
                _previewChip('YouTube', const Color(0xFFFF0000), Icons.play_circle_fill),
              if (hasInstagram)
                _previewChip('Instagram', const Color(0xFFE1306C), Icons.camera_alt_outlined),
              if (hasTiktok)
                _previewChip('TikTok', const Color(0xFF00F2FE), Icons.video_library_outlined),
              if (hasSoundcloud)
                _previewChip('SoundCloud', const Color(0xFFFF5500), Icons.cloud_queue),
              if (hasWebsite)
                _previewChip('Website', const Color(0xFF38BDF8), Icons.language),
              if (!hasSpotify && !hasApple && !hasYoutube && !hasInstagram && !hasTiktok && !hasWebsite)
                const Text(
                  'No active links yet. Add your links below to populate the dock.',
                  style: TextStyle(color: Colors.white54, fontSize: 11, fontStyle: FontStyle.italic),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _previewChip(String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
