// Crowdbeats V2 — Guest Account Screen (Phase 1)
//
// Simple, accessible Guest account landing showing:
// - Welcome header
// - "Create account" and "Sign in" buttons
// - Links to Help, Terms of Service, and Privacy Policy
// - App version and legal disclosures

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/cb_colors.dart';
import '../components/cb_button.dart';
import '../components/cb_outline_button.dart';

class GuestAccountScreen extends StatelessWidget {
  const GuestAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: CbColors.primaryGradient,
                  ),
                  child: const Center(
                    child: Icon(Icons.person_outline, color: Colors.white, size: 32),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Join Crowdbeats',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Create an account to tip live performers, follow artists, save favorite sets, and unlock personalized music discovery.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 14,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 28),

              // Create Account Button
              CbButton(
                label: 'Create Account',
                onPressed: () => context.push('/auth'),
              ),
              const SizedBox(height: 12),

              // Sign In Button
              CbOutlineButton(
                label: 'Sign In',
                onPressed: () => context.push('/auth'),
              ),
              const SizedBox(height: 36),

              // Divider
              Divider(color: Colors.white.withValues(alpha: 0.1)),
              const SizedBox(height: 20),

              // Public Information Links
              _buildLegalTile(
                icon: Icons.help_outline,
                title: 'Help & Support Center',
                onTap: () => context.push('/account/support'),
              ),
              _buildLegalTile(
                icon: Icons.description_outlined,
                title: 'Terms of Service',
                onTap: () => context.push('/account/legal'),
              ),
              _buildLegalTile(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: () => context.push('/account/legal'),
              ),
              _buildLegalTile(
                icon: Icons.copyright_outlined,
                title: 'DMCA & Copyright Policy',
                onTap: () => context.push('/account/legal'),
              ),

              const SizedBox(height: 32),
              Center(
                child: Text(
                  'Crowdbeats V2 • Clean-Room Architecture\nAll Rights Reserved © 2026',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.35),
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

  Widget _buildLegalTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Material(
        color: const Color(0xFF151722),
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          leading: Icon(icon, color: CbColors.purpleLight, size: 22),
          title: Text(
            title,
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
          ),
          trailing: const Icon(Icons.chevron_right, color: CbColors.textMuted, size: 20),
          onTap: onTap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}
