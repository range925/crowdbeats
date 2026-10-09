// Crowdbeats V2 — Social Messaging Screen (Phase 8)
//
// Complete 1-to-1 chat with recipient control:
// - Inbox / Requests / Restricted tabs
// - Message request acceptance / decline (7-day cooldown)
// - Quiet restriction mode (no presence, no read receipts)
// - Strong block enforcement
// - Report moderation with evidence snapshotting

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/services/social_service.dart';
import '../../state/auth_state.dart';
import '../../state/tip_state.dart';
import '../components/cb_safety_action_sheet.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'tip/tip_confirmation_sheet.dart';

class SocialMessagingScreen extends ConsumerStatefulWidget {
  const SocialMessagingScreen({
    super.key,
    this.initialRecipientId,
    this.initialRecipientType,
    this.initialRecipientName,
    this.actingAsBandId,
    this.actingAsArtistId,
  });

  final String? initialRecipientId;
  final String? initialRecipientType;
  final String? initialRecipientName;
  final String? actingAsBandId;
  final String? actingAsArtistId;

  @override
  ConsumerState<SocialMessagingScreen> createState() => _SocialMessagingScreenState();
}

class _SocialMessagingScreenState extends ConsumerState<SocialMessagingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentTabIndex = 0;

  bool _isLoading = true;
  String? _errorMessage;
  List<Map<String, dynamic>> _conversations = [];
  Map<String, dynamic>? _selectedConversation;
  List<Map<String, dynamic>> _messages = [];
  bool _isLoadingMessages = false;
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;

  int _unreadCount = 0;
  int _requestsCount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      setState(() {
        _currentTabIndex = _tabController.index;
        _selectedConversation = null;
        _messages = [];
      });
      _fetchConversations();
    });

    _fetchConversations();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String get _currentTabString {
    switch (_currentTabIndex) {
      case 0:
        return 'inbox';
      case 1:
        return 'requests';
      case 2:
        return 'restricted';
      default:
        return 'inbox';
    }
  }

  Future<void> _fetchConversations() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ref.read(socialServiceProvider).getConversations(
        actingAsBandId: widget.actingAsBandId,
        actingAsArtistId: widget.actingAsArtistId,
        tab: _currentTabString,
      );

      final rawConvs = (res['conversations'] as List<dynamic>?)
              ?.map((e) => (e as Map<dynamic, dynamic>).cast<String, dynamic>())
              .toList() ??
          [];

      final unread = res['totalUnreadCount'] as int? ?? 0;
      final pending = res['pendingRequestsCount'] as int? ?? 0;

      setState(() {
        _conversations = rawConvs;
        _unreadCount = unread;
        _requestsCount = pending;
      });

      // Handle initial recipient if provided
      if (widget.initialRecipientId != null && _selectedConversation == null) {
        final existing = _conversations.firstWhere(
          (c) => (c['otherParticipant'] as Map<dynamic, dynamic>?)?['id'] == widget.initialRecipientId,
          orElse: () => <String, dynamic>{},
        );

        if (existing.isNotEmpty) {
          await _selectConversation(existing);
        } else {
          // Initialize draft
          setState(() {
            _selectedConversation = {
              'id': 'new',
              'status': 'pending_request',
              'otherParticipant': {
                'id': widget.initialRecipientId,
                'type': widget.initialRecipientType ?? 'artist',
                'name': widget.initialRecipientName ?? widget.initialRecipientId,
              },
            };
            _messages = [];
          });
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _selectConversation(Map<String, dynamic> conv) async {
    setState(() {
      _selectedConversation = conv;
      _isLoadingMessages = true;
      _messages = [];
    });

    final convId = conv['id'] as String;
    if (convId == 'new') {
      setState(() {
        _isLoadingMessages = false;
      });
      return;
    }

    try {
      final res = await ref.read(socialServiceProvider).getMessages(
        conversationId: convId,
        actingAsBandId: widget.actingAsBandId,
        actingAsArtistId: widget.actingAsArtistId,
      );

      final rawMsgs = (res['messages'] as List<dynamic>?)
              ?.map((e) => (e as Map<dynamic, dynamic>).cast<String, dynamic>())
              .toList() ??
          [];

      setState(() {
        _messages = rawMsgs.reversed.toList();
        if (res['conversation'] != null) {
          _selectedConversation = (res['conversation'] as Map<dynamic, dynamic>).cast<String, dynamic>();
        }
      });

      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load messages: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoadingMessages = false;
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _selectedConversation == null || _isSending) return;

    if (text.length > 2000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Message exceeds 2,000 character limit.')),
      );
      return;
    }

    final otherParticipant =
        (_selectedConversation!['otherParticipant'] as Map<dynamic, dynamic>).cast<String, dynamic>();
    final recipientId = otherParticipant['id'] as String;
    final recipientType = otherParticipant['type'] as String;

    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final currentUserId = ref.read(authStateProvider).user?.uid ?? 'me';
    final optimisticMsg = <String, dynamic>{
      'id': tempId,
      'senderId': currentUserId,
      'text': text,
      'createdAt': DateTime.now().toIso8601String(),
      'status': 'sending',
    };

    setState(() {
      _messages.add(optimisticMsg);
      _isSending = true;
    });
    _textController.clear();
    _scrollToBottom();

    try {
      final res = await ref.read(socialServiceProvider).sendMessage(
        recipientId: recipientId,
        recipientType: recipientType,
        text: text,
        actingAsBandId: widget.actingAsBandId,
        actingAsArtistId: widget.actingAsArtistId,
      );

      final convId = res['conversationId'] as String;
      if (mounted) {
        setState(() {
          final idx = _messages.indexWhere((m) => m['id'] == tempId);
          if (idx != -1) {
            _messages[idx]['status'] = 'sent';
          }
        });
      }

      await _fetchConversations();
      final updatedConv = _conversations.firstWhere(
        (c) => c['id'] == convId,
        orElse: () => _selectedConversation!,
      );
      await _selectConversation(updatedConv);
    } catch (e) {
      if (mounted) {
        setState(() {
          final idx = _messages.indexWhere((m) => m['id'] == tempId);
          if (idx != -1) {
            _messages[idx]['status'] = 'failed';
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send message: $e'),
            action: SnackBarAction(
              label: 'Retry',
              textColor: const Color(0xFF00E5FF),
              onPressed: () => _retryMessage(optimisticMsg),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  Future<void> _retryMessage(Map<String, dynamic> msg) async {
    final text = msg['text'] as String? ?? '';
    if (text.isEmpty || _selectedConversation == null) return;

    setState(() {
      msg['status'] = 'sending';
    });

    final otherParticipant =
        (_selectedConversation!['otherParticipant'] as Map<dynamic, dynamic>).cast<String, dynamic>();
    final recipientId = otherParticipant['id'] as String;
    final recipientType = otherParticipant['type'] as String;

    try {
      await ref.read(socialServiceProvider).sendMessage(
        recipientId: recipientId,
        recipientType: recipientType,
        text: text,
        actingAsBandId: widget.actingAsBandId,
        actingAsArtistId: widget.actingAsArtistId,
      );
      if (mounted) {
        setState(() {
          msg['status'] = 'sent';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          msg['status'] = 'failed';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Retry failed: $e')),
        );
      }
    }
  }

  Future<void> _respondToRequest(String action) async {
    if (_selectedConversation == null) return;
    final convId = _selectedConversation!['id'] as String;

    try {
      await ref.read(socialServiceProvider).respondToMessageRequest(
        conversationId: convId,
        action: action,
        actingAsBandId: widget.actingAsBandId,
        actingAsArtistId: widget.actingAsArtistId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              action == 'accept'
                  ? 'Request accepted!'
                  : action == 'decline'
                      ? 'Request declined. 7-day cooldown applied.'
                      : 'Action completed.',
            ),
          ),
        );
      }

      setState(() {
        _selectedConversation = null;
      });
      await _fetchConversations();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Action failed: $e')),
        );
      }
    }
  }

  void _showSafetyMenu() {
    if (_selectedConversation == null) return;
    final otherParticipant =
        (_selectedConversation!['otherParticipant'] as Map<dynamic, dynamic>).cast<String, dynamic>();
    final otherId = otherParticipant['id'] as String;
    final otherType = otherParticipant['type'] as String;
    final otherName = otherParticipant['name'] as String? ?? 'User';
    final isBlocked = _selectedConversation!['isBlocked'] as bool? ?? false;
    final isRestricted = _selectedConversation!['isRestricted'] as bool? ?? false;

    CbSafetyActionSheet.show(
      context,
      targetId: otherId,
      targetType: otherType,
      targetName: otherName,
      actingAsBandId: widget.actingAsBandId,
      actingAsArtistId: widget.actingAsArtistId,
      isBlocked: isBlocked,
      isRestricted: isRestricted,
      onRelationshipChanged: ({required bool isBlocked, required bool isRestricted}) {
        if (mounted) {
          setState(() {
            _selectedConversation!['isBlocked'] = isBlocked;
            _selectedConversation!['isRestricted'] = isRestricted;
            if (isBlocked) {
              _selectedConversation = null;
            }
          });
          _fetchConversations();
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedConversation != null) {
      return _buildChatView();
    }

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        title: const Text('Direct Messages', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: CbColors.surfaceBase,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: CbColors.purpleLight,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white54,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Inbox'),
                  if (_unreadCount > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: CbColors.purpleLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text('$_unreadCount', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Requests'),
                  if (_requestsCount > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text('$_requestsCount', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ],
              ),
            ),
            const Tab(text: 'Restricted'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: CbColors.purpleLight))
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Error: $_errorMessage', style: const TextStyle(color: Colors.redAccent)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _fetchConversations,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _conversations.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline, size: 56, color: Colors.white24),
                          const SizedBox(height: 12),
                          Text(
                            _currentTabIndex == 1
                                ? 'No pending message requests'
                                : _currentTabIndex == 2
                                    ? 'No restricted conversations'
                                    : 'No messages yet',
                            style: const TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _currentTabIndex == 0
                                ? 'Connect with fans and musicians by following them.'
                                : 'Incoming messages will appear here.',
                            style: const TextStyle(color: Colors.white38, fontSize: 12),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      itemCount: _conversations.length,
                      separatorBuilder: (context, index) => const Divider(color: Color(0x1AFFFFFF), height: 1),
                      itemBuilder: (context, index) {
                        final conv = _conversations[index];
                        final other =
                            (conv['otherParticipant'] as Map<dynamic, dynamic>?)?.cast<String, dynamic>() ?? {};
                        final name = other['name'] as String? ?? 'Performer';
                        final snippet = conv['lastMessageText'] as String? ?? 'No messages yet';
                        final unread = conv['unreadCount'] as int? ?? 0;

                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: CbColors.surfaceCard,
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : '?',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                          title: Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                          subtitle: Text(
                            snippet,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: unread > 0 ? Colors.white : Colors.white54,
                              fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                          trailing: unread > 0
                              ? Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: const BoxDecoration(
                                    color: CbColors.purpleLight,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Text(
                                    '$unread',
                                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                )
                              : null,
                          onTap: () => _selectConversation(conv),
                        );
                      },
                    ),
    );
  }

  Widget _buildChatView() {
    final other =
        (_selectedConversation!['otherParticipant'] as Map<dynamic, dynamic>?)?.cast<String, dynamic>() ?? {};
    final name = other['name'] as String? ?? 'Chat';
    final status = _selectedConversation!['status'] as String? ?? 'accepted';
    final isRestricted = _selectedConversation!['isRestricted'] as bool? ?? false;
    final isBlocked = _selectedConversation!['isBlocked'] as bool? ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF151C2C),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            setState(() {
              _selectedConversation = null;
            });
            _fetchConversations();
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            Text(
              isBlocked
                  ? 'Blocked'
                  : isRestricted
                      ? 'Restricted Mode'
                      : 'End-to-End Moderated',
              style: TextStyle(
                color: isBlocked
                    ? CbColors.statusError
                    : isRestricted
                        ? const Color(0xFF00E5FF)
                        : Colors.white54,
                fontSize: 11,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onPressed: _showSafetyMenu,
          ),
        ],
      ),
      body: Column(
        children: [
          // Blocked notice banner
          if (isBlocked)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0x33EF4444),
              child: const Row(
                children: [
                  Icon(Icons.block, color: Color(0xFFEF4444), size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Account is blocked. Messaging is disabled.',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            )
          // Restricted banner
          else if (isRestricted)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0x3300E5FF),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined, color: Color(0xFF00E5FF), size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Restricted Thread: Messages routed quietly without read receipts.',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ),
                ],
              ),
            )
          else if (status != 'pending_request')
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              color: const Color(0xFF151C2C),
              child: const Row(
                children: [
                  Icon(Icons.lock_outline, color: Color(0xFF00E5FF), size: 14),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Mutual follow active · End-to-end moderated conversation',
                      style: TextStyle(color: Colors.white60, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),

          // Message Request Action Banner
          if (status == 'pending_request')
            Container(
              padding: const EdgeInsets.all(14),
              color: const Color(0xFF151C2C),
              child: Column(
                children: [
                  Text(
                    '$name sent you a message request.',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                        ),
                        onPressed: () => _respondToRequest('decline'),
                        child: const Text('Decline'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00E5FF),
                          foregroundColor: const Color(0xFF0A0E17),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                        ),
                        onPressed: () => _respondToRequest('accept'),
                        child: const Text('Accept Message', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          // Messages List
          Expanded(
            child: _isLoadingMessages
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)))
                : _messages.isEmpty
                    ? Center(
                        child: Text(
                          'No messages yet. Send a note to $name!',
                          style: const TextStyle(color: Colors.white38),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final senderId = msg['senderId'] as String? ?? '';
                          final isMe = senderId != other['id'];
                          final text = msg['text'] as String? ?? '';
                          final deliveryStatus = msg['status'] as String? ?? 'sent';

                          return Align(
                            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.75,
                              ),
                              decoration: BoxDecoration(
                                color: isMe ? const Color(0xFF1E2638) : const Color(0xFF151C2C),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isMe
                                      ? (deliveryStatus == 'failed'
                                          ? const Color(0xFFEF4444)
                                          : const Color(0x3300E5FF))
                                      : const Color(0x1AFFFFFF),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment:
                                    isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                children: [
                                  Text(text, style: const TextStyle(color: Colors.white, fontSize: 14)),
                                  if (isMe) ...[
                                    if (deliveryStatus == 'failed') ...[
                                      const SizedBox(height: 4),
                                      GestureDetector(
                                        onTap: () => _retryMessage(msg),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0x33EF4444),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 12),
                                              SizedBox(width: 4),
                                              Flexible(
                                                child: Text(
                                                  'Failed to send · Tap to retry',
                                                  style: TextStyle(color: Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.bold),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ] else if (deliveryStatus == 'sending') ...[
                                      const SizedBox(height: 3),
                                      const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SizedBox(
                                            width: 10,
                                            height: 10,
                                            child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white38),
                                          ),
                                          SizedBox(width: 4),
                                          Text('Sending…', style: TextStyle(color: Colors.white38, fontSize: 9)),
                                        ],
                                      ),
                                    ] else ...[
                                      const SizedBox(height: 3),
                                      Text(
                                        deliveryStatus == 'read'
                                            ? 'Read ✓✓'
                                            : deliveryStatus == 'delivered'
                                                ? 'Delivered ✓'
                                                : 'Sent',
                                        style: TextStyle(
                                          color: deliveryStatus == 'read' ? const Color(0xFF00E5FF) : Colors.white38,
                                          fontSize: 9,
                                        ),
                                      ),
                                    ],
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),

          // Input Bar (Safe Area aware with Quick Tip button)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            color: const Color(0xFF151C2C),
            child: SafeArea(
              child: Row(
                children: [
                  // Quick Tip Attachment Button
                  IconButton(
                    icon: const Icon(Icons.attach_money, color: Color(0xFF00E5FF), size: 22),
                    tooltip: 'Send tip to $name',
                    onPressed: isBlocked
                        ? null
                        : () {
                            ref.read(tipFlowProvider.notifier).prepare(
                              recipientId: other['id'] as String? ?? '',
                              recipientName: name,
                              recipientType: other['type'] as String? ?? 'artist',
                              amountCents: 500,
                            );
                            TipConfirmationSheet.show(context);
                          },
                  ),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      enabled: !isBlocked,
                      style: const TextStyle(color: Colors.white),
                      maxLines: null,
                      decoration: InputDecoration(
                        hintText: isBlocked ? 'Messaging disabled (Blocked)' : 'Message $name...',
                        hintStyle: const TextStyle(color: Colors.white38),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: const Color(0xFF0A0E17),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    icon: _isSending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5FF)),
                          )
                        : const Icon(Icons.send, color: Color(0xFF00E5FF)),
                    onPressed: (_isSending || isBlocked) ? null : _sendMessage,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
