// Crowdbeats V2 — AR Camera Performer Detection & QR Viewfinder (Stitch Screens 3 & 12)
// Dynamic neon green targeting reticle with performer detection badge and bottom tipping drawer.

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../components/permission_education_sheet.dart';
import '../../components/cb_live_badge.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import 'tip_flow_screen.dart';

enum QrScanStatus {
  valid,
  expired,
  invalid,
}

class QrValidationResult {
  const QrValidationResult({
    required this.status,
    this.performerId,
    this.errorMessage,
  });

  final QrScanStatus status;
  final String? performerId;
  final String? errorMessage;

  bool get isValid => status == QrScanStatus.valid;
  bool get isExpired => status == QrScanStatus.expired;
}

class QrScannerScreen extends ConsumerStatefulWidget {
  const QrScannerScreen({super.key});

  /// Validates raw QR code payloads, verifying stage expiration timestamps (exp)
  /// and extracting clean performer IDs.
  static QrValidationResult parseAndValidateQr(String rawValue, {DateTime? now}) {
    final trimmed = rawValue.trim();
    if (trimmed.isEmpty) {
      return const QrValidationResult(
        status: QrScanStatus.invalid,
        errorMessage: 'Empty QR code data.',
      );
    }

    // Check expiration if 'exp' query parameter is present in stage rotating QR
    try {
      final uri = Uri.tryParse(trimmed);
      if (uri != null && uri.queryParameters.containsKey('exp')) {
        final expMs = int.tryParse(uri.queryParameters['exp']!);
        if (expMs != null) {
          final currentTimeMs = (now ?? DateTime.now()).millisecondsSinceEpoch;
          if (currentTimeMs > expMs) {
            return const QrValidationResult(
              status: QrScanStatus.expired,
              errorMessage:
                  'This stage QR code has expired. Please ask the performer to refresh their stage code.',
            );
          }
        }
      }
    } catch (_) {}

    final performerId = extractPerformerId(trimmed);
    if (performerId != null && performerId.isNotEmpty) {
      return QrValidationResult(
        status: QrScanStatus.valid,
        performerId: performerId,
      );
    }

    return const QrValidationResult(
      status: QrScanStatus.invalid,
      errorMessage: 'Invalid Crowdbeats QR code.',
    );
  }

  static String? extractPerformerId(String rawValue) {
    final trimmed = rawValue.trim();
    if (trimmed.isEmpty) return null;

    // 1. crowdbeats://tip/{performerId}
    final crowdbeatsUriRegex = RegExp(r'^crowdbeats:\/\/tip\/([a-zA-Z0-9_\-]+)', caseSensitive: false);
    var match = crowdbeatsUriRegex.firstMatch(trimmed);
    if (match != null && match.group(1) != null) return match.group(1);

    // 2. https://crowdbeats.app/tip/{performerId} (and any domain ending in /tip/{performerId})
    final httpRegex = RegExp(r'^https?:\/\/[^\/]+\/tip\/([a-zA-Z0-9_\-]+)', caseSensitive: false);
    match = httpRegex.firstMatch(trimmed);
    if (match != null && match.group(1) != null) return match.group(1);

    // 3. /tip/{performerId}
    final pathRegex = RegExp(r'^\/?tip\/([a-zA-Z0-9_\-]+)', caseSensitive: false);
    match = pathRegex.firstMatch(trimmed);
    if (match != null && match.group(1) != null) return match.group(1);

    // 4. Try parsing as full URI to extract path segment following 'tip'
    try {
      final uri = Uri.parse(trimmed);
      final segments = uri.pathSegments;
      final tipIndex = segments.indexOf('tip');
      if (tipIndex != -1 && tipIndex + 1 < segments.length) {
        final id = segments[tipIndex + 1];
        if (id.isNotEmpty) return id;
      }
    } catch (_) {}

    // 5. Plain performer ID if non-empty and contains no spaces or URL-special characters
    if (!trimmed.contains('/') &&
        !trimmed.contains(' ') &&
        !trimmed.contains('?') &&
        !trimmed.contains(':') &&
        !trimmed.contains('&')) {
      return trimmed;
    }

    return null;
  }

