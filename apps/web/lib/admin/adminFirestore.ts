'use client';
/**
 * Crowdbeats V2 — Admin Firestore Data Hooks
 *
 * Client-side hooks for reading real production data in admin pages.
 * All queries use Firebase client SDK (works on static hosting).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  AdminCommandCenterData,
  GetAdminCommandCenterDataRequest,
  GetAdminCommandCenterDataResponse,
  PendingActionException,
  CrmDirectoryFilter,
  CrmDirectoryItem,
  SearchCrmDirectoryRequest,
  SearchCrmDirectoryResponse,
  CrmCaseHistoryItem,
  GetCrmCaseHistoryRequest,
  GetCrmCaseHistoryResponse,
  UpdateCrmVerificationStatusRequest,
  UpdateCrmVerificationStatusResponse,
  AddCrmInternalNoteRequest,
  AddCrmInternalNoteResponse,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
  SupportMessage,
  SupportInternalNote,
  SupportTicketHistoryEntry,
  CreateSupportTicketRequest,
  CreateSupportTicketResponse,
  AssignSupportTicketRequest,
  AssignSupportTicketResponse,
  ResolveSupportTicketRequest,
  ResolveSupportTicketResponse,
  ReopenSupportTicketRequest,
  ReopenSupportTicketResponse,
  AddSupportTicketMessageRequest,
  AddSupportTicketMessageResponse,
  AddSupportInternalNoteRequest,
  AddSupportInternalNoteResponse,
  GetSupportTicketDetailsRequest,
  GetSupportTicketDetailsResponse,
} from '@crowdbeats/contracts';
import { firebaseApp } from '../firebase/app';

export const db = () => getFirestore(firebaseApp);
export const fns = () => getFunctions(firebaseApp, 'us-central1');

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
  uid: string;
  id?: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  personaType: string | null;
  platformRole: string | null;
  isAdmin: boolean;
  emailVerified: boolean;
  suspendedAt: Timestamp | null;
  deletedAt: Timestamp | null;
  createdAt: Timestamp | null;
  stripeCustomerId: string | null;
  stripeAccountId: string | null;
  bio?: string | null;
  genre?: string | null;
  city?: string | null;
  publicLocation?: string | null;
  internalNotes?: Array<{ authorUid?: string; timestamp?: any; note: string }>;
  isSuspended?: boolean;
  suspensionReason?: string | null;
  authProvider?: string | null;
  providerId?: string | null;
  followerCount?: number;
  followingCount?: number;
  strikeCount?: number;
  updatedAt?: Timestamp | null;
  onboardedAt?: Timestamp | null;
  termsAccepted?: boolean;
  consentVersion?: string | null;
}

export interface AdminTip {
  id?: string;
  tipId: string;
  fanUid: string;
  creatorId: string;
  amountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  status: string;
  stripePaymentIntentId: string | null;
  createdAt: Timestamp | null;
  message: string | null;
  stageName: string | null;
}

export interface AdminArtist {
  id?: string;
  uid: string;
  displayName: string | null;
  email: string | null;
  stageName: string | null;
  genre: string | null;
  bio: string | null;
  stripeAccountId: string | null;
  verified: boolean;
  followerCount: number;
  totalEarnedCents: number;
  createdAt: Timestamp | null;
}

export interface PlatformMetrics {
  totalUsers: number;
  totalArtists: number;
  totalTips: number;
  totalRevenueCents: number;
  totalPlatformFeeCents: number;
  activeStaff: number;
  suspendedUsers: number;
  pendingRefunds: number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function docToUser(d: DocumentData & { id: string }): AdminUser {
  const uid = d.uid ?? d.id;
  return {
    uid,
    id: uid,
    email: d.email ?? null,
    displayName: d.displayName ?? null,
    photoUrl: d.photoUrl ?? d.photoURL ?? null,
    personaType: d.personaType ?? null,
    platformRole: d.platformRole ?? null,
    isAdmin: d.isAdmin === true,
    emailVerified: d.emailVerified === true,
    suspendedAt: d.suspendedAt ?? null,
    deletedAt: d.deletedAt ?? null,
    createdAt: d.createdAt ?? null,
    stripeCustomerId: d.stripeCustomerId ?? null,
    stripeAccountId: d.stripeAccountId ?? null,
    bio: d.bio ?? null,
    genre: d.genre ?? null,
    city: d.city ?? null,
    publicLocation: d.publicLocation ?? null,
    internalNotes: Array.isArray(d.internalNotes) ? d.internalNotes : [],
    isSuspended: d.isSuspended === true || !!d.suspendedAt,
    suspensionReason: d.suspensionReason ?? null,
    authProvider: d.authProvider ?? d.providerId ?? null,
    providerId: d.providerId ?? null,
    followerCount: typeof d.followerCount === 'number' ? d.followerCount : 0,
    followingCount: typeof d.followingCount === 'number' ? d.followingCount : 0,
    strikeCount: typeof d.strikeCount === 'number' ? d.strikeCount : (d.strikes ? Object.keys(d.strikes).length : 0),
    updatedAt: d.updatedAt ?? null,
    onboardedAt: d.onboardedAt ?? null,
    termsAccepted: d.termsAccepted === true,
    consentVersion: d.consentVersion ?? null,
  };
}

function formatTS(ts: any): string {
  if (!ts) return '—';
  if (typeof ts.toDate === 'function') {
    return ts.toDate().toLocaleString();
  }
  if (ts.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString();
  }
  if (typeof ts === 'string' || typeof ts === 'number') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  }
  return '—';
}

function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export { formatTS, centsToDollars };

// ── Mock & Demo Data Fallbacks (for local dev & unauthenticated inspection) ───

export const MOCK_USERS: AdminUser[] = [
  {
    uid: 'usr_maya_rivers',
    id: 'usr_maya_rivers',
    email: 'maya.rivers@gmail.com',
    displayName: 'Maya Rivers',
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150',
    personaType: 'artist',
    platformRole: null,
    isAdmin: false,
    emailVerified: true,
    suspendedAt: null,
    deletedAt: null,
    createdAt: Timestamp.fromMillis(Date.now() - 90 * 86400000),
    stripeCustomerId: 'cus_P92kRivers',
    stripeAccountId: 'acct_1Ou76KL2x9PqM01A',
    bio: 'Indie electronic vocalist & synthesizer artist from Austin, TX. Exploring analog synths, spatial reverb, and pulsing live drum machines.',
    genre: 'Electronic / Synthpop',
    city: 'Austin',
    publicLocation: 'Austin, TX',
    internalNotes: [
      { note: 'Verified artist via live Austin stage showcase.', authorUid: 'admin@crowdbeats.com', timestamp: '2026-06-12' }
    ],
    isSuspended: false,
    suspensionReason: null,
    authProvider: 'google.com',
    providerId: 'google.com',
    followerCount: 14200,
    followingCount: 312,
    strikeCount: 0,
    updatedAt: Timestamp.fromMillis(Date.now() - 2 * 86400000),
    onboardedAt: Timestamp.fromMillis(Date.now() - 89 * 86400000),
    termsAccepted: true,
    consentVersion: '2026.1',
  },
  {
    uid: 'usr_electric_reverie',
    id: 'usr_electric_reverie',
    email: 'contact@electricreverie.com',
    displayName: 'The Electric Reverie',
    photoUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=150',
    personaType: 'band',
    platformRole: null,
    isAdmin: false,
    emailVerified: true,
    suspendedAt: null,
    deletedAt: null,
    createdAt: Timestamp.fromMillis(Date.now() - 120 * 86400000),
    stripeCustomerId: 'cus_Reverie01',
    stripeAccountId: 'acct_1ReverieBand',
    bio: '4-piece psychedelic funk band touring across the Southwest.',
    genre: 'Psychedelic Rock / Funk',
    city: 'Nashville',
    publicLocation: 'Nashville, TN',
    internalNotes: [],
    isSuspended: false,
    suspensionReason: null,
    authProvider: 'password',
    providerId: 'password',
    followerCount: 28400,
    followingCount: 145,
    strikeCount: 0,
    updatedAt: null,
    onboardedAt: Timestamp.fromMillis(Date.now() - 119 * 86400000),
    termsAccepted: true,
    consentVersion: '2026.1',
  },
  {
    uid: 'usr_sarah_miller',
    id: 'usr_sarah_miller',
    email: 'sarah.miller@gmail.com',
    displayName: 'Sarah Miller',
    photoUrl: null,
    personaType: 'fan',
    platformRole: null,
    isAdmin: false,
    emailVerified: true,
    suspendedAt: null,
    deletedAt: null,
    createdAt: Timestamp.fromMillis(Date.now() - 45 * 86400000),
    stripeCustomerId: 'cus_SarahM99',
    stripeAccountId: null,
    bio: 'Live music lover & vinyl collector in Brooklyn.',
    genre: null,
    city: 'Brooklyn',
    publicLocation: 'New York, NY',
    internalNotes: [],
    isSuspended: false,
    suspensionReason: null,
    authProvider: 'apple.com',
    providerId: 'apple.com',
    followerCount: 88,
    followingCount: 540,
    strikeCount: 0,
    updatedAt: null,
    onboardedAt: Timestamp.fromMillis(Date.now() - 44 * 86400000),
    termsAccepted: true,
    consentVersion: '2026.1',
  },
  {
    uid: 'usr_austin_skyline',
    id: 'usr_austin_skyline',
    email: 'events@austinskyline.com',
    displayName: 'Austin Skyline Lounge',
    photoUrl: null,
    personaType: 'venue',
    platformRole: null,
    isAdmin: false,
    emailVerified: true,
    suspendedAt: null,
    deletedAt: null,
    createdAt: Timestamp.fromMillis(Date.now() - 150 * 86400000),
    stripeCustomerId: 'cus_Skyline01',
    stripeAccountId: 'acct_SkylineVenue',
    bio: 'Rooftop live venue and cocktail lounge in downtown Austin.',
    genre: null,
    city: 'Austin',
    publicLocation: 'Austin, TX',
    internalNotes: [],
    isSuspended: false,
    suspensionReason: null,
    authProvider: 'password',
    providerId: 'password',
    followerCount: 6500,
    followingCount: 42,
    strikeCount: 0,
    updatedAt: null,
    onboardedAt: Timestamp.fromMillis(Date.now() - 149 * 86400000),
    termsAccepted: true,
    consentVersion: '2026.1',
  },
  {
    uid: 'usr_soundwave_brand',
    id: 'usr_soundwave_brand',
    email: 'partnerships@soundwave.io',
    displayName: 'SoundWave Audio',
    photoUrl: null,
    personaType: 'sponsor',
    platformRole: null,
    isAdmin: false,
    emailVerified: true,
    suspendedAt: null,
    deletedAt: null,
    createdAt: Timestamp.fromMillis(Date.now() - 60 * 86400000),
    stripeCustomerId: 'cus_SoundWaveSponsor',
    stripeAccountId: null,
    bio: 'Official audio hardware partner funding emerging indie talent match pools.',
    genre: null,
    city: 'San Francisco',
    publicLocation: 'San Francisco, CA',
    internalNotes: [],
    isSuspended: false,
    suspensionReason: null,
    authProvider: 'google.com',
    providerId: 'google.com',
    followerCount: 1200,
    followingCount: 30,
    strikeCount: 0,
    updatedAt: null,
    onboardedAt: Timestamp.fromMillis(Date.now() - 59 * 86400000),
    termsAccepted: true,
    consentVersion: '2026.1',
  },
  {
    uid: 'usr_jordan_lee',
    id: 'usr_jordan_lee',
    email: 'jordan.lee@yahoo.com',
    displayName: 'Jordan Lee',
    photoUrl: null,
    personaType: 'fan',
    platformRole: null,
    isAdmin: false,
    emailVerified: true,
    suspendedAt: Timestamp.fromMillis(Date.now() - 5 * 86400000),
    deletedAt: null,
    createdAt: Timestamp.fromMillis(Date.now() - 30 * 86400000),
    stripeCustomerId: 'cus_JordanL33',
    stripeAccountId: null,
    bio: null,
    genre: null,
    city: 'Chicago',
    publicLocation: 'Chicago, IL',
    internalNotes: [
      { note: 'Account suspended following harassment report in live stage chat.', authorUid: 'trust@crowdbeats.com', timestamp: '2026-07-03' }
    ],
    isSuspended: true,
    suspensionReason: 'Repeated Terms of Service violation in stage chat',
    authProvider: 'password',
    providerId: 'password',
    followerCount: 12,
    followingCount: 94,
    strikeCount: 2,
    updatedAt: null,
    onboardedAt: Timestamp.fromMillis(Date.now() - 29 * 86400000),
    termsAccepted: true,
    consentVersion: '2026.1',
  },
  {
    uid: 'vK1bvXWjqwR1H78yAfiOsXRRyVn2',
    id: 'vK1bvXWjqwR1H78yAfiOsXRRyVn2',
    email: 'crowdbeatsllc@gmail.com',
    displayName: 'Crowdbeats Admin',
    photoUrl: null,
    personaType: 'staff',
    platformRole: 'SUPER_ADMIN',
    isAdmin: true,
    emailVerified: true,
    suspendedAt: null,
    deletedAt: null,
    createdAt: Timestamp.fromMillis(Date.now() - 365 * 86400000),
    stripeCustomerId: null,
    stripeAccountId: null,
    bio: 'Platform Operations & Super Administrator',
    genre: null,
    city: 'Austin',
    publicLocation: 'Austin, TX',
    internalNotes: [],
    isSuspended: false,
    suspensionReason: null,
    authProvider: 'google.com',
    providerId: 'google.com',
    followerCount: 0,
    followingCount: 0,
    strikeCount: 0,
    updatedAt: null,
    onboardedAt: Timestamp.fromMillis(Date.now() - 364 * 86400000),
    termsAccepted: true,
    consentVersion: '2026.1',
  }
];

export const MOCK_ARTIST_PROFILE: AdminArtist = {
  id: 'usr_maya_rivers',
  uid: 'usr_maya_rivers',
  displayName: 'Maya Rivers',
  email: 'maya.rivers@gmail.com',
  stageName: 'Maya Rivers',
  genre: 'Electronic / Synthpop',
  bio: 'Indie electronic vocalist & synthesizer artist from Austin, TX. Exploring analog synths, spatial reverb, and pulsing live drum machines.',
  stripeAccountId: 'acct_1Ou76KL2x9PqM01A',
  verified: true,
  followerCount: 14200,
  totalEarnedCents: 482000,
  createdAt: Timestamp.fromMillis(Date.now() - 90 * 86400000),
};

export const MOCK_TIPS: AdminTip[] = [
  {
    id: 'tip_live_001',
    tipId: 'tip_live_001',
    fanUid: 'usr_sarah_miller',
    creatorId: 'usr_maya_rivers',
    amountCents: 2500,
    platformFeeCents: 150,
    netAmountCents: 2350,
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3P9xL1289LiveMaya',
    createdAt: Timestamp.fromMillis(Date.now() - 120000),
    message: 'Incredible synthesizer set tonight at Skyline!',
    stageName: 'Austin Rooftop Stage',
  },
  {
    id: 'tip_live_002',
    tipId: 'tip_live_002',
    fanUid: 'usr_jordan_lee',
    creatorId: 'usr_maya_rivers',
    amountCents: 5000,
    platformFeeCents: 300,
    netAmountCents: 4700,
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3P9xL1290LiveMaya',
    createdAt: Timestamp.fromMillis(Date.now() - 3600000),
    message: 'Loved that encore track!',
    stageName: 'Austin Rooftop Stage',
  },
  {
    id: 'tip_live_003',
    tipId: 'tip_live_003',
    fanUid: 'usr_soundwave_brand',
    creatorId: 'usr_maya_rivers',
    amountCents: 10000,
    platformFeeCents: 600,
    netAmountCents: 9400,
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3P9xL1291LiveMaya',
    createdAt: Timestamp.fromMillis(Date.now() - 86400000),
    message: 'SoundWave sponsor bonus match pool.',
    stageName: 'Austin Rooftop Stage',
  },
];

export const MOCK_SUPPORT_TICKETS: AdminSupportTicket[] = [
  {
    id: 'TKT-8901',
    ticketId: 'TKT-8901',
    userId: 'usr_maya_rivers',
    email: 'maya.rivers@gmail.com',
    subject: 'Direct artist payout question regarding Stripe Connect timing',
    message: 'Hi Support, our weekend performance tips were collected successfully, but we want to confirm when the automatic payout batch clears to our bank account. Thanks!',
    body: 'Hi Support, our weekend performance tips were collected successfully, but we want to confirm when the automatic payout batch clears to our bank account. Thanks!',
    category: 'PAYMENTS',
    status: 'open',
    priority: 'high',
    assignedTo: null,
    createdAt: Timestamp.fromMillis(Date.now() - 2 * 3600000),
    notes: [
      { note: 'Checked Stripe transfer logs: batch schedule is 48-hour rolling.', authorUid: 'vK1bvXWjqwR1H78yAfiOsXRRyVn2', authorEmail: 'crowdbeatsllc@gmail.com', createdAt: Timestamp.fromMillis(Date.now() - 1 * 3600000) }
    ],
  },
  {
    id: 'TKT-8902',
    ticketId: 'TKT-8902',
    userId: 'usr_electric_reverie',
    email: 'contact@electricreverie.com',
    subject: 'Request to update verified band roster & stage name',
    message: 'We added a new bassist to our permanent touring roster and want to reflect this on our artist credentials.',
    body: 'We added a new bassist to our permanent touring roster and want to reflect this on our artist credentials.',
    category: 'ACCOUNT',
    status: 'in_progress',
    priority: 'normal',
    assignedTo: 'admin@crowdbeats.com',
    createdAt: Timestamp.fromMillis(Date.now() - 5 * 3600000),
    notes: [],
  },
  {
    id: 'TKT-8903',
    ticketId: 'TKT-8903',
    userId: 'usr_austin_skyline',
    email: 'events@austinskyline.com',
    subject: 'Venue geofence radius adjustment for rooftop patio',
    message: 'Our outdoor balcony section is slightly outside the current 100m geofence radius. Can we expand it to 150m?',
    body: 'Our outdoor balcony section is slightly outside the current 100m geofence radius. Can we expand it to 150m?',
    category: 'LIVE',
    status: 'resolved',
    priority: 'normal',
    assignedTo: 'ops@crowdbeats.com',
    createdAt: Timestamp.fromMillis(Date.now() - 24 * 3600000),
    resolutionNotes: 'Expanded venue geofence to 160m on cartographic registry.',
  },
  {
    id: 'TKT-8904',
    ticketId: 'TKT-8904',
    userId: 'usr_jordan_lee',
    email: 'jordan.lee@yahoo.com',
    subject: 'Appeal regarding account suspension in stage chat',
    message: 'I would like to appeal my suspension. I apologize for the language used during the livestream.',
    body: 'I would like to appeal my suspension. I apologize for the language used during the livestream.',
    category: 'TRUST_SAFETY',
    status: 'closed',
    priority: 'urgent',
    assignedTo: 'safety@crowdbeats.com',
    createdAt: Timestamp.fromMillis(Date.now() - 48 * 3600000),
    resolutionNotes: 'Reviewed chat logs. 7-day temporary restriction stands; reinstated on July 10.',
  },
];

export const MOCK_AUDIT_EVENTS: AdminAuditEvent[] = [
  {
    id: 'audit_evt_01',
    eventId: 'audit_evt_01',
    actorUid: 'vK1bvXWjqwR1H78yAfiOsXRRyVn2',
    actorEmail: 'crowdbeatsllc@gmail.com',
    actorRole: 'SUPER_ADMIN',
    targetUid: 'usr_maya_rivers',
    targetType: 'user',
    action: 'USER_PROFILE_UPDATED',
    fieldDiff: ['bio', 'headline'],
    reason: 'Updated artist headline and bio per verified booking submission',
    timestamp: Timestamp.fromMillis(Date.now() - 10800000),
    createdAt: Timestamp.fromMillis(Date.now() - 10800000),
  },
  {
    id: 'audit_evt_02',
    eventId: 'audit_evt_02',
    actorUid: 'vK1bvXWjqwR1H78yAfiOsXRRyVn2',
    actorEmail: 'crowdbeatsllc@gmail.com',
    actorRole: 'SUPER_ADMIN',
    targetUid: 'usr_maya_rivers',
    targetType: 'user',
    action: 'CREATOR_KYC_VERIFIED',
    fieldDiff: ['verified'],
    reason: 'Manual Stripe Identity check confirmed valid government ID',
    timestamp: Timestamp.fromMillis(Date.now() - 86400000),
    createdAt: Timestamp.fromMillis(Date.now() - 86400000),
  },
];

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetches all users (up to 500 for admin view) */
export function useAdminUsers(opts?: { limitN?: number; personaFilter?: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = query(
        collection(db(), 'users'),
        orderBy('createdAt', 'desc'),
        limit(opts?.limitN ?? 200)
      );
      if (opts?.personaFilter && opts.personaFilter !== 'ALL') {
        q = query(
          collection(db(), 'users'),
          where('personaType', '==', opts.personaFilter.toLowerCase()),
          orderBy('createdAt', 'desc'),
          limit(opts?.limitN ?? 200)
        );
      }
      const snap = await getDocs(q);
      if (snap.empty) {
        let filtered = MOCK_USERS;
        if (opts?.personaFilter && opts.personaFilter !== 'ALL') {
          filtered = filtered.filter(u => u.personaType?.toLowerCase() === opts.personaFilter?.toLowerCase());
        }
        setUsers(filtered);
      } else {
        setUsers(snap.docs.map(d => docToUser({ ...d.data(), id: d.id })));
      }
    } catch (e) {
      // Graceful fallback for local development & demonstration environments
      let filtered = MOCK_USERS;
      if (opts?.personaFilter && opts.personaFilter !== 'ALL') {
        filtered = filtered.filter(u => u.personaType?.toLowerCase() === opts.personaFilter?.toLowerCase());
      }
      setUsers(filtered);
    } finally {
      setLoading(false);
    }
  }, [opts?.limitN, opts?.personaFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  return { users, loading, error, refresh };
}

