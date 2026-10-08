/**
 * Crowdbeats V2 — Messaging & Real-Time Chat Callables
 *
 * Implements deterministic 1-to-1 conversations, relationship-governed message requests,
 * decline 7-day cooldowns, recipient control settings, stealth restriction, and message history.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import type {
  SendMessageRequest,
  SendMessageResponse,
  GetConversationsRequest,
  GetConversationsResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  RespondToMessageRequest,
  RespondToMessageResponse,
  UpdateMessageSettingsRequest,
  UpdateMessageSettingsResponse,
  ConversationSummary,
  ChatMessage,
  RecipientMessageSettings,
  ConversationStatus,
  SocialEntityType,
} from '@crowdbeats/contracts';
import {
  db,
  verifySocialOperator,
  checkBidirectionalBlock,
  checkRestriction,
  getDeterministicConversationId,
  fetchProfileSummary,
} from './helpers.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function getEntitySettings(
  entityId: string,
  entityType: SocialEntityType,
): Promise<RecipientMessageSettings> {
  const collectionName = entityType === 'band' ? 'bands' : 'users';
  const snap = await db()
    .collection(collectionName)
    .doc(entityId)
    .collection('settings')
    .doc('messaging')
    .get();

  if (!snap.exists) {
    return {
      eligibility: 'everyone_eligible',
      pauseMessages: false,
    };
  }

  const data = snap.data() ?? {};
  return {
    eligibility: data.eligibility || 'everyone_eligible',
    pauseMessages: Boolean(data.pauseMessages),
  };
}

/**
 * sendMessage — Sends a text message governed by recipient control & relationship matrix.
 */
