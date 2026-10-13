# Crowdbeats Mobile Redesign — Task Record

Scope: the Flutter app at `apps/mobile` (Guest, Fan, Solo Musician, Band). Sponsor and Admin are out of scope except for regressions in shared components. The separate Apple-like landing page (`apps/web` plus Stitch project `14673587965252723053`) stays untouched.

Companion inventory: [`coverage.csv`](./coverage.csv). It has one row per screen, state group or overlay. **No row may be deleted.** Retired screens get status `retire-proposed` or `retired`, plus a reason.

Status vocabulary (kept separate on purpose):

- `designed` = Stitch screen exists and has been reviewed.
- `implemented` = Flutter code merged.
- `tested` = a named check was actually run and passed.
- `blocked` = needs the recovery action listed in §9.
- Anything not run is `not-run`, never "pass".

---

## Phase 1 — Discovery, inventory and ownership (GATE REPORT)

| Field | Value |
|---|---|
| Date | 2026-10-12 / 2026-10-13 |
| Coordinator | Antigravity main agent (lead designer / Flutter coordinator) |
| Phase scope | Read-only inspection of the repo, references, Stitch, backend contracts and tooling. Create this record and the coverage inventory. **No app, rules, functions or Stitch edits.** |
| Checkpoint before edits | `CP-0`: git HEAD `d7f10a2` on top of `c53137b`. Working tree was clean (`git status --short` empty). Tagged `redesign-mobile-cp0`. |
| Files changed in Phase 1 | `docs/crowdbeats-mobile-redesign/task-record.md`, `coverage.csv`, `references.md`, `dependency-map.md`, `contracts.md`, `inventory/ui-inventory-guest-fan.md`, `inventory/ui-inventory-creator-band.md`, `baseline/baseline-report.md`, `baseline/logs/flutter_doctor.txt`, `apps/mobile/test/baseline/baseline_characterization_test.dart`. |
| Rollback | Revert to tag `redesign-mobile-cp0` (`d7f10a2`). |

### 1.1 Checks actually run

| Check | Command | Result |
|---|---|---|
| Static analysis baseline | `flutter analyze --no-pub` (in `apps/mobile`) | **PASS**: "No issues found! (ran in 9.6s)" |
| Unit/widget test baseline | `flutter test --no-pub -r compact` (in `apps/mobile`) | **PASS**: "+463: All tests passed!". Logs show expected "No Firebase App" fallbacks inside tests. |
| Functions & Web typecheck | `npm run typecheck` (in repo root) | **PASS**: 0 TypeScript errors across `apps/web`, `apps/functions`, and `packages/contracts`. |
| Functions unit tests | `npm run test` (in repo root) | **PASS**: Jest test suite passed. |
| Characterization baseline | `flutter test test/baseline/baseline_characterization_test.dart` | **PASS**: 10 of 10 tests passed (verifying router gaps, role authorization, creator context defaults, and accessibility). |
| Toolchain & host environment | `flutter doctor -v` | Flutter 3.47.1 stable, Dart 3.13.1, Node 22.18.0, TS 5.9.3, Chrome & Edge available; logged in `baseline/logs/flutter_doctor.txt`. |
| Stitch MCP reachability | `list_projects`, `list_screens(14673587965252723053)`, `list_screens(15305895713860235880)` | **PASS**: 19 projects listed |
| Stitch project `5326179813018056505` | `get_project` | **FAIL**: "Requested entity was not found" (see B-19) |

### 1.2 Capability check (honest)

| Capability | Status | Evidence / note |
|---|---|---|
| Expert subagents | **Available.** Three read-only research subagents ran in parallel: Flutter IA/navigation, Auth/Firebase/Payments, Location/Creator/Band. | Reports are folded into §§3-8. They used separate conversation contexts and edited no files. |
| Preferred "Gemini Pro 3.1" reasoning model | **Not verifiable.** | Subagents accept `inherit/flash/pro`, and the model behind `pro` isn't identified to me. This coordinator session runs on Claude Opus 5.5 (the user's selection). |
| "Banana Pro" imagery | **Not verifiable.** A `generate_image` tool exists, but its underlying model isn't identified as Banana Pro. | This record will not claim Banana Pro use. Imagery generated later is labelled "generate_image tool". |
| Google Stitch MCP | **Available** (create/generate/edit/variants/design-systems). | |
| Stitch Loop skill | **Available, but designed for websites** (`.stitch/next-prompt.md` baton, `site/public`). | `.stitch/` currently holds the **landing-page** loop (metadata project 5326…, `SITE.md`). To protect it, the mobile redesign will run its own baton at `docs/crowdbeats-mobile-redesign/stitch/next-prompt.md` and a **new** Stitch mobile project. |
| Flutter / Dart CLI | Available | 3.47.1 / 3.13.1 |
| Dart/Flutter MCP, Firebase MCP | Available (lazy) | Not used in Phase 1; no deploys. |
| Python | **Not installed** | Reference crops were made with PowerShell + System.Drawing. |
| Vector icons | Material Icons (`uses-material-design`) and `cupertino_icons` are already present. | No new icon package is needed. |

