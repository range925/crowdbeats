// Crowdbeats V2 — Phase 7 Social, Relationships, Messaging & Safety Test Suite
//
// Verifies:
// 1. Follow / unfollow toggling with optimistic UI updates and rollback on network failure.
// 2. Two-account messaging gating (active mutual-follow vs message request vs blocked).
// 3. Blocking an entity: confirmation dialog, severing follow edges, rendering blocked notice, and disabling messaging.
// 4. Restricting an entity: isolates thread quietly without read receipts.
// 5. Categorized safety reporting: passing structured violation category and context to Trust & Safety.
// 6. Offline message delivery failure: rendering retry pill and tapping to retry dispatch.

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:crowdbeats_mobile/data/services/social_service.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';
import 'package:crowdbeats_mobile/ui/components/cb_button.dart';
import 'package:crowdbeats_mobile/ui/components/cb_profile_social_actions.dart';
import 'package:crowdbeats_mobile/ui/components/cb_safety_action_sheet.dart';
import 'package:crowdbeats_mobile/ui/fan/social_messaging_screen.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_theme.dart';

final _kTransparentPng = Uint8List.fromList(<int>[
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
]);

class _TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) => _MockHttpClient();
}

class _MockHttpClient implements HttpClient {
  @override
  bool autoUncompress = true;
  @override
  Duration? connectionTimeout;
  @override
  Duration idleTimeout = const Duration(seconds: 15);
  @override
  int? maxConnectionsPerHost;
  @override
  String? userAgent;

  @override
  void addCredentials(Uri url, String realm, HttpClientCredentials credentials) {}
  @override
  void close({bool force = false}) {}

  @override
  Future<HttpClientRequest> getUrl(Uri url) async => _MockHttpClientRequest();
  @override
  Future<HttpClientRequest> openUrl(String method, Uri url) async => _MockHttpClientRequest();

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockHttpClientRequest implements HttpClientRequest {
  @override
  final HttpHeaders headers = _MockHttpHeaders();

  @override
  Future<HttpClientResponse> close() async => _MockHttpClientResponse();

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockHttpHeaders implements HttpHeaders {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockHttpClientResponse extends Stream<List<int>> implements HttpClientResponse {
  @override
  int get statusCode => 200;
  @override
  int get contentLength => _kTransparentPng.length;
  @override
  HttpClientResponseCompressionState get compressionState =>
      HttpClientResponseCompressionState.notCompressed;
  @override
  final HttpHeaders headers = _MockHttpHeaders();

  @override
  StreamSubscription<List<int>> listen(
    void Function(List<int> event)? onData, {
    Function? onError,
    void Function()? onDone,
    bool? cancelOnError,
  }) {
    return Stream<List<int>>.value(_kTransparentPng).listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

/// Fake implementation of [SocialService] recording calls and simulating network states.
class _FakeSocialService extends SocialService {
  bool failFollow = false;
  bool failUnfollow = false;
  bool failBlock = false;
  bool failRestrict = false;
  bool failSubmitReport = false;
  bool failSendMessage = false;

  bool isFollowing = false;
  bool followsViewer = false;
  bool isBlocked = false;
  bool isRestricted = false;
  bool canMessage = true;

  final List<Map<String, dynamic>> followedEntities = [];
  final List<Map<String, dynamic>> unfollowedEntities = [];
  final List<Map<String, dynamic>> blockedEntities = [];
  final List<Map<String, dynamic>> unblockedEntities = [];
  final List<Map<String, dynamic>> restrictedEntities = [];
  final List<Map<String, dynamic>> unreadReports = [];
  final List<Map<String, dynamic>> sentMessages = [];

  List<Map<String, dynamic>> stubConversations = [];
  List<Map<String, dynamic>> stubMessages = [];

  @override
  Future<SocialRelationshipState> getRelationshipState({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    return SocialRelationshipState(
      isFollowing: isFollowing,
      followsViewer: followsViewer,
      canMessage: canMessage,
      isBlocked: isBlocked,
      isRestricted: isRestricted,
    );
  }

  @override
  Future<void> followEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    if (failFollow) throw Exception('Network error during follow');
    isFollowing = true;
    followedEntities.add({'targetId': targetId, 'targetType': targetType});
  }

  @override
  Future<void> unfollowEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    if (failUnfollow) throw Exception('Network error during unfollow');
    isFollowing = false;
    unfollowedEntities.add({'targetId': targetId, 'targetType': targetType});
  }

  @override
  Future<void> blockEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    if (failBlock) throw Exception('Network error during block');
    isBlocked = true;
    isFollowing = false;
    canMessage = false;
    blockedEntities.add({'targetId': targetId, 'targetType': targetType});
  }

  @override
  Future<void> unblockEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    isBlocked = false;
    unblockedEntities.add({'targetId': targetId, 'targetType': targetType});
  }

  @override
  Future<void> restrictEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    if (failRestrict) throw Exception('Network error during restrict');
    isRestricted = true;
    restrictedEntities.add({'targetId': targetId, 'targetType': targetType});
  }

  @override
  Future<void> unrestrictEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    isRestricted = false;
  }

