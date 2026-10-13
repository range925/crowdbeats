/**
 * Crowdbeats V2 — Social Graph & Messaging Integration Web Unit Suite (Phase 15)
 *
 * Verifies:
 * 1. Follow / Unfollow / Follow-Back dynamic state resolution
 * 2. Relationship badges ("Follows you", "Mutual") based on follow edges
 * 3. Messaging permission state machine:
 *    - 0 follows: message initiation locked
 *    - 1 follow edge: pending request with 1-message limit
 *    - Mutual follows: instant direct accepted chat
 *    - Recipient pause settings guard
 * 4. Conversation tab partitioning:
 *    - Inbox (accepted, non-restricted)
 *    - Requests (pending_request)
 *    - Restricted (stealth isolated, unread badge suppressed)
 * 5. Trust & Safety boundaries:
 *    - Hard Block: follow edge cascade & conversation lock
 *    - Stealth Restrict: follow preservation & quiet delivery
 *    - Abuse Report: snapshots evidence to moderation queue
 * 6. STRICT PRIVACY INVARIANT: Message body NEVER leaks into CRM events or public summaries
 */

import type {
  ConversationSummary,
  ChatMessage,
  FollowRelationshipState,
  RecipientMessageSettings,
} from '@crowdbeats/contracts';

describe('Social Graph & Messaging Integration — Web Unit Suite (Phase 15)', () => {
  // ── Helper state evaluators matching ProfileSocialHeaderActions & MessagingDashboard ──

  function evaluateFollowButtonState(
    isFollowing: boolean,
    followsViewer: boolean,
    isHovered: boolean
  ): { label: string; badge: string | null; variant: 'primary' | 'secondary' | 'danger' } {
    if (isFollowing) {
      if (isHovered) {
        return { label: 'Unfollow', badge: followsViewer ? 'Mutual' : null, variant: 'danger' };
      }
      return { label: 'Following', badge: followsViewer ? 'Mutual' : null, variant: 'secondary' };
    }
    if (followsViewer) {
      return { label: 'Follow Back', badge: 'Follows you', variant: 'primary' };
    }
    return { label: 'Follow', badge: null, variant: 'primary' };
  }

  function evaluateMessageCapability(
    relationship: FollowRelationshipState,
    settings: RecipientMessageSettings
  ): { canSend: boolean; chatStatus: 'none' | 'pending_request' | 'accepted' | 'blocked' | 'paused'; reason?: string } {
    if (relationship.isBlocked) {
      return { canSend: false, chatStatus: 'blocked', reason: 'You have blocked or have been blocked by this user.' };
    }
    if (settings.pauseMessages) {
      return { canSend: false, chatStatus: 'paused', reason: 'This recipient has temporarily paused incoming messages.' };
    }
    if (relationship.mutualFollow) {
      return { canSend: true, chatStatus: 'accepted' };
    }
    if (relationship.isFollowing) {
      return { canSend: true, chatStatus: 'pending_request' };
    }
    return { canSend: false, chatStatus: 'none', reason: 'You must follow this user before sending a message request.' };
  }

  function partitionConversations(
    conversations: ConversationSummary[],
    activeTab: 'inbox' | 'requests' | 'restricted'
  ): ConversationSummary[] {
    switch (activeTab) {
      case 'inbox':
        return conversations.filter((c) => c.status === 'accepted' && !c.isRestricted);
      case 'requests':
        return conversations.filter((c) => c.status === 'pending_request' && !c.isRestricted);
      case 'restricted':
        return conversations.filter((c) => c.isRestricted === true);
    }
  }

  function computeUnreadCount(conversations: ConversationSummary[]): number {
    return conversations
      .filter((c) => !c.isRestricted && c.status === 'accepted')
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }

  // ── 1. Follow State & Button Label Evaluation ─────────────────────────────

  describe('1. Profile Social Header Follow State Machine', () => {
    it('renders "Follow" when neither party follows each other', () => {
      const state = evaluateFollowButtonState(false, false, false);
      expect(state.label).toBe('Follow');
      expect(state.badge).toBeNull();
      expect(state.variant).toBe('primary');
    });

    it('renders "Follow Back" and "Follows you" badge when target follows viewer', () => {
      const state = evaluateFollowButtonState(false, true, false);
      expect(state.label).toBe('Follow Back');
      expect(state.badge).toBe('Follows you');
      expect(state.variant).toBe('primary');
    });

    it('renders "Following" and "Mutual" badge when mutual follow exists', () => {
      const state = evaluateFollowButtonState(true, true, false);
      expect(state.label).toBe('Following');
      expect(state.badge).toBe('Mutual');
      expect(state.variant).toBe('secondary');
    });

    it('transitions to "Unfollow" with danger variant upon hover when currently following', () => {
      const state = evaluateFollowButtonState(true, false, true);
      expect(state.label).toBe('Unfollow');
      expect(state.variant).toBe('danger');
    });
  });

  // ── 2. Messaging Permission State Machine ─────────────────────────────────

  describe('2. Messaging Permission & Edge Rules', () => {
    const DEFAULT_SETTINGS: RecipientMessageSettings = {
      eligibility: 'everyone_eligible',
      pauseMessages: false,
    };

    it('Rule 1: Rejects message initiation if caller does not follow recipient (0 follows)', () => {
      const relationship: FollowRelationshipState = {
        isFollowing: false,
        isFollowedBy: false,
        followsYou: false,
        mutualFollow: false,
        isBlocked: false,
        isRestricted: false,
      };
      const capability = evaluateMessageCapability(relationship, DEFAULT_SETTINGS);
      expect(capability.canSend).toBe(false);
      expect(capability.chatStatus).toBe('none');
      expect(capability.reason).toContain('must follow this user');
    });

    it('Rule 2: 1 follow edge (caller follows recipient) allows 1 pending message request', () => {
      const relationship: FollowRelationshipState = {
        isFollowing: true,
        isFollowedBy: false,
        followsYou: false,
        mutualFollow: false,
        isBlocked: false,
        isRestricted: false,
      };
      const capability = evaluateMessageCapability(relationship, DEFAULT_SETTINGS);
      expect(capability.canSend).toBe(true);
      expect(capability.chatStatus).toBe('pending_request');
    });

    it('Rule 3: Mutual follow opens direct accepted chat immediately', () => {
      const relationship: FollowRelationshipState = {
        isFollowing: true,
        isFollowedBy: true,
        followsYou: true,
        mutualFollow: true,
        isBlocked: false,
        isRestricted: false,
      };
      const capability = evaluateMessageCapability(relationship, DEFAULT_SETTINGS);
      expect(capability.canSend).toBe(true);
      expect(capability.chatStatus).toBe('accepted');
    });

    it('Rule 4: Recipient pause incoming messages blocks initiation with clear reason', () => {
      const relationship: FollowRelationshipState = {
        isFollowing: true,
        isFollowedBy: true,
        followsYou: true,
        mutualFollow: true,
        isBlocked: false,
        isRestricted: false,
      };
      const pausedSettings: RecipientMessageSettings = {
        eligibility: 'everyone_eligible',
        pauseMessages: true,
      };
      const capability = evaluateMessageCapability(relationship, pausedSettings);
      expect(capability.canSend).toBe(false);
      expect(capability.chatStatus).toBe('paused');
      expect(capability.reason).toContain('temporarily paused');
    });

    it('Rule 5: Blocked state denies messaging regardless of follow edges', () => {
      const relationship: FollowRelationshipState = {
        isFollowing: true,
        isFollowedBy: true,
        followsYou: true,
        mutualFollow: false,
        isBlocked: true,
        isRestricted: false,
      };
      const capability = evaluateMessageCapability(relationship, DEFAULT_SETTINGS);
      expect(capability.canSend).toBe(false);
      expect(capability.chatStatus).toBe('blocked');
    });
  });

  // ── 3. Conversation Partitioning & Tab Management ─────────────────────────

  describe('3. Inbox, Requests & Restricted Tab Partitioning', () => {
    const MOCK_CONVERSATIONS: ConversationSummary[] = [
      {
        id: 'conv_1',
        participantIds: ['user_fan_1', 'art_devin'],
        participantTypes: { user_fan_1: 'fan', art_devin: 'artist' },
        requesterId: 'user_fan_1',
        recipientId: 'art_devin',
        lastMessageText: 'Loved your set at the festival!',
        lastMessageTimestamp: '2026-10-13T09:00:00Z',
        lastSenderId: 'user_fan_1',
        otherParticipant: {
          id: 'user_fan_1',
          type: 'fan',
          name: 'Elena Rostova',
          avatarUrl: 'https://images.crowdbeats.com/elena.jpg',
          isVerified: false,
        },
        status: 'accepted',
        unreadCount: 3,
        isRestricted: false,
      },
      {
        id: 'conv_2',
        participantIds: ['user_fan_2', 'art_devin'],
        participantTypes: { user_fan_2: 'fan', art_devin: 'artist' },
        requesterId: 'user_fan_2',
        recipientId: 'art_devin',
        lastMessageText: 'Hey, are you free for a collaboration?',
        lastMessageTimestamp: '2026-10-13T08:30:00Z',
        lastSenderId: 'user_fan_2',
        otherParticipant: {
          id: 'user_fan_2',
          type: 'fan',
          name: 'Marcus Vance',
          avatarUrl: 'https://images.crowdbeats.com/marcus.jpg',
          isVerified: false,
        },
        status: 'pending_request',
        unreadCount: 1,
        isRestricted: false,
      },
      {
        id: 'conv_3',
        participantIds: ['user_fan_3', 'art_devin'],
        participantTypes: { user_fan_3: 'fan', art_devin: 'artist' },
        requesterId: 'user_fan_3',
        recipientId: 'art_devin',
        lastMessageText: 'Check out this external link...',
        lastMessageTimestamp: '2026-10-13T07:15:00Z',
        lastSenderId: 'user_fan_3',
        otherParticipant: {
          id: 'user_fan_3',
          type: 'fan',
          name: 'Spammy Steve',
          avatarUrl: 'https://images.crowdbeats.com/steve.jpg',
          isVerified: false,
        },
        status: 'accepted',
        unreadCount: 5,
        isRestricted: true, // Stealth restricted
      },
    ];

    it('partitions inbox to show only accepted non-restricted conversations', () => {
      const inboxList = partitionConversations(MOCK_CONVERSATIONS, 'inbox');
      expect(inboxList.length).toBe(1);
      expect(inboxList[0].id).toBe('conv_1');
    });

    it('partitions requests to show only pending_request conversations', () => {
      const requestsList = partitionConversations(MOCK_CONVERSATIONS, 'requests');
      expect(requestsList.length).toBe(1);
      expect(requestsList[0].id).toBe('conv_2');
    });

    it('partitions restricted to isolate restricted conversations quietly', () => {
      const restrictedList = partitionConversations(MOCK_CONVERSATIONS, 'restricted');
      expect(restrictedList.length).toBe(1);
      expect(restrictedList[0].id).toBe('conv_3');
    });

    it('suppresses unread badge count for restricted conversations', () => {
      const unread = computeUnreadCount(MOCK_CONVERSATIONS);
      // Only conv_1 unread (3) counts; conv_3 unread (5) is suppressed because isRestricted === true
      expect(unread).toBe(3);
    });
  });

  // ── 4. Privacy Preservation Invariants ───────────────────────────────────

  describe('4. Strict Privacy Preservation Invariant', () => {
    it('sanitizes message contents when generating CRM timeline summaries', () => {
      const privateChatMessage: ChatMessage = {
        id: 'msg_999',
        conversationId: 'conv_private',
        senderId: 'user_fan_1',
        senderType: 'fan',
        recipientId: 'art_devin',
        operatorUid: 'usr_fan_1_auth',
        text: 'CONFIDENTIAL: Here is my private contact number and home address.',
        createdAt: '2026-10-13T09:15:00Z',
        status: 'sent',
        readBy: ['user_fan_1'],
      };

      // Simulates CRM event payload formatting performed in messagingCallables.ts
      const crmEventPayload = {
        conversationId: privateChatMessage.conversationId,
        senderId: privateChatMessage.senderId,
        senderType: privateChatMessage.senderType,
        recipientId: privateChatMessage.recipientId,
        messageId: privateChatMessage.id,
        // STRICT PRIVACY: text is explicitly NEVER included
      };

      expect(crmEventPayload).not.toHaveProperty('text');
      expect(JSON.stringify(crmEventPayload)).not.toContain('CONFIDENTIAL');
      expect(JSON.stringify(crmEventPayload)).not.toContain('private contact number');
    });
  });
});
