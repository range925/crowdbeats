// Crowdbeats V2 — Band Split Contract Editor & Simulator (Phase 7)
// Mathematical 100% total sum validation, custom split presets & live tip simulator.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';
import 'band_split_voting_modal.dart';

class BandSplitEditorScreen extends StatefulWidget {
  const BandSplitEditorScreen({super.key});

  @override
  State<BandSplitEditorScreen> createState() => _BandSplitEditorScreenState();
}

class _BandSplitEditorScreenState extends State<BandSplitEditorScreen> {
  int _davidSplit = 40;
  int _marcusSplit = 30;
  int _aliciaSplit = 30;
  int _simulatedTipDollars = 100;

  int get _totalSplit => _davidSplit + _marcusSplit + _aliciaSplit;
  bool get _isValid100 => _totalSplit == 100;

  void _applyEqualPreset() {
    setState(() {
      _davidSplit = 34;
      _marcusSplit = 33;
      _aliciaSplit = 33;
    });
  }

  void _applyFounderPreset() {
    setState(() {
      _davidSplit = 50;
      _marcusSplit = 25;
      _aliciaSplit = 25;
    });
  }

  void _applyStandardPreset() {
    setState(() {
      _davidSplit = 40;
      _marcusSplit = 30;
      _aliciaSplit = 30;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Band Split Contract', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 100% Invariant Validation Banner
          CbGlassCard(
            padding: const EdgeInsets.all(14),
            backgroundColor: _isValid100 ? const Color(0x2210B981) : const Color(0x22EF4444),
            borderColor: _isValid100 ? const Color(0x6610B981) : const Color(0x66EF4444),
            child: Row(
              children: [
                Icon(_isValid100 ? Icons.check_circle : Icons.error_outline, color: _isValid100 ? CbColors.statusLive : CbColors.statusError, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isValid100 ? 'Mathematical Invariant Satisfied: 100%' : 'Total Split Must Equal 100% (Current: $_totalSplit%)',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Text(
                        _isValid100 ? 'All tips and stage earnings will distribute automatically.' : 'Adjust member percentage sliders until total sum equals 100%.',
                        style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Split Presets
          const Text('SPLIT PRESETS', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24)),
                  onPressed: _applyStandardPreset,
                  child: const Text('Standard (40/30/30)', style: TextStyle(color: Colors.white, fontSize: 11)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24)),
                  onPressed: _applyEqualPreset,
                  child: const Text('Equal Split', style: TextStyle(color: Colors.white, fontSize: 11)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24)),
                  onPressed: _applyFounderPreset,
                  child: const Text('Founder 50%', style: TextStyle(color: Colors.white, fontSize: 11)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Member Percentage Sliders
          const Text('MEMBER PERCENTAGE ALLOCATION', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          _buildMemberSlider('David Naufahu (Founder)', _davidSplit, (val) => setState(() => _davidSplit = val)),
          _buildMemberSlider('Marcus Turner (Bass)', _marcusSplit, (val) => setState(() => _marcusSplit = val)),
          _buildMemberSlider('Alicia Vance (Drums)', _aliciaSplit, (val) => setState(() => _aliciaSplit = val)),
          const SizedBox(height: 20),

          // Live Tip Mathematical Simulator
          const Text('LIVE TIP DISTRIBUTION SIMULATOR', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          CbGlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Sample Show Tip Total:', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    DropdownButton<int>(
                      value: _simulatedTipDollars,
                      dropdownColor: CbColors.surfaceBase,
                      style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 14),
                      items: const [
                        DropdownMenuItem(value: 50, child: Text(r'$50.00 Tip')),
                        DropdownMenuItem(value: 100, child: Text(r'$100.00 Tip')),
                        DropdownMenuItem(value: 500, child: Text(r'$500.00 Gig')),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _simulatedTipDollars = v);
                      },
                    ),
                  ],
                ),
                const Divider(color: Colors.white12, height: 16),
                _simRow('David Naufahu ($_davidSplit%):', (_simulatedTipDollars * _davidSplit / 100.0).toStringAsFixed(2)),
                _simRow('Marcus Turner ($_marcusSplit%):', (_simulatedTipDollars * _marcusSplit / 100.0).toStringAsFixed(2)),
                _simRow('Alicia Vance ($_aliciaSplit%):', (_simulatedTipDollars * _aliciaSplit / 100.0).toStringAsFixed(2)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Submit Proposal Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _isValid100 ? CbColors.purpleMain : Colors.white24,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
              ),
              onPressed: _isValid100
                  ? () {
                      BandSplitVotingModal.show(context);
                    }
                  : null,
              child: const Text('Submit Split Proposal for Voting', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMemberSlider(String name, int currentVal, ValueChanged<int> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: CbGlassCard(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                Text('$currentVal%', style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.w900, fontSize: 15)),
              ],
            ),
            Slider(
              value: currentVal.toDouble(),
              min: 0,
              max: 100,
              divisions: 100,
              activeColor: CbColors.tealGas,
              inactiveColor: Colors.white12,
              onChanged: (v) => onChanged(v.toInt()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _simRow(String label, String amountDollars) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
          Text('\$$amountDollars', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }
}
