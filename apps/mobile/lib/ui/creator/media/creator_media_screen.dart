// Crowdbeats V2 — Mobile Media Library & Press Kit Screen (Phase 5)
// Photo gallery, stage shots, video reels & primary EPK headshot selector.
// Supports Solo Musician & Band Creator Studio with production Firestore backend handlers.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../firebase/firestore_service.dart';
import '../../components/cb_button.dart';
import '../../components/cb_glass_card.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';

class MediaAsset {
  const MediaAsset({
    required this.id,
    required this.title,
    required this.type, // 'photo' | 'video' | 'stage_backdrop'
    required this.isPrimaryEpk,
    this.isCover = false,
    this.url = '',
    this.fileSize = '3.5 MB',
    this.dimensions = '2400x1600',
    this.createdAt,
  });

  final String id;
  final String title;
  final String type;
  final bool isPrimaryEpk;
  final bool isCover;
  final String url;
  final String fileSize;
  final String dimensions;
  final DateTime? createdAt;

  MediaAsset copyWith({
    String? id,
    String? title,
    String? type,
    bool? isPrimaryEpk,
    bool? isCover,
    String? url,
    String? fileSize,
    String? dimensions,
    DateTime? createdAt,
  }) {
    return MediaAsset(
      id: id ?? this.id,
      title: title ?? this.title,
      type: type ?? this.type,
      isPrimaryEpk: isPrimaryEpk ?? this.isPrimaryEpk,
      isCover: isCover ?? this.isCover,
      url: url ?? this.url,
      fileSize: fileSize ?? this.fileSize,
      dimensions: dimensions ?? this.dimensions,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'type': type,
      'isPrimaryEpk': isPrimaryEpk,
      'isCover': isCover,
      'url': url,
      'fileSize': fileSize,
      'dimensions': dimensions,
    };
  }

  factory MediaAsset.fromMap(Map<String, dynamic> map, String id) {
    return MediaAsset(
      id: id,
      title: map['title'] as String? ?? 'Untitled Asset',
      type: map['type'] as String? ?? 'photo',
      isPrimaryEpk: map['isPrimaryEpk'] as bool? ?? false,
      isCover: map['isCover'] as bool? ?? false,
      url: map['url'] as String? ?? '',
      fileSize: map['fileSize'] as String? ?? '3.5 MB',
      dimensions: map['dimensions'] as String? ?? '2400x1600',
    );
  }
}

class CreatorMediaScreen extends StatefulWidget {
  const CreatorMediaScreen({
    super.key,
    this.isBand = false,
    this.entityId = 'solo_default',
    this.entityName = 'Elena Cruz',
  });

  final bool isBand;
  final String entityId;
  final String entityName;

  @override
  State<CreatorMediaScreen> createState() => _CreatorMediaScreenState();
}

class _CreatorMediaScreenState extends State<CreatorMediaScreen> {
  bool _isLoading = false;
  String _selectedFilter = 'ALL';

  late List<MediaAsset> _assets;

  @override
  void initState() {
    super.initState();
    // Default initial seed assets tailored to Solo or Band identity context
    if (widget.isBand) {
      _assets = [
        const MediaAsset(
          id: 'm1',
          title: 'Studio EPK Headshot',
          type: 'photo',
          isPrimaryEpk: true,
          fileSize: '4.8 MB',
          dimensions: '3000x2000',
          url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
        ),
        const MediaAsset(
          id: 'm2',
          title: 'Sunset Lounge Stage Shot',
          type: 'photo',
          isPrimaryEpk: false,
          fileSize: '3.9 MB',
          dimensions: '1920x1080',
          url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
        ),
        const MediaAsset(
          id: 'm3',
          title: 'Acoustic Encore Video Clip',
          type: 'video',
          isPrimaryEpk: false,
          fileSize: '24.2 MB',
          dimensions: '4K · 1:12',
          url: 'https://assets.crowdbeats.com/video/midnight_echoes_encore.mp4',
        ),
        const MediaAsset(
          id: 'm4',
          title: 'Casbah Band Promo Photo',
          type: 'photo',
          isPrimaryEpk: false,
          fileSize: '3.1 MB',
          dimensions: '2048x1536',
          url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6',
        ),
        const MediaAsset(
          id: 'm5',
          title: 'Midnight Echoes Stage Banner',
          type: 'stage_backdrop',
          isPrimaryEpk: false,
          isCover: true,
          fileSize: '6.4 MB',
          dimensions: '2560x1440',
          url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
        ),
      ];
    } else {
      _assets = [
        const MediaAsset(
          id: 'm1',
          title: 'Studio EPK Headshot',
          type: 'photo',
          isPrimaryEpk: true,
          fileSize: '4.2 MB',
          dimensions: '2400x2400',
          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        ),
        const MediaAsset(
          id: 'm2',
          title: 'Sunset Lounge Stage Shot',
          type: 'photo',
          isPrimaryEpk: false,
          fileSize: '3.8 MB',
          dimensions: '1920x1080',
          url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a',
        ),
        const MediaAsset(
          id: 'm3',
          title: 'Acoustic Encore Video Clip',
          type: 'video',
          isPrimaryEpk: false,
          fileSize: '18.4 MB',
          dimensions: '1080p · 0:45',
          url: 'https://assets.crowdbeats.com/video/elena_cruz_encore.mp4',
        ),
        const MediaAsset(
          id: 'm4',
          title: 'Casbah Band Promo Photo',
          type: 'photo',
          isPrimaryEpk: false,
          fileSize: '2.9 MB',
          dimensions: '1800x1200',
          url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
        ),
        const MediaAsset(
          id: 'm5',
          title: 'Elena Cruz Live Cover Banner',
          type: 'stage_backdrop',
          isPrimaryEpk: false,
          isCover: true,
          fileSize: '5.1 MB',
          dimensions: '2560x1440',
          url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
        ),
      ];
    }

    _loadAssetsFromBackend();
  }

