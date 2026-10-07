# Crowdbeats V2 — Public Discovery API Reference
**Document Reference**: `CB-DOC-API-DISCOVERY-003`  
**Classification**: Developer & System Specification  
**Last Updated**: 2026-08-28  

---

## 1. Overview

The Crowdbeats Public Discovery API provides endpoints and callables for querying live performers, active stages, venues, and curated music hubs without requiring authentication.

---

## 2. Cloud Function Callable: `getPublicDiscoveryFeed`

### Endpoint Specification
- **Trigger**: HTTPS Callable (`onCall`)
- **Authentication**: Optional (`request.auth` may be null)
- **Region**: `us-central1`

### Request Parameters (`PublicDiscoveryFeedQuery`)

```typescript
export interface PublicDiscoveryFeedQuery {
  readonly latitude?: number;
  readonly longitude?: number;
  readonly radiusMiles?: number;          // Default: 25, Min: 1, Max: 100
  readonly city?: string;                 // e.g. "Torrance"
  readonly administrativeArea?: string;   // e.g. "California"
  readonly country?: string;              // e.g. "United States"
  readonly category?: DiscoveryCategory;  // Default: LIVE_NOW
  readonly genre?: string;                // e.g. "Indie Pop"
  readonly limit?: number;                // Default: 20, Max: 50
  readonly pageToken?: string;
}
```

### Response Payload (`PublicDiscoveryFeedResponse`)

```typescript
export interface PublicDiscoveryFeedResponse {
  readonly location: DiscoveryLocation;
  readonly livePerformances: readonly PublicLivePerformance[];
  readonly featuredArtists: readonly PublicArtistProfile[];
  readonly featuredBands: readonly PublicBandProfile[];
  readonly nearbyVenues: readonly PublicVenueProfile[];
  readonly totalLiveCount: number;
  readonly totalVenuesCount: number;
  readonly nextPageToken?: string;
}
```

### Error Codes
| Code | Description | Client Action |
| :--- | :--- | :--- |
| `INVALID_ARGUMENT` | Coordinates out of valid range ($-90 \le lat \le 90$, $-180 \le lng \le 180$) | Prompt user to refine query |
| `RESOURCE_EXHAUSTED` | Rate limit exceeded (> 60 queries/min per IP) | Retry with exponential backoff |
| `INTERNAL` | Downstream Firestore index error | Gracefully fallback to cached city presets |

---

## 3. Direct Firestore Public Collection Queries

Clients can listen to live updates directly using public Firestore queries:

```typescript
// Active Live Sessions
db.collection('stageSessions')
  .where('status', '==', 'active')
  .where('isPublic', '==', true)
  .orderBy('startedAt', 'desc')
  .limit(20);

// Active Artist Profiles
db.collection('artistProfiles')
  .where('isActive', '==', true)
  .where('isDiscoverable', '==', true)
  .orderBy('popularityScore', 'desc')
  .limit(20);

// Active Venues
db.collection('venueProfiles')
  .where('isActive', '==', true)
  .limit(20);
```
