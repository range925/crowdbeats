/**
 * Crowdbeats Map Engine — Marker Factory (Phase 6)
 *
 * Builds DOM elements for every Crowdbeats marker type.
 * All visual styling is handled via CSS classes (markerStyles.ts).
 * No inline styles at the component level — enables GPU-composited animations.
 *
 * Marker types:
 *   artist / solo          — solo musician (non-live)
 *   band                   — band (non-live)
 *   live / live-solo       — live solo musician (animated pulse)
 *   live-band              — live band (animated pulse)
 *   venue                  — venue (pill label)
 *   sponsored              — performer with sponsor crown badge
 *   saved                  — performer with saved bookmark badge
 *   featured               — performer with featured star badge
 *   cluster                — aggregated cluster count
 *   user                   — current user location (see UserLocationMarker.ts)
 */

import type {
  CrowdbeatsMapMarker,
  CrowdbeatsArtistMarker,
  CrowdbeatsBandMarker,
  CrowdbeatsLiveMarker,
  CrowdbeatsVenueMarker,
  CrowdbeatsCluster,
  MarkerType,
  MapTheme,
} from '../types';

// SVG icons (inline — no external dependency)
const ICON_NOTE   = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
const ICON_BAND   = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zM17 7V3h-2v4h2z"/></svg>`;
const ICON_PIN    = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
const ICON_CROWN  = '♛';
const ICON_STAR   = '★';
const ICON_SAVE   = '♥';

// Is the marker type a live performer?
const LIVE_TYPES: ReadonlySet<MarkerType> = new Set(['live', 'live-solo', 'live-band']);

/**
 * Build a DOM element for a Crowdbeats marker.
 *
 * @param marker  The marker data
 * @param theme   Current map theme — applied via data-cb-theme on an ancestor
 * @returns       HTMLElement to pass to new maplibregl.Marker({ element })
 */
export function createMarkerElement(
  marker: CrowdbeatsMapMarker,
  theme: MapTheme = 'dark'
): HTMLElement {
  const root = document.createElement('div');
  root.className = `cb-marker cb-marker--${marker.type} cb-standard`;
  root.setAttribute('role', 'button');
  root.setAttribute('tabindex', '0');
  root.setAttribute('aria-label', marker.label);
  root.dataset.markerId = marker.id;
  root.dataset.markerType = marker.type;
  if (marker.type === 'cluster') {
    const cl = marker as CrowdbeatsCluster;
    root.classList.add(cl.hasLive ? 'cb-cluster--live' : 'cb-cluster--inactive');
    root.setAttribute('title', `${cl.count} acts in this area${cl.hasLive ? ' (Live now)' : ''} - Click to expand`);
  }

  const clusterHasLive = marker.type === 'cluster' && Boolean((marker as CrowdbeatsCluster).hasLive);
  const isLive = LIVE_TYPES.has(marker.type as MarkerType) || clusterHasLive;

  // ── Pulse rings (LIVE only) ────────────────────────────────────────────────
  if (isLive) {
    root.appendChild(makePulseRing(false));
    root.appendChild(makePulseRing(true)); // staggered
  }

  // ── Marker body ───────────────────────────────────────────────────────────
  root.appendChild(makeBody(marker, theme, isLive));

  return root;
}

// ── Internal builders ──────────────────────────────────────────────────────

function makePulseRing(delayed: boolean): HTMLElement {
  const ring = document.createElement('div');
  ring.className = delayed ? 'cb-marker-pulse cb-marker-pulse--delay' : 'cb-marker-pulse';
  return ring;
}

