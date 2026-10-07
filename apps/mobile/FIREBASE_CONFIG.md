## Crowdbeats V2 Mobile — Firebase Configuration Notes
# Phase 2: Project registered. SDK config files handled per policy below.
#
# Firebase App Records (crowdbeats-v2-dev project):
# - Android App ID: 1:1026171057644:android:3dcf32bc45d1ed7dc87cc9
#   Package name: com.crowdbeats.app
# - iOS App ID: 1:1026171057644:ios:0e11f2570cfef3bbc87cc9
#   Bundle ID: com.crowdbeats.app
#
# Policy: google-services.json and GoogleService-Info.plist are NOT committed.
# They are downloaded on-demand with:
#   Android: npx -y firebase-tools@latest apps:sdkconfig ANDROID 1:1026171057644:android:3dcf32bc45d1ed7dc87cc9 --project crowdbeats-v2-dev > android/app/google-services.json
#   iOS:     npx -y firebase-tools@latest apps:sdkconfig IOS 1:1026171057644:ios:0e11f2570cfef3bbc87cc9 --project crowdbeats-v2-dev > ios/GoogleService-Info.plist
#
# Emulator: Flutter debug builds use firebase_options.dart with emulator host overrides.
# Phase 5 will add firebase_options.dart using FlutterFire CLI.
#
# Required packages (added to pubspec.yaml in Phase 5):
#   firebase_core: ^3.x
#   firebase_auth: ^5.x
#   cloud_firestore: ^5.x
#   firebase_storage: ^12.x
#   firebase_app_check: ^0.3.x
#   firebase_messaging: ^15.x (Phase 7+)
