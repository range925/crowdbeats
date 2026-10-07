/**
 * Crowdbeats V2 — Client-Side Google Maps Platform Loader & Services
 *
 * Provides client-side Google Maps JavaScript API SDK loading,
 * Places Autocomplete predictions, Geocoder place resolution,
 * and DirectionsService street navigation for live discovery.
 *
 * 100% client-side: operates with zero server dependencies,
 * fully functional on static hosts (Firebase Hosting, Vercel, Netlify).
 */

import type { DiscoveryLocation } from '@crowdbeats/contracts';

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  'AIzaSyBmxMMx5bktgjykssmQnciHtcK0OYFVcQA';

export const DEFAULT_DISCOVERY_CENTER = {
  lat: 32.7157,
  lng: -117.1611,
  label: 'San Diego, CA',
  zoom: 12,
} as const;

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  isCurated?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface RouteResult {
  points: { lat: number; lng: number }[];
  durationText: string;
  distanceMilesText: string;
}

export interface AutocompleteOptions {
  sessionToken?: google.maps.places.AutocompleteSessionToken | null;
  types?: string[];
}

export interface ReverseGeocodeResult {
  displayName: string;
  city: string;
  administrativeArea: string;
  country: string;
  formattedAddress?: string;
}

let googleMapsLoadingPromise: Promise<void> | null = null;

/**
 * Creates a new Places AutocompleteSessionToken if available.
 * Session tokens group the query and selection phases of an autocomplete search
 * into a discrete session for billing purposes.
 */