function makeBody(
  marker: CrowdbeatsMapMarker,
  theme: MapTheme,
  isLive: boolean
): HTMLElement {
  const body = document.createElement('div');
  body.className = 'cb-marker-body';

  // Venue uses a pill label layout — special case
  if (marker.type === 'venue') {
    return makeVenueBody(marker as CrowdbeatsVenueMarker, body);
  }

  // Cluster marker
  if (marker.type === 'cluster') {
    return makeClusterBody(marker as CrowdbeatsCluster, body);
  }

  // ── Avatar (photo or icon) ──────────────────────────────────────────────
  const photoUrl = resolvePhotoUrl(marker);

  // Photo (shown in full zoom state)
  if (photoUrl) {
    const img = document.createElement('img');
    img.src = photoUrl;
    img.className = 'cb-marker-photo';
    img.alt = marker.label;
    img.loading = 'lazy';
    img.decoding = 'async';
    // Guard against broken images — fall back to icon
    img.onerror = () => { img.style.display = 'none'; icon.style.display = 'flex'; };
    body.appendChild(img);
  }

  // Icon (shown in standard zoom state or if no photo)
  const icon = document.createElement('div');
  icon.className = 'cb-marker-icon';
  icon.innerHTML = resolveIcon(marker.type as MarkerType);
  body.appendChild(icon);

  // ── LIVE dot badge (bottom-right) ─────────────────────────────────────
  if (isLive) {
    const dot = document.createElement('div');
    dot.className = 'cb-marker-live-dot';
    body.appendChild(dot);
  }

  // ── Overlay badges (sponsored / saved / featured) ─────────────────────
  const badgeType = resolveBadge(marker.type as MarkerType);
  if (badgeType) {
    const badge = document.createElement('div');
    badge.className = `cb-marker-badge cb-marker-badge--${badgeType.cls}`;
    badge.textContent = badgeType.glyph;
    badge.setAttribute('aria-hidden', 'true');
    body.appendChild(badge);
  }

  return body;
}

function makeVenueBody(marker: CrowdbeatsVenueMarker, body: HTMLElement): HTMLElement {
  // Icon
  const icon = document.createElement('div');
  icon.className = 'cb-marker-icon';
  icon.innerHTML = ICON_PIN;
  icon.style.width = '16px';
  icon.style.height = '16px';
  body.appendChild(icon);

  // Venue name
  const label = document.createElement('span');
  label.className = 'cb-marker-venue-label';
  label.textContent = marker.venueName;
  body.appendChild(label);

  // Active count
  if (marker.activeMusiciansCount && marker.activeMusiciansCount > 0) {
    const count = document.createElement('span');
    count.className = 'cb-marker-venue-count';
    count.textContent = `${marker.activeMusiciansCount} live`;
    body.appendChild(count);
  }

  return body;
}

function makeClusterBody(marker: CrowdbeatsCluster, body: HTMLElement): HTMLElement {
  const hasLive = Boolean(marker.hasLive);
  const countText = marker.count > 999 ? '999+' : String(marker.count);

  const countSpan = document.createElement('span');
  countSpan.className = 'cb-cluster-count';
  countSpan.textContent = countText;
  body.appendChild(countSpan);

  if (hasLive) {
    const liveBadge = document.createElement('div');
    liveBadge.className = 'cb-cluster-live-badge';

    const dot = document.createElement('span');
    dot.className = 'cb-cluster-live-dot';
    liveBadge.appendChild(dot);

    const text = document.createElement('span');
    text.textContent = marker.liveCount && marker.liveCount > 1 ? `${marker.liveCount} LIVE` : 'LIVE';
    liveBadge.appendChild(text);

    body.appendChild(liveBadge);
  } else {
    const subSpan = document.createElement('span');
    subSpan.className = 'cb-cluster-inactive-sub';
    subSpan.textContent = 'ACTS';
    body.appendChild(subSpan);
  }

  return body;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function resolvePhotoUrl(marker: CrowdbeatsMapMarker): string | undefined {
  if ('photoUrl' in marker) return (marker as any).photoUrl as string | undefined;
  return undefined;
}

function resolveIcon(type: MarkerType): string {
  switch (type) {
    case 'band':
    case 'live-band':
      return ICON_BAND;
    case 'venue':
      return ICON_PIN;
    default:
      return ICON_NOTE; // solo / live-solo / artist / live / sponsored / saved / featured
  }
}

function resolveBadge(type: MarkerType): { cls: string; glyph: string } | null {
  switch (type) {
    case 'sponsored': return { cls: 'crown', glyph: ICON_CROWN };
    case 'featured':  return { cls: 'star',  glyph: ICON_STAR  };
    case 'saved':     return { cls: 'save',  glyph: ICON_SAVE  };
    default:          return null;
  }
}

/**
 * Updates the zoom state classes on a marker element.
 * Called by MapLibreMapProvider on 'zoomend'.
 */
export function applyZoomClass(el: HTMLElement, zoom: number): void {
  el.classList.toggle('cb-compact',  zoom <  12);
  el.classList.toggle('cb-standard', zoom >= 12 && zoom < 14);
  el.classList.toggle('cb-full',     zoom >= 14);
}