  @override
  Future<void> submitReport({
    required String targetType,
    required String targetId,
    required String violationCategory,
    required String description,
  }) async {
    if (failSubmitReport) throw Exception('Network error submitting report');
    unreadReports.add({
      'targetType': targetType,
      'targetId': targetId,
      'violationCategory': violationCategory,
      'description': description,
    });
  }

  @override
  Future<Map<String, dynamic>> sendMessage({
    required String recipientId,
    required String recipientType,
    required String text,
    String? actingAsBandId,
    String? actingAsArtistId,
    String? idempotencyKey,
  }) async {
    if (failSendMessage) throw Exception('Offline: Connection lost');
    final msg = {
      'id': 'msg_${DateTime.now().millisecondsSinceEpoch}',
      'recipientId': recipientId,
      'recipientType': recipientType,
      'text': text,
      'status': 'sent',
      'createdAt': DateTime.now().toIso8601String(),
    };
    sentMessages.add(msg);
    return {'conversationId': 'conv_100', 'message': msg};
  }

  @override
  Future<Map<String, dynamic>> getConversations({
    String? actingAsBandId,
    String? actingAsArtistId,
    String tab = 'inbox',
    int limit = 20,
  }) async {
    return {
      'conversations': stubConversations,
      'totalUnreadCount': 0,
      'pendingRequestsCount': 0,
    };
  }

  @override
  Future<Map<String, dynamic>> getMessages({
    required String conversationId,
    String? actingAsBandId,
    String? actingAsArtistId,
    int limit = 50,
  }) async {
    return {
      'messages': stubMessages,
    };
  }
}

/// Fake [UserSettingsNotifier] to avoid unmocked Firebase initialization.
class _FakeUserSettingsNotifier extends UserSettingsNotifier {
  _FakeUserSettingsNotifier() : super();

  final List<String> blockedUserIds = [];

  @override
  Future<void> loadSettings() async {}

  @override
  Future<void> blockUser(String targetUid, {String? displayName}) async {
    blockedUserIds.add(targetUid);
    state = state.copyWith(
      blockedUsers: [
        ...state.blockedUsers,
        {'id': targetUid, 'blockedUid': targetUid, 'displayName': displayName ?? 'Blocked User'},
      ],
    );
  }

  @override
  Future<void> unblockUser(String targetUid) async {
    blockedUserIds.remove(targetUid);
    state = state.copyWith(
      blockedUsers: state.blockedUsers.where((u) => u['id'] != targetUid && u['blockedUid'] != targetUid).toList(),
    );
  }
}

