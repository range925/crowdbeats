# Crowdbeats V2 — Release Blockers & Operational Prerequisites

**Date:** 2026-08-26  
**Auditor:** Antigravity AI Release Engineering  
**Version:** 0.9.0-phase12  

---

## 1. Release Blocker Status

**Current Technical Blocker Count:** **0 (ZERO BLOCKERS)**

All automated quality, test, build, security, and privacy gates are currently green.

---

## 2. Operational Prerequisites for Production Deployment (Checklist for David Naufahu)

Before switching from Stripe testmode and local/emulator environments to live production traffic, the following operational configuration steps must be performed by project leadership:

### 2.1 Stripe Production Live Mode Activation
- [ ] Transition from `sk_test_...` and `pk_test_...` to live Stripe API keys (`sk_live_...`, `pk_live_...`).
- [ ] Configure live Stripe Webhook endpoint `https://us-central1-<PROJECT_ID>.cloudfunctions.net/stripeWebhook` in Stripe Dashboard.
- [ ] Retrieve production `STRIPE_WEBHOOK_SECRET` (`whsec_...`) and store in Google Cloud Secret Manager.
- [ ] Enable Apple Pay and Google Pay merchant IDs in Stripe Dashboard.

### 2.2 Firebase & Google Cloud IAM Configuration
- [ ] Deploy Cloud Firestore Security Rules (`firebase deploy --only firestore:rules`).
- [ ] Deploy Firebase Storage Security Rules (`firebase deploy --only storage`).
- [ ] Deploy Cloud Functions v2 (`firebase deploy --only functions`).
- [ ] Verify production Firestore Composite Indexes from `firebase/firestore.indexes.json`.
- [ ] Configure Firebase App Check with DeviceCheck (iOS) and Play Integrity (Android).

### 2.3 Mobile Store Submissions (iOS & Android)
- [ ] Register Universal Links domain `crowdbeats.app` with Apple Developer portal (`apple-app-site-association`).
- [ ] Register Android App Links `assetlinks.json` with Google Play Console.
- [ ] Perform production release build (`flutter build ipa` / `flutter build appbundle`).

### 2.4 Staff Roles Initialization
- [ ] Grant the initial `SUPER_ADMIN` role to David Naufahu's primary UID via Cloud Functions admin script or Firebase Admin CLI.

---

## 3. Residual Low-Severity Recommendations (Post-Launch Optimizations)

These non-blocking items are recommended for the Phase 13 post-launch operational cycle:
1. **Automated E2E Synthetic Probes:** Set up Cloud Scheduler cron triggers that simulate a $1 tip end-to-end every hour in staging to ensure external payment gateway availability.
2. **BigQuery Export Pipeline:** Enable the Firebase Extensions "Export Collections to BigQuery" for `/paymentLedger` to facilitate automated real-time financial reporting.
