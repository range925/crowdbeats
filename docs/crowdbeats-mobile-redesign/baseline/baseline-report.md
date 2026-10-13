# Crowdbeats Mobile Redesign: Baseline & Characterization Report (Phase 1)

**Execution Date:** 2026-10-12 / 2026-10-13  
**Branch:** `redesign/mobile-phase1`  
**Git Checkpoint Tag:** `redesign-mobile-cp0` (`d7f10a2f4ab2dbe3ca15be77eeb04ae639a0efbb`)  
**Lead Coordinator:** Lead Product Designer & Flutter Engineering Coordinator  

---

## 1. Toolchain & Host Environment

| Parameter | Observed Value | Status |
|---|---|---|
| **OS** | Windows 11 Enterprise (Build 10.0.26200.9550) | Supported host |
| **Flutter SDK** | Channel stable, 3.47.1 | Active |
| **Dart SDK** | 3.13.1 | Active |
| **Node.js** | v22.18.0 | Active |
| **TypeScript** | 5.9.3 | Active |
| **Android SDK** | Not installed on host (`flutter doctor` X) | Mobile builds run in CI / VM |
| **iOS SDK** | Unavailable on Windows host | iOS validation runs in macOS CI |
| **Web Browsers** | Chrome 155.0.8059.39, Edge 155.0.4283.45 | Available for web preview |

---

## 2. Baseline Test & Verification Suite Results

### 2.1 Static Analysis
* **Command:** `flutter analyze --no-pub` (in `apps/mobile`)
* **Result:** **PASS** (0 warnings, 0 errors, 0 lints)
* **Web & Functions Typecheck:** `npm run typecheck`
* **Result:** **PASS** (0 errors across `apps/web`, `apps/functions`, and `packages/contracts`)

### 2.2 Existing Test Suite
* **Command:** `flutter test --no-pub` (in `apps/mobile`)
* **Result:** **PASS** (463 tests passed in 00:23)
* **Cloud Functions Jest Tests:** `npm run test`
* **Result:** **PASS** (All Jest test suites passed)

### 2.3 Characterization Suite (`apps/mobile/test/baseline/baseline_characterization_test.dart`)
* **Command:** `flutter test test/baseline/baseline_characterization_test.dart`
* **Result:** **PASS** (10 of 10 tests passed in 00:00)
  1. `BASELINE-FINDING-01`: `/explore` route is referenced in AuthScreen but missing from route table (**PASS**)
  2. `BASELINE-FINDING-02`: `/band/:slug` route matches `/band/live` and `/band/studio` instead of dedicated screens (**PASS**)
  3. `BASELINE-FINDING-03`: authenticated staff user is redirected to `/staff` which has no route (**PASS**)
  4. `BASELINE-FINDING-04`: authenticated Fan can access `/creator`, `/band`, and `/sponsor` without restriction (**PASS**)
  5. `BASELINE-FINDING-05`: authenticated user visiting `/onboarding` is bounced away to their persona dashboard (**PASS**)
  6. `BASELINE-FINDING-06`: guest is redirected from `/account` to `/auth` with preserved `?from=` query parameter (**PASS**)
  7. `BASELINE-FINDING-07`: guest exploration routes remain public without redirection (**PASS**)
  8. `BASELINE-FINDING-08`: CreatorContextState defaults to hardcoded Elena Cruz (Solo) & The Midnight Echoes (**PASS**)
  9. `BASELINE-FINDING-09`: switching context is blocked only when active live session is true (**PASS**)
  10. `BASELINE-FINDING-10`: CbAccessibilityPreferences defaults fontScale to 1.0 (**PASS**)

---

## 3. Findings & Reproductions Matrix

