// Crowdbeats V2 — LocationProvider Riverpod State
//
// Provides a single LocationProvider instance to the entire widget tree.
//
// In tests, override locationProviderProvider with a MockLocationProvider:
//
//   ProviderScope(
//     overrides: [
//       locationProviderProvider.overrideWithValue(MockLocationProvider()),
//     ],
//     child: ...,
//   )
//
// In production, GeolocatorLocationProvider is used automatically.

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/services/android_fused_location_provider.dart';
import '../data/services/apple_core_location_provider.dart';
import '../data/services/geolocator_location_provider.dart';
import '../data/services/location_provider.dart';

/// Application-wide [LocationProvider] instance.
///
/// Overridable in tests via [ProviderScope.overrides] — no factory class or
/// service locator required.
final locationProviderProvider = Provider<LocationProvider>((ref) {
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    return AndroidFusedLocationProvider();
  }
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
    return AppleCoreLocationProvider();
  }
  return GeolocatorLocationProvider();
});
