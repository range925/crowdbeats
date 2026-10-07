# CROWDBEATS V2 — PUBLIC DISCOVERY & NEARBY MUSIC MAP CURRENT STATE AUDIT

**Document Type:** Baseline Architecture & Compliance Audit (Phase 0)  
**Target Environment:** Crowdbeats V2 Monorepo (`apps/mobile`, `apps/web`, `apps/functions`, `packages/*`, `firebase/*`)  
**Date:** 2026-08-28  
**Scope:** Public Discovery, Nearby Music Map, Location Search, Authentication Gating, Privacy Protections, Stripe Connect Compliance, and Data Isolation  

---

## Executive Summary

This read-only audit inspects the current Crowdbeats V2 codebase across all client and server workspaces to establish an evidence-based baseline prior to implementing **Public Discovery, Nearby Music Map, and Location Search**.

The primary architectural shift in this release is **Progressive Authentication**: visitors without accounts, logged-out fans, solo musicians, and band members must be able to explore Home, Nearby, Maps, Artists, Bands, and Venues **without mandatory login at startup**. Authentication must be deferred until the user initiates a protected action (tipping, following, favoriting, commenting, or profile creation), preserving all selected context upon login.

Every requirement has been audited directly against the source code and classified into one of six standard categories:
- **`IMPLEMENTED`**: Fully functional code and tests exist.
- **`PARTIAL`**: Partial foundation exists, but critical functionality or parameters are missing.
- **`MISSING`**: No implementation currently exists.
- **`NEEDS REFACTOR`**: Existing code exists but directly contradicts public discovery principles (e.g. blocking unauthenticated visitors or requiring mandatory GPS).
- **`SECURITY ISSUE`**: Code exposes private fields to public queries, permits unauthorized client writes, or fails to enforce server-authoritative eligibility.
- **`PRIVACY ISSUE`**: Code exposes or risks exposing private home addresses, billing locations, continuous GPS trails, or unapproved creator coordinates.

---

## Comprehensive 21-Domain Audit Matrix

