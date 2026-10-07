/**
 * Crowdbeats Map Engine — Server Route Proxy (Phase 11)
 *
 * Provides vendor-neutral walking, driving, and cycling routing
 * powered by createRoutingProvider() with 30-minute in-memory caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRoutingProvider, calculateStraightLineFallback, type RouteMode } from '@/lib/maps/routing';
import type { CrowdbeatsRoute } from '@/lib/maps/types';

// In-memory cache for recent routes (30-minute TTL, max 1,000 entries)
interface CachedRoute {
  route: any;
  timestamp: number;
}
const routeCache = new Map<string, CachedRoute>();
const CACHE_TTL_MS = 30 * 60 * 1000;

const routingProvider = createRoutingProvider();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originLat, originLng, destLat, destLng, travelMode = 'walking' } = body;

    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
      return NextResponse.json(
        { error: 'Missing or invalid origin or destination coordinates' },
        { status: 400 }
      );
    }

    // Normalize mode: 'WALK' | 'walking' -> 'walking', 'DRIVE' | 'driving' -> 'driving', 'cycling' -> 'cycling'
    const rawMode = String(travelMode).toLowerCase();
    let mode: RouteMode = 'walking';
    if (rawMode.includes('drive')) mode = 'driving';
    else if (rawMode.includes('cycle') || rawMode.includes('bike')) mode = 'cycling';

    const cacheKey = `${oLat.toFixed(5)},${oLng.toFixed(5)}_${dLat.toFixed(5)},${dLng.toFixed(5)}_${mode}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.route);
    }

    const origin = { lat: oLat, lng: oLng };
    const destination = { lat: dLat, lng: dLng };

    let route = await routingProvider.calculateRoute(origin, destination, mode);
    if (!route) {
      route = calculateStraightLineFallback(origin, destination, mode);
    }

    // Compute legacy points array { lat, lng }[] for backward compatibility
    const points = route.coordinates.map(([lng, lat]) => ({ lat, lng }));
    const distanceMeters = Math.round(route.distanceMiles * 1609.34);

    const responsePayload = {
      ...route,
      points,
      distanceMeters,
    };

    // Store in cache
    routeCache.set(cacheKey, { route: responsePayload, timestamp: Date.now() });
    if (routeCache.size > 1000) {
      const firstKey = routeCache.keys().next().value;
      if (firstKey) routeCache.delete(firstKey);
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[Routes API] Internal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compute route' },
      { status: 500 }
    );
  }
}