export function createPlacesSessionToken(): google.maps.places.AutocompleteSessionToken | null {
  if (typeof window === 'undefined') return null;
  const placesLib = window.google?.maps?.places;
  if (placesLib?.AutocompleteSessionToken) {
    try {
      return new placesLib.AutocompleteSessionToken();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Loads Google Maps JavaScript API with Places and Geometry libraries
 */
export function loadGoogleMapsSdk(apiKey: string = GOOGLE_MAPS_API_KEY): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window undefined'));
  if (window.google?.maps?.places || (window.google?.maps?.Geocoder && window.google?.maps?.Map)) {
    return Promise.resolve();
  }

  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // If script is already loaded
    if (window.google?.maps?.places || (window.google?.maps?.Geocoder && window.google?.maps?.Map)) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-maps-js-sdk') as HTMLScriptElement | null;
    if (existingScript) {
      if (window.google?.maps?.places || (window.google?.maps?.Geocoder && window.google?.maps?.Map)) {
        resolve();
        return;
      }
      const pollTimer = setInterval(() => {
        if (window.google?.maps?.places || (window.google?.maps?.Geocoder && window.google?.maps?.Map)) {
          clearInterval(pollTimer);
          resolve();
        }
      }, 50);

      existingScript.addEventListener('load', () => {
        clearInterval(pollTimer);
        resolve();
      });
      existingScript.addEventListener('error', (e) => {
        clearInterval(pollTimer);
        googleMapsLoadingPromise = null;
        reject(e);
      });
      setTimeout(() => {
        clearInterval(pollTimer);
        if (window.google?.maps) resolve();
        else {
          googleMapsLoadingPromise = null;
          reject(new Error('Google Maps SDK load timeout'));
        }
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = async () => {
      try {
        if (typeof (window.google?.maps as any)?.importLibrary === 'function') {
          await Promise.all([
            (window.google.maps as any).importLibrary('maps').catch(() => {}),
            (window.google.maps as any).importLibrary('places').catch(() => {}),
            (window.google.maps as any).importLibrary('geocoding').catch(() => {}),
          ]);
        }
        if (window.google?.maps) {
          resolve();
        } else {
          googleMapsLoadingPromise = null;
          reject(new Error('Google Maps loaded without global namespace'));
        }
      } catch (e) {
        if (window.google?.maps) resolve();
        else {
          googleMapsLoadingPromise = null;
          reject(e);
        }
      }
    };
    script.onerror = (err) => {
      googleMapsLoadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

/**
 * Fallback prediction generator using google.maps.Geocoder.
 * Invoked if Places API is disabled, quota-exceeded, or returns REQUEST_DENIED.
 */
export async function geocodePredictionsFallback(query: string): Promise<PlacePrediction[]> {
  try {
    await loadGoogleMapsSdk();
    if (!window.google?.maps?.Geocoder) return [];

    const geocoder = new google.maps.Geocoder();
    return new Promise<PlacePrediction[]>((resolve) => {
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const mapped: PlacePrediction[] = results.slice(0, 6).map((r) => {
            let locality = '';
            const adminParts: string[] = [];
            for (const c of r.address_components) {
              if (c.types.includes('locality') || c.types.includes('postal_town') || c.types.includes('sublocality')) {
                if (!locality) locality = c.long_name;
              } else if (c.types.includes('administrative_area_level_1') || c.types.includes('country')) {
                adminParts.push(c.short_name || c.long_name);
              }
            }
            const mainText = locality || r.formatted_address.split(',')[0].trim();
            const secondaryText =
              adminParts.join(', ') || r.formatted_address.split(',').slice(1).join(',').trim();

            return {
              placeId: r.place_id || `geo_${encodeURIComponent(r.formatted_address)}`,
              mainText,
              secondaryText,
              fullText: r.formatted_address,
              latitude: r.geometry.location.lat(),
              longitude: r.geometry.location.lng(),
            };
          });
          resolve(mapped);
        } else {
          resolve([]);
        }
      });
    });
  } catch (err) {
    console.warn('[GoogleMaps] geocodePredictionsFallback error:', err);
    return [];
  }
}

/**
 * Fetches Autocomplete predictions from Google Places API client SDK.
 * Supports city/town/state/country searches (e.g. "Torrance, CA", "Austin, TX", "London, UK").
 * Suggestions start after 3 trimmed characters.
 * Supports session token grouping.
 * Automatically falls back to google.maps.Geocoder if Places API returns REQUEST_DENIED.
 */
export async function getGooglePlacePredictions(
  query: string,
  optionsOrSessionToken?: AutocompleteOptions | google.maps.places.AutocompleteSessionToken | null
): Promise<PlacePrediction[]> {
  const trimmed = query?.trim() ?? '';
  // Suggestions start after 3 trimmed characters
  if (trimmed.length < 3) return [];

  const sessionToken =
    optionsOrSessionToken && typeof optionsOrSessionToken === 'object' && 'sessionToken' in optionsOrSessionToken
      ? optionsOrSessionToken.sessionToken
      : (optionsOrSessionToken as google.maps.places.AutocompleteSessionToken | null | undefined);

  const searchTypes =
    optionsOrSessionToken && typeof optionsOrSessionToken === 'object' && 'types' in optionsOrSessionToken && optionsOrSessionToken.types
      ? optionsOrSessionToken.types
      : ['(regions)']; // default to regions: matches cities, towns, states, countries, administrative divisions

  try {
    await loadGoogleMapsSdk();
    const placesLib = (window.google?.maps as any)?.places;

    // 1. Try modern Places API (New): AutocompleteSuggestion
    if (placesLib?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      try {
        const req: any = {
          input: trimmed,
        };
        if (sessionToken) {
          req.sessionToken = sessionToken;
        }
        if (searchTypes && searchTypes.length > 0) {
          req.includedPrimaryTypes = [
            'locality',
            'administrative_area_level_1',
            'administrative_area_level_2',
            'country',
            'postal_code',
          ];
        }
        const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        if (res?.suggestions && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
          const mapped: PlacePrediction[] = [];
          for (const s of res.suggestions.slice(0, 6)) {
            const pred = s.placePrediction;
            if (pred) {
              mapped.push({
                placeId: pred.placeId,
                mainText: pred.mainText?.toString() || pred.text?.toString() || trimmed,
                secondaryText: pred.secondaryText?.toString() || '',
                fullText: pred.text?.toString() || trimmed,
              });
            }
          }
          if (mapped.length > 0) return mapped;
        }
      } catch (newApiErr: any) {
        console.warn('[GoogleMaps] Places New API error, attempting fallback:', newApiErr?.message || newApiErr);
      }
    }

    // 2. Try classic AutocompleteService if available
    if (placesLib?.AutocompleteService) {
      const placesResult = await new Promise<{ predictions: any[]; status: any }>((resolve) => {
        try {
          const service = new placesLib.AutocompleteService();
          const req: any = {
            input: trimmed,
            types: searchTypes,
          };
          if (sessionToken) {
            req.sessionToken = sessionToken;
          }
          service.getPlacePredictions(req, (predictions: any, status: any) => {
            resolve({ predictions, status });
          });
        } catch {
          resolve({ predictions: [], status: 'ERROR' });
        }
      });

      if (
        placesResult.status === placesLib.PlacesServiceStatus?.OK &&
        placesResult.predictions &&
        placesResult.predictions.length > 0
      ) {
        return placesResult.predictions.slice(0, 6).map((p: any) => ({
          placeId: p.place_id,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || '',
          fullText: p.description,
        }));
      }

      // If status indicates Places API is denied or failed, fallback seamlessly to Geocoder
      if (
        placesResult.status === placesLib.PlacesServiceStatus?.REQUEST_DENIED ||
        placesResult.status === placesLib.PlacesServiceStatus?.OVER_QUERY_LIMIT ||
        placesResult.status === 'REQUEST_DENIED' ||
        placesResult.status === 'ERROR'
      ) {
        console.warn(`[GoogleMaps] Places API status: ${placesResult.status}, falling back to Geocoder`);
        return await geocodePredictionsFallback(trimmed);
      }

      // If ZERO_RESULTS, check if Geocoder has a match (e.g. specific region/address)
      if (placesResult.status === placesLib.PlacesServiceStatus?.ZERO_RESULTS) {
        return await geocodePredictionsFallback(trimmed);
      }
    }

    // 3. Fallback to Geocoder directly
    return await geocodePredictionsFallback(trimmed);
  } catch (err) {
    console.warn('[GoogleMaps] getGooglePlacePredictions error, falling back to Geocoder:', err);
    return await geocodePredictionsFallback(trimmed);
  }
}

/**
 * Resolves coordinates and city details for a given Google Place ID via Geocoder or address fallback.
 * Guarantees exact coordinates (latitude, longitude, displayName, city, administrativeArea).
 * Never guesses coordinates from text.
 */
export async function resolveGooglePlaceLocation(
  placeId: string,
  fallbackText?: string,
  sessionToken?: any
): Promise<DiscoveryLocation | null> {
  try {
    await loadGoogleMapsSdk();
    if (!window.google?.maps?.Geocoder) return null;

    const geocoder = new google.maps.Geocoder();

    const parseGeocoderResult = (r: google.maps.GeocoderResult): DiscoveryLocation => {
      const lat = r.geometry.location.lat();
      const lng = r.geometry.location.lng();

      let city = '';
      let state = '';
      let country = 'United States';

      for (const c of r.address_components) {
        if (c.types.includes('locality') || c.types.includes('postal_town')) {
          if (!city) city = c.long_name;
        } else if (!city && c.types.includes('sublocality')) {
          city = c.long_name;
        } else if (c.types.includes('administrative_area_level_1')) {
          state = c.long_name;
        } else if (c.types.includes('country')) {
          country = c.long_name;
        }
      }

      if (!city && fallbackText) {
        city = fallbackText.split(',')[0].trim();
      }

      return {
        placeId: r.place_id || placeId,
        city: city || 'Music City',
        administrativeArea: state || 'United States',
        country,
        latitude: lat,
        longitude: lng,
        displayName: r.formatted_address || fallbackText || city,
      };
    };

    // 1. Try geocode by placeId first
    if (placeId && !placeId.startsWith('geo_')) {
      const byPlaceId = await new Promise<DiscoveryLocation | null>((resolve) => {
        geocoder.geocode({ placeId }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            resolve(parseGeocoderResult(results[0]));
          } else {
            resolve(null);
          }
        });
      });

      if (byPlaceId) return byPlaceId;
    }

    // 2. If placeId geocoding failed or was a synthetic geo_ id, fallback to address geocode
    const addressToQuery = fallbackText || placeId;
    if (addressToQuery) {
      return new Promise<DiscoveryLocation | null>((resolve) => {
        geocoder.geocode({ address: addressToQuery }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            resolve(parseGeocoderResult(results[0]));
          } else {
            resolve(null);
          }
        });
      });
    }

    return null;
  } catch (err) {
    console.warn('[GoogleMaps] resolveGooglePlaceLocation error:', err);
    return null;
  }
}