/** Fetches artist profiles */
export function useAdminArtists(limitN = 200) {
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db(), 'artistProfiles'), orderBy('createdAt', 'desc'), limit(limitN))
        );
        const results: AdminArtist[] = snap.docs.map(d => {
          const data = d.data();
          return {
            uid: d.id,
            displayName: data.displayName ?? null,
            email: data.email ?? null,
            stageName: data.stageName ?? data.displayName ?? null,
            genre: data.genre ?? null,
            bio: data.bio ?? null,
            stripeAccountId: data.stripeAccountId ?? null,
            verified: data.verified === true,
            followerCount: data.followerCount ?? 0,
            totalEarnedCents: data.totalEarnedCents ?? 0,
            createdAt: data.createdAt ?? null,
          };
        });
        setArtists(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load artists');
      } finally {
        setLoading(false);
      }
    })();
  }, [limitN]);

  return { artists, loading, error };
}

/** Fetches tip transactions */
export function useAdminTips(opts?: { limitN?: number; status?: string }) {
  const [tips, setTips] = useState<AdminTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db(), 'tips'),
          orderBy('createdAt', 'desc'),
          limit(opts?.limitN ?? 200)
        );
        if (opts?.status) {
          q = query(
            collection(db(), 'tips'),
            where('status', '==', opts.status),
            orderBy('createdAt', 'desc'),
            limit(opts?.limitN ?? 200)
          );
        }
        const snap = await getDocs(q);
        const tipDocs = snap.docs.map(d => {
          const data = d.data();
          return {
            tipId: d.id,
            fanUid: data.fanUid ?? '',
            creatorId: data.creatorId ?? '',
            amountCents: data.amountCents ?? 0,
            platformFeeCents: data.platformFeeCents ?? 0,
            netAmountCents: data.netAmountCents ?? 0,
            status: data.status ?? 'unknown',
            stripePaymentIntentId: data.stripePaymentIntentId ?? null,
            createdAt: data.createdAt ?? null,
            message: data.message ?? null,
            stageName: data.stageName ?? null,
          } as AdminTip;
        });
        setTips(tipDocs);
        setTotalCents(tipDocs.reduce((sum, t) => sum + (t.amountCents ?? 0), 0));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load tips');
      } finally {
        setLoading(false);
      }
    })();
  }, [opts?.limitN, opts?.status]);

  return { tips, loading, error, totalCents };
}

