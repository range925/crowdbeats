/**
 * Crowdbeats V2 — Solo Musician Creator CRM Service (Phase 11)
 *
 * Implements server-authoritative supporter segmentation, tip analytics,
 * chronological engagement history, and privacy-respecting messaging
 * inside Creator Studio.
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import type {
  CreatorSupporterSummary,
  CreatorTipAnalytics,
  CreatorSupporterDetails,
  CreatorSupporterEngagementEvent,
  SupporterSegment,
  GetCreatorSupportersRequest,
  GetCreatorSupportersResponse,
  GetCreatorTipAnalyticsRequest,
  GetCreatorTipAnalyticsResponse,
  GetCreatorSupporterDetailsRequest,
  GetCreatorSupporterDetailsResponse,
  SendCreatorThankYouNoteRequest,
  SendCreatorThankYouNoteResponse,
} from '@crowdbeats/contracts';
import { dispatchServerNotification } from '../notifications/dispatchNotification.js';

export interface CallerContext {
  uid?: string;
  role?: string;
  email?: string;
}

export const CREATOR_CRM_SUPPORT_ROLES = [
  'SUPER_ADMIN',
  'CUSTOMER_SUPPORT',
  'ARTIST_RELATIONS',
] as const;

export function canAccessCreatorCrm(caller: CallerContext, targetCreatorId: string): boolean {
  if (!caller.uid) return false;
  if (caller.uid === targetCreatorId) return true;
  if (caller.role && (CREATOR_CRM_SUPPORT_ROLES as readonly string[]).includes(caller.role)) return true;
  return false;
}

// ─── Internal Supporter Accumulator ───────────────────────────────────────────

interface SupporterAccumulator {
  supporterId: string;
  isFollower: boolean;
  followedAt: string | null;
  tipsCount: number;
  totalTipsCents: number;
  firstTipAt: string | null;
  lastTipAt: string | null;
  campaignsCount: number;
  totalCampaignContributionCents: number;
  firstContributionAt: string | null;
  lastContributionAt: string | null;
  tipRecords: Array<{
    tipId: string;
    amountCents: number;
    createdAt: string;
    message?: string;
    sessionId?: string;
    isAnonymous?: boolean;
  }>;
  campaignRecords: Array<{
    contributionId: string;
    campaignId: string;
    campaignTitle: string;
    amountCents: number;
    createdAt: string;
  }>;
}

// ─── 1. GET CREATOR SUPPORTERS & TIP ANALYTICS ────────────────────────────────

export async function getCreatorSupporters(
  db: admin.firestore.Firestore,
  request: GetCreatorSupportersRequest,
  caller: CallerContext
): Promise<GetCreatorSupportersResponse> {
  const creatorId = request.creatorId || caller.uid;
  if (!creatorId) {
    throw new HttpsError('invalid-argument', 'Creator ID is required.');
  }

  if (!canAccessCreatorCrm(caller, creatorId)) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to access this creator CRM.');
  }

  const supportersMap = new Map<string, SupporterAccumulator>();

  const getOrCreateSupporter = (uid: string): SupporterAccumulator => {
    let s = supportersMap.get(uid);
    if (!s) {
      s = {
        supporterId: uid,
        isFollower: false,
        followedAt: null,
        tipsCount: 0,
        totalTipsCents: 0,
        firstTipAt: null,
        lastTipAt: null,
        campaignsCount: 0,
        totalCampaignContributionCents: 0,
        firstContributionAt: null,
        lastContributionAt: null,
        tipRecords: [],
        campaignRecords: [],
      };
      supportersMap.set(uid, s);
    }
    return s;
  };

  // ── A. Query Followers from /follows ────────────────────────────────────────
  try {
    const followsSnap = await db
      .collection('follows')
      .where('targetId', '==', creatorId)
      .limit(500)
      .get();

    followsSnap.forEach((doc) => {
      const d = doc.data();
      const fanUid = d.sourceId || d.fanUid;
      if (fanUid && typeof fanUid === 'string' && fanUid !== creatorId) {
        const s = getOrCreateSupporter(fanUid);
        s.isFollower = true;
        s.followedAt = d.createdAt || d.timestamp || null;
      }
    });

    // Also support legacy schema where artistId was used
    const legacyFollowsSnap = await db
      .collection('follows')
      .where('artistId', '==', creatorId)
      .limit(500)
      .get();

    legacyFollowsSnap.forEach((doc) => {
      const d = doc.data();
      const fanUid = d.fanUid || d.sourceId;
      if (fanUid && typeof fanUid === 'string' && fanUid !== creatorId) {
        const s = getOrCreateSupporter(fanUid);
        s.isFollower = true;
        if (!s.followedAt) s.followedAt = d.createdAt || d.timestamp || null;
      }
    });
  } catch {
    // Non-fatal query fallback
  }

  // ── B. Query Tips Received from /tips ───────────────────────────────────────
  const sessionTotalsMap = new Map<string, { totalCents: number; tipsCount: number; title: string }>();
  let totalTipsReceivedCents = 0;
  let totalTipsCount = 0;
  let recentTipsVolume30dCents = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const tipsSnap = await db
      .collection('tips')
      .where('recipientId', '==', creatorId)
      .limit(500)
      .get();

    tipsSnap.forEach((doc) => {
      const d = doc.data();
      const status = (d.status || '').toUpperCase();
      // Only count succeeded / completed tips
      if (status !== 'SUCCEEDED' && status !== 'COMPLETED' && status !== 'SUCCESS') {
        return;
      }

      const fanUid = d.fanUid || d.senderUid;
      const amountCents = Number(d.amountCents || (d.amount ? Math.round(Number(d.amount) * 100) : 0)) || 0;
      const createdAt = d.createdAt || new Date().toISOString();
      const sessionId = d.sessionId || null;
      const sessionTitle = d.sessionTitle || d.stageName || (sessionId ? `Session ${sessionId.slice(0, 8)}` : '');

      totalTipsReceivedCents += amountCents;
      totalTipsCount += 1;

      if (createdAt >= thirtyDaysAgo) {
        recentTipsVolume30dCents += amountCents;
      }

      if (sessionId) {
        const existingSession = sessionTotalsMap.get(sessionId) || { totalCents: 0, tipsCount: 0, title: sessionTitle };
        existingSession.totalCents += amountCents;
        existingSession.tipsCount += 1;
        if (sessionTitle && !existingSession.title) existingSession.title = sessionTitle;
        sessionTotalsMap.set(sessionId, existingSession);
      }

      if (fanUid && typeof fanUid === 'string' && fanUid !== creatorId) {
        const s = getOrCreateSupporter(fanUid);
        s.tipsCount += 1;
        s.totalTipsCents += amountCents;
        if (!s.firstTipAt || createdAt < s.firstTipAt) s.firstTipAt = createdAt;
        if (!s.lastTipAt || createdAt > s.lastTipAt) s.lastTipAt = createdAt;

        s.tipRecords.push({
          tipId: doc.id,
          amountCents,
          createdAt,
          message: d.message || d.note || '',
          sessionId,
          isAnonymous: Boolean(d.isAnonymous),
        });
      }
    });
  } catch {
    // Non-fatal query fallback
  }

  // ── C. Query Campaigns & Contributions ──────────────────────────────────────
  try {
    const campaignsSnap = await db
      .collection('campaigns')
      .where('creatorId', '==', creatorId)
      .limit(20)
      .get();

    for (const campaignDoc of campaignsSnap.docs) {
      const campaignData = campaignDoc.data();
      const campaignTitle = campaignData.title || 'Campaign';

      const contribSnap = await campaignDoc.ref
        .collection('contributions')
        .where('status', 'in', ['captured', 'succeeded', 'held', 'SUCCEEDED'])
        .limit(100)
        .get();

      contribSnap.forEach((cDoc) => {
        const c = cDoc.data();
        const fanUid = c.fanUid || c.contributorUid || c.userId;
        const amountCents = Number(c.amountCents || (c.amount ? Math.round(Number(c.amount) * 100) : 0)) || 0;
        const createdAt = c.createdAt || new Date().toISOString();

        if (fanUid && typeof fanUid === 'string' && fanUid !== creatorId) {
          const s = getOrCreateSupporter(fanUid);
          s.campaignsCount += 1;
          s.totalCampaignContributionCents += amountCents;
          if (!s.firstContributionAt || createdAt < s.firstContributionAt) s.firstContributionAt = createdAt;
          if (!s.lastContributionAt || createdAt > s.lastContributionAt) s.lastContributionAt = createdAt;

          s.campaignRecords.push({
            contributionId: cDoc.id,
            campaignId: campaignDoc.id,
            campaignTitle,
            amountCents,
            createdAt,
          });
        }
      });
    }
  } catch {
    // Non-fatal query fallback
  }

  // ── D. Fan Privacy & Consent Evaluation ─────────────────────────────────────
  const supporterSummaries: CreatorSupporterSummary[] = [];
  const supporterEntries = Array.from(supportersMap.values());

  for (const acc of supporterEntries) {
    let displayName = 'Crowdbeats Fan';
    let photoUrl: string | null = null;
    let fanAnonymousPreference = false;
    let allowDirectMessages = true;

    try {
      const userSnap = await db.collection('users').doc(acc.supporterId).get();
      if (userSnap.exists) {
        const u = userSnap.data()!;
        displayName = u.displayName || u.name || u.handle || 'Crowdbeats Fan';
        photoUrl = u.photoUrl || null;
        if (u.privacyPreferences) {
          fanAnonymousPreference = Boolean(u.privacyPreferences.anonymousTipping);
          if (u.privacyPreferences.allowDirectMessages === false) {
            allowDirectMessages = false;
          }
        }
        if (u.allowDirectMessages === false) {
          allowDirectMessages = false;
        }
      }
    } catch {
      // Non-fatal fallback for user doc fetch
    }

    // Determine anonymity: if fan user has anonymous preference OR all tips were anonymous
    const allTipsAnonymous = acc.tipRecords.length > 0 && acc.tipRecords.every((t) => t.isAnonymous);
    const isAnonymous = fanAnonymousPreference || allTipsAnonymous;

    if (isAnonymous) {
      displayName = 'Anonymous Supporter';
      photoUrl = null;
      allowDirectMessages = false; // Cannot DM anonymous supporters
    }

    const lifetimeValueCents = acc.totalTipsCents + acc.totalCampaignContributionCents;
    const firstDates = [acc.firstTipAt, acc.firstContributionAt, acc.followedAt].filter(Boolean) as string[];
    const firstSupportedAt = firstDates.length > 0 ? firstDates.sort()[0] : null;

    const lastDates = [acc.lastTipAt, acc.lastContributionAt].filter(Boolean) as string[];
    const lastSupportedAt = lastDates.length > 0 ? lastDates.sort().reverse()[0] : null;

    // Segment calculation
    let segment: SupporterSegment = 'FOLLOWER_ONLY';
    if (lifetimeValueCents >= 5000) {
      segment = 'TOP_SUPPORTER';
    } else if ((acc.tipsCount + acc.campaignsCount) >= 2) {
      segment = 'REPEAT_SUPPORTER';
    } else if (lastSupportedAt && lastSupportedAt >= thirtyDaysAgo) {
      segment = 'RECENT_SUPPORTER';
    } else if (acc.campaignsCount > 0) {
      segment = 'CAMPAIGN_BACKER';
    } else if (acc.isFollower) {
      segment = 'FOLLOWER_ONLY';
    }

    supporterSummaries.push({
      supporterId: acc.supporterId,
      displayName,
      photoUrl,
      segment,
      isFollower: acc.isFollower,
      followedAt: acc.followedAt,
      totalTipsCents: acc.totalTipsCents,
      tipsCount: acc.tipsCount,
      totalCampaignContributionCents: acc.totalCampaignContributionCents,
      campaignsCount: acc.campaignsCount,
      lifetimeValueCents,
      firstSupportedAt,
      lastSupportedAt,
      isAnonymous,
      allowsDirectMessaging: allowDirectMessages,
    });
  }

  // ── E. Compute Tip Analytics ────────────────────────────────────────────────
  const repeatSupportersCount = supporterSummaries.filter(
    (s) => s.segment === 'REPEAT_SUPPORTER' || (s.tipsCount + s.campaignsCount) >= 2
  ).length;
  const topSupportersCount = supporterSummaries.filter(
    (s) => s.segment === 'TOP_SUPPORTER' || s.lifetimeValueCents >= 5000
  ).length;
  const payingSupportersCount = supporterSummaries.filter((s) => s.lifetimeValueCents > 0).length;

  const repeatSupporterRatePct =
    payingSupportersCount > 0
      ? Number(((repeatSupportersCount / payingSupportersCount) * 100).toFixed(1))
      : 0;

  const averageTipCents =
    totalTipsCount > 0 ? Math.round(totalTipsReceivedCents / totalTipsCount) : 0;

  let topTippingSession: CreatorTipAnalytics['topTippingSession'] = null;
  let maxSessionCents = 0;
  for (const [sessId, stats] of sessionTotalsMap.entries()) {
    if (stats.totalCents > maxSessionCents) {
      maxSessionCents = stats.totalCents;
      topTippingSession = {
        sessionId: sessId,
        sessionTitle: stats.title || `Session ${sessId.slice(0, 8)}`,
        totalCents: stats.totalCents,
        tipsCount: stats.tipsCount,
      };
    }
  }

  const analytics: CreatorTipAnalytics = {
    totalTipsReceivedCents,
    totalTipsCount,
    averageTipCents,
    repeatSupporterRatePct,
    repeatSupportersCount,
    topSupportersCount,
    recentTipsVolume30dCents,
    topTippingSession,
  };

  // ── F. Apply Filters & Sorting ──────────────────────────────────────────────
  let filteredSupporters = supporterSummaries;

  if (request.segmentFilter && request.segmentFilter !== 'all') {
    switch (request.segmentFilter) {
      case 'repeat':
        filteredSupporters = filteredSupporters.filter(
          (s) => s.segment === 'REPEAT_SUPPORTER' || (s.tipsCount + s.campaignsCount) >= 2
        );
        break;
      case 'top':
        filteredSupporters = filteredSupporters.filter(
          (s) => s.segment === 'TOP_SUPPORTER' || s.lifetimeValueCents >= 5000
        );
        break;
      case 'followers':
        filteredSupporters = filteredSupporters.filter((s) => s.isFollower);
        break;
      case 'campaign':
        filteredSupporters = filteredSupporters.filter((s) => s.campaignsCount > 0);
        break;
    }
  }

  if (request.searchQuery && request.searchQuery.trim().length > 0) {
    const q = request.searchQuery.trim().toLowerCase();
    filteredSupporters = filteredSupporters.filter((s) =>
      s.displayName.toLowerCase().includes(q)
    );
  }

  // Sort by lifetime value descending, then by last supported date descending
  filteredSupporters.sort((a, b) => {
    if (b.lifetimeValueCents !== a.lifetimeValueCents) {
      return b.lifetimeValueCents - a.lifetimeValueCents;
    }
    const dateA = a.lastSupportedAt || a.firstSupportedAt || '';
    const dateB = b.lastSupportedAt || b.firstSupportedAt || '';
    return dateB.localeCompare(dateA);
  });

  const maxLimit = request.limit && request.limit > 0 ? request.limit : 100;
  const paginatedSupporters = filteredSupporters.slice(0, maxLimit);

  return {
    ok: true,
    creatorId,
    supporters: paginatedSupporters,
    totalCount: filteredSupporters.length,
    analytics,
  };
}

// ─── 2. GET CREATOR TIP ANALYTICS ─────────────────────────────────────────────

export async function getCreatorTipAnalytics(
  db: admin.firestore.Firestore,
  request: GetCreatorTipAnalyticsRequest,
  caller: CallerContext
): Promise<GetCreatorTipAnalyticsResponse> {
  const creatorId = request.creatorId || caller.uid;
  if (!creatorId) {
    throw new HttpsError('invalid-argument', 'Creator ID is required.');
  }

  if (!canAccessCreatorCrm(caller, creatorId)) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to access this creator analytics.');
  }

  const supportersRes = await getCreatorSupporters(db, { creatorId, limit: 1 }, caller);

  return {
    ok: true,
    creatorId,
    analytics: supportersRes.analytics,
  };
}

// ─── 3. GET CREATOR SUPPORTER DETAILS ─────────────────────────────────────────

export async function getCreatorSupporterDetails(
  db: admin.firestore.Firestore,
  request: GetCreatorSupporterDetailsRequest,
  caller: CallerContext
): Promise<GetCreatorSupporterDetailsResponse> {
  const creatorId = request.creatorId || caller.uid;
  const { supporterId } = request;

  if (!creatorId || !supporterId) {
    throw new HttpsError('invalid-argument', 'Creator ID and Supporter ID are required.');
  }

  if (!canAccessCreatorCrm(caller, creatorId)) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to view this supporter dossier.');
  }

  // Fetch full supporter list to aggregate data
  const supportersRes = await getCreatorSupporters(db, { creatorId, limit: 500 }, caller);
  const supporter = supportersRes.supporters.find((s) => s.supporterId === supporterId);

  if (!supporter) {
    throw new HttpsError('not-found', `Supporter ${supporterId} not found for this creator.`);
  }

  const engagementHistory: CreatorSupporterEngagementEvent[] = [];
  const tipBreakdown: CreatorSupporterDetails['tipBreakdown'] = [];
  const campaignContributions: CreatorSupporterDetails['campaignContributions'] = [];

  // 1. Follow event
  if (supporter.isFollower && supporter.followedAt) {
    engagementHistory.push({
      eventId: `eng_follow_${supporterId}`,
      type: 'STARTED_FOLLOWING',
      timestamp: supporter.followedAt,
      summary: 'Started following your artist profile',
    });
  }

  // 2. Fetch specific tips for breakdown
  try {
    const tipsSnap = await db
      .collection('tips')
      .where('recipientId', '==', creatorId)
      .where('fanUid', '==', supporterId)
      .limit(100)
      .get();

    tipsSnap.forEach((doc) => {
      const d = doc.data();
      const status = (d.status || '').toUpperCase();
      if (status !== 'SUCCEEDED' && status !== 'COMPLETED' && status !== 'SUCCESS') return;

      const amountCents = Number(d.amountCents || (d.amount ? Math.round(Number(d.amount) * 100) : 0)) || 0;
      const createdAt = d.createdAt || new Date().toISOString();
      const sessionId = d.sessionId || undefined;
      const message = d.message || d.note || undefined;

      tipBreakdown.push({
        tipId: doc.id,
        amountCents,
        createdAt,
        message,
        sessionId,
      });

      engagementHistory.push({
        eventId: `eng_tip_${doc.id}`,
        type: 'TIP_RECEIVED',
        timestamp: createdAt,
        amountCents,
        summary: `Tipped $${(amountCents / 100).toFixed(2)}${sessionId ? ' during live stage session' : ''}`,
        metadata: { sessionId, message },
      });
    });
  } catch {
    // Non-fatal
  }

  // 3. Fetch specific campaign contributions
  try {
    const campaignsSnap = await db
      .collection('campaigns')
      .where('creatorId', '==', creatorId)
      .limit(20)
      .get();

    for (const campaignDoc of campaignsSnap.docs) {
      const campaignTitle = campaignDoc.data().title || 'Campaign';

      const contribSnap = await campaignDoc.ref
        .collection('contributions')
        .where('fanUid', '==', supporterId)
        .where('status', 'in', ['captured', 'succeeded', 'held', 'SUCCEEDED'])
        .limit(20)
        .get();

      contribSnap.forEach((cDoc) => {
        const c = cDoc.data();
        const amountCents = Number(c.amountCents || (c.amount ? Math.round(Number(c.amount) * 100) : 0)) || 0;
        const createdAt = c.createdAt || new Date().toISOString();

        campaignContributions.push({
          contributionId: cDoc.id,
          campaignId: campaignDoc.id,
          campaignTitle,
          amountCents,
          createdAt,
        });

        engagementHistory.push({
          eventId: `eng_camp_${cDoc.id}`,
          type: 'CAMPAIGN_BACKED',
          timestamp: createdAt,
          amountCents,
          summary: `Backed campaign "${campaignTitle}" with $${(amountCents / 100).toFixed(2)}`,
          metadata: { campaignId: campaignDoc.id, campaignTitle },
        });
      });
    }
  } catch {
    // Non-fatal
  }

  // Sort engagement history descending
  engagementHistory.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  tipBreakdown.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  campaignContributions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    ok: true,
    details: {
      supporter,
      engagementHistory,
      tipBreakdown,
      campaignContributions,
    },
  };
}

// ─── 4. SEND CREATOR THANK YOU NOTE ───────────────────────────────────────────

export async function sendCreatorThankYouNote(
  db: admin.firestore.Firestore,
  request: SendCreatorThankYouNoteRequest,
  caller: CallerContext
): Promise<SendCreatorThankYouNoteResponse> {
  const creatorId = request.creatorId || caller.uid;
  const { supporterId, message } = request;

  if (!creatorId || !supporterId || !message?.trim()) {
    throw new HttpsError('invalid-argument', 'Creator ID, Supporter ID, and Message are required.');
  }

  if (!canAccessCreatorCrm(caller, creatorId)) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to send messages on behalf of this creator.');
  }

  // Verify supporter privacy & consent
  const userSnap = await db.collection('users').doc(supporterId).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Supporter user not found.');
  }

  const u = userSnap.data()!;
  if (u.privacyPreferences?.allowDirectMessages === false || u.allowDirectMessages === false) {
    throw new HttpsError('failed-precondition', 'Fan privacy settings do not permit direct messages.');
  }
  if (u.privacyPreferences?.anonymousTipping === true) {
    throw new HttpsError('failed-precondition', 'Cannot message an anonymous supporter.');
  }

  const nowIso = new Date().toISOString();
  const participantIds: [string, string] = [creatorId, supporterId].sort() as [string, string];
  const convId = `${participantIds[0]}_${participantIds[1]}`;

  const convRef = db.collection('conversations').doc(convId);
  const msgRef = convRef.collection('messages').doc();

  const batch = db.batch();

  // 1. Update or create conversation document
  batch.set(
    convRef,
    {
      conversationId: convId,
      participantIds,
      participants: {
        [creatorId]: 'artist',
        [supporterId]: 'fan',
      },
      lastMessage: {
        messageId: msgRef.id,
        senderId: creatorId,
        senderType: 'artist',
        text: message.trim(),
        sentAt: nowIso,
      },
      updatedAt: nowIso,
    },
    { merge: true }
  );

  // 2. Insert message document
  batch.set(msgRef, {
    messageId: msgRef.id,
    conversationId: convId,
    senderId: creatorId,
    senderType: 'artist',
    recipientId: supporterId,
    recipientType: 'fan',
    text: message.trim(),
    sentAt: nowIso,
    isThankYouNote: true,
  });

  // 3. Emit CRM event
  const crmRef = db.collection('crmEvents').doc();
  batch.set(crmRef, {
    eventId: crmRef.id,
    eventType: 'CREATOR_MESSAGE_SENT',
    source: 'creator_studio_crm',
    targetId: supporterId,
    targetType: 'fan',
    actorUid: creatorId,
    timestamp: nowIso,
    payload: {
      supporterId,
      creatorId,
      messageLength: message.trim().length,
    },
  });

  await batch.commit();

  // 4. Send notification to fan
  try {
    await dispatchServerNotification({
      recipientUid: supporterId,
      type: 'creator_thank_you_note',
      title: '💌 Note from Musician',
      body: message.trim().slice(0, 100),
      data: { conversationId: convId, creatorId },
      clickAction: `/messages?convId=${convId}`,
    });
  } catch {
    // Non-blocking notification dispatch
  }

  return {
    ok: true,
    messageId: msgRef.id,
    conversationId: convId,
    deliveredAt: nowIso,
  };
}
