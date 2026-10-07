# Crowdbeats V2 — Phase 6: Fan Vertical Slice

**Commit:** `343dad3`  
**Status:** ✅ Complete  
**Tests:** 54/54 passing (Cloud Functions) | flutter analyze: 0 errors | next build: ✅

---

## Overview

Phase 6 delivers the complete Fan native mobile experience plus a limited responsive Fan web account area. This is the first end-to-end vertical slice demonstrating the full payment flow from QR scan to verified receipt with balanced ledger entries.

---

## Architecture Decisions

### Financial Invariants (OD-09, OD-10)
- Money represented as **integer minor units** (`amountCents`) + ISO 4217 currency code everywhere — no floats
- **Platform fee: 5% (PLATFORM_FEE_BPS = 500)** — `Math.floor(amountCents * 500 / 10_000)`
- **24-hour refund window** enforced server-side (OD-10)
- **$10 minimum payout** enforced server-side (OD-10)
- All ledger entries are server-only — no client write path

### Server Authority
- All financial fields written by Cloud Functions only: `status`, `platformFeeCents`, `netAmountCents`, `processedAt`, `refundedAt`
- Double-entry ledger: every payment creates DEBIT + CREDIT entries; every refund creates REVERSAL_DEBIT + REVERSAL_CREDIT (originals preserved)
- No `isAdmin: boolean` anywhere

### Idempotency
- Every destructive callable requires `idempotencyKey` (client-generated UUID)
- `idempotencyKeys/{key}` documents are written atomically with the tip/refund
- Duplicate calls within 24h return cached response without re-charging

### Stripe Integration
- **Mock adapter pattern**: `StripeAdapter` uses real SDK when `STRIPE_SECRET_KEY` is set, deterministic mock otherwise
- No raw card data ever touches Firestore or logs
- PaymentSheet handles all card UI via `flutter_stripe`
- Webhook signature verified via `stripe.webhooks.constructEvent()`

### QR / Proximity
- HMAC-SHA256 signed QR tokens with expiry + single-use enforcement
- `qrTokens/{tokenId}.usedAt` set atomically on first scan
- Emulator mode: `test_` prefix bypass for QR sigs

---

## Files Created / Modified

### Cloud Functions (`apps/functions/src/`)

| File | Purpose |
|---|---|
| `lib/stripe.ts` | Mock-ready Stripe adapter |
| `tip/createTipIntent.ts` | Callable: validate → idempotency → Stripe PI → Firestore tip |
| `tip/webhookHandler.ts` | HTTP: sig verify → succeeded/failed/dispute → ledger |
| `tip/requestRefund.ts` | Callable: 24h window → Stripe refund → REVERSAL entries |
| `tip/verifyQrToken.ts` | Callable: HMAC + expiry + single-use |
| `payment/setupPaymentMethod.ts` | Callable: create SetupIntent |
| `payment/listPaymentMethods.ts` | Callable: safe PM metadata only |
| `payment/setDefaultPaymentMethod.ts` | Callable: update Stripe + Firestore |
| `follow/followArtist.ts` | Callable: create follow + increment count |
| `follow/unfollowArtist.ts` | Callable: delete follow + decrement count |
| `privacy/requestDataExport.ts` | Callable: GDPR queued export |
| `tip/__tests__/createTipIntent.test.ts` | 12 tests: validation, fees, idempotency |
| `tip/__tests__/requestRefund.test.ts` | 9 tests: window, ownership, ledger |
| `tip/__tests__/webhookHandler.test.ts` | 6 tests: sig verification, idempotency |

**Test results:** 54 passed, 0 failed, 0 skipped

### Flutter (`apps/mobile/lib/`)

