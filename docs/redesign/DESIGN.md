---
name: Crowdbeats Refined Modern
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0e0f'
  surface-container-low: '#1a1c1d'
  surface-container: '#1e2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333536'
  on-surface: '#e2e2e3'
  on-surface-variant: '#d8c1c6'
  inverse-surface: '#e2e2e3'
  inverse-on-surface: '#2f3132'
  outline: '#a08b90'
  outline-variant: '#534247'
  surface-tint: '#ffb0c9'
  primary: '#ff97ba'
  on-primary: '#131315'
  primary-container: '#ff97ba'
  on-primary-container: '#5d1233'
  inverse-primary: '#974162'
  secondary: '#8b5cf6'
  on-secondary: '#ffffff'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#2dd4bf'
  on-tertiary: '#003824'
  tertiary-container: '#39ce94'
  on-tertiary-container: '#005337'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  background: '#131315'
  on-background: '#e2e2e3'
  surface-variant: '#333536'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  page-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  section-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  card-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  secondary:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  numeric-kpi:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  button:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  huge: 64px
---

## Brand & Aesthetic Direction

Crowdbeats V2 synthesizes **Modern Cupertino Industrial Refinement** with the **Atmospheric Immersion of Live Music Venues**, incorporating the high-trust ergonomics of **Uber and Lyft**:
- **Glanceability Under 1 Second:** Clean hierarchy where primary metrics (distance, tip amount, live status) stand out instantly in dimly lit club environments and bright daylight.
- **Obsidian Dark & Clean Crisp Light Foundations:** True obsidian dark surfaces eliminate stage glare and conserve OLED battery; crisp light mode provides high-contrast daylight readability without synthetic inversion.
- **Tactile Vibrancy:** Brand accents—Coral Pink (`#FF97BA`) and Electric Violet (`#8B5CF6`)—are applied with strict intentionality to financial exchanges, active performers, and key calls-to-action.
- **Thumb-Zone Dominance:** High-frequency controls are docked at the bottom of the screen with a minimum touch target size of 48×48dp.
- **Sliding Sheets:** Secondary detail, filter, and payment confirmation flows utilize sliding bottom sheets with a signature 32dp top corner radius.

## Reusable Component Controls

1. **Buttons:** Primary Coral Pink (`#FF97BA`), Secondary Violet Outline (`#8B5CF6`), Ghost, Destructive (`#EF4444`), and 52dp docked bottom action trays.
2. **Input Fields & Search:** Resting, focused (2px `#8B5CF6` ring), error, disabled, and autocomplete dropdowns.
3. **Cards:** Performer discovery card, Live gig card, Campaign tier card, and Ledger transaction tile.
4. **Map Markers:** Standard venue marker, pulsating Aqua (`#2DD4BF`) Live Now marker, and selected marker.
5. **Navigation:** 64dp 5-tab mobile bottom bar with glassmorphic blur and active Coral/Violet indicators.
6. **Sheets & Modals:** Sliding bottom sheets with 32dp top corner radius, drag handle, and high-contrast dismissal.
7. **Toasts & Feedback:** Live broadcasting status, transaction success toast, and network error banner.
8. **Payment Fee Summary:** Transparent tipping breakdown showing Tip Amount, 6% Platform Fee, Stripe Processing Fee, and Total Billed.