/**
 * Reverse-geocodes coordinates using google.maps.Geocoder to extract a user-friendly
 * city, neighborhood, and administrative area (e.g. "San Diego, CA").
 * If reverse geocoding fails, gracefully falls back to "Current location" without throwing.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  const fallbackResult: ReverseGeocodeResult = {
    displayName: 'Current location',
    city: '',
    administrativeArea: '',
    country: '',
  };

  try {
    await loadGoogleMapsSdk();
    if (!window.google?.maps?.Geocoder) {
      return fallbackResult;
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise<ReverseGeocodeResult>((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          let city = '';
          let state = '';
          let country = '';
          let neighborhood = '';

          for (const r of results) {
            for (const c of r.address_components) {
              if (!city && (c.types.includes('locality') || c.types.includes('postal_town'))) {
                city = c.long_name;
              }
              if (!neighborhood && (c.types.includes('neighborhood') || c.types.includes('sublocality'))) {
                neighborhood = c.long_name;
              }
              if (!state && c.types.includes('administrative_area_level_1')) {
                state = c.short_name || c.long_name;
              }
              if (!country && c.types.includes('country')) {
                country = c.long_name;
              }
            }
            if (city && state) break;
          }

          let displayName = '';
          if (neighborhood && city) {
            displayName = `${neighborhood}, ${city}`;
          } else if (city && state) {
            displayName = `${city}, ${state}`;
          } else if (city) {
            displayName = city;
          } else if (results[0]?.formatted_address) {
            const parts = results[0].formatted_address.split(',');
            displayName = parts.slice(0, 2).join(',').trim();
          }

          resolve({
            displayName: displayName || 'Current location',
            city: city || neighborhood || '',
            administrativeArea: state || '',
            country: country || '',
            formattedAddress: results[0]?.formatted_address,
          });
        } else {
          resolve(fallbackResult);
        }
      });
    });
  } catch (err) {
    console.warn('[GoogleMaps] reverseGeocodeCoordinates error, falling back:', err);
    return fallbackResult;
  }
}

/**
 * Resolves coordinates for freeform address or city query via Google Geocoder
 */
