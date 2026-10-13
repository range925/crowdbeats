# Crowdbeats Mobile Redesign: Core Journey & Flow Specifications (Phase 2)

**Document Status:** Complete & Approved Specification  
**Owners:** UX Coordinator, Payments Lead, Creator/Band Lead  
**Scope:** Tipping Journeys, Creator Lifecycle, Band Governance, and Error Recovery Protocols  

---

## 1. Tipping Journeys

### 1.1 Flow A: Guest Discovery to Tip Sent (With Intent Resumption)

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest User
    participant App as Mobile App (FanShell)
    participant Auth as Auth / Firebase
    participant Server as Cloud Functions (createTipIntent)
    participant Stripe as Stripe PaymentSheet

    Guest->>App: 1. Launch app -> Opens DiscoverTab (/)
    Guest->>App: 2. Browse nearby map/list -> Tap Performer Card
    App->>Guest: Render Performer Profile (/artist/:id)
    Guest->>App: 3. Tap "Send Tip"
    App->>Guest: Render Tip Amount Selection (/tip/:id)
    Guest->>App: 4. Select preset ($10) & tap "Continue to Payment"
    Note over App: Guest detected (unauthenticated)
    App->>App: Store PendingTipContext (performerId, amount: 1000, sessionId, returnRoute)
    App->>Guest: Present Auth Modal / Redirect to /auth?from=/tip/:id/confirm
    Guest->>Auth: 5. Authenticate via Google / Apple / Email
    Auth-->>App: Return user session & custom claims
    Note over App: Resume intended action from PendingTipContext
    App->>Server: 6. Invoke createTipIntent(performerId, amountCents: 1000, idempotencyKey)
    Server-->>App: Return { clientSecret, grossCents: 1000, feeCents: 60, netCents: 940 }
    App->>Guest: 7. Render Dedicated Payment Confirmation (/tip/confirm)
    Guest->>App: 8. Review server fee breakdown & tap "Confirm & Pay"
    App->>Stripe: Present Stripe PaymentSheet / Confirm Payment
    Stripe-->>App: Payment succeeded
    App->>Guest: 9. Render Authoritative Tip Sent Screen (/tip/sent)
    Guest->>App: Tap "Done" -> Return to Performer Profile with updated badges
```

#### Detailed Step Specification (Guest)
1. **Entry:** Guest opens the app without credentials. Discover tab loads active nearby sessions using low-power coarse geolocation.
2. **Act Selection:** Guest taps on a live performer card (e.g. "Elena Cruz @ Saxon Pub"). Public profile loads with bio, setlist, and live badge.
3. **Amount Selection:** Guest taps primary CTA "Send Tip". Screen `/tip/:id` displays preset chips (`$2`, `$5`, `$10`, `$20`), custom numeric keypad, and optional cheer message.
4. **Auth Trigger:** Tapping "Continue to Payment" detects `currentUser == null`. The app serializes state into `PendingTipContext` and opens the authentication sheet.
5. **Auth Cancellation Recovery:** If the user dismisses the auth sheet, they are returned directly to the amount selection screen with their selected amount and message intact.
6. **Intent Resumption:** Upon sign-in or account creation, GoRouter intercepts the auth state change, detects the pending tip, and proceeds directly to `/tip/confirm`.
7. **Server Calculation:** Client invokes `createTipIntent` callable. Displays the authoritative numbers: Gross Tip: `$10.00`, Crowdbeats 6% Platform Fee: `$0.60`, Net to Artist: `$9.40`. No client-side fee formula is calculated.
8. **Authoritative Confirmation:** Payment confirmed via Stripe SDK. Webhook listener confirms document creation in `paymentTransactions`.
9. **Exit:** `TipSentScreen` displays animated confirmation, receipt reference ID, and social action buttons ("Follow Elena Cruz", "Share Tip"). Tapping "Done" returns to the performer profile.

---

### 1.2 Flow B: Returning Fan Quick-Tipping (3-Action Streamlined Flow)

For an authenticated, returning Fan with a saved payment method (e.g., Apple Pay, Google Pay, or saved card on file):

```mermaid
graph LR
    classDef step fill:#1E1B4B,stroke:#8B5CF6,stroke-width:2px,color:#fff;
    classDef success fill:#064E3B,stroke:#10B981,stroke-width:2px,color:#fff;

    A["<b>Action 1: Initiation</b><br/>Tap 'Send Tip' on Profile<br/>OR Scan Performer QR"]:::step
    --> B["<b>Action 2: Amount</b><br/>Select Preset ($5, $10, $20)<br/>& Tap 'Continue'"]:::step
    --> C["<b>Action 3: Confirmation</b><br/>Review Server Total<br/>& Tap 'Confirm & Pay'"]:::step
    --> D["<b>Tip Sent</b><br/>Authoritative Receipt Screen"]:::success
