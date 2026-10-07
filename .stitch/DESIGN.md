# Crowdbeats V2 — Original Dark Mode Semantic Design System (Stitch Loop Authority)

## 1. Visual Atmosphere & Philosophy
- **Density:** 6/10 (High-energy live music stage with modern software clarity).
- **Variance:** 7/10 (Asymmetric split, panoramic focal points, rhythmic metrics).
- **Motion:** 7/10 (Perpetual micro-pulses, emerald live stage radar beacon, spring interactions).
- **Aesthetic:** Original Dark Mode (`#07070A`), Electric Violet/Purple (`#8B5CF6`, `#A855F7`), Luminescent Cyan & Emerald (`#10B981`), and Frosted Glass (`rgba(255, 255, 255, 0.05)` with `backdrop-filter: blur(16px)`).
- **Theme Standard:** Dual-Mode with Dark Mode Primary Default. Full accessible support for Dark (`#07080D`), Light (`#FBFBFD`), and System modes.

## 2. Calibrated Color Tokens
- Canvas/Background: `#07080D` (Stitch Vivid Resonance Obsidian)
- Surface 1 (Base Cards): `#12141F`
- Surface 2 (Elevated Glass): `rgba(39, 39, 42, 0.8)`
- Primary Accent: `#8B5CF6` (Royal Violet CTA)
- Secondary Accent: `#A855F7` (Electric Lavender)
- Tertiary Accent: `#38BDF8` / `#10B981` (Soundwave Cyan & Live Stage Emerald)
- Text High-Contrast: `#FFFFFF` / `#F4F4F5`
- Text Muted: `#A1A1AA` / `#71717A`
  - Status Live: `#10B981` (Emerald Stage Indicator)
  - Text Primary: `#FFFFFF` (21:1 AAA contrast)
  - Text Secondary: `#94A3B8` (Muted silver)
- **Light Mode:**
  - Background Canvas: `#FBFBFD` (Apple Studio White)
  - Surface 1 (Cards): `#FFFFFF`
  - Surface 2 (Elevated): `#F4F4F6`
  - Primary Accent: `#6D28D9` (Deep Royal Violet)
  - Secondary Accent: `#9333EA`
  - Status Live: `#059669` (Emerald)
  - Text Primary: `#1D1D1F` (Dark Graphite)
  - Text Secondary: `#6E6E73` (Apple Silver Gray)

## 3. Typographic Architecture
- Display & Headlines: `DM Sans` / `SF Pro` style (Tight tracking `-0.03em` to `-0.04em`, sculptural weight)
- Body & Instructions: `DM Sans` (Clean, relaxed leading `1.5`, 65ch optimal readability)
- Numeric & Financial Subledgers: `JetBrains Mono` / Tabular Numerals (Exact digit alignment)

## 4. The 4 Apple-Clean Variations
1. **Variation 1 ("Pro Stage Minimalist"):** Cupertino Dark minimalism, razor-sharp typography, live location search pill, live stage pulse, tactile 6% fee slider, and interactive performer hero card.
2. **Variation 2 ("Resonance Keynote"):** Apple Keynote presentation feel with panoramic acoustic backdrop, live audio equalizer ribbon, bento stage grid, and 2-tap tip simulation.
3. **Variation 3 ("Studio Console Pro"):** Pro audio hardware aesthetic with knurled controls, master audio bus visualizer, and customizable band split percentage channels.
4. **Variation 4 ("Dynamic Island Hub"):** Ambient floating status island, interactive expandable persona cards (Artist, Band, Venue, Fan), and quick tip drawer.

## 5. Anti-Patterns (AI Tells Strictly Banned)
- NO generic saturated purple blobs or neon glows.
- NO overlapping unreadable text or low-contrast combinations.
- NO "Scroll to explore" filler text or bouncing chevrons.
- NO fabricated statistics or fake uptime metrics.
- NO broken mobile horizontal scroll.
- NO hard-coded single-theme colors; all surfaces must honor `--cb-*` token hierarchy.
