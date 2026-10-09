# Crowdbeats V2 Mobile Redesign — Project Brief

**Document Version:** 1.0.0  
**Date:** 2026-10-09  
**Status:** ESTABLISHED & RATIFIED (Phase 0 Baseline)  
**Author:** Principal Product Designer & Flutter Engineering Lead  

---

## 1. Executive Summary & Vision

Crowdbeats V2 is the next-generation clean-room live music technology platform, uniting live performance discovery, real-time patron tipping, creator career tooling, and sponsor matching across mobile (iOS/Android via Flutter) and responsive web (Next.js App Router).

The objective of this initiative is to execute a **comprehensive visual and interaction redesign** of the Flutter mobile application while strictly preserving backend contracts, financial integrity, security invariants, and cross-platform web behavior.

### 1.1 The Uber/Lyft Interaction Paradigm for Live Music
To deliver effortless, high-trust mobile experiences in loud, low-light, and fast-moving venue environments, the mobile experience adapts the proven ergonomic and cognitive principles pioneered by Uber and Lyft:
1. **Clear Hierarchy:** High-contrast typography and unmistakable visual weight. The most critical information (who is playing, what distance, tip amount, time remaining) is glanceable in under 1 second.
2. **Readable Typography:** Geometric display headers paired with highly legible, tabular-spaced numerals (`JetBrains Mono`) for financial and time metrics, preventing visual layout shifts.
3. **Reachable Controls (Thumb-Zone Ergonomics):** All high-frequency actions—map filters, tip amount selection, 1-tap payment buttons, camera toggles—are anchored in the bottom 40% of the screen. Critical touch targets meet or exceed 48×48dp.
4. **Simple Navigation:** A persistent, clean 5-destination bottom navigation bar with flat modal flows rather than deeply nested hierarchical stacks.
5. **Short, Understandable Journeys:**
   - *Discovery to Tip:* Under 3 taps (Tap Performer on Map/Radar → Select Tip Preset → Confirm 1-Tap Payment).
   - *Direct QR to Tip:* Under 2 taps (Scan QR → Confirm Tip).
   - *Musician Live Check-in:* Under 2 taps (Select Stage/Venue → Go Live).

*Note: In accordance with clean-room guidelines, Crowdbeats maintains its distinct brand identity and does not copy proprietary third-party logos, trademarks, or exact screens.*

---

## 2. Brand Identity & Visual Anchor System

Crowdbeats retains its proprietary, recognizable brand aesthetics:
- **Coral Pink (`#FF97BA`):** Brand primary accent; reserved for moments of joy, celebration, incoming tips, and primary call-to-actions.
- **Electric Violet (`#8B5CF6` / `#7C3AED`):** Secondary brand accent; used for interactive states, badges, QR progress indicators, and stage lighting accents.
- **Obsidian Canvas (`#131315`):** Primary dark background; prevents stage glare in dark clubs, provides maximum contrast, and saves OLED battery life.
- **Surface Elevation System:**
  - Base: `#131315`
  - Raised (Bottom sheets, navigation bars): `#1C1C1F`
  - Overlay / Cards: `#27272A`
  - High Surface: `#2E2E32`
- **Aqua Live Indicator (`#2DD4BF` / `#44E2CD`):** Dedicated micro-status cue for "Live Now" broadcasting performers.

---

## 3. Architecture & Operational Invariants

The following constraints are permanently enforced and cannot be violated:

1. **Clean-Room & Backend Preservation:**
   - Zero modifications to existing Firebase data contracts (`@crowdbeats/contracts`), Firestore schemas, or Cloud Functions v2.
   - One Firebase Auth UID per human; personas managed via Firestore membership records.
   - Client applications never write directly to `/paymentLedger`, user balances, payout records, or `/auditLogs`. All financial transactions are server-authoritative.
   - All currency values are strictly stored as integer minor units (`amountCents`) alongside an ISO currency code.
2. **Guest vs. Authenticated Boundaries:**
   - **Guest Browsing & Discovery:** Fully open. Anyone can launch the app, browse the nearby map, view public artist profiles (`/artist/:slug`), band profiles (`/band/:slug`), and explore live performances without logging in.
   - **Authenticated Action Barrier:** Sign-in is strictly required prior to initiating a tip, bookmarking an artist, sending a message, or accessing creator features. If a guest taps "Tip", they are routed to authentication with an immediate return-path.
3. **Primary Discovery & QR Routing:**
   - Geolocation-based discovery is the primary journey for fans locating nearby live stages.
   - Performer/Band QR codes serve as a direct, secondary fast-lane route deep-linking directly into that performer's tipping flow (`/tip/:performerId`).
4. **Role & Permission Guardrails:**
   - **Fan Role:** Fans cannot initiate creator balance withdrawals, cannot access Stripe Connect payout settings, and cannot unilaterally switch their role to Solo Musician or Band.
   - **Solo/Band Parity:** Creators maintain full studio feature parity on mobile (set management, live broadcast HUD, QR display, tip stream, financial balance overview). Membership transitions between solo and band contexts are strictly governed by backend permissions.
   - **Creator Eligibility:** Only creators who have passed server-authoritative verification (`assertCreatorMayMonetize`) can accept live tips and payouts.
   - **Separate Admin Access:** Enterprise Administrator CRM and Sponsor dashboards remain responsive-web-first unless dedicated mobile views are already architected.
