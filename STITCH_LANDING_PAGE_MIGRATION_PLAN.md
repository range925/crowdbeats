# STITCH_LANDING_PAGE_MIGRATION_PLAN.md
## Crowdbeats Public Web Landing Page Redesign
**Authoritative Stitch Source:** `https://stitch.withgoogle.com/projects/14673587965252723053`  
**Stitch Project ID:** `14673587965252723053`  
**Project Title:** Crowdbeats Landing Page Redesign  
**Approved Design Theme:** *Sonic Precision* (Manrope + Inter, Electric Violet `#7C3AED`, Status Aqua `#2DD4BF`, Obsidian `#0A0A0B`, Clean Surface `#FCF8FB` / `#F5F5F7`)

---

## 1. Detected Stack & Target Route

| Attribute | Detected Value | Notes |
|---|---|---|
| **Framework** | Next.js 16.3.3 (App Router with Turbopack) | Monorepo package `@crowdbeats/web` |
| **Runtime & Language** | React 19.2.8, TypeScript 5.x, Node.js 20+ | Fully typed, strict mode |
| **Styling Paradigm** | CSS Custom Properties (`tokens.css`, `globals.css`) + Tailwind-compatible styling | Zero external UI library lock-in |
| **Typography System** | `next/font/google` (Manrope for headlines, Inter for body/telemetry) | Zero CLS font loading |
| **Public Landing Entry Route** | `apps/web/app/page.tsx` | Renders `LandingOrchestrator`, defaulting to `MillionDollarLanding` |
| **Global Header** | Sticky header inside landing page / layout | Theme toggle, responsive mobile drawer |
| **Global Footer** | `apps/web/components/ui/CbFooter.tsx` | All 4 legal/support columns and California notices preserved |
| **Maps & Discovery Engine** | MapLibre GL 6.10.0 + Google Maps Provider abstraction | `DiscoveryClient`, `DEFAULT_DISCOVERY_LOCATION` |
| **Authentication Routes** | `/auth`, `/auth?mode=register`, `/login` | Connected to shared auth flow |
| **Artist / Fan Routes** | `/onboarding/artist`, `/creator/dashboard`, `/fan`, `/preview` | Fully preserved existing navigation destinations |
| **Campaign Routes** | `/creator/campaigns`, `/fan/following` | Fully preserved |
| **Compliance / Privacy** | `PrivacyConsentWidget.tsx`, `CrowdbeatsJsonLd.tsx` | CCPA/GDPR zero-tracking pre-consent compliant |

---

## 2. Baseline Status & Pre-Existing Conditions

| Verification Step | Command | Status | Notes |
|---|---|---|---|
| **Unit & Integration Tests** | `npm test` in `apps/web` | **PASS (100%)** | 26 test suites passed, 330 tests passed. |
| **TypeScript Type Check** | `npm run type-check` | **PASS (0 errors)** | Full type safety across web package. |
| **Production Build** | `npm run build` | **PASS (100%)** | Turbopack compiles 192 static & dynamic routes cleanly in 3.6s. |
| **Linter** | `npm run lint` | **PRE-EXISTING ISSUES** | Pre-existing 403 TypeScript `@typescript-eslint/no-explicit-any` errors in `apps/web/lib/maps/` providers. Recorded separately. |
| **Baseline Screenshots** | Chrome Headless (Playwright CLI) | **CAPTURED** | Desktop (1440×1200), Tablet (1024×1366), Mobile (390×844) saved to artifact storage. |

---

## 3. Stitch Project Hierarchy & Assets

### Approved Screens Retrieved via MCP:
1. **Desktop Refined Stage:** `projects/14673587965252723053/screens/e046a8fcf95c49988bc3d11628e28e4b` (2560 × 13530)
2. **Mobile Refined Stage:** `projects/14673587965252723053/screens/02cd6f1abf23414ea0769858f03cee0b` (780 × 11020)
3. **Brand Logo SVG:** `projects/14673587965252723053/screens/582c5898a4af4e5084985703aff188cf`
4. **Cinematic Hero Background:** `projects/14673587965252723053/screens/14041dfff4a245d19d0b04cd6dd42bb0`

### Assets Downloaded & Locally Staged:
- `apps/web/public/stitch/crowdbeats_logo_stitch.svg`
- `apps/web/public/stitch/hero_amphitheater_dusk.jpg`
- `apps/web/public/stitch/luna_hollis_stage.jpg`
- `apps/web/public/stitch/sandiego_map_preview.jpg`

---

## 4. Implementation Mapping Table

