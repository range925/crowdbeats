'use client';

/**
 * Crowdbeats Map Engine — MapLibre Fallback State
 * Displayed when MapLibre fails to load or encounters a fatal error.
 */

interface MapLibreFallbackProps {
  message?: string;
  onRetry?: () => void;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

export function MapLibreFallback({
  message,
  onRetry,
  theme = 'dark',
  compact = false,
}: MapLibreFallbackProps) {
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: compact ? 80 : 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: isDark ? '#0b0c10' : '#f8f9fa',
        color: isDark ? '#9ca3af' : '#6b7280',
        borderRadius: 12,
        border: isDark ? '1px solid #1e2032' : '1px solid #e5e7eb',
        padding: compact ? '12px 16px' : '32px 24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      role="status"
      aria-label="Map unavailable"
    >
      {/* Map icon */}
      <div style={{ fontSize: compact ? 24 : 40, opacity: 0.5 }}>🗺️</div>

      {!compact && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontWeight: 700,
            fontSize: 16,
            color: isDark ? '#e5e7eb' : '#374151',
            marginBottom: 6,
          }}>
            Map Unavailable
          </div>
          {message && (
            <div style={{ fontSize: 13, maxWidth: 300, opacity: 0.8 }}>
              {message}
            </div>
          )}
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: '#00F076',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          aria-label="Retry loading map"
        >
          Try Again
        </button>
      )}

      <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'center' }}>
        Live discovery is still available in List mode
      </div>
    </div>
  );
}

/** Inline loading skeleton for the map container. */
export function MapLibreLoadingSkeleton({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: isDark ? '#0b0c10' : '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
      }}
      aria-label="Loading map"
      role="status"
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(0,240,118,0.2)',
        borderTopColor: '#00F076',
        animation: 'cb-map-spin 0.8s linear infinite',
      }} />
      <div style={{ color: isDark ? '#4b5563' : '#9ca3af', fontSize: 13 }}>
        Loading map…
      </div>
      <style>{`
        @keyframes cb-map-spin { to { transform: rotate(360deg); } }
        @keyframes cb-ml-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}