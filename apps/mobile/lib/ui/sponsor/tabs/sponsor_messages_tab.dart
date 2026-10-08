// Crowdbeats V2 — Sponsor Direct Messages Tab
// Direct messaging inbox with talent, venue operators, and Crowdbeats support.
// Realistic conversation threads, unread badges, timestamps, and interactive chat dialog.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';
import '../state/sponsor_state.dart';

class SponsorMessagesTab extends ConsumerStatefulWidget {
  const SponsorMessagesTab({super.key});

  @override
  ConsumerState<SponsorMessagesTab> createState() => _SponsorMessagesTabState();
}

class _SponsorMessagesTabState extends ConsumerState<SponsorMessagesTab> {
  String _selectedCategory = 'all'; // 'all', 'talent', 'venue', 'support'

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sponsorProvider);
    final notifier = ref.read(sponsorProvider.notifier);

    final filteredThreads = state.messageThreads.where((thread) {
      if (_selectedCategory == 'all') return true;
      return thread.category == _selectedCategory;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.only(
          top: CbSpacing.s4,
          bottom: 100, // accommodate bottom nav bar
        ),
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sponsor Communications',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${state.totalUnreadMessages} unread messages across talent & venues',
                      style: const TextStyle(color: CbColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
                // Compose New Thread Button (Min 48x48dp)
                Semantics(
                  button: true,
                  label: 'Compose new message',
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: CbColors.surface1,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0x338B5CF6)),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.edit_note, color: CbColors.purpleLight, size: 22),
                      onPressed: () => _openNewMessageDialog(context),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: CbSpacing.s4),

          // Category Filter Chips
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
              children: [
                _buildCategoryChip('all', 'All Messages'),
                const SizedBox(width: 8),
                _buildCategoryChip('talent', 'Talent & Artists'),
                const SizedBox(width: 8),
                _buildCategoryChip('venue', 'Venue Operators'),
                const SizedBox(width: 8),
                _buildCategoryChip('support', 'Crowdbeats Concierge'),
              ],
            ),
          ),

          const SizedBox(height: CbSpacing.s4),

          // Threads List
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: filteredThreads.isEmpty
                ? _buildEmptyState()
                : Column(
                    children: filteredThreads.map((thread) {
                      return _ThreadCard(
                        thread: thread,
                        onTap: () {
                          notifier.markThreadRead(thread.id);
                          _openChatView(context, thread);
                        },
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String key, String label) {
    final isSelected = _selectedCategory == key;

    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedCategory = key),
      selectedColor: CbColors.purpleMain,
      backgroundColor: CbColors.surface1,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : CbColors.textSecondary,
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
        side: BorderSide(
          color: isSelected ? CbColors.purpleLight : const Color(0x1FFFFFFF),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(CbSpacing.s6),
      margin: const EdgeInsets.only(top: CbSpacing.s4),
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: const Center(
        child: Column(
          children: [
            Icon(Icons.forum_outlined, color: CbColors.textMuted, size: 40),
            SizedBox(height: CbSpacing.s3),
            Text(
              'No conversation threads',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 4),
            Text(
              'No messages found in this category.',
              style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  void _openChatView(BuildContext context, SponsorMessageThread thread) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ChatDetailModal(threadId: thread.id),
    );
  }

  void _openNewMessageDialog(BuildContext context) {
    final talentList = ref.read(sponsorProvider).talentList;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: const BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
          border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1.5)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Start New Conversation',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s2),
              const Text(
                'Select an artist, booking agent, or venue contact to message directly:',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: CbSpacing.s4),
              ...talentList.take(3).map((talent) {
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: CbColors.purpleDim,
                    child: Text(talent.name[0], style: const TextStyle(color: CbColors.purpleLight)),
                  ),
                  title: Text(talent.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  subtitle: Text('${talent.type} · ${talent.location}', style: const TextStyle(color: CbColors.textMuted, fontSize: 12)),
                  trailing: const Icon(Icons.send, color: CbColors.purpleLight, size: 18),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: CbColors.surface2,
                        content: Text('Starting chat thread with ${talent.name}...'),
                      ),
                    );
                  },
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

class _ThreadCard extends StatelessWidget {
  const _ThreadCard({
    required this.thread,
    required this.onTap,
  });

  final SponsorMessageThread thread;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasUnread = thread.unreadCount > 0;
    final timeStr = _formatTimestamp(thread.lastMessageTime);

    return Container(
      margin: const EdgeInsets.only(bottom: CbSpacing.s3),
      decoration: BoxDecoration(
        color: hasUnread ? CbColors.surface2 : CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(
          color: hasUnread ? CbColors.purpleLight.withValues(alpha: 0.4) : const Color(0x14FFFFFF),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        child: InkWell(
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(CbSpacing.s4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar with online status dot
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: CbColors.purpleDim,
                      child: Text(
                        thread.participantName.substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          color: CbColors.purpleLight,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    if (thread.isOnline)
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: CbColors.liveGreen,
                            shape: BoxShape.circle,
                            border: Border.all(color: CbColors.surface1, width: 2),
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(width: CbSpacing.s3),

                // Thread Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              thread.participantName,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: hasUnread ? FontWeight.bold : FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            timeStr,
                            style: TextStyle(
                              color: hasUnread ? CbColors.purpleLight : CbColors.textMuted,
                              fontSize: 11,
                              fontWeight: hasUnread ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        thread.participantRole,
                        style: const TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        thread.lastMessage,
                        style: TextStyle(
                          color: hasUnread ? Colors.white : CbColors.textMuted,
                          fontSize: 12,
                          fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),

                // Unread Count Pill
                if (hasUnread) ...[
                  const SizedBox(width: CbSpacing.s2),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: CbColors.purpleMain,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                    child: Text(
                      thread.unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${time.month}/${time.day}';
    }
  }
}

class _ChatDetailModal extends ConsumerStatefulWidget {
  const _ChatDetailModal({required this.threadId});

  final String threadId;

  @override
  ConsumerState<_ChatDetailModal> createState() => _ChatDetailModalState();
}

class _ChatDetailModalState extends ConsumerState<_ChatDetailModal> {
  final TextEditingController _msgController = TextEditingController();

  @override
  void dispose() {
    _msgController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sponsorProvider);
    final notifier = ref.read(sponsorProvider.notifier);

    final thread = state.messageThreads.firstWhere(
      (t) => t.id == widget.threadId,
      orElse: () => state.messageThreads.first,
    );

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      decoration: const BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
        border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1.5)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Chat Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4, vertical: CbSpacing.s3),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: CbColors.purpleDim,
                    child: Text(thread.participantName[0], style: const TextStyle(color: CbColors.purpleLight)),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          thread.participantName,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          thread.participantRole,
                          style: const TextStyle(color: CbColors.purpleLight, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(color: Color(0x14FFFFFF), height: 1),

            // Messages Stream
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(CbSpacing.s4),
                itemCount: thread.messages.length,
                itemBuilder: (context, index) {
                  final msg = thread.messages[index];
                  final isMe = msg.isFromMe;

                  return Align(
                    alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      constraints: BoxConstraints(
                        maxWidth: MediaQuery.of(context).size.width * 0.75,
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isMe ? CbColors.purpleMain : CbColors.surface2,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                        border: Border.all(
                          color: isMe ? Colors.transparent : const Color(0x1FFFFFFF),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                        children: [
                          Text(
                            msg.text,
                            style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.35),
                          ),
                          if (msg.attachmentName != null) ...[
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.picture_as_pdf, color: CbColors.heartOrange, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    msg.attachmentName!,
                                    style: const TextStyle(color: Colors.white, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Message Composer (Min 48x48dp interactive controls)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s3, vertical: 8),
              decoration: const BoxDecoration(
                color: CbColors.surface2,
                border: Border(top: BorderSide(color: Color(0x14FFFFFF), width: 1)),
              ),
              child: Row(
                children: [
                  Semantics(
                    button: true,
                    label: 'Attach contract or spec document',
                    child: SizedBox(
                      width: 48,
                      height: 48,
                      child: IconButton(
                        icon: const Icon(Icons.attach_file, color: Colors.white60, size: 20),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: CbColors.surface1,
                              content: Text('File attachment picker opened.'),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Type message or update...',
                        hintStyle: TextStyle(color: CbColors.textMuted, fontSize: 13),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (val) {
                        if (val.trim().isNotEmpty) {
                          notifier.sendMessage(widget.threadId, val);
                          _msgController.clear();
                        }
                      },
                    ),
                  ),
                  Semantics(
                    button: true,
                    label: 'Send message',
                    child: SizedBox(
                      width: 48,
                      height: 48,
                      child: IconButton(
                        icon: const Icon(Icons.send_rounded, color: CbColors.purpleLight, size: 22),
                        onPressed: () {
                          final text = _msgController.text.trim();
                          if (text.isNotEmpty) {
                            notifier.sendMessage(widget.threadId, text);
                            _msgController.clear();
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
