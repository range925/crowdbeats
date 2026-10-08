// Crowdbeats V2 — Band / Group Onboarding (B1 - B5)
// Collaborative creation with clear founder governance and 10,000 bps split validation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';
import '../components/onboarding_shared_components.dart';
import 'onboarding_helpers.dart';

const _bandGenres = [
  'Rock',
  'Indie Rock',
  'Jazz Fusion',
  'Blues',
  'Funk',
  'Metal',
  'Punk',
  'Reggae',
  'Folk Ensemble',
  'Acoustic Duo',
  'Pop Rock',
  'Electronic Duo',
];

class BandMemberEntry {
  String name;
  String contact;
  String role; // 'BAND_FOUNDER', 'BAND_MANAGER', 'BAND_MEMBER'
  int splitBps; // 10,000 = 100.00%

  BandMemberEntry({
    required this.name,
    required this.contact,
    required this.role,
    required this.splitBps,
  });
}

class BandOnboardingScreen extends ConsumerStatefulWidget {
  const BandOnboardingScreen({super.key});

  @override
  ConsumerState<BandOnboardingScreen> createState() => _BandOnboardingScreenState();
}

class _BandOnboardingScreenState extends ConsumerState<BandOnboardingScreen> {
  int _step = 1; // 1 = Band Identity (B1), 2 = Roster & Splits (B2-B4)

  late final TextEditingController _founderNameController;
  late final TextEditingController _bandNameController;
  late final TextEditingController _handleController;
  late final TextEditingController _bioController;

  final Set<String> _selectedGenres = {'Rock'};
  String? _bandLogoUrl;

  late final List<BandMemberEntry> _members;

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _founderNameController = TextEditingController();
    _bandNameController = TextEditingController();
    _handleController = TextEditingController();
    _bioController = TextEditingController();

