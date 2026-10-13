// Crowdbeats V2 — Direct Musician Tipping Flow (Stitch Screen ca5f8e01565d4fde9080d6f9774d84db)
// Focused transactional flow: Spotlight performer hero, large numeral amount display,
// preset amount pills ($2, $5, $10, $20, Custom), cheer note, transparent fee schedule,
// payment method selector, and 52px Electric Purple Tip CTA.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_button.dart';
import '../../components/cb_form_field.dart';
import '../../../data/models/discovery.dart';
import '../../../state/auth_state.dart';
import '../../../state/discovery_state.dart';
import '../../../state/tip_state.dart';
import 'tip_auth_gate_modal.dart';
import 'tip_confirmation_sheet.dart';

class TipFlowScreen extends ConsumerStatefulWidget {
  const TipFlowScreen({
    super.key,
    required this.recipientId,
    this.recipientName,
    this.recipientType = 'artist',
    this.sessionId,
    this.avatarUrl,
    this.genre = 'Indie Pop / Rock',
    this.venue = 'The Continental Club • Austin, TX',
    this.initialAmountCents = 1000,
  });

  final String recipientId;
  final String? recipientName;
  final String recipientType;
  final String? sessionId;
  final String? avatarUrl;
  final String genre;
  final String venue;
  final int initialAmountCents;

  @override
  ConsumerState<TipFlowScreen> createState() => _TipFlowScreenState();
}

class _TipFlowScreenState extends ConsumerState<TipFlowScreen> {
  late int _selectedAmountCents;
  bool _isCustom = false;
  final TextEditingController _customCtrl = TextEditingController();
  final TextEditingController _msgCtrl = TextEditingController();
  String _paymentMethod = 'card'; // 'google_pay' | 'card' | 'apple_pay'
  bool _submitting = false;

  late String _resolvedName;
  late String _resolvedType;
  String? _resolvedAvatar;
  late String _resolvedGenre;
  late String _resolvedVenue;
  bool _isVerified = true;

  final List<Map<String, dynamic>> _presets = [
    {'cents': 200, 'label': r'$2'},
    {'cents': 500, 'label': r'$5'},
    {'cents': 1000, 'label': r'$10'},
    {'cents': 2000, 'label': r'$20'},
    {'cents': 0, 'label': 'Custom'},
  ];

  @override
  void initState() {
    super.initState();
    _selectedAmountCents = widget.initialAmountCents;
    _resolvedName = (widget.recipientName != null && widget.recipientName!.isNotEmpty)
        ? widget.recipientName!
        : _formatIdFallback(widget.recipientId);
    _resolvedType = widget.recipientType;
    _resolvedAvatar = widget.avatarUrl;
    _resolvedGenre = widget.genre;
    _resolvedVenue = widget.venue;

    // Check if initial amount is one of the presets
    _isCustom = !_presets.any((p) => p['cents'] == _selectedAmountCents && (p['cents'] as int) > 0);
    if (_isCustom) {
      _customCtrl.text = (_selectedAmountCents / 100).toStringAsFixed(2);
    }

    // Restore pending tip context if one was saved for this recipient
    final pending = ref.read(tipFlowProvider).pendingTipContext;
    if (pending != null &&
        (pending.creatorId == widget.recipientId || pending.creatorSlug == widget.recipientId)) {
      _selectedAmountCents = pending.selectedTipAmountCents;
      if (pending.message != null && pending.message!.isNotEmpty) {
        _msgCtrl.text = pending.message!;
      }
      _isCustom = !_presets.any((p) => p['cents'] == _selectedAmountCents && (p['cents'] as int) > 0);
      if (_isCustom) {
        _customCtrl.text = (_selectedAmountCents / 100).toStringAsFixed(2);
      }
    }

    _msgCtrl.addListener(() {
      if (mounted) setState(() {});
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPerformerDetails();
    });
  }

  static String _formatIdFallback(String id) {
    if (id.isEmpty) return 'Stage Performer';
    final cleaned = id
        .replaceAll(RegExp(r'^(artist_|band_|user_)'), '')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ');
    return cleaned
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');
  }

