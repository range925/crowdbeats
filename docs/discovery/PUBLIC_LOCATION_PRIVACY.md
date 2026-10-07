# Crowdbeats V2 — Public Location & Creator Privacy Architecture
**Document Reference**: `CB-DOC-LOCATION-PRIVACY-005`  
**Classification**: Security, Privacy & Compliance Architecture  
**Status**: `ACTIVE & BINDING`  

---

## 1. Zero-Leakage Privacy Invariants

To safeguard musicians, venue staff, and fan safety, Crowdbeats enforces strict spatial privacy controls across all public discovery feeds and map visualizations.

### Strict Prohibitions:
1. **No Residential Address Exposure**: Creator residential addresses, home coordinates, and IP-derived locations are **never** stored in public collections or returned in API responses.
2. **No Continuous GPS Tracking**: Fan device locations are processed ephemerally in client memory for distance calculation; server never receives a continuous stream of GPS breadcrumbs.
3. **No Financial Coordinate Leakage**: Stripe billing addresses, KYC identity documents, and payout routing metadata remain in server-only subcollections (`/users/{uid}/financial`).

---

## 2. Location Anchor Hierarchy

```
[Public Event at Venue] ──► Uses verified commercial venue coordinates (e.g. 450 Harbor Drive)
[General Public Area]   ──► Uses public city center coordinates (e.g. Torrance Civic Center)
[Private Residence]     ──► STRICTLY EXCLUDED FROM DISCOVERY MAPS
```

---

## 3. Projection Separation Model

```typescript
// Public Projection: /artistProfiles/{slug}
export interface PublicArtistProfileProjection {
  readonly artistId: string;
  readonly creatorSlug: string;
  readonly stageName: string;
  readonly photoUrl?: string;
  readonly genres: readonly string[];
  readonly isVerified: boolean;
  readonly isLive: boolean;
  readonly currentVenueName?: string;
  readonly latitude: number;          // Public venue or city center ONLY
  readonly longitude: number;         // Public venue or city center ONLY
  readonly aiCardSummary?: string;
}

// Private Owner Collection: /users/{uid} (Protected by Firestore Rules)
export interface PrivateUserDocument {
  readonly email: string;
  readonly phoneNumber: string;
  readonly legalName: string;
  readonly residentialAddress?: {
    readonly street: string;
    readonly unit?: string;
    readonly postalCode: string;
  };
  readonly stripeAccountId: string;
}
```
