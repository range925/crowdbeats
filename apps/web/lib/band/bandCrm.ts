'use client';

/**
 * Crowdbeats V2 — Band Studio CRM & Governance Data Hooks & Callables (Phase 12)
 *
 * Client-side data access and hooks for Band CRM and Member Management:
 * - Band supporter segmentation and directory querying
 * - Band tip analytics and top stage session tracking
 * - Chronological engagement history and supporter dossier
 * - Privacy-respecting band thank-you notes and messaging
 * - Shared band activity feed
 * - Band governance & payout-isolated treasury querying
 */

import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  BandSupporterSummary,
  BandTipAnalytics,
  BandSupporterDetails,
  BandActivityEvent,
  BandTreasurySummary,
  GetBandSupportersRequest,
  GetBandSupportersResponse,
  GetBandSupporterDetailsRequest,
  GetBandSupporterDetailsResponse,
  SendBandThankYouNoteRequest,
  SendBandThankYouNoteResponse,
  GetBandActivityRequest,
  GetBandActivityResponse,
  InviteMemberPayload,
  RespondInvitationPayload,
  UpdateMemberRolePayload,
  RemoveMemberPayload,
  TransferOwnershipPayload,
} from '@crowdbeats/contracts';
import { firebaseApp } from '../firebase/app';

export const fns = () => getFunctions(firebaseApp, 'us-central1');

// ─── Direct Callables ─────────────────────────────────────────────────────────

export async function callGetBandSupporters(
  params: GetBandSupportersRequest
): Promise<GetBandSupportersResponse> {
  const fn = httpsCallable<GetBandSupportersRequest, GetBandSupportersResponse>(
    fns(),
    'getBandSupportersCallable'
  );
  const res = await fn(params);
  return res.data;
}

export async function callGetBandSupporterDetails(
  params: GetBandSupporterDetailsRequest
): Promise<GetBandSupporterDetailsResponse> {
  const fn = httpsCallable<GetBandSupporterDetailsRequest, GetBandSupporterDetailsResponse>(
    fns(),
    'getBandSupporterDetailsCallable'
  );
  const res = await fn(params);
  return res.data;
}

export async function callSendBandThankYouNote(
  params: SendBandThankYouNoteRequest
): Promise<SendBandThankYouNoteResponse> {
  const fn = httpsCallable<SendBandThankYouNoteRequest, SendBandThankYouNoteResponse>(
    fns(),
    'sendBandThankYouNoteCallable'
  );
  const res = await fn(params);
  return res.data;
}

export async function callGetBandActivity(
  params: GetBandActivityRequest
): Promise<GetBandActivityResponse> {
  const fn = httpsCallable<GetBandActivityRequest, GetBandActivityResponse>(
    fns(),
    'getBandActivityCallable'
  );
  const res = await fn(params);
  return res.data;
}

export async function callGetBandTreasury(
  params: { bandId: string }
): Promise<BandTreasurySummary> {
  const fn = httpsCallable<{ bandId: string }, BandTreasurySummary>(
    fns(),
    'getBandTreasury'
  );
  const res = await fn(params);
  return res.data;
}

export async function callInviteBandMember(
  params: InviteMemberPayload
): Promise<{ invitationId: string; expiresAt: string }> {
  const fn = httpsCallable<InviteMemberPayload, { invitationId: string; expiresAt: string }>(
    fns(),
    'inviteBandMember'
  );
  const res = await fn(params);
  return res.data;
}

export async function callRespondToBandInvitation(
  params: RespondInvitationPayload
): Promise<{ ok: boolean; status: string; bandId: string }> {
  const fn = httpsCallable<RespondInvitationPayload, { ok: boolean; status: string; bandId: string }>(
    fns(),
    'respondToBandInvitation'
  );
  const res = await fn(params);
  return res.data;
}

export async function callUpdateBandMemberRole(
  params: UpdateMemberRolePayload
): Promise<{ ok: boolean; bandId: string; memberUid: string; newRole: string }> {
  const fn = httpsCallable<UpdateMemberRolePayload, { ok: boolean; bandId: string; memberUid: string; newRole: string }>(
    fns(),
    'updateBandMemberRole'
  );
  const res = await fn(params);
  return res.data;
}

export async function callRemoveBandMember(
  params: RemoveMemberPayload
): Promise<{ ok: boolean; bandId: string; memberUid: string }> {
  const fn = httpsCallable<RemoveMemberPayload, { ok: boolean; bandId: string; memberUid: string }>(
    fns(),
    'removeBandMember'
  );
  const res = await fn(params);
  return res.data;
}

export async function callTransferBandOwnership(
  params: TransferOwnershipPayload
): Promise<{ ok: boolean; bandId: string; newFounderUid: string }> {
  const fn = httpsCallable<TransferOwnershipPayload, { ok: boolean; bandId: string; newFounderUid: string }>(
    fns(),
    'transferBandOwnership'
  );
  const res = await fn(params);
  return res.data;
}

// ─── React Hooks ──────────────────────────────────────────────────────────────

export function useBandSupporters(bandId?: string, filters?: Omit<GetBandSupportersRequest, 'bandId'>) {
  const [supporters, setSupporters] = useState<BandSupporterSummary[]>([]);
  const [analytics, setAnalytics] = useState<BandTipAnalytics | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [bandName, setBandName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const segmentFilter = filters?.segmentFilter || 'all';
  const searchQuery = filters?.searchQuery || '';

  const fetchSupporters = useCallback(async () => {
    if (!bandId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await callGetBandSupporters({
        bandId,
        segmentFilter,
        searchQuery,
      });
      setSupporters(res.supporters || []);
      setAnalytics(res.analytics || null);
      setTotalCount(res.totalCount || 0);
      setBandName(res.bandName || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch band supporters.');
    } finally {
      setLoading(false);
    }
  }, [bandId, segmentFilter, searchQuery]);

  useEffect(() => {
    fetchSupporters();
  }, [fetchSupporters]);

  return {
    supporters,
    analytics,
    totalCount,
    bandName,
    loading,
    error,
    refresh: fetchSupporters,
  };
}

export function useBandSupporterDetails(bandId?: string, supporterId?: string) {
  const [details, setDetails] = useState<BandSupporterDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!bandId || !supporterId) {
      setDetails(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await callGetBandSupporterDetails({ bandId, supporterId });
      setDetails(res.details || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch supporter details.');
    } finally {
      setLoading(false);
    }
  }, [bandId, supporterId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    details,
    loading,
    error,
    refresh: fetchDetails,
  };
}

export function useBandActivity(bandId?: string, filter?: 'All' | 'Band Tips' | 'Splits' | 'Gigs' | 'Roster') {
  const [activities, setActivities] = useState<BandActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!bandId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await callGetBandActivity({ bandId, filter });
      setActivities(res.activities || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch band activity.');
    } finally {
      setLoading(false);
    }
  }, [bandId, filter]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivity,
  };
}

export function useBandTreasury(bandId?: string) {
  const [treasury, setTreasury] = useState<BandTreasurySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasury = useCallback(async () => {
    if (!bandId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await callGetBandTreasury({ bandId });
      setTreasury(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch band treasury.');
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    fetchTreasury();
  }, [fetchTreasury]);

  return {
    treasury,
    loading,
    error,
    refresh: fetchTreasury,
  };
}
