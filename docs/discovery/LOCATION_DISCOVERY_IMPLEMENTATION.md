# Crowdbeats V2 — Location-First Discovery Implementation Architecture
**Document Reference**: `CB-DOC-LOCATION-IMPL-001`  
**Classification**: Backend & Client Technical Specification  
**Status**: `ACTIVE & BINDING`  

---

## 1. System Overview

The Location-First Public Discovery architecture unifies geographic Places autocomplete, spatial bounding queries, server-authoritative ranking, and progressive tipping auth gates across Flutter Mobile and Next.js Web.

```mermaid
graph TD
    Client[Unauthenticated Guest Client] -->|1. Search "Torrance"| Places[Google Places Autocomplete]
    Places -->|2. Select Torrance Lat/Lng| Client
    Client -->|3. Query Feed (33.8358, -118.3406)| Callable[getPublicDiscoveryFeed]
    Callable -->|4. Geo Bounding Query| Firestore[(Firestore Stage & Creator Projections)]
    Firestore -->|5. Raw Candidates| Eligibility[Anti-Sybil & Discoverability Filter]
    Eligibility -->|6. Verified Candidates| NearbyRank[Nearby Proximity & Live Ranking]
    Eligibility -->|7. Engagement Signals| PopularRank[Popular & Trending Ranking]
    NearbyRank -->|8. Top 5 Nearby with AI Summaries| Callable
    PopularRank -->|9. Top 3 Popular with AI Summaries| Callable
    Callable -->|10. Public Discovery Feed Response| Client
```

---

## 2. Query Architecture & Data Flow

1. **Client Startup**:
   - Checks browser/device GPS non-blockingly. If granted, uses current device coordinates; if denied, defaults to curated hub (*San Diego, CA* or *Torrance, CA*).
2. **Location Search**:
   - As visitor types `"Tor"`, queries Places autocomplete returning *Torrance, CA, USA*, *Toronto, ON, Canada*, etc.
   - When *Torrance, CA* is selected, updates `discoveryLocation` while keeping `deviceLocation` intact.
3. **Feed Query**:
   - `getPublicDiscoveryFeed` retrieves active stage sessions, solo artists, and bands in the bounding box.
   - Computes `nearbyScore` (distance + live bonus) and selects exactly **Top 5**.
   - Computes `popularityScore` (engagement + profile quality) and selects exactly **Top 3**.
4. **Card Rendering**:
   - Mobile and Web render the Top 5 Nearby and Top 3 Popular directly with pre-computed `aiCardSummary`.
