// Crowdbeats V2 — Auth Screen (Phase 5)
// Login + Register tabs. Enumeration-resistant errors.
// Google/Apple: wired but disabled (emulator limitation).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/auth_state.dart';
import '../../ui/theme/cb_colors.dart';
import '../../ui/theme/cb_spacing.dart';
import '../components/cb_logo.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

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
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: CbSpacing.s8),
            // Logo
            const CbLogo(
              variant: CbLogoVariant.horizontal,
              surface: CbLogoSurface.dark,
              height: 36,
            ),
            const SizedBox(height: CbSpacing.s6),

            // Tabs
            TabBar(
              controller: _tabs,
              tabs: const [Tab(text: 'Sign In'), Tab(text: 'Create Account')],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: const [
                  _LoginForm(),
                  _RegisterForm(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Login Form ─────────────────────────────────────────────────────────────────

class _LoginForm extends ConsumerStatefulWidget {
  const _LoginForm();

  @override
  ConsumerState<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<_LoginForm> {
  final _email    = TextEditingController();
  final _password = TextEditingController();
  bool _loading   = false;
  bool _obscure   = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    ref.read(authNotifierProvider.notifier).clearError();
    await ref.read(authNotifierProvider.notifier).signIn(
      _email.text.trim(),
      _password.text,
    );
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final errorMsg = ref.watch(authStateProvider).errorMessage;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(CbSpacing.s6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (errorMsg != null) ...[
            Container(
              padding: const EdgeInsets.all(CbSpacing.s3),
              decoration: BoxDecoration(
                color: CbColors.statusError.withAlpha(30),
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                border: Border.all(color: CbColors.statusError.withAlpha(80)),
              ),
              child: Text(errorMsg, style: const TextStyle(color: CbColors.statusError, fontSize: 13)),
            ),
            const SizedBox(height: CbSpacing.s4),
          ],
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(labelText: 'Email address'),
          ),
          const SizedBox(height: CbSpacing.s4),
          TextField(
            controller: _password,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Password',
              suffixIcon: IconButton(
                icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
          ),
          const SizedBox(height: CbSpacing.s2),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => context.push('/auth/forgot-password'),
              child: const Text('Forgot password?'),
            ),
          ),
          const SizedBox(height: CbSpacing.s4),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Sign in'),
          ),
          const SizedBox(height: CbSpacing.s6),
          _OAuthButtons(),
        ],
      ),
    );
  }
}

// ── Register Form ──────────────────────────────────────────────────────────────

class _RegisterForm extends ConsumerStatefulWidget {
  const _RegisterForm();

  @override
  ConsumerState<_RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends ConsumerState<_RegisterForm> {
  final _email  = TextEditingController();
  final _pass   = TextEditingController();
  final _pass2  = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _localError;

  @override
  void dispose() { _email.dispose(); _pass.dispose(); _pass2.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() { _loading = true; _localError = null; });
    if (_pass.text != _pass2.text) {
      setState(() { _loading = false; _localError = 'Passwords do not match.'; });
      return;
    }
    if (_pass.text.length < 8) {
      setState(() { _loading = false; _localError = 'Password must be at least 8 characters.'; });
      return;
    }
    ref.read(authNotifierProvider.notifier).clearError();
    await ref.read(authNotifierProvider.notifier).register(_email.text.trim(), _pass.text);
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final authError = ref.watch(authStateProvider).errorMessage;
    final displayErr = _localError ?? authError;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(CbSpacing.s6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (displayErr != null) ...[
            Container(
              padding: const EdgeInsets.all(CbSpacing.s3),
              decoration: BoxDecoration(
                color: CbColors.statusError.withAlpha(30),
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                border: Border.all(color: CbColors.statusError.withAlpha(80)),
              ),
              child: Text(displayErr, style: const TextStyle(color: CbColors.statusError, fontSize: 13)),
            ),
            const SizedBox(height: CbSpacing.s4),
          ],
          TextField(controller: _email, keyboardType: TextInputType.emailAddress, autocorrect: false,
            decoration: const InputDecoration(labelText: 'Email address')),
          const SizedBox(height: CbSpacing.s4),
          TextField(controller: _pass, obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Password',
              helperText: 'Minimum 8 characters',
              suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined), onPressed: () => setState(() => _obscure = !_obscure)),
            )),
          const SizedBox(height: CbSpacing.s4),
          TextField(controller: _pass2, obscureText: _obscure,
            decoration: const InputDecoration(labelText: 'Confirm password')),
          const SizedBox(height: CbSpacing.s4),
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const Text('By creating an account, you agree to our ', style: TextStyle(fontSize: 11, color: CbColors.textTertiary)),
              InkWell(
                onTap: () => context.push('/terms'),
                child: const Text('Terms of Service', style: TextStyle(fontSize: 11, color: CbColors.accentPrimary, decoration: TextDecoration.underline, fontWeight: FontWeight.w600)),
              ),
              const Text(' & ', style: TextStyle(fontSize: 11, color: CbColors.textTertiary)),
              InkWell(
                onTap: () => context.push('/privacy'),
                child: const Text('Privacy Policy', style: TextStyle(fontSize: 11, color: CbColors.accentPrimary, decoration: TextDecoration.underline, fontWeight: FontWeight.w600)),
              ),
              const Text('.', style: TextStyle(fontSize: 11, color: CbColors.textTertiary)),
            ],
          ),
          const SizedBox(height: CbSpacing.s6),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Create account'),
          ),
          const SizedBox(height: CbSpacing.s6),
          _OAuthButtons(),
        ],
      ),
    );
  }
}

// ── OAuth Buttons ─────────────────────────────────────────────────────────────

class _OAuthButtons extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Row(children: [
          Expanded(child: Divider()),
          Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('or', style: TextStyle(color: CbColors.textTertiary, fontSize: 12))),
          Expanded(child: Divider()),
        ]),
        const SizedBox(height: CbSpacing.s4),
        OutlinedButton.icon(
          icon: const Icon(Icons.g_mobiledata, size: 24, color: Color(0xFF4285F4)),
          label: const Text('Continue with Google'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: CbSpacing.s3),
            side: const BorderSide(color: CbColors.borderDefault),
          ),
          onPressed: () {
            ref.read(authNotifierProvider.notifier).clearError();
            ref.read(authNotifierProvider.notifier).signInWithGoogle();
          },
        ),
        const SizedBox(height: CbSpacing.s4),
        const Text(
          'Protected by Firebase Auth & App Check',
          style: TextStyle(fontSize: 11, color: CbColors.textTertiary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: CbSpacing.s3),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 4,
          children: [
            InkWell(
              onTap: () => context.push('/terms'),
              child: const Text('Terms of Service', style: TextStyle(fontSize: 11, color: CbColors.textSecondary, decoration: TextDecoration.underline)),
            ),
            const Text('•', style: TextStyle(fontSize: 11, color: CbColors.textTertiary)),
            InkWell(
              onTap: () => context.push('/privacy'),
              child: const Text('Privacy Policy', style: TextStyle(fontSize: 11, color: CbColors.textSecondary, decoration: TextDecoration.underline)),
            ),
            const Text('•', style: TextStyle(fontSize: 11, color: CbColors.textTertiary)),
            InkWell(
              onTap: () => context.push('/legal'),
              child: const Text('Legal Disclosures', style: TextStyle(fontSize: 11, color: CbColors.textSecondary, decoration: TextDecoration.underline)),
            ),
          ],
        ),
      ],
    );
  }
}