  @override
  ConsumerState<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends ConsumerState<QrScannerScreen> {
  final MobileScannerController _cameraController = MobileScannerController();
  bool _isTorchOn = false;
  final bool _isPerformerDetected = true; // Synthetic AR detection state
  int _instantTipCents = 500; // Default $5.00
  String _selectedEmoji = '🔥';
  String? _error;
  bool _isProcessingBarcode = false;

  final List<String> _emojiReactions = ['🔥', '❤️', '⚡', '👏', '🙌'];
  final List<int> _quickAmounts = [500, 1000, 2000];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkCameraPermission());
  }

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  Future<void> _checkCameraPermission() async {
    final status = await Permission.camera.status;
    if (status.isGranted) return;

    if (!mounted) return;
    final proceed = await PermissionEducationSheet.show(
      context,
      permission: CbPermission.camera,
    );
    if (!proceed || !mounted) {
      setState(() => _error = 'Camera permission is required to detect performers on stage.');
      return;
    }

    final result = await Permission.camera.request();
    if (!mounted) return;
    if (!result.isGranted) {
      setState(() => _error = 'Camera permission was denied.');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        backgroundColor: CbColors.bgApp,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.videocam_off, size: 56, color: CbColors.errorRed),
                const SizedBox(height: 16),
                Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 14)),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _checkCameraPermission,
                  style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
                  child: const Text('Grant Camera Permission'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Live Camera Stream
          MobileScanner(
            controller: _cameraController,
            onDetect: (capture) {
              if (_isProcessingBarcode) return;
              for (final barcode in capture.barcodes) {
                final raw = barcode.rawValue;
                if (raw != null) {
                  final validation = QrScannerScreen.parseAndValidateQr(raw);
                  if (validation.isValid && validation.performerId != null) {
                    _isProcessingBarcode = true;
                    // Route directly to TipFlowScreen(recipientId: performerId) without
                    // substituting any other performer, regardless of distance or GPS.
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute<void>(
                        builder: (_) => TipFlowScreen(
                          recipientId: validation.performerId!,
                        ),
                      ),
                    );
                    break;
                  } else if (validation.isExpired) {
                    _isProcessingBarcode = true;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(validation.errorMessage ?? 'This stage QR code has expired.'),
                        backgroundColor: CbColors.statusWarning,
                        duration: const Duration(seconds: 4),
                      ),
                    );
                    Future.delayed(const Duration(seconds: 3), () {
                      if (mounted) setState(() => _isProcessingBarcode = false);
                    });
                    break;
                  }
                }
              }
            },
          ),

          // 2. AR Neon Green Reticle Box (Stitch Screens 3 & 12)
          if (_isPerformerDetected)
            Center(
              child: _buildArReticleBox(),
            ),

          // 3. Top Action Controls
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 24),
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xCC0B0C10),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                      border: Border.all(color: CbColors.borderSubtle),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.center_focus_strong, color: CbColors.reticleGreen, size: 14),
                        SizedBox(width: 6),
                        Text('AR Vision Tip', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      _isTorchOn ? Icons.flash_on : Icons.flash_off,
                      color: _isTorchOn ? CbColors.heartOrange : Colors.white,
                      size: 24,
                    ),
                    onPressed: () {
                      _cameraController.toggleTorch();
                      setState(() => _isTorchOn = !_isTorchOn);
                    },
                  ),
                ],
              ),
            ),
          ),

          // 4. Bottom Glassmorphic Instant Tipping Drawer (Stitch Screen 12)
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: _buildInstantTipDrawer(),
          ),
        ],
      ),
    );
  }

  Widget _buildArReticleBox() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Detection Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xEB000000),
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
            border: Border.all(color: CbColors.reticleGreen, width: 1.5),
            boxShadow: const [
              BoxShadow(
                color: Color(0x6600FF66),
                blurRadius: 10,
                spreadRadius: 1,
              ),
            ],
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle, color: CbColors.reticleGreen, size: 13),
              SizedBox(width: 5),
              Text(
                'PERFORMER DETECTED • 98% MATCH',
                style: TextStyle(color: CbColors.reticleGreen, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // Corner Reticle Box
        Container(
          width: 240,
          height: 240,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0x6600FF66), width: 1.5),
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          ),
          child: Stack(
            children: [
              // 4 Corner Brackets
              Positioned(top: -2, left: -2, child: _cornerBracket(isTop: true, isLeft: true)),
              Positioned(top: -2, right: -2, child: _cornerBracket(isTop: true, isLeft: false)),
              Positioned(bottom: -2, left: -2, child: _cornerBracket(isTop: false, isLeft: true)),
              Positioned(bottom: -2, right: -2, child: _cornerBracket(isTop: false, isLeft: false)),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Artist Name Pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
          decoration: BoxDecoration(
            color: const Color(0xCC0B0C10),
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
          ),
          child: const Text(
            'Luna & The Waves (Indie Pop)',
            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _cornerBracket({required bool isTop, required bool isLeft}) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        border: Border(
          top: isTop ? const BorderSide(color: CbColors.reticleGreen, width: 3) : BorderSide.none,
          bottom: !isTop ? const BorderSide(color: CbColors.reticleGreen, width: 3) : BorderSide.none,
          left: isLeft ? const BorderSide(color: CbColors.reticleGreen, width: 3) : BorderSide.none,
          right: !isLeft ? const BorderSide(color: CbColors.reticleGreen, width: 3) : BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildInstantTipDrawer() {
    final amountText = '\$${_instantTipCents ~/ 100}.00';

    return ClipRRect(
      borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xEB151722),
            borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
            border: Border.all(color: const Color(0x2BFFFFFF)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x80000000),
                blurRadius: 24,
                spreadRadius: 4,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Performer Header
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: CbColors.purpleLight, width: 1.5),
                      image: const DecorationImage(
                        image: NetworkImage('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Luna & The Waves', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                        Text('The Casbah • Main Stage', style: TextStyle(color: CbColors.purpleLight, fontSize: 11)),
                      ],
                    ),
                  ),
                  const CbLiveBadge(),
                ],
              ),
              const SizedBox(height: 14),

              // Quick Amount Selector
              Row(
                children: _quickAmounts.map((cents) {
                  final bool isSelected = _instantTipCents == cents;
                  return Expanded(
                    child: Semantics(
                      button: true,
                      selected: isSelected,
                      label: 'Tip \$${cents ~/ 100}',
                      child: GestureDetector(
                        onTap: () => setState(() => _instantTipCents = cents),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? CbColors.purpleMain : CbColors.surface2,
                            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                            border: Border.all(
                              color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              '\$${cents ~/ 100}',
                              style: TextStyle(
                                color: isSelected ? Colors.white : CbColors.textSecondary,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 10),

              // Emoji Reaction Bar (Stitch Screen 12)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: _emojiReactions.map((emoji) {
                  final bool isSelected = _selectedEmoji == emoji;
                  return Semantics(
                    button: true,
                    selected: isSelected,
                    label: 'Reaction $emoji',
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedEmoji = emoji),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: isSelected ? CbColors.purpleDim : Colors.transparent,
                          shape: BoxShape.circle,
                          border: isSelected ? Border.all(color: CbColors.purpleLight) : null,
                        ),
                        child: Text(emoji, style: const TextStyle(fontSize: 20)),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),

              // Instant Tip CTA Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const TipFlowScreen(
                          recipientId: 'artist_demo_1',
                          recipientName: 'Luna & The Waves',
                          recipientType: 'artist',
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.flash_on, color: Colors.white, size: 18),
                      const SizedBox(width: 6),
                      Text('Instant Tip $amountText', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