```

#### The 3 Meaningful User Actions:
1. **Action 1 (Initiate):** Tap `"Send Tip"` on the performer profile OR point camera at the venue QR code.
2. **Action 2 (Amount):** Tap preset chip (e.g. `$10`) and tap `"Continue"`.
3. **Action 3 (Confirm):** Review server-verified totals and tap `"Confirm & Pay"`.
*(Note: Device biometric prompt such as FaceID/Fingerprint is OS payment security and not considered a redundant app navigation step).*

---

## 2. Creator & Band Lifecycle

### 2.1 Four Discrete Creator Lifecycle States

To ensure absolute financial and legal integrity, every creator profile transitions through four explicit lifecycle states:

```
[State 1: Account Created] 
       │ (Stage name, handle, genre, bio, avatar submitted)
       ▼
[State 2: Profile Completed] 
       │ (Stripe Connect Express onboarding completed)
       ▼
[State 3: Identity Verified] 
       │ (Bank account verified, tax info approved, payouts enabled)
       ▼
[State 4: Payout Eligible]
```

1. **State 1: Account Created (`roles: ['artist']`):**
   - User has signed up and selected the Musician/Artist persona.
   - CreatorStudio is accessible in "Setup Mode".
   - *Restrictions:* Cannot Go Live; cannot receive real tips; cannot request payouts.
2. **State 2: Profile Completed (`isPublished: true`):**
   - Minimum required profile submitted: Stage Name (2-50 chars), Unique Handle (`@handle`), Primary Genre, Short Bio, and Profile Photo.
   - Performer is now discoverable in public discovery and map searches.
   - *Restrictions:* Go Live is disabled with banner: "Connect bank account with Stripe to start receiving live tips".
3. **State 3: Identity Verified (`stripeConnected: true`):**
   - Creator has completed Stripe Connect Express hosted onboarding.
   - Identity documents and SSN/EIN validated by Stripe.
   - `chargesEnabled == true` on Stripe account.
   - *Capabilities:* Full Go Live enabled; QR generation enabled; can receive live audience tips.
4. **State 4: Payout Eligible (`payoutsEnabled: true`):**
   - Payout destination (checking account or debit card) verified by Stripe.
   - Available balance exceeds platform minimum ($10.00).
   - *Capabilities:* Can submit payout requests via `requestPayout` callable. Standard rolling transfers (2-3 business days) initiated.

---

### 2.2 Solo Musician Onboarding Journey
1. **Persona Selection:** During universal onboarding wizard (`/onboarding`), user selects `"Solo Musician"`.
2. **Minimum Required Profile:**
   - Stage Name (Required)
   - Unique Handle (Validated in real time via `checkHandleAvailability` callable)
   - Primary Genre (Single selection from curated music taxonomy)
   - Bio (Max 280 characters)
   - Avatar image (Uploaded via Firebase Storage)
3. **Deferred Optional Details:** Social links, Spotify embed, secondary instruments, and gallery photos are deferred to "Edit Profile" in Studio settings to prevent registration drop-off.
4. **Studio Landing:** Creator lands on `CreatorStudioTab`. Prominent checklist card guides completion:
   - [x] Create artist profile
   - [ ] Connect Stripe for payouts (CTA: "Complete Stripe Verification")
   - [ ] Test QR code

---

### 2.3 Band Lifecycle, Membership Authorization & Split Rules

```mermaid
graph TD
    classDef flow fill:#18181B,stroke:#6366F1,stroke-width:1px,color:#fff;
    classDef role fill:#2E1065,stroke:#C084FC,stroke-width:1px,color:#fff;

    B1["Create Band (/creator/band/create)"]:::flow --> B2["Band Hub Created (/creator/band)"]:::flow
    B2 --> B3["Invite Members (/creator/band/invite)"]:::flow
    B3 --> B4["Member Receives Email / Push Alert"]:::flow
    B4 --> B5["Member Accepts Invitation"]:::flow
    B5 --> B6["Configure Split Percentages (Sum = 100%)"]:::flow

    subgraph Role_Hierarchy["Band Role Authorization Matrix"]
        R1["<b>BAND_FOUNDER</b><br/>Ownership transfer, Delete band,<br/>Manage all roles & splits, Request payouts"]:::role
        R2["<b>BAND_ADMIN</b><br/>Invite/remove members,<br/>Edit profile, Configure splits"]:::role
        R3["<b>BAND_MEMBER</b><br/>Go Live, View treasury,<br/>Receive split payouts"]:::role
    end