| # | Domain / Component | Status | Source Location | Key Findings & Evidence | Action Required |
|---|---|---|---|---|---|
| 1 | **Public Application Entry & Startup** | `NEEDS REFACTOR` | `apps/mobile/lib/main.dart`, `apps/mobile/lib/ui/auth/splash_screen.dart` | `GoRouter` redirect forces unauthenticated users to `/auth` on startup. Direct entry to Home/Nearby without login is blocked. | Refactor GoRouter initial route to Public Home / FanShell. Defer auth to protected actions. |
| 2 | **Fan Home Discovery** | `NEEDS REFACTOR` (Mobile) / `PARTIAL` (Web) | `apps/mobile/lib/ui/fan/tabs/home_tab.dart`, `apps/web/app/page.tsx` | Mobile HomeTab defaults to placeholder "Jordan" greeting, assumes authenticated state. Web `/` is a static marketing landing page lacking dynamic discovery feeds (Live Near You, Popular, Trending). | Refactor mobile HomeTab for public visitor state. Enhance web landing page with public discovery feeds. |
| 3 | **Nearby Screen & Map/List Sync** | `NEEDS REFACTOR` | `apps/mobile/lib/ui/fan/tabs/nearby_tab.dart`, `apps/web/app/(fan)/fan/nearby/page.tsx` | Mobile NearbyTab completely hard-blocks with `_DeniedView` if location permission is denied. Web Nearby is locked behind authenticated `(fan)` layout and uses static mock data. | Remove blocking views; implement synchronized Map, List, and Venues segmented views driven by unified query. |
| 4 | **Location Permission & Hierarchy** | `NEEDS REFACTOR` / `PRIVACY ISSUE` | `apps/mobile/lib/ui/fan/tabs/nearby_tab.dart` | Location permission requested abruptly without educational context. Fails if denied. No support for 4-level hierarchy: 1. Searched location, 2. Device GPS, 3. Cached non-sensitive area, 4. Default location. | Implement non-blocking permission UX with upfront value proposition and graceful fallback to search. |
| 5 | **Location Search & Autocomplete** | `MISSING` | `apps/mobile/lib/ui/fan/`, `apps/web/app/` | No Google Places Autocomplete or geocoding search bar for geographical areas ("Search city, town, state or country", e.g., Torrance, CA; Nashville, TN). | Integrate Google Places Autocomplete with debouncing and locality filtering (city, town, administrative area). |
| 6 | **Search Area Mode & Distance Isolation** | `MISSING` | `apps/mobile/lib/`, `apps/web/lib/` | Code conflates device GPS with discovery location. Does not maintain `deviceLocation` separately from `discoveryLocation`. Distance calculation does not adapt to searched center. | Separate `deviceLocation` and `discoveryLocation` in state. Add "Use My Location" action to return from remote city search. |
| 7 | **Interactive Map Experience** | `PARTIAL` (Mobile) / `MISSING` (Web) | `apps/mobile/lib/ui/fan/tabs/nearby_tab.dart`, `apps/web/app/(fan)/fan/nearby/page.tsx` | Mobile has `google_maps_flutter` but lacks marker preview cards, selection states, and dynamic center updates. Web uses CSS relative coordinate dots instead of real interactive map. | Enhance mobile Google Map with custom markers and preview cards; implement interactive web map view. |
| 8 | **Public Artist Profiles** | `PARTIAL` | `apps/mobile/lib/ui/musician/`, `apps/web/app/(creator)/` | Artist profiles exist only as creator workspace dashboards for logged-in musicians. Public `/artist/{creatorSlug}` views accessible without login are absent. | Create public `/artist/{creatorSlug}` route on mobile and web displaying public-safe bio, media, and tip CTA. |
| 9 | **Public Band Profiles** | `PARTIAL` | `apps/mobile/lib/ui/band/`, `apps/web/app/(band)/` | Band profiles exist only as internal governance consoles for band members. Public `/band/{bandSlug}` views accessible without login are absent. | Create public `/band/{bandSlug}` route on mobile and web displaying public-safe band roster, media, and tip CTA. |
| 10 | **Public Venue Profiles** | `PARTIAL` (Web) / `MISSING` (Mobile) | `apps/web/app/(venue)/`, `apps/mobile/lib/ui/onboarding/venue_onboarding_screen.dart` | Venue management portal exists, but public `/venues` discovery view listing active/upcoming performers is missing. | Implement public Venue discovery tab and detail view with verified venue coordinates and schedule. |
| 11 | **Public / Private Data Isolation** | `SECURITY ISSUE` | `firebase/firestore.rules`, `packages/contracts/src/profiles/` | Single documents `/artistProfiles/{id}` and `/bands/{id}` hold both public bio and internal metadata. Firestore cannot project fields on read; unauthenticated reads risk leaking internal fields. | Establish public-safe projection schema/collections (`artistPublic`, `bandsPublic`) or strict root public field schemas. |
| 12 | **Firestore Security Rules Gating** | `SECURITY ISSUE` / `NEEDS REFACTOR` | `firebase/firestore.rules` (lines 269, 336, 415, 426) | `/bands/{bandId}`, `/venueProfiles/{venueId}`, `/stages/{stageId}`, `/stageSessions/{sessionId}` require `isSignedIn()`, completely blocking unauthenticated discovery. | Update Firestore rules to allow unauthenticated read-only access to discoverable content while strictly denying all writes. |
| 13 | **Tipping Auth Gate & Context Persistence** | `NEEDS REFACTOR` / `MISSING` | `apps/mobile/lib/ui/fan/tip/tip_flow_screen.dart`, `apps/mobile/lib/state/tip_state.dart` | Tip flow assumes active user. Logged-out users cannot select $5/$10/$20 presets. Tapping Tip redirects to login and drops selection context. | Implement pre-auth amount selection, Auth Gate modal ("Sign in to tip [Artist]"), context preservation, and confirmation sheet return. |
| 14 | **Stripe Connect Verification & Server Safety** | `IMPLEMENTED` | `apps/functions/src/tip/createTipIntent.ts`, `apps/functions/src/monetization/eligibilityService.ts` | Backend verifies fan auth, creator exists, creator monetization is ACTIVE, charges are enabled, and creator is not demonetized/suspended. | Maintain strict server-authoritative financial invariants; ensure public client cannot invoke payment intent unauthenticated. |
| 15 | **Search Architecture Separation** | `MISSING` | `packages/contracts/src/routing/` | Location search (geographical place) is not architecturally separated from artist discovery search (musician name, genre, venue). | Decouple Location Search (Places API) from Artist/Content Search (Firestore/Search index). |
| 16 | **Map Categories & Filtering** | `PARTIAL` | `apps/mobile/lib/ui/fan/tabs/nearby_tab.dart` | Only basic static genres are supported. Core categories (Live Now, Near You, Popular, Trending, Solo, Bands, Venues, Upcoming) are missing. | Implement data-backed category filtering without manufacturing fake popularity metrics. |
| 17 | **Server-Authoritative Ranking & Popularity** | `MISSING` | `apps/functions/src/` | No server-maintained popularityScore or trendingScore calculations. Potential risk of clients writing ranking scores. | Implement scheduled/trigger Cloud Function to calculate ranking signals (engagement, views, verified events, tips) server-side. |
| 18 | **Public Discovery Eligibility Service** | `MISSING` | `apps/functions/src/` | Centralized `assertCreatorPubliclyDiscoverable()` check is missing. Inactive, suspended, or unapproved creators could appear in queries. | Create centralized server eligibility validator verifying active status, moderation clearance, valid public location, and role. |
| 19 | **Location Privacy Protection** | `PRIVACY ISSUE` | `firebase/firestore.rules`, `apps/mobile/lib/` | Risk of exposing private creator residential coordinates or continuous GPS tracking. No explicit check preventing private location exposure. | Enforce rule that only verified venue coordinates, scheduled performance locations, or general city centroids are published. |
| 20 | **Deep Link Continuity Across Auth** | `PARTIAL` / `MISSING` | `apps/mobile/lib/main.dart`, `apps/web/proxy.ts` | Deep links like `crowdbeats.ai/artist/{slug}` redirect unauthenticated visitors to login and dump them onto generic dashboard instead of creator. | Preserve target path and pending action payload across auth callback and route back to creator profile. |
| 21 | **Design System & Stitch Alignment** | `IMPLEMENTED` | `packages/design-tokens/`, `apps/mobile/lib/ui/theme/` | Stitch design tokens (obsidian `#131315`, purple `#8B5CF6`, pink `#ff97ba`), typography, and components are present and ready for reuse. | Assemble existing Stitch components into the complete Nearby Map/List/Venues discovery interface. |

