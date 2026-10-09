// Crowdbeats V2 — Direct Musician Tipping Flow (Stitch Screen 1)
// Spotlight performer hero, preset amount tiles, impact banner, payment methods, and Tip CTA.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_pill_button.dart';
import '../../components/cb_tip_preset_card.dart';
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
    this.venue = 'The Casbah • Main Stage',
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
  String _paymentMethod = 'card'; // 'google_pay' | 'card'
  bool _submitting = false;

  late String _resolvedName;
  late String _resolvedType;
  String? _resolvedAvatar;
  late String _resolvedGenre;
  late String _resolvedVenue;
  bool _isVerified = true;

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

    // Restore pending tip context if one was saved for this recipient
    final pending = ref.read(tipFlowProvider).pendingTipContext;
    if (pending != null &&
        (pending.creatorId == widget.recipientId || pending.creatorSlug == widget.recipientId)) {
      _selectedAmountCents = pending.selectedTipAmountCents;
      if (pending.message != null && pending.message!.isNotEmpty) {
        _msgCtrl.text = pending.message!;
      }
    }

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

      // Check artistProfiles
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

      // Check bands
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

      // Check users
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

  final List<Map<String, dynamic>> _presets = [
    {'cents': 500, 'label': '\$5', 'badge': null, 'icon': Icons.favorite_border},
    {'cents': 1000, 'label': '\$10', 'badge': 'POPULAR', 'icon': Icons.favorite},
    {'cents': 2000, 'label': '\$20', 'badge': 'SUPERFAN', 'icon': Icons.star},
    {'cents': 0, 'label': 'Custom', 'badge': null, 'icon': Icons.edit},
  ];

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

  void _onProceed() async {
    if (_selectedAmountCents < 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum tip amount is \$1.00')),
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

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: Stack(
        children: [
          // Background Concert Photo with Gradient
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            child: Stack(
              children: [
                Image.network(
                  _resolvedAvatar ?? 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
                  height: 280,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0x80000000),
                        Color(0xCC0B0C10),
                        CbColors.bgApp,
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top App Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white, size: 22),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xCC151722),
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          border: Border.all(color: CbColors.borderSubtle),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.shield_outlined, color: CbColors.liveGreen, size: 14),
                            SizedBox(width: 4),
                            Text('Secure Tip', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 48), // Spacer
                    ],
                  ),
                ),

                // Scrollable Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 10),

                        // Performer Spotlight Card
                        Center(
                          child: Column(
                            children: [
                              if (_isVerified) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: CbColors.purpleDim,
                                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                                    border: Border.all(color: CbColors.purpleLight),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.verified, color: CbColors.purpleLight, size: 13),
                                      SizedBox(width: 4),
                                      Text('Verified Performer', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                              ],
                              Text(
                                _resolvedName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _resolvedVenue,
                                style: const TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                              Text(
                                _resolvedGenre,
                                style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 28),

                        // Amount Selector Tiles (Stitch Screen 1)
                        const Text(
                          'Select Tip Amount',
                          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 10),

                        Row(
                          children: _presets.map((p) {
                            final int cents = p['cents'] as int;
                            final String label = p['label'] as String;
                            final String? badge = p['badge'] as String?;
                            final IconData icon = p['icon'] as IconData;
                            final bool isSelected = !_isCustom && _selectedAmountCents == cents;

                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: CbTipPresetCard(
                                  amountLabel: label,
                                  badgeText: badge,
                                  icon: Icon(icon, size: 14, color: isSelected ? CbColors.purpleLight : CbColors.textMuted),
                                  isSelected: label == 'Custom' ? _isCustom : isSelected,
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
                                ),
                              ),
                            );
                          }).toList(),
                        ),

                        // Custom Amount Field (if selected)
                        if (_isCustom) ...[
                          const SizedBox(height: 12),
                          CbFormField(
                            label: 'Custom Amount (\$)',
                            controller: _customCtrl,
                            keyboardType: TextInputType.number,
                            hintText: 'Enter amount (e.g. 25.00)',
                            onChanged: (val) {
                              final parsed = double.tryParse(val);
                              if (parsed != null) {
                                setState(() {
                                  _selectedAmountCents = (parsed * 100).round();
                                });
                              }
                            },
                          ),
                        ],

                        const SizedBox(height: 18),

                        // Message Input
                        CbFormField(
                          label: 'Add a Note of Appreciation (Optional)',
                          controller: _msgCtrl,
                          hintText: 'Say something encouraging...',
                          leadingIcon: const Icon(Icons.chat_bubble_outline, size: 16, color: CbColors.textMuted),
                        ),

                        const SizedBox(height: 18),

                        // Payment Methods Selector
                        const Text(
                          'Payment Method',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),

                        Row(
                          children: [
                            Expanded(
                              child: _buildPaymentRadio(
                                id: 'google_pay',
                                label: 'Google Pay',
                                icon: Icons.account_balance_wallet,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _buildPaymentRadio(
                                id: 'card',
                                label: 'Card •••• 4242',
                                icon: Icons.credit_card,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),

                        // Impact Notice Banner (Stitch Screen 1)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: CbColors.surface2,
                            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                            border: Border.all(color: CbColors.borderSubtle),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.volunteer_activism, color: CbColors.liveGreen, size: 18),
                              SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  '100% of your tip goes directly to the performer via verified Stripe Connect payout.',
                                  style: TextStyle(color: CbColors.textSecondary, fontSize: 11, height: 1.3),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Tip CTA Button
                        CbPillButton(
                          label: 'Tip $_amountDisplay',
                          leadingIcon: const Icon(Icons.favorite, size: 18, color: Colors.white),
                          isLoading: _submitting,
                          onPressed: _onProceed,
                        ),

                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentRadio({
    required String id,
    required String label,
    required IconData icon,
  }) {
    final bool isSelected = _paymentMethod == id;
    return Semantics(
      button: true,
      selected: isSelected,
      label: '$label payment method',
      child: GestureDetector(
        onTap: () => setState(() => _paymentMethod = id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: CbColors.surface2,
            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            border: Border.all(
              color: isSelected ? CbColors.purpleMain : CbColors.borderSubtle,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, size: 16, color: isSelected ? Colors.white : CbColors.textMuted),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : CbColors.textSecondary,
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isSelected)
                const Icon(Icons.check_circle, size: 14, color: CbColors.purpleLight),
            ],
          ),
        ),
      ),
    );
  }
}