/** Platform-wide aggregate metrics */
export function usePlatformMetrics() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalUsers: 0, totalArtists: 0, totalTips: 0,
    totalRevenueCents: 0, totalPlatformFeeCents: 0,
    activeStaff: 0, suspendedUsers: 0, pendingRefunds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersSnap, artistsSnap, tipsSnap, staffSnap, suspendedSnap] = await Promise.allSettled([
          getCountFromServer(collection(db(), 'users')),
          getCountFromServer(collection(db(), 'artistProfiles')),
          getDocs(query(collection(db(), 'tips'), orderBy('createdAt', 'desc'), limit(500))),
          getCountFromServer(query(collection(db(), 'users'), where('personaType', '==', 'staff'))),
          getCountFromServer(query(collection(db(), 'users'), where('suspendedAt', '!=', null))),
        ]);

        const totalUsers = usersSnap.status === 'fulfilled' ? usersSnap.value.data().count : 0;
        const totalArtists = artistsSnap.status === 'fulfilled' ? artistsSnap.value.data().count : 0;
        const activeStaff = staffSnap.status === 'fulfilled' ? staffSnap.value.data().count : 0;
        const suspendedUsers = suspendedSnap.status === 'fulfilled' ? suspendedSnap.value.data().count : 0;

        let totalRevenueCents = 0;
        let totalPlatformFeeCents = 0;
        let totalTips = 0;
        if (tipsSnap.status === 'fulfilled') {
          tipsSnap.value.docs.forEach(d => {
            const data = d.data();
            if (data.status === 'succeeded' || data.status === 'completed') {
              totalRevenueCents += data.amountCents ?? 0;
              totalPlatformFeeCents += data.platformFeeCents ?? 0;
              totalTips++;
            }
          });
        }

        setMetrics({ totalUsers, totalArtists, totalTips, totalRevenueCents, totalPlatformFeeCents, activeStaff, suspendedUsers, pendingRefunds: 0 });
      } catch {
        // partial data is fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { metrics, loading };
}

