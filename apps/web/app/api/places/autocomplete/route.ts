// Source: Google Maps Platform Code Assist
/**
 * Crowdbeats V2 — Google Maps Platform Places Autocomplete API Route
 *
 * Implements Google Places API (New) Autocomplete endpoint:
 * https://places.googleapis.com/v1/places:autocomplete
 *
 * Supports two intents:
 *   ?intent=location  (default) — cities / regions for fan discovery area search
 *   ?intent=venue     — bars, cafés, clubs, live music venues for musician check-in
 *
 * Terms of Service: https://cloud.google.com/maps-platform/terms
 */

import { NextRequest, NextResponse } from 'next/server';
import { CURATED_LOCATIONS, POPULAR_CHECKIN_VENUES } from '@/lib/discovery/discoveryClient';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  '';

// Place types accepted for musician venue check-in
const VENUE_PLACE_TYPES = [
  'bar',
  'cafe',
  'night_club',
  'music_store',
  'performing_arts_theater',
  'stadium',
  'restaurant',
  'food',
  'point_of_interest',
  'establishment',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = (searchParams.get('input') || '').trim();
  const intent = (searchParams.get('intent') || 'location') as 'location' | 'venue';

  if (!input || input.length < 2) {
    // For venue intent with no input, return popular check-in venues
    if (intent === 'venue') {
      return NextResponse.json({ suggestions: POPULAR_CHECKIN_VENUES.slice(0, 8) });
    }
    return NextResponse.json({ suggestions: [] });
  }

  // ── Venue Intent ──────────────────────────────────────────────────────────
  if (intent === 'venue') {
    // First: filter popular curated venues locally (fast, no API cost)
    const q = input.toLowerCase();
    const curatedMatches = POPULAR_CHECKIN_VENUES.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.address?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q)
    ).map((v) => ({
      placeId: v.placeId,
      mainText: v.name,
      secondaryText: `${v.city}, ${v.state}`,
      fullText: v.address || v.name,
      isCurated: true,
      isVenue: true,
      latitude: v.latitude,
      longitude: v.longitude,
    }));

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json({ suggestions: curatedMatches });
    }

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        },
        body: JSON.stringify({
          input,
          languageCode: 'en',
          includedPrimaryTypes: VENUE_PLACE_TYPES,
        }),
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        return NextResponse.json({ suggestions: curatedMatches });
      }

      const data = await response.json();
      const googleSuggestions = (data.suggestions || []).map((item: any) => {
        const pred = item.placePrediction;
        return {
          placeId: pred?.placeId,
          placeResource: pred?.place,
          mainText: pred?.structuredFormat?.mainText?.text || pred?.text?.text || '',
          secondaryText: pred?.structuredFormat?.secondaryText?.text || '',
          fullText: pred?.text?.text || '',
          types: pred?.types || [],
          isCurated: false,
          isVenue: true,
        };
      });

      // Merge: curated first, then Google results (deduplicate by placeId)
      const seenIds = new Set(curatedMatches.map((c) => c.placeId));
      const merged = [
        ...curatedMatches,
        ...googleSuggestions.filter((g: any) => g.placeId && !seenIds.has(g.placeId)),
      ].slice(0, 8);

      return NextResponse.json({ suggestions: merged });
    } catch {
      return NextResponse.json({ suggestions: curatedMatches });
    }
  }

  // ── Location Intent (default) — cities / regions ──────────────────────────
  if (!GOOGLE_MAPS_API_KEY) {
    const q = input.toLowerCase();
    const fallback = CURATED_LOCATIONS.filter(
      (loc) =>
        loc.city.toLowerCase().includes(q) ||
        loc.displayName.toLowerCase().includes(q)
    ).map((loc) => ({
      placeId: loc.placeId,
      mainText: loc.city,
      secondaryText: loc.administrativeArea || loc.country,
      fullText: loc.displayName,
      isCurated: true,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
    return NextResponse.json({ suggestions: fallback });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input,
        languageCode: 'en',
        includedPrimaryTypes: ['locality', 'administrative_area_level_1', 'country'],
      }),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[Places Autocomplete] API error:', response.status, errText);
      const q = input.toLowerCase();
      const fallback = CURATED_LOCATIONS.filter(
        (loc) =>
          loc.city.toLowerCase().includes(q) ||
          loc.displayName.toLowerCase().includes(q)
      ).map((loc) => ({
        placeId: loc.placeId,
        mainText: loc.city,
        secondaryText: loc.administrativeArea || loc.country,
        fullText: loc.displayName,
        isCurated: true,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
      return NextResponse.json({ suggestions: fallback });
    }

    const data = await response.json();
    const suggestions = (data.suggestions || []).map((item: any) => {
      const pred = item.placePrediction;
      return {
        placeId: pred?.placeId,
        placeResource: pred?.place,
        mainText: pred?.structuredFormat?.mainText?.text || pred?.text?.text || '',
        secondaryText: pred?.structuredFormat?.secondaryText?.text || '',
        fullText: pred?.text?.text || '',
        types: pred?.types || [],
        isCurated: false,
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('[Places Autocomplete] Exception:', error);
    return NextResponse.json({ suggestions: [], error: error.message }, { status: 500 });
  }
}