export const sendMessage = onCall<SendMessageRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<SendMessageResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { recipientId, recipientType, text, actingAsBandId, idempotencyKey } = request.data ?? {};

    if (!recipientId || typeof recipientId !== 'string' || !recipientType) {
      throw new HttpsError('invalid-argument', 'recipientId and recipientType are required.');
    }

    const trimmedText = (text || '').trim();
    if (trimmedText.length < 1 || trimmedText.length > 2000) {
      throw new HttpsError('invalid-argument', 'Message text must be between 1 and 2,000 characters.');
    }

    // 1. Verify sender operator authority
    const senderContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : 'fan',
      actingAsBandId,
    );
    const senderId = senderContext.entityId;
    const senderType = senderContext.entityType;

    if (senderId === recipientId) {
      throw new HttpsError('invalid-argument', 'You cannot send a message to yourself.');
    }

    // 2. Hard bidirectional block check
    const blockCheck = await checkBidirectionalBlock(senderId, recipientId);
    if (blockCheck.isBlocked) {
      throw new HttpsError('permission-denied', 'Messaging is unavailable due to safety or block settings.');
    }

    // 3. Recipient settings check
    const recipientSettings = await getEntitySettings(recipientId, recipientType);
    if (recipientSettings.pauseMessages) {
      throw new HttpsError('failed-precondition', 'Recipient has temporarily paused incoming messages.');
    }

    // 4. Follow edges & prior conversation check
    const convId = getDeterministicConversationId(senderId, recipientId);
    const convRef = db().collection('conversations').doc(convId);

    const [senderFollowsRecipient, recipientFollowsSender, convSnap, isRestricted] = await Promise.all([
      db().collection('follows').doc(`${senderId}_${recipientId}`).get(),
      db().collection('follows').doc(`${recipientId}_${senderId}`).get(),
      convRef.get(),
      checkRestriction(recipientId, senderId), // Did recipient restrict sender?
    ]);

    const isFollowing = senderFollowsRecipient.exists;
    const isFollowedBy = recipientFollowsSender.exists;
    const isMutual = isFollowing && isFollowedBy;
    const atLeastOneFollow = isFollowing || isFollowedBy;

    // Check recipient message eligibility rule
    if (recipientSettings.eligibility === 'mutual_only' && !isMutual) {
      throw new HttpsError('failed-precondition', 'Recipient only accepts messages from mutual follows.');
    }
    if (recipientSettings.eligibility === 'following_or_followers' && !atLeastOneFollow) {
      throw new HttpsError('failed-precondition', 'Recipient only accepts messages from people they follow or who follow them.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const nowMs = Date.now();
    let finalStatus: ConversationStatus = 'accepted';
    let isNewConversation = !convSnap.exists;

    if (isNewConversation) {
      // Rule 1: No follow edges and no prior chat -> reject
      if (!atLeastOneFollow) {
        throw new HttpsError(
          'failed-precondition',
          'Follow required: You must follow this account before sending a message request.',
        );
      }

      // Rule 2: At least 1 follow edge -> 1 text message request
      if (isMutual) {
        finalStatus = 'accepted';
      } else {
        finalStatus = 'pending_request';
      }
    } else {
      const convData = convSnap.data() ?? {};
      const currentStatus = convData.status as ConversationStatus;

      if (currentStatus === 'blocked') {
        throw new HttpsError('permission-denied', 'Conversation is blocked.');
      }

      if (currentStatus === 'declined') {
        const cooldownUntilMs = convData.declineCooldownUntil?.toMillis?.() ?? 0;
        if (nowMs < cooldownUntilMs) {
          const remainingDays = Math.ceil((cooldownUntilMs - nowMs) / (24 * 60 * 60 * 1000));
          throw new HttpsError(
            'failed-precondition',
            `Recipient declined prior message request. Cooldown active for ${remainingDays} more day(s).`,
          );
        }
        // Cooldown passed; if follow exists, re-request
        finalStatus = isMutual ? 'accepted' : 'pending_request';
      } else if (currentStatus === 'pending_request') {
        // Enforce 1-message pending request limit: requester cannot send 2nd message until recipient responds!
        if (convData.lastSenderId === senderId) {
          throw new HttpsError(
            'failed-precondition',
            'Your message request is pending. You cannot send additional messages until the recipient accepts.',
          );
        }
        finalStatus = 'pending_request';
      } else {
        // Status is 'accepted': Unfollow resilience -> chat remains open
        finalStatus = 'accepted';
      }
    }

    const messageId = idempotencyKey ? `msg_${idempotencyKey}` : `msg_${uuidv4()}`;
    const messageRef = convRef.collection('messages').doc(messageId);

    await db().runTransaction(async (transaction) => {
      // Check message idempotency
      const existingMsg = await transaction.get(messageRef);
      if (existingMsg.exists) {
        return;
      }

      const participantIds: [string, string] = [senderId, recipientId].sort() as [string, string];

      // Update / Create conversation document
      transaction.set(
        convRef,
        {
          id: convId,
          participantIds,
          participantTypes: {
            [senderId]: senderType,
            [recipientId]: recipientType,
          },
          status: finalStatus,
          requesterId: isNewConversation ? senderId : convSnap.data()?.requesterId || senderId,
          recipientId: isNewConversation ? recipientId : convSnap.data()?.recipientId || recipientId,
          lastMessageText: trimmedText,
          lastMessageTimestamp: now,
          lastSenderId: senderId,
          lastOperatorUid: uid,
          unreadCounts: {
            [recipientId]: isRestricted ? 0 : admin.firestore.FieldValue.increment(1),
            [senderId]: 0,
          },
          updatedAt: now,
          ...(isNewConversation ? { createdAt: now } : {}),
        },
        { merge: true },
      );

      // Create message sub-document
      transaction.set(messageRef, {
        id: messageId,
        conversationId: convId,
        senderId,
        senderType,
        operatorUid: uid,
        recipientId,
        text: trimmedText,
        createdAt: now,
        status: 'sent',
        readBy: [senderId],
        ...(idempotencyKey ? { idempotencyKey } : {}),
      });
    });

    return {
      ok: true,
      messageId,
      conversationId: convId,
      status: finalStatus,
    };
  },
);

/**
 * getConversations — Returns categorized conversations (Inbox, Requests, Restricted) with unread totals.
 */
