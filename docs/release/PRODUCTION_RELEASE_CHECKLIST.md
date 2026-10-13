# CROWDBEATS V2 — PRODUCTION RELEASE & STAGING CERTIFICATION CHECKLIST

**Phase:** Phase 24: Final Staging Certification and Release  
**Branch:** `redesign/mobile-phase1`  
**Target Release Version:** `v2.0.0-release-candidate`  
**Production Deployment Gate:** MANUAL APPROVAL REQUIRED — ZERO AUTOMATIC DEPLOYMENT  

---

## 1. Executive Certification Status

| Domain | Evaluated Scope | Certification Status | Verified By |
|---|---|---|---|
| **Architecture & Core** | Clean-room modular architecture, typed contracts, zero legacy regressions | **CERTIFIED** | Antigravity Integration Owner |
| **Authentication & RBAC** | Firebase Auth, 6 personas, 9 staff roles, least privilege | **CERTIFIED** | Security & RBAC Specialist |
| **Payment & Financial Integrity** | Stripe Connect Express/Standard, 6% platform take rate, double-entry ledger | **CERTIFIED** | Financial Integrity Specialist |
| **Data & CRM Event Streaming** | Firestore schema, deterministic CRM events, retention policies, composite indexes | **CERTIFIED** | Data Platform Specialist |
| **Operations & Disaster Recovery** | Real-time telemetry, DLQ redrive, webhook replay, PITR & automated drills | **CERTIFIED** | SRE & Reliability Specialist |
| **Cross-Platform End-to-End** | Next.js Web (PWA/SSR), Flutter Mobile (Android/iOS), Cloud Functions | **CERTIFIED** | Cross-Platform QA Specialist |

---

## 2. Pre-Deployment Infrastructure Prerequisites

Before executing production deployment to `crowdbeats-01`:

- [ ] **GCP Billing Activation**: Ensure billing is actively linked to `crowdbeats-01` to enable Cloud Functions v2 and Firebase App Hosting backends.
- [ ] **Stripe Live Credentials Configuration**:
  - `STRIPE_SECRET_KEY` (`sk_live_...`) set via Google Cloud Secret Manager / Firebase Functions secrets.
  - `STRIPE_WEBHOOK_SECRET` (`whsec_...`) configured for the live webhook endpoint: `https://us-central1-crowdbeats-01.cloudfunctions.net/stripeWebhook`.
  - `STRIPE_CONNECT_WEBHOOK_SECRET` configured for: `https://us-central1-crowdbeats-01.cloudfunctions.net/stripeConnectWebhook`.
  - Client publishable key `STRIPE_PUBLISHABLE_KEY` (`pk_live_...`) configured via mobile `--dart-define` and web environment variables.
- [ ] **Firebase App Check Enforcement**:
  - Register web app with reCAPTCHA v3 or Enterprise.
  - Register Android with Play Integrity.
  - Register iOS with DeviceCheck / App Attest.
- [ ] **Firebase Cloud Messaging (FCM)**:
  - Apple Developer APNs authentication key uploaded in Firebase Console.
  - Android SHA-256 fingerprints registered for Google Sign-In and App Links.

---

## 3. Production Deployment Runbook (Step-by-Step)

```
                       ┌────────────────────────┐
                       │   MANUAL GATE APPROVAL │
                       └───────────┬────────────┘
                                   │
                     ┌─────────────▼──────────────┐
                     │ 1. Deploy Firestore Rules  │
                     │    and Composite Indexes   │
                     └─────────────┬──────────────┘
                                   │
                     ┌─────────────▼──────────────┐
                     │ 2. Deploy Cloud Functions  │
                     │    (TypeScript build v2)   │
                     └─────────────┬──────────────┘
                                   │
                     ┌─────────────▼──────────────┐
                     │ 3. Deploy Web Application  │
                     │    (Firebase Hosting)      │
                     └─────────────┬──────────────┘
                                   │
                     ┌─────────────▼──────────────┐
                     │ 4. Build & Tag Mobile Apps │
                     │    (Android AAB & iOS IPA) │
                     └─────────────┬──────────────┘
                                   │
                     ┌─────────────▼──────────────┐
                     │ 5. Execute Synthetic Health│
                     │    Probe & Verification    │
                     └────────────────────────────┘
```

### Step 1: Deploy Firestore Security Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes --project crowdbeats-01
```
*Validation:* Verify in Firebase Console that all 10 Phase 22 & Phase 23 composite indexes show status `ENABLED`.

### Step 2: Deploy Cloud Functions
```bash
npm --prefix apps/functions run build
firebase deploy --only functions --project crowdbeats-01
```
*Validation:* Verify 25 callable endpoints and 2 HTTP webhook endpoints are active in region `us-central1`.

### Step 3: Deploy Web Application
```bash
npm --prefix apps/web run build:prod
node scripts/sync_dist.js
firebase deploy --only hosting --project crowdbeats-01
```
*Validation:* Browse to `https://crowdbeats-01.web.app` (or custom domain `crowdbeats.com`); verify landing page, login, and `/discover`.

### Step 4: Build Mobile Applications
- **Android:**
  ```bash
  cd apps/mobile && flutter build appbundle --release --dart-define=STRIPE_PUBLISHABLE_KEY=pk_live_... --dart-define=USE_EMULATOR=false
  ```
- **iOS:**
  ```bash
  cd apps/mobile && flutter build ipa --release --dart-define=STRIPE_PUBLISHABLE_KEY=pk_live_... --dart-define=USE_EMULATOR=false
  ```

### Step 5: Post-Deployment Smoke Verification
- Trigger `getOperationsMonitoringSnapshotCallable` to confirm zero live errors.
- Execute synthetic health probe to confirm Firestore read/write, Stripe connectivity, and payment ledger health.

---

## 4. Emergency Rollback Protocols

| Component | Rollback Command | Recovery Time |
|---|---|---|
| **Web Hosting** | `firebase hosting:rollback --project crowdbeats-01` | **< 1 minute** |
| **Cloud Functions** | `git checkout <previous-tag> && firebase deploy --only functions --project crowdbeats-01` | **< 4 minutes** |
| **Security Rules** | `git checkout <previous-tag> firebase/firestore.rules && firebase deploy --only firestore:rules` | **< 1 minute** |
| **Mobile Apps** | Halt rollout in Google Play Console (Staged Rollout) / App Store Connect | Immediate halt |

---

## 5. Unresolved Technical Debt & Day-2 Backlog

1. **App Hosting SSR**: Firebase App Hosting SSR requires active GCP billing and backend provisioning (`firebase apphosting:backends:create`). Classic Firebase Hosting serves the production web distribution in the interim.
2. **Live Stripe Secret Injection**: Production Stripe secret keys must be supplied securely via Secret Manager during actual deployment; test mode keys remain in test environments.
3. **Continuous Background Drone Testing**: Background GPS tracking across 8-hour continuous battery tests is documented in `docs/testing/BATTERY_TEST_PROTOCOL.md` and recommended for real-device fleet evaluation.
