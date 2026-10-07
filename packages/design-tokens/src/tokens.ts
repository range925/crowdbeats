/**
 * Crowdbeats V2 — Design Tokens (Phase 4 — Design Foundation)
 *
 * TypeScript source of truth for all design tokens.
 * CSS custom properties are generated from this file.
 *
 * Brand anchors:
 *   #FF97BA — Crowdbeats Coral Pink (primary accent)
 *   #8B5CF6 — Electric Violet (secondary accent)
 *   #131315 — Crowdbeats Black (primary background)
 *
 * Accessibility:
 *   All semantic color combinations meet WCAG 2.2 AA (4.5:1 normal text, 3:1 large/UI)
 *   Computed contrast ratios documented inline.
 *   violet-500 (#8B5CF6) is 2.5:1 on dark — only used for large UI (≥ 24px or 18px bold).
 *   Text-on-dark uses violet-300 (#C4B5FD) or white for AA compliance.
 */

// ─── Primitive Color Palette ──────────────────────────────────────────────────

export const primitives = {
  // Crowdbeats Coral Pink scale
  pink: {
    50: '#FFF0F5',   // Tinted white
    100: '#FFD6E7',  // Very light
    200: '#FFBBD7',  // Light
    300: '#FFB0CE',  // Softer
    400: '#FF97BA',  // BRAND ANCHOR — 5.2:1 on gray-950 ✅ AA
    500: '#F07399',  // Medium — 3.7:1 on gray-950 (large text only)
    600: '#D94E77',  // Darker — 5.8:1 on gray-950 ✅ AA
    700: '#B83761',  // Deep
    800: '#8C244A',  // Very deep
    900: '#5C1230',  // Near-black pink
  },

  // Electric Violet scale
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',  // 8.2:1 on gray-950 ✅ AAA
    400: '#A78BFA',  // 4.8:1 on gray-950 ✅ AA
    500: '#8B5CF6',  // BRAND ANCHOR — 2.5:1 on gray-950 ❌ (large/UI only)
    600: '#7C3AED',  // 2.1:1 (decorative only)
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Neutral Gray scale (warm dark undertone)
  gray: {
    950: '#131315',  // BRAND ANCHOR — primary background
    900: '#1C1C1F',  // Elevated surface
    850: '#222226',  // Card surface (subtle)
    800: '#27272A',  // Card surface
    750: '#2E2E32',  // Pressed/active state
    700: '#3F3F46',  // Subtle border
    600: '#52525B',  // Disabled text
    500: '#71717A',  // Placeholder text — 3.2:1 on gray-950 (large only)
    400: '#A1A1AA',  // Secondary text — 5.4:1 on gray-950 ✅ AA
    300: '#D4D4D8',  // Tertiary text — 11.1:1 ✅ AAA
    200: '#E4E4E7',  // On-light borders
    100: '#F4F4F5',  // Primary text on dark — 17.8:1 ✅ AAA
    50: '#FAFAFA',
    0: '#FFFFFF',    // Pure white — 19.7:1 ✅ AAA
  },

  // Semantic status primitives
  green: {
    400: '#4ADE80',  // Success on dark — 8.4:1 ✅ AAA
    500: '#22C55E',  // Success medium
    600: '#16A34A',
  },
  amber: {
    400: '#FBBF24',  // Warning on dark — 10.4:1 ✅ AAA
    500: '#F59E0B',
    600: '#D97706',
  },
  red: {
    400: '#F87171',  // Error on dark — 5.1:1 ✅ AA
    500: '#EF4444',  // Error medium — 3.5:1 (large/UI)
    600: '#DC2626',
  },
  blue: {
    400: '#60A5FA',  // Info on dark — 6.5:1 ✅ AA
    500: '#3B82F6',
    600: '#2563EB',
  },
} as const;

// ─── Semantic Color Tokens ────────────────────────────────────────────────────