export const getConversations = onCall<GetConversationsRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GetConversationsResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { actingAsBandId, actingAsArtistId, tab = 'inbox', limit = 20 } = request.data ?? {};

    const callerContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      false,
      actingAsArtistId,
    );
    const callerId = callerContext.entityId;

    const possibleCallerIds = [callerId];
    if (callerId !== uid) possibleCallerIds.push(uid);
    const artistSnap = await db().collection('artistProfiles').where('userId', '==', uid).limit(1).get();
    if (!artistSnap.empty && !possibleCallerIds.includes(artistSnap.docs[0].id)) {
      possibleCallerIds.push(artistSnap.docs[0].id);
    }

    const pageSize = Math.min(Math.max(1, limit), 50);

    const docMap = new Map<string, admin.firestore.QueryDocumentSnapshot>();
    for (const id of possibleCallerIds) {
      const snap = await db()
        .collection('conversations')
        .where('participantIds', 'array-contains', id)
        .orderBy('lastMessageTimestamp', 'desc')
        .limit(pageSize * 2)
        .get();
      for (const d of snap.docs) {
        if (!docMap.has(d.id)) {
          docMap.set(d.id, d);
        }
      }
    }

    let totalUnreadCount = 0;
    let pendingRequestsCount = 0;
    const rawConversations: ConversationSummary[] = [];

    for (const docSnap of Array.from(docMap.values())) {
      const data = docSnap.data();
      const convId = docSnap.id;
      const participantIds = data.participantIds as [string, string];
      const otherId = possibleCallerIds.includes(participantIds[0]) ? participantIds[1] : participantIds[0];
      const participantTypes = data.participantTypes || {};
      const otherType = (participantTypes[otherId] as SocialEntityType) || 'fan';

      const unread = Number(data.unreadCounts?.[callerId] || data.unreadCounts?.[uid] || 0);
      const status = (data.status as ConversationStatus) || 'accepted';
      const isRecipient = possibleCallerIds.includes(data.recipientId);

      if (status === 'pending_request' && isRecipient) {
        pendingRequestsCount++;
      }
      if (status === 'accepted') {
        totalUnreadCount += unread;
      }

      // Check quiet restriction state
      let isRestrictedByCaller = false;
      for (const cId of possibleCallerIds) {
        if (await checkRestriction(cId, otherId)) {
          isRestrictedByCaller = true;
          break;
        }
      }

      // Tab segregation
      let belongsToTab = false;
      if (tab === 'restricted') {
        belongsToTab = isRestrictedByCaller;
      } else if (isRestrictedByCaller) {
        belongsToTab = false;
      } else if (tab === 'requests') {
        belongsToTab = status === 'pending_request' && isRecipient;
      } else {
        belongsToTab = status === 'accepted' || (status === 'pending_request' && !isRecipient);
      }

      if (belongsToTab && rawConversations.length < pageSize) {
        const otherParticipant = await fetchProfileSummary(otherId, otherType, callerId);
        const lastTimestampStr = data.lastMessageTimestamp?.toDate
          ? data.lastMessageTimestamp.toDate().toISOString()
          : new Date().toISOString();

        const declineCooldownStr = data.declineCooldownUntil?.toDate
          ? data.declineCooldownUntil.toDate().toISOString()
          : null;

        rawConversations.push({
          id: convId,
          participantIds,
          participantTypes,
          status,
          requesterId: data.requesterId || participantIds[0],
          recipientId: data.recipientId || participantIds[1],
          lastMessageText: data.lastMessageText || '',
          lastMessageTimestamp: lastTimestampStr,
          lastSenderId: data.lastSenderId || '',
          unreadCount: unread,
          declineCooldownUntil: declineCooldownStr,
          isRestricted: isRestrictedByCaller,
          otherParticipant,
        });
      }
    }

    return {
      conversations: rawConversations,
      totalUnreadCount,
      pendingRequestsCount,
    };
  },
);

/**
 * getMessages — Returns paginated chat messages and resets unread count (with quiet restriction suppression).
 */
