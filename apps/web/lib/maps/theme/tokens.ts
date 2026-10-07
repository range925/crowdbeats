/**
 * Crowdbeats Map Theme — Design Tokens (Phase 5)
 *
 * Every color used in the map themes lives here.
 * Brand accent: #00F076 (neon green)
 */

export interface CrowdbeatsMapTokens {
  // Canvas
  bg:                string;
  // Water
  waterFill:         string;
  waterIntermittent: string;
  waterLine:         string;
  waterLabel:        string;
  waterLabelHalo:    string;
  // Land
  grass:             string;
  forest:            string;
  sand:              string;
  glacier:           string;
  // Landuse
  residential:       string;
  commercial:        string;
  industrial:        string;
  institutional:     string;   // hospital, school, stadium, cemetery
  pedestrian:        string;
  airportZone:       string;
  // Roads — fills
  roadPath:          string;
  roadMinor:         string;
  roadMajor:         string;
  roadHighway:       string;
  roadUnderConstruction: string;
  roadTunnel:        string;
  // Roads — casings (always darker than fill)
  roadPathOutline:   string;
  roadMinorOutline:  string;
  roadMajorOutline:  string;
  roadHighwayOutline: string;
  roadTunnelOutline: string;
  // Bridge
  bridgeOutline:     string;
  bridgeFill:        string;
  // Rails
  rail:              string;
  railHatch:         string;
  // Buildings
  building:          string;
  buildingOutline:   string;
  buildingExtrusion: string;
  // Boundaries
  borderCountry:     string;
  borderState:       string;
  // Misc infrastructure
  aeroway:           string;
  pier:              string;
  // Labels — text colors
  labelCity:         string;
  labelCityCapital:  string;
  labelTown:         string;
  labelState:        string;
  labelCountry:      string;
  labelNeighbourhood: string;
  labelRoad:         string;
  // Label halos (background glow)
  halo:              string;
  haloWater:         string;
  // POI
  poiPark:           string;
  poiTransport:      string;
}

// ── CROWDBEATS DARK — "Night" ─────────────────────────────────────────────────
// Near-black canvas, deep water, subtle roads, neon accent on performers.
export const DARK_TOKENS: CrowdbeatsMapTokens = {
  bg:                '#0a0b0e',

  waterFill:         '#0d1825',
  waterIntermittent: '#0d1825',
  waterLine:         '#111f30',
  waterLabel:        '#1a3050',
  waterLabelHalo:    '#0d1825',

  grass:             '#0d1410',
  forest:            '#0e1c0e',
  sand:              '#131510',
  glacier:           '#181a22',

  residential:       '#0c0d12',
  commercial:        '#0f1018',
  industrial:        '#0d0e14',
  institutional:     '#0d1018',
  pedestrian:        '#111420',
  airportZone:       '#101218',

  roadPath:          '#16182a',
  roadMinor:         '#191c28',
  roadMajor:         '#22263c',
  roadHighway:       '#32375c',
  roadUnderConstruction: '#1e2038',
  roadTunnel:        '#141720',

  roadPathOutline:   '#0d0e16',
  roadMinorOutline:  '#0e0f18',
  roadMajorOutline:  '#131628',
  roadHighwayOutline: '#181c38',
  roadTunnelOutline: '#0a0b10',

  bridgeOutline:     '#0e0f18',
  bridgeFill:        '#1a1d2a',

  rail:              '#1e2232',
  railHatch:         '#0a0b0e',

  building:          '#111318',
  buildingOutline:   '#1c1f2e',
  buildingExtrusion: '#131620',

  borderCountry:     '#2a2f50',
  borderState:       '#1e2232',

  aeroway:           '#1a1d28',
  pier:              '#111520',

  labelCity:         '#c4c7d4',
  labelCityCapital:  '#e5e7eb',
  labelTown:         '#9ca3af',
  labelState:        '#6b7280',
  labelCountry:      '#9ca3af',
  labelNeighbourhood: '#374151',
  labelRoad:         '#4b5563',

  halo:              '#0a0b0e',
  haloWater:         '#0d1825',

  poiPark:           '#00F076',
  poiTransport:      '#4b5563',
};

// ── CROWDBEATS LIGHT — "Day" ──────────────────────────────────────────────────
// Clean white canvas, calm blue water, subtle gray roads, dark text.
export const LIGHT_TOKENS: CrowdbeatsMapTokens = {
  bg:                '#f8f9fb',

  waterFill:         '#b8cfe0',
  waterIntermittent: '#b8cfe0',
  waterLine:         '#9ebcd0',
  waterLabel:        '#5a88a8',
  waterLabelHalo:    '#c8daeb',

  grass:             '#e8f0e4',
  forest:            '#d4e8c8',
  sand:              '#f0ead8',
  glacier:           '#e8eef8',

  residential:       '#f2f2f5',
  commercial:        '#ebebef',
  industrial:        '#e8e8ec',
  institutional:     '#eef0f4',
  pedestrian:        '#ebebef',
  airportZone:       '#eaebf0',

  roadPath:          '#d8d8de',
  roadMinor:         '#e0e0e6',
  roadMajor:         '#d0d0d8',
  roadHighway:       '#b8b8c8',
  roadUnderConstruction: '#d8d8dc',
  roadTunnel:        '#dadae0',

  roadPathOutline:   '#c8c8d2',
  roadMinorOutline:  '#c4c4ce',
  roadMajorOutline:  '#b4b4c0',
  roadHighwayOutline: '#9898ac',
  roadTunnelOutline: '#d0d0d8',

  bridgeOutline:     '#c4c4ce',
  bridgeFill:        '#e8e8f0',

  rail:              '#d0d0d8',
  railHatch:         '#f0f0f4',

  building:          '#e4e4ea',
  buildingOutline:   '#d0d0d8',
  buildingExtrusion: '#e0e0e8',

  borderCountry:     '#9ca3af',
  borderState:       '#c4c7d0',

  aeroway:           '#d8dae0',
  pier:              '#dddee4',

  labelCity:         '#1f2937',
  labelCityCapital:  '#111827',
  labelTown:         '#4b5563',
  labelState:        '#6b7280',
  labelCountry:      '#374151',
  labelNeighbourhood: '#9ca3af',
  labelRoad:         '#9ca3af',

  halo:              '#f8f9fb',
  haloWater:         '#c8daeb',

  poiPark:           '#1a7a3a',
  poiTransport:      '#6b7280',
};
