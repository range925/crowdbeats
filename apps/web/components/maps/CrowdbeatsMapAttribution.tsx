'use client';

/**
 * CrowdbeatsMapAttribution — Map Attribution Component (Phase 4)
 *
 * Required by:
 *   - OpenStreetMap ODbL license: attribution on EVERY surface using OSM data
 *   - Maptiler Terms of Service: attribution required on free/paid plans
 *
 * Usage:
 *   Embed on any page that shows a MapLibre map.
 *   Note: MapLibre's built-in attributionControl already renders attribution
 *   within the map canvas. This component provides an additional accessible,
 *   styled attribution element for use outside the map canvas (e.g. in captions,
 *   footers, or when the map is small).
 *
 * The built-in MapLibre attribution (configured in MapLibreMapProvider) is the
 * primary attribution surface. This component is supplemental.
 */

interface CrowdbeatsMapAttributionProps {
  theme?: 'dark' | 'light';
  /** If true, shows in a floating badge style suitable for map overlays. */
  overlay?: boolean;
  className?: string;
}

export function CrowdbeatsMapAttribution({
  theme = 'dark',
  overlay = false,
  className,
}: CrowdbeatsMapAttributionProps) {
  const isDark = theme === 'dark';

  const style: React.CSSProperties = overlay
    ? {
        position: 'absolute',
        bottom: 4,
        right: 4,
        background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 10,
        lineHeight: '16px',
        color: isDark ? '#9ca3af' : '#6b7280',
        zIndex: 10,
        pointerEvents: 'none',
        userSelect: 'none',
      }
    : {
        fontSize: 11,
        color: isDark ? '#4b5563' : '#9ca3af',
        lineHeight: '18px',
      };

  return (
    <div
      className={className}
      style={style}
      aria-label="Map attribution"
    >
      {/* OSM attribution — ODbL required */}
      &copy;{' '}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: isDark ? '#6b7280' : '#9ca3af',
          textDecoration: 'none',
          pointerEvents: 'auto',
        }}
      >
        OpenStreetMap
      </a>{' '}
      contributors
      {' | '}
      {/* Maptiler attribution — required by Maptiler ToS */}
      <a
        href="https://www.maptiler.com/copyright/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: isDark ? '#6b7280' : '#9ca3af',
          textDecoration: 'none',
          pointerEvents: 'auto',
        }}
      >
        MapTiler
      </a>
    </div>
  );
}
