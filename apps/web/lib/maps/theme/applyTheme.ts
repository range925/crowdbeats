/**
 * Crowdbeats Map Theme — Override Engine (Phase 5)
 *
 * Applies Crowdbeats brand tokens to a Maptiler GL style JSON.
 * Uses exact layer IDs obtained from live Maptiler API inspection (90 layers).
 *
 * Strategy:
 *   1. Deep-clone the upstream style (avoid mutation)
 *   2. Walk every layer
 *   3. Match by layer ID (exact match or pattern) + layer type
 *   4. Merge paint/layout overrides
 *   5. Return the branded style
 *
 * This approach is resilient: unknown layers pass through unchanged.
 * New Maptiler layers are automatically unstyled (fallback to their defaults)
 * until we explicitly add rules for them.
 */

import type { CrowdbeatsMapTokens } from './tokens';
import { DARK_TOKENS, LIGHT_TOKENS } from './tokens';

type Layer = Record<string, unknown>;
type StyleJson = Record<string, unknown>;

// ── Public API ────────────────────────────────────────────────────────────────

export function applyDarkTheme(style: StyleJson): StyleJson {
  return applyTokens(style, DARK_TOKENS, 'dark');
}

export function applyLightTheme(style: StyleJson): StyleJson {
  return applyTokens(style, LIGHT_TOKENS, 'light');
}

export function applyTheme(style: StyleJson, theme: 'dark' | 'light'): StyleJson {
  return theme === 'dark' ? applyDarkTheme(style) : applyLightTheme(style);
}

// ── Core override engine ──────────────────────────────────────────────────────

function applyTokens(style: StyleJson, t: CrowdbeatsMapTokens, mode: 'dark' | 'light'): StyleJson {
  // Deep clone — never mutate the upstream response
  const s: StyleJson = JSON.parse(JSON.stringify(style));

  const layers = s.layers as Layer[];
  s.layers = layers.map((layer) => overrideLayer(layer, t, mode));

  // Override global style attribution
  s.name = mode === 'dark' ? 'Crowdbeats Night' : 'Crowdbeats Day';

  return s;
}