Widget _wrapWithScope({
  required Widget child,
  required _FakeSocialService socialService,
  _FakeUserSettingsNotifier? userSettingsNotifier,
  CbAuthState authState = const CbAuthState(status: CbAuthStatus.authenticated),
  bool isDark = true,
  Size size = const Size(390, 844),
}) {
  return ProviderScope(
    overrides: [
      socialServiceProvider.overrideWithValue(socialService),
      authStateProvider.overrideWithValue(authState),
      if (userSettingsNotifier != null)
        userSettingsProvider.overrideWith((ref) => userSettingsNotifier),
    ],
    child: MaterialApp(
      theme: ThemeData.light().copyWith(
        extensions: const [CbThemeExtension.lightDefaults],
      ),
      darkTheme: ThemeData.dark().copyWith(
        extensions: const [CbThemeExtension.defaults],
      ),
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      home: Scaffold(
        body: MediaQuery(
          data: MediaQueryData(
            size: size,
            textScaler: const TextScaler.linear(1.0),
          ),
          child: child,
        ),
      ),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('1. Follow / Unfollow Toggling & Optimistic UI Rollback', () {
    testWidgets('Tapping Follow calls followEntity and updates to Following', (tester) async {
      final fakeSocial = _FakeSocialService()..isFollowing = false;

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const Center(
            child: CbProfileSocialActions(
              targetId: 'artist_1',
              targetType: 'artist',
              targetName: 'Neon Wave',
            ),
          ),
        ),
      );

      // Initially loads state from service
      await tester.pumpAndSettle();

      expect(find.text('Follow'), findsOneWidget);

      // Tap Follow
      await tester.tap(find.text('Follow'));
      await tester.pumpAndSettle();

      expect(fakeSocial.followedEntities.length, equals(1));
      expect(fakeSocial.followedEntities.first['targetId'], equals('artist_1'));
      expect(find.text('Following'), findsOneWidget);
    });

    testWidgets('Network failure on unfollow rolls back optimistic UI to Following with error feedback', (tester) async {
      final fakeSocial = _FakeSocialService()
        ..isFollowing = true
        ..failUnfollow = true;

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const Center(
            child: CbProfileSocialActions(
              targetId: 'artist_1',
              targetType: 'artist',
              targetName: 'Neon Wave',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Following'), findsOneWidget);

      // Tap Following to trigger unfollow
      await tester.tap(find.text('Following'));
      await tester.pumpAndSettle();

      // UI caught error and rolled back to Following
      expect(find.text('Following'), findsOneWidget);
      expect(find.textContaining('Action failed: Exception: Network error during unfollow'), findsOneWidget);
    });
  });

  group('2. Two-Account Messaging Gating & Relationship Status Banners', () {
    testWidgets('Active mutual-follow displays mutual follow banner and enabled input', (tester) async {
      final fakeSocial = _FakeSocialService();
      fakeSocial.stubConversations = [
        {
          'id': 'conv_1',
          'status': 'active',
          'otherParticipant': {
            'id': 'artist_1',
            'type': 'artist',
            'name': 'The Echoes',
          },
          'isBlocked': false,
          'isRestricted': false,
        }
      ];
      fakeSocial.stubMessages = [
        {
          'id': 'msg_1',
          'senderId': 'artist_1',
          'text': 'Soundcheck completed! Set starts at 9.',
          'createdAt': DateTime.now().toIso8601String(),
          'status': 'delivered',
        }
      ];

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const SocialMessagingScreen(
            initialRecipientId: 'artist_1',
            initialRecipientType: 'artist',
            initialRecipientName: 'The Echoes',
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Mutual follow active · End-to-end moderated conversation'), findsOneWidget);
      expect(find.text('Soundcheck completed! Set starts at 9.'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('Blocked recipient renders blocked notice and disables messaging input', (tester) async {
      final fakeSocial = _FakeSocialService();
      fakeSocial.stubConversations = [
        {
          'id': 'conv_blocked',
          'status': 'active',
          'otherParticipant': {
            'id': 'artist_blocked',
            'type': 'artist',
            'name': 'Blocked Band',
          },
          'isBlocked': true,
          'isRestricted': false,
        }
      ];

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const SocialMessagingScreen(
            initialRecipientId: 'artist_blocked',
            initialRecipientType: 'artist',
            initialRecipientName: 'Blocked Band',
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Account is blocked. Messaging is disabled.'), findsOneWidget);

      // Verify tip button is disabled when blocked
      final tipButton = tester.widget<IconButton>(find.widgetWithIcon(IconButton, Icons.attach_money));
      expect(tipButton.onPressed, isNull);
    });

    testWidgets('Message request renders accept and decline options', (tester) async {
      final fakeSocial = _FakeSocialService();
      fakeSocial.stubConversations = [
        {
          'id': 'conv_req',
          'status': 'pending_request',
          'otherParticipant': {
            'id': 'fan_req',
            'type': 'user',
            'name': 'New Fan',
          },
          'isBlocked': false,
          'isRestricted': false,
        }
      ];

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const SocialMessagingScreen(
            initialRecipientId: 'fan_req',
            initialRecipientType: 'user',
            initialRecipientName: 'New Fan',
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('New Fan sent you a message request.'), findsOneWidget);
      expect(find.text('Accept Message'), findsOneWidget);
      expect(find.text('Decline'), findsOneWidget);
    });
  });

  group('3. Blocking Entity: Confirmation Dialog, Severing Edges & UI Update', () {
    testWidgets('Blocking via CbSafetyActionSheet confirms and updates relationship', (tester) async {
      final fakeSocial = _FakeSocialService();
      final fakeSettings = _FakeUserSettingsNotifier();
      bool changedBlocked = false;
      bool changedRestricted = false;

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          userSettingsNotifier: fakeSettings,
          child: CbSafetyActionSheet(
            targetId: 'bad_actor_99',
            targetType: 'user',
            targetName: 'Hostile Account',
            initialIsBlocked: false,
            initialIsRestricted: false,
            onRelationshipChanged: ({required bool isBlocked, required bool isRestricted}) {
              changedBlocked = isBlocked;
              changedRestricted = isRestricted;
            },
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Block tile
      expect(find.text('Block Hostile Account'), findsOneWidget);
      await tester.tap(find.text('Block Hostile Account'));
      await tester.pumpAndSettle();

      // Confirmation dialog should be presented
      expect(find.text('Block Hostile Account?'), findsOneWidget);
      expect(find.text('Block Account'), findsOneWidget);

      // Confirm block
      await tester.tap(find.text('Block Account'));
      await tester.pumpAndSettle();

      expect(fakeSocial.blockedEntities.length, equals(1));
      expect(fakeSocial.blockedEntities.first['targetId'], equals('bad_actor_99'));
      expect(fakeSettings.blockedUserIds, contains('bad_actor_99'));
      expect(changedBlocked, isTrue);
      expect(changedRestricted, isFalse);
    });
  });

  group('4. Restricting Entity: Thread Isolation Without Read Receipts', () {
    testWidgets('Restricting via CbSafetyActionSheet updates state quietly', (tester) async {
      final fakeSocial = _FakeSocialService();
      bool changedRestricted = false;

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: CbSafetyActionSheet(
            targetId: 'quiet_actor_42',
            targetType: 'user',
            targetName: 'Persistent User',
            initialIsBlocked: false,
            initialIsRestricted: false,
            onRelationshipChanged: ({required bool isBlocked, required bool isRestricted}) {
              changedRestricted = isRestricted;
            },
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Restrict tile
      expect(find.text('Restrict Persistent User'), findsOneWidget);
      await tester.tap(find.text('Restrict Persistent User'));
      await tester.pumpAndSettle();

      expect(fakeSocial.restrictedEntities.length, equals(1));
      expect(fakeSocial.restrictedEntities.first['targetId'], equals('quiet_actor_42'));
      expect(changedRestricted, isTrue);
    });

    testWidgets('Restricted conversation renders quiet isolation banner', (tester) async {
      final fakeSocial = _FakeSocialService();
      fakeSocial.stubConversations = [
        {
          'id': 'conv_res',
          'status': 'active',
          'otherParticipant': {
            'id': 'actor_res',
            'type': 'user',
            'name': 'Restricted Person',
          },
          'isBlocked': false,
          'isRestricted': true,
        }
      ];

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const SocialMessagingScreen(
            initialRecipientId: 'actor_res',
            initialRecipientType: 'user',
            initialRecipientName: 'Restricted Person',
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(
        find.text('Restricted Thread: Messages routed quietly without read receipts.'),
        findsOneWidget,
      );
    });
  });

  group('5. Safety Moderation Categorized Reporting', () {
    testWidgets('Categorized report submits structured violation category to Trust & Safety', (tester) async {
      final fakeSocial = _FakeSocialService();

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const CbSafetyActionSheet(
            targetId: 'spammer_1',
            targetType: 'artist',
            targetName: 'Suspicious Performer',
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Report tile to open report form
      expect(find.text('Report Suspicious Performer'), findsOneWidget);
      await tester.tap(find.text('Report Suspicious Performer'));
      await tester.pumpAndSettle();

      // Should be in report form
      expect(find.text('Reason for reporting:'), findsOneWidget);
      expect(find.text('Submit Report'), findsOneWidget);

      // Enter additional context
      await tester.enterText(find.byType(TextField), 'Sending phishing links in public chat.');
      await tester.pumpAndSettle();

      // Submit report
      await tester.tap(find.text('Submit Report'));
      await tester.pumpAndSettle();

      expect(fakeSocial.unreadReports.length, equals(1));
      final report = fakeSocial.unreadReports.first;
      expect(report['targetId'], equals('spammer_1'));
      expect(report['targetType'], equals('artist'));
      expect(report['violationCategory'], equals('harassment')); // Default category
      expect(report['description'], equals('Sending phishing links in public chat.'));
    });
  });

  group('6. Offline Message Failure & Retry Pill Dispatch', () {
    testWidgets('Offline failure renders retry pill; tapping triggers successful retry', (tester) async {
      final fakeSocial = _FakeSocialService()..failSendMessage = true;
      fakeSocial.stubConversations = [
        {
          'id': 'conv_live',
          'status': 'active',
          'otherParticipant': {
            'id': 'artist_live',
            'type': 'artist',
            'name': 'Indie Ensemble',
          },
          'isBlocked': false,
          'isRestricted': false,
        }
      ];

      await tester.pumpWidget(
        _wrapWithScope(
          socialService: fakeSocial,
          child: const SocialMessagingScreen(
            initialRecipientId: 'artist_live',
            initialRecipientType: 'artist',
            initialRecipientName: 'Indie Ensemble',
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Enter message while network is failing
      await tester.enterText(find.byType(TextField), 'Great gig tonight!');
      await tester.pumpAndSettle();

      // Tap send button
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle();

      // Should render the failure retry pill in the message bubble
      expect(find.text('Failed to send · Tap to retry'), findsOneWidget);
      expect(fakeSocial.sentMessages, isEmpty);

      // Restore network connection
      fakeSocial.failSendMessage = false;

      // Tap the retry pill
      await tester.tap(find.text('Failed to send · Tap to retry'));
      await tester.pumpAndSettle();

      // Message is dispatched successfully
      expect(fakeSocial.sentMessages.length, equals(1));
      expect(fakeSocial.sentMessages.first['text'], equals('Great gig tonight!'));
      expect(fakeSocial.sentMessages.first['recipientId'], equals('artist_live'));
      expect(find.text('Failed to send · Tap to retry'), findsNothing);
    });
  });
}
