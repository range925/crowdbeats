# 02 — Cloud Boundary and IAM Plan
**Phase:** 2 — Firebase Dev Bootstrap
**Status:** PLANNED — IAM configuration requires Blaze billing. Emulator-only plan is active.

---

## 1. Environment Boundary Map

```
┌────────────────────────────────────────────────────────────────────────┐
│ David's machine (local development)                                    │
│                                                                        │
│  apps/mobile (Flutter)   ←──────────────────────┐                     │
│  apps/web (Next.js)      ←──┐                   │                     │
│  apps/functions (TS)     ←──┤                   │                     │
│                             │  Firebase Emulator │                     │
│                             │  Suite (:4000)     │                     │
│                             ├──── Auth :9099     │                     │
│                             ├──── Firestore:8080 │                     │
│                             ├──── Functions:5001 │                     │
│                             ├──── Storage: 9199  │                     │
│                             └──── Hosting: 5002  │                     │
└────────────────────────────────────────────────────────────────────────┘
                  │ No production data crosses this boundary in Phase 2
                  ▼
┌──────────────────────────────────────────────┐
│ Google Cloud Platform — crowdbeats-v2-dev    │
│                                              │
│  Firebase Auth (API enabled, no providers)   │
│  Firestore (STANDARD, us-central1)           │
│  Cloud Storage (us-central1)                 │
│  Cloud Functions Gen 2 (API enabled)         │
│  Firebase App Check (API enabled)            │
│                                              │
│  NOT YET:                                    │
│  - Secret Manager (requires Blaze billing)   │
│  - Cloud Build (requires Blaze billing)      │
│  - App Hosting (requires Blaze billing)      │
└──────────────────────────────────────────────┘
```

---

## 2. IAM Roles Plan

### Current State (Phase 2 — Spark plan)
Only the project owner (`crowdbeatsllc@gmail.com`) has access.
No service accounts have been explicitly configured.
Firebase creates a default service account for Functions runtime.

### Target State (Phase 3+ — after Blaze enabled)

| Principal | Role | Scope | Purpose |
|---|---|---|---|
| `crowdbeatsllc@gmail.com` | `roles/owner` | Project | David: full project control |
| Firebase Functions SA | `roles/datastore.user` | Project | Functions read/write Firestore |
| Firebase Functions SA | `roles/storage.objectAdmin` | Storage bucket | Functions manage uploaded files |
| Firebase Functions SA | `roles/secretmanager.secretAccessor` | Specific secrets only | Functions read Stripe keys |
| Firebase Functions SA | `roles/firebase.sdkAdminServiceAgent` | Project | Firebase Admin SDK operations |
| CI/CD SA (TBD) | `roles/cloudfunctions.developer` | Project | CI/CD deploy Functions only |
| CI/CD SA (TBD) | `roles/firebaserules.admin` | Project | CI/CD deploy security rules |

### Least-Privilege Principles
1. Service accounts are granted only the minimum roles they need.
2. No wildcard `*` access to Secret Manager — only named secrets.
3. CI/CD service account has NO access to production project — separate SA required.
4. Admin SDK service account key file is NEVER committed or downloaded — runtime injection only.
5. No human IAM members other than David on the dev project.

---

## 3. Secret Manager Plan (Phase 3 — after Blaze)

| Secret Name | Purpose | Rotation Policy |
|---|---|---|
| `stripe-secret-key-dev` | Stripe API secret key (test mode) | On Stripe key rotation |
| `stripe-webhook-secret-dev` | Stripe webhook endpoint secret | On webhook reconfiguration |
| `stage-hmac-key-dev` | HMAC SHA-256 key for QR token signing | Monthly |
| `firebase-admin-sdk-config` | Unused (runtime injection) | N/A |

**Critical invariants:**
- Secret values are NEVER in source code, logs, or environment files committed to Git
- STRIPE_SECRET_KEY starts with `sk_test_` in dev — never `sk_live_` until Phase 13+ production approval
- Webhook secrets start with `whsec_` — never logged or returned to clients
- HMAC key is 32+ bytes of CSPRNG entropy, stored only in Secret Manager

---

## 4. Cloud Security Boundary Invariants

These invariants apply at all layers and cannot be bypassed by any client:

| # | Invariant | Enforcement Layer |
|---|---|---|
| 1 | No client writes to `/paymentLedger/*` | Firestore Rules (default-deny) |
| 2 | No client writes to `/auditLogs/*` | Firestore Rules (default-deny) |
| 3 | No client reads `amountCents` without Auth UID match | Firestore Rules (Phase 3) |
| 4 | All Stripe operations via server-only callable | Cloud Function enforcement |
| 5 | Stripe secret key ONLY in Secret Manager | IAM + Cloud Run env injection |
| 6 | Stripe webhook signature verified before any processing | Functions/http handler |
| 7 | App Check token required for all production callables | `enforceAppCheck: true` (Phase 5) |
| 8 | ID token verified server-side via Admin SDK, not client claim | Firebase Admin `verifyIdToken()` |
| 9 | Staff claims set only by SUPER_ADMIN step-up callable | Cloud Function + Firestore Rules |
| 10 | QR check-in tokens: HMAC SHA-256, 300s TTL, server-verified | Cloud Function callable |

---

## 5. Logging and Retention Plan

| Log Type | Location | Retention | Cost |
|---|---|---|---|
| Cloud Functions logs | Cloud Logging | 30 days (default) | Free tier |
| Firestore audit logs | Cloud Logging | 30 days | Free tier |
| Auth events | Firebase Console | 90 days | Free |
| Stripe events | Stripe Dashboard | 30 days | Stripe-managed |
| App Check violations | Firebase Console | 30 days | Free |

**Privacy rules:**
- No PII (names, emails, phone numbers) in Cloud Logging entries
- User identifiers logged as Firebase UID only (never email or phone)
- Payment amounts logged as `amountCents` with no customer PAN/CVC

---

## 6. Backup and Restore Plan (Phase 3 — after Blaze)

| Resource | Backup Method | Frequency | Retention |
|---|---|---|---|
| Firestore (dev) | Scheduled Cloud Function export to GCS | Daily | 7 days |
| Firestore (staging/prod) | Managed daily export | Daily | 30 days |
| Cloud Storage (media) | Object versioning enabled | Per-write | 30 days |

**Restore procedure:**
1. Obtain David's explicit approval (accidental-data-loss-prevention)
2. Identify the target backup export timestamp
3. Restore via `gcloud firestore import gs://<bucket>/<backup-path> --project <PROJECT_ID>`
4. Verify data integrity in Firebase Console

---

## 7. Phase 2 Action Items Pending David

| Item | Action Required | Blocking |
|---|---|---|
| **Blaze billing** | Enable at console.firebase.google.com/project/crowdbeats-v2-dev/overview?purchaseBillingPlan=metered | Secret Manager, App Hosting, Cloud Build |
| **Budget alert** | Set \$10/month alert after enabling Blaze | Cost protection |
| **Apple Developer membership** | Required for App Check DeviceCheck + APNs | Phase 5 iOS push + App Check |
| **Play Console registration** | Required for App Check Play Integrity | Phase 5 Android App Check |