```

#### Band Split Governance Rules
* **Sum to 100% Rule:** Total member split percentages plus optional Band Treasury retention must equal exactly `100.0%`.
* **Live Performance Lock:** While a live session is broadcasting (`liveSessionState.isActive == true`), split percentages are strictly **locked** to prevent mid-set financial disputes.
* **Pending Transfer Lock:** Split modifications are blocked while a batch treasury transfer is executing.

---

## 3. Error Recovery & Edge Case Protocols

| Edge Case Scenario | Trigger Condition | System Behavior & UX Recovery Path |
|---|---|---|
| **Authentication Cancellation** | Guest prompts auth during tip flow, then taps "Cancel" or "Close". | App preserves `PendingTipContext`. Closes auth modal without resetting amount selection. User returns to exact tip amount screen with notice: "Tip saved as draft". |
| **Interrupted Onboarding** | User force-closes app during onboarding steps 1, 2, or 3. | On next launch, `cbAuthRedirect` inspects `onboardingCompleted` claim. Automatically routes user to their exact unfinished step (`/onboarding/step-X`) with previously entered draft fields restored from local state. |
| **Unsaved Edits** | Creator modifies profile or band splits and taps hardware/app back button without saving. | Intercepted via `WillPopScope` / `PopScope(canPop: false)`. Displays standard system dialog: *"Discard unsaved changes? Any edits will be lost."* [Keep Editing] [Discard]. |
| **Location Permission Denied** | User denies GPS access on Discover tab or Go Live tab. | **Discover Tab:** Renders clean inline banner: *"Location access disabled. Search by venue or city to find live acts."* Displays manual city search input. <br/>**Go Live Tab:** Shows blocking state: *"Location required to verify stage proximity. Please enable in Settings."* Includes direct button to open OS App Settings (`openAppSettings()`). |
| **Duplicate Payment Submission** | User repeatedly taps "Confirm & Pay" on slow cellular connection. | Button immediately disables upon first tap and renders inline spinner. A client-generated UUIDv4 idempotency key is submitted with `createTipIntent`. Cloud Functions enforces single execution. |
| **Network Drop During Tipping** | Cellular connection lost after Stripe confirmation but before `TipSentScreen` renders. | Payment transaction listener in `paymentTransactions/{id}` maintains local SQLite offline cache. On reconnection, app displays authoritative confirmation dialog with receipt ID. |
