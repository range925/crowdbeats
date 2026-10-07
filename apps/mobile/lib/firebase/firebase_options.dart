// Crowdbeats V2 — Firebase Options (Phase 5)
// Manual configuration for emulator-first development.
// Do not run `flutterfire configure` without David's approval — it would
// overwrite the dev config with production values.
//
// Project: crowdbeats-v2-dev (Number: 1026171057644)
// Bundle ID (iOS): com.crowdbeats.app
// App ID (Android): com.crowdbeats.app

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform, kIsWeb;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return web;
    }
  }

  // Web: crowdbeats-v2-dev
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAGfWrftmHbUNtKbPMCQFGsLzEHMCkQVCc',
    appId: '1:1026171057644:web:devplaceholder',
    messagingSenderId: '1026171057644',
    projectId: 'crowdbeats-v2-dev',
    authDomain: 'crowdbeats-v2-dev.firebaseapp.com',
    storageBucket: 'crowdbeats-v2-dev.firebasestorage.app',
  );

  // Android: crowdbeats-v2-dev / com.crowdbeats.app
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAGfWrftmHbUNtKbPMCQFGsLzEHMCkQVCc',
    appId: '1:1026171057644:android:placeholder',
    messagingSenderId: '1026171057644',
    projectId: 'crowdbeats-v2-dev',
    storageBucket: 'crowdbeats-v2-dev.firebasestorage.app',
  );

  // iOS: crowdbeats-v2-dev / com.crowdbeats.app
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAGfWrftmHbUNtKbPMCQFGsLzEHMCkQVCc',
    appId: '1:1026171057644:ios:placeholder',
    messagingSenderId: '1026171057644',
    projectId: 'crowdbeats-v2-dev',
    storageBucket: 'crowdbeats-v2-dev.firebasestorage.app',
    iosClientId: null,
    iosBundleId: 'com.crowdbeats.app',
  );
}
