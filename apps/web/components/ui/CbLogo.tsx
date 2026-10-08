'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/components/theme/ThemeProvider';

export interface CrowdbeatsLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Logo variant: 'horizontal' (master emblem + wordmark) or 'emblem' (CB musical-note mark only). Default: 'horizontal' */
  variant?: 'horizontal' | 'emblem';
  /** Target surface luminance / theme: 'light' (black logo), 'dark' (white logo), or 'auto' (theme-driven). Default: 'auto' */
  surface?: 'light' | 'dark' | 'auto';
  /** Target height in pixels. Default is 32. */
  height?: number;
  /** Explicit width in pixels. If not provided, computed from aspect ratio (6.5 for horizontal, 1.0 for emblem). */
  width?: number;
  /** High priority preload flag for Next.js Image (useful for above-the-fold headers). Default: false */
  priority?: boolean;
  /** Accessible label. Defaults to 'Crowdbeats'. */
  ariaLabel?: string;
  /** If true, hides from screen readers (sets alt="" and aria-hidden="true"). Default: false */
  ariaHidden?: boolean;
  /** Deprecated/optional: whether to render an obsidian dark backing plate. */
  withBacking?: boolean;
}

export type CbLogoProps = CrowdbeatsLogoProps;

export function CrowdbeatsLogo({
  variant = 'horizontal',
  surface = 'auto',
  height = 32,
  width,
  priority = false,
  withBacking = false,
  ariaLabel = 'Crowdbeats',
  ariaHidden = false,
  className = '',
  style,
  ...props
}: CrowdbeatsLogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme ?? theme ?? 'light';

  // If withBacking is true, the backing plate itself is obsidian dark (#0B0C10), so default to dark surface
  const resolvedSurface: 'light' | 'dark' =
    withBacking
      ? (surface === 'auto' ? 'dark' : surface)
      : (surface === 'auto' ? (currentTheme === 'light' ? 'light' : 'dark') : surface);

  const isHorizontal = variant === 'horizontal';
  const aspectRatio = isHorizontal ? 6.5 : 1.0;
  const effectiveWidth = width ?? Math.round(height * aspectRatio);

  const src = isHorizontal
    ? (resolvedSurface === 'light'
        ? '/crowdbeats-logo-on-light-cropped.png'
        : '/crowdbeats-logo-on-dark-cropped.png')
    : (resolvedSurface === 'light'
        ? '/crowdbeats-emblem-on-light.png'
        : '/crowdbeats-emblem-on-dark.png');

  const logoElement = (
    <Image
      src={src}
      alt={ariaHidden ? '' : (ariaLabel ?? 'Crowdbeats')}
      aria-hidden={ariaHidden ? true : undefined}
      width={effectiveWidth}
      height={height}
      priority={priority}
      style={{
        display: 'block',
        height: `${height}px`,
        width: `${effectiveWidth}px`,
        objectFit: 'contain',
        aspectRatio: `${aspectRatio} / 1`,
        flexShrink: 0,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  );

  if (withBacking) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B0C10',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: `${Math.round(height * 0.35)}px`,
          padding: `${Math.round(height * 0.2)}px ${Math.round(height * 0.38)}px`,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          ...style,
        }}
        {...props}
      >
        {logoElement}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {logoElement}
    </div>
  );
}

// Backward-compatible alias
export const CbLogo = CrowdbeatsLogo;
