/**
 * Crowdbeats V2 — CRM Core Service (Phase 6)
 *
 * Provides server-authoritative logic for:
 * - CRM Event ingestion with deterministic ID generation, idempotency & retention
 * - Aggregated Customer Profile hydration with strict role separation (internal notes sanitization)
 * - Directed relationship (follow) queries with deterministic IDs
 * - Unified financial references (tips sent, tips received, payouts)
 * - Support ticket aggregation & staff-only internal notes
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import type {
  CrmEntityType,
  CrmEvent,
  CrmInternalNote,
  CrmCustomerProfile,
  CrmRelationshipItem,
  CrmFinancialReference,
  CrmDirectoryFilter,
  CrmDirectoryItem,
  SearchCrmDirectoryResponse,
  CrmCaseHistoryItem,
  GetCrmCaseHistoryResponse,
  UpdateCrmVerificationStatusRequest,
  UpdateCrmVerificationStatusResponse,
} from '@crowdbeats/contracts';
import {
  CRM_RETENTION_DAYS,
  buildCrmEventId,
  nowIso,
} from '@crowdbeats/contracts';

const STAFF_ROLES = [
  'SUPER_ADMIN',
  'EXECUTIVE',
  'CUSTOMER_SUPPORT',
  'TRUST_SAFETY',
  'ARTIST_RELATIONS',
  'FINANCE_ADMIN',
  'COMPLIANCE_OFFICER',
  'DEVELOPER',
] as const;

export function isStaffCaller(caller: { platformRole?: string | null; isAdmin?: boolean }): boolean {
  if (caller.isAdmin === true) return true;
  if (!caller.platformRole) return false;
  return STAFF_ROLES.includes(caller.platformRole as any);
}

// ─── 1. CRM Event Recording (Idempotent) ─────────────────────────────────────

export interface RecordCrmEventOptions {
  source: string;
  action: string;
  actorUid: string;
  actorRole?: string;
  targetId: string;
  targetType: CrmEntityType;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
  retentionDays?: number;
  timestampMs?: number;
}

export async function recordCrmEvent(
  db: admin.firestore.Firestore,
  options: RecordCrmEventOptions
): Promise<{ ok: boolean; event: CrmEvent; isReplay: boolean }> {
  const {
    source,
    action,
    actorUid,
    actorRole,
    targetId,
    targetType,
    payload = {},
    timestampMs = Date.now(),
  } = options;

  if (!source || !action || !targetId || !targetType) {
    throw new HttpsError('invalid-argument', 'Missing required event fields (source, action, targetId, targetType).');
  }

  const idempotencyKey =
    options.idempotencyKey || `${source}:${action}:${targetId}:${timestampMs}`;

  // 1. Check if event with this idempotencyKey already exists
  const existingByQuery = await db
    .collection('crmEvents')
    .where('idempotencyKey', '==', idempotencyKey)
    .limit(1)
    .get();

  if (!existingByQuery.empty) {
    const existingDoc = existingByQuery.docs[0];
    const data = existingDoc.data() as CrmEvent;
    return {
      ok: true,
      event: data,
      isReplay: true,
    };
  }

  // 2. Determine retention days based on business sensitivity
  let retentionDays = options.retentionDays || CRM_RETENTION_DAYS.DEFAULT;
  const isFinancial =
    source === 'stripe' ||
    action.includes('TIP') ||
    action.includes('PAYOUT') ||
    action.includes('REFUND') ||
    action.includes('DISPUTE');
  if (isFinancial && (!options.retentionDays || options.retentionDays < CRM_RETENTION_DAYS.FINANCIAL_COMPLIANCE)) {
    retentionDays = CRM_RETENTION_DAYS.FINANCIAL_COMPLIANCE;
  }

  // 3. Generate deterministic eventId
  const eventId = buildCrmEventId(source, targetType, targetId, timestampMs);
  const eventRef = db.collection('crmEvents').doc(eventId);

  const existingDoc = await eventRef.get();
  if (existingDoc.exists) {
    const data = existingDoc.data() as CrmEvent;
    return {
      ok: true,
      event: data,
      isReplay: true,
    };
  }

  const timestamp = new Date(timestampMs).toISOString();
  const crmEvent: CrmEvent = {
    eventId,
    source,
    action,
    actorUid,
    actorRole: actorRole || 'system',
    targetId,
    targetType,
    processingStatus: 'COMPLETED',
    timestamp,
    retentionDays,
    idempotencyKey,
    payload,
    processedAt: nowIso(),
  };

  const batch = db.batch();
  batch.set(eventRef, {
    ...crmEvent,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Also write to auditEvents for centralized immutable audit trail
  const auditRef = db.collection('auditEvents').doc(eventId);
  batch.set(auditRef, {
    eventId,
    action: `CRM_${action}`,
    actorUid,
    actorType: actorRole === 'system' ? 'system' : 'staff',
    targetId,
    targetType,
    metadata: {
      source,
      retentionDays,
      idempotencyKey,
      ...payload,
    },
    correlationId: idempotencyKey,
    createdAt: timestamp,
    platform: 'server',
  });

  await batch.commit();

  return {
    ok: true,
    event: crmEvent,
    isReplay: false,
  };
}

// ─── 2. Unified Customer Profile Hydration ───────────────────────────────────

export async function getCrmCustomerProfile(
  db: admin.firestore.Firestore,
  targetUid: string,
  caller: { uid: string; platformRole?: string | null; isAdmin?: boolean }
): Promise<CrmCustomerProfile> {
  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid targetUid is required.');
  }

  const isStaff = isStaffCaller(caller);
  const isSelf = caller.uid === targetUid;

  if (!isStaff && !isSelf) {
    throw new HttpsError('permission-denied', 'You do not have permission to view this customer profile.');
  }

  // 1. Fetch user doc
  const userRef = db.doc(`users/${targetUid}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError('not-found', `User ${targetUid} not found.`);
  }

  const userData = userSnap.data() || {};

  // 2. Fetch artist profile if exists
  const artistRef = db.doc(`artistProfiles/${targetUid}`);
  const artistSnap = await artistRef.get();
  let artistProfile = null;
  if (artistSnap.exists) {
    const aData = artistSnap.data() || {};
    artistProfile = {
      stageName: aData.stageName || aData.displayName || null,
      genre: aData.genre || null,
      bio: aData.bio || null,
      verified: aData.verified === true,
      totalTipsReceivedCents: aData.totalTipsReceivedCents || aData.totalEarnedCents || 0,
    };
  }

  // 3. Fetch band affiliations
  const bandAffiliations: any[] = [];
  try {
    const bandsQuery = await db
      .collection('bands')
      .where('creatorUid', '==', targetUid)
      .limit(10)
      .get();

    for (const bDoc of bandsQuery.docs) {
      const bData = bDoc.data();
      bandAffiliations.push({
        bandId: bDoc.id,
        name: bData.name || 'Unnamed Band',
        role: 'BAND_FOUNDER',
        joinedAt: bData.createdAt ? (bData.createdAt.toDate ? bData.createdAt.toDate().toISOString() : String(bData.createdAt)) : undefined,
      });
    }
  } catch (err) {
    // Graceful fallback if composite query not indexed
  }

  // 4. Financial Summary
  let totalTipsSentCents = 0;
  let tipsSentCount = 0;
  try {
    const sentTipsSnap = await db.collection('tips').where('fanUid', '==', targetUid).get();
    tipsSentCount = sentTipsSnap.size;
    sentTipsSnap.forEach((doc) => {
      totalTipsSentCents += doc.data().amountCents || 0;
    });
  } catch (err) {
    // Non-fatal
  }

  let totalTipsReceivedCents = 0;
  let tipsReceivedCount = 0;
  try {
    const receivedTipsSnap = await db.collection('tips').where('creatorId', '==', targetUid).get();
    tipsReceivedCount = receivedTipsSnap.size;
    receivedTipsSnap.forEach((doc) => {
      totalTipsReceivedCents += doc.data().amountCents || doc.data().netAmountCents || 0;
    });
  } catch (err) {
    // Non-fatal
  }

  // 5. Relationship Summary
  let followerCount = userData.followerCount || (artistProfile?.totalTipsReceivedCents ? 0 : 0);
  let followingCount = userData.followingCount || 0;
  try {
    const followersSnap = await db.collection('follows').where('targetId', '==', targetUid).count().get();
    followerCount = followersSnap.data().count;
  } catch (err) {
    // Fall back to document count
  }
  try {
    const followingSnap = await db.collection('follows').where('sourceId', '==', targetUid).count().get();
    followingCount = followingSnap.data().count;
  } catch (err) {
    // Fall back to document count
  }

  // 6. Support Summary
  let openTicketsCount = 0;
  let totalTicketsCount = 0;
  try {
    const ticketsSnap = await db.collection('supportRequests').where('userId', '==', targetUid).get();
    totalTicketsCount = ticketsSnap.size;
    ticketsSnap.forEach((doc) => {
      const status = doc.data().status;
      if (status === 'open' || status === 'in_progress') {
        openTicketsCount += 1;
      }
    });
  } catch (err) {
    // Non-fatal
  }

  // 7. Internal Notes (STRICT PRIVACY ENFORCEMENT)
  // Internal notes are staff-only. If the caller is viewing their own profile as a regular user,
  // internal notes MUST NOT be included.
  let internalNotes: CrmInternalNote[] | undefined = undefined;
  if (isStaff && Array.isArray(userData.internalNotes)) {
    internalNotes = userData.internalNotes.map((n: any, idx: number) => ({
      id: n.id || `note_${idx}`,
      authorUid: n.authorUid || 'unknown',
      authorRole: n.authorRole || undefined,
      authorEmail: n.authorEmail || undefined,
      note: n.note || '',
      createdAt: n.timestamp
        ? typeof n.timestamp.toDate === 'function'
          ? n.timestamp.toDate().toISOString()
          : String(n.timestamp)
        : nowIso(),
    }));
  }

  const toIso = (val: any): string | null => {
    if (!val) return null;
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return new Date(val).toISOString();
    return null;
  };

  return {
    uid: targetUid,
    email: userData.email || null,
    displayName: userData.displayName || null,
    photoUrl: userData.photoUrl || userData.photoURL || null,
    personaType: userData.personaType || null,
    platformRole: userData.platformRole || null,
    emailVerified: userData.emailVerified === true,
    isSuspended: userData.isSuspended === true || !!userData.suspendedAt,
    suspendedAt: toIso(userData.suspendedAt),
    suspensionReason: userData.suspensionReason || null,
    createdAt: toIso(userData.createdAt),
    updatedAt: toIso(userData.updatedAt),
    onboardedAt: toIso(userData.onboardedAt),
    artistProfile,
    bandAffiliations,
    financialSummary: {
      totalTipsSentCents,
      totalTipsReceivedCents,
      tipsSentCount,
      tipsReceivedCount,
      stripeCustomerId: userData.stripeCustomerId || null,
      stripeAccountId: userData.stripeAccountId || null,
      stripeAccountStatus: userData.stripeAccountStatus || (userData.stripeAccountId ? 'active' : 'unlinked'),
    },
    relationshipSummary: {
      followerCount,
      followingCount,
    },
    supportSummary: {
      openTicketsCount,
      totalTicketsCount,
    },
    internalNotes,
  };
}

// ─── 3. CRM Directed Relationships ──────────────────────────────────────────

export async function getCrmRelationships(
  db: admin.firestore.Firestore,
  uid: string,
  options: { direction?: 'followers' | 'following'; limit?: number } = {}
): Promise<{ ok: boolean; relationships: CrmRelationshipItem[]; totalCount: number }> {
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid uid is required.');
  }

  const direction = options.direction || 'followers';
  const queryLimit = Math.min(options.limit || 50, 100);

  let query: admin.firestore.Query = db.collection('follows');
  if (direction === 'followers') {
    query = query.where('targetId', '==', uid);
  } else {
    query = query.where('sourceId', '==', uid);
  }

  const snap = await query.limit(queryLimit).get();
  const relationships: CrmRelationshipItem[] = [];

  snap.forEach((doc) => {
    const d = doc.data();
    const sourceId = d.sourceId || d.fanUid || '';
    const targetId = d.targetId || d.artistId || '';
    relationships.push({
      followId: doc.id, // Strictly `${sourceId}_${targetId}`
      sourceId,
      sourceType: d.sourceType || 'fan',
      targetId,
      targetType: d.targetType || 'artist',
      operatorUid: d.operatorUid || sourceId,
      createdAt: d.createdAt
        ? typeof d.createdAt.toDate === 'function'
          ? d.createdAt.toDate().toISOString()
          : String(d.createdAt)
        : nowIso(),
      status: d.status || 'active',
    });
  });

  return {
    ok: true,
    relationships,
    totalCount: relationships.length,
  };
}

// ─── 4. CRM Financial References ─────────────────────────────────────────────

export async function getCrmFinancialReferences(
  db: admin.firestore.Firestore,
  uid: string,
  options: { limit?: number } = {}
): Promise<{
  ok: boolean;
  references: CrmFinancialReference[];
  totalSentCents: number;
  totalReceivedCents: number;
}> {
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid uid is required.');
  }

  const queryLimit = Math.min(options.limit || 50, 100);
  const references: CrmFinancialReference[] = [];
  let totalSentCents = 0;
  let totalReceivedCents = 0;

  // Sent tips
  try {
    const sentSnap = await db
      .collection('tips')
      .where('fanUid', '==', uid)
      .limit(queryLimit)
      .get();

    sentSnap.forEach((doc) => {
      const d = doc.data();
      const amount = d.amountCents || 0;
      totalSentCents += amount;
      references.push({
        referenceId: `tip_sent_${doc.id}`,
        type: 'tip_sent',
        amountCents: amount,
        currency: d.currency || 'usd',
        status: d.status || 'succeeded',
        createdAt: d.createdAt
          ? typeof d.createdAt.toDate === 'function'
            ? d.createdAt.toDate().toISOString()
            : String(d.createdAt)
          : nowIso(),
        counterpartyId: d.creatorId || 'unknown',
        counterpartyName: d.stageName || undefined,
        metadata: {
          platformFeeCents: d.platformFeeCents,
          netAmountCents: d.netAmountCents,
          message: d.message,
        },
      });
    });
  } catch (err) {
    // Non-fatal
  }

  // Received tips
  try {
    const receivedSnap = await db
      .collection('tips')
      .where('creatorId', '==', uid)
      .limit(queryLimit)
      .get();

    receivedSnap.forEach((doc) => {
      const d = doc.data();
      const amount = d.amountCents || 0;
      totalReceivedCents += amount;
      references.push({
        referenceId: `tip_received_${doc.id}`,
        type: 'tip_received',
        amountCents: amount,
        currency: d.currency || 'usd',
        status: d.status || 'succeeded',
        createdAt: d.createdAt
          ? typeof d.createdAt.toDate === 'function'
            ? d.createdAt.toDate().toISOString()
            : String(d.createdAt)
          : nowIso(),
        counterpartyId: d.fanUid || 'unknown',
        metadata: {
          platformFeeCents: d.platformFeeCents,
          netAmountCents: d.netAmountCents,
        },
      });
    });
  } catch (err) {
    // Non-fatal
  }

  // Sort by createdAt descending
  references.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    ok: true,
    references: references.slice(0, queryLimit),
    totalSentCents,
    totalReceivedCents,
  };
}

// ─── 5. CRM Internal Note Addition (Staff Only) ──────────────────────────────

export async function addCrmInternalNote(
  db: admin.firestore.Firestore,
  targetUid: string,
  noteText: string,
  caller: { uid: string; platformRole?: string | null; email?: string }
): Promise<{ ok: boolean; note: CrmInternalNote }> {
  if (!isStaffCaller(caller)) {
    throw new HttpsError('permission-denied', 'Only authorized staff may add internal CRM notes.');
  }

  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid targetUid is required.');
  }

  const trimmed = (noteText || '').trim();
  if (trimmed.length === 0 || trimmed.length > 2000) {
    throw new HttpsError('invalid-argument', 'Note must be between 1 and 2000 characters.');
  }

  const userRef = db.doc(`users/${targetUid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', `User ${targetUid} not found.`);
  }

  const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = nowIso();
  const internalNote: CrmInternalNote = {
    id: noteId,
    authorUid: caller.uid,
    authorRole: caller.platformRole || undefined,
    authorEmail: caller.email || undefined,
    note: trimmed,
    createdAt: now,
  };

  const batch = db.batch();
  batch.update(userRef, {
    internalNotes: admin.firestore.FieldValue.arrayUnion({
      id: internalNote.id,
      authorUid: internalNote.authorUid,
      authorRole: internalNote.authorRole,
      authorEmail: internalNote.authorEmail,
      note: internalNote.note,
      timestamp: Date.now(),
    }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Record CRM Event
  const eventId = buildCrmEventId('crm_admin', 'user', targetUid, Date.now());
  const eventRef = db.collection('crmEvents').doc(eventId);
  batch.set(eventRef, {
    eventId,
    source: 'admin',
    action: 'CRM_INTERNAL_NOTE_ADDED',
    actorUid: caller.uid,
    actorRole: caller.platformRole || 'staff',
    targetId: targetUid,
    targetType: 'user',
    processingStatus: 'COMPLETED',
    timestamp: now,
    retentionDays: CRM_RETENTION_DAYS.DEFAULT,
    idempotencyKey: `crm_note:${targetUid}:${noteId}`,
    payload: {
      noteId,
      noteLength: trimmed.length,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Record Audit Event
  const auditRef = db.collection('auditEvents').doc(eventId);
  batch.set(auditRef, {
    eventId,
    action: 'CRM_INTERNAL_NOTE_ADDED',
    actorUid: caller.uid,
    actorRole: caller.platformRole || 'staff',
    targetUid,
    targetType: 'user',
    fieldDiff: ['internalNotes'],
    reason: 'Internal CRM staff note added',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    requestId: `crm_note_${targetUid}_${Date.now()}`,
  });

  await batch.commit();

  return {
    ok: true,
    note: internalNote,
  };
}

// ─── 6. Phase 8 Unified Directory & Search ───────────────────────────────────

export async function searchCrmDirectory(
  db: admin.firestore.Firestore,
  filter: CrmDirectoryFilter = {},
  caller: { uid: string; platformRole?: string | null; isAdmin?: boolean }
): Promise<SearchCrmDirectoryResponse> {
  if (!isStaffCaller(caller)) {
    throw new HttpsError('permission-denied', 'Unauthorized. Only staff roles may access CRM directories.');
  }

  const {
    entityType = 'all',
    verificationStatus = 'all',
    accountStatus = 'all',
    searchQuery = '',
    limit = 100,
    offset = 0,
  } = filter;

  // Query users collection as base entity directory
  const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(250).get();

  const items: CrmDirectoryItem[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const uid = doc.id;
    const personaRaw = (data.personaType || '').toLowerCase();

    // Check entityType filter
    if (entityType === 'fan') {
      const isFan = personaRaw === 'fan' || (!personaRaw && !data.stripeAccountId && !data.stageName);
      if (!isFan) continue;
    } else if (entityType === 'solo_musician') {
      const isSolo = personaRaw.includes('solo') || personaRaw === 'artist' || personaRaw === 'creator';
      if (!isSolo) continue;
    } else if (entityType === 'band') {
      const isBand = personaRaw.includes('band');
      if (!isBand) continue;
    } else if (entityType === 'sponsor') {
      const isSponsor = personaRaw.includes('sponsor');
      if (!isSponsor) continue;
    }

    // Check verificationStatus filter
    const isVerified = data.verified === true || data.isVerified === true;
    if (verificationStatus === 'verified' && !isVerified) continue;
    if (verificationStatus === 'unverified' && isVerified) continue;

    // Check accountStatus filter
    const isSuspended = data.isSuspended === true || !!data.suspendedAt;
    if (accountStatus === 'active' && isSuspended) continue;
    if (accountStatus === 'suspended' && !isSuspended) continue;

    // Search query matching
    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
      const matches =
        (data.displayName && data.displayName.toLowerCase().includes(q)) ||
        (data.email && data.email.toLowerCase().includes(q)) ||
        uid.toLowerCase().includes(q) ||
        (data.stageName && data.stageName.toLowerCase().includes(q)) ||
        (data.genre && data.genre.toLowerCase().includes(q)) ||
        (data.city && data.city.toLowerCase().includes(q));
      if (!matches) continue;
    }

    // Total monetary calculation
    const totalSent = data.totalTipsSentCents || data.totalTippedCents || 0;
    const totalEarned = data.totalTipsReceivedCents || data.totalEarnedCents || 0;
    const totalMonetaryCents =
      entityType === 'fan' || personaRaw === 'fan'
        ? totalSent
        : totalEarned > 0
        ? totalEarned
        : totalSent;

    items.push({
      uid,
      displayName: data.displayName || null,
      email: data.email || null,
      photoUrl: data.photoUrl || null,
      personaType: data.personaType || (data.stripeAccountId ? 'solo_musician' : 'fan'),
      verificationStatus: isVerified ? 'verified' : 'unverified',
      accountStatus: isSuspended ? 'suspended' : 'active',
      city: data.city || null,
      genre: data.genre || null,
      stageName: data.stageName || null,
      totalMonetaryCents,
      relationshipsCount: data.followerCount || 0,
      openCasesCount: data.openTicketsCount || 0,
      stripeConnected: !!data.stripeAccountId,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
    });
  }

  // Also query bands collection if entityType is 'all' or 'band'
  if (entityType === 'all' || entityType === 'band') {
    try {
      const bandSnap = await db.collection('bands').limit(100).get();
      for (const bDoc of bandSnap.docs) {
        if (items.some((i) => i.uid === bDoc.id)) continue;
        const b = bDoc.data();
        const isVerified = b.verified === true || b.isVerified === true || b.verificationStatus === 'verified';
        if (verificationStatus === 'verified' && !isVerified) continue;
        if (verificationStatus === 'unverified' && isVerified) continue;

        const isSuspended = b.status === 'suspended' || b.isSuspended === true;
        if (accountStatus === 'active' && isSuspended) continue;
        if (accountStatus === 'suspended' && !isSuspended) continue;

        const q = (searchQuery || '').trim().toLowerCase();
        if (q) {
          const matches =
            (b.name && b.name.toLowerCase().includes(q)) ||
            (b.handle && b.handle.toLowerCase().includes(q)) ||
            (b.genre && b.genre.toLowerCase().includes(q)) ||
            (b.city && b.city.toLowerCase().includes(q)) ||
            bDoc.id.toLowerCase().includes(q);
          if (!matches) continue;
        }

        items.push({
          uid: bDoc.id,
          displayName: b.name || b.handle || 'Band',
          email: b.contactEmail || null,
          photoUrl: b.avatarUrl || b.photoUrl || null,
          personaType: 'band',
          verificationStatus: isVerified ? 'verified' : 'unverified',
          accountStatus: isSuspended ? 'suspended' : 'active',
          city: b.city || null,
          genre: b.genre || null,
          stageName: b.name || null,
          totalMonetaryCents: b.totalEarnedCents || 0,
          relationshipsCount: b.followerCount || (b.members ? b.members.length : 0),
          openCasesCount: 0,
          stripeConnected: !!b.stripeAccountId,
          createdAt: b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : (b.createdAt || null),
        });
      }
    } catch (err) {
      // collection may not exist yet in tests
    }
  }

  const totalCount = items.length;
  const paginated = items.slice(offset, offset + limit);

  return {
    ok: true,
    items: paginated,
    totalCount,
  };
}

// ─── 7. Phase 8 Case History Aggregation ─────────────────────────────────────

export async function getCrmCaseHistory(
  db: admin.firestore.Firestore,
  targetUid: string,
  caller: { uid: string; platformRole?: string | null; isAdmin?: boolean }
): Promise<GetCrmCaseHistoryResponse> {
  if (!isStaffCaller(caller) && caller.uid !== targetUid) {
    throw new HttpsError('permission-denied', 'Access denied to target case history.');
  }

  const cases: CrmCaseHistoryItem[] = [];

  // 1. Support Requests
  try {
    const supportSnap = await db
      .collection('supportRequests')
      .where('userId', '==', targetUid)
      .limit(50)
      .get();

    for (const doc of supportSnap.docs) {
      const d = doc.data();
      cases.push({
        caseId: doc.id,
        type: 'SUPPORT_TICKET',
        title: d.subject || 'Customer Support Request',
        status: (d.status || 'OPEN').toUpperCase(),
        priority: (d.priority || 'MEDIUM').toUpperCase(),
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || nowIso()),
        resolvedAt: d.resolvedAt?.toDate ? d.resolvedAt.toDate().toISOString() : (d.resolvedAt || null),
        assignedStaff: d.assignedTo || null,
        details: {
          category: d.category || 'GENERAL',
          description: d.description || '',
        },
      });
    }
  } catch (err) {
    // collection may be empty or unindexed in dev
  }

  // 2. Trust & Safety Abuse Reports
  try {
    const seenReportIds = new Set<string>();

    const checkReportDocs = (docs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
      for (const doc of docs) {
        if (!seenReportIds.has(doc.id)) {
          seenReportIds.add(doc.id);
          const d = doc.data();
          cases.push({
            caseId: doc.id,
            type: 'TRUST_SAFETY_REPORT',
            title: `Abuse Report: ${d.reason || d.category || d.violationCategory || 'Content Violation'}`,
            status: (d.status || 'PENDING_REVIEW').toUpperCase(),
            priority: (d.severity || d.slaTier || 'HIGH').toUpperCase(),
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || nowIso()),
            resolvedAt: d.resolvedAt?.toDate ? d.resolvedAt.toDate().toISOString() : (d.resolvedAt || null),
            assignedStaff: d.assignedOfficer || d.assignedStaff || null,
            details: {
              reporterUid: isStaffCaller(caller) ? (d.reporterUid || d.reporterUserId) : undefined,
              notes: d.notes || d.description || '',
            },
          });
        }
      }
    };

    const [snap1, snap2, snap3] = await Promise.all([
      db.collection('reports').where('targetId', '==', targetUid).limit(50).get().catch(() => ({ docs: [] })),
      db.collection('reports').where('targetUid', '==', targetUid).limit(50).get().catch(() => ({ docs: [] })),
      db.collection('reports').where('targetUserId', '==', targetUid).limit(50).get().catch(() => ({ docs: [] })),
    ]);

    checkReportDocs(snap1.docs as any);
    checkReportDocs(snap2.docs as any);
    checkReportDocs(snap3.docs as any);
  } catch (err) {
    // collection may be empty or unindexed in dev
  }

  // 3. Payout Holds
  try {
    const seenHoldIds = new Set<string>();

    const checkHoldDocs = (docs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
      for (const doc of docs) {
        if (!seenHoldIds.has(doc.id)) {
          seenHoldIds.add(doc.id);
          const d = doc.data();
          cases.push({
            caseId: doc.id,
            type: 'PAYOUT_HOLD',
            title: `Compliance Payout Hold: ${d.reason || d.reasonCode || 'Verification Required'}`,
            status: (d.status || 'ACTIVE').toUpperCase(),
            priority: 'CRITICAL',
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || d.appliedAt || nowIso()),
            resolvedAt: d.releasedAt?.toDate ? d.releasedAt.toDate().toISOString() : (d.releasedAt || null),
            assignedStaff: d.assignedTo || d.appliedByUid || null,
            details: {
              holdAmountCents: d.amountCents || 0,
            },
          });
        }
      }
    };

    const [hSnap1, hSnap2, hSnap3] = await Promise.all([
      db.collection('payoutHolds').where('creatorId', '==', targetUid).limit(20).get().catch(() => ({ docs: [] })),
      db.collection('payoutHolds').where('artistUid', '==', targetUid).limit(20).get().catch(() => ({ docs: [] })),
      db.collection('payoutHolds').where('creatorUid', '==', targetUid).limit(20).get().catch(() => ({ docs: [] })),
    ]);

    checkHoldDocs(hSnap1.docs as any);
    checkHoldDocs(hSnap2.docs as any);
    checkHoldDocs(hSnap3.docs as any);
  } catch (err) {
    // collection may be empty or unindexed in dev
  }

  // Sort descending by createdAt
  cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    ok: true,
    targetUid,
    cases,
    totalCount: cases.length,
  };
}

// ─── 8. Phase 8 Verification Status Update ───────────────────────────────────

export async function updateCrmVerificationStatus(
  db: admin.firestore.Firestore,
  request: UpdateCrmVerificationStatusRequest,
  caller: { uid: string; platformRole?: string | null; isAdmin?: boolean }
): Promise<UpdateCrmVerificationStatusResponse> {
  if (!isStaffCaller(caller)) {
    throw new HttpsError('permission-denied', 'Unauthorized. Only staff roles may update verification status.');
  }

  const { targetUid, targetType, verified, reason } = request;
  if (!targetUid || !targetType || typeof verified !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Missing targetUid, targetType, or verified flag.');
  }

  if (!reason || !reason.trim()) {
    throw new HttpsError('invalid-argument', 'An operational justification reason is required.');
  }

  const batch = db.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const statusString = verified ? 'verified' : 'unverified';

  if (targetType === 'band') {
    const bandRef = db.collection('bands').doc(targetUid);
    batch.set(bandRef, {
      verified,
      isVerified: verified,
      verificationStatus: statusString,
      verificationReason: reason.trim(),
      verifiedBy: caller.uid,
      verifiedAt: timestamp,
      updatedAt: timestamp,
    }, { merge: true });
  } else {
    // 1. Update user document
    const userRef = db.collection('users').doc(targetUid);
    batch.set(userRef, {
      verified,
      isVerified: verified,
      verificationStatus: statusString,
      verificationReason: reason.trim(),
      verificationUpdatedAt: timestamp,
      verificationUpdatedBy: caller.uid,
      updatedAt: timestamp,
    }, { merge: true });

    // 2. If artist or solo, update artist profile
    if (targetType === 'artist' || targetType === 'user') {
      const artistRef = db.collection('artistProfiles').doc(targetUid);
      batch.set(artistRef, {
        verified,
        isVerified: verified,
        verificationStatus: statusString,
        updatedAt: timestamp,
      }, { merge: true });
    }

    // 3. If sponsor, update sponsor document
    if (targetType === 'sponsor') {
      const sponsorRef = db.collection('sponsors').doc(targetUid);
      batch.set(sponsorRef, {
        verified,
        isVerified: verified,
        verificationStatus: statusString,
        updatedAt: timestamp,
      }, { merge: true });
    }
  }

  // 4. Record immutable CRM event
  const now = nowIso();
  const eventId = buildCrmEventId('crm_admin', targetType, targetUid, Date.now());
  const eventRef = db.collection('crmEvents').doc(eventId);
  batch.set(eventRef, {
    eventId,
    source: 'admin_crm',
    action: 'CRM_VERIFICATION_STATUS_CHANGED',
    actorUid: caller.uid,
    actorRole: caller.platformRole || 'staff',
    targetId: targetUid,
    targetType,
    processingStatus: 'COMPLETED',
    timestamp: now,
    retentionDays: CRM_RETENTION_DAYS.DEFAULT,
    idempotencyKey: `crm_verify:${targetUid}:${verified}:${Date.now()}`,
    payload: {
      verified,
      newStatus: statusString,
      reason: reason.trim(),
    },
    createdAt: timestamp,
  });

  // 5. Record Audit Event
  const auditRef = db.collection('auditEvents').doc(eventId);
  batch.set(auditRef, {
    eventId,
    action: 'CRM_VERIFICATION_STATUS_CHANGED',
    actorUid: caller.uid,
    actorRole: caller.platformRole || 'staff',
    targetUid,
    targetType,
    fieldDiff: ['verified', 'verificationStatus'],
    reason: reason.trim(),
    timestamp,
    requestId: `crm_verify_${targetUid}_${Date.now()}`,
  });

  await batch.commit();

  return {
    ok: true,
    message: `Account verification status set to ${verified ? 'VERIFIED' : 'UNVERIFIED'}.`,
    targetUid,
    verified,
  };
}

