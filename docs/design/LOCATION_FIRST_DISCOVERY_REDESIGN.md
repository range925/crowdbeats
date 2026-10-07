# Crowdbeats V2 — Location-First Public Discovery Redesign
**Document Reference**: `CB-DESIGN-LOCATION-FIRST-001`  
**Classification**: Authoritative Visual Hierarchy & Product Specification  
**Status**: `APPROVED & ACTIVE`  

---

## 1. Executive Summary & Explicit Override

This specification **overrides and supersedes** the previous 3-category button design (`Nearby`, `Popular`, `Live Now`). That previous category menu direction is rejected.

The new Crowdbeats public discovery first screen establishes a strict, content-first, location-aware hierarchy:
```
┌─────────────────────────────────────────────────────────┐
│                    C R O W D B E A T S                  │
│                Discover music around you                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🔍 Search city, town, state or country            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [ Compact Google Map: 200–280px, 3–8 Calm Pins ]  │  │
│  │  You are here · San Diego / Exploring Torrance    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  NEARBY MUSIC                               See All ➔   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🟢 LIVE · Jake Rios · 0.3 mi · Indie Folk         │  │
│  │ "Indie-folk storyteller blending warm acoustic..." │  │
│  │ The Main Stage · [ View Profile ] [ Tip $20 ]     │  │
│  └───────────────────────────────────────────────────┘  │
│  (Up to 5 nearby creator cards...)                      │
│                                                         │
│  POPULAR ON CROWDBEATS                      See All ➔   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🔥 #1 · The Sunsets · Indie Rock · 4 Members       │  │
│  │ "Four-piece rock band mixing country grit and..." │  │
│  │ [ View Profile ] [ Tip $20 ]                      │  │
│  └───────────────────────────────────────────────────┘  │
│  (Up to 3 popular creator cards...)                     │
│                                                         │
│  [ Home ]  [ Nearby ]  [ Tip ]  [ Activity ] [Profile]  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Mandatory First-Screen Ordering

1. **Header**: Minimal `CROWDBEATS` wordmark with optional subtitle *"Discover music around you"*. No oversized greetings.
2. **Location Search**: Large prominent search field (`"Search city, town, state or country"`) with Google Places autocomplete.
3. **Compact Google Map**: Positioned directly below search (200–280px mobile height) showing 3–8 calm markers before any musician cards.
4. **Nearby Section**: Top 5 nearby solo musicians and/or bands with contextual green `LIVE` badges when performing.
5. **Popular Section**: Top 3 popular solo musicians and/or bands ranked by server engagement signals.
6. **Bottom Navigation**: Preserves standard app navigation (`Home`, `Nearby`, `Tip`, `Activity`, `Profile`).

---

## 3. Key Invariants

| Requirement | Implementation Detail |
| :--- | :--- |
| **No Category Menu** | The first screen directly renders the discovery stream instead of presenting a menu of 3 large category buttons. |
| **Contextual Live Now** | "Live Now" is integrated directly into Nearby cards as green `LIVE` badges, glowing borders, and venue notes; not a separate section. |
| **8–18 Word AI Summaries** | Each card displays a human, concise AI summary based solely on public bio and genres without hallucinated awards or credentials. |
| **Strict Spatial Privacy** | Coordinates refer to public performance venues or city center. Private home addresses and continuous GPS history are strictly protected. |
| **Progressive Tipping** | Tapping "Tip" opens the progressive auth gate, preserves creator context and amount, and requires explicit confirmation upon login (zero auto-charge). |
