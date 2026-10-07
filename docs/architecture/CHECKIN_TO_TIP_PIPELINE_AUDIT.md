# Crowdbeats V2 — Check-In to Tipping Pipeline Audit
## End-to-End Lifecycle Analysis: From Musician Check-In to Ledger Settlement

**Status:** Audited  
**Date:** 2026-08-30  

---

## 1. Complete Pipeline Stage Tracing

```mermaid
sequenceDiagram
    autonumber
    actor Musician as Creator / Band
    participant Mobile as Mobile App (Flutter)
    participant Functions as Cloud Functions
    participant Firestore as Cloud Firestore
    actor Fan as Fan / Guest
    participant Stripe as Stripe API / Webhooks
    participant Ledger as Subledger Engine

    Musician->>Mobile: Selects Context (Solo / Band) & Venue
    Mobile->>Functions: startSession(venueId, coords, appCheckToken)
    Functions->>Functions: Verify server geofence & no conflicting live session
    Functions->>Firestore: Create stageSessions/{id}, set isLive: true
    Functions-->>Mobile: Return sessionId & signed QR token
    
    Fan->>Mobile: Discovers live creator on Nearby Map / List
    Fan->>Mobile: Taps "Tip" ($5.00, $20.00, custom)
    alt Fan is Guest
        Mobile->>Mobile: Present TipAuthGateModal (preserves context)
        Fan->>Mobile: Authenticates (OAuth / Email)
    end
    Mobile->>Functions: createTipIntent(recipientId, amountCents, idempotencyKey)
    Functions->>Stripe: createPaymentIntent(customer, amount, fee)
    Functions->>Firestore: Create tips/{tipId} (status: pending)
    Functions-->>Mobile: Return clientSecret
    Mobile->>Stripe: Confirm payment via PaymentSheet
    Stripe->>Functions: Webhook: payment_intent.succeeded
    Functions->>Firestore: Update tips/{tipId} status: succeeded
    Functions->>Ledger: Write double-entry debit & credit rows
    Functions->>Firestore: Increment creator available balance
    Musician->>Mobile: Sees live earnings update & tip notification
```

---

## 2. Pipeline Hop Security & Completeness Assessment

### Hop 1: Location Verification & Check-In
- **Current State:** Mobile reads device GPS coordinates. `startSession` callable accepts coordinates.
- **Risk / Gap:** Client coordinates must be validated against server venue boundary geofences to prevent GPS spoofing.
- **Remediation Plan (Phase 4):** Enforce server-side distance calculation ($< 500\text{m}$) and Firebase App Check validation on `startSession`.

### Hop 2: Public Live Projection & Map Synchronization
- **Current State:** `NearbyTab` queries active performers and places markers on Google Maps with synchronized List and Venues views.
- **Risk / Gap:** High read volume if every map pan issues unfiltered queries.
- **Remediation Plan (Phase 4):** Geohash bounding box query with caching and TTL cleanup.

### Hop 3: Tip Initiation & Guest Auth Gate
- **Current State:** `TipSheet` opens with preset amounts ($5, $10, $20, $50, Custom). If unauthenticated, `TipAuthGateModal` preserves recipient context without creating orphan Stripe intents.
- **Risk / Gap:** None. Pipeline stage is robust and verified.

### Hop 4: Payment Processing & Double-Entry Ledger
- **Current State:** Integer cents minor units (`amountCents`), 0.00% dev fee / 5.00% prod platform fee, Stripe SetupIntents for saved payment methods.
- **Risk / Gap:** None. Subledger satisfies $\sum \text{Debits} = \sum \text{Credits}$ at all times.

### Hop 5: Stripe Connect Payout Withdrawal
- **Current State:** Minimum $10.00 withdrawal threshold, 7 canonical KYC states, balance deductions performed in server transactions.
- **Risk / Gap:** Band payout multi-signature approvals needed for band split distributions.
- **Remediation Plan (Phase 8 & 10):** Implement Band representative approval queue for payout changes.
