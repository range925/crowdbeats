# CROWDBEATS V2 — DISCOVERY & LOCATION PRIVACY REVIEW

**Document:** `docs/discovery/DISCOVERY_PRIVACY_REVIEW.md`  
**Classification:** Data Privacy, Geolocation Safety & SAIF Compliance Review  
**Status:** **AUTHORITATIVE PRIVACY POLICY & DESIGN SPECIFICATION**  
**Target Environment:** Flutter Mobile, Next.js Web, Cloud Firestore, Cloud Functions Gen 2  

---

## 1. Core Privacy Invariants

1. **Strict Prohibition on Private Residential Address Disclosure**:
   - Under no circumstances does Crowdbeats ever render, query, or transmit a creator's private residential address or private home coordinates to public discovery surfaces.
   - Address fields stored in `/users/{uid}` or Stripe KYC vaults are completely isolated from `/artistProfiles` and `/bands`.
2. **Zero Continuous Background GPS Tracking**:
   - The platform never continuously tracks or broadcasts a creator's or fan's background GPS location.
   - Location is queried only upon explicit foreground user action (opening Nearby or tapping "Use My Location").
3. **Approved Public Location Sources Only**:
   - Permitted sources for public discovery markers:
     1. **Verified Venue Coordinates** (physical commercial venue location)
     2. **Scheduled Performance Location** (stage session during active time window)
     3. **Artist-Approved Public Performance Position** (e.g. busking at approved landmark)
     4. **General City / Locality Centroid** (e.g. Torrance, CA general discovery area)
4. **No Location Inference from Private Data**:
   - The application strictly prohibits inferring or deriving a creator's location from billing addresses, credit card bank data, Stripe Connect verification records, IP addresses, or private transaction receipts.
5. **Explicit Opt-In for Live Location Broadcasts**:
   - An artist or band appears as "Live Now" on the map **only** when they have explicitly initiated an active stage session via the Creator Live HUD.
   - When the session ends or expires, live coordinates are immediately removed from discovery feeds.

---

## 2. Telemetry & Analytics Privacy Guardrails

To prevent indirect privacy leakage, all client analytics events are sanitized against a strict whitelist:

### Permitted Discovery Analytics Events:
- `nearby_opened` (Timestamp, searchMode: GPS | SEARCHED)
- `discovery_location_selected` (placeId, city, state, country — no precise lat/lng)
- `artist_profile_viewed` (creatorId, creatorSlug, sourceScreen)
- `band_profile_viewed` (bandId, bandSlug, sourceScreen)
- `map_marker_selected` (creatorId, markerType: ARTIST | BAND | VENUE)
- `location_search_completed` (queryCity, resultCount)
- `tip_auth_gate_opened` (creatorId, amountCents, currency)

### Strictly Forbidden Data Fields in Telemetry:
- ❌ Continuous GPS coordinates or tracklogs
- ❌ Credit card numbers, CVVs, or Stripe payment tokens
- ❌ Private chat messages or comments
- ❌ Identity verification (KYC) documents or passport scans
- ❌ Raw Firebase Authentication bearer tokens
- ❌ Musician home addresses or personal phone numbers

---

## 3. Privacy Verification Matrix

| Privacy Requirement | Status | Verification Mechanism |
|---|---|---|
| Private home address never returned in public payload | ✅ VERIFIED | `getPublicDiscoveryFeed` and public projection models omit private address fields. |
| Private coordinates never exposed | ✅ VERIFIED | Spatial queries project to verified venue coordinates or city centroids. |
| Device GPS separated from Searched City | ✅ VERIFIED | Separate state variables (`deviceLocation` vs `discoveryLocation`). |
| Location permission optional & non-blocking | ✅ VERIFIED | Discovery operates seamlessly in Search Area Mode if GPS is denied. |
| Background GPS broadcast impossible | ✅ VERIFIED | No background location service manifests or listeners configured. |
