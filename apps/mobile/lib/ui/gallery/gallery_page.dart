// Crowdbeats V2 — Component Gallery Screen (Phase 4)
// Shows all design system components in a scrollable layout.
// Route: /gallery

import 'package:flutter/material.dart';
import '../components/components.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class GalleryPage extends StatefulWidget {
  const GalleryPage({super.key});

  @override
  State<GalleryPage> createState() => _GalleryPageState();
}

class _GalleryPageState extends State<GalleryPage> {
  int? _selectedAmount;
  int _activeNav = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Component Gallery')),
      body: ListView(
        padding: const EdgeInsets.all(CbSpacing.s4),
        children: [
          _section('Buttons'),
          _row([
            CbButton(label: 'Primary', onPressed: () {}),
            CbButton(label: 'Secondary', variant: CbButtonVariant.secondary, onPressed: () {}),
          ]),
          const SizedBox(height: CbSpacing.s2),
          _row([
            CbButton(label: 'Ghost', variant: CbButtonVariant.ghost, onPressed: () {}),
            CbButton(label: 'Destructive', variant: CbButtonVariant.destructive, onPressed: () {}),
          ]),
          const SizedBox(height: CbSpacing.s2),
          _row([
            CbButton(label: 'Small', size: CbButtonSize.sm, onPressed: () {}),
            CbButton(label: 'Loading', isLoading: true, onPressed: () {}),
            const CbButton(label: 'Disabled'),
          ]),
          CbButton(
            label: 'Full Width',
            fullWidth: true,
            leadingIcon: Icons.add,
            onPressed: () {},
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Inputs'),
          const CbInput(label: 'Username', hint: 'Enter your username'),
          const SizedBox(height: CbSpacing.s3),
          const CbInput(label: 'Email', hint: 'you@example.com', prefixIcon: Icons.email_outlined),
          const SizedBox(height: CbSpacing.s3),
          const CbInput(
            label: 'Amount',
            hint: '0.00',
            errorText: 'Please enter a valid amount',
            prefixIcon: Icons.attach_money,
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Cards'),
          const CbCard(child: Text('Default card content')),
          const SizedBox(height: CbSpacing.s3),
          CbCard(
            onTap: () {},
            semanticLabel: 'Interactive card',
            child: const Text('Interactive card (tap me)'),
          ),
          const SizedBox(height: CbSpacing.s3),
          const CbCard(
            isLive: true,
            child: Text('Live stage card', style: TextStyle(color: CbColors.liveText)),
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Avatars'),
          const Wrap(
            spacing: CbSpacing.s3,
            runSpacing: CbSpacing.s3,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              CbAvatar(semanticLabel: 'User XS', size: CbAvatarSize.xs, initials: 'U'),
              CbAvatar(semanticLabel: 'User SM', size: CbAvatarSize.sm, initials: 'AB'),
              CbAvatar(semanticLabel: 'User MD', initials: 'CB'),
              CbAvatar(semanticLabel: 'User LG', size: CbAvatarSize.lg, initials: 'DJ'),
              CbAvatar(semanticLabel: 'User XL', size: CbAvatarSize.xl, initials: 'VJ'),
              CbAvatar(semanticLabel: 'Live artist', initials: 'LA', isLive: true, size: CbAvatarSize.lg),
            ],
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Status Badges'),
          Wrap(
            spacing: CbSpacing.s2,
            runSpacing: CbSpacing.s2,
            children: CbStatus.values.map((s) =>
              CbStatusBadge(status: s)
            ).toList(),
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Skeleton'),
          const CbSkeleton(height: 20),
          const SizedBox(height: CbSpacing.s2),
          const CbSkeleton(height: 20, width: 200),
          const SizedBox(height: CbSpacing.s2),
          const CbSkeleton(height: 80, borderRadius: CbSpacing.radiusMd),
          const SizedBox(height: CbSpacing.s5),

          _section('Toast / Sheet / Confirmation'),
          _row([
            CbButton(
              label: 'Show Toast',
              variant: CbButtonVariant.secondary,
              onPressed: () => CbToast.show(context, message: 'Tip sent! 🎵', status: CbStatus.success),
            ),
            CbButton(
              label: 'Bottom Sheet',
              variant: CbButtonVariant.ghost,
              onPressed: () => showCbBottomSheet<void>(
                context: context,
                title: 'Sheet Title',
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: CbSpacing.s5),
                  child: Text('Bottom sheet content goes here.'),
                ),
              ),
            ),
          ]),
          const SizedBox(height: CbSpacing.s2),
          CbButton(
            label: 'Confirm Delete',
            variant: CbButtonVariant.destructive,
            onPressed: () async {
              final ok = await showCbConfirmationSheet(
                context: context,
                title: 'Delete Set?',
                message: 'This action cannot be undone.',
                confirmLabel: 'Delete',
                isDestructive: true,
              );
              if (ok == true && context.mounted) {
                CbToast.show(context, message: 'Deleted.', status: CbStatus.error);
              }
            },
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Empty & Error States'),
          const CbEmptyState(
            title: 'No shows yet',
            subtitle: 'Book your first performance to get started.',
          ),
          const SizedBox(height: CbSpacing.s3),
          CbErrorState(
            title: 'Failed to load',
            subtitle: 'Check your connection and try again.',
            onRetry: () {},
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Amount Selector'),
          CbAmountSelector(
            presets: const [100, 200, 500, 1000],
            selectedAmount: _selectedAmount,
            onChanged: (cents) => setState(() => _selectedAmount = cents),
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Progress Bars'),
          const CbProgressBar(value: 0,  semanticLabel: '0% funded'),
          const SizedBox(height: CbSpacing.s3),
          const CbProgressBar(value: 0.35, semanticLabel: '35% funded'),
          const SizedBox(height: CbSpacing.s3),
          const CbProgressBar(value: 0.75, semanticLabel: '75% funded', color: CbColors.statusSuccess),
          const SizedBox(height: CbSpacing.s3),
          const CbProgressBar(value: 1,  semanticLabel: 'Goal reached'),
          const SizedBox(height: CbSpacing.s5),

          _section('Mini Chart'),
          const CbMiniChart(
            values: [40, 80, 60, 95, 70],
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            semanticLabel: 'Weekly tip totals',
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Live Stage Chips'),
          Wrap(
            spacing: CbSpacing.s2,
            runSpacing: CbSpacing.s2,
            children: [
              const CbLiveStageChip(stageName: 'Main Stage', isLive: true),
              const CbLiveStageChip(stageName: 'Side Stage', isLive: false),
              CbLiveStageChip(stageName: 'Acoustic Stage', isLive: true, onTap: () {}),
            ],
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Bottom Navigation Preview'),
          Container(
            decoration: BoxDecoration(
              color:  CbColors.surfaceRaised,
              border: const Border(top: BorderSide(color: CbColors.borderSubtle)),
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            ),
            child: NavigationBar(
              selectedIndex: _activeNav,
              onDestinationSelected: (i) => setState(() => _activeNav = i),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
                NavigationDestination(icon: Icon(Icons.music_note_outlined), selectedIcon: Icon(Icons.music_note), label: 'Shows'),
                NavigationDestination(icon: Icon(Icons.volunteer_activism_outlined), selectedIcon: Icon(Icons.volunteer_activism), label: 'Tip'),
                NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
              ],
            ),
          ),
          const SizedBox(height: CbSpacing.s5),

          _section('Creator Studio Components (Stitch Vivid Resonance)'),
          CbContextSwitcherPill(
            activeContext: const CreatorContextItem(
              id: 'ctx_solo_1',
              name: 'Elena Cruz (Solo)',
              type: 'solo',
              role: 'SOLO_ARTIST',
            ),
            availableContexts: const [
              CreatorContextItem(
                id: 'ctx_solo_1',
                name: 'Elena Cruz (Solo)',
                type: 'solo',
                role: 'SOLO_ARTIST',
              ),
              CreatorContextItem(
                id: 'ctx_band_1',
                name: 'The Midnight Echoes',
                type: 'band',
                role: 'BAND_FOUNDER',
                hasActiveLiveSession: true,
              ),
              CreatorContextItem(
                id: 'ctx_band_2',
                name: 'Pacific Groove',
                type: 'band',
                role: 'BAND_MEMBER',
              ),
            ],
            onSelectContext: (c) {},
          ),
          const SizedBox(height: CbSpacing.s3),
          CbLiveHeroBanner(
            isLive: false,
            onPrimaryAction: () {},
          ),
          const SizedBox(height: CbSpacing.s3),
          CbLiveHeroBanner(
            isLive: true,
            venueName: 'Sunset Lounge (San Diego, CA)',
            listenerCount: 42,
            onPrimaryAction: () {},
            onSecondaryAction: () {},
          ),
          const SizedBox(height: CbSpacing.s3),
          const Row(
            children: [
              Expanded(
                child: CbMetricCard(
                  title: 'AVAILABLE BALANCE',
                  value: r'$480.00',
                  timeframe: 'Ready for payout',
                  definition: 'Total settled funds available for instant withdrawal to your verified Stripe bank account.',
                  icon: Icons.account_balance_wallet,
                  accentColor: CbColors.purpleLight,
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: CbMetricCard(
                  title: 'TODAY\'S TIPS',
                  value: r'$125.00',
                  timeframe: 'Tonight',
                  definition: 'Gross tips received across active stage performances today.',
                  icon: Icons.volunteer_activism,
                  accentColor: CbColors.tealGas,
                ),
              ),
            ],
          ),
          const SizedBox(height: CbSpacing.s16),
        ],
      ),
    );
  }

  Widget _section(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: CbSpacing.s3, top: CbSpacing.s2),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize:      11,
          fontWeight:    FontWeight.w700,
          letterSpacing: 0.08,
          color:         CbColors.textTertiary,
        ),
      ),
    );
  }

  Widget _row(List<Widget> children) {
    return Wrap(
      spacing: CbSpacing.s2,
      runSpacing: CbSpacing.s2,
      children: children,
    );
  }
}
