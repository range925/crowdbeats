// Source: Google Maps Platform Code Assist
/**
 * Crowdbeats V2 — Google Maps Platform Place Details API Route
 *
 * Implements Google Places API (New) Place Details endpoint:
 * https://places.googleapis.com/v1/places/{placeId}
 *
 * Terms of Service: https://cloud.google.com/maps-platform/terms
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DiscoveryLocation } from '@crowdbeats/contracts';
import { CURATED_LOCATIONS } from '@/lib/discovery/discoveryClient';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = (searchParams.get('placeId') || '').trim();

  if (!placeId) {
    return NextResponse.json({ error: 'Missing placeId parameter' }, { status: 400 });
  }

  // Check if it's already one of our curated locations
  const curated = CURATED_LOCATIONS.find((c) => c.placeId === placeId);
  if (curated) {
    return NextResponse.json({ location: curated });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured on server' },
      { status: 500 }
    );
  }

  try {
    const resourceName = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
    const response = await fetch(`https://places.googleapis.com/v1/${resourceName}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
      },
      next: { revalidate: 86400 }, // Cache place details for 24 hours
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[Places Details] API error:', response.status, errText);
      return NextResponse.json(
        { error: 'Failed to fetch place details from Google Maps Platform' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const lat = data.location?.latitude;
    const lng = data.location?.longitude;

    if (lat == null || lng == null) {
      return NextResponse.json({ error: 'Coordinates missing for place' }, { status: 404 });
    }

    // Extract city & state from addressComponents
    let city = data.displayName?.text || '';
    let adminArea = '';
    let country = 'United States';

    if (Array.isArray(data.addressComponents)) {
      for (const comp of data.addressComponents) {
        const types: string[] = comp.types || [];
        if (types.includes('locality') || types.includes('postal_town') || types.includes('sublocality_level_1')) {
          city = comp.longText || comp.shortText || city;
        } else if (types.includes('administrative_area_level_1')) {
          adminArea = comp.longText || comp.shortText || adminArea;
        } else if (types.includes('country')) {
          country = comp.longText || comp.shortText || country;
        }
      }
    }

    const resolvedLocation: DiscoveryLocation = {
      placeId: data.id || placeId,
      city: city || data.displayName?.text || 'Selected City',
      administrativeArea: adminArea,
      country: country,
      latitude: lat,
      longitude: lng,
      displayName: data.formattedAddress || `${city}, ${adminArea}`,
    };

    return NextResponse.json({ location: resolvedLocation });
  } catch (error: any) {
    console.error('[Places Details] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