  Future<void> _loadPerformerDetails() async {
    // 1. Check in-memory discovery performers for immediate match
    final discovery = ref.read(discoveryProvider);
    final match = discovery.performers
        .where((p) => p.id == widget.recipientId || p.slug == widget.recipientId)
        .firstOrNull;
    if (match != null) {
      if (mounted) {
        setState(() {
          _resolvedName = match.name;
          _resolvedAvatar = match.photoUrl ?? _resolvedAvatar;
          _resolvedType = match.type;
          _isVerified = match.isVerified;
          if (match.genres.isNotEmpty) {
            _resolvedGenre = match.genres.join(', ');
          }
          if (match.currentVenueName != null && match.currentVenueName!.isNotEmpty) {
            _resolvedVenue = match.currentVenueName!;
          }
        });
      }
    }

    // 2. Query Firestore collections (artistProfiles, bands, users)
    try {
      final db = FirebaseFirestore.instance;

      final artistDoc = await db.collection('artistProfiles').doc(widget.recipientId).get();
      if (artistDoc.exists && artistDoc.data() != null) {
        final d = artistDoc.data()!;
        if (mounted) {
          setState(() {
            _resolvedName = (d['stageName'] ?? d['artistName'] ?? d['name'] ?? _resolvedName).toString();
            _resolvedAvatar = (d['photoUrl'] ?? d['avatarUrl'] ?? _resolvedAvatar)?.toString();
            _resolvedType = 'artist';
            _isVerified = d['isVerified'] == true;
            if (d['genre'] != null) _resolvedGenre = d['genre'].toString();
            if (d['genres'] is List && (d['genres'] as List).isNotEmpty) {
              _resolvedGenre = (d['genres'] as List).join(', ');
            }
            if (d['venue'] != null) _resolvedVenue = d['venue'].toString();
          });
        }
        return;
      }

      final bandDoc = await db.collection('bands').doc(widget.recipientId).get();
      if (bandDoc.exists && bandDoc.data() != null) {
        final d = bandDoc.data()!;
        if (mounted) {
          setState(() {
            _resolvedName = (d['name'] ?? d['bandName'] ?? _resolvedName).toString();
            _resolvedAvatar = (d['photoUrl'] ?? d['avatarUrl'] ?? _resolvedAvatar)?.toString();
            _resolvedType = 'band';
            _isVerified = d['isVerified'] == true;
            if (d['genre'] != null) _resolvedGenre = d['genre'].toString();
            if (d['genres'] is List && (d['genres'] as List).isNotEmpty) {
              _resolvedGenre = (d['genres'] as List).join(', ');
            }
            if (d['venue'] != null) _resolvedVenue = d['venue'].toString();
          });
        }
        return;
      }

      final userDoc = await db.collection('users').doc(widget.recipientId).get();
      if (userDoc.exists && userDoc.data() != null) {
        final d = userDoc.data()!;
        final profile = d['profileData'] is Map<String, dynamic>
            ? d['profileData'] as Map<String, dynamic>
            : null;
        if (mounted) {
          setState(() {
            _resolvedName = (d['displayName'] ?? profile?['stageName'] ?? d['name'] ?? _resolvedName).toString();
            _resolvedAvatar = (d['photoUrl'] ?? profile?['avatarUrl'] ?? _resolvedAvatar)?.toString();
            final persona = d['personaType']?.toString().toLowerCase();
            _resolvedType = (persona == 'band') ? 'band' : 'artist';
            _isVerified = d['isVerified'] == true || profile?['isVerified'] == true;
            if (profile?['genre'] != null) _resolvedGenre = profile!['genre'].toString();
            if (profile?['genres'] is List && (profile!['genres'] as List).isNotEmpty) {
              _resolvedGenre = (profile!['genres'] as List).join(', ');
            }
          });
        }
      }
    } catch (e) {
      debugPrint('[TipFlowScreen] Firestore performer resolution offline or skipped: $e');
    }
  }

  @override
  void dispose() {
    _customCtrl.dispose();
    _msgCtrl.dispose();
    super.dispose();
  }

  String get _amountDisplay {
    final d = _selectedAmountCents ~/ 100;
    final c = _selectedAmountCents % 100;
    return '\$$d.${c.toString().padLeft(2, '0')}';
  }

  int get _platformFeeCents => (_selectedAmountCents * 600) ~/ 10000;
  int get _netAmountCents => _selectedAmountCents - _platformFeeCents;

  String _formatCents(int cents) {
    final d = cents ~/ 100;
    final c = cents % 100;
    return '\$$d.${c.toString().padLeft(2, '0')}';
  }