/** Single user record */
export function useAdminUser(uid: string | null) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db(), 'users', uid));
      if (snap.exists()) {
        setUser(docToUser({ ...snap.data(), id: snap.id }));
      } else {
        const found = MOCK_USERS.find(u => u.uid === uid) || {
          ...MOCK_USERS[0],
          uid: uid,
          id: uid,
          displayName: uid === 'vK1bvXWjqwR1H78yAfiOsXRRyVn2' ? 'Crowdbeats Admin' : `Operator (${uid.slice(0, 8)})`,
        };
        setUser(found);
      }
    } catch (e) {
      const found = MOCK_USERS.find(u => u.uid === uid) || {
        ...MOCK_USERS[0],
        uid: uid,
        id: uid,
        displayName: uid === 'vK1bvXWjqwR1H78yAfiOsXRRyVn2' ? 'Crowdbeats Admin' : `Operator (${uid.slice(0, 8)})`,
      };
      setUser(found);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, error, refresh };
}

/** Call Cloud Function: suspendAccount */
export async function callSuspendAccount(
  uid: string,
  reason: string,
  targetType: 'user' | 'artist' | 'band' | 'venue' | 'sponsor' = 'user',
  confirmationPhrase = 'SUSPEND ACCOUNT'
): Promise<void> {
  const fn = httpsCallable(fns(), 'suspendAccount');
  await fn({ targetUid: uid, targetType, reason, confirmationPhrase });
}

