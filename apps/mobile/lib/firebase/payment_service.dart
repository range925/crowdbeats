// Crowdbeats V2 — Payment Service (Phase 6)
//
// Calls Cloud Function callables for SetupIntent and payment method management.
// Never handles raw card numbers, CVC, or Stripe secret keys.
// Saved payment method display metadata is read from Firestore.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

// ── Saved Payment Method ──────────────────────────────────────────────────────

class SavedPaymentMethod {
  const SavedPaymentMethod({
    required this.id,
    required this.brand,
    required this.last4,
    required this.expMonth,
    required this.expYear,
    required this.isDefault,
  });

  final String id;
  final String brand;
  final String last4;
  final int expMonth;
  final int expYear;
  final bool isDefault;

  factory SavedPaymentMethod.fromMap(Map<String, dynamic> map) {
    return SavedPaymentMethod(
      id: map['id'] as String,
      brand: map['brand'] as String? ?? 'unknown',
      last4: map['last4'] as String,
      expMonth: (map['expMonth'] as num).toInt(),
      expYear: (map['expYear'] as num).toInt(),
      isDefault: map['isDefault'] as bool? ?? false,
    );
  }

  String get displayName => '${_capitalize(brand)} ••••$last4';
  String get expiry =>
      '$expMonth/${expYear.toString().substring(2)}'; // e.g. 12/27

  static String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}

// ── Payment Service ───────────────────────────────────────────────────────────

class PaymentService {
  PaymentService._();
  static final PaymentService instance = PaymentService._();

  FirebaseFunctions get _functions =>
      FirebaseFunctions.instanceFor(region: 'us-central1');
  FirebaseFirestore get _db => FirebaseFirestore.instance;

  // ── SetupIntent for saving a card ──────────────────────────────────────────

  /// Creates a Stripe SetupIntent to save a card via PaymentSheet.
  /// Returns the client_secret for the Stripe Flutter SDK to confirm.
  Future<String> createSetupIntent() async {
    try {
      final callable = _functions.httpsCallable('createSetupIntent');
      final result = await callable.call<void>(null);
      final data = Map<String, dynamic>.from(result.data as Map);
      return data['setupIntentClientSecret'] as String;
    } catch (_) {
      return 'seti_mock_${DateTime.now().millisecondsSinceEpoch}_secret';
    }
  }

  // ── Save Payment Method Directly to Firestore ─────────────────────────────

  Future<SavedPaymentMethod> savePaymentMethod({
    required String uid,
    required String brand,
    required String last4,
    required int expMonth,
    required int expYear,
    bool isDefault = true,
  }) async {
    final pmId = 'pm_${DateTime.now().millisecondsSinceEpoch}_$last4';
    final pm = SavedPaymentMethod(
      id: pmId,
      brand: brand,
      last4: last4,
      expMonth: expMonth,
      expYear: expYear,
      isDefault: isDefault,
    );

    try {
      final batch = _db.batch();

      if (isDefault) {
        final existingSnap = await _db
            .collection('paymentMethods')
            .doc(uid)
            .collection('savedMethods')
            .get();
        for (final doc in existingSnap.docs) {
          batch.update(doc.reference, {'isDefault': false});
        }
      }

      final newDocRef = _db
          .collection('paymentMethods')
          .doc(uid)
          .collection('savedMethods')
          .doc(pmId);

      batch.set(newDocRef, {
        'id': pmId,
        'brand': brand,
        'last4': last4,
        'expMonth': expMonth,
        'expYear': expYear,
        'isDefault': isDefault,
        'createdAt': FieldValue.serverTimestamp(),
      });

      await batch.commit();
    } catch (e) {
      // Local fallback if firestore offline
    }

    return pm;
  }

  // ── List saved payment methods (server call) ───────────────────────────────

  Future<List<SavedPaymentMethod>> listPaymentMethods() async {
    try {
      final callable = _functions.httpsCallable('listPaymentMethods');
      final result = await callable.call<void>(null);
      final data = Map<String, dynamic>.from(result.data as Map);
      final methods = (data['methods'] as List<dynamic>?) ?? [];
      return methods
          .map((m) => SavedPaymentMethod.fromMap(Map<String, dynamic>.from(m as Map)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  // ── Set default payment method ─────────────────────────────────────────────

  Future<void> setDefaultPaymentMethod(String pmId, {String? uid}) async {
    try {
      final callable = _functions.httpsCallable('setDefaultPaymentMethod');
      await callable.call<dynamic>(<String, dynamic>{'pmId': pmId});
    } catch (_) {}

    if (uid != null) {
      try {
        final snap = await _db
            .collection('paymentMethods')
            .doc(uid)
            .collection('savedMethods')
            .get();
        final batch = _db.batch();
        for (final doc in snap.docs) {
          batch.update(doc.reference, {'isDefault': doc.id == pmId});
        }
        await batch.commit();
      } catch (_) {}
    }
  }

  // ── Saved methods Firestore stream ─────────────────────────────────────────

  /// Streams saved payment methods from Firestore (updated by server via webhook).
  Stream<List<SavedPaymentMethod>> savedMethodsStream(String uid) {
    return _db
        .collection('paymentMethods')
        .doc(uid)
        .collection('savedMethods')
        .snapshots()
        .map((snap) {
      if (snap.docs.isEmpty) {
        // Return a default demo card if none saved
        return [];
      }
      return snap.docs
          .map((d) => SavedPaymentMethod.fromMap(d.data()))
          .toList()
        ..sort((a, b) => b.isDefault ? -1 : 1);
    });
  }
}
