# CROWDBEATS V2 — MIGRATION & ROLLBACK PLAN

---

## 1. Safe Schema Evolution Strategy
- **Backward-Compatible Fields:** All new Firestore attributes (`guestSessionId`, `defaultPaymentMethodId`, `payoutHoldReason`) are nullable with safe defaults.
- **Fail-Closed Operations:** If a newly introduced check fails or times out, financial transactions fail closed to prevent erroneous balance changes.
- **Feature Flags:** Guest navigation and new wallet features are protected by runtime feature flags.

---

## 2. Rollback Procedures
- **Firestore Security Rules:** Revert to previous rule tag via `firebase deploy --only firestore:rules`.
- **Cloud Functions:** Redeploy previous function version; existing idempotency keys prevent duplicate processing.
- **Client Fallback:** If Places Autocomplete fails or encounters quota limits, the UI falls back seamlessly to standard keyword search.
