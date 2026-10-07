/**
 * Crowdbeats Map Engine — User Location Marker (Phase 6)
 *
 * Creates a Crowdbeats-original current-location indicator:
 *   • Inner green dot + white border
 *   • Soft pulsing ring (ambient, not distracting)
 *   • Accuracy radius circle (sized in pixels from meters + current zoom)
 *   • Heading arrow (rotates when device compass available)
 *
 * Not a generic Google/Uber copy — designed specifically for Crowdbeats.
 *
 * Usage:
 *   const { el, updateAccuracy, updateHeading, updatePosition } = createUserLocationElement();
 *   new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map);
 */

export interface UserLocationMarkerAPI {
  el: HTMLElement;
  /**
   * Update the accuracy circle size.
   * @param meters   GPS accuracy in metres (0 = hide ring)
   * @param zoom     Current map zoom (used to convert metres → pixels)
   * @param lat      Current latitude (used for metres-per-pixel calculation)
   */
  updateAccuracy: (meters: number, zoom: number, lat: number) => void;
  /**
   * Update the compass heading arrow.
   * @param degrees  Heading in degrees (0=N, 90=E). null = hide arrow.
   */
  updateHeading: (degrees: number | null) => void;
}

/**
 * Build the user location DOM element + controller API.
 */
export function createUserLocationElement(): UserLocationMarkerAPI {
  const root = document.createElement('div');
  root.className = 'cb-user-marker';
  root.setAttribute('aria-label', 'Your location');
  root.setAttribute('aria-live', 'polite');
  root.style.width = '20px';
  root.style.height = '20px';

  // Accuracy ring (resized dynamically)
  const accuracyEl = document.createElement('div');
  accuracyEl.className = 'cb-user-accuracy';
  accuracyEl.style.display = 'none'; // hidden until accuracy known
  root.appendChild(accuracyEl);

  // Heading arrow container (rotated via transform)
  const headingEl = document.createElement('div');
  headingEl.className = 'cb-user-heading';
  headingEl.style.display = 'none';
  const arrowEl = document.createElement('div');
  arrowEl.className = 'cb-user-heading-arrow';
  headingEl.appendChild(arrowEl);
  root.appendChild(headingEl);

  // Location dot
  const dotEl = document.createElement('div');
  dotEl.className = 'cb-user-dot';
  const dotInner = document.createElement('div');
  dotInner.className = 'cb-user-dot-inner';
  dotEl.appendChild(dotInner);

  // Pulse ring on the dot
  const pulseRing = document.createElement('div');
  pulseRing.className = 'cb-user-pulse-ring';
  dotEl.appendChild(pulseRing);

  root.appendChild(dotEl);

  // ── Controller API ─────────────────────────────────────────────────────
  function updateAccuracy(meters: number, zoom: number, lat: number): void {
    if (meters <= 0) {
      accuracyEl.style.display = 'none';
      return;
    }

    // Convert accuracy (metres) → pixel radius at current zoom + latitude
    // Using Mercator projection: pixels/metre = (256 * 2^zoom) / (2π * R * cos(lat_rad))
    const R = 6378137; // Earth radius in metres
    const latRad = (lat * Math.PI) / 180;
    const metersPerPixel = (2 * Math.PI * R * Math.cos(latRad)) / (256 * Math.pow(2, zoom));
    const radiusPx = Math.max(10, Math.round(meters / metersPerPixel));
    const sizePx = radiusPx * 2;

    accuracyEl.style.display = 'block';
    accuracyEl.style.width  = `${sizePx}px`;
    accuracyEl.style.height = `${sizePx}px`;
    accuracyEl.style.marginLeft = `${-radiusPx}px`;
    accuracyEl.style.marginTop  = `${-radiusPx}px`;
  }

  function updateHeading(degrees: number | null): void {
    if (degrees === null) {
      headingEl.style.display = 'none';
    } else {
      headingEl.style.display = 'flex';
      headingEl.style.transform = `rotate(${degrees}deg)`;
    }
  }

  return { el: root, updateAccuracy, updateHeading };
}
