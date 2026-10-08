// Crowdbeats V2 — Auth State (Riverpod) — Phase 5 (complete)
//
// Provides: authStateProvider, authNotifierProvider, CbAuthStatus
// All screens read from these providers — never from Firebase directly.
//
// Auth state machine:
// loading → unauthenticated | unverified | unonboarded | suspended |
//           expired | revoked | deleted | authenticated

import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../firebase/auth_service.dart';
import '../firebase/firestore_service.dart';

// ── Status ─────────────────────────────────────────────────────────────────────

enum CbAuthStatus {
  loading,
  unauthenticated,
  unverified,     // signed in, email not verified
  unonboarded,    // verified, no personaType yet
  suspended,      // suspendedAt set in Firestore
  deleted,        // account was deleted — force sign-out
  expired,        // token could not be refreshed
  revoked,        // admin revoked session — force sign-out
  authenticated,  // fully onboarded
}

// ── State ──────────────────────────────────────────────────────────────────────

class CbAuthState {
  const CbAuthState({
    this.status = CbAuthStatus.loading,
    this.user,
    this.personaType,
    this.errorMessage,
  });

  final CbAuthStatus status;
  final User? user;
  final String? personaType;
  final String? errorMessage;

  String? get uid => user?.uid;
  String? get email => user?.email;
  String? get displayName => user?.displayName;
  bool get isAuthenticated => status == CbAuthStatus.authenticated;

  CbAuthState copyWith({
    CbAuthStatus? status,
    User? user,
    String? personaType,
    Object? errorMessage = _sentinel,
  }) => CbAuthState(
    status:       status ?? this.status,
    user:         user ?? this.user,
    personaType:  personaType ?? this.personaType,
    errorMessage: errorMessage == _sentinel ? this.errorMessage : errorMessage as String?,
  );
}

const _sentinel = Object();

// ── Notifier ───────────────────────────────────────────────────────────────────

class CbAuthNotifier extends AsyncNotifier<CbAuthState> {
  Timer? _tokenProbe;

  @override
  Future<CbAuthState> build() async {
    // Subscribe to Firebase auth stream
    ref.listen(
      _authStreamProvider,
      (_, next) async {
        if (next.hasValue) {
          final newState = await _resolveAuthState(next.value);
          state = AsyncData(newState);
          // Start or stop probe based on auth state
          if (newState.status == CbAuthStatus.authenticated) {
            _startTokenProbe();
          } else {
            _stopTokenProbe();
          }
        }
      },
    );

    ref.onDispose(_stopTokenProbe);

    final user = AuthService.instance.currentUser;
    final resolved = await _resolveAuthState(user);
    if (resolved.status == CbAuthStatus.authenticated) _startTokenProbe();
    return resolved;
  }

  // ── Token probe ─────────────────────────────────────────────────────────────
  // Firebase SDK auto-refreshes tokens, but revocation requires an active check.

  void _startTokenProbe() {
    _tokenProbe?.cancel();
    _tokenProbe = Timer.periodic(const Duration(minutes: 10), (_) async {
      await _probeToken();
    });
  }

  void _stopTokenProbe() {
    _tokenProbe?.cancel();
    _tokenProbe = null;
  }

  Future<void> _probeToken() async {
    try {
      final result = await AuthService.instance.getIdTokenResult(forceRefresh: true);
      if (result == null) {
        _stopTokenProbe();
        state = const AsyncData(CbAuthState(
          status: CbAuthStatus.unauthenticated,
          errorMessage: 'Session ended. Please sign in again.',
        ));
      }
    } on FirebaseAuthException catch (e) {
      _stopTokenProbe();
      final isRevoked = e.code == 'user-token-revoked' || e.code == 'id-token-revoked';
      state = AsyncData(CbAuthState(
        status: isRevoked ? CbAuthStatus.revoked : CbAuthStatus.expired,
        errorMessage: isRevoked
          ? 'Your session has been revoked. Please sign in again.'
          : 'Your session has expired. Please sign in again.',
      ));
      await AuthService.instance.signOut();
    }
  }

  // ── Auth state resolution ──────────────────────────────────────────────────