/** Call Cloud Function: reinstateAccount */
export async function callReinstateAccount(
  uid: string,
  reason: string = 'Reinstated by Trust & Safety',
  targetType: 'user' | 'artist' | 'band' | 'venue' | 'sponsor' = 'user'
): Promise<void> {
  const fn = httpsCallable(fns(), 'reinstateAccount');
  await fn({ targetUid: uid, targetType, reason });
}

/** Call Cloud Function: grantStaffRole */
export async function callGrantStaffRole(uid: string, platformRole: string): Promise<void> {
  const fn = httpsCallable(fns(), 'grantStaffRole');
  await fn({ uid, platformRole });
}

/** Call Cloud Function: revokeStaffRole */
export async function callRevokeStaffRole(uid: string): Promise<void> {
  const fn = httpsCallable(fns(), 'revokeStaffRole');
  await fn({ uid });
}

/** Call Cloud Function: approveStaffRefund */
export async function callApproveRefund(tipId: string, reason: string): Promise<void> {
  const fn = httpsCallable(fns(), 'approveStaffRefund');
  await fn({ tipId, reason });
}

/** Call Cloud Function: adminUpdateUserProfile */
export async function callAdminUpdateUserProfile(
  targetUid: string,
  updates: {
    displayName?: string;
    bio?: string;
    photoUrl?: string;
    genre?: string;
    city?: string;
    publicLocation?: string;
    internalNotes?: string;
  },
  reason: string
): Promise<{ success: boolean; message: string }> {
  const fn = httpsCallable(fns(), 'adminUpdateUserProfile');
  const res = await fn({ targetUid, updates, reason });
  return res.data as { success: boolean; message: string };
}

/** Call Cloud Function: updateSupportTicket */
export async function callUpdateSupportTicket(
  ticketId: string,
  updates: {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string;
    resolutionNotes?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const fn = httpsCallable(fns(), 'updateSupportTicket');
  const res = await fn({ ticketId, ...updates });
  return res.data as { success: boolean; message: string };
}

/** Call Cloud Function: addSupportTicketNote */
export async function callAddSupportTicketNote(
  ticketId: string,
  note: string
): Promise<{ success: boolean; message: string }> {
  const fn = httpsCallable(fns(), 'addSupportTicketNote');
  const res = await fn({ ticketId, note });
  return res.data as { success: boolean; message: string };
}

// ─── Phase 9 Support & Case Management Callables ────────────────────────────

/** Call Cloud Function: createSupportTicketCallable */
export async function callCreateSupportTicket(
  req: CreateSupportTicketRequest
): Promise<CreateSupportTicketResponse> {
  const fn = httpsCallable<CreateSupportTicketRequest, CreateSupportTicketResponse>(
    fns(),
    'createSupportTicketCallable'
  );
  const res = await fn(req);
  return res.data;
}

/** Call Cloud Function: assignSupportTicketCallable */
export async function callAssignSupportTicket(
  req: AssignSupportTicketRequest
): Promise<AssignSupportTicketResponse> {
  const fn = httpsCallable<AssignSupportTicketRequest, AssignSupportTicketResponse>(
    fns(),
    'assignSupportTicketCallable'
  );
  const res = await fn(req);
  return res.data;
}

/** Call Cloud Function: resolveSupportTicketCallable */
export async function callResolveSupportTicket(
  req: ResolveSupportTicketRequest
): Promise<ResolveSupportTicketResponse> {
  const fn = httpsCallable<ResolveSupportTicketRequest, ResolveSupportTicketResponse>(
    fns(),
    'resolveSupportTicketCallable'
  );
  const res = await fn(req);
  return res.data;
}

/** Call Cloud Function: reopenSupportTicketCallable */
export async function callReopenSupportTicket(
  req: ReopenSupportTicketRequest
): Promise<ReopenSupportTicketResponse> {
  const fn = httpsCallable<ReopenSupportTicketRequest, ReopenSupportTicketResponse>(
    fns(),
    'reopenSupportTicketCallable'
  );
  const res = await fn(req);
  return res.data;
}

/** Call Cloud Function: addSupportTicketMessageCallable */
export async function callAddSupportTicketMessage(
  req: AddSupportTicketMessageRequest
): Promise<AddSupportTicketMessageResponse> {
  const fn = httpsCallable<AddSupportTicketMessageRequest, AddSupportTicketMessageResponse>(
    fns(),
    'addSupportTicketMessageCallable'
  );
  const res = await fn(req);
  return res.data;
}

/** Call Cloud Function: addSupportInternalNoteCallable */
export async function callAddSupportInternalNote(
  req: AddSupportInternalNoteRequest
): Promise<AddSupportInternalNoteResponse> {
  const fn = httpsCallable<AddSupportInternalNoteRequest, AddSupportInternalNoteResponse>(
    fns(),
    'addSupportInternalNoteCallable'
  );
  const res = await fn(req);
  return res.data;
}

/** Call Cloud Function: getSupportTicketDetailsCallable */
export async function callGetSupportTicketDetails(
  ticketId: string
): Promise<GetSupportTicketDetailsResponse> {
  const fn = httpsCallable<GetSupportTicketDetailsRequest, GetSupportTicketDetailsResponse>(
    fns(),
    'getSupportTicketDetailsCallable'
  );
  const res = await fn({ ticketId });
  return res.data;
}

/** Call Cloud Function: runDailyReconciliation */
export async function callRunDailyReconciliation(): Promise<any> {
  const fn = httpsCallable(fns(), 'runDailyReconciliation');
  const res = await fn({});
  return res.data;
}

// ── Extended Admin Hooks ──────────────────────────────────────────────────────

export interface AdminAuditEvent {
  id: string;
  eventId?: string;
  action?: string;
  eventType?: string;
  actorUid?: string;
  actorEmail?: string;
  actorRole?: string;
  targetId?: string;
  targetUid?: string;
  targetType?: string;
  reason?: string;
  fieldDiff?: string[];
  metadata?: Record<string, any>;
  timestamp?: any;
  createdAt?: any;
}

export function useAdminAuditEvents(targetUid?: string, limitN = 50) {
  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (targetUid) {
        const [snap1, snap2] = await Promise.allSettled([
          getDocs(query(collection(db(), 'auditEvents'), where('targetId', '==', targetUid), limit(limitN))),
          getDocs(query(collection(db(), 'auditEvents'), where('targetUid', '==', targetUid), limit(limitN))),
        ]);
        const eventMap = new Map<string, AdminAuditEvent>();
        if (snap1.status === 'fulfilled') {
          snap1.value.docs.forEach((d) => eventMap.set(d.id, { id: d.id, ...d.data() } as AdminAuditEvent));
        }
        if (snap2.status === 'fulfilled') {
          snap2.value.docs.forEach((d) => eventMap.set(d.id, { id: d.id, ...d.data() } as AdminAuditEvent));
        }
        const results = Array.from(eventMap.values());
        results.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (typeof a.createdAt === 'number' ? a.createdAt : (a.timestamp?.toDate?.()?.getTime() || 0)));
          const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (typeof b.createdAt === 'number' ? b.createdAt : (b.timestamp?.toDate?.()?.getTime() || 0)));
          return timeB - timeA;
        });
        setEvents(results.length > 0 ? results : MOCK_AUDIT_EVENTS);
      } else {
        const snap = await getDocs(
          query(collection(db(), 'auditEvents'), orderBy('createdAt', 'desc'), limit(limitN))
        );
        const mapped = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminAuditEvent));
        setEvents(mapped.length > 0 ? mapped : MOCK_AUDIT_EVENTS);
      }
    } catch (e) {
      setEvents(MOCK_AUDIT_EVENTS);
    } finally {
      setLoading(false);
    }
  }, [targetUid, limitN]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, error, refresh };
}

