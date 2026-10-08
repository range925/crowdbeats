/**
 * Crowdbeats V2 — Messaging & Real-Time Chat Contracts
 *
 * Implements deterministic 1-to-1 conversations, message requests, decline cooldowns,
 * recipient message control settings, and message history.
 */

import type { IsoTimestamp } from '../common/timestamp.js';
import type { SocialEntityType, SocialProfileSummary } from './socialIdentity.js';

export type ConversationStatus = 'pending_request' | 'accepted' | 'declined' | 'blocked';
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type MessageEligibility = 'everyone_eligible' | 'mutual_only' | 'following_or_followers';

export interface RecipientMessageSettings {
  readonly eligibility: MessageEligibility;
  readonly pauseMessages: boolean;
}

export interface ConversationSummary {
  readonly id: string;
  readonly participantIds: [string, string];
  readonly participantTypes: Record<string, SocialEntityType>;
  readonly status: ConversationStatus;
  readonly requesterId: string;
  readonly recipientId: string;
  readonly lastMessageText: string;
  readonly lastMessageTimestamp: IsoTimestamp;
  readonly lastSenderId: string;
  readonly unreadCount: number;
  readonly declineCooldownUntil?: IsoTimestamp | null;
  readonly isRestricted: boolean;
  readonly otherParticipant: SocialProfileSummary;
}

export interface ChatMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly senderType: SocialEntityType;
  readonly operatorUid: string;
  readonly recipientId: string;
  readonly text: string;
  readonly createdAt: IsoTimestamp;
  readonly status: MessageDeliveryStatus;
  readonly readBy: string[];
}

// ── Messaging Callable Requests / Responses ─────────────────────────────────

export interface SendMessageRequest {
  readonly recipientId: string;
  readonly recipientType: SocialEntityType;
  readonly text: string;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
  readonly idempotencyKey?: string;
}

export interface SendMessageResponse {
  readonly ok: boolean;
  readonly messageId: string;
  readonly conversationId: string;
  readonly status: ConversationStatus;
}

export interface GetConversationsRequest {
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
  readonly tab?: 'inbox' | 'requests' | 'restricted';
  readonly limit?: number;
  readonly startAfter?: string;
}

export interface GetConversationsResponse {
  readonly conversations: ConversationSummary[];
  readonly totalUnreadCount: number;
  readonly pendingRequestsCount: number;
}

export interface GetMessagesRequest {
  readonly conversationId: string;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
  readonly limit?: number;
  readonly beforeTimestamp?: string;
}

export interface GetMessagesResponse {
  readonly messages: ChatMessage[];
  readonly conversation: ConversationSummary;
  readonly hasMore: boolean;
}

export interface RespondToMessageRequest {
  readonly conversationId: string;
  readonly action: 'accept' | 'decline' | 'block' | 'report';
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
  readonly reportReason?: string;
  readonly reportDescription?: string;
}

export interface RespondToMessageResponse {
  readonly ok: boolean;
  readonly status: ConversationStatus;
}

export interface UpdateMessageSettingsRequest {
  readonly eligibility?: MessageEligibility;
  readonly pauseMessages?: boolean;
  readonly actingAsBandId?: string;
}

export interface UpdateMessageSettingsResponse {
  readonly ok: boolean;
  readonly settings: RecipientMessageSettings;
}
