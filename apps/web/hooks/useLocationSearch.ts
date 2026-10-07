'use client';

/**
 * Crowdbeats — useLocationSearch Hook (Phase 10 — Location Search & Autocomplete)
 *
 * Provides debounced location search with:
 *   1. 3-character threshold before firing.
 *   2. 300ms debounce.
 *   3. AbortController request cancellation to prevent stale response races.
 *   4. Client-side in-memory caching to avoid duplicate requests.
 *   5. Normalized CrowdbeatsSearchResult[] suggestions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CrowdbeatsSearchResult } from '@/lib/maps/types';
import { mapObservability } from '@/lib/maps/observability';

export interface UseLocationSearchOptions {
  /** Debounce delay in milliseconds. Default: 300ms (within 250–400ms range). */
  debounceMs?: number;
  /** Minimum characters to trigger autocomplete. Default: 3. */
  minChars?: number;
  /** Custom endpoint or baseUrl. Default: '/api/maps/geocode'. */
  endpoint?: string;
}

export interface UseLocationSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: CrowdbeatsSearchResult[];
  isLoading: boolean;
  error: string | null;
  clearResults: () => void;
  isCached: boolean;
}

// In-memory client-side cache
const clientSearchCache = new Map<string, CrowdbeatsSearchResult[]>();

export function useLocationSearch({
  debounceMs = 300,
  minChars = 3,
  endpoint = '/api/maps/geocode',
}: UseLocationSearchOptions = {}): UseLocationSearchResult {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CrowdbeatsSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResults = useCallback(() => {
    setResults([]);
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    const q = query.trim();

    // Clear results if below character threshold
    if (!q || q.length < minChars) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check client in-memory cache first (instant 0ms response)
    const cacheKey = q.toLowerCase();
    if (clientSearchCache.has(cacheKey)) {
      setResults(clientSearchCache.get(cacheKey)!);
      setIsLoading(false);
      setIsCached(true);
      return;
    }

    setIsCached(false);

    // Cancel previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const url = `${endpoint}?q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          throw new Error(`Search request failed (${res.status})`);
        }

        const data = await res.json();
        const searchResults: CrowdbeatsSearchResult[] = data.results || [];

        // Store in client cache
        clientSearchCache.set(cacheKey, searchResults);

        // Keep cache size bounded
        if (clientSearchCache.size > 200) {
          const firstKey = clientSearchCache.keys().next().value;
          if (firstKey) clientSearchCache.delete(firstKey);
        }

        setResults(searchResults);
        setIsLoading(false);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Normal cancellation — do not treat as error
          return;
        }
        console.error('[useLocationSearch] Error:', err);
        const errMsg = err.message || 'Failed to search locations';
        mapObservability.recordEvent('geocoder_error', errMsg, {
          provider: 'geocoder',
          details: { endpoint },
        });
        setError(errMsg);
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [query, debounceMs, minChars, endpoint]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearResults,
    isCached,
  };
}