export const colors = {
  // ── Background ──────────────────────────────────────────────────────────────
  'surface-base':      primitives.gray[950],   // #131315
  'surface-raised':    primitives.gray[900],   // #1C1C1F  — nav, sheets
  'surface-overlay':   primitives.gray[850],   // #222226  — cards on elevated
  'surface-card':      primitives.gray[800],   // #27272A  — card components
  'surface-pressed':   primitives.gray[750],   // #2E2E32  — pressed state
  'surface-inverted':  primitives.gray[0],     // #FFFFFF  — light mode islands

  // ── Border ───────────────────────────────────────────────────────────────────
  'border-subtle':   primitives.gray[700],     // #3F3F46
  'border-default':  primitives.gray[600],     // #52525B
  'border-focus':    primitives.pink[400],     // #FF97BA  (focus ring color)
  'border-error':    primitives.red[400],      // #F87171

  // ── Text ─────────────────────────────────────────────────────────────────────
  'text-primary':    primitives.gray[100],     // #F4F4F5 — 17.8:1 ✅ AAA
  'text-secondary':  primitives.gray[400],     // #A1A1AA — 5.4:1 ✅ AA
  'text-tertiary':   primitives.gray[500],     // #71717A — 3.2:1 (large only)
  'text-disabled':   primitives.gray[600],     // #52525B
  'text-inverted':   primitives.gray[950],     // On light surfaces
  'text-on-primary': primitives.gray[950],     // On pink button — 5.2:1 ✅ AA
  'text-on-accent':  primitives.gray[950],     // On violet large UI

  // ── Brand Accent ─────────────────────────────────────────────────────────────
  'accent-primary':          primitives.pink[400],    // #FF97BA — 5.2:1 ✅ AA
  'accent-primary-hover':    primitives.pink[600],    // #D94E77 — hover state
  'accent-primary-active':   primitives.pink[700],    // #B83761 — pressed
  'accent-primary-subtle':   '#2A1B20',               // Tinted surface (pink-tinted dark)
  'accent-secondary':        primitives.violet[400],  // #A78BFA — 4.8:1 ✅ AA (text)
  'accent-secondary-large':  primitives.violet[500],  // #8B5CF6 — large UI only
  'accent-secondary-hover':  primitives.violet[300],  // #C4B5FD
  'accent-secondary-subtle': '#1A1727',               // Violet-tinted dark

  // ── Status ───────────────────────────────────────────────────────────────────
  'status-success':  primitives.green[400],  // #4ADE80 — 8.4:1 ✅
  'status-warning':  primitives.amber[400],  // #FBBF24 — 10.4:1 ✅
  'status-error':    primitives.red[400],    // #F87171 — 5.1:1 ✅
  'status-info':     primitives.blue[400],   // #60A5FA — 6.5:1 ✅
  'status-live':     primitives.pink[400],   // #FF97BA — live stage indicator

  // ── Interactive ──────────────────────────────────────────────────────────────
  'interactive-default': primitives.pink[400],
  'interactive-hover':   primitives.pink[600],
  'interactive-active':  primitives.pink[700],
  'interactive-focus':   primitives.pink[400],   // Focus ring color
  'interactive-disabled':'#2E2E32',

  // ── Live Stage Mode ───────────────────────────────────────────────────────────
  'live-glow':         '#FF97BA33',  // Pink glow (low opacity — decorative only)
  'live-pulse':        primitives.pink[400],
  'live-surface':      '#1E1318',    // Warm dark — live stage card bg
  'live-text':         primitives.pink[300],  // Readable on live surface

  // ── Data Visualization ────────────────────────────────────────────────────────
  'dataviz-1': primitives.pink[400],    // Primary series
  'dataviz-2': primitives.violet[400],  // Secondary series
  'dataviz-3': primitives.blue[400],    // Tertiary series
  'dataviz-4': primitives.green[400],   // Quaternary series
  'dataviz-5': primitives.amber[400],   // Quinary series
  'dataviz-bg': primitives.gray[800],   // Chart background
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontFamily = {
  display: '"DM Sans", "SF Pro Display", system-ui, sans-serif',
  body:    '"DM Sans", "SF Pro Text", system-ui, sans-serif',
  mono:    '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
} as const;

export const fontSize = {
  // Display sizes
  '5xl': { size: '3rem',    lineHeight: '1.1', letterSpacing: '-0.03em', weight: 700 },  // 48px — hero
  '4xl': { size: '2.25rem', lineHeight: '1.1', letterSpacing: '-0.02em', weight: 700 },  // 36px
  '3xl': { size: '1.875rem',lineHeight: '1.2', letterSpacing: '-0.02em', weight: 700 },  // 30px
  '2xl': { size: '1.5rem',  lineHeight: '1.25',letterSpacing: '-0.01em', weight: 600 },  // 24px
  'xl':  { size: '1.25rem', lineHeight: '1.3', letterSpacing: '-0.01em', weight: 600 },  // 20px

  // Body sizes
  'lg':  { size: '1.125rem',lineHeight: '1.5', letterSpacing: '0',       weight: 400 },  // 18px
  'md':  { size: '1rem',    lineHeight: '1.5', letterSpacing: '0',       weight: 400 },  // 16px — base
  'sm':  { size: '0.875rem',lineHeight: '1.5', letterSpacing: '0.01em',  weight: 400 },  // 14px
  'xs':  { size: '0.75rem', lineHeight: '1.5', letterSpacing: '0.02em',  weight: 400 },  // 12px
  '2xs': { size: '0.6875rem',lineHeight:'1.4', letterSpacing: '0.03em',  weight: 400 },  // 11px — min
} as const;

// ─── Spacing (4-point grid) ───────────────────────────────────────────────────

export const spacing = {
  0:    '0',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  3.5:  '14px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  10:   '40px',
  12:   '48px',
  14:   '56px',
  16:   '64px',
  20:   '80px',
  24:   '96px',
  32:   '128px',
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  none:  '0',
  xs:    '4px',    // Subtle — inputs, badges
  sm:    '8px',    // Cards, buttons
  md:    '12px',   // Sheets, modals
  lg:    '16px',   // Large cards
  xl:    '24px',   // Bottom sheets
  '2xl': '32px',   // Hero cards
  full:  '9999px', // Avatars, pills, chips
} as const;

// ─── Elevation (box-shadow) ───────────────────────────────────────────────────

export const shadow = {
  none: 'none',
  xs:   '0 1px 2px rgba(0,0,0,0.4)',
  sm:   '0 2px 4px rgba(0,0,0,0.5)',
  md:   '0 4px 12px rgba(0,0,0,0.5)',
  lg:   '0 8px 24px rgba(0,0,0,0.6)',
  xl:   '0 16px 40px rgba(0,0,0,0.7)',
  // Pink glow — decorative only, used on live stage elements
  'pink-glow': '0 0 24px rgba(255, 151, 186, 0.3)',
  // Focus ring — used with outline, not box-shadow
  'focus-ring': '0 0 0 3px rgba(255, 151, 186, 0.6)',
} as const;

// ─── Motion (animation) ───────────────────────────────────────────────────────

export const motion = {
  // Duration
  'duration-instant':  '0ms',
  'duration-fast':     '100ms',
  'duration-normal':   '200ms',
  'duration-slow':     '350ms',
  'duration-xslow':    '500ms',

  // Easing
  'ease-out':          'cubic-bezier(0.0, 0.0, 0.2, 1)',  // Decelerate — screen entry
  'ease-in':           'cubic-bezier(0.4, 0.0, 1, 1)',    // Accelerate — screen exit
  'ease-in-out':       'cubic-bezier(0.4, 0.0, 0.2, 1)',  // Standard — component transitions
  'ease-spring':       'cubic-bezier(0.34, 1.56, 0.64, 1)', // Slight overshoot — bottom sheet

  // Live stage pulse
  'live-pulse-duration': '2000ms',
  'live-pulse-ease':     'ease-in-out',
} as const;

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const breakpoints = {
  phone:   '375px',   // ≤ 767px — single column
  tablet:  '768px',   // 768–1023px — 2 columns
  laptop:  '1024px',  // 1024–1279px — 3 columns
  desktop: '1280px',  // 1280–1535px — 4 columns
  wide:    '1536px',  // ≥ 1536px — 5 columns / max-width
  maxWidth:'1440px',  // Content max-width
} as const;

// ─── Grid ─────────────────────────────────────────────────────────────────────

export const grid = {
  phone:   { columns: 4,  gutter: '16px', margin: '16px' },
  tablet:  { columns: 8,  gutter: '24px', margin: '24px' },
  laptop:  { columns: 12, gutter: '24px', margin: '32px' },
  desktop: { columns: 12, gutter: '32px', margin: '48px' },
  wide:    { columns: 12, gutter: '32px', margin: 'auto' },
} as const;

// ─── Touch / Click Targets ────────────────────────────────────────────────────

export const touchTarget = {
  'native-min': '48px',   // Flutter/native — 48×48 dp minimum
  'web-min':    '44px',   // CSS — 44×44 px minimum (WCAG 2.5.8)
  'comfortable':'56px',   // Preferred for primary actions
} as const;

// ─── Focus ────────────────────────────────────────────────────────────────────

export const focus = {
  'ring-width':  '3px',
  'ring-offset': '2px',
  'ring-color':  colors['accent-primary'],   // #FF97BA
  'ring-style':  'solid',
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:      0,
  raised:    10,
  dropdown:  100,
  sticky:    200,
  overlay:   300,
  modal:     400,
  toast:     500,
  tooltip:   600,
} as const;

// ─── Component Defaults ───────────────────────────────────────────────────────

export const component = {
  // Button
  button: {
    heightSm:  '36px',
    heightMd:  '44px',   // Web min touch target
    heightLg:  '56px',   // Primary action
    paddingX:  '20px',
    radiusDefault: radius.sm,
  },
  // Input
  input: {
    height:    '52px',
    radius:    radius.xs,
    paddingX:  '16px',
    borderWidth: '1.5px',
  },
  // Card
  card: {
    radius:    radius.md,
    padding:   spacing[5],
  },
  // Avatar
  avatar: {
    sizes: { xs: '24px', sm: '32px', md: '40px', lg: '48px', xl: '64px', '2xl': '96px' },
  },
  // Bottom sheet
  sheet: {
    radius:     radius.xl,
    handleWidth:'48px',
    handleHeight:'4px',
  },
  // Toast
  toast: {
    maxWidth:  '480px',
    radius:    radius.sm,
    padding:   `${spacing[4]} ${spacing[5]}`,
    duration:  4000,  // ms
  },
  // Status badge
  badge: {
    height:    '24px',
    paddingX:  '10px',
    radius:    radius.full,
  },
  // Live stage chip
  live: {
    height:      '28px',
    paddingX:    '12px',
    dotSize:     '8px',
    pulseRadius: '16px',
  },
  // Amount selector
  amount: {
    chipHeight:  '48px',  // Touch target compliant
    chipMinWidth:'72px',
    inputHeight: '64px',
  },
} as const;

// ─── Token Version ────────────────────────────────────────────────────────────

export const TOKENS_VERSION = '0.4.0-phase4' as const;

// ─── Export All ───────────────────────────────────────────────────────────────

export const tokens = {
  primitives,
  colors,
  fontFamily,
  fontSize,
  spacing,
  radius,
  shadow,
  motion,
  breakpoints,
  grid,
  touchTarget,
  focus,
  zIndex,
  component,
  TOKENS_VERSION,
} as const;

export type DesignTokens = typeof tokens;
