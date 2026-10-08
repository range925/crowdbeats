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
import '../theme/cb_colors.dart';

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

    setState(() {
      _isSending = true;
    });

    final otherParticipant =
        (_selectedConversation!['otherParticipant'] as Map<dynamic, dynamic>).cast<String, dynamic>();
    final recipientId = otherParticipant['id'] as String;
    final recipientType = otherParticipant['type'] as String;

    try {
      final res = await ref.read(socialServiceProvider).sendMessage(
        recipientId: recipientId,
        recipientType: recipientType,
        text: text,
        actingAsBandId: widget.actingAsBandId,
        actingAsArtistId: widget.actingAsArtistId,
      );

      _textController.clear();
      final convId = res['conversationId'] as String;

      await _fetchConversations();
      final updatedConv = _conversations.firstWhere(
        (c) => c['id'] == convId,
        orElse: () => _selectedConversation!,
      );
      await _selectConversation(updatedConv);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send message: $e')),
        );
      }
    } finally {
      setState(() {
        _isSending = false;
      });
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

  void _showReportDialog() {
    if (_selectedConversation == null) return;
    final otherParticipant =
        (_selectedConversation!['otherParticipant'] as Map<dynamic, dynamic>).cast<String, dynamic>();
    final otherName = otherParticipant['name'] as String? ?? 'User';

    String selectedCategory = 'harassment';
    final descController = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: CbColors.surfaceCard,
          title: Text('Report $otherName', style: const TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: selectedCategory,
                dropdownColor: CbColors.surfaceCard,
                style: const TextStyle(color: Colors.white),
                items: const [
                  DropdownMenuItem(value: 'harassment', child: Text('Harassment or Bullying')),
                  DropdownMenuItem(value: 'hate_speech', child: Text('Hate Speech')),
                  DropdownMenuItem(value: 'spam', child: Text('Spam or Scam')),
                  DropdownMenuItem(value: 'other', child: Text('Other Violation')),
                ],
                onChanged: (v) {
                  if (v != null) selectedCategory = v;
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Describe what happened...',
                  hintStyle: TextStyle(color: Colors.white38),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () async {
                Navigator.pop(ctx);
                final convId = _selectedConversation!['id'] as String;
                try {
                  await ref.read(socialServiceProvider).respondToMessageRequest(
                    conversationId: convId,
                    action: 'report',
                    actingAsBandId: widget.actingAsBandId,
                    actingAsArtistId: widget.actingAsArtistId,
                    reportReason: selectedCategory,
                    reportDescription: descController.text.trim(),
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Report submitted to Admin Support.')),
                    );
                    setState(() {
                      _selectedConversation = null;
                    });
                    await _fetchConversations();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed to submit report: $e')),
                    );
                  }
                }
              },
              child: const Text('Submit Report'),
            ),
          ],
        );
      },
    );
  }

  void _showSafetyMenu() {
    if (_selectedConversation == null) return;
    final otherParticipant =
        (_selectedConversation!['otherParticipant'] as Map<dynamic, dynamic>).cast<String, dynamic>();
    final otherId = otherParticipant['id'] as String;
    final otherType = otherParticipant['type'] as String;
    final otherName = otherParticipant['name'] as String? ?? 'User';

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: CbColors.surfaceCard,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.shield, color: Colors.blue),
                title: Text('Restrict $otherName', style: const TextStyle(color: Colors.white)),
                subtitle: const Text('Quietly moves messages to Restricted tab without notifications',
                    style: TextStyle(color: Colors.white54, fontSize: 11)),
                onTap: () async {
                  Navigator.pop(ctx);
                  try {
                    await ref.read(socialServiceProvider).restrictEntity(
                      targetId: otherId,
                      targetType: otherType,
                      actingAsBandId: widget.actingAsBandId,
                      actingAsArtistId: widget.actingAsArtistId,
                    );
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('$otherName restricted.')),
                      );
                      setState(() {
                        _selectedConversation = null;
                      });
                      await _fetchConversations();
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed: $e')),
                      );
                    }
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.block, color: Colors.red),
                title: Text('Block $otherName', style: const TextStyle(color: Colors.red)),
                subtitle: const Text('Removes follow edges in both directions and disables messages',
                    style: TextStyle(color: Colors.white54, fontSize: 11)),
                onTap: () async {
                  Navigator.pop(ctx);
                  try {
                    await ref.read(socialServiceProvider).blockEntity(
                      targetId: otherId,
                      targetType: otherType,
                      actingAsBandId: widget.actingAsBandId,
                      actingAsArtistId: widget.actingAsArtistId,
                    );
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('$otherName blocked.')),
                      );
                      setState(() {
                        _selectedConversation = null;
                      });
                      await _fetchConversations();
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed: $e')),
                      );
                    }
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.flag, color: Colors.orange),
                title: Text('Report $otherName', style: const TextStyle(color: Colors.orange)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showReportDialog();
                },
              ),
            ],
          ),
        );
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

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            setState(() {
              _selectedConversation = null;
            });
            _fetchConversations();
          },
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onPressed: _showSafetyMenu,
          ),
        ],
      ),
      body: Column(
        children: [
          // Restricted banner
          if (isRestricted)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.blue.withValues(alpha: 0.2),
              child: const Row(
                children: [
                  Icon(Icons.shield, color: Colors.blue, size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Restricted Thread: Messages routed quietly without read receipts.',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),

          // Message Request Action Banner
          if (status == 'pending_request')
            Container(
              padding: const EdgeInsets.all(14),
              color: CbColors.surfaceCard,
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
                        ),
                        onPressed: () => _respondToRequest('decline'),
                        child: const Text('Decline'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleLight),
                        onPressed: () => _respondToRequest('accept'),
                        child: const Text('Accept Message'),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          // Messages List
          Expanded(
            child: _isLoadingMessages
                ? const Center(child: CircularProgressIndicator(color: CbColors.purpleLight))
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
                                color: isMe ? CbColors.purpleDark : CbColors.surfaceCard,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isMe ? const Color(0x338B5CF6) : const Color(0x1AFFFFFF),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment:
                                    isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                children: [
                                  Text(text, style: const TextStyle(color: Colors.white, fontSize: 14)),
                                  if (isMe) ...[
                                    const SizedBox(height: 3),
                                    Text(
                                      deliveryStatus == 'read'
                                          ? 'Read'
                                          : deliveryStatus == 'delivered'
                                              ? 'Delivered'
                                              : 'Sent',
                                      style: const TextStyle(color: Colors.white38, fontSize: 9),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: CbColors.surfaceBase,
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      style: const TextStyle(color: Colors.white),
                      maxLines: null,
                      decoration: InputDecoration(
                        hintText: 'Message $name...',
                        hintStyle: const TextStyle(color: Colors.white38),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: CbColors.surfaceCard,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: _isSending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: CbColors.purpleLight),
                          )
                        : const Icon(Icons.send, color: CbColors.purpleLight),
                    onPressed: _isSending ? null : _sendMessage,
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