function overrideLayer(layer: Layer, t: CrowdbeatsMapTokens, mode: 'dark' | 'light'): Layer {
  const id = layer.id as string;
  const type = layer.type as string;

  const p = (overrides: Record<string, unknown>) => mergePaint(layer, overrides);
  const l = (overrides: Record<string, unknown>) => mergeLayout(layer, overrides);
  const hide = () => mergeLayout(layer, { visibility: 'none' });

  // ── Canvas ──────────────────────────────────────────────────────────────────
  if (id === 'Background')
    return p({ 'background-color': t.bg });

  // ── Landcover: green space ──────────────────────────────────────────────────
  if (id === 'Meadow' || id === 'Scrub' || id === 'Crop' || id === 'Grass')
    return p({ 'fill-color': t.grass, 'fill-opacity': 1 });

  if (id === 'Forest' || id === 'Wood')
    return p({ 'fill-color': t.forest, 'fill-opacity': 1 });

  if (id === 'Sand')
    return p({ 'fill-color': t.sand, 'fill-opacity': 1 });

  if (id === 'Glacier')
    return p({ 'fill-color': t.glacier, 'fill-opacity': 0.9 });

  // ── Landuse: urban zones ────────────────────────────────────────────────────
  if (id === 'Residential')
    return p({ 'fill-color': t.residential, 'fill-opacity': 1 });

  if (id === 'Industrial')
    return p({ 'fill-color': t.industrial, 'fill-opacity': 1 });

  if (id === 'Cemetery' || id === 'Hospital' || id === 'Stadium' || id === 'School')
    return p({ 'fill-color': t.institutional, 'fill-opacity': 1 });

  if (id === 'Pedestrian')
    return p({ 'fill-color': t.pedestrian, 'fill-opacity': 1 });

  if (id === 'Airport zone')
    return p({ 'fill-color': t.airportZone, 'fill-opacity': 0.8 });

  // ── Water ───────────────────────────────────────────────────────────────────
  if (id === 'Water')
    return p({ 'fill-color': t.waterFill, 'fill-opacity': 1 });

  if (id === 'Water intermittent')
    return p({ 'fill-color': t.waterIntermittent, 'fill-opacity': 0.5 });

  if (id === 'River')
    return p({ 'line-color': t.waterLine });

  if (id === 'River tunnel')
    return p({ 'line-color': t.waterLine, 'line-opacity': 0.5 });

  if (id === 'Aqueduct')
    return p({ 'line-color': t.waterLine, 'line-opacity': 0.7 });

  if (id === 'Aqueduct outline')
    return p({ 'line-color': t.waterFill });

  // ── Water labels ─────────────────────────────────────────────────────────────
  if (id === 'Ocean labels' || id === 'Lake labels' || id === 'River labels')
    return p({ 'text-color': t.waterLabel, 'text-halo-color': t.haloWater, 'text-halo-width': 1 });

  // ── Aeroway / airport ───────────────────────────────────────────────────────
  if (id === 'Heliport')
    return p({ 'fill-color': t.airportZone });

  if (id === 'Aeroway')
    return p({ 'line-color': t.aeroway });

  if (id === 'Pier')
    return p({ 'fill-color': t.pier });

  if (id === 'Pier road')
    return p({ 'line-color': t.roadMinor });

  if (id === 'Ferry line')
    return p({ 'line-color': t.waterLine, 'line-opacity': 0.6, 'line-dasharray': [3, 3] });

  // ── Tunnels ─────────────────────────────────────────────────────────────────
  if (id === 'Tunnel')
    return p({ 'line-color': t.roadTunnel, 'line-opacity': 0.7 });

  if (id === 'Tunnel outline')
    return p({ 'line-color': t.roadTunnelOutline, 'line-opacity': 0.5 });

  if (id === 'Footway tunnel')
    return p({ 'line-color': t.roadPath, 'line-opacity': 0.5 });

  if (id === 'Footway tunnel outline')
    return p({ 'line-color': t.roadPathOutline, 'line-opacity': 0.4 });

  if (id === 'Railway tunnel')
    return p({ 'line-color': t.rail, 'line-opacity': 0.6 });

  if (id === 'Railway tunnel hatching')
    return p({ 'line-color': t.railHatch, 'line-opacity': 0.4 });

  // ── Bridges ─────────────────────────────────────────────────────────────────
  if (id === 'Bridge')
    return p({ 'fill-color': t.bridgeFill, 'fill-opacity': 1 });

  if (id === 'Bridge outline')
    return p({ 'line-color': t.bridgeOutline });

  // ── Roads — casings (render below fills) ───────────────────────────────────
  if (id === 'Path outline')
    return p({ 'line-color': t.roadPathOutline, 'line-opacity': 0.4 });

  if (id === 'Minor road outline')
    return p({ 'line-color': t.roadMinorOutline });

  if (id === 'Major road outline')
    return p({ 'line-color': t.roadMajorOutline });

  if (id === 'Highway outline')
    return p({ 'line-color': t.roadHighwayOutline });

  // ── Roads — fills ──────────────────────────────────────────────────────────
  if (id === 'Path')
    return p({ 'line-color': t.roadPath, 'line-opacity': 0.7 });

  if (id === 'Path minor')
    return p({ 'line-color': t.roadPath, 'line-opacity': 0.4 });

  if (id === 'Minor road')
    return p({ 'line-color': t.roadMinor });

  if (id === 'Major road')
    return p({ 'line-color': t.roadMajor });

  if (id === 'Highway')
    return p({ 'line-color': t.roadHighway });

  if (id === 'Road under construction')
    return p({ 'line-color': t.roadUnderConstruction, 'line-dasharray': [4, 4] });

  // ── Rails ───────────────────────────────────────────────────────────────────
  if (id === 'Major rail' || id === 'Minor rail')
    return p({ 'line-color': t.rail });

  if (id === 'Major rail hatching' || id === 'Minor rail hatching')
    return p({ 'line-color': t.railHatch });

  if (id === 'Cablecar')
    return p({ 'line-color': t.rail, 'line-opacity': 0.6 });

  if (id === 'Cablecar dash')
    return p({ 'line-color': t.railHatch, 'line-opacity': 0.4 });

  // ── Buildings ────────────────────────────────────────────────────────────────
  if (id === 'Building')
    return p({ 'fill-color': t.building, 'fill-outline-color': t.buildingOutline, 'fill-opacity': 1 });

  if (id === 'Building 3D') {
    const baseColor = t.buildingExtrusion;
    return p({
      'fill-extrusion-color': [
        'interpolate', ['linear'], ['zoom'],
        14, baseColor,
        16, t.building,
      ],
      'fill-extrusion-opacity': mode === 'dark' ? 0.8 : 0.7,
    });
  }

  // ── Administrative boundaries ────────────────────────────────────────────────
  if (id === 'Country border')
    return p({ 'line-color': t.borderCountry, 'line-opacity': 0.8 });

  if (id === 'Other border')
    return p({ 'line-color': t.borderState, 'line-opacity': 0.5 });

  if (id === 'Disputed border')
    return p({ 'line-color': t.borderCountry, 'line-opacity': 0.5, 'line-dasharray': [4, 6] });

  // ── Labels: places ───────────────────────────────────────────────────────────
  if (id === 'Continent labels')
    return p({ 'text-color': t.labelCountry, 'text-halo-color': t.halo, 'text-halo-width': 1 });

  if (id === 'Country labels')
    return p({ 'text-color': t.labelCountry, 'text-halo-color': t.halo, 'text-halo-width': 1.5 });

  if (id === 'State labels')
    return p({ 'text-color': t.labelState, 'text-halo-color': t.halo, 'text-halo-width': 1.5 });

  if (id === 'Capital city labels')
    return p({ 'text-color': t.labelCityCapital, 'text-halo-color': t.halo, 'text-halo-width': 1.5 });

  if (id === 'City labels')
    return p({ 'text-color': t.labelCity, 'text-halo-color': t.halo, 'text-halo-width': 1.5 });

  if (id === 'Town labels')
    return p({ 'text-color': t.labelTown, 'text-halo-color': t.halo, 'text-halo-width': 1.5 });

  if (id === 'Place labels')
    return p({ 'text-color': t.labelNeighbourhood, 'text-halo-color': t.halo, 'text-halo-width': 1 });

  if (id === 'Airport')
    return p({ 'text-color': t.labelTown, 'text-halo-color': t.halo, 'text-halo-width': 1 });

  if (id === 'Airport gate')
    return p({ 'text-color': t.labelNeighbourhood, 'text-halo-color': t.halo, 'text-halo-width': 1 });

  // ── Labels: roads ────────────────────────────────────────────────────────────
  if (id === 'Road labels')
    return p({ 'text-color': t.labelRoad, 'text-halo-color': t.halo, 'text-halo-width': 1 });

  // Suppress highway shields — too noisy, not relevant to Crowdbeats brand
  if (id === 'Highway shield' || id === 'Highway shield (US)' ||
      id === 'Highway shield interstate top (US)' || id === 'Highway shield interstate (US)' ||
      id === 'Highway junction')
    return hide();

  if (id === 'Oneway')
    return hide();

  if (id === 'Housenumber')
    return hide(); // Suppress at all zooms — too noisy

  if (id === 'Gondola' || id === 'Ferry')
    return p({ 'text-color': t.labelRoad, 'text-halo-color': t.halo });

  // ── POI: selective suppression ───────────────────────────────────────────────
  // Keep: Park, Transport (transit stops), Station, Airport
  // Hide: Shopping, Food, Healthcare, Education, Culture, Tourism, Public, Sport

  if (id === 'Park')
    return p({
      'text-color': t.poiPark,
      'text-halo-color': t.halo,
      'text-halo-width': 1.5,
      'icon-opacity': 0.8,
    });

  if (id === 'Transport' || id === 'Station')
    return p({
      'text-color': t.poiTransport,
      'text-halo-color': t.halo,
      'text-halo-width': 1,
      'icon-opacity': mode === 'dark' ? 0.5 : 0.6,
    });

  // Suppress all other POI types — keep map clean for Crowdbeats performer markers
  if (id === 'Public' || id === 'Sport' || id === 'Education' ||
      id === 'Tourism' || id === 'Culture' || id === 'Shopping' ||
      id === 'Food' || id === 'Healthcare')
    return hide();

  // Pass through all other layers (unknown future Maptiler layers) unchanged
  return layer;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mergePaint(layer: Layer, overrides: Record<string, unknown>): Layer {
  return {
    ...layer,
    paint: { ...(layer.paint as Record<string, unknown> ?? {}), ...overrides },
  };
}

function mergeLayout(layer: Layer, overrides: Record<string, unknown>): Layer {
  return {
    ...layer,
    layout: { ...(layer.layout as Record<string, unknown> ?? {}), ...overrides },
  };
}
