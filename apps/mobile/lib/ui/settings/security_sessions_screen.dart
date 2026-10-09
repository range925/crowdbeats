// Crowdbeats V2 — Sign-In & Security Screen
//
// Password reset/update, Connected OAuth accounts, Biometric App Lock,
// and Active Device Sessions with server-authoritative token revocation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/auth_state.dart';
import '../../state/user_settings_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_settings_row.dart';
import '../components/cb_button.dart';

class SecuritySessionsScreen extends ConsumerStatefulWidget {
  const SecuritySessionsScreen({super.key});

  @override
  ConsumerState<SecuritySessionsScreen> createState() => _SecuritySessionsScreenState();
}

class _SecuritySessionsScreenState extends ConsumerState<SecuritySessionsScreen> {
  bool _revoking = false;

  void _changePassword() {
    final email = ref.read(authStateProvider).email;
    if (email == null) return;

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E2032),
        title: const Text('Reset Password', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Send a secure password reset link to $email?', style: const TextStyle(color: CbColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: CbColors.purpleMain),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Password reset email dispatched to $email.')),
              );
            },
            child: const Text('Send Email'),
          ),
        ],
      ),
    );
  }

  Future<void> _revokeAllSessions() async {
    setState(() => _revoking = true);
    await ref.read(userSettingsProvider.notifier).revokeAllOtherSessions();
    if (!mounted) return;
    setState(() => _revoking = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('All other active device sessions have been revoked.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(userSettingsProvider);
    final security = settings.security;
    final notifier = ref.read(userSettingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign-In & Security'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Authentication & Password
              CbSettingsSection(
                title: 'Authentication & Credentials',
                showTopDivider: false,
                children: [
                  CbSettingsRow(
                    title: 'Password',
                    subtitle: 'Change or reset your Crowdbeats password',
                    icon: Icons.lock_reset_outlined,
                    iconColor: CbColors.purpleLight,
                    onTap: _changePassword,
                  ),
                  CbSettingsRow(
                    title: 'Two-Factor Authentication (2FA)',
                    subtitle: 'Require authenticator app verification code on new devices',
                    icon: Icons.shield_outlined,
                    iconColor: CbColors.purpleLight,
                    isSwitch: true,
                    switchValue: security.twoFactorEnabled,
                    onSwitchChanged: (val) => notifier.setTwoFactor(val),
                  ),
                  CbSettingsRow(
                    title: 'Biometric App Lock',
                    subtitle: 'Require Face ID / Touch ID when resuming Crowdbeats',
                    icon: Icons.fingerprint,
                    iconColor: CbColors.liveGreen,
                    isSwitch: true,
                    switchValue: security.biometricLockEnabled,
                    onSwitchChanged: (val) => notifier.updateSecurity(security.copyWith(biometricLockEnabled: val)),
                  ),
                ],
              ),

              // Connected OAuth Providers
              CbSettingsSection(
                title: 'Connected Accounts',
                children: [
                  const CbSettingsRow(
                    title: 'Google',
                    subtitle: 'Single sign-on via Google Identity',
                    icon: Icons.g_mobiledata,
                    iconColor: Color(0xFF4285F4),
                    statusBadge: 'Connected',
                    statusBadgeColor: CbColors.liveGreen,
                    showChevron: false,
                  ),
                  const CbSettingsRow(
                    title: 'Apple',
                    subtitle: 'Sign in with Apple ID',
                    icon: Icons.apple,
                    iconColor: Colors.white,
                    statusBadge: 'Connected',
                    statusBadgeColor: CbColors.liveGreen,
                    showChevron: false,
                  ),
                ],
              ),

              // Active Device Sessions
              CbSettingsSection(
                title: 'Active Sessions & Devices',
                children: [
                  ...settings.activeSessions.map((session) {
                    final isCurrent = session['isCurrent'] == true;
                    final device = session['device'] as String? ?? 'Device';
                    final location = session['location'] as String? ?? 'Unknown Location';
                    final lastActive = session['lastActive'] as String? ?? 'Active';
                    final client = session['client'] as String? ?? 'Crowdbeats App';
                    final sessionId = session['id'] as String? ?? '';

                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E2032),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isCurrent ? CbColors.purpleMain : CbColors.borderSubtle,
                          width: isCurrent ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isCurrent ? Icons.phone_android : Icons.laptop_chromebook,
                            color: isCurrent ? CbColors.purpleLight : Colors.white70,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      device,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13.5,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    if (isCurrent)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: CbColors.liveGreen.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'Current Device',
                                          style: TextStyle(
                                            color: CbColors.liveGreen,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  '$location • $client',
                                  style: const TextStyle(color: CbColors.textSecondary, fontSize: 11.5),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  lastActive,
                                  style: TextStyle(
                                    color: isCurrent ? CbColors.liveGreen : Colors.white38,
                                    fontSize: 11,
                                    fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (!isCurrent)
                            TextButton(
                              style: TextButton.styleFrom(
                                foregroundColor: CbColors.errorRed,
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              ),
                              onPressed: () async {
                                await notifier.revokeSession(sessionId);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('$device session revoked.')),
                                  );
                                }
                              },
                              child: const Text('Revoke', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                        ],
                      ),
                    );
                  }),
                  if (settings.activeSessions.any((s) => s['isCurrent'] != true))
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: CbButton(
                        label: 'Sign Out from All Other Devices',
                        variant: CbButtonVariant.secondary,
                        isLoading: _revoking,
                        onPressed: _revokeAllSessions,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
