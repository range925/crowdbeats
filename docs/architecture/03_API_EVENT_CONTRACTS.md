# 03 — API and Event Contracts
**Phase:** 3 — Trust Foundation
**Status:** FINAL

---

## Overview

All Crowdbeats V2 server interactions use a typed contract system:

- **TypeScript source:** `packages/contracts/src/`
- **Dart parity:** `apps/mobile/lib/data/models/`
- **Runtime:** Firebase Callable Functions Gen 2 (all callable endpoints)
- **Envelope:** `ApiResponse<T>` — every callable returns `{ ok: boolean, data?: T, error?: ApiError, correlationId: string }`

---

## Contract File Structure

```
packages/contracts/src/
├── common/
│   ├── money.ts          MoneyAmount, ISO4217CurrencyCode, MemberSplitBps,
│   │                     distributeLargestRemainder, calculateFeeBreakdown
│   ├── envelope.ts       ApiResponse<T>, ApiSuccess, ApiFailure, ErrorCode,
│   │                     apiSuccess, apiFailure, generateCorrelationId
│   ├── pagination.ts     CursorPage<T>, PaginationParams
│   └── timestamp.ts      IsoTimestamp, EpochMs, QR_TOKEN_TTL_SECONDS
├── identity/
│   ├── roles.ts          PlatformRole (16), PersonaType, BandRole, VenueRole, SponsorRole
│   ├── claims.ts         CrowdbeatsClaims, StepUpAction, defaultFanClaims, staffClaims
│   └── user.ts           UserRecord, UserUpdatePayload, ConsentRecord
├── profiles/
│   ├── fan.ts            FanProfile, FanProfileUpdatePayload
│   ├── artist.ts         ArtistProfile, ArtistSocialLinks, MusicGenre, ArtistPublicProjection
│   ├── band.ts           Band, BandMember, BandSplitConfig, SetBandSplitConfigPayload
│   ├── venue.ts          VenueProfile, VenueMember, VenueAddress
│   └── sponsor.ts        SponsorOrg, SponsorMember (OD-08: SPONSOR_ADMIN / SPONSOR_REP)
├── performance/
│   ├── stage.ts          Stage, StageSession, SessionStatus, CreateSessionPayload
│   └── qr.ts             QRToken, QRTokenPayload, VerifyQRTokenRequest, QRCheckInResult
├── financial/
│   ├── tip.ts            TipRecord, TipStatus, SendTipRequest, SendTipResponse,
│   │                     RequestRefundRequest, TipReceipt
│   ├── payment.ts        PaymentTransaction, PaymentLedgerEntry (SERVER_ONLY)
│   ├── payout.ts         PayoutRecord, RequestPayoutRequest
│   └── campaign.ts       Campaign, CampaignReward, CampaignContribution
├── sponsorship/
│   └── sponsorship.ts    Sponsorship, MatchPool
├── audit/
│   └── audit.ts          AuditEvent, AuditAction (exhaustive), IdempotencyRecord
├── moderation/
│   └── report.ts         Report, ModerationAction, FraudSignal
└── index.ts              Re-exports all of the above
```

---

## Typed Response Envelope

```typescript
// Every callable returns:
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

interface ApiSuccess<T> {
  ok: true;
  data: T;
  correlationId: string;    // Always present for log tracing
  nextCursor?: string;      // For paginated list responses
}

interface ApiFailure {
  ok: false;
  error: {
    code: ErrorCode;         // Always a typed enum member
    message: string;         // Human-readable, safe for display
    details?: Record<string, unknown>; // Optional structured error info
  };
  correlationId: string;
}
```

**Client usage pattern:**

```typescript
const response = await sendTip({ recipientId, amountCents, ... });
if (!response.ok) {
  switch (response.error.code) {
    case ErrorCode.PAYMENT_DECLINED: showDeclinedUI(); break;
    case ErrorCode.BELOW_MINIMUM_TIP: showMinimumError(); break;
    default: showGenericError(); break;
  }
  return;
}
// TypeScript narrows to ApiSuccess<SendTipResponse> here
const { clientSecret } = response.data;
```

---

## Key Callable Contracts

### sendTip

```typescript
// Request
interface SendTipRequest {
  recipientId: string;
  recipientType: 'artist' | 'band';
  amountCents: number;       // 100–50000 (cents)
  currency: ISO4217CurrencyCode;
  sessionId?: string;
  message?: string;          // Max 200 chars
  isAnonymous?: boolean;
  idempotencyKey: string;
}

// Response
interface SendTipResponse {
  tipId: string;
  clientSecret: string;       // Stripe PaymentIntent client_secret
  amountCents: number;
  platformFeeCents: number;   // floor(amount * PLATFORM_FEE_BPS / 10000)
  netAmountCents: number;
}
```

