# 02 — Firebase V2 Bootstrap Record
**Phase:** 2 — New Firebase Dev Bootstrap
**Date:** 2026-08-25
**Status:** COMPLETE (Blaze billing setup action pending — see Section 8)

---

## 1. Project Identity

| Property | Value |
|---|---|
| **Project Display Name** | Crowdbeats V2 Dev |
| **Project ID** | `crowdbeats-v2-dev` |
| **Project Number** | `1026171057644` |
| **GCP Account** | `crowdbeatsllc@gmail.com` |
| **Current Plan** | Spark (free) — Blaze upgrade required (see Section 8) |
| **Former V1 Project** | `crowdbeats-01` (568766536855) — **untouched** |
| **Firebase Console** | https://console.firebase.google.com/project/crowdbeats-v2-dev/overview |

> [!IMPORTANT]
> This is the **development** project only. Staging (`crowdbeats-v2-staging`) and
> production (`crowdbeats-v2-prod`) projects do NOT exist yet and require separate
> explicit approval before creation.

---

## 2. Application Records

| Platform | Display Name | App ID | Identifier |
|---|---|---|---|
| Web | Crowdbeats V2 Web | `1:1026171057644:web:0cd11a627dc506b8c87cc9` | N/A |
| Android | Crowdbeats V2 Android | `1:1026171057644:android:3dcf32bc45d1ed7dc87cc9` | `com.crowdbeats.app` |
| iOS | Crowdbeats V2 iOS | `1:1026171057644:ios:0e11f2570cfef3bbc87cc9` | `com.crowdbeats.app` |

### Platform Config File Policy

| File | Committed? | Reason |
|---|---|---|
| `google-services.json` | **No** | Gitignored — downloaded on demand via Firebase CLI |
| `GoogleService-Info.plist` | **No** | Gitignored — downloaded on demand via Firebase CLI |
| `apps/web/.env.local` | **No** | Gitignored — contains public web config values |
| `apps/web/lib/firebase/app.ts` | **Yes** | Safe — reads only from `process.env.NEXT_PUBLIC_*` |

**Download commands (run locally when setting up a new dev machine):**

```bash
# Android
npx -y firebase-tools@latest apps:sdkconfig ANDROID 1:1026171057644:android:3dcf32bc45d1ed7dc87cc9 \
  --project crowdbeats-v2-dev > apps/mobile/android/app/google-services.json

# iOS
npx -y firebase-tools@latest apps:sdkconfig IOS 1:1026171057644:ios:0e11f2570cfef3bbc87cc9 \
  --project crowdbeats-v2-dev > apps/mobile/ios/Runner/GoogleService-Info.plist
```

---

## 3. Firebase Services Configured

### Firestore Database

| Property | Value |
|---|---|
| Database ID | `(default)` |
| Location | `us-central1` |
| Type | `FIRESTORE_NATIVE` |
| Edition | STANDARD (free tier — Enterprise upgrade when Blaze enabled) |
| Free Tier | Yes |
| UID | `6dd4b4df-22bd-4aab-8a3b-5419968b2cf8` |
| Created | 2026-08-25T18:58:49Z |
| Security Rules | Default-deny (`firebase/firestore.rules`) — deployed Phase 3 |

### Cloud Storage

| Property | Value |
|---|---|
| Bucket | `crowdbeats-v2-dev.firebasestorage.app` |
| Location | `us-central1` (API enabled) |
| Security Rules | Default-deny (`firebase/storage.rules`) — deployed Phase 3 |

### Firebase Authentication

| Property | Value |
|---|---|
| API Enabled | Yes (Identity Toolkit API) |
| Providers Enabled | None yet — configured in Phase 5 via `firebase.json` auth block |
| Planned providers | Email/Password, Google Sign-In, Anonymous (dev only) |
| Apple Sign-In | Phase 5 (requires Apple Developer account) |

### Cloud Functions Gen 2

| Property | Value |
|---|---|
| Runtime | Node.js 20 |
| Region | `us-central1` |
| API Enabled | Yes (Cloud Functions API) |
| Deployed Functions | None (emulator only in Phase 2) |
| Bootstrap callable | `hello` — emulator-only, removed in Phase 3 |

### App Check

| Property | Value |
|---|---|
| API Enabled | Yes (Firebase App Check API) |
| Enforcement | Not yet active — configured in Phase 5 |
| iOS provider | DeviceCheck (Phase 5, requires Apple Developer account) |
| Android provider | Play Integrity (Phase 5, requires Play Console) |
| Web provider | reCAPTCHA Enterprise (Phase 5, requires domain) |
| Debug tokens | Generated in Phase 5 (never committed to Git) |

### Emulator Suite

| Emulator | Port | Status |
|---|---|---|
| Auth | 9099 | Configured in `firebase.json` |
| Functions | 5001 | Configured in `firebase.json` |
| Firestore | 8080 | Configured in `firebase.json` |
| Storage | 9199 | Configured in `firebase.json` |
| Hosting | 5002 | Configured in `firebase.json` |
| UI | 4000 | Configured in `firebase.json` |
| singleProjectMode | true | Maps to `crowdbeats-v2-dev` |

---