  Future<CbAuthState> _resolveAuthState(User? user) async {
    if (user == null) {
      return const CbAuthState(status: CbAuthStatus.unauthenticated);
    }

    try {
      final record = await FirestoreService.instance.getUserRecord(user.uid);

      if (record?['deletedAt'] != null) {
        await AuthService.instance.signOut();
        return const CbAuthState(
          status: CbAuthStatus.deleted,
          errorMessage: 'This account has been removed.',
        );
      }

      if (record?['suspendedAt'] != null) {
        return CbAuthState(status: CbAuthStatus.suspended, user: user);
      }

      final personaType = record?['personaType'] as String?;
      return CbAuthState(
        status:      personaType != null ? CbAuthStatus.authenticated : CbAuthStatus.unonboarded,
        user:        user,
        personaType: personaType,
      );
    } catch (_) {
      // Firestore unavailable — optimistic fallback
      return CbAuthState(
        status:      CbAuthStatus.authenticated,
        user:        user,
      );
    }
  }

  // ── Auth operations ────────────────────────────────────────────────────────

  Future<void> signIn(String email, String password) async {
    state = const AsyncLoading();
    try {
      await AuthService.instance.signIn(email, password);
      // authStateChanges will update state automatically
    } on FirebaseAuthException catch (e) {
      state = AsyncData(CbAuthState(
        status:       CbAuthStatus.unauthenticated,
        errorMessage: AuthService.mapError(e),
      ));
    }
  }

  Future<void> register(String email, String password) async {
    state = const AsyncLoading();
    try {
      await AuthService.instance.register(email, password);
      // Will go to unverified after authStateChanges
    } on FirebaseAuthException catch (e) {
      state = AsyncData(CbAuthState(
        status:       CbAuthStatus.unauthenticated,
        errorMessage: AuthService.mapError(e),
      ));
    }
  }

  Future<void> signInWithGoogle() async {
    state = const AsyncLoading();
    try {
      await AuthService.instance.signInWithGoogle();
    } on FirebaseAuthException catch (e) {
      state = AsyncData(CbAuthState(
        status:       CbAuthStatus.unauthenticated,
        errorMessage: AuthService.mapError(e),
      ));
    } catch (_) {
      state = const AsyncData(CbAuthState(
        status:       CbAuthStatus.unauthenticated,
        errorMessage: 'Google sign-in was cancelled or failed.',
      ));
    }
  }

  Future<void> signInWithApple() async {
    state = const AsyncLoading();
    try {
      await AuthService.instance.signInWithApple();
    } on FirebaseAuthException catch (e) {
      state = AsyncData(CbAuthState(
        status:       CbAuthStatus.unauthenticated,
        errorMessage: AuthService.mapError(e),
      ));
    } catch (_) {
      state = const AsyncData(CbAuthState(
        status:       CbAuthStatus.unauthenticated,
        errorMessage: 'Apple sign-in was cancelled or failed.',
      ));
    }
  }

  Future<void> signOut() async {
    _stopTokenProbe();
    await AuthService.instance.signOut();
    state = const AsyncData(CbAuthState(status: CbAuthStatus.unauthenticated));
  }

  Future<void> reloadUser() async {
    await AuthService.instance.reloadUser();
  }

  /// Request account deletion.
  /// Phase 5: signs out; Firestore soft-delete and GDPR cascade in Phase 7.
  Future<void> requestAccountDeletion() async {
    _stopTokenProbe();
    // TODO Phase 7: call requestAccountDeletion Cloud Function for GDPR cascade
    await AuthService.instance.signOut();
    state = const AsyncData(CbAuthState(status: CbAuthStatus.unauthenticated));
  }

  void clearError() {
    final current = state.valueOrNull;
    if (current != null) {
      state = AsyncData(current.copyWith(errorMessage: null));
    }
  }
}

// ── Providers ──────────────────────────────────────────────────────────────────

final _authStreamProvider = StreamProvider<User?>((ref) {
  return AuthService.instance.authStateChanges;
});

final authNotifierProvider = AsyncNotifierProvider<CbAuthNotifier, CbAuthState>(
  CbAuthNotifier.new,
);

/// Convenience shortcut: just the CbAuthState value (with loading default)
final authStateProvider = Provider<CbAuthState>((ref) {
  return ref.watch(authNotifierProvider).valueOrNull ??
      const CbAuthState(status: CbAuthStatus.loading);
});
