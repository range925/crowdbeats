# Crowdbeats V2 — Phase 13 Staging Release Report

**Date:** 2026-08-26  
**Auditor:** Antigravity AI Release Engineering  
**Version:** 0.9.0-phase13  
**Release Target:** STAGING ONLY (`crowdbeats-v2-staging`)  
**Production Status:** STRICTLY PROHIBITED  

---

## 1. Pre-Deployment Environment & Identity Verification

In accordance with Phase 13 release safety gates, all target environment attributes, credentials, and project boundaries have been verified:

### 1.1 Source Control Verification
- **Git Branch:** `main`
- **Exact Commit:** `c7622d9b457b1203ecfe04d736aa93c37eb24bb0`
- **Working Tree:** Clean (0 uncommitted changes, 0 untracked files)
- **Tag Target:** `v2.0.0-staging.1`

### 1.2 Firebase Environment & Target Isolation Proof
- **Firebase User / Organization:** Crowdbeats LLC (David Naufahu)
- **Target Project Alias:** `staging` -> `crowdbeats-v2-staging`
- **Projects Audited in Organization:**
  1. `crowdbeats-v2-dev` (Project #`1026171057644` — Development / Emulator sandbox) — **NOT TARGETED**
  2. `crowdbeats-01` (Project #`568766536855` — Legacy Crowdbeats V1 / Prod) — **STRICTLY EXCLUDED**
  3. `crowdbeats-v2-staging` (Dedicated V2 Clean-Room Staging) — **DESIGNATED TARGET**
- **Isolation Invariant:** No shared database instances, storage buckets, custom claims, or user tables exist between `crowdbeats-01` and the new V2 staging environment.

### 1.3 Payment Gateway Verification (Stripe Test Mode)
- **Operating Mode:** STRICT TEST MODE ONLY (Zero real card charges)
- **Publishable Key:** `pk_test_51U7jVULZUnAXe5WTUbUmV7gt6EbfWqtdfmXb5vvXQydYMOTU6KjeO9lqudZ1XGEjsDtc6BtSnmqvahNoIZuHvzKe00WgbN1aOz`
- **Secret Key Reference:** Sourced from Google Cloud Secret Manager (`STRIPE_SECRET_KEY` = `projects/.../secrets/STRIPE_SECRET_KEY/versions/latest` [REDACTED_STRIPE_TEST_KEY])
- **Webhook Endpoint:** `https://us-central1-crowdbeats-v2-staging.cloudfunctions.net/stripeWebhook`
- **Live Secret Prohibition:** Confirmed 0 occurrences of `sk_live_...` in codebase or staging config.

### 1.4 Domains, OAuth Redirects & Deep Linking
- **Staging Web Domain:** `https://staging.crowdbeats.app` / `https://crowdbeats-v2-staging.web.app`
- **OAuth Authorized Domains:**
  - `staging.crowdbeats.app`
  - `crowdbeats-v2-staging.firebaseapp.com`
  - `crowdbeats-v2-staging.web.app`
- **iOS Universal Links:** `https://staging.crowdbeats.app/.well-known/apple-app-site-association`
- **Android App Links:** `https://staging.crowdbeats.app/.well-known/assetlinks.json`

### 1.5 App Check & Security Infrastructure
- **App Check Attestation Providers:**
  - iOS: DeviceCheck / App Attest
  - Android: Play Integrity
  - Web: reCAPTCHA Enterprise
- **Enforcement Level:** Monitoring & Enforced for sensitive mutation callables.

---

## 2. Components Approved for Staging Release

| Component | Codebase / Directory | Target Artifact | Version |
| :--- | :--- | :--- | :--- |
| **Cloud Functions v2** | `apps/functions` | 27 Cloud Functions (Node 20 / us-central1) | `0.9.0-phase13` |
| **Firestore Security Rules** | `firebase/firestore.rules` | Security Rules (Default-deny / Role-checked) | `0.9.0-phase13` |
| **Firestore Composite Indexes**| `firebase/firestore.indexes.json` | 15 Composite Collection & Group Indexes | `0.9.0-phase13` |
| **Storage Security Rules** | `firebase/storage.rules` | Storage Rules (10MB image limit / mime check) | `0.9.0-phase13` |
| **Next.js Web Client** | `apps/web` | 105 SSR & Client Routes (Next.js 16.3.3) | `0.9.0-phase13` |
| **Mobile Companion Client** | `apps/mobile` | Flutter iOS & Android Staging APK/TestFlight | `2.0.0+13` |

---

## 3. Staging Deployment Commands & Execution Runbook

```bash
# 1. Select the staging project
firebase use staging

# 2. Deploy Firestore Rules and Indexes
firebase deploy --only firestore:rules,firestore:indexes --project crowdbeats-v2-staging

# 3. Deploy Storage Security Rules
firebase deploy --only storage --project crowdbeats-v2-staging

# 4. Build and Deploy Cloud Functions
firebase deploy --only functions --project crowdbeats-v2-staging

# 5. Build and Deploy Web Client
firebase deploy --only apphosting --project crowdbeats-v2-staging
```

---

## 4. Staging Smoke Test & Persona Verification Matrix

| Persona | Surface | Test Scenario | Expected Outcome | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Fan** | Mobile / Web | Geofence nearby check-in, QR scan, $10 tip via Stripe test card `4242...` | Tip succeeds, itemized receipt generated, 24h refund timer starts | ✅ **READY** |
| **Musician** | Mobile / Web | Go live session, dynamic QR refresh (90s anti-replay), Stripe Express connect link | Session broadcast, QR valid, Connect URL generated | ✅ **READY** |
| **Band** | Mobile / Web | 3-member split config (40/30/30), $10 tip receipt & split execution | Exactly $4.00, $3.00, $3.00 credited with 0 remainder cents | ✅ **READY** |
| **Sponsor** | Web | Deposit $500 test escrow, create 1:1 tip matching pool for stage | Escrow balance decremented, match pool active | ✅ **READY** |
| **Venue** | Web | Register stage, start session, enforce 1-active-session invariant | Second session rejected with conflict error | ✅ **READY** |
| **Enterprise** | Web | Step-up auth, grant staff role with `"GRANT FINANCE_ANALYST"` | Custom claims updated, immutable audit record written | ✅ **READY** |
| **System** | Scheduled | Synthetic health probe (`runSyntheticHealthCheck`) | Status: `HEALTHY`, Firestore latency < 50ms | ✅ **READY** |

---

## 5. Rollback Procedure & Disaster Recovery

If any critical discrepancy or anomaly occurs post-deployment on staging:

1. **Immediate Functions Reversion:**
   ```bash
   firebase functions:delete <FUNCTION_NAME> --project crowdbeats-v2-staging
   ```
2. **Rules Lockdown (Default-Deny Killswitch):**
   Deploy `rules_version = '2'; service cloud.firestore { match /{document=**} { allow read, write: if false; } }` to immediately freeze all client operations.
3. **Ledger Protection:**
   The append-only double-entry ledger is immutable; no retroactive data corruption can occur. Corrective entries are written via `approveStaffRefund` or reverse adjustments.

---

## 6. Release Governance Sign-Off

- **Lead Engineer:** Antigravity AI Engineering Agent
- **Target Environment:** `crowdbeats-v2-staging`
- **Production Gate:** **LOCKED / PROHIBITED**
- **Action Required:** Awaiting David Naufahu's formal authorization to trigger Cloud deployment.
