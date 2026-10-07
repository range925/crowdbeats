# Crowdbeats V2 — Public Discovery Stitch Redirection: 3-Option Experience
**Document Reference**: `CB-DESIGN-STITCH-REDIRECTION-001`  
**Classification**: Authoritative UX/UI Redesign Specification  
**Status**: `APPROVED FOR IMPLEMENTATION`  

---

## 1. Executive Summary

Crowdbeats V2 simplifies the public discovery landing experience into a minimal, premium **3-Option Experience** inspired by Google Stitch, the Stitch Loop optimization framework, and Gemini UX critique.

The previous first-screen experience presented excessive cognitive load: a large interactive map with dozens of pins, a 3-way segmented control (`Map` | `List` | `Venues`), numerous category and genre filter chips, live viewer counts, and long lists of artist cards simultaneously.

This redesign establishes a clean first screen that passes the **3-Second Comprehension Rule**:
> *"A new user must understand what Crowdbeats does within 3 seconds: Find musicians around me or in another place."*

---

## 2. Core Visual & Architectural Principles

```
┌─────────────────────────────────────────────────────────┐
│                    C R O W D B E A T S                  │
│                     Discover live music                 │
│                   Around you or anywhere                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🔍 Search city, town, state or country            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐  │
│  │ 📍 NEARBY       │ │ 🔥 POPULAR      │ │ 🔴 LIVE   │  │
│  │ Artists & bands │ │ Trending in     │ │ Perform-  │  │
│  │ around you      │ │ this area       │ │ ing now   │  │
│  └─────────────────┘ └─────────────────┘ └───────────┘  │
│                                                         │
│  You are here / Exploring Torrance, CA                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [ Compact Map Preview: 2–5 representative pins ]  │  │
│  │  Tap to explore full map & venues ➔               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [ Home ]  [ Nearby ]  [ Tip ]  [ Activity ] [Profile]  │
└─────────────────────────────────────────────────────────┘
```

### Key Invariants:
1. **ONE Prominent Search Bar**: Dominant geographic search input with Places autocomplete (*"Search city, town, state or country"*, e.g., *Torrance, CA*, *San Diego, CA*, *London, UK*).
2. **THREE Dominant Primary Action Cards**:
   - **`Nearby`**: *"Artists and bands around you"* $\rightarrow$ Opens full `NearbySecondaryView` (Map/List/Venues, filters, radius).
   - **`Popular`**: *"Trending in this area"* $\rightarrow$ Opens `PopularSecondaryView` (Trending solo artists, bands, venues).
   - **`Live Now`**: *"Performing right now"* $\rightarrow$ Opens `LiveNowSecondaryView` (Verified active stages).
3. **ONE Compact Map Preview**:
   - Shows active discovery context (*"You are here"* or *"Exploring Torrance, CA"* with *"Use My Location"*).
   - Renders 2–5 representative pins (no dense legends, no clutter).
   - Tapping opens the full Nearby map experience.
4. **Progressive Complexity Disclosure**:
   - All filters, segmented controls, full artist rosters, and watching counts are deferred to secondary screens.
5. **Zero Backend & Compliance Regression**:
   - 100% preservation of Firebase backend, Stripe Connect compliance, non-blocking GPS handling, and progressive tipping auth gates.
