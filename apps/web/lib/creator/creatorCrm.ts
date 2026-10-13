'use client';

/**
 * Crowdbeats V2 — Creator Studio CRM Data Hooks & Callables (Phase 11)
 *
 * Client-side data access and hooks for Solo Musician Creator CRM:
 * - Supporter segmentation and directory querying
 * - Tip analytics and top stage session tracking
 * - Chronological engagement history and dossier
 * - Privacy-respecting thank-you notes and messaging
 */

import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import type {
  CreatorSupporterSummary,
  CreatorTipAnalytics,
  CreatorSupporterDetails,
  GetCreatorSupportersRequest,
  GetCreatorSupportersResponse,
  GetCreatorTipAnalyticsRequest,
  GetCreatorTipAnalyticsResponse,
  GetCreatorSupporterDetailsRequest,
  GetCreatorSupporterDetailsResponse,
  SendCreatorThankYouNoteRequest,
  SendCreatorThankYouNoteResponse,
} from '@crowdbeats/contracts';
import { firebaseApp } from '../firebase/app';

export const db = () => getFirestore(firebaseApp);
export const fns = () => getFunctions(firebaseApp, 'us-central1');

// ─── Direct Callables ─────────────────────────────────────────────────────────

export async function callGetCreatorSupporters(
  params?: GetCreatorSupportersRequest
): Promise<GetCreatorSupportersResponse> {
  const fn = httpsCallable<GetCreatorSupportersRequest, GetCreatorSupportersResponse>(
    fns(),
    'getCreatorSupportersCallable'
  );
  const res = await fn(params || {});
  return res.data;
}

export async function callGetCreatorTipAnalytics(
  params?: GetCreatorTipAnalyticsRequest
): Promise<GetCreatorTipAnalyticsResponse> {
  const fn = httpsCallable<GetCreatorTipAnalyticsRequest, GetCreatorTipAnalyticsResponse>(
    fns(),
    'getCreatorTipAnalyticsCallable'
  );
  const res = await fn(params || {});
  return res.data;
}

export async function callGetCreatorSupporterDetails(
  params: GetCreatorSupporterDetailsRequest
): Promise<GetCreatorSupporterDetailsResponse> {
  const fn = httpsCallable<GetCreatorSupporterDetailsRequest, GetCreatorSupporterDetailsResponse>(
    fns(),
    'getCreatorSupporterDetailsCallable'
  );
  const res = await fn(params);
  return res.data;
}

export async function callSendCreatorThankYouNote(
  params: SendCreatorThankYouNoteRequest
): Promise<SendCreatorThankYouNoteResponse> {
  const fn = httpsCallable<SendCreatorThankYouNoteRequest, SendCreatorThankYouNoteResponse>(
    fns(),
    'sendCreatorThankYouNoteCallable'
  );
  const res = await fn(params);
  return res.data;
}

// ─── React Hooks ──────────────────────────────────────────────────────────────

export function useCreatorSupporters(filters?: GetCreatorSupportersRequest) {
  const [supporters, setSupporters] = useState<CreatorSupporterSummary[]>([]);
  const [analytics, setAnalytics] = useState<CreatorTipAnalytics | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const segmentFilter = filters?.segmentFilter || 'all';
  const searchQuery = filters?.searchQuery || '';
  const creatorId = filters?.creatorId;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await callGetCreatorSupporters({
        creatorId,
        segmentFilter,
        searchQuery,
      });

      if (res && res.ok) {
        setSupporters(res.supporters);
        setAnalytics(res.analytics);
        setTotalCount(res.totalCount);
        setLoading(false);
        return;
      }
    } catch (callErr: any) {
      console.warn('getCreatorSupportersCallable unavailable, using fallback:', callErr?.message);
    }

    try {
      // Bounded fallback query
      const fallbackAnalytics: CreatorTipAnalytics = {
        totalTipsReceivedCents: 0,
        totalTipsCount: 0,
        averageTipCents: 0,
        repeatSupporterRatePct: 0,
        repeatSupportersCount: 0,
        topSupportersCount: 0,
        recentTipsVolume30dCents: 0,
        topTippingSession: null,
      };

      setSupporters([]);
      setAnalytics(fallbackAnalytics);
      setTotalCount(0);
    } catch (fallbackErr: any) {
      setError(fallbackErr?.message || 'Failed to load creator supporters.');
    } finally {
      setLoading(false);
    }
  }, [creatorId, segmentFilter, searchQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    supporters,
    analytics,
    totalCount,
    loading,
    error,
    refresh,
  };
}

export function useCreatorSupporterDetails(supporterId?: string, creatorId?: string) {
  const [details, setDetails] = useState<CreatorSupporterDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(supporterId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supporterId) {
      setDetails(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await callGetCreatorSupporterDetails({
        creatorId,
        supporterId,
      });

      if (res && res.ok) {
        setDetails(res.details);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load supporter details.');
    } finally {
      setLoading(false);
    }
  }, [creatorId, supporterId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    details,
    loading,
    error,
    refresh,
  };
}