5. **Fee Transparency:**
   - Default 6% Crowdbeats platform fee + applicable Stripe processing fees (e.g., 2.9% + $0.30), subject to verified backend fee overrides.
   - All charges, deductions, and net payouts must be displayed truthfully to fans and creators before confirmation.
6. **Responsive Web Preservation:**
   - The existing Next.js web application (`apps/web`), landing page, discovery-map section, and footer must remain 100% operational and visually intact. Shared package edits (`packages/design-tokens`, `packages/contracts`) must be verified against web builds and tests.

---

## 4. Phase-Gated Redesign Lifecycle

Every phase of the redesign strictly adheres to a 7-step gating protocol:

```
[1. Inspect Repository] ➔ [2. Propose Changes] ➔ [3. Create Stitch Designs] 
       ➔ [4. Implement Code] ➔ [5. Connect Real Data] ➔ [6. Test Thoroughly] 
       ➔ [7. Issue Phase Report]
```

- **Stop-and-Fix Rule:** If any acceptance criterion or automated test fails during a phase, work stops immediately in that phase. The team must fix and re-test until green before advancing.
- **Single Implementation Ownership:** Every changed file has exactly one agent owner. Parallel agents work on disjoint files; the engineering lead reviews and integrates shared contracts.
- **Contract Freeze:** Simultaneous ad-hoc edits to routing, theme, models, and shared widgets are strictly prohibited.
- **Safety Gate:** No production deployment, no live Stripe charges, no destructive migrations, and no unrelated code rewrites.

---

## 5. Specialist Subagent Team Structure

A specialized 12-person team has been established:

| # | Agent Name / Identifier | Specialist Role | Primary Scope & Responsibilities |
|---|---|---|---|
| 1 | `ux_researcher_ia` | Product/UX Researcher & IA | Journey mapping, information architecture, Uber/Lyft simplicity, screen hierarchy. |
| 2 | `stitch_screen_designer` | Google Stitch Screen Designer | Authoring Stitch prompts, inspecting/generating Stitch screens, exporting layout tokens. |
| 3 | `visual_design_system_specialist` | Visual Design & Theme Specialist | Brand aesthetics, design tokens sync (`tokens.ts` ↔ `cb_theme.dart`), thumb-zone ergonomics. |
| 4 | `flutter_architecture_engineer` | Senior Flutter Architect | Riverpod state architecture, widget lifecycles, memory safety, data/presentation separation. |
| 5 | `responsive_web_engineer` | Responsive Web Engineer | Guarding Next.js web app, cross-platform contract parity, landing page preservation. |
| 6 | `firebase_integration_engineer` | Firebase & Realtime Engineer | Firestore schemas, security rules, real-time listeners, server-authoritative monetization. |
| 7 | `auth_routing_deeplink_specialist` | Auth, Routing & Deep-Link Specialist | GoRouter architecture, auth state listeners, deep links (`/tip/:id`, `/artist/:slug`), guest gates. |
| 8 | `maps_location_perf_specialist` | Maps & Location Specialist | Google Maps Flutter, 9 location permission states, battery optimization, sensor shutoff. |
| 9 | `stripe_payment_specialist` | Stripe & Payment Specialist | Tipping UX, 1-tap PaymentSheet, 6% + Stripe fee disclosure, payout eligibility. |
| 10 | `a11y_localization_specialist` | A11y & Localization Specialist | WCAG 2.2 AA compliance, 48×48dp touch targets, semantic trees, screen reader support. |
| 11 | `banana_pro_asset_specialist` | Visual Asset Specialist | Photographic direction, concert imagery prompts, visual exploration, tracking asset blockers. |
| 12 | `qa_visual_regression_specialist` | Functional QA & Release Specialist | Test matrix management, Flutter & Web test runs, regression verification, rollback protocols. |

---

## 6. Tooling & Integration Access Audit

| Tooling / Integration | Verified Status | Evidence & Capabilities |
|---|---|---|
| **Google Stitch MCP** | **ACTIVE / OPERATIONAL** | Connected via MCP. Verified projects (`projects/14673587965252723053`, `projects/14511063740330293106`, `projects/13418068361858244560`, `projects/9767484674308153375`, `projects/4991587405639772867`). |
| **Flutter CLI & Dart** | **ACTIVE / OPERATIONAL** | Flutter 3.47.1, Dart 3.13.1. `flutter analyze` runs clean with 0 warnings. `flutter test` executes 357 tests. |
| **Firebase MCP & Rules** | **ACTIVE / OPERATIONAL** | Connected via MCP. Local emulator integration ready. Firestore rules validation operational. |
| **TypeScript / Web Tooling** | **ACTIVE / OPERATIONAL** | Node 20+, TypeScript 5.9.3. `npm run typecheck` passes across all workspaces with 0 errors. Jest suite passes 554 tests. |
| **Gemini Banana Pro Asset Tool** | **BLOCKED / UNAVAILABLE** | The specialized "Gemini Banana Pro" image generation model is not provisioned as an accessible tool in the current environment. Per project rules, this dependency is officially recorded as **BLOCKED**; it will never be falsely claimed as used, nor will substitute designs be marked complete in its place. |