export const getMessages = onCall<GetMessagesRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GetMessagesResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { conversationId, actingAsBandId, actingAsArtistId, limit = 50 } = request.data ?? {};

    if (!conversationId || typeof conversationId !== 'string') {
      throw new HttpsError('invalid-argument', 'conversationId is required.');
    }

    const callerContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      false,
      actingAsArtistId,
    );
    let callerId = callerContext.entityId;

    const convRef = db().collection('conversations').doc(conversationId);
    const convSnap = await convRef.get();
    if (!convSnap.exists) {
      throw new HttpsError('not-found', 'Conversation not found.');
    }

    const convData = convSnap.data() ?? {};
    const participantIds = convData.participantIds as string[];
    if (!participantIds.includes(callerId)) {
      if (participantIds.includes(uid)) {
        callerId = uid;
      } else {
        for (const pId of participantIds) {
          const aSnap = await db().collection('artistProfiles').doc(pId).get();
          if (aSnap.exists && (aSnap.data()?.userId === uid || aSnap.data()?.ownerUid === uid)) {
            callerId = pId;
            break;
          }
        }
      }
    }
    if (!participantIds.includes(callerId)) {
      throw new HttpsError('permission-denied', 'You are not a participant in this conversation.');
    }

    const otherId = participantIds[0] === callerId ? participantIds[1] : participantIds[0];
    const otherType = (convData.participantTypes?.[otherId] as SocialEntityType) || 'fan';

    const pageSize = Math.min(Math.max(1, limit), 100);

    const messagesSnap = await convRef
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1)
      .get();

    const hasMore = messagesSnap.docs.length > pageSize;
    const docs = hasMore ? messagesSnap.docs.slice(0, pageSize) : messagesSnap.docs;

    const messages: ChatMessage[] = docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        operatorUid: data.operatorUid,
        recipientId: data.recipientId,
        text: data.text,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        status: data.status || 'sent',
        readBy: data.readBy || [data.senderId],
      };
    });

    messages.reverse();

    const isRestrictedByCaller = await checkRestriction(callerId, otherId);

    if (!isRestrictedByCaller) {
      await convRef.update({
        [`unreadCounts.${callerId}`]: 0,
      });
    }

    const otherParticipant = await fetchProfileSummary(otherId, otherType, callerId);
    const lastTimestampStr = convData.lastMessageTimestamp?.toDate
      ? convData.lastMessageTimestamp.toDate().toISOString()
      : new Date().toISOString();

    const summary: ConversationSummary = {
      id: conversationId,
      participantIds: convData.participantIds,
      participantTypes: convData.participantTypes || {},
      status: convData.status || 'accepted',
      requesterId: convData.requesterId || participantIds[0],
      recipientId: convData.recipientId || participantIds[1],
      lastMessageText: convData.lastMessageText || '',
      lastMessageTimestamp: lastTimestampStr,
      lastSenderId: convData.lastSenderId || '',
      unreadCount: 0,
      isRestricted: isRestrictedByCaller,
      otherParticipant,
    };

    return {
      messages,
      conversation: summary,
      hasMore,
    };
  },
);

/**
 * respondToMessageRequest — Handles Accept, Decline (7-day cooldown), Block, and Report actions.
 */
