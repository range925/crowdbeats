/**
 * Crowdbeats Map Engine — Marker CSS (Phase 6)
 *
 * Injected once into the document <head> via injectMarkerStyles().
 * All marker visuals live here. Components add/remove CSS classes —
 * no inline style mutations at runtime (GPU-friendly).
 *
 * Animation strategy:
 *   - ONLY transform + opacity are animated (composited, no layout/paint).
 *   - will-change: transform, opacity declared on animated elements.
 *   - prefers-reduced-motion: collapses all animations to static state.
 *   - Pulse rings use staggered animation-delay for continuous live feel.
 *
 * Zoom classes (applied by MapLibreMapProvider on zoomend):
 *   .cb-compact   zoom < 12  → minimal dot
 *   .cb-standard  zoom 12-14 → 32px icon circle
 *   .cb-full      zoom ≥ 14  → 44px avatar circle
 */

export const MARKER_STYLE_TAG_ID = 'cb-map-marker-styles-v6';

export const MARKER_STYLES = `
/* ── Keyframes ─────────────────────────────────────────────────────────────── */

@keyframes cb-live-pulse {
  0%   { transform: scale(1);   opacity: 0.55; }
  75%  { transform: scale(2.8); opacity: 0;    }
  100% { transform: scale(2.8); opacity: 0;    }
}

@keyframes cb-user-pulse {
  0%   { transform: scale(1);   opacity: 0.4; }
  75%  { transform: scale(1.9); opacity: 0;   }
  100% { transform: scale(1.9); opacity: 0;   }
}

@keyframes cb-marker-appear {
  0%   { transform: scale(0.4); opacity: 0; }
  70%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}

/* ── Base marker container ──────────────────────────────────────────────────── */

.cb-marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  /* Entrance animation */
  animation: cb-marker-appear 240ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* ── Marker body (the circle/shape) ─────────────────────────────────────────── */

.cb-marker-body {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #111318;
  border: 2.5px solid rgba(255, 255, 255, 0.25);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(0, 0, 0, 0.4);
  will-change: transform, opacity, box-shadow;
  transition:
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity   180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

/* ── Photo & icon inside body ───────────────────────────────────────────────── */

.cb-marker-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
}

.cb-marker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 16px;
  line-height: 1;
  color: #9ca3af;
}

.cb-marker-icon svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

/* ── LIVE pulse rings ────────────────────────────────────────────────────────── */

.cb-marker-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: transparent;
  border: 2px solid #00F076;
  pointer-events: none;
  will-change: transform, opacity;
  animation: cb-live-pulse 2.6s cubic-bezier(0.2, 0, 0.8, 1) infinite both;
}

.cb-marker-pulse--delay {
  animation-delay: 1.3s;
}

/* ── LIVE badge dot ──────────────────────────────────────────────────────────── */

.cb-marker-live-dot {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00F076;
  border: 2px solid #0a0b0e;
  pointer-events: none;
}

/* ── Badge overlays (sponsored, saved, featured) ─────────────────────────────── */

.cb-marker-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: 8px;
  border: 1.5px solid #0a0b0e;
}

.cb-marker-badge--crown  { background: #f59e0b; } /* sponsored */
.cb-marker-badge--star   { background: #ec4899; } /* featured  */
.cb-marker-badge--save   { background: #6366f1; } /* saved     */

/* ── Venue marker (pill label) ───────────────────────────────────────────────── */

.cb-marker--venue .cb-marker-body {
  width: auto;
  height: auto;
  border-radius: 8px;
  padding: 4px 10px;
  gap: 4px;
  flex-direction: row;
  background: rgba(10, 11, 14, 0.88);
  border-color: rgba(255, 255, 255, 0.12);
  overflow: visible;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.cb-marker-venue-label {
  font-size: 11px;
  font-weight: 600;
  color: #e5e7eb;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.cb-marker-venue-count {
  font-size: 10px;
  font-weight: 700;
  color: #00F076;
  white-space: nowrap;
}

/* ── USER LOCATION marker ────────────────────────────────────────────────────── */

.cb-user-marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  pointer-events: none;
}

.cb-user-accuracy {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 240, 118, 0.08);
  border: 1px solid rgba(0, 240, 118, 0.2);
  pointer-events: none;
  will-change: transform;
  transition: width 400ms ease, height 400ms ease;
}

.cb-user-heading {
  position: absolute;
  width: 0;
  height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 300ms ease;
}

.cb-user-heading-arrow {
  position: absolute;
  bottom: 14px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 12px solid rgba(0, 240, 118, 0.65);
}

.cb-user-dot {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.cb-user-dot-inner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00F076;
  border: 2.5px solid #fff;
  box-shadow:
    0 0 0 1px rgba(0, 240, 118, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.5);
}

.cb-user-pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 240, 118, 0.4);
  will-change: transform, opacity;
  animation: cb-user-pulse 3s cubic-bezier(0.2, 0, 0.8, 1) infinite both;
}

/* ── TYPE-SPECIFIC border colors ─────────────────────────────────────────────── */

.cb-marker--live .cb-marker-body,
.cb-marker--live-solo .cb-marker-body,
.cb-marker--live-band .cb-marker-body {
  border-color: #00F076;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 12px rgba(0, 240, 118, 0.25);
}

.cb-marker--artist .cb-marker-body,
.cb-marker--solo .cb-marker-body {
  border-color: rgba(255, 255, 255, 0.45);
}

.cb-marker--band .cb-marker-body {
  border-radius: 14px; /* pill-ish for bands */
  border-color: rgba(255, 255, 255, 0.45);
}

.cb-marker--live-band .cb-marker-body {
  border-radius: 14px;
}

.cb-marker--sponsored .cb-marker-body {
  border-color: #f59e0b;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.7),
    0 0 10px rgba(245, 158, 11, 0.2);
}

.cb-marker--featured .cb-marker-body {
  border-color: #ec4899;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.7),
    0 0 10px rgba(236, 72, 153, 0.2);
}

.cb-marker--saved .cb-marker-body {
  border-color: #6366f1;
}

.cb-marker--cluster .cb-marker-body {
  border-color: rgba(255, 255, 255, 0.5);
  background: #1a1d2e;
}

/* ── ZOOM STATES ─────────────────────────────────────────────────────────────── */

/* Compact: zoom < 12 — just a coloured dot */
.cb-compact .cb-marker-body {
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  padding: 0 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  overflow: hidden !important;
  border-width: 1.5px !important;
}

.cb-compact .cb-marker-photo,
.cb-compact .cb-marker-icon,
.cb-compact .cb-marker-badge,
.cb-compact .cb-marker-live-dot,
.cb-compact .cb-marker-venue-label,
.cb-compact .cb-marker-venue-count,
.cb-compact .cb-marker-pulse          { display: none !important; }

/* Standard: zoom 12-14 — 36px circle with icon (no photo) */
.cb-standard .cb-marker-body          { width: 36px; height: 36px; }
.cb-standard .cb-marker-photo         { display: none; }  /* icon shown instead */
.cb-standard .cb-marker-icon          { display: flex; }

/* Full: zoom ≥ 14 — 44px with photo */
.cb-full .cb-marker-body              { width: 44px; height: 44px; }
.cb-full .cb-marker-icon              { display: none; }   /* photo shown instead */
.cb-full .cb-marker-photo             { display: block; }

/* ── SELECTION STATE ──────────────────────────────────────────────────────────── */

.cb-marker--selected .cb-marker-body {
  transform: scale(1.25);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.8),
    0 0 0 2px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(0, 240, 118, 0.3);
  border-color: #fff !important;
}

/* Dimmed state: de-emphasize non-selected markers */
.cb-marker--dimmed .cb-marker-body {
  opacity: 0.3;
  filter: saturate(0.15);
  transform: scale(0.9);
}

/* ── LIGHT THEME overrides ────────────────────────────────────────────────────── */

[data-cb-theme="light"] .cb-marker-body {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.06);
}

[data-cb-theme="light"] .cb-marker--live .cb-marker-body,
[data-cb-theme="light"] .cb-marker--live-solo .cb-marker-body,
[data-cb-theme="light"] .cb-marker--live-band .cb-marker-body {
  border-color: #00a855;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 10px rgba(0, 168, 85, 0.2);
}

[data-cb-theme="light"] .cb-marker--venue .cb-marker-body {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.1);
}

[data-cb-theme="light"] .cb-marker-venue-label { color: #111827; }
[data-cb-theme="light"] .cb-marker-venue-count  { color: #00a855; }

[data-cb-theme="light"] .cb-marker-live-dot {
  background: #00a855;
  border-color: #ffffff;
}

[data-cb-theme="light"] .cb-marker-pulse {
  border-color: #00a855;
}

[data-cb-theme="light"] .cb-user-dot-inner {
  background: #00a855;
}

[data-cb-theme="light"] .cb-user-pulse-ring {
  border-color: rgba(0, 168, 85, 0.4);
}

[data-cb-theme="light"] .cb-marker-icon { color: #6b7280; }

/* ── REDUCED MOTION ───────────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .cb-marker {
    animation: none !important;
  }

  .cb-marker-pulse {
    animation: none !important;
    opacity: 0 !important;    /* hide rings entirely */
  }

  .cb-user-pulse-ring {
    animation: none !important;
    opacity: 0 !important;
  }

  /* Replace pulse with a static neon glow ring for live markers */
  .cb-marker--live .cb-marker-body,
  .cb-marker--live-solo .cb-marker-body,
  .cb-marker--live-band .cb-marker-body {
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.7),
      0 0 0 3px rgba(0, 240, 118, 0.35) !important;
  }
}

/* ── CLUSTERS (PHASE 8 — SMART CLUSTERING) ─────────────────────────────────── */

.cb-marker--cluster {
  cursor: pointer;
  z-index: 50;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

.cb-marker--cluster:hover {
  transform: scale(1.12);
  z-index: 65;
}

.cb-marker--cluster:active {
  transform: scale(0.96);
}

/* Cluster with Live Performers — Crowdbeats Emerald Glow */
.cb-cluster--live .cb-marker-body {
  background: radial-gradient(circle at 50% 30%, #0e2e1d 0%, #07150d 100%) !important;
  border: 2px solid #00F076 !important;
  box-shadow: 0 0 16px rgba(0, 240, 118, 0.45), inset 0 0 10px rgba(0, 240, 118, 0.25) !important;
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}

.cb-cluster-count {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: #FFFFFF;
  line-height: 1;
  letter-spacing: -0.02em;
}

.cb-cluster--live .cb-cluster-count {
  color: #00F076;
  text-shadow: 0 0 8px rgba(0, 240, 118, 0.5);
}

.cb-cluster-live-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 8px;
  font-weight: 800;
  color: #00F076;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
  line-height: 1;
}

.cb-cluster-live-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #00F076;
  box-shadow: 0 0 6px #00F076;
  animation: cb-live-dot 1.2s ease-in-out infinite alternate;
}

@keyframes cb-live-dot {
  from { opacity: 0.4; transform: scale(0.8); }
  to   { opacity: 1.0; transform: scale(1.2); }
}

/* Inactive Region Cluster (no live acts) — Dark Glass */
.cb-cluster--inactive .cb-marker-body {
  background: rgba(21, 23, 34, 0.92) !important;
  border: 1.5px solid #2B2D44 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
  width: 42px !important;
  height: 42px !important;
  border-radius: 50% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

.cb-cluster--inactive .cb-cluster-count {
  color: #94A3B8;
  font-size: 13px;
}

.cb-cluster-inactive-sub {
  font-size: 7px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 1px;
  line-height: 1;
}
`;

let _injected = false;

/**
 * Injects marker CSS into the document <head>.
 * Idempotent — safe to call multiple times.
 * Must be called from a browser context (not SSR).
 */
export function injectMarkerStyles(): void {
  if (_injected) return;
  if (typeof document === 'undefined') return;
  if (document.getElementById(MARKER_STYLE_TAG_ID)) { _injected = true; return; }

  const style = document.createElement('style');
  style.id = MARKER_STYLE_TAG_ID;
  style.textContent = MARKER_STYLES;
  document.head.appendChild(style);
  _injected = true;
}