| Stitch Section / Component | Stitch Screen / Layer Identifier | Existing Code Component | Action | Data / Route Dependency | Validation |
|---|---|---|---|---|---|
| **Sticky Global Header** | `header.sticky` (h: 52px, backdrop-blur-xl) | `MillionDollarLanding` nav bar & `ThemeToggle` | Restyle & adapt | `/`, `#discovery-stage`, `#artist-story`, `/auth`, Theme Context | Keyboard trap on mobile drawer, sticky scroll threshold, contrast in Light & Dark |
| **Hero Section** | `SECTION 1: HERO SECTION` (min-h: 920px, `#0A0A0B`) | `MillionDollarLanding` Hero container | Rebuild in Stitch composition | `#discovery-stage`, `#artist-story` | "LIVE MUSIC, CLOSER" aqua badge, canonical copy, 3 mockup phones with real accessible DOM elements |
| **Hero Mockup Trio: Radar** | Phone Left (`#161618`, rounded-[2.5rem]) | Curated radar card | New reusable mockup card | `DEFAULT_DISCOVERY_LOCATION` (Jake Rios 0.4 mi away) | Interactive "Listen In" preview, walking route badge |
| **Hero Mockup Trio: Performer** | Phone Center (`#161618`, dominant elevated) | Performer profile card | Restyle in Stitch composition | Performer profile (`luna_hollis_stage.jpg`, $184.50 tips tonight, campaign progress) | Accessible HTML, "Tip Luna Hollis" modal trigger |
| **Hero Mockup Trio: Fee Breakdown** | Phone Right (`#161618`, tipping breakdown) | Interactive fee preview | Restyle in Stitch composition | Tip calculation ($10 -> 6% tech fee $0.60, Stripe $0.59, Net $8.81) | Interactive non-charge demonstration state |
| **Fan Journey (3 Steps)** | `SECTION 2: THREE STEP FAN JOURNEY` | Multi-step fan story | Rebuild in Stitch composition | Static narrative + live stage count demonstration | 1. Find, 2. Pay, 3. Tip; 3 balanced cards with purple number badges |
| **Nearby Live Radar (Discovery)** | `SECTION 3: DISCOVERY SECTION` | `MillionDollarLanding` Discovery & `DiscoveryClient` | Recompose into split layout | `cityPerformers`, `cityVenues`, `DEFAULT_DISCOVERY_LOCATION`, geolocation | Split view: 3 live performer cards (Jake Rios, The Sunsets, Pacific Echoes) + live map container with active stage card |
| **Artist Journey** | `SECTION 4: ARTIST STORY` (Dark `#0A0A0B` panel) | Creator / Musician story | Rebuild in Stitch composition | `/onboarding/artist`, `/creator/dashboard` | 3 Pillars: 1. Instant Check-In QR, 2. Real-Time Direct Deposit with interactive fee calculator ($10, $25, $50, $100), 3. Fan Direct |
| **Feature Grid (2×2 Bento)** | `SECTION 5: BESPOKE FEATURE GRID` | Feature cards & Persona tabs | Rebuild as 2×2 asymmetric grid | `/creator/campaigns`, `/fan/following`, `/band/splits` | Feature A: Campaigns ($4,850/6,000), B: Fan Direct alert, C: Band Split (40/25/20/15%), D: Stage QR Placard |
| **Trust & Clarity** | `SECTION 6: TRUST & CLARITY` | Trust banner / badges | Rebuild as 4 clean pillars | Legal disclosures, California law compliance | 4 Pillars: Verified Performers, Stripe Security, 100% Upfront 6%, Safety & Fair Disputes |
| **Final Call to Action** | `SECTION 7: FINAL CALL TO ACTION` | Bottom CTA banner | Rebuild in Stitch composition | `#discovery-stage`, `#artist-story`, `/auth` | Centered clean card with Find Live Music & Join as an Artist |
| **Preserved Global Footer** | `footer.bg-surface-container-low` | `apps/web/components/ui/CbFooter.tsx` | Restyle & ensure 4 columns / mobile accordions | All 4 legal/support link categories, California disclosures, contact emails | 100% preservation of all 20+ URLs, emails, LLC info, 6% fee disclosure, and jurisdiction language |

---

## 5. Execution Order

1. **Tokens & Fonts (Phase 2):** Update `tokens.css` with Sonic Precision design tokens (Manrope + Inter fonts, `#7C3AED` violet, `#2DD4BF` aqua, `#0A0A0B` obsidian, `#FCF8FB` light surface).
2. **Assets Staging (Phase 3):** Incorporate local SVGs and web-optimized images in `apps/web/public/stitch/`.
3. **Sticky Global Header (Phase 4):** Implement Stitch 52px sticky header with smooth blur transition, search button, theme switch, auth buttons, and accessible mobile navigation drawer.
4. **Hero & Phone Mockup Trio (Phase 5A):** Implement atmospheric dark hero section with live aqua badge, canonical copy, and the trio of accessible HTML phone mockups.
5. **Fan Journey & Discovery Stage (Phase 5B & 5C):** Implement the 3-step Find-Pay-Tip journey and the split-screen live radar discovery stage with performer cards and map viewport.
6. **Artist Journey & 2×2 Feature Bento (Phase 5D & 5E):** Implement dark obsidian Play-Earn-Grow section with interactive fee calculator and the 4 alternating feature panels.
7. **Trust, Final CTA, & Preserved Footer (Phase 5F, 5G, & Phase 6):** Implement trust pillars, final CTA, and style `CbFooter` with mobile `<details>` accordions and preserved legal disclosures.
8. **Responsive, Theme, & Accessibility Verification (Phase 7 & 8):** Verify across 1440px desktop, 1024px tablet, and 390px mobile viewports, ensuring WCAG 2.2 AA contrast and keyboard accessibility.
9. **Functional & Regression Testing (Phase 9):** Run `npm test`, `npm run type-check`, and `npm run build`.
10. **Visual Regression Verification (Phase 10):** Capture full-page screenshots and compare side-by-side with Stitch reference targets.
