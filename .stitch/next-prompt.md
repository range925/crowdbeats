---
page: landing
iteration: 4
target: localhost
---

# Baton Relay: Multi-City Interactive Map Deep Dive & Live Stage Routing (Iteration 4)

**DESIGN SYSTEM (REQUIRED):**
[Refer to .stitch/DESIGN.md]
- Primary Theme: Obsidian Canvas (`#07080D`), Card Surface (`#12141F`), Primary Accent (`#7C3AED`), Emerald Live (`#10B981`).
- Typography: SF Pro / DM Sans styling, JetBrains Mono tabular numerals.
- Motion: Spring physics, micro-waveforms, 0.25s theme transitions.
- Anti-Patterns: No generic purple glows, no emojis in production cards, no overlapping text.

**Iteration 4 Objective:**
Implement the Multi-City Interactive Map Deep Dive modal and GPS stage routing for the Live Stage Radar:
1. Dynamic Stage Map Modal: Interactive full-screen / sheet drawer displaying live venues, current performers, sound check schedules, and walking distance ETAs across selected curated cities (San Diego, Austin, Nashville, New York, Seattle).
2. Live Check-in GPS Simulation: Visual routing line connecting the fan's proximity to the active performer's stage with 1-tap directions and Apple/Google Maps deeplinks.
3. Synchronize stage state seamlessly across all 4 landing variations and the authoritative master landing.