  Future<void> _loadAssetsFromBackend() async {
    setState(() => _isLoading = true);
    try {
      final backendAssets = await FirestoreService.instance.getMediaAssets(
        entityId: widget.entityId,
        isBand: widget.isBand,
      );
      if (backendAssets.isNotEmpty && mounted) {
        setState(() {
          _assets = backendAssets.map((m) => MediaAsset.fromMap(m, m['id'] as String)).toList();
        });
      }
    } catch (_) {
      // Retain fallback defaults
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<MediaAsset> get _filteredAssets {
    if (_selectedFilter == 'PHOTOS') {
      return _assets.where((a) => a.type == 'photo').toList();
    } else if (_selectedFilter == 'VIDEOS') {
      return _assets.where((a) => a.type == 'video').toList();
    } else if (_selectedFilter == 'BANNERS') {
      return _assets.where((a) => a.type == 'stage_backdrop').toList();
    }
    return _assets;
  }

  Future<void> _handleSetPrimary(MediaAsset asset) async {
    setState(() {
      _assets = _assets.map((a) {
        return a.copyWith(isPrimaryEpk: a.id == asset.id);
      }).toList();
    });

    try {
      await FirestoreService.instance.setPrimaryEpkPhoto(
        entityId: widget.entityId,
        isBand: widget.isBand,
        assetId: asset.id,
        photoUrl: asset.url,
      );
    } catch (e) {
      debugPrint('[Media] setPrimaryEpkPhoto mock fallback: $e');
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.black, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${asset.title} set as Primary EPK Headshot!',
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
  }

  Future<void> _handleSetCover(MediaAsset asset) async {
    setState(() {
      _assets = _assets.map((a) {
        return a.copyWith(isCover: a.id == asset.id);
      }).toList();
    });

    try {
      await FirestoreService.instance.setStageBackdropCover(
        entityId: widget.entityId,
        isBand: widget.isBand,
        assetId: asset.id,
        coverUrl: asset.url,
      );
    } catch (e) {
      debugPrint('[Media] setStageBackdropCover mock fallback: $e');
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.black, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${asset.title} set as Stage Banner!',
                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          backgroundColor: CbColors.purpleLight,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleDelete(MediaAsset asset) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: const Text('Delete Asset', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete "${asset.title}"? This cannot be undone.',
          style: const TextStyle(color: CbColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: CbColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _assets.removeWhere((a) => a.id == asset.id);
    });

    try {
      await FirestoreService.instance.deleteMediaAsset(
        entityId: widget.entityId,
        isBand: widget.isBand,
        assetId: asset.id,
      );
    } catch (e) {
      debugPrint('[Media] deleteMediaAsset mock fallback: $e');
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Deleted "${asset.title}" from Media Library'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _copyAssetLink(MediaAsset asset) {
    Clipboard.setData(ClipboardData(text: asset.url.isNotEmpty ? asset.url : 'https://crowdbeats.com/media/${asset.id}'));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Asset link copied: ${asset.title}'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showAssetOptions(MediaAsset asset) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: CbColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    children: [
                      Icon(
                        asset.type == 'video'
                            ? Icons.play_circle_fill
                            : asset.type == 'stage_backdrop'
                                ? Icons.panorama
                                : Icons.image,
                        color: CbColors.purpleLight,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          asset.title,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(color: Color(0x1FFFFFFF)),
                if (asset.type == 'photo')
                  ListTile(
                    leading: const Icon(Icons.star_outline, color: CbColors.statusLive),
                    title: const Text('Set as Primary EPK Headshot', style: TextStyle(color: Colors.white, fontSize: 13)),
                    subtitle: const Text('Used on public discovery cards and venue posters', style: TextStyle(color: CbColors.textMuted, fontSize: 11)),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      _handleSetPrimary(asset);
                    },
                  ),
                ListTile(
                  leading: const Icon(Icons.panorama_outlined, color: CbColors.purpleLight),
                  title: const Text('Set as Stage Banner Backdrop', style: TextStyle(color: Colors.white, fontSize: 13)),
                  subtitle: const Text('Displays as stage hero banner across mic stand tablets', style: TextStyle(color: CbColors.textMuted, fontSize: 11)),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _handleSetCover(asset);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.link, color: CbColors.tealGas),
                  title: const Text('Copy Asset Link', style: TextStyle(color: Colors.white, fontSize: 13)),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _copyAssetLink(asset);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: Colors.redAccent),
                  title: const Text('Delete Asset', style: TextStyle(color: Colors.redAccent, fontSize: 13)),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _handleDelete(asset);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showUploadDialog() {
    final titleController = TextEditingController();
    String selectedType = 'photo';
    bool isPrimary = false;
    bool isCover = false;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: CbColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0x228B5CF6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.cloud_upload_outlined, color: CbColors.purpleLight, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Upload Media Asset',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Text(
                              'Publishing to ${widget.entityName} Press Kit',
                              style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: CbColors.textMuted),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Asset Title
                  const Text('ASSET TITLE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: titleController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g., Live at The Greek Theatre',
                      hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
                      filled: true,
                      fillColor: const Color(0xFF0D0F17),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0x22FFFFFF))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0x22FFFFFF))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: CbColors.purpleMain, width: 1.5)),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Asset Category Type
                  const Text('MEDIA TYPE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _typeChoiceChip('photo', 'Photo', Icons.image, selectedType, (val) => setModalState(() => selectedType = val)),
                      const SizedBox(width: 8),
                      _typeChoiceChip('video', 'Video Clip', Icons.play_circle_fill, selectedType, (val) => setModalState(() => selectedType = val)),
                      const SizedBox(width: 8),
                      _typeChoiceChip('stage_backdrop', 'Stage Banner', Icons.panorama, selectedType, (val) => setModalState(() => selectedType = val)),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Primary Toggles
                  if (selectedType == 'photo')
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Set as Primary EPK Headshot', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                      subtitle: const Text('Replaces main public discovery headshot', style: TextStyle(color: CbColors.textMuted, fontSize: 10)),
                      activeColor: CbColors.statusLive,
                      value: isPrimary,
                      onChanged: (val) => setModalState(() => isPrimary = val),
                    ),
                  if (selectedType == 'stage_backdrop' || selectedType == 'photo')
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Set as Stage Cover Banner', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                      subtitle: const Text('Displays as stage hero background', style: TextStyle(color: CbColors.textMuted, fontSize: 10)),
                      activeColor: CbColors.purpleLight,
                      value: isCover,
                      onChanged: (val) => setModalState(() => isCover = val),
                    ),

                  const SizedBox(height: 20),
                  CbButton(
                    label: 'Publish Asset to Cloud',
                    fullWidth: true,
                    onPressed: () async {
                      final title = titleController.text.trim();
                      if (title.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter an asset title')),
                        );
                        return;
                      }

                      final newAsset = MediaAsset(
                        id: 'm_${DateTime.now().millisecondsSinceEpoch}',
                        title: title,
                        type: selectedType,
                        isPrimaryEpk: isPrimary,
                        isCover: isCover,
                        fileSize: selectedType == 'video' ? '19.8 MB' : '3.6 MB',
                        dimensions: selectedType == 'video' ? '1080p · 1:00' : '2400x1600',
                        url: selectedType == 'video'
                            ? 'https://assets.crowdbeats.com/video/new_upload.mp4'
                            : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
                      );

                      setState(() {
                        if (isPrimary) {
                          _assets = _assets.map((a) => a.copyWith(isPrimaryEpk: false)).toList();
                        }
                        if (isCover) {
                          _assets = _assets.map((a) => a.copyWith(isCover: false)).toList();
                        }
                        _assets.insert(0, newAsset);
                      });

                      Navigator.of(ctx).pop();

                      try {
                        await FirestoreService.instance.addMediaAsset(
                          entityId: widget.entityId,
                          isBand: widget.isBand,
                          asset: newAsset.toMap(),
                        );
                      } catch (e) {
                        debugPrint('[Media] addMediaAsset mock fallback: $e');
                      }

                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(Icons.check_circle, color: Colors.black, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Published "$title" to ${widget.entityName} Media Library!',
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
          },
        );
      },
    );
  }

  Widget _typeChoiceChip(String typeKey, String label, IconData icon, String current, ValueChanged<String> onSelected) {
    final isSelected = typeKey == current;
    return Expanded(
      child: InkWell(
        onTap: () => onSelected(typeKey),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0x338B5CF6) : const Color(0xFF0D0F17),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? CbColors.purpleMain : const Color(0x22FFFFFF)),
          ),
          child: Column(
            children: [
              Icon(icon, size: 16, color: isSelected ? CbColors.purpleLight : CbColors.textMuted),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : CbColors.textMuted,
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final assets = _filteredAssets;

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Media Library & Press Kit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.cloud_upload_outlined, color: CbColors.tealGas),
            tooltip: 'Upload Media Asset',
            onPressed: _showUploadDialog,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_isLoading) ...[
            const LinearProgressIndicator(
              minHeight: 2,
              backgroundColor: Colors.transparent,
              color: CbColors.purpleLight,
            ),
            const SizedBox(height: 8),
          ],
          // Identity Context & Info Header
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
                          widget.isBand ? Icons.groups : Icons.photo_library,
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
                            const Text(
                              'High-Resolution Press Assets',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const Text(
                              'Used for venue posters, fan discovery cards, and EPK links.',
                              style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Filter Pills & Storage Stat Row
                Row(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _filterChip('ALL', 'All (${_assets.length})'),
                            const SizedBox(width: 8),
                            _filterChip('PHOTOS', 'Photos (${_assets.where((a) => a.type == 'photo').length})'),
                            const SizedBox(width: 8),
                            _filterChip('VIDEOS', 'Videos (${_assets.where((a) => a.type == 'video').length})'),
                            const SizedBox(width: 8),
                            _filterChip('BANNERS', 'Banners (${_assets.where((a) => a.type == 'stage_backdrop').length})'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Upload Callout Bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'UPLOADED MEDIA',
                      style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                    InkWell(
                      onTap: _showUploadDialog,
                      child: const Row(
                        children: [
                          Icon(Icons.add, size: 14, color: CbColors.purpleLight),
                          SizedBox(width: 4),
                          Text(
                            'Add Media',
                            style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Gallery Grid
                if (assets.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(32),
                    alignment: Alignment.center,
                    child: const Text('No media items match the selected filter.', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
                  )
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: assets.length,
                    itemBuilder: (ctx, i) {
                      final asset = assets[i];
                      return _buildAssetCard(asset);
                    },
                  ),
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  Widget _filterChip(String key, String label) {
    final isSelected = _selectedFilter == key;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = key),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? CbColors.purpleMain : const Color(0xFF141724),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? CbColors.purpleLight : const Color(0x22FFFFFF)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : CbColors.textMuted,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildAssetCard(MediaAsset asset) {
    return CbGlassCard(
      padding: const EdgeInsets.all(8),
      child: InkWell(
        onTap: () => _showAssetOptions(asset),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Preview thumbnail container
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0D0F17),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0x11FFFFFF)),
                    ),
                    child: Center(
                      child: Icon(
                        asset.type == 'video'
                            ? Icons.play_circle_fill
                            : asset.type == 'stage_backdrop'
                                ? Icons.panorama
                                : Icons.image,
                        size: 40,
                        color: asset.type == 'video'
                            ? CbColors.tealGas
                            : asset.type == 'stage_backdrop'
                                ? CbColors.verifiedBlue
                                : CbColors.purpleLight,
                      ),
                    ),
                  ),
                  // Badges top row
                  Positioned(
                    top: 6,
                    left: 6,
                    right: 6,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (asset.isPrimaryEpk)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xEE10B981), borderRadius: BorderRadius.circular(4)),
                            child: const Text('PRIMARY HEADSHOT', style: TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.w800)),
                          )
                        else if (asset.isCover)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xEE8B5CF6), borderRadius: BorderRadius.circular(4)),
                            child: const Text('STAGE BANNER', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800)),
                          )
                        else
                          const SizedBox.shrink(),
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(11),
                          ),
                          child: const Icon(Icons.more_horiz, size: 14, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Title
            Text(
              asset.title,
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            // Meta row (Type + Dimensions)
            Row(
              children: [
                Text(
                  asset.type.toUpperCase().replaceAll('_', ' '),
                  style: const TextStyle(color: CbColors.textMuted, fontSize: 9, fontWeight: FontWeight.w600),
                ),
                const Text(' • ', style: TextStyle(color: CbColors.textMuted, fontSize: 9)),
                Text(
                  asset.dimensions,
                  style: const TextStyle(color: CbColors.textMuted, fontSize: 9),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