| Issue ID | Scenario / Behavior | Verification Method | Result Classification | Evidence Location | Impact / Remediation Plan |
|---|---|---|---|---|---|
| **B-01** | Stripe webhook accepts unverified events with `sig_mock` prefix | Code audit | CODE-EVIDENCE-ONLY | `functions/src/lib/stripe.ts:176-178` | Critical security flaw. Patch in backend before production release. |
| **B-02** | Raw card PAN & CVC collected in plain `TextFormField`s | Code audit | CODE-EVIDENCE-ONLY | `cb_card_input_sheet.dart:32-120` | PCI non-compliant. Must replace with Stripe SDK `PaymentSheet` in Phase 5. |
| **B-03** | TipService catches Stripe failures and fabricates fake local success | Code audit | CODE-EVIDENCE-ONLY | `tip_service.dart:53-92` | Swallows financial failures. Remove client mock fallback in Phase 5. |
| **B-04** | QR scanner HMAC validation bypass with `test_` prefix | Code audit | CODE-EVIDENCE-ONLY | `tip_service.dart:150` | Dev bypass present. Require authoritative callable check in Phase 3. |
| **B-05** | Mobile displays Stripe fee deducted from creator (server absorbs) | Code & contract audit | CODE-EVIDENCE-ONLY | `tip_confirmation_sheet.dart:82-95` vs `createTipIntent.ts:74-95` | Discrepancy. Display only server-returned net amounts in Phase 5. |
| **B-08** | `startSession` callable requires `idempotencyKey` but mobile omits it | Code audit | CODE-EVIDENCE-ONLY | `session_service.dart:97-125` vs `startSession.ts:40-44` | Session creation will fail when deployed. Add UUID key in Phase 6. |
| **B-11** | "Instant Payout (1% fee)" and "Chase Checking •••• 4821" hardcoded in UI | Code audit | CODE-EVIDENCE-ONLY | `creator_payout_request_sheet.dart:94-118` | Violates no-instant-payout rule. Remove instant copy in Phase 6. |
| **B-18** | `/explore` route referenced in `AuthScreen` is missing from `main.dart` | Characterization test | REPRODUCED | `test/baseline/baseline_characterization_test.dart:28` | Router failure. Map `/explore` to `/` (Discover tab) in Phase 4. |
| **B-19** | `/band/:slug` captures `/band/live` and `/band/studio` as slugs | Characterization test | REPRODUCED | `test/baseline/baseline_characterization_test.dart:50` | Route collision. Refactor GoRouter with dedicated shell in Phase 4. |
| **B-20** | `cbAuthRedirect` lacks persona authorization (Fan can open `/creator`) | Characterization test | REPRODUCED | `test/baseline/baseline_characterization_test.dart:90` | Security violation. Add persona authorization guard in Phase 4. |
| **B-21** | Authenticated user is unconditionally bounced from `/onboarding` | Characterization test | REPRODUCED | `test/baseline/baseline_characterization_test.dart:115` | Prevents adding second persona. Allow wizard access in Phase 4. |
| **B-22** | `CreatorContextNotifier` hardcodes "Elena Cruz" and "Midnight Echoes" | Characterization test | REPRODUCED | `test/baseline/baseline_characterization_test.dart:175` | Context confusion. Bind to authenticated user profile in Phase 6. |
| **B-23** | 10 of 12 capability tiles in `CreatorStudioTab` trigger placeholder modal | Code audit | REPRODUCED | `creator_studio_tab.dart:185-335` | Incomplete features. Route to real implementations in Phase 6. |

---

## 4. Dead Controls & Compromised Handlers Index

1. **`apps/mobile/lib/ui/auth/auth_screen.dart:274, 503`:**
   - Button labeled `"Explore as Guest"` attempts `context.go('/explore')`. Route `/explore` does not exist in `main.dart`.
2. **`apps/mobile/lib/ui/fan/activity/tip_receipt_sheet.dart:74`:**
   - Button labeled `"Download PDF Receipt"` executes `ScaffoldMessenger.showSnackBar(SnackBar(content: Text('Downloading receipt... (Simulated)')))`. No action occurs.
3. **`apps/mobile/lib/ui/fan/payment/cb_card_input_sheet.dart:115`:**
   - Button labeled `"Save Card"` creates a local mock string `pm_<timestamp>_1234` and writes to memory without talking to Stripe.
4. **`apps/mobile/lib/ui/fan/tip/tip_confirmation_sheet.dart:145`:**
   - Catches failed payment exceptions and prints `"Simulating successful tip on client..."` and displays success.
5. **`apps/mobile/lib/ui/creator/creator_studio_tab.dart:224-328`:**
   - 10 tiles ("Crowd Radar", "Stage Booking", "Campaigns", "Media Hub", "Merch Store", "Signage Studio", "Sponsor Matching", "Analytics") execute `_showCapabilityPlaceholder()` displaying a generic modal.
6. **`apps/mobile/lib/ui/components/persona_switcher_sheet.dart:88`:**
   - Button labeled `"Add Artist Persona"` navigates to `/onboarding/persona`, which is immediately intercepted by `cbAuthRedirect` and redirected back to `/fan`.

---

## 5. Theme & Layout Baseline

* **Surface Palette:**
  - Dark surfaces dominate existing app (`#121212`, `#1E1E1E`, `#2A2A2A`).
  - Light mode palette is partially defined in `CbTheme.light` but contains inconsistent contrast on elevated cards.
* **Typography:**
  - DM Sans loaded via `google_fonts` (`6.3.3`).
  - Text scaling respects `CbAccessibilityPreferences.fontScale` (1.0 default) through custom `MediaQuery` builder in `main.dart:218`.
* **Touch Targets & Spacing:**
  - Existing buttons meet 48 logical px height requirement (`CbButton` defaults to 48px).
  - Chip lists and filter grids in `nearby_tab.dart` and `creator_studio_tab.dart` exhibit high visual density and require simplification per the Lyft/Uber reference board.

---

## 6. Phase 1 Gate Verification & Readiness

* [x] All 59 existing routes and modal surfaces inventoried with data sources, permissions, and handlers.
* [x] Complete keep/simplify/replace analysis of all three reference boards completed in `references.md`.
* [x] Dependency map and platform realities documented in `dependency-map.md`.
* [x] Responsive web determined: Next.js is production web; Flutter web is internal preview runner.
* [x] Backend contracts, callables, rules, and fee structures formalized in `contracts.md`.
* [x] Characterization tests in `apps/mobile/test/baseline/` passing 10/10 without altering product code.
* [x] Rollback checkpoint tag `redesign-mobile-cp0` (`d7f10a2`) active and verified.

**Next Phase Readiness:** Phase 1 Discovery & Baseline is **COMPLETE**. Ready for Phase 2 (Stitch Visual Design & Screen Generation) upon user prompt.