export const respondToMessageRequest = onCall<RespondToMessageRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<RespondToMessageResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { conversationId, action, actingAsBandId, actingAsArtistId, reportReason, reportDescription } = request.data ?? {};

    if (!conversationId || typeof conversationId !== 'string' || !action) {
      throw new HttpsError('invalid-argument', 'conversationId and action are required.');
    }

    const callerContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : (actingAsArtistId ? 'artist' : undefined),
      actingAsBandId,
      true, // requireAdmin
      actingAsArtistId,
    );
    let callerId = callerContext.entityId;

    const convRef = db().collection('conversations').doc(conversationId);
    const convSnap = await convRef.get();
    if (!convSnap.exists) {
      throw new HttpsError('not-found', 'Conversation not found.');
    }

    const convData = convSnap.data() ?? {};
    const participantIds = convData.participantIds as string[];
    if (!participantIds.includes(callerId)) {
      if (participantIds.includes(uid)) {
        callerId = uid;
      } else {
        for (const pId of participantIds) {
          const aSnap = await db().collection('artistProfiles').doc(pId).get();
          if (aSnap.exists && (aSnap.data()?.userId === uid || aSnap.data()?.ownerUid === uid)) {
            callerId = pId;
            break;
          }
        }
      }
    }
    if (!participantIds.includes(callerId)) {
      throw new HttpsError('permission-denied', 'You are not a participant in this conversation.');
    }

    const otherId = participantIds[0] === callerId ? participantIds[1] : participantIds[0];
    const otherType = (convData.participantTypes?.[otherId] as SocialEntityType) || 'fan';
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (action === 'accept') {
      await convRef.update({
        status: 'accepted',
        updatedAt: now,
      });
      return { ok: true, status: 'accepted' };
    }

    if (action === 'decline') {
      const cooldownDate = new Date(Date.now() + SEVEN_DAYS_MS);
      await convRef.update({
        status: 'declined',
        declineCooldownUntil: admin.firestore.Timestamp.fromDate(cooldownDate),
        updatedAt: now,
      });
      return { ok: true, status: 'declined' };
    }

    if (action === 'block') {
      // Atomic block cascade
      const blockId = `${callerId}_${otherId}`;
      const blockRef = db().collection('socialBlocks').doc(blockId);
      const followForwardRef = db().collection('follows').doc(`${callerId}_${otherId}`);
      const followBackwardRef = db().collection('follows').doc(`${otherId}_${callerId}`);

      await db().runTransaction(async (transaction) => {
        transaction.set(blockRef, {
          blockId,
          blockerId: callerId,
          blockerType: callerContext.entityType,
          blockedId: otherId,
          blockedType: otherType,
          operatorUid: uid,
          reason: 'USER_BLOCKED_VIA_CHAT',
          createdAt: now,
        });

        // Delete follow edges
        transaction.delete(followForwardRef);
        transaction.delete(followBackwardRef);

        transaction.update(convRef, {
          status: 'blocked',
          blockedBy: callerId,
          updatedAt: now,
        });
      });

      return { ok: true, status: 'blocked' };
    }

    if (action === 'report') {
      // Snapshot recent messages as evidence for Admin Support
      const recentMessagesSnap = await convRef.collection('messages').orderBy('createdAt', 'desc').limit(20).get();
      const messageEvidence = recentMessagesSnap.docs.map((d) => d.data());

      const reportId = `rpt_${uuidv4().slice(0, 12)}`;
      await db().collection('reports').doc(reportId).set({
        reportId,
        reporterUid: uid,
        reporterEntityId: callerId,
        targetId: otherId,
        targetType: otherType,
        conversationId,
        reason: reportReason || 'harassment',
        description: reportDescription || 'Reported via message request rejection',
        evidence: {
          snapshotTimestamp: new Date().toISOString(),
          messages: messageEvidence,
        },
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      // Decline conversation with cooldown
      const cooldownDate = new Date(Date.now() + SEVEN_DAYS_MS);
      await convRef.update({
        status: 'declined',
        declineCooldownUntil: admin.firestore.Timestamp.fromDate(cooldownDate),
        updatedAt: now,
      });

      return { ok: true, status: 'declined' };
    }

    throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
  },
);

/**
 * updateMessageSettings — Configures recipient message controls (eligibility and pause).
 */
export const updateMessageSettings = onCall<UpdateMessageSettingsRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<UpdateMessageSettingsResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { eligibility, pauseMessages, actingAsBandId } = request.data ?? {};

    const callerContext = await verifySocialOperator(
      uid,
      undefined,
      actingAsBandId ? 'band' : 'fan',
      actingAsBandId,
      true,
    );

    const collectionName = callerContext.entityType === 'band' ? 'bands' : 'users';
    const settingsRef = db()
      .collection(collectionName)
      .doc(callerContext.entityId)
      .collection('settings')
      .doc('messaging');

    const updatePayload: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (eligibility !== undefined) updatePayload.eligibility = eligibility;
    if (pauseMessages !== undefined) updatePayload.pauseMessages = Boolean(pauseMessages);

    await settingsRef.set(updatePayload, { merge: true });

    const current = await getEntitySettings(callerContext.entityId, callerContext.entityType);
    return { ok: true, settings: current };
  },
);