    _members = [
      BandMemberEntry(
        name: 'You (Founder)',
        contact: 'founder@currentuser',
        role: 'BAND_FOUNDER',
        splitBps: 10000,
      ),
    ];
  }

  @override
  void dispose() {
    _founderNameController.dispose();
    _bandNameController.dispose();
    _handleController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  int get _totalSplitBps => _members.fold(0, (sum, m) => sum + m.splitBps);
  bool get _isSplitValid => _totalSplitBps == 10000;

  bool get _isStep1Valid {
    return _founderNameController.text.trim().length >= 2 &&
        _bandNameController.text.trim().length >= 2 &&
        _handleController.text.trim().length >= 3 &&
        _selectedGenres.isNotEmpty;
  }

  void _addMember() {
    if (_members.length >= 8) return;
    setState(() {
      final newShare = 10000 ~/ (_members.length + 1);
      final remainder = 10000 - (newShare * (_members.length + 1));

      for (var i = 0; i < _members.length; i++) {
        _members[i].splitBps = newShare;
      }
      _members.add(
        BandMemberEntry(
          name: 'Member ${_members.length + 1}',
          contact: '',
          role: 'BAND_MEMBER',
          splitBps: newShare + remainder,
        ),
      );
    });
  }

  void _removeMember(int index) {
    if (_members.length <= 1 || index == 0) return; // Cannot remove founder
    setState(() {
      final removed = _members.removeAt(index);
      _members[0].splitBps += removed.splitBps;
    });
  }

  Future<void> _submitBandProfile() async {
    if (!_isSplitValid) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final founderName = _founderNameController.text.trim();
    final bandName = _bandNameController.text.trim();
    final handle = _handleController.text.trim().toLowerCase();

    _members[0].name = founderName;

    await completeOnboarding(
      ref: ref,
      context: context,
      personaType: 'band_member',
      displayName: founderName,
      profileData: {
        'bandName': bandName,
        'handle': handle,
        'bio': _bioController.text.trim(),
        'genres': _selectedGenres.toList(),
        'logoUrl': _bandLogoUrl,
        'bandRole': 'BAND_FOUNDER',
        'roster': _members
            .map((m) => {
                  'name': m.name,
                  'contact': m.contact,
                  'role': m.role,
                  'splitBps': m.splitBps,
                })
            .toList(),
        'techFeeRateBps': 600, // 6.00%
      },
      onError: (err) {
        if (mounted) {
          setState(() {
            _errorMessage = err;
            _isLoading = false;
          });
        }
      },
    );

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.darkCanvas,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: _step == 1 ? _buildStep1Identity() : _buildStep2Roster(),
              ),
            ),
            _buildBottomActionBar(),
          ],
        ),
      ),
    );
  }

  // ─── Step 1: Band Identity (B1) ─────────────────────────────────────────────

  Widget _buildStep1Identity() {
    final bandName = _bandNameController.text.trim();
    final handle = _handleController.text.trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProgressHeader(
          currentStep: 1,
          totalSteps: 2,
          stepName: 'STEP 1 OF 2',
          title: 'Band identity & leadership',
          subtitle: 'Create your band profile. As the creator, you will be assigned Band Founder.',
          accentColor: CbColors.communityBlue,
          onBack: () => context.pop(),
        ),

        // Logo Picker
        ProfilePhotoPicker(
          photoUrl: _bandLogoUrl,
          name: bandName.isNotEmpty ? bandName : 'Band Name',
          accentColor: CbColors.communityBlue,
          onTapUpload: () {
            setState(() {
              _bandLogoUrl = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=80';
            });
          },
          onTapRemove: _bandLogoUrl != null
              ? () => setState(() => _bandLogoUrl = null)
              : null,
        ),
        const SizedBox(height: 24),

        // Founder Personal Name
        const Text(
          'Your Name (as Band Founder) *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _founderNameController,
          style: const TextStyle(color: Colors.white),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: 'Your Name (as Band Founder) *',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            hintText: 'e.g. Jordan Scott',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: CbColors.darkCard,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.communityBlue, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // Band Name
        const Text(
          'Band / Ensemble Name *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _bandNameController,
          style: const TextStyle(color: Colors.white),
          onChanged: (val) {
            if (_handleController.text.isEmpty || _handleController.text == val.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toLowerCase()) {
              _handleController.text = val.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toLowerCase();
            }
            setState(() {});
          },
          decoration: InputDecoration(
            labelText: 'Band / Ensemble Name *',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            hintText: 'e.g. Red River Brass, The Night Owls',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: CbColors.darkCard,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.communityBlue, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // Band Slug
        const Text(
          'Band Handle / QR Slug *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _handleController,
          style: const TextStyle(color: Colors.white),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: 'Band Handle / QR Slug *',
            labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
            prefixText: 'crowdbeats.app/band/',
            prefixStyle: const TextStyle(color: Color(0xFF60A5FA), fontWeight: FontWeight.w600),
            hintText: 'redriverbrass',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: CbColors.darkCard,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF2B2D44)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: CbColors.communityBlue, width: 2),
            ),
          ),
        ),
        InlineValidation(
          state: handle.length >= 3 ? 'valid' : 'checking',
          message: handle.length >= 3
              ? 'Valid for unified band stage QR code'
              : 'Must be at least 3 characters',
        ),
        const SizedBox(height: 18),

        // Primary Genres
        const Text(
          'Primary Genres (Pick 1 to 3) *',
          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _bandGenres.map((g) {
            final isSel = _selectedGenres.contains(g);
            return GenreChip(
              label: g,
              isSelected: isSel,
              accentColor: CbColors.communityBlue,
              onTap: () {
                setState(() {
                  if (isSel) {
                    if (_selectedGenres.length > 1) _selectedGenres.remove(g);
                  } else if (_selectedGenres.length < 3) {
                    _selectedGenres.add(g);
                  }
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  // ─── Step 2: Member Roster & Split Matrix (B2-B4) ───────────────────────────

  Widget _buildStep2Roster() {
    final totalBps = _totalSplitBps;
    final totalPct = (totalBps / 100.0).toStringAsFixed(2);
    final isValid = _isSplitValid;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProgressHeader(
          currentStep: 2,
          totalSteps: 2,
          stepName: 'STEP 2 OF 2',
          title: 'Member roster & tip splits',
          subtitle: 'Set up your band roster and configure automatic tip distribution percentages.',
          accentColor: CbColors.communityBlue,
          onBack: () => setState(() => _step = 1),
        ),

        // Split Summary Banner
        Semantics(
          liveRegion: true,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isValid
                  ? const Color(0xFF10B981).withValues(alpha: 0.1)
                  : const Color(0xFFEF4444).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isValid ? const Color(0xFF10B981) : const Color(0xFFF87171),
                width: 1.5,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Split Allocation: $totalPct%',
                      style: TextStyle(
                        color: isValid ? const Color(0xFF10B981) : const Color(0xFFF87171),
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isValid
                          ? '10,000 / 10,000 basis points allocated (100.00%)'
                          : 'Must equal exactly 10,000 basis points ($totalBps / 10,000)',
                      style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                    ),
                  ],
                ),
                Icon(
                  isValid ? Icons.check_circle : Icons.warning_rounded,
                  color: isValid ? const Color(0xFF10B981) : const Color(0xFFF87171),
                  size: 28,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Roster List
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Band Members & Shares',
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
            ),
            TextButton.icon(
              onPressed: _addMember,
              icon: const Icon(Icons.add, size: 16, color: CbColors.communityBlue),
              label: const Text('Add Member', style: TextStyle(color: CbColors.communityBlue, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
        const SizedBox(height: 10),

        ..._members.asMap().entries.map((entry) {
          final idx = entry.key;
          final member = entry.value;
          final isFounder = member.role == 'BAND_FOUNDER';

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: CbColors.darkCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF2B2D44)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          isFounder ? '👑 Founder' : '🎵 Member ${idx + 1}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: CbColors.communityBlue.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            member.role,
                            style: const TextStyle(color: CbColors.communityBlue, fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    if (!isFounder)
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444), size: 18),
                        onPressed: () => _removeMember(idx),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextField(
                        controller: TextEditingController(text: member.name),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        onChanged: (val) => member.name = val,
                        decoration: InputDecoration(
                          labelText: isFounder ? 'Founder Name' : 'Member ${idx + 1} Name',
                          labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          hintText: 'Member Name',
                          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          filled: true,
                          fillColor: const Color(0xFF151722),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: TextEditingController(text: '${(member.splitBps / 100.0).toStringAsFixed(0)}%'),
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                        keyboardType: TextInputType.number,
                        onChanged: (val) {
                          final cleaned = val.replaceAll('%', '').trim();
                          final parsed = int.tryParse(cleaned);
                          if (parsed != null && parsed >= 0 && parsed <= 100) {
                            setState(() {
                              member.splitBps = parsed * 100;
                            });
                          }
                        },
                        decoration: InputDecoration(
                          labelText: 'Split %',
                          labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          hintText: 'Split %',
                          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          filled: true,
                          fillColor: const Color(0xFF151722),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 20),

        // Unverified Member Escrow & Unified QR Explainer (B3/B4)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF151722),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF2B2D44)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Text('🛡️ ', style: TextStyle(fontSize: 14)),
                  Text(
                    'Split Governance & Group Stage QR',
                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                '• Unified Stage QR: Crowdbeats generates a single QR code for the band stage.\n'
                '• Automatic Distribution: Tips are split exactly per the percentages above.\n'
                '• Unverified Members: If a member has not completed Stripe onboarding, their share is safely held in escrow until verification is complete. Tips are never silently absorbed or redirected without approval.\n'
                '• 6.00% Crowdbeats fee applies to each processed payout.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, height: 1.45),
              ),
            ],
          ),
        ),
        if (_errorMessage != null) ...[
          const SizedBox(height: 16),
          InlineValidation(state: 'invalid', message: _errorMessage),
        ],
      ],
    );
  }

  // ─── Bottom Action Bar ──────────────────────────────────────────────────────

  Widget _buildBottomActionBar() {
    if (_step == 1) {
      return StickyActionBar(
        primaryLabel: 'Next: Roster & Tip Splits →',
        onPrimary: () => setState(() => _step = 2),
        primaryDisabled: !_isStep1Valid,
        accentColor: CbColors.communityBlue,
        disclaimer: 'Joining is free. Member invitations can be sent after setup.',
      );
    }

    return StickyActionBar(
      primaryLabel: 'Create Band & Activate Roster →',
      onPrimary: _submitBandProfile,
      primaryLoading: _isLoading,
      primaryDisabled: !_isSplitValid,
      secondaryLabel: 'Back to Identity',
      onSecondary: () => setState(() => _step = 1),
      accentColor: CbColors.communityBlue,
      disclaimer: 'All tip splits must total exactly 100.00% (10,000 bps) before activation.',
    );
  }
}
