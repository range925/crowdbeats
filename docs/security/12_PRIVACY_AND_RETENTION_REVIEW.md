# Crowdbeats V2 — Privacy, Data Protection & Retention Review

**Date:** 2026-08-26  
**Auditor:** Antigravity AI Compliance & Security Engineering  
**Compliance Standards:** GDPR (EU 2016/679) / CCPA / CPRA / PCI-DSS SAQ A  

---

## 1. Data Classification Matrix

| Data Category | Data Elements | Sensitivity | Storage Location | Retention Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Identity** | Firebase UID, email, displayName, photoURL | High (PII) | Firebase Auth, `/users/{uid}` | Retained until user account deletion |
| **Financial Ledger** | Ledger ID, debit/credit UID, amountCents, currency, tipId | Critical (Financial) | Firestore `/paymentLedger/{id}` | 7 years (Statutory financial requirement) |
| **Payment Card Details** | Card brand, last 4 digits, exp month/year | Low (Non-PAN) | Firestore `/paymentMethods/{uid}/savedMethods` | Retained until removed by user |
| **Raw Card PAN / CVV** | 16-digit card number, CVV code | Critical | **NEVER STORED** (Handled directly by Stripe PCI-DSS Level 1) | Zero retention |
| **Governance & Audit Trail** | Actor UID, action type, target entity, timestamp, IP | High (Audit) | Firestore `/auditEvents/{id}` | 7 years (Immutable, unmodifiable) |
| **Operational Telemetry** | Redacted logs, error traces, correlation IDs | Moderate | Google Cloud Logging | 90 days active retention |
| **Push Notification Tokens** | FCM registration tokens, platform, appVersion | Moderate | Firestore `/users/{uid}/deviceTokens` | Retained while active; pruned on token error/logout |

---

## 2. Privacy & User Rights Implementation

### 2.1 Right of Access & Data Portability (GDPR Art. 15 / 20)
- Endpoints: `requestPrivacyExport` (`apps/functions/src/privacy/requestDataExport.ts`) and web export route (`/fan/privacy`, `/creator/privacy`).
- Implementation: Queues an automated data export package assembling profile data, transaction history, tip receipts, followed artists, and campaign contributions.

### 2.2 Right to Erasure / "To Be Forgotten" (GDPR Art. 17)
- Endpoints: `_AccountSettingsScreen` (`apps/mobile/lib/main.dart`), `/fan/security`, `/creator/security`.
- Implementation:
  - Requires typed confirmation phrase (`"delete my account"`).
  - Anonymizes profile data, revokes FCM tokens, and soft-deletes user record (`isDeleted: true`).
  - Financial ledger entries are retained in anonymized format (`uid: [DELETED_USER]`) to comply with 7-year statutory financial and tax obligations.

### 2.3 Consent Management & Push Notifications
- Push notifications require explicit user opt-in before device token registration (`registerDeviceToken.ts`).
- Opt-out / logout immediately invokes `unregisterDeviceToken.ts` and prunes tokens from the database.

---

## 3. Log Redaction & Observability Verification

Automated unit tests in `apps/functions/src/__tests__/crossPlatformIntegration.test.ts` verify:
1. Card numbers matching Luhn or 13-19 digit patterns are redacted to `[REDACTED_CARD_...XXXX]`.
2. Stripe API keys (`sk_test_...`, `sk_live_...`, `whsec_...`) are redacted to `[REDACTED_STRIPE_SECRET]`.
3. Authorization headers (`Bearer ...`) are redacted to `Bearer [REDACTED_TOKEN]`.
4. Sensitive payload keys (`password`, `secret`, `cvv`, `pan`) are redacted to `[REDACTED_FIELD]`.

---

## 4. Privacy Gate Verdict

The Crowdbeats V2 data architecture meets all privacy and retention requirements.

**Privacy Release Gate Verdict:** ✅ **PASS**