### verifyQrToken

```typescript
// Request (from QR code scan)
interface VerifyQRTokenRequest {
  payload: QRTokenPayload;    // Decoded from QR image
  idempotencyKey: string;
}

// Response
interface QRCheckInResult {
  sessionId: string;
  performerName: string;
  venueName: string;
  checkedInAt: IsoTimestamp;
}
```

### setBandSplitConfig (BAND_FOUNDER only)

```typescript
// Request
interface SetBandSplitConfigPayload {
  bandId: string;
  splits: MemberSplitBps[];  // Must total exactly 10000 bps
  idempotencyKey: string;
}
// Response: VoidResponse (ApiResponse<null>)
```

---

## Error Code Taxonomy

The `ErrorCode` const object in `envelope.ts` is the canonical list of all error codes.
No error code may be invented outside this list. Adding new codes requires adding to the
`ErrorCode` object and regenerating Dart parity.

Key codes:
- **Payment:** `PAYMENT_DECLINED`, `PAYMENT_REQUIRES_ACTION`, `REFUND_WINDOW_EXPIRED`, `PAYOUT_BELOW_MINIMUM`
- **QR:** `QR_TOKEN_EXPIRED`, `QR_TOKEN_INVALID`, `QR_TOKEN_ALREADY_USED`
- **Auth:** `UNAUTHENTICATED`, `FORBIDDEN`, `INSUFFICIENT_ROLE`
- **Idempotency:** `DUPLICATE_REQUEST`
- **Session:** `SESSION_NOT_ACTIVE`, `SESSION_ALREADY_ENDED`

---

## Idempotency Pattern

All state-mutating callables accept `idempotencyKey: string` in the request.

Server behavior:
1. Hash key: `${uid}:${operation}:${clientKey}` → look up `/idempotencyKeys/{hash}`
2. If `status == 'processing'` → return `DUPLICATE_REQUEST`
3. If `status == 'succeeded'` → return cached `responseSnapshot`
4. If absent → create with `status: 'processing'`, execute operation
5. On success → update to `status: 'succeeded'`, set `responseSnapshot`, set `expiresAt = +24h`
6. On failure → update to `status: 'failed'`

Client generates key: `crypto.randomUUID()` or `uuid_v4()` per request. Same key can be retried up to 24h to get same result.

---

## Audit Event Contract

Audit events are SERVER-AUTHORED ONLY, IMMUTABLE, and APPEND-ONLY.

```typescript
interface AuditEvent {
  eventId: string;
  action: AuditAction;           // Exhaustive enum — 60+ actions
  actorUid: string;              // Who did it (uid or 'system')
  actorType: 'user' | 'staff' | 'system' | 'stripe_webhook';
  targetId?: string;             // What was acted upon
  targetType?: string;
  metadata: Record<string, unknown>;  // Non-sensitive context
  correlationId: string;         // Matches the request correlationId
  createdAt: IsoTimestamp;
  // NO updatedAt — immutable
}
```

---

## Money and Split Invariants

```typescript
// Fee calculation (OD-10: PLATFORM_FEE_BPS = 500 = 5.00%)
platformFeeCents = Math.floor(grossAmountCents * PLATFORM_FEE_BPS / 10000)
// → always floors (creator-favorable)

// Band split distribution (OD-09: Largest Remainder Method)
distributeLargestRemainder(totalNetCents, splits)
// → all cents distributed, no rounding loss, results sum to totalNetCents

// Split validation
splits.reduce((sum, m) => sum + m.splitBps, 0) === 10000 // Always enforced
```

---

## Dart Parity Models

| TypeScript Contract | Dart Model | Location |
|---|---|---|
| `money.ts` | `money.dart` | `apps/mobile/lib/data/models/` |
| `envelope.ts` | `envelope.dart` | `apps/mobile/lib/data/models/` |
| `identity/roles.ts` | `roles.dart` | `apps/mobile/lib/data/models/` |
| `identity/user.ts` | `user.dart` | `apps/mobile/lib/data/models/` |
| `profiles/artist.ts` | `artist_profile.dart` | `apps/mobile/lib/data/models/` |
| `financial/tip.ts` | `tip.dart` | `apps/mobile/lib/data/models/` |
| `audit/audit.ts` | `audit_event.dart` | `apps/mobile/lib/data/models/` |

All Dart models implement `fromJson(Map<String, dynamic>)` and `toJson()`.
Field names match TypeScript exactly for JSON interoperability.
Dart sealed classes used for `ApiResponse<T>` (Dart 3.x pattern matching).