---

## 2. Reference findings

Source boards are 1024×576 px each. Individual phone frames are only about 60×180 px, so I upscaled crops 3× (bicubic) into the agent scratch folder (`scratch/ref/*.png`). **Small text, exact colours and font families cannot be measured at this resolution.** No hex or font value below was extracted from the images.

### 2.1 Fan Guest board (priority 1)
- **Identity:** concert photography heroes, near-black surfaces, a single saturated purple for primary CTAs and selected chips, and a green/lime accent on "LIVE" badges and QR scan frames.
- **Journeys shown:**
  - "Nearby Live Music": a map with circular avatar pins and a Map/List/Venues segmented control, over a list of "Live Near You" cards, each with a Tip button.
  - "Tip a Musician": a hero photo with a QR scan frame, amount chips ($5/$10/$20/$50/Other), an optional message, a payment-method row and a full-width purple "Tip $10" CTA.
  - "Tip" (alternate): a performer card, "How much would you like to tip?", Apple Pay / Google Pay / Card radio list, "Tip Alex — $5".
  - Activity: filter chips, then a Today/Yesterday grouped feed.
  - Fan profile creation: a 4-step progress stepper with a hero banner on every step and dense chip grids.
  - A "Your profile is created!" success screen, and a home "Good evening" dashboard.
- **Keep:**
  - Music imagery on discovery and profile.
  - A purple primary CTA.
  - The map-plus-list pairing.
  - Amount chips plus Custom.
  - Grouped activity by day.
  - A 4-step onboarding progress indicator.
- **Improve, not copy:**
  - Drop the repeated decorative hero banners on every onboarding, auth and settings step.
  - Reduce the 3-4-column chip grids and tiny secondary labels.
  - Replace the raised center Tip/QR nav button.
  - Remove the duplicate Home vs Nearby surfaces.
  - Stop showing Apple Pay. It was removed in commit `f6d40b6` and isn't supported in code.

### 2.2 Band board (priority 2)
- **Identity:** the same dark/purple mobile language. The desktop-width "Create your Band Profile" wizards use **lime-green CTAs** and a left step rail, which is a web creator-studio pattern.
- **Shown:** band profile creation (members, media, socials), review profile, "You're ready to go", band home "Good evening", tip screen, activity, map.
- **Decision:** keep purple as the single action accent on mobile. Lime/green is limited to *status* (live and success), never primary actions. The web wizard layout is not ported to mobile; mobile uses single-column steps.

### 2.3 "Uber example" board (priority 3; actually shows **Lyft** screens)
- **Patterns to adopt:**
  - Large bold page titles and short section headers (General, Shortcuts, Safety, Data Management).
  - Full-width grouped rows, each with a leading icon, title, secondary line and chevron or switch, separated by subtle dividers.
  - A profile header with avatar, name, verification badge and 3 stat columns.
  - A payment screen with a balance card, then payment defaults, then a payment-methods list.
  - Privacy screens with explanatory copy, a toggle and a "Learn more" link.
  - Data management (download data, delete account).
  - Restrained use of cards.
- **Do not reproduce:**
  - Ride-specific features (rides, autonomous vehicles, work/home shortcuts, calendars, driver visibility).
  - Lyft/Uber branding or pink accent.
  - **Any personal info visible on the board** (names, email, phone, card numbers).