| File | Purpose |
|---|---|
| `firebase/tip_service.dart` | createTipIntent, requestRefund, verifyQrToken callables |
| `firebase/follow_service.dart` | followArtist, unfollowArtist callables + Firestore streams |
| `firebase/payment_service.dart` | createSetupIntent, listPaymentMethods, savedMethodsStream |
| `state/tip_state.dart` | TipFlowNotifier state machine + StreamProviders |
| `state/follow_state.dart` | FollowNotifier with optimistic follow + rollback |
| `ui/fan/fan_shell.dart` | 5-tab NavigationBar with IndexedStack |
| `ui/fan/tip/tip_flow_screen.dart` | Amount selection, ≤3-tap fast path |
| `ui/fan/tip/tip_confirmation_sheet.dart` | Stripe PaymentSheet + duplicate-tap guard |
| `ui/fan/tip/tip_result_screen.dart` | Firestore polling, offline banner, share |
| `ui/fan/tip/qr_scanner_screen.dart` | ML Kit QR + permission education |
| `ui/fan/tabs/{home,nearby,tip,activity,profile}_tab.dart` | 5 fan tabs |
| `ui/fan/activity/receipt_screen.dart` | Full receipt + 24h refund button |

**flutter analyze:** 0 errors, 49 info/warnings (prefer_const, avoid_dynamic_calls, unnecessary_underscores — non-blocking)

### Web (`apps/web/`)

| File | Purpose |
|---|---|
| `app/(fan)/layout.tsx` | Sidebar nav + cookie-auth guard |
| `app/(fan)/fan/receipts/page.tsx` | Server Component: tip history list |
| `app/(fan)/fan/following/page.tsx` | Server Component: followed artists |
| `app/(fan)/fan/payment-methods/page.tsx` | Mobile app deep link (card mgmt) |
| `app/(fan)/fan/privacy/page.tsx` | Client Component: GDPR export request |
| `app/(fan)/fan/security/page.tsx` | Password reset + danger zone |
| `app/api/fan/request-privacy-export/route.ts` | API: queue privacy export |
| `lib/firebase-admin.ts` | Idempotent Admin SDK init |

**next build:** ✅ All routes static/dynamic render correctly

### Contracts & Firebase

| File | Change |
|---|---|
| `packages/contracts/src/payment/paymentMethod.ts` | SavedPaymentMethod, CreateSetupIntentResponse |
| `packages/contracts/src/social/follow.ts` | Follow, FollowArtistRequest/Response |
| `packages/contracts/src/index.ts` | v0.4.0-phase6 exports |
| `firebase/firestore.rules` | follows, paymentMethods, privacyExports rules |
| `firebase/firestore.indexes.json` | 7 composite indexes |

---

## Payment Flow (Primary Path)

```
Fan taps QR scan
  → verifyQrToken callable (HMAC + single-use)
  → TipFlowScreen: amount chips (1,2,5,10,20,custom)
  → TipConfirmationSheet: fee breakdown shown
  → createTipIntent callable → pi.client_secret
  → Stripe.initPaymentSheet + presentPaymentSheet
  → Firestore polling: tips/{tipId}.status
  → status == 'succeeded' (from webhook) → TipResultScreen
  → Share receipt option
```

**3-tap fast path** (saved PM + known performer): Tip Tab → Amount → Confirm (1 tap)

---

## Not Implemented (Deferred)

- **Staff onboarding** — server admin only (Phase 7)
- **Google Maps** — list-only Nearby (no map tile, Phase 7)
- **Real Stripe keys** — mock adapter active; swap in `STRIPE_SECRET_KEY` env var
- **Web tip flow** — mobile-only per architecture invariant
- **Payout flow** — Phase 7 (creator dashboard)
- **Flutter widget tests** — Phase 7 sprint
- **Campaign contribution** — Phase 7

---

## Running Locally

```bash
# Cloud Functions (emulator)
cd apps/functions && npm test          # 54 unit tests
firebase emulators:start --only functions,firestore --project crowdbeats-v2-dev

# Flutter (iOS/Android only — never Flutter web)
cd apps/mobile
flutter run --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_... 

# Web
cd apps/web && npx next dev
# Fan area at http://localhost:3000/fan/receipts (requires __cb_session cookie)
```