export async function geocodeCityQuery(query: string): Promise<DiscoveryLocation | null> {
  if (!query || query.trim().length < 2) return null;

  try {
    await loadGoogleMapsSdk();
    if (!window.google?.maps?.Geocoder) return null;

    const geocoder = new google.maps.Geocoder();

    return new Promise<DiscoveryLocation | null>((resolve) => {
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const r = results[0];
          const lat = r.geometry.location.lat();
          const lng = r.geometry.location.lng();

          let city = '';
          let state = '';
          let country = 'United States';

          for (const c of r.address_components) {
            if (c.types.includes('locality')) city = c.long_name;
            else if (!city && c.types.includes('sublocality')) city = c.long_name;
            else if (c.types.includes('administrative_area_level_1')) state = c.long_name;
            else if (c.types.includes('country')) country = c.long_name;
          }

          resolve({
            placeId: r.place_id || `geo_${Date.now()}`,
            city: city || query.split(',')[0].trim(),
            administrativeArea: state || 'United States',
            country,
            latitude: lat,
            longitude: lng,
            displayName: r.formatted_address || query,
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.warn('[GoogleMaps] Geocode address error:', err);
    return null;
  }
}

/**
 * Fetches venue-biased autocomplete predictions (bars, cafés, clubs, live music venues)
 * Used for musician/band check-in flows.
 */
export async function getVenuePlacePredictions(query: string): Promise<PlacePrediction[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    await loadGoogleMapsSdk();
    const placesLib = (window.google?.maps as any)?.places;

    // Try modern AutocompleteSuggestion API first
    if (placesLib?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      try {
        const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          types: ['establishment'],
        });
        if (res?.suggestions && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
          const mapped: PlacePrediction[] = [];
          for (const s of res.suggestions.slice(0, 8)) {
            const pred = s.placePrediction;
            if (pred) {
              mapped.push({
                placeId: pred.placeId,
                mainText: pred.mainText?.toString() || pred.text?.toString() || query,
                secondaryText: pred.secondaryText?.toString() || '',
                fullText: pred.text?.toString() || query,
              });
            }
          }
          if (mapped.length > 0) return mapped;
        }
      } catch {
        // fall through to legacy API
      }
    }

    // Fallback: legacy AutocompleteService with establishment bias
    if (placesLib?.AutocompleteService) {
      const service = new placesLib.AutocompleteService();
      return new Promise<PlacePrediction[]>((resolve) => {
        service.getPlacePredictions(
          { input: query, types: ['establishment'] },
          (predictions: any, status: any) => {
            if (status === placesLib.PlacesServiceStatus.OK && predictions?.length > 0) {
              resolve(
                predictions.slice(0, 8).map((p: any) => ({
                  placeId: p.place_id,
                  mainText: p.structured_formatting?.main_text || p.description,
                  secondaryText: p.structured_formatting?.secondary_text || '',
                  fullText: p.description,
                }))
              );
            } else {
              resolve([]);
            }
          }
        );
      });
    }
    return [];
  } catch {
    return [];
  }
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

/**
 * Requests the browser's GPS location with a clean Promise API.
 * Resolves with coordinates or rejects with a user-readable error string.
 */
export function requestBrowserGeolocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Your browser does not support location detection.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject('Location permission denied. Enable location in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            reject('Location unavailable. Check your device GPS.');
            break;
          case err.TIMEOUT:
            reject('Location request timed out. Try again.');
            break;
          default:
            reject('Unable to detect your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

/**
 * Straight-line distance in miles between two lat/lng points (Haversine formula)
 */
export function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates pedestrian street walking directions via Google Maps DirectionsService
 */
export async function calculateGoogleWalkingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult | null> {
  try {
    await loadGoogleMapsSdk();
    if (!window.google?.maps?.DirectionsService) return null;

    const service = new google.maps.DirectionsService();

    return new Promise<RouteResult | null>((resolve) => {
      service.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (
            status === google.maps.DirectionsStatus.OK &&
            result &&
            result.routes[0]?.overview_path
          ) {
            const points = result.routes[0].overview_path.map((p) => ({
              lat: p.lat(),
              lng: p.lng(),
            }));
            const leg = result.routes[0].legs[0];
            const durationText = leg?.duration?.text ? `${leg.duration.text} walk` : '3 min walk';
            const distanceMilesText = leg?.distance?.text || '0.2 mi';

            resolve({
              points,
              durationText,
              distanceMilesText,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (err) {
    console.warn('[GoogleMaps] DirectionsService error:', err);
    return null;
  }
}
