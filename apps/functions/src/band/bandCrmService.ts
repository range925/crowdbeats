/**
 * Crowdbeats V2 — Band CRM & Member Management Service (Phase 12)
 *
 * Implements server-authoritative band supporter segmentation, tip analytics,
 * chronological engagement history, shared band activity, and privacy-respecting
 * messaging inside Band Studio.
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import type {
  BandSupporterSummary,
  BandTipAnalytics,
  BandSupporterDetails,
  BandActivityEvent,
  BandActivityEventType,
  SupporterSegment,
  GetBandSupportersRequest,
  GetBandSupportersResponse,
  GetBandSupporterDetailsRequest,
  GetBandSupporterDetailsResponse,
  SendBandThankYouNoteRequest,
  SendBandThankYouNoteResponse,
  GetBandActivityRequest,
  GetBandActivityResponse,
  CreatorSupporterEngagementEvent,
} from '@crowdbeats/contracts';
import { dispatchServerNotification } from '../notifications/dispatchNotification.js';

export interface CallerContext {
  uid?: string;
  role?: string;
  email?: string;
}

export const BAND_CRM_SUPPORT_ROLES = [
  'SUPER_ADMIN',
  'CUSTOMER_SUPPORT',
  'ARTIST_RELATIONS',
  'FINANCE_ANALYST',
] as const;

export async function canAccessBandCrm(
  db: admin.firestore.Firestore,
  caller: CallerContext,
  bandId: string
): Promise<{ authorized: boolean; memberRole?: string }> {
  if (!caller.uid) return { authorized: false };

  // Staff bypass
  if (caller.role && (BAND_CRM_SUPPORT_ROLES as readonly string[]).includes(caller.role)) {
    return { authorized: true, memberRole: 'STAFF' };
  }

  // Check band active membership
  const memberDoc = await db
    .collection('bands')
    .doc(bandId)
    .collection('members')
    .doc(caller.uid)
    .get();

  if (memberDoc.exists && memberDoc.data()?.['isActive'] === true) {
    const role = (memberDoc.data()?.['role'] as string) || 'BAND_MEMBER';
    return { authorized: true, memberRole: role };
  }

  return { authorized: false };
}

// ─── Shared Band Activity Recorder ───────────────────────────────────────────

export async function recordBandActivity(
  db: admin.firestore.Firestore,
  bandId: string,
  event: {
    type: BandActivityEventType;
    title: string;
    description: string;
    actorUid?: string;
    actorName?: string;
    amountCents?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const activityRef = db.collection('bands').doc(bandId).collection('activity').doc();
  const now = new Date().toISOString();

  await activityRef.set({
    eventId: activityRef.id,
    bandId,
    type: event.type,
    title: event.title,
    description: event.description,
    actorUid: event.actorUid || null,
    actorName: event.actorName || null,
    amountCents: event.amountCents ?? null,
    timestamp: now,
    metadata: event.metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return activityRef.id;
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

// ─── 1. GET BAND SUPPORTERS & TIP ANALYTICS ──────────────────────────────────

export async function getBandSupporters(
  db: admin.firestore.Firestore,
  request: GetBandSupportersRequest,
  caller: CallerContext
): Promise<GetBandSupportersResponse> {
  const { bandId } = request;
  if (!bandId) {
    throw new HttpsError('invalid-argument', 'bandId is required.');
  }

  const access = await canAccessBandCrm(db, caller, bandId);
  if (!access.authorized) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to access this band CRM.');
  }

  const bandDoc = await db.collection('bands').doc(bandId).get();
  if (!bandDoc.exists) {
    throw new HttpsError('not-found', 'Band not found.');
  }
  const bandName = (bandDoc.data()?.['name'] as string) || 'Band';

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

  // ── A. Query Band Followers from /follows ───────────────────────────────────
  try {
    const followsSnap = await db
      .collection('follows')
      .where('targetEntityId', '==', bandId)
      .where('status', '==', 'active')
      .get();

    for (const fDoc of followsSnap.docs) {
      const data = fDoc.data();
      const fanUid = data['followerUid'] || data['uid'] || fDoc.id;
      if (fanUid) {
        const acc = getOrCreateSupporter(fanUid);
        acc.isFollower = true;
        acc.followedAt = data['createdAt'] || null;
      }
    }
  } catch (err) {
    console.warn(`[getBandSupporters] Follows query error for band ${bandId}:`, err);
  }

  // ── B. Query Tips for the Band from /tips ────────────────────────────────────
  const sessionTipStats = new Map<string, { title: string; totalCents: number; count: number }>();

  try {
    // 1. Direct bandId matches
    const tipsSnap = await db
      .collection('tips')
      .where('bandId', '==', bandId)
      .where('status', '==', 'succeeded')
      .get();

    for (const tDoc of tipsSnap.docs) {
      const t = tDoc.data();
      const fanUid = t['fanUid'] || t['senderUid'] || t['userId'] || 'anonymous';
      const amountCents = (t['amountCents'] as number) || 0;
      const createdAt = t['createdAt'] || new Date().toISOString();
      const isAnon = t['isAnonymous'] === true;
      const sessionId = t['sessionId'] || t['liveSessionId'];
      const sessionTitle = t['sessionTitle'] || 'Live Stage Set';

      if (sessionId) {
        const cur = sessionTipStats.get(sessionId) || { title: sessionTitle, totalCents: 0, count: 0 };
        cur.totalCents += amountCents;
        cur.count += 1;
        sessionTipStats.set(sessionId, cur);
      }

      if (fanUid) {
        const acc = getOrCreateSupporter(fanUid);
        acc.tipsCount += 1;
        acc.totalTipsCents += amountCents;
        if (!acc.firstTipAt || createdAt < acc.firstTipAt) acc.firstTipAt = createdAt;
        if (!acc.lastTipAt || createdAt > acc.lastTipAt) acc.lastTipAt = createdAt;
        acc.tipRecords.push({
          tipId: tDoc.id,
          amountCents,
          createdAt,
          message: t['fanMessage'] || t['message'],
          sessionId,
          isAnonymous: isAnon,
        });
      }
    }
  } catch (err) {
    console.warn(`[getBandSupporters] Tips query error for band ${bandId}:`, err);
  }

  // ── C. Query Band Campaigns & Contributions ─────────────────────────────────
  try {
    const campaignsSnap = await db
      .collection('campaigns')
      .where('bandId', '==', bandId)
      .get();

    for (const cDoc of campaignsSnap.docs) {
      const cData = cDoc.data();
      const campaignTitle = cData['title'] || 'Band Crowdfunding Campaign';

      const contribSnap = await cDoc.ref.collection('contributions').get();
      for (const cbDoc of contribSnap.docs) {
        const cb = cbDoc.data();
        const fanUid = cb['fanUid'] || cb['userId'];
        const amountCents = (cb['amountCents'] as number) || 0;
        const createdAt = cb['createdAt'] || new Date().toISOString();

        if (fanUid) {
          const acc = getOrCreateSupporter(fanUid);
          acc.campaignsCount += 1;
          acc.totalCampaignContributionCents += amountCents;
          if (!acc.firstContributionAt || createdAt < acc.firstContributionAt) {
            acc.firstContributionAt = createdAt;
          }
          if (!acc.lastContributionAt || createdAt > acc.lastContributionAt) {
            acc.lastContributionAt = createdAt;
          }
          acc.campaignRecords.push({
            contributionId: cbDoc.id,
            campaignId: cDoc.id,
            campaignTitle,
            amountCents,
            createdAt,
          });
        }
      }
    }
  } catch (err) {
    console.warn(`[getBandSupporters] Campaigns query error for band ${bandId}:`, err);
  }

  // ── D. Enrich User Identity & Respect Fan Consent/Privacy ───────────────────
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const supporterSummaries: BandSupporterSummary[] = [];

  for (const [supporterId, acc] of supportersMap.entries()) {
    const userDoc = await db.collection('users').doc(supporterId).get();
    const uData = userDoc.exists ? userDoc.data()! : {};

    // Privacy & Anonymity check
    const isAnonPreference = uData['privacyPreferences']?.['anonymousTipping'] === true;
    const isAnonUser = uData['isAnonymous'] === true;
    const isAnonSupporter = isAnonPreference || isAnonUser || supporterId === 'anonymous';

    // Direct Messaging consent check
    const allowsDirectMessaging =
      !isAnonSupporter && uData['privacyPreferences']?.['allowDirectMessages'] !== false;

    const lifetimeValueCents = acc.totalTipsCents + acc.totalCampaignContributionCents;

    // First and last support timestamps
    const dates = [
      acc.firstTipAt,
      acc.firstContributionAt,
      acc.lastTipAt,
      acc.lastContributionAt,
      acc.followedAt,
    ].filter(Boolean) as string[];

    dates.sort();
    const firstSupportedAt = dates[0] || null;
    const lastSupportedAt = dates[dates.length - 1] || null;

    // Determine segment
    let segment: SupporterSegment = 'FOLLOWER_ONLY';
    if (lifetimeValueCents >= 5000) {
      segment = 'TOP_SUPPORTER';
    } else if (acc.tipsCount + acc.campaignsCount >= 2) {
      segment = 'REPEAT_SUPPORTER';
    } else if (lastSupportedAt && lastSupportedAt >= thirtyDaysAgoIso && lifetimeValueCents > 0) {
      segment = 'RECENT_SUPPORTER';
    } else if (acc.campaignsCount > 0) {
      segment = 'CAMPAIGN_BACKER';
    }

    supporterSummaries.push({
      supporterId,
      displayName: isAnonSupporter ? 'Anonymous Supporter' : (uData['displayName'] as string) || 'Supporter',
      photoUrl: isAnonSupporter ? null : (uData['photoUrl'] as string) || null,
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
      isAnonymous: isAnonSupporter,
      allowsDirectMessaging,
    });
  }

  // ── E. Compute Tip Analytics ────────────────────────────────────────────────
  let totalTipsReceivedCents = 0;
  let totalTipsCount = 0;
  let repeatSupportersCount = 0;
  let topSupportersCount = 0;
  let recentTipsVolume30dCents = 0;

  for (const s of supporterSummaries) {
    totalTipsReceivedCents += s.totalTipsCents;
    totalTipsCount += s.tipsCount;

    if (s.tipsCount + s.campaignsCount >= 2) repeatSupportersCount += 1;
    if (s.segment === 'TOP_SUPPORTER') topSupportersCount += 1;
    if (s.lastSupportedAt && s.lastSupportedAt >= thirtyDaysAgoIso) {
      recentTipsVolume30dCents += s.totalTipsCents;
    }
  }

  const averageTipCents = totalTipsCount > 0 ? Math.round(totalTipsReceivedCents / totalTipsCount) : 0;
  const repeatSupporterRatePct =
    supporterSummaries.length > 0
      ? Math.round((repeatSupportersCount / supporterSummaries.length) * 100)
      : 0;

  let topTippingSession: BandTipAnalytics['topTippingSession'] = null;
  let maxSessionCents = 0;
  for (const [sessionId, stat] of sessionTipStats.entries()) {
    if (stat.totalCents > maxSessionCents) {
      maxSessionCents = stat.totalCents;
      topTippingSession = {
        sessionId,
        sessionTitle: stat.title,
        totalCents: stat.totalCents,
        tipsCount: stat.count,
      };
    }
  }

  const analytics: BandTipAnalytics = {
    totalTipsReceivedCents,
    totalTipsCount,
    averageTipCents,
    repeatSupporterRatePct,
    repeatSupportersCount,
    topSupportersCount,
    recentTipsVolume30dCents,
    topTippingSession,
  };

  // ── F. Apply Segment Filters & Search ───────────────────────────────────────
  let filteredSupporters = [...supporterSummaries];

  if (request.segmentFilter && request.segmentFilter !== 'all') {
    switch (request.segmentFilter) {
      case 'repeat':
        filteredSupporters = filteredSupporters.filter((s) => s.segment === 'REPEAT_SUPPORTER');
        break;
      case 'top':
        filteredSupporters = filteredSupporters.filter((s) => s.segment === 'TOP_SUPPORTER');
        break;
      case 'campaign':
        filteredSupporters = filteredSupporters.filter((s) => s.segment === 'CAMPAIGN_BACKER');
        break;
      case 'followers':
        filteredSupporters = filteredSupporters.filter((s) => s.segment === 'FOLLOWER_ONLY');
        break;
    }
  }

  if (request.searchQuery && request.searchQuery.trim()) {
    const q = request.searchQuery.trim().toLowerCase();
    filteredSupporters = filteredSupporters.filter((s) => s.displayName.toLowerCase().includes(q));
  }

  // Sort by lifetime value descending
  filteredSupporters.sort((a, b) => b.lifetimeValueCents - a.lifetimeValueCents);

  if (request.limit && request.limit > 0) {
    filteredSupporters = filteredSupporters.slice(0, request.limit);
  }

  return {
    ok: true,
    bandId,
    bandName,
    supporters: filteredSupporters,
    totalCount: supporterSummaries.length,
    analytics,
  };
}

// ─── 2. GET BAND SUPPORTER DETAILS & DOSSIER ─────────────────────────────────

export async function getBandSupporterDetails(
  db: admin.firestore.Firestore,
  request: GetBandSupporterDetailsRequest,
  caller: CallerContext
): Promise<GetBandSupporterDetailsResponse> {
  const { bandId, supporterId } = request;
  if (!bandId || !supporterId) {
    throw new HttpsError('invalid-argument', 'bandId and supporterId are required.');
  }

  const access = await canAccessBandCrm(db, caller, bandId);
  if (!access.authorized) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to access this band CRM.');
  }

  const fullData = await getBandSupporters(db, { bandId }, caller);
  const supporter = fullData.supporters.find((s) => s.supporterId === supporterId);

  if (!supporter) {
    throw new HttpsError('not-found', 'Supporter not found in band records.');
  }

  const engagementHistory: CreatorSupporterEngagementEvent[] = [];

  // Follow event
  if (supporter.isFollower && supporter.followedAt) {
    engagementHistory.push({
      eventId: `evt_follow_${supporterId}`,
      type: 'STARTED_FOLLOWING',
      timestamp: supporter.followedAt,
      summary: 'Started following the band.',
    });
  }

  // Tip items
  const tipBreakdown: BandSupporterDetails['tipBreakdown'] = [];
  try {
    const tipsSnap = await db
      .collection('tips')
      .where('bandId', '==', bandId)
      .where('fanUid', '==', supporterId)
      .where('status', '==', 'succeeded')
      .get();

    for (const tDoc of tipsSnap.docs) {
      const t = tDoc.data();
      const amountCents = (t['amountCents'] as number) || 0;
      const createdAt = t['createdAt'] || new Date().toISOString();
      const message = t['fanMessage'] || t['message'];
      const sessionId = t['sessionId'] || t['liveSessionId'];
      const sessionTitle = t['sessionTitle'] || 'Live Stage Set';

      tipBreakdown.push({
        tipId: tDoc.id,
        amountCents,
        createdAt,
        message,
        sessionId,
      });

      engagementHistory.push({
        eventId: `evt_tip_${tDoc.id}`,
        type: 'TIP_RECEIVED',
        timestamp: createdAt,
        amountCents,
        summary: `Tipped $${(amountCents / 100).toFixed(2)}${sessionId ? ` during "${sessionTitle}"` : ''}${message ? ` — "${message}"` : ''}`,
        metadata: {
          sessionId,
          sessionTitle,
          fanMessage: message,
        },
      });
    }
  } catch (err) {
    console.warn(`[getBandSupporterDetails] Tip history query error:`, err);
  }

  // Campaign items
  const campaignContributions: BandSupporterDetails['campaignContributions'] = [];
  try {
    const campaignsSnap = await db
      .collection('campaigns')
      .where('bandId', '==', bandId)
      .get();

    for (const cDoc of campaignsSnap.docs) {
      const cData = cDoc.data();
      const campaignTitle = cData['title'] || 'Band Crowdfunding';

      const contribSnap = await cDoc.ref
        .collection('contributions')
        .where('fanUid', '==', supporterId)
        .get();

      for (const cbDoc of contribSnap.docs) {
        const cb = cbDoc.data();
        const amountCents = (cb['amountCents'] as number) || 0;
        const createdAt = cb['createdAt'] || new Date().toISOString();

        campaignContributions.push({
          contributionId: cbDoc.id,
          campaignId: cDoc.id,
          campaignTitle,
          amountCents,
          createdAt,
        });

        engagementHistory.push({
          eventId: `evt_camp_${cbDoc.id}`,
          type: 'CAMPAIGN_BACKED',
          timestamp: createdAt,
          amountCents,
          summary: `Backed campaign "${campaignTitle}" with $${(amountCents / 100).toFixed(2)}.`,
          metadata: {
            campaignId: cDoc.id,
            campaignTitle,
          },
        });
      }
    }
  } catch (err) {
    console.warn(`[getBandSupporterDetails] Campaign history query error:`, err);
  }

  // Sort chronological timeline (newest first)
  engagementHistory.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
  tipBreakdown.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  campaignContributions.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  return {
    ok: true,
    bandId,
    details: {
      supporter,
      engagementHistory,
      tipBreakdown,
      campaignContributions,
    },
  };
}

// ─── 3. SEND BAND THANK-YOU NOTE (CONSENT-ENFORCED) ──────────────────────────

export async function sendBandThankYouNote(
  db: admin.firestore.Firestore,
  request: SendBandThankYouNoteRequest,
  caller: CallerContext
): Promise<SendBandThankYouNoteResponse> {
  const { bandId, supporterId, message } = request;
  if (!bandId || !supporterId || !message || !message.trim()) {
    throw new HttpsError('invalid-argument', 'bandId, supporterId, and a non-empty message are required.');
  }

  const access = await canAccessBandCrm(db, caller, bandId);
  if (!access.authorized) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to send messages for this band.');
  }

  const bandDoc = await db.collection('bands').doc(bandId).get();
  if (!bandDoc.exists) {
    throw new HttpsError('not-found', 'Band not found.');
  }
  const bandName = (bandDoc.data()?.['name'] as string) || 'Band';

  // 1. Check fan privacy & consent
  const fanDoc = await db.collection('users').doc(supporterId).get();
  if (!fanDoc.exists) {
    throw new HttpsError('not-found', 'Supporter user profile not found.');
  }
  const fanData = fanDoc.data()!;

  if (fanData['privacyPreferences']?.['anonymousTipping'] === true || fanData['isAnonymous'] === true) {
    throw new HttpsError('failed-precondition', 'Cannot contact fans who supported anonymously.');
  }

  if (fanData['privacyPreferences']?.['allowDirectMessages'] === false) {
    throw new HttpsError('failed-precondition', 'Fan has opted out of direct messages.');
  }

  // 2. Deliver message into /conversations acting as band
  const convId = [bandId, supporterId].sort().join('_');
  const convRef = db.collection('conversations').doc(convId);
  const now = new Date().toISOString();

  await convRef.set(
    {
      participants: [bandId, supporterId],
      participantNames: {
        [bandId]: bandName,
        [supporterId]: (fanData['displayName'] as string) || 'Fan',
      },
      lastMessage: message.trim(),
      lastMessageTimestamp: now,
      updatedAt: now,
    },
    { merge: true }
  );

  const msgRef = convRef.collection('messages').doc();
  await msgRef.set({
    messageId: msgRef.id,
    conversationId: convId,
    senderUid: caller.uid,
    senderName: bandName,
    actingAsBandId: bandId,
    text: message.trim(),
    createdAt: now,
    read: false,
  });

  // 3. Emit CRM audit event
  const crmEventRef = db.collection('crmEvents').doc();
  await crmEventRef.set({
    eventId: crmEventRef.id,
    eventType: 'BAND_MESSAGE_SENT',
    source: 'band_crm',
    actorUid: caller.uid,
    actorName: bandName,
    targetUid: supporterId,
    targetType: 'fan',
    summary: `Band "${bandName}" sent a thank-you note to fan ${fanData['displayName'] || supporterId}`,
    metadata: {
      bandId,
      conversationId: convId,
      messageId: msgRef.id,
    },
    timestamp: now,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 4. Dispatch notification to fan
  await dispatchServerNotification({
    recipientUid: supporterId,
    type: 'MESSAGE',
    title: `New message from ${bandName}`,
    body: message.trim().slice(0, 100),
    data: {
      conversationId: convId,
      actingAsBandId: bandId,
    },
  });

  return {
    ok: true,
    conversationId: convId,
    messageId: msgRef.id,
    sentAt: now,
  };
}

// ─── 4. GET BAND ACTIVITY FEED ───────────────────────────────────────────────

export async function getBandActivity(
  db: admin.firestore.Firestore,
  request: GetBandActivityRequest,
  caller: CallerContext
): Promise<GetBandActivityResponse> {
  const { bandId, filter, limit = 50 } = request;
  if (!bandId) {
    throw new HttpsError('invalid-argument', 'bandId is required.');
  }

  const access = await canAccessBandCrm(db, caller, bandId);
  if (!access.authorized) {
    throw new HttpsError('permission-denied', 'Caller is not authorized to access this band activity.');
  }

  let activities: BandActivityEvent[] = [];

  try {
    const actSnap = await db
      .collection('bands')
      .doc(bandId)
      .collection('activity')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    for (const doc of actSnap.docs) {
      const d = doc.data();
      activities.push({
        eventId: doc.id,
        bandId,
        type: d['type'] || 'MEMBER_JOINED',
        title: d['title'] || 'Band Activity',
        description: d['description'] || '',
        actorUid: d['actorUid'],
        actorName: d['actorName'],
        amountCents: d['amountCents'],
        timestamp: d['timestamp'] || new Date().toISOString(),
        metadata: d['metadata'],
      });
    }
  } catch (err) {
    console.warn(`[getBandActivity] Activity collection query error for band ${bandId}:`, err);
  }

  // Also query /bands/{bandId}/auditLogs to include governance records
  try {
    const auditSnap = await db
      .collection('bands')
      .doc(bandId)
      .collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    for (const doc of auditSnap.docs) {
      const d = doc.data();
      const action = d['action'] as string;
      let type: BandActivityEventType = 'MEMBER_JOINED';
      let title = 'Band Governance Event';
      let desc = '';

      switch (action) {
        case 'MEMBER_INVITED':
          type = 'INVITATION_SENT';
          title = 'Member Invitation Dispatched';
          desc = `Invited ${d['details']?.['email'] || 'member'} as ${d['details']?.['role'] || 'BAND_MEMBER'}`;
          break;
        case 'MEMBER_JOINED':
          type = 'MEMBER_JOINED';
          title = 'New Band Member Joined';
          desc = `${d['details']?.['displayName'] || 'Member'} joined with role ${d['details']?.['role'] || 'BAND_MEMBER'}`;
          break;
        case 'ROLE_UPDATED':
          type = 'ROLE_UPDATED';
          title = 'Member Role Updated';
          desc = `Member role updated to ${d['details']?.['newRole'] || 'BAND_MEMBER'}`;
          break;
        case 'MEMBER_REMOVED':
          type = 'MEMBER_LEFT';
          title = 'Member Departed';
          desc = `Member removed from active roster. Reason: ${d['details']?.['reason'] || 'Roster update'}`;
          break;
        case 'OWNERSHIP_TRANSFERRED':
          type = 'OWNERSHIP_TRANSFERRED';
          title = 'Band Ownership Transferred';
          desc = `Band founder transferred ownership to ${d['details']?.['targetUid'] || 'new founder'}`;
          break;
        case 'SPLIT_CONFIG_UPDATED':
          type = 'SPLIT_UPDATED';
          title = 'Tip Split Published';
          desc = `New split version ${d['details']?.['version'] || 'v'}`;
          break;
      }

      // Avoid duplicates if already recorded in activity
      if (!activities.some((a) => a.eventId === doc.id)) {
        activities.push({
          eventId: doc.id,
          bandId,
          type,
          title,
          description: desc,
          actorUid: d['performedByUid'],
          timestamp: d['timestamp'] || new Date().toISOString(),
          metadata: d['details'],
        });
      }
    }
  } catch (err) {
    console.warn(`[getBandActivity] AuditLogs query error for band ${bandId}:`, err);
  }

  // Sort merged activities newest first
  activities.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

  // Filter if requested
  if (filter && filter !== 'All') {
    switch (filter) {
      case 'Band Tips':
        activities = activities.filter((a) => a.type === 'TIP_RECEIVED');
        break;
      case 'Splits':
        activities = activities.filter((a) => a.type === 'SPLIT_UPDATED');
        break;
      case 'Gigs':
        activities = activities.filter((a) => a.type === 'GIG_CHECKIN');
        break;
      case 'Roster':
        activities = activities.filter((a) =>
          ['MEMBER_JOINED', 'MEMBER_LEFT', 'ROLE_UPDATED', 'OWNERSHIP_TRANSFERRED', 'INVITATION_SENT'].includes(a.type)
        );
        break;
    }
  }

  return {
    ok: true,
    bandId,
    activities,
  };
}