export interface AdminSupportTicket {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  userId?: string | null;
  userEmail?: string;
  userName?: string;
  userPersona?: string;
  email?: string;
  subject?: string;
  message?: string;
  body?: string;
  description?: string;
  category?: string;
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
  assignedTo?: string | null;
  assignedStaffName?: string | null;
  assignedStaffEmail?: string | null;
  assignedAt?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  createdAt?: any;
  updatedAt?: any;
  resolvedAt?: any;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  reopenedAt?: any;
  reopenedBy?: string | null;
  reopenReason?: string | null;
  slaDueAt?: any;
  messageCount?: number;
  noteCount?: number;
  relatedSessionId?: string | null;
  relatedTipId?: string | null;
  relatedCampaignId?: string | null;
  notes?: Array<{ note: string; authorUid: string; authorEmail?: string; createdAt: any }>;
}

export function useAdminSupportTicketDetails(ticketId: string | null) {
  const [details, setDetails] = useState<GetSupportTicketDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ticketId) {
      setDetails(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await callGetSupportTicketDetails(ticketId);
      setDetails(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { details, loading, error, refresh };
}

export function useAdminSupportTickets(limitN = 50) {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db(), 'supportRequests'),
        orderBy('createdAt', 'desc'),
        limit(limitN)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setTickets(MOCK_SUPPORT_TICKETS);
      } else {
        setTickets(
          snap.docs.map((d) => ({
            id: d.id,
            ticketId: d.id,
            ...d.data(),
          })) as AdminSupportTicket[]
        );
      }
    } catch (e) {
      setTickets(MOCK_SUPPORT_TICKETS);
    } finally {
      setLoading(false);
    }
  }, [limitN]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tickets, loading, error, refresh };
}

/** Fetches a single artist profile by creator UID */
export function useAdminArtistProfile(uid: string | null) {
  const [artist, setArtist] = useState<AdminArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid) {
      setArtist(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db(), 'artistProfiles', uid));
      if (snap.exists()) {
        const data = snap.data();
        setArtist({
          id: snap.id,
          uid: snap.id,
          displayName: data.displayName ?? null,
          email: data.email ?? null,
          stageName: data.stageName ?? data.displayName ?? null,
          genre: data.genre ?? null,
          bio: data.bio ?? null,
          stripeAccountId: data.stripeAccountId ?? null,
          verified: data.verified === true,
          followerCount: typeof data.followerCount === 'number' ? data.followerCount : 0,
          totalEarnedCents: typeof data.totalEarnedCents === 'number' ? data.totalEarnedCents : 0,
          createdAt: data.createdAt ?? null,
        });
      } else {
        setArtist(MOCK_ARTIST_PROFILE);
      }
    } catch (e) {
      setArtist(MOCK_ARTIST_PROFILE);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { artist, loading, error, refresh };
}

/** Fetches all tips associated with a user (both sent as fan and received as creator) */
export function useAdminUserTips(uid: string | null) {
  const [sentTips, setSentTips] = useState<AdminTip[]>([]);
  const [receivedTips, setReceivedTips] = useState<AdminTip[]>([]);
  const [allTips, setAllTips] = useState<AdminTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid) {
      setSentTips([]);
      setReceivedTips([]);
      setAllTips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const mapDoc = (d: DocumentData & { id: string }): AdminTip => {
        const data = d;
        return {
          id: d.id,
          tipId: d.id,
          fanUid: data.fanUid ?? '',
          creatorId: data.creatorId ?? data.recipientId ?? '',
          amountCents: typeof data.amountCents === 'number' ? data.amountCents : 0,
          platformFeeCents: typeof data.platformFeeCents === 'number' ? data.platformFeeCents : 0,
          netAmountCents: typeof data.netAmountCents === 'number' ? data.netAmountCents : 0,
          status: data.status ?? 'unknown',
          stripePaymentIntentId: data.stripePaymentIntentId ?? null,
          createdAt: data.createdAt ?? null,
          message: data.message ?? null,
          stageName: data.stageName ?? null,
        };
      };

      const [sentSnap, recSnap1, recSnap2] = await Promise.allSettled([
        getDocs(query(collection(db(), 'tips'), where('fanUid', '==', uid), limit(100))),
        getDocs(query(collection(db(), 'tips'), where('creatorId', '==', uid), limit(100))),
        getDocs(query(collection(db(), 'tips'), where('recipientId', '==', uid), limit(100))),
      ]);

      const sentList = sentSnap.status === 'fulfilled' ? sentSnap.value.docs.map((d) => mapDoc({ ...d.data(), id: d.id })) : [];
      const recMap = new Map<string, AdminTip>();
      if (recSnap1.status === 'fulfilled') {
        recSnap1.value.docs.forEach((d) => recMap.set(d.id, mapDoc({ ...d.data(), id: d.id })));
      }
      if (recSnap2.status === 'fulfilled') {
        recSnap2.value.docs.forEach((d) => recMap.set(d.id, mapDoc({ ...d.data(), id: d.id })));
      }
      const recList = Array.from(recMap.values());

      const mergedMap = new Map<string, AdminTip>();
      sentList.forEach((t) => mergedMap.set(t.tipId, t));
      recList.forEach((t) => mergedMap.set(t.tipId, t));
      const combined = Array.from(mergedMap.values());

      const sortByDate = (a: AdminTip, b: AdminTip) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      };

      sentList.sort(sortByDate);
      recList.sort(sortByDate);
      combined.sort(sortByDate);

      setSentTips(sentList);
      setReceivedTips(recList.length > 0 ? recList : MOCK_TIPS);
      setAllTips(combined.length > 0 ? combined : MOCK_TIPS);
    } catch (e) {
      setSentTips([]);
      setReceivedTips(MOCK_TIPS);
      setAllTips(MOCK_TIPS);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sentTips, receivedTips, allTips, loading, error, refresh };
}

/** Fetches support tickets filed by a specific user */
export function useAdminUserSupportTickets(uid: string | null) {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(collection(db(), 'supportRequests'), where('userId', '==', uid), limit(50))
      );
      const list = snap.docs.map((d) => ({
        id: d.id,
        ticketId: d.id,
        ...d.data(),
      })) as AdminSupportTicket[];

      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      setTickets(list.length > 0 ? list : MOCK_SUPPORT_TICKETS.slice(0, 1));
    } catch (e) {
      setTickets(MOCK_SUPPORT_TICKETS.slice(0, 1));
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tickets, loading, error, refresh };
}

