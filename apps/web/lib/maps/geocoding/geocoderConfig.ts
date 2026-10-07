/**
 * Crowdbeats Map Engine — Geocoder Configuration (Phase 10)
 *
 * Provider-neutral geocoding configuration supporting Maptiler, Google Places,
 * Photon, and Curated fallbacks.
 */

export type GeocoderProviderType = 'maptiler' | 'google' | 'photon' | 'curated';

export interface GeocoderConfig {
  provider: GeocoderProviderType;
  apiKey: string;
  baseUrl: string;
}

export function resolveGeocoderConfig(): GeocoderConfig {
  const provider = (
    process.env.GEOCODER_PROVIDER ||
    process.env.NEXT_PUBLIC_GEOCODER_PROVIDER ||
    'maptiler'
  ) as GeocoderProviderType;

  const apiKey =
    process.env.GEOCODER_API_KEY ||
    process.env.MAP_TILE_API_KEY ||
    process.env.NEXT_PUBLIC_MAPTILER_CLIENT_KEY ||
    'ArzUcpRgBWegosIdRja9';

  let baseUrl = process.env.GEOCODER_BASE_URL || '';
  if (!baseUrl) {
    switch (provider) {
      case 'maptiler':
        baseUrl = 'https://api.maptiler.com/geocoding';
        break;
      case 'photon':
        baseUrl = 'https://photon.komoot.io/api';
        break;
      case 'google':
        baseUrl = '/api/places/autocomplete';
        break;
      case 'curated':
      default:
        baseUrl = '/api/maps/geocode';
        break;
    }
  }

  return { provider, apiKey, baseUrl };
}