## 4. GCP APIs Enabled

| API | Status | Notes |
|---|---|---|
| `firestore.googleapis.com` | ✅ Enabled | Via Service Usage REST API |
| `storage.googleapis.com` | ✅ Enabled | Via Service Usage REST API |
| `identitytoolkit.googleapis.com` | ✅ Enabled | Firebase Auth |
| `cloudfunctions.googleapis.com` | ✅ Enabled | Via Service Usage REST API |
| `firebaseappcheck.googleapis.com` | ✅ Enabled | Via Service Usage REST API |
| `secretmanager.googleapis.com` | ⛔ Blocked — Billing Required | Enable after Blaze upgrade |
| `cloudbuild.googleapis.com` | ⛔ Blocked — Billing Required | Required for Functions Gen 2 deploy |
| `artifactregistry.googleapis.com` | ⛔ Blocked — Billing Required | Required for Cloud Run (Gen 2) |
| `run.googleapis.com` | ⛔ Blocked — Billing Required | Required for Cloud Run (Gen 2) |

---

## 5. Firebase SDK Installation

| Package | App | Installed Version | Method |
|---|---|---|---|
| `firebase` (client SDK) | apps/web | Via `npm install firebase` | npm workspace |
| `firebase-admin` | apps/functions | Via `npm install firebase-admin` | npm |
| `firebase-functions` v2 | apps/functions | Via `npm install firebase-functions` | npm |
| Flutter Firebase packages | apps/mobile | Pending Phase 5 (FlutterFire CLI) | Not yet |

---

## 6. Configuration Files

| File | Status | Committed | Purpose |
|---|---|---|---|
| `firebase.json` | ✅ Created | **Yes** | Wires all services + emulators |
| `.firebaserc` | ✅ Created | **No** (gitignored) | Dev project alias |
| `.firebaserc.example` | ✅ Created | **Yes** | Safe alias template |
| `apps/web/.env.local` | ✅ Created | **No** (gitignored) | Web client config + emulator flags |
| `apps/web/lib/firebase/app.ts` | ✅ Created | **Yes** | Firebase SDK init (env-var driven) |
| `apps/mobile/FIREBASE_CONFIG.md` | ✅ Created | **Yes** | Flutter app ID reference + policy |

---

## 7. Auth Provider Plan (Phase 5 Implementation)

```json
{
  "auth": {
    "providers": {
      "anonymous": true,
      "emailPassword": true,
      "googleSignIn": {
        "oAuthBrandDisplayName": "Crowdbeats",
        "supportEmail": "crowdbeatsllc@gmail.com",
        "authorizedRedirectUris": [
          "http://localhost:5002",
          "https://crowdbeats-v2-dev.firebaseapp.com"
        ]
      }
    },
    "authorizedDomains": [
      "localhost",
      "crowdbeats-v2-dev.firebaseapp.com",
      "crowdbeats-v2-dev.web.app"
    ]
  }
}
```

Apple Sign-In requires bundle ID `com.crowdbeats.app` and APNs key — added in Phase 5.

---

## 8. Blaze Billing Action Required

> [!CAUTION]
> **David must enable Blaze billing before the following features can be activated:**
>
> - Secret Manager (Stripe keys, HMAC signing keys)
> - Firebase App Hosting (Next.js SSR deployment)
> - Cloud Functions Gen 2 cloud deployment (requires Cloud Build + Cloud Run)
> - Firestore Enterprise edition upgrade
>
> **Action:** Open this URL and upgrade to Blaze:
> https://console.firebase.google.com/project/crowdbeats-v2-dev/overview?purchaseBillingPlan=metered
>
> **Budget alert:** Set a \$10/month budget alert immediately after enabling Blaze at:
> https://console.cloud.google.com/billing/budgets?project=crowdbeats-v2-dev
>
> For Phase 2 development, **all features work locally via the Emulator Suite without billing**.
> Billing is only needed for cloud deployment and Secret Manager.

---

## 9. Rollback / Cleanup Procedure

> [!CAUTION]
> **Deleting the Firebase project is irreversible. Requires explicit David approval per the accidental-data-loss-prevention skill.**

If the `crowdbeats-v2-dev` project needs to be removed:

1. Obtain David's explicit approval.
2. Ensure no real user data exists (Phase 2 uses only emulator — no cloud data).
3. Run:
   ```bash
   # DO NOT RUN without David's approval
   npx -y firebase-tools@latest projects:delete crowdbeats-v2-dev
   ```
4. The project ID `crowdbeats-v2-dev` cannot be reused after deletion.
5. Remove `apps/web/.env.local` and `.firebaserc` locally.

---

## 10. What Was NOT Done

Per Phase 2 scope constraints:
- ❌ No staging or production project created
- ❌ No Stripe live mode enabled
- ❌ No production data created
- ❌ No emulator fixtures loaded (added Phase 3)
- ❌ No App Check enforcement active
- ❌ No Auth providers deployed (Phase 5)
- ❌ No Functions deployed to cloud (emulator only)
- ❌ No FCM tokens or APNs keys configured
- ❌ No budgets or IAM policies configured (requires Blaze)
- ❌ Former project `crowdbeats-01` untouched
