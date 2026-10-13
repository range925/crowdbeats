// Crowdbeats V2 — Guest Account Screen (Phase 6 Redesign Compliant)
//
// Simple, accessible Guest account landing showing:
// - Welcome header with obsidian surface and Electric Purple accent
// - "Create account" and "Sign in" buttons with ?from=/fan return resumption
// - Grouped hairline-divided card for Help, Terms of Service, and Privacy Policy (Uber/Lyft reference)
// - Clean legal disclosures and DM Sans typography

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/cb_colors.dart';
import '../components/cb_button.dart';
import '../components/cb_outline_button.dart';
import '../components/cb_grouped_card.dart';
import '../components/cb_settings_row.dart';

class GuestAccountScreen extends StatelessWidget {
  const GuestAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Center(
                child: Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: CbColors.surfaceContainerHigh,
                    border: Border.all(color: CbColors.outline, width: 1.5),
                  ),
                  child: const Center(
                    child: Icon(Icons.person_outline_rounded, color: CbColors.primary, size: 32),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'Join Crowdbeats',
                textAlign: TextAlign.center,
                style: GoogleFonts.dmSans(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Create an account to tip live performers, follow artists, save favorite sets, and unlock personalized music discovery.',
                textAlign: TextAlign.center,
                style: GoogleFonts.dmSans(
                  color: CbColors.onSurfaceVariant,
                  fontSize: 14,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 28),

              // Create Account Button (Primary dominant CTA)
              CbButton(
                label: 'Create Account',
                onPressed: () => context.push('/auth?mode=signup&from=/fan'),
              ),
              const SizedBox(height: 12),

              // Sign In Button
              CbOutlineButton(
                label: 'Sign In',
                onPressed: () => context.push('/auth?from=/fan'),
              ),
              const SizedBox(height: 32),

              // Grouped Legal & Information Links (Uber/Lyft grouped card pattern)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                child: Text(
                  'SUPPORT & POLICIES',
                  style: GoogleFonts.dmSans(
                    color: CbColors.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              CbGroupedCard.divided(
                backgroundColor: CbColors.surfaceContainer,
                borderColor: CbColors.outline,
                children: [
                  CbSettingsRow(
                    icon: Icons.help_outline_rounded,
                    title: 'Help & Support Center',
                    subtitle: 'FAQs, ticketing, and live stage assistance',
                    onTap: () => context.push('/account/support'),
                  ),
                  CbSettingsRow(
                    icon: Icons.description_outlined,
                    title: 'Terms of Service',
                    subtitle: 'Effective August 25, 2026',
                    onTap: () => context.push('/account/legal'),
                  ),
                  CbSettingsRow(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Privacy Policy',
                    subtitle: 'Data protections and rights',
                    onTap: () => context.push('/account/legal'),
                  ),
                  CbSettingsRow(
                    icon: Icons.copyright_outlined,
                    title: 'DMCA & Copyright Policy',
                    subtitle: 'Intellectual property and reporting',
                    onTap: () => context.push('/account/legal'),
                  ),
                ],
              ),

              const SizedBox(height: 32),
              Center(
                child: Text(
                  'Crowdbeats V2 • Clean-Room Architecture\nAll Rights Reserved © 2026',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    color: CbColors.textMuted,
                    fontSize: 12,
                    height: 1.5,
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
