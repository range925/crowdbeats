# CROWDBEATS V2 — FIRESTORE & STORAGE SECURITY PLAN

---

## 1. Firestore Security Principles
- **Default Deny:** All unspecified document paths return `allow read, write: if false;`.
- **Zero Client Financial Writes:** Collections `/paymentLedger`, `/payouts`, `/idempotencyKeys`, `/auditEvents`, `/fraudSignals`, and `/stripeWebhookEvents` are 100% server-only.
- **Role Isolation:** Fans cannot write to creator collections; non-staff cannot read admin logs.
- **Sensitive PII Isolation:** Claimant data in `/rightsHolderReports` is restricted to compliance officers.

---

## 2. Cloud Storage Security Rules & Upload Pipeline
- **Upload Path:** `/users/{uid}/profile/{randomId}.jpg`
- **Size Limit:** Strictly $< 1,000,000$ bytes (1 MB).
- **MIME Inspection:** Validated server-side against magic bytes (`image/jpeg` [FF D8 FF] and `image/png` [89 50 4E 47]).
- **Sanitization:** EXIF and GPS geolocation metadata stripped; images normalized and re-encoded into safe standard WebP/JPEG derivatives.
- **Access Control:** Public read for approved avatars; write restricted to authenticated resource owner.