  void _onProceed() async {
    if (_selectedAmountCents < 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum tip amount is \$1.00')),
      );
      return;
    }
    if (_selectedAmountCents > 50000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum tip amount is \$500.00')),
      );
      return;
    }

    final authState = ref.read(authStateProvider);
    if (authState.status != CbAuthStatus.authenticated) {
      final pendingContext = PendingTipContext(
        creatorId: widget.recipientId,
        creatorName: _resolvedName,
        creatorType: _resolvedType,
        creatorPhotoUrl: _resolvedAvatar,
        selectedTipAmountCents: _selectedAmountCents,
        currency: 'USD',
        sourceScreen: 'tip_flow',
        message: _msgCtrl.text.trim().isEmpty ? null : _msgCtrl.text.trim(),
      );

      ref.read(tipFlowProvider.notifier).savePendingTipContext(pendingContext);

      await TipAuthGateModal.show(
        context,
        pendingContext: pendingContext,
        from: '/tip/${widget.recipientId}?amount=$_selectedAmountCents',
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      ref.read(tipFlowProvider.notifier).prepare(
        recipientId: widget.recipientId,
        recipientName: _resolvedName,
        recipientType: _resolvedType,
        amountCents: _selectedAmountCents,
      );

      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => TipConfirmationSheet(
          sessionId: widget.sessionId,
          message: _msgCtrl.text.trim().isEmpty ? null : _msgCtrl.text.trim(),
          isAnonymous: false,
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<CbAuthState>(authStateProvider, (prev, next) {
      if (next.status == CbAuthStatus.authenticated) {
        final pending = ref.read(tipFlowProvider).pendingTipContext;
        if (pending != null &&
            (pending.creatorId == widget.recipientId || pending.creatorSlug == widget.recipientId)) {
          ref.read(tipFlowProvider.notifier).clearPendingTipContext();
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _onProceed();
            }
          });
        }
      }
    });

    final defaultAvatar = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80';

    return Scaffold(
      backgroundColor: CbColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            // Focused Transactional Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 22),
                    onPressed: () => Navigator.of(context).maybePop(),
                    tooltip: 'Close',
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Send Tip to $_resolvedName',
                          style: GoogleFonts.dmSans(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: CbColors.statusLive,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Expanded(
                              child: Text(
                                _resolvedVenue,
                                style: GoogleFonts.dmSans(
                                  color: CbColors.textMuted,
                                  fontSize: 11,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: CbColors.surfaceContainer,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                      border: Border.all(color: CbColors.outline),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.shield_outlined, color: CbColors.liveGreen, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          'Secure Tip',
                          style: GoogleFonts.dmSans(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: CbColors.outline, height: 1),

            // Scrollable Content Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Performer Live Card
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: CbColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: CbColors.outline),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              _resolvedAvatar ?? defaultAvatar,
                              width: 56,
                              height: 56,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                width: 56,
                                height: 56,
                                color: CbColors.surfaceBright,
                                child: const Icon(Icons.music_note, color: CbColors.purpleLight),
                              ),
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
                                        _resolvedName,
                                        style: GoogleFonts.dmSans(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (_isVerified) ...[
                                      const SizedBox(width: 4),
                                      const Icon(Icons.verified, color: CbColors.purpleLight, size: 14),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _resolvedGenre,
                                  style: GoogleFonts.dmSans(
                                    color: CbColors.textMuted,
                                    fontSize: 12,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.music_note, color: CbColors.purpleLight, size: 13),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        'Live Set • Active Stage',
                                        style: GoogleFonts.dmSans(
                                          color: CbColors.purpleLight,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Tip Amount Selection Section
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
                      decoration: BoxDecoration(
                        color: CbColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: CbColors.outline),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Select Tip Amount',
                            style: GoogleFonts.dmSans(
                              color: CbColors.textMuted,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          // Big Numeral Value
                          Text(
                            _amountDisplay,
                            style: GoogleFonts.dmSans(
                              color: Colors.white,
                              fontSize: 40,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -1,
                            ),
                          ),
                          const SizedBox(height: 14),
                          // Preset Buttons Row (>=48dp touch targets)
                          Row(
                            children: _presets.map((p) {
                              final int cents = p['cents'] as int;
                              final String label = p['label'] as String;
                              final bool isSelected = (label == 'Custom')
                                  ? _isCustom
                                  : (!_isCustom && _selectedAmountCents == cents);

                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 3),
                                  child: Semantics(
                                    button: true,
                                    selected: isSelected,
                                    label: '$label tip preset',
                                    child: Material(
                                      color: Colors.transparent,
                                      child: InkWell(
                                        onTap: () {
                                          if (label == 'Custom') {
                                            setState(() {
                                              _isCustom = true;
                                            });
                                          } else {
                                            setState(() {
                                              _isCustom = false;
                                              _selectedAmountCents = cents;
                                            });
                                          }
                                        },
                                        borderRadius: BorderRadius.circular(12),
                                        child: AnimatedContainer(
                                          duration: const Duration(milliseconds: 150),
                                          height: 48,
                                          decoration: BoxDecoration(
                                            color: isSelected ? CbColors.purpleMain : CbColors.surfaceBright,
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(
                                              color: isSelected ? CbColors.purpleLight : CbColors.outline,
                                              width: isSelected ? 1.5 : 1,
                                            ),
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            label,
                                            style: GoogleFonts.dmSans(
                                              color: isSelected ? Colors.white : CbColors.textSecondary,
                                              fontSize: label == 'Custom' ? 12 : 14,
                                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),

                          // Custom Amount Input
                          if (_isCustom) ...[
                            const SizedBox(height: 14),
                            CbFormField(
                              label: 'Custom Amount (\$)',
                              controller: _customCtrl,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              hintText: 'Enter amount (e.g. 25.00)',
                              onChanged: (val) {
                                final parsed = double.tryParse(val);
                                if (parsed != null && parsed > 0) {
                                  setState(() {
                                    _selectedAmountCents = (parsed * 100).round();
                                  });
                                }
                              },
                            ),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Cheer Note Input
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: CbColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: CbColors.outline),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.chat_bubble_outline, color: CbColors.purpleLight, size: 16),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        'Send a Cheer Note',
                                        style: GoogleFonts.dmSans(
                                          color: Colors.white,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Optional',
                                style: GoogleFonts.dmSans(
                                  color: CbColors.textMuted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _msgCtrl,
                            maxLength: 140,
                            maxLines: 2,
                            style: GoogleFonts.dmSans(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              hintText: 'Add an encouraging note to $_resolvedName (optional)',
                              hintStyle: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 13),
                              filled: true,
                              fillColor: CbColors.surface,
                              counterText: '${_msgCtrl.text.length} / 140',
                              counterStyle: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 11),
                              contentPadding: const EdgeInsets.all(12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: CbColors.outline),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: CbColors.outline),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: CbColors.purpleMain, width: 1.5),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Payout Transparency Card (Stitch Screen 1)
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: CbColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: CbColors.outline),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.receipt_long, color: CbColors.liveGreen, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                'Payout Transparency',
                                style: GoogleFonts.dmSans(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text('Gross Tip', style: GoogleFonts.dmSans(color: CbColors.textSecondary, fontSize: 13)),
                              ),
                              const SizedBox(width: 8),
                              Text(_amountDisplay, style: GoogleFonts.dmSans(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text('Crowdbeats Platform Fee (6%)', style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 12)),
                              ),
                              const SizedBox(width: 8),
                              Text('− ${_formatCents(_platformFeeCents)}', style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 12)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text('Payment Processing', style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 12)),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0x2210B981),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'Covered by platform',
                                  style: GoogleFonts.dmSans(color: CbColors.liveGreen, fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Divider(color: CbColors.outline, height: 1),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Net Received by Artist',
                                      style: GoogleFonts.dmSans(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                    ),
                                    Text(
                                      'Transfers via direct deposit in 2-3 business days',
                                      style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 10),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _formatCents(_netAmountCents),
                                style: GoogleFonts.dmSans(
                                  color: const Color(0xFF00D8C4),
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Payment Method Selector
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: CbColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: CbColors.outline),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: CbColors.surfaceBright,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: CbColors.outline),
                            ),
                            child: const Icon(Icons.credit_card, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      _paymentMethod == 'google_pay' ? 'Google Pay' : 'Card',
                                      style: GoogleFonts.dmSans(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: CbColors.surfaceBright,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '•••• 4242',
                                        style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 10),
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  'Default payment method',
                                  style: GoogleFonts.dmSans(color: CbColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _paymentMethod = _paymentMethod == 'card' ? 'google_pay' : 'card';
                              });
                            },
                            child: Text(
                              'Change',
                              style: GoogleFonts.dmSans(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // Fixed Bottom Payment Bar (52dp CTA)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              decoration: const BoxDecoration(
                color: CbColors.surface,
                border: Border(top: BorderSide(color: CbColors.outline)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CbButton(
                    label: 'Tip $_amountDisplay',
                    leadingIcon: Icons.bolt,
                    isLoading: _submitting,
                    fullWidth: true,
                    size: CbButtonSize.lg,
                    onPressed: _onProceed,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.lock, color: CbColors.textMuted, size: 12),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          '256-bit encrypted via Stripe • Zero tip skimming',
                          style: GoogleFonts.dmSans(
                            color: CbColors.textMuted,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
