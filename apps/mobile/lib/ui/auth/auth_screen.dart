// Crowdbeats V2 — Auth Screen (Phase 5)
// Obsidian dark mode, Cupertino/fintech hierarchy, CbSafeScaffold, CbFormField, CbButton.
// Preserves return destination (?from=), prevents duplicate submits, includes guest escape hatch.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../state/auth_state.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';
import '../../ui/theme/cb_theme.dart';
import '../../ui/theme/cb_typography.dart';
import '../components/cb_button.dart';
import '../components/cb_form_field.dart';
import '../components/cb_logo.dart';
import '../components/cb_scaffold.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key, this.returnPath});

  final String? returnPath;

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    String? from = widget.returnPath;
    if (from == null) {
      try {
        from = GoRouterState.of(context).uri.queryParameters['from'];
      } catch (_) {}
    }

    return CbSafeScaffold(
      body: Column(
        children: [
          const SizedBox(height: CbSpacing.s6),
          // Logo
          const CbLogo(
            variant: CbLogoVariant.horizontal,
            surface: CbLogoSurface.auto,
            height: 38,
          ),
          const SizedBox(height: CbSpacing.s2),
          Text(
            'Live Music Patronage & Instant Gigs',
            style: CbTypography.bodyMd(color: ext.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: CbSpacing.s6),

          // Segmented Tabs
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: ext.surfaceRaised,
                borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                border: Border.all(color: ext.borderSubtle),
              ),
              child: TabBar(
                controller: _tabs,
                indicator: BoxDecoration(
                  color: ext.borderFocus.withAlpha(50),
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd - 2),
                  border: Border.all(color: ext.borderFocus),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: ext.textPrimary,
                unselectedLabelColor: ext.textTertiary,
                labelStyle: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
                unselectedLabelStyle: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
                tabs: const [
                  Tab(text: 'Sign In'),
                  Tab(text: 'Create Account'),
                ],
              ),
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                _LoginForm(returnPath: from),
                _RegisterForm(returnPath: from),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Login Form ─────────────────────────────────────────────────────────────────

class _LoginForm extends ConsumerStatefulWidget {
  const _LoginForm({this.returnPath});

  final String? returnPath;

  @override
  ConsumerState<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<_LoginForm> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading) return;
    final emailText = _email.text.trim();
    final passText = _password.text;

    if (emailText.isEmpty || passText.isEmpty) {
      return;
    }

    setState(() => _loading = true);
    ref.read(authNotifierProvider.notifier).clearError();

    await ref.read(authNotifierProvider.notifier).signIn(
      emailText,
      passText,
    );

    if (mounted) {
      final authState = ref.read(authStateProvider);
      if (authState.errorMessage != null) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    final authState = ref.watch(authStateProvider);
    final errorMsg = authState.errorMessage;
    final isBusy = _loading || authState.isLoading;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6, vertical: CbSpacing.s4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (errorMsg != null) ...[
            Container(
              padding: const EdgeInsets.all(CbSpacing.s3),
              decoration: BoxDecoration(
                color: ext.statusError.withAlpha(25),
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                border: Border.all(color: ext.statusError.withAlpha(90)),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline_rounded, size: 18, color: ext.statusError),
                  const SizedBox(width: CbSpacing.s2),
                  Expanded(
                    child: Text(
                      errorMsg,
                      style: GoogleFonts.plusJakartaSans(
                        color: ext.statusError,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: CbSpacing.s4),
          ],
          CbFormField(
            label: 'Email address',
            controller: _email,
            hintText: 'you@example.com',
            leadingIcon: Icon(Icons.email_outlined, size: 20, color: ext.textTertiary),
            keyboardType: TextInputType.emailAddress,
            onChanged: (_) {
              if (errorMsg != null) {
                ref.read(authNotifierProvider.notifier).clearError();
              }
            },
          ),
          const SizedBox(height: CbSpacing.s4),
          CbFormField(
            label: 'Password',
            controller: _password,
            hintText: '••••••••',
            leadingIcon: Icon(Icons.lock_outline, size: 20, color: ext.textTertiary),
            obscureText: _obscure,
            trailing: IconButton(
              icon: Icon(
                _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                size: 20,
                color: ext.textTertiary,
              ),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
          const SizedBox(height: CbSpacing.s2),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                final query = widget.returnPath != null ? '?from=${Uri.encodeComponent(widget.returnPath!)}' : '';
                context.push('/auth/forgot-password$query');
              },
              child: Text(
                'Forgot password?',
                style: GoogleFonts.plusJakartaSans(
                  color: ext.borderFocus,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: CbSpacing.s4),
          CbButton(
            label: 'Sign In',
            fullWidth: true,
            isLoading: isBusy,
            onPressed: isBusy ? null : _submit,
          ),
          const SizedBox(height: CbSpacing.s5),
          _OAuthButtons(isBusy: isBusy),
          const SizedBox(height: CbSpacing.s4),
          // Guest Escape Hatch
          CbButton(
            label: 'Explore as Guest',
            variant: CbButtonVariant.ghost,
            fullWidth: true,
            onPressed: isBusy ? null : () => context.go('/explore'),
          ),
        ],
      ),
    );
  }
}

// ── Register Form ──────────────────────────────────────────────────────────────

class _RegisterForm extends ConsumerStatefulWidget {
  const _RegisterForm({this.returnPath});

  final String? returnPath;

  @override
  ConsumerState<_RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends ConsumerState<_RegisterForm> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  final _pass2 = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _localError;

  @override
  void dispose() {
    _email.dispose();
    _pass.dispose();
    _pass2.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _localError = null;
    });

    final emailText = _email.text.trim();
    final passText = _pass.text;
    final pass2Text = _pass2.text;

    if (emailText.isEmpty || !emailText.contains('@')) {
      setState(() {
        _loading = false;
        _localError = 'Please enter a valid email address.';
      });
      return;
    }

    if (passText.length < 8) {
      setState(() {
        _loading = false;
        _localError = 'Password must be at least 8 characters.';
      });
      return;
    }

    if (passText != pass2Text) {
      setState(() {
        _loading = false;
        _localError = 'Passwords do not match.';
      });
      return;
    }

    ref.read(authNotifierProvider.notifier).clearError();
    await ref.read(authNotifierProvider.notifier).register(emailText, passText);

    if (mounted) {
      final authState = ref.read(authStateProvider);
      if (authState.errorMessage != null) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    final authState = ref.watch(authStateProvider);
    final authError = authState.errorMessage;
    final displayErr = _localError ?? authError;
    final isBusy = _loading || authState.isLoading;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s6, vertical: CbSpacing.s4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (displayErr != null) ...[
            Container(
              padding: const EdgeInsets.all(CbSpacing.s3),
              decoration: BoxDecoration(
                color: ext.statusError.withAlpha(25),
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                border: Border.all(color: ext.statusError.withAlpha(90)),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline_rounded, size: 18, color: ext.statusError),
                  const SizedBox(width: CbSpacing.s2),
                  Expanded(
                    child: Text(
                      displayErr,
                      style: GoogleFonts.plusJakartaSans(
                        color: ext.statusError,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: CbSpacing.s4),
          ],
          CbFormField(
            label: 'Email address',
            controller: _email,
            hintText: 'you@example.com',
            leadingIcon: Icon(Icons.email_outlined, size: 20, color: ext.textTertiary),
            keyboardType: TextInputType.emailAddress,
            onChanged: (_) {
              if (_localError != null) setState(() => _localError = null);
              if (authError != null) ref.read(authNotifierProvider.notifier).clearError();
            },
          ),
          const SizedBox(height: CbSpacing.s4),
          CbFormField(
            label: 'Password',
            controller: _pass,
            hintText: 'At least 8 characters',
            leadingIcon: Icon(Icons.lock_outline, size: 20, color: ext.textTertiary),
            obscureText: _obscure,
            trailing: IconButton(
              icon: Icon(
                _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                size: 20,
                color: ext.textTertiary,
              ),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
            onChanged: (_) {
              if (_localError != null) setState(() => _localError = null);
            },
          ),
          const SizedBox(height: CbSpacing.s4),
          CbFormField(
            label: 'Confirm password',
            controller: _pass2,
            hintText: 'Repeat your password',
            leadingIcon: Icon(Icons.lock_outline, size: 20, color: ext.textTertiary),
            obscureText: _obscure,
            onChanged: (_) {
              if (_localError != null) setState(() => _localError = null);
            },
          ),
          const SizedBox(height: CbSpacing.s4),
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                'By creating an account, you agree to our ',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: ext.textTertiary,
                ),
              ),
              InkWell(
                onTap: () => context.push('/terms'),
                child: Text(
                  'Terms of Service',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: ext.borderFocus,
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                ' & ',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: ext.textTertiary,
                ),
              ),
              InkWell(
                onTap: () => context.push('/privacy'),
                child: Text(
                  'Privacy Policy',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: ext.borderFocus,
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                '.',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: ext.textTertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: CbSpacing.s5),
          CbButton(
            label: 'Create Account',
            fullWidth: true,
            isLoading: isBusy,
            onPressed: isBusy ? null : _submit,
          ),
          const SizedBox(height: CbSpacing.s5),
          _OAuthButtons(isBusy: isBusy),
          const SizedBox(height: CbSpacing.s4),
          // Guest Escape Hatch
          CbButton(
            label: 'Explore as Guest',
            variant: CbButtonVariant.ghost,
            fullWidth: true,
            onPressed: isBusy ? null : () => context.go('/explore'),
          ),
        ],
      ),
    );
  }
}

// ── OAuth Buttons ─────────────────────────────────────────────────────────────

class _OAuthButtons extends ConsumerWidget {
  const _OAuthButtons({required this.isBusy});

  final bool isBusy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: Divider(color: ext.borderSubtle)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s3),
              child: Text(
                'or',
                style: GoogleFonts.plusJakartaSans(
                  color: ext.textTertiary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Expanded(child: Divider(color: ext.borderSubtle)),
          ],
        ),
        const SizedBox(height: CbSpacing.s4),
        OutlinedButton.icon(
          icon: const Icon(Icons.g_mobiledata, size: 26, color: Color(0xFF4285F4)),
          label: Text(
            'Continue with Google',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: ext.textPrimary,
            ),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
            side: BorderSide(color: ext.borderSubtle),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            ),
          ),
          onPressed: isBusy
              ? null
              : () {
                  ref.read(authNotifierProvider.notifier).clearError();
                  ref.read(authNotifierProvider.notifier).signInWithGoogle();
                },
        ),
        const SizedBox(height: CbSpacing.s3),
        Text(
          'Protected by Firebase Auth & App Check',
          style: GoogleFonts.plusJakartaSans(fontSize: 11, color: ext.textTertiary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s2),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 4,
          children: [
            InkWell(
              onTap: () => context.push('/terms'),
              child: Text(
                'Terms of Service',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  color: ext.textSecondary,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            Text('•', style: TextStyle(fontSize: 11, color: ext.textTertiary)),
            InkWell(
              onTap: () => context.push('/privacy'),
              child: Text(
                'Privacy Policy',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  color: ext.textSecondary,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            Text('•', style: TextStyle(fontSize: 11, color: ext.textTertiary)),
            InkWell(
              onTap: () => context.push('/legal'),
              child: Text(
                'Legal Disclosures',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  color: ext.textSecondary,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
