// Crowdbeats V2 — Firebase Auth Service (Phase 5)
//
// Wraps firebase_auth with:
// - Emulator connection in debug mode (host 10.0.2.2 for Android emulator,
//   localhost for iOS simulator)
// - Typed error taxonomy matching the web layer
// - No raw passwords logged or stored

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  static const _authEmulatorHost = '127.0.0.1';
  static const _authEmulatorPort = 9099;

  FirebaseAuth get _auth => FirebaseAuth.instance;

  bool _emulatorConnected = false;

  /// Connect to the Auth emulator. Call once from main() in debug mode.
  Future<void> connectEmulator() async {
    if (_emulatorConnected) return;
    await _auth.useAuthEmulator(_authEmulatorHost, _authEmulatorPort);
    _emulatorConnected = true;
    debugPrint('[AuthService] Connected to Auth emulator $_authEmulatorHost:$_authEmulatorPort');
  }

  // ── Stream ─────────────────────────────────────────────────────────────────

  Stream<User?> get authStateChanges {
    try {
      return _auth.authStateChanges();
    } catch (_) {
      return const Stream.empty();
    }
  }

  User? get currentUser {
    try {
      return _auth.currentUser;
    } catch (_) {
      return null;
    }
  }

  // ── Email / Password ───────────────────────────────────────────────────────

  Future<UserCredential> signIn(String email, String password) =>
      _auth.signInWithEmailAndPassword(email: email, password: password);

  Future<UserCredential> register(String email, String password) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    await cred.user?.sendEmailVerification();
    return cred;
  }

  Future<void> resendVerification() async {
    await _auth.currentUser?.sendEmailVerification();
  }

  /// Enumeration-resistant: silently ignores errors.
  Future<void> requestPasswordReset(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (_) {
      // Intentionally swallowed — enumeration resistance
    }
  }

  // ── OAuth Providers (Google & Apple) ───────────────────────────────────────

  Future<UserCredential> signInWithGoogle() async {
    final googleProvider = GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    if (kIsWeb) {
      return _auth.signInWithPopup(googleProvider);
    } else {
      return _auth.signInWithProvider(googleProvider);
    }
  }

  Future<UserCredential> signInWithApple() async {
    final appleProvider = AppleAuthProvider();
    appleProvider.addScope('email');
    appleProvider.addScope('name');
    if (kIsWeb) {
      return _auth.signInWithPopup(appleProvider);
    } else {
      return _auth.signInWithProvider(appleProvider);
    }
  }

  Future<void> signOut() => _auth.signOut();

  Future<void> reloadUser() async {
    await _auth.currentUser?.reload();
  }

  Future<IdTokenResult?> getIdTokenResult({bool forceRefresh = false}) async {
    return _auth.currentUser?.getIdTokenResult(forceRefresh);
  }

  // ── Error mapping ──────────────────────────────────────────────────────────

  /// Maps FirebaseAuthException to user-safe, enumeration-resistant messages.
  static String mapError(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
      case 'invalid-email':
        return 'Incorrect email or password.';
      case 'email-already-in-use':
        return 'An account with this email may already exist. Try signing in.';
      case 'network-request-failed':
        return 'Connection error. Check your internet connection.';
      case 'too-many-requests':
        return 'Too many attempts. Please wait a few minutes.';
      case 'user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'account-exists-with-different-credential':
        return 'An account exists with a different sign-in method.';
      case 'operation-not-allowed':
        return 'This sign-in method is not enabled.';
      case 'weak-password':
        return 'Password must be at least 8 characters.';
      default:
        return 'Sign-in failed. Please try again.';
    }
  }
}