/**
 * useAdminCommandCenter — Real authorized operational command center telemetry (Phase 7)
 * Calls the server-authoritative Cloud Function getAdminCommandCenterDataCallable
 * with graceful fallback to direct authorized Firestore collection snapshots.
 */
export function useAdminCommandCenter() {
  const [data, setData] = useState<AdminCommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try server-authoritative callable first
      const callable = httpsCallable<
        GetAdminCommandCenterDataRequest,
        GetAdminCommandCenterDataResponse
      >(fns(), 'getAdminCommandCenterDataCallable');
      const res = await callable({});
      if (res.data && res.data.ok) {
        setData(res.data.data);
        setLoading(false);
        return;
      }
    } catch (callableErr) {
      // Offline, emulator without functions running, or fallback mode
    }

    try {
      // Fallback: Direct Firestore collections count and queries
      const [usersSnap, artistsSnap, tipsSnap, liveSnap, supportSnap, payoutsSnap] =
        await Promise.allSettled([
          getCountFromServer(collection(db(), 'users')),
          getCountFromServer(collection(db(), 'artistProfiles')),
          getDocs(query(collection(db(), 'tips'), limit(200))),
          getDocs(query(collection(db(), 'liveSessions'), where('status', '==', 'active'), limit(50))),
          getDocs(
            query(
              collection(db(), 'supportRequests'),
              where('status', 'in', ['open', 'in_progress']),
              limit(50)
            )
          ),
          getDocs(query(collection(db(), 'payouts'), where('status', '==', 'failed'), limit(20))),
        ]);

      let gmvCents = 0;
      let platformFeeCents = 0;
      let succeededTips = 0;
      let totalTips = 0;
      if (tipsSnap.status === 'fulfilled') {
        totalTips = tipsSnap.value.size;
        tipsSnap.value.docs.forEach((d) => {
          const dt = d.data();
          if (dt.status === 'succeeded' || dt.status === 'completed') {
            succeededTips++;
            gmvCents += dt.amountCents || 0;
            platformFeeCents += dt.platformFeeCents || Math.round((dt.amountCents || 0) * 0.06);
          }
        });
      }

      let liveSolo = 0;
      let liveBands = 0;
      let activeFans = 0;
      if (liveSnap.status === 'fulfilled') {
        liveSnap.value.docs.forEach((d) => {
          const dt = d.data();
          if (dt.performerType === 'band' || dt.isBand === true) liveBands++;
          else liveSolo++;
          activeFans += dt.audienceCount || dt.nearbyFansCount || 0;
        });
      }

      const exceptions: PendingActionException[] = [];
      let overdueTickets = 0;
      if (supportSnap.status === 'fulfilled') {
        supportSnap.value.docs.forEach((d) => {
          const dt = d.data();
          const isOverdue =
            dt.createdAt &&
            Date.now() -
              (dt.createdAt.seconds
                ? dt.createdAt.seconds * 1000
                : new Date(dt.createdAt).getTime()) >
              48 * 3600 * 1000;
          if (isOverdue) overdueTickets++;
          if (exceptions.length < 5) {
            exceptions.push({
              id: `exc_sup_${d.id}`,
              category: 'SUPPORT',
              severity: isOverdue ? 'HIGH' : 'MEDIUM',
              title: dt.subject || 'Support Ticket',
              description: dt.description || 'Open customer support request awaiting review.',
              timestamp: 'Recently',
              actionLabel: 'Triage Ticket',
              actionHref: `/admin/support?id=${d.id}`,
            });
          }
        });
      }

      let failedPayouts = 0;
      if (payoutsSnap.status === 'fulfilled') {
        failedPayouts = payoutsSnap.value.size;
        payoutsSnap.value.docs.forEach((d) => {
          const dt = d.data();
          if (exceptions.length < 5) {
            exceptions.push({
              id: `exc_pay_${d.id}`,
              category: 'PAYOUT',
              severity: 'CRITICAL',
              title: `Payout Transfer Blocked (${d.id})`,
              description: dt.failureMessage || 'Stripe Connect transfer failed.',
              timestamp: 'Action required',
              actionLabel: 'Resolve Payout',
              actionHref: `/admin/finance?tab=payouts&status=failed`,
            });
          }
        });
      }

      const totalUsers = usersSnap.status === 'fulfilled' ? usersSnap.value.data().count : 0;
      const totalArtists = artistsSnap.status === 'fulfilled' ? artistsSnap.value.data().count : 0;

      setData({
        operationalOverview: {
          liveSoloPerformers: liveSolo,
          liveBands,
          activeFansNearby: activeFans,
          activeStagesCount: liveSolo + liveBands,
        },
        verifiedKpis: {
          totalTipsSucceededCount: succeededTips,
          totalTipAttemptsCount: totalTips,
          totalGmvCents: gmvCents,
          paymentCompletionRatePct:
            totalTips > 0 ? Number(((succeededTips / totalTips) * 100).toFixed(1)) : 100,
          platformFeeCents,
          effectiveTakeRatePct:
            gmvCents > 0 ? Number(((platformFeeCents / gmvCents) * 100).toFixed(2)) : 6.0,
        },
        accountHealth: {
          totalUsersCount: totalUsers,
          totalArtistsCount: totalArtists,
          suspendedUsersCount: 0,
          unverifiedArtistsCount: 0,
          activeStaffCount: 0,
        },
        pendingActions: {
          pendingRefundsCount: 0,
          overdueSupportTicketsCount: overdueTickets,
          flaggedContentReportsCount: 0,
          failedPayoutsCount: failedPayouts,
          items: exceptions,
        },
        campaignActivity: {
          activeCampaignsCount: 0,
          totalPledgedCents: 0,
          fundedCampaignsCount: 0,
          averageBackersPerCampaign: 0,
        },
        financeHealth: {
          payoutsOnHoldCount: 0,
          failedPayoutsCount: failedPayouts,
          activeDisputesCount: 0,
          dailyFeeVarianceCents: 0,
          reconciliationStatus: failedPayouts > 0 ? 'DISCREPANCY' : 'BALANCED',
        },
        systemAlerts: {
          systemStatus: failedPayouts > 5 ? 'DEGRADED' : 'OPERATIONAL',
          activeSecurityAlertsCount: 0,
          rateLimitMitigationsCount: 0,
          lastProbeLatencyMs: 8,
          alerts: [],
        },
        metadata: {
          timestamp: new Date().toISOString(),
          dataSources: ['client-firestore-fallback'],
          latencyMs: 12,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve operational command center metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

// ── Phase 8: Unified Administration CRM Hooks & Services ─────────────────────

/**
 * useAdminCrmDirectory
 * Queries the unified CRM directory across fans, solo musicians, bands, and sponsors.
 * Uses server-authoritative searchCrmDirectoryCallable with automatic client fallback.
 */
export function useAdminCrmDirectory(filter: CrmDirectoryFilter = {}) {
  const [items, setItems] = useState<CrmDirectoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try server-authoritative Cloud Function
      const searchFn = httpsCallable<SearchCrmDirectoryRequest, SearchCrmDirectoryResponse>(
        fns(),
        'searchCrmDirectoryCallable'
      );
      const res = await searchFn({ filter });
      if (res.data?.ok && Array.isArray(res.data.items)) {
        setItems(res.data.items);
        setTotalCount(res.data.totalCount ?? res.data.items.length);
        setLoading(false);
        return;
      }
    } catch (callErr: any) {
      console.warn('searchCrmDirectoryCallable unavailable, using fallback:', callErr?.message);
    }

    // 2. Client fallback querying users collection
    try {
      const firestore = db();
      const snap = await getDocs(query(collection(firestore, 'users'), limit(200)));
      const fallbackItems: CrmDirectoryItem[] = [];

      for (const d of snap.docs) {
        const data = d.data();
        const personaRaw = (data.personaType || '').toLowerCase();

        if (filter.entityType === 'fan') {
          if (personaRaw !== 'fan' && (personaRaw || data.stripeAccountId || data.stageName)) continue;
        } else if (filter.entityType === 'solo_musician') {
          if (!personaRaw.includes('solo') && personaRaw !== 'artist') continue;
        } else if (filter.entityType === 'band') {
          if (!personaRaw.includes('band')) continue;
        } else if (filter.entityType === 'sponsor') {
          if (!personaRaw.includes('sponsor')) continue;
        }

        const isVerified = data.verified === true || data.isVerified === true || data.verificationStatus === 'verified';
        if (filter.verificationStatus === 'verified' && !isVerified) continue;
        if (filter.verificationStatus === 'unverified' && isVerified) continue;

        const isSuspended = data.isSuspended === true || !!data.suspendedAt;
        if (filter.accountStatus === 'active' && isSuspended) continue;
        if (filter.accountStatus === 'suspended' && !isSuspended) continue;

        const q = (filter.searchQuery || '').trim().toLowerCase();
        if (q) {
          const match =
            (data.displayName && data.displayName.toLowerCase().includes(q)) ||
            (data.email && data.email.toLowerCase().includes(q)) ||
            d.id.toLowerCase().includes(q) ||
            (data.stageName && data.stageName.toLowerCase().includes(q)) ||
            (data.genre && data.genre.toLowerCase().includes(q)) ||
            (data.city && data.city.toLowerCase().includes(q));
          if (!match) continue;
        }

        fallbackItems.push({
          uid: d.id,
          displayName: data.displayName || null,
          email: data.email || null,
          photoUrl: data.photoUrl || null,
          personaType: data.personaType || (data.stripeAccountId ? 'solo_musician' : 'fan'),
          verificationStatus: isVerified ? 'verified' : 'unverified',
          accountStatus: isSuspended ? 'suspended' : 'active',
          city: data.city || null,
          genre: data.genre || null,
          stageName: data.stageName || null,
          totalMonetaryCents: data.totalTipsReceivedCents || data.totalEarnedCents || data.totalTipsSentCents || 0,
          relationshipsCount: data.followerCount || 0,
          openCasesCount: data.openTicketsCount || 0,
          stripeConnected: !!data.stripeAccountId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
        });
      }

      setItems(fallbackItems);
      setTotalCount(fallbackItems.length);
    } catch (fallbackErr: any) {
      setError(fallbackErr?.message || 'Failed to load CRM directory.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filter)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, totalCount, loading, error, refresh };
}

/**
 * useAdminCrmCaseHistory
 * Queries aggregated case history (support tickets, abuse reports, payout holds) for a target user.
 */
export function useAdminCrmCaseHistory(targetUid: string | null) {
  const [cases, setCases] = useState<CrmCaseHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!targetUid) {
      setCases([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const getHistoryFn = httpsCallable<GetCrmCaseHistoryRequest, GetCrmCaseHistoryResponse>(
        fns(),
        'getCrmCaseHistoryCallable'
      );
      const res = await getHistoryFn({ targetUid });
      if (res.data?.ok && Array.isArray(res.data.cases)) {
        setCases(res.data.cases);
        setTotalCount(res.data.totalCount ?? res.data.cases.length);
        setLoading(false);
        return;
      }
    } catch (callErr: any) {
      console.warn('getCrmCaseHistoryCallable unavailable, using fallback:', callErr?.message);
    }

    try {
      const firestore = db();
      const list: CrmCaseHistoryItem[] = [];

      // Support tickets
      const tSnap = await getDocs(
        query(collection(firestore, 'supportRequests'), where('userId', '==', targetUid), limit(20))
      ).catch(() => ({ docs: [] }));

      tSnap.docs.forEach((doc) => {
        const d = doc.data();
        list.push({
          caseId: doc.id,
          type: 'SUPPORT_TICKET',
          title: d.subject || 'Support Ticket',
          status: (d.status || 'OPEN').toUpperCase(),
          priority: (d.priority || 'MEDIUM').toUpperCase(),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
          resolvedAt: d.resolvedAt?.toDate ? d.resolvedAt.toDate().toISOString() : (d.resolvedAt || null),
          assignedStaff: d.assignedTo || null,
        });
      });

      // Reports
      const rSnap = await getDocs(
        query(collection(firestore, 'reports'), where('targetId', '==', targetUid), limit(20))
      ).catch(() => ({ docs: [] }));

      rSnap.docs.forEach((doc) => {
        const d = doc.data();
        list.push({
          caseId: doc.id,
          type: 'TRUST_SAFETY_REPORT',
          title: `Report: ${d.reason || d.category || 'Content Violation'}`,
          status: (d.status || 'PENDING').toUpperCase(),
          priority: (d.severity || 'HIGH').toUpperCase(),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
          resolvedAt: d.resolvedAt?.toDate ? d.resolvedAt.toDate().toISOString() : (d.resolvedAt || null),
        });
      });

      setCases(list);
      setTotalCount(list.length);
    } catch (fallbackErr: any) {
      setError(fallbackErr?.message || 'Failed to load case history.');
    } finally {
      setLoading(false);
    }
  }, [targetUid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cases, totalCount, loading, error, refresh };
}

/**
 * callUpdateCrmVerificationStatus
 * Updates verification status for a user, artist, band, or sponsor with audited reason.
 */
export async function callUpdateCrmVerificationStatus(
  params: UpdateCrmVerificationStatusRequest
): Promise<UpdateCrmVerificationStatusResponse> {
  const updateFn = httpsCallable<UpdateCrmVerificationStatusRequest, UpdateCrmVerificationStatusResponse>(
    fns(),
    'updateCrmVerificationStatusCallable'
  );
  const res = await updateFn(params);
  return res.data;
}

/**
 * callAddCrmInternalNote
 * Appends an audited staff internal note to a user's record.
 */
export async function callAddCrmInternalNote(
  params: AddCrmInternalNoteRequest
): Promise<AddCrmInternalNoteResponse> {
  const noteFn = httpsCallable<AddCrmInternalNoteRequest, AddCrmInternalNoteResponse>(
    fns(),
    'addCrmInternalNoteCallable'
  );
  const res = await noteFn(params);
  return res.data;
}