---

## Critical Requirement Status Summary

```
PUBLIC_DISCOVERY_WITHOUT_AUTH        = FALSE (Currently blocked by GoRouter & Web layouts)
PUBLIC_ARTIST_PROFILES_WITHOUT_AUTH = FALSE (Public routes missing)
PUBLIC_BAND_PROFILES_WITHOUT_AUTH   = FALSE (Public routes missing & rules require auth)
LOCATION_AUTOCOMPLETE               = FALSE (Google Places autocomplete not integrated)
SEARCH_OTHER_CITIES                 = FALSE (City/location search input missing)
MAP_DISCOVERY                       = PARTIAL (Mobile has basic map; Web has CSS placeholder)
MAP_LIST_SYNC                       = FALSE (Segmented query sync missing)
LOCATION_PERMISSION_OPTIONAL        = FALSE (Mobile blocks with _DeniedView if denied)
PRIVATE_HOME_LOCATION_PROTECTED     = PARTIAL (Requires formal projection isolation)
TIP_REQUIRES_AUTH                   = TRUE (createTipIntent requires auth)
TIP_CONTEXT_PRESERVED_THROUGH_AUTH  = FALSE (Tip amount & artist context dropped on login)
STRIPE_CONNECT_ELIGIBILITY_ENFORCED = TRUE (createTipIntent checks monetization status)
FIREBASE_PUBLIC_DATA_ISOLATION      = FALSE (Security rules block bands/venues; public projection missing)
MOBILE_TESTS_PASS                   = TRUE (Baseline unit tests pass)
WEB_TESTS_PASS                      = TRUE (Baseline unit tests pass)
```

---

## Conclusion & Next Steps

The codebase possesses strong foundations in Firebase architecture, Stripe Connect server validation, design tokens, and Flutter/Next.js frameworks. However, the application currently enforces mandatory authentication at startup, lacks public discovery routes, hard-blocks when location permission is declined, lacks Google Places autocomplete for geographic areas, and drops tip selection context across authentication boundaries.

Phase 0 audit is **COMPLETE**. All 21 domains are cataloged with specific remediation plans.

**Ready to proceed to Phase 1: Architecture, Security, Data Projection & Backend Contracts upon user approval.**