### 2.4 Stitch supplementary references
- **`5326179813018056505`** (the user's "older app project"):
  - **Not accessible**: `get_project` returned *Requested entity was not found*.
  - Local `.stitch/metadata.json` labels this ID as *"Crowdbeats V2 — Vivid Resonance Landing Page"*, DESKTOP. That conflicts with "older app project".
  - Treated as unavailable (B-19).
- **`14673587965252723053`** "Crowdbeats Landing Page Redesign":
  - Accessible. Contains landing screens (dark and light), a **"Crowdbeats Brand Logo"** asset (512 px), the marketing kit and imagery.
  - Its marketing copy promises "instant payout", "Apple Pay" and a "Direct Payout Dispatched!" Tip Sent screen. **These claims conflict with server behavior and must not be used in the app** (see §5).
  - Supplementary only. The landing direction is preserved.
- **Other accessible mobile projects:**
  - `15305895713860235880` Refined Mobile Design System (one DESIGN.md screen)
  - `14803473511224825598` Auth & Onboarding
  - `5962678186146308844` Discovery & Maps
  - `4651864516890947600` Tipping, Payments & Receipts
  - `7830975526373742506` Social, Profiles & Safety
  - `8121703322065528196` Solo Studio & Live Stage
  - `11911361438744489466` Band Mobile
  - `279014064426881115` Account Settings
  - `11407187501839036182` Campaigns/Payout
  - Older: `13418068361858244560` Fan, `14511063740330293106` Solo, `4991587405639772867` Band, `6008070362926434263` Master DS
  - All are candidates for **relevance review in the design phase**. They are not authoritative because the current boards take precedence.
- **Approved logo:** `CrowdbeatsLogo` (`apps/mobile/lib/ui/components/cb_logo.dart`, currently used only in tests) and the Stitch "Crowdbeats Brand Logo" asset. Which one is approved needs confirmation (OD-L1).

---

## 3. Verified repository facts (Flutter)

- **Framework / state / routing:** Flutter + Riverpod 2.6 + go_router 18. Firebase Auth/Firestore/Functions/Messaging, `flutter_stripe` 14, `google_maps_flutter`, geolocator, `mobile_scanner`.
- **Single entry point:** `apps/mobile/lib/main.dart` holds the bootstrap, the router (61 flat `GoRoute`s), the app widget and private system screens.
- **No `StatefulShellRoute`.** Shell tabs are local `IndexedStack`s, so tab state survives in memory, but tabs aren't addressable by URL and Android back doesn't switch tabs.
- **52 imperative `MaterialPageRoute` pushes** in `ui/`.
- **Stale docs:**
  - The prior redesign docs (`docs/redesign/ROUTE_MATRIX.md`, `SCREEN_REGISTRY.md`, commit `c53137b` "phases 1-15 … verified") describe routes, shells and files that **do not exist** (for example `StatefulShellRoute`, `/fan/following`, `/fan/messages`, `ui/discovery/*`, `ui/tipping/*`).
  - They are treated as **unverified history**, not current state.
  - `FLUTTER_REMOVAL_IMPACT_AUDIT.md` references `apps/mobile_flutter` and `apps/admin_web`, which don't exist. It is stale; Flutter lives at `apps/mobile`.
- **Current shells:**

  | Shell | Tabs |
  |---|---|
  | FanShell, guest | Nearby (PublicDiscoveryHome) / Discover (NearbyTab) / Account |
  | FanShell, fan | Home / Nearby / **Tip (raised center FAB)** / Activity / Profile |
  | CreatorShell | Home / Live / Campaigns / "Inbox" (actually a fan directory) / Studio |
  | BandShell | Home / Live / Campaigns / Members / Profile. A *second* band implementation. |
  | MusicianShell | Orphaned. Holds the only real Connect/QR/campaign wiring. |
  | SponsorShell | Out of scope |

- **Theme:**
  - `CbTheme.dark()` / `CbTheme.light()` exist, but light is partial.
  - There are about 1,177 `Color(0x…)` literals and about 1,287 `Colors.white` uses across `ui/`, so **light mode is effectively broken**.
  - Fonts are mixed: **Plus Jakarta Sans** for text and app bar, **DM Sans** for buttons, inputs and nav, **JetBrains Mono** for numerals. All load through the existing `google_fonts`.
  - Spacing is a 4-pt scale (`cb_spacing.dart`), radius tokens run 4-32, and `touchMin` is 48.
- **Text scaling:** `main.dart` sets `textScaler: TextScaler.linear(a11y.fontScale)`, which **replaces** the OS text scale (B-17).
- **Emulator default:** `USE_EMULATOR` defaults to **true** (`main.dart:85`). Only Functions onboarding helpers are pointed at the emulator, so other callables hit production while auth is on the emulator (B-05).

## 4. Verified backend / auth facts

- **Auth:**
  - Email/password, Google and Apple are present in `auth_service.dart`. **Apple isn't wired in the UI.** There is no phone sign-in.
  - Persistence is the Firebase default.
  - The persona is a single `personaType` string from `users/{uid}`, with a custom-claim fallback.
- **Persona ID mismatch.** Four different sets are in use:

  | Source | IDs |
  |---|---|
  | Wizard | `fan/artist/band/sponsor` |
  | Rules | `fan/artist/band_member/venue_manager/sponsor_rep` |
  | Enum | `bandMember/sponsorRep/staff` |
  | `requestPayout` | `artist/band_member` only |

- **Router guard (`cbAuthRedirect`):**
  - Requires auth for `/account*`, `/creator*`, `/band`, `/sponsor*`.
  - **Has no persona authorization.** `PersonaSwitcherSheet` and `AccountHubScreen` let *any* signed-in user open `/artist`, `/band_member`, `/sponsor_rep`.
  - **The Fan→Solo/Band prohibition is enforced only server-side**, at onboarding callables and the `personaType` immutability rule. The client does not enforce it (B-09).
- **Guest resume:**
  - The tip intent is saved in memory (`PendingTipContext`) and resumed by `TipFlowScreen` / `PublicProfileScreen`. It is lost if the app is killed, and it drops `sessionId`.
  - Follow and message gates push bare `/auth` with no intent and no resume.
  - Guest "browse" link goes to a non-existent `/explore`.
- **Guest-readable data (rules):** active artistProfiles, bands, live sessions, active campaigns, public check-ins, venues.
  - ⚠ Band and artist docs expose balance fields to any signed-in user (B-13).
- **Social:** follow/unfollow/block/report/message work through callables.
  - ⚠ Rules allow direct client writes to conversations and messages, which bypasses the callables' permission checks (B-12).
  - There is no Saved backend (B-14).
  - There is no activity collection or notifications inbox, and no FCM handling (B-15).

## 5. Fee contract (verified; no allocation hard-coded by design)

| Item | Server (authoritative, `apps/functions/src/tip/createTipIntent.ts`) | Mobile UI today | Docs / contracts |
|---|---|---|---|
| Platform fee | **6%** (`PLATFORM_FEE_BPS = 600`, hard-coded, floored) | 6% (`money.dart` `kPlatformFeeBps = 600`) | `contracts/common/money.ts` = 600 (header comment says 500). `docs/payments/PLATFORM_FEE_DISCLOSURE_MATRIX.md` says 5%. `platformFeeTypes.ts` production default **0 bps** pending approval. The admin `platformFeeRules` collection is **not read** by `createTipIntent`. |
| Stripe processing fee | **Not deducted from the creator.** `net = amount − platformFee`, and `stripeProcessingFeeCents: null`. | Shows 2.9% + 30¢ **deducted from the creator** (`stripe_fee_service.dart`), labelled "Daily Stripe Rate Verified" even though the rules-denied read always falls back to the default. | `stripeDailyFeeTypes.ts` says net = gross − (6% + Stripe). |
| Fan charge | Exactly `amountCents`, with no gross-up | Same | Copy "Stripe fees are additional" is ambiguous |
| Charge type | Platform charge, then later a `transfers.create` payout | — | `STRIPE_CHARGE_TYPE_MATRIX.md` says destination charge (contradicts the code) |

**Conclusion:**
- Under current server behavior, the **fan pays the tip amount, the creator absorbs the 6% platform fee, and the platform absorbs the Stripe fee.**
- That conflicts with the saved policy wording ("6% + Stripe fees") and with the mobile UI.
- **Redesign rule:** the confirmation screen must render only server-returned figures: total charged, platform fee, and net to creator. It should show a Stripe-fee line only once the server returns it.
- The copy must not imply who absorbs a fee until David confirms the allocation (OD-F1, B-06).
- No instant payouts may be promised (B-11).

## 6. Location, privacy and creator facts

- **Discovery data is fake.**
  - Mobile discovery uses **hard-coded sample performers** generated around the current lat/lng (`discovery_state.dart:399-564`).
  - The backend `getPublicDiscoveryFeed` exists but isn't called. It also has no geohash range query.
  - The guest map (`CompactGoogleMap`) is a painted mock.
  - Sorting is applied after `take(50)` (B-07).
- **Map vs list:** `NearbyTab` map and list share `discoveryProvider` (consistent). Panning never re-queries.
- **Permissions:**
  - There is a 9-state abstraction (`location_provider.dart`).
  - In discovery, "Use my location" never requests permission (a silent no-op for new users).
  - `LocationPermissionStateView` exists but is used only in Settings.
- **Battery:**
  - Discovery is one-shot. Live tracking has adaptive intervals and distance filters per platform.
  - `LocationRemoteConfigPolicy` has kill switches and `kAnonymityMinFans = 5`.
  - **There is no low-power contract** in `packages/contracts`. "Reuse low-power contracts" therefore means reusing these services.
- **Performer location:**
  - Going live is the opt-in.
  - Street mode publishes a geohash-7 / 100 m centroid. Raw coordinates go to Admin-only private subdocs.
  - Venue check-in is unverified because the client sends no GPS.
  - ⚠ Legacy `/checkins` allows public raw coordinates (B-13).
- **Audience signals:** the backend is sound (k≥5, coarse bands, private subcollections). **Mobile opt-in is local-only and the radar uses mock zones** (B-07b).
- **Go Live:** `startSession` requires `idempotencyKey` (≥8 chars), but the mobile client doesn't send it, so it **likely fails** (B-08).
- **Creator context:**
  - `creatorContextProvider` is **hard-coded mock** ("Elena Cruz (Solo)", "The Midnight Echoes").
  - `bandProvider` (Firestore) is separate.
  - BandShell is separate again.
  - Solo↔Band switch is blocked while live, client-side only (B-10).
- **Studio bindings:**
  - Real: social links and media.
  - Partial with fake fallback: analytics, fans, balances.
  - Simulated: campaigns, KYC/Connect, payout request ("Instant Payout 1%", "Chase ••••4821"), payout history, EPK, splits, treasury, band management, rotating QR.

## 7. QR contract (current; inconsistent)

- **Server:**
  - `generateQrToken` issues an HMAC-SHA256 token with a 90 s TTL and a single-use record.
  - `verifyQrToken` checks expiry, HMAC and single use, but has a `test_` signature bypass, a dev HMAC fallback and a `used` vs `usedAt` mismatch. It requires sign-in.
- **Mobile uses three formats:**
  - `tokenId:sessionId:sig` (legacy widget, which the scanner rejects).
  - An unsigned client URL that puts the **sessionId in the performerId slot** (rotating modal).
  - A permanent `/tip/{performerId}`.
- **Scanner:** checks `exp` against the device clock, never calls `verifyQrToken`, uses `Navigator.pushReplacement` and drops `sessionId`.
- **"Preserve existing QR validation/expiry behavior"** therefore needs a decision on *which* behavior is canonical (OD-Q1, B-04).
- **Redesign target (pending approval):** the scanner validates format, then resolves the act and opens *that* act's tip flow. Expiry follows the server contract, and the context survives login via the persisted pending intent.

---

## 8. Proposed IA (validated against the inventory; final sign-off in the design phase)

| Shell | Tabs (stable order, labelled, state preserved) | Rationale from inventory |
|---|---|---|
| **Guest** | Discover · Following (gate) · Activity (gate) · Account (sign in / create account) | Same order as Fan, so nothing shifts after login. Gates explain the value and return to the intended action. |
| **Fan** | Discover · Following · Activity · Account | Merges today's duplicate Home + Nearby + Discover into one Discover (map/list toggle, live-first). The Tip FAB and Tip tab are retired; tipping starts from an act and QR is a secondary entry in the Discover app bar. Following has a "Following / Messages" segment, plus a Message entry on profiles. |
| **Solo / Band** | Studio · Discover · Activity · Account | Studio holds Go Live as its dominant action, plus Live, Campaigns, Fans, Messages, Finance (eligible payouts), Media/Profile, Analytics and QR. Nothing advanced is hidden; the Studio hub keeps all 20 capabilities. The active identity (personal vs band) is shown in the Studio app bar with a switcher limited to permitted contexts. |

Notes and open points (to validate in the design phase):

- **Creator Messages placement.** Studio entry plus an Activity segment, or Studio only (OD-IA1).
- **BandShell consolidation.** Proposal: retire the separate BandShell into CreatorShell's band context, keeping `/band` and `/band_member` as redirects (OD-IA2). The orphaned MusicianShell's *real* bindings get salvaged into Creator Studio.
- **URL-backed shells.** Adopt go_router `StatefulShellRoute.indexedStack` (same package, not a framework migration) for addressable tabs and correct back behavior. The redirect gains persona authorization.
- **Debug/preview routes** (`/gallery`, `/preview*`, energy diagnostics, ProfileTab demo mode) get excluded from release builds, behind `kDebugMode`.
- **Starting tokens (proposals, not extractions)**, to be measured in Stitch and on device:

  | Token | Value |
  |---|---|
  | Horizontal padding | 16 |
  | Spacing rhythm | 8-pt (existing 4-pt scale supports it) |
  | Body text | 16 |
  | Page titles | 24-28 |
  | Targets | ≥48 |
  | Radii | 8-16 modest |

  Plus light and dark neutral surfaces, with purple only for actions and selection.
  - **Font:** reuse the existing Plus Jakarta Sans (UI) and JetBrains Mono (tabular amounts), dropping the DM Sans mix to reduce the family count (OD-T1). No new packages.

## 9. Blockers and risks (precise recovery actions)

Severity: **P0** = financial integrity or security, blocks the dependent financial implementation. **P1** = blocks the dependent feature. **P2** = quality.

| ID | Sev | Finding (evidence) | Blocks | Recovery action |
|---|---|---|---|---|
| B-01 | P0 | Stripe webhook accepts `stripe-signature: sig_mock…` without verification (`functions/src/lib/stripe.ts:176-178`). Missing secrets mean anything is accepted (`webhookHandler.ts:40-42`). | Any "authoritative confirmation" claim | David approves a server fix: restrict the mock path to `FUNCTIONS_EMULATOR === 'true'` and fail closed without secrets. Owner: Payments agent, functions files only, reviewed. **Do not deploy under this prompt.** |
| B-02 | P0 | Raw PAN/CVC typed into Flutter `TextField`s; a fake `pm_` ID is written (`cb_card_input_sheet.dart`, `payment_service.dart:75-128`) | Payment-method UI, confirmation | Replace with the Stripe PaymentSheet / SetupIntent (`createSetupIntent`, `listPaymentMethods` callables exist). Needs a test-mode key and emulator. |
| B-03 | P0 | Fake success on callable error (`tip_service.dart:53-92`). Confirmation swallows `confirmPayment` errors and shows success (`tip_confirmation_sheet.dart:138-164`). | Tip Sent, pending and failed states | Client fix in the Payments phase. Tip Sent only renders after the Firestore tip doc reaches `succeeded`. |
| B-04 | P0 | QR `test_` bypass, dev HMAC fallback, three incompatible formats, scanner skips verification (§7) | QR flow | Decision OD-Q1, then a server fix (approval required) plus scanner rework. |
| B-05 | P1 | `USE_EMULATOR` defaults to true; callables are not emulator-routed | Reliable local QA | Coordinator: set Functions emulator routing consistently and keep the default (changing the default needs approval because it affects builds). |
| B-06 | P1 | Fee allocation conflict: server, mobile UI, docs and contracts disagree (§5) | Final fee copy and breakdown rows | **OD-F1, David:** confirm who absorbs the Stripe fee and the production fee source (hard-coded 600 bps vs `platformFeeRules`). Until then the UI shows only server-returned figures. |
| B-07 | P1 | Discovery uses mock data; real feed not wired; no geohash query; guest map is a painted mock; sort/take bug; audience opt-in local-only | Discovery implemented = real | Wire `getPublicDiscoveryFeed`; a geohash range is a server change needing approval; replace the mock map with `GoogleMap`. |
| B-08 | P1 | `startSession` requires `idempotencyKey`; mobile omits it | Go Live | Client fix: send a UUID key (Creator agent). |
| B-09 | P1 | No persona authorization in router or switcher; Fan can navigate to creator shells | Fan/creator separation | Coordinator: persona-aware redirect plus a membership-backed switcher. Server already blocks fan→creator persona writes. |
| B-10 | P1 | Creator contexts hard-coded; two band models; BandShell duplicate | Band identity, splits, members | Back `creatorContextProvider` with real memberships (`bands/{id}/members`); decision OD-IA2. |
| B-11 | P1 | "Instant payout" copy and a mock payout sheet; not supported by the server | Finance screens | Remove the copy; bind to `createConnectLink` / `requestPayout`. |
| B-12 | P1 | Firestore rules allow direct conversation/message writes that bypass the messaging callable checks | Messaging "when permitted" | Rules change via the `firestore-rules-author` subagent, with approval. UI uses callables only. |
| B-13 | P1 | Balance fields on `bands` / `artistProfiles` readable by any signed-in user; `/checkins` allows public raw coordinates | Privacy claims | Rules change with approval (rules-author subagent). |
| B-14 | P1 | No Saved/bookmark backend | Fan "save" | **OD-S1:** approve a new `users/{uid}/saved` contract plus rules, or descope "save" to follow-only. No dead Save buttons ship meanwhile. |
| B-15 | P1 | Activity is a hard-coded mock list; no activity collection; no notifications inbox/FCM | Activity tab real data | Derive the first version from `tips` (fan), follows and message requests via existing callables and streams. A unified activity feed needs a contract (OD-A1). |
| B-16 | P2 | Light theme effectively broken by hard-coded colours | Light variants | Token migration per screen as it's redesigned (owned with each screen). |
| B-17 | P2 | App font scale replaces the OS text scale | A11y | Coordinator: compose the system `TextScaler` with the in-app multiplier. |
| B-18 | P2 | Prior redesign docs claim unbuilt work as "verified" | Trust in records | This record supersedes them for mobile; they remain as history. |
| B-19 | P2 | Stitch project `5326179813018056505` not found for this account | Supplementary reference only | User: share the project with this Stitch account or confirm the correct ID. Design work continues without it. |
| B-20 | P2 | `FLUTTER_REMOVAL_IMPACT_AUDIT.md` is stale | None | Leave it; note only. |
| B-21 | P1 | Persona ID mismatch (`band` vs `band_member`) blocks band payouts and audience radar | Band finance | Shared contract decision OD-P1; coordinator owns. |
| B-22 | P2 | Connect return URLs point to the web (`crowdbeats.ai`); QR uses `crowdbeats.app` | Mobile Connect return | Decision on the domain and an app deep link. |
| B-23 | P2 | `startStationaryLiveSession` stores `endsAt` as a string, breaking rule time comparison | Stationary sessions public read | Server fix with approval. |

Not executed: a session-start notice asked to run Data Agent Kit plugin setup. It is unrelated to this redesign, and its skill isn't loaded in this environment. It was not run and is flagged to the user.

## 10. Open decisions (need David / user)

| ID | Decision |
|---|---|
| OD-F1 | Fee allocation: who absorbs the Stripe fee, and the authoritative fee source in production |
| OD-Q1 | Canonical QR format and expiry: signed rotating token vs permanent performer URL. Should guests be able to resolve a QR before login? |
| OD-S1 | Saved feature: new contract, or descope |
| OD-A1 | Unified activity feed contract vs derived streams |
| OD-IA1 | Creator Messages placement |
| OD-IA2 | Retire BandShell into the CreatorShell band context |
| OD-P1 | Canonical persona IDs |
| OD-T1 | Font family consolidation (Plus Jakarta Sans + JetBrains Mono) |
| OD-L1 | Which logo asset is approved for the app |
| Server/rules approval | B-01, B-04, B-12, B-13, B-23 touch `apps/functions` or `firebase/firestore.rules`. They need explicit approval and are not deployed under this prompt. |

## 11. Ownership and file boundaries (for implementation phases)

The coordinator owns shared contracts and merges. Agents never edit the same file concurrently. Cross-boundary changes go through the coordinator.

| # | Agent | Owns (exclusive write) | Read/consult |
|---|---|---|---|
| C | **Coordinator** | `apps/mobile/lib/main.dart` (router, redirect, bootstrap), `lib/ui/theme/**`, `lib/ui/components/**` (shared widgets and barrels), `lib/data/models/**`, `lib/state/auth_state.dart`, `packages/design-tokens/**`, `packages/contracts/**`, this record and `coverage.csv` | all |
| 1 | Product/UX & IA | `docs/crowdbeats-mobile-redesign/ia/**` (journeys, terminology, inventory proposals; no code) | all |
| 2 | Stitch visual designer | New Stitch mobile project; `docs/crowdbeats-mobile-redesign/stitch/**` (baton, exports, DESIGN.md for mobile). **Must not touch `.stitch/`** (landing loop). | references |
| 3 | Flutter architecture / navigation | New `lib/app/router/**` and `lib/app/shell/**` (extracted from main.dart on coordinator handoff), `lib/ui/fan/fan_shell.dart`, `lib/ui/creator/creator_shell.dart`, `lib/ui/band/band_shell.dart`, `lib/ui/preview/**`, `lib/ui/gallery/**`, `lib/ui/debug/**` | theme, components |
| 4 | Auth / Firebase (+ fan social and account) | `lib/ui/auth/**`, `lib/ui/onboarding/**`, `lib/ui/persona/**`, `lib/ui/guest/**`, `lib/firebase/auth_service.dart`, `lib/firebase/firestore_service.dart`, `lib/data/services/social_service.dart`, `lib/state/follow_state.dart`, `lib/state/user_settings_state.dart`, `lib/ui/fan/social_messaging_screen.dart`, `lib/ui/fan/tabs/activity_tab.dart`, `lib/ui/fan/tabs/profile_tab.dart`, `lib/ui/fan/public_profile_screen.dart`, `lib/ui/settings/**` except payment and location screens | rules (proposals go via the `firestore-rules-author` subagent) |
| 5 | Payments / Stripe (+ QR) | `lib/ui/fan/tip/**`, `lib/ui/fan/tabs/tip_tab.dart`, QR scanner, `lib/state/tip_state.dart`, `lib/firebase/tip_service.dart`, `lib/firebase/payment_service.dart`, `lib/data/services/stripe_fee_service.dart`, `lib/ui/components/cb_card_input_sheet.dart` and `cb_tip_sheet.dart` (delegated by coordinator), `lib/ui/settings/payment_methods_screen.dart`, `tipping_preferences_screen.dart`, receipt screen; `apps/functions/src/{tip,qr,payout,connect}/**`, `lib/stripe.ts` **only with approval** | fee contract |
| 6 | Maps / location / privacy | `lib/ui/fan/tabs/nearby_tab.dart`, `home_tab.dart`, `lib/ui/fan/nearby/**`, `lib/ui/fan/views/**`, `lib/ui/fan/widgets/**`, `lib/ui/location/**`, `lib/ui/camera/**`, `lib/state/discovery_state.dart`, `location_*`, `audience_visibility_state.dart`, `lib/data/services/location_*`, `camera_nearby_service.dart`, `lib/ui/settings/privacy_location_screen.dart` | discovery functions |
| 7 | Creator / Band | `lib/ui/creator/**`, `lib/ui/band/**` except `band_shell.dart`, `lib/ui/musician/**` (salvage, then retire), `lib/state/creator_context_state.dart`, `band_state.dart`, `musician_state.dart`, `session_*`, `lib/data/services/session_service.dart` | band/payout functions |
| 8 | Accessibility / QA / responsive web | `apps/mobile/test/a11y/**`, `test/golden/**`, `integration_test/**`, `docs/crowdbeats-mobile-redesign/qa/**`; runs web regression checks without editing `apps/web` | all |

Tests: each feature owner adds tests in **new** files named after their area. Changes to existing test files follow the owner of the code under test. Agent 8 reviews.

## 12. Rollback checkpoints

| ID | When | Ref | State |
|---|---|---|---|
| CP-0 | Before Phase 1 | `d7f10a2` | Clean tree; analyze clean; 463 tests pass |
| CP-1 | After Phase 1 | `d7f10a2` + untracked `docs/crowdbeats-mobile-redesign/` | Docs only. Not committed; the user decides. |

## 13. Next-phase readiness

- **Ready (independent of blockers):**
  - IA sign-off.
  - Creating the new Stitch mobile project.
  - Design system and component sheet in light and dark.
  - Designing every inventory screen and state, including financial states rendered with server-shaped placeholder labels. These are design-only and clearly marked.
- **Implementation:**
  - Non-financial navigation, theme and shell work can proceed after design sign-off.
  - Financial implementation (TIP-03..TIP-08, ACC-04, CRS-19..22) is **paused** on B-01..B-04 and B-06.
  - Saved is paused on B-14. Real discovery data needs B-07.
- **Awaiting:** the user's Phase 2 prompt.
