# Phase 5 — Authentication, Onboarding & Persona Switching (COMPLETE)

**Commits:** `d204c95` (Phase 5 initial) → `31c9daf` (docs) → `<latest>` (completion)  
**Dev server:** http://localhost:3000 ✅  
**OD-09 locked:** Largest Remainder Method (tip split)  
**OD-10 locked:** PLATFORM_FEE_BPS=500 (5%), 24h refund window, \$10 minimum payout

---

## Verification Results

| Check | Result |
|---|---|
| `next build` | ✅ PASSED — all routes, TypeScript clean |
| `tsc --noEmit` | ✅ PASSED |
| `flutter analyze` | ✅ No issues found |
| Route guard tests | ✅ **59 / 59 PASS** |
| Cloud Function tests | ✅ **25 / 25 PASS** |
| Contamination check | ✅ crowdbeats-01 untouched |

---

## Route Coverage

### Web (Next.js)

| Route | Guard | Notes |
|---|---|---|
| `/` | Public | Landing page — hero, persona chips, CTAs |
| `/auth` | Public (redirects if authed) | Login + Register tabs; redirects authed users |
| `/auth/verify-email` | Unverified only | 3s polling, 60s resend cooldown; exempt from general /auth/* redirect |
| `/auth/forgot-password` | Public | Enumeration-resistant success message |
| `/onboarding` | Verified + unonboarded | Consent — ToS + Privacy Policy checkboxes |
| `/onboarding/persona` | Verified + unonboarded | Card selector, no STAFF option |
| `/onboarding/fan` *(+ artist/band/venue/sponsor)* | Verified + unonboarded | Per-persona profile forms |
| `/fan` | `personaType=fan` | Dashboard stub |
| `/artist` | `personaType=artist OR band_member` | Dashboard stub (band shares) |
| `/venue` | `personaType=venue_manager` | Dashboard stub |
| `/sponsor` | `personaType=sponsor_rep` | Dashboard stub |
| `/account` | Authenticated + onboarded | Account settings + secure deletion entry point |

### Auth State Machine (both platforms)

```
loading → unauthenticated
        → unverified → unonboarded → authenticated
                                   ↘ suspended
                                   ↘ deleted
        → expired    (token refresh failed — signs out)
        → revoked    (admin revoked token — signs out)
```

### Flutter Screens

| Screen | Route | Notes |
|---|---|---|
| SplashScreen | `/splash` | Auth state resolution |
| AuthScreen | `/auth` | Email/password + OAuth (disabled w/ tooltip) |
| VerifyEmailScreen | `/auth/verify-email` | 3s poll, 60s cooldown |
| ForgotPasswordScreen | `/auth/forgot-password` | Enumeration-resistant |
| ConsentScreen | `/onboarding` | ToS + Privacy dual checkboxes |
| PersonaPickerScreen | `/onboarding/persona` | No STAFF option |
| 5× Onboarding screens | `/onboarding/{persona}` | Fan/Artist/Band/Venue/Sponsor |
| 5× Persona dashboards | `/{personaType}` | Phase 5 stubs |
| _SuspendedScreen | `/suspended` | Admin suspension message |
| _DeletedScreen | `/deleted` | Account removed message |
| _SessionRevokedScreen | `/session-revoked` | Admin-revoked session |
| _SessionExpiredScreen | `/session-expired` | Token expiry message |
| _AccountSettingsScreen | `/account` | Session info + danger zone deletion |
| PersonaSwitcherSheet | Modal | Persona badge + sign-out |

---

## Test Coverage

### Route Guard (59 tests) — `apps/web/__tests__/unit/routeGuard.test.ts`

- Public routes: 12 tests (pass regardless of session)
- `/auth/*` redirect matrix: 7 tests
- `/auth/verify-email` exemption: 2 tests
- `/onboarding/*` guard: 6 tests
- `/fan/*` guard: 7 tests (persona mismatch redirects)
- `/artist/*` (+ band_member): 4 tests
- `/venue/*`: 3 tests
- `/sponsor/*`: 2 tests
- `/account/*`: 5 tests
- Direct URL attack (10 protected paths, no session): 10 tests
- Null session: 1 test

### Cloud Function (25 tests) — `apps/functions/src/auth/__tests__/onCompleteOnboarding.test.ts`

- Auth guard: 1 test
- Persona validation: 11 tests (5 allowed + 6 blocked including STAFF injection)
- displayName boundary + HTML injection: 6 tests
- consentVersion format: 3 tests
- Side effects (Firestore + custom claims): 3 tests
- Idempotency: 1 test
- UID isolation: 1 test

---

## Security Properties

| Property | Status |
|---|---|
| Enumeration-resistant auth errors | ✅ |
| No STAFF persona via public path | ✅ (validated server + client) |
| Route guards on UI hide | ✅ (59 tests) |
| Route guards on direct URL | ✅ (10 direct-URL attack tests) |
| Token revocation detection | ✅ (10min probe, both platforms) |
| Account deletion — typed confirm | ✅ ('delete my account' phrase) |
| Consent version stored per-UID | ✅ (consent collection) |
| Session cookie — client-only Phase 5 | ⚠️ Server verification in Phase 6 |
| Permission education before OS prompts | ✅ (Flutter — camera/location/notifications) |
| OAuth collision recovery | ✅ (Web — linkWithCredential) |
| OAuth cancellation/retry | ✅ (error mapped to CANCELLED, retry button shown) |

---

## Provider Configuration Blockers

| Provider | Status | Action needed |
|---|---|---|
| Email/Password | ✅ Working (emulator) | — |
| Google Sign-In | ⚠️ Wired, disabled on emulator | SHA-1 fingerprint (Android), OAuth client ID setup |
| Sign in with Apple | ⚠️ Wired, disabled | Apple Developer enrollment ($99/yr) |

---

## Contamination Status

- ✅ `crowdbeats-01` (V1) — zero interactions
- ✅ All emulator connections idempotent (guarded against double-connect)
- ✅ No production cloud resources modified
- ✅ Blaze billing not enabled (not touched)

---

## Open Decisions (Phase 6 only)

- **OD-06** — Public web/app domains (still open — needed for OAuth redirect URIs)
